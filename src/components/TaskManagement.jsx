import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Fab,
  Tooltip,
  alpha,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import { useTranslation } from 'react-i18next';
import { useTaskContext } from '../contexts/TaskContext';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { formatDuration } from '../hooks/useTimer';

export default function TaskManagement() {
  const { t } = useTranslation();
  const { state, dispatch } = useTaskContext();
  const { taskTotalTimes } = usePomodoroContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ name: '', link: '', notes: '', groupId: 'default' });
  const [newGroupDialog, setNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({ default: true });

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        name: task.name,
        link: task.link || '',
        notes: task.notes || '',
        groupId: task.groupId || 'default',
      });
    } else {
      setEditingTask(null);
      setTaskForm({ name: '', link: '', notes: '', groupId: 'default' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleSaveTask = () => {
    if (!taskForm.name.trim()) return;

    if (editingTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id: editingTask.id, ...taskForm },
      });
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: taskForm,
      });
    }
    handleCloseDialog();
  };

  const handleDeleteTask = (id) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newId = Date.now().toString();
    dispatch({
      type: 'ADD_GROUP',
      payload: { name: newGroupName.trim() },
    });
    setExpandedGroups(prev => ({ ...prev, [newId]: true }));
    setNewGroupName('');
    setNewGroupDialog(false);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const groupedTasks = useMemo(() => {
    return state.groups.map(group => ({
      ...group,
      tasks: state.tasks.filter(t => t.groupId === group.id),
    }));
  }, [state.groups, state.tasks]);

  const totalTime = useMemo(() => {
    return state.tasks.reduce((sum, t) => sum + (taskTotalTimes[t.id] || 0), 0);
  }, [state.tasks, taskTotalTimes]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('tasks.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('tasks.total_time', { time: formatDuration(totalTime) })}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setNewGroupDialog(true)}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          {t('tasks.new_group')}
        </Button>
      </Box>

      {groupedTasks.map(group => (
        <Card
          key={group.id}
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              bgcolor: alpha('#2563eb', 0.05),
              cursor: 'pointer',
            }}
            onClick={() => toggleGroup(group.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderOutlinedIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {group.name}
              </Typography>
              <Chip
                label={t('tasks.tasks_count', { count: group.tasks.length })}
                size="small"
                sx={{ ml: 1 }}
              />
              {group.tasks.length > 0 && (
                <Chip
                  icon={<TimerOutlinedIcon />}
                  label={formatDuration(group.tasks.reduce((sum, t) => sum + (taskTotalTimes[t.id] || 0), 0))}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <IconButton size="small">
              <ExpandMoreIcon
                sx={{
                  transform: expandedGroups[group.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </IconButton>
          </Box>

          <Collapse in={expandedGroups[group.id] !== false}>
            <Box sx={{ p: 2 }}>
              {group.tasks.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 3 }}
                >
                  {t('tasks.no_tasks')}
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {group.tasks.map(task => (
                    <Grid item xs={12} sm={6} md={4} key={task.id}>
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            {task.name}
                          </Typography>
                          
                          {task.link && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <LinkOutlinedIcon fontSize="small" color="action" />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {task.link}
                              </Typography>
                            </Box>
                          )}
                          
                          {task.notes && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
                              <NotesOutlinedIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {task.notes}
                              </Typography>
                            </Box>
                          )}

                          {(taskTotalTimes[task.id] || 0) > 0 && (
                            <Chip
                              icon={<TimerOutlinedIcon />}
                              label={formatDuration(taskTotalTimes[task.id] || 0)}
                              size="small"
                              variant="outlined"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </CardContent>
                        <CardActions sx={{ pt: 0 }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(task)}
                          >
                            {t('tasks.edit')}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            {t('tasks.delete')}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Collapse>
        </Card>
      ))}

      <Tooltip title={t('tasks.fab_tooltip')}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? t('tasks.edit_task') : t('tasks.add_task')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('tasks.task_name')}
            fullWidth
            value={taskForm.name}
            onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('tasks.link')}
            fullWidth
            value={taskForm.link}
            onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })}
            InputProps={{
              startAdornment: <LinkOutlinedIcon color="action" sx={{ mr: 1 }} />,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('tasks.notes')}
            fullWidth
            multiline
            rows={3}
            value={taskForm.notes}
            onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>{t('tasks.group')}</InputLabel>
            <Select
              value={taskForm.groupId}
              label={t('tasks.group')}
              onChange={(e) => setTaskForm({ ...taskForm, groupId: e.target.value })}
            >
              {state.groups.map(group => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>{t('tasks.cancel')}</Button>
          <Button onClick={handleSaveTask} variant="contained" sx={{ borderRadius: 2 }}>
            {editingTask ? t('tasks.save') : t('tasks.add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newGroupDialog} onClose={() => setNewGroupDialog(false)}>
        <DialogTitle>{t('tasks.new_group_title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('tasks.group_name')}
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewGroupDialog(false)}>{t('tasks.cancel')}</Button>
          <Button onClick={handleAddGroup} variant="contained" sx={{ borderRadius: 2 }}>
            {t('tasks.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
