import { defineConfig } from 'astro/config';
import todo from './integrations/todo.mjs';
import comingSoon from './integrations/coming-soon.mjs';

// DESIGN-PLAN §9 — apex domain, so base is '/'.
export default defineConfig({
  site: 'https://detroitmedfocusproperties.com',
  base: '/',
  outDir: 'dist',
  // Order matters: todo() reads the full dist for TODO.md and the release gate
  // BEFORE comingSoon() prunes the artifact under PUBLIC_COMING_SOON=1.
  integrations: [todo(), comingSoon()],
  build: { format: 'directory' },
});
