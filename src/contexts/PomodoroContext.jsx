import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

function loadTimerState(settings) {
  const saved = getStorageItem(TIMER_STATE_KEY, null);
  if (saved && saved.isRunning) {
    const elapsed = Math.floor((Date.now() - saved.startTime) / 1000);
    const phaseTime = saved.phase === 'focus' 
      ? settings.focusTime 
      : saved.phase === 'shortBreak' 
        ? settings.shortBreakTime 
        : settings.longBreakTime;
    const remaining = Math.max(0, phaseTime - elapsed);
    
    if (remaining > 0) {
      return {
        ...saved,
        timeRemaining: remaining,
      };
    }
  }
  return {
    isRunning: false,
    timeRemaining: settings.focusTime,
    currentRound: 1,
    phase: 'focus',
    taskId: null,
    scheduleIndex: 0,
  };
}

export function PomodoroProvider({ children }) {
  const [settings, setSettings] = useState(() => getStorageItem(SETTINGS_KEY, defaultSettings));
  const [timerState, setTimerState] = useState(() => loadTimerState(getStorageItem(SETTINGS_KEY, defaultSettings)));
  const [history, setHistory] = useState(() => getStorageItem(HISTORY_KEY, []));
  const [currentSessionStart, setCurrentSessionStart] = useState(null);
  const minutesRecordedRef = useRef(0);
  const intervalRef = useRef(null);
  const lastPhaseRef = useRef(null); // 用于防止重复触发通知

  const limitedSchedule = useMemo(() => {
    if (settings.mode !== 'limited') return null;
    return calculateLimitedSchedule(settings.limitedTime * 60, settings);
  }, [settings.mode, settings.limitedTime, settings.focusTime, settings.shortBreakTime, settings.longBreakTime, settings.pomodoroRounds]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    setStorageItem(SETTINGS_KEY, settings);
  }, [settings]);

  useEffect(() => {
    setStorageItem(HISTORY_KEY, history);
  }, [history]);

  useEffect(() => {
    if (timerState.isRunning) {
      const phaseTime = timerState.phase === 'focus' 
        ? settings.focusTime 
        : timerState.phase === 'shortBreak' 
          ? settings.shortBreakTime 
          : settings.longBreakTime;
      setStorageItem(TIMER_STATE_KEY, {
        ...timerState,
        startTime: Date.now() - (phaseTime - timerState.timeRemaining) * 1000,
      });
    } else {
      localStorage.removeItem(TIMER_STATE_KEY);
    }
  }, [timerState, settings]);

  const addHistory = useCallback((phase, duration, taskId) => {
    const session = {
      id: Date.now().toString(),
      phase,
      duration,
      taskId,
      completedAt: new Date().toISOString(),
    };
    setHistory(prev => [...prev, session]);
    return session;
  }, []);

  const switchToNextPhase = useCallback(() => {
    setTimerState(prev => {
      // 防止重复触发：如果阶段没有变化，不执行
      if (lastPhaseRef.current === `${prev.phase}-${prev.currentRound}-${prev.timeRemaining}`) {
        return prev;
      }
      
      if (settings.mode === 'limited' && limitedSchedule) {
        const nextIndex = prev.scheduleIndex + 1;
        if (nextIndex >= limitedSchedule.length) {
          playSound(settings.focusSound);
          playNotification('计划完成！', '所有专注时间已完成', settings.notifications);
          lastPhaseRef.current = `completed-${Date.now()}`;
          return {
            ...prev,
            isRunning: false,
            timeRemaining: 0,
          };
        }
        
        const nextItem = limitedSchedule[nextIndex];
        if (nextItem.phase !== 'focus') {
          // 专注结束，进入休息
          playSound(settings.focusSound);
          playNotification('专注完成！', nextItem.phase === 'longBreak' ? '开始长休息' : '开始短休息', settings.notifications);
          lastPhaseRef.current = `${nextItem.phase}-${nextItem.round}-${nextItem.duration}`;
          return {
            ...prev,
            isRunning: settings.autoSwitch,
            phase: nextItem.phase,
            timeRemaining: nextItem.duration,
            currentRound: nextItem.round,
            scheduleIndex: nextIndex,
          };
        } else {
          // 休息结束，进入专注
          playSound(settings.breakSound);
          playNotification('休息结束！', `开始第 ${nextItem.round} 轮专注`, settings.notifications);
          lastPhaseRef.current = `${nextItem.phase}-${nextItem.round}-${nextItem.duration}`;
          return {
            ...prev,
            isRunning: settings.autoSwitch,
            phase: nextItem.phase,
            timeRemaining: nextItem.duration,
            currentRound: nextItem.round,
            scheduleIndex: nextIndex,
          };
        }
      }
      
      const { phase, currentRound } = prev;
      
      if (phase === 'focus') {
        // 专注结束，进入休息
        const isLongBreak = currentRound % settings.pomodoroRounds === 0;
        const nextPhase = isLongBreak ? 'longBreak' : 'shortBreak';
        const nextTime = isLongBreak ? settings.longBreakTime : settings.shortBreakTime;
        
        playSound(settings.focusSound);
        playNotification('专注完成！', isLongBreak ? '开始长休息' : '开始短休息', settings.notifications);
        lastPhaseRef.current = `${nextPhase}-${currentRound}-${nextTime}`;
        
        return {
          ...prev,
          isRunning: settings.autoSwitch,
          phase: nextPhase,
          timeRemaining: nextTime,
        };
      } else {
        // 休息结束，进入专注
        const nextRound = prev.currentRound + 1;
        
        playSound(settings.breakSound);
        playNotification('休息结束！', `开始第 ${nextRound} 轮专注`, settings.notifications);
        lastPhaseRef.current = `focus-${nextRound}-${settings.focusTime}`;
        
        return {
          ...prev,
          isRunning: settings.autoSwitch,
          currentRound: nextRound,
          phase: 'focus',
          timeRemaining: settings.focusTime,
        };
      }
    });
  }, [settings, limitedSchedule]);

  useEffect(() => {
    if (timerState.isRunning && timerState.phase === 'focus') {
      if (!currentSessionStart) {
        setCurrentSessionStart(Date.now());
        minutesRecordedRef.current = 0;
      }
      
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeRemaining <= 1) {
            clearInterval(intervalRef.current);
            
            if (prev.phase === 'focus') {
              const actualDuration = settings.mode === 'limited' && limitedSchedule
                ? limitedSchedule[prev.scheduleIndex]?.duration || settings.focusTime
                : settings.focusTime;
              const remainingSeconds = actualDuration - minutesRecordedRef.current * 60;
              if (remainingSeconds > 0) {
                addHistory('focus', remainingSeconds, prev.taskId);
              }
              setCurrentSessionStart(null);
              minutesRecordedRef.current = 0;
            }
            
            return {
              ...prev,
              isRunning: false,
              timeRemaining: 0,
            };
          }
          
          const elapsedSeconds = settings.focusTime - prev.timeRemaining;
          const newMinutes = Math.floor(elapsedSeconds / 60);
          
          if (newMinutes > minutesRecordedRef.current) {
            addHistory('focus', 60, prev.taskId);
            minutesRecordedRef.current = newMinutes;
          }
          
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);
    } else if (timerState.isRunning && timerState.phase !== 'focus') {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeRemaining <= 1) {
            clearInterval(intervalRef.current);
            return {
              ...prev,
              isRunning: false,
              timeRemaining: 0,
            };
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      if (currentSessionStart && timerState.phase === 'focus') {
        const elapsed = Math.floor((Date.now() - currentSessionStart) / 1000);
        const remainingSeconds = elapsed - minutesRecordedRef.current * 60;
        if (remainingSeconds > 0) {
          addHistory('focus', remainingSeconds, timerState.taskId);
        }
        setCurrentSessionStart(null);
        minutesRecordedRef.current = 0;
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [timerState.isRunning, timerState.phase, settings.focusTime, settings.mode, limitedSchedule, addHistory, currentSessionStart, timerState.taskId]);

  useEffect(() => {
    if (timerState.timeRemaining === 0 && !timerState.isRunning) {
      switchToNextPhase();
    }
  }, [timerState.timeRemaining, timerState.isRunning, switchToNextPhase]);

  const startTimer = useCallback(() => {
    setTimerState(prev => {
      if (settings.mode === 'limited' && limitedSchedule && limitedSchedule.length > 0) {
        const currentItem = limitedSchedule[prev.scheduleIndex] || limitedSchedule[0];
        return {
          ...prev,
          isRunning: true,
          phase: currentItem.phase,
          timeRemaining: currentItem.duration,
          currentRound: currentItem.round,
          scheduleIndex: prev.scheduleIndex || 0,
        };
      }
      return { ...prev, isRunning: true };
    });
  }, [settings.mode, limitedSchedule]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: settings.focusTime,
      currentRound: 1,
      phase: 'focus',
      scheduleIndex: 0,
    }));
    localStorage.removeItem(TIMER_STATE_KEY);
  }, [settings.focusTime]);

  const skipPhase = useCallback(() => {
    if (timerState.phase === 'focus') {
      const actualDuration = settings.mode === 'limited' && limitedSchedule
        ? limitedSchedule[timerState.scheduleIndex]?.duration || settings.focusTime
        : settings.focusTime;
      addHistory('focus', actualDuration - timerState.timeRemaining, timerState.taskId);
    }
    switchToNextPhase();
  }, [timerState, settings, limitedSchedule, addHistory, switchToNextPhase]);

  const setTaskId = useCallback((taskId) => {
    setTimerState(prev => ({ ...prev, taskId }));
  }, []);

  // 判断是否为时间相关的设置
  const isTimeSetting = (key) => {
    return ['focusTime', 'shortBreakTime', 'longBreakTime', 'pomodoroRounds', 'limitedTime', 'mode'].includes(key);
  };

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // 只有当时间相关设置改变时才重置计时器
      const hasTimeSetting = Object.keys(newSettings).some(isTimeSetting);
      
      if (hasTimeSetting) {
        setTimerState(current => ({
          ...current,
          timeRemaining: updated.focusTime,
          scheduleIndex: 0,
        }));
      }
      
      return updated;
    });
  }, []);

  const updateHistoryTask = useCallback((historyId, taskId) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === historyId ? { ...item, taskId } : item
      )
    );
  }, []);

  const totalDailyTime = history
    .filter(h => {
      const today = new Date().toDateString();
      return h.completedAt && new Date(h.completedAt).toDateString() === today && h.phase === 'focus';
    })
    .reduce((sum, h) => sum + (h.duration || 0), 0);

  const dailyTaskStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayFocus = history.filter(
      h => h.completedAt && new Date(h.completedAt).toDateString() === today && h.phase === 'focus'
    );
    
    const stats = {};
    todayFocus.forEach(h => {
      const taskId = h.taskId || 'unassigned';
      stats[taskId] = (stats[taskId] || 0) + (h.duration || 0);
    });
    
    return stats;
  }, [history]);

  const isLocked = timerState.isRunning || (settings.mode === 'limited' && timerState.scheduleIndex > 0);

  return (
    <PomodoroContext.Provider
      value={{
        timerState,
        settings,
        history,
        totalDailyTime,
        dailyTaskStats,
        limitedSchedule,
        isLocked,
        startTimer,
        pauseTimer,
        resetTimer,
        skipPhase,
        setTaskId,
        updateSettings,
        updateHistoryTask,
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
