import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import ResourceCard from '../components/ResourceCard';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { socket } = useSocket() || {};
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { t } = useLanguage();

  async function load() {
    setLoading(true);
    try {
      const [{ rooms }, { equipment }] = await Promise.all([apiFetch('/api/rooms'), apiFetch('/api/equipment')]);
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

  useEffect(() => {
    if (!socket) return;

    const onAnyBooking = (eventName) => (payload) => {
      if (eventName === 'booking:created') toast.success(t('dashboard.toast.created'));
      if (eventName === 'booking:cancelled') toast(t('dashboard.toast.cancelled'));
      if (eventName === 'booking:updated') toast(t('dashboard.toast.updated'));
      load();
    };

    const created = onAnyBooking('booking:created');
    const updated = onAnyBooking('booking:updated');
    const cancelled = onAnyBooking('booking:cancelled');

    socket.on('booking:created', created);
    socket.on('booking:updated', updated);
    socket.on('booking:cancelled', cancelled);

    socket.on('connect_error', (err) => {
      if (String(err.message).includes('unauthorized')) {
        toast.error(t('dashboard.toast.socketUnauthorized'));
      }
    });

    return () => {
      socket.off('booking:created', created);
      socket.off('booking:updated', updated);
      socket.off('booking:cancelled', cancelled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  function normalizeStatus(resource) {
    if (resource.status !== 'available') return resource.status;
    return resource.occupiedNow ? 'occupied' : 'available';
  }

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((r) => {
      const status = normalizeStatus(r);
      const matchTab = tab === 'all' || tab === 'rooms';
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      const matchQuery = !q || r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
      return matchTab && matchStatus && matchQuery;
    });
  }, [rooms, query, tab, statusFilter]);

  const filteredEquipment = useMemo(() => {
    const q = query.trim().toLowerCase();
    return equipment.filter((e) => {
      const status = normalizeStatus(e);
      const matchTab = tab === 'all' || tab === 'equipment';
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      const matchQuery = !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
      return matchTab && matchStatus && matchQuery;
    });
  }, [equipment, query, tab, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('dashboard.description')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-64"
            placeholder={t('dashboard.searchPlaceholder')}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">{t('dashboard.statusFilter.all')}</option>
            <option value="available">{t('dashboard.statusFilter.available')}</option>
            <option value="occupied">{t('dashboard.statusFilter.occupied')}</option>
            <option value="maintenance">{t('dashboard.statusFilter.maintenance')}</option>
            <option value="disabled">{t('dashboard.statusFilter.disabled')}</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setTab('all')} className={`px-3 py-2 rounded-lg text-sm border ${tab === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}>{t('dashboard.tabs.all')}</button>
        <button onClick={() => setTab('rooms')} className={`px-3 py-2 rounded-lg text-sm border ${tab === 'rooms' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}>{t('dashboard.tabs.rooms')}</button>
        <button onClick={() => setTab('equipment')} className={`px-3 py-2 rounded-lg text-sm border ${tab === 'equipment' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}>{t('dashboard.tabs.equipment')}</button>
        <button onClick={load} className="px-3 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50">{t('dashboard.reload')}</button>
      </div>

      {loading ? (
        <div className="mt-10 text-sm text-gray-500">{t('dashboard.loading')}</div>
      ) : (
        <div className="mt-6 space-y-10">
          {(tab === 'all' || tab === 'rooms') && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('dashboard.section.rooms')}</h2>
                <div className="text-sm text-gray-500">{filteredRooms.length} {t('dashboard.itemsSuffix')}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((r) => (
                  <ResourceCard key={r.id} resource={r} type="room" />
                ))}
              </div>
            </section>
          )}

          {(tab === 'all' || tab === 'equipment') && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('dashboard.section.equipment')}</h2>
                <div className="text-sm text-gray-500">{filteredEquipment.length} {t('dashboard.itemsSuffix')}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEquipment.map((e) => (
                  <ResourceCard key={e.id} resource={e} type="equipment" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
