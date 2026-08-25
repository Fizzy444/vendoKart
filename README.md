# vendoKart 🎨✨
> **AI Virtual Business Manager for Traditional Artisans & Handcrafted Heritage Commerce**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](LICENSE)

---

## 📖 About vendoKart

**vendoKart** is an AI-powered commerce enablement platform designed to bridge the digital divide for traditional Indian artisans, handloom weavers, and craft clusters. It acts as an autonomous **Virtual Business Manager**, enabling master craftspeople to catalog products through voice in regional languages, capture studio-quality photos with real-time CV guidance, price items fairly using deterministic math, verify physical studio presence, and reach global buyers.

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
- **Styling**: Tailwind CSS v4, Lucide Icons, Custom Artisan Theme
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
│   │   ├── models/           # Pydantic DB models (User, Seller, Product, Verification)
│   │   ├── repositories/     # Data persistence layers with in-memory fallbacks
│   │   ├── schemas/          # Request & response schemas
│   │   └── services/         # Business logic (pricing engine, trust engine, OTP)
│   ├── tests/                # Pytest unit & integration test suite
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router (dashboard, auth pages, layout)
│   │   ├── components/       # UI & Seller components (LiveCamera, AddProduct, Wizard)
│   │   ├── context/          # Auth & Role Context Provider
│   │   ├── services/         # API client service layer
│   │   └── types/            # TypeScript data contracts & interfaces
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **Python**: v3.11+
- **PostgreSQL**: PostgreSQL 16+ or Docker container (resilient async SQLite store enabled for offline local dev/testing)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

> **API Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser for the interactive Swagger UI.

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```

> **Web App**: Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Running Tests

### Backend Tests (Pytest)
```bash
cd backend
.venv\Scripts\python -m pytest tests/ -v
```

### Frontend Build Verification
```bash
cd frontend
npm run build
```

---

## 🔐 Environment Configuration

Create a `.env` file in `backend/` and `frontend/`:

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
