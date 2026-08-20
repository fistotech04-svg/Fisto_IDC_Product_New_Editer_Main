import express from 'express';
import Profile from '../../models/Profile.js';
import User from '../../models/auth.js';

const router = express.Router();

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
    const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

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

    const updateFields = {
      emailId: normalizedEmail
    };
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    if (req.body.picture !== undefined) updateFields.picture = req.body.picture;
    if (req.body.avatarBgColor !== undefined) updateFields.avatarBgColor = req.body.avatarBgColor;
    if (req.body.bannerBg !== undefined) updateFields.bannerBg = req.body.bannerBg;
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
// @desc    Update only banner background
// @access  Public / Authenticated
router.post('/banner', async (req, res) => {
  try {
    const rawEmail = req.body.emailId || req.body.email;
    const { bannerBg } = req.body;
    if (!rawEmail || !bannerBg) {
      return res.status(400).json({ success: false, message: 'emailId and bannerBg are required' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
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
// @desc    Update avatar picture and/or color
// @access  Public / Authenticated
router.post('/avatar', async (req, res) => {
  try {
    const rawEmail = req.body.emailId || req.body.email;
    const { picture, avatarBgColor } = req.body;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'emailId is required' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const updateData = { updatedAt: new Date() };
    if (picture !== undefined) updateData.picture = picture;
    if (avatarBgColor !== undefined) updateData.avatarBgColor = avatarBgColor;

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
