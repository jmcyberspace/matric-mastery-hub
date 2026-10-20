ALTER TABLE users ADD COLUMN mfa_pending_at timestamptz;
-- An old unconfirmed setup must be restarted after this migration.
UPDATE users SET mfa_pending=NULL WHERE mfa_secret IS NULL;
CREATE INDEX attempts_expiring_idx ON attempts(deadline) WHERE submitted_at IS NULL;
CREATE INDEX rate_limits_expiring_idx ON rate_limits(expires_at);
CREATE INDEX messages_thread_order_idx ON messages(thread_id,message_no);
