import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  Autocomplete,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { useTaskContext } from '../contexts/TaskContext';
import { formatTime, formatDuration } from '../hooks/useTimer';

const phaseConfig = {
  focus: {
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    icon: <TimerOutlinedIcon />,
    label: '专注中',
    titlePrefix: '专注',
  },
  shortBreak: {
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon: <CoffeeOutlinedIcon />,
    label: '短休息',
    titlePrefix: '短休息',
  },
  longBreak: {
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    icon: <SelfImprovementOutlinedIcon />,
    label: '长休息',
    titlePrefix: '长休息',
  },
};

export default function PomodoroTimer({ onNavigate }) {
  const { timerState, settings, startTimer, pauseTimer, resetTimer, skipPhase, setTaskId, totalDailyTime, limitedSchedule, updateSettings, isLocked } = usePomodoroContext();
  const { state: taskState, dispatch } = useTaskContext();
  const [limitedTimeInput, setLimitedTimeInput] = useState(settings.limitedTime);
  const [taskSearchValue, setTaskSearchValue] = useState('');
  const isSmUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const timerSize = isSmUp ? 340 : 280;

  const currentPhase = phaseConfig[timerState.phase] || phaseConfig.focus;
  const currentTask = taskState.tasks.find(t => t.id === timerState.taskId);

  useEffect(() => {
    if (timerState.isRunning) {
      document.title = `${currentPhase.titlePrefix} - ${formatTime(timerState.timeRemaining)} | Focus Timer`;
    } else {
      document.title = 'Focus Timer';
    }
  }, [timerState.timeRemaining, timerState.isRunning, timerState.phase, currentPhase.titlePrefix]);

  const phaseTime = timerState.phase === 'focus' 
    ? settings.focusTime 
    : timerState.phase === 'shortBreak' 
      ? settings.shortBreakTime 
      : settings.longBreakTime;

  const progress = ((phaseTime - timerState.timeRemaining) / phaseTime) * 100;

  const handleModeChange = (event, newMode) => {
    if (newMode && !isLocked) {
      updateSettings({ mode: newMode });
    }
  };

  const handleLimitedTimeChange = (e) => {
    const value = Number(e.target.value);
    if (value > 0) {
      setLimitedTimeInput(value);
    }
  };

  const handleLimitedTimeBlur = () => {
    if (limitedTimeInput !== settings.limitedTime && limitedTimeInput > 0) {
      updateSettings({ limitedTime: limitedTimeInput });
    }
  };

  const totalRounds = settings.mode === 'limited' && limitedSchedule 
    ? limitedSchedule.filter(item => item.phase === 'focus').length 
    : settings.pomodoroRounds;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      minHeight: 'calc(100vh - 64px)',
      justifyContent: 'center',
      px: 2,
    }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            p: 0.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ToggleButtonGroup
            value={settings.mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            disabled={isLocked}
          >
            <ToggleButton 
              value="free"
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                px: { xs: 1.5, sm: 2 },
                whiteSpace: 'nowrap',
              }}
            >
              <AllInclusiveIcon sx={{ mr: 0.5, fontSize: 18 }} />
              <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>自由模式</Box>
            </ToggleButton>
            <ToggleButton 
              value="limited"
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                px: { xs: 1.5, sm: 2 },
                whiteSpace: 'nowrap',
              }}
            >
              <ScheduleIcon sx={{ mr: 0.5, fontSize: 18 }} />
              <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>限时模式</Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {settings.mode === 'limited' && (
          <TextField
            type="number"
            value={limitedTimeInput}
            onChange={handleLimitedTimeChange}
            onBlur={handleLimitedTimeBlur}
            disabled={isLocked}
            size="small"
            InputProps={{
              endAdornment: <InputAdornment position="end">分钟</InputAdornment>,
            }}
            sx={{
              width: 100,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            inputProps={{ min: 1, style: { textAlign: 'center' } }}
          />
        )}
      </Box>

      {/* 进度条容器 */}
      <Box sx={{ position: 'relative', mb: 3, width: timerSize, height: timerSize }}>
          {/* 背景圆环 */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={timerSize}
            thickness={2.5}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: alpha(currentPhase.color, 0.2),
            }}
          />
          {/* 进度圆环 */}
          <CircularProgress
            variant="determinate"
            value={progress}
            size={timerSize}
            thickness={2.5}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: currentPhase.color,
              transition: 'all 0.5s ease',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: timerSize - 24,
            height: timerSize - 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: currentPhase.gradient,
            boxShadow: `0 20px 60px ${alpha(currentPhase.color, 0.4)}`,
            flexShrink: 0,
          }}
        >
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            zIndex: 1,
            px: 2,
          }}
        >
          {/* 阶段标签 */}
          <Chip
            icon={currentPhase.icon}
            label={currentPhase.label}
            size="small"
            sx={{
              mb: 2,
              bgcolor: alpha('#fff', 0.2),
              color: 'white',
              fontWeight: 500,
              '& .MuiChip-icon': { color: 'white' },
            }}
          />
          
          {/* 倒计时时间 */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '3.5rem', sm: '4.5rem' },
              fontWeight: 200,
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            {formatTime(timerState.timeRemaining)}
          </Typography>
          
          {/* 轮次信息 */}
          <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.9 }}>
            轮次 {timerState.currentRound} / {totalRounds}
          </Typography>

          {/* 当前任务显示 */}
          {currentTask && (
            <Box
              sx={{
                mt: 2,
                px: 2,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: alpha('#fff', 0.15),
                backdropFilter: 'blur(10px)',
                maxWidth: '90%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}
              >
                📌 {currentTask.name}
              </Typography>
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskId(null);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.3),
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 14, color: 'white' }} />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={timerState.isRunning ? pauseTimer : startTimer}
          startIcon={timerState.isRunning ? <PauseIcon /> : <PlayArrowIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            background: currentPhase.gradient,
            boxShadow: `0 4px 20px ${alpha(currentPhase.color, 0.4)}`,
            '&:hover': {
              background: currentPhase.gradient,
            },
            whiteSpace: 'nowrap',
          }}
        >
          {timerState.isRunning ? '暂停' : '开始'}
        </Button>
        {/* 只有在计时进行中或已经部分完成时才显示跳过按钮 */}
        {(timerState.isRunning || timerState.timeRemaining < phaseTime) && (
          <Button
            variant="outlined"
            onClick={skipPhase}
            startIcon={<SkipNextIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            跳过
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={resetTimer}
          startIcon={<RestartAltIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          重置
        </Button>
      </Box>

      {/* 任务选择区域 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', maxWidth: 600, mb: 3 }}>
        <Autocomplete
          freeSolo
          options={taskState.tasks}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
          value={currentTask || null}
          inputValue={taskSearchValue}
          onInputChange={(event, newInputValue) => {
            setTaskSearchValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              // 用户输入了新任务名称
              const newTask = {
                id: Date.now().toString(),
                name: newValue.trim(),
                groupId: 'default',
                createdAt: new Date().toISOString(),
                totalTime: 0,
              };
              dispatch({
                type: 'ADD_TASK',
                payload: newTask,
              });
              setTaskId(newTask.id);
            } else if (newValue && newValue.id) {
              // 选择了现有任务
              setTaskId(newValue.id);
            } else {
              // 清空选择
              setTaskId(null);
            }
            setTaskSearchValue('');
          }}
          sx={{ width: '100%', maxWidth: 300 }}
          PopperComponent={(props) => (
            <div
              {...props}
              style={{
                ...props.style,
                minWidth: '600px',
              }}
            />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="搜索或创建任务"
              placeholder="输入任务名称或从列表中选择"
              size="small"
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                },
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {taskSearchValue.trim() && (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          按回车创建
                        </Typography>
                      </InputAdornment>
                    )}
                    {params.InputProps?.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            const task = typeof option === 'string' ? { name: option } : option;
            const isSelected = timerState.taskId === (option.id || null);
            return (
              <Box
                component="li"
                {...props}
                sx={{
                  py: 0.75,
                  '&:hover': {
                    bgcolor: alpha(currentPhase.color, 0.08),
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      flex: 1,
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {task.name}
                  </Typography>
                  {isSelected && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      ✓ 当前
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          }}
          noOptionsText={taskSearchValue.trim() ? `创建 "${taskSearchValue}"` : '暂无任务'}
          disableClearable={false}
        />
      </Box>

      <Paper
        elevation={0}
        onClick={() => onNavigate && onNavigate('statistics')}
        sx={{
          px: 3,
          py: 1.5,
          borderRadius: 3,
          bgcolor: alpha(currentPhase.color, 0.1),
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          今日专注时间
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600, color: currentPhase.color }}>
          {formatDuration(totalDailyTime || 0)}
        </Typography>
      </Paper>
    </Box>
  );
}
