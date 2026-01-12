import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LogoFull from '../assets/logo-full.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('login.toast.success'));
      navigate('/');
    } catch (err) {
      toast.error(err.message || t('login.toast.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        {/* Logo on login page */}
        <img src={LogoFull} alt="StudySpace logo" className="mx-auto mb-4 w-32" />
        <h1 className="text-xl font-semibold">{t('login.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('login.description')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">{t('login.emailLabel')}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('login.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('login.passwordLabel')}</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? t('login.loading') : t('login.button')}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/register" className="text-gray-900 underline">{t('login.link.register')}</Link>
          <Link to="/forgot" className="text-gray-700 underline">{t('login.link.forgot')}</Link>
        </div>
      </div>
    </div>
  );
}
