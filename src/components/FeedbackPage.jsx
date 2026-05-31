import { useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Box,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

// GitHub Issues URL - 过滤为当前项目
// 使用 label 参数筛选，GitHub 标签搜索需要使用引号包裹含特殊字符的标签
const GITHUB_ISSUES_URL = 'https://github.com/EnthusiastDW/feedback/issues?q=is%3Aissue+label%3A%22project%3Afocus-timer%22';

export default function FeedbackPage() {
  const { t } = useTranslation();
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('feedback.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={() => window.open(GITHUB_ISSUES_URL, '_blank')}
          sx={{ textTransform: 'none' }}
        >
          {t('feedback.view_github')}
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label={t('feedback.submit_tab')} />
          <Tab label={t('feedback.view_tab')} />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        <>
          {editData && (
            <Typography variant="h6" gutterBottom color="primary">
              {t('feedback.edit_feedback')}
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
