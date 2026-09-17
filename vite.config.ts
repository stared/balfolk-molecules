import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  // Local development stays at /; production assets use the Pages project path.
  base: command === 'build' || isPreview ? '/balfolk-molecules/' : '/',
}));
