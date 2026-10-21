import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://daniel-myers.com',
  output: 'static',
  integrations: [react()],
  build: {
    format: 'directory'
  }
});
