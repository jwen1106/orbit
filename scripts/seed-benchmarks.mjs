import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
}

function benchmarkId(industry, func, sizeRange) {
  return `${slug(industry)}__${func}__${sizeRange}`;
}

function scores(pr, gi, pa) {
  return {
    people_relationships: { industryAverage: pr[0], bestInClass: pr[1] },
    growth_impact: { industryAverage: gi[0], bestInClass: gi[1] },
    purpose_alignment: { industryAverage: pa[0], bestInClass: pa[1] },
  };
}

// Oaklin-authored benchmark data
// Format: [industryAverage, bestInClass] per competency
const records = [
  // Financial Services — back office
  { industry: 'Financial Services', function: 'back', sizeRange: '1-10',   competencyScores: scores([3.1, 4.3], [3.0, 4.2], [2.9, 4.1]) },
  { industry: 'Financial Services', function: 'back', sizeRange: '11-25',  competencyScores: scores([3.0, 4.2], [2.9, 4.1], [2.8, 4.0]) },
  { industry: 'Financial Services', function: 'back', sizeRange: '26-50',  competencyScores: scores([2.9, 4.0], [2.8, 3.9], [2.8, 3.9]) },
  { industry: 'Financial Services', function: 'back', sizeRange: '51+',    competencyScores: scores([2.8, 3.9], [2.7, 3.8], [2.7, 3.8]) },
  { industry: 'Financial Services', function: 'middle', sizeRange: '11-25',competencyScores: scores([3.3, 4.5], [3.2, 4.4], [3.1, 4.3]) },
  { industry: 'Financial Services', function: 'front', sizeRange: '11-25', competencyScores: scores([3.5, 4.7], [3.4, 4.6], [3.3, 4.5]) },

  // Technology
  { industry: 'Technology', function: 'back', sizeRange: '1-10',   competencyScores: scores([3.4, 4.6], [3.5, 4.7], [3.3, 4.5]) },
  { industry: 'Technology', function: 'back', sizeRange: '11-25',  competencyScores: scores([3.3, 4.5], [3.4, 4.6], [3.2, 4.4]) },
  { industry: 'Technology', function: 'middle', sizeRange: '11-25',competencyScores: scores([3.5, 4.7], [3.6, 4.8], [3.4, 4.6]) },
  { industry: 'Technology', function: 'front', sizeRange: '11-25', competencyScores: scores([3.6, 4.8], [3.7, 4.9], [3.5, 4.7]) },

  // Healthcare
  { industry: 'Healthcare', function: 'back', sizeRange: '11-25',  competencyScores: scores([3.0, 4.2], [2.9, 4.1], [3.1, 4.3]) },
  { industry: 'Healthcare', function: 'middle', sizeRange: '11-25',competencyScores: scores([3.2, 4.4], [3.1, 4.3], [3.2, 4.4]) },
  { industry: 'Healthcare', function: 'front', sizeRange: '11-25', competencyScores: scores([3.3, 4.5], [3.2, 4.4], [3.4, 4.6]) },

  // Government & Public Sector
  { industry: 'Government & Public Sector', function: 'back', sizeRange: '11-25',  competencyScores: scores([2.8, 3.9], [2.7, 3.8], [2.9, 4.0]) },
  { industry: 'Government & Public Sector', function: 'back', sizeRange: '26-50',  competencyScores: scores([2.7, 3.8], [2.6, 3.7], [2.8, 3.9]) },
  { industry: 'Government & Public Sector', function: 'middle', sizeRange: '26-50',competencyScores: scores([2.9, 4.0], [2.8, 3.9], [2.9, 4.1]) },

  // Energy
  { industry: 'Energy', function: 'back', sizeRange: '11-25',   competencyScores: scores([3.0, 4.1], [2.9, 4.0], [2.9, 4.1]) },
  { industry: 'Energy', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.1, 4.3], [3.0, 4.2], [3.0, 4.2]) },
  { industry: 'Energy', function: 'front', sizeRange: '11-25',  competencyScores: scores([3.3, 4.5], [3.2, 4.4], [3.2, 4.4]) },

  // Pharmaceuticals
  { industry: 'Pharmaceuticals', function: 'back', sizeRange: '11-25',   competencyScores: scores([3.2, 4.4], [3.1, 4.3], [3.2, 4.4]) },
  { industry: 'Pharmaceuticals', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.3, 4.5], [3.2, 4.4], [3.3, 4.5]) },

  // Retail
  { industry: 'Retail', function: 'back', sizeRange: '11-25',   competencyScores: scores([2.9, 4.0], [2.8, 3.9], [2.8, 3.9]) },
  { industry: 'Retail', function: 'front', sizeRange: '11-25',  competencyScores: scores([3.1, 4.3], [3.0, 4.2], [3.0, 4.2]) },

  // Transport
  { industry: 'Transport', function: 'back', sizeRange: '11-25',   competencyScores: scores([2.9, 4.0], [2.8, 3.9], [2.8, 3.9]) },
  { industry: 'Transport', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.0, 4.1], [2.9, 4.0], [2.9, 4.0]) },

  // Property & Construction
  { industry: 'Property & Construction', function: 'back', sizeRange: '11-25',  competencyScores: scores([2.8, 3.9], [2.7, 3.8], [2.8, 3.9]) },
  { industry: 'Property & Construction', function: 'front', sizeRange: '11-25', competencyScores: scores([3.0, 4.2], [2.9, 4.1], [3.0, 4.1]) },

  // Infrastructure
  { industry: 'Infrastructure', function: 'back', sizeRange: '11-25',   competencyScores: scores([2.9, 4.0], [2.8, 3.9], [2.8, 3.9]) },
  { industry: 'Infrastructure', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.0, 4.1], [2.9, 4.0], [2.9, 4.0]) },

  // Automotive
  { industry: 'Automotive', function: 'back', sizeRange: '11-25',   competencyScores: scores([3.0, 4.2], [2.9, 4.1], [2.9, 4.0]) },
  { industry: 'Automotive', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.1, 4.3], [3.0, 4.2], [3.0, 4.2]) },

  // Aerospace & Defence
  { industry: 'Aerospace & Defence', function: 'back', sizeRange: '11-25',   competencyScores: scores([3.1, 4.3], [3.0, 4.2], [3.0, 4.2]) },
  { industry: 'Aerospace & Defence', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.2, 4.4], [3.1, 4.3], [3.1, 4.3]) },

  // Water
  { industry: 'Water', function: 'back', sizeRange: '11-25',   competencyScores: scores([2.9, 4.0], [2.8, 3.9], [2.9, 4.0]) },
  { industry: 'Water', function: 'middle', sizeRange: '11-25', competencyScores: scores([3.0, 4.1], [2.9, 4.0], [3.0, 4.1]) },
];

async function seed() {
  console.log(`Seeding ${records.length} benchmark records…`);
  const batch = db.batch();
  for (const record of records) {
    const id = benchmarkId(record.industry, record.function, record.sizeRange);
    const ref = db.collection('benchmarks').doc(id);
    batch.set(ref, {
      ...record,
      source: 'oaklin_authored',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'seed',
    });
  }
  await batch.commit();
  console.log(`✓ Seeded ${records.length} benchmark records`);
}

seed().catch((err) => { console.error(err); process.exit(1); });
