import { createContext, useContext, useReducer, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';

const TaskContext = createContext();

const STORAGE_KEY = 'focus-timer-tasks';
const GROUPS_KEY = 'focus-timer-groups';

const initialState = {
  tasks: getStorageItem(STORAGE_KEY, []),
  groups: getStorageItem(GROUPS_KEY, [
    { id: 'default', name: '默认分组' },
  ]),
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      const newTask = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        totalTime: 0,
      };
      return { ...state, tasks: [...state.tasks, newTask] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };

    case 'ADD_TIME_TO_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, totalTime: (t.totalTime || 0) + action.payload.time }
            : t
        ),
      };

    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, { id: Date.now().toString(), ...action.payload }],
      };

    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload } : g
        ),
      };

    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== action.payload),
        tasks: state.tasks.map(t =>
          t.groupId === action.payload ? { ...t, groupId: 'default' } : t
        ),
      };

    case 'MOVE_TASK_TO_GROUP':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, groupId: action.payload.groupId }
            : t
        ),
      };

    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  useEffect(() => {
    setStorageItem(STORAGE_KEY, state.tasks);
  }, [state.tasks]);

  useEffect(() => {
    setStorageItem(GROUPS_KEY, state.groups);
  }, [state.groups]);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
