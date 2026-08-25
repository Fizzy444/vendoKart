# Buyer Search & Autocomplete API Specification

**Branch**: `branch-muthu`  
**Project**: vendoKart  
**Module**: Buyer-Facing Search & RAG UI

---

## 1. Module Overview

The Buyer Search module connects the vendoKart buyer frontend with the RAG semantic search engine and the seller catalog dataset. It provides instant prefix/semantic autocomplete, structured requirement parsing (budget, quantity, manufacturing lead time), and grounded product retrieval.

---

## 2. Endpoints

### 2.1 Autocomplete

Returns product suggestions grounded in the seller catalog based on prefix or semantic matching.

- **URL**: `/api/autocomplete`
- **Method**: `GET`
- **Query Parameters**:
  - `q` (string, required): Partial query text (e.g. `wood`)

#### Example Request
```http
GET /api/autocomplete?q=wood HTTP/1.1
Host: localhost:5000
```

#### Example Response
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "prod_1",
      "name": "Handmade Wooden Elephant Toy",
      "category": "Wooden Toys",
      "description": "Artisanal wooden elephant toy hand-carved from sustainable Ivory wood...",
      "price": 350,
      "stock": 45,
      "manufacturing_days": 1,
      "seller_name": "Channapatna Toys Co.",
      "seller_location": "Karnataka",
      "image_url": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=100&auto=format&fit=crop"
    },
    {
      "id": "prod_2",
      "name": "Handmade Wooden Car",
      "category": "Wooden Toys",
      "description": "Eco-friendly wooden toy car with rotating wheels...",
      "price": 450,
      "stock": 20,
      "manufacturing_days": 2,
      "seller_name": "Channapatna Toys Co.",
      "seller_location": "Karnataka",
      "image_url": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=100&auto=format&fit=crop"
    }
  ]
}
```

---

### 2.2 Semantic & Natural Language Search (RAG)

Accepts either standard keywords or natural-language constraint queries (e.g., *"I need 20 pots under ₹2000 manufactured within 2 days"*).

- **URL**: `/api/search`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "query": "I need 20 pots under ₹2000 manufactured within 2 days"
}
```

#### Example Response (Success with Constraints)
```json
{
  "success": true,
  "data": {
    "answer": "Here are the matching handcrafted pots available from our pottery artisans within your ₹2000 budget and required quantity.",
    "products": [
      {
        "id": "prod_4",
        "name": "Terracotta Clay Pot",
        "category": "Home Decor",
        "description": "Traditional hand-molded clay pot, perfect for cooling water naturally...",
        "price": 250,
        "stock": 120,
        "manufacturing_days": 2,
        "seller_name": "Velu Pottery Works",
        "seller_location": "Tamil Nadu",
        "image_url": "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=100&auto=format&fit=crop"
      }
    ],
    "extractedRequirements": {
      "product": "pots",
      "max_budget": 2000,
      "quantity": 20,
      "max_manufacturing_days": 2
    }
  }
}
```

#### Example Response (Product Not Available)
When no matching item exists in the seller catalog (e.g., query for *"swimming pool"*):
```json
{
  "success": true,
  "data": {
    "answer": "No matching products available in our marketplace.",
    "products": [],
    "extractedRequirements": {
      "product": "swimming pool",
      "max_budget": null,
      "quantity": null,
      "max_manufacturing_days": null
    }
  }
}
```

---

## 3. Frontend Architecture

```
frontend/src/
├── types/
│   └── search.js            # Contracts & SearchUIState enum
├── services/
│   └── searchService.js     # API client functions with AbortSignal
├── hooks/
│   └── useSearch.js         # Reactive search state, debounce, keyboard nav
├── components/
│   └── search/
│       ├── SearchBox.jsx    # Search input, actions, quick prompt chips
│       ├── Autocomplete.jsx  # Grounded suggestion dropdown
│       ├── RequirementsCard.jsx # Displays parsed NLP constraints
│       ├── ProductCard.jsx   # Seller product card with stock & mfg time
│       ├── NoResults.jsx     # "Product Not Available" grounded empty state
│       └── SearchResults.jsx # Results coordinator
└── App.jsx                  # Main interface composition
```

---

## 4. UI State Transitions

```text
[ IDLE ] ──(User types)──> [ TYPING / LOADING_SUGGESTIONS ]
                                 │
                     (Select suggestion or Press Enter)
                                 │
                                 ▼
                           [ SEARCHING ]
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
            [ SUCCESS ]    [ NO_RESULTS ]    [ ERROR ]
```

---

## 5. Grounding Rules

1. **No Fictional Data**: The frontend never hardcodes or hallucinates product listings. All data originates strictly from the backend seller dataset.
2. **Strict Negatives**: When query items do not exist in the catalog, the UI displays `Product Not Available` and never recommends irrelevant items.

---

## 6. Inbuilt Buyer-to-Seller Chat Box Architecture

The Inbuilt Chat enables direct buyer-seller negotiation and customization inquiries without navigating to external applications (e.g. WhatsApp, Telegram).

### Component Tree
```
frontend/src/components/chat/
├── ChatBox.jsx         # Docked floating container with minimized badge state
├── ChatHeader.jsx      # Seller profile, verification badge (✓), online indicator
├── ProductContext.jsx  # Pinned header showing the specific product under discussion
├── MessageList.jsx     # Bubble stream, timestamps, typing indicator, quote cards
├── MessageInput.jsx    # Text input, file attachment, quick action prompt chips
└── QuoteCard.jsx       # Interactive formal quotation card with Accept / Negotiate
```

### Quick Action Types
- `CUSTOMIZATION`: "Can you customize this product with different colors or sizes?"
- `QUOTE`: "I would like to request an official quote for 20 units."
- `DELIVERY`: "What is the earliest manufacturing and delivery date?"
- `SEND_PRODUCT`: Shares active product card into the message stream.

### Structured Quote Card Contract
```typescript
interface QuoteData {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productionDays: number;
  status: 'pending' | 'accepted' | 'negotiating';
}
```

