import './globals.css';
import LangProvider from '@/components/LangProvider';

export const metadata = {
  title: 'SIGMA — Tanoto Foundation',
  description: 'Strategic Information for Governance, Monitoring & Analytics'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {/* Skala dipasang sebelum React menempel, agar halaman tidak sempat
            tampil 100% lalu mengecil. */}
        <script dangerouslySetInnerHTML={{ __html:
          "try{var v=localStorage.getItem('sigma_ui_scale')||'0.8';" +
          "document.documentElement.style.setProperty('--ui-scale',v);}catch(e){}" }} /><LangProvider>{children}</LangProvider></body>
    </html>
  );
}
