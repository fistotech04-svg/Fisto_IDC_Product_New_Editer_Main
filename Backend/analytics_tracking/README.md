# Analytics & Tracking Module (`Backend/analytics_tracking/`)

This directory contains the entire in-house analytics and tracking system for Flipibook without relying on Google Analytics or third-party tracking scripts.

---

## 📁 File Structure
- `analyticsModel.js` — Mongoose Schema (`FlipbookSessionAnalytics`) storing session ID, location (country, city, region, coordinates), device (type, OS, browser), duration (seconds), pages viewed, and timestamps.
- `geoIpService.js` — Offline IP address detection and GeoIP resolution (uses `geoip-lite`).
- `deviceService.js` — User-Agent parser to categorize device type (Desktop/Mobile/Tablet), OS, and Browser.
- `analyticsController.js` — Express controller logic for tracking sessions, heartbeats, page flips, and generating analytics aggregates.
- `analyticsRoutes.js` — Express router mounted at `/api/analytics`.
- `index.js` — Barrel export for clean importing.

---

## 📡 API Endpoints

### 1. Tracking Endpoints (Called from Flipbook Reader / Share View)

#### `POST /api/analytics/session-start`
Called when the user opens the flipbook link.
- **Body**:
  ```json
  {
    "v_id": "flipbook_unique_id",
    "shareId": "share_id_or_empty",
    "sessionId": "uuid_v4_generated_on_client",
    "totalPages": 24,
    "referrer": "https://example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "uuid_v4",
    "location": { "country": "India", "city": "Chennai" },
    "device": "Desktop"
  }
  ```

#### `POST /api/analytics/heartbeat`
Called periodically (every 15–20s) while the user is actively viewing the book.
- **Body**:
  ```json
  {
    "sessionId": "uuid_v4",
    "durationSeconds": 45,
    "currentPage": 3
  }
  ```

#### `POST /api/analytics/session-end`
Called on page exit/unload (supports `navigator.sendBeacon`).
- **Body**:
  ```json
  {
    "sessionId": "uuid_v4",
    "durationSeconds": 182
  }
  ```

#### `POST /api/analytics/page-flip`
Called when the user turns a page.
- **Body**:
  ```json
  {
    "sessionId": "uuid_v4",
    "pageNumber": 5
  }
  ```

---

### 2. Dashboard / Reporting Endpoints (Called from Creator Analytics Tab)

#### `GET /api/analytics/book/:v_id?days=30`
Returns full analytics for a single flipbook:
- Total views & unique viewers
- Average reading duration (seconds)
- Country & city breakdown (with view counts and percentages)
- Device breakdown (Desktop vs Mobile vs Tablet)
- Browser & OS breakdown
- Views over time (daily timeseries for graphs)
- Recent viewer sessions

#### `GET /api/analytics/user/:userEmail`
Returns global analytics across all flipbooks belonging to a creator:
- Total views across all books
- Total reading hours
- Top performing flipbooks
- Top viewer countries
