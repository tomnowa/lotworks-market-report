import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Website Market Report | LotWorks',
  description: 'Public map analytics and buyer engagement insights for your communities.',
  icons: {
    icon: '/favicon.ico',
  },
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
