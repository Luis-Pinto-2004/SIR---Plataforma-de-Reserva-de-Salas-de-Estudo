import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success(t('register.toast.success'));
      navigate('/');
    } catch (err) {
      toast.error(err.message || t('register.toast.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t('register.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('register.description')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">{t('register.nameLabel')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('register.namePlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('register.emailLabel')}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('register.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('register.passwordLabel')}</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder={t('register.passwordPlaceholder')}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? t('register.loading') : t('register.button')}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-gray-900 underline">{t('register.link.login')}</Link>
        </div>
      </div>
    </div>
  );
}
