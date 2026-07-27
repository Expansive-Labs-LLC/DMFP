import { defineConfig } from 'astro/config';
import todo from './integrations/todo.mjs';

// DESIGN-PLAN §9 — apex domain, so base is '/'.
export default defineConfig({
  site: 'https://detroitmedfocusproperties.com',
  base: '/',
  outDir: 'dist',
  integrations: [todo()],
  build: { format: 'directory' },
});
