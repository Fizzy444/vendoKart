import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAutocompleteSuggestions, searchProductsRAG } from '../services/searchService';
import { SearchUIState } from '../types/search';

/**
 * Custom hook to manage the full lifecycle of buyer search and autocomplete.
 */
export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const [uiState, setUiState] = useState(SearchUIState.IDLE);
  const [searchResult, setSearchResult] = useState({
    answer: '',
    products: [],
    extractedRequirements: null,
  });
  const [errorMessage, setErrorMessage] = useState(null);

  // References to abort in-flight requests
  const autocompleteAbortControllerRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced Autocomplete Effect
  useEffect(() => {
    const trimmed = query.trim();

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty or search is active, close suggestions
    if (!trimmed) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      setShowDropdown(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    // Cancel prior autocomplete fetch
    if (autocompleteAbortControllerRef.current) {
      autocompleteAbortControllerRef.current.abort();
    }

    // Set debounce timer (250ms)
    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      autocompleteAbortControllerRef.current = controller;
      setIsSuggestionsLoading(true);

      try {
        const results = await fetchAutocompleteSuggestions(trimmed, controller.signal);
        setSuggestions(results);
        setShowDropdown(true);
        setActiveSuggestionIndex(-1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching autocomplete:', err);
          setSuggestions([]);
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Execute full RAG Search
  const executeSearch = useCallback(async (searchQuery) => {
    const targetQuery = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!targetQuery) return;

    // Close suggestions dropdown
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
    setQuery(targetQuery);
    setSubmittedQuery(targetQuery);

    // Cancel in-flight requests
    if (autocompleteAbortControllerRef.current) {
      autocompleteAbortControllerRef.current.abort();
    }
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setUiState(SearchUIState.SEARCHING);
    setErrorMessage(null);

    try {
      const data = await searchProductsRAG(targetQuery, controller.signal);
      
      const hasProducts = data && Array.isArray(data.products) && data.products.length > 0;
      
      setSearchResult({
        answer: data.answer || '',
        products: data.products || [],
        extractedRequirements: data.extractedRequirements || null,
      });

      if (hasProducts) {
        setUiState(SearchUIState.SUCCESS);
      } else {
        setUiState(SearchUIState.NO_RESULTS);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search request failed:', err);
        setErrorMessage(err.message || 'Unable to complete search. Please try again.');
        setUiState(SearchUIState.ERROR);
      }
    }
  }, [query]);

  // Select a suggestion directly
  const selectSuggestion = useCallback((product) => {
    if (!product) return;
    const productName = product.name;
    setQuery(productName);
    executeSearch(productName);
  }, [executeSearch]);

  // Reset / Clear Search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
    setUiState(SearchUIState.IDLE);
    setSearchResult({
      answer: '',
      products: [],
      extractedRequirements: null,
    });
    setErrorMessage(null);
  }, []);

  // Keyboard navigation handler for the search box & suggestions
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        selectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        executeSearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveSuggestionIndex(-1);
    }
  }, [showDropdown, suggestions, activeSuggestionIndex, executeSearch, selectSuggestion]);

  return {
    query,
    setQuery,
    submittedQuery,
    suggestions,
    isSuggestionsLoading,
    showDropdown,
    setShowDropdown,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    uiState,
    searchResult,
    errorMessage,
    executeSearch,
    selectSuggestion,
    clearSearch,
    handleKeyDown,
  };
}
