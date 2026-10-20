import { z } from 'zod';
import { id, assert } from './security.js';
import { requireAuth } from './auth.js';
import { uuid, subject, answers } from './validation.js';
export async function accessibleAssessment(db, user, assessmentId) {
  const a = (await db.query(
    'SELECT a.* FROM assessments a WHERE a.id=$1 AND (a.class_id IS NULL OR a.author_id=$2 OR $3=true OR EXISTS(SELECT 1 FROM memberships m WHERE m.class_id=a.class_id AND m.user_id=$2))',
    [assessmentId, user.id, user.role === 'admin'])).rows[0];
  assert(a, 404, 'Assessment not found.');
  return a;
}
function validateAnswers(input, questions) {
  answers.parse(input);
  const validIds = new Set(questions.map(q => q.id));
  assert(Object.keys(input).every(key => validIds.has(key)), 400, 'An answer does not belong to this assessment.');
}
export async function finaliseAttempt(db, userId, attemptId, suppliedAnswers) {
  return db.transaction(async tx => {
    const attempt = (await tx.query('SELECT * FROM attempts WHERE id=$1 AND user_id=$2 FOR UPDATE', [attemptId, userId])).rows[0];
    assert(attempt, 404, 'Attempt not found.');
    if (attempt.submitted_at) return attempt;
    const questions = (await tx.query('SELECT * FROM questions WHERE assessment_id=$1 ORDER BY position', [attempt.assessment_id])).rows;
    // After the deadline, only previously saved answers can be marked.
    const expired = (await tx.query('SELECT deadline<=clock_timestamp() AS expired FROM attempts WHERE id=$1', [attemptId])).rows[0].expired;
    const selected = expired || suppliedAnswers === undefined ? attempt.answers : suppliedAnswers;
    validateAnswers(selected, questions);
    const score = questions.reduce((sum, q) => sum + (selected[q.id] === q.correct_index ? 1 : 0), 0);
    return (await tx.query('UPDATE attempts SET answers=$1,score=$2,total=$3,submitted_at=now() WHERE id=$4 RETURNING *',
      [JSON.stringify(selected), score, questions.length, attemptId])).rows[0];
  });
}
export async function finaliseExpiredAttempts(db) {
  const rows = (await db.query('SELECT id,user_id FROM attempts WHERE submitted_at IS NULL AND deadline<=now() ORDER BY deadline LIMIT 100')).rows;
  for (const row of rows) await finaliseAttempt(db, row.user_id, row.id);
  return rows.length;
}
export function registerLearning(app, db) {
  app.get('/api/overview', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const [results, focus, plans, current, stats, subjects] = await Promise.all([
      db.query('SELECT a.id,a.score,a.total,a.submitted_at,s.title,s.subject FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=$1 AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC LIMIT 300', [userId]),
      db.query("SELECT (started_at AT TIME ZONE 'Africa/Johannesburg')::date AS day,sum(seconds)::int AS seconds FROM study_sessions WHERE user_id=$1 AND started_at>now()-interval '7 days' GROUP BY day ORDER BY day", [userId]),
      db.query('SELECT p.*,c.subject,c.name AS class_name FROM plans p JOIN classes c ON c.id=p.class_id WHERE learner_id=$1 ORDER BY completed_at NULLS FIRST,due_date LIMIT 100', [userId]),
      db.query('SELECT * FROM study_sessions WHERE user_id=$1 AND ended_at IS NULL', [userId]),
      db.query('SELECT count(*)::int AS completed,round(avg(100.0*score/nullif(total,0)))::int AS average FROM attempts WHERE user_id=$1 AND submitted_at IS NOT NULL', [userId]),
      db.query('SELECT s.subject,count(*)::int AS completed,round(avg(100.0*a.score/nullif(a.total,0)))::int AS average FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=$1 AND a.submitted_at IS NOT NULL GROUP BY s.subject', [userId]),
    ]);
    res.json({ results: results.rows, stats: stats.rows[0], subjects: subjects.rows, focus: focus.rows, plans: plans.rows, activeFocus: current.rows[0] || null, serverNow: new Date().toISOString() });
  });
  app.get('/api/assessments', requireAuth, async (req, res) => {
    const rows = (await db.query(
      'SELECT a.*,c.name AS class_name,(SELECT count(*)::int FROM questions q WHERE q.assessment_id=a.id) AS question_count,t.id AS attempt_id,t.score,t.total,t.submitted_at,t.deadline FROM assessments a LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN attempts t ON t.assessment_id=a.id AND t.user_id=$1 WHERE a.class_id IS NULL OR a.author_id=$1 OR $2=true OR EXISTS(SELECT 1 FROM memberships m WHERE m.class_id=a.class_id AND m.user_id=$1) ORDER BY a.created_at DESC LIMIT 300',
      [req.user.id, req.user.role === 'admin'])).rows;
    res.json({ assessments: rows });
  });
  app.post('/api/assessments/:id/start', requireAuth, async (req, res) => {
    const assessmentId = uuid.parse(req.params.id);
    const assessment = await accessibleAssessment(db, req.user, assessmentId);
    const attempt = (await db.query(
      "INSERT INTO attempts(id,user_id,assessment_id,deadline) VALUES($1,$2,$3,now()+$4*interval '1 minute') ON CONFLICT(user_id,assessment_id) DO UPDATE SET user_id=excluded.user_id RETURNING *",
      [id(), req.user.id, assessmentId, assessment.duration_minutes])).rows[0];
    res.json({ id: attempt.id });
  });
  app.get('/api/attempts/:id', requireAuth, async (req, res) => {
    const attemptId = uuid.parse(req.params.id);
    let attempt = (await db.query('SELECT *,deadline<=now() AS expired FROM attempts WHERE id=$1 AND user_id=$2', [attemptId, req.user.id])).rows[0];
    assert(attempt, 404, 'Attempt not found.');
    // A removed class membership also removes access to unfinished assigned work.
    const assessment = await accessibleAssessment(db, req.user, attempt.assessment_id);
    if (attempt.expired && !attempt.submitted_at) attempt = await finaliseAttempt(db, req.user.id, attemptId);
    const columns = attempt.submitted_at ? 'id,position,topic,prompt,options,correct_index,explanation' : 'id,position,topic,prompt,options';
    const questions = (await db.query('SELECT ' + columns + ' FROM questions WHERE assessment_id=$1 ORDER BY position', [attempt.assessment_id])).rows;
    res.json({ attempt, assessment, questions, serverNow: new Date().toISOString() });
  });
  app.patch('/api/attempts/:id', requireAuth, async (req, res) => {
    const attemptId = uuid.parse(req.params.id);
    const data = z.object({ answers }).strict().parse(req.body);
    await db.transaction(async tx => {
      const attempt = (await tx.query('SELECT * FROM attempts WHERE id=$1 AND user_id=$2 FOR UPDATE', [attemptId, req.user.id])).rows[0];
      assert(attempt && !attempt.submitted_at, 409, 'This attempt is no longer open.');
      await accessibleAssessment(tx, req.user, attempt.assessment_id);
      const expired = (await tx.query('SELECT deadline<=clock_timestamp() AS expired FROM attempts WHERE id=$1', [attemptId])).rows[0].expired;
      assert(!expired, 409, 'Time is up. Your saved answers will be marked.');
      const questions = (await tx.query('SELECT id FROM questions WHERE assessment_id=$1', [attempt.assessment_id])).rows;
      validateAnswers(data.answers, questions);
      await tx.query('UPDATE attempts SET answers=$1 WHERE id=$2', [JSON.stringify(data.answers), attemptId]);
    });
    res.json({ saved: true });
  });
  app.post('/api/attempts/:id/submit', requireAuth, async (req, res) => {
    const attemptId = uuid.parse(req.params.id);
    const data = z.object({ answers }).strict().parse(req.body);
    const attempt = (await db.query('SELECT assessment_id FROM attempts WHERE id=$1 AND user_id=$2', [attemptId, req.user.id])).rows[0];
    assert(attempt, 404, 'Attempt not found.');
    await accessibleAssessment(db, req.user, attempt.assessment_id);
    const result = await finaliseAttempt(db, req.user.id, attemptId, data.answers);
    res.json({ attempt: result });
  });
  app.post('/api/focus/start', requireAuth, async (req, res) => {
    const data = z.object({ subject }).strict().parse(req.body);
    // Expire abandoned timers. An unattended timer does not count as study time.
    await db.query("UPDATE study_sessions SET ended_at=now(),seconds=0 WHERE user_id=$1 AND ended_at IS NULL AND started_at<now()-interval '4 hours'", [req.user.id]);
    const existing = (await db.query('SELECT * FROM study_sessions WHERE user_id=$1 AND ended_at IS NULL', [req.user.id])).rows[0];
    if (existing) return res.json({ session: existing, serverNow: new Date().toISOString() });
    const session = (await db.query('INSERT INTO study_sessions(id,user_id,subject) VALUES($1,$2,$3) RETURNING *', [id(), req.user.id, data.subject])).rows[0];
    res.status(201).json({ session, serverNow: new Date().toISOString() });
  });
  app.post('/api/focus/:id/stop', requireAuth, async (req, res) => {
    const session = (await db.query(
      "UPDATE study_sessions SET seconds=CASE WHEN started_at<now()-interval '4 hours' THEN 0 ELSE least(14400,greatest(0,extract(epoch FROM now()-started_at)::int)) END,ended_at=now() WHERE id=$1 AND user_id=$2 AND ended_at IS NULL RETURNING *",
      [uuid.parse(req.params.id), req.user.id])).rows[0];
    if (!session) {
      const existing = (await db.query('SELECT * FROM study_sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])).rows[0];
      assert(existing, 404, 'Study session not found.');
      return res.json({ session: existing });
    }
    res.json({ session });
  });
  app.patch('/api/plans/:id', requireAuth, async (req, res) => {
    const data = z.object({ completed: z.boolean() }).strict().parse(req.body);
    const plan = (await db.query('UPDATE plans SET completed_at=CASE WHEN $1 THEN now() ELSE NULL END WHERE id=$2 AND learner_id=$3 RETURNING *',
      [data.completed, uuid.parse(req.params.id), req.user.id])).rows[0];
    assert(plan, 404, 'Study plan not found.');
    res.json({ plan });
  });
}
