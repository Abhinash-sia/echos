'use client';

import React, { useEffect, useState } from 'react';

export interface CountdownTimerProps {
  targetDate: string | Date;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabels?: boolean;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(target: Date): TimeRemaining {
  const now = new Date().getTime();
  const targetTime = target.getTime();
  const totalMs = targetTime - now;

  if (totalMs <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

const emptySubscribe = () => () => {};

export function CountdownTimer({
  targetDate,
  onExpire,
  size = 'md',
  className = '',
  showLabels = true,
}: CountdownTimerProps) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const target = React.useMemo(() => new Date(targetDate), [targetDate]);
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeRemaining(target));

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeRemaining(target);
      setTimeLeft(updated);

      if (updated.isExpired) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [target, onExpire]);

  if (!mounted) {
    // Initial server render placeholder
    return (
      <div className={`inline-flex items-center gap-2 font-mono text-sm opacity-60 ${className}`}>
        <span>Calculating unlock horizon...</span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Unlock Time Reached</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: {
      box: 'px-2 py-1 min-w-[36px]',
      num: 'text-sm font-bold',
      label: 'text-[9px]',
      gap: 'gap-1.5',
    },
    md: {
      box: 'px-3 py-2 min-w-[52px]',
      num: 'text-lg font-bold',
      label: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      box: 'px-4 py-3 min-w-[68px]',
      num: 'text-2xl md:text-3xl font-extrabold',
      label: 'text-xs',
      gap: 'gap-3.5',
    },
  }[size];

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours.toString().padStart(2, '0') },
    { label: 'Min', value: timeLeft.minutes.toString().padStart(2, '0') },
    { label: 'Sec', value: timeLeft.seconds.toString().padStart(2, '0') },
  ];

  return (
    <div className={`flex items-center ${sizeClasses.gap} ${className}`}>
      {units.map((unit, idx) => (
        <React.Fragment key={unit.label}>
          <div className="flex flex-col items-center">
            <div
              className={`neu-inset rounded-lg text-center flex items-center justify-center border border-black/5 dark:border-white/5 bg-[var(--surface-color)] ${sizeClasses.box}`}
            >
              <span
                className={`font-mono text-[var(--foreground)] tracking-tight ${sizeClasses.num}`}
              >
                {unit.value}
              </span>
            </div>
            {showLabels && (
              <span
                className={`font-mono uppercase tracking-wider text-[var(--ink-muted)] mt-1 ${sizeClasses.label}`}
              >
                {unit.label}
              </span>
            )}
          </div>
          {idx < units.length - 1 && (
            <span className="text-[var(--ink-muted)] font-mono font-bold select-none mb-4">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
