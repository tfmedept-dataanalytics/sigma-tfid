'use client';

import { useLang } from './LangProvider';
import { LANGS } from '@/lib/i18n';

/** variant "select" untuk top bar, "buttons" untuk halaman login. */
export default function LangSwitch({ variant = 'select' }) {
  const { lang, setLang, t } = useLang();

  if (variant === 'buttons') {
    return (
      <div className="lg-lang">
        {Object.keys(LANGS).map(k => (
          <button key={k} type="button" className={lang === k ? 'on' : ''} onClick={() => setLang(k)}>
            {LANGS[k]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select className="sel-sm" value={lang} onChange={e => setLang(e.target.value)} title={t('Bahasa / Language')}>
      {Object.keys(LANGS).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
    </select>
  );
}
