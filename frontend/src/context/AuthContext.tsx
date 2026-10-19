import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import i18n, { type LanguageCode } from '../i18n';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  auth_provider: 'email' | 'google' | 'both';
  is_verified: boolean;
  role: string;
  created_at: string;
  updated_at?: string;
  theme: 'light' | 'dark' | 'system';
  language?: LanguageCode;
  default_view: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  has_password?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<void>;
  updateSettings: (data: {
    theme?: 'light' | 'dark' | 'system';
    default_view?: string;
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    language?: LanguageCode;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Theme applier helper
export const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize theme from storage or default
  useEffect(() => {
    const savedTheme = (localStorage.getItem('masticare_theme') as 'light' | 'dark' | 'system') || 'system';
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = (localStorage.getItem('masticare_theme') as 'light' | 'dark' | 'system') || 'system';
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch current user on mount (restores session)
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.id) {
        setUser(response.data);
        if (response.data.theme) {
          localStorage.setItem('masticare_theme', response.data.theme);
          applyTheme(response.data.theme);
        }
        const currentLocal = localStorage.getItem('masticare_language') as LanguageCode;
        const userLanguage = response.data.language as LanguageCode;
        
        // Priority rule for language:
        // 1. If user has an explicit non-default language in their backend profile (ta, hi, te, ml), use it.
        // 2. If the user or guest explicitly chose a language stored in localStorage, use that over default 'en'.
        // 3. Prevent asynchronous session restoration from resetting a chosen language back to English.
        if (userLanguage && userLanguage !== 'en') {
          localStorage.setItem('masticare_language', userLanguage);
          i18n.changeLanguage(userLanguage);
          document.documentElement.lang = userLanguage;
        } else if (currentLocal && ['en', 'ta', 'hi', 'te', 'ml'].includes(currentLocal)) {
          i18n.changeLanguage(currentLocal);
          document.documentElement.lang = currentLocal;
          if (userLanguage !== currentLocal) {
            api.put('/api/auth/settings', { language: currentLocal }).catch(() => {});
          }
        } else if (userLanguage) {
          localStorage.setItem('masticare_language', userLanguage);
          i18n.changeLanguage(userLanguage);
          document.documentElement.lang = userLanguage;
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('masticare_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    });
    if (response.data?.token) {
      localStorage.setItem('masticare_token', response.data.token);
    }
    if (response.data?.user) {
      setUser(response.data.user);
      if (response.data.user.theme) {
        localStorage.setItem('masticare_theme', response.data.user.theme);
        applyTheme(response.data.user.theme);
      }
      const currentLocal = localStorage.getItem('masticare_language') as LanguageCode;
      const userLang = response.data.user.language as LanguageCode;
      const targetLang = (userLang && userLang !== 'en') ? userLang : (currentLocal || userLang || 'en');
      localStorage.setItem('masticare_language', targetLang);
      i18n.changeLanguage(targetLang);
      document.documentElement.lang = targetLang;
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const currentLang = (i18n.language?.split('-')[0] as LanguageCode) || 'en';
    const response = await api.post('/api/auth/register', {
      name,
      email,
      password,
      confirm_password: confirmPassword || password,
      language: currentLang,
    });
    if (response.data?.token) {
      localStorage.setItem('masticare_token', response.data.token);
    }
    if (response.data?.user) {
      setUser(response.data.user);
      if (response.data.user.theme) {
        localStorage.setItem('masticare_theme', response.data.user.theme);
        applyTheme(response.data.user.theme);
      }
      if (response.data.user.language) {
        localStorage.setItem('masticare_language', response.data.user.language);
        i18n.changeLanguage(response.data.user.language);
        document.documentElement.lang = response.data.user.language;
      }
    }
  };

  const googleLogin = async (credential: string) => {
    const response = await api.post('/api/auth/google', { credential });
    if (response.data?.token) {
      localStorage.setItem('masticare_token', response.data.token);
    }
    if (response.data?.user) {
      setUser(response.data.user);
      if (response.data.user.theme) {
        localStorage.setItem('masticare_theme', response.data.user.theme);
        applyTheme(response.data.user.theme);
      }
      if (response.data.user.language) {
        localStorage.setItem('masticare_language', response.data.user.language);
        i18n.changeLanguage(response.data.user.language);
        document.documentElement.lang = response.data.user.language;
      }
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem('masticare_token');
      setUser(null);
    }
  };

  const updateProfile = async (data: { name?: string; avatar_url?: string }) => {
    const response = await api.put('/api/auth/profile', data);
    if (response.data) {
      setUser((prev) => (prev ? { ...prev, ...response.data } : response.data));
    }
  };

  const updateSettings = async (data: {
    theme?: 'light' | 'dark' | 'system';
    default_view?: string;
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    language?: LanguageCode;
  }) => {
    const response = await api.put('/api/auth/settings', data);
    if (response.data) {
      setUser((prev) => (prev ? { ...prev, ...response.data } : response.data));
      if (data.theme) {
        localStorage.setItem('masticare_theme', data.theme);
        applyTheme(data.theme);
      }
      if (data.language) {
        localStorage.setItem('masticare_language', data.language);
        i18n.changeLanguage(data.language);
        document.documentElement.lang = data.language;
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword,
    });
  };

  const deleteAccount = async (password?: string) => {
    await api.post('/api/auth/account/delete', { password });
    localStorage.removeItem('masticare_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        updateSettings,
        changePassword,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
