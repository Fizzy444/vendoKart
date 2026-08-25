export interface RequirementExtraction {
  product?: string;
  quantity?: number;
  max_budget?: number;
  max_delivery_days?: number;
  category?: string;
  location?: string;
  craft_material?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  artisan_name: string;
  is_verified_artisan: boolean;
  location: string;
  category: string;
  price: number;
  price_per_unit?: number;
  min_order_qty: number;
  delivery_days: number;
  image_url: string;
  description: string;
  craft_type: string;
  rating: number;
  stock: number;
  is_favorite: boolean;
}

export interface SearchRequest {
  query?: string;
  ai_mode?: boolean;
  price_range?: string;
  min_price?: number;
  max_price?: number;
  quantity_range?: string;
  min_qty?: number;
  max_qty?: number;
  category?: string;
  location_mode?: string; // "all", "nearby", "custom"
  user_location?: string;
  sort_by?: string;
}

export interface SearchResponse {
  query?: string;
  ai_mode: boolean;
  extracted_requirements?: RequirementExtraction;
  total_results: number;
  products: ProductItem[];
}
