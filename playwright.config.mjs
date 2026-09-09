import { defineConfig, chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

const use = {
  baseURL: process.env.VISUAL_AUDIT_URL || 'http://127.0.0.1:4173',
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure'
};

// Offline/sandbox fallback: when the Playwright-managed chromium is not
// installed (browser CDN unreachable), launch the @sparticuz/chromium binary
// instead. No-op in CI or anywhere the managed browser exists.
let managed = null;
try { managed = chromium.executablePath(); } catch { /* not installed */ }
if (!managed || !existsSync(managed)) {
  try {
    const sp = await import('@sparticuz/chromium');
    const sparticuz = sp.default ?? sp;
    const execPath = await sparticuz.executablePath();
    const libDir = '/tmp/al2023/lib';
    if (!existsSync(libDir)) {
      try { await (sp.inflate ?? sparticuz.inflate)('node_modules/@sparticuz/chromium/bin/al2023.tar.br'); } catch { /* libs optional */ }
    }
    const env = { ...process.env, LD_LIBRARY_PATH: [libDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':'), FONTCONFIG_FILE: '/etc/fonts/fonts.conf' };
    delete env.FONTCONFIG_PATH;
    // --single-process/--no-zygote are Lambda constraints; here they make one
    // renderer crash kill the whole browser, so drop them for stability.
    const spArgs = sparticuz.args.filter(a => a !== '--single-process' && a !== '--no-zygote');
    use.launchOptions = {
      executablePath: execPath,
      args: [...spArgs, '--no-sandbox', '--disable-setuid-sandbox'],
      env
    };
  } catch { /* fall back to default launch; playwright will report the missing browser */ }
}

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.audit\.spec\.mjs/,
  globalSetup: './tests/report-setup.mjs',
  globalTeardown: './tests/report-merge.mjs',
  timeout: 60000,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use
});
