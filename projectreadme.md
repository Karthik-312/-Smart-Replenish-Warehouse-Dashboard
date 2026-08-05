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
- [Interview Context](#interview-context)

---

## Features

### Core Inventory Management
- Full CRUD operations for inventory items with paginated, filterable listings
- Search and filter by name, SKU, category, or stock status
- Quick stock adjustments (+/-) per item or in bulk
- CSV export of inventory data
- Dashboard summary cards (total items, low stock, out of stock)

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
│   │   │   ├── InventoryItem.java              # Core inventory entity
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
│   │   │   ├── InventoryTable.tsx             # Paginated data table
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
│   │       ├── exportCsv.ts                   # CSV export utility
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

## Interview Context

> Use this section to explain the project confidently in interviews. It covers the "why" behind each design decision, the challenges faced, and how to talk about the system end to end.

### 1. Project Introduction (Elevator Pitch)

*"StockPulse is a full-stack inventory replenishment system I built from scratch using Spring Boot and React. It goes beyond basic CRUD — it features real-time WebSocket updates, demand forecasting based on historical consumption patterns, automated purchase order generation when stock drops below thresholds, multi-warehouse stock tracking, barcode scanning with multi-source external API lookups, role-based access control via Google OAuth, and email notifications for critical stock levels. It's deployed on Render (backend) and Vercel (frontend) with a CI/CD pipeline."*

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

### 6. What I Would Improve for Production

- **Database:** Migrate from H2 to PostgreSQL for persistence and scalability.
- **Auth:** Switch to JWT with refresh tokens and store sessions in Redis for horizontal scaling.
- **Forecasting:** Integrate time-series analysis or ML-based demand prediction.
- **Testing:** Add unit tests (JUnit + Mockito), integration tests (Spring Boot Test), and E2E tests (Playwright/Cypress).
- **CI/CD:** Add GitHub Actions for automated build, test, and deploy pipeline.
- **Monitoring:** Integrate application monitoring (Spring Actuator + Prometheus/Grafana) and error tracking (Sentry).
- **Caching:** Add Redis caching for frequently accessed endpoints like `/summary` and `/paged`.
- **Search:** Replace basic LIKE queries with Elasticsearch for full-text search across inventory.
- **Multi-tenancy:** Support multiple organizations with data isolation.

### 7. How to Walk Through a Live Demo

1. **Open the dashboard** — point out summary cards, charts, and the live indicator
2. **Search and filter** — show filtering by category, status, and free-text search
3. **Log in** — demonstrate Google OAuth flow and how UI controls appear based on role
4. **Add an item** — create a new product and show it appear in the table
5. **Adjust stock below threshold** — show the status transition from Healthy to Low, the alert banner appearing, and the auto-generated purchase order
6. **Open audit log** — show the complete change history for that item
7. **Check forecast** — show the demand forecast panel with predicted stockout date
8. **Scan a barcode** — demonstrate the camera scanner or manual entry with external lookup
9. **Manage a PO** — walk through the approve → order → receive lifecycle and show stock auto-increment
10. **Show real-time** — open two browser tabs and show changes reflecting instantly via WebSocket

---
