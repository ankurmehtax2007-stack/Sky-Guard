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

