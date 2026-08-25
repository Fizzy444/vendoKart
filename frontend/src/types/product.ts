import { CraftCategory } from "./seller";

export type ProductStatus = "draft" | "published" | "archived";

export interface ProductDimensions {
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  weight_kg?: number;
}

export interface ProductPricingBreakdown {
  unit_labour_cost_inr: number;
  unit_direct_cost_inr: number;
  total_unit_cost_inr: number;
  minimum_floor_price_inr: number;
  recommended_price_inr: number;
  premium_market_price_inr: number;
  profit_per_unit_inr: number;
  target_margin_percent: number;
  formula_explanation: string;
}

export interface Product {
  id: string;
  seller_id: string;
  user_id: string;
  title: string;
  description: string;
  craft_category: CraftCategory;
  craft_specialty?: string;
  material_type: string;
  material_cost_inr: number;
  labour_daily_rate_inr: number;
  workers_count: number;
  daily_capacity_units: number;
  production_days: number;
  packaging_cost_inr: number;
  energy_cost_inr: number;
  other_direct_cost_inr: number;
  target_margin_percent: number;
  pricing: ProductPricingBreakdown;
  listed_price_inr: number;
  stock_quantity: number;
  lead_time_days: number;
  is_customizable: boolean;
  images: string[];
  dimensions?: ProductDimensions;
  tags: string[];
  status: ProductStatus;
  views_count: number;
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreatePayload {
  title: string;
  description: string;
  craft_category: CraftCategory;
  craft_specialty?: string;
  material_type?: string;
  material_cost_inr: number;
  labour_daily_rate_inr?: number;
  workers_count?: number;
  daily_capacity_units?: number;
  production_days?: number;
  packaging_cost_inr?: number;
  energy_cost_inr?: number;
  other_direct_cost_inr?: number;
  target_margin_percent?: number;
  custom_listed_price_inr?: number;
  stock_quantity?: number;
  lead_time_days?: number;
  is_customizable?: boolean;
  images?: string[];
  dimensions?: ProductDimensions;
  tags?: string[];
  status?: ProductStatus;
}

export interface PricingPreviewRequest {
  material_cost_inr: number;
  labour_daily_rate_inr: number;
  workers_count: number;
  daily_capacity_units: number;
  production_days?: number;
  packaging_cost_inr?: number;
  energy_cost_inr?: number;
  other_direct_cost_inr?: number;
  target_margin_percent: number;
}

export interface PricingPreviewResponse {
  pricing: ProductPricingBreakdown;
}
