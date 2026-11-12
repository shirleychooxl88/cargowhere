# Project Prompts Log

This document records all development prompts and instructions executed for **SG Carpark Live** (Singapore Real-Time Carpark Lots & LTA Transit Tracker).

---

## Prompt 1: Initial Frontend Application Build
**Timestamp:** 2026-11-12T01:11:53-08:00

### User Prompt:
```text
build a Singapore based carpark application that tracks real time carpark lots availability. build ust the front end for now, i will integrate the backend later.
```

### Outcome:
- Initialized **SG Carpark Live** with React 19, TypeScript, Tailwind CSS v4, and Leaflet.
- Built comprehensive Singapore carpark database covering HDB MSCPs, URA carparks, major shopping malls (ION Orchard, Suntec City, VivoCity, Marina Bay Sands, Jewel Changi, Jurong Point, Tampines Mall, etc.), and Changi Airport terminals.
- Implemented real-time lot tracking with vehicle types (Cars, Motorcycles, Heavy Vehicles) and availability thresholds.
- Created interactive Leaflet map view with dynamic lot counter pins, district quick-jumps, and GPS geolocation.
- Added detailed carpark drawer modal with full parking rates, Singapore Electronic Parking System (EPS) details, and an interactive **SGD Parking Fee Estimator**.
- Added saved carparks / favorites functionality persisted in `localStorage`.
- Added light/dark mode theme toggling with Tailwind v4 `@custom-variant dark`.

---

## Prompt 2: GitHub Repository Setup & Push
**Timestamp:** 2026-11-12T01:18:55-08:00

### User Prompt:
```text
git push https://ghp_************************************@github.com/shirleychooxl88/cargowhere.git
```
*(Note: Personal access token masked for security).*

### Outcome:
- Initialized local Git repository and configured safe directory.
- Created initial commit on `main` branch containing all 21 project files.
- Added remote origin and pushed codebase to `https://github.com/shirleychooxl88/cargowhere.git`.
- Sanitized remote URL in Git configuration to remove plaintext authentication tokens.

---

## Prompt 3: LTA DataMall Endpoints Integration
**Timestamp:** 2026-11-12T01:33:12-08:00

### User Prompt:
```text
add a serverless connection that pulls live data from LTA's datamall using the following endpoint: # Next buses at a stop (v3, the current version; refreshes every 20 seconds):
https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121
# To ask about one service only, add &ServiceNo=7

# Live carpark lots (HDB, LTA and URA):
https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2

# Traffic incidents and MRT/LRT service alerts:
https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts

# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>
```

### Outcome:
- Created Express entry point `server.ts` with Vite middlewares mounted in development mode (`"dev": "tsx server.ts"`).
- Added backend proxy routes for:
  - `CarParkAvailabilityv2` (`/api/lta/carparks`)
  - `v3/BusArrival` (`/api/lta/bus-arrival?BusStopCode=...&ServiceNo=...`)
  - `TrafficIncidents` (`/api/lta/traffic-incidents`)
  - `TrainServiceAlerts` (`/api/lta/train-alerts`)
  - `AccountKey` status checker (`/api/lta/status`)
- Added `LTA_ACCOUNT_KEY` to `.env.example`.
- Created **LTA Transit & Traffic Hub** modal in the UI with a 20-second auto-refresh timer for bus arrivals, expressway traffic incident feeds, and MRT train service alerts.

---

## Prompt 4: Root-Level `/api` Serverless Structure
**Timestamp:** 2026-11-12T01:38:46-08:00

### User Prompt:
```text
1. add a serverless connection that pulls live data from LTA's datamall using the following endpoint:

#Live carpark lots (HDB, LTA and URA):
https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2 

# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>

2. store this in /api folder at project root level (not src file)
3. include /health.ts and /carparkavailability.ts within the same sub folder
4. do not hardcode any key,I will input them later
```

### Outcome:
- Created `/api` directory at the project root level.
- Created `/api/carparkavailability.ts`:
  - Directly queries `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2`.
  - Reads `process.env.LTA_ACCOUNT_KEY` dynamically with zero hardcoded keys.
  - Sends `AccountKey: <LTA_ACCOUNT_KEY>` header.
  - Returns live LTA DataMall v2 lots, or Data.gov.sg fallback with status warning if key is unset.
  - Supports `$skip` pagination parameter.
- Created `/api/health.ts`:
  - Returns service status, uptime, timestamp, and reports whether `LTA_ACCOUNT_KEY` is configured.
- Mounted both serverless handlers in `server.ts` at `/api/carparkavailability` and `/api/health`.
- Updated client `carparkService.ts` to fetch from `/api/carparkavailability`.

---

## Prompt 5: Collate Prompts
**Timestamp:** 2026-11-12T01:47:10-08:00

### User Prompt:
```text
collate all of the prompts and store them as PROMPTS.md file
```

### Outcome:
- Generated this `PROMPTS.md` file summarizing all user prompts, timestamps, specifications, and implemented features.
