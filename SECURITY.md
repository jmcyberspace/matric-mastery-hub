# Security model

## Boundaries

- The server decides identity and permissions from opaque sessions stored as token hashes. Browser-submitted roles, scores, answer keys or system prompts are rejected by strict schemas.
- Teachers access their own classes; administrators have deliberate platform-wide management access. Learners access their own attempts and conversations and only assigned/shared assessments. Teachers' reports do not include private tutor messages.
- PostgreSQL queries use bound parameters. Migrations run as an operational owner; the runtime role has data access but cannot create schema objects, create roles/databases, or read migration metadata. This is application-level record authorization, not PostgreSQL row-level security.
- Passwords use Argon2id. Authenticator keys use AES-256-GCM with a deployment secret. Tokens are random, stored hashed, and expire. Staff MFA is mandatory in production and prevents code-counter replay. Pending enrollment expires after 15 minutes and is checked under a row lock.
- Every state-changing API request must have the exact configured Origin and JSON content type. Authenticated mutations also need the session CSRF token. No permissive CORS policy is enabled. Production session cookies use `__Host-`, Secure, HttpOnly and SameSite=Strict.
- Helmet supplies CSP, frame restrictions, content-type protection and HSTS. Personal API responses are not cached. React renders user and tutor content as text, not injected HTML. CSV export defuses spreadsheet formulas.
- Authentication, account actions and AI calls have database-backed rate limits; Nginx provides an additional boundary. Nginx must overwrite incoming forwarding headers, and the app must remain reachable only through the intended proxy/loopback port.
- Tutor keys stay server-side. The provider sees a bounded recent conversation, grade, subject and language; the app does not automatically include account name/email. User-entered personal data is still sent if typed into a question. The tutor has no tools, database connection, grading authority or prompt access to answer keys. Prompt rules do not guarantee that all generated advice is correct.
- Repeated completed AI request IDs return the saved response. Ambiguous network retries reuse their ID; confirmed failures can start a new request. This bounds duplicate calls within the app but cannot guarantee exactly-once billing across provider/network failures.
- Password reset, password changes, disabling accounts and MFA enrollment revoke affected sessions. Administrative actions are audited without recording passwords, message bodies or reset/invitation tokens.
- The Docker runtime is non-root, read-only and limited in memory/process count. PostgreSQL has no published host port. The supplied backup script encrypts before writing to disk; live database/storage encryption depends on the VPS's disks and provider configuration.

## Verification

Local tests cover account/role boundaries, class isolation, attempt ownership, hidden memos, deadline enforcement, autosaving, server marking, invitation replay, MFA, token/session revocation, AI quota failure and deduplication, headers, CSV handling and key UI workflows. Local database tests run on PGlite; the separate CI job exercises PostgreSQL 17 and the restricted role with the built container.

Read CI results for the specific commit. A configured workflow is not evidence of a completed run. These checks do not establish browser compatibility, SMTP deliverability, actual AI provider access, public HTTPS configuration, backup custody, load capacity, a penetration-test result or legal compliance. The launch checks and backup drill remain deployment-specific.

## Operator responsibilities

Keep the VPS, Docker, PostgreSQL image and dependencies patched. Protect SSH, Docker administration, the operational database password, the app encryption key and backup identities. Docker administrators and server operators can access the database. Choose offsite backup retention and deletion handling, monitor availability and costs, and verify school authorization and family onboarding before inviting minors.

This release intentionally has no arbitrary file uploads or AI tools. Adding either requires a fresh security review. Protect the deployment branch with review/CI requirements and restrict who can change GitHub Actions and infrastructure settings.

Do not post credentials, private learner data or exploit details in a public issue. Report concerns privately to the platform operator through the contact configured in the app.
