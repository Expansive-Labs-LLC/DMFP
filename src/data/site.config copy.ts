/**
 * The single source of every fact on this site.
 *
 * DESIGN-PLAN §0: no component may state a fact as a literal. A value that is not
 * known yet is a `Tbd`, never a plausible guess and never an empty string.
 * SPEC-DMFP-FE-0102 FR-002, CON-004.
 */

import driveTimes from './drive-times.json';

export type Status = 'live' | 'launching' | 'planned';

/** A fact that is known, or an explicit placeholder. There is no third state. */
export type Tbd = { readonly __tbd: true; token: string; note?: string };
export type Fact<T> = T | Tbd;

export const tbd = (token: string, note?: string): Tbd => ({ __tbd: true, token, note });

export interface Service {
  id: string;
  name: string;
  description: string;
  included: boolean;
  status: Status;
  liveFrom?: Fact<string>;
  price?: Fact<string>;
}

export interface Facility {
  id: string;
  name: string;
  /** DESIGN-PLAN §4.7 — owner to confirm the display name is the right one. */
  nameConfirmed: boolean;
  destAddress: Fact<string>;
  coords: Fact<{ lat: number; lon: number }>;
  distance: Fact<string>;
  driveTime: Fact<string>;
  /** Parking AT the facility is the employer's business, not ours. Deliberately absent. */
  transit: Fact<string>;
  samples?: Array<{ label: string; minutes: number; meters: number }>;
}

export interface DayBandPreset {
  /** Axis origin — DESIGN-PLAN §3.1. Each preset re-origins so both blocks stay contiguous. */
  origin: string;
  shift: { start: string; end: string };
  sleep: { start: string; end: string };
}

export const site = {
  brand: 'Detroit Med Focus Properties',
  /**
   * Two domains, owner 2026-07-27. Both observed on the same stack: Route 53
   * nameservers, Google Workspace MX (`1 smtp.google.com`), and their own
   * google-site-verification TXT. detmfprop.com was registered with Amazon
   * Registrar on 2026-07-25 and has no A record yet.
   *
   * `detroitmedfocusproperties.com` stays canonical because everything already
   * points at it: the Pages CNAME, the contact API's allowedOrigins, and the GitHub
   * domain verification in RUNBOOK Part 4.
   *
   * GitHub Pages serves ONE custom domain per repo, so the alias cannot also serve
   * the site — it has to 301. Both zones are in Route 53, so the RedirectStack
   * already in the infrastructure repo (used for zackclevelandphotography.com) does
   * this without new infrastructure.
   *
   * Anything other than a redirect splits SEO across two domains and breaks form
   * posts, because CORS is pinned to the canonical origin.
   */
  domains: {
    canonical: 'detroitmedfocusproperties.com',
    aliases: ['detmfprop.com'],
  },
  entity: {
    /**
     * Owner-supplied 2026-07-26. NOTE: given as a trading name, not a registered
     * entity ("LLC"/"Inc"). Confirm whether the registered entity differs before
     * launch — the footer and JSON-LD on a housing site should name the entity
     * that actually holds the lease.
     */
    legalName: 'Detroit Med Focus Properties',
  },
  contact: {
    /**
     * STILL UNCONFIRMED and now known to be broken. Owner sent a test on 2026-07-27
     * and it did not arrive.
     *
     * DNS as of 2026-07-27: MX is `1 smtp.google.com` — Google Workspace, correctly
     * configured — and a google-site-verification TXT is present. So mail is being
     * routed to Google. The likely fault is therefore not DNS but the mailbox: no
     * user or alias for this address in the Workspace tenant, so Google refuses it.
     *
     * This is the single most important thing on the site. Every page carries this
     * address and the whole build exists to put a lead in an inbox. A site that
     * collects inquiries into a black hole is worse than no site.
     *
     * The address is set so the site can render, but DELIVERY IS STILL UNPROVEN.
     * Launch gate: send a test from an outside account and confirm it arrives.
     *
     * Owner supplied this as "info@detroitmedfocuspropertties.com" — doubled t.
     * Corrected to the real domain. check-facts.mjs now fails the build if the
     * contact address does not sit on the canonical domain, because a typo here is
     * invisible on the page and costs every lead.
     */
    email: 'info@detroitmedfocusproperties.com',
    phone: '(734) 489-2708',
    /** /for-agencies leads with a named human, not a form. */
    name: 'Derek DeJonghe',
    /**
     * Owner 2026-07-28: DMFP is Derek and Hayley — one of three husband-and-wife
     * businesses in the food programme.
     *
     * RECORDED, NOT PUBLISHED, and that is deliberate. Putting a person's name on a live
     * website is the exact thing that just went wrong with the chefs: their names were
     * published before anyone asked them. A spouse is not an exception to that. Nothing
     * renders Hayley's name until `partnerPublicationConfirmed` resolves — and being
     * asked to be on a business's marketing site is a real decision, not a formality.
     *
     * Surname assumed nowhere. It is probably DeJonghe and probably is not worth guessing.
     */
    partner: 'Hayley',
    partnerSurname: tbd('dmfp_hayley_surname', 'Hayley\'s surname as she wants it written'),
    partnerPublicationConfirmed: tbd(
      'dmfp_partner_publication',
      'Has Hayley agreed to be named on the public site, and in what wording?'
    ),
  },
  response: {
    /** A public commitment — the inbox has to be able to keep it. */
    commitment: 'within one business day',
  },
  legal: {
    /** FR-010 — must appear on every emitted page. */
    eho: 'Equal Housing Opportunity. We do not discriminate on the basis of race, color, religion, sex, ' +
      'familial status, national origin, disability, age, marital status, or any other characteristic ' +
      'protected by federal, state, or local law.',
  },
  /** /whats-included §5 — being explicit about what you don't do is the credible part. */
  notIncluded: [
    'No on-site staff.',
    'Renters insurance is not provided.',
  ],
  /**
   * /for-agencies §Optional services — owner 2026-07-28.
   *
   * A coordinator looking at six priced add-ons under a room rate is going to think
   * "nickel-and-diming", so the copy says it first. Same instinct as `notIncluded`:
   * naming the awkward thing is what makes the rest credible.
   *
   * DELIBERATELY SILENT ON PER DIEM — owner 2026-07-28, and it is a deliberate
   * omission rather than an oversight. The /meals per diem claim is already narrowed
   * to the two tiers that clear the Detroit ceiling, and inviting a coordinator to
   * reason about reimbursement categories here would rest an argument on ground that
   * is not solid yet. Do not add it back without resolving the top tier first.
   */
  optionalServicesNote: [
    'This may look like nickel-and-diming. It is closer to the opposite, and the difference ' +
      'matters most to whoever approves the spend. The room rate is complete without any of what ' +
      'follows — power, gas, water and sewage are in it, internet and laundry are in the house, ' +
      'and a resident who takes nothing else has a furnished room with a lockable door. Nothing ' +
      'below is added unless it is asked for.',
    'We keep them separate rather than folding them in because a bundle would put a number on ' +
      'the room that is not the room, and it would mean the resident who cooks pays for the one ' +
      'who does not. Priced apart, you decide per placement what is included and what is not.',
  ],
  /** How long inquiry emails are kept. A retention claim needs a real number. */
  inquiryRetention: tbd('inquiry_retention', 'How long inquiry emails are kept before deletion'),
  documents: {
    /** /for-agencies §5 */
    /** Owner 2026-07-27. An SLA, not an aspiration — a coordinator will hold you to it. */
    turnaround: 'Within 8 business hours',
  },
  analytics: { enabled: false },
  form: {
    /** Set in Phase 02 (SPEC-DMFP-FE-0207). `null` means the manual application path. */
    endpoint: 'https://contact-us-api.detroitmedfocusproperties.com/contact',
  },
} as const;

