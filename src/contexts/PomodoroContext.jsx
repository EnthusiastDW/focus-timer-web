import { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { playSound, playNotification, requestNotificationPermission } from '../utils/audio';

const PomodoroContext = createContext();

const SETTINGS_KEY = 'focus-timer-settings';
const HISTORY_KEY = 'focus-timer-history';
const TIMER_STATE_KEY = 'focus-timer-state';

const defaultSettings = {
  focusTime: 25 * 60,
  shortBreakTime: 5 * 60,
  longBreakTime: 15 * 60,
  pomodoroRounds: 4,
  autoSwitch: true,
  focusSound: 'default',
  breakSound: 'default',
  soundRepeatCount: 2,
  mode: 'free',
  limitedTime: 120,
  notifications: true,
};

function calculateLimitedSchedule(totalSeconds, settings) {
  const schedule = [];
  let remaining = totalSeconds;
  let round = 1;

  while (remaining > 0) {
    const isLongBreakRound = round > 1 && (round - 1) % settings.pomodoroRounds === 0;

    if (remaining <= settings.focusTime) {
      schedule.push({
        round,
        phase: 'focus',
        duration: remaining,
        isLast: true,
      });
      remaining = 0;
    } else {
      schedule.push({
        round,
        phase: 'focus',
        duration: settings.focusTime,
        isLast: false,
      });
      remaining -= settings.focusTime;

      if (remaining > 0) {
        const breakTime = isLongBreakRound ? settings.longBreakTime : settings.shortBreakTime;
        const actualBreak = Math.min(breakTime, remaining);
        schedule.push({
          round,
          phase: isLongBreakRound ? 'longBreak' : 'shortBreak',
          duration: actualBreak,
          isLast: remaining <= breakTime,
        });
        remaining -= actualBreak;
      }
    }

    if (remaining > 0) {
      round++;
    }
  }

  if (schedule.length > 0) {
    schedule[schedule.length - 1].isLast = true;
  }

  return schedule;
}

function getPhaseDuration(phase, settings) {
  switch (phase) {
    case 'focus': return settings.focusTime;
    case 'shortBreak': return settings.shortBreakTime;
    case 'longBreak': return settings.longBreakTime;
    default: return settings.focusTime;
  }
}

function initialPhaseState(settings, limitedSchedule) {
  if (settings.mode === 'limited' && limitedSchedule && limitedSchedule.length > 0) {
    return {
      status: 'idle',
      phase: limitedSchedule[0].phase,
      timeRemaining: limitedSchedule[0].duration,
      currentRound: limitedSchedule[0].round,
      scheduleIndex: 0,
      taskId: null,
    };
  }
  return {
    status: 'idle',
    phase: 'focus',
    timeRemaining: settings.focusTime,
    currentRound: 1,
    scheduleIndex: 0,
    taskId: null,
  };
}

function computeNextPhase(state, settings, limitedSchedule) {
  if (settings.mode === 'limited' && limitedSchedule) {
    const nextIndex = state.scheduleIndex + 1;
    if (nextIndex >= limitedSchedule.length) return null;
    const item = limitedSchedule[nextIndex];
    return {
      phase: item.phase,
      duration: item.duration,
      round: item.round,
      scheduleIndex: nextIndex,
      autoStart: settings.autoSwitch,
    };
  }

  if (state.phase === 'focus') {
    const isLongBreak = state.currentRound % settings.pomodoroRounds === 0;
    return {
      phase: isLongBreak ? 'longBreak' : 'shortBreak',
      duration: isLongBreak ? settings.longBreakTime : settings.shortBreakTime,
      round: state.currentRound,
      scheduleIndex: 0,
      autoStart: settings.autoSwitch,
    };
  }

  return {
    phase: 'focus',
    duration: settings.focusTime,
    round: state.currentRound + 1,
    scheduleIndex: 0,
    autoStart: settings.autoSwitch,
  };
}

function timerReducer(state, action) {
  switch (action.type) {
    case 'START':
      if (state.status === 'running') return state;
      return { ...state, status: 'running' };

    case 'PAUSE':
      if (state.status !== 'running') return state;
      return { ...state, status: 'paused' };

    case 'TICK':
      if (state.status !== 'running') return state;
      return { ...state, timeRemaining: state.timeRemaining - 1 };

    case 'COMPLETE':
      if (state.status === 'idle') return state;
      return { ...state, status: 'idle', timeRemaining: 0 };

    case 'NEXT_PHASE': {
      const p = action.payload;
      if (state.status !== 'idle' || state.timeRemaining !== 0) return state;
      return {
        ...state,
        status: p.autoStart ? 'running' : 'idle',
        phase: p.phase,
        timeRemaining: p.duration,
        currentRound: p.round,
        scheduleIndex: p.scheduleIndex,
      };
    }

    case 'RESET':
      return action.payload;

    case 'SET_TASK_ID':
      return { ...state, taskId: action.payload };

    case 'SYNC_TIME':
      if (state.status !== 'running') return state;
      return { ...state, timeRemaining: Math.max(0, action.payload) };

    default:
      return state;
  }
}

function loadSavedTimerState(settings, limitedSchedule) {
  const saved = getStorageItem(TIMER_STATE_KEY, null);
  if (saved && (saved.status === 'running' || saved.status === 'paused')) {
    const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
    const remaining = Math.max(0, saved.timeRemaining - elapsed);
    if (remaining > 0) {
      return {
        status: 'paused',
        phase: saved.phase || 'focus',
        timeRemaining: remaining,
        currentRound: saved.currentRound || 1,
        scheduleIndex: saved.scheduleIndex || 0,
        taskId: saved.taskId || null,
      };
    }
    // Timer expired while page was closed — save partial focus time
    if (saved.phase === 'focus' && elapsed > 0) {
      const phaseDuration = getPhaseDuration('focus', settings);
      const focusedTime = Math.min(phaseDuration, elapsed);
      const date = new Date().toLocaleDateString('zh-CN');
      setStorageItem('focus-timer-pending-record', {
        date,
        taskId: saved.taskId || 'unassigned',
        duration: focusedTime,
      });
    }
  }
  return initialPhaseState(settings, limitedSchedule);
}

export function PomodoroProvider({ children }) {
  const [settings, setSettings] = useState(() => getStorageItem(SETTINGS_KEY, defaultSettings));
  const [history, setHistory] = useState(() => {
    const savedHistory = getStorageItem(HISTORY_KEY, []);
    return savedHistory.map(record => ({
      ...record,
      date: record.date || new Date().toLocaleDateString('zh-CN'),
      taskId: record.taskId || 'unassigned',
    }));
  });

  const limitedSchedule = useMemo(() => {
    if (settings.mode !== 'limited') return null;
    return calculateLimitedSchedule(settings.limitedTime * 60, settings);
  }, [settings.mode, settings.limitedTime, settings.focusTime, settings.shortBreakTime, settings.longBreakTime, settings.pomodoroRounds]);

  const [timerState, dispatch] = useReducer(
    timerReducer,
    [settings, limitedSchedule],
    ([s, ls]) => loadSavedTimerState(s, ls)
  );

  const lastRecordedSecondsRef = useRef(0);
  const recordingGuardRef = useRef(false);

  // ── Today date tracking (cross-day safe) ──
  // Ensures totalDailyTime/dailyTaskStats refresh when the date rolls over
  // without requiring a page refresh.

  const [today, setToday] = useState(() => new Date().toLocaleDateString('zh-CN'));

  useEffect(() => {
    const updateToday = () => {
      setToday(prev => {
        const next = new Date().toLocaleDateString('zh-CN');
        return prev !== next ? next : prev;
      });
    };

    // Re-check when the tab becomes visible (user returns after midnight)
    document.addEventListener('visibilitychange', updateToday);

    // Periodic check (every 30s) to catch date change while page stays visible
    const id = setInterval(updateToday, 30000);

    requestNotificationPermission();

    return () => {
      document.removeEventListener('visibilitychange', updateToday);
      clearInterval(id);
    };
  }, []);

  // ── Chrome extension cross-device sync ──
  // Sync settings via chrome.storage.sync so they persist across devices

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        setSettings(prev => ({ ...prev, ...result.settings }));
      }
    });
  }, []);

  // ── Persistence effects ──

  useEffect(() => {
    setStorageItem(SETTINGS_KEY, settings);

    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      chrome.storage.sync.set({ settings }).catch(() => {});
    }
  }, [settings]);

  useEffect(() => {
    setStorageItem(HISTORY_KEY, history);

    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      chrome.storage.local.set({ history }).catch(() => {});
    }
  }, [history]);

  useEffect(() => {
    if (timerState.status === 'running' || timerState.status === 'paused') {
      setStorageItem(TIMER_STATE_KEY, {
        status: timerState.status,
        phase: timerState.phase,
        timeRemaining: timerState.timeRemaining,
        currentRound: timerState.currentRound,
        scheduleIndex: timerState.scheduleIndex,
        taskId: timerState.taskId,
        savedAt: Date.now(),
      });
    } else {
      localStorage.removeItem(TIMER_STATE_KEY);
    }
  }, [timerState.status, timerState.phase, timerState.timeRemaining, timerState.currentRound, timerState.scheduleIndex, timerState.taskId]);

  // ── Timer tick effect ──

  useEffect(() => {
    if (timerState.status !== 'running') return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [timerState.status]);

  // ── Wall-clock sync: handle tab background throttling ──
  // When the tab is hidden, Chrome throttles setInterval so ticks are lost.
  // Track the real session start time and correct on visibility change.

  const timerSessionRef = useRef(null);
  const timeRemainingRef = useRef(timerState.timeRemaining);

  // Keep a mutable ref to the latest timeRemaining for event handlers
  useEffect(() => {
    timeRemainingRef.current = timerState.timeRemaining;
  });

  // Record session start whenever the timer transitions to 'running'
  useEffect(() => {
    if (timerState.status === 'running') {
      timerSessionRef.current = {
        startTime: Date.now(),
        startTimeRemaining: timerState.timeRemaining,
      };
    } else if (timerState.status !== 'paused') {
      timerSessionRef.current = null;
    }
  }, [timerState.status]);

  // When the tab becomes visible, correct for any wall-clock drift
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      const session = timerSessionRef.current;
      if (!session) return;

      const wallElapsed = Math.floor((Date.now() - session.startTime) / 1000);
      const expectedRemaining = Math.max(0, session.startTimeRemaining - wallElapsed);
      const drift = timeRemainingRef.current - expectedRemaining;

      // More than 1 second of drift -> tab was backgrounded and ticks were lost
      if (drift > 1) {
        dispatch({ type: 'SYNC_TIME', payload: expectedRemaining });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Chrome extension background sync ──
  // When running as a Chrome extension, keep the background service worker
  // informed so it can fire alarms and notifications even when the tab is hidden.

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;

    if (timerState.status === 'running') {
      const endTime = Date.now() + timerState.timeRemaining * 1000;
      chrome.runtime.sendMessage({ type: 'START_TIMER', endTime }).catch(() => {});
    } else if (timerState.status === 'paused') {
      chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' }).catch(() => {});
    } else {
      chrome.runtime.sendMessage({ type: 'RESET_TIMER' }).catch(() => {});
    }
  }, [timerState.status]);

  // Listen for TIME_UP from background when alarm fires while app is open
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;

    const handleMessage = (message) => {
      if (message.type === 'TIME_UP') {
        dispatch({ type: 'COMPLETE' });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // ── Extension toolbar badge ──
  // Show live countdown or phase indicator on the extension icon

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;

    if (timerState.status === 'running') {
      const mins = Math.ceil(timerState.timeRemaining / 60);
      const secs = timerState.timeRemaining % 60;
      const badge = mins > 0 ? String(mins) : `:${String(secs).padStart(2, '0')}`;
      chrome.action.setBadgeText({ text: badge }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({
        color: timerState.phase === 'focus' ? '#2563eb' : '#16a34a',
      }).catch(() => {});
    } else if (timerState.status === 'paused') {
      chrome.action.setBadgeText({ text: '⏸' }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' }).catch(() => {});
    } else {
      chrome.action.setBadgeText({ text: '' }).catch(() => {});
    }
  }, [timerState.status, timerState.timeRemaining, timerState.phase]);

  // ── Completion detection effect ──
  // When timeRemaining hits 0 while running, mark phase as complete
  // The reducer is idempotent for COMPLETE, so StrictMode double-invoke is safe

  useEffect(() => {
    if (timerState.status === 'running' && timerState.timeRemaining <= 0) {
      dispatch({ type: 'COMPLETE' });
    }
  }, [timerState.timeRemaining, timerState.status]);

  // ── Phase transition effect ──
  // After COMPLETE sets status=idle, compute and transition to next phase

  useEffect(() => {
    if (timerState.status === 'idle' && timerState.timeRemaining === 0) {
      const next = computeNextPhase(timerState, settings, limitedSchedule);
      if (next) {
        if (timerState.phase === 'focus') {
          playSound(settings.focusSound, settings.soundRepeatCount);
          playNotification('专注完成！', next.phase === 'longBreak' ? '开始长休息' : '开始短休息', settings.notifications);
        } else {
          playSound(settings.breakSound, settings.soundRepeatCount);
          playNotification('休息结束！', `开始第 ${next.round} 轮专注`, settings.notifications);
        }
        dispatch({ type: 'NEXT_PHASE', payload: next });
      } else {
        playSound(settings.focusSound, settings.soundRepeatCount);
        playNotification('计划完成！', '所有专注时间已完成', settings.notifications);
      }
    }
  }, [timerState.status, timerState.timeRemaining, timerState.phase, timerState.currentRound, timerState.scheduleIndex, settings, limitedSchedule]);

  // ── Recording effect ──
  // Records elapsed focus time at phase boundaries (pause, completion)
  // Skip callback sets recordingGuardRef to prevent double-recording

  const addOrUpdateHistory = useCallback((date, taskId, duration) => {
    const validDate = date || new Date().toLocaleDateString('zh-CN');
    setHistory(prev => {
      const normalizedTaskId = taskId || 'unassigned';
      const existingIndex = prev.findIndex(
        item => item.date === validDate && item.taskId === normalizedTaskId
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          duration: updated[existingIndex].duration + duration,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: `${validDate}-${normalizedTaskId}`,
          date: validDate,
          taskId: normalizedTaskId,
          duration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  // ── Flush pending focus-time lost on page refresh ──

  useEffect(() => {
    const pending = getStorageItem('focus-timer-pending-record', null);
    if (pending) {
      addOrUpdateHistory(pending.date, pending.taskId, pending.duration);
      localStorage.removeItem('focus-timer-pending-record');
    }
  }, [addOrUpdateHistory]);

  useEffect(() => {
    if (timerState.phase !== 'focus') {
      lastRecordedSecondsRef.current = 0;
      recordingGuardRef.current = false;
      return;
    }

    // Skip recording if this phase end was already handled by skip callback
    if (recordingGuardRef.current) {
      return; // don't reset guard here — let phase change (above) clear it
    }

    // Record at phase boundaries: pause or completion
    if (timerState.status === 'paused' || timerState.status === 'idle') {
      const phaseDuration = getPhaseDuration('focus', settings);
      const elapsed = phaseDuration - timerState.timeRemaining;
      const toRecord = Math.max(0, elapsed - lastRecordedSecondsRef.current);
      if (toRecord > 0) {
        const date = new Date().toLocaleDateString('zh-CN');
        addOrUpdateHistory(date, timerState.taskId, toRecord);
        lastRecordedSecondsRef.current += toRecord;
      }
    }
  }, [timerState.status, timerState.phase, settings, addOrUpdateHistory]);

  // ── Actions ──

  const startTimer = useCallback(() => {
    if (timerState.timeRemaining <= 0) {
      // 从完成态重新开始：重置到初始状态并自动运行
      lastRecordedSecondsRef.current = 0;
      recordingGuardRef.current = false;
      const fresh = initialPhaseState(settings, limitedSchedule);
      dispatch({ type: 'RESET', payload: { ...fresh, status: 'running' } });
    } else {
      dispatch({ type: 'START' });
    }
  }, [timerState.timeRemaining, settings, limitedSchedule]);

  const pauseTimer = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerState.phase === 'focus' && (timerState.status === 'running' || timerState.status === 'paused')) {
      const phaseDuration = getPhaseDuration('focus', settings);
      const elapsed = phaseDuration - timerState.timeRemaining;
      const toRecord = Math.max(0, elapsed - lastRecordedSecondsRef.current);
      if (toRecord > 0) {
        const date = new Date().toLocaleDateString('zh-CN');
        addOrUpdateHistory(date, timerState.taskId, toRecord);
        lastRecordedSecondsRef.current += toRecord;
      }
    }
    recordingGuardRef.current = false;
    const fresh = initialPhaseState(settings, limitedSchedule);
    dispatch({ type: 'RESET', payload: fresh });
    localStorage.removeItem(TIMER_STATE_KEY);
  }, [timerState, settings, addOrUpdateHistory]);

  const skipPhase = useCallback(() => {
    if (timerState.phase === 'focus' && timerState.status === 'running') {
      const phaseDuration = getPhaseDuration('focus', settings);
      const elapsed = phaseDuration - timerState.timeRemaining;
      const toRecord = Math.max(0, elapsed - lastRecordedSecondsRef.current);
      if (toRecord > 0) {
        const date = new Date().toLocaleDateString('zh-CN');
        addOrUpdateHistory(date, timerState.taskId, toRecord);
        lastRecordedSecondsRef.current += toRecord;
      }
      recordingGuardRef.current = true;
    } else if (timerState.phase === 'focus' && timerState.status === 'paused') {
      // 暂停时已记录过时间，跳过时防止重复记录
      recordingGuardRef.current = true;
    }
    dispatch({ type: 'COMPLETE' });
  }, [timerState, settings, addOrUpdateHistory]);

  const setTaskId = useCallback((taskId) => {
    dispatch({ type: 'SET_TASK_ID', payload: taskId });
  }, []);

  const isTimeSetting = useCallback((key) => {
    return ['focusTime', 'shortBreakTime', 'longBreakTime', 'pomodoroRounds', 'limitedTime', 'mode'].includes(key);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      const hasTimeSetting = Object.keys(newSettings).some(isTimeSetting);

      if (hasTimeSetting) {
        // Reset timer state when time settings change
        lastRecordedSecondsRef.current = 0;
        recordingGuardRef.current = false;
        // Recalculate limitedSchedule for the reset
        const newLimitedSchedule = updated.mode === 'limited'
          ? calculateLimitedSchedule(updated.limitedTime * 60, updated)
          : null;
        const fresh = initialPhaseState(updated, newLimitedSchedule);
        dispatch({ type: 'RESET', payload: fresh });
        localStorage.removeItem(TIMER_STATE_KEY);
      }

      return updated;
    });
  }, [isTimeSetting]);

  // ── Derived values ──

  const publicTimerState = useMemo(() => ({
    isRunning: timerState.status === 'running',
    timeRemaining: timerState.timeRemaining,
    currentRound: timerState.currentRound,
    phase: timerState.phase,
    taskId: timerState.taskId,
    scheduleIndex: timerState.scheduleIndex,
  }), [timerState]);

  const totalDailyTime = useMemo(() => {
    return history
      .filter(h => h.date === today)
      .reduce((sum, h) => sum + (h.duration || 0), 0);
  }, [history, today]);

  const dailyTaskStats = useMemo(() => {
    const todayHistory = history.filter(h => h.date === today);
    const stats = {};
    todayHistory.forEach(h => {
      stats[h.taskId] = (stats[h.taskId] || 0) + (h.duration || 0);
    });
    return stats;
  }, [history, today]);

  const taskTotalTimes = useMemo(() => {
    const times = {};
    history.forEach(h => {
      if (h.taskId) {
        times[h.taskId] = (times[h.taskId] || 0) + (h.duration || 0);
      }
    });
    return times;
  }, [history]);

  const isLocked = timerState.status === 'running' || (settings.mode === 'limited' && timerState.scheduleIndex > 0);

  return (
    <PomodoroContext.Provider
      value={{
        timerState: publicTimerState,
        settings,
        history,
        totalDailyTime,
        dailyTaskStats,
        taskTotalTimes,
        limitedSchedule,
        isLocked,
        startTimer,
        pauseTimer,
        resetTimer,
        skipPhase,
        setTaskId,
        updateSettings,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
}

export { defaultSettings };

