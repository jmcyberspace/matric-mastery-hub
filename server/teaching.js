import { z } from 'zod';
import { id, token, digest, assert, rateLimit, audit } from './security.js';
import { requireAuth, staff, admin } from './auth.js';
import { uuid, subject, assessment, email } from './validation.js';
export async function ownClass(db, user, classId) {
  const row = (await db.query('SELECT * FROM classes WHERE id=$1 AND (teacher_id=$2 OR $3=true)', [classId, user.id, user.role === 'admin'])).rows[0];
  assert(row, 404, 'Class not found.');
  return row;
}
export function registerTeaching(app, db, config) {
  app.get('/api/classes', requireAuth, async (req, res) => {
    const rows = (await db.query(
      'SELECT c.*,(SELECT count(*)::int FROM memberships m WHERE m.class_id=c.id) AS learner_count,u.name AS teacher_name FROM classes c JOIN users u ON u.id=c.teacher_id WHERE c.teacher_id=$1 OR $2=true OR EXISTS(SELECT 1 FROM memberships m WHERE m.class_id=c.id AND m.user_id=$1) ORDER BY c.created_at DESC LIMIT 200',
      [req.user.id, req.user.role === 'admin'])).rows;
    res.json({ classes: rows.map(row => req.user.role === 'learner' ? { ...row, join_code: undefined } : row) });
  });
  app.post('/api/classes', requireAuth, staff, async (req, res) => {
    const data = z.object({ name: z.string().trim().min(2).max(100), school: z.string().trim().max(120).default(''),
      subject, grade: z.number().int().min(11).max(12) }).strict().parse(req.body);
    const row = (await db.query('INSERT INTO classes(id,teacher_id,name,school,subject,grade,join_code) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [id(), req.user.id, data.name, data.school, data.subject, data.grade, token().slice(0, 12)])).rows[0];
    await audit(db, req.user.id, 'class.created', row.id);
    res.status(201).json({ class: row });
  });
  app.post('/api/classes/join', requireAuth, async (req, res) => {
    assert(req.user.role === 'learner', 403, 'Only learner accounts can join a class.');
    await rateLimit(db, 'join-class:' + req.user.id, 5, 900);
    const data = z.object({ code: z.string().trim().min(8).max(20) }).strict().parse(req.body);
    const row = (await db.query('SELECT c.id FROM classes c JOIN users u ON u.id=c.teacher_id WHERE c.join_code=$1 AND u.enabled=true', [data.code])).rows[0];
    assert(row, 404, 'That class code is not valid.');
    await db.query('INSERT INTO memberships(class_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [row.id, req.user.id]);
    res.json({ ok: true });
  });
  app.post('/api/classes/:id/rotate-code', requireAuth, staff, async (req, res) => {
    await ownClass(db, req.user, uuid.parse(req.params.id));
    const row = (await db.query('UPDATE classes SET join_code=$1 WHERE id=$2 RETURNING join_code', [token().slice(0, 12), req.params.id])).rows[0];
    res.json(row);
  });
  app.get('/api/classes/:id/report', requireAuth, staff, async (req, res) => {
    const classId = uuid.parse(req.params.id);
    const classroom = await ownClass(db, req.user, classId);
    const learners = (await db.query(
      'SELECT u.id,u.name,u.grade,count(t.id)::int AS completed,round(avg(100.0*t.score/nullif(t.total,0)))::int AS average,max(t.submitted_at) AS last_submission FROM memberships m JOIN users u ON u.id=m.user_id LEFT JOIN attempts t ON t.user_id=u.id AND t.submitted_at IS NOT NULL AND t.assessment_id IN(SELECT id FROM assessments WHERE class_id=$1) WHERE m.class_id=$1 GROUP BY u.id,u.name,u.grade ORDER BY u.name',
      [classId])).rows;
    const results = (await db.query(
      'SELECT t.id,t.user_id,u.name,t.score,t.total,t.submitted_at,a.title,a.subject FROM attempts t JOIN users u ON u.id=t.user_id JOIN assessments a ON a.id=t.assessment_id JOIN memberships m ON m.user_id=t.user_id AND m.class_id=a.class_id WHERE a.class_id=$1 AND t.submitted_at IS NOT NULL ORDER BY t.submitted_at DESC LIMIT 1000', [classId])).rows;
    const plans = (await db.query('SELECT p.*,u.name AS learner_name FROM plans p JOIN users u ON u.id=p.learner_id WHERE class_id=$1 ORDER BY due_date DESC LIMIT 200', [classId])).rows;
    res.json({ classroom, learners, results, plans, generatedAt: new Date().toISOString() });
  });
  app.delete('/api/classes/:id/members/:userId', requireAuth, staff, async (req, res) => {
    await ownClass(db, req.user, uuid.parse(req.params.id));
    await db.query('DELETE FROM memberships WHERE class_id=$1 AND user_id=$2', [req.params.id, uuid.parse(req.params.userId)]);
    await audit(db, req.user.id, 'class.member-removed', req.params.userId);
    res.json({ ok: true });
  });
  app.post('/api/invitations', requireAuth, staff, async (req, res) => {
    await rateLimit(db, 'invite-create:' + req.user.id, 40, 3600);
    const data = z.object({ email, role: z.enum(['learner','teacher']), classId: uuid.nullable() }).strict().parse(req.body);
    assert(data.role !== 'teacher' || req.user.role === 'admin', 403, 'Only administrators may invite teachers.');
    assert(req.user.role === 'admin' || data.classId, 400, 'Choose a class for the learner.');
    if (data.classId) await ownClass(db, req.user, data.classId);
    assert(data.role === 'learner' || !data.classId, 400, 'Teacher invitations must not include a learner class.');
    const existing = (await db.query('SELECT id FROM users WHERE email=$1', [data.email])).rows[0];
    assert(!existing, 409, 'This account already exists. Give the learner your class code.');
    const raw = token();
    await db.query("INSERT INTO invitations(token_hash,email,role,class_id,created_by,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '7 days')",
      [digest(raw), data.email, data.role, data.classId, req.user.id]);
    await audit(db, req.user.id, 'invitation.created', data.role);
    res.status(201).json({ url: config.origin + '/invite#token=' + raw, expiresInDays: 7 });
  });
  app.post('/api/assessments', requireAuth, staff, async (req, res) => {
    const data = assessment.parse(req.body);
    if (data.classId) {
      const classroom = await ownClass(db, req.user, data.classId);
      assert(classroom.subject === data.subject && classroom.grade === data.grade, 400, 'Subject and grade must match the selected class.');
    } else assert(req.user.role === 'admin', 403, 'Only an administrator can publish to the shared library.');
    const assessmentId = id();
    await db.transaction(async tx => {
      await tx.query('INSERT INTO assessments(id,author_id,class_id,title,description,subject,grade,duration_minutes) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [assessmentId, req.user.id, data.classId, data.title, data.description, data.subject, data.grade, data.durationMinutes]);
      for (const [index, q] of data.questions.entries()) await tx.query(
        'INSERT INTO questions(id,assessment_id,position,topic,prompt,options,correct_index,explanation) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [id(), assessmentId, index, q.topic, q.prompt, JSON.stringify(q.options), q.correctIndex, q.explanation]);
      await audit(tx, req.user.id, 'assessment.published', assessmentId);
    });
    res.status(201).json({ id: assessmentId });
  });
  app.get('/api/assessments/:id/memo', requireAuth, staff, async (req, res) => {
    const a = (await db.query('SELECT * FROM assessments WHERE id=$1 AND (author_id=$2 OR $3=true)', [uuid.parse(req.params.id), req.user.id, req.user.role === 'admin'])).rows[0];
    assert(a, 404, 'Assessment not found.');
    const questions = (await db.query('SELECT * FROM questions WHERE assessment_id=$1 ORDER BY position', [a.id])).rows;
    res.json({ assessment: a, questions });
  });
  app.post('/api/plans', requireAuth, staff, async (req, res) => {
    const data = z.object({ classId: uuid, learnerId: uuid, title: z.string().trim().min(3).max(140),
      notes: z.string().trim().max(3000), dueDate: z.iso.date() }).strict().parse(req.body);
    await ownClass(db, req.user, data.classId);
    const member = (await db.query('SELECT 1 FROM memberships WHERE class_id=$1 AND user_id=$2', [data.classId, data.learnerId])).rows[0];
    assert(member, 404, 'Learner not found in this class.');
    const plan = (await db.query('INSERT INTO plans(id,class_id,learner_id,teacher_id,title,notes,due_date) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [id(), data.classId, data.learnerId, req.user.id, data.title, data.notes, data.dueDate])).rows[0];
    res.status(201).json({ plan });
  });
  app.get('/api/admin/users', requireAuth, admin, async (_req, res) => {
    res.json({ users: (await db.query('SELECT id,name,email,role,enabled,created_at,(mfa_secret IS NOT NULL) AS mfa_enabled FROM users ORDER BY created_at DESC LIMIT 500')).rows });
  });
  app.patch('/api/admin/users/:id', requireAuth, admin, async (req, res) => {
    const userId = uuid.parse(req.params.id), data = z.object({ enabled: z.boolean() }).strict().parse(req.body);
    assert(userId !== req.user.id, 400, 'You cannot disable your own account.');
    await db.transaction(async tx => {
      const user = (await tx.query('UPDATE users SET enabled=$1 WHERE id=$2 AND role<>\'admin\' RETURNING id', [data.enabled, userId])).rows[0];
      assert(user, 404, 'A manageable account was not found.');
      if (!data.enabled) await tx.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
      await audit(tx, req.user.id, data.enabled ? 'account.enabled' : 'account.disabled', userId);
    });
    res.json({ ok: true });
  });
  app.get('/api/admin/audit', requireAuth, admin, async (_req, res) => res.json({
    events: (await db.query('SELECT a.*,u.name AS actor_name FROM audit_events a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100')).rows,
  }));
}
