#!/usr/bin/env node
/**
 * DESIGN-PLAN §7.4 — compliance grep over dist/**.
 *
 * The ban list is PARSED OUT OF COMPLIANCE.md so there is one source of truth
 * rather than a script that drifts from the document counsel will actually read.
 *
 * Enforces: no banned construction, EHO on every page, no hospital name adjacent
 * to an affiliation word. SPEC-DMFP-FE-0102 AC-004, CON-002, CON-003.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const EHO = 'Equal Housing Opportunity';
const AFFILIATION = ['partner', 'affiliated', 'in partnership'];

/** Pull every `| \`phrase\` |` row out of the banned-constructions section. */
function banList(md) {
  const section = md.slice(md.indexOf('## 2. Banned constructions'), md.indexOf('## 3. Required'));
  const out = new Set();
  for (const m of section.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)) out.add(m[1].toLowerCase().trim());
  return [...out];
}

/** Strip tags and collapse whitespace so "walking\n  distance" still matches. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : p.endsWith('.html') && out.push(p);
  }
  return out;
}

const md = readFileSync('COMPLIANCE.md', 'utf8');
const banned = banList(md);
if (banned.length === 0) {
  console.error('check-compliance: parsed 0 banned phrases from COMPLIANCE.md — refusing to pass.');
  process.exit(2);
}

let files;
try {
  files = walk(DIST);
} catch {
  console.error(`check-compliance: ${DIST}/ not found. Run \`npm run build\` first.`);
  process.exit(2);
}

const failures = [];
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const page = '/' + relative(DIST, f).replace(/index\.html$/, '');
  const text = visibleText(html);

  for (const phrase of banned) {
    if (text.includes(phrase)) failures.push(`${page}: banned construction "${phrase}"`);
  }

  if (!html.includes(EHO)) failures.push(`${page}: missing the ${EHO} statement`);

  // A hospital name within 60 characters of an affiliation word reads as endorsement.
  for (const name of ['detroit medical center', 'henry ford']) {
    for (const m of text.matchAll(new RegExp(name, 'g'))) {
      const around = text.slice(Math.max(0, m.index - 60), m.index + name.length + 60);
      for (const w of AFFILIATION) {
        if (around.includes(w)) failures.push(`${page}: "${name}" appears near "${w}" — reads as affiliation`);
      }
    }
  }
}

console.log(`check-compliance: ${banned.length} phrases from COMPLIANCE.md against ${files.length} pages`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
console.log('  pass');
