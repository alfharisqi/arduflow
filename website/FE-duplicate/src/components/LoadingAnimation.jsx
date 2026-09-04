import { useEffect, useRef, useState } from 'react';

const LOADING_TEXT = 'Loading.....';
const LOADING_WORD = 'Loading';
const MAX_LOADING_DOTS = 5;
const DONE_TEXT = 'Done!';
const DONE_HOLD_MS = 2000;

function getReducedMotionPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getReducedMotionPreference);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(query.matches);

    handleChange();
    query.addEventListener?.('change', handleChange);

    return () => {
      query.removeEventListener?.('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

export function LoadingAnimation({
  isLoading,
  onDone,
  className = '',
  fullscreen = true,
  prompt = 'arduflow-user',
  pagePath,
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState('loading');
  const [visibleLength, setVisibleLength] = useState(1);
  const [dotCount, setDotCount] = useState(MAX_LOADING_DOTS);
  const hasCalledDone = useRef(false);
  const latestOnDone = useRef(onDone);

  useEffect(() => {
    latestOnDone.current = onDone;
  }, [onDone]);

  useEffect(() => {
    hasCalledDone.current = false;
    setPhase('loading');
    setVisibleLength(1);
    setDotCount(MAX_LOADING_DOTS);
  }, []);

  useEffect(() => {
    const targetText = phase === 'done' ? DONE_TEXT : LOADING_TEXT;

    if (visibleLength >= targetText.length) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => setVisibleLength((length) => Math.min(length + 1, targetText.length)),
      prefersReducedMotion ? 25 : 95
    );

    return () => window.clearTimeout(timer);
  }, [phase, prefersReducedMotion, visibleLength]);

  useEffect(() => {
    if (phase !== 'loading' || !isLoading || visibleLength < LOADING_TEXT.length) {
      return undefined;
    }

    const timer = window.setInterval(
      () => setDotCount((count) => (count + 1) % (MAX_LOADING_DOTS + 1)),
      prefersReducedMotion ? 120 : 420
    );

    return () => window.clearInterval(timer);
  }, [isLoading, phase, prefersReducedMotion, visibleLength]);

  useEffect(() => {
    if (phase !== 'loading' || isLoading || visibleLength < LOADING_TEXT.length) {
      return undefined;
    }

    setDotCount(MAX_LOADING_DOTS);

    const timer = window.setTimeout(() => {
      setPhase('done');
      setVisibleLength(1);
    }, prefersReducedMotion ? 50 : 300);

    return () => window.clearTimeout(timer);
  }, [isLoading, phase, prefersReducedMotion, visibleLength]);

  useEffect(() => {
    if (phase !== 'done' || visibleLength < DONE_TEXT.length || hasCalledDone.current) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (hasCalledDone.current) return;

      hasCalledDone.current = true;
      latestOnDone.current?.();
    }, DONE_HOLD_MS);

    return () => window.clearTimeout(timer);
  }, [phase, prefersReducedMotion, visibleLength]);

  const text = phase === 'done'
    ? DONE_TEXT.slice(0, visibleLength)
    : visibleLength < LOADING_TEXT.length
      ? LOADING_TEXT.slice(0, visibleLength)
      : `${LOADING_WORD}${'.'.repeat(dotCount)}`;
  const terminalPath = pagePath || (
    typeof window === 'undefined'
      ? '/arduflow.com/page'
      : `/arduflow.com${window.location.pathname || '/'}`
  );
  const classes = [
    'loading-animation',
    fullscreen ? 'loading-animation--fullscreen' : '',
    phase === 'done' ? 'is-done' : 'is-loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-live="polite" aria-label={text}>
      <div className="loading-animation__terminal">
        <div className="loading-animation__chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="loading-animation__line">
          <span className="loading-animation__prompt" aria-hidden="true">${prompt} {terminalPath} &gt;</span>
          <span className="loading-animation__text">{text}</span>
          <span className="loading-animation__cursor" aria-hidden="true">|</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingAnimation;
