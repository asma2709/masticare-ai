import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MastiCareLogo from '../components/MastiCareLogo';
import api from '../services/api';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Check,
} from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  // Step 1: Request reset instructions
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg(t('auth.errors.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setSuccessMsg(res.data?.message || 'Password reset instructions have been generated.');
      if (res.data?.dev_reset_token) {
        setDevToken(res.data.dev_reset_token);
        setToken(res.data.dev_reset_token);
      }
      setStep('reset');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(error.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit token and new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token.trim()) {
      setErrorMsg('Please enter the reset token.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg(t('auth.errors.passwordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t('auth.errors.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', {
        token: token.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccessMsg(res.data?.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(error.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200/80">
        <div className="flex justify-center mb-6">
          <MastiCareLogo variant="horizontal" theme="light" size="md" withLink={true} to="/" />
        </div>

        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#244D38]/10 text-[#244D38] flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#183629]">
            {step === 'request' ? t('auth.reset.titleRequest') : t('auth.reset.titleSet')}
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            {step === 'request'
              ? t('auth.reset.subRequest')
              : t('auth.reset.subSet')}
          </p>
        </div>

        {errorMsg && (
          <div
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in"
            role="alert"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMsg}</div>
          </div>
        )}

        {step === 'request' ? (
          /* STEP 1: REQUEST RESET TOKEN */
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition placeholder:text-stone-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white font-semibold text-sm shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('auth.reset.sendInstructions')}</span>
                  <ArrowRight className="w-4 h-4 text-[#A9BCA3]" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: ENTER TOKEN AND NEW PASSWORD */
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {devToken && (
              <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-[#244D38] shrink-0" />
                <span>{t('auth.reset.tokenAutoFilled')}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="reset-token"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.reset.tokenLabel')}
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('auth.reset.tokenPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 font-mono text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition"
              />
            </div>

            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.reset.newPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition placeholder:text-stone-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition placeholder:text-stone-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white font-semibold text-sm shadow-xs hover:shadow transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{t('auth.reset.updatePassword')}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 transition py-1 cursor-pointer"
            >
              {t('auth.reset.reEnterEmail')}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-stone-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244D38] hover:text-[#183629]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.reset.backToSignIn')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
