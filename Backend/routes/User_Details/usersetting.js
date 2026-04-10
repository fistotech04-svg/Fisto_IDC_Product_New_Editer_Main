import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserSettings from '../../models/UserSettings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to get folder size
const getDirSize = (dirPath) => {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (e) {
    return 0;
  }
  return size;
};

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

    // Calculate Storage Usage
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const userUploadsDir = path.join(__dirname, "../../uploads", sanitizedEmail);
    const usedStorage = getDirSize(userUploadsDir);

    // Return settings with storage info
    res.json({
        ...settings._doc,
        usedStorage,
        maxStorage: settings.maxStorage || 300 * 1024 * 1024
    });
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
