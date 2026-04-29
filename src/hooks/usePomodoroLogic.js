import { useEffect, useCallback } from 'react';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { useTaskContext } from '../contexts/TaskContext';
import { formatTime } from '../hooks/useTimer';

export function useTimerLogic() {
  const { timerState, settings, switchPhase, updateHistoryTask } = usePomodoroContext();
  const { state: taskState, dispatch } = useTaskContext();

  useEffect(() => {
    if (!timerState.isRunning || timerState.timeRemaining > 0) return;

    const timeout = setTimeout(() => {
      if (timerState.phase === 'focus' && timerState.taskId) {
        dispatch({
          type: 'ADD_TIME_TO_TASK',
          payload: { taskId: timerState.taskId, time: settings.focusTime },
        });
      }
      switchPhase();
    }, 0);

    return () => clearTimeout(timeout);
  }, [timerState.timeRemaining, timerState.isRunning]);

  const tick = useCallback(() => {
    if (!timerState.isRunning) return;
    
    const newState = {
      ...timerState,
      timeRemaining: timerState.timeRemaining - 1,
    };
    
    if (timerState.timeRemaining <= 0) {
      switchPhase();
    }
    
    return newState;
  }, [timerState, switchPhase]);

  return {
    tick,
    currentTask: taskState.tasks.find(t => t.id === timerState.taskId),
    settings,
  };
}

export function useTitleTimer(timeRemaining, isRunning) {
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(timeRemaining)} - Focus Timer`;
    } else {
      document.title = 'Focus Timer';
    }
    
    return () => {
      document.title = 'Focus Timer';
    };
  }, [timeRemaining, isRunning]);
}
