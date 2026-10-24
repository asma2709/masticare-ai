import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import MastiCareLogo from '../components/MastiCareLogo';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import GoogleOAuthGuideModal from '../components/GoogleOAuthGuideModal';

export const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const { register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSuccess, setGoogleSuccess] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check for configured Google Client ID
  const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleClientId = rawGoogleClientId.trim().replace(/^['"]|['"]$/g, '');
  const isGoogleConfigured =
    Boolean(googleClientId) &&
    googleClientId !== 'your-google-client-id.apps.googleusercontent.com' &&
    googleClientId.includes('.apps.googleusercontent.com');

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Real-time password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0);

  const getStrengthLabel = () => {
    if (!password) return { text: '', color: 'bg-stone-200', width: 'w-0' };
    if (strengthScore <= 1) return { text: t('auth.strength.weak'), color: 'bg-rose-500', width: 'w-1/4' };
    if (strengthScore === 2) return { text: t('auth.strength.fair'), color: 'bg-amber-500', width: 'w-2/4' };
    if (strengthScore === 3) return { text: t('auth.strength.good'), color: 'bg-emerald-500', width: 'w-3/4' };
    return { text: t('auth.strength.strong'), color: 'bg-emerald-600', width: 'w-full' };
  };

  const strength = getStrengthLabel();

  // Initialize official Google Identity Services if client ID is configured
  useEffect(() => {
    if (!isGoogleConfigured) return;

    let isMounted = true;

    const handleCredentialResponse = async (response: { credential?: string }) => {
      if (!isMounted) return;
      if (!response.credential) {
        setErrorMsg('Sign-up cancelled. Please try again.');
        return;
      }
      if (loading || googleLoading) return; // Prevent duplicate submissions

      setGoogleLoading(true);
      setErrorMsg(null);
      try {
        await googleLogin(response.credential);
        if (isMounted) {
          setGoogleSuccess(true);
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 350);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const error = err as { response?: { data?: { detail?: string } } };
          setErrorMsg(error.response?.data?.detail || 'Google sign-up failed. Please try again.');
          setGoogleLoading(false);
        }
      }
    };

    const renderGsiButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current && isMounted) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signup_with',
            shape: 'rectangular',
          });
        } catch (e) {
          console.warn('Google Identity Services button render error:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGsiButton();
    } else {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', renderGsiButton);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGsiButton;
        document.body.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isGoogleConfigured, googleClientId, googleLogin, navigate, loading, googleLoading]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg(t('auth.errors.enterName'));
      return;
    }
    if (!email.trim()) {
      setErrorMsg(t('auth.errors.enterEmail'));
      return;
    }
    if (password.length < 8) {
      setErrorMsg(t('auth.errors.passwordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.errors.passwordsMismatch'));
      return;
    }
    if (!agreeTerms) {
      setErrorMsg(t('auth.errors.agreeTerms'));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
      setSuccessMsg(t('common.save'));
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        error.response?.data?.detail || 'Registration failed. Please review your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden grid lg:grid-cols-12 min-h-[580px]">
        {/* LEFT PANEL: Clean Editorial Brand Visual */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#183629] text-white p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#183629]/90 via-[#183629]/75 to-[#12281e]" />

          {/* Background photograph */}
          <img
            src="/hero_pasture.jpg"
            alt="Dairy herd pasture"
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.42] contrast-[1.05]"
          />

          {/* Top: Logo */}
          <div className="relative z-10">
            <MastiCareLogo
              variant="horizontal"
              theme="dark"
              size="md"
              withLink={true}
              to="/"
            />
          </div>

          {/* Bottom: Editorial Copy */}
          <div className="relative z-10 space-y-3">
            <h2 className="font-serif text-3xl font-bold text-[#F7F6EF] leading-tight">
              {t('common.tagline')}
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed max-w-xs">
              {t('landing.description')}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Sign-Up Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <MastiCareLogo
              variant="horizontal"
              theme="light"
              size="md"
              withLink={true}
              to="/"
            />
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#183629]">
              {t('auth.createAccount')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t('auth.signUpSub')}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div
              className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div
              className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="signup-email"
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

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-stone-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-500">{strength.text}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#244D38]/20 focus:border-[#244D38] transition placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#244D38] focus:ring-[#244D38] border-stone-300"
                />
                <span className="text-xs text-stone-600 leading-tight">
                  {t('auth.termsAgreement')}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white font-semibold text-sm shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.creatingAccount')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.createAccountBtn')}</span>
                  <ArrowRight className="w-4 h-4 text-[#A9BCA3]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-1 border-t border-stone-200" />
            <span className="px-3 text-xs text-stone-400 font-medium">{t('auth.or')}</span>
            <div className="flex-1 border-t border-stone-200" />
          </div>

          {/* Google Sign Up */}
          <div className="flex flex-col items-center w-full">
            {isGoogleConfigured ? (
              <div className="relative w-full flex justify-center min-h-[44px] items-center">
                {(googleLoading || googleSuccess) && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 rounded-xl gap-2 text-xs font-semibold text-[#183629] border border-[#244D38]/20 shadow-xs animate-in fade-in">
                    {googleSuccess ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Account verified! Redirecting to dashboard...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#244D38]/30 border-t-[#244D38] rounded-full animate-spin" />
                        <span>Creating your account with Google...</span>
                      </div>
                    )}
                  </div>
                )}
                <div
                  ref={googleBtnRef}
                  className={`w-full flex justify-center ${
                    googleLoading || loading ? 'opacity-30 pointer-events-none' : ''
                  }`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowOAuthModal(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>{t('auth.continueWithGoogle')}</span>
              </button>
            )}
          </div>

          <GoogleOAuthGuideModal
            isOpen={showOAuthModal}
            onClose={() => setShowOAuthModal(false)}
          />

          {/* Footer Link to Sign In */}
          <div className="mt-6 text-center text-xs text-stone-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="font-semibold text-[#244D38] hover:text-[#183629] hover:underline"
            >
              {t('auth.signInLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
