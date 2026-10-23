CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND length(email) <= 254),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','teacher','admin')),
  grade smallint NOT NULL DEFAULT 12 CHECK (grade IN (11,12)),
  language text NOT NULL DEFAULT 'English' CHECK (language IN ('English','Afrikaans','Setswana')),
  enabled boolean NOT NULL DEFAULT true,
  mfa_secret text,
  mfa_pending text,
  mfa_counter bigint NOT NULL DEFAULT -1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE classes (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  school text NOT NULL DEFAULT '' CHECK (length(school) <= 120),
  subject text NOT NULL CHECK (subject IN ('maths','physics','life-sci','english')),
  grade smallint NOT NULL CHECK (grade IN (11,12)),
  join_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX classes_teacher_idx ON classes(teacher_id);
CREATE TABLE memberships (
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id,user_id)
);
CREATE INDEX memberships_user_idx ON memberships(user_id);
CREATE TABLE invitations (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('learner','teacher')),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reset_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE assessments (
  id uuid PRIMARY KEY,
  author_id uuid REFERENCES users(id),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 140),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 1500),
  subject text NOT NULL CHECK (subject IN ('maths','physics','life-sci','english')),
  grade smallint NOT NULL CHECK (grade IN (11,12)),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 180),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessments_class_idx ON assessments(class_id);
CREATE TABLE questions (
  id uuid PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  position integer NOT NULL,
  topic text NOT NULL CHECK (length(topic) BETWEEN 1 AND 100),
  prompt text NOT NULL CHECK (length(prompt) BETWEEN 3 AND 3000),
  options jsonb NOT NULL CHECK (jsonb_typeof(options)='array' AND jsonb_array_length(options)=4),
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation text NOT NULL CHECK (length(explanation) BETWEEN 3 AND 3000),
  UNIQUE (assessment_id,position)
);
CREATE TABLE attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  deadline timestamptz NOT NULL,
  submitted_at timestamptz,
  score integer,
  total integer,
  UNIQUE(user_id,assessment_id),
  CHECK (score IS NULL OR (score >= 0 AND total > 0 AND score <= total))
);
CREATE INDEX attempts_user_date_idx ON attempts(user_id,submitted_at DESC);
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (subject IN ('maths','physics','life-sci','english')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  seconds integer NOT NULL DEFAULT 0 CHECK (seconds BETWEEN 0 AND 14400)
);
CREATE UNIQUE INDEX one_active_study_session ON study_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX study_sessions_user_date_idx ON study_sessions(user_id,started_at DESC);
CREATE TABLE plans (
  id uuid PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 140),
  notes text NOT NULL CHECK (length(notes) <= 3000),
  due_date date NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plans_learner_idx ON plans(learner_id,due_date);
CREATE TABLE threads (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (subject IN ('maths','physics','life-sci','english')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX threads_user_idx ON threads(user_id,updated_at DESC);
CREATE TABLE messages (
  id uuid PRIMARY KEY,
  message_no bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 12000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_thread_idx ON messages(thread_id,created_at);
CREATE TABLE ai_requests (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','complete','failed')),
  input_hash text NOT NULL,
  response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,request_id)
);
CREATE UNIQUE INDEX one_pending_ai_request ON ai_requests(thread_id) WHERE status='pending';
CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_date_idx ON audit_events(created_at DESC);
