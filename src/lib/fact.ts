import type { Fact, Tbd } from '../data/site.config';

/** Narrowing guard for the two-state fact model (DESIGN-PLAN §6). */
export function isTbd(value: unknown): value is Tbd {
  return typeof value === 'object' && value !== null && (value as Tbd).__tbd === true;
}

/**
 * Human-visible rendering. A missing fact becomes a loud token so the gap is
 * obvious on the page rather than silently absent.
 * SPEC-DMFP-FE-0102 FR-003, AC-001.
 */
export function show<T>(value: Fact<T>, format?: (v: T) => string): string {
  if (isTbd(value)) return `{{TBD:${value.token}}}`;
  return format ? format(value as T) : String(value);
}

/**
 * Machine-readable rendering. A missing fact becomes `undefined` so the caller
 * OMITS the property entirely.
 *
 * A schema.org `price` of "{{TBD:rate_monthly}}" is worse than no price at all —
 * it is a malformed claim rather than an absent one.
 * SPEC-DMFP-FE-0102 FR-005, AC-002.
 */
export function machine<T>(value: Fact<T>): T | undefined {
  return isTbd(value) ? undefined : (value as T);
}

/** Drop every key whose value is undefined, so JSON-LD never carries empty properties. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Collect every Tbd in the config tree with its object path, for TODO.md generation (§7.1). */
export function collectTbds(node: unknown, path: string[] = []): Array<{ path: string; token: string; note?: string }> {
  if (isTbd(node)) return [{ path: path.join('.'), token: node.token, note: node.note }];
  if (Array.isArray(node)) return node.flatMap((v, i) => collectTbds(v, [...path, String(i)]));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => collectTbds(v, [...path, k]));
  }
  return [];
}
