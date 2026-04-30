import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getFeedbacks, deleteFeedback, FEEDBACK_TYPES, FEEDBACK_STATUSES, updateFeedbackIssue, markFeedbackFailed, updateFeedbackStatus } from '../utils/feedback';
import { submitToCloudflare } from '../utils/cloudflareFeedback';

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
  [FEEDBACK_STATUSES.DRAFT]: 'default',
  [FEEDBACK_STATUSES.PENDING]: 'warning',
  [FEEDBACK_STATUSES.RESOLVED]: 'success',
  [FEEDBACK_STATUSES.REJECTED]: 'error',
  [FEEDBACK_STATUSES.FAILED]: 'error',
};

const statusLabels = {
  [FEEDBACK_STATUSES.DRAFT]: '草稿',
  [FEEDBACK_STATUSES.PENDING]: '待处理',
  [FEEDBACK_STATUSES.RESOLVED]: '已解决',
  [FEEDBACK_STATUSES.REJECTED]: '已拒绝',
  [FEEDBACK_STATUSES.FAILED]: '提交失败',
};

export default function FeedbackList({ onEdit }) {
  const [feedbacks, setFeedbacks] = useState(getFeedbacks());
  const [submittingId, setSubmittingId] = useState(null);

  const handleDelete = (id) => {
    deleteFeedback(id);
    setFeedbacks(getFeedbacks());
  };

  const handleEdit = (feedback) => {
    if (onEdit) {
      onEdit(feedback);
    }
  };

  const handleSubmitToGitHub = async (feedback) => {
    setSubmittingId(feedback.id);
    
    try {
      const result = await submitToCloudflare(feedback);
      
      // 更新反馈的 Issue 信息
      updateFeedbackIssue(feedback.id, result.issueNumber, result.issueUrl);
      setFeedbacks(getFeedbacks());
    } catch (err) {
      console.error('提交失败:', err);
      markFeedbackFailed(feedback.id);
      setFeedbacks(getFeedbacks());
      alert('提交失败：' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleMarkResolved = (id) => {
    updateFeedbackStatus(id, FEEDBACK_STATUSES.RESOLVED);
    setFeedbacks(getFeedbacks());
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
                  <Box sx={{ flex: 1, mr: 2 }}>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                    </Typography>
                    {/* 显示详细描述 */}
                    <Typography variant="body2" sx={{ 
                      mt: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {feedback.description}
                    </Typography>
                    {/* 显示邮箱 */}
                    {feedback.email && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        邮箱：{feedback.email}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                    {/* 第一行：操作按钮（编辑、提交、标记、删除） */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* 编辑按钮 - 已提交的不能编辑 */}
                      <Tooltip title={feedback.issueUrl ? '已提交，不能编辑' : '编辑'}>
                        <span>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit(feedback)}
                            disabled={!!feedback.issueUrl}
                            data-testid="edit-feedback-btn"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      {/* 草稿或失败的反馈显示提交按钮 */}
                      {(feedback.status === FEEDBACK_STATUSES.DRAFT || feedback.status === FEEDBACK_STATUSES.FAILED) && (
                        <Tooltip title={feedback.status === FEEDBACK_STATUSES.FAILED ? '重新提交' : '提交到 GitHub'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleSubmitToGitHub(feedback)}
                            disabled={submittingId === feedback.id}
                            data-testid="submit-to-github-btn"
                          >
                            {submittingId === feedback.id ? (
                              <RefreshIcon fontSize="small" sx={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <CloudUploadIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* 标记为已解决 */}
                      {feedback.status !== FEEDBACK_STATUSES.RESOLVED && (
                        <Tooltip title="标记为已处理">
                          <IconButton 
                            size="small" 
                            onClick={() => handleMarkResolved(feedback.id)}
                            data-testid="mark-resolved-btn"
                          >
                            <CheckCircleIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="删除">
                        <IconButton size="small" onClick={() => handleDelete(feedback.id)} data-testid="delete-feedback-btn">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {/* 第二行：查看按钮（仅已提交的显示） */}
                    {feedback.issueUrl && (
                      <Button 
                        size="small"
                        variant="outlined"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open(feedback.issueUrl, '_blank')}
                        data-testid="open-issue-btn"
                        sx={{ mt: 0.5 }}
                      >
                        查看 Issue #{feedback.issueId}
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
