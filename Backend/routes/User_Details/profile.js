import express from 'express';
import path from 'path';
import multer from 'multer';
import Profile from '../../models/Profile.js';
import User from '../../models/auth.js';
import { uploadBufferToSupabase, deleteFileFromSupabase, ensureUserFoldersInSupabase } from '../../config/supabase.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * Helper to delete a previous Supabase avatar or banner asset if it resides in the user's Profile folder.
 */
const deletePreviousProfileAssetIfSupabase = async (assetUrlOrCss, sanitizedEmail) => {
  try {
    if (!assetUrlOrCss || typeof assetUrlOrCss !== 'string') return;
    const cleanUrl = assetUrlOrCss.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '').trim();
    if (!cleanUrl || cleanUrl.startsWith('data:') || cleanUrl === 'color_only') return;

    if (
      cleanUrl.includes('/Profile/') ||
      cleanUrl.includes(`/${sanitizedEmail}/Profile/`) ||
      cleanUrl.includes('Profile/avatar_') ||
      cleanUrl.includes('Profile/banner_')
    ) {
      console.log(`[Profile] Deleting old profile asset from Supabase: ${cleanUrl}`);
      await deleteFileFromSupabase(cleanUrl);
    }
  } catch (err) {
    console.warn(`[Profile] Error deleting previous asset from Supabase:`, err);
  }
};

/**
 * Helper to save an uploaded file buffer or base64 data to Supabase Storage in the Profile folder.
 */
const saveProfileAsset = async (sanitizedEmail, fileOrBase64, prefix = 'avatar') => {
  try {
    if (!fileOrBase64 || !sanitizedEmail) return null;

    // 1. Handle Multer file object
    if (fileOrBase64.buffer && Buffer.isBuffer(fileOrBase64.buffer)) {
      const ext = (path.extname(fileOrBase64.originalname || '').replace('.', '') || 'png').toLowerCase();
      const fileName = `${prefix}_${Date.now()}.${ext}`;
      const destinationPath = `${sanitizedEmail}/Profile/${fileName}`;
      const contentType = fileOrBase64.mimetype || 'image/png';
      const supabaseUrl = await uploadBufferToSupabase(fileOrBase64.buffer, destinationPath, contentType);
      return supabaseUrl || `/uploads/${sanitizedEmail}/Profile/${fileName}`;
    }

    // 2. Handle Base64 string
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      const match = fileOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const contentType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        let ext = 'png';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('svg')) ext = 'svg';
        else if (contentType.includes('gif')) ext = 'gif';

        const fileName = `${prefix}_${Date.now()}.${ext}`;
        const destinationPath = `${sanitizedEmail}/Profile/${fileName}`;
        const supabaseUrl = await uploadBufferToSupabase(buffer, destinationPath, contentType);
        return supabaseUrl || `/uploads/${sanitizedEmail}/Profile/${fileName}`;
      }
    }

    // 3. Regular string URL or preset path
    return fileOrBase64;
  } catch (err) {
    console.error(`[Profile] Error saving ${prefix} asset to Supabase Profile folder:`, err);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : null;
  }
};

// @route   GET /api/profile
// @desc    Get user profile by emailId or email
// @access  Public / Authenticated
router.get('/', async (req, res) => {
  try {
    const rawEmail = req.query.emailId || req.query.email;

    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'emailId or email query parameter is required' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');
    const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // Ensure Profile and other user folders exist in Supabase in the background
    ensureUserFoldersInSupabase(sanitizedEmail).catch(err => {
      console.warn('[Supabase] Profile folder ensure error:', err);
    });

    let profile = await Profile.findOne({ emailId: safeRegex });

    if (!profile) {
      // Check if user exists in auth collection to seed default info
      const user = await User.findOne({ emailId: safeRegex });
      const defaultName = normalizedEmail.split('@')[0] || 'User';

      profile = {
        emailId: normalizedEmail,
        name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
        picture: null,
        avatarBgColor: '#E8D4C8',
        bannerBg: {
          type: 'gradient',
          value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)'
        },
        about: '',
        mobile: '',
        companyName: '',
        industryType: '',
        companyEmail: '',
        website: '',
        services: [],
        address1: '',
        address2: '',
        city: '',
        pincode: '',
        state: '',
        country: 'INDIA',
        socials: {
          website: '',
          instagram: '',
          linkedin: '',
          facebook: '',
          whatsapp: ''
        }
      };
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching profile', error: error.message });
  }
});