/**
 * Parking, in one place. It was stated in two — the service entry and the house
 * record — which is one edit away from a page quoting a stale price.
 */
export const parkingSpec = {
  onSiteSpots: 4,
  priceWeekly: '$50/week',
  /** Owner 2026-07-27: 4 spots for 6 bedrooms, so a spot is not guaranteed. */
  availability: 'subject to availability',
  street: 'Street parking otherwise.',
  /** Owner 2026-07-27. In Detroit this is the difference between a 6am shift and a shovel. */
  winterService: 'The lot is cleared through the winter.',
  winterTrigger: tbd('parking_winter_trigger', 'What triggers clearing and how quickly — snowfall depth, timing'),
} as const;

export const services: Service[] = [
  /**
   * Owner 2026-07-26. These are the September offering, so they are 'launching'
   * with a date rather than 'planned' — §13.4 requires the date label, and a dated
   * future service is more honest than an empty page. They become 'live' when the
   * first one actually runs.
   */
  {
    id: 'food-gather',
    name: 'Gather',
    description: 'Groceries gathered and the fridge stocked for the week.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    price: '$200/week',
  },
  {
    id: 'food-prep',
    name: 'Prep',
    description: 'Groceries gathered and meals prepped for quick cooking.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    price: '$350/week',
  },
  {
    id: 'food-hot',
    name: 'Hot window',
    description: 'Hot meals delivered in a time window you agree in advance.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    /** INFERRED: given as "$600" with no unit; read as per week to match the other two. */
    price: '$600/week',
  },
  {
    id: 'laundry-service',
    name: 'Laundry service',
    description: 'Washed, dried and folded. Tell us your folding preferences and we work to them.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    /**
     * MARKET-DERIVED 2026-07-26, not owner-set. Detroit wash-and-fold runs
     * $1.99–$2.25/lb (range $1.00–$2.50). A clinician's week is roughly 15–18 lb,
     * so ~$34–40. Priced at the top of that band because folding-to-preference is
     * a premium over standard wash-and-fold. CONFIRM — an unconfirmed price on a
     * live page is still an offer.
     */
    price: '$40/week',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'Three times a week.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    /**
     * MARKET-DERIVED 2026-07-26, not owner-set. Detroit cleaning is $25–40/hr
     * independent, flat visits averaging $179 (range $115–$251). Three visits a
     * week of a six-bed house is maintenance of common areas, not three deep
     * cleans: ~2h per visit at ~$35/hr is ~$70/visit, ~$210/week for the house,
     * which is ~$35/resident across six. Priced at $50 to cover bedrooms too.
     *
     * STRUCTURAL QUESTION, unresolved: cleaning common areas is a house-level
     * service. Charging it per resident means one person can pay while five do
     * not, which does not describe anything coherent. It probably belongs in the
     * room rate. Flagged in Confirmations.
     */
    price: '$50/week',
  },
  {
    id: 'bin-storage',
    name: 'Storage bin',
    /**
     * Owner 2026-07-27: "secured storage for your items between stays". That is a
     * returning-contractor feature, not a locker — someone finishing a 13-week
     * assignment who expects another one leaves their things rather than shipping
     * them home twice.
     *
     * It also settles the billing question: monthly is right precisely BECAUSE the
     * bin is used when you are not renting a room by the week.
     */
    description: 'Secured storage for your items between stays.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    /** Owner-set 2026-07-26. Note this is MONTHLY where the other services are weekly. */
    price: '$60/month',
  },
  /**
   * Owner 2026-07-27: a custom web application for verified organizations to manage
   * bookings, locks and access.
   *
   * status 'planned' — renders NOWHERE (§3.4), deliberately. This does not exist:
   * Phase 02 is unbuilt and this is beyond what ADR-0001 or ADR-0002 authorize.
   * Advertising an agency portal to a coordinator who then asks for a login is a
   * promise made on the coordinator's behalf. It needs a real date before it can
   * appear, and an ADR before it can be built — see DMFP-specs ADR-INDEX.
   */
  {
    id: 'partner-portal',
    name: 'Partner portal',
    description:
      'Self-service registration for approved housing partners, then manage bookings, door access ' +
      'and locks for the people you place.',
    included: false,
    /**
     * Owner 2026-07-27: announced as coming in 2027. Moves from 'planned' (renders
     * nowhere) to 'launching' with a date, which is the rule — a date is the price
     * of appearing on the site.
     *
     * It still does not exist and is not authorized to be built: ADR-0003 covers
     * org accounts, partner verification and programmatic door access, and has not
     * been written. Announcing it is fine; a coordinator asking for a login in
     * 2027 is a promise with a deadline attached.
     */
    status: 'launching',
    liveFrom: '2027',
  },
  {
    id: 'grill',
    name: 'BBQ grill',
    description: 'Outdoor grill, shared by the house.',
    included: true,
    /** Owner 2026-07-27: "will be available" — future tense, so it carries a date. */
    status: 'launching',
    liveFrom: 'September 2026',
  },
  {
    id: 'business-center',
    name: 'Business center',
    description:
      '3 desks, each with a monitor, keyboard and mouse on a single dongle — one cable from your ' +
      'laptop. Plus a printer.',
    included: true,
    status: 'live',
  },
  {
    id: 'bins-out',
    name: 'Bins put out',
    description: 'Garbage and recycling taken to the curb for you on collection day.',
    included: true,
    status: 'launching',
    liveFrom: 'September 2026',
  },
  {
    id: 'security',
    name: 'Cameras and keyless entry',
    description:
      'Ubiquiti cameras covering the entrances and exterior, and PDQ electronic locks on every door. ' +
      'Residents get full monitoring access. No cameras inside.',
    included: true,
    status: 'live',
  },
  {
    id: 'laundry-inunit',
    name: 'In-unit laundry',
    description: 'Washer and dryer in the house, free to use.',
    included: true,
    status: 'live',
  },
  {
    id: 'parking',
    name: 'On-site parking',
    description:
      `${parkingSpec.onSiteSpots} spots on site, ${parkingSpec.availability}. ` +
      `${parkingSpec.street} ${parkingSpec.winterService}`,
    included: false,
    status: 'live',
    price: parkingSpec.priceWeekly,
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'A business-tier connection rated 300 Mbps down. Included in the room rate.',
    included: true,
    status: 'launching',
    liveFrom: 'September 2026',
  },
];

/** DESIGN-PLAN §13.4 — during pre-leasing, `launching` renders WITH a mandatory date label. */
export const serviceDisplay = { showNonLive: true } as const;

/**
 * Meal programme. Copy lives here so it is one edit, not a hunt through markup.
 *
 * VOICE NOTE (DESIGN-PLAN §7: plain, specific, unhurried): the owner's draft ran
 * "keeping you operating at peak performance, lives depend on it". That is a
 * health-and-performance claim requiring substantiation, and it leans on the
 * clinician's duty to patients to sell a meal plan. `headlineAlt` preserves it
 * verbatim if you want it; `headline` is the version that survives the site's own
 * evidentiary standard. Swap which one the page reads.
 */
