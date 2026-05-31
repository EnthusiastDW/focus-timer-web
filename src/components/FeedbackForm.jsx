import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { saveFeedback, FEEDBACK_TYPES, updateFeedback } from '../utils/feedback';
import { submitToCloudflare } from '../utils/cloudflareFeedback';

export default function FeedbackForm({ onSubmit, editData }) {
  const { t } = useTranslation();
  const [type, setType] = useState(editData?.type || FEEDBACK_TYPES.BUG);
  const [title, setTitle] = useState(editData?.title || '');
  const [description, setDescription] = useState(editData?.description || '');
  const [email, setEmail] = useState(editData?.email || '');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e, submitToGitHub = false) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const feedback = {
        type,
        title: title.trim(),
        description: description.trim(),
        email: email.trim(),
      };

      if (submitToGitHub) {
        // 直接提交到 GitHub
        const result = await submitToCloudflare(feedback);
        
        if (editData) {
          // 编辑模式：更新现有反馈
          const { updateFeedbackIssue } = await import('../utils/feedback');
          updateFeedbackIssue(editData.id, result.issueNumber, result.issueUrl);
        } else {
          // 新建模式：保存并关联 Issue
          const savedFeedback = saveFeedback(feedback);
          const { updateFeedbackIssue } = await import('../utils/feedback');
          updateFeedbackIssue(savedFeedback.id, result.issueNumber, result.issueUrl);
        }
        
        setSuccess(true);
        resetForm();
        
        if (onSubmit) {
          onSubmit();
        }
      } else {
        // 仅保存草稿
        if (editData) {
          // 编辑模式：更新现有反馈
          updateFeedback(editData.id, feedback);
        } else {
          // 新建模式：创建新反馈
          saveFeedback(feedback);
        }
        
        setSuccess(true);
        resetForm();
        
        if (onSubmit) {
          onSubmit();
        }
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('操作失败:', err);
      setError(err.message || t('feedback.operation_failed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType(FEEDBACK_TYPES.BUG);
    setTitle('');
    setDescription('');
    setEmail('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {editData ? t('feedback.update_success') : t('feedback.operation_success')}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('feedback.type_label')}</InputLabel>
        <Select
          value={type}
          label={t('feedback.type_label')}
          onChange={(e) => setType(e.target.value)}
          data-testid="feedback-type-select"
          disabled={loading}
        >
          <MenuItem value={FEEDBACK_TYPES.BUG}>{t('feedback.bug')}</MenuItem>
          <MenuItem value={FEEDBACK_TYPES.FEATURE}>{t('feedback.feature')}</MenuItem>
          <MenuItem value={FEEDBACK_TYPES.OTHER}>{t('feedback.other')}</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label={t('feedback.title_field')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'data-testid': 'feedback-title-input' } }}
        disabled={loading}
      />

      <TextField
        fullWidth
        label={t('feedback.description')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        multiline
        rows={4}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'data-testid': 'feedback-description-input' } }}
        disabled={loading}
      />

      <TextField
        fullWidth
        label={t('feedback.email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'data-testid': 'feedback-email-input' } }}
        disabled={loading}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined"
          onClick={(e) => handleSubmit(e, false)}
          disabled={loading}
          sx={{ flex: 1 }}
          data-testid="save-draft-btn"
        >
          {loading ? t('feedback.saving') : t('feedback.save_draft')}
        </Button>
        <Button 
          variant="contained" 
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          sx={{ flex: 1 }}
          data-testid="submit-to-github-btn"
        >
          {loading ? t('feedback.submitting') : t('feedback.submit')}
        </Button>
      </Box>
    </Box>
  );
}
