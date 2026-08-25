export type CraftCategory =
  | "Bamboo Craft"
  | "Handloom & Textiles"
  | "Pottery & Ceramics"
  | "Woodworking & Carving"
  | "Metal Craft & Bell Metal"
  | "Handmade Jewellery"
  | "Terracotta"
  | "Embroidery & Needlework"
  | "Leather Craft"
  | "Traditional Painting & Folk Art"
  | "Stone Carving"
  | "Other Craft";

export type SellerType =
  | "individual_artisan"
  | "family_business"
  | "cooperative"
  | "self_help_group"
  | "rural_producer_group"
  | "small_retail";

export type WorkspaceType =
  | "home_workshop"
  | "dedicated_studio"
  | "community_shed"
  | "cooperative_center";

export interface SellerLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  captured_at?: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  phone: string;
  artisan_name?: string;
  business_name?: string;
  bio?: string;
  craft_category: CraftCategory;
  craft_specialties: string[];
  experience_years: number;
  seller_type: SellerType;
  workspace_type: WorkspaceType;
  number_of_workers: number;
  daily_labour_rate_inr: number;
  daily_capacity_units: number;
  lead_time_days: number;
  location?: SellerLocation;
  workspace_photos: string[];
  verification_status: string;
  trust_score: number;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerProfileUpdatePayload {
  artisan_name?: string;
  business_name?: string;
  bio?: string;
  craft_category?: CraftCategory;
  craft_specialties?: string[];
  experience_years?: number;
  seller_type?: SellerType;
  workspace_type?: WorkspaceType;
  number_of_workers?: number;
  daily_labour_rate_inr?: number;
  daily_capacity_units?: number;
  lead_time_days?: number;
  location?: SellerLocation;
  workspace_photos?: string[];
  is_onboarded?: boolean;
}

export interface SellerPublicProfile {
  id: string;
  artisan_name?: string;
  business_name?: string;
  bio?: string;
  craft_category: CraftCategory;
  craft_specialties: string[];
  experience_years: number;
  seller_type: SellerType;
  daily_capacity_units: number;
  lead_time_days: number;
  city?: string;
  state?: string;
  verification_status: string;
  trust_score: number;
}
