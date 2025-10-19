"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// A lightweight top progress bar (inspired by nprogress behavior) without external deps.
export function RouteProgressBar({ height = 3, color = 'hsl(var(--primary))' }: { height?: number; color?: string }) {
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<number | null>(null);
  const growthRef = useRef<number | null>(null);
  const router = useRouter();

  const clearTimers = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (growthRef.current) window.clearInterval(growthRef.current);
    timerRef.current = null; growthRef.current = null;
  };

  // Simulate incremental progress until complete
  const start = () => {
    clearTimers();
    setActive(true);
    setWidth(0);
    // Give Next.js a tick in case of immediate completion
    timerRef.current = window.setTimeout(() => {
      setWidth(10);
      growthRef.current = window.setInterval(() => {
        setWidth(prev => {
          if (prev >= 94) return prev; // cap until finish
          // Ease out growth
            const delta = (100 - prev) * 0.07 + Math.random() * 1.5;
          return Math.min(prev + delta, 94);
        });
      }, 180);
    }, 30);
  };

  const finish = () => {
    clearTimers();
    setWidth(100);
    // Allow CSS transition to show completion
    timerRef.current = window.setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 350);
  };

  useEffect(() => {
    // Monkey patch push/replace/back navigations via router events are limited in app dir.
    // We can listen to focus/visibility and start on route transitions by patching router.push.
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;

  (router as any).push = (...args: any[]) => { start(); return (originalPush as any)(...args); };
  (router as any).replace = (...args: any[]) => { start(); return (originalReplace as any)(...args); };
  (router as any).back = (...args: any[]) => { start(); return (originalBack as any)(...args); };

    // Heuristic: finish when browser fires 'visibilitychange' back to visible or after network idle guess.
    const onComplete = () => finish();
    window.addEventListener('visibilitychange', onComplete);
    window.addEventListener('focus', onComplete);

    return () => {
      (router as any).push = originalPush;
      (router as any).replace = originalReplace;
      (router as any).back = originalBack;
      window.removeEventListener('visibilitychange', onComplete);
      window.removeEventListener('focus', onComplete);
      clearTimers();
    };
  }, [router]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${width}%`,
        height,
        background: color,
        zIndex: 9999,
        boxShadow: '0 0 8px -1px rgba(0,0,0,0.25)',
        transition: 'width 0.25s ease-out, opacity 0.3s ease',
        opacity: width >= 100 ? 0 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: 60,
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0))',
        filter: 'blur(4px)',
        transform: 'translateX(0)',
      }} />
    </div>
  );
}
