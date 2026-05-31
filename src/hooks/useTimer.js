import { useEffect } from 'react';
import i18n from '../i18n/i18n';

/**
 * Custom hook for timer functionality
 * Uses tab-safe timers (initialized in main.jsx) to ensure accurate timing
 * even when the browser tab is in the background
 */
export function useTimer(isRunning, timeRemaining, setTimeRemaining, onComplete) {
  useEffect(() => {
    if (!isRunning) return;

    // This setInterval uses tab-safe timers (via @vorthain/tab-safe-timers)
    // which continue running accurately when browser tabs are in the background
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, setTimeRemaining, onComplete]);
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && mins > 0) {
    return i18n.t('duration.hours_minutes', { hours, minutes: mins });
  }
  if (hours > 0) {
    return i18n.t('duration.hours_only', { hours });
  }
  return i18n.t('duration.minutes_only', { minutes: mins });
}

export function getPhaseLabel(phase) {
  switch (phase) {
    case 'focus': return i18n.t('phase.focus');
    case 'shortBreak': return i18n.t('phase.short_break');
    case 'longBreak': return i18n.t('phase.long_break');
    default: return phase;
  }
}
