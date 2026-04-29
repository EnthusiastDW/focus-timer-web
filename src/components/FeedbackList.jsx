import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFeedbacks, deleteFeedback, FEEDBACK_TYPES, FEEDBACK_STATUSES, updateFeedbackStatus } from '../utils/feedback';

const typeLabels = {
  [FEEDBACK_TYPES.BUG]: '问题报告',
  [FEEDBACK_TYPES.FEATURE]: '功能建议',
  [FEEDBACK_TYPES.OTHER]: '其他',
};

const typeColors = {
  [FEEDBACK_TYPES.BUG]: 'error',
  [FEEDBACK_TYPES.FEATURE]: 'primary',
  [FEEDBACK_TYPES.OTHER]: 'default',
};

const statusColors = {
  [FEEDBACK_STATUSES.PENDING]: 'warning',
  [FEEDBACK_STATUSES.RESOLVED]: 'success',
  [FEEDBACK_STATUSES.REJECTED]: 'error',
};

const statusLabels = {
  [FEEDBACK_STATUSES.PENDING]: '待处理',
  [FEEDBACK_STATUSES.RESOLVED]: '已解决',
  [FEEDBACK_STATUSES.REJECTED]: '已拒绝',
};

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState(getFeedbacks());
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleDelete = (id) => {
    deleteFeedback(id);
    setFeedbacks(getFeedbacks());
  };

  const handleStatusChange = (id, status) => {
    updateFeedbackStatus(id, status);
    setFeedbacks(getFeedbacks());
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setOpenDialog(true);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        反馈列表 ({feedbacks.length})
      </Typography>

      {feedbacks.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          暂无反馈
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {feedback.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        label={typeLabels[feedback.type]}
                        color={typeColors[feedback.type]}
                        size="small"
                      />
                      <Chip
                        label={statusLabels[feedback.status]}
                        color={statusColors[feedback.status]}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleViewDetails(feedback)} data-testid="view-feedback-btn">
                      查看
                    </Button>
                    <Tooltip title="删除">
                      <IconButton size="small" onClick={() => handleDelete(feedback.id)} data-testid="delete-feedback-btn">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        {selectedFeedback && (
          <>
            <DialogTitle>
              {selectedFeedback.title}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={typeLabels[selectedFeedback.type]}
                  color={typeColors[selectedFeedback.type]}
                  size="small"
                />
                <Chip
                  label={statusLabels[selectedFeedback.status]}
                  color={statusColors[selectedFeedback.status]}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedFeedback.description}
              </Typography>
              {selectedFeedback.email && (
                <Typography variant="body2" color="text.secondary">
                  邮箱：{selectedFeedback.email}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                提交时间：{new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleStatusChange(selectedFeedback.id, FEEDBACK_STATUSES.RESOLVED)}>
                标记为已解决
              </Button>
              <Button onClick={() => handleStatusChange(selectedFeedback.id, FEEDBACK_STATUSES.REJECTED)}>
                拒绝
              </Button>
              <Button onClick={() => setOpenDialog(false)}>关闭</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
