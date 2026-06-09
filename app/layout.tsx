import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Orbit by Oaklin',
    template: '%s | Orbit',
  },
  description:
    'HPT Diagnostic Tool by Oaklin — assess team operational maturity, benchmark against peers, and prioritise action.',
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
