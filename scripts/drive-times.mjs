#!/usr/bin/env node
/**
 * Measures drive times from the house to each facility via the Google Routes API
 * and writes src/data/drive-times.json.
 *
 * WHY BUILD TIME AND NOT LIVE IN THE BROWSER
 *
 * 1. This is a static site on GitHub Pages. There is no server to proxy a request,
 *    so live calls mean the browser holds a key with Routes enabled — a metered,
 *    billable API anyone can then run up.
 * 2. "Right now" is the wrong number. Someone choosing housing needs to know the
 *    drive at shift change, not at 02:00 when the road is empty. A live 5-minute
 *    reading at midnight would understate a 07:00 commute and read as a promise.
 *
 * So this measures TYPICAL traffic at the times that matter — a weekday day-shift
 * arrival and a night-shift arrival — and records when it was measured. That is
 * what DESIGN-PLAN §0 asks for: a measured value with a stated method and date.
 *
 * Usage: PUBLIC_GOOGLE_MAPS_EMBED_KEY=... node scripts/drive-times.mjs
 */
import { writeFileSync, readFileSync } from 'node:fs';

const KEY = process.env.PUBLIC_GOOGLE_MAPS_EMBED_KEY;
if (!KEY) {
  console.error('drive-times: PUBLIC_GOOGLE_MAPS_EMBED_KEY not set. Skipping.');
  process.exit(0);
}

const ORIGIN = '146 Hazelwood St, Detroit, MI 48202';
const FACILITIES = [
  { id: 'dmc', dest: '4201 St. Antoine St, Detroit, MI 48201' },
  { id: 'hfh', dest: '2799 W Grand Blvd, Detroit, MI 48202' },
];

/** Next occurrence of a weekday hour, in UTC, so the sample is a real commute. */
function nextWeekdayAt(hourLocal) {
  const now = new Date();
  const d = new Date(now);
  d.setUTCHours(hourLocal + 4, 0, 0, 0); // Detroit is UTC-4 in summer
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString();
}

const SAMPLES = [
  { label: 'day shift, arriving 07:00', departureTime: nextWeekdayAt(6.5) },
  { label: 'night shift, arriving 19:00', departureTime: nextWeekdayAt(18.5) },
];

async function route(dest, departureTime) {
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { address: ORIGIN },
      destination: { address: dest },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
      departureTime,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const r = (await res.json()).routes?.[0];
  if (!r) throw new Error('no route returned');
  return { seconds: Number(String(r.duration).replace('s', '')), meters: r.distanceMeters };
}

const out = { measuredAt: new Date().toISOString().slice(0, 10), method: '', facilities: {} };
out.method =
  'Google Routes API, traffic-aware, sampled at weekday shift-change times';

for (const f of FACILITIES) {
  const samples = [];
  for (const s of SAMPLES) {
    const r = await route(f.dest, s.departureTime);
    samples.push({ label: s.label, minutes: Math.round(r.seconds / 60), meters: r.meters });
  }
  const miles = samples[0].meters / 1609.34;
  out.facilities[f.id] = {
    dest: f.dest,
    distance: `${miles.toFixed(1)} miles`,
    samples,
    // The honest headline is the range across shift changes, not a single number.
    driveTime:
      samples[0].minutes === samples[1].minutes
        ? `${samples[0].minutes} min`
        : `${Math.min(...samples.map((s) => s.minutes))}–${Math.max(...samples.map((s) => s.minutes))} min`,
  };
  console.log(`  ${f.id}: ${out.facilities[f.id].distance}, ${out.facilities[f.id].driveTime}`);
}

writeFileSync('src/data/drive-times.json', JSON.stringify(out, null, 2) + '\n');
console.log(`drive-times: written, measured ${out.measuredAt}`);
