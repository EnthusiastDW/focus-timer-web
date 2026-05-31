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
  Select,
  MenuItem,
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
import { useTranslation } from 'react-i18next';
import useSEO from './hooks/useSEO';
import i18n from './i18n/i18n';

const drawerWidth = 280;

const menuItems = [
  { id: 'focus', icon: <TimerOutlinedIcon /> },
  { id: 'tasks', icon: <AssignmentOutlinedIcon /> },
  { id: 'statistics', icon: <BarChartOutlinedIcon /> },
  { id: 'feedback', icon: <FeedbackOutlinedIcon /> },
];

const phaseConfig = {
  focus: { icon: <TimerOutlinedIcon />, color: 'primary', tKey: 'phase.focus' },
  shortBreak: { icon: <CoffeeOutlinedIcon />, color: 'success', tKey: 'phase.short_break' },
  longBreak: { icon: <SelfImprovementOutlinedIcon />, color: 'secondary', tKey: 'phase.long_break' },
};

function TimerIndicator() {
  const { timerState } = usePomodoroContext();
  const { t } = useTranslation();
  
  if (!timerState.isRunning) return null;
  
  const phase = phaseConfig[timerState.phase] || phaseConfig.focus;
  
  return (
    <Chip
      icon={phase.icon}
      label={`${t(phase.tKey)} ${formatTime(timerState.timeRemaining)}`}
      color={phase.color}
      size="small"
      sx={{ mr: { xs: 0, sm: 2 } }}
    />
  );
}

function NotificationToggle() {
  const { settings, updateSettings } = usePomodoroContext();
  const { t } = useTranslation();
  
  const handleToggle = () => {
    const newNotifications = !settings.notifications;
    updateSettings({ notifications: newNotifications });
    
    if (newNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };
  
  return (
    <Tooltip title={settings.notifications ? t('app.notification_on') : t('app.notification_off')}>
      <IconButton
        onClick={handleToggle}
        sx={{ 
          color: settings.notifications ? 'primary.main' : 'text.secondary',
          mr: 0.5,
          '&:hover': {
            bgcolor: alpha('#2563eb', 0.1),
          }
        }}
        aria-label={t('app.aria.notification_toggle')}
        size="small"
      >
        {settings.notifications ? <NotificationsIcon /> : <NotificationsOffIcon />}
      </IconButton>
    </Tooltip>
  );
}

function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState('focus');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const pageSEO = {
    focus: {
      title: 'Focus Timer - ' + t('seo.focus_title_suffix'),
      description: t('seo.focus_desc')
    },
    tasks: {
      title: t('seo.tasks_title') + ' - Focus Timer',
      description: t('seo.tasks_desc')
    },
    statistics: {
      title: t('seo.statistics_title') + ' - Focus Timer',
      description: t('seo.statistics_desc')
    },
    feedback: {
      title: t('seo.feedback_title') + ' - Focus Timer',
      description: t('seo.feedback_desc')
    }
  };

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
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
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
            aria-label={t('app.aria.menu')}
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
            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('app.title')}</Box>
          </Typography>
          <TimerIndicator />
          <NotificationToggle />
          <IconButton
            onClick={() => setHistoryOpen(true)}
            sx={{ color: 'text.secondary', mr: 0.5 }}
            aria-label={t('app.aria.history')}
            size="small"
          >
            <HistoryOutlinedIcon />
          </IconButton>
          <IconButton
            onClick={() => setSettingsOpen(true)}
            sx={{ color: 'text.secondary' }}
            aria-label={t('app.aria.settings')}
            size="small"
          >
            <SettingsOutlinedIcon />
          </IconButton>
          <Select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              ml: 0.5,
              fontSize: '0.8rem',
              color: 'text.secondary',
              '& .MuiSelect-select': { py: 0.5, pr: 2 },
            }}
          >
            <MenuItem value="zh-CN">中文</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
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
            {t('app.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('app.subtitle')}
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
                primary={t(`menu.${item.id}`)}
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