export const meals = {
  headline: 'You are new to Detroit. We are not.',
  standfirst:
    'The weekly menu is built with chefs who cook in this city, and it rotates, so week six does not ' +
    'taste like week one. After a twelve-hour shift the last thing you should have to decide is dinner.',
  /** Owner's draft, kept verbatim. See the voice note above before using it. */
  headlineAlt: "You're new here, we've spent years rubbing elbows with the top chefs in Detroit.",
  standfirstAlt:
    'This custom built rotating weekly meal menu is the ticket to keeping you operating at peak ' +
    'performance, lives depend on it.',
  /**
   * Owner 2026-07-27: every tier lands under the GSA per diem M&IE rate for Detroit.
   * That is the number an agency reimburses against, so it is the number that
   * decides whether a coordinator can approve the spend — it belongs on the page.
   *
   * The rate itself is NOT stated here: GSA publishes it per fiscal year and it
   * changes, so a figure hardcoded today is wrong next October. The claim is
   * relative, and the reader is pointed at the source to check it.
   */
  perDiem: {
    /**
     * NARROWED 2026-07-27. This said "Every tier comes in under" and that was false.
     * Detroit M&IE for FY2026 is $74/day — $518/week. Gather ($200) and Prep ($350)
     * clear it; Hot window ($600 = $85.71/day) exceeds it by about 16%, and by more
     * against the meals-only figure of $69/day once the $5 incidental is excluded.
     *
     * Copy narrowed to the two tiers that actually qualify, which needs no pricing
     * decision. The alternative is to cut Hot window to $515/week and restore the
     * blanket claim — that is a revenue decision and is the owner's to make.
     */
    claim: 'The Gather and Prep tiers come in under the federal per diem meal rate for Detroit.',
    source: 'GSA per diem, meals and incidental expenses',
    sourceUrl: 'https://www.gsa.gov/travel/plan-book/per-diem-rates',
    note: 'Rates are set per fiscal year — check the current figure before you rely on it.',
  },
  rotation: 'Weekly',
  custom: true,
  /**
   * Owner 2026-07-27. This was the only unverifiable claim on the site; naming them
   * makes it the strongest one. Both verified from their own sites 2026-07-27.
   *
   * BEFORE PUBLISHING: get written agreement from both. Naming a business as a
   * partner is a claim about THEIR business, and trading on a decorated chef's
   * record to sell housing is exactly the thing they would want to approve the
   * wording of.
   *
   * `permissionConfirmed` gates it — and as of 2026-07-27 that is true in code, not
   * just in this comment. It said "gates it" from the day the names were added while
   * /meals rendered both unconditionally, so the names were live on the public site
   * for the whole period the gate was assumed to be holding. meals.astro now checks
   * the token and falls back to an unnamed version of the same section.
   *
   * These values stay here on purpose. They are verified and correct; what is missing
   * is permission, not accuracy. Resolve the token to the agreed wording and the named
   * version returns with no other edit.
   */
  chefs: {
    execution: {
      name: "J&T's Kitchen",
      url: 'https://www.jtskitchendetroit.com/',
      role: 'Cooks the meals and delivers them',
      address: '8838 Third St, Detroit, MI 48202',
      /** Measured 2026-07-27 via the Routes API. Same zip code as the house. */
      distance: '0.2 miles from the house',
      who: 'Juan and Tabitha, with more than 40 years in restaurants between them',
    },
    menu: {
      name: 'M Cantina',
      url: 'https://www.mcantina.com/our-chef',
      chef: 'Junior Merino',
      /**
       * Owner 2026-07-28: M Cantina is Junior and Heidi, a husband-and-wife business, and
       * naming only Junior misdescribes it. All three businesses in the food programme are
       * couples — J&T's is Juan and Tabitha, DMFP is Derek and Hayley.
       *
       * Consequence for the gate below: `permissionConfirmed` now means BOTH of them have
       * agreed, not one on the other's behalf.
       *
       * Surname and role deliberately absent. We were told she is a principal and nothing
       * more, and inventing "Heidi Merino" or "co-owner" would repeat exactly the mistake
       * this file keeps having to correct.
       */
      partner: 'Heidi',
      partnerSurname: tbd('mcantina_heidi_surname', 'Heidi\'s surname and how she wants to be named'),
      role: 'Develops the rotating weekly menu',
      address: '13214 Michigan Ave, Dearborn',
      /** Precise wording matters: invited to cook AT the James Beard House is not a James Beard Award. */
      credentials: 'Star Chefs Award winner, invited chef at the James Beard House',
    },
    /**
     * Owner 2026-07-28: both are husband-and-wife businesses, so "both businesses" means
     * four people. One partner agreeing is not the other agreeing, and the token does not
     * resolve until Juan, Tabitha, Junior and Heidi have each said yes to the wording.
     */
    permissionConfirmed: tbd(
      'chef_partner_permission',
      'Have Juan, Tabitha, Junior and Heidi each agreed in writing to the exact wording?'
    ),
  },
  /** Owner 2026-07-27: any and all. */
  dietary: 'Any dietary requirement. Tell us what you need and the menu is built to it.',
  /**
   * "Any and all" is an unbounded promise, and for a severe allergy it is a safety
   * commitment rather than a menu preference. Six residents share two kitchens, so
   * cross-contamination is an operational question with a real answer — dedicated
   * prep surfaces, separate storage, sealed delivery, or a frank "we cannot
   * guarantee an allergen-free kitchen". Saying how is more reassuring to an
   * allergic reader than saying yes, and it is the difference between a
   * hospitality promise and one somebody could get hurt relying on.
   */
  allergyProtocol: tbd('allergy_protocol', 'How severe allergies are handled in a shared kitchen'),
  sampleMenu: tbd('sample_menu', 'One real week, so the menu is not an abstraction'),
  orderBy: tbd('meal_order_deadline', 'When a week has to be confirmed by'),
} as const;

/**
 * MONTHLY BILLING — owner 2026-07-28, quoted alongside the weekly rate.
 *
 * This partly reverses the 2026-07-26 decision that weekly billing "replaces the
 * 30-day minimum and the monthly rate". That decision was right that a weekly
 * serviced room is a different product from a monthly furnished lease. What it missed
 * is that the customer shops in months: a 13-week contract is three months to a
 * clinician, and Furnished Finder — where they actually look — lists monthly. Both
 * units are now quoted; weekly stays the default because the product is weekly.
 *
 * `multiplier: 4` means a month costs four weeks, against 4.33 weeks in an average
 * month — about a 7.6% discount for committing to a month. MARKET-DERIVED, NOT
 * OWNER-SET. Confirm it: it is the difference between a competitive monthly headline
 * and giving away a week of revenue on every stay.
 *
 * READ THIS BEFORE PUBLISHING A MONTHLY RATE. Publishing a monthly figure changes who
 * you are compared against. At the weekly grain a room competes with other serviced
 * rooms; at $1,160–$2,040/month it sits next to whole one-bedroom apartments in
 * Detroit, which is a harder comparison and one the weekly framing was hiding. That is
 * an argument for publishing it — the reader was going to do the multiplication
 * anyway — but not for publishing it without knowing the comparison changed.
 */
export const monthlyBilling = {
  multiplier: 4,
  /**
   * 31 days, and the number is load-bearing rather than tidy.
   *
   * Michigan levies 6% use tax on rooms and lodging, with an exemption for continuous
   * occupancy of MORE THAN ONE MONTH. A "monthly" rate defined as four weeks is 28
   * days, which is less than a month, so it would stay fully taxable while looking to
   * a customer like it had crossed the line. 31 days clears the threshold on any
   * calendar month.
   *
   * Two consequences, and neither is a detail:
   *
   * 1. Weekly stays are taxable and monthly stays are probably not, so the two rates
   *    are not the same product priced two ways and a flat multiplier between them is
   *    an approximation. If the weekly rate is not already carrying 6% somewhere, that
   *    is an unbilled liability on every weekly let, not a rounding question.
   *
   * 2. Crossing one month is also roughly where a stay stops looking like lodging and
   *    starts looking like a tenancy — the exact concern behind the 26-week ceiling in
   *    `maxTerm` and ADR-0002. Monthly pricing does not create that question, but it
   *    makes it the normal case rather than the edge case, and Michigan
   *    landlord-tenant obligations do not care what the agreement is titled.
   *
   * Neither is a thing to resolve from a config comment. `lodging_tax_treatment` gates
   * saying anything about tax on the site.
   */
  minDays: 31,
  taxTreatment: tbd(
    'lodging_tax_treatment',
    'CPA/counsel: does 6% MI use tax apply to the weekly lets, and is the >1-month exemption clean?'
  ),
} as const;

