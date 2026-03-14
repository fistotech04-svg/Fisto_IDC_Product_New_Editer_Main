import express from 'express';
import User from '../../models/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Sanitize email for use as folder name (replace @ and . with _)
    const sanitizedEmail = emailId.replace(/[@.]/g, '_');

    // Create new user (Ideally password should be hashed)
    const newUser = new User({
      emailId,
      password,
      userFolder: sanitizedEmail
    });

    // Create user-specific folder for storing files
    const userFolderPath = path.join(__dirname, '../../uploads', sanitizedEmail);
    
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Create user-specific folder
      if (!fs.existsSync(userFolderPath)) {
        fs.mkdirSync(userFolderPath, { recursive: true });
        console.log(`Created folder for user: ${sanitizedEmail}`);
      }

      // Create Default Folders
      const foldersToCreate = [
          'My_Flipbooks',
          'Images',
          'Videos',
          'gifs', 
          '3D_Modals',
          '3D_Screenshot'
      ];

      foldersToCreate.forEach(folder => {
          const folderPath = path.join(userFolderPath, folder);
          if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath, { recursive: true });
          }
      });

      // Create "Recent Book" inside "My_Flipbooks"
      const publicBookPath = path.join(userFolderPath, 'My_Flipbooks', 'Recent Book');
      if (!fs.existsSync(publicBookPath)) {
          fs.mkdirSync(publicBookPath, { recursive: true });
          console.log(`Created structure for user: ${sanitizedEmail}`);
      }
    } catch (folderError) {
      console.error('Error creating user folder:', folderError);
      // Continue even if folder creation fails
    }

    // Save user to database
    await newUser.save();

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: {
        emailId: newUser.emailId,
        userFolder: sanitizedEmail,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password (simple comparison for now)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ 
      message: 'Login successful', 
      user: {
        emailId: user.emailId,
        userFolder: user.userFolder,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (Simple get function as requested)
// @access  Public
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
