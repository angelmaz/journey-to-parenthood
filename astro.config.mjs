import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://journey-to-parenthood.com',
  integrations: [sitemap()]
});