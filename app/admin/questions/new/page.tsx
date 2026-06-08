import Link from 'next/link';
import QuestionForm from '@/components/admin/QuestionForm';

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/questions" className="text-sm text-orbit-green hover:underline">
          ← Question Bank
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">New Question</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a question to the Orbit question bank. It will be included in all new engagements.
        </p>
      </div>
      <QuestionForm mode="create" />
    </div>
  );
}