const money = (usd: number) => `$${usd.toLocaleString('en-US')}`;
export const perWeek = (usd: number) => `${money(usd)}/week`;
export const perMonth = (usd: number) => `${money(usd * monthlyBilling.multiplier)}/month`;

/**
 * Room rates live here as ONE number each. The weekly and monthly display strings are
 * derived, so the two can never disagree — the same reason `parkingSpec` exists. A
 * monthly figure typed by hand next to a weekly one is one edit away from a page
 * quoting a rate that was never agreed.
 */
interface RoomSeed {
  id: string;
  label: string;
  widthFt: number;
  lengthFt: number;
  floor: string;
  weeklyUsd: number;
  /**
   * Owner 2026-07-28. Per room because it is not uniform, and it is a material
   * difference rather than a spec detail — a twin and a queen are different products
   * to an adult booking three months.
   */
  bedSize: 'Queen' | 'Twin';
}
const room = (r: RoomSeed) => ({
  ...r,
  rateWeekly: perWeek(r.weeklyUsd),
  rateMonthly: perMonth(r.weeklyUsd),
});
const cheapestWeekly = (rooms: ReturnType<typeof room>[]) =>
  Math.min(...rooms.map((r) => r.weeklyUsd));

const unitARooms = [
  room({ id: 'r1', label: 'Room 1', widthFt: 10.5, lengthFt: 10.5, floor: 'Second floor', weeklyUsd: 385, bedSize: 'Queen' }),
  room({ id: 'r2', label: 'Room 2', widthFt: 13.5, lengthFt: 14.5, floor: 'Second floor', weeklyUsd: 510, bedSize: 'Queen' }),
  room({ id: 'r3', label: 'Room 3', widthFt: 11.5, lengthFt: 13.5, floor: 'Second floor', weeklyUsd: 450, bedSize: 'Queen' }),
];
/** Owner 2026-07-27: rooms 5 and 6 are third floor. -10% for the climb. */
const unitBRooms = [
  /**
   * Owner 2026-07-28: Room 4 is the only twin. At 81 sq ft it is also the smallest
   * room, so the twin is the constraint being answered rather than a downgrade chosen
   * for its own sake.
   *
   * PRICING QUESTION, unresolved. Room 4 is the only twin in the house, 36% smaller
   * than Room 5, and priced only 11% below it. `roomPricingRule` explains rates by
   * floor area and by the climb to the third floor; bed size is not in the rule, so
   * the one room that is materially a lesser product is not discounted for the thing
   * that makes it lesser. Either the rule should account for it or $290 should come
   * down. Owner's call, but it will be the first room a coordinator queries.
   */
  room({ id: 'r4', label: 'Room 4', widthFt: 9.5, lengthFt: 8.5, floor: 'Second floor', weeklyUsd: 290, bedSize: 'Twin' }),
  room({ id: 'r5', label: 'Room 5', widthFt: 12, lengthFt: 10.5, floor: 'Third floor', weeklyUsd: 325, bedSize: 'Queen' }),
  room({ id: 'r6', label: 'Room 6', widthFt: 11.5, lengthFt: 11.5, floor: 'Third floor', weeklyUsd: 330, bedSize: 'Queen' }),
];

/**
 * The bed line for the furnishings list, derived from the rooms rather than written
 * beside them so the two can never disagree. Names the EXCEPTION rather than the
 * majority: "queen in every room" with a twin in Room 4 unmentioned is the kind of
 * true-on-average statement someone discovers on arrival.
 */
const bedSummary = () => {
  const all = [...unitARooms, ...unitBRooms];
  const bySize = new Map<string, string[]>();
  for (const r of all) bySize.set(r.bedSize, [...(bySize.get(r.bedSize) ?? []), r.label]);
  if (bySize.size === 1) return `Bed — ${[...bySize.keys()][0].toLowerCase()}`;
  const ranked = [...bySize.entries()].sort((a, b) => b[1].length - a[1].length);
  const [majority, ...rest] = ranked;
  const exceptions = rest
    .map(([size, labels]) => `${labels.join(' and ')} (${size.toLowerCase()})`)
    .join(', ');
  return `Bed — ${majority[0].toLowerCase()} in every room except ${exceptions}`;
};

