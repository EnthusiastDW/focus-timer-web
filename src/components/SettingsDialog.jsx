import { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper,
  alpha,
  Alert,
} from '@mui/material';
import { usePomodoroContext, defaultSettings } from '../contexts/PomodoroContext';
import { formatDuration } from '../hooks/useTimer';

export default function SettingsDialog({ open, onClose }) {
  const { settings, updateSettings, isLocked } = usePomodoroContext();
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [form, setForm] = useState({
    limitedTime: settings.limitedTime || 120,
    focusTime: settings.focusTime / 60,
    shortBreakTime: settings.shortBreakTime / 60,
    longBreakTime: settings.longBreakTime / 60,
    pomodoroRounds: settings.pomodoroRounds,
    autoSwitch: settings.autoSwitch,
    focusSound: settings.focusSound || 'default',
    breakSound: settings.breakSound || 'default',
    soundRepeatCount: settings.soundRepeatCount || 2,
    notifications: settings.notifications !== undefined ? settings.notifications : true,
  });

  useEffect(() => {
    if (open) {
      setNotificationPermission('Notification' in window ? Notification.permission : 'unsupported');
      setForm({
        limitedTime: settings.limitedTime || 120,
        focusTime: settings.focusTime / 60,
        shortBreakTime: settings.shortBreakTime / 60,
        longBreakTime: settings.longBreakTime / 60,
        pomodoroRounds: settings.pomodoroRounds,
        autoSwitch: settings.autoSwitch,
        focusSound: settings.focusSound || 'default',
        breakSound: settings.breakSound || 'default',
        soundRepeatCount: settings.soundRepeatCount || 2,
        notifications: settings.notifications !== undefined ? settings.notifications : true,
      });
    }
  }, [open, settings]);

  const handleSave = () => {
    if (isLocked) {
      // 锁定时只保存非时间相关设置
      updateSettings({
        notifications: form.notifications,
        autoSwitch: form.autoSwitch,
        focusSound: form.focusSound,
        breakSound: form.breakSound,
        soundRepeatCount: form.soundRepeatCount,
      });
    } else {
      // 未锁定时保存所有设置
      updateSettings({
        limitedTime: form.limitedTime,
        focusTime: form.focusTime * 60,
        shortBreakTime: form.shortBreakTime * 60,
        longBreakTime: form.longBreakTime * 60,
        pomodoroRounds: form.pomodoroRounds,
        autoSwitch: form.autoSwitch,
        focusSound: form.focusSound,
        breakSound: form.breakSound,
        soundRepeatCount: form.soundRepeatCount,
        notifications: form.notifications,
      });
    }
    onClose();
  };

  const handleReset = () => {
    setForm({
      limitedTime: defaultSettings.limitedTime,
      focusTime: defaultSettings.focusTime / 60,
      shortBreakTime: defaultSettings.shortBreakTime / 60,
      longBreakTime: defaultSettings.longBreakTime / 60,
      pomodoroRounds: defaultSettings.pomodoroRounds,
      autoSwitch: defaultSettings.autoSwitch,
      focusSound: defaultSettings.focusSound,
      breakSound: defaultSettings.breakSound,
      soundRepeatCount: defaultSettings.soundRepeatCount,
      notifications: defaultSettings.notifications,
    });
  };

  const sounds = [
    { value: 'default', label: '默认' },
    { value: 'bell', label: '铃声' },
    { value: 'chime', label: '钟声' },
    { value: 'none', label: '无' },
  ];

  const previewSchedule = settings.mode === 'limited' ? calculatePreviewSchedule(form.limitedTime * 60, form) : null;

  function calculatePreviewSchedule(totalSeconds, formSettings) {
    const schedule = [];
    let remaining = totalSeconds;
    let round = 1;
    
    while (remaining > 0) {
      const isLongBreakRound = round > 1 && (round - 1) % formSettings.pomodoroRounds === 0;
      
      if (remaining <= formSettings.focusTime * 60) {
        schedule.push({
          round,
          phase: 'focus',
          duration: remaining,
        });
        remaining = 0;
      } else {
        schedule.push({
          round,
          phase: 'focus',
          duration: formSettings.focusTime * 60,
        });
        remaining -= formSettings.focusTime * 60;
        
        if (remaining > 0) {
          const breakTime = isLongBreakRound ? formSettings.longBreakTime * 60 : formSettings.shortBreakTime * 60;
          const actualBreak = Math.min(breakTime, remaining);
          schedule.push({
            round,
            phase: isLongBreakRound ? 'longBreak' : 'shortBreak',
            duration: actualBreak,
          });
          remaining -= actualBreak;
        }
      }
      
      if (remaining > 0) {
        round++;
      }
    }
    
    return schedule;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>设置</DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {isLocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            计时进行中，部分设置已锁定
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
          限时模式设置
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <TextField
            label="总时间（分钟）"
            type="number"
            fullWidth
            value={form.limitedTime}
            onChange={(e) => setForm({ ...form, limitedTime: Number(e.target.value) })}
            disabled={isLocked}
            inputProps={{ min: 1 }}
            helperText={`共 ${form.limitedTime} 分钟`}
          />
        </Paper>

        {previewSchedule && previewSchedule.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              轮次预览
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha('#2563eb', 0.05),
                maxHeight: 150,
                overflow: 'auto',
              }}
            >
              {previewSchedule.map((scheduleItem, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 60,
                      color: scheduleItem.phase === 'focus' ? 'primary.main' : 'success.main',
                      fontWeight: 500,
                    }}
                  >
                    {scheduleItem.phase === 'focus' ? '专注' : scheduleItem.phase === 'longBreak' ? '长休息' : '短休息'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    第{scheduleItem.round}轮 · {formatDuration(scheduleItem.duration)}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          时间设置（分钟）
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <TextField
              label="专注时间"
              type="number"
              fullWidth
              value={form.focusTime}
              onChange={(e) => setForm({ ...form, focusTime: Number(e.target.value) })}
              inputProps={{ min: 1 }}
              disabled={isLocked}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="短休息"
              type="number"
              fullWidth
              value={form.shortBreakTime}
              onChange={(e) => setForm({ ...form, shortBreakTime: Number(e.target.value) })}
              inputProps={{ min: 1 }}
              disabled={isLocked}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="长休息"
              type="number"
              fullWidth
              value={form.longBreakTime}
              onChange={(e) => setForm({ ...form, longBreakTime: Number(e.target.value) })}
              inputProps={{ min: 1 }}
              disabled={isLocked}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="长休息间隔"
              type="number"
              fullWidth
              value={form.pomodoroRounds}
              onChange={(e) => setForm({ ...form, pomodoroRounds: Number(e.target.value) })}
              inputProps={{ min: 1 }}
              disabled={isLocked}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={form.autoSwitch}
              onChange={(e) => setForm({ ...form, autoSwitch: e.target.checked })}
            />
          }
          label="自动切换阶段"
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.notifications}
              onChange={(e) => {
                const newChecked = e.target.checked;
                setForm({ ...form, notifications: newChecked });
                
                if (newChecked && 'Notification' in window) {
                  if (Notification.permission === 'default') {
                    Notification.requestPermission().then((permission) => {
                      console.log('Notification permission:', permission);
                      setNotificationPermission(permission);
                    });
                  } else if (Notification.permission === 'denied') {
                    // 已拒绝，显示指导信息
                    setNotificationPermission('denied');
                  }
                  // 如果已经授权，不需要做任何事，开关可以自由切换
                }
              }}
              disabled={'Notification' in window ? false : true}
            />
          }
          label={
            <Box>
              <Typography variant="body2">桌面通知</Typography>
              <Typography variant="caption" color="text.secondary">
                {'Notification' in window
                  ? notificationPermission === 'granted' 
                    ? '（已授权，可随时关闭）' 
                    : notificationPermission === 'denied'
                      ? '（已被拒绝）'
                      : '（点击开启以请求权限）'
                  : '（浏览器不支持）'}
              </Typography>
            </Box>
          }
          sx={{ mb: 1 }}
        />

        {notificationPermission === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              通知权限已被拒绝，请按以下步骤重新允许：
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <li>点击浏览器地址栏左侧的🔒锁图标</li>
              <li>找到“网站设置”或“权限”</li>
              <li>将“通知”改为“允许”</li>
              <li>刷新页面后重新开启通知开关</li>
            </Box>
          </Alert>
        )}

        {notificationPermission === 'granted' && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              new Notification('测试通知', {
                body: '如果您看到这条消息，说明通知功能正常工作！',
                icon: '/favicon.svg',
              });
            }}
            sx={{ mb: 2 }}
          >
            发送测试通知
          </Button>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>专注结束提示音</InputLabel>
            <Select
              value={form.focusSound}
              label="专注结束提示音"
              onChange={(e) => setForm({ ...form, focusSound: e.target.value })}
            >
              {sounds.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>休息结束提示音</InputLabel>
            <Select
              value={form.breakSound}
              label="休息结束提示音"
              onChange={(e) => setForm({ ...form, breakSound: e.target.value })}
            >
              {sounds.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="铃声播放次数"
            type="number"
            fullWidth
            value={form.soundRepeatCount}
            onChange={(e) => setForm({ ...form, soundRepeatCount: Number(e.target.value) })}
            inputProps={{ min: 1, max: 5 }}
            helperText="范围：1-5 次，默认 2 次"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} disabled={isLocked}>重置默认</Button>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
}
