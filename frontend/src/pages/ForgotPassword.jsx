import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const { t } = useLanguage();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setToken(null);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (res.resetToken) setToken(res.resetToken);
      toast.success(t('forgot.success'));
    } catch (err) {
      toast.error(err.message || t('general.failure'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t('forgot.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('forgot.description')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">{t('forgot.emailLabel')}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('forgot.emailPlaceholder')}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? t('forgot.loading') : t('forgot.button')}
          </button>
        </form>

        {token && (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <div className="text-xs text-gray-500">{t('forgot.tokenLabel')}</div>
            <div className="font-mono text-sm break-all">{token}</div>
            <div className="mt-2 text-sm">
              <Link className="underline" to={`/reset?token=${encodeURIComponent(token)}`}>{t('forgot.openReset')}</Link>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-gray-900 underline">{t('forgot.back')}</Link>
        </div>
      </div>
    </div>
  );
}
