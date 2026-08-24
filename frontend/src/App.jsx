import React from 'react';
import { useSearch } from './hooks/useSearch';
import { useChat } from './hooks/useChat';
import SearchBox from './components/search/SearchBox';
import SearchResults from './components/search/SearchResults';
import ChatBox from './components/chat/ChatBox';

export default function App() {
  const {
    query,
    setQuery,
    submittedQuery,
    suggestions,
    isSuggestionsLoading,
    showDropdown,
    setShowDropdown,
    activeSuggestionIndex,
    uiState,
    searchResult,
    errorMessage,
    executeSearch,
    selectSuggestion,
    clearSearch,
    handleKeyDown,
  } = useSearch();

  const {
    isOpen: isChatOpen,
    isMinimized: isChatMinimized,
    currentProduct: chatProduct,
    messages: chatMessages,
    isSellerTyping,
    unreadCount: chatUnreadCount,
    openChatWithProduct,
    closeChat,
    toggleMinimize: toggleChatMinimize,
    sendMessage: sendChatMessage,
    sendQuickAction: sendChatQuickAction,
    handleAcceptQuote,
    handleNegotiateQuote,
  } = useChat();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white text-xl shadow-md">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-gray-900">
                  vendo<span className="text-brand-600">Kart</span>
                </span>
                <span className="badge badge-orange text-[10px] uppercase font-bold tracking-wider">
                  Artisan Marketplace
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Buyer Search, RAG AI & Inbuilt Seller Chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200/60">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>RAG Engine: Active</span>
            </div>
            <a
              href="#docs"
              onClick={(e) => {
                e.preventDefault();
                alert('vendoKart Buyer Search, RAG & Inbuilt Chat\nFeatures:\n- Semantic / NL Search\n- Instant Autocomplete\n- Buyer-to-Seller Direct Chat & Quotes');
              }}
              className="text-xs font-semibold text-gray-600 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              API Docs
            </a>
          </div>
        </div>
      </header>

      {/* Hero & Search Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Discover Traditional Indian Handicrafts
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Find unique handcrafted items directly from certified micro-entrepreneurs and weavers.
            Search by item, specify constraints, or chat directly with artisans for custom orders.
          </p>
        </div>

        {/* Search Box Component */}
        <SearchBox
          query={query}
          onQueryChange={setQuery}
          onSearch={executeSearch}
          onClear={clearSearch}
          suggestions={suggestions}
          isSuggestionsLoading={isSuggestionsLoading}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          activeSuggestionIndex={activeSuggestionIndex}
          onSelectSuggestion={selectSuggestion}
          onKeyDown={handleKeyDown}
        />

        {/* Results Container */}
        <div className="mt-8">
          <SearchResults
            uiState={uiState}
            searchResult={searchResult}
            errorMessage={errorMessage}
            submittedQuery={submittedQuery}
            onRetry={() => executeSearch(submittedQuery)}
            onQuerySelect={(q) => {
              setQuery(q);
              executeSearch(q);
            }}
            onChatWithSeller={openChatWithProduct}
          />
        </div>
      </main>

      {/* Inbuilt Buyer-to-Seller Chat Box */}
      <ChatBox
        isOpen={isChatOpen}
        isMinimized={isChatMinimized}
        product={chatProduct}
        messages={chatMessages}
        isTyping={isSellerTyping}
        unreadCount={chatUnreadCount}
        onClose={closeChat}
        onToggleMinimize={toggleChatMinimize}
        onSendMessage={sendChatMessage}
        onQuickAction={sendChatQuickAction}
        onAcceptQuote={handleAcceptQuote}
        onNegotiateQuote={handleNegotiateQuote}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">vendoKart</span>
            <span>•</span>
            <span>Empowering micro-entrepreneurs & artisans</span>
          </div>
          <div>
            <span>Grounded RAG Search UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
