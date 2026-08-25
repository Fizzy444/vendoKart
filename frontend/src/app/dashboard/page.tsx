"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ProductItem, SearchRequest, SearchResponse } from "@/types/search";
import { User } from "@/types/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { HeaderGreeting } from "@/components/dashboard/HeaderGreeting";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { ProductDetailsModal } from "@/components/dashboard/ProductDetailsModal";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { ProfileView } from "@/components/dashboard/ProfileView";
import { Menu, Sparkles, Heart, PackageX, ChevronDown, ShoppingBag, MessageSquare, Bell } from "lucide-react";

export default function BuyerDashboardPage() {
  const { user: authUser, refreshUser } = useAuth();

  // Navigation & Mobile Drawer State
  const [activeTab, setActiveTab] = useState<string>("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // User Profile & Location State
  const [currentUser, setCurrentUser] = useState<User | null>(authUser || null);
  const [savedLocation, setSavedLocation] = useState<string>("");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Search & AI Mode State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [aiMode, setAiMode] = useState<boolean>(true);

  // Filter State
  const [priceRange, setPriceRange] = useState<string>("");
  const [quantityRange, setQuantityRange] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [locationMode, setLocationMode] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("relevance");

  // Master Products State (Holds ALL candidate products to ensure Favorites is independent of Home filters)
  const [masterProducts, setMasterProducts] = useState<ProductItem[]>([]);
  // Search Response & Filtered Results State (for Home Tab)
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Sync authUser to currentUser
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      const loc = authUser.location?.city
        ? `${authUser.location.city}, ${authUser.location.state || ""}`
        : authUser.location?.address || "";
      if (loc) {
        setSavedLocation(loc);
        localStorage.setItem("vendokart_saved_location", loc);
      }
    } else {
      // Check client storage for guest session location & name
      const loc = localStorage.getItem("vendokart_saved_location") || "";
      const savedName = localStorage.getItem("vendokart_saved_name");
      setSavedLocation(loc);
      if (savedName) {
        setCurrentUser({
          id: "guest-user",
          phone: "",
          name: savedName,
          roles: ["buyer"],
          status: "active",
          is_phone_verified: true,
          location: { city: loc.split(",")[0] || "", address: loc },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }, [authUser]);

  // Initial fetch of master products for independent Favorites tracking
  useEffect(() => {
    const fetchMasterProducts = async () => {
      try {
        const res = await api.searchProducts({ ai_mode: true });
        setMasterProducts(res.products);
      } catch (e) {
        console.error("Master products fetch error:", e);
      }
    };
    fetchMasterProducts();
  }, []);

  // Master Search Execution Method for Home tab
  const executeSearch = useCallback(
    async (queryOverride?: string) => {
      setIsLoading(true);
      const q = queryOverride !== undefined ? queryOverride : searchQuery;

      const request: SearchRequest = {
        query: q.trim() || undefined,
        ai_mode: aiMode,
        price_range: priceRange || undefined,
        quantity_range: quantityRange || undefined,
        category: category || undefined,
        location_mode: locationMode,
        user_location: savedLocation,
        sort_by: sortBy,
      };

      try {
        const response: SearchResponse = await api.searchProducts(request);
        setSearchMeta(response);
        setProducts(response.products);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, aiMode, priceRange, quantityRange, category, locationMode, savedLocation, sortBy]
  );

  // Trigger search on mount and when filter/sort dependencies change
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Handle Favorite Toggle (Updates BOTH filtered home products AND master products)
  const handleFavoriteToggle = async (productId: string) => {
    try {
      const updated = await api.toggleFavorite(productId);
      
      // Update Home tab filtered products
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_favorite: updated.is_favorite } : p))
      );
      
      // Update Master products so Favorites tab is 100% independent of filters
      setMasterProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_favorite: updated.is_favorite } : p))
      );
    } catch (err) {
      // Optimistic update fallback
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_favorite: !p.is_favorite } : p))
      );
      setMasterProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_favorite: !p.is_favorite } : p))
      );
    }
  };

  // Clear All Active Filters
  const handleClearFilters = () => {
    setPriceRange("");
    setQuantityRange("");
    setCategory("");
    setLocationMode("all");
    setSearchQuery("");
  };

  const hasActiveFilters = Boolean(
    priceRange || quantityRange || category || locationMode !== "all" || searchQuery
  );

  // Favorites list comes from masterProducts so Home filters NEVER affect Favorites
  const favoriteProducts = masterProducts.filter((p) => p.is_favorite);

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#1E2316] flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Navbar Bar */}
      <div className="lg:hidden bg-white border-b border-[#EBE6DC] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-[#4A5240] hover:bg-[#F5F1E6] rounded-xl transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-[#1E2316]">
            vendo<span className="text-[#B84018]">Kart</span>
          </span>
        </div>
        <button
          onClick={() => setActiveTab("profile")}
          className="px-3 py-1.5 rounded-full bg-[#F7F3EA] border border-[#E8E1D3] text-xs font-semibold text-[#44521E]"
        >
          {currentUser?.name || "Set Profile"}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 w-64 max-w-full">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Greeting Section */}
        <HeaderGreeting
          userName={currentUser?.name}
          userLocation={savedLocation}
          onOpenProfile={() => setActiveTab("profile")}
        />

        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <>
            {/* Unified Search Section Bar */}
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              aiMode={aiMode}
              setAiMode={setAiMode}
              onSearch={(q) => executeSearch(q)}
              isSearching={isLoading}
            />

            {/* Extracted Requirements Badge Panel */}
            {aiMode && searchMeta?.extracted_requirements && (
              <div className="bg-[#FAF6EE] border border-[#EAE3D2] rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
                <span className="font-bold text-[#44521E] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B84018]" />
                  AI Extracted Requirement Specs:
                </span>

                {searchMeta.extracted_requirements.product && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0D8C5] text-[#1E2316] font-semibold">
                    Product: {searchMeta.extracted_requirements.product}
                  </span>
                )}
                {searchMeta.extracted_requirements.quantity && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0D8C5] text-[#44521E] font-semibold">
                    Qty: {searchMeta.extracted_requirements.quantity} pcs
                  </span>
                )}
                {searchMeta.extracted_requirements.max_budget && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0D8C5] text-[#B84018] font-semibold">
                    Max Budget: ₹{searchMeta.extracted_requirements.max_budget}
                  </span>
                )}
                {searchMeta.extracted_requirements.max_delivery_days && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0D8C5] text-[#1E2316] font-semibold">
                    Deadline: ≤ {searchMeta.extracted_requirements.max_delivery_days} days
                  </span>
                )}
                {searchMeta.extracted_requirements.category && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0D8C5] text-[#44521E] font-semibold">
                    Category: {searchMeta.extracted_requirements.category}
                  </span>
                )}
              </div>
            )}

            {/* Filter Bar Controls */}
            <FilterBar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              quantityRange={quantityRange}
              setQuantityRange={setQuantityRange}
              category={category}
              setCategory={setCategory}
              locationMode={locationMode}
              setLocationMode={setLocationMode}
              onApplyFilters={() => executeSearch()}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              userLocation={savedLocation}
            />

            {/* Results Header Bar & Sort Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B84018]" />
                <h2 className="text-lg font-black text-[#1E2316] tracking-tight">
                  Top Matches for You
                </h2>
                <span className="text-xs text-[#6B7260] font-medium bg-[#EFEBE0] px-2.5 py-0.5 rounded-full">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B7260] font-medium">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      executeSearch();
                    }}
                    className="appearance-none bg-white border border-[#E0DACB] text-[#1E2316] font-bold rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-[#44521E] cursor-pointer shadow-xs"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="nearest">Nearest First</option>
                    <option value="delivery_time">Delivery Time</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7260] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl h-96 border border-[#EBE6DC] animate-pulse p-4 space-y-4"
                  >
                    <div className="bg-gray-200 h-48 rounded-2xl w-full" />
                    <div className="bg-gray-200 h-6 rounded-lg w-3/4" />
                    <div className="bg-gray-200 h-4 rounded-lg w-1/2" />
                    <div className="bg-gray-200 h-10 rounded-2xl w-full pt-4" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onFavoriteToggle={handleFavoriteToggle}
                    onViewDetails={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE6DC] space-y-4 my-6">
                <div className="w-16 h-16 rounded-full bg-[#F7F3EA] text-[#B84018] mx-auto flex items-center justify-center border border-[#E8E1D3]">
                  <PackageX className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#1E2316]">
                  No matching artisan products found
                </h3>
                <p className="text-xs text-[#6B7260] max-w-md mx-auto leading-relaxed">
                  We couldn't find any products matching your specific query and filter combination.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 bg-[#44521E] hover:bg-[#364217] text-white font-bold text-xs rounded-2xl shadow-sm transition"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: FAVORITES (Independent of Home search filters) */}
        {activeTab === "favorites" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-4">
              <div>
                <h2 className="text-2xl font-black text-[#1E2316] flex items-center gap-2">
                  <Heart className="w-6 h-6 text-[#B84018] fill-current" /> My Favorites
                </h2>
                <p className="text-xs text-[#6B7260] mt-1">
                  Artisan products you have saved for bulk purchasing or future reference.
                </p>
              </div>
              <span className="text-xs font-bold text-[#44521E] bg-[#EFEBE0] px-3 py-1 rounded-full">
                {favoriteProducts.length} saved
              </span>
            </div>

            {favoriteProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {favoriteProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onFavoriteToggle={handleFavoriteToggle}
                    onViewDetails={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE6DC] space-y-4 my-6">
                <div className="w-16 h-16 rounded-full bg-[#F7F3EA] text-[#B84018] mx-auto flex items-center justify-center border border-[#E8E1D3]">
                  <Heart className="w-8 h-8 text-[#B84018]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E2316]">
                  No favorite items added yet
                </h3>
                <p className="text-xs text-[#6B7260] max-w-md mx-auto leading-relaxed">
                  Click the heart icon on any artisan product card to save it to your favorites list!
                </p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-5 py-2.5 bg-[#44521E] hover:bg-[#364217] text-white font-bold text-xs rounded-2xl transition"
                >
                  Explore Products
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === "profile" && (
          <ProfileView
            currentUser={currentUser}
            onSaved={(updatedUser) => {
              setCurrentUser(updatedUser);
              if (updatedUser.location?.address) {
                setSavedLocation(updatedUser.location.address);
              }
              refreshUser();
            }}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && <SettingsView />}

        {/* TAB 5: ORDERS */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE6DC] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F7F3EA] text-[#44521E] mx-auto flex items-center justify-center">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#1E2316]">My Orders</h3>
            <p className="text-xs text-[#6B7260]">
              You have no active bulk orders. Explore artisan crafts on Home to place your first bulk requirement.
            </p>
          </div>
        )}

        {/* TAB 6: MESSAGES */}
        {activeTab === "messages" && (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE6DC] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F7F3EA] text-[#44521E] mx-auto flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#1E2316]">Artisan Messages</h3>
            <p className="text-xs text-[#6B7260]">
              Direct communication channels with verified artisan masters will appear here.
            </p>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE6DC] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F7F3EA] text-[#B84018] mx-auto flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#1E2316]">Notifications</h3>
            <p className="text-xs text-[#6B7260]">
              Order updates, artisan quote responses, and craft cluster news will appear here.
            </p>
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentUser={currentUser}
        onSaved={(updatedUser) => {
          setCurrentUser(updatedUser);
          if (updatedUser.location?.address) {
            setSavedLocation(updatedUser.location.address);
          }
          refreshUser();
        }}
      />
    </div>
  );
}
