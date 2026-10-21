# Test Matric Mastery on your PC

Run the built React app, Node API and a real PostgreSQL 17 database on your own computer. You do not need a VPS, public domain, Vercel or Supabase. The Docker profile binds the app to your computer's loopback interface and keeps local records in its own database volume.

## 1. Get the project

Use Node.js **24** and Docker Desktop with **Linux containers** running. The launcher uses Node's built-in modules; Docker installs the app's locked dependencies during the build. You do not need to install PostgreSQL or run `npm install` on Windows.

Download the [local-testing branch ZIP](https://github.com/jmcyberspace/matric-mastery-hub/archive/refs/heads/codex/vps-production-upgrade.zip), extract it, and open PowerShell in the extracted folder containing `package.json`. Do not run commands inside the ZIP viewer.

If you prefer Git, use:

```powershell
git clone --branch codex/vps-production-upgrade https://github.com/jmcyberspace/matric-mastery-hub.git
cd matric-mastery-hub
```

For an existing checkout of this branch, use `git pull --ff-only` to get the update. Keep your existing `.env.local` file when updating.

## 2. Start the app

```powershell
npm run local
```

The first run downloads images and dependencies, so it needs internet access and takes longer. It generates three independent local secrets, builds the app, starts PostgreSQL, applies migrations and loads eight short foundation assessments. It creates no user accounts or sample marks. Later runs reuse the database and apply any new migrations.

Wait for `Ready at http://localhost:3010`. Open that exact address in your browser; using `127.0.0.1` in the address bar will not match the configured request origin.

## 3. Create your administrator

Run this once, using your own chosen sign-in email and name, or the local test identity below:

```powershell
npm run local:admin -- --email admin@example.test --name "Local Administrator"
```

Enter a password of at least 12 characters twice. Input is hidden; there is no default password. Sign in at **http://localhost:3010**. At first sign-in, add the displayed setup key to an authenticator as a time-based, six-digit account and enter its current code. Administrator and teacher MFA remains required in this local profile.

Email delivery is not required for account creation. The example address is only a local sign-in identifier. Invitation links are displayed in the app for you to copy.

## 4. Try a complete learning workflow

1. As administrator, open **Classes**, create a test class and use **Invite someone** to create a learner invitation for `learner@example.test`. Select that class.
2. Copy the private invitation link into an incognito/private browser window on the same PC. Create the learner account and accept the privacy notice. Keep the administrator in your original window.
3. As administrator, publish a short assessment for the class. As learner, open it, answer a question, refresh to check autosave, finish and review the result. Check the class report in the administrator window.
4. Try a foundation assessment, a study plan, a focus session, CSV export and Print / Save as PDF. Resize the browser to inspect the narrow layout.
5. Stop and restart the app using the commands below, then confirm your accounts and assessment records remain.

For teacher-role checks, create a teacher invitation as administrator, choose **No class**, and open it in a separate browser session. That teacher can create their own class and invite learners.

## Everyday commands

Run these from the same project folder:

| Command | Result |
| --- | --- |
| `npm run local` | Build/start the app and apply pending migrations; preserve existing records |
| `npm run local:check` | Check the host port, database health, login page, anonymous access restrictions and request-origin protection |
| `npm run local:logs` | Show the latest app and database logs |
| `npm run local:stop` | Stop both services without deleting data |
| `npm run local:admin -- --email admin@example.test --name "Local Administrator"` | Create a new administrator; use once per email address |

The check does not automate a browser or verify email delivery and AI access. Complete the walkthrough in your browser as well.

## Local settings and optional services

The launcher creates an ignored `.env.local` file. It leaves production `.env` settings alone. Keep `.env.local` with your local database: its passwords and encryption key are needed to use existing accounts and authenticators. Do not replace those three secrets while retaining the database. If the file is missing but the database volume exists, the launcher stops and asks you to restore the file.

You can change `LOCAL_PORT=3010` if another app occupies the port, then run `npm run local` and open the new printed URL. Old invitation links use the old port; create fresh invitations if needed.

The AI tutor and password-reset email are optional. To test them, enter your own provider settings in `.env.local` and run `npm run local` again:

| Local setting | Purpose |
| --- | --- |
| `LOCAL_ANTHROPIC_API_KEY`, `LOCAL_ANTHROPIC_MODEL` | Both required for live tutor replies; your provider account is billed for usage |
| `LOCAL_SMTP_HOST`, `LOCAL_SMTP_PORT`, `LOCAL_MAIL_FROM` | Password-reset delivery; use port 587 with STARTTLS or port 465 with implicit TLS |
| `LOCAL_SMTP_USER`, `LOCAL_SMTP_PASSWORD` | Both required when your SMTP provider uses authentication |

Use single quotes around values containing dollar signs, hashes or spaces. Keep credentials out of Git and screenshots. With these settings blank, accounts, classes, assessments, reports and study tools still work. Live AI and mail require internet access.

This profile uses local HTTP and development cookie/header settings: cookies are not marked Secure, and production CSP/HSTS headers are disabled. Session checks, CSRF/origin protection, roles and staff MFA remain active. It is a local testing configuration. Use the separate [HTTPS deployment guide](DEPLOYMENT.md) for public hosting.

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| Docker is unavailable or uses Windows containers | Start Docker Desktop, switch to Linux containers, wait for its engine to be ready and retry |
| `npm.ps1` cannot run because scripts are disabled | Use `npm.cmd` instead of `npm` in the commands above, or open Command Prompt |
| Node version error | Use Node.js 24 and reopen the terminal |
| Port 3010 is already allocated | Change `LOCAL_PORT` in `.env.local` and run `npm run local` again |
| Page opens but login reports a disallowed origin | Open the exact `http://localhost:PORT` printed by the launcher |
| Administrator creation needs an interactive terminal | Run it directly in PowerShell or Command Prompt; do not pipe the password into it |
| Administrator email already exists | Sign in with the account you already created |
| Authenticator code is rejected | Check your PC and phone clocks; wait for the next code if the previous one was already used |
| Database authentication fails or `.env.local` is missing | Restore the original local settings file; initialization credentials do not rotate an existing database password |
| Container exits | Run `npm run local:logs` and inspect the startup error before retrying |

Do not delete the Docker volume to troubleshoot a connection problem. The normal stop command retains your data. Keep both the volume and its matching `.env.local` file until you intentionally retire this local test installation.
