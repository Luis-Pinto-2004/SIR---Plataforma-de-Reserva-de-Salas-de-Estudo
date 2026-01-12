import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function StatusPill({ status }) {
  const { t } = useLanguage();
  const map = {
    available: { label: t('status.available'), cls: 'bg-green-50 text-green-700 border-green-200' },
    occupied: { label: t('status.occupied'), cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    maintenance: { label: t('status.maintenance'), cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    disabled: { label: t('status.disabled'), cls: 'bg-gray-100 text-gray-700 border-gray-200' }
  };
  const v = map[status] || map.available;
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs border rounded-full ${v.cls}`}>{v.label}</span>
  );
}
