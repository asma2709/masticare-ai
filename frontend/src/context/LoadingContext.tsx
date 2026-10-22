import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../services/api';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  message: string;
  startLoading: (customMessage?: string) => void;
  stopLoading: () => void;
  updateProgress: (progress: number, message?: string) => void;
  isInitialLoaded: boolean;
  triggerModuleTransition: (moduleMessage?: string, durationMs?: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(20);
  const [message, setMessage] = useState<string>('Monitoring herd health…');
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback((customMessage?: string) => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    setProgress(25);
    setMessage(customMessage || 'Monitoring herd health…');
    setIsLoading(true);

    // Auto-safety guard: never leave screen stuck indefinitely (max 4.5s)
    safetyTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 4500);
  }, []);

  const stopLoading = useCallback(() => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  const updateProgress = useCallback((newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  }, []);

  // Quick, smooth transition for major module switching (Dashboard, Cows, Simulation, Vet, Metrics)
  const triggerModuleTransition = useCallback((moduleMessage = 'Monitoring herd health…', durationMs = 460) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    setMessage(moduleMessage);
    setProgress(35);
    setIsLoading(true);

    const progressMidTimer = setTimeout(() => {
      setProgress(95);
    }, Math.max(120, durationMs - 160));

    transitionTimerRef.current = setTimeout(() => {
      clearTimeout(progressMidTimer);
      setProgress(100);
      setIsLoading(false);
    }, durationMs);
  }, []);

  // Expose helper on window during development for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__masticare_triggerTransition = (msg?: string, duration = 3000) => {
        triggerModuleTransition(msg, duration);
      };
    }
  }, [triggerModuleTransition]);

  // Initial app hydration & telemetry probe
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const initializeApp = async () => {
      try {
        if (!isMounted) return;
        setProgress(25);
        setMessage('Monitoring herd health…');

        // Step 1: Probe backend simulation status
        await axios.get(`${API_BASE}/simulation/status`, { timeout: 2500 }).catch(() => null);

        if (!isMounted) return;
        setProgress(60);
        setMessage('Synchronizing herd health records…');

        // Step 2: Fetch herd cow list
        await axios.get(`${API_BASE}/cows`, { timeout: 2500 }).catch(() => null);

        if (!isMounted) return;
        setProgress(85);
        setMessage('Evaluating predictive risk models…');

        // Step 3: Fetch model metrics
        await axios.get(`${API_BASE}/model/metrics`, { timeout: 2500 }).catch(() => null);

        if (!isMounted) return;
        setProgress(100);
        setMessage('Preparing your farm dashboard…');
      } catch (err) {
        console.warn('Initial telemetry probe completed with fallback:', err);
        if (isMounted) {
          setProgress(100);
          setMessage('Preparing your farm dashboard…');
        }
      } finally {
        if (isMounted) {
          // Guarantee a minimum pleasant duration (1.2s) so the running cow animation is appreciated
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 1200 - elapsed);

          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
              setIsInitialLoaded(true);
            }
          }, remainingDelay);
        }
      }
    };

    initializeApp();

    // Safety timeout: Ensure loading screen NEVER blocks indefinitely (max 4.5s)
    const initSafetyTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.info('Safety timeout reached, displaying dashboard.');
        setIsLoading(false);
        setIsInitialLoaded(true);
      }
    }, 4500);

    return () => {
      isMounted = false;
      clearTimeout(initSafetyTimer);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        progress,
        message,
        startLoading,
        stopLoading,
        updateProgress,
        isInitialLoaded,
        triggerModuleTransition,
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
