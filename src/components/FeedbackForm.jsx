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
import { saveFeedback, FEEDBACK_TYPES } from '../utils/feedback';

export default function FeedbackForm({ onSubmit }) {
  const [type, setType] = useState(FEEDBACK_TYPES.BUG);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    const feedback = saveFeedback({
      type,
      title: title.trim(),
      description: description.trim(),
      email: email.trim(),
    });

    setSuccess(true);
    setType(FEEDBACK_TYPES.BUG);
    setTitle('');
    setDescription('');
    setEmail('');

    if (onSubmit) {
      onSubmit(feedback);
    }

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          反馈提交成功！
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>反馈类型</InputLabel>
        <Select
          value={type}
          label="反馈类型"
          onChange={(e) => setType(e.target.value)}
          data-testid="feedback-type-select"
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
      />

      <TextField
        fullWidth
        label="邮箱（可选）"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'data-testid': 'feedback-email-input' } }}
      />

      <Button type="submit" variant="contained" fullWidth data-testid="submit-feedback-btn">
        提交反馈
      </Button>
    </Box>
  );
}
