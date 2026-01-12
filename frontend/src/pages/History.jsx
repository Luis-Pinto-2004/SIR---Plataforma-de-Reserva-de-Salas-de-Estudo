import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import { formatDateTime } from '../utils/time';
import { useLanguage } from '../context/LanguageContext';

function Badge({ status }) {
  const map = {
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  const cls = map[status] || map.confirmed;
  const { t } = useLanguage();
  const labelMap = {
    confirmed: t('history.filter.status.confirmed'),
    pending: t('history.filter.status.pending'),
    cancelled: t('history.filter.status.cancelled')
  };
  const label = labelMap[status] || status;
  return <span className={`px-2 py-1 text-xs border rounded-full ${cls}`}>{label}</span>;
}

export default function History() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { t } = useLanguage();

  const resourceLabel = useMemo(() => {
    const roomMap = new Map(rooms.map((r) => [r.id, r.name]));
    const eqMap = new Map(equipment.map((e) => [e.id, e.name]));
    return (b) => {
      const map = b.resourceType === 'room' ? roomMap : eqMap;
      return map.get(b.resourceId) || b.resourceId;
    };
  }, [rooms, equipment]);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);

      const [{ bookings }, { rooms }, { equipment }] = await Promise.all([
        apiFetch(`/api/bookings/my?${qs.toString()}`),
        apiFetch('/api/rooms'),
        apiFetch('/api/equipment')
      ]);

      setBookings(bookings);
      setRooms(rooms);
      setEquipment(equipment);
    } catch (err) {
      toast.error(err.message || t('general.errorLoad'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancel(id) {
    if (!confirm(t('history.confirmCancelPrompt'))) return;
    try {
      await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
      toast.success(t('history.toast.cancelled'));
      load();
    } catch (err) {
      toast.error(err.message || t('history.toast.error'));
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('history.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('history.description')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">{t('history.filter.status.all')}</option>
            <option value="confirmed">{t('history.filter.status.confirmed')}</option>
            <option value="pending">{t('history.filter.status.pending')}</option>
            <option value="cancelled">{t('history.filter.status.cancelled')}</option>
          </select>
          <input value={from} onChange={(e) => setFrom(e.target.value)} type="date" className="border rounded-lg px-3 py-2 text-sm" />
          <input value={to} onChange={(e) => setTo(e.target.value)} type="date" className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={load} className="border rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50">{t('history.filter.apply')}</button>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 text-sm text-gray-500">{t('history.loading')}</div>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && (
            <div className="text-sm text-gray-500">{t('history.none')}</div>
          )}

          {bookings.map((b) => (
            <div key={b.id} className="bg-white border rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{b.resourceType.toUpperCase()}</div>
                    <Badge status={b.status} />
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Recurso: <span className="font-medium">{resourceLabel(b)}</span></div>
                  <div className="text-sm text-gray-600">{formatDateTime(b.dataInicio)} → {formatDateTime(b.dataFim)}</div>
                </div>

                <div className="flex items-center gap-2">
                  {b.status !== 'cancelled' && (
                    <>
                      <Link to={`/bookings/${b.id}/edit`} className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">{t('history.editButton')}</Link>
                      <button onClick={() => cancel(b.id)} className="text-sm px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">{t('history.cancelButton')}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
