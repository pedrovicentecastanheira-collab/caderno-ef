import {defineConfig, devices} from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
  use: {baseURL: 'http://localhost:8770', locale: 'pt-PT', timezoneId: 'Europe/Lisbon'},
  webServer: {command: 'node tests/serve.mjs', url: 'http://localhost:8770', reuseExistingServer: !process.env.CI},
  projects: [
    {name: 'computador', use: {...devices['Desktop Chrome'], viewport: {width: 1280, height: 860}}},
    {name: 'telemovel', use: {...devices['Pixel 7']}}
  ]
});