// @route   POST /api/profile/save
// @desc    Create or update user profile
// @access  Public / Authenticated
router.post('/save', async (req, res) => {
  try {
    const rawEmail = req.body.emailId || req.body.email;

    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'emailId or email is required in request body' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');

    // Retrieve existing profile to clean up old Supabase files if changed
    const existingProfile = await Profile.findOne({ emailId: normalizedEmail });

    const updateFields = {
      emailId: normalizedEmail
    };
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    if (req.body.avatarBgColor !== undefined) updateFields.avatarBgColor = req.body.avatarBgColor;
    if (req.body.about !== undefined) updateFields.about = req.body.about;
    if (req.body.mobile !== undefined) updateFields.mobile = req.body.mobile;
    if (req.body.companyName !== undefined) updateFields.companyName = req.body.companyName;
    if (req.body.industryType !== undefined) updateFields.industryType = req.body.industryType;
    if (req.body.companyEmail !== undefined) updateFields.companyEmail = req.body.companyEmail;
    if (req.body.website !== undefined) updateFields.website = req.body.website;
    if (req.body.services !== undefined) updateFields.services = req.body.services;
    if (req.body.address1 !== undefined) updateFields.address1 = req.body.address1;
    if (req.body.address2 !== undefined) updateFields.address2 = req.body.address2;
    if (req.body.city !== undefined) updateFields.city = req.body.city;
    if (req.body.pincode !== undefined) updateFields.pincode = req.body.pincode;
    if (req.body.state !== undefined) updateFields.state = req.body.state;
    if (req.body.country !== undefined) updateFields.country = req.body.country;
    if (req.body.socials !== undefined) updateFields.socials = req.body.socials;

    // Convert and save picture to Profile folder in Supabase if base64, and delete old file if replaced
    if (req.body.picture !== undefined) {
      if (typeof req.body.picture === 'string' && req.body.picture.startsWith('data:')) {
        if (existingProfile?.picture && existingProfile.picture !== req.body.picture) {
          await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
        }
        updateFields.picture = await saveProfileAsset(sanitizedEmail, req.body.picture, 'avatar');
      } else {
        if (existingProfile?.picture && existingProfile.picture !== req.body.picture) {
          await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
        }
        updateFields.picture = req.body.picture;
      }
    }

    // Convert and save banner to Profile folder in Supabase if base64, and delete old file if replaced
    if (req.body.bannerBg !== undefined) {
      let bBg = req.body.bannerBg;
      if (typeof bBg === 'string') {
        try { bBg = JSON.parse(bBg); } catch (e) {}
      }
      if (bBg && typeof bBg === 'object' && bBg.value && typeof bBg.value === 'string' && bBg.value.includes('data:')) {
        if (existingProfile?.bannerBg?.value && existingProfile.bannerBg.value !== bBg.value) {
          await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
        }
        const rawBase64 = bBg.value.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        const savedUrl = await saveProfileAsset(sanitizedEmail, rawBase64, 'banner');
        bBg.value = `url(${savedUrl})`;
      } else if (existingProfile?.bannerBg?.value && bBg?.value && existingProfile.bannerBg.value !== bBg.value) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
      }
      updateFields.bannerBg = bBg;
    }

    updateFields.updatedAt = new Date();

    const updatedProfile = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving profile', error: error.message });
  }
});

// @route   POST /api/profile/banner
// @desc    Update banner background (supports file upload or JSON data, removes old media from Supabase)
// @access  Public / Authenticated
router.post('/banner', upload.single('banner'), async (req, res) => {
  try {
    const rawEmail = req.body.emailId || req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'emailId is required' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');

    // Find existing profile to delete old banner image if present
    const existingProfile = await Profile.findOne({ emailId: normalizedEmail });
    if (existingProfile?.bannerBg?.value) {
      await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
    }

    let bannerBg = null;

    if (req.file) {
      // 1. Direct file upload
      const bannerUrl = await saveProfileAsset(sanitizedEmail, req.file, 'banner');
      bannerBg = {
        type: 'media',
        value: `url(${bannerUrl})`
      };
    } else if (req.body.bannerBg) {
      let bBg = req.body.bannerBg;
      if (typeof bBg === 'string') {
        try { bBg = JSON.parse(bBg); } catch (e) {}
      }

      if (bBg && typeof bBg === 'object' && bBg.value && typeof bBg.value === 'string' && bBg.value.includes('data:')) {
        const rawBase64 = bBg.value.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        const savedUrl = await saveProfileAsset(sanitizedEmail, rawBase64, 'banner');
        bBg.value = `url(${savedUrl})`;
      }
      bannerBg = bBg;
    } else {
      return res.status(400).json({ success: false, message: 'banner file or bannerBg is required' });
    }

    const updated = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: { bannerBg, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      bannerBg: updated.bannerBg
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating banner', error: error.message });
  }
});

// @route   POST /api/profile/avatar
// @desc    Update avatar picture and/or color (supports file upload or JSON data, removes old avatar from Supabase)
// @access  Public / Authenticated
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const rawEmail = req.body.emailId || req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'emailId is required' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');
    const updateData = { updatedAt: new Date() };

    // Find existing profile to delete old avatar image if replacing/deleting
    const existingProfile = await Profile.findOne({ emailId: normalizedEmail });
    if (existingProfile?.picture) {
      await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
    }

    if (req.file) {
      // 1. Direct file upload
      const avatarUrl = await saveProfileAsset(sanitizedEmail, req.file, 'avatar');
      updateData.picture = avatarUrl;
    } else if (req.body.picture !== undefined) {
      let pic = req.body.picture;
      if (typeof pic === 'string' && pic.startsWith('data:')) {
        pic = await saveProfileAsset(sanitizedEmail, pic, 'avatar');
      }
      updateData.picture = pic;
    }

    if (req.body.avatarBgColor !== undefined) {
      updateData.avatarBgColor = req.body.avatarBgColor;
    }

    const updated = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      picture: updated.picture,
      avatarBgColor: updated.avatarBgColor
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating avatar', error: error.message });
  }
});

export default router;
