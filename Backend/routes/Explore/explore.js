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

/**
 * @route   GET /api/explore/creator
 * @desc    Get a specific creator's profile info and all their published flipbooks
 * @access  Public
 */
router.get("/creator", async (req, res) => {
    try {
        let rawEmail = req.query.emailId || req.query.email;
        const shareId = req.query.shareId;
        const v_id = req.query.v_id || req.query.vId;

        // If email is not directly provided, resolve creator email via flipbook shareId or v_id from DB
        if (!rawEmail && (shareId || v_id)) {
            const query = [];
            if (shareId) {
                query.push({ "Customized_Settings.Visibility.shareId": shareId });
                query.push({ "Visibility.shareId": shareId });
                query.push({ "share.shareId": shareId });
                query.push({ v_id: shareId });
            }
            if (v_id) {
                query.push({ v_id: v_id });
            }
            const foundBook = await Flipbook.findOne({ $or: query }).lean();
            if (foundBook && foundBook.userEmail) {
                rawEmail = foundBook.userEmail;
            }
        }

        if (!rawEmail) {
            return res.status(400).json({ success: false, message: "emailId, shareId, or v_id query parameter is required" });
        }

        const normalizedEmail = rawEmail.trim().toLowerCase();
        const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        // Fetch user profile, user auth, and published flipbooks in parallel
        const [profile, user, publishedBooks] = await Promise.all([
            Profile.findOne({ emailId: safeRegex }).lean(),
            User.findOne({ emailId: safeRegex }).lean(),
            Flipbook.find({ userEmail: safeRegex, isPublished: true }).sort({ createdAt: -1 }).lean()
        ]);

        const mergedProfile = {
            name: profile?.name || user?.name || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            emailId: normalizedEmail,
            picture: profile?.picture || user?.picture || null,
            avatarBgColor: profile?.avatarBgColor || '#E8D4C8',
            bannerBg: profile?.bannerBg || { type: 'gradient', value: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' },
            about: profile?.about || '',
            mobile: profile?.mobile || '',
            companyName: profile?.companyName || '',
            industryType: profile?.industryType || '',
            companyEmail: profile?.companyEmail || '',
            website: profile?.website || '',
            services: profile?.services || [],
            address1: profile?.address1 || '',
            address2: profile?.address2 || '',
            city: profile?.city || '',
            pincode: profile?.pincode || '',
            state: profile?.state || '',
            country: profile?.country || 'INDIA',
            socials: profile?.socials || {}
        };

        return res.status(200).json({
            success: true,
            profile: mergedProfile,
            books: publishedBooks || []
        });
    } catch (error) {
        console.error("[Explore Creator API Error]:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching creator profile",
            error: error.message
        });
    }
});

export default router;
