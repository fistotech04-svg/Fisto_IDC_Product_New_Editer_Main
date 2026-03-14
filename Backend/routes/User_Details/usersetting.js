import express from 'express';
import UserSettings from '../../models/UserSettings.js';

const router = express.Router();

// @route   GET /api/usersetting/get-settings
// @desc    Get user settings by email
// @access  Public
router.get('/get-settings', async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
        return res.status(400).json({ message: 'Email ID is required' });
    }

    let settings = await UserSettings.findOne({ emailId });
    if (!settings) {
        // If settings don't exist, create default
        settings = new UserSettings({ emailId, isAutoSaveEnabled: true });
        await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/usersetting/update-autosave
// @desc    Update auto-save preference
// @access  Public
router.post('/update-autosave', async (req, res) => {
  try {
    const { emailId, isAutoSaveEnabled } = req.body;
    
    if (!emailId) {
        return res.status(400).json({ message: 'Email ID is required' });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { emailId },
      { isAutoSaveEnabled },
      { new: true, upsert: true }
    );

    res.json({ message: 'Settings updated', isAutoSaveEnabled: settings.isAutoSaveEnabled });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
