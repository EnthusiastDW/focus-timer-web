// Cloudflare Workers API 配置
const API_URL = import.meta.env.VITE_FEEDBACK_API_URL || 
                'https://feedback.dengwei.site';

// 当前项目标识（用于多项目统一管理）
const PROJECT_ID = 'focus-timer';

/**
 * 提交反馈到 Cloudflare Workers
 */
export async function submitToCloudflare(feedback) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...feedback,
      project: PROJECT_ID,  // 添加项目标识
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '提交失败，请稍后重试');
  }

  return response.json();
}
