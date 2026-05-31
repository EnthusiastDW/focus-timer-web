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
import { useTranslation } from 'react-i18next';
import { getFeedbacks, deleteFeedback, FEEDBACK_TYPES, FEEDBACK_STATUSES, updateFeedbackIssue, markFeedbackFailed, updateFeedbackStatus } from '../utils/feedback';
import { submitToCloudflare } from '../utils/cloudflareFeedback';

function getTypeLabel(type, t) {
  const labels = {
    [FEEDBACK_TYPES.BUG]: t('feedback.bug'),
    [FEEDBACK_TYPES.FEATURE]: t('feedback.feature'),
    [FEEDBACK_TYPES.OTHER]: t('feedback.other'),
  };
  return labels[type] || type;
}

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

function getStatusLabel(status, t) {
  const labels = {
    [FEEDBACK_STATUSES.DRAFT]: t('feedback.status_draft'),
    [FEEDBACK_STATUSES.PENDING]: t('feedback.status_pending'),
    [FEEDBACK_STATUSES.RESOLVED]: t('feedback.status_resolved'),
    [FEEDBACK_STATUSES.REJECTED]: t('feedback.status_rejected'),
    [FEEDBACK_STATUSES.FAILED]: t('feedback.status_failed'),
  };
  return labels[status] || status;
}

export default function FeedbackList({ onEdit }) {
  const { t, i18n } = useTranslation();
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
      alert(t('feedback.submit_failed') + err.message);
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
        {t('feedback.list_title', { count: feedbacks.length })}
      </Typography>

      {feedbacks.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {t('feedback.no_feedback')}
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
                        label={getTypeLabel(feedback.type, t)}
                        color={typeColors[feedback.type]}
                        size="small"
                      />
                      <Chip
                        label={getStatusLabel(feedback.status, t)}
                        color={statusColors[feedback.status]}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {new Date(feedback.createdAt).toLocaleString(i18n.language)}
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
                        {t('feedback.email_label')}{feedback.email}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                    {/* 第一行：操作按钮（编辑、提交、标记、删除） */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* 编辑按钮 - 已提交的不能编辑 */}
                      <Tooltip title={feedback.issueUrl ? t('feedback.cannot_edit') : t('feedback.edit_tooltip')}>
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
                        <Tooltip title={feedback.status === FEEDBACK_STATUSES.FAILED ? t('feedback.resubmit') : t('feedback.submit_github')}>
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
                        <Tooltip title={t('feedback.mark_resolved')}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMarkResolved(feedback.id)}
                            data-testid="mark-resolved-btn"
                          >
                            <CheckCircleIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title={t('feedback.delete_tooltip')}>
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
                        {t('feedback.view_issue', { id: feedback.issueId })}
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
