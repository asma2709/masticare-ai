import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  message: string;
  startLoading: (customMessage?: string) => void;
  stopLoading: () => void;
  updateProgress: (progress: number, message?: string) => void;
  isInitialLoaded: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const API_BASE = 'http://localhost:8000/api/v1';

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(15);
  const [message, setMessage] = useState<string>('Initializing MastiCare AI telemetry...');
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  const startLoading = useCallback((customMessage?: string) => {
    setProgress(20);
    if (customMessage) setMessage(customMessage);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setProgress(100);
    setMessage('Dashboard ready!');
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  }, []);

  const updateProgress = useCallback((newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  }, []);

  // Initial app hydration & data fetching
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const initializeApp = async () => {
      try {
        if (!isMounted) return;
        setProgress(25);
        setMessage('Connecting to IoT collar & milk sensors...');

        // Step 1: Check backend simulation status
        await axios.get(`${API_BASE}/simulation/status`, { timeout: 3000 }).catch(() => null);

        if (!isMounted) return;
        setProgress(60);
        setMessage('Synchronizing herd health data...');

        // Step 2: Fetch herd cow list
        await axios.get(`${API_BASE}/cows`, { timeout: 3000 }).catch(() => null);

        if (!isMounted) return;
        setProgress(85);
        setMessage('Validating predictive AI model...');

        // Step 3: Fetch model metrics
        await axios.get(`${API_BASE}/model/metrics`, { timeout: 3000 }).catch(() => null);

        if (!isMounted) return;
        setProgress(100);
        setMessage('Preparing your herd dashboard...');
      } catch (err) {
        console.warn('Initial telemetry probe completed with fallback:', err);
        if (isMounted) {
          setProgress(100);
          setMessage('Preparing your herd dashboard...');
        }
      } finally {
        if (isMounted) {
          // Guarantee a minimum pleasant duration (1.4s) so the animation isn't a jarring 30ms flash
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 1400 - elapsed);

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

    // Safety timeout: Ensure loading screen NEVER blocks indefinitely (max 5s)
    const safetyTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.info('Safety timeout reached, displaying dashboard.');
        setIsLoading(false);
        setIsInitialLoaded(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
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
