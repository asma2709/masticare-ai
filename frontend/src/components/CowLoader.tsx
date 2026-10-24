import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ShieldCheck, Check, RefreshCw, ArrowRight, Info } from 'lucide-react';
import MastiCareLogo from './MastiCareLogo';

export interface CowLoaderProps {
  message?: string;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
  onContinue?: () => void;
  fullScreen?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CowLoader: React.FC<CowLoaderProps> = ({
  message,
  progress = 80,
  error = null,
  onRetry,
  onContinue,
  fullScreen = true,
  showProgress = true,
  size: _size = 'md',
  className = '',
}) => {
  const { t } = useTranslation();
  const [showDelayedActions, setShowDelayedActions] = useState<boolean>(false);

  // If loading takes longer than 3.2 seconds, offer the user an immediate option to proceed
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayedActions(true);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const displayMessage = message || t('loading.preparing', 'Preparing your farm dashboard…');

  const content = (
    <div className="relative z-10 flex flex-col items-center justify-between w-full h-full max-w-xl mx-auto px-4 py-8 sm:py-12 select-none">
      {/* 1. TOP BRANDING & TAGLINE */}
      <header className="flex flex-col items-center text-center mt-2 sm:mt-4">
        {/* Quality Healthcare Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EFE6] border border-[#A9BCA3]/35 text-[#244D38] text-[11px] font-semibold tracking-wider uppercase mb-3 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#244D38] opacity-75 motion-reduce:hidden"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#244D38]"></span>
          </span>
          <span>{t('loading.bovineIntel', 'Precision Bovine Healthcare')}</span>
        </div>

        {/* MastiCare AI Official Logo */}
        <div className="my-1">
          <MastiCareLogo
            variant="horizontal"
            theme="light"
            size="md"
            showBadge={false}
            showSubtitle={false}
          />
        </div>

        {/* Required Tagline */}
        <p className="mt-1.5 font-serif italic text-base sm:text-lg text-[#244D38] font-medium tracking-wide">
          “{t('loading.tagline', 'Better Care. Healthier Herds.')}”
        </p>
      </header>

      {/* 2. CENTER: AUTHENTIC DAIRY PHOTOGRAPHY & STATUS CARD */}
      <div className="relative flex flex-col items-center justify-center my-auto w-full max-w-md py-4">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#244D38]/12 p-6 sm:p-8 shadow-xl shadow-[#183629]/6 flex flex-col items-center text-center">
          
          {/* Authentic Dairy Cow Photographic Portrait */}
          <div className="relative mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#244D38]/20 ring-4 ring-[#FAF9F3] shadow-md bg-stone-100">
              <img
                src="/cow_portrait.jpg"
                alt="Dairy cow in open pasture"
                className="w-full h-full object-cover object-center filter contrast-[1.03]"
                loading="eager"
              />
            </div>
            {/* Clinical health check badge */}
            <div
              className="absolute bottom-0 right-1 w-6 h-6 bg-[#244D38] rounded-full border-2 border-white flex items-center justify-center shadow-xs text-white"
              title="Autonomous telemetry check active"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Status Message */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#183629] mb-3">
            <Activity className="w-3.5 h-3.5 text-[#244D38] shrink-0 animate-pulse motion-reduce:animate-none" />
            <span className="tracking-tight">{displayMessage}</span>
          </div>

          {/* Thin, Elegant Progress Animation */}
          {showProgress && (
            <div className="w-full">
              <div className="w-full h-1.5 bg-[#E8EFE6] rounded-full overflow-hidden border border-[#244D38]/10 mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#244D38] via-[#2F6147] to-[#7E9576] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
                />
              </div>

              {/* Progress Metadata */}
              <div className="w-full flex justify-between items-center text-[11px] text-[#7E9576] font-medium px-0.5">
                <span>{t('loading.calibrating', 'Calibrating herd telemetry')}</span>
                <span className="font-mono font-bold text-[#183629]">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Error & Graceful Retry Action (if error occurred or taking longer) */}
          {(error || showDelayedActions) && (
            <div className="mt-4 pt-3.5 border-t border-[#244D38]/10 w-full flex flex-col items-center">
              {error ? (
                <p className="text-xs text-amber-800 font-medium mb-2">{error}</p>
              ) : (
                <p className="text-xs text-stone-600 mb-2 font-medium">Taking a moment to synchronize?</p>
              )}
              <div className="flex items-center gap-2">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#244D38] hover:bg-[#183629] text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('loading.retry', 'Retry')}</span>
                  </button>
                )}
                {onContinue && (
                  <button
                    type="button"
                    onClick={onContinue}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F3] hover:bg-[#E8EFE6] text-[#183629] text-xs font-semibold border border-[#244D38]/15 transition-colors"
                  >
                    <span>{t('loading.continue', 'Enter Dashboard')}</span>
                    <ArrowRight className="w-3 h-3 text-[#244D38]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Demo Data Transparency Footnote */}
          <div className="mt-5 pt-3.5 border-t border-[#244D38]/8 w-full flex items-center justify-center gap-1.5 text-[11px] text-[#244D38]/80 font-medium">
            <Info className="w-3 h-3 text-[#244D38] shrink-0" />
            <span>{t('loading.demoNotice', 'Demonstration Mode • Simulated Telemetry')}</span>
          </div>
        </div>
      </div>

      {/* 3. FOOTER: TRUST & PLATFORM TRANSPARENCY */}
      <footer className="flex flex-col items-center text-center mb-2">
        <div className="inline-flex items-center gap-2 text-xs text-[#183629]/75 bg-white/80 backdrop-blur-xs px-4 py-1.5 rounded-full border border-[#244D38]/10 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#244D38] shrink-0" />
          <span>{t('loading.researchFootnote', 'MastiCare AI • Precision Dairy Wellness Platform')}</span>
        </div>
      </footer>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className={`relative flex items-center justify-center p-6 bg-[#FAF9F3] rounded-3xl border border-[#244D38]/10 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center overflow-hidden bg-[#FAF9F3] text-[#183629] ${className}`}
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      {/* Natural farm landscape photographic backdrop */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/hero_pasture.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-20 filter saturate-[0.8] contrast-[1.02]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F3]/95 via-[#FAF9F3]/85 to-[#F7F6EF]/95" />
      </div>

      {content}
    </div>
  );
};

export default CowLoader;
