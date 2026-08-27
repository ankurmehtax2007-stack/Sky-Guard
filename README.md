# Sky-Gaurd
# Data Engineering

The data-engineering pipeline prepares a hybrid weather dataset by
combining SkyGuard station observations with ERA5 reanalysis data.

#Pipeline

- SkyGuard dataset validation and cleaning
- ERA5 data collection through the Copernicus Climate Data Store API
- ERA5 preprocessing and unit conversion
- Spatial station-to-ERA5 grid matching
- Temporal matching
- Hybrid dataset creation
- Data-quality and duplicate analysis
- Anomaly ground-truth preservation
- Chronological train/test/final-test splitting

### Final Dataset

- 435,360 hybrid observations
- 20 weather stations
- 100% ERA5 match rate
- Coverage: January 2024 – June 2026

| Dataset | Period | Rows |
|---|---|---:|
| Training | 2024 | 175,680 |
| Test | 2025 | 175,200 |
| Final Test | 2026 | 84,480 |

### Frontend

- React.js - UI development
- JavaScript / JSX - Application logic
- Vite - Development server and build tool
- CSS - Styling and responsive design
- React Router - Page navigation
- Recharts - Sensor data visualization
- Fetch - Backend API communication
- WebSocket - Real-time sensor updates

---

## Backend

The backend is a Node.js/Express REST API that serves as the core of the Sky-Guard platform. It ingests live weather readings via MQTT, persists them to MongoDB, runs anomaly detection through an ML service, and exposes data over HTTP and WebSocket to connected clients.

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose |
| Messaging | MQTT (mqtt v5) |
| Real-time | WebSocket (ws) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Validation | Zod |
| Logging | Pino + pino-http |
| Metrics | prom-client (Prometheus) |

### Key Features

- **MQTT ingestion** – subscribes to `weather/readings/<stationId>` and persists each reading
- **ML integration** – forwards readings to the ML service for anomaly scoring; a retry worker handles failures
- **Anomaly retry worker** – re-processes unscored readings on a background interval
- **WebSocket broadcast** – pushes live readings to all connected dashboard clients
- **Auth** – JWT-based login/refresh with cookie transport
- **Health endpoint** – `/api/health` for liveness/readiness probes
- **Prometheus metrics** – exposed at `/metrics`

### API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/readings` | List weather readings |
| GET | `/api/anomalies` | List detected anomalies |
| GET | `/api/health` | Health check |
| GET | `/metrics` | Prometheus metrics scrape |

### Environment Variables

```env
PORT=3000
MONGODB_URI=<your-mongodb-connection-string>
MQTT_BROKER=mqtt-broker
MQTT_PORT=1883
ML_SERVICE_URL=http://ml-service:8000
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
NODE_ENV=production
```

### Running Locally

```bash
cd backend
npm install
npm run dev   # uses nodemon
```

---

## Simulator

The simulator is a lightweight Node.js process that mimics a network of weather stations by generating synthetic readings and publishing them to the MQTT broker. It is used for development and testing without real hardware.

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Messaging | MQTT (mqtt v5) |

### How It Works

1. Loads a list of stations from `config/stations.js`
2. Connects to the MQTT broker
3. On connect, immediately publishes an initial reading for every station
4. Publishes a fresh reading every **5 seconds** per station to `weather/readings/<stationId>`

### Anomaly Injection

The `anomalyInjector` randomly introduces sensor faults to simulate real-world degradation:

| Anomaly Type | Description |
|---|---|
| Spike | ±10–20 °C temperature spike |
| Humidity drift | ±20–40 % humidity deviation |
| Pressure spike | ±30–60 hPa pressure spike |
| Frozen sensor | A sensor reports the same value for 10 consecutive readings |

Each reading has a **5% probability** of having an anomaly injected.

### Environment Variables

```env
MQTT_BROKER=mqtt-broker
MQTT_PORT=1883
```

### Running Locally

```bash
cd simulator
npm install
npm run dev   # uses nodemon
```
