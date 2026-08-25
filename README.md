# vendoKart 🎨✨
> **AI Virtual Business Manager for Traditional Artisans & Handcrafted Heritage Commerce**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](LICENSE)

---

## 📖 About vendoKart

**vendoKart** is an AI-powered commerce enablement platform designed to bridge the digital divide for traditional Indian artisans, handloom weavers, and craft clusters. It acts as an autonomous **Virtual Business Manager**, enabling master craftspeople to catalog products through voice in regional languages, capture studio-quality photos with real-time CV guidance, price items fairly using deterministic math, verify physical studio presence, and reach global buyers.

> **Take a photo + Speak about the product → AI prepares the product listing → Sell Online**

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🎙️ **Voice-to-Catalog** | Artisans describe products in Hindi, Tamil, Bengali, or English. AI automatically extracts specifications, techniques, materials, and care stories. |
| 🧮 **Deterministic Fair Pricing Engine (§11)** | Computes unit production cost using $(W \times L)/U + \text{Material} + \text{Packaging}$, enforcing a non-negotiable floor price so artisans never sell at a loss. |
| 📸 **Live Camera Photography Assistant (§13)** | In-browser computer vision guides lighting, focus, framing, and sharpness in real-time before capture. |
| 🛡️ **Presence & Trust Verification (§12)** | Combines 2Factor SMS OTP, GPS workshop geocoding, 3-step live camera evidence, and perceptual dHash duplicate fraud detection to award a **Verified Studio** badge. |
| 🛍️ **Buyer Marketplace & Custom Orders** | Discover handcrafted heritage by craft clusters (Varanasi, Jaipur, Coimbatore, Kashmir) with bespoke customization requests. |
| 📦 **Multi-Artisan Order Coordination (§14)** | Automatically splits and aggregates bulk corporate/wedding orders across multiple verified cluster artisans. |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS, Lucide Icons, Custom Artisan Theme
- **State & Networking**: React Hooks, Native Fetch API, HTML5 Canvas CV

### Backend
- **Framework**: FastAPI (Async Python)
- **Database**: PostgreSQL (SQLAlchemy 2.0 async + asyncpg) with resilient async SQLite fallback
- **Authentication**: JWT Bearer Tokens, 2Factor.in SMS/Voice OTP integration
- **Vision & Fraud**: Perceptual dHash, Bitwise Hamming Distance duplicate detection
- **Testing**: Pytest, Pytest-Asyncio, HTTPX

---

## 📁 Repository Structure

```text
vendoKart/
├── backend/                  # FastAPI REST API Backend
│   ├── app/
│   │   ├── api/v1/           # API Endpoints (auth, sellers, products, verification)
│   │   ├── core/             # Database connections, config, JWT security
│   │   ├── models/           # SQLAlchemy 2.0 DB models (User, Seller, Product, Verification)
│   │   ├── repositories/     # Data persistence layers with in-memory fallbacks
│   │   ├── schemas/          # Request & response Pydantic schemas
│   │   └── services/         # Business logic (pricing, OTP, trust verification)
│   ├── tests/                # Automated pytest test suites
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container definition
├── frontend/                 # Next.js 16 Frontend Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router (dashboard, auth, marketplace)
│   │   ├── components/       # UI components (auth, seller studio, modals)
│   │   ├── context/          # React AuthContext
│   │   ├── services/         # API client service
│   │   └── types/            # TypeScript definitions
│   └── package.json          # Frontend dependencies & scripts
├── docker-compose.yml        # Multi-container orchestration (Postgres, API, UI)
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- PostgreSQL 16 (or Docker)

### Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Configuration

### `backend/.env`
```env
PROJECT_NAME="vendoKart"
ENVIRONMENT="development"
DEBUG=True
SECRET_KEY="your-jwt-secret-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# PostgreSQL Database
POSTGRES_USER=artisan
POSTGRES_PASSWORD=artisan_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=artisan_commerce
DATABASE_URL=postgresql+asyncpg://artisan:artisan_dev_password@localhost:5432/artisan_commerce

# 2Factor SMS OTP Service
TWOFACTOR_API_KEY="your-2factor-api-key"
```

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ for Indian Artisans & Traditional Heritage Craftspeople.</sub>
</div>
