'use client';

import { useRouter } from 'next/navigation';

export interface SurveyOption {
  id: string;
  title: string;
}

interface Props {
  surveys: SurveyOption[];
  selectedId: string;
  baseUrl: string;
}

export default function SurveySelector({ surveys, selectedId, baseUrl }: Props) {
  const router = useRouter();

  if (surveys.length === 0) return null;

  function handleChange(engagementId: string) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    router.push(`${baseUrl}${separator}engagementId=${engagementId}`);
  }

  return (
    <div className="flex-shrink-0">
      <label htmlFor="survey-select" className="sr-only">
        Survey
      </label>
      <select
        id="survey-select"
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-orbit-dark font-semibold min-w-[180px] max-w-[280px] focus:outline-none focus:ring-2 focus:ring-orbit-forest"
      >
        {surveys.map((survey) => (
          <option key={survey.id} value={survey.id}>
            {survey.title}
          </option>
        ))}
      </select>
    </div>
  );
}
