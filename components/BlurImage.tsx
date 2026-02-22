import React, { useEffect, useRef, useState } from 'react';

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  showSkeleton?: boolean;
  enableLqip?: boolean;
  observerRootMargin?: string;
  observerThreshold?: number;
}

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const buildCloudinaryLqipUrl = (value: string) => {
  const input = String(value || '').trim();
  if (!isHttpUrl(input)) return '';

  try {
    const parsed = new URL(input);
    const marker = '/image/upload/';
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return '';

    const prefix = parsed.pathname.slice(0, markerIndex + marker.length);
    const suffix = parsed.pathname.slice(markerIndex + marker.length);
    if (!suffix) return '';

    parsed.pathname = `${prefix}f_auto,q_10,w_48,e_blur:900/${suffix}`;
    return parsed.toString();
  } catch {
    return '';
  }
};

const BlurImage: React.FC<BlurImageProps> = ({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  showSkeleton = true,
  enableLqip = true,
  observerRootMargin = '200px',
  observerThreshold = 0.01,
  ...rest
}) => {
  const normalizedSrc = String(src || '').trim();
  const isEager = loading === 'eager';
  const [isLoaded, setIsLoaded] = useState(!normalizedSrc);
  const [hasLqipError, setHasLqipError] = useState(false);
  const [isInView, setIsInView] = useState(isEager || !normalizedSrc);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const lqipSrc = enableLqip ? buildCloudinaryLqipUrl(normalizedSrc) : '';

  useEffect(() => {
    setIsLoaded(!normalizedSrc);
    setHasLqipError(false);
    setIsInView(isEager || !normalizedSrc);
  }, [normalizedSrc, isEager]);

  useEffect(() => {
    if (!normalizedSrc || isEager || isInView) return;
    if (typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const node = wrapperRef.current;
    if (!node) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: observerRootMargin,
        threshold: observerThreshold,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [normalizedSrc, isEager, isInView, observerRootMargin, observerThreshold]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onError?.(event);
  };

  return (
    <span ref={wrapperRef} className={`relative block overflow-hidden ${wrapperClassName}`}>
      {showSkeleton && !isLoaded ? (
        <span
          aria-hidden
          className={`absolute inset-0 bg-slate-200/70 dark:bg-slate-700/40 ${isInView ? 'animate-pulse' : ''}`}
        />
      ) : null}
      {isInView && !isLoaded && lqipSrc && !hasLqipError ? (
        <img
          aria-hidden
          src={lqipSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-90 transition-opacity duration-500"
          onError={() => setHasLqipError(true)}
        />
      ) : null}
      <img
        {...rest}
        src={isInView ? normalizedSrc : undefined}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-[filter,transform,opacity] duration-500 ${
          isLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-md scale-105 opacity-70'
        }`}
      />
    </span>
  );
};

export default BlurImage;
