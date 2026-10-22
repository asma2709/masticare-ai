import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Activity, ShieldCheck, HeartPulse } from 'lucide-react';
import MastiCareLogo from './MastiCareLogo';

export interface CowLoaderProps {
  message?: string;
  progress?: number;
  fullScreen?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CowLoader: React.FC<CowLoaderProps> = ({
  message,
  progress = 75,
  fullScreen = true,
  showProgress = true,
  size = 'md',
  className = '',
}) => {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState<string>('/cow_running_loop.webp');
  const [hasError, setHasError] = useState<boolean>(false);

  // Fallback chain: cow_running_loop.webp -> cow_running.webp -> cow_frame_1.png
  const handleImageError = () => {
    if (imageSrc === '/cow_running_loop.webp') {
      setImageSrc('/cow_running.webp');
    } else if (imageSrc === '/cow_running.webp') {
      setImageSrc('/cow_frame_1.png');
    } else {
      setHasError(true);
    }
  };

  // Dimensions based on size prop
  const cowSizes = {
    sm: 'w-36 h-28 sm:w-40 sm:h-32',
    md: 'w-48 h-36 sm:w-56 sm:h-44 md:w-64 md:h-50',
    lg: 'w-56 h-44 sm:w-68 sm:h-52 md:w-80 md:h-60',
  };

  const shadowSizes = {
    sm: 'w-24 sm:w-28 h-2.5',
    md: 'w-32 sm:w-40 md:w-44 h-3',
    lg: 'w-40 sm:w-48 md:w-56 h-3.5',
  };

  const displayMessage = message || t('loading.monitoring', 'Monitoring herd health…');

  const content = (
    <div className="relative z-10 flex flex-col items-center justify-between w-full h-full max-w-4xl mx-auto px-4 py-8 select-none">
      {/* Subtle organic ambient lighting */}
      <div className="absolute top-1/6 left-1/5 w-80 h-80 bg-[#244D38]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/5 right-1/5 w-96 h-96 bg-[#A9BCA3]/15 rounded-full blur-3xl pointer-events-none" />

      {/* TOP: HEADER & BRANDING */}
      <header className="flex flex-col items-center text-center mt-2 sm:mt-4">
        {/* Bovine Intel Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#244D38]/8 border border-[#244D38]/15 text-[#244D38] text-[11px] font-semibold tracking-wider uppercase mb-2 sm:mb-3 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#244D38] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#244D38]"></span>
          </span>
          <span>{t('loading.bovineIntel', 'Bovine Health Intelligence')}</span>
        </div>

        {/* MastiCare AI Logo */}
        <div className="my-1">
          <MastiCareLogo
            variant="horizontal"
            theme="light"
            size="md"
            showBadge={false}
            showSubtitle={false}
          />
        </div>

        <p className="mt-1 text-xs sm:text-sm font-medium text-[#244D38]/75 tracking-wide font-serif italic">
          “{t('loading.tagline', 'Early Detection & Predictive Mastitis Intelligence')}”
        </p>
      </header>

      {/* CENTER: SCENIC FARM PASTURE RUNWAY WITH RUNNING COW */}
      <div className="relative flex flex-col items-center justify-center my-auto w-full max-w-lg py-4">
        {/* Farm pasture backdrop illustration */}
        <div className="relative w-full flex flex-col items-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#FAF9F3] to-[#E8EFE6]/70 border border-[#244D38]/10 p-6 shadow-sm">
          {/* Subtle rolling hills SVG background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <svg
              className="absolute bottom-0 w-full h-24"
              viewBox="0 0 500 100"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back hill */}
              <path
                d="M0 60 Q 120 30, 250 55 T 500 40 L 500 100 L 0 100 Z"
                fill="#A9BCA3"
                fillOpacity="0.35"
              />
              {/* Front hill */}
              <path
                d="M0 75 Q 160 50, 320 70 T 500 65 L 500 100 L 0 100 Z"
                fill="#7E9576"
                fillOpacity="0.45"
              />
              {/* Wooden fence accent */}
              <line x1="80" y1="58" x2="80" y2="78" stroke="#244D38" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="120" y1="55" x2="120" y2="76" stroke="#244D38" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="160" y1="56" x2="160" y2="77" stroke="#244D38" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="75" y1="64" x2="165" y2="62" stroke="#244D38" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="75" y1="71" x2="165" y2="69" stroke="#244D38" strokeWidth="1" strokeOpacity="0.4" />
            </svg>
          </div>

          {/* Drifting farm clouds in sky */}
          <div className="absolute top-2 w-full flex justify-between px-6 pointer-events-none opacity-60">
            <div className="w-10 h-3 bg-white/80 rounded-full blur-[1px] animate-cloud-drift" />
            <div className="w-14 h-4 bg-white/70 rounded-full blur-[1px] animate-cloud-drift" style={{ animationDelay: '-4s' }} />
          </div>

          {/* Running Cow Container */}
          <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
            {/* Bobbing trot motion container */}
            <div className="animate-cow-trot flex flex-col items-center justify-center">
              {!hasError ? (
                <img
                  src={imageSrc}
                  alt="MastiCare AI Running Cow"
                  className={`${cowSizes[size]} object-contain filter drop-shadow-md pointer-events-none`}
                  onError={handleImageError}
                />
              ) : (
                /* Fallback SVG Cow Icon if images fail to load */
                <div className="w-32 h-24 flex items-center justify-center bg-[#244D38]/10 rounded-2xl border border-[#244D38]/20">
                  <HeartPulse className="w-12 h-12 text-[#244D38] animate-pulse" />
                </div>
              )}

              {/* Rhythmic contact shadow */}
              <div
                className={`${shadowSizes[size]} bg-[#183629]/25 rounded-full blur-[2px] animate-cow-shadow -mt-3`}
              />
            </div>

            {/* Drifting grass blades under hooves (running effect) */}
            <div className="relative w-48 h-3 mt-1 overflow-hidden pointer-events-none">
              <span className="absolute bottom-1 w-2 h-1 bg-[#244D38]/40 rounded-full animate-grass-drift-1" />
              <span className="absolute bottom-0.5 w-2.5 h-1 bg-[#7E9576]/50 rounded-full animate-grass-drift-2" />
              <span className="absolute bottom-1.5 w-1.5 h-1 bg-[#244D38]/30 rounded-full animate-grass-drift-3" />
            </div>
          </div>

          {/* Pasture ground track line */}
          <div className="w-48 sm:w-60 h-0.5 bg-gradient-to-r from-transparent via-[#244D38]/40 to-transparent mt-1" />

          {/* STATUS MESSAGE & SLIM PROGRESS BAR */}
          <div className="w-full mt-5 px-4 py-3.5 rounded-2xl bg-white/95 backdrop-blur-xs border border-[#244D38]/12 shadow-sm flex flex-col items-center">
            {/* Primary message */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#183629] text-center mb-2.5">
              <Droplets className="w-3.5 h-3.5 text-[#244D38] animate-pulse flex-shrink-0" />
              <span className="tracking-tight">{displayMessage}</span>
            </div>

            {/* Progress bar */}
            {showProgress && (
              <div className="w-full">
                <div className="w-full h-1.5 bg-[#F7F6EF] rounded-full overflow-hidden relative border border-[#244D38]/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#244D38] via-[#2F6147] to-[#A9BCA3] rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pasture-shimmer" />
                  </div>
                </div>

                {/* Progress metadata */}
                <div className="w-full flex justify-between items-center mt-2 text-[11px] text-[#244D38]/70 font-medium">
                  <span className="flex items-center gap-1 text-[#244D38]">
                    <Activity className="w-3 h-3 text-[#244D38]" />
                    <span>{t('loading.healthTelemetry', 'Herd Telemetry Sync')}</span>
                  </span>
                  <span className="font-bold text-[#183629] font-mono">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: PLATFORM DISCLAIMER */}
      <footer className="flex flex-col items-center text-center mb-2">
        <div className="inline-flex items-center gap-2 text-xs text-[#183629]/75 bg-white/80 px-4 py-1.5 rounded-full border border-[#244D38]/12 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#244D38] flex-shrink-0" />
          <span>{t('loading.researchFootnote', 'MastiCare AI • Predictive Dairy Wellness Platform')}</span>
        </div>
      </footer>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className={`relative flex items-center justify-center p-6 bg-[#F7F6EF] rounded-3xl border border-[#244D38]/10 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center overflow-hidden bg-[#F7F6EF] text-[#183629] ${className}`}
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      {content}
    </div>
  );
};

export default CowLoader;
