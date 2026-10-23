# Matric Mastery Hub

A self-hosted learning platform for Grade 11–12 learners and their teachers, operated by JM CYBER SPACE. React builds the interface; Node.js serves the application and API; PostgreSQL stores accounts and learning records. Docker Compose runs the services behind the VPS's existing Nginx installation.

This branch replaces the original interactive demonstration. It contains working application code, not a completed live deployment. Follow [VPS deployment](docs/DEPLOYMENT.md) and complete the launch checks before inviting real learners.

## Working features

- Invitation-based learner and teacher accounts; administrator creation from an interactive terminal.
- Password hashing, server sessions, CSRF protection, password changes, optional SMTP recovery, and authenticator MFA. Production requires MFA for staff.
- Classes, private invitations, rotating class codes, teacher-owned reports, membership removal and account disabling.
- Teacher-authored multiple-choice assessments, autosaved answers, server deadlines and marking, answer explanations after submission, printable worksheets and memoranda.
- Saved study sessions, actual assessment averages, teacher study plans and learner completion.
- A topic-led learner home and an Anthropic-backed tutor with **Explain simply**, **Show an example**, **Give me a hint** and **Quiz me** modes, saved topic conversations, quotas, request deduplication and selectable English, Afrikaans or Setswana replies.
- Eight original topic guides with worked examples and repeatable two-question checks. Checks are marked on the server, saved privately and can be shared with the tutor by the learner for a reasoning review.
- Separate teacher and administrator homes with real class totals and service status, plus readable phone navigation and responsive learning screens.
- CSV class reports, browser Print / Save as PDF, progress messages that teachers can copy, personal data export and learner account deletion.
- Database migrations, encrypted backup tooling, isolated restore drills, health checks and CI.

There is no Vercel or Supabase dependency. AI and email are external services only when configured; learning records and authentication live in PostgreSQL on your VPS.

## Content and boundaries

The guided-learning catalog contains eight foundation topics across Mathematics, Physical Sciences, Life Sciences and English FAL. Each has a guide, a worked example and four original questions, presented as two alternating checks. These shared Grade 11–12 foundations require subject-teacher review before school use. A saved check score describes that question set; it is not a mastery rating or an exam mark. Guides and checks work without an AI connection. Live AI adds explanations and conversational feedback only when the provider key and model are configured.

The optional seed creates eight short foundation assessments: six questions per subject for each grade, using a shared foundation question set. It does **not** create demonstration accounts, marks or progress. This is a starter content library, not a complete CAPS course or a collection of official NSC examinations. Teachers must review suitability and add their own content. Official past papers are linked to the DBE library.

Each assessment currently permits one recorded attempt and one mark per question. Published questions are immutable; create a new assessment for corrections or repeat practice. Free-response marking, document uploads, video lessons, payments and proctoring are not implemented. The tutor is not a marker and cannot access class records or execute tools. The UI is English; its language setting changes tutor replies only.

Teacher reports cover assessments assigned to the selected class. A low average is a transparent check-in flag, never a prediction of a matric pass. Focus minutes are elapsed time between Start and Finish, not proof of attention. Parent updates are copied for human review; the app does not automatically send WhatsApp/SMS or reminders.

## Start here

- [Test on your Windows PC with Docker Desktop](docs/LOCAL_TESTING.md)
- [Deploy on the VPS, configure HTTPS and create the administrator](docs/DEPLOYMENT.md)
- [Back up, restore, upgrade and recover accounts](docs/OPERATIONS.md)
- [Security design and verification limits](SECURITY.md)
- [Review topic content and evaluate the AI learning flow](docs/AI_LEARNING.md)

## Run locally

With Node.js 24 installed and Docker Desktop running Linux containers, open a terminal in this project folder:

```sh
npm run local
npm run local:admin -- --email admin@example.test --name "Local Administrator"
```

Choose your administrator password when prompted, then open **http://localhost:3010** and complete authenticator setup. The launcher builds the app, generates local credentials, prepares PostgreSQL and loads the foundation practice questions. It needs no host `npm install`, separate PostgreSQL installation, domain or VPS. The first build needs internet access.

Run `npm run local:check` to check the running app and `npm run local:stop` to stop it while preserving your records. Start again with `npm run local`. See [Local testing](docs/LOCAL_TESTING.md) for Windows instructions, a walkthrough and troubleshooting.

## Development and checks

Use Node.js 24 and a dedicated PostgreSQL development database. The locked dependency versions are in `package-lock.json`.

```sh
npm ci --ignore-scripts
npm test
npm run build
```

The local server tests use PGlite's embedded PostgreSQL engine and synthetic accounts. UI tests exercise React DOM workflows with Happy DOM. CI also builds the Docker image, applies migrations to PostgreSQL 17, runs the same server tests as the restricted runtime role, and performs an HTTP smoke check. UI component tests are not a substitute for mobile/desktop browser acceptance testing.

For local interactive development, put development-only credentials in the ignored `.env` file:

```dotenv
NODE_ENV=development
APP_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://YOUR_DEV_USER:YOUR_DEV_PASSWORD@127.0.0.1:5432/matric_development
APP_ENCRYPTION_KEY=YOUR_64_CHARACTER_RANDOM_HEX_KEY
```

Generate the encryption key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Run `npm run db:migrate` with the development schema owner, optionally `npm run db:seed`, then `npm run admin:create -- --email you@example.org --name 'Your name'`. Run `npm run dev:server` and `npm run dev` in separate terminals; open the exact origin configured above. Development disables secure cookies and compulsory staff MFA, so never expose this mode publicly.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/` | Responsive React application, split into lazily loaded pages |
| `server/` | Authentication, authorization, learning, teaching and tutor APIs |
| `db/migrations/` | Versioned PostgreSQL schema migrations with checksum checks |
| `db/practice-content.js` | Original foundation practice questions |
| `db/topic-content.js` | Original guides, worked examples and private check answer keys |
| `scripts/` | Deployment setup, migration, account recovery and backup utilities |
| `deploy/` | Nginx, PostgreSQL initialization and backup timer examples |
| `tests/` | Server integration, security, configuration and UI workflow tests |

The runtime app uses `matric_app`, which cannot create tables or read migration metadata. Operational commands use `matric_owner`. PostgreSQL has no published port in the normal Compose file; Node binds to the host's loopback port 3010. Keep `compose.ci.yaml` confined to disposable test environments.
