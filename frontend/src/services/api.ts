import { AuthResponse, HealthResponse, OTPResponse, TokenPair, User } from "@/types/auth";

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
};

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
    const apiBase = getApiBase();
    const url = `${apiBase}${endpoint}`;
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
          const refreshRes = await fetch(`${apiBase}/auth/refresh`, {
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

  // Auth: 1-Click Dev Test Login
  async devLogin(
    role: "seller" | "buyer" = "seller",
    name?: string,
    phone?: string
  ): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ role, name, phone }),
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

  // Seller: Get Current Seller Profile & Workspace Info
  async getSellerProfile(): Promise<import("@/types/seller").SellerProfile> {
    return this.request<import("@/types/seller").SellerProfile>("/sellers/me", {}, true);
  }

  // Seller: Update Seller Profile
  async updateSellerProfile(
    data: import("@/types/seller").SellerProfileUpdatePayload
  ): Promise<import("@/types/seller").SellerProfile> {
    return this.request<import("@/types/seller").SellerProfile>(
      "/sellers/me",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    );
  }

  // Seller: Update Location
  async updateSellerLocation(
    location: import("@/types/seller").SellerLocation
  ): Promise<import("@/types/seller").SellerProfile> {
    return this.request<import("@/types/seller").SellerProfile>(
      "/sellers/me/location",
      {
        method: "POST",
        body: JSON.stringify(location),
      },
      true
    );
  }

  // Seller: Get Public Profile
  async getPublicSeller(sellerId: string): Promise<import("@/types/seller").SellerPublicProfile> {
    return this.request<import("@/types/seller").SellerPublicProfile>(`/sellers/${sellerId}`);
  }

  // Products: Calculate Real-time Pricing Preview (§11)
  async previewProductPricing(
    data: import("@/types/product").PricingPreviewRequest
  ): Promise<import("@/types/product").PricingPreviewResponse> {
    return this.request<import("@/types/product").PricingPreviewResponse>(
      "/products/pricing-preview",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Products: Create New Product Listing
  async createProduct(
    data: import("@/types/product").ProductCreatePayload
  ): Promise<import("@/types/product").Product> {
    return this.request<import("@/types/product").Product>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    );
  }

  // Products: Get My Listed Products
  async getMyProducts(): Promise<import("@/types/product").Product[]> {
    return this.request<import("@/types/product").Product[]>("/products/me", {}, true);
  }

  // Products: Get Single Product
  async getProduct(productId: string): Promise<import("@/types/product").Product> {
    return this.request<import("@/types/product").Product>(`/products/${productId}`);
  }

  // Products: Update Product Listing
  async updateProduct(
    productId: string,
    data: Partial<import("@/types/product").ProductCreatePayload>
  ): Promise<import("@/types/product").Product> {
    return this.request<import("@/types/product").Product>(
      `/products/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    );
  }

  // Products: Delete Product
  async deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/products/${productId}`,
      {
        method: "DELETE",
      },
      true
    );
  }

  // Products: Public Marketplace List
  async listMarketplaceProducts(
    category?: string,
    limit: number = 50
  ): Promise<import("@/types/product").Product[]> {
    const query = category ? `?category=${encodeURIComponent(category)}&limit=${limit}` : `?limit=${limit}`;
    return this.request<import("@/types/product").Product[]>(`/products/marketplace${query}`);
  }

  // Verification & Trust (§12 Live Camera Capture & Presence Verification)
  async submitLiveEvidence(
    data: import("@/types/verification").LiveEvidenceSubmissionPayload
  ): Promise<import("@/types/verification").VerificationResponse> {
    return this.request<import("@/types/verification").VerificationResponse>(
      "/verification/submit-live-evidence",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    );
  }

  async getVerificationStatus(): Promise<import("@/types/verification").TrustSignalBreakdown> {
    return this.request<import("@/types/verification").TrustSignalBreakdown>(
      "/verification/status",
      {},
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

  // Buyer Search & Product Methods
  async searchProducts(request: any): Promise<any> {
    return this.request("/search", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getProductById(productId: string): Promise<any> {
    return this.request(`/search/products/${productId}`);
  }

  async toggleFavorite(productId: string): Promise<any> {
    return this.request(`/search/products/${productId}/favorite`, {
      method: "POST",
    });
  }

  logout() {
    this.setTokens(null);
  }
}

export const api = new ApiService();
