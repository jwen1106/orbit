# Orbit by Oaklin

Operational maturity diagnostic platform. Orbit captures team perspectives, uses AI to synthesise findings, and generates prioritised action plans benchmarked against industry peers.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Firebase Firestore (`orbit-oaklin`, London `europe-west2`) |
| Auth | Firebase Authentication (email/password) |
| Hosting | Vercel (region: `lhr1`) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Email | Resend |
| Charts | Recharts |

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client SDK config (from Firebase Console → Project Settings → Web app)
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` — Firebase Admin SDK (from Service Account JSON)
- `ANTHROPIC_API_KEY` — Anthropic API key
- `RESEND_API_KEY` — Resend API key
- `EMAIL_FROM` — Sender address (e.g. `Orbit <noreply@orbitbyoaklin.com>`)
- `NEXT_PUBLIC_APP_URL` — Base URL (e.g. `http://localhost:3000` for local)

### 3. Create the first admin user

```bash
node scripts/seed-admin.mjs admin@oaklin.com "Your Name" YourPassword
```

### 4. Seed the question bank

```bash
npm run seed:questions
```

### 5. Seed benchmark data

```bash
npm run seed:benchmarks
```

### 6. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:3000/login` and log in with your admin credentials.

## Test API connections

```bash
npm run test:anthropic   # verify Claude API key
npm run test:firebase    # verify Firebase Admin + Firestore
```

## User roles

| Role | Access |
|---|---|
| `oaklin_admin` | Full admin portal — create orgs, teams, engagements, run AI analysis |
| `team_manager` | Dashboard only — assessment, delta, benchmarks, action plan |
| Team member | Survey only — no account, no dashboard |

## Deployment (Vercel)

1. Connect the GitHub repo to Vercel
2. Add all environment variables from `.env.example` to Vercel project settings
3. Set Serverless Function region to `lhr1` (London) via `vercel.json`
4. Deploy

## Data

- Firebase project: `orbit-oaklin`
- Firestore location: London (`europe-west2`)
- Questions: seeded via `npm run seed:questions`
- Benchmarks: seeded via `npm run seed:benchmarks`
