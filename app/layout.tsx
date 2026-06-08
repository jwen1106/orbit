import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Orbit by Oaklin',
    template: '%s | Orbit',
  },
  description:
    'Operational maturity diagnostic platform — understand your team, prioritise action, and build consistently high performance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
