import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import LogoIcon from '../assets/logo-icon.png';

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo with icon and name */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-gray-900">
            <img src={LogoIcon} alt="Logo" className="h-8 w-8" />
            StudySpace
          </Link>
          <div className="flex items-center gap-4">
            {/* Language selector always visible */}
            <LanguageSelector />
            {user && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-gray-600">
                  {user.name} · <span className="font-medium">{user.role}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="text-sm px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="bg-white border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-2">
            <NavItem to="/">{t('nav.dashboard')}</NavItem>
            <NavItem to="/bookings/new">{t('nav.createBooking')}</NavItem>
            <NavItem to="/history">{t('nav.myHistory')}</NavItem>
            {user.role === 'admin' && <NavItem to="/admin">{t('nav.admin')}</NavItem>}
          </div>
        </nav>
      )}

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="py-10 text-center text-xs text-gray-400">
        StudySpace
      </footer>
    </div>
  );
}
