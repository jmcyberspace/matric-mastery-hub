import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createDatabase } from '../server/db.js';
const db = createDatabase(process.env.DATABASE_URL);
try {
  await db.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(731824119)');
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
    for (const file of (await readdir(new URL('../db/migrations/', import.meta.url))).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile(new URL('../db/migrations/' + file, import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = (await tx.query('SELECT checksum FROM schema_migrations WHERE name=$1', [file])).rows[0];
      if (existing) { if (existing.checksum !== checksum) throw new Error('Applied migration was modified: ' + file); continue; }
      await tx.query(sql);
      await tx.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [file, checksum]);
      console.log('Applied ' + file);
    }
    const runtimeRole = (await tx.query("SELECT 1 FROM pg_roles WHERE rolname='matric_app'")).rows.length;
    if (runtimeRole) {
      await tx.query('GRANT USAGE ON SCHEMA public TO matric_app');
      await tx.query('GRANT SELECT,INSERT,UPDATE,DELETE ON users,sessions,rate_limits,classes,memberships,invitations,reset_tokens,assessments,questions,attempts,study_sessions,plans,threads,messages,ai_requests,audit_events TO matric_app');
      await tx.query('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO matric_app');
      await tx.query('REVOKE ALL ON schema_migrations FROM matric_app');
    }
  });
  console.log('Database migrations are current.');
} finally { await db.close(); }
