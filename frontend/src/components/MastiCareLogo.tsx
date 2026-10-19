import React from 'react';
import { Link } from 'react-router-dom';

export type LogoVariant = 'full' | 'horizontal' | 'stacked' | 'icon-only' | 'wordmark';
export type LogoTheme = 'dark' | 'light' | 'auto';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface MastiCareLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  showBadge?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  withLink?: boolean;
  to?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  framedIcon?: boolean;
  ariaLabel?: string;
}

export interface MastiCareLogoIconProps {
  size?: number | LogoSize;
  theme?: LogoTheme;
  framed?: boolean;
  className?: string;
  alt?: string;
}

/**
 * MastiCareLogoIcon:
 * Official MastiCare AI cow emblem with crescent leaf wreath.
 * Provides pixel-sharp rendering for avatars, badges, sidebars, and compact headers.
 */
export const MastiCareLogoIcon: React.FC<MastiCareLogoIconProps> = ({
  size = 'md',
  theme = 'light',
  framed = true,
  className = '',
  alt = 'MastiCare AI Emblem',
}) => {
  let pixelSize = 40;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 20;
        break;
      case 'sm':
        pixelSize = 28;
        break;
      case 'md':
        pixelSize = 38;
        break;
      case 'lg':
        pixelSize = 52;
        break;
      case 'xl':
        pixelSize = 72;
        break;
    }
  }

  const isDark = theme === 'dark';
  // Use dark-surface asset (warm ivory cow) when inside dark frame or on dark theme
  const iconSrc = framed || isDark ? '/masticare-logo-icon-dark.png' : '/masticare-logo-icon.png';

  if (framed) {
    // Sizing radius and padding proportion
    const radiusClass = pixelSize <= 28 ? 'rounded-lg' : pixelSize <= 44 ? 'rounded-xl' : 'rounded-2xl';
    const padding = Math.max(2, Math.round(pixelSize * 0.1));

    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 bg-[#183629] border border-[#A9BCA3]/25 shadow-2xs overflow-hidden ${radiusClass} ${className}`}
        style={{
          width: pixelSize,
          height: pixelSize,
          padding: `${padding}px`,
        }}
        aria-hidden="true"
      >
        <img
          src={iconSrc}
          alt={alt}
          className="w-full h-full object-contain filter drop-shadow-2xs select-none"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      style={{ width: pixelSize, height: pixelSize }}
      className={`shrink-0 object-contain select-none transition-transform duration-200 ${className}`}
      loading="eager"
      decoding="async"
      aria-hidden="true"
    />
  );
};

/**
 * MastiCareLogo:
 * Unified primary brand component for MastiCare AI.
 * Uses the official brand logo design consistently across all viewports and themes.
 */
export const MastiCareLogo: React.FC<MastiCareLogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  showBadge: _showBadge = true,
  showSubtitle: _showSubtitle,
  subtitleText: _subtitleText,
  withLink = false,
  to = '/',
  className = '',
  iconClassName = '',
  textClassName: _textClassName = '',
  framedIcon = false,
  ariaLabel = 'MastiCare AI Logo',
}) => {
  const isDark = theme === 'dark';

  // Responsive size definitions mapping to heights that maintain the 3.75:1 aspect ratio
  const sizeClasses = {
    xs: 'h-6 sm:h-7 max-w-[125px]',
    sm: 'h-8 sm:h-9 max-w-[165px]',
    md: 'h-10 sm:h-11 max-w-[210px]',
    lg: 'h-12 sm:h-14 max-w-[265px]',
    xl: 'h-16 sm:h-18 max-w-[340px]',
  }[size];

  // Pick official logo asset: dark background variant vs standard light background variant
  const logoSrc = isDark ? '/masticare-logo-dark.png' : '/masticare-logo.png';

  let content: React.ReactNode;

  if (variant === 'icon-only') {
    content = (
      <MastiCareLogoIcon
        size={size}
        theme={theme}
        framed={framedIcon}
        className={iconClassName}
      />
    );
  } else if (variant === 'stacked') {
    content = (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`} aria-label={ariaLabel}>
        <MastiCareLogoIcon
          size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'}
          theme={theme}
          framed={framedIcon}
          className={iconClassName}
        />
        <img
          src={logoSrc}
          alt="MastiCare AI"
          className={`${sizeClasses} object-contain object-center select-none`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  } else {
    // Default 'horizontal' / 'full'
    content = (
      <div className={`inline-flex items-center shrink-0 ${className}`} aria-label={ariaLabel}>
        <img
          src={logoSrc}
          alt="MastiCare AI — Precision Bovine Health & Telemetry"
          className={`${sizeClasses} w-auto object-contain object-left select-none transition-transform duration-200 group-hover:scale-[1.02]`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  if (withLink) {
    return (
      <Link
        to={to}
        className="group inline-flex items-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#A9BCA3] rounded-xl transition-all"
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default MastiCareLogo;
