'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { LANGS, DEFAULT_LANG, translator } from '@/lib/i18n';

const Ctx = createContext({ lang: DEFAULT_LANG, setLang: () => {}, t: k => k });

export function useLang() { return useContext(Ctx); }

export default function LangProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sigma_lang');
      if (stored && LANGS[stored]) setLangState(stored);
    } catch { /* localStorage tidak tersedia: pakai default */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = l => {
    if (!LANGS[l]) return;
    setLangState(l);
    try { localStorage.setItem('sigma_lang', l); } catch { /* abaikan */ }
  };

  return <Ctx.Provider value={{ lang, setLang, t: translator(lang) }}>{children}</Ctx.Provider>;
}
