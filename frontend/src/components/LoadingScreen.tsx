import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoading } from '../context/LoadingContext';
import { Droplets, ShieldCheck, Activity } from 'lucide-react';
import MastiCareLogo from './MastiCareLogo';

export const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading, progress, message } = useLoading();
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Smooth fade-out exit transition
  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setIsFadingOut(false);
    } else {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center overflow-hidden bg-[#F7F6EF] text-[#183629] transition-opacity duration-500 ease-in-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {/* Subtle organic ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#244D38]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A9BCA3]/15 rounded-full blur-3xl pointer-events-none" />

      {/* TOP: BRANDING & TAGLINE */}
      <header className="relative z-10 pt-10 md:pt-14 px-6 flex flex-col items-center text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#244D38]/8 border border-[#244D38]/15 text-[#244D38] text-xs font-semibold tracking-wider uppercase mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#244D38] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#244D38]"></span>
          </span>
          {t('loading.bovineIntel')}
        </div>

        {/* Brand Logo Lockup */}
        <div className="my-1">
          <MastiCareLogo
            variant="horizontal"
            theme="light"
            size="lg"
            showBadge={false}
            showSubtitle={false}
          />
        </div>

        {/* Tagline */}
        <p className="mt-2 text-sm sm:text-base md:text-lg font-medium text-[#244D38]/80 tracking-wide font-serif italic">
          “{t('loading.tagline')}”
        </p>
      </header>

      {/* CENTER: SMALL STATIONARY RUNNING COW IN PLACE */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4">
        {/* Fixed Center Running Cow Container (NO HORIZONTAL TRAVEL) */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Stationary Trot Animation */}
          <div className="animate-stationary-trot flex flex-col items-center justify-center">
            {/* Small animated running cow with cycling legs */}
            <img
              src="/cow_running_loop.webp"
              alt="MastiCare AI Running Dairy Cow"
              className="w-44 h-36 sm:w-48 sm:h-38 md:w-52 md:h-42 object-contain filter drop-shadow-sm pointer-events-none"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = '/cow_frame_1.png';
              }}
            />

            {/* Stable pulsing contact shadow directly under cow */}
            <div className="w-28 sm:w-32 md:w-36 h-2.5 sm:h-3 bg-[#183629]/25 rounded-full blur-[2.5px] animate-stationary-shadow mt-[-10px]" />
          </div>
        </div>

        {/* Ground grass accent marker */}
        <div className="w-44 sm:w-52 h-0.5 bg-gradient-to-r from-transparent via-[#A9BCA3]/50 to-transparent mt-2" />

        {/* LOADING INDICATOR & STATUS MESSAGE */}
        <div className="w-80 sm:w-96 mt-6 px-5 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#244D38]/10 shadow-lg shadow-[#183629]/5 flex flex-col items-center">
          {/* Status Message */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#183629] text-center mb-2.5">
            <Droplets className="w-3.5 h-3.5 text-[#244D38] animate-pulse" />
            <span>{message || t('loading.connecting')}</span>
          </div>

          {/* Slim Progress Bar */}
          <div className="w-full h-1.5 bg-[#F7F6EF] rounded-full overflow-hidden relative border border-[#244D38]/10">
            <div
              className="h-full bg-gradient-to-r from-[#244D38] via-[#2F6147] to-[#A9BCA3] rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Telemetry info */}
          <div className="w-full flex justify-between items-center mt-2.5 text-[11px] text-[#244D38]/70 font-medium">
            <span className="flex items-center gap-1 text-[#244D38]">
              <Activity className="w-3 h-3" />
              {t('loading.liveFeeds')}
            </span>
            <span className="font-bold text-[#183629] font-mono">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* FOOTER: RESEARCH PLATFORM DISCLAIMER */}
      <footer className="relative z-10 pb-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-[#183629]/75 bg-white/80 px-4 py-1.5 rounded-full border border-[#244D38]/15 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#244D38]" />
          <span>{t('loading.researchFootnote')}</span>
        </div>
      </footer>
    </div>
  );
};

export default LoadingScreen;
