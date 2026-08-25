# Project Execution Plan

## Overview

Execution strategy for developing vendoKart, structured across foundational infrastructure, core seller enablement, and intelligent buyer requirement matching.

## Phase 1: Foundations & Authentication (Completed)
Goal: Establish core FastAPI backend, MongoDB, Redis, JWT token authentication, and Next.js frontend structure.
Steps:
- Configure FastAPI app and CORS
- Implement Phone OTP authentication (SMS/WhatsApp)
- Implement RBAC token verification
- Set up basic Next.js app structure
Status: Complete

## Phase 2: Buyer Search & Requirement AI (Completed)
Goal: Build a fully functional Buyer/User Dashboard with natural language search, AI Mode toggle, semantic product discovery, multi-condition filtering, "Nearby Me" location persistence, and product detail viewing.
Steps:
- Create Pydantic search schemas (`backend/app/schemas/search.py`)
- Implement NLU requirement extraction (`ai/orchestrator/search_extractor.py`)
- Implement semantic matching engine (`ai/matching/buyer_search.py`)
- Build artisan craft product repository (`backend/app/repositories/product_repository.py`)
- Create search API endpoint (`backend/app/api/v1/endpoints/search.py`)
- Build UI components (Sidebar, SearchBar, FilterBar, ProductCard, ProductDetailsModal, OnboardingModal)
- Integrate Next.js `/dashboard` page and style matching reference image
- Verify all 9 search/filter matrix test cases
Status: Complete

## Phase 3: Seller Core & Deterministic Pricing Engine (Pending)
Goal: Product cataloguing, manual attribute entry, and pure-math fair-wage pricing engine.
Steps:
- Seller product management APIs
- Deterministic price floor calculator
- Image upload and media management
Status: Pending

## Phase 4: Voice Cataloguing & Multilingual AI (Pending)
Goal: Whisper speech-to-text integration and multi-language attribute extraction.
Steps:
- Audio upload and transcription
- Attribute extraction from voice recordings
Status: Pending

## Phase 5: Multi-Artisan Order Aggregation & Deployment (Pending)
Goal: Bulk order splitting across decentralized artisans and production deployment.
Steps:
- Order distribution engine
- Production deployment setup
Status: Pending

## Completed Milestones

- Stage 0 Foundations & Phone OTP Auth (2026-08-24)
- Module 4 Buyer Dashboard & AI Requirement Search (2026-08-24)

## Pending Milestones

- Module 1 Seller Core & Pricing Engine
- Module 2 Voice Cataloguing
