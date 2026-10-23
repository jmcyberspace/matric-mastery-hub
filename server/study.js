import { z } from 'zod';
import { requireAuth, staff } from './auth.js';
import { assert, digest, id, rateLimit } from './security.js';
import { uuid } from './validation.js';
import { topics, topicById, publicTopic } from '../db/topic-content.js';

export function registerStudy(app, db) {
  app.get('/api/topics', requireAuth, async (req, res) => {
    const progress = (await db.query('SELECT DISTINCT ON(topic_id) topic_id,score,total,submitted_at FROM topic_checks WHERE user_id=$1 ORDER BY topic_id,submitted_at DESC,id DESC', [req.user.id])).rows;
    res.json({ topics: topics.filter(t => t.grades.includes(req.user.grade)).map(({ guide, ...topic }) => ({ ...publicTopic(topic), lastCheck: progress.find(p => p.topic_id === topic.id) || null })) });
  });
  app.get('/api/topics/:topicId', requireAuth, async (req, res) => {
    const topic = topicById(req.params.topicId);
    assert(topic && topic.grades.includes(req.user.grade), 404, 'Topic not found.');
    const latest = (await db.query('SELECT id,score,total,feedback,submitted_at FROM topic_checks WHERE user_id=$1 AND topic_id=$2 ORDER BY submitted_at DESC,id DESC LIMIT 1', [req.user.id, topic.id])).rows[0] || null;
    const count = (await db.query('SELECT count(*)::int AS n FROM topic_checks WHERE user_id=$1 AND topic_id=$2', [req.user.id, topic.id])).rows[0].n;
    const offset = (count % 2) * 2;
    res.json({ topic: publicTopic(topic), questions: topic.questions.slice(offset, offset + 2).map(({ answer, explanation, ...q }) => q), lastCheck: latest });
  });
  app.post('/api/topics/:topicId/check', requireAuth, async (req, res) => {
    const topic = topicById(req.params.topicId);
    assert(topic && topic.grades.includes(req.user.grade), 404, 'Topic not found.');
    const data = z.object({ requestId: uuid, version: z.number().int(), answers: z.array(z.object({ questionId: z.string().max(60), answer: z.number().int().min(0).max(3) }).strict()).length(2) }).strict().parse(req.body);
    assert(data.version === topic.version, 409, 'This topic has been updated. Reload it before checking your answers.');
    assert(new Set(data.answers.map(a => a.questionId)).size === 2, 400, 'Answer two different questions.');
    const sorted = [...data.answers].sort((a, b) => a.questionId.localeCompare(b.questionId));
    const hash = digest(JSON.stringify({ topic: topic.id, version: data.version, answers: sorted }));
    const feedback = data.answers.map(a => {
      const q = topic.questions.find(q => q.id === a.questionId);
      assert(q, 400, 'A question does not belong to this topic.');
      return { questionId: q.id, prompt: q.prompt, selected: q.options[a.answer], correctAnswer: q.options[q.answer], correct: a.answer === q.answer, explanation: q.explanation };
    });
    const result = await db.transaction(async tx => {
      let previous = (await tx.query('SELECT * FROM topic_checks WHERE user_id=$1 AND request_id=$2', [req.user.id, data.requestId])).rows[0];
      if (!previous) {
        await rateLimit(tx, 'topic-check:' + req.user.id, 30, 3600);
        await tx.query('INSERT INTO topic_checks(id,user_id,request_id,topic_id,content_version,input_hash,score,feedback) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(user_id,request_id) DO NOTHING',
          [id(), req.user.id, data.requestId, topic.id, data.version, hash, feedback.filter(f => f.correct).length, JSON.stringify(feedback)]);
        previous = (await tx.query('SELECT * FROM topic_checks WHERE user_id=$1 AND request_id=$2', [req.user.id, data.requestId])).rows[0];
      }
      assert(previous.input_hash === hash, 409, 'This check identifier was already used for different answers.');
      return { id: previous.id, score: previous.score, total: previous.total, feedback: previous.feedback, submitted_at: previous.submitted_at };
    });
    res.json({ check: result });
  });
  app.get('/api/workspace', requireAuth, staff, async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    const values = [req.user.id, isAdmin];
    const stats = (await db.query(`SELECT
      (SELECT count(*)::int FROM classes WHERE teacher_id=$1 OR $2=true) AS classes,
      (SELECT count(DISTINCT m.user_id)::int FROM memberships m JOIN classes c ON c.id=m.class_id WHERE c.teacher_id=$1 OR $2=true) AS learners,
      (SELECT count(*)::int FROM assessments WHERE author_id=$1 OR $2=true) AS assessments,
      (SELECT count(*)::int FROM invitations WHERE (created_by=$1 OR $2=true) AND used_at IS NULL AND expires_at>now()) AS invitations`, values)).rows[0];
    const classes = (await db.query('SELECT c.id,c.name,c.subject,c.grade,count(m.user_id)::int AS learner_count FROM classes c LEFT JOIN memberships m ON m.class_id=c.id WHERE c.teacher_id=$1 OR $2=true GROUP BY c.id ORDER BY c.created_at DESC LIMIT 6', values)).rows;
    const platform = isAdmin ? (await db.query(`SELECT
      (SELECT count(*)::int FROM users WHERE enabled=true) AS active_accounts,
      (SELECT count(*)::int FROM users WHERE enabled=true AND role<>'learner' AND mfa_secret IS NULL) AS staff_without_mfa,
      (SELECT count(*)::int FROM ai_requests WHERE status='complete' AND created_at>now()-interval '24 hours') AS ai_replies`)).rows[0] : null;
    res.json({ stats, classes, platform });
  });
}
