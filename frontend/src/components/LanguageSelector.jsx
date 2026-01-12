import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGS = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
];

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  const selected = LANGS.find((l) => l.code === lang) || LANGS[0];

  function toggle() {
    setOpen((o) => !o);
  }

  function choose(code) {
    setLang(code);
    setOpen(false);
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1 px-2 py-1 border rounded-md bg-white hover:bg-gray-50 text-base"
        aria-label={selected.label}
        title={selected.label}
      >
        <span>{selected.flag}</span>
        <svg
          className="w-3 h-3 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 origin-top-right bg-white border rounded-md shadow-lg z-50">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`flex items-center justify-center w-full px-3 py-2 hover:bg-gray-100 ${l.code === lang ? 'bg-gray-100' : ''}`}
              aria-label={l.label}
              title={l.label}
            >
              <span className="mr-2">{l.flag}</span>
              <span className="text-sm text-gray-700">{l.code === 'pt' ? 'PT' : l.code === 'es' ? 'ES' : 'EN-GB'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
