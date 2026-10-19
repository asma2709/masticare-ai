import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Layers,
  Cpu,
  Stethoscope,
  BarChart3,
  Home,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
  Settings,
  LogOut,
  ArrowRight,
} from 'lucide-react';

import MastiCareLogo from './MastiCareLogo';
import UserMenu from './UserMenu';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current route is a focused authentication page
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  const navLinks = [
    { to: '/', label: t('nav.overview'), icon: Home },
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/cows', label: t('nav.cows'), icon: Layers },
    { to: '/simulation', label: t('nav.simulation'), icon: Cpu },
    { to: '/vet', label: t('nav.vet'), icon: Stethoscope },
    { to: '/metrics', label: t('nav.metrics'), icon: BarChart3 },
  ];

  // Focused minimal header on authentication screens
  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#183629]">
        <header className="w-full bg-[#183629] border-b border-[#244D38] py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <MastiCareLogo
              variant="horizontal"
              theme="dark"
              size="sm"
              withLink={true}
              to="/"
              showSubtitle={false}
            />
            <div className="flex items-center gap-3">
              <LanguageSelector variant="nav" />
              <Link
                to="/"
                className="text-xs text-stone-300 hover:text-white transition flex items-center gap-1 font-medium"
              >
                <span>{t('common.backHome')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A9BCA3]" />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col justify-center">
          {children}
        </main>

        <footer className="py-6 px-4 text-center text-xs text-stone-500 border-t border-stone-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; 2026 MastiCare AI. All rights reserved.</span>
            <span className="text-stone-400">{t('common.researchDisclaimer')}</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#183629]">
      {/* GLOBAL APPLICATION NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-[#183629] text-white shadow-sm border-b border-[#244D38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <MastiCareLogo
            variant="horizontal"
            theme="dark"
            size="sm"
            withLink={true}
            to="/"
            showSubtitle={false}
          />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#244D38] text-white shadow-2xs'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#A9BCA3]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Language Selector + User Profile Menu or Guest Action */}
          <div className="hidden sm:flex items-center gap-3">
            <LanguageSelector variant="nav" />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white text-xs font-semibold border border-[#A9BCA3]/30 transition shadow-xs"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Language */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector variant="nav" />
            {isAuthenticated && (
              <div className="sm:hidden">
                <UserMenu />
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#183629] border-t border-white/10 px-4 py-4 space-y-2 shadow-xl animate-in fade-in">
            {/* Authenticated user mobile card */}
            {isAuthenticated && user && (
              <div className="p-3 rounded-2xl bg-[#244D38] border border-white/10 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#183629] border border-white/20 flex items-center justify-center font-bold text-xs text-[#FAF9F3] overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{user.name}</span>
                    <span className="text-[10px] text-stone-300 block">{user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 text-stone-200 hover:text-white"
                    title={t('nav.profile')}
                  >
                    <UserIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 text-stone-200 hover:text-white"
                    title={t('nav.settings')}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#244D38] text-white border border-white/15'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#A9BCA3]' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </Link>
              );
            })}

            {/* Mobile Guest Auth Action */}
            {!isAuthenticated ? (
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-center text-xs font-semibold bg-white/10 text-white"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-center text-xs font-bold bg-[#A9BCA3] text-[#183629]"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.signOut')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 w-full bg-[#F7F6EF]">
        {children}
      </main>

      {/* CLEAN SAAS FOOTER */}
      <footer className="bg-[#183629] text-stone-300 border-t border-[#244D38] py-8 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <MastiCareLogo variant="horizontal" theme="dark" size="sm" withLink={true} to="/" showSubtitle={false} />
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="text-stone-400 text-xs">
              {t('common.tagline')}
            </span>
          </div>

          <div className="text-stone-400 text-[11px]">
            &copy; 2026 MastiCare AI. {t('common.researchDisclaimer')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
