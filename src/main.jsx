import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { TaskProvider } from './contexts/TaskContext';
import App from './App';

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
