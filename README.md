# StockPulse

Professional inventory replenishment system with a Spring Boot backend and React dashboard.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Java 21, Spring Boot 3.x, Spring Data JPA, H2   |
| Build    | Gradle                                          |
| Frontend | React (Vite), Tailwind CSS, Lucide React        |
| API      | REST / JSON                                     |

## Project Structure

```
stockpulse-inventory/
├── backend/     # Spring Boot API (port 8080)
└── frontend/    # React dashboard (port 5173)
```

## Prerequisites

- **JDK 21** (Gradle toolchain will use Java 21)
- **Node.js 18+**

## Running the Application

### Backend

```bash
cd backend
./gradlew bootRun        # Linux/macOS
gradlew.bat bootRun      # Windows
```

API base URL: `http://localhost:8080/api/inventory`

H2 console (dev): `http://localhost:8080/h2-console`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard: `http://localhost:5173`

## API Endpoints

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/inventory`              | List all items           |
| GET    | `/api/inventory/summary`      | Status overview counts   |
| GET    | `/api/inventory/{id}`         | Get single item          |
| POST   | `/api/inventory`              | Create item              |
| PUT    | `/api/inventory/{id}`         | Update item              |
| POST   | `/api/inventory/{id}/adjust?delta=N` | Adjust stock (+/-) |
| DELETE | `/api/inventory/{id}`         | Delete item              |

## Stock Status Logic

- **Healthy** — `currentStock > minThreshold`
- **Low** — `0 < currentStock <= minThreshold` → console: `REORDER ALERT: [SKU] is low!`
- **Out of Stock** — `currentStock <= 0`

Status is recalculated automatically on create, update, and stock adjustments.

## CORS

The backend allows requests from `http://localhost:5173` via `@CrossOrigin` on the controller and a global CORS config.
