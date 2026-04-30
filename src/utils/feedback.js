export const FEEDBACK_TYPES = {
  BUG: 'bug',
  FEATURE: 'feature',
  OTHER: 'other',
};

export const FEEDBACK_STATUSES = {
  DRAFT: 'draft',        // 草稿
  PENDING: 'pending',    // 已提交，待处理
  RESOLVED: 'resolved',  // 已解决
  REJECTED: 'rejected',  // 已拒绝
  FAILED: 'failed',      // 提交失败
};

/**
 * 生成唯一 ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 保存反馈草稿
 */
export function saveFeedback(feedback) {
  const feedbacks = getFeedbacks();
  const newFeedback = {
    ...feedback,
    id: generateUniqueId(),
    createdAt: new Date().toISOString(),
    status: FEEDBACK_STATUSES.DRAFT,
    issueId: null,
    issueUrl: null,
  };
  feedbacks.push(newFeedback);
  setStorageItem('focus-timer-feedbacks', feedbacks);
  return newFeedback;
}

/**
 * 更新反馈的 GitHub Issue 信息
 */
export function updateFeedbackIssue(id, issueId, issueUrl) {
  const feedbacks = getFeedbacks();
  const updated = feedbacks.map(f =>
    f.id === id ? { 
      ...f, 
      issueId, 
      issueUrl,
      status: FEEDBACK_STATUSES.PENDING 
    } : f
  );
  setStorageItem('focus-timer-feedbacks', updated);
}

/**
 * 标记反馈提交失败
 */
export function markFeedbackFailed(id) {
  const feedbacks = getFeedbacks();
  const updated = feedbacks.map(f =>
    f.id === id ? { ...f, status: FEEDBACK_STATUSES.FAILED } : f
  );
  setStorageItem('focus-timer-feedbacks', updated);
}

export function getFeedbacks() {
  return getStorageItem('focus-timer-feedbacks', []);
}

export function deleteFeedback(id) {
  const feedbacks = getFeedbacks();
  const filtered = feedbacks.filter(f => f.id !== id);
  setStorageItem('focus-timer-feedbacks', filtered);
}

export function updateFeedbackStatus(id, status) {
  const feedbacks = getFeedbacks();
  const updated = feedbacks.map(f =>
    f.id === id ? { ...f, status } : f
  );
  setStorageItem('focus-timer-feedbacks', updated);
}

/**
 * 获取指定状态的反馈
 */
export function getFeedbacksByStatus(status) {
  const feedbacks = getFeedbacks();
  return feedbacks.filter(f => f.status === status);
}

/**
 * 更新反馈内容
 */
export function updateFeedback(id, updates) {
  const feedbacks = getFeedbacks();
  const updated = feedbacks.map(f =>
    f.id === id ? { ...f, ...updates } : f
  );
  setStorageItem('focus-timer-feedbacks', updated);
}

function getStorageItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return defaultValue;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to storage:', error);
  }
}
