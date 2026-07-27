# Compliance — advertising rules for this site

> [!WARNING]
> **This is a checklist, not legal advice.** It is written to catch the well-known
> failure modes in housing advertising so they never reach a page. It is not a
> substitute for counsel, and counsel has not yet reviewed this site. A pre-leasing
> housing site taking applications is the highest-exposure configuration this project
> will ever be in.

`scripts/check-compliance.mjs` **parses the ban list out of this file** and fails the
build on a hit. One source of truth: edit the tables here, not the script.

---

## 1. Why these phrases

The Fair Housing Act prohibits statements that indicate a preference, limitation or
discrimination based on race, colour, religion, sex, familial status, national origin,
disability — and Michigan adds age and marital status. The rule catches **implication**,
not just intent. "Perfect for young professionals" is a familial-status problem even
though nobody meant it that way, because it signals who is and is not wanted.

The safe pattern throughout: **describe the property, never the person.** "Three desks
with monitors" is a fact about a room. "Ideal for remote workers" is a statement about
who should live here. The first is always safe; the second is never necessary.

---

## 2. Banned constructions

Matched case-insensitively and whitespace-insensitively against every built page.

### 2.1 Familial status

| Phrase | Why |
|---|---|
| `no children` | Direct familial-status exclusion |
| `no kids` | Same |
| `adults only` | Same |
| `adult building` | Same |
| `adult community` | Same |
| `child free` | Same |
| `child-free` | Same |
| `mature person` | Proxy for age and familial status |
| `empty nester` | Same |
| `bachelor pad` | Signals sex and familial status |
| `singles only` | Marital status |
| `couples only` | Marital status and familial status |
| `no couples` | Same |
| `family friendly` | Signals a preference even when meant warmly |
| `perfect family` | Same |

### 2.2 Steering by who, not what

| Phrase | Why |
|---|---|
| `perfect for` | States who should live here |
| `ideal for` | Same |
| `suited for` | Same |
| `great for young` | Age |
| `professionals only` | Occupation as a proxy |
| `students only` | Age proxy |
| `no students` | Same |
| `english speaking` | National origin |
| `must speak` | Same |

### 2.3 Disability

| Phrase | Why |
|---|---|
| `walking distance` | Assumes ambulation; state the measured distance instead |
| `walk to` | Same |
| `able bodied` | Direct |
| `able-bodied` | Direct |
| `must be able to` | Imposes a physical capability requirement |
| `handicapped` | Outdated and pejorative; say "accessible" about the property |
| `crippled` | Same |
| `no wheelchairs` | Direct exclusion |
| `not suitable for disabled` | Direct |

### 2.4 Race, religion, national origin

| Phrase | Why |
|---|---|
| `safe neighborhood` | Long-recognised proxy with racial connotation, and an unverifiable claim |
| `safe area` | Same |
| `good neighborhood` | Same |
| `bad area` | Same |
| `exclusive community` | Signals exclusion |
| `restricted` | Historic covenant language |
| `traditional neighborhood` | Coded |
| `integrated` | Coded, even when well meant |
| `church nearby` | Religion |
| `christian` | Religion |
| `nice quiet people` | Proxy |

### 2.5 Source of income

| Phrase | Why |
|---|---|
| `no section 8` | Source-of-income discrimination. Detroit prohibits this; confirm the current ordinance with counsel |
| `no vouchers` | Same |
| `no housing assistance` | Same |

---

## 3. Required on every page

| Requirement | Enforced by |
|---|---|
| Equal Housing Opportunity statement on every emitted page | `check-compliance.mjs` |
| No bathroom count while the split is unknown | Lifted 2026-07-26 — the count is known (3 full) |
| No hospital name adjacent to "partner", "affiliated" or "in partnership" | `check-compliance.mjs` |

The last one matters because this site names two health systems it has no relationship
with. Naming them as a landmark is fine; implying endorsement is not.

---

## 4. Rules the grep cannot enforce

A passing build does not mean the copy is compliant. These need a human:

- **Photography.** Images signal who lives here as loudly as words. No stock photos of
  people, and when real photos exist, do not curate a cast.
- **Consistency of treatment.** Advertising rules are the easy half. Applying the same
  criteria in the same order to every applicant is the hard half, and it happens in
  Phase 02, not here.
- **Pets versus assistance animals.** The pet petition policy is lawful only because
  assistance animals are carved out of it. If that carve-out is ever dropped from the
  copy, the policy becomes unlawful — a resident vote cannot decide a reasonable
  accommodation.
- **Occupancy limits.** Stating a maximum occupancy is permitted and sensible; using it
  to exclude families is not.
- **Anything about the neighbourhood's people.** Describe transit, distances and
  amenities. Never the residents.
