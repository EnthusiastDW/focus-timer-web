import { useState } from 'react';
import {
  Box,
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

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
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

      {tab === 0 ? <FeedbackForm /> : <FeedbackList />}
    </Container>
  );
}
