import { useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

export default function FeedbackPage() {
  const [tab, setTab] = useState(0);
  const [editData, setEditData] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleEdit = (feedback) => {
    setEditData(feedback);
    setTab(0); // 切换到表单标签
  };

  const handleSubmitSuccess = () => {
    setEditData(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        反馈
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="提交反馈" />
          <Tab label="查看反馈" />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        <>
          {editData && (
            <Typography variant="h6" gutterBottom color="primary">
              编辑反馈
            </Typography>
          )}
          <FeedbackForm 
            editData={editData} 
            onSubmit={handleSubmitSuccess}
          />
        </>
      ) : (
        <FeedbackList onEdit={handleEdit} />
      )}
    </Container>
  );
}
