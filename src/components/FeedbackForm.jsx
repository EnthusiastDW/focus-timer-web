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
import { saveFeedback, FEEDBACK_TYPES, updateFeedback } from '../utils/feedback';
import { submitToCloudflare } from '../utils/cloudflareFeedback';

export default function FeedbackForm({ onSubmit, editData }) {
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
      setError(err.message || '操作失败，请稍后重试');
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
          {editData ? '更新成功！' : '操作成功！'}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>反馈类型</InputLabel>
        <Select
          value={type}
          label="反馈类型"
          onChange={(e) => setType(e.target.value)}
          data-testid="feedback-type-select"
          disabled={loading}
        >
          <MenuItem value={FEEDBACK_TYPES.BUG}>问题报告</MenuItem>
          <MenuItem value={FEEDBACK_TYPES.FEATURE}>功能建议</MenuItem>
          <MenuItem value={FEEDBACK_TYPES.OTHER}>其他</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'data-testid': 'feedback-title-input' } }}
        disabled={loading}
      />

      <TextField
        fullWidth
        label="详细描述"
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
        label="邮箱（可选）"
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
          {loading ? '保存中...' : '保存草稿'}
        </Button>
        <Button 
          variant="contained" 
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          sx={{ flex: 1 }}
          data-testid="submit-to-github-btn"
        >
          {loading ? '提交中...' : '提交'}
        </Button>
      </Box>
    </Box>
  );
}
