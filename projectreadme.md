# StockPulse — Intelligent Inventory Replenishment System

A full-stack inventory management and replenishment platform with real-time WebSocket updates, demand forecasting, automated purchase orders, multi-warehouse tracking, barcode scanning, and role-based Google OAuth authentication.

**Live Demo:** [Dashboard](https://smart-replenish-warehouse-dashboard.vercel.app) | [API](https://stockpulse-api-haxr.onrender.com/api/inventory) *(free tier — first request may take ~30s)*

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Real-Time Updates (WebSocket)](#real-time-updates-websocket)
- [Stock Status Logic](#stock-status-logic)
- [Demand Forecasting](#demand-forecasting)
- [Automated Purchase Orders](#automated-purchase-orders)
- [Barcode Scanning](#barcode-scanning)
- [Email Notifications](#email-notifications)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Dynamic Pricing](#dynamic-pricing)
- [Interview Context](#interview-context)

---

## Features

### Core Inventory Management
- Full CRUD operations for inventory items with paginated, filterable listings
- Search and filter by name, SKU, category, or stock status
- Quick stock adjustments (+/-) per item or in bulk
- CSV export of inventory data (includes price, discount %, and final price)
- Dashboard summary cards (total items, low stock, out of stock)

### Dynamic Pricing Engine
- Automatic discount calculation based on stock-to-threshold ratio
- Items with **low stock / out of stock** retain their original price (scarcity = no discount)
- Items with **high stock** (HEALTHY status) get progressive discounts to move excess inventory:
  - Stock ≥ 4× threshold → **20% OFF**
  - Stock ≥ 3× threshold → **15% OFF**
  - Stock ≥ 2× threshold → **10% OFF**
  - Stock < 2× threshold → **No discount**
- "Final Price" column in the inventory dashboard with discount badge
- Strikethrough original price + discounted price displayed in the ecommerce storefront
- Price remains fully editable by admin users
- Computed server-side via transient getter methods (no DB storage overhead)

### Smart Alerts & Automation
- Low-stock alert banners on the dashboard
- Automatic purchase order generation when stock drops below threshold
- Email notifications for low/out-of-stock transitions (configurable via SMTP)

### Demand Forecasting
- Forecasts based on historical stock adjustment patterns
- Calculates average daily consumption, days until stockout, and suggested reorder quantity

### Multi-Warehouse Management
- CRUD for warehouses with per-warehouse stock tracking
- Stock breakdown per item across warehouses
- Warehouse deletion blocked if stock exists (data integrity)

### Supplier Management
- Supplier CRUD with contact details (email, phone, address, notes)
- Items linked to suppliers via `supplierId`

### Barcode Scanning
- Camera-based scanner using `html5-qrcode`
- Manual barcode entry fallback
- Backend proxies lookups across 6 external APIs (Open Food Facts, UPC ItemDB, DuckDuckGo, etc.)
- Auto-creates items from external lookup results

### Audit Trail
- Every create, update, adjust, and delete is logged with user info, old/new values, and timestamp
- Per-item audit history viewable in a modal panel

### Interactive Charts
- Status distribution pie chart
- Items per category bar chart
- Stock vs. threshold comparison chart (top 10 lowest stock items)

### Real-Time Updates
- STOMP over WebSocket with SockJS fallback
- Live "connected" indicator on dashboard
- Automatic data refresh on any inventory change

### Authentication & Role-Based Access
- Google OAuth 2.0 sign-in
- Three roles: **Admin**, **Manager**, **Viewer**
- Role-based UI rendering and API protection

### Progressive Web App (PWA)
- Installable on desktop and mobile
- Service worker with NetworkFirst API caching for offline resilience

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                          │
│         React 19 + Vite + TypeScript + Tailwind CSS          │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  Google   │  │  REST    │  │  WebSocket  │  │  PWA     │  │
│  │  OAuth    │  │  API     │  │  (STOMP)    │  │  Cache   │  │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘  └──────────┘  │
└───────┼──────────────┼───────────────┼───────────────────────┘
        │    HTTP       │    HTTP       │  WS
┌───────▼──────────────▼───────────────▼───────────────────────┐
│                   Backend (Render)                            │
│           Spring Boot 3.4 + Java 21 + Spring Security        │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  Auth    │  │  REST    │  │  WebSocket  │  │  Email   │  │
│  │  Filter  │  │  Controllers  │  Broadcaster  │  Alerts  │  │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘  └──────────┘  │
│       │              │               │                        │
│  ┌────▼──────────────▼───────────────▼──────────────────┐    │
│  │              Services Layer                           │    │
│  │  Inventory · Audit · Forecast · Reorder · GoogleAuth  │    │
│  └──────────────────────┬───────────────────────────────┘    │
│                         │  JPA                               │
│  ┌──────────────────────▼───────────────────────────────┐    │
│  │           Spring Data JPA Repositories                │    │
│  └──────────────────────┬───────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                      H2 Database                             │
│  inventory_items · suppliers · warehouses · warehouse_stock  │
│  purchase_orders · stock_audit_log · user_roles              │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21, Spring Boot 3.4, Spring Data JPA, Spring Security, Spring WebSocket, Spring Mail |
| **Frontend** | React 19, Vite 8, TypeScript, Tailwind CSS 4, Recharts, Lucide Icons |
| **Database** | H2 (file-based locally, in-memory on Render) |
| **Auth** | Google OAuth 2.0 + server-issued session tokens |
| **Real-Time** | STOMP over WebSocket with SockJS fallback |
| **Barcode** | html5-qrcode (camera) + multi-source backend proxy |
| **Build** | Gradle (backend), npm (frontend) |
| **Deployment** | Render (backend via Docker) + Vercel (frontend) |
| **API Docs** | SpringDoc OpenAPI / Swagger UI |
| **PWA** | vite-plugin-pwa with service worker |

---

## Project Structure

```
stockpulse-inventory/
├── backend/
│   ├── src/main/java/com/stockpulse/
│   │   ├── StockPulseApplication.java          # Entry point
│   │   ├── config/
│   │   │   ├── CorsConfig.java                 # CORS settings
│   │   │   ├── SecurityConfig.java             # Spring Security + Bearer filter
│   │   │   ├── WebSocketConfig.java            # STOMP/SockJS configuration
│   │   │   └── DataSeeder.java                 # Seeds sample data on empty DB
│   │   ├── controller/
│   │   │   ├── InventoryController.java        # Inventory CRUD + adjust + history
│   │   │   ├── AuthController.java             # Google OAuth login/logout
│   │   │   ├── ForecastController.java         # Demand forecasting
│   │   │   ├── PurchaseOrderController.java    # PO lifecycle management
│   │   │   ├── SupplierController.java         # Supplier CRUD
│   │   │   ├── WarehouseController.java        # Warehouse + stock management
│   │   │   ├── BarcodeLookupController.java    # Multi-source barcode lookup
│   │   │   └── GlobalExceptionHandler.java     # Centralized error handling
│   │   ├── dto/
│   │   │   ├── InventorySummary.java           # Dashboard summary counts
│   │   │   └── DemandForecast.java             # Forecast response DTO
│   │   ├── model/
│   │   │   ├── InventoryItem.java              # Core entity + dynamic pricing getters
│   │   │   ├── Supplier.java                   # Supplier entity
│   │   │   ├── Warehouse.java                  # Warehouse entity
│   │   │   ├── WarehouseStock.java             # Per-warehouse stock entity
│   │   │   ├── PurchaseOrder.java              # Purchase order entity
│   │   │   ├── StockAuditLog.java              # Audit log entry
│   │   │   ├── UserRole.java                   # User-role mapping
│   │   │   ├── StockStatus.java                # Enum: HEALTHY, LOW, OUT_OF_STOCK
│   │   │   ├── PurchaseOrderStatus.java        # Enum: PENDING → RECEIVED/CANCELLED
│   │   │   ├── AuditAction.java                # Enum: CREATE, UPDATE, ADJUST, DELETE
│   │   │   └── Role.java                       # Enum: ADMIN, MANAGER, VIEWER
│   │   ├── repository/                         # 7 Spring Data JPA repositories
│   │   └── service/
│   │       ├── InventoryService.java           # Core business logic
│   │       ├── AuditService.java               # Audit trail logging
│   │       ├── ForecastService.java            # Demand forecasting engine
│   │       ├── ReorderService.java             # Auto PO generation
│   │       ├── GoogleAuthService.java          # Token verification + sessions
│   │       ├── StockUpdateBroadcaster.java     # WebSocket event publisher
│   │       └── EmailNotificationService.java   # SMTP alert sender
│   ├── src/main/resources/
│   │   ├── application.properties              # Main config
│   │   └── application-prod.properties         # Production overrides
│   ├── build.gradle
│   ├── Dockerfile                              # Multi-stage JDK 21 Alpine
│   └── gradlew / gradlew.bat
├── frontend/
│   ├── src/
│   │   ├── App.tsx                             # Main dashboard (single-page)
│   │   ├── main.tsx                            # React entry point
│   │   ├── api/
│   │   │   ├── inventory.ts                    # All REST API calls
│   │   │   └── barcodeLookup.ts                # Barcode lookup helper
│   │   ├── components/
│   │   │   ├── StatusOverview.tsx              # Summary cards
│   │   │   ├── LowStockBanner.tsx             # Alert banner
│   │   │   ├── DashboardCharts.tsx            # Pie, bar, comparison charts
│   │   │   ├── InventoryTable.tsx             # Paginated table with Price + Final Price
│   │   │   ├── InventoryFilters.tsx           # Search + filters
│   │   │   ├── AddItemForm.tsx                # Create item form
│   │   │   ├── EditItemModal.tsx              # Edit item modal
│   │   │   ├── BulkUpdateModal.tsx            # Bulk stock adjustment
│   │   │   ├── BarcodeScanner.tsx             # Camera/manual scanner
│   │   │   ├── ForecastPanel.tsx              # Demand forecast view
│   │   │   ├── AuditLogPanel.tsx              # Item change history
│   │   │   ├── PurchaseOrders.tsx             # PO management panel
│   │   │   ├── WarehouseManagement.tsx        # Warehouse panel
│   │   │   ├── SupplierManagement.tsx         # Supplier panel
│   │   │   ├── LoginModal.tsx                 # Google OAuth login
│   │   │   ├── Pagination.tsx                 # Page navigator
│   │   │   ├── ConfirmDialog.tsx              # Confirmation modal
│   │   │   └── Toast.tsx                      # Toast notifications
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts                # STOMP WebSocket hook
│   │   └── utils/
│   │       ├── exportCsv.ts                   # CSV export (incl. discount & final price)
│   │       └── filterInventory.ts             # Client-side filtering
│   ├── public/                                # PWA icons + manifest
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json
│   └── .env.example
├── docs/screenshots/                          # README images
├── scripts/capture-screenshots.mjs            # Playwright screenshot tool
├── render.yaml                                # Render deployment blueprint
└── README.md
```

---

## Database Schema

### Entity Relationship

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   suppliers     │       │ inventory_items   │       │   warehouses     │
│─────────────────│       │──────────────────│       │──────────────────│
│ id (PK)         │◄──────│ supplier_id (FK) │       │ id (PK)          │
│ name            │       │ id (PK)          │──────►│ name             │
│ contact_email   │       │ name             │       │ location         │
│ phone           │       │ sku (unique)     │       │ is_default       │
│ address         │       │ category         │       └────────┬─────────┘
│ notes           │       │ current_stock    │                │
└─────────────────┘       │ min_threshold    │       ┌────────▼─────────┐
                          │ status (enum)    │       │ warehouse_stock  │
                          │ price            │       │──────────────────│
                          └───────┬──────────┘       │ id (PK)          │
                                  │                  │ warehouse_id     │
                    ┌─────────────┤                  │ item_id          │
                    │             │                  │ quantity          │
           ┌────────▼────────┐   │                  │ (unique: wh+item)│
           │ stock_audit_log │   │                  └──────────────────┘
           │─────────────────│   │
           │ id (PK)         │   │          ┌──────────────────┐
           │ item_id         │   │          │ purchase_orders  │
           │ item_name       │   └─────────►│──────────────────│
           │ action (enum)   │              │ id (PK)          │
           │ details         │              │ item_id          │
           │ old_value       │              │ item_name        │
           │ new_value       │              │ sku              │
           │ changed_by      │              │ supplier_id      │
           │ timestamp       │              │ quantity          │
           └─────────────────┘              │ status (enum)    │
                                            │ created_at       │
           ┌─────────────────┐              │ updated_at       │
           │   user_roles    │              └──────────────────┘
           │─────────────────│
           │ id (PK)         │
           │ email (unique)  │
           │ role (enum)     │
           └─────────────────┘
```

### Enums

| Enum | Values |
|------|--------|
| `StockStatus` | `HEALTHY`, `LOW`, `OUT_OF_STOCK` |
| `PurchaseOrderStatus` | `PENDING`, `APPROVED`, `ORDERED`, `RECEIVED`, `CANCELLED` |
| `AuditAction` | `CREATE`, `UPDATE`, `ADJUST`, `DELETE` |
| `Role` | `ADMIN`, `MANAGER`, `VIEWER` |

---

## API Endpoints

### Inventory — `/api/inventory`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/inventory` | Public | List all items |
| `GET` | `/api/inventory/paged?page&size&search&category&status` | Public | Paginated + filtered listing |
| `GET` | `/api/inventory/summary` | Public | Dashboard summary counts |
| `GET` | `/api/inventory/{id}` | Public | Get single item |
| `POST` | `/api/inventory` | Manager+ | Create new item |
| `PUT` | `/api/inventory/{id}` | Manager+ | Update item |
| `POST` | `/api/inventory/{id}/adjust?delta=N` | Manager+ | Adjust stock (+/-) |
| `DELETE` | `/api/inventory/{id}` | Admin | Delete item |
| `GET` | `/api/inventory/{id}/history?page&size` | Public | Paginated audit history |
| `GET` | `/api/inventory/{id}/forecast?days=30` | Public | Demand forecast |

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/google` | Public | Google OAuth login |
| `POST` | `/api/auth/logout` | Bearer | Invalidate session |
| `GET` | `/api/auth/users` | Public | List user roles |
| `PUT` | `/api/auth/users/{email}/role` | Public | Update user role |

### Suppliers — `/api/suppliers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/suppliers` | Public | List all suppliers |
| `GET` | `/api/suppliers/{id}` | Public | Get single supplier |
| `POST` | `/api/suppliers` | Manager+ | Create supplier |
| `PUT` | `/api/suppliers/{id}` | Manager+ | Update supplier |
| `DELETE` | `/api/suppliers/{id}` | Admin | Delete supplier |

### Warehouses — `/api/warehouses`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/warehouses` | Public | List all warehouses |
| `POST` | `/api/warehouses` | Manager+ | Create warehouse |
| `PUT` | `/api/warehouses/{id}` | Manager+ | Update warehouse |
| `DELETE` | `/api/warehouses/{id}` | Admin | Delete (blocked if stock exists) |
| `GET` | `/api/warehouses/{id}/stock` | Public | Stock in a warehouse |
| `GET` | `/api/warehouses/item/{itemId}/breakdown` | Public | Per-warehouse stock for an item |
| `POST` | `/api/warehouses/item/{itemId}/stock` | Manager+ | Set stock in a warehouse |

### Purchase Orders — `/api/purchase-orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/purchase-orders?status=` | Public | List POs (optional status filter) |
| `GET` | `/api/purchase-orders/{id}` | Public | Get single PO |
| `PUT` | `/api/purchase-orders/{id}/status` | Manager+ | Update PO status |

### Barcode — `/api/barcode-lookup`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/barcode-lookup/{barcode}` | Public | Multi-source product lookup |

### API Documentation

Swagger UI is available at `/swagger-ui.html` and the OpenAPI spec at `/api-docs`.

---

## Authentication & Authorization

### Flow

```
User clicks "Login"
        │
        ▼
Google OAuth popup → Google ID Token (JWT)
        │
        ▼
POST /api/auth/google { idToken }
        │
        ▼
Backend verifies token via Google's tokeninfo endpoint
        │
        ▼
Checks email against user_roles table (whitelist model)
        │
        ▼
Issues UUID session token (stored in-memory ConcurrentHashMap)
        │
        ▼
Returns { token, email, name, picture, role }
        │
        ▼
Frontend stores token → sends as "Authorization: Bearer <token>"
```

### Role Permissions

| Role | GET | POST/PUT | DELETE |
|------|-----|----------|--------|
| **Admin** | Yes | Yes | Yes |
| **Manager** | Yes | Yes | No |
| **Viewer** | Yes | No | No |
| **Unauthenticated** | Yes | No | No |

All read endpoints are public. Mutating operations require authentication and appropriate role.

---

## Real-Time Updates (WebSocket)

The application uses **STOMP over WebSocket** with SockJS fallback for real-time inventory updates.

**Backend:** `StockUpdateBroadcaster` publishes events to `/topic/inventory` on every inventory change:

```json
{
  "event": "CREATE | UPDATE | ADJUST | DELETE",
  "itemId": 123,
  "itemName": "Widget A",
  "currentStock": 45,
  "status": "HEALTHY"
}
```

**Frontend:** The `useWebSocket` hook connects via `@stomp/stompjs`, subscribes to `/topic/inventory`, and triggers a full data reload on any message. A green "Live" badge indicates an active connection. Auto-reconnect runs every 5 seconds on disconnect.

---

## Stock Status Logic

Status is recalculated automatically on every create, update, and stock adjustment:

| Status | Condition | Dashboard |
|--------|-----------|-----------|
| **Healthy** | `currentStock > minThreshold` | Normal display |
| **Low** | `0 < currentStock <= minThreshold` | Yellow alert banner |
| **Out of Stock** | `currentStock <= 0` | Red alert banner |

When a status transitions to **Low** or **Out of Stock**:
1. An alert is logged server-side
2. A purchase order is auto-generated (if none exists for that item)
3. An email notification is sent (if enabled)
4. A WebSocket event is broadcast to all connected clients

---

## Demand Forecasting

The `ForecastService` analyzes historical `ADJUST` audit log entries to predict future stock needs:

| Metric | Calculation |
|--------|-------------|
| **Average Daily Consumption** | Sum of negative adjustments / number of days in range |
| **Days Until Stockout** | Current stock / average daily consumption |
| **Suggested Reorder Quantity** | Average daily consumption x 14 days (two-week supply) |
| **Data Points** | Number of adjustment records used in the calculation |

Default forecast window: **30 days** (configurable via `?days=` query parameter).

---

## Automated Purchase Orders

When an item's stock drops to **Low** or **Out of Stock**, the `ReorderService` automatically generates a purchase order:

- **Trigger:** Status transition to LOW or OUT_OF_STOCK
- **Guard:** No existing PO with status PENDING, APPROVED, or ORDERED for that item
- **Quantity Formula:** `max(1, minThreshold × 2 - currentStock)`
- **Initial Status:** PENDING

**PO Lifecycle:**

```
PENDING → APPROVED → ORDERED → RECEIVED (auto-adjusts inventory stock)
                                    or
PENDING → CANCELLED (at any stage)
```

When a PO reaches **RECEIVED** status, the ordered quantity is automatically added to the item's `currentStock`.

---

## Barcode Scanning

The `BarcodeScanner` component supports two input modes:
1. **Camera scan** — uses `html5-qrcode` to read barcodes from the device camera
2. **Manual entry** — type or paste a barcode number

The backend `BarcodeLookupController` proxies the barcode across 6 external APIs to avoid CORS issues:

1. Open Food Facts
2. Open Products Facts
3. Open Beauty Facts
4. UPC ItemDB
5. DuckDuckGo Instant Answer
6. eandata.com

**Behavior on scan result:**
- If the barcode matches a local inventory item → opens the edit modal
- If found externally → auto-creates a new item (when authenticated)
- If not found anywhere → prompts for manual name/category entry

---

## Email Notifications

Low-stock email alerts are sent via Gmail SMTP when enabled.

| Setting | Value |
|---------|-------|
| **SMTP Host** | smtp.gmail.com |
| **Port** | 587 (STARTTLS) |
| **Trigger** | Item transitions to LOW or OUT_OF_STOCK |
| **Subject** | `[StockPulse] LOW STOCK: <item>` or `[StockPulse] OUT OF STOCK: <item>` |
| **Body** | Item name, SKU, status, current stock, threshold, category |

Disabled by default. Enable by setting `MAIL_ENABLED=true` with valid SMTP credentials.

---

## Getting Started

### Prerequisites

- **JDK 21** ([Eclipse Temurin](https://adoptium.net/) recommended)
- **Node.js 18+** ([nodejs.org](https://nodejs.org/))

### Backend

```bash
cd backend
./gradlew bootRun        # Linux / macOS
gradlew.bat bootRun      # Windows
```

The API starts at `http://localhost:8080`. H2 console is available at `http://localhost:8080/h2-console`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard opens at `http://localhost:5173`.

---

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | Server port |
| `CORS_ALLOWED_ORIGINS` | No | `localhost:5173` | Comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` | No | Dev default | Google OAuth client ID |
| `MAIL_ENABLED` | No | `false` | Enable email notifications |
| `MAIL_USERNAME` | If mail enabled | — | Gmail address |
| `MAIL_PASSWORD` | If mail enabled | — | Gmail app password |
| `ALERT_EMAIL` | If mail enabled | — | Recipient for stock alerts |
| `SPRING_PROFILES_ACTIVE` | No | `default` | Set to `prod` for production |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8080/api/inventory` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Yes | — | Google OAuth client ID |
| `VITE_WS_URL` | No | `ws://localhost:8080/ws/websocket` | WebSocket endpoint |

---

## Deployment

### Backend on Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Blueprint** → connect repo → branch `main`
3. The `render.yaml` blueprint auto-configures:
   - Docker runtime with multi-stage JDK 21 Alpine build
   - Health check at `/api/inventory/summary`
   - Production profile (`SPRING_PROFILES_ACTIVE=prod`)
4. Set `CORS_ALLOWED_ORIGINS` to your Vercel frontend URL
5. Deploy

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import repo
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `VITE_API_BASE_URL` = `https://YOUR-RENDER-URL.onrender.com/api/inventory`
   - `VITE_GOOGLE_CLIENT_ID` = your Google client ID
   - `VITE_WS_URL` = `wss://YOUR-RENDER-URL.onrender.com/ws/websocket`
4. Deploy

> No external database setup needed — H2 runs embedded. Data resets on Render free-tier restarts.

---

## Dynamic Pricing

StockPulse implements a **stock-aware dynamic pricing engine** that automatically adjusts item prices based on inventory levels. The logic incentivizes clearing excess stock while protecting margins on scarce items.

### Pricing Rules

| Stock Status | Condition | Discount | Rationale |
|-------------|-----------|----------|-----------|
| **OUT_OF_STOCK** | `currentStock <= 0` | 0% (original price) | No stock to sell |
| **LOW** | `0 < currentStock <= minThreshold` | 0% (original price) | Scarcity — maintain full price |
| **HEALTHY** | `currentStock > minThreshold` but `< 2× threshold` | 0% | Adequate stock — no discount needed |
| **HEALTHY** | `currentStock >= 2× minThreshold` | 10% OFF | Excess stock — mild discount |
| **HEALTHY** | `currentStock >= 3× minThreshold` | 15% OFF | High stock — moderate discount |
| **HEALTHY** | `currentStock >= 4× minThreshold` | 20% OFF | Overstock — aggressive discount |

### Implementation

The pricing is computed **server-side** in `InventoryItem.java` using transient getter methods:

```java
public Double getDiscountPercentage() {
    if (price == null || price <= 0 || status != StockStatus.HEALTHY) return 0.0;
    double ratio = (double) currentStock / Math.max(minThreshold, 1);
    if (ratio >= 4) return 20.0;
    if (ratio >= 3) return 15.0;
    if (ratio >= 2) return 10.0;
    return 0.0;
}

public Double getFinalPrice() {
    if (price == null) return null;
    double discount = getDiscountPercentage();
    if (discount <= 0) return price;
    return Math.round(price * (1 - discount / 100.0) * 100.0) / 100.0;
}
```

**Key design choices:**
- **No database columns** — `discountPercentage` and `finalPrice` are computed on every API response, ensuring they're always in sync with current stock levels. No stale pricing data.
- **Jackson auto-serialization** — Getter methods are automatically included in JSON responses without any annotation or DTO mapping.
- **Ecommerce integration** — The ecommerce storefront reads these computed fields via the inventory API and displays strikethrough original price + discounted final price with a discount badge.

### Frontend Display

**Inventory Dashboard:**
- "Price" column shows the original price with a strikethrough and discount badge when applicable
- "Final Price" column shows the effective selling price in green when discounted
- CSV export includes Price, Discount %, and Final Price columns

**Ecommerce Storefront:**
- Product cards show: ~~₹599.00~~ → **₹479.20** with a "20% OFF" badge
- Product detail page shows savings amount ("You save ₹119.80")
- Add to Cart uses the final discounted price

---

## Interview Context

> Use this section to explain the project confidently in interviews. It covers the "why" behind each design decision, the challenges faced, and how to talk about the system end to end.

### 1. Project Introduction (Elevator Pitch)

*"StockPulse is a full-stack inventory replenishment system I built from scratch using Spring Boot and React. It goes beyond basic CRUD — it features a dynamic pricing engine that automatically discounts overstocked items while maintaining full price on scarce products, real-time WebSocket updates, demand forecasting based on historical consumption patterns, automated purchase order generation when stock drops below thresholds, multi-warehouse stock tracking, barcode scanning with multi-source external API lookups, role-based access control via Google OAuth, and email notifications for critical stock levels. It also has an integrated ecommerce storefront that displays live inventory with dynamic prices. It's deployed on Render (backend) and Vercel (frontend)."*

### 2. Why I Built This

*"I wanted to demonstrate that I can build a production-grade application end to end — not just a todo app, but something with real business logic. Inventory management involves interesting problems: state machines (purchase order lifecycle), event-driven architecture (WebSocket broadcasts, email triggers), data aggregation (forecasting), and multi-entity relationships (items, suppliers, warehouses). It also let me showcase my ability to integrate third-party services (Google OAuth, barcode APIs, SMTP) and handle cross-cutting concerns like security, CORS, and audit logging."*

### 3. Architecture Decisions & Reasoning

| Decision | Why |
|----------|-----|
| **Spring Boot + React** | Industry-standard stack. Spring Boot gives production-ready features out of the box (security, JPA, WebSocket, mail). React with TypeScript ensures a type-safe, component-driven frontend. |
| **H2 instead of PostgreSQL** | Zero-config setup for reviewers and interviewers. The JPA repository layer is database-agnostic — switching to PostgreSQL/MySQL requires only a dependency and connection string change. |
| **Session tokens over JWT** | Simpler for this scope. JWTs add complexity (refresh tokens, token size, revocation) that wasn't needed. The `ConcurrentHashMap`-based approach demonstrates understanding of both patterns while keeping the codebase lean. |
| **STOMP over raw WebSocket** | STOMP provides a pub/sub model with topic routing. SockJS fallback ensures compatibility with environments that block WebSocket connections. |
| **Single-page app (no React Router)** | The app is a dashboard, not a multi-page site. Modals and panels keep the user in context. This avoids unnecessary routing complexity while keeping the UI fast. |
| **Server-side barcode proxy** | External barcode APIs don't support CORS. The backend proxies requests to avoid browser restrictions — a common real-world pattern. |
| **Auto PO generation** | Demonstrates event-driven design. When `InventoryService` detects a status transition, it delegates to `ReorderService`, which checks for existing open POs before creating new ones — preventing duplicate orders. |

### 4. Key Technical Concepts to Discuss

**Spring Security with Custom Filter:**
*"I implemented a custom `BearerTokenFilter` that intercepts requests, extracts the session token from the Authorization header, looks it up in the session store, and sets the Spring Security authentication context with the user's role. This lets me use Spring Security's built-in authorization rules (`hasRole`) on my endpoints."*

**WebSocket with STOMP:**
*"When any inventory change occurs, the `StockUpdateBroadcaster` service publishes an event to a STOMP topic. All connected frontend clients receive this event and reload their data. The frontend uses a custom `useWebSocket` hook that handles connection, subscription, auto-reconnect, and exposes a connection status indicator."*

**Audit Trail Pattern:**
*"Every mutation goes through the `AuditService`, which captures the action type, old and new values, the user who made the change, and a timestamp. This creates a complete change history per item — essential for compliance in real inventory systems. The audit data also powers the forecasting engine."*

**Demand Forecasting Algorithm:**
*"The forecast analyzes negative stock adjustments (sales/consumption) over a configurable time window. It calculates average daily consumption, extrapolates days until stockout, and recommends a reorder quantity based on a two-week supply buffer. It's a simple moving average approach — in production, you'd layer in seasonality and ML models, but this demonstrates the pattern."*

**Dynamic Pricing Engine:**
*"I implemented a stock-aware pricing engine that computes discounts dynamically based on the ratio of current stock to the minimum threshold. Items with low stock or out of stock keep their original price — scarcity means no discounts. But when stock is healthy and significantly above the threshold (2×, 3×, 4×), progressive discounts of 10%, 15%, and 20% are applied automatically. The key design decision was making these computed transient properties on the entity — no extra database columns, no stale data. Jackson serializes the getter methods automatically, and the ecommerce storefront displays the strikethrough original price alongside the discounted final price. This is inspired by how real e-commerce platforms like Amazon and Flipkart handle overstock clearance pricing."*

**State Machine (Purchase Orders):**
*"Purchase orders follow a defined lifecycle: PENDING → APPROVED → ORDERED → RECEIVED, with CANCELLED as an exit state from any stage. When a PO reaches RECEIVED, the system automatically adjusts the item's stock — closing the reorder loop. This is a practical example of a state machine pattern."*

### 5. Challenges I Faced

| Challenge | How I Solved It |
|-----------|----------------|
| **CORS issues between Vercel and Render** | Configured `CorsConfig` with environment-variable-based allowed origins, supporting both local dev and production URLs. |
| **Render free tier cold starts** | Backend takes ~30s to wake up. Added a health check endpoint (`/api/inventory/summary`) for Render to ping, and the frontend PWA caches API responses so the app remains usable during cold starts. |
| **Barcode API inconsistency** | Different barcode databases return different response formats. Built a fallback chain in `BarcodeLookupController` that tries 6 APIs sequentially and normalizes the response. |
| **WebSocket reconnection** | Initial implementation didn't handle disconnects gracefully. Added auto-reconnect logic with a 5-second interval and a visual connection indicator so users know when they're seeing live vs. stale data. |
| **Role-based UI rendering** | The frontend conditionally renders buttons (edit, delete, add) based on the user's role. Used a clean pattern where the `user` object in state carries the role, and components check it before rendering action controls. |
| **Dynamic pricing without data duplication** | Needed pricing that stays in sync with stock changes in real time. Instead of storing `discountPercentage` and `finalPrice` as separate DB columns (which could go stale), used transient computed getters on the JPA entity. Jackson auto-serializes them, so every API response always reflects the latest stock state. |
| **Cross-project pricing consistency** | The inventory backend computes dynamic prices, and the ecommerce storefront (separate Spring Boot app) consumes them via REST. Ensured the ecommerce `InventoryItemDTO` includes the computed fields so both dashboards show identical prices. |

### 6. What I Would Improve for Production

- **Database:** Migrate from H2 to PostgreSQL for persistence and scalability.
- **Auth:** Switch to JWT with refresh tokens and store sessions in Redis for horizontal scaling.
- **Forecasting:** Integrate time-series analysis or ML-based demand prediction.
- **Testing:** Add unit tests (JUnit + Mockito), integration tests (Spring Boot Test), and E2E tests (Playwright/Cypress).
- **CI/CD:** Add GitHub Actions for automated build, test, and deploy pipeline.
- **Monitoring:** Integrate application monitoring (Spring Actuator + Prometheus/Grafana) and error tracking (Sentry).
- **Caching:** Add Redis caching for frequently accessed endpoints like `/summary` and `/paged`.
- **Search:** Replace basic LIKE queries with Elasticsearch for full-text search across inventory.
- **Dynamic Pricing:** Add configurable discount tiers per category, time-based flash sales, and ML-driven price optimization based on historical sales velocity.
- **Multi-tenancy:** Support multiple organizations with data isolation.

### 7. How to Walk Through a Live Demo

1. **Open the dashboard** — point out summary cards, charts, and the live indicator
2. **Search and filter** — show filtering by category, status, and free-text search
3. **Log in** — demonstrate Google OAuth flow and how UI controls appear based on role
4. **Add an item** — create a new product with a price and show it appear in the table
5. **Show dynamic pricing** — point out items with high stock showing strikethrough prices and discount badges in the Price column, and green final prices in the Final Price column
6. **Adjust stock below threshold** — show the status transition from Healthy to Low, the alert banner appearing, the discount disappearing (price reverts to full), and the auto-generated purchase order
7. **Open audit log** — show the complete change history for that item
8. **Check forecast** — show the demand forecast panel with predicted stockout date
9. **Scan a barcode** — demonstrate the camera scanner or manual entry with external lookup
10. **Manage a PO** — walk through the approve → order → receive lifecycle and show stock auto-increment
11. **Show ecommerce storefront** — open the ecommerce frontend to show strikethrough MRP + discounted price on product cards and detail page, with "You save ₹X" messaging
12. **Show real-time** — open two browser tabs and show changes reflecting instantly via WebSocket
13. **Export CSV** — download the inventory CSV showing Price, Discount %, and Final Price columns

---

## Possible Interview Questions & Answers

### Architecture & Design

**Q1: Why did you choose to compute dynamic pricing on the backend instead of the frontend?**

*"Computing pricing on the backend ensures a single source of truth. If I computed discounts on the frontend, different clients (the inventory dashboard, the ecommerce storefront, the CSV export, and any future mobile app) would all need to duplicate the same pricing logic — and they could drift out of sync. By computing it server-side in the entity, every API consumer gets consistent, correct prices automatically. It also prevents price manipulation by clients — a user can't bypass the discount rules by modifying frontend code."*

**Q2: Why did you use transient getter methods instead of storing discount/finalPrice in the database?**

*"Storing computed values in the database creates a data synchronization problem. Every time stock changes (adjustment, purchase order received, manual update), I'd need to recalculate and update the pricing columns — adding write overhead and risking stale data if any code path forgets to update them. With transient getters, the values are derived from `price`, `currentStock`, `minThreshold`, and `status` on every request. There's zero storage overhead, zero write overhead, and zero chance of stale pricing. The trade-off is a tiny CPU cost per serialization, which is negligible for this use case."*

**Q3: How does the inventory system communicate with the ecommerce storefront?**

*"The ecommerce backend is a separate Spring Boot application that acts as a consumer of the inventory API. It has a `StockPulseClient` service that calls the inventory REST endpoints (`/api/inventory`) and receives the full item payload including computed fields like `discountPercentage` and `finalPrice`. The ecommerce `ProductService` maps these into its own `ProductDTO` for the storefront. This is a microservice-like architecture where the inventory system is the system of record for products and pricing, and the ecommerce system is a downstream consumer."*

**Q4: What happens if the inventory API is down — does the ecommerce site break?**

*"Currently, yes — the ecommerce frontend shows a 'server waking up' message during cold starts. In production, I'd add a caching layer (Redis) in the ecommerce backend to cache product data with a TTL. I'd also implement a circuit breaker pattern (using Resilience4j) to gracefully degrade — showing cached prices instead of failing outright. The retry logic with exponential backoff is already implemented in the ecommerce API client."*

**Q5: How would you handle pricing in a high-concurrency scenario (thousands of users)?**

*"The current approach scales well for read-heavy workloads because pricing is computed on the fly — no locks, no shared mutable state. For extremely high throughput, I'd introduce a caching layer: compute and cache the pricing periodically (e.g., every minute) in Redis, keyed by item ID. Stock adjustments would invalidate the cache entry. For write concurrency, the `@Transactional` annotation and JPA's optimistic locking prevent race conditions on stock updates."*

### Dynamic Pricing Specifics

**Q6: Why did you choose stock-to-threshold ratio instead of absolute stock numbers for discount tiers?**

*"Using the ratio normalizes the discount logic across items with very different stock profiles. A warehouse item with a threshold of 100 and current stock of 200 is in the same relative position as a boutique item with threshold 5 and stock 10 — both are at 2× their threshold. Using absolute numbers would mean discount tiers that work for one category would be meaningless for another. The ratio-based approach makes the pricing engine category-agnostic without per-item configuration."*

**Q7: Why do low-stock items keep their full price instead of getting a premium markup?**

*"In a real e-commerce scenario, scarcity-based markup (surge pricing) can damage customer trust and brand reputation — it's why even Amazon rarely increases prices on scarce items. Keeping the original price for low-stock items is the safer business decision. The system already handles scarcity by generating purchase orders to replenish stock. If premium pricing were needed, it would be a business-configurable option, not a default behavior."*

**Q8: How would you extend this pricing engine for production use?**

*"Several enhancements: (1) Make discount tiers configurable per category via an admin UI instead of hardcoded. (2) Add time-based pricing — flash sales, seasonal discounts. (3) Integrate sales velocity data from the audit log to apply smarter discounts (slow-moving stock gets deeper discounts). (4) Add a price floor to prevent discounts from going below cost. (5) A/B test different discount strategies and measure their impact on sales velocity and revenue."*

### Spring Boot & Backend

**Q9: How does Jackson serialize the computed `getFinalPrice()` and `getDiscountPercentage()` methods without any annotations?**

*"Jackson's default behavior is to serialize all public getter methods (Java bean convention). A method named `getFinalPrice()` is serialized as `finalPrice` in JSON, and `getDiscountPercentage()` as `discountPercentage`. Since these methods don't have corresponding JPA `@Column` annotations or backing fields that JPA maps, Hibernate ignores them during persistence. So they exist only in the JSON output — zero database impact. If I wanted to exclude a getter from serialization, I'd use `@JsonIgnore`."*

**Q10: Explain the Spring Security flow — how does a request get authenticated and authorized?**

*"When a request hits the server, it passes through the `AuthTokenFilter` (a custom `OncePerRequestFilter`). The filter extracts the Bearer token from the Authorization header, looks it up in the in-memory session store (`ConcurrentHashMap<String, SessionInfo>`), and if valid, creates a `UsernamePasswordAuthenticationToken` with the user's email and role, then sets it in the `SecurityContextHolder`. Downstream, my endpoint security rules (`hasRole('ADMIN')`, `hasAnyRole('ADMIN','MANAGER')`) check this authentication context. GET endpoints are open to all; POST/PUT require MANAGER+; DELETE requires ADMIN."*

**Q11: Why H2 instead of PostgreSQL, and how hard is it to switch?**

*"H2 was chosen for zero-config setup — any reviewer can clone and run the project without installing a database. But the switch to PostgreSQL is trivial because I'm using Spring Data JPA. The repository interfaces (`InventoryItemRepository`, etc.) are database-agnostic. I'd add the PostgreSQL driver dependency, change the datasource URL in `application.properties`, and update `spring.jpa.database-platform`. No code changes to the service or repository layer. The `DataSeeder` would still work as-is."*

### Frontend & UX

**Q12: How does the inventory table display dynamic pricing visually?**

*"The Price column shows the original MRP. When an item has a discount, the original price gets a CSS `line-through` (strikethrough) effect with muted color, and a small green badge shows 'X% OFF'. The adjacent Final Price column shows the effective selling price in green text for discounted items, and normal text for full-price items. This visual pattern is consistent with how major e-commerce sites (Amazon, Flipkart) display discounts — users immediately recognize the pattern."*

**Q13: How do you handle real-time price updates when stock changes?**

*"When any stock adjustment occurs, the `StockUpdateBroadcaster` sends a WebSocket event to all connected clients via STOMP. The frontend's `useWebSocket` hook receives this event and triggers a full data reload from the API. Since pricing is computed server-side per request, the reloaded data automatically includes updated discount percentages and final prices reflecting the new stock levels. So if I reduce stock from 50 to 8 (below 2× threshold for a threshold of 5), the discount disappears in real time across all connected browsers."*

**Q14: Why is the dashboard a single-page app without React Router?**

*"The inventory dashboard is a control panel — users need to see everything in context. Modals for editing, audit logs, and forecasts overlay the main table without losing the user's scroll position or filter state. React Router would add URL-based navigation that's unnecessary for a dashboard workflow. The ecommerce storefront, on the other hand, does use React Router because customers navigate between home, product detail, cart, and checkout — distinct pages with distinct URLs."*

### System Design & Scalability

**Q15: How would you scale this system to handle 100,000+ inventory items?**

*"Several layers: (1) Database — migrate to PostgreSQL with proper indexing on `sku`, `category`, `status`, and composite indexes for filtered queries. (2) Pagination — already implemented server-side with Spring Data's `Pageable`. (3) Caching — Redis cache for summary counts and frequently filtered pages with cache invalidation on writes. (4) Search — Elasticsearch for full-text search instead of SQL LIKE queries. (5) Read replicas — separate read and write traffic. The current architecture already supports horizontal scaling — the session store would need to move from in-memory `ConcurrentHashMap` to Redis."*

**Q16: What's the difference between how the inventory dashboard and the ecommerce storefront consume the same data?**

*"The inventory dashboard calls the inventory API directly (`/api/inventory`) and displays the full admin view — editable prices, stock adjustments, audit logs, purchase orders, warehouse breakdown. The ecommerce storefront goes through its own backend (`/api/products`), which calls the inventory API internally via `StockPulseClient`, maps the response to a customer-facing `ProductDTO` (hiding internal fields like `minThreshold` and `supplierId`), and exposes only what customers need: name, price, finalPrice, discountPercentage, stock availability. This separation of concerns means I can evolve customer-facing features without touching the admin dashboard."*

**Q17: Walk me through what happens end-to-end when a customer buys a product.**

*"The customer adds a product to their cart (stored in the ecommerce database). On checkout, the `OrderService` creates an `Order` record with `OrderItems`. For each item, it calls the inventory API's `/adjust` endpoint with a negative delta to reduce stock. The inventory backend adjusts the stock, recalculates the status (potentially transitioning to LOW or OUT_OF_STOCK), logs the adjustment in the audit trail, broadcasts a WebSocket event to the admin dashboard, and if the status transitions to LOW, auto-generates a purchase order and sends an email alert. The dynamic pricing also updates immediately — if the stock drops below 2× threshold, the discount disappears from the ecommerce storefront. All of this happens within a single transactional flow."*

---
