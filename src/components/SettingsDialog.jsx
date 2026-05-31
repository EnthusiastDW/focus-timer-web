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
import { useTranslation } from 'react-i18next';
import { usePomodoroContext, defaultSettings } from '../contexts/PomodoroContext';
import { formatDuration } from '../hooks/useTimer';

export default function SettingsDialog({ open, onClose }) {
  const { t } = useTranslation();
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
    { value: 'default', label: t('settings.sound_default') },
    { value: 'bell', label: t('settings.sound_bell') },
    { value: 'chime', label: t('settings.sound_chime') },
    { value: 'none', label: t('settings.sound_none') },
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
      <DialogTitle>{t('settings.title')}</DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {isLocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('settings.locked_warning')}
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
          {t('settings.limited_mode_title')}
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
            label={t('settings.total_minutes')}
            type="number"
            fullWidth
            value={form.limitedTime}
            onChange={(e) => setForm({ ...form, limitedTime: Number(e.target.value) })}
            disabled={isLocked}
            inputProps={{ min: 1 }}
            helperText={t('settings.total_minutes_helper', { count: form.limitedTime })}
          />
        </Paper>

        {previewSchedule && previewSchedule.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('settings.round_preview')}
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
                    {scheduleItem.phase === 'focus' ? t('phase.focus') : scheduleItem.phase === 'longBreak' ? t('phase.long_break') : t('phase.short_break')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.round_label', { round: scheduleItem.round, duration: formatDuration(scheduleItem.duration) })}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          {t('settings.time_settings')}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <TextField
              label={t('settings.focus_time')}
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
              label={t('settings.short_break')}
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
              label={t('settings.long_break')}
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
              label={t('settings.long_break_interval')}
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
          label={t('settings.auto_switch')}
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
              <Typography variant="body2">{t('settings.desktop_notification')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {'Notification' in window
                  ? notificationPermission === 'granted' 
                    ? t('settings.notification_granted') 
                    : notificationPermission === 'denied'
                      ? t('settings.notification_denied')
                      : t('settings.notification_prompt')
                  : t('settings.notification_unsupported')}
              </Typography>
            </Box>
          }
          sx={{ mb: 1 }}
        />

        {notificationPermission === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('settings.notification_denied_title')}
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <li>{t('settings.notification_step_1')}</li>
              <li>{t('settings.notification_step_2')}</li>
              <li>{t('settings.notification_step_3')}</li>
              <li>{t('settings.notification_step_4')}</li>
            </Box>
          </Alert>
        )}

        {notificationPermission === 'granted' && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              new Notification(t('settings.send_test'), {
                body: t('settings.test_body'),
                icon: '/favicon.svg',
              });
            }}
            sx={{ mb: 2 }}
          >
            {t('settings.send_test')}
          </Button>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.focus_end_sound')}</InputLabel>
            <Select
              value={form.focusSound}
              label={t('settings.focus_end_sound')}
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
            <InputLabel>{t('settings.break_end_sound')}</InputLabel>
            <Select
              value={form.breakSound}
              label={t('settings.break_end_sound')}
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
            label={t('settings.sound_repeat')}
            type="number"
            fullWidth
            value={form.soundRepeatCount}
            onChange={(e) => setForm({ ...form, soundRepeatCount: Number(e.target.value) })}
            inputProps={{ min: 1, max: 5 }}
            helperText={t('settings.sound_repeat_helper')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} disabled={isLocked}>{t('settings.reset_default')}</Button>
        <Button onClick={onClose}>{t('settings.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">{t('settings.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
