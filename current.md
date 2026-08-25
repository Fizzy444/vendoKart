# Current Project State

## Project Overview

vendoKart application stage for Module 4 (Buyer Search & Requirement AI) implementation. Fully functional, highly aesthetic Buyer/User Dashboard inspired by the reference design is complete and verified.

## Completed Components

- Stage 0 Infrastructure & Foundations
  - FastAPI framework initialization with MongoDB & Redis client handlers
  - Phone OTP Authentication (SMS & WhatsApp via Twilio + Dev Mock)
  - JWT Bearer token generation & dual rotation
  - Next.js frontend root layout, Tailwind setup, and Auth Modal

- Module 4: Buyer Search & Requirement AI Dashboard
  - User onboarding & persistent saved location for "Nearby Me" filtering
  - Unified search engine processing simple keywords ("pots") and natural language requirements ("70 pots needed under 3000 within 3 days")
  - NLU requirement extraction (`ai/orchestrator/search_extractor.py`) parsing product, quantity, max budget, delivery deadline, category, location
  - Semantic matching engine (`ai/matching/buyer_search.py`) with synonym expansion, hard filters, location proximity scoring, and sorting
  - Authentic artisan craft repository (`backend/app/repositories/product_repository.py`)
  - Search API endpoints (`POST /api/v1/search`, product details, and favorite toggling)
  - Frontend dashboard UI components matching reference image: Sidebar, HeaderGreeting, SearchBar with AI Mode toggle & suggested tags, FilterBar, ProductCard grid, ProductDetailsModal, OnboardingModal
  - Verified across all 9 search & filter matrix test cases
  - Next.js build compilation verified (10/10 static pages rendered cleanly)

## In Progress Components

- None.

## Recent Changes Log

