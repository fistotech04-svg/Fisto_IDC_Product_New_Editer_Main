// Backend/analytics_tracking/analyticsRoutes.js
import express from "express";
import {
  recordSessionStart,
  recordHeartbeat,
  recordSessionEnd,
  recordPageFlip,
  getFlipbookAnalytics,
  getUserAnalytics
} from "./analyticsController.js";

const router = express.Router();

/**
 * 1. Tracking Event Endpoints (Client Flipbook viewer)
 */
// When flipbook link is opened
router.post("/session-start", recordSessionStart);

// Periodic heartbeat every 15-30s while viewer is active
router.post("/heartbeat", recordHeartbeat);

// On tab exit / navigation (sendBeacon or unload)
router.post(
  "/session-end",
  express.text({ type: "*/*" }),
  (req, res, next) => {
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {}
    }
    next();
  },
  recordSessionEnd
);

// When user flips/turns a page
router.post("/page-flip", recordPageFlip);

/**
 * 2. Reporting / Dashboard Endpoints (Flipbook Creator Dashboard)
 */
// Get analytics for a single flipbook
router.get("/book/:v_id", getFlipbookAnalytics);

// Get overall analytics for all flipbooks of a user
router.get("/user/:userEmail", getUserAnalytics);

export default router;
