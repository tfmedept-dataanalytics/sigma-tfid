import './globals.css';
import LangProvider from '@/components/LangProvider';

export const metadata = {
  title: 'SIGMA — Tanoto Foundation',
  description: 'Strategic Information for Governance, Monitoring & Analytics'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body><LangProvider>{children}</LangProvider></body>
    </html>
  );
}
