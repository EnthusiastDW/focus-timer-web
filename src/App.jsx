import { useState } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import PomodoroTimer from './components/PomodoroTimer';
import TaskManagement from './components/TaskManagement';
import StatisticsPage from './components/StatisticsPage';
import SettingsDialog from './components/SettingsDialog';
import HistoryList from './components/HistoryList';
import FeedbackPage from './components/FeedbackPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { usePomodoroContext } from './contexts/PomodoroContext';
import { formatTime } from './hooks/useTimer';

const drawerWidth = 280;

const menuItems = [
  { id: 'focus', label: '专注', icon: <TimerOutlinedIcon />, description: '开始番茄钟计时' },
  { id: 'tasks', label: '任务管理', icon: <AssignmentOutlinedIcon />, description: '管理你的任务' },
  { id: 'statistics', label: '统计分析', icon: <BarChartOutlinedIcon />, description: '查看专注统计' },
  { id: 'feedback', label: '反馈', icon: <FeedbackOutlinedIcon />, description: '提交问题和建议' },
];

const phaseConfig = {
  focus: { icon: <TimerOutlinedIcon />, color: 'primary', label: '专注' },
  shortBreak: { icon: <CoffeeOutlinedIcon />, color: 'success', label: '短休息' },
  longBreak: { icon: <SelfImprovementOutlinedIcon />, color: 'secondary', label: '长休息' },
};

function TimerIndicator() {
  const { timerState } = usePomodoroContext();
  
  if (!timerState.isRunning) return null;
  
  const phase = phaseConfig[timerState.phase] || phaseConfig.focus;
  
  return (
    <Chip
      icon={phase.icon}
      label={`${phase.label} ${formatTime(timerState.timeRemaining)}`}
      color={phase.color}
      size="small"
      sx={{ mr: { xs: 0, sm: 2 } }}
    />
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('focus');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const navigateTo = (page) => {
    setCurrentPage(page);
    setDrawerOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'focus':
        return <PomodoroTimer onNavigate={navigateTo} />;
      case 'tasks':
        return <TaskManagement />;
      case 'statistics':
        return <StatisticsPage />;
      case 'feedback':
        return <FeedbackPage />;
      default:
        return <PomodoroTimer onNavigate={navigateTo} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1, color: 'text.primary' }}
            aria-label="菜单"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            onClick={() => navigateTo('focus')}
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <TimerOutlinedIcon color="primary" />
            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Focus Timer</Box>
          </Typography>
          <TimerIndicator />
          <IconButton
            onClick={() => setHistoryOpen(true)}
            sx={{ color: 'text.secondary', mr: 0.5 }}
            aria-label="历史记录"
            size="small"
          >
            <HistoryOutlinedIcon />
          </IconButton>
          <IconButton
            onClick={() => setSettingsOpen(true)}
            sx={{ color: 'text.secondary' }}
            aria-label="设置"
            size="small"
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: 260, sm: drawerWidth },
            borderRadius: '0 24px 24px 0',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'primary.main',
            }}
          >
            <TimerOutlinedIcon sx={{ fontSize: 28 }} />
            Focus Timer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            专注时间管理工具
          </Typography>
        </Box>

        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.id}
              selected={currentPage === item.id}
              onClick={() => navigateTo(item.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha('#2563eb', 0.1),
                  '&:hover': {
                    bgcolor: alpha('#2563eb', 0.15),
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentPage === item.id ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: currentPage === item.id ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          mt: { xs: 7, sm: 8 },
          minHeight: 'calc(100vh - 56px)',
          overflow: 'auto',
        }}
      >
        {renderPage()}
      </Box>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HistoryList open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <PWAInstallPrompt />
    </Box>
  );
}

export default App;
