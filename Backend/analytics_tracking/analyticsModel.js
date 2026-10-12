// Backend/analytics_tracking/analyticsModel.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    ip: { type: String, default: "" },
    country: { type: String, default: "Unknown" },
    countryCode: { type: String, default: "" },
    state: { type: String, default: "" },
    region: { type: String, default: "" },
    city: { type: String, default: "Unknown" },
    timezone: { type: String, default: "" },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 }
  },
  { _id: false }
);

const deviceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Desktop", "Mobile", "Tablet", "Unknown"], default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "" }
  },
  { _id: false }
);

const sessionAnalyticsSchema = new mongoose.Schema(
  {
    v_id: {
      type: String,
      required: true,
      index: true
    },
    shareId: {
      type: String,
      default: "",
      index: true
    },
    userEmail: {
      type: String,
      default: "",
      index: true
    },
    flipbookName: {
      type: String,
      default: ""
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // GeoIP Location
    location: {
      type: locationSchema,
      default: () => ({})
    },

    // Device / Browser Specs
    device: {
      type: deviceSchema,
      default: () => ({})
    },

    // Engagement & Duration
    durationSeconds: {
      type: Number,
      default: 0
    },
    totalPages: {
      type: Number,
      default: 0
    },
    pagesRead: {
      type: [Number],
      default: [1]
    },
    maxPageReached: {
      type: Number,
      default: 1
    },

    // Traffic Source
    referrer: {
      type: String,
      default: "Direct"
    },

    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-speed queries on dashboards
sessionAnalyticsSchema.index({ v_id: 1, startedAt: -1 });
sessionAnalyticsSchema.index({ userEmail: 1, startedAt: -1 });
sessionAnalyticsSchema.index({ "location.country": 1 });

const FlipbookSessionAnalytics = mongoose.model(
  "FlipbookSessionAnalytics",
  sessionAnalyticsSchema
);

export default FlipbookSessionAnalytics;
