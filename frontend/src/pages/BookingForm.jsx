import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import { toDatetimeLocalValue } from '../utils/time';
import { useLanguage } from '../context/LanguageContext';

export default function BookingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [params] = useSearchParams();
  const preType = params.get('type') || '';
  const preId = params.get('id') || '';

  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const d = new Date(now.getTime() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d;
  }, [now]);
  const defaultEnd = useMemo(() => new Date(defaultStart.getTime() + 60 * 60 * 1000), [defaultStart]);

  const [resourceType, setResourceType] = useState(preType || 'room');
  const [resourceId, setResourceId] = useState(preId || '');
  const [dataInicio, setDataInicio] = useState(toDatetimeLocalValue(defaultStart));
  const [dataFim, setDataFim] = useState(toDatetimeLocalValue(defaultEnd));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { t } = useLanguage();

  async function load() {
    setLoading(true);
    try {
      const [{ rooms }, { equipment }] = await Promise.all([apiFetch('/api/rooms'), apiFetch('/api/equipment')]);
      setRooms(rooms);
      setEquipment(equipment);

      if (editing) {
        const { bookings } = await apiFetch('/api/bookings/my');
        const b = bookings.find((x) => x.id === id);
        if (!b) throw new Error(t('bookingForm.notFound'));
        setResourceType(b.resourceType);
        setResourceId(b.resourceId);
        setDataInicio(toDatetimeLocalValue(b.dataInicio));
        setDataFim(toDatetimeLocalValue(b.dataFim));
      } else {
        if (preType && preId) {
          const list = preType === 'room' ? rooms : equipment;
          const found = list.find((x) => x.id === preId);
          if (!found) setResourceId('');
        }
      }
    } catch (err) {
      toast.error(err.message || t('general.errorLoad'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectableResources = useMemo(() => {
    const list = resourceType === 'room' ? rooms : equipment;
    return list.filter((r) => r.status === 'available');
  }, [resourceType, rooms, equipment]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { resourceType, resourceId, dataInicio, dataFim };
      if (!resourceId) throw new Error(t('bookingForm.chooseResourceError'));

      if (editing) {
        await apiFetch(`/api/bookings/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        toast.success(t('bookingForm.toast.updated'));
      } else {
        await apiFetch('/api/bookings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success(t('bookingForm.toast.created'));
      }
      navigate('/history');
    } catch (err) {
      if (err.status === 409) {
        toast.error(t('bookingForm.toast.conflict'));
      } else {
        toast.error(err.message || t('bookingForm.error'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{editing ? t('bookingForm.title.edit') : t('bookingForm.title.create')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('bookingForm.description')}</p>
        </div>
        <Link to="/" className="text-sm underline">{t('bookingForm.back')}</Link>
      </div>

      {loading ? (
        <div className="mt-10 text-sm text-gray-500">{t('bookingForm.loading')}</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 bg-white border rounded-2xl p-6 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('bookingForm.typeLabel')}</label>
              <select
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  setResourceId('');
                }}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                disabled={editing}
              >
                <option value="room">{t('bookingForm.type.room')}</option>
                <option value="equipment">{t('bookingForm.type.equipment')}</option>
              </select>
              {editing && <div className="text-xs text-gray-500 mt-1">{t('bookingForm.editTypeInfo')}</div>}
            </div>

            <div>
              <label className="text-sm font-medium">{t('bookingForm.resourceLabel')}</label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">{t('bookingForm.resourcePlaceholder')}</option>
                {selectableResources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {resourceType === 'room' ? `${r.name} (${r.location})` : `${r.name} (${r.category})`}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">{t('bookingForm.availableOnlyInfo')}</div>
            </div>

            <div>
              <label className="text-sm font-medium">{t('bookingForm.startLabel')}</label>
              <input
                type="datetime-local"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('bookingForm.endLabel')}</label>
              <input
                type="datetime-local"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              disabled={submitting}
              className="bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? t('bookingForm.save.loading') : (editing ? t('bookingForm.save.edit') : t('bookingForm.save.create'))}
            </button>
            <Link to="/history" className="text-sm underline">{t('bookingForm.goToHistory')}</Link>
          </div>
        </form>
      )}
    </div>
  );
}
