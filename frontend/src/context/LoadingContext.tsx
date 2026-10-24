import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../services/api';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
  isInitialLoaded: boolean;
  startLoading: (customMessage?: string) => void;
  stopLoading: () => void;
  updateProgress: (progress: number, message?: string) => void;
  triggerModuleTransition: (moduleMessage?: string, durationMs?: number) => void;
  retry: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(20);
  const [message, setMessage] = useState<string>('Preparing your farm dashboard…');
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const stopLoading = useCallback(() => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setIsInitialLoaded(true);
      setError(null);
    }, 150);
  }, []);

  const startLoading = useCallback((customMessage?: string) => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    setError(null);
    setProgress(25);
    setMessage(customMessage || 'Preparing your farm dashboard…');
    setIsLoading(true);

    // Auto-safety guard: never leave screen stuck indefinitely (max 4.5s)
    safetyTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      setIsInitialLoaded(true);
    }, 4500);
  }, []);

  const updateProgress = useCallback((newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  }, []);

  const triggerModuleTransition = useCallback((moduleMessage = 'Preparing your farm dashboard…', durationMs = 280) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    setMessage(moduleMessage);
    setProgress(40);
    setIsLoading(true);

    const progressMidTimer = setTimeout(() => {
      setProgress(95);
    }, Math.max(80, durationMs - 120));

    transitionTimerRef.current = setTimeout(() => {
      clearTimeout(progressMidTimer);
      setProgress(100);
      setIsLoading(false);
    }, durationMs);
  }, []);

  // Main hydration & telemetry probe
  const initializeApp = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setProgress(20);
    setMessage('Connecting to herd telemetry…');

    try {
      // Step 1: Probe backend simulation status
      await axios.get(`${API_BASE}/simulation/status`, { timeout: 2000 }).catch(() => null);

      if (!isMountedRef.current) return;
      setProgress(55);
      setMessage('Synchronizing herd health records…');

      // Step 2: Fetch herd cow list
      await axios.get(`${API_BASE}/cows`, { timeout: 2000 }).catch(() => null);

      if (!isMountedRef.current) return;
      setProgress(85);
      setMessage('Evaluating predictive risk models…');

      // Step 3: Fetch model metrics
      await axios.get(`${API_BASE}/model/metrics`, { timeout: 2000 }).catch(() => null);

      if (!isMountedRef.current) return;
      setProgress(100);
      setMessage('Preparing your farm dashboard…');

      // Smooth completion without artificial delay
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsInitialLoaded(true);
        }
      }, 150);
    } catch (err: any) {
      console.warn('Initial telemetry probe completed with fallback:', err);
      if (isMountedRef.current) {
        setError('Connection to backend telemetry took longer than expected.');
        setProgress(100);
        setMessage('Preparing your farm dashboard…');
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsLoading(false);
            setIsInitialLoaded(true);
          }
        }, 200);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    initializeApp();

    // Absolute safety timeout: Ensure loading screen NEVER blocks indefinitely (max 4.5s)
    const initSafetyTimer = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        console.info('Safety timeout reached, displaying dashboard.');
        setIsLoading(false);
        setIsInitialLoaded(true);
      }
    }, 4500);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initSafetyTimer);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [initializeApp]);

  const retry = useCallback(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        progress,
        message,
        error,
        isInitialLoaded,
        startLoading,
        stopLoading,
        updateProgress,
        triggerModuleTransition,
        retry,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

