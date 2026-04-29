import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { useTaskContext } from '../contexts/TaskContext';
import { formatDuration, getPhaseLabel } from '../hooks/useTimer';

export default function HistoryList({ open, onClose }) {
  const { history, updateHistoryTask } = usePomodoroContext();
  const { state: taskState } = useTaskContext();
  const [editingId, setEditingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState('');

  const handleTaskChange = () => {
    if (editingId) {
      updateHistoryTask(editingId, selectedTask || null);
      setEditingId(null);
      setSelectedTask('');
    }
  };

  const phaseColors = {
    focus: 'primary',
    shortBreak: 'success',
    longBreak: 'secondary',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>专注历史</DialogTitle>
      <DialogContent>
        {history.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            暂无历史记录
          </Typography>
        ) : (
          <List>
            {history.slice().reverse().map(item => (
              <ListItem key={item.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getPhaseLabel(item.phase)}
                        color={phaseColors[item.phase]}
                        size="small"
                      />
                      {item.taskId && (
                        <Typography variant="body2" color="text.secondary">
                          任务: {taskState.tasks.find(t => t.id === item.taskId)?.name || '未知任务'}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        时长: {formatDuration(item.duration)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" display="block">
                        {new Date(item.completedAt).toLocaleString('zh-CN')}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => {
                    setEditingId(item.id);
                    setSelectedTask(item.taskId || '');
                  }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Dialog open={Boolean(editingId)} onClose={() => setEditingId(null)}>
          <DialogTitle>修正关联任务</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>选择任务</InputLabel>
              <Select
                value={selectedTask}
                label="选择任务"
                onChange={(e) => setSelectedTask(e.target.value)}
              >
                <MenuItem value="">无任务</MenuItem>
                {taskState.tasks.map(task => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingId(null)}>取消</Button>
            <Button onClick={handleTaskChange} variant="contained">
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
}
