import { useEffect, useRef } from 'react';

import './loading-indicator.css';

const SIZE_CLASS = {
  sm: 'loading-indicator--sm',
  md: 'loading-indicator--md',
  lg: 'loading-indicator--lg',
};

export function LoadingIndicator({ type = 'line-spinner', size = 'md', label = 'Memuat', className = '' }) {
  const classes = [
    'loading-indicator',
    `loading-indicator--${type}`,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} role="status" aria-live="polite" aria-label={label}>
      <span className="loading-indicator__line" aria-hidden="true" />
    </span>
  );
}

export function LoadingIndicatorOverlay({
  isLoading,
  onDone,
  type = 'line-spinner',
  size = 'md',
  label = 'Memuat halaman',
}) {
  const hasCalledDone = useRef(false);
  const latestOnDone = useRef(onDone);

  useEffect(() => {
    latestOnDone.current = onDone;
  }, [onDone]);

  useEffect(() => {
    hasCalledDone.current = false;
  }, []);

  useEffect(() => {
    if (isLoading || hasCalledDone.current) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (hasCalledDone.current) return;

      hasCalledDone.current = true;
      latestOnDone.current?.();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className="loading-indicator-overlay">
      <LoadingIndicator type={type} size={size} label={label} />
    </div>
  );
}

export default LoadingIndicator;
