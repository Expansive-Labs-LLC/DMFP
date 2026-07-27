#!/usr/bin/env node
/**
 * DESIGN-PLAN §7.4 — fact-lint over src/**, excluding src/data/ (the one place
 * facts are allowed to live) and src/styles/tokens.css (the one place hex is).
 *
 * Catches a fact written as a literal in markup instead of read from config.
 * ESLint covers the expression side; regex is what actually catches literals in
 * markup, so both run. Reports file#Lnn. SPEC-DMFP-FE-0102 CON-004, CON-005.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src';
const SKIP_DIRS = ['src/data'];
const SKIP_FILES = ['src/styles/tokens.css'];

const RULES = [
  [/\b\d+(\.\d+)?\s*(minutes?|mins?\b)/i, 'a duration'],
  [/\b\d+(\.\d+)?\s*(miles?|mi\b)/i, 'a distance'],
  [/\b\d+(\.\d+)?\s*(sq\.?\s?ft|square feet)/i, 'a floor area'],
  [/\b\d+(\.\d+)?\s*(mbps|gbps|mb\/s)/i, 'a connection speed'],
  [/\$\s?\d/, 'a price'],
  [/\b\d+\s*(beds?|bedrooms?|baths?|bathrooms?)\b/i, 'a room count'],
  [/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/, 'a phone number'],
  [/tel:\+?\d{7,}/i, 'a phone number in a tel: link'],
  [/\b\d{4}-\d{2}-\d{2}\b/, 'a date'],
  [/-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/, 'a coordinate pair'],
  [/#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/i, 'a raw hex colour'],
];

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (SKIP_DIRS.some((d) => p.startsWith(d))) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|ts|css)$/.test(p) && !SKIP_FILES.includes(p)) out.push(p);
  }
  return out;
}

const failures = [];

/**
 * The contact address must sit on the canonical domain. A typo'd domain renders
 * perfectly, passes every other check, and silently loses every lead — so it is
 * worth a rule of its own rather than trusting proofreading.
 */
{
  const cfg = readFileSync('src/data/site.config.ts', 'utf8');
  const canonical = cfg.match(/canonical:\s*'([^']+)'/)?.[1];
  const aliases = [...(cfg.match(/aliases:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
    (m) => m[1]
  );
  const allowed = [canonical, ...aliases].filter(Boolean);
  for (const m of cfg.matchAll(/'([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'/g)) {
    const domain = m[1].split('@')[1];
    if (allowed.length && !allowed.includes(domain)) {
      failures.push(
        `src/data/site.config.ts: "${m[1]}" is on neither ${allowed.join(' nor ')} — typo in the domain?`
      );
    }
  }
}

for (const f of walk(ROOT)) {
  const lines = readFileSync(f, 'utf8').split('\n');
  let inComment = false;
  lines.forEach((line, i) => {
    // Skip comments — a fact named in a comment is documentation, not output.
    const t = line.trim();
    if (inComment) {
      if (t.includes('*/')) inComment = false;
      return;
    }
    if (t.startsWith('/*')) { if (!t.includes('*/')) inComment = true; return; }
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('<!--')) return;

    for (const [re, what] of RULES) {
      const m = line.match(re);
      if (m) failures.push(`${f}#L${i + 1}: ${what} written as a literal — "${m[0].trim()}"`);
    }
  });
}

console.log(`check-facts: ${RULES.length} rules over src/ (excluding src/data/, tokens.css)`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  console.error('\nFacts belong in src/data/site.config.ts. Read them through <Fact /> or show().');
  process.exit(1);
}
console.log('  pass');
