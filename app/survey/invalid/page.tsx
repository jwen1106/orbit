import OrbitLogo from '@/components/layout/OrbitLogo';

export default function InvalidSurveyPage() {
  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <OrbitLogo size="sm" />
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orbit-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-orbit-dark mb-3">
              This link is no longer active
            </h1>
            <p className="text-gray-500">
              The survey link you followed may have expired, or the survey may have been closed by your Oaklin consultant.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Contact{' '}
              <a href="mailto:info@oaklin.com" className="text-orbit-green hover:underline">
                info@oaklin.com
              </a>{' '}
              if you think this is an error.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
