export const FEEDBACK_TYPES = {
  BUG: 'bug',
  FEATURE: 'feature',
  OTHER: 'other',
};

export const FEEDBACK_STATUSES = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export function saveFeedback(feedback) {
  const feedbacks = getFeedbacks();
  const newFeedback = {
    ...feedback,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: FEEDBACK_STATUSES.PENDING,
  };
  feedbacks.push(newFeedback);
  setStorageItem('focus-timer-feedbacks', feedbacks);
  return newFeedback;
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
