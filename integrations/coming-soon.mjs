import { readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Owner decision 2026-08-08 — until launch, the only public surface is the
 * coming-soon page.
 *
 * On `astro:build:done`, with PUBLIC_COMING_SOON=1:
 *   1. Promote dist/coming-soon/index.html to dist/index.html.
 *   2. Delete everything else, keeping only CNAME and the hashed assets the
 *      page actually references — the full site's photos and renderings must
 *      not remain publicly fetchable from a "coming soon" deployment.
 *
 * Without the flag, the placeholder is deleted instead, so a launch build never
 * ships a stray /coming-soon/ page.
 *
 * This runs AFTER integrations/todo.mjs (registration order in astro.config.mjs):
 * TODO.md generation and the release gate see the full dist, so the fact pipeline
 * keeps working while the published artifact stays minimal. Launch is the same
 * one-config-value swap as G7: stop setting PUBLIC_COMING_SOON.
 */
export default function comingSoon() {
  return {
    name: 'coming-soon',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const pageDir = join(dist, 'coming-soon');

        if (process.env.PUBLIC_COMING_SOON !== '1') {
          rmSync(pageDir, { recursive: true, force: true });
          logger.info('full-site build — dropped the /coming-soon/ placeholder');
          return;
        }

        // Throws if the page did not build — a coming-soon build with no
        // coming-soon page must fail, never fall through to the full site.
        const html = readFileSync(join(pageDir, 'index.html'), 'utf8');

        // Assets the page references (hashed CSS if Astro chose not to inline).
        const referenced = new Set(
          [...html.matchAll(/\/(_astro\/[^"'\s)]+)/g)].map((m) => m[1].split('?')[0])
        );

        // .nojekyll rides along with CNAME: both are deployment configuration
        // rather than site content, and dropping .nojekyll would let a classic
        // Pages build swallow the underscore-prefixed _astro/ directory.
        const keepTop = new Set(['CNAME', '.nojekyll', '_astro']);
        for (const entry of readdirSync(dist)) {
          if (!keepTop.has(entry)) rmSync(join(dist, entry), { recursive: true, force: true });
        }
        const astroDir = join(dist, '_astro');
        let kept = 0;
        try {
          for (const f of walk(astroDir)) {
            const rel = relative(dist, f).split(sep).join('/');
            referenced.has(rel) ? kept++ : rmSync(f, { force: true });
          }
          // Astro usually inlines this page's small CSS, leaving _astro/ empty.
          // Don't ship an empty directory.
          if (kept === 0) rmSync(astroDir, { recursive: true, force: true });
        } catch {
          /* no _astro dir — everything was inlined */
        }

        writeFileSync(join(dist, 'index.html'), html);
        logger.info(`coming-soon surface only: index.html + ${kept} referenced asset(s)`);
      },
    },
  };
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
