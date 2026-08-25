# Project Architecture

## Overview

vendoKart is an AI-powered digital commerce enablement platform for traditional Indian artisans and small producers. It bridges the gap between artisan craft output and digital commerce through voice-first cataloguing, deterministic fair-wage pricing, multi-artisan bulk order aggregation, and natural-language buyer requirement matching.

## Tech Stack

Frontend: Next.js 14+, React 18, TypeScript, Tailwind CSS, Lucide Icons
Backend: FastAPI (Python 3.11+), Pydantic v2, Motor (Async MongoDB), Redis (aioredis)
Database: MongoDB (System of Record), Redis (Session / OTP Cache / Vector Cache)
Authentication: Phone OTP Auth (Twilio / SMS / WhatsApp), JWT (HS256 access & refresh tokens), RBAC (Seller, Buyer, Admin)
AI Components: Natural Language Requirement Extraction (NLU), Semantic Product Matching Engine
Hosting / Storage: MinIO / AWS S3 Object Storage for media

## System Components

### Frontend
- Located in `frontend/`
- Next.js App Router with responsive Tailwind design
- Buyer Dashboard (`/dashboard`) with warm artisan aesthetic (`#FBF8F3` background, `#44521E` deep olive accents, `#B84018` terracotta buttons)
- Components: Sidebar, HeaderGreeting, SearchBar with AI Mode, FilterBar, ProductCard grid, ProductDetailsModal, OnboardingModal.

### Backend
- Located in `backend/`
- FastAPI REST API supporting `/api/v1/auth`, `/api/v1/health`, `/api/v1/search`
- Pydantic v2 validation models and schemas
- Repository pattern for DB interactions (`user_repository`, `product_repository`)

### AI Services
- Located in `ai/`
- Orchestrator (`ai/orchestrator/search_extractor.py`): NLU requirement extraction parsing query strings for quantity, budget, delivery timeline, product keyword, and location.
- Matching Engine (`ai/matching/buyer_search.py`): Semantic scoring, hard requirement filtering, location proximity calculation, and relevance ranking.

## Folder Structure

```
vendoKart/
├── ai/
│   ├── matching/
│   │   ├── __init__.py
│   │   └── buyer_search.py
│   └── orchestrator/
│       ├── __init__.py
│       └── search_extractor.py
├── backend/
│   └── app/
│       ├── api/v1/endpoints/
│       │   ├── auth.py
│       │   ├── health.py
│       │   └── search.py
│       ├── core/
│       ├── models/
│       ├── repositories/
│       ├── schemas/
│       └── services/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── dashboard/
│       │   │   └── page.tsx
│       │   ├── globals.css
│       │   └── layout.tsx
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── FilterBar.tsx
│       │   │   ├── HeaderGreeting.tsx
│       │   │   ├── OnboardingModal.tsx
│       │   │   ├── ProductCard.tsx
│       │   │   ├── ProductDetailsModal.tsx
│       │   │   ├── SearchBar.tsx
│       │   │   └── Sidebar.tsx
│       │   └── ui/
│       ├── context/
│       ├── services/
│       └── types/
├── plan.md
├── current.md
├── architecture.md
└── rules.md
```

## Data Flow

1. **User Onboarding & Profile**: User enters Name, Phone, Email (opt), Location. Location saved in DB (`PUT /api/v1/auth/me`) and persisted in client session.
2. **Search Request**: User enters query (e.g. `"70 pots needed under 3000 within 3 days"`) with AI Mode enabled or disabled.
3. **NLU Extraction**: Backend AI orchestrator extracts requirements: product=`pots`, quantity=`70`, max_budget=`3000`, max_delivery_days=`3`.
4. **Semantic Search & Hard Filtering**: Matching engine evaluates product database against extracted constraints + manual UI filters (Price, Quantity, Category, Nearby Me location).
5. **Result Ranking & Rendering**: Products ordered by relevance score are returned and rendered dynamically on the Buyer Dashboard.

## Architecture Decisions

Decision 1: Unified Search & Requirement Pipeline
Reason: Ensures consistent user experience whether entering simple product keywords or complex bulk requirement sentences.

Decision 2: Warm Artisan Visual Theme
Reason: Establishes a distinct craft-centric brand identity rooted in Indian heritage colors (cream `#FBF8F3`, terracotta `#B84018`, olive `#44521E`).
