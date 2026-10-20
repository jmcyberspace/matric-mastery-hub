import { createHash } from 'node:crypto';
import { createDatabase } from '../server/db.js';
import { practiceSets } from '../db/practice-content.js';
const stableId = input => {
  const h = createHash('sha256').update('matric-mastery-v2:' + input).digest('hex');
  return h.slice(0,8) + '-' + h.slice(8,12) + '-4' + h.slice(13,16) + '-a' + h.slice(17,20) + '-' + h.slice(20,32);
};
export async function seed(db) {
  await db.transaction(async tx => {
    for (const grade of [11,12]) for (const set of practiceSets) {
      const assessmentId = stableId(set.subject + ':' + grade);
      const existing = (await tx.query('SELECT id FROM assessments WHERE id=$1', [assessmentId])).rows[0];
      if (existing) continue; // Never silently change published answers or existing results.
      await tx.query('INSERT INTO assessments(id,title,description,subject,grade,duration_minutes) VALUES($1,$2,$3,$4,$5,20)',
        [assessmentId, set.title, set.description, set.subject, grade]);
      for (const [index, q] of set.questions.entries()) await tx.query(
        'INSERT INTO questions(id,assessment_id,position,topic,prompt,options,correct_index,explanation) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [stableId(assessmentId + ':' + index), assessmentId, index, q[0], q[1], JSON.stringify(q[2]), q[3], q[4]]);
    }
  });
}
if (process.argv[1]?.endsWith('/scripts/seed.js')) {
  const db = createDatabase(process.env.DATABASE_URL);
  try { await seed(db); console.log('Foundation practice is ready. No learner accounts or sample scores were created.'); }
  finally { await db.close(); }
}
