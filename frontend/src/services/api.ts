import { AuthResponse, HealthResponse, OTPResponse, TokenPair, User } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiService {
  private getTokens(): TokenPair | null {
    if (typeof window === "undefined") return null;
    const tokens = localStorage.getItem("artisan_tokens");
    if (!tokens) return null;
    try {
      return JSON.parse(tokens);
    } catch {
      return null;
    }
  }

  public setTokens(tokens: TokenPair | null) {
    if (typeof window === "undefined") return;
    if (tokens) {
      localStorage.setItem("artisan_tokens", JSON.stringify(tokens));
    } else {
      localStorage.removeItem("artisan_tokens");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = false
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (requiresAuth) {
      const tokens = this.getTokens();
      if (tokens?.access_token) {
        headers["Authorization"] = `Bearer ${tokens.access_token}`;
      }
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token refresh if unauthorized
    if (response.status === 401 && requiresAuth) {
      const tokens = this.getTokens();
      if (tokens?.refresh_token) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
          });

          if (refreshRes.ok) {
            const newTokens: TokenPair = await refreshRes.json();
            this.setTokens(newTokens);
            headers["Authorization"] = `Bearer ${newTokens.access_token}`;
            response = await fetch(url, { ...options, headers });
          } else {
            this.setTokens(null);
          }
        } catch {
          this.setTokens(null);
        }
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  // Auth: Send OTP via SMS
  async sendOtp(phone: string): Promise<OTPResponse> {
    return this.request<OTPResponse>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  // Auth: Verify OTP & Sign In / Sign Up
  async verifyOtp(
    phone: string,
    otp: string,
    role: "seller" | "buyer" = "buyer",
    name?: string
  ): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp, role, name }),
    });
    if (res.tokens) {
      this.setTokens(res.tokens);
    }
    return res;
  }

  // Auth: Firebase Verified Token Login
  async firebaseLogin(
    idToken: string,
    role: "seller" | "buyer" = "buyer",
    name?: string,
    phone?: string
  ): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken, role, name, phone }),
    });
    if (res.tokens) {
      this.setTokens(res.tokens);
    }
    return res;
  }

  // Auth: Get Current Profile
  async getMe(): Promise<User> {
    return this.request<User>("/auth/me", {}, true);
  }

  // Auth: Update Profile
  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>(
      "/auth/me",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    );
  }

  // Test Role Protected Routes
  async testSellerRoute(): Promise<{ message: string; data: any }> {
    return this.request<{ message: string; data: any }>("/auth/seller-only", {}, true);
  }

  async testBuyerRoute(): Promise<{ message: string; data: any }> {
    return this.request<{ message: string; data: any }>("/auth/buyer-only", {}, true);
  }

  logout() {
    this.setTokens(null);
  }
}

export const api = new ApiService();
