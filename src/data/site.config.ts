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
    name: 'Bin storage',
    description: 'A bin held for you in a secured area.',
    included: false,
    status: 'launching',
    liveFrom: 'September 2026',
    /** Owner-set 2026-07-26. Note this is MONTHLY where the other services are weekly. */
    price: '$60/month',
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
    description: '4 spots on site. Street parking otherwise.',
    included: false,
    status: 'live',
    price: '$200/month',
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'Included in the room rate.',
    included: true,
    status: 'launching',
    liveFrom: 'September 2026',
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
        bedroomSplit: tbd('unit_bedroom_split', 'How the 6 bedrooms divide across the 2 units'),
        bathroomSplit: tbd('unit_bathroom_split', 'How the 3 full baths divide across the 2 units'),
      },
      furnished: true,
      laundry: 'in-unit' as const,
      entrance: 'private' as const,
      terms: {
        /**
         * Owner 2026-07-26: rooms let WEEK BY WEEK. This replaces the 30-day
         * minimum and the monthly rate — a weekly serviced room is a different
         * product from a monthly furnished lease, and the copy follows the terms.
         */
        billingPeriod: 'week' as const,
        minWeeks: 1,
        typicalContractWeeks: 13,
        /**
         * Three grains, owner 2026-07-26. Every one of them needs its own honest
         * rate — "mix and match" is only credible if each option is priced.
         */
        letting: ['room', 'unit', 'house'] as const,
        rateRoomWeekly: tbd('rate_room_weekly', 'One bedroom of 6, per week'),
        rateUnitWeekly: tbd('rate_unit_weekly', 'One of the 2 units, per week'),
        rateHouseWeekly: tbd('rate_house_weekly', 'The whole building, per week'),
        utilities: {
          included: tbd('utilities_included', 'What the rate covers'),
          /** Metering splits across the 2 units — the basis for separate leases. */
          splitByUnit: true,
        },
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
