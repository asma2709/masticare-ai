import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { MastiCareLogoIcon } from './MastiCareLogo';

export const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="px-3.5 py-1.5 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition"
        >
          {t('nav.signIn')}
        </Link>
        <Link
          to="/signup"
          className="px-3.5 py-1.5 rounded-xl bg-[#A9BCA3] hover:bg-[#9cb096] text-[#183629] text-xs font-bold transition shadow-xs"
        >
          {t('nav.signUp')}
        </Link>
      </div>
    );
  }

  // Derive initials
  const initials = user.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'MC';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* ChatGPT-style avatar button */}
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#A9BCA3] transition-all"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="User profile and account settings menu"
        >
          {/* Avatar circle or image */}
          <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-[#183629] border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
            {user.avatar_url && !imageError ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-semibold text-xs text-[#FAF9F3] tracking-wider">
                {initials}
              </span>
            )}
            {/* Status dot */}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#183629]" />
          </div>

          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">
              {user.name}
            </span>
            <span className="text-[10px] text-[#A9BCA3] leading-tight font-medium uppercase tracking-wider">
              {user.auth_provider === 'google' ? 'Google' : 'Account'}
            </span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-300 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Polished Dropdown Card */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#FAF9F3] text-[#183629] shadow-2xl border border-[#244D38]/15 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Top User Summary */}
            <div className="p-3.5 rounded-xl bg-[#244D38]/5 border border-[#244D38]/10 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#183629] border border-[#244D38]/20 flex items-center justify-center shrink-0 shadow-xs">
                  {user.avatar_url && !imageError ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm text-[#FAF9F3]">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-[#183629] truncate">{user.name}</p>
                    {user.is_verified && (
                      <span title="Verified Account" className="inline-flex">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 truncate">{user.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#244D38]/10 text-[#244D38]">
                      {user.auth_provider === 'google' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Google Account
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Email Verified
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-0.5 text-xs font-semibold">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-700 hover:text-[#183629] hover:bg-[#244D38]/8 transition"
                role="menuitem"
              >
                <UserIcon className="w-4 h-4 text-[#244D38]" />
                <div className="flex-1">
                  <span>{t('nav.profile')}</span>
                  <p className="text-[10px] font-normal text-stone-500">{t('profile.subtitle')}</p>
                </div>
              </Link>

              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-700 hover:text-[#183629] hover:bg-[#244D38]/8 transition"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-[#244D38]" />
                <div className="flex-1">
                  <span>{t('nav.settings')}</span>
                  <p className="text-[10px] font-normal text-stone-500">{t('settings.subtitle')}</p>
                </div>
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowHelpModal(true);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-700 hover:text-[#183629] hover:bg-[#244D38]/8 transition text-left"
                role="menuitem"
              >
                <HelpCircle className="w-4 h-4 text-[#244D38]" />
                <div className="flex-1">
                  <span>{t('userMenu.helpArchitecture')}</span>
                  <p className="text-[10px] font-normal text-stone-500">{t('landing.architectureBadge')}</p>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="my-1.5 border-t border-[#244D38]/10" />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-700 hover:bg-rose-50 transition text-xs font-semibold"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>{t('nav.signOut')}</span>
            </button>
          </div>
        )}
      </div>

      {/* About & Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-[#FAF9F3] text-[#183629] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#244D38]/15"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#244D38]/10 mb-4">
              <div className="flex items-center gap-3">
                <MastiCareLogoIcon size={38} theme="light" framed={true} />
                <div>
                  <h3 id="help-title" className="font-serif text-lg font-bold">
                    {t('userMenu.aboutTitle')}
                  </h3>
                  <p className="text-xs text-stone-500">{t('userMenu.aboutSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>
                {t('userMenu.aboutDesc')}
              </p>

              <div className="p-3.5 rounded-xl bg-[#244D38]/5 border border-[#244D38]/10 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-[#244D38]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('userMenu.demoNotice')}</span>
                </div>
                <p className="text-xs text-stone-600 leading-normal">
                  {t('userMenu.demoNoticeText')}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#244D38]/10 text-xs text-stone-500">
                <span>{t('userMenu.intelligentAnalytics')}</span>
                <span className="font-mono text-[11px] text-[#244D38] font-semibold">&copy; 2026 MastiCare AI</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white text-xs font-semibold transition"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserMenu;
