import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import { formatDateTime, toDatetimeLocalValue } from '../utils/time';
import { useLanguage } from '../context/LanguageContext';

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusSelect({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
      <option value="available">{t('status.available')}</option>
      <option value="maintenance">{t('status.maintenance')}</option>
      <option value="disabled">{t('status.disabled')}</option>
    </select>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('resources');
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [bookingFilters, setBookingFilters] = useState({ status: 'all', resourceType: 'all' });

  const { t } = useLanguage();

  const resourceLabel = useMemo(() => {
    const roomMap = new Map(rooms.map((r) => [r.id, r.name]));
    const eqMap = new Map(equipment.map((e) => [e.id, e.name]));
    return (b) => {
      const map = b.resourceType === 'room' ? roomMap : eqMap;
      return map.get(b.resourceId) || b.resourceId;
    };
  }, [rooms, equipment]);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ rooms }, { equipment }] = await Promise.all([apiFetch('/api/rooms'), apiFetch('/api/equipment')]);
      setRooms(rooms);
      setEquipment(equipment);

      const qs = new URLSearchParams();
      if (bookingFilters.status !== 'all') qs.set('status', bookingFilters.status);
      if (bookingFilters.resourceType !== 'all') qs.set('resourceType', bookingFilters.resourceType);
      const { bookings } = await apiFetch(`/api/bookings?${qs.toString()}`);
      setBookings(bookings);
    } catch (err) {
      toast.error(err.message || t('general.errorLoad'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRoom(payload) {
    try {
      await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(t('admin.toast.roomCreated'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateRoom(id, payload) {
    try {
      await apiFetch(`/api/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast.success(t('admin.toast.roomUpdated'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deleteRoom(id) {
    if (!confirm(t('admin.confirm.deleteRoom'))) return;
    try {
      await apiFetch(`/api/rooms/${id}`, { method: 'DELETE' });
      toast.success(t('admin.toast.roomDeleted'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function createEquipment(payload) {
    try {
      await apiFetch('/api/equipment', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(t('admin.toast.equipmentCreated'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateEquipment(id, payload) {
    try {
      await apiFetch(`/api/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast.success(t('admin.toast.equipmentUpdated'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deleteEquipment(id) {
    if (!confirm(t('admin.confirm.deleteEquipment'))) return;
    try {
      await apiFetch(`/api/equipment/${id}`, { method: 'DELETE' });
      toast.success(t('admin.toast.equipmentDeleted'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function cancelBooking(id) {
    if (!confirm(t('admin.confirm.cancelBooking'))) return;
    try {
      await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
      toast.success(t('admin.toast.bookingCancelled'));
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateBooking(id, payload) {
    try {
      await apiFetch(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast.success(t('admin.toast.bookingUpdated'));
      loadAll();
    } catch (err) {
      if (err.status === 409) toast.error(t('admin.toast.conflict'));
      else toast.error(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t('admin.title')}</h1>
      <p className="text-sm text-gray-600 mt-1">{t('admin.description')}</p>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setTab('resources')} className={`px-3 py-2 rounded-lg text-sm border ${tab === 'resources' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}>{t('admin.tabs.resources')}</button>
        <button onClick={() => setTab('bookings')} className={`px-3 py-2 rounded-lg text-sm border ${tab === 'bookings' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}>{t('admin.tabs.bookings')}</button>
        <button onClick={loadAll} className="px-3 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50">{t('admin.reload')}</button>
      </div>

      {loading ? (
        <div className="mt-10 text-sm text-gray-500">{t('admin.loading')}</div>
      ) : (
        <>
          {tab === 'resources' && (
            <div>
              <Section title={t('admin.sections.rooms')}>
                <CreateRoomForm onCreate={createRoom} />
                <div className="mt-4 space-y-2">
                  {rooms.map((r) => (
                    <RoomRow key={r.id} room={r} onSave={updateRoom} onDelete={deleteRoom} />
                  ))}
                </div>
              </Section>

              <Section title={t('admin.sections.equipment')}>
                <CreateEquipmentForm onCreate={createEquipment} />
                <div className="mt-4 space-y-2">
                  {equipment.map((e) => (
                    <EquipmentRow key={e.id} item={e} onSave={updateEquipment} onDelete={deleteEquipment} />
                  ))}
                </div>
              </Section>
            </div>
          )}

          {tab === 'bookings' && (
            <Section title={t('admin.sections.allBookings')}>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={bookingFilters.status}
                  onChange={(e) => setBookingFilters((s) => ({ ...s, status: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">{t('admin.filter.status.all')}</option>
                  <option value="confirmed">{t('admin.filter.status.confirmed')}</option>
                  <option value="pending">{t('admin.filter.status.pending')}</option>
                  <option value="cancelled">{t('admin.filter.status.cancelled')}</option>
                </select>
                <select
                  value={bookingFilters.resourceType}
                  onChange={(e) => setBookingFilters((s) => ({ ...s, resourceType: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">{t('admin.filter.type.all')}</option>
                  <option value="room">{t('admin.filter.type.room')}</option>
                  <option value="equipment">{t('admin.filter.type.equipment')}</option>
                </select>
                <button
                  onClick={loadAll}
                  className="border rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50"
                >
                  {t('admin.filter.apply')}
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {bookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    resourceLabel={resourceLabel}
                    onCancel={cancelBooking}
                    onSave={updateBooking}
                  />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function CreateRoomForm({ onCreate }) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [location, setLocation] = useState('');
  const { t } = useLanguage();

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="font-semibold">{t('admin.createRoom.title')}</div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.createRoom.namePlaceholder')} className="border rounded-lg px-3 py-2 text-sm" />
        <input value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} type="number" min="1" className="border rounded-lg px-3 py-2 text-sm" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('admin.createRoom.locationPlaceholder')} className="border rounded-lg px-3 py-2 text-sm" />
        <button
          onClick={() => {
            onCreate({ name, capacity, location });
            setName('');
            setLocation('');
          }}
          className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm hover:bg-gray-800"
        >
          {t('admin.createRoom.button')}
        </button>
      </div>
    </div>
  );
}

function RoomRow({ room, onSave, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(room.name);
  const [capacity, setCapacity] = useState(room.capacity);
  const [location, setLocation] = useState(room.location);
  const [status, setStatus] = useState(room.status);

  const { t } = useLanguage();

  useEffect(() => {
    setName(room.name);
    setCapacity(room.capacity);
    setLocation(room.location);
    setStatus(room.status);
  }, [room]);

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-center">
        <input disabled={!edit} value={name} onChange={(e) => setName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <input disabled={!edit} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} type="number" min="1" className="border rounded-lg px-3 py-2 text-sm" />
        <input disabled={!edit} value={location} onChange={(e) => setLocation(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <StatusSelect value={status} onChange={setStatus} />
        <div className="text-xs text-gray-400 break-all">{room.id}</div>
        <div className="flex gap-2 justify-end">
          {edit ? (
            <>
              <button
                onClick={() => {
                  onSave(room.id, { name, capacity, location, status });
                  setEdit(false);
                }}
                className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white"
              >
                {t('admin.roomRow.save')}
              </button>
              <button onClick={() => setEdit(false)} className="px-3 py-2 rounded-lg text-sm border">{t('admin.roomRow.cancel')}</button>
            </>
          ) : (
            <button onClick={() => setEdit(true)} className="px-3 py-2 rounded-lg text-sm border">{t('admin.roomRow.edit')}</button>
          )}
          <button onClick={() => onDelete(room.id)} className="px-3 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50">{t('admin.roomRow.delete')}</button>
        </div>
      </div>
    </div>
  );
}

function CreateEquipmentForm({ onCreate }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const { t } = useLanguage();

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="font-semibold">{t('admin.createEquipment.title')}</div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.createEquipment.namePlaceholder')} className="border rounded-lg px-3 py-2 text-sm" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('admin.createEquipment.categoryPlaceholder')} className="border rounded-lg px-3 py-2 text-sm" />
        <button
          onClick={() => {
            onCreate({ name, category });
            setName('');
            setCategory('');
          }}
          className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm hover:bg-gray-800"
        >
          {t('admin.createEquipment.button')}
        </button>
      </div>
    </div>
  );
}

function EquipmentRow({ item, onSave, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [status, setStatus] = useState(item.status);

  const { t } = useLanguage();

  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setStatus(item.status);
  }, [item]);

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-center">
        <input disabled={!edit} value={name} onChange={(e) => setName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <input disabled={!edit} value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <div className="hidden lg:block" />
        <StatusSelect value={status} onChange={setStatus} />
        <div className="text-xs text-gray-400 break-all">{item.id}</div>
        <div className="flex gap-2 justify-end">
          {edit ? (
            <>
              <button
                onClick={() => {
                  onSave(item.id, { name, category, status });
                  setEdit(false);
                }}
                className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white"
              >
                {t('admin.equipmentRow.save')}
              </button>
              <button onClick={() => setEdit(false)} className="px-3 py-2 rounded-lg text-sm border">{t('admin.equipmentRow.cancel')}</button>
            </>
          ) : (
            <button onClick={() => setEdit(true)} className="px-3 py-2 rounded-lg text-sm border">{t('admin.equipmentRow.edit')}</button>
          )}
          <button onClick={() => onDelete(item.id)} className="px-3 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50">{t('admin.equipmentRow.delete')}</button>
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking, resourceLabel, onCancel, onSave }) {
  const [edit, setEdit] = useState(false);
  const [dataInicio, setDataInicio] = useState(toDatetimeLocalValue(booking.dataInicio));
  const [dataFim, setDataFim] = useState(toDatetimeLocalValue(booking.dataFim));
  const [status, setStatus] = useState(booking.status);

  const { t } = useLanguage();

  useEffect(() => {
    setDataInicio(toDatetimeLocalValue(booking.dataInicio));
    setDataFim(toDatetimeLocalValue(booking.dataFim));
    setStatus(booking.status);
  }, [booking]);

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm text-gray-500">{booking.resourceType.toUpperCase()} · {resourceLabel(booking)}</div>
          <div className="text-sm mt-1">{t('admin.bookingRow.userLabel')} <span className="font-medium">{booking.user?.email || booking.userId}</span></div>
          {!edit ? (
            <div className="text-sm text-gray-600 mt-1">{formatDateTime(booking.dataInicio)} → {formatDateTime(booking.dataFim)} · <span className="font-medium">{booking.status}</span></div>
          ) : (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="confirmed">confirmed</option>
                <option value="pending">pending</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {booking.status !== 'cancelled' && (
            <button onClick={() => onCancel(booking.id)} className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white">{t('admin.bookingRow.cancel')}</button>
          )}
          {edit ? (
            <>
              <button
                onClick={() => {
                  onSave(booking.id, { dataInicio, dataFim, status });
                  setEdit(false);
                }}
                className="px-3 py-2 rounded-lg text-sm border"
              >
                {t('admin.bookingRow.save')}
              </button>
              <button onClick={() => setEdit(false)} className="px-3 py-2 rounded-lg text-sm border">{t('admin.bookingRow.close')}</button>
            </>
          ) : (
            <button onClick={() => setEdit(true)} className="px-3 py-2 rounded-lg text-sm border">{t('admin.bookingRow.adjust')}</button>
          )}
        </div>
      </div>
    </div>
  );
}
