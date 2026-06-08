import Link from 'next/link';

export default function ExportReportPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
      <h1 className="text-xl font-bold text-orbit-dark mb-2">Export Report</h1>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
        Download a PDF summary of your team diagnostic. This feature will be available in a future release.
      </p>
      <Link href="/dashboard" className="text-sm text-orbit-green hover:underline font-semibold">
        ← Back to dashboard
      </Link>
    </div>
  );
}
