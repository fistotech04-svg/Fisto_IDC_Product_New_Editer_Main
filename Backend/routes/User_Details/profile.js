import express from 'express';
import Profile from '../../models/Profile.js';
import User from '../../models/auth.js';
import Flipbook from '../../models/Flipbook.js';
import { uploadBufferToSupabase, deleteFileFromSupabase, ensureUserFoldersInSupabase } from '../../config/supabase.js';
import { logActivity } from '../../utils/activityLogger.js';
import multer from 'multer';
import path from 'path';
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * Helper to delete a previous Supabase avatar, banner, or company logo asset.
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
      cleanUrl.includes('Profile/banner_') ||
      cleanUrl.includes('/Company_logo/') ||
      cleanUrl.includes(`/${sanitizedEmail}/Company_logo/`) ||
      cleanUrl.includes('Company_logo/logo_')
    ) {
      console.log(`[Profile] Deleting old asset from Supabase: ${cleanUrl}`);
      await deleteFileFromSupabase(cleanUrl);
    }
  } catch (err) {
    console.warn(`[Profile] Error deleting previous asset from Supabase:`, err);
  }
};

/**
 * Helper to save an uploaded file buffer or base64 data to Supabase Storage in the Profile or Company_logo folder.
 */
const saveProfileAsset = async (sanitizedEmail, fileOrBase64, prefix = 'avatar', folder = 'Profile') => {
  try {
    if (!fileOrBase64 || !sanitizedEmail) return null;

    // 1. Handle Multer file object
    if (fileOrBase64.buffer && Buffer.isBuffer(fileOrBase64.buffer)) {
      const ext = (path.extname(fileOrBase64.originalname || '').replace('.', '') || 'png').toLowerCase();
      const fileName = `${prefix}_${Date.now()}.${ext}`;
      const destinationPath = `${sanitizedEmail}/${folder}/${fileName}`;
      const contentType = fileOrBase64.mimetype || 'image/png';
      const supabaseUrl = await uploadBufferToSupabase(fileOrBase64.buffer, destinationPath, contentType);
      return supabaseUrl || `/uploads/${sanitizedEmail}/${folder}/${fileName}`;
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
        const destinationPath = `${sanitizedEmail}/${folder}/${fileName}`;
        const supabaseUrl = await uploadBufferToSupabase(buffer, destinationPath, contentType);
        return supabaseUrl || `/uploads/${sanitizedEmail}/${folder}/${fileName}`;
      }
    }

    // 3. Regular string URL or preset path
    return fileOrBase64;
  } catch (err) {
    console.error(`[Profile] Error saving ${prefix} asset to Supabase ${folder} folder:`, err);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : null;
  }
};

