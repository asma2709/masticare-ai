import React, { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import CowLoader from './CowLoader';

export const LoadingScreen: React.FC = () => {
  const { isLoading, progress, message } = useLoading();
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
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-450 ease-in-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={!isLoading}
    >
      <CowLoader
        message={message}
        progress={progress}
        fullScreen={true}
      />
    </div>
  );
};

export default LoadingScreen;
