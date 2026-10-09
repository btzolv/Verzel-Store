import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'evidencias/resultado.json' }]],
  outputDir: 'evidencias/artefatos',
  use: {
    ...base.use,
    screenshot: 'on',
    trace: 'on',
  },
});
