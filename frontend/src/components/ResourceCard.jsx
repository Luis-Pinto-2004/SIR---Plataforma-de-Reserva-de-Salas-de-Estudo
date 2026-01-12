import React from 'react';
import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';
import { useLanguage } from '../context/LanguageContext';

export default function ResourceCard({ resource, type }) {
  const { t } = useLanguage();
  const baseStatus = resource.status;
  const status = baseStatus !== 'available' ? baseStatus : (resource.occupiedNow ? 'occupied' : 'available');
  const canBook = status === 'available';

  return (
    <div className="bg-white border rounded-2xl p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{resource.name}</div>
          {type === 'room' ? (
            <div className="text-sm text-gray-600 mt-1">
              {t('resource.capacityLabel')}: {resource.capacity} · {resource.location}
            </div>
          ) : (
            <div className="text-sm text-gray-600 mt-1">{t('resource.categoryLabel')}: {resource.category}</div>
          )}
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-4 flex-1" />

      <div className="flex items-center justify-end">
        <Link
          to={`/bookings/new?type=${type}&id=${encodeURIComponent(resource.id)}`}
          className={`text-sm px-3 py-2 rounded-lg border ${canBook ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-gray-50 text-gray-400 border-gray-200 pointer-events-none'}`}
        >
          {t('resource.reserveButton')}
        </Link>
      </div>
    </div>
  );
}
