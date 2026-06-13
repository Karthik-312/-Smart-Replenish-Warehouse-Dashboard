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

The backend allows requests from origins listed in `CORS_ALLOWED_ORIGINS` (default: `http://localhost:5173`).

## Deploy for Free (No PostgreSQL)

This project keeps the built-in **H2 in-memory database** — no external database signup required. On each backend start, sample inventory is loaded from `data.sql`. Changes you make in the dashboard reset when the Render free service restarts or wakes from sleep; that is fine for a portfolio demo.

| Service  | Platform | What it hosts        |
|----------|----------|----------------------|
| Frontend | Vercel   | React dashboard      |
| Backend  | Render   | Spring Boot API      |

### 1. Deploy the backend (Render)

1. Push this repo to GitHub.
2. In [Render](https://render.com), create a **Blueprint** from the repo (uses `render.yaml`), or add a **Web Service** manually:
   - **Root directory:** `backend`
   - **Build command:** `./gradlew clean build -x test`
   - **Start command:** `java -jar build/libs/stockpulse-1.0.0.jar`
3. Set environment variables:
   - `SPRING_PROFILES_ACTIVE` = `prod`
   - `CORS_ALLOWED_ORIGINS` = your Vercel URL (e.g. `https://your-app.vercel.app`)
4. After deploy, note the API URL, e.g. `https://stockpulse-api.onrender.com`.

Free tier note: the service sleeps after ~15 minutes of inactivity and takes ~30 seconds to wake on the first request.

### 2. Deploy the frontend (Vercel)

1. In [Vercel](https://vercel.com), import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-render-url.onrender.com/api/inventory`
4. Deploy. Vercel uses `frontend/vercel.json` automatically.

### 3. Connect them

1. Copy your live Vercel URL into Render’s `CORS_ALLOWED_ORIGINS`.
2. Redeploy the backend if you changed CORS after the first deploy.

Local development is unchanged — see **Running the Application** above.
