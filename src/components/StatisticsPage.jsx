import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  alpha,
} from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { usePomodoroContext } from '../contexts/PomodoroContext';
import { useTaskContext } from '../contexts/TaskContext';
import { formatDuration } from '../hooks/useTimer';

export default function StatisticsPage() {
  const { history, dailyTaskStats, taskTotalTimes } = usePomodoroContext();
  const { state: taskState } = useTaskContext();
  const [tab, setTab] = useState(0);

  const today = new Date().toLocaleDateString('zh-CN');

  const stats = useMemo(() => {
    // 今日专注记录
    const todayHistory = history.filter(h => h.date === today);
    const todayFocusTime = todayHistory.reduce((sum, h) => sum + (h.duration || 0), 0);
    const todaySessions = todayHistory.length;

    // 总专注时间
    const totalFocusTime = history.reduce((sum, h) => sum + (h.duration || 0), 0);
    const totalSessions = history.length;

    // 今日任务统计
    const todayTaskStats = taskState.tasks.map(task => ({
      ...task,
      todayTime: dailyTaskStats[task.id] || 0,
      totalTime: taskTotalTimes[task.id] || 0,
    })).sort((a, b) => b.todayTime - a.todayTime);

    // 未分配任务的时间
    const todayUnassignedTime = dailyTaskStats['unassigned'] || 0;

    // 分组统计
    const groupStats = taskState.groups.map(group => {
      const groupTaskIds = taskState.tasks.filter(t => t.groupId === group.id).map(t => t.id);
      const totalTime = groupTaskIds.reduce((sum, taskId) => {
        return sum + (taskTotalTimes[taskId] || 0);
      }, 0);
      return { ...group, totalTime };
    }).sort((a, b) => b.totalTime - a.totalTime);

    // 按日期统计
    const dailyStats = {};
    history.forEach(h => {
      dailyStats[h.date] = (dailyStats[h.date] || 0) + h.duration;
    });

    const sortedDailyStats = Object.entries(dailyStats)
      .sort((a, b) => new Date(b[0].replace(/年|月/g, '-').replace(/日/g, '')) - new Date(a[0].replace(/年|月/g, '-').replace(/日/g, '')));

    return {
      todayHistory,
      todayFocusTime,
      todaySessions,
      totalFocusTime,
      totalSessions,
      todayTaskStats,
      groupStats,
      sortedDailyStats,
      todayUnassignedTime,
    };
  }, [history, taskState.tasks, taskState.groups, dailyTaskStats, taskTotalTimes, today]);

  const todayTotalMinutes = Math.round(stats.todayFocusTime / 60);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        统计分析
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: `linear-gradient(135deg, ${alpha('#2563eb', 0.1)} 0%, ${alpha('#2563eb', 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarTodayOutlinedIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  今日专注
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {formatDuration(stats.todayFocusTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.todaySessions} 条记录
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: `linear-gradient(135deg, ${alpha('#059669', 0.1)} 0%, ${alpha('#059669', 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpOutlinedIcon sx={{ color: '#059669' }} />
                <Typography variant="body2" color="text.secondary">
                  总专注时间
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#059669' }}>
                {formatDuration(stats.totalFocusTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalSessions} 条记录
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: `linear-gradient(135deg, ${alpha('#7c3aed', 0.1)} 0%, ${alpha('#7c3aed', 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssignmentOutlinedIcon sx={{ color: '#7c3aed' }} />
                <Typography variant="body2" color="text.secondary">
                  任务数量
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                {taskState.tasks.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {taskState.groups.length} 个分组
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: `linear-gradient(135deg, ${alpha('#ec4899', 0.1)} 0%, ${alpha('#ec4899', 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WatchOutlinedIcon sx={{ color: '#ec4899' }} />
                <Typography variant="body2" color="text.secondary">
                  平均每日
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#ec4899' }}>
                {stats.sortedDailyStats.length > 0
                  ? formatDuration(Math.round(stats.totalFocusTime / stats.sortedDailyStats.length))
                  : '0分钟'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.sortedDailyStats.length} 天记录
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
          }}
        >
          <Tab icon={<AssignmentOutlinedIcon />} iconPosition="start" label="今日任务" />
          <Tab icon={<FolderOutlinedIcon />} iconPosition="start" label="按分组" />
          <Tab icon={<CalendarTodayOutlinedIcon />} iconPosition="start" label="按时间" />
          <Tab icon={<TimerOutlinedIcon />} iconPosition="start" label="全部任务" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  今日任务专注时间
                </Typography>
                <Chip
                  label={`总计 ${Math.round(stats.todayFocusTime / 60)} 分钟`}
                  color="primary"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {stats.todayTaskStats.length === 0 && stats.todayUnassignedTime === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  今日暂无专注记录
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {stats.todayTaskStats.filter(t => t.todayTime > 0).map(task => (
                    <Grid item xs={12} sm={6} md={4} key={task.id}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          height: '100%',
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            {task.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              icon={<TimerOutlinedIcon />}
                              label={formatDuration(task.todayTime)}
                              color="primary"
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                              ({Math.round(task.todayTime / 60)}分钟)
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {stats.todayUnassignedTime > 0 && (
                    <Grid item xs={12} sm={6} md={4} key="unassigned">
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          border: '1px dashed',
                          borderColor: 'divider',
                          height: '100%',
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontStyle: 'italic' }}>
                            未分配任务
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              icon={<TimerOutlinedIcon />}
                              label={formatDuration(stats.todayUnassignedTime)}
                              color="default"
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                              ({Math.round(stats.todayUnassignedTime / 60)}分钟)
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Grid container spacing={2}>
              {stats.groupStats.map(group => (
                <Grid item xs={12} sm={6} md={4} key={group.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <FolderOutlinedIcon color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {group.name}
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                        {formatDuration(group.totalTime)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {stats.groupStats.length === 0 && (
                <Grid item xs={12}>
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    暂无分组数据
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {tab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>日期</TableCell>
                    <TableCell align="right">专注时间</TableCell>
                    <TableCell align="right">记录数</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.sortedDailyStats.map(([date, time]) => {
                    const dayRecords = history.filter(h => h.date === date).length;
                    return (
                      <TableRow key={date}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayOutlinedIcon color="action" fontSize="small" />
                            {date}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={formatDuration(time)} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="right">{dayRecords} 条</TableCell>
                      </TableRow>
                    );
                  })}
                  {stats.sortedDailyStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          暂无数据
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === 3 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>任务名称</TableCell>
                    <TableCell align="right">今日专注</TableCell>
                    <TableCell align="right">总专注时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.todayTaskStats.map(task => {
                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentOutlinedIcon color="action" fontSize="small" />
                            {task.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatDuration(task.todayTime)}
                            size="small"
                            color={task.todayTime > 0 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={formatDuration(task.totalTime)} size="small" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {stats.todayTaskStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          暂无任务
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
