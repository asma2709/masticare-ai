import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n';
import { useAuth } from '../context/AuthContext';

interface LanguageSelectorProps {
  variant?: 'nav' | 'compact' | 'footer';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'nav', className = '' }) => {
  const { i18n } = useTranslation();
  const { user, updateSettings } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangCode = (i18n.language?.split('-')[0] as LanguageCode) || 'en';
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = async (code: LanguageCode) => {
    setIsOpen(false);
    await i18n.changeLanguage(code);
    localStorage.setItem('masticare_language', code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
    }
    if (user) {
      try {
        await updateSettings({ language: code });
      } catch (err) {
        console.warn('Failed to sync language to user settings in database:', err);
      }
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
          variant === 'nav'
            ? 'bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white border border-white/15'
            : variant === 'footer'
            ? 'bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10'
            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 text-[#A9BCA3]" />
        <span>{currentLang.label}</span>
        <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-[#FAF9F3] text-[#183629] shadow-xl border border-[#244D38]/15 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-200/60 mb-1">
            Language / மொழி
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLangCode;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition text-left ${
                  isSelected
                    ? 'bg-[#244D38]/10 text-[#244D38] font-bold'
                    : 'text-stone-700 hover:bg-[#244D38]/5 hover:text-[#183629]'
                }`}
                role="menuitem"
              >
                <div>
                  <span className="block">{lang.label}</span>
                  <span className="block text-[10px] text-stone-400 font-normal">{lang.englishLabel}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#244D38]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
