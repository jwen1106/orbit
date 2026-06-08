import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const VERSION = 'v1';

const questions = [
  // ── PEOPLE & RELATIONSHIPS ──────────────────────────────────────────────
  {
    version: VERSION,
    competency: 'people_relationships',
    role: 'both',
    order: 1,
    text: 'Communication & Collaboration',
    subtext: 'How effectively do team members communicate and share information across the team?',
    criteria: {
      '1': 'No regular communication patterns; information is siloed and sharing is reactive or absent.',
      '2': 'Ad hoc communication with inconsistent meeting cadences and unclear information pathways.',
      '3': 'Regular team communication exists but duplication occurs and channels are inconsistently used.',
      '4': 'Clear communication channels established with regular structured forums and good cross-team visibility.',
      '5': 'Exemplary communication culture with designated forums, daily stand-ups, and consistent organisation-wide visibility.',
    },
  },
  {
    version: VERSION,
    competency: 'people_relationships',
    role: 'manager',
    order: 2,
    text: 'Effective Leadership',
    subtext: 'Leadership expectations and behaviours are clearly defined and consistently modelled.',
    criteria: {
      '1': 'Leadership expectations are undefined; behaviours are inconsistent and rarely modelled.',
      '2': 'Basic expectations exist but are rarely communicated or consistently demonstrated.',
      '3': 'Some documented expectations with inconsistent application across the team.',
      '4': 'Clear leadership expectations with regular reinforcement and visible role modelling.',
      '5': 'Well-defined standards embedded in team culture with continuous leadership development and coaching.',
    },
  },
  {
    version: VERSION,
    competency: 'people_relationships',
    role: 'member',
    order: 2,
    text: 'Team Dynamics & Trust',
    subtext: 'Team members feel psychologically safe to raise issues, share ideas, and challenge constructively.',
    criteria: {
      '1': 'Low trust environment; team members avoid raising concerns or disagreeing openly.',
      '2': 'Trust is inconsistent; some feel safe to contribute but many hold back.',
      '3': 'Generally safe environment but constructive challenge is limited or directed upward only.',
      '4': 'Strong trust with open dialogue and constructive debate encouraged at all levels.',
      '5': 'High-trust culture where all voices are heard, difference is valued, and challenge is welcomed.',
    },
  },
  {
    version: VERSION,
    competency: 'people_relationships',
    role: 'both',
    order: 3,
    text: 'Conflict & Accountability',
    subtext: 'Issues and disagreements are addressed directly and accountability is consistently applied.',
    criteria: {
      '1': 'Conflicts are avoided or escalate without resolution; accountability is absent.',
      '2': 'Conflict is handled reactively and accountability is inconsistently enforced.',
      '3': 'Most conflicts are addressed but resolution processes are informal and inconsistent.',
      '4': 'Clear mechanisms for addressing conflict; accountability is a team norm.',
      '5': 'Proactive conflict resolution with structured accountability frameworks and strong follow-through.',
    },
  },

  // ── GROWTH & IMPACT ─────────────────────────────────────────────────────
  {
    version: VERSION,
    competency: 'growth_impact',
    role: 'both',
    order: 1,
    text: 'Learning & Development',
    subtext: 'How systematically does the team support ongoing learning and skills development?',
    criteria: {
      '1': 'No structured L&D; development is left entirely to individuals with no organisational support.',
      '2': 'Ad hoc training offered reactively; no individual development plans or consistent framework.',
      '3': 'Some structured training available but not aligned to team or individual goals.',
      '4': 'Clear development plans with regular learning opportunities and skill-gap awareness.',
      '5': 'Continuous learning culture with personalised development plans, mentoring, and measurable capability growth.',
    },
  },
  {
    version: VERSION,
    competency: 'growth_impact',
    role: 'both',
    order: 2,
    text: 'Performance Management',
    subtext: 'Individual and team performance is measured, reviewed, and acted upon consistently.',
    criteria: {
      '1': 'No formal performance management; reviews are absent or meaningless.',
      '2': 'Annual reviews only with no ongoing feedback loops or clear performance standards.',
      '3': 'Regular reviews occur but are inconsistently tied to goals or development actions.',
      '4': 'Structured performance cycles with clear goals, regular feedback, and follow-up.',
      '5': 'High-performance culture with continuous feedback, goal alignment, and meaningful recognition.',
    },
  },
  {
    version: VERSION,
    competency: 'growth_impact',
    role: 'both',
    order: 3,
    text: 'Innovation & Continuous Improvement',
    subtext: 'The team actively identifies and implements process improvements and new ideas.',
    criteria: {
      '1': 'No culture of improvement; processes are static and new ideas are dismissed.',
      '2': 'Occasional improvements but no systematic approach or mechanism for idea capture.',
      '3': 'Some process improvement activity but it is sporadic and not embedded in ways of working.',
      '4': 'Regular retrospectives and improvement cycles with visible output and implementation.',
      '5': 'Innovation is embedded in team culture with structured processes, rapid experimentation, and measurable impact.',
    },
  },

  // ── PURPOSE & ALIGNMENT ──────────────────────────────────────────────────
  {
    version: VERSION,
    competency: 'purpose_alignment',
    role: 'both',
    order: 1,
    text: 'Mission & Strategic Clarity',
    subtext: 'Team members understand the organisation\'s direction and how their work contributes to it.',
    criteria: {
      '1': 'Strategic direction is unknown or irrelevant to day-to-day work; no visible connection to mission.',
      '2': 'Some awareness of organisational goals but poor understanding of individual contribution.',
      '3': 'Team understands the strategy at a high level but cannot articulate how their work connects.',
      '4': 'Clear line of sight from individual work to team goals to organisational strategy.',
      '5': 'Team members are energised by organisational purpose and actively use strategy to guide decisions.',
    },
  },
  {
    version: VERSION,
    competency: 'purpose_alignment',
    role: 'both',
    order: 2,
    text: 'Goal Setting & Prioritisation',
    subtext: 'Team goals are clearly defined, regularly reviewed, and prioritised effectively.',
    criteria: {
      '1': 'No clear team goals; prioritisation is reactive and inconsistent.',
      '2': 'Goals exist but are rarely reviewed or used to drive decisions and prioritisation.',
      '3': 'Goals are set but not consistently cascaded or linked to day-to-day work.',
      '4': 'SMART goals with regular check-ins and visible prioritisation frameworks.',
      '5': 'Dynamic goal-setting aligned across the organisation with agile reprioritisation and strong execution.',
    },
  },
  {
    version: VERSION,
    competency: 'purpose_alignment',
    role: 'both',
    order: 3,
    text: 'Values & Organisational Culture',
    subtext: 'The team lives the organisation\'s stated values in how it works day to day.',
    criteria: {
      '1': 'Organisational values are either unknown or not reflected in team behaviour.',
      '2': 'Values are communicated but rarely visible in how the team operates.',
      '3': 'Values are understood and occasionally referenced but inconsistently demonstrated.',
      '4': 'Values actively shape team decisions and behaviour with visible role modelling.',
      '5': 'Values are deeply embedded; team holds itself accountable to them and uses them to resolve ambiguity.',
    },
  },
];

async function seed() {
  console.log(`Seeding ${questions.length} questions (version ${VERSION})…`);
  const batch = db.batch();
  for (const q of questions) {
    const ref = db.collection('questions').doc();
    batch.set(ref, { ...q, isActive: true });
  }
  await batch.commit();
  console.log(`✓ Seeded ${questions.length} questions`);
}

seed().catch((err) => { console.error(err); process.exit(1); });