export const properties = [
  {
    slug: 'hazelwood',
    neighborhood: 'New Center / Hazelwood',
    address: {
      street: '146 Hazelwood St',
      locality: 'Detroit',
      region: 'MI',
      postalCode: '48202',
    },
    /** §4.5 — from the Street View metadata endpoint 2026-07-27, not typed from memory. */
    coords: { lat: 42.3803125, lon: -83.0831845 },
    /**
     * Owner 2026-07-26: the offering is the WHOLE HOME — 6 bedrooms, 3 full baths,
     * 2 kitchens. The earlier lower-unit / upper-unit split is superseded.
     *
     * §7.3 BATHROOM RULE IS NOW RESOLVED. The count was banned from display only
     * while `unit_bath_split` was unknown. It is known: 3 full baths. Bathroom
     * counts may now appear on any page.
     */
    home: {
      bedrooms: 6,
      bathroomsFull: 3,
      kitchens: 2,
      /**
       * Owner 2026-07-26: the building divides into 2 self-contained units — which
       * is what the second kitchen is for. Utilities can be split per unit, and
       * that split is precisely what makes separate leases possible rather than
       * one lease with an internal cost-sharing arrangement.
       *
       * This does NOT reinstate the old published:false upper unit. Both units are
       * offered; the building is simply lettable at three grains.
       */
      divisible: {
        units: 2,
        utilitiesSplittable: true,
        /**
         * Owner 2026-07-27. THE TWO UNITS ARE NOT EQUIVALENT and the site must not
         * imply they are. Unit B has two baths, a full kitchen, a living room and
         * the business center; Unit A has one bath, a kitchenette and a common area.
         * Anyone letting a unit, or a room inside one, is buying materially
         * different things.
         */
        list: [
          {
            id: 'a',
            label: 'Unit A',
            bedrooms: 3,
            bathroomsFull: 2,
            kitchen: 'Full kitchen',
            kitchenContents: 'Stove, microwave, air fryer, blender, reverse-osmosis water',
            spaces: ['Living room', 'Business center'],
            /**
             * Dimensions owner-supplied 2026-07-27. "Unit 1" and "Unit 2" mapped to
             * A and B in order, which matches Unit 1 having the larger rooms —
             * CONFIRM the mapping is right, because it moves every price.
             *
             * PRICING RULE, published so it can be applied identically to everyone:
             *
             *   rate = 50% of the unit base  +  50% scaled by room area / unit average
             *
             * Half of what a room costs is what every room gets regardless of size —
             * a private lockable door, bathroom access, the kitchen, internet,
             * cleaning, the cameras. The other half scales with the floor you
             * personally occupy. Pure area scaling would have put Room 4 at 43% of
             * Room 2 despite identical access to everything shared, which is not
             * what a room is worth.
             *
             * The unit base carries the amenity gap: Unit A 0.67 baths per person
             * with a full kitchen, living room and business center; Unit B 0.33
             * baths, a kitchenette, no common space.
             *
             * Consequence worth knowing: Room 6 (132 sqft, Unit B) prices BELOW
             * Room 1 (110 sqft, Unit A). Bigger room, lower price, because the unit
             * around it is worth less. That is the rule working, not a mistake.
             */
            roomRateWeekly: `from ${perWeek(cheapestWeekly(unitARooms))}`,
            roomRateMonthly: `from ${perMonth(cheapestWeekly(unitARooms))}`,
            rooms: unitARooms,
          },
          {
            id: 'b',
            label: 'Unit B',
            bedrooms: 3,
            bathroomsFull: 1,
            kitchen: 'Kitchenette',
            /**
             * Still open, but no longer blank. The kitchenette floorplan — owner
             * 2026-07-28 — draws a 4-burner range, a dishwasher, a sink and an 8'4"
             * counter run. That stays a TBD rather than becoming the answer because the
             * drawing is `asBuilt: false`: it is what the room is meant to contain, not
             * what has been installed in a house still in rehab. Confirm on site, then
             * state it.
             *
             * If it holds, "kitchenette" undersells this room and the word is doing
             * pricing work it may not deserve — see `kitchen.unitMapping`.
             */
            kitchenContents: tbd('unit_b_kitchenette_contents', 'A kitchenette is not a kitchen — what is in it?'),
            /**
             * Owner 2026-07-27: no common space beyond the kitchenette. Recorded as
             * an explicit "none" rather than an empty list, because a blank cell
             * reads as unknown and this is known.
             */
            spaces: [],
            spacesNote: 'No common space other than the kitchenette.',
            roomRateWeekly: `from ${perWeek(cheapestWeekly(unitBRooms))}`,
            roomRateMonthly: `from ${perMonth(cheapestWeekly(unitBRooms))}`,
            rooms: unitBRooms,
          },
        ],
        /**
         * The business center sits in Unit A. If the units let separately, does a
         * Unit B resident get access? Unanswered — and it matters more now that
         * Unit B is confirmed to have no common space at all. Without access, three
         * people share one bathroom, a kitchenette, and nowhere to sit that is not
         * a bedroom.
         */
        sharedSpaces: tbd('shared_spaces_across_units', 'Business center and living room are in Unit A — shared or not?'),
      },
      furnished: true,
      /**
       * Bedroom furnishings — owner 2026-07-28.
       *
       * `furnished: true` was previously the whole statement on this, which is a claim
       * with no content in it. Someone deciding what to ship, or whether a room works
       * as a place to sit for three months, needs the inventory.
       *
       * NOT AS-BUILT, and the copy has to say so. Same rule the floorplans follow: the
       * house is in rehab, so this is the specified furnishing for first occupancy, not
       * what is in the rooms today. `asBuilt: false` is what lets the page say "will
       * include" and stay true — §13.4 also requires the date label on anything future.
       */
      bedroomFurnishings: {
        asBuilt: false,
        forOccupancy: 'September 2026',
        items: [
          bedSummary(),
          'Air conditioning — its own window or portable unit, set in the room',
          'Closet with hanging space',
          'Side table',
          'Dresser or armoire',
          'Small desk and chair',
          'TV',
        ],
        /**
         * Owner 2026-07-28: a window or portable unit per bedroom.
         *
         * The selling point is not the cooling, it is the control. Six adults on
         * opposing shifts sharing one thermostat is a genuine source of friction, and a
         * night-shift resident sleeping 08:30–17:30 is asleep through the hottest part
         * of a Detroit afternoon while the day-shift residents are out. Per-room control
         * is the answer to that, and it is worth saying rather than burying in a list.
         *
         * BUSINESS NOTE, not site copy. `utilities.included` covers power. Six
         * individually controlled AC units, with residents carrying no marginal cost for
         * running them, is an uncapped summer expense the owner absorbs — and the
         * incentive for a resident to moderate is zero. Worth pricing before the first
         * July rather than discovering it on a bill.
         */
        acTypeByRoom: tbd(
          'bedroom_ac_type_by_room',
          'Which rooms get a window unit and which get a portable one'
        ),
        /**
         * PLANNED — owner 2026-07-28: the window and portable units are the interim
         * answer; the intent is a ductless mini split in each bedroom.
         *
         * status 'planned', so this renders NOWHERE — §3.4, and the same rule the partner
         * portal follows. There is no date, and a dateless upgrade on a housing page is a
         * promise a resident will hold you to: someone who books in September partly
         * because mini splits are "coming" has been sold something with no delivery
         * commitment behind it. Give it a date and it may appear, badged, like any other
         * `launching` item.
         *
         * The interim copy stays exactly as it is. "Its own window or portable unit" is
         * true today, and adding "for now" would raise the when question the site cannot
         * answer.
         *
         * WORTH KNOWING FOR SEQUENCING — this upgrade would close three open questions at
         * once, not just one:
         *
         * - `heating`. Mini splits are heat pumps, so they heat as well as cool. That
         *   makes this a heating decision as much as a cooling one, and it answers the
         *   per-room-versus-one-thermostat problem in both directions.
         * - `central_air`. Ductless per room is the answer, rather than a question.
         * - `bedroom_ac_type_by_room` becomes moot.
         *
         * And the economics point the other way from "temporary". Window and portable
         * units are the least efficient cooling there is, and power is an included
         * utility — so the owner carries the running cost of the interim solution every
         * summer it stays. The inefficiency of the stopgap is the business case for the
         * replacement, which argues for a date sooner than "future" rather than later.
         */
        plannedUpgrade: {
          what: 'Ductless mini split in each bedroom, replacing the window and portable units',
          status: 'planned' as const,
          liveFrom: tbd(
            'minisplit_target_date',
            'When mini splits land — needed before this can appear on the site at all'
          ),
        },
        /**
         * Per-room units imply there is no central cooling, but implication is not a
         * fact and a reader may well assume central air in a renovated house. Say which.
         */
        centralAir: tbd('central_air', 'Is per-room AC the whole cooling story, or is there central air too?'),
        /**
         * NOT STATED ANYWHERE ON THE SITE, and more material than the cooling in this
         * city. Gas is in the included utilities, which hints at gas heat, but a hint is
         * not an answer — and a clinician signing for a Detroit winter will ask. How it
         * is controlled matters as much as what it is: if cooling is per room and heat is
         * one thermostat for the house, that is the friction the AC units just solved,
         * reappearing in January.
         *
         * Answer this one on its own rather than waiting on `plannedUpgrade`. Mini splits
         * would settle it, but they have no date, and the first winter arrives whether or
         * not they do. Whatever heats the house in January 2027 is what the page has to
         * describe.
         */
        heating: tbd('heating', 'What heats the house, and is it controlled per room or per house?'),
        /**
         * Owner gave storage as "dresser and or armoire", recorded as "or" because
         * and/or tells a reader nothing.
         *
         * Owner 2026-07-28 also confirmed every bedroom has a closet with hanging space,
         * which settles the part that actually mattered — nobody is hanging scrubs off a
         * door hook because their room drew the dresser. What is left is which room gets
         * which case, and that is now a detail rather than a material term.
         */
        storageByRoom: tbd(
          'bedroom_storage_by_room',
          'Which rooms get a dresser, which get an armoire, which get both'
        ),
        /**
         * NARROWED 2026-07-28, not resolved. Room 4 is 9.5 × 8.5 ft — 81 sq ft, the
         * smallest in the house — and it takes a twin rather than a queen, which is the
         * point of the twin. The closet is built in, so it costs no floor either.
         *
         * Still worth measuring before publishing "every bedroom": a twin, side table,
         * dresser or armoire, desk and chair all have to stand in 81 sq ft with a door
         * that opens. "Every bedroom includes" is a promise about the smallest room, not
         * the average one, and a resident who arrives to find no desk has been told
         * something untrue.
         *
         * The AC choice now feeds into this. A window unit takes no floor; a portable one
         * takes floor plus clearance for its vent hose. In Room 4 that is the difference
         * between the list fitting and not, so `bedroom_ac_type_by_room` is the cheaper
         * question to answer first — give Room 4 the window unit and this gets easier.
         */
        fitsSmallestRoom: tbd(
          'furnishings_fit_room_4',
          'Does the list fit Room 4 at 81 sq ft, with a twin and the closet built in?'
        ),
      },
      laundry: 'in-unit' as const,
      entrance: 'private' as const,
      terms: {
        /**
         * Owner 2026-07-26: rooms let WEEK BY WEEK. This replaces the 30-day
         * minimum and the monthly rate — a weekly serviced room is a different
         * product from a monthly furnished lease, and the copy follows the terms.
         */
        billingPeriod: 'week' as const,
        /**
         * Both grains are quoted, weekly first. The order matters: weekly is the
         * product and monthly is a way of paying for a long one, not a second product
         * with its own terms. See `monthlyBilling` for why the monthly minimum is 31
         * days rather than 28 and what crossing one month does to tax and tenancy.
         */
        billingPeriods: ['week', 'month'] as const,
        minWeeks: 1,
        typicalContractWeeks: 13,
        /**
         * Three grains, owner 2026-07-26. Every one of them needs its own honest
         * rate — "mix and match" is only credible if each option is priced.
         */
        letting: ['room', 'unit', 'house'] as const,
        /**
         * MARKET-DERIVED ANCHORS 2026-07-27, not owner-set. Owner asked to set high
         * and invite negotiation.
         *
         * Working: Detroit furnished 1BR asks $2,350–3,200/mo (vendor list price);
         * Furnished Finder's platform average is $1,200–2,200/mo. A serviced private
         * room sits below a private 1BR, so ~$1,840/mo = $425/week anchors at the top
         * of defensible. Unit and house are priced under the sum of their rooms so
         * the larger booking is the better deal: 3 rooms would be $1,275, the unit
         * asks $1,200; 6 rooms would be $2,550, the house asks $2,300.
         *
         * A travel stipend for Detroit runs roughly $1,500–2,500/month, so $425/week
         * is inside stipend but at the top — which is what an anchor should be.
         * CONFIRM: these are live offers the release gate will not stop.
         */
        /**
         * Rooms are no longer one price. Each unit carries its own rate — see
         * `divisible.list[].roomRateWeekly` — because a room in Unit B buys a third
         * of one bathroom and a kitchenette, and the same money in Unit A buys twice
         * the bathroom, a full kitchen, a living room and a desk.
         *
         * FAIR HOUSING: differential room pricing is fine when it follows a stated
         * rule about the property. It is not fine when it varies by who is asking.
         * The rule here is the unit, published on the rate sheet, and it applies to
         * everyone. That is what keeps a negotiable rate defensible.
         */
        rateRoomWeeklyFrom: perWeek(cheapestWeekly([...unitARooms, ...unitBRooms])),
        rateRoomMonthlyFrom: perMonth(cheapestWeekly([...unitARooms, ...unitBRooms])),
        /**
         * Published so a differential can be shown to be a rule, not a judgement call.
         *
         * The monthly sentence is part of that, not a footnote. Fair housing tolerates
         * differential pricing that follows a stated rule about the property and not
         * about who is asking — so a monthly discount has to be the same multiple for
         * everyone, published, and not something negotiated per applicant. One
         * multiplier applied to every room keeps the whole rate sheet defensible.
         */
        roomPricingRule:
          'Half of each room rate is the same for every room — private lockable door, bathroom ' +
          'access, kitchen, internet, cleaning, cameras. The other half scales with the room\'s floor ' +
          'area against the average for its unit. Third-floor rooms are then reduced 10% for the climb. ' +
          `A month is priced at ${monthlyBilling.multiplier} weeks, the same for every room, so a ` +
          'monthly stay is about 8% below the weekly rate over the same period.',
        /**
         * Factual only. Describe the stairs, never who can manage them — §9 and
         * COMPLIANCE.md ban "must be able to" and "able bodied", and a physical
         * capability requirement in a housing advert is a disability problem. State
         * the floor and the flights and let the reader decide.
         */
        /**
         * Owner 2026-07-27: rooms 1-4 second floor, rooms 5-6 third. So there is no
         * ground-floor bedroom at all — nobody lives here without climbing at least
         * one flight.
         *
         * Stated as a fact about the building, never about who can manage it. §9 and
         * COMPLIANCE.md ban "must be able to" and "able bodied": a physical
         * capability requirement in a housing advert is a disability problem. Give
         * the floors and the flights; the reader decides.
         */
        accessNote:
          'Every bedroom is on the second or third floor. The house is stairs only; there is no lift.',
        stairFlights: tbd('stair_flights_to_third', 'Flights from entry to the third floor'),
        /**
         * Owner 2026-07-27: unit and whole-building lets are priced on inquiry.
         * Coherent with the published room rate — a transparent number wins the
         * individual clinician, a conversation wins the agency booking six beds.
         *
         * NOTE this was applied to the whole building too, which the owner specified
         * only for units. Confirm.
         */
        rateUnitWeekly: 'On inquiry',
        rateHouseWeekly: 'On inquiry',
        /**
         * FAIR HOUSING — read this before publishing a negotiable rate.
         *
         * Discretionary pricing is lawful and normal, but it is also the mechanism by
         * which disparate treatment happens without anyone intending it: two
         * applicants negotiate, one gets a better number, and the difference
         * correlates with a protected characteristic. "They asked" is not a defence.
         *
         * What makes it defensible: a published rate everyone sees, a written list of
         * what earns a reduction (length of stay, multiple rooms, agency volume,
         * off-peak), applied the same way to everyone, and the reason recorded on
         * every deal. That record is also what Phase 02's audit log is for.
         */
        negotiable: true,
        negotiationBasis: tbd('negotiation_basis', 'Written list of what earns a reduction'),
        utilities: {
          /** Owner 2026-07-27. Internet is listed separately as a service. */
          included: 'Power, gas, water and sewage',
          /** Metering splits across the 2 units — the basis for separate leases. */
          splitByUnit: true,
        },
        deposit: 'No security deposit for short-term stays',
        /**
         * RECOMMENDED 2026-07-27, owner asked for help. Not yet confirmed.
         *
         * Minimum 1 week matches the weekly product and the "not a weekend" line.
         *
         * Maximum 26 weeks is a deliberate ceiling, not a market figure. A long
         * enough stay stops looking like lodging and starts looking like a tenancy,
         * which brings landlord-tenant obligations this product is not built for —
         * and it is the same question ADR-0002 raises about weekly rooms plus
         * services. Two clinical contracts back to back fit inside 26 weeks; a year
         * does not, and a year should be a different agreement. Counsel should set
         * the real number.
         */
        minTerm: '1 week',
        /**
         * The monthly rate needs its own minimum, and it is not "1 month". Anything
         * short of 31 days misses the >1-month use tax exemption while still being
         * sold as monthly — see `monthlyBilling.minDays`.
         */
        minTermMonthly: `${monthlyBilling.minDays} days`,
        maxTerm: '26 weeks',
        /** Owner 2026-07-27. */
        paymentTerms: 'Net 15',
        leadTime: '2 days',
      },
      /**
       * FAIR HOUSING — assistance animals are NOT pets. A service or assistance
       * animal is a reasonable accommodation under the FHA and CANNOT be put to a
       * housemate vote, refused, or charged a pet fee. The carve-out is what keeps
       * the petition policy lawful.
       */
      pets: {
        policy: 'Pets are considered by petition. With six bedrooms in one house, a pet ' +
          'is approved when the current residents agree.',
        assistanceAnimalCarveOut:
          'Service animals and assistance animals are not pets. They are not subject ' +
          'to the petition, are never put to a resident vote, and are never charged a ' +
          'pet fee or deposit.',
      },
      parking: parkingSpec,
      smoking: tbd('smoking_policy'),
      quietHours: tbd('quiet_hours'),
      availability: {
        status: 'pre_leasing' as const,
        availableFrom: 'September 2026',
        exactDate: tbd('availability_exact_date'),
      },
      /**
       * Owner 2026-07-26: cameras provided, residents can view.
       *
       * MATERIAL DISCLOSURE. Surveillance of a shared home is a fact a person is
       * entitled to know BEFORE they book, not on arrival — so it renders on the
       * house page and in the terms, not buried.
       *
       * HARD LINE: cameras must never cover a bedroom, a bathroom, or any place a
       * resident undresses. That is not a policy preference; recording a private
       * place is a criminal matter in Michigan. `coverage` must state the exact
       * locations before launch.
       */
      /**
       * Owner 2026-07-26: Ubiquiti camera system, 2 doorbell + 2 bullet, residents
       * get full monitoring access.
       *
       * MATERIAL DISCLOSURE, not a feature bullet. Surveillance of a shared home is
       * something a person is entitled to know BEFORE they book, so it renders on
       * the house page and in the agency terms.
       *
       * HARD LINE: no camera may cover a bedroom, a bathroom, or anywhere a person
       * undresses. Recording a private place is a criminal matter in Michigan, not
       * a policy preference. All four devices here are entrance/exterior.
       */
      security: {
        system: 'Ubiquiti',
        cameras: [
          { type: 'Doorbell camera', count: 2, placement: 'One at each entrance' },
          { type: 'Bullet camera', count: 2, placement: 'Outdoors, covering the exterior' },
        ],
        interiorCameras: false,
        neverCovered: 'No camera covers a bedroom, a bathroom, or any interior space.',
        /** Every resident sees live view and recordings — see the note on §residentAccess below. */
        residentAccess: 'Full access to live view and recorded footage for every resident.',
        retention: tbd('camera_retention', 'How long footage is kept'),
        otherViewers: tbd('camera_other_viewers', 'Who besides residents can view — owner? manager?'),
        locks: 'PDQ electronic locks on every door, including each bedroom',
        keyHandover: false,
      },
      kitchen: {
        /**
         * "2 kitchens" was accurate as a count and misleading as a claim — a kitchenette
         * may not have a stove, and six people sharing one real kitchen is a different
         * offer. Hence the split into `full` and `kitchenettes`.
         *
         * UNRESOLVED CONTRADICTION, found 2026-07-28. WHICH UNIT HAS THE FULL KITCHEN IS
         * STATED TWO WAYS IN THIS FILE.
         *
         * This comment previously read "one full kitchen (Unit B) and one kitchenette
         * (Unit A)". `divisible.list` says the opposite: Unit A is 'Full kitchen', Unit B
         * is 'Kitchenette'. The pages render `divisible.list`, so the live site says Unit
         * A has the full kitchen — but nobody has confirmed which of the two is right,
         * and the assertion has been removed from this comment rather than picked.
         *
         * The floorplan makes it worse rather than better. Owner 2026-07-28 says that
         * drawing is the kitchenette, and it shows a 4-burner range, a dishwasher, a sink
         * and an 8'4" counter run. Meanwhile Unit A's "full kitchen" is recorded as
         * stove, microwave, air fryer and blender — countertop appliances, no dishwasher,
         * no counter dimension. On the documents alone the kitchenette reads as the
         * better-equipped room, which is the wrong way round.
         *
         * WHY IT IS NOT COSMETIC. The room pricing rationale rests on it: "the unit base
         * carries the amenity gap — Unit A 0.67 baths per person with a full kitchen,
         * living room and business center; Unit B 0.33 baths, a kitchenette, no common
         * space." If the kitchens are the other way round, Unit A's premium is partly
         * unearned and every Unit B room is underpriced. It also compounds the mapping
         * caveat already recorded on `roomRateWeekly`: "Unit 1" and "Unit 2" were mapped
         * to A and B in order and never confirmed.
         *
         * Resolve by walking the house, not by reading this file.
         */
        unitMapping: tbd(
          'kitchen_unit_mapping',
          'Which unit has the full kitchen and which the kitchenette? Config states both ways; pricing depends on it'
        ),
        count: 2,
        full: 1,
        kitchenettes: 1,
        /** Owner 2026-07-26. A furnished-rental deal-breaker, so it gets its own section. */
        appliances: ['Stove', 'Microwave', 'Air fryer', 'Blender'],
        /** Reverse osmosis, plumbed to both outlets — owner 2026-07-26. */
        water: 'Reverse-osmosis filter, plumbed to the tap and to the ice maker',
        /** Not stated. An ice maker implies a fridge, but implication is not a fact. */
        refrigerator: tbd('kitchen_refrigerator'),
        sameInBothKitchens: tbd('kitchen_parity', 'Are both kitchens equipped the same?'),
        cookware: tbd('kitchen_cookware'),
      },
      /**
       * DESIGN-PLAN §6: the copy says "measured X down on DATE", never "high-speed".
       * A plan rating is not a measurement, so the two are separate fields. The
       * rated figure can ship now; the measured one cannot exist until service is
       * live in a finished house.
       */
      /**
       * Owner 2026-07-27: dropped the measured-throughput section as bloat. The
       * rated figures are what a resident is buying and what the contract says; a
       * second set of numbers measured on one afternoon in one room added length
       * without adding trust.
       */
      internet: {
        tier: 'Business',
        /** INFERRED: "300MB/S" read as 300 Mbps. 300 MB/s would be 2.4 Gbps. */
        ratedDown: '300 Mbps',
        ratedUp: '100 Mbps',
      },
      /**
       * Owner 2026-07-27. Neither door is step-free into the house: the front is 8
       * steps up to the first floor, the back is level at the threshold but meets
       * steps immediately inside. With every bedroom on the second or third floor
       * and no lift, there is no step-free route to any room.
       *
       * Facts about the building. Never a requirement about the reader.
       */
      entry: {
        front: 'Front door: 8 steps up to the first floor.',
        back: 'Back door: level with the street, then steps immediately inside.',
        stepFree: false,
      },
      /**
       * Floorplans. Save each file under src/assets/ and set `image` to the
       * filename; the slot renders a placeholder until then.
       *
       * A PLAN IS NOT AN AS-BUILT. Rehab is in progress, so a drawing shows what is
       * intended, not what exists. `asBuilt` says which, and the caption follows it —
       * publishing a proposed layout as though it were installed is the same
       * category of error as an unmeasured drive time.
       */
      floorplans: [
        {
          id: 'kitchen',
          label: 'Kitchenette',
          image: tbd('floorplan_kitchen', 'Save as src/assets/floorplan-kitchen.png'),
          asBuilt: false,
          /** Read off the drawing, not measured on site. */
          dimensions: '8\'4" along the counter run',
          fixtures: '4-burner range (2\'4" × 2\'4"), dishwasher, sink',
          /**
           * Owner 2026-07-28: this drawing is the kitchenette. Recorded as "the
           * kitchenette" and NOT as a unit, deliberately — see `kitchen.unitMapping`.
           * Which unit the kitchenette sits in is a separate and currently contradicted
           * question, and answering it here would smuggle in a claim the owner did not
           * make.
           *
           * Note what the drawing puts in a kitchenette: a 4-burner range, a dishwasher,
           * a sink and an 8'4" counter run. That is a well-equipped small kitchen, and it
           * bears on both `unit_b_kitchenette_contents` and on how large the amenity gap
           * between the units really is.
           */
          whichKitchen: 'The kitchenette',
        },
        {
          id: 'house',
          label: 'Whole house',
          image: tbd('floorplan_house', 'Save as src/assets/floorplan-house.png'),
          asBuilt: false,
          dimensions: tbd('floorplan_house_dimensions'),
          fixtures: tbd('floorplan_house_fixtures'),
          whichKitchen: null,
        },
      ],
      rooms: [] as Array<{ id: string; name: string; caption: string; photo: Fact<string> }>,
    },
    /**
     * Factual only — §9 bans characterisations like "walking distance". A block
     * count is a measurement the reader can judge; an adjective is not.
     */
    transit: {
      qline: {
        /** Owner 2026-07-26: "5 block walk to the Q line". Named QLINE — INFERRED brand spelling. */
        name: 'QLINE',
        description: 'Streetcar running along Woodward Avenue.',
        distance: '5 blocks',
        /**
         * Owner said "5 blocks". Measured, it is 0.84 miles and 19 minutes on foot —
         * a real walk, not a hop. Both are stated: the block count is what a local
         * would say, the minutes are what someone deciding whether to bring a car
         * actually needs.
         */
        nearestStop: driveTimes.transit.qline.stop,
        walkTime: `${driveTimes.transit.qline.walkMinutes} min (${driveTimes.transit.qline.walkMiles} miles), measured`,
      },
      other: tbd('transit_other', 'Bus routes and anything else, factual only'),
    },
    /**
     * §13.3 — no INTERIOR photos exist during rehab. An exterior shot of the building
     * as it stands today is a different thing and is allowed, provided it reflects
     * current state. Drop the file at src/assets/<name> and set the value here.
     */
    photos: {
      exteriorFront: 'exterior-front.jpg',
      /**
       * Street View fallback while there is no current photo. Metadata says the
       * imagery is July 2022 — four years old and BEFORE the renovation: the deck
       * is bare and the lot is overgrown in it. It undersells the house, which is
       * the safer direction to be wrong in, but it is still not the house as it
       * stands. Replace it the moment a real photo exists.
       */
      streetViewCaptured: 'July 2022',
      streetViewNote: 'Taken before the current renovation.',
    },
    rehab: {
      status: 'in_progress' as const,
      completionTarget: tbd('rehab_completion_target'),
      photosExpected: tbd('photos_expected_date'),
    },
    applications: {
      open: true,
      forOccupancy: 'September 2026',
      /**
       * PROPOSED 2026-07-27, owner asked for help. Not yet confirmed.
       *
       * This is the LAUNCH path and it is manual by design (ADR-0001 option B).
       * Phase 02 replaces steps 2–4 with automated intake; when it does, this
       * becomes one config edit and `platform` stops being null.
       */
      process: [
        'Send an inquiry through the site, or email or call.',
        'We reply within one business day with what is free and what it costs.',
        'We email you the application. It is completed off-site, not on this website.',
        'Screening, against criteria published before anyone is scored.',
        'Agreement signed and the first week paid. Door access is issued before you arrive.',
      ],
      /**
       * Owner 2026-07-27. Low enough to read as covering cost rather than as a
       * revenue line, which is the right posture for a housing application fee —
       * and it keeps well clear of anywhere a cap might bite.
       */
      fee: '$15',
      screeningCriteria: tbd('screening_criteria'),
      /** ADR-0001 / SPEC-DMFP-FE-0207. `null` = manual path, which is the launch state. */
      platform: null as string | null,
    },
    commute: {
      /**
       * Measured by scripts/drive-times.mjs, not typed in. Re-run
       * `npm run measure:commute` to refresh; the date below comes from the run.
       */
      method: driveTimes.method,
      measuredAt: driveTimes.measuredAt,
      /**
       * ORDER IS DELIBERATE — owner 2026-07-28: Henry Ford first.
       *
       * It is also what the measurements say. Henry Ford is 1.4 miles and 6 minutes;
       * DMC is 3.4 miles and 8–9. Leading with the nearer, larger anchor is the honest
       * order as well as the intended one, and it is the campus the New Center
       * build-out is happening on.
       *
       * Display order follows this array everywhere it is rendered. Do not re-sort it
       * in a component.
       */
      facilities: [
        {
          id: 'hfh',
          name: 'Henry Ford Hospital',
          nameConfirmed: false,
          destAddress: driveTimes.facilities.hfh.dest,
          coords: tbd('facility_hfh_coords'),
          distance: driveTimes.facilities.hfh.distance,
          driveTime: driveTimes.facilities.hfh.driveTime,
          samples: driveTimes.facilities.hfh.samples,
          transit: driveTimes.facilities.hfh.transit ?? tbd('facility_hfh_transit'),
        },
        {
          id: 'dmc',
          name: 'Detroit Medical Center',
          nameConfirmed: false,
          destAddress: driveTimes.facilities.dmc.dest,
          coords: tbd('facility_dmc_coords'),
          distance: driveTimes.facilities.dmc.distance,
          driveTime: driveTimes.facilities.dmc.driveTime,
          samples: driveTimes.facilities.dmc.samples,
          transit: driveTimes.facilities.dmc.transit ?? tbd('facility_dmc_transit'),
        },
      ] as Facility[],
    },
    map: {
      bbox: tbd('map_bbox'),
      minZoom: 11,
      maxZoom: 16,
      /**
       * Google Maps embed — owner decision 2026-07-26, superseding the self-hosted
       * MapLibre plan in DESIGN-PLAN §4 for launch.
       *
       * The key is PUBLIC by design (it ships in the HTML) and MUST be restricted by
       * HTTP referrer to detroitmedfocusproperties.com in the Google Cloud console,
       * or anyone can spend your quota. Until a key exists the component renders
       * plain directions links instead — no key, no iframe, no tracking.
       */
      /**
       * Read from the environment, never committed. The key ends up in the built
       * HTML — unavoidable for an embed — but it does not belong in a public repo's
       * source or history, where it outlives any rotation.
       *
       * Local: .env (gitignored). CI: an Actions *variable* named
       * PUBLIC_GOOGLE_MAPS_EMBED_KEY — a variable, not a secret, since the value is
       * public by nature. Same pattern RUNBOOK Part 2 sets for the form endpoint.
       *
       * Unset means no iframe at all, just a directions link. See RouteMap.astro.
       */
      googleEmbedApiKey:
        import.meta.env.PUBLIC_GOOGLE_MAPS_EMBED_KEY ??
        tbd('google_maps_embed_api_key', 'Set PUBLIC_GOOGLE_MAPS_EMBED_KEY'),
    },
    dayBand: {
      presets: {
        days: {
          origin: '06:00',
          shift: { start: '07:00', end: '19:30' },
          sleep: { start: '20:30', end: '05:30' },
        },
        nights: {
          origin: '18:00',
          shift: { start: '19:00', end: '07:30' },
          sleep: { start: '08:30', end: '17:30' },
        },
      } satisfies Record<'days' | 'nights', DayBandPreset>,
      /** §3.4 — a marker renders only if its service resolves live (or launching, badged). */
      markers: [
        { at: '05:30', serviceId: 'parking', label: 'Leave for shift' },
        { at: '20:00', serviceId: 'laundry', label: 'Laundry' },
      ],
    },
  },
];

export const property = properties[0];
export const home = property.home;
