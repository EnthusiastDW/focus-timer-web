import { test, expect } from '@playwright/test';

test.describe('Focus Timer Application', () => {
  test('should display main navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Focus Timer')).toBeVisible();
  });

  test('should navigate to feedback page and submit feedback', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: '菜单' }).click();
    await page.getByText('反馈').click();
    
    await expect(page.getByRole('heading', { name: '反馈' })).toBeVisible();
    
    await page.getByTestId('feedback-title-input').fill('测试问题报告');
    await page.getByTestId('feedback-description-input').fill('这是一个测试问题描述');
    await page.getByTestId('submit-feedback-btn').click();
    
    await expect(page.getByText('反馈提交成功！')).toBeVisible();
  });

  test('should view submitted feedback', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: '菜单' }).click();
    await page.getByText('反馈').click();
    
    await page.getByTestId('feedback-title-input').fill('查看测试反馈');
    await page.getByTestId('feedback-description-input').fill('这是用于查看测试的反馈内容');
    await page.getByTestId('submit-feedback-btn').click();
    
    await expect(page.getByText('反馈提交成功！')).toBeVisible();
    
    await page.getByRole('tab', { name: '查看反馈' }).click();
    
    await expect(page.getByText('查看测试反馈')).toBeVisible();
    await expect(page.getByText('问题报告')).toBeVisible();
  });

  test('should delete feedback', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: '菜单' }).click();
    await page.getByText('反馈').click();
    
    await page.getByTestId('feedback-title-input').fill('删除测试反馈');
    await page.getByTestId('feedback-description-input').fill('这是用于删除测试的反馈');
    await page.getByTestId('submit-feedback-btn').click();
    
    await page.getByRole('tab', { name: '查看反馈' }).click();
    
    await expect(page.getByText('删除测试反馈')).toBeVisible();
    
    await page.getByTestId('delete-feedback-btn').first().click();
    
    await expect(page.getByText('删除测试反馈')).not.toBeVisible();
  });

  test('should show empty state when no feedback', async ({ page, browser }) => {
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto('/');
    
    await newPage.getByRole('button', { name: '菜单' }).click();
    await newPage.getByText('反馈').click();
    await newPage.getByRole('tab', { name: '查看反馈' }).click();
    
    await expect(newPage.getByText('暂无反馈')).toBeVisible();
    
    await newPage.close();
  });
});
