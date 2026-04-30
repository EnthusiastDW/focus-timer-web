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
  const [history, setHistory] = useState(() => {
    // 加载历史记录并修复旧数据
    const savedHistory = getStorageItem(HISTORY_KEY, []);
    return savedHistory.map(record => ({
      ...record,
      // 修复 date 为 undefined 的记录
      date: record.date || new Date().toLocaleDateString('zh-CN'),
      // 修复 taskId 为 null 的记录
      taskId: record.taskId || 'unassigned',
    }));
  });
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

  // 添加或更新历史记录（按日期+任务分组）
  const addOrUpdateHistory = useCallback((date, taskId, duration) => {
    // 确保 date 有值，如果为 undefined 则使用当前日期
    const validDate = date || new Date().toLocaleDateString('zh-CN');
    
    setHistory(prev => {
      // 将 null 转换为 'unassigned' 字符串，作为独立的任务ID
      const normalizedTaskId = taskId || 'unassigned';
      
      const existingIndex = prev.findIndex(
        item => item.date === validDate && item.taskId === normalizedTaskId
      );
      
      if (existingIndex >= 0) {
        // 更新现有记录
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          duration: updated[existingIndex].duration + duration,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        // 创建新记录
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
      }
    });
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
              // 记录剩余的秒数（不足一分钟的部分）
              const actualDuration = settings.mode === 'limited' && limitedSchedule
                ? limitedSchedule[prev.scheduleIndex]?.duration || settings.focusTime
                : settings.focusTime;
              const remainingSeconds = actualDuration - minutesRecordedRef.current * 60;
              if (remainingSeconds > 0) {
                const date = new Date().toLocaleDateString('zh-CN');
                addOrUpdateHistory(date, prev.taskId, remainingSeconds);
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
            // 每分钟记录一次
            const date = new Date().toLocaleDateString('zh-CN');
            addOrUpdateHistory(date, prev.taskId, 60);
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
        // 记录暂停时未记录的剩余时间
        const elapsed = Math.floor((Date.now() - currentSessionStart) / 1000);
        const remainingSeconds = elapsed - minutesRecordedRef.current * 60;
        if (remainingSeconds > 0) {
          const date = new Date().toLocaleDateString('zh-CN');
          addOrUpdateHistory(date, timerState.taskId, remainingSeconds);
        }
        setCurrentSessionStart(null);
        minutesRecordedRef.current = 0;
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [timerState.isRunning, timerState.phase, settings.focusTime, settings.mode, limitedSchedule, currentSessionStart, timerState.taskId]);

  useEffect(() => {
    if (timerState.timeRemaining === 0 && !timerState.isRunning) {
      switchToNextPhase();
    }
  }, [timerState.timeRemaining, timerState.isRunning, switchToNextPhase]);

  const startTimer = useCallback(() => {
    setTimerState(prev => {
      // 如果已经在运行，直接返回
      if (prev.isRunning) return prev;
      
      // 如果时间剩余为 0，说明已经结束，需要重新初始化
      if (prev.timeRemaining === 0) {
        if (settings.mode === 'limited' && limitedSchedule && limitedSchedule.length > 0) {
          const firstItem = limitedSchedule[0];
          return {
            ...prev,
            isRunning: true,
            phase: firstItem.phase,
            timeRemaining: firstItem.duration,
            currentRound: firstItem.round,
            scheduleIndex: 0,
          };
        }
        return {
          ...prev,
          isRunning: true,
          timeRemaining: settings.focusTime,
          currentRound: 1,
          phase: 'focus',
          scheduleIndex: 0,
        };
      }
      
      // 暂停后继续，保持当前状态不变，只将 isRunning 设为 true
      return { ...prev, isRunning: true };
    });
  }, [settings.mode, settings.focusTime, limitedSchedule]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState(prev => {
      // 如果是限时模式且有调度计划，根据计划初始化
      if (settings.mode === 'limited' && limitedSchedule && limitedSchedule.length > 0) {
        const firstItem = limitedSchedule[0];
        return {
          ...prev,
          isRunning: false,
          phase: firstItem.phase,
          timeRemaining: firstItem.duration,
          currentRound: firstItem.round,
          scheduleIndex: 0,
        };
      }
      // 自由模式，使用默认值
      return {
        ...prev,
        isRunning: false,
        timeRemaining: settings.focusTime,
        currentRound: 1,
        phase: 'focus',
        scheduleIndex: 0,
      };
    });
    localStorage.removeItem(TIMER_STATE_KEY);
  }, [settings.focusTime, settings.mode, limitedSchedule]);

  const skipPhase = useCallback(() => {
    if (timerState.phase === 'focus') {
      // 跳过时记录已完成的时长
      const actualDuration = settings.mode === 'limited' && limitedSchedule
        ? limitedSchedule[timerState.scheduleIndex]?.duration || settings.focusTime
        : settings.focusTime;
      const completedDuration = actualDuration - timerState.timeRemaining;
      const date = new Date().toLocaleDateString('zh-CN');
      addOrUpdateHistory(date, timerState.taskId, completedDuration);
    }
    switchToNextPhase();
  }, [timerState, settings, limitedSchedule, addOrUpdateHistory, switchToNextPhase]);

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
        setTimerState(current => {
          // 如果计时器未运行且切换到限时模式，需要根据调度计划初始化
          if (!current.isRunning && updated.mode === 'limited' && limitedSchedule && limitedSchedule.length > 0) {
            const firstItem = limitedSchedule[0];
            return {
              ...current,
              phase: firstItem.phase,
              timeRemaining: firstItem.duration,
              currentRound: firstItem.round,
              scheduleIndex: 0,
            };
          }
          
          // 其他情况，只重置时间和 scheduleIndex
          return {
            ...current,
            timeRemaining: updated.focusTime,
            scheduleIndex: 0,
          };
        });
      }
      
      return updated;
    });
  }, [limitedSchedule]);

  // 计算今日总专注时间
  const totalDailyTime = useMemo(() => {
    const today = new Date().toLocaleDateString('zh-CN');
    return history
      .filter(h => h.date === today)
      .reduce((sum, h) => sum + (h.duration || 0), 0);
  }, [history]);

  // 计算今日各任务的专注时间统计
  const dailyTaskStats = useMemo(() => {
    const today = new Date().toLocaleDateString('zh-CN');
    const todayHistory = history.filter(h => h.date === today);
    
    const stats = {};
    todayHistory.forEach(h => {
      // taskId 已经是 'unassigned' 或具体的任务ID
      stats[h.taskId] = (stats[h.taskId] || 0) + (h.duration || 0);
    });
    
    return stats;
  }, [history]);

  // 计算各任务的总专注时间
  const taskTotalTimes = useMemo(() => {
    const times = {};
    history.forEach(h => {
      if (h.taskId) {
        times[h.taskId] = (times[h.taskId] || 0) + (h.duration || 0);
      }
    });
    return times;
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
