import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Sparkles,
  Link2,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'MC';

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : 'Active Session';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg(t('auth.errors.enterName'));
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      setSuccessMsg(t('common.save'));
      setIsEditing(false);
      setImgError(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(error.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setAvatarUrl(user.avatar_url || '');
    setIsEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#244D38]/10 text-[#244D38] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#244D38]" />
          <span>{t('profile.headerBadge')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#183629]">
          {t('profile.title')}
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-8">
        {/* LEFT COLUMN: IDENTITY BADGE CARD */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#244D38]/10 flex flex-col items-center text-center">
            {/* Avatar container */}
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-[#183629] border-4 border-[#A9BCA3]/30 shadow-md flex items-center justify-center mb-5">
              {(isEditing ? avatarUrl : user.avatar_url) && !imgError ? (
                <img
                  src={isEditing ? avatarUrl : (user.avatar_url ?? undefined)}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-serif text-3xl font-bold text-[#FAF9F3] tracking-wider">
                  {initials}
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl font-bold text-[#183629]">{user.name}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{user.email}</p>

            {/* Auth Provider Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#244D38]/8 text-[#244D38] border border-[#244D38]/15">
              {user.auth_provider === 'google' ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{t('profile.googleVerified')}</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-[#244D38]" />
                  <span>{t('profile.emailVerified')}</span>
                </>
              )}
            </div>

            <div className="w-full border-t border-stone-200/80 my-5" />

            <div className="w-full space-y-2.5 text-xs text-left text-stone-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {t('profile.accountStatus')}
                </span>
                <span className="font-bold text-emerald-700">{t('common.active')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  {t('profile.registered')}
                </span>
                <span className="font-medium text-[#183629]">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS & EDIT FORM */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#244D38]/10">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/80 mb-6">
              <h3 className="font-serif text-xl font-bold text-[#183629]">
                {t('profile.accountInfo')}
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#244D38]/10 hover:bg-[#244D38]/15 text-[#244D38] text-xs font-semibold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t('profile.editProfile')}</span>
                </button>
              )}
            </div>

            {isEditing ? (
              /* EDIT MODE FORM */
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('profile.displayName')}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#244D38] text-sm text-[#183629]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('profile.avatarUrl')}
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value);
                        setImgError(false);
                      }}
                      placeholder={t('profile.avatarPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#244D38] text-sm text-[#183629]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('settings.account.emailLabel')}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-sm cursor-not-allowed"
                  />
                </div>

                {/* Save and Cancel buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('common.cancel')}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-[#A9BCA3]" />
                    )}
                    <span>{t('profile.saveChanges')}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE DETAILS */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      {t('profile.displayName')}
                    </span>
                    <span className="text-sm font-semibold text-[#183629] mt-0.5 block">
                      {user.name}
                    </span>
                  </div>
                  <UserIcon className="w-5 h-5 text-stone-300" />
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      {t('settings.account.emailLabel')}
                    </span>
                    <span className="text-sm font-semibold text-[#183629] mt-0.5 block">
                      {user.email}
                    </span>
                  </div>
                  <Mail className="w-5 h-5 text-stone-300" />
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      {t('profile.role')}
                    </span>
                    <span className="text-sm font-semibold text-[#183629] mt-0.5 block capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#244D38]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Status Footnote */}
      <div className="mt-8 text-center text-xs text-stone-400">
        {t('common.researchDisclaimer')}
      </div>
    </div>
  );
};

export default Profile;
