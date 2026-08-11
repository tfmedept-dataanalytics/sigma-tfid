'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signIn } from '../auth/actions';
import { useLang } from '@/components/LangProvider';
import LangSwitch from '@/components/LangSwitch';

const PILLS = [
  'Single Source of Truth', 'Quarterly Monitoring', 'Annual Review',
  'Analytics', 'AI Performance Assistant', 'Audit Trail'
];

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLang();
  return (
    <button className="btn-lg" type="submit" disabled={pending}>
      {pending ? t('Memeriksa…') : t('Masuk')}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, { error: null });
  const { t } = useLang();

  return (
    <div id="login" style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateColumns: '3fr 1fr', background: '#fff' }}>
      <div className="lg-left">
        <div className="lg-hero">
          <div className="lg-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lg-logo" src="/logo-tf.png" alt="Tanoto Foundation" />
            <span className="lg-sep" />
            <div className="lg-bars"><i /><i /><i /><i /></div>
            <div>
              <div className="lg-wm">SIGMA</div>
              <div className="lg-tag">Strategic Information for Governance, Monitoring &amp; Analytics</div>
            </div>
          </div>
          <h1>{t('Satu tempat untuk performa organisasi dan program.')}</h1>
          <p>{t('Menyatukan Organization Performance Indicators (OPI) dan Program Performance Indicators (PPI) dalam satu struktur data, dari Vision hingga indikator, lengkap dengan alur review dan jejak audit.')}</p>
          <div className="lg-pills">{PILLS.map(p => <span key={p}>{p}</span>)}</div>
        </div>
        <div className="lg-foot">&copy; 2026 MLE Tanoto Foundation</div>
      </div>

      <div className="lg-right">
        <form className="lg-form" action={formAction}>
          <h2>{t('Masuk ke SIGMA')}</h2>
          <div className="sub">{t('Gunakan akun yang didaftarkan oleh System Administrator.')}</div>

          <div className="fld">
            <label htmlFor="username">{t('Username')}</label>
            <input id="username" name="username" placeholder={t('nama.pengguna')}
                   autoComplete="username" autoCapitalize="none" spellCheck={false} required />
          </div>

          <div className="fld">
            <label htmlFor="password">{t('Password')}</label>
            <input id="password" name="password" type="password" placeholder="••••••••"
                   autoComplete="current-password" required />
            <div className="hint">
              {state?.error
                ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{state.error}</span>
                : t('Akun dibuat melalui Administration › User Management.')}
            </div>
          </div>

          <SubmitButton />
          <LangSwitch variant="buttons" />
        </form>
      </div>
    </div>
  );
}
