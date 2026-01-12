import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const presetToken = params.get('token') || '';
  const [token, setToken] = useState(presetToken);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const canSubmit = useMemo(() => token.length > 0 && password.length >= 6, [token, password]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      toast.success(t('reset.button'));
      navigate('/login');
    } catch (err) {
      toast.error(err.message || t('general.failure'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t('reset.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('reset.description')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">{t('reset.tokenLabel')}</label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value.trim())}
              rows={3}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2 font-mono text-sm"
              placeholder={t('reset.tokenPlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('reset.passwordLabel')}</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('reset.passwordPlaceholder')}
            />
          </div>

          <button
            disabled={!canSubmit || loading}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? t('reset.loading') : t('reset.button')}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-gray-900 underline">{t('reset.back')}</Link>
        </div>
      </div>
    </div>
  );
}
