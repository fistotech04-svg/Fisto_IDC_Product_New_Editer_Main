import express from 'express';
import User from '../../models/auth.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

const router = express.Router();

// Helper to get Gmail Transporter (ensures env vars are loaded)
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure user folders exist
const ensureUserFolders = (sanitizedEmail) => {
  const userFolderPath = path.join(__dirname, '../../uploads', sanitizedEmail);
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    const foldersToCreate = ['My_Flipbooks', 'Images', 'Videos', 'gifs', '3D_Modals', '3D_Screenshot'];
    foldersToCreate.forEach(folder => {
      const folderPath = path.join(userFolderPath, folder);
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    });

    const publicBookPath = path.join(userFolderPath, 'My_Flipbooks', 'Recent Book');
    if (!fs.existsSync(publicBookPath)) fs.mkdirSync(publicBookPath, { recursive: true });
    
    return true;
  } catch (folderError) {
    console.error('Error creating user folder:', folderError);
    return false;
  }
};


// @route   POST /api/auth/google-login
// @desc    Login or Signup with Google
// @access  Public
router.post('/google-login', async (req, res) => {
  try {
    const { token, isAccessToken, email: manualEmail, name: manualName, picture: manualPicture, sub: manualSub } = req.body;
    
    let email, googleId, picture, name;

    if (isAccessToken) {
      // Data already fetched from Google on frontend
      email = manualEmail;
      googleId = manualSub;
      picture = manualPicture;
      name = manualName;
    } else {
      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }
      // Verify Google Token (ID Token)
      const ticket = await getGoogleClient().verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      email = payload.email;
      googleId = payload.sub;
      picture = payload.picture;
      name = payload.name;
    }

    if (!email) {
      return res.status(400).json({ message: 'Google authentication failed: Email not found' });
    }

    // Check if user exists
    let user = await User.findOne({ emailId: email });
    const sanitizedEmail = email.replace(/[@.]/g, '_');

    if (!user) {
      // Signup logic for new Google user
      user = new User({
        emailId: email,
        password: `google_${googleId || Date.now()}`, // Dummy password
        userFolder: sanitizedEmail
      });
      await user.save();
    }

    // Ensure folders exist for both new and returning Google users
    ensureUserFolders(user.userFolder || sanitizedEmail);

    res.status(200).json({ 
      message: 'Google login successful', 
      user: {
        emailId: user.emailId,
        userFolder: user.userFolder,
        createdAt: user.createdAt,
        picture: picture,
        name: name
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

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

    // Create new user (Password is hashed automatically by pre-save hook in User model)
    const newUser = new User({
      emailId,
      password,
      userFolder: sanitizedEmail
    });

    // Create user-specific folder for storing files
    ensureUserFolders(sanitizedEmail);

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
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // Check password (using bcrypt comparison)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
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
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/check-user
// @desc    Check if a user exists by email and send OTP
// @access  Public
router.post('/check-user', async (req, res) => {
  try {
    const { emailId } = req.body;
    const user = await User.findOne({ emailId });
    
    if (!user) {
      return res.status(404).json({ exists: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Personalize email name
    const userName = user.emailId.split('@')[0];

    // Send OTP via Nodemailer (Gmail App Password)
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `Fisto <${process.env.EMAIL_USER}>`,
        to: emailId,
        subject: 'Your Password Reset OTP',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
              <div style="background: linear-gradient(135deg, #4c5add, #3f4bc0); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 2px;">FIST-O</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; font-size: 22px; font-weight: 600; margin-top: 0; text-align: center;">Password Reset Request</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Hello <strong style="color: #333;">${userName}</strong>,</p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">We received a request to reset your Fisto account password. Please use the verification code below to complete the process.</p>
                
                <div style="background-color: #f8f9fe; border: 2px dashed #4c5add; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
                  <span style="display: block; font-size: 36px; font-weight: 700; color: #4c5add; letter-spacing: 8px; margin-left: 8px;">${otp}</span>
                </div>

                <p style="color: #777777; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                  This code is valid for a limited time. If you did not request a password reset, you can safely ignore this email.
                </p>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fisto Tech. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      // Encrypt OTP before saving to database
      const salt = await bcrypt.genSalt(10);
      user.otp = await bcrypt.hash(otp, salt);
      await user.save();
      
      return res.status(200).json({ exists: true, message: 'OTP sent successfully' });
    } catch (emailError) {
      console.error('Email Sending Error:', emailError);
      return res.status(500).json({ message: 'Failed to send OTP. Please check your Gmail API credentials.' });
    }
  } catch (error) {
    console.error('Check User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the OTP provided by the user
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { emailId, otp } = req.body;
    const user = await User.findOne({ emailId });

    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid OTP or session expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password after OTP verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { emailId, otp, newPassword } = req.body;
    const user = await User.findOne({ emailId });

    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid OTP or session expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.otp = null; // Clear OTP
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/clear-otp
// @desc    Clear OTP for a user
// @access  Public
router.post('/clear-otp', async (req, res) => {
  try {
    const { emailId } = req.body;
    await User.findOneAndUpdate({ emailId }, { otp: null });
    res.status(200).json({ message: 'OTP cleared' });
  } catch (error) {
    console.error('Clear OTP Error:', error);
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
