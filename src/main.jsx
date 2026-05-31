import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { TaskProvider } from './contexts/TaskContext';
import App from './App';
import { initTabSafeTimers } from '@vorthain/tab-safe-timers';
import './i18n/i18n';

// Initialize tab-safe timers to ensure accurate timing when tabs are in background
try {
  initTabSafeTimers();
} catch (error) {
  console.warn('Tab-safe timers not available:', error);
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TaskProvider>
        <PomodoroProvider>
          <App />
        </PomodoroProvider>
      </TaskProvider>
    </ThemeProvider>
  </StrictMode>,
);
