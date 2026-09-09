import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { baseURL: process.env.VISUAL_AUDIT_URL || 'http://127.0.0.1:4173', screenshot: 'only-on-failure', trace: 'retain-on-failure' }
});
