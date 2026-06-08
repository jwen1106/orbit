import OrbitLogo from '@/components/layout/OrbitLogo';

export default function SurveyCompletePage() {
  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <OrbitLogo size="sm" />
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-orbit-dark mb-3">
              Thank you — survey complete
            </h1>
            <p className="text-gray-500 mb-6">
              Your responses have been recorded. Your team's results will be reviewed and analysed by Oaklin once all responses are in.
            </p>
            <p className="text-sm text-gray-400">
              Questions? Contact your Oaklin consultant or email{' '}
              <a
                href="mailto:info@oaklin.com"
                className="text-orbit-green hover:underline"
              >
                info@oaklin.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
