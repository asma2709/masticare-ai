import React, { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import CowLoader from './CowLoader';

export const LoadingScreen: React.FC = () => {
  const { isLoading, progress, message, error, retry, stopLoading } = useLoading();
  const [shouldRender, setShouldRender] = useState<boolean>(isLoading);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Smooth fade-out exit transition to avoid jarring screen cuts
  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setIsFadingOut(false);
    } else {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-350 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={!isLoading}
    >
      <CowLoader
        message={message}
        progress={progress}
        error={error}
        onRetry={retry}
        onContinue={stopLoading}
        fullScreen={true}
      />
    </div>
  );
};

export default LoadingScreen;
