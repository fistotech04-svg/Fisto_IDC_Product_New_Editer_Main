import express from 'express';
import Profile from '../../models/Profile.js';
import Flipbook from '../../models/Flipbook.js';

const router = express.Router();

// GET /api/profile
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
    
    const books = await Flipbook.find({ v_id: { $in: bookIds } }).lean();
    
    const userEmails = [...new Set(books.map(b => b.userEmail).filter(Boolean))];
    const safeRegexList = userEmails.map(e => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    
    const profiles = await Profile.find({ emailId: { $in: safeRegexList } }).lean();
    
    const profileMap = {};
    profiles.forEach(p => {
        if (p.emailId) profileMap[p.emailId.toLowerCase()] = p;
    });

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
    
    if (!folder.books) folder.books = [];
    
    const bookExists = folder.books.some(b => {
      const id = typeof b === 'string' ? b : b.v_id;
      return id === bookId;
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
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    folder.books = bookIds.map((v_id, index) => ({
      v_id,
      row: Math.floor(index / 6),
      order: index % 6
    }));

    profile.updatedAt = new Date();
    profile.markModified('myShelf.folders');
    profile.markModified('myShelf');
    await profile.save();

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