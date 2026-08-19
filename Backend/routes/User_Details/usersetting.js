import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserSettings from '../../models/UserSettings.js';
import { getUserStorageSizeFromSupabase } from '../../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        settings = new UserSettings({
          emailId,
          editorSettings: {
            isAutoSaveEnabled: true,
            isTrimViewEnabled: false,
            isRulerEnabled: true
          }
        });
        await settings.save();
    }

    // Calculate Storage Usage from Supabase Storage
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const usedStorage = await getUserStorageSizeFromSupabase(sanitizedEmail);

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
      { $set: { 'editorSettings.isAutoSaveEnabled': isAutoSaveEnabled } },
      { new: true, upsert: true }
    );

    res.json({ 
      message: 'Settings updated', 
      isAutoSaveEnabled: settings.editorSettings?.isAutoSaveEnabled ?? isAutoSaveEnabled,
      editorSettings: settings.editorSettings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/usersetting/update-editor-settings
// @desc    Update all editor settings (isAutoSaveEnabled, isTrimViewEnabled, isRulerEnabled)
// @access  Public
router.post('/update-editor-settings', async (req, res) => {
  try {
    const { emailId, editorSettings } = req.body;
    
    if (!emailId) {
        return res.status(400).json({ message: 'Email ID is required' });
    }

    const updateObj = {};
    if (editorSettings) {
      if (editorSettings.isAutoSaveEnabled !== undefined) updateObj['editorSettings.isAutoSaveEnabled'] = editorSettings.isAutoSaveEnabled;
      if (editorSettings.isTrimViewEnabled !== undefined) updateObj['editorSettings.isTrimViewEnabled'] = editorSettings.isTrimViewEnabled;
      if (editorSettings.isRulerEnabled !== undefined) updateObj['editorSettings.isRulerEnabled'] = editorSettings.isRulerEnabled;
    }

    const settings = await UserSettings.findOneAndUpdate(
      { emailId },
      { $set: updateObj },
      { new: true, upsert: true }
    );

    res.json({ message: 'Editor settings updated', editorSettings: settings.editorSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
