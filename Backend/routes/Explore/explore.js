import express from "express";
import Flipbook from "../../models/Flipbook.js";

const router = express.Router();

/**
 * @route   GET /api/explore/published
 * @desc    Get all published flipbooks across all users
 * @access  Public
 */
router.get("/published", async (req, res) => {
    try {
        // Fetch all flipbooks where isPublished is true
        const books = await Flipbook.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: books.length,
            books
        });
    } catch (error) {
        console.error("[Explore API Error]: Failed to fetch published flipbooks", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching published flipbooks",
            error: error.message
        });
    }
});

export default router;
