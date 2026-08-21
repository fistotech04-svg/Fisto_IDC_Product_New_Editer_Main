import express from "express";
import Flipbook from "../../models/Flipbook.js";
import Profile from "../../models/Profile.js";
import User from "../../models/auth.js";

const router = express.Router();

/**
 * @route   GET /api/explore/published
 * @desc    Get all published flipbooks across all users with author details
 * @access  Public
 */
router.get("/published", async (req, res) => {
    try {
        // Fetch all flipbooks where isPublished is true
        const books = await Flipbook.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .lean();

        // Extract distinct user emails
        const userEmails = [...new Set(books.map(b => b.userEmail).filter(Boolean))];

        // Fetch corresponding profiles and users to enrich author information
        const safeRegexList = userEmails.map(e => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        const [profiles, users] = await Promise.all([
            Profile.find({ emailId: { $in: safeRegexList } }).lean(),
            User.find({ emailId: { $in: safeRegexList } }).lean()
        ]);

        const profileMap = {};
        profiles.forEach(p => {
            if (p.emailId) profileMap[p.emailId.toLowerCase()] = p;
        });
        users.forEach(u => {
            if (u.emailId) {
                const key = u.emailId.toLowerCase();
                if (!profileMap[key]) {
                    profileMap[key] = u;
                } else if (!profileMap[key].name && u.name) {
                    profileMap[key].name = u.name;
                }
            }
        });

        const enrichedBooks = books.map(book => {
            const p = profileMap[book.userEmail?.toLowerCase()] || {};
            const authorName = p.name || (book.userEmail ? book.userEmail.split('@')[0] : 'Creator');
            const city = p.city || p.state || (p.country && p.country !== 'INDIA' ? p.country : '') || 'Coimbatore';
            const authorPicture = p.picture || null;
            const authorBgColor = p.avatarBgColor || '#E8D4C8';

            return {
                ...book,
                authorName,
                city,
                authorPicture,
                authorBgColor
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedBooks.length,
            books: enrichedBooks
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