// @route   GET /api/profile
// @desc    Get user profile by emailId or email
// @access  Public / Authenticated
router.get('/', async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: 'emailId is required' });
    
    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile) {
      profile = new Profile({ emailId: emailId.trim().toLowerCase() });
      await profile.save();
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/profile/my-shelf-books
router.get('/my-shelf-books', async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: 'emailId is required' });
    
    const profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile) {
      return res.json({ books: [], myShelf: { folders: [] } });
    }
    
    let bookIds = [];
    if (profile.myShelf && profile.myShelf.folders) {
      profile.myShelf.folders.forEach(f => {
        if (f.books) {
          f.books.forEach(b => {
            const id = typeof b === 'string' ? b : b.v_id;
            if (id) bookIds.push(id);
          });
        }
      });
    }

    const allBooks = await Flipbook.find({ v_id: { $in: bookIds } }).lean();
    // Only show books on the shelf that are actually published, UNLESS they are owned by the current user
    const userEmailNorm = emailId.trim().toLowerCase();
    const books = allBooks.filter(b => (b.isPublished === true || b.isPublished === 'true') || (b.userEmail && b.userEmail.toLowerCase() === userEmailNorm));
    
    
    const userEmails = [...new Set(books.map(b => b.userEmail?.toLowerCase()).filter(Boolean))];
    const profiles = await Profile.find({ emailId: { $in: userEmails } }).lean();
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.emailId.toLowerCase()] = p; });

    const booksWithFlag = books.map(book => {
      const p = profileMap[book.userEmail?.toLowerCase()] || {};
      const authorName = p.name || (book.userEmail ? book.userEmail.split('@')[0] : 'Creator');
      const city = p.city || p.state || (p.country && p.country !== 'INDIA' ? p.country : '') || 'Coimbatore';
      const authorPicture = p.picture || null;
      const authorBgColor = p.avatarBgColor || '#E8D4C8';
      
      return {
        ...book,
        isAddedToShelf: true,
        authorName,
        city,
        authorPicture,
        authorBgColor
      };
    });

    res.json({
      books: booksWithFlag,
      myShelf: profile.myShelf || { folders: [] }
    });
  } catch (error) {
    console.error('Error fetching my-shelf-books:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/profile
// @desc    Create or update user profile
router.post('/', async (req, res) => {
  try {
    const { emailId } = req.body;
    if (!emailId) return res.status(400).json({ message: 'emailId is required' });
    
    const normalizedEmail = emailId.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');
    
    let existingProfile = await Profile.findOne({ emailId: normalizedEmail });
    let updateFields = { ...req.body };
    delete updateFields._id;
    
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
        const savedUrl = await saveProfileAsset(sanitizedEmail, rawBase64, 'banner', 'Profile');
        bBg.value = `url(${savedUrl})`;
      } else if (existingProfile?.bannerBg?.value && bBg?.value && existingProfile.bannerBg.value !== bBg.value) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
      }
      updateFields.bannerBg = bBg;
    }

    // Convert and save company logo to Company_logo folder in Supabase if base64, and delete old file if replaced
    if (req.body.company_logo_url !== undefined || req.body.companyLogo !== undefined) {
      const rawLogo = req.body.company_logo_url !== undefined ? req.body.company_logo_url : req.body.companyLogo;
      const oldLogo = existingProfile?.company_logo_url || existingProfile?.companyLogo;

      if (typeof rawLogo === 'string' && rawLogo.startsWith('data:')) {
        if (oldLogo && oldLogo !== rawLogo) {
          await deletePreviousProfileAssetIfSupabase(oldLogo, sanitizedEmail);
        }
        const savedLogo = await saveProfileAsset(sanitizedEmail, rawLogo, 'logo', 'Company_logo');
        updateFields.company_logo_url = savedLogo;
        updateFields.companyLogo = savedLogo;
      } else {
        if (oldLogo && oldLogo !== rawLogo) {
          await deletePreviousProfileAssetIfSupabase(oldLogo, sanitizedEmail);
        }
        updateFields.company_logo_url = rawLogo || '';
        updateFields.companyLogo = rawLogo || '';
      }
    }

    updateFields.updatedAt = new Date();

    const updatedProfile = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: updateFields },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    // Log user activity
    logActivity({
      userEmail: normalizedEmail,
      type: existingProfile ? 'edit' : 'create_profile',
      title: existingProfile ? 'You updated your profile' : 'You created your profile',
      desc: existingProfile ? 'Profile information updated successfully.' : 'Profile created successfully.',
      entityId: updatedProfile?._id?.toString()
    });

    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/profile/add-to-shelf
router.post('/add-to-shelf', async (req, res) => {
  try {
    const { emailId, bookId, folderName } = req.body;
    if (!emailId || !bookId) {
      return res.status(400).json({ success: false, message: 'Missing emailId or bookId' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile) {
      profile = new Profile({ emailId: emailId.trim().toLowerCase() });
    }

    if (!profile.myShelf) profile.myShelf = {};
    if (!profile.myShelf.folders) profile.myShelf.folders = [];
    if (!profile.myShelf.shelfCount) profile.myShelf.shelfCount = 1;
    
    let targetFolder = folderName || 'My Flipbooks';
    let folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    
    if (!folder) {
      profile.myShelf.folders.push({ folderName: targetFolder, shelf_design: 1, books: [] });
      folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    }

    const updated = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: { bannerBg, updatedAt: new Date() } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      bannerBg: updated.bannerBg
    });
    
    if (bookExists) {
      return res.json({ success: false, message: 'Book is already on your shelf' });
    }
    
    const currentCount = folder.books.length;
    folder.books.push({
      v_id: bookId,
      row: Math.floor(currentCount / 6),
      order: currentCount % 6
    });
    
    profile.updatedAt = new Date();
    profile.markModified('myShelf.folders');
    profile.markModified('myShelf');
    await profile.save();

    res.json({ success: true, message: 'Book added to shelf' });
  } catch (error) {
    console.error('Error in add-to-shelf:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/update-shelf-order
router.post('/update-shelf-order', async (req, res) => {
  try {
    const { emailId, folderName, bookIds } = req.body;
    if (!emailId || !bookIds || !Array.isArray(bookIds)) {
      return res.status(400).json({ success: false, message: 'Missing emailId or bookIds array' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile || !profile.myShelf || !profile.myShelf.folders) {
      return res.status(404).json({ success: false, message: 'Profile or shelf not found' });
    }

    let targetFolder = folderName || 'My Flipbooks';
    let folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    if (!folder) {
      profile.myShelf.folders.push({ folderName: targetFolder, shelf_design: 1, books: [] });
      folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    }

    folder.books = bookIds.map((v_id, index) => ({
      v_id,
      row: Math.floor(index / 6),
      order: index % 6
    }));

    const updated = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: updateData },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Shelf order updated' });
  } catch (error) {
    console.error('Error updating shelf order:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/remove-from-shelf
router.post('/remove-from-shelf', async (req, res) => {
  try {
    const { emailId, bookId } = req.body;
    if (!emailId || !bookId) {
      return res.status(400).json({ success: false, message: 'Missing emailId or bookId' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile || !profile.myShelf || !profile.myShelf.folders) {
      return res.status(404).json({ success: false, message: 'Profile or shelf not found' });
    }

    // Remove book from all folders
    let removed = false;
    profile.myShelf.folders.forEach(folder => {
      if (folder.books) {
        const initLength = folder.books.length;
        folder.books = folder.books.filter(b => {
          const id = typeof b === 'string' ? b : b.v_id;
          return id !== bookId;
        });
        if (folder.books.length < initLength) {
          removed = true;
          // Recalculate row and order for the remaining books in this folder
          folder.books = folder.books.map((b, index) => {
            if (typeof b === 'string') {
               return { v_id: b, row: Math.floor(index / 6), order: index % 6 };
            }
            b.row = Math.floor(index / 6);
            b.order = index % 6;
            return b;
          });
        }
      }
    });

    if (removed) {
      profile.updatedAt = new Date();
      profile.markModified('myShelf.folders');
      profile.markModified('myShelf');
      await profile.save();
    }

    res.json({ success: true, message: 'Book removed from shelf' });
  } catch (error) {
    console.error('Error removing from shelf:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/update-shelf-design
router.post('/update-shelf-design', async (req, res) => {
  try {
    const { emailId, folderName, shelf_design } = req.body;
    if (!emailId || shelf_design === undefined) {
      return res.status(400).json({ success: false, message: 'Missing emailId or shelf_design' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile || !profile.myShelf || !profile.myShelf.folders) {
      return res.status(404).json({ success: false, message: 'Profile or shelf not found' });
    }

    let targetFolder = folderName || 'My Flipbooks';
    let folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    folder.shelf_design = shelf_design;
    
    profile.updatedAt = new Date();
    profile.markModified('myShelf.folders');
    profile.markModified('myShelf');
    await profile.save();

    res.json({ success: true, message: 'Shelf design updated' });
  } catch (error) {
    console.error('Error updating shelf design:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;