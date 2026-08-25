"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  Globe,
  Sliders,
  MapPin,
  Moon,
  Shield,
  Eye,
  Trash2,
  Accessibility,
  HelpCircle,
  FileText,
  Info,
  X,
  Check,
  Save,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  // Preferences State
  const [language, setLanguage] = useState<string>("English");
  const [searchAiDefault, setSearchAiDefault] = useState<boolean>(true);
  const [resultsPerPage, setResultsPerPage] = useState<number>(10);
  const [locationRadius, setLocationRadius] = useState<string>("All India");
  const [theme, setTheme] = useState<string>("System");

  // Privacy State
  const [personalization, setPersonalization] = useState<boolean>(true);
  const [locationRecs, setLocationRecs] = useState<boolean>(true);

  // Accessibility State
  const [fontSize, setFontSize] = useState<string>("Normal");
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Modal Control State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EBE6DC] space-y-6 max-w-4xl mx-auto relative">
      <div>
        <h2 className="text-2xl font-black text-[#1E2316]">Settings</h2>
        <p className="text-xs text-[#6B7260] mt-1">
          Manage your account preferences, privacy, appearance, and accessibility. Click any item to customize.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 bg-[#FAF6EE] border border-[#EAE3D2] text-[#44521E] rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#B84018]" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage("")} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Preferences Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7260]">
          Preferences
        </h3>
        <div className="bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] divide-y divide-[#EBE6DC] text-xs">
          {/* Language Item */}
          <div
            onClick={() => setActiveModal("language")}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <Globe className="w-4 h-4 text-[#44521E]" />
              <span>Language</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[#6B7260]">
              <span>{language}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Search Preferences Item */}
          <div
            onClick={() => setActiveModal("search_pref")}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <Sliders className="w-4 h-4 text-[#44521E]" />
              <span>Search Preferences</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[#6B7260]">
              <span>AI Mode {searchAiDefault ? "ON" : "OFF"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Location Preferences Item */}
          <div
            onClick={() => setActiveModal("location_pref")}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <MapPin className="w-4 h-4 text-[#B84018]" />
              <span>Location Preferences</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[#6B7260]">
              <span>{locationRadius}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7260]">
          Appearance
        </h3>
        <div className="bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] p-3.5 text-xs flex items-center justify-between hover:bg-[#F2ECE1] transition cursor-pointer"
          onClick={() => setActiveModal("theme")}
        >
          <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
            <Moon className="w-4 h-4 text-[#44521E]" />
            <span>Theme</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-[#6B7260]">
            <span>{theme}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7260]">
          Privacy
        </h3>
        <div className="bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] divide-y divide-[#EBE6DC] text-xs">
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <Eye className="w-4 h-4 text-[#44521E]" />
              <span>Personalization</span>
            </div>
            <button
              onClick={() => {
                const val = !personalization;
                setPersonalization(val);
                showToast(`Personalization turned ${val ? "ON" : "OFF"}`);
              }}
              className={`px-3 py-1 rounded-full font-extrabold text-[11px] transition ${
                personalization ? "bg-[#44521E] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {personalization ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <Shield className="w-4 h-4 text-[#44521E]" />
              <span>Location-based recommendations</span>
            </div>
            <button
              onClick={() => {
                const val = !locationRecs;
                setLocationRecs(val);
                showToast(`Location recommendations turned ${val ? "ON" : "OFF"}`);
              }}
              className={`px-3 py-1 rounded-full font-extrabold text-[11px] transition ${
                locationRecs ? "bg-[#44521E] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {locationRecs ? "ON" : "OFF"}
            </button>
          </div>

          <div
            onClick={() => {
              showToast("Search history cleared successfully!");
            }}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <Trash2 className="w-4 h-4 text-[#B84018]" />
              <span>Clear search history</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7260]" />
          </div>
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7260]">
          Accessibility
        </h3>
        <div
          onClick={() => setActiveModal("accessibility")}
          className="bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] p-3.5 text-xs flex items-center justify-between hover:bg-[#F2ECE1] transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
            <Accessibility className="w-4 h-4 text-[#44521E]" />
            <span>Accessibility</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-[#6B7260]">
            <span>Font: {fontSize}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7260]">
          About
        </h3>
        <div className="bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] divide-y divide-[#EBE6DC] text-xs">
          <div
            onClick={() => setActiveModal("help")}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <HelpCircle className="w-4 h-4 text-[#44521E]" />
              <span>Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7260]" />
          </div>

          <div
            onClick={() => setActiveModal("privacy_policy")}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <FileText className="w-4 h-4 text-[#44521E]" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7260]" />
          </div>

          <div
            onClick={() => setActiveModal("terms")}
            className="flex items-center justify-between p-3.5 hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-medium text-[#1E2316]">
              <FileText className="w-4 h-4 text-[#44521E]" />
              <span>Terms & Conditions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7260]" />
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2.5 font-medium text-[#6B7260]">
              <Info className="w-4 h-4 text-[#44521E]" />
              <span>Version</span>
            </div>
            <span className="font-mono font-bold text-[#1E2316]">1.0.0</span>
          </div>
        </div>
      </div>

      {/* --- INTERACTIVE MODALS FOR EDITING SETTINGS --- */}

      {/* 1. Language Modal */}
      {activeModal === "language" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#EBE6DC]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-3">
              <h4 className="font-extrabold text-base text-[#1E2316]">Select Language</h4>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs font-semibold">
              {["English", "Hindi (हिंदी)", "Tamil (தமிழ்)", "Telugu (తెలుగు)", "Bengali (বাংলা)", "Gujarati (ગુજરાતી)", "Marathi (मराठी)"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    const cleanName = lang.split(" ")[0];
                    setLanguage(cleanName);
                    setActiveModal(null);
                    showToast(`Language changed to ${cleanName}`);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl flex items-center justify-between transition ${
                    language === lang.split(" ")[0]
                      ? "bg-[#44521E] text-white"
                      : "bg-[#F8F5EE] text-[#1E2316] hover:bg-[#F2ECE1]"
                  }`}
                >
                  <span>{lang}</span>
                  {language === lang.split(" ")[0] && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Search Preferences Modal */}
      {activeModal === "search_pref" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#EBE6DC]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-3">
              <h4 className="font-extrabold text-base text-[#1E2316]">Search Preferences</h4>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F8F5EE] rounded-2xl">
                <div>
                  <span className="font-bold text-[#1E2316] block">Default AI Mode</span>
                  <span className="text-[#6B7260]">Enable natural language parsing by default</span>
                </div>
                <button
                  onClick={() => setSearchAiDefault(!searchAiDefault)}
                  className={`px-3 py-1 rounded-full font-extrabold transition ${
                    searchAiDefault ? "bg-[#44521E] text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {searchAiDefault ? "ON" : "OFF"}
                </button>
              </div>

              <div>
                <label className="font-bold text-[#1E2316] block mb-1">Results Per Page</label>
                <div className="flex gap-2">
                  {[10, 20, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => setResultsPerPage(num)}
                      className={`flex-1 py-2 rounded-xl font-bold transition ${
                        resultsPerPage === num
                          ? "bg-[#44521E] text-white"
                          : "bg-[#F8F5EE] text-[#1E2316] hover:bg-[#F2ECE1]"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setActiveModal(null);
                  showToast("Search preferences saved!");
                }}
                className="px-5 py-2.5 bg-[#44521E] text-white font-bold text-xs rounded-2xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Location Preferences Modal */}
      {activeModal === "location_pref" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#EBE6DC]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-3">
              <h4 className="font-extrabold text-base text-[#1E2316]">Location Preferences</h4>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="font-bold text-[#1E2316] block">Max Search Proximity Radius</label>
              <div className="space-y-1.5">
                {["25 km", "50 km", "100 km", "All India"].map((rad) => (
                  <button
                    key={rad}
                    onClick={() => setLocationRadius(rad)}
                    className={`w-full text-left px-4 py-2.5 rounded-2xl flex items-center justify-between transition font-semibold ${
                      locationRadius === rad
                        ? "bg-[#44521E] text-white"
                        : "bg-[#F8F5EE] text-[#1E2316] hover:bg-[#F2ECE1]"
                    }`}
                  >
                    <span>{rad}</span>
                    {locationRadius === rad && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setActiveModal(null);
                  showToast(`Location radius set to ${locationRadius}`);
                }}
                className="px-5 py-2.5 bg-[#44521E] text-white font-bold text-xs rounded-2xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Location Prefs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Theme Modal */}
      {activeModal === "theme" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#EBE6DC]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-3">
              <h4 className="font-extrabold text-base text-[#1E2316]">Appearance Theme</h4>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs font-semibold">
              {["System", "Light", "Dark"].map((th) => (
                <button
                  key={th}
                  onClick={() => {
                    setTheme(th);
                    setActiveModal(null);
                    showToast(`Theme changed to ${th}`);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl flex items-center justify-between transition ${
                    theme === th
                      ? "bg-[#44521E] text-white"
                      : "bg-[#F8F5EE] text-[#1E2316] hover:bg-[#F2ECE1]"
                  }`}
                >
                  <span>{th}</span>
                  {theme === th && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Accessibility Modal */}
      {activeModal === "accessibility" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#EBE6DC]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-3">
              <h4 className="font-extrabold text-base text-[#1E2316]">Accessibility Options</h4>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1E2316] block mb-1">Text Font Size</label>
                <div className="flex gap-2">
                  {["Normal", "Large", "Extra Large"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`flex-1 py-2 rounded-xl font-bold transition ${
                        fontSize === size
                          ? "bg-[#44521E] text-white"
                          : "bg-[#F8F5EE] text-[#1E2316] hover:bg-[#F2ECE1]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8F5EE] rounded-2xl">
                <div>
                  <span className="font-bold text-[#1E2316] block">High Contrast Mode</span>
                  <span className="text-[#6B7260]">Increase border and text contrast for visibility</span>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-3 py-1 rounded-full font-extrabold transition ${
                    highContrast ? "bg-[#44521E] text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {highContrast ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setActiveModal(null);
                  showToast("Accessibility settings saved!");
                }}
                className="px-5 py-2.5 bg-[#44521E] text-white font-bold text-xs rounded-2xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Accessibility
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Info Modals: Help, Privacy, Terms */}
      {(activeModal === "help" || activeModal === "privacy_policy" || activeModal === "terms") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#EBE6DC]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-3">
              <h4 className="font-extrabold text-base text-[#1E2316]">
                {activeModal === "help" && "Help & Support"}
                {activeModal === "privacy_policy" && "Privacy Policy"}
                {activeModal === "terms" && "Terms & Conditions"}
              </h4>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-[#3E4534] leading-relaxed space-y-2 max-h-60 overflow-y-auto p-1">
              {activeModal === "help" && (
                <>
                  <p className="font-bold text-[#1E2316]">Need assistance with your artisan orders?</p>
                  <p>Our dedicated support team is available 24/7 to assist buyers and craft clusters with order tracking, bulk procurement, and payment queries.</p>
                  <p className="font-semibold text-[#44521E]">Email: support@vendokart.com | Phone: 1800-123-VENDO</p>
                </>
              )}
              {activeModal === "privacy_policy" && (
                <>
                  <p className="font-bold text-[#1E2316]">vendoKart Privacy Policy</p>
                  <p>We respect your privacy and protect your location and contact details. Location data is strictly used for 'Nearby Me' artisan matching and is never shared with third-party advertisers.</p>
                </>
              )}
              {activeModal === "terms" && (
                <>
                  <p className="font-bold text-[#1E2316]">vendoKart Platform Terms</p>
                  <p>All artisan products listed on vendoKart are verified handmade crafts produced by authentic Indian artisan clusters. Prices reflect fair craft wages and transparent material costs.</p>
                </>
              )}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 py-2 bg-[#EFEBE0] text-[#44521E] font-bold text-xs rounded-2xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
