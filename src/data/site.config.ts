/**
 * The single source of every fact on this site.
 *
 * DESIGN-PLAN §0: no component may state a fact as a literal. A value that is not
 * known yet is a `Tbd`, never a plausible guess and never an empty string.
 * SPEC-DMFP-FE-0102 FR-002, CON-004.
 */

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
  parking: Fact<string>;
}

export interface DayBandPreset {
  /** Axis origin — DESIGN-PLAN §3.1. Each preset re-origins so both blocks stay contiguous. */
  origin: string;
  shift: { start: string; end: string };
  sleep: { start: string; end: string };
}

export const site = {
  brand: 'Detroit Med Focus Properties',
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
    email: tbd('inquiry_email', 'info@ was inferred from house convention, never confirmed'),
    phone: '(734) 489-2708',
    /** /for-agencies leads with a named human, not a form. */
    name: tbd('contact_name'),
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
    'Cleaning between stays is not a scheduled service.',
    'No on-site staff.',
    'Renters insurance is not provided.',
  ],
  documents: {
    /** /for-agencies §5 */
    turnaround: tbd('docs_turnaround', 'Turnaround for W-9 and certificate of insurance'),
  },
  analytics: { enabled: false },
  form: {
    /** Set in Phase 02 (SPEC-DMFP-FE-0207). `null` means the manual application path. */
    endpoint: 'https://contact-us-api.detroitmedfocusproperties.com/contact',
  },
} as const;

export const services: Service[] = [
  {
    id: 'laundry',
    name: 'In-unit laundry',
    description: 'Washer and dryer inside the unit.',
    included: true,
    status: 'live',
  },
  {
    id: 'parking',
    name: 'On-site parking',
    description: '4 spots on site. Street parking otherwise.',
    /** Not included — it is a priced add-on, so `included` must be false. */
    included: false,
    status: 'live',
    price: '$200/month',
  },
  /**
   * Food packages — owner 2026-07-26, the priority service line.
   *
   * status: 'planned' means these render NOWHERE (§3.4). That is deliberate: none
   * of them operate yet, and a priced package on a live page is an offer. Move to
   * 'launching' with a date once there is a real start date, then 'live' when the
   * first delivery actually happens.
   */
  {
    id: 'food-fridge',
    name: 'Fridge fill',
    description: 'Groceries stocked before you arrive and topped up weekly.',
    included: false,
    status: 'planned',
    price: '$200/week',
    liveFrom: tbd('food_fridge_live_from'),
  },
  {
    id: 'food-prepped',
    name: 'Easy meals',
    description: 'Meals prepped for quick cooking.',
    included: false,
    status: 'planned',
    price: '$350/week',
    liveFrom: tbd('food_prepped_live_from'),
  },
  {
    id: 'food-hot',
    name: 'Hot meals delivered',
    description: 'Hot meals delivered in an agreed time window.',
    included: false,
    status: 'planned',
    /** INFERRED: given as "$600" with no unit; read as per week to match the other two. Confirm. */
    price: '$600/week',
    liveFrom: tbd('food_hot_live_from'),
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'Included in rent.',
    included: true,
    status: 'launching',
    liveFrom: tbd('internet_live_from'),
  },
];

/** DESIGN-PLAN §13.4 — during pre-leasing, `launching` renders WITH a mandatory date label. */
export const serviceDisplay = { showNonLive: true } as const;

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
    /** §4.5 — geocoded at build time, never typed from memory. */
    coords: tbd('property_coords'),
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
      furnished: true,
      laundry: 'in-unit' as const,
      entrance: 'private' as const,
      terms: {
        minNights: 30,
        typicalContractWeeks: 13,
        /** Let either way, depending on the enquiry — owner 2026-07-26. */
        letting: 'either' as const,
        rateRoomMonthly: tbd('rate_room_monthly', 'Per bedroom, one of 6'),
        rateHouseMonthly: tbd('rate_house_monthly', 'Whole 6-bedroom house, one party'),
        utilities: tbd('utilities_included'),
        deposit: 'No security deposit for short-term stays',
        minTerm: tbd('term_min'),
        maxTerm: tbd('term_max'),
        paymentTerms: tbd('payment_terms'),
        leadTime: tbd('lead_time', 'Notice an agency needs to give'),
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
      parking: '4 spots on site at $200/month. Street parking otherwise.',
      smoking: tbd('smoking_policy'),
      quietHours: tbd('quiet_hours'),
      availability: {
        status: 'pre_leasing' as const,
        availableFrom: 'September 2026',
        exactDate: tbd('availability_exact_date'),
        bedsAvailable: tbd('beds_available', 'Of 6 — how many are free for September'),
      },
      kitchen: {
        count: 2,
        appliances: tbd('kitchen_appliances'),
        cookware: tbd('kitchen_cookware'),
      },
      internet: { down: tbd('internet_down'), up: tbd('internet_up'), measuredAt: tbd('internet_measured_date') },
      entry: { floor: 'Street level', steps: tbd('entry_steps') },
      floorplan: tbd('floorplan_house'),
      rooms: [] as Array<{ id: string; name: string; caption: string; photo: Fact<string> }>,
    },
    transit: tbd('transit_notes', 'Factual only: measured distances, never characterisations (§9)'),
    /**
     * §13.3 — no INTERIOR photos exist during rehab. An exterior shot of the building
     * as it stands today is a different thing and is allowed, provided it reflects
     * current state. Drop the file at src/assets/<name> and set the value here.
     */
    photos: {
      exteriorFront: tbd('photo_exterior_front', 'Save as src/assets/exterior-front.jpg'),
    },
    rehab: {
      status: 'in_progress' as const,
      completionTarget: tbd('rehab_completion_target'),
      photosExpected: tbd('photos_expected_date'),
    },
    applications: {
      open: true,
      forOccupancy: 'September 2026',
      process: tbd('application_process', 'ADR-0001: manual path — the steps, in order'),
      fee: tbd('application_fee'),
      screeningCriteria: tbd('screening_criteria'),
      /** ADR-0001 / SPEC-DMFP-FE-0207. `null` = manual path, which is the launch state. */
      platform: null as string | null,
    },
    commute: {
      method: tbd('commute_method'),
      measuredAt: tbd('commute_measured_at'),
      facilities: [
        {
          id: 'dmc',
          name: 'Detroit Medical Center',
          nameConfirmed: false,
          destAddress: tbd('facility_dmc_dest'),
          coords: tbd('facility_dmc_coords'),
          distance: tbd('facility_dmc_distance'),
          driveTime: tbd('facility_dmc_drivetime'),
          parking: tbd('facility_dmc_parking'),
        },
        {
          id: 'hfh',
          name: 'Henry Ford Hospital',
          nameConfirmed: false,
          destAddress: tbd('facility_hfh_dest'),
          coords: tbd('facility_hfh_coords'),
          distance: tbd('facility_hfh_distance'),
          driveTime: tbd('facility_hfh_drivetime'),
          parking: tbd('facility_hfh_parking'),
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
      googleEmbedApiKey: tbd('google_maps_embed_api_key', 'Maps Embed API key, referrer-restricted'),
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