2026-08-24 – Git pull updated Stage 0 authentication endpoints and repository handlers.
2026-08-24 – Created project governance files: plan.md, current.md, architecture.md, rules.md.
2026-08-24 – Implemented NLU Requirement Extraction, Semantic Search Engine, Product Repository, and FastAPI search endpoints.
2026-08-24 – Implemented frontend Buyer Dashboard components (Sidebar, SearchBar, FilterBar, ProductCard, ProductDetailsModal, OnboardingModal) and styled to match reference design.
2026-08-24 – Verified Next.js build and executed Python test matrix covering all 9 search/filter cases.
2026-08-24 – Optimized health check & DB connection handlers (`health.py`, `database.py`) with 1.0s asyncio timeouts to eliminate OS socket exhaustion (WinError 10055) and 500 errors.
2026-08-24 – Removed Categories, Discover Artisans, and My Requirements from Sidebar; implemented dedicated Favorites tab view, editable Profile view (`ProfileView.tsx`), and comprehensive Settings page (`SettingsView.tsx`).
2026-08-24 – Made all items in `SettingsView.tsx` interactive with click-to-edit modals (Language, Search Prefs, Location Prefs, Theme, Privacy Toggles, Accessibility, Policy Modals).
2026-08-24 – Decoupled Favorites tab state (`masterProducts`) from Home tab search filters so favorited items are preserved regardless of active filters.
2026-08-24 – Rectified backend global Python dependency environment (`pymongo`/`bson`, `motor`, `pydantic-settings`) to fix terminal `ModuleNotFoundError: No module named 'bson'` error when launching uvicorn.
2026-08-24 – Implemented Module 4 Buyer Requirement Extraction & Constraint Matching: order-independent NLU parameter extraction (`search_extractor.py`), time-based artisan production capacity calculator (`buyer_search.py`), optional constraint evaluation, budget disambiguation, and automated test suite (`test_buyer_requirement_search.py`).
2026-08-24 – Refactored Module 4 into a Hybrid Retrieval Architecture: added BGE-M3 Dense Embedding Engine (`bge_embedder.py`), BGE Reranker v2-M3 Cross-Encoder stage (`bge_reranker.py`), dense+lexical score fusion in `buyer_search.py`, enabling non-keyword semantic retrieval (e.g. "something to keep plants in" -> "Terracotta Pots / Planters").
2026-08-24 – Rectified backend environment dependency configuration, resolved terminal pip memory lock issues, and verified zero-error execution across all 8 pytest test cases and live FastAPI search endpoints.
2026-08-24 – Added `pyrightconfig.json` and `TYPE_CHECKING` import guarding across all AI modules (`bge_reranker.py`, `buyer_search.py`, `bge_embedder.py`, `search_extractor.py`) to eliminate all IDE language server problems. Verified 100% test pass rate (8/8 passed).
2026-08-24 – Refactored Module 4 BGE-M3 retrieval architecture: isolated product intent keyword (`"pots"`) from business constraints for dense vector embeddings, expanded candidate recall pool, implemented time-based production + shipping fulfillment math ($\lceil \text{needed}/\text{capacity} \rceil + \text{shipping\_days} \le \text{deadline}$), added candidate stage-by-stage debug logging, and verified CASE A (`"35 pots in 2 days"`) & CASE B (`"35 pots"`). 100% test pass rate across all 9 pytest test cases.
2026-08-24 – Updated schema import resolution (`backend.app.schemas.search` / `app.schemas.search`) across all AI orchestrator and matching modules (`buyer_search.py`, `bge_embedder.py`, `bge_reranker.py`, `search_extractor.py`) to eliminate IDE language server problems. Verified 100% test pass rate (8/8 passed).
2026-08-24 – Added dynamic project & backend `sys.path` resolution across all AI orchestrator and matching modules (`buyer_search.py`, `bge_embedder.py`, `bge_reranker.py`, `search_extractor.py`) to eliminate IDE language server import errors. Verified 100% test pass rate (8/8 passed).
2026-08-24 – Cleaned up invalid leftover distribution folders (`~orch`, `~oogle_ai_generativelanguage`) in Python `site-packages` environment to eliminate all pip warnings. Verified 100% test pass rate (8/8 passed).
2026-08-24 – Created `.vscode/settings.json` configuring Pylance `python.analysis.extraPaths` to include `./backend`, resolving IDE static analysis import error `Cannot find module app.schemas.search`.
2026-08-24 – Implemented dual `try...except ImportError` fallback resolution for `app.schemas.search` / `backend.app.schemas.search` across all AI modules (`buyer_search.py`, `bge_reranker.py`, `bge_embedder.py`, `search_extractor.py`) to satisfy both workspace-root and backend-root static type checkers. 100% test pass rate (9/9 passed).
2026-08-24 – Added missing `Dict, List, Optional, Tuple` typing imports to `ai/orchestrator/search_extractor.py` and configured `css.lint.unknownAtRules: ignore` in `.vscode/settings.json`. Verified 0 errors, 0 warnings across Pyright static analysis and 9/9 pytest pass rate.
2026-08-24 – Refactored product intent extraction and semantic candidate filtering (`buyer_search.py` & `search_extractor.py`): isolated pure product intent for BGE-M3 query, enforced minimum semantic candidate thresholding (`dense >= 0.30` / `lexical >= 0.50` / `hybrid >= 0.25`), excluded unrelated product categories (sarees, brass lamps, wall hangings, bamboo baskets, puppets) from pot searches, and handled zero-product constraint queries (`"20 in 2 days"`) without catalog pollution. Verified 100% test pass rate (9/9 passed).
2026-08-24 – Removed redundant `float()` conversions on lines 123 and 147 of `ai/matching/bge_embedder.py`. Verified 0 Pyright errors/warnings and 9/9 pytest pass rate.
2026-08-25 – Fixed initial dashboard product loading bug in `ai/matching/buyer_search.py`: when search query is empty on dashboard initial render, returns all 10 candidate products by default (subject to active explicit filters) so the product grid is populated immediately upon opening. Verified 9/9 pytest pass rate.
2026-08-25 – Standardized `ProductItem` and `RequirementExtraction` schema imports to single canonical path `app.schemas.search` across all AI modules (`buyer_search.py`, `bge_reranker.py`, `bge_embedder.py`, `search_extractor.py`), eliminating Pyright union type ambiguity (`list[app.schemas.search.ProductItem | backend.app.schemas.search.ProductItem]`). Verified 0 Pyright errors across all search files (0 errors, 0 warnings, 0 informations) and 9/9 pytest pass rate.
2026-08-25 – Restarted backend FastAPI uvicorn daemon (`http://127.0.0.1:8000`) and frontend Next.js dev server (`http://localhost:3000`). Verified HTTP 200 responses.
2026-08-25 – Removed hardcoded fallback dummy values (phone `+919876543210`, location `Kumbakonam, Tamil Nadu`, and example input strings) across frontend components (`page.tsx`, `ProfileView.tsx`, `OnboardingModal.tsx`, `SearchBar.tsx`). Verified 9/9 pytest pass rate.
2026-08-25 – Successfully migrated product data storage and semantic vector retrieval to persistent ChromaDB (`backend/app/repositories/chroma_repository.py` at `backend/app/data/chromadb_data`). All 10 existing artisan products, BGE-M3 embeddings, metadata attributes, and search behaviors were preserved with 100% record count match (`10 == 10`). Verified 9/9 pytest pass rate.
2026-08-25 – Resolved ChromaDB type issues across `chroma_repository.py`, `scratch_test_chroma_migration.py`, and `main.py`: updated `ClientAPI` and `Collection` imports from `chromadb.api`, added type-safe helpers for primitive metadata parsing without `# type: ignore`, handled `price_per_unit: float | None`, added `None` assertions for toggle favorite test, and removed redundant `str()` calls in CORS configuration. Verified 0 Pyright errors/warnings and 9/9 pytest pass rate.
2026-08-25 – Enforced default product retrieval logic in `ai/matching/buyer_search.py`: when search query is empty and no explicit filters are active, directly returns all 10 candidate products from persistent ChromaDB collection. Verified 100% data preservation and 9/9 pytest pass rate.
2026-08-25 – Added `BaseException` handling in `ChromaRepository.get_client()` to catch ChromaDB Rust bindings `PanicException` (`range start index 10 out of range for slice of length 9`) on Python 3.13, automatically purging corrupted index state and re-creating clean persistent storage with all 10 artisan products on backend startup. Verified 9/9 pytest pass rate.
2026-08-25 – Resolved Git merge conflict markers across `backend/app/api/v1/router.py`, `backend/app/repositories/__init__.py`, `frontend/src/app/dashboard/page.tsx`, and `pyrightconfig.json`.
2026-08-25 – Removed untracked Python virtual environment files (`backend/venv`, 17,751 files) from git index (`git rm -r --cached backend/venv`) to resolve Git push HTTP 408 timeout failures.
2026-08-25 – Configured `.gitignore` and `backend/.gitignore` to exclude `venv/`, `backend/venv/`, `.venv/`, and `chromadb_data/` from git tracking.

## Known Issues / Blockers

- None.

## Next Immediate Actions

- Finalize Git commit and push changes to remote origin.
