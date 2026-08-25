export type UserRole = "seller" | "buyer" | "admin";
export type UserStatus = "active" | "suspended" | "pending_verification";

export interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  business_name?: string;
  roles: UserRole[];
  status: UserStatus;
  is_phone_verified: boolean;
  location?: Location;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface OTPResponse {
  message: string;
  phone: string;
  channel?: "sms" | "whatsapp";
  is_dev_mode: boolean;
  dev_otp?: string;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  environment: string;
  timestamp: string;
  database: {
    status: string;
    database_name: string;
    latency_ms?: number;
  };
  redis: {
    status: string;
    latency_ms?: number;
  };
  storage: {
    status: string;
    bucket: string;
    endpoint: string;
  };
}
