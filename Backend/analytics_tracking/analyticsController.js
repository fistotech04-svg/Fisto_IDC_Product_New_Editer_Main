// Backend/analytics_tracking/analyticsController.js
import FlipbookSessionAnalytics from "./analyticsModel.js";
import { extractClientIp, resolveIpLocation } from "./geoIpService.js";
import { parseUserAgent } from "./deviceService.js";
import Flipbook from "../models/Flipbook.js";

/**
 * 1. Start a new viewer session
 * Called as soon as the shared flipbook is opened
 */
export const recordSessionStart = async (req, res) => {
  try {
    const { v_id, shareId, sessionId, totalPages = 1, referrer = "" } = req.body;

    if (!v_id || !sessionId) {
      return res.status(400).json({ success: false, message: "v_id and sessionId are required" });
    }

    // Lookup flipbook to get owner email and title
    const book = await Flipbook.findOne({ v_id }).select("userEmail flipbookName viewsCount viewers").lean();
    const userEmail = book?.userEmail || "";
    const flipbookName = book?.flipbookName || "Untitled Flipbook";

    // Detect Client IP and Geographic Location
    const ip = extractClientIp(req);
    const location = resolveIpLocation(ip);

    // Detect Device & Browser
    const device = parseUserAgent(req.headers["user-agent"]);

    // Clean Referrer
    const cleanReferrer = referrer || req.headers["referer"] || "Direct";

    // Create session analytics record (upsert to prevent duplicate sessions if reloaded)
    const session = await FlipbookSessionAnalytics.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          v_id,
          shareId: shareId || "",
          userEmail,
          flipbookName,
          sessionId,
          location,
          device,
          totalPages: Number(totalPages) || 1,
          pagesRead: [1],
          maxPageReached: 1,
          referrer: cleanReferrer,
          startedAt: new Date(),
          durationSeconds: 0,
          completed: false
        },
        $set: {
          lastHeartbeatAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Also update main Flipbook viewsCount counter if new session
    if (book) {
      try {
        await Flipbook.updateOne(
          { v_id },
          { 
            $inc: { viewsCount: 1 },
            $addToSet: { viewers: ip }
          }
        );
      } catch (e) {
        console.warn("[Flipbook viewsCount sync warning]:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      sessionId,
      location: {
        country: location.country,
        state: location.state,
        city: location.city
      },
      device: device.type
    });
  } catch (err) {
    console.error("[Analytics recordSessionStart Error]:", err);
    return res.status(500).json({ success: false, message: "Failed to record session start" });
  }
};

/**
 * 2. Record periodic heartbeat
 * Keeps active duration accurate and tracks reading depth
 */
export const recordHeartbeat = async (req, res) => {
  try {
    const { sessionId, durationSeconds = 0, currentPage = 1 } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const duration = Math.max(0, parseInt(durationSeconds, 10) || 0);
    const pageNum = Math.max(1, parseInt(currentPage, 10) || 1);

    await FlipbookSessionAnalytics.updateOne(
      { sessionId },
      {
        $set: {
          durationSeconds: duration,
          lastHeartbeatAt: new Date()
        },
        $addToSet: {
          pagesRead: pageNum
        },
        $max: {
          maxPageReached: pageNum
        }
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Analytics recordHeartbeat Error]:", err);
    return res.status(500).json({ success: false, message: "Heartbeat update failed" });
  }
};

/**
 * 3. End session (navigator.sendBeacon on tab exit or close)
 */
export const recordSessionEnd = async (req, res) => {
  try {
    let payload = req.body;

    // Handle beacon payload if sent as raw text
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }

    const { sessionId, durationSeconds = 0 } = payload || {};

    if (sessionId) {
      const finalDuration = Math.max(0, parseInt(durationSeconds, 10) || 0);

      await FlipbookSessionAnalytics.updateOne(
        { sessionId },
        {
          $set: {
            durationSeconds: finalDuration,
            endedAt: new Date(),
            completed: true
          }
        }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Analytics recordSessionEnd Error]:", err);
    return res.status(500).json({ success: false, message: "Session end recording failed" });
  }
};

/**
 * 4. Record single page flip event
 */
export const recordPageFlip = async (req, res) => {
  try {
    const { sessionId, pageNumber } = req.body;
    if (!sessionId || !pageNumber) {
      return res.status(400).json({ success: false, message: "sessionId and pageNumber required" });
    }

    const pageNum = parseInt(pageNumber, 10);

    await FlipbookSessionAnalytics.updateOne(
      { sessionId },
      {
        $addToSet: { pagesRead: pageNum },
        $max: { maxPageReached: pageNum }
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Analytics recordPageFlip Error]:", err);
    return res.status(500).json({ success: false, message: "Page flip recording failed" });
  }
};

/**
 * 5. Get comprehensive analytics for a single flipbook
 */
export const getFlipbookAnalytics = async (req, res) => {
  try {
    const { v_id } = req.params;
    const { days = 30 } = req.query;

    const daysNum = Math.min(365, Math.max(1, parseInt(days, 10) || 30));
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysNum);

    const baseFilter = { v_id };
    const dateFilter = { v_id, startedAt: { $gte: sinceDate } };

    // 1. Total Sessions (Views)
    const totalViews = await FlipbookSessionAnalytics.countDocuments(baseFilter);

    // 2. Unique IP / Viewers
    const uniqueIps = await FlipbookSessionAnalytics.distinct("location.ip", baseFilter);
    const uniqueViewers = uniqueIps.length;

    // 3. Average Duration & Completion metrics
    const durationStats = await FlipbookSessionAnalytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$durationSeconds" },
          totalDuration: { $sum: "$durationSeconds" },
          avgPagesRead: { $avg: { $size: "$pagesRead" } },
          avgMaxPage: { $avg: "$maxPageReached" }
        }
      }
    ]);

    const avgDuration = Math.round(durationStats[0]?.avgDuration || 0);
    const totalDuration = Math.round(durationStats[0]?.totalDuration || 0);
    const avgPagesRead = Math.round((durationStats[0]?.avgPagesRead || 1) * 10) / 10;

    // 4. Country Breakdown
    const countryStats = await FlipbookSessionAnalytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$location.country",
          code: { $first: "$location.countryCode" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const countries = countryStats.map(c => ({
      country: c._id || "Unknown",
      code: c.code || "",
      views: c.count,
      percentage: totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0
    }));

    // 4b. State Breakdown
    const stateStats = await FlipbookSessionAnalytics.aggregate([
      { $match: { ...baseFilter, "location.state": { $nin: ["", "Unknown"] } } },
      {
        $group: {
          _id: "$location.state",
          country: { $first: "$location.country" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const states = stateStats.map(s => ({
      state: s._id,
      country: s.country,
      views: s.count
    }));

    // 5. City Breakdown
    const cityStats = await FlipbookSessionAnalytics.aggregate([
      { $match: { ...baseFilter, "location.city": { $ne: "Unknown" } } },
      {
        $group: {
          _id: "$location.city",
          country: { $first: "$location.country" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const cities = cityStats.map(c => ({
      city: c._id,
      country: c.country,
      views: c.count
    }));

    // 6. Device Breakdown
    const deviceStats = await FlipbookSessionAnalytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$device.type",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const devices = deviceStats.map(d => ({
      type: d._id || "Desktop",
      views: d.count,
      percentage: totalViews > 0 ? Math.round((d.count / totalViews) * 100) : 0
    }));

    // 7. Browser Breakdown
    const browserStats = await FlipbookSessionAnalytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$device.browser",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const browsers = browserStats.map(b => ({
      browser: b._id || "Other",
      views: b.count
    }));

    // 8. Views Over Time (Daily)
    const dailyViews = await FlipbookSessionAnalytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
          views: { $sum: 1 },
          avgDuration: { $avg: "$durationSeconds" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 9. Recent Visitor Sessions
    const recentSessions = await FlipbookSessionAnalytics.find(baseFilter)
      .sort({ startedAt: -1 })
      .limit(10)
      .select("sessionId location device durationSeconds maxPageReached startedAt")
      .lean();

    return res.status(200).json({
      success: true,
      v_id,
      summary: {
        totalViews,
        uniqueViewers,
        avgDurationSeconds: avgDuration,
        totalDurationSeconds: totalDuration,
        avgPagesRead
      },
      countries,
      states,
      cities,
      devices,
      browsers,
      dailyViews,
      recentSessions
    });
  } catch (err) {
    console.error("[Analytics getFlipbookAnalytics Error]:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

/**
 * 6. Get overall analytics across all flipbooks for a user
 */
export const getUserAnalytics = async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail is required" });
    }

    const filter = { userEmail };

    const totalViews = await FlipbookSessionAnalytics.countDocuments(filter);
    const uniqueIps = await FlipbookSessionAnalytics.distinct("location.ip", filter);

    const stats = await FlipbookSessionAnalytics.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$durationSeconds" },
          totalDuration: { $sum: "$durationSeconds" }
        }
      }
    ]);

    // Top books by views
    const topBooks = await FlipbookSessionAnalytics.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$v_id",
          flipbookName: { $first: "$flipbookName" },
          views: { $sum: 1 },
          avgDuration: { $avg: "$durationSeconds" }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 6 }
    ]);

    // Top Countries
    const topCountries = await FlipbookSessionAnalytics.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$location.country",
          code: { $first: "$location.countryCode" },
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 6 }
    ]);

    // Top States
    const topStates = await FlipbookSessionAnalytics.aggregate([
      { $match: { ...filter, "location.state": { $nin: ["", "Unknown"] } } },
      {
        $group: {
          _id: "$location.state",
          country: { $first: "$location.country" },
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 6 }
    ]);

    // Devices
    const devices = await FlipbookSessionAnalytics.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$device.type",
          views: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      userEmail,
      totalViews,
      uniqueVisitors: uniqueIps.length,
      avgDurationSeconds: Math.round(stats[0]?.avgDuration || 0),
      totalDurationSeconds: Math.round(stats[0]?.totalDuration || 0),
      topBooks: topBooks.map(b => ({
        v_id: b._id,
        name: b.flipbookName || "Untitled",
        views: b.views,
        avgDurationSeconds: Math.round(b.avgDuration || 0)
      })),
      topCountries: topCountries.map(c => ({
        country: c._id || "Unknown",
        code: c.code || "",
        views: c.views
      })),
      topStates: topStates.map(s => ({
        state: s._id || "Unknown",
        country: s.country || "",
        views: s.views
      })),
      devices: devices.map(d => ({
        type: d._id || "Desktop",
        views: d.views
      }))
    });
  } catch (err) {
    console.error("[Analytics getUserAnalytics Error]:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch user analytics" });
  }
};
