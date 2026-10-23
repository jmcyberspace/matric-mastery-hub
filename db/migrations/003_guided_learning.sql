ALTER TABLE threads ADD COLUMN topic_id text;
ALTER TABLE ai_requests ADD COLUMN mode text NOT NULL DEFAULT 'explain'
  CHECK (mode IN ('explain','example','hint','check'));
CREATE TABLE topic_checks (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  topic_id text NOT NULL,
  content_version integer NOT NULL,
  input_hash text NOT NULL,
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 2),
  total smallint NOT NULL DEFAULT 2 CHECK (total = 2),
  feedback jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,request_id)
);
CREATE INDEX topic_checks_user_topic_idx ON topic_checks(user_id,topic_id,submitted_at DESC);
