// types/salesEnquiry.ts

// Enums
export type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'QUOTED' | 'CLOSED';
export type GamePriority = 'MUST_HAVE' | 'NICE_TO_HAVE';
export type PricingStatus = 'DRAFT' | 'LOCKED';
export type ItemType = 'PACKAGE' | 'TROPHY' | 'EXTRA' | 'LOGISTICS' | 'ADJUSTMENT';
export type RateDirection = 'INCREASE' | 'DECREASE';
export type AmountSource = 'SYSTEM' | 'MANUAL';

// Contact Types
export interface ContactType {
  id: number;
  name: string;
}

export interface Contact {
  id: number;
  type: string;
  contact: string;
  contactable: boolean;
}

// Entity/Client
export interface Entity {
  id: number;
  full_name: string;
  nick_name?: string;
  country?: string;
  nationality?: string;
  contacts: Contact[];
}

// Season
export interface Season {
  id: number;
  name: string;
}

// User/Agent
export interface User {
  id: number;
  username: string;
  full_name: string;
}

// Location
export interface Location {
  id: number;
  name: string;
  code: string;
  type: string;
}

// Enquiry Area
export interface EnquiryArea {
  id: number;
  location_id: number;
  location: Location | null;
}

// Game Preference
export interface GamePreference {
  id: number;
  species_item_id: number;
  species_name: string;
  desired_quantity: number;
  priority: GamePriority;
  notes?: string;
}

// Hunter Preference
export interface HunterPreference {
  id: number;
  prev_experience?: string;
  no_of_hunters: number;
  no_of_observers: number;
  preferred_start_date?: string;
  no_of_days?: number;
  budget_min?: number;
  budget_max?: number;
  payment_method_id?: number;
  special_requests?: string;
}

// Pricing Item
export interface PricingItem {
  id: number;
  item_type: ItemType;
  item_id?: number;
  item_name?: string;
  linked_species_item_id?: number;
  linked_species_name?: string;
  description: string;
  quantity: number;
  unit_amount: number;
  total_amount: number;
  rate_direction: RateDirection;
  amount_source: AmountSource;
  is_estimate: boolean;
  is_optional: boolean;
}

// Pricing
export interface Pricing {
  id: number;
  sales_enquiry_id: number;
  price_structure_detail_id: number;
  hunting_type_id: number;
  currency_id: number;
  status: PricingStatus;
  currency?: string;
  hunting_type?: string;
  price_structure_detail?: {
    id: number;
    name: string;
    hunt_length?: string;
    amount: number;
  };
  items?: PricingItem[];
  total_amount?: number;
  optional_amount?: number;
  required_amount?: number;
  created_at: string;
  updated_at: string;
}

// Pricing Summary
export interface PricingSummary {
  total_pricings: number;
  total_amount: number;
}

// Main Sales Enquiry
export interface SalesEnquiry {
  id: number;
  date: string;
  code: string;
  status: EnquiryStatus;
  remarks?: string;
  entity_id: number;
  season_id?: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  entity?: Entity;
  season?: Season;
  user?: User;
  areas?: EnquiryArea[];
  game_preferences?: GamePreference[];
  preference?: HunterPreference;
  pricings?: Pricing[];
  pricing_summary?: PricingSummary;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  error?: string;
}

// Form/Input Types
export interface ContactInput {
  id?: number;
  contact_type_id: number;
  contact: string;
  contactable?: boolean;
  delete?: boolean;
}

export interface ClientInput {
  full_name: string;
  nick_name?: string;
  country_id?: number;
  nationality_id?: number;
  contacts?: ContactInput[];
}

export interface AreaInput {
  location_id: number;
}

export interface GamePreferenceInput {
  species_item_id: number;
  desired_quantity?: number;
  priority?: GamePriority;
  notes?: string;
}

export interface HunterPreferenceInput {
  prev_experience?: string;
  no_of_hunters?: number;
  no_of_observers?: number;
  preferred_start_date?: string;
  no_of_days?: number;
  budget_min?: number;
  budget_max?: number;
  payment_method_id?: number;
  special_requests?: string;
}

export interface CreateEnquiryInput {
  date: string;
  entity_id?: number | null;
  client?: ClientInput;
  user_id: number | null;
  season_id?: number | null;
  code?: string;
  status?: EnquiryStatus;
  remarks?: string;
  areas?: AreaInput[];
  game_preferences?: GamePreferenceInput[];
  preference?: HunterPreferenceInput;
}

export interface UpdateEnquiryInput {
  date?: string;
  entity_id?: number;
  client?: ClientInput;
  user_id?: number;
  season_id?: number;
  code?: string;
  status?: EnquiryStatus;
  remarks?: string;
  areas?: AreaInput[];
  game_preferences?: GamePreferenceInput[];
  preference?: HunterPreferenceInput;
}

export interface PricingItemInput {
  item_type: ItemType;
  item_id?: number;
  linked_species_item_id?: number;
  description: string;
  quantity?: number;
  unit_amount?: number;
  total_amount?: number;
  rate_direction?: RateDirection;
  amount_source?: AmountSource;
  is_estimate?: boolean;
  is_optional?: boolean;
}

export interface CreatePricingInput {
  price_structure_detail_id: number;
  hunting_type_id: number;
  currency_id: number;
  status?: PricingStatus;
  items?: PricingItemInput[];
}

export interface UpdatePricingInput {
  price_structure_detail_id?: number;
  hunting_type_id?: number;
  currency_id?: number;
  status?: PricingStatus;
  items?: PricingItemInput[];
}

// Filter Types
export interface EnquiryFilters {
  status?: EnquiryStatus;
  entity_id?: number;
  season_id?: number;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}
