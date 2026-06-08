import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import QuestionForm from '@/components/admin/QuestionForm';
import type { Question } from '@/types';

async function getQuestion(id: string): Promise<Question | null> {
  const doc = await adminDb.collection('questions').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  // Strip non-serialisable Firestore Timestamp fields before passing to Client Component
  return {
    id: doc.id,
    version: data.version ?? 'v1',
    text: data.text ?? '',
    subtext: data.subtext ?? '',
    competency: data.competency,
    role: data.role,
    order: data.order ?? 1,
    isActive: data.isActive ?? true,
    criteria: data.criteria ?? {},
    assignedOrganisationIds: data.assignedOrganisationIds ?? [],
  } as Question;
}

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const question = await getQuestion(params.id);
  if (!question) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/questions" className="text-sm text-orbit-green hover:underline">
          ← Question Bank
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">Edit Question</h1>
        <p className="text-sm text-gray-500 mt-1">
          Changes apply to all future engagements. Active engagements are not affected.
        </p>
      </div>
      <QuestionForm mode="edit" initial={question} />
    </div>
  );
}
