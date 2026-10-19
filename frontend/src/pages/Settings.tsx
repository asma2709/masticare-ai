import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n';
import {
  User as UserIcon,
  Palette,
  Sliders,
  Shield,
  KeyRound,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Trash2,
  Clock,
  Globe,
  Lock,
  Sparkles,
  AlertTriangle,
  Check,
} from 'lucide-react';
import MastiCareLogo from '../components/MastiCareLogo';

interface SessionItem {
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active: string;
  is_current: boolean;
}

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateSettings, changePassword, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'preferences' | 'language' | 'privacy'>('account');

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(user?.theme || 'system');

  // Preferences state
  const [defaultView, setDefaultView] = useState(user?.default_view || 'dashboard');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when user updates
  useEffect(() => {
    if (user) {
      setTheme(user.theme || 'system');
      setDefaultView(user.default_view || 'dashboard');
      setNotificationsEnabled(user.notifications_enabled ?? true);
      setEmailNotifications(user.email_notifications ?? false);
    }
  }, [user]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/api/auth/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load sessions when privacy tab is opened
  useEffect(() => {
    if (activeTab === 'privacy') {
      fetchSessions();
    }
  }, [activeTab]);

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const notifyError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  };

  // Appearance theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      await updateSettings({ theme: newTheme });
      notifySuccess(t('common.save') + ` (${newTheme})`);
    } catch {
      notifyError('Failed to save theme setting.');
    }
  };

  // Language change
  const handleLanguageChange = async (code: LanguageCode) => {
    try {
      await i18n.changeLanguage(code);
      localStorage.setItem('masticare_language', code);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = code;
      }
      if (user) {
        await updateSettings({ language: code });
      }
      notifySuccess(i18n.t('settings.language.updated'));
    } catch (err) {
      console.warn('Language update error:', err);
      notifyError('Failed to update language.');
    }
  };

  // Preferences change
  const handlePreferenceChange = async (updates: {
    default_view?: string;
    notifications_enabled?: boolean;
    email_notifications?: boolean;
  }) => {
    try {
      await updateSettings(updates);
      notifySuccess(t('common.save'));
    } catch {
      notifyError('Failed to save preferences.');
    }
  };

  // Change password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      notifyError(t('auth.errors.passwordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      notifyError(t('auth.errors.passwordsMismatch'));
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      notifySuccess(t('common.save'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      notifyError(error.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  // Revoke all sessions
  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Are you sure you want to sign out of all active sessions across all devices?')) {
      return;
    }
    try {
      await api.post('/api/auth/sessions/revoke-all');
      await logout();
      navigate('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      notifyError(error.response?.data?.detail || 'Failed to revoke sessions.');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount(deleteConfirmPassword);
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      notifyError(error.response?.data?.detail || 'Account deletion failed.');
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) return null;

  const currentLangCode = (i18n.language?.split('-')[0] as LanguageCode) || 'en';

  const tabs = [
    { id: 'account' as const, label: t('settings.tabs.account'), icon: UserIcon },
    { id: 'appearance' as const, label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'preferences' as const, label: t('settings.tabs.preferences'), icon: Sliders },
    { id: 'language' as const, label: t('settings.tabs.language'), icon: Globe },
    { id: 'privacy' as const, label: t('settings.tabs.privacy'), icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#244D38]/10 text-[#244D38] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#244D38]" />
          <span>{t('settings.headerBadge')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#183629]">
          {t('settings.title')}
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      {/* Tabbed layout container */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#244D38]/10 overflow-hidden grid md:grid-cols-12 min-h-[500px]">
        {/* SIDEBAR TABS */}
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-stone-200/80 p-4 sm:p-6 bg-stone-50/60">
          <nav className="space-y-1.5" aria-label="Settings navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition text-left ${
                    isActive
                      ? 'bg-[#244D38] text-white shadow-xs'
                      : 'text-stone-600 hover:text-[#183629] hover:bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#A9BCA3]' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-10 pt-6 border-t border-stone-200/60 hidden md:flex flex-col items-center text-center">
            <MastiCareLogo variant="horizontal" theme="light" size="xs" />
            <span className="text-[10px] text-stone-400 mt-2 font-mono">v1.0.4 &bull; Bovine AI Telemetry</span>
          </div>
        </div>

        {/* TAB PANELS */}
        <div className="md:col-span-8 p-6 sm:p-8">
          {/* 1. ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-stone-200/80 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#183629]">{t('settings.account.title')}</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('settings.account.sub')}
                </p>
              </div>

              {/* Account summary cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    {t('profile.displayName')}
                  </span>
                  <span className="text-sm font-bold text-[#183629] mt-0.5 block">{user.name}</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    {t('settings.account.emailLabel')}
                  </span>
                  <span className="text-sm font-bold text-[#183629] mt-0.5 block">{user.email}</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      {t('settings.account.authProvider')}
                    </span>
                    <span className="text-xs font-semibold text-stone-700 mt-0.5 block">
                      {user.auth_provider === 'google' || user.auth_provider === 'both'
                        ? t('profile.googleVerified')
                        : t('profile.emailVerified')}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.auth_provider === 'google' || user.auth_provider === 'both'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {t('settings.account.verified')}
                  </span>
                </div>
              </div>

              {/* CHANGE PASSWORD SECTION */}
              <div className="pt-4 border-t border-stone-200/80">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-[#244D38]" />
                  <h3 className="text-sm font-bold text-[#183629]">
                    {t('settings.security.changePassword')}
                  </h3>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                  {user.has_password && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        {t('settings.security.currentPassword')}
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#244D38] text-xs text-[#183629]"
                      />
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        {t('settings.security.newPassword')}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#244D38] text-xs text-[#183629]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        {t('settings.security.confirmPassword')}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#244D38] text-xs text-[#183629]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="px-4 py-2 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {pwdLoading ? t('common.loading') : t('settings.security.updatePasswordBtn')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-stone-200/80 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#183629]">{t('settings.appearance.title')}</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('settings.appearance.sub')}
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* Light Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-5 rounded-2xl border-2 text-center transition flex flex-col items-center gap-3 ${
                    theme === 'light'
                      ? 'border-[#244D38] bg-[#244D38]/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#183629] block">{t('settings.appearance.light')}</span>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">
                      {t('settings.appearance.lightSub')}
                    </span>
                  </div>
                  {theme === 'light' && (
                    <span className="text-xs font-bold text-[#244D38] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.active')}
                    </span>
                  )}
                </button>

                {/* Dark Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-5 rounded-2xl border-2 text-center transition flex flex-col items-center gap-3 ${
                    theme === 'dark'
                      ? 'border-[#244D38] bg-[#244D38]/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#183629] text-[#FAF9F3] flex items-center justify-center">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#183629] block">{t('settings.appearance.dark')}</span>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">
                      {t('settings.appearance.darkSub')}
                    </span>
                  </div>
                  {theme === 'dark' && (
                    <span className="text-xs font-bold text-[#244D38] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.active')}
                    </span>
                  )}
                </button>

                {/* System Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`p-5 rounded-2xl border-2 text-center transition flex flex-col items-center gap-3 ${
                    theme === 'system'
                      ? 'border-[#244D38] bg-[#244D38]/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#183629] block">{t('settings.appearance.system')}</span>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">
                      {t('settings.appearance.systemSub')}
                    </span>
                  </div>
                  {theme === 'system' && (
                    <span className="text-xs font-bold text-[#244D38] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.active')}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-stone-200/80 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#183629]">{t('settings.preferences.title')}</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('settings.preferences.sub')}
                </p>
              </div>

              {/* Default landing view */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {t('settings.preferences.defaultView')}
                </label>
                <select
                  value={defaultView}
                  onChange={(e) => {
                    setDefaultView(e.target.value);
                    handlePreferenceChange({ default_view: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-[#183629] focus:outline-none focus:ring-2 focus:ring-[#244D38]"
                >
                  <option value="dashboard">{t('settings.preferences.viewDashboard')}</option>
                  <option value="cows">{t('settings.preferences.viewCows')}</option>
                  <option value="simulation">{t('settings.preferences.viewSimulation')}</option>
                  <option value="vet">{t('settings.preferences.viewVet')}</option>
                  <option value="metrics">{t('nav.metrics')}</option>
                </select>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {t('settings.preferences.notifications')}
                </h3>

                {/* In-app alerts */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#183629] block">
                      {t('settings.preferences.notifications')}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {t('settings.preferences.notificationsSub')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => {
                        setNotificationsEnabled(e.target.checked);
                        handlePreferenceChange({ notifications_enabled: e.target.checked });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244D38]"></div>
                  </label>
                </div>

                {/* Email notifications */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#183629] block">
                      {t('settings.preferences.emailAlerts')}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {t('settings.preferences.emailAlertsSub')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => {
                        setEmailNotifications(e.target.checked);
                        handlePreferenceChange({ email_notifications: e.target.checked });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244D38]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 4. DEDICATED LANGUAGE TAB */}
          {activeTab === 'language' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-stone-200/80 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#183629]">
                  {t('settings.language.title')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('settings.language.subtitle')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#244D38]/5 border border-[#244D38]/10 text-xs text-stone-700 leading-relaxed">
                {t('settings.language.description')}
              </div>

              {/* Language selection list with native names */}
              <div className="space-y-2.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLangCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#244D38] bg-[#244D38]/5 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-[#244D38] text-white'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-[#183629]">
                              {lang.label}
                            </span>
                            <span className="text-xs text-stone-500 font-medium">
                              — {lang.englishLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            {lang.code === 'en'
                              ? 'Default language for all standard interfaces'
                              : `Fully localized scripts and regional veterinary terminology`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#244D38] text-white text-xs font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('common.active')}</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-stone-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. PRIVACY & SECURITY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-stone-200/80 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#183629]">
                  {t('settings.security.title')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('settings.security.sub')}
                </p>
              </div>

              {/* Active Sessions List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {t('settings.security.activeSessions')}
                  </h3>
                  <button
                    onClick={handleRevokeAllSessions}
                    className="text-xs text-rose-700 hover:text-rose-900 font-semibold hover:underline"
                  >
                    {t('settings.security.revokeAll')}
                  </button>
                </div>

                {sessionsLoading ? (
                  <div className="p-6 text-center text-xs text-stone-400">{t('common.loading')}</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500 text-center">
                    {t('settings.security.currentSession')}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.map((sess) => (
                      <div
                        key={sess.session_id}
                        className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-stone-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#183629]">
                                {sess.ip_address}
                              </span>
                              {sess.is_current && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {t('settings.security.currentSession')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 block truncate max-w-xs">
                              {sess.user_agent}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sess.last_active
                              ? new Date(sess.last_active).toLocaleDateString()
                              : t('common.active')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign out button */}
              <div className="pt-2">
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
                >
                  <LogOut className="w-4 h-4 text-stone-500" />
                  <span>{t('nav.signOut')}</span>
                </button>
              </div>

              {/* DANGER ZONE: ACCOUNT DELETION */}
              <div className="pt-6 border-t border-rose-100">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{t('settings.security.dangerZone')} &bull; {t('settings.security.deleteAccountBtn')}</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {t('settings.security.dangerZoneSub')}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('settings.security.deleteAccountBtn')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#183629]">{t('settings.security.deleteAccountBtn')}?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              {t('settings.security.dangerZoneSub')}
            </p>

            {user.has_password && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('settings.security.currentPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={deleteConfirmPassword}
                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-[#183629] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
              >
                {deleteLoading ? t('common.loading') : t('settings.security.deleteAccountBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Prototype Footnote */}
      <div className="mt-8 text-center text-xs text-stone-400">
        {t('common.researchDisclaimer')}
      </div>
    </div>
  );
};

export default Settings;
