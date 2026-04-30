import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { useTaskContext } from '../contexts/TaskContext';
import { formatDuration } from '../hooks/useTimer';

export default function HistoryList({ open, onClose }) {
  const { history, taskTotalTimes } = usePomodoroContext();
  const { state: taskState } = useTaskContext();
  const [editingId, setEditingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState('');

  // 按日期分组的历史记录
  const groupedHistory = useMemo(() => {
    const groups = {};
    
    history.forEach(record => {
      if (!groups[record.date]) {
        groups[record.date] = [];
      }
      groups[record.date].push(record);
    });

    // 按日期排序（最新的在前）
    return Object.entries(groups)
      .sort((a, b) => {
        const dateA = new Date(a[0].replace(/年|月/g, '-').replace(/日/g, ''));
        const dateB = new Date(b[0].replace(/年|月/g, '-').replace(/日/g, ''));
        return dateB - dateA;
      });
  }, [history]);

  const getTaskName = (taskId) => {
    // taskId 现在是 'unassigned' 或具体的任务ID
    if (taskId === 'unassigned') return '未分配任务';
    const task = taskState.tasks.find(t => t.id === taskId);
    return task ? task.name : '未知任务';
  };

  const handleTaskChange = () => {
    if (editingId) {
      // 这里可以添加更新历史记录任务的逻辑
      setEditingId(null);
      setSelectedTask('');
    }
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
          <Box>
            {groupedHistory.map(([date, records]) => {
              const dayTotal = records.reduce((sum, r) => sum + r.duration, 0);
              
              return (
                <Box key={date} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CalendarTodayOutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {date}
                    </Typography>
                    <Chip
                      label={formatDuration(dayTotal)}
                      size="small"
                      color="primary"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>

                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>任务</TableCell>
                          <TableCell align="right">专注时长</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {records.map(record => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssignmentOutlinedIcon color="action" fontSize="small" />
                                {getTaskName(record.taskId)}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                icon={<TimerOutlinedIcon />}
                                label={formatDuration(record.duration)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
}
