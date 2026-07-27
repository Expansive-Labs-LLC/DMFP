import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * DESIGN-PLAN §7.1 / §7.2 — TODO.md generation and the release gate.
 *
 * Two jobs on `astro:build:done`:
 *   1. Grep dist/ for leaked {{TBD:*}} tokens and write TODO.md grouped by page.
 *   2. Fail the build if a token reached a machine-readable surface, and fail the
 *      whole build under RELEASE=1 if any token would render at all.
 *
 * SPEC-DMFP-FE-0102 FR-004, FR-005, FR-006, AC-001, AC-002.
 */

const TOKEN = /\{\{TBD:([a-z0-9_]+)\}\}/gi;

/**
 * DESIGN-PLAN §13.7 — the launch-minimum fact set. Everything else can follow.
 * Listed explicitly rather than inferred, so adding a fact forces a deliberate
 * call about whether it blocks launch.
 */
const BLOCKS_LAUNCH = new Set([
  'entity_legal_name',
  'contact_phone',
  'inquiry_email',
  'rate_room_weekly',
  'rate_unit_weekly',
  'rate_house_weekly',
  'utilities_included',
  'deposit_amount',
  'term_min',
  'term_max',
  'pet_policy',
  'parking_policy',
  'application_process',
  'response_time_commitment',
  // the two commute rows, plus what is needed to measure them honestly (§4.7)
  'facility_dmc_dest',
  'facility_dmc_distance',
  'facility_dmc_drivetime',
  'facility_hfh_dest',
  'facility_hfh_distance',
  'facility_hfh_drivetime',
  'commute_method',
  'commute_measured_at',
]);

/**
 * §7.1 — values inferred rather than supplied. Not placeholders: they render as
 * real content, which is exactly why they need signing off.
 */
const CONFIRMATIONS = [
  ['`site.entity.legalName`', 'Given as a trading name, not a registered entity. Is there an LLC?'],
  ['`services[food-hot].price`', 'Given as "$600" with no unit; read as per week to match the other two.'],
  ['`commute.facilities[0].name`', '"Detroit Medical Center" — confirm this is what coordinators call it.'],
  ['`commute.facilities[1].name`', '"Henry Ford Hospital" — same.'],
  ['`services[laundry-service].price`', '**$40/week is market-derived, not yours.** Detroit wash-and-fold is $1.99–$2.25/lb; ~15–18 lb/week plus a folding premium. Confirm before launch — a published price is an offer.'],
  ['`services[cleaning].price`', '**$50/week is market-derived, not yours.** Detroit cleaning $25–40/hr; ~$210/week for the house across six residents. Confirm.'],
  ['`services[cleaning]` structure', 'Cleaning common areas is house-level. Charging per resident lets one pay while five do not. Should it be in the room rate instead?'],
  ['Billing periods', 'Food, laundry and cleaning are weekly; parking and bin storage are monthly. With week-by-week rooms, is a monthly charge right?'],
  ['`home.terms.billingPeriod`', 'Weekly billing replaces the 30-day minimum. Confirm no minimum stay.'],
];

/**
 * §7.1 step 1 — walk site.config.ts for every unresolved fact. This is the source
 * of truth for what is outstanding; dist/ only tells us where each one SHOWS UP.
 * Without this the report cannot tell "answered" from "not displayed yet".
 */
function outstandingFromConfig() {
  const src = readFileSync('src/data/site.config.ts', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return new Set([...src.matchAll(/\btbd\(\s*'([a-z0-9_]+)'/g)].map((m) => m[1]));
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html') || p.endsWith('.xml')) out.push(p);
  }
  return out;
}

/** Surfaces where a token is worse than an absent value. */
function machineReadableHits(html) {
  const hits = [];
  const regions = [
    [/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi, 'JSON-LD'],
    [/<meta[^>]*>/gi, '<meta>'],
  ];
  for (const [re, label] of regions) {
    for (const m of html.matchAll(re)) {
      const found = [...m[0].matchAll(TOKEN)].map((t) => t[1]);
      if (found.length) hits.push({ label, tokens: found });
    }
  }
  return hits;
}

export default function todoIntegration() {
  return {
    name: 'dmfp-todo',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = walk(root);
        const byToken = new Map();
        const violations = [];

        for (const f of files) {
          const html = readFileSync(f, 'utf8');
          const page = '/' + relative(root, f).replace(/index\.html$/, '');

          for (const m of html.matchAll(TOKEN)) {
            if (!byToken.has(m[1])) byToken.set(m[1], new Set());
            byToken.get(m[1]).add(page);
          }

          if (f.endsWith('sitemap.xml') && TOKEN.test(html)) {
            violations.push(`${page}: token in sitemap.xml`);
          }
          for (const h of machineReadableHits(html)) {
            violations.push(`${page}: token in ${h.label} — ${h.tokens.join(', ')}`);
          }
        }

        // FR-005 / AC-002 — always fatal, in every build mode.
        if (violations.length) {
          logger.error('Content integrity check failed:');
          violations.forEach((v) => logger.error('  ' + v));
          throw new Error(
            'Build blocked. A {{TBD:*}} token must never be serialized into JSON-LD, <meta>, or ' +
              'sitemap.xml — use machine()/compact() so the property is omitted. A rendered ' +
              '"undefined" means a config path no longer exists.'
          );
        }

        const outstanding = outstandingFromConfig();
        const rows = [...outstanding]
          .sort()
          .map((tok) => ({
            tok,
            pages: byToken.has(tok) ? [...byToken.get(tok)].sort().join(', ') : '_not yet rendered_',
            blocks: BLOCKS_LAUNCH.has(tok),
          }));
        const blocking = rows.filter((r) => r.blocks);
        const later = rows.filter((r) => !r.blocks);
        const renderedCount = rows.filter((r) => byToken.has(r.tok)).length;

        const lines = [
          '# TODO — outstanding facts',
          '',
          `Generated by \`astro build\` from \`site.config.ts\` across ${files.length} page(s). Do not edit by hand.`,
          '',
          rows.length
            ? `**${rows.length} outstanding** — ${blocking.length} block launch, ${later.length} can follow. ` +
              `${renderedCount} currently render as a visible placeholder; \`npm run build:release\` ` +
              'refuses to ship those.'
            : '**No outstanding facts.** The release gate passes.',
          '',
        ];

        const table = (rs) => [
          '| Token | Appears on |',
          '|---|---|',
          ...rs.map((r) => `| \`${r.tok}\` | ${r.pages} |`),
          '',
        ];

        if (blocking.length) lines.push('## Blocks launch', '', ...table(blocking));
        if (later.length) lines.push('## Post-launch', '', ...table(later));

        lines.push(
          '## Confirmations',
          '',
          'Values inferred rather than supplied. These render as real content today.',
          '',
          '| Where | Confirm |',
          '|---|---|',
          ...CONFIRMATIONS.map(([w, q]) => `| ${w} | ${q} |`),
          ''
        );

        writeFileSync('TODO.md', lines.join('\n') + '\n');
        logger.info(
          `TODO.md written — ${rows.length} outstanding (${blocking.length} block launch)`
        );

        // FR-004 / §7.2 — the release build cannot ship a placeholder.
        // A token that renders is one that would ship. That is what the gate blocks on.
        const wouldShip = [...byToken.keys()].sort();
        if (process.env.RELEASE && wouldShip.length) {
          throw new Error(
            `Release build blocked: ${wouldShip.length} unresolved fact(s) would render — ` +
              wouldShip.join(', ')
          );
        }
      },
    },
  };
}
