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
  Tooltip,
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import PomodoroTimer from './components/PomodoroTimer';
import TaskManagement from './components/TaskManagement';
import StatisticsPage from './components/StatisticsPage';
import SettingsDialog from './components/SettingsDialog';
import HistoryList from './components/HistoryList';
import FeedbackPage from './components/FeedbackPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { usePomodoroContext } from './contexts/PomodoroContext';
import { formatTime } from './hooks/useTimer';
import useSEO from './hooks/useSEO';

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

function NotificationToggle() {
  const { settings, updateSettings } = usePomodoroContext();
  
  const handleToggle = () => {
    const newNotifications = !settings.notifications;
    updateSettings({ notifications: newNotifications });
    
    // 如果开启通知且未授权，请求权限
    if (newNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };
  
  return (
    <Tooltip title={settings.notifications ? '关闭桌面通知' : '开启桌面通知'}>
      <IconButton
        onClick={handleToggle}
        sx={{ 
          color: settings.notifications ? 'primary.main' : 'text.secondary',
          mr: 0.5,
          '&:hover': {
            bgcolor: alpha('#2563eb', 0.1),
          }
        }}
        aria-label="桌面通知开关"
        size="small"
      >
        {settings.notifications ? <NotificationsIcon /> : <NotificationsOffIcon />}
      </IconButton>
    </Tooltip>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('focus');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // 定义不同页面的SEO信息
  const pageSEO = {
    focus: {
      title: 'Focus Timer - 番茄钟专注计时器',
      description: '使用番茄钟技术提高专注力，管理时间，提升工作效率。支持自由模式和限时模式，提供统计分析和桌面通知功能。'
    },
    tasks: {
      title: '任务管理 - Focus Timer',
      description: '创建和管理你的任务，分组整理，跟踪任务进度，关联番茄钟自动记录耗时。'
    },
    statistics: {
      title: '统计分析 - Focus Timer',
      description: '查看您的专注统计数据，分析工作效率，了解时间分配情况，优化工作流程。'
    },
    feedback: {
      title: '反馈 - Focus Timer',
      description: '提交您的问题、建议或反馈，帮助我们改进Focus Timer番茄钟应用。'
    }
  };

  // 使用SEO Hook动态设置页面标题和描述
  useSEO(pageSEO[currentPage]?.title, pageSEO[currentPage]?.description);

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
          <NotificationToggle />
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
