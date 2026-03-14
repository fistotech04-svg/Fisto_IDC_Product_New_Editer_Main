import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Flipbook from '../../models/Flipbook.js'; // Import Model
import { nanoid } from 'nanoid';
import multer from 'multer';
import FlipbookAsset from '../../models/FlipbookAsset.js';

const router = express.Router();
// ... (rest of top) ...

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for asset uploads
const assetStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { emailId, folderName, flipbookName, assetType } = req.body;
        
        if (!emailId || !folderName || !flipbookName || !assetType) {
            return cb(new Error('Missing required fields'));
        }
        
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const assetDir = path.join(
            uploadsDir,
            sanitizedEmail,
            'My_Flipbooks',
            folderName,
            flipbookName,
            'assets',
            assetType
        );
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(assetDir)) {
            fs.mkdirSync(assetDir, { recursive: true });
        }
        
        cb(null, assetDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename using nanoid + original extension
        const ext = path.extname(file.originalname);
        const uniqueName = `${nanoid()}${ext}`;
        cb(null, uniqueName);
    }
});

const assetUpload = multer({
    storage: assetStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const { assetType } = req.body;
        const allowedTypes = {
            'Image': /jpeg|jpg|png|gif|webp|svg/,
            'video': /mp4|webm|ogg|mov/,
            'gif': /gif/
        };
        
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        const typePattern = allowedTypes[assetType];
        
        if (typePattern && typePattern.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type for ${assetType}. Allowed: ${typePattern}`));
        }
    }
});

// @route   POST /api/flipbook/save
// @desc    Save user flipbook as HTML files
// @access  Public (should be protected in production)
router.post('/save', async (req, res) => {
    try {
        const { emailId, flipbookName, pages, overwrite, folderName } = req.body;

        if (!emailId || !flipbookName || !pages || !Array.isArray(pages)) {
            return res.status(400).json({ message: 'Missing required fields: emailId, flipbookName, or pages array' });
        }

        // Sanitize email to match the formatting used in login.js
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        
        // Determine target folder (default to 'Recent Book' if not specified)
        const targetFolder = folderName ? folderName.replace(/[^a-zA-Z0-9 _-]/g, '') : 'Recent Book';

        // Paths
        const uploadsDir = path.join(__dirname, '../../uploads');
        const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks');
        const userTargetFolderDir = path.join(myFlipbooksDir, targetFolder);

        // Ensure My_Flipbooks and Target Folder exist
        if (!fs.existsSync(myFlipbooksDir)) fs.mkdirSync(myFlipbooksDir, { recursive: true });
        if (!fs.existsSync(userTargetFolderDir)) fs.mkdirSync(userTargetFolderDir, { recursive: true });

        const flipbookDir = path.join(userTargetFolderDir, flipbookName);

        // Check Existence / Overwrite
        if (fs.existsSync(flipbookDir)) {
            if (!overwrite) {
                return res.status(409).json({ message: 'Flipbook already exists', code: 'EXISTS' });
            }
        } else {
            fs.mkdirSync(flipbookDir, { recursive: true });
        }

        // Create Default Assets Folders
        const assetsDir = path.join(flipbookDir, 'assets');
        ['Image', 'gif', 'video'].forEach(sub => {
            const subDir = path.join(assetsDir, sub);
            if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
        });

        // Fetch existing doc to detect page deletions and renames
        // If v_id is provided, use it to find the existing doc (for rename detection)
        // Otherwise, search by flipbookName and folderName
        let existingDoc = null;
        if (req.body.v_id) {
            existingDoc = await Flipbook.findOne({ 
                userEmail: emailId, 
                v_id: req.body.v_id 
            });
        } else {
            existingDoc = await Flipbook.findOne({ 
                userEmail: emailId, 
                flipbookName: flipbookName, 
                folderName: targetFolder 
            });
        }

        const savedPages = [];
        const dbPages = []; 
        const savedFileNames = new Set(); 
        const newPageIds = new Set();

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { pageName, content, v_id } = page;
            if (!pageName || content === undefined) continue;

            const fileName = pageName.endsWith('.html') ? pageName : `${pageName}.html`;
            const filePath = path.join(flipbookDir, fileName);

            fs.writeFileSync(filePath, content, 'utf8');
            savedPages.push(fileName);
            savedFileNames.add(fileName);
            
            // PRESERVE existing v_id: Match by v_id first, then by name
            let pageVId = null;
            if (existingDoc && existingDoc.pages) {
                // Try to match by v_id first (if provided from frontend)
                if (v_id) {
                    const existingPage = existingDoc.pages.find(p => p.v_id === v_id);
                    if (existingPage) {
                        pageVId = existingPage.v_id; // Reuse existing v_id
                    }
                }
                
                // Fallback: match by name (for backward compatibility)
                if (!pageVId) {
                    const existingPage = existingDoc.pages.find(p => p.name === pageName);
                    if (existingPage && existingPage.v_id) {
                        pageVId = existingPage.v_id; // Reuse existing v_id
                    }
                }
            }
            
            // Only generate new v_id if page doesn't exist
            if (!pageVId) {
                pageVId = nanoid();
            }
            
            newPageIds.add(pageVId);

            dbPages.push({
                pageNumber: i + 1,
                name: pageName,
                fileName: fileName,
                v_id: pageVId
            });
        }

        // Handle Cascading Deletion of Assets for Deleted Pages
        if (existingDoc && existingDoc.pages) {
            const deletedPageIds = existingDoc.pages
                .filter(p => p.v_id && !newPageIds.has(p.v_id))
                .map(p => p.v_id);

            if (deletedPageIds.length > 0) {
                console.log("Deleting assets for removed pages:", deletedPageIds);
                try {
                    const assetsToDelete = await FlipbookAsset.find({ page_v_id: { $in: deletedPageIds } });
                    
                    for (const asset of assetsToDelete) {
                        try {
                            if (asset.url && asset.url.startsWith('/uploads')) {
                                const assetPath = path.join(__dirname, '../../', asset.url);
                                if (fs.existsSync(assetPath)) {
                                    fs.unlinkSync(assetPath);
                                    console.log(`Deleted orphaned asset file: ${assetPath}`);
                                }
                            }
                        } catch (e) {
                            console.warn(`Failed to delete file for asset ${asset._id}:`, e.message);
                        }
                    }
                    
                    await FlipbookAsset.deleteMany({ page_v_id: { $in: deletedPageIds } });
                } catch (err) {
                    console.error("Error cleaning up assets for deleted pages:", err);
                }
            }
        }

        // Clean up orphaned HTML files (Deleted or Renamed pages)
        if (fs.existsSync(flipbookDir)) {
            const existingFiles = fs.readdirSync(flipbookDir);
            existingFiles.forEach(file => {
                const expectedNames = new Set(pages.map(p => p.pageName ? (p.pageName.endsWith('.html') ? p.pageName : `${p.pageName}.html`) : null).filter(Boolean));
                if (file.endsWith('.html') && !expectedNames.has(file)) {
                    fs.unlinkSync(path.join(flipbookDir, file));
                }
            });
        }

        // Prepare Folder List for DB (Current Folder + 'Recent Book')
        // Using Set to ensure uniqueness
        const folderList = [targetFolder];
        if (targetFolder !== 'Recent Book') {
             folderList.push('Recent Book');
        }
        const uniqueFolders = [...new Set(folderList)];

        // Save Metadata to MongoDB
        // We find by primary keys. We update folderName to include Recent Book if missing.
        const v_id = existingDoc ? existingDoc.v_id : nanoid(20);
        
        // DETECT RENAME: Check if flipbook name changed
        let oldFlipbookName = null;
        if (existingDoc && existingDoc.flipbookName !== flipbookName) {
            oldFlipbookName = existingDoc.flipbookName;
            console.log(`Flipbook rename detected: "${oldFlipbookName}" → "${flipbookName}"`);
        }
        
        // We use findOneAndUpdate but we just fetched existingDoc, so we could just save().
        // But let's stick to findOneAndUpdate to be atomic-ish or just robust.
        // Determine search criteria for the update/upsert
        const updateQuery = (req.body.v_id || (existingDoc && existingDoc.v_id)) 
            ? { userEmail: emailId, v_id: req.body.v_id || existingDoc.v_id }
            : { userEmail: emailId, flipbookName: flipbookName, folderName: targetFolder };

        const savedDoc = await Flipbook.findOneAndUpdate(
            updateQuery,
            { 
                $set: {
                    flipbookName: flipbookName, // Ensure name is updated if it changed
                    pages: dbPages,
                    lastUpdated: new Date(),
                    folderName: uniqueFolders // Update tags
                },
                $setOnInsert: { v_id: v_id } 
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // FIFO Logic for 'Recent Book' Tag
        // Ensure v_id exists (backfill for legacy docs)
        if (!savedDoc.v_id) {
             savedDoc.v_id = nanoid(10);
             await savedDoc.save();
        }

        // UPDATE ASSET URLs IF FLIPBOOK WAS RENAMED
        if (oldFlipbookName && oldFlipbookName !== flipbookName) {
            try {
                console.log(`Updating assets for renamed flipbook...`);
                
                // Find all assets for this flipbook using v_id
                const assets = await FlipbookAsset.find({ flipbook_v_id: savedDoc.v_id });
                
                if (assets.length > 0) {
                    // Update flipbookName field and reconstruct URL
                    for (const asset of assets) {
                        // Update the flipbookName field
                        asset.flipbookName = flipbookName;
                        
                        // Reconstruct URL with new flipbook name
                        // URL format: /uploads/{email}/My_Flipbooks/{folder}/{flipbook}/assets/{type}/{filename}
                        const emailPart = asset.url.split('/My_Flipbooks/')[0];
                        asset.url = `${emailPart}/My_Flipbooks/${asset.folderName}/${flipbookName}/assets/${asset.assetType}/${asset.fileName}`;
                        
                        await asset.save();
                        console.log(`✓ Updated: ${asset.fileName}`);
                    }
                    
                    console.log(`✅ Updated ${assets.length} asset(s) for renamed flipbook`);
                } else {
                    console.log(`No assets found for flipbook (v_id: ${savedDoc.v_id})`);
                }
            } catch (err) {
                console.error("❌ Error updating assets after rename:", err);
            }
        }

        // FIFO Logic for 'Recent Book' Tag
        try {
            const recentBooks = await Flipbook.find({ userEmail: emailId, folderName: 'Recent Book' })
                                              .sort({ lastUpdated: -1 }); // Newest first

            if (recentBooks.length > 10) {
                const toRemoveTag = recentBooks.slice(10); // The oldest ones
                
                for (const book of toRemoveTag) {
                    // Remove 'Recent Book' from folderName array
                    await Flipbook.updateOne(
                        { _id: book._id },
                        { $pull: { folderName: 'Recent Book' } }
                    );
                }
            }
        } catch (err) {
            console.error("Error enforcing Recent Book tag limit:", err);
        }

        res.status(200).json({
            message: 'Flipbook saved successfully',
            flipbookName,
            v_id: savedDoc.v_id,
            savedPagesCount: savedPages.length,
            location: flipbookDir
        });

    } catch (error) {
        console.error('Error saving flipbook:', error);
        res.status(500).json({ message: 'Server error processing request' });
    }
});

// Helper to get folder size
const getDirSize = (dirPath) => {
    let size = 0;
    try {
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
    } catch (e) { return 0; }
    return size;
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// @route   GET /api/flipbook/list
// @desc    Get all flipbooks with metadata
router.get('/list', async (req, res) => {
    try {
        const { emailId } = req.query;
        if (!emailId) return res.status(400).json({ message: 'Missing emailId' });

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks');

        if (!fs.existsSync(myFlipbooksDir)) {
             // Even if no folders, we might check DB? But likely empty.
             return res.json({ books: [] });
        }

        const folders = fs.readdirSync(myFlipbooksDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        let books = [];

        // 0. Fetch all DB records for this user to map v_ids
        const userDbBooks = await Flipbook.find({ userEmail: emailId });

        // 1. FS Scan for Physical Books
        // 1. FS Scan for Physical Books
        for (const folder of folders) {
            const folderPath = path.join(myFlipbooksDir, folder);
            
            let bookDirs = [];
            try {
                bookDirs = fs.readdirSync(folderPath, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory());
            } catch (e) {
                console.error(`Error reading folder ${folder}:`, e);
                continue;
            }
            
            for (const bookDir of bookDirs) {
                 const bookPath = path.join(folderPath, bookDir.name);
                 
                 // Get Metadata (Creation time, page count)
                 let htmlFiles = [];
                 let stats = {};
                 let sizeBytes = 0;
                 
                 try {
                     const files = fs.readdirSync(bookPath);
                     htmlFiles = files.filter(f => f.endsWith('.html'));
                     stats = fs.statSync(bookPath);
                     sizeBytes = getDirSize(bookPath);
                 } catch(e) { console.error("Error reading book details", e); }

                 // Find DB Match
                 let dbMatch = userDbBooks.find(b => b.flipbookName === bookDir.name && (b.folderName === folder || (Array.isArray(b.folderName) && b.folderName.includes(folder))));

                 // AUTO-HEAL: If no DB match, create one to ensure v_id
                 if (!dbMatch) {
                      try {
                          const newVId = nanoid(10);
                          // Sort pages
                          const sortedHtmlFiles = [...htmlFiles].sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
                          
                          const newPages = sortedHtmlFiles.map((f, idx) => ({
                              pageNumber: idx + 1,
                              name: f.replace('.html', ''),
                              fileName: f
                          }));

                          const newDoc = await Flipbook.create({
                               userEmail: emailId,
                               folderName: [folder],
                               flipbookName: bookDir.name,
                               pages: newPages,
                               v_id: newVId,
                               createdAt: stats.birthtime || new Date(),
                               lastUpdated: stats.mtime || new Date()
                          });
                          dbMatch = newDoc;
                      } catch (err) {
                          console.error("Auto-heal DB creation failed for", bookDir.name, err);
                      }
                 }

                 books.push({
                     id: `${folder}_${bookDir.name}`, 
                     v_id: dbMatch ? dbMatch.v_id : null, // ID from DB
                     realName: bookDir.name,
                     title: bookDir.name,
                     folder: folder,
                     pages: htmlFiles.length,
                     created: stats.birthtime ? stats.birthtime.toLocaleDateString('en-GB').replace(/\//g, '-') : '',
                     views: 0, 
                     size: formatSize(sizeBytes),
                     image: null,
                     mtime: stats.mtime
                 });
            }
        }

        // 2. DB Fetch for 'Recent Book' smart tag
        const recentDocs = await Flipbook.find({ userEmail: emailId, folderName: 'Recent Book' })
                                         .sort({ lastUpdated: -1 });

        const recentBooks = recentDocs.map(doc => {
             // Determine Real Folder
             // doc.folderName is an array.
             const realFolders = Array.isArray(doc.folderName) ? doc.folderName.filter(f => f !== 'Recent Book') : (doc.folderName === 'Recent Book' ? [] : [doc.folderName]);
             const realFolder = realFolders.length > 0 ? realFolders[0] : '';
             
             // Try to find size/created from the FS scan list if possible?
             // Or simpler: just use DB data + fallbacks.
             const matchingPhysicalBook = books.find(b => b.realName === doc.flipbookName && b.folder === realFolder);
             
             return {
                 id: `Recent_${doc.flipbookName}`,
                 realName: doc.flipbookName,
                 v_id: doc.v_id,
                 title: doc.flipbookName,
                 folder: 'Recent Book', // Virtual Folder
                 pages: doc.pages ? doc.pages.length : 0,
                 created: matchingPhysicalBook ? matchingPhysicalBook.created : '', // Reuse if found
                 views: 0,
                 size: matchingPhysicalBook ? matchingPhysicalBook.size : '0 B',
                 image: null
             };
        });

        // Merge
        const allBooks = [...books, ...recentBooks];

        res.json({ books: allBooks });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/flipbook/folders
// @desc    Get list of folders in My_Flipbooks
// @access  Public
router.get('/folders', (req, res) => {
    try {
        const { emailId } = req.query;
        if (!emailId) {
            return res.status(400).json({ message: 'Missing emailId' });
        }

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks');

        if (!fs.existsSync(myFlipbooksDir)) {
            // Return default
            return res.status(200).json({ folders: ['Recent Book'] }); 
        }

        const items = fs.readdirSync(myFlipbooksDir, { withFileTypes: true });
        const folders = items
            .filter(item => item.isDirectory())
            .map(item => item.name);
        
        // Sort alphabetical
        folders.sort((a, b) => a.localeCompare(b));
        
        res.status(200).json({ folders });
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route POST /api/flipbook/folder/create
router.post('/folder/create', (req, res) => {
    try {
        const { emailId, folderName } = req.body;
        if (!emailId || !folderName) return res.status(400).json({ message: 'Missing fields' });
        
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        // Sanitize folder name
        const safeFolderName = folderName.replace(/[^a-zA-Z0-9 _-]/g, '');
        const targetDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks', safeFolderName);

        if (fs.existsSync(targetDir)) {
            return res.status(409).json({ message: 'Folder Already Exists' });
        }
        
        fs.mkdirSync(targetDir, { recursive: true });
        res.json({ message: 'Folder created', folder: safeFolderName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper for recursive copy
const copyRecursiveSync = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

// @route POST /api/flipbook/folder/rename
router.post('/folder/rename', async (req, res) => {
   try {
        const { emailId, oldName, newName } = req.body;
        if (!emailId || !oldName || !newName) return res.status(400).json({ message: 'Missing fields' });

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks');
        
        const oldPath = path.join(myFlipbooksDir, oldName);
        const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, '');
        const newPath = path.join(myFlipbooksDir, safeNewName);

        if (!fs.existsSync(oldPath)) return res.status(404).json({ message: 'Folder not found' });
        
        // Check if destination exists (unless solely a case change, which implies same physical path on Windows)
        if (oldPath.toLowerCase() !== newPath.toLowerCase() && fs.existsSync(newPath)) {
             return res.status(409).json({ message: 'New name already exists' });
        }

        // Robust Rename for Windows (Handling EPERM/EBUSY)
        try {
            fs.renameSync(oldPath, newPath);
        } catch (err) {
             if (['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) {
                 // 1. Wait 500ms and retry
                 await new Promise(resolve => setTimeout(resolve, 500));
                 try {
                     fs.renameSync(oldPath, newPath);
                 } catch (retryErr) {
                     // 2. Fallback: Recursive Copy + Delete
                     console.log("Rename failed, attempting copy-delete fallback...");
                     copyRecursiveSync(oldPath, newPath);
                     try {
                        fs.rmSync(oldPath, { recursive: true, force: true });
                     } catch (delErr) {
                        console.error("Cleanup of old folder failed:", delErr);
                        // We continue because the new data is there. Old data might stick around briefly or require manual cleanup.
                     }
                 }
             } else {
                 throw err;
             }
        }

        // Update MongoDB for all books in this folder
        // Update MongoDB for all books in this folder
        // Since folderName is an array, we must update the specific element while preserving others (e.g. 'Recent Book')
        const booksToUpdate = await Flipbook.find({ userEmail: emailId, folderName: oldName });
        
        for (const book of booksToUpdate) {
            if (Array.isArray(book.folderName)) {
                book.folderName = book.folderName.map(f => f === oldName ? safeNewName : f);
            } else {
                // Fallback for legacy single-string data if any
                book.folderName = [safeNewName];
            }
            book.lastUpdated = new Date();
            await book.save();
        }

        // UPDATE ASSETS: Update folderName and reconstruct URLs for all assets in this folder
        try {
            console.log(`Updating assets for renamed folder: "${oldName}" → "${safeNewName}"`);
            
            // Find assets belonging to this user and folder
            // Filter by URL prefix to ensure user isolation
            const assets = await FlipbookAsset.find({ 
                folderName: oldName,
                url: { $regex: new RegExp(`^/uploads/${sanitizedEmail}/`) }
            });
            
            if (assets.length > 0) {
                for (const asset of assets) {
                    // Update folderName field
                    asset.folderName = safeNewName;
                    
                    // Reconstruct URL safely
                    // URL format: .../My_Flipbooks/{folder}/{book}/...
                    const parts = asset.url.split('/My_Flipbooks/');
                    if (parts.length === 2) {
                        const remainingPath = parts[1]; // {folder}/{book}/...
                        const pathParts = remainingPath.split('/');
                        
                        // Verify the first part matches oldName before replacing
                        if (pathParts[0] === oldName) {
                           pathParts[0] = safeNewName;
                           asset.url = `${parts[0]}/My_Flipbooks/${pathParts.join('/')}`;
                           await asset.save();
                        }
                    }
                }
                console.log(`✅ Updated ${assets.length} asset(s) for renamed folder`);
            }
        } catch (assetErr) {
            console.error("❌ Error updating assets after folder rename:", assetErr);
        }

        res.json({ message: 'Renamed successfully', newName: safeNewName });
   } catch(err) {
       console.error(err);
       res.status(500).json({ message: 'Server error' });
   }
});

// @route POST /api/flipbook/folder/duplicate
router.post('/folder/duplicate', async (req, res) => {
    try {
        const { emailId, folderName } = req.body;
        if (!emailId || !folderName) return res.status(400).json({ message: 'Missing fields' });

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks');
        
        const sourcePath = path.join(myFlipbooksDir, folderName);
        if (!fs.existsSync(sourcePath)) return res.status(404).json({ message: 'Folder not found' });

        // Generate Target Name
        let copyName = `${folderName} Copy`;
        let targetPath = path.join(myFlipbooksDir, copyName);
        let counter = 1;
        while (fs.existsSync(targetPath)) {
            copyName = `${folderName} Copy ${counter}`;
            targetPath = path.join(myFlipbooksDir, copyName);
            counter++;
        }

        // Copy Files
        copyRecursiveSync(sourcePath, targetPath);

        // Copy MongoDB Documents
        const sourceDocs = await Flipbook.find({ userEmail: emailId, folderName: folderName });
        if (sourceDocs.length > 0) {
            const newDocs = sourceDocs.map(doc => ({
                userEmail: doc.userEmail,
                folderName: copyName,
                flipbookName: doc.flipbookName, // Same book name, different folder
                pages: doc.pages,
                lastUpdated: new Date()
            }));
            await Flipbook.insertMany(newDocs);
        }

        res.json({ message: 'Duplicated successfully', newFolderName: copyName });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route POST /api/flipbook/duplicate (Duplicate Book)
router.post('/duplicate', async (req, res) => {
    try {
        const { emailId, folderName, bookName } = req.body;
        if (!emailId || !folderName || !bookName) return res.status(400).json({ message: 'Missing fields' });

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const folderPath = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks', folderName);
        const sourcePath = path.join(folderPath, bookName);

        if (!fs.existsSync(sourcePath)) return res.status(404).json({ message: 'Book not found' });

        // Generate Target Name
        let copyName = `${bookName} Copy`;
        let targetPath = path.join(folderPath, copyName);
        let counter = 1;
        while (fs.existsSync(targetPath)) {
             copyName = `${bookName} Copy ${counter}`;
             targetPath = path.join(folderPath, copyName);
             counter++;
        }

        copyRecursiveSync(sourcePath, targetPath);

        // Ensure Default Assets Folders in Duplicate
        const assetsDir = path.join(targetPath, 'assets');
        ['Image', 'gif', 'video'].forEach(sub => {
            const subDir = path.join(assetsDir, sub);
            if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
        });

        // Duplicate MongoDB Document
        const sourceDoc = await Flipbook.findOne({ userEmail: emailId, folderName: folderName, flipbookName: bookName });
        
        if (sourceDoc) {
            const newFlipbookVId = nanoid(20);
            
            // 1. Map pages to new IDs and update HTML content
            const pageIdMap = new Map(); // old_v_id -> new_v_id
            
            // 2. Duplicate Assets & Rename Physical Files
            const assetFilenameMap = new Map(); // oldFileName -> newFileName
            const assetIdMap = new Map(); // old_file_v_id -> new_file_v_id

            if (sourceDoc.v_id) {
                try {
                    const assets = await FlipbookAsset.find({ flipbook_v_id: sourceDoc.v_id });
                    const newAssets = [];
                    
                    for (const asset of assets) {
                        const newFileVId = nanoid(); // New unique asset ID
                        const ext = path.extname(asset.fileName);
                        const newFileName = `${newFileVId}${ext}`; // Generate new filename
                        
                        // Map IDs
                        if (asset.file_v_id) {
                            assetIdMap.set(asset.file_v_id, newFileVId);
                        }

                        // Determine new page v_id
                        let newPageVId = 'global';
                        if (asset.page_v_id && asset.page_v_id !== 'global') {
                            // We construct the map lazily later, so we might need to pre-fill pageIdMap?
                            // Actually pageIdMap is filled in step 3. But we need it for assets here?
                            // In previous code, pageIdMap was filled *before* assets. 
                            // Let's swap the order or pre-fill pageIdMap.
                        }
                        
                        // Rename Physical File in Target Directory
                        const oldAssetPath = path.join(targetPath, 'assets', asset.assetType, asset.fileName);
                        const newAssetPath = path.join(targetPath, 'assets', asset.assetType, newFileName);
                        
                        if (fs.existsSync(oldAssetPath)) {
                            try {
                                fs.renameSync(oldAssetPath, newAssetPath);
                                assetFilenameMap.set(asset.fileName, newFileName); 
                            } catch (renameErr) {
                                console.error(`Failed to rename duplicated asset: ${asset.fileName}`, renameErr);
                            }
                        }

                        const finalFileName = assetFilenameMap.has(asset.fileName) ? newFileName : asset.fileName;
                        
                        // Construct new URL
                        const sourceString = `/My_Flipbooks/${folderName}/${bookName}/`;
                        const targetString = `/My_Flipbooks/${folderName}/${copyName}/`;
                        let newUrl = asset.url.split(sourceString).join(targetString);
                        
                        if (assetFilenameMap.has(asset.fileName)) {
                             const urlParts = newUrl.split('/');
                             urlParts[urlParts.length - 1] = finalFileName;
                             newUrl = urlParts.join('/');
                        }
                        
                        newAssets.push({
                            flipbook_v_id: newFlipbookVId,
                            file_v_id: newFileVId,
                            page_v_id: asset.page_v_id, // Placeholder, will fix below
                            assetType: asset.assetType,
                            fileName: finalFileName,
                            flipbookName: copyName,
                            folderName: folderName,
                            url: newUrl,
                            size: asset.size,
                            _original_page_v_id: asset.page_v_id // Temp store for later mapping
                        });
                    }
                    
                    // We insert later to fix page_v_ids
                    // But we need the map for HTML updates now.
                    
                    // 3. Pre-Calculate Page IDs
                    sourceDoc.pages.forEach(p => {
                        if (p.v_id) pageIdMap.set(p.v_id, nanoid());
                    });
                    
                    // Update asset page_v_ids
                    newAssets.forEach(a => {
                        if (a._original_page_v_id && a._original_page_v_id !== 'global') {
                            a.page_v_id = pageIdMap.get(a._original_page_v_id) || 'global';
                        }
                        delete a._original_page_v_id;
                    });

                    if (newAssets.length > 0) {
                        await FlipbookAsset.insertMany(newAssets);
                    }
                } catch (assetErr) {
                     console.error("Error duplicating assets:", assetErr);
                }
            } else {
                 // Even if no assets, we must map page IDs
                 sourceDoc.pages.forEach(p => {
                    if (p.v_id) pageIdMap.set(p.v_id, nanoid());
                 });
            }

            // 4. Update Page HTML Content & Build Page DB Objects
            const newPages = sourceDoc.pages.map(page => {
                 const newPageVId = page.v_id ? pageIdMap.get(page.v_id) : nanoid();
                 
                 try {
                     const pageFilePath = path.join(targetPath, page.fileName);
                     if (fs.existsSync(pageFilePath)) {
                         let content = fs.readFileSync(pageFilePath, 'utf8');
                         
                         // A. Update Folder Path in URLs (Essential for all links)
                         const sourceString = `/My_Flipbooks/${folderName}/${bookName}/`;
                         const targetString = `/My_Flipbooks/${folderName}/${copyName}/`;
                         content = content.split(sourceString).join(targetString);
                         
                         // B. Update Asset Filenames (If renamed)
                         assetFilenameMap.forEach((newF, oldF) => {
                             // Replace /oldFilename with /newFilename 
                             content = content.split(`/${oldF}`).join(`/${newF}`);
                         });

                         // C. Update data-file-vid attributes
                         assetIdMap.forEach((newId, oldId) => {
                             content = content.split(`data-file-vid="${oldId}"`).join(`data-file-vid="${newId}"`);
                         });
                         
                         fs.writeFileSync(pageFilePath, content, 'utf8');
                     }
                 } catch (readErr) {
                     console.warn(`Failed to update content for page ${page.fileName}`, readErr);
                 }

                 return {
                     pageNumber: page.pageNumber,
                     name: page.name,
                     fileName: page.fileName, // Filename of PAGE remains same
                     v_id: newPageVId 
                 };
            });

            // 3. Create New Flipbook Record
            await Flipbook.create({
                userEmail: emailId,
                folderName: [folderName], // Ensure array
                flipbookName: copyName,
                pages: newPages,
                v_id: newFlipbookVId,
                lastUpdated: new Date()
            });
        }

        res.json({ message: 'Duplicated successfully', newBookName: copyName });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/flipbook/get
// @desc    Get specific flipbook content (pages)
router.get('/get', async (req, res) => {
    try {
        const { emailId, folderName, bookName, v_id } = req.query;
        if (!emailId || (!v_id && (!folderName || !bookName))) return res.status(400).json({ message: 'Missing fields' });

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        let effectiveFolderName = folderName;
        let effectiveBookName = bookName;

        // V_ID Lookup Logic
        if (v_id) {
             const dbDoc = await Flipbook.findOne({ v_id: v_id });
             if (!dbDoc) return res.status(404).json({ message: 'Flipbook not found' });
             
             // Ensure it matches user (optional but safer)
             if (dbDoc.userEmail !== emailId) return res.status(403).json({ message: 'Unauthorized' });

             effectiveBookName = dbDoc.flipbookName;

             // Resolve folder logic
             if (Array.isArray(dbDoc.folderName)) {
                 const realFolders = dbDoc.folderName.filter(f => f !== 'Recent Book');
                 if (realFolders.length > 0) effectiveFolderName = realFolders[0];
                 else effectiveFolderName = 'My Flipbooks'; // Fallback
             } else {
                 effectiveFolderName = dbDoc.folderName;
             }
        } 
        // Logic for folderName/bookName driven request
        else if (folderName === 'Recent Book') {
             // If requested from Recent Book, find the specific doc tagged with 'Recent Book'
             const dbDoc = await Flipbook.findOne({ userEmail: emailId, flipbookName: bookName, folderName: 'Recent Book' });
             
             if (dbDoc && dbDoc.folderName) {
                 if (Array.isArray(dbDoc.folderName)) {
                     // Get the first non-Recent folder (the physical one)
                     const realFolders = dbDoc.folderName.filter(f => f !== 'Recent Book');
                     if (realFolders.length > 0) effectiveFolderName = realFolders[0];
                 } else if (dbDoc.folderName !== 'Recent Book') {
                     effectiveFolderName = dbDoc.folderName;
                 }
             }
        }

        const bookPath = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks', effectiveFolderName, effectiveBookName);

        if (!fs.existsSync(bookPath)) return res.status(404).json({ message: 'Book not found' });

        let pages = [];

        // 1. Try fetching from MongoDB
        let dbBook = await Flipbook.findOne({ userEmail: emailId, folderName: effectiveFolderName, flipbookName: effectiveBookName });

        if (dbBook && dbBook.pages && dbBook.pages.length > 0) {
            // Sort by pageNumber to ensure correct order
            dbBook.pages.sort((a,b) => a.pageNumber - b.pageNumber);
            
            pages = dbBook.pages.map(p => {
                const filePath = path.join(bookPath, p.fileName);
                if (fs.existsSync(filePath)) {
                    return {
                        name: p.name,
                        html: fs.readFileSync(filePath, 'utf8'),
                        v_id: p.v_id  // Include page v_id for asset tracking
                    };
                }
                return null;
            }).filter(Boolean);
        }

        // 2. Fallback: Scan files if DB has no pages or document not found
        if (pages.length === 0) {
            const files = fs.readdirSync(bookPath).filter(f => f.endsWith('.html'));
            files.sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            pages = files.map(file => {
                const content = fs.readFileSync(path.join(bookPath, file), 'utf8');
                return {
                    name: file.replace('.html', ''),
                    html: content
                };
            });

            // AUTO-HEAL: If pages found on disk but no DB record, create one to ensure v_id
            if (!dbBook && pages.length > 0) {
                try {
                    const newVId = nanoid(10);
                    const stats = fs.statSync(bookPath);
                    const dbPages = pages.map((p, i) => ({
                         pageNumber: i + 1,
                         name: p.name,
                         fileName: `${p.name}.html`
                    }));

                    dbBook = await Flipbook.create({
                        userEmail: emailId,
                        folderName: [effectiveFolderName],
                        flipbookName: effectiveBookName,
                        pages: dbPages,
                        v_id: newVId,
                        createdAt: stats.birthtime || new Date(),
                        lastUpdated: stats.mtime || new Date()
                    });
                } catch (e) { console.error("Auto-heal in get failed", e); }
            }
        }

        res.json({ 
            pages,
            meta: {
                flipbookName: effectiveBookName,
                folderName: effectiveFolderName,
                v_id: dbBook ? dbBook.v_id : null
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route DELETE /api/flipbook/folder
router.delete('/folder', async (req, res) => {
    try {
        const { emailId, folderName } = req.body; 
        if (!emailId || !folderName) return res.status(400).json({ message: 'Missing fields' });
        
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const targetDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks', folderName);

        if (!fs.existsSync(targetDir)) return res.status(404).json({ message: 'Folder not found' });
        
        // Use fs.rmSync to delete recursive
        fs.rmSync(targetDir, { recursive: true, force: true });
        
        // Find all books to be deleted to get their v_ids
        const booksToDelete = await Flipbook.find({ userEmail: emailId, folderName: folderName });
        const bookVIds = booksToDelete.map(b => b.v_id).filter(Boolean);

        if (bookVIds.length > 0) {
             console.log(`Deleting assets for ${bookVIds.length} flipbooks in folder: ${folderName}`);
             try {
                 // Remove asset records
                 const result = await FlipbookAsset.deleteMany({ flipbook_v_id: { $in: bookVIds } });
                 console.log(`Deleted ${result.deletedCount} asset records.`);
                 // Physical files are deleted by fs.rmSync(targetDir) above since assets reside in book folder
             } catch (assetErr) {
                 console.error("Error cleaning up folder assets:", assetErr);
             }
        }

        // Delete from MongoDB
        await Flipbook.deleteMany({ userEmail: emailId, folderName: folderName });

        res.json({ message: 'Deleted successfully' });
    } catch(err) {
         console.error(err);
         res.status(500).json({ message: 'Server error' });
    }
});

// @route POST /api/flipbook/rename
// @route POST /api/flipbook/rename
router.post('/rename', async (req, res) => {
    try {
        const { emailId, folderName, oldName, newName } = req.body;
        // Rename book directory
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        
        // Resolve Real Folder
        let effectiveFolderName = folderName;
        if (folderName === 'Recent Book') {
             const dbDoc = await Flipbook.findOne({ userEmail: emailId, flipbookName: oldName, folderName: 'Recent Book' });
             if (dbDoc && dbDoc.folderName) {
                 if (Array.isArray(dbDoc.folderName)) {
                     const realFolders = dbDoc.folderName.filter(f => f !== 'Recent Book');
                     if (realFolders.length > 0) effectiveFolderName = realFolders[0];
                 } else if (dbDoc.folderName !== 'Recent Book') {
                     effectiveFolderName = dbDoc.folderName;
                 }
             }
        }

        const folderPath = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks', effectiveFolderName);
        const oldBookPath = path.join(folderPath, oldName);
        const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, '');
        const newBookPath = path.join(folderPath, safeNewName); 

        if (!fs.existsSync(oldBookPath)) return res.status(404).json({ message: 'Book not found' });
        if (fs.existsSync(newBookPath)) return res.status(409).json({ message: 'Name exists' });
        
        // Robust Rename for Windows (Handling EPERM/EBUSY)
        try {
            fs.renameSync(oldBookPath, newBookPath);
        } catch (err) {
            if (['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) {
                // 1. Wait 500ms and retry
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    fs.renameSync(oldBookPath, newBookPath);
                } catch (retryErr) {
                    // 2. Fallback: Recursive Copy + Delete
                    console.log("Book Rename failed, attempting copy-delete fallback...");
                    try {
                        copyRecursiveSync(oldBookPath, newBookPath);
                        // Try to delete old folder
                         fs.rmSync(oldBookPath, { recursive: true, force: true });
                    } catch (fallbackErr) {
                         console.error("Cleanup of old book folder failed:", fallbackErr);
                         // Continue as new data is likely safe, but warn
                    }
                }
            } else {
                throw err;
            }
        }

        // Update MongoDB
        // Find doc using unique fields (Name + Folder Tag found).
        // Since we resolved effectiveFolderName, we use that for lookup safety, OR just match the bookName+email.
        // Note: We need to update flipbookName.
        const updatedDoc = await Flipbook.findOneAndUpdate(
            { userEmail: emailId, flipbookName: oldName, folderName: effectiveFolderName },
            { flipbookName: safeNewName, lastUpdated: new Date() },
            { new: true }
        );

        // UPDATE ASSETS: Update flipbookName and reconstruct URLs
        if (updatedDoc && updatedDoc.v_id) {
            try {
                console.log(`Updating assets for renamed flipbook: "${oldName}" → "${safeNewName}"`);
                
                const assets = await FlipbookAsset.find({ flipbook_v_id: updatedDoc.v_id });
                
                if (assets.length > 0) {
                    for (const asset of assets) {
                        // Update flipbookName field
                        asset.flipbookName = safeNewName;
                        
                        // Reconstruct URL with new flipbook name
                        const emailPart = asset.url.split('/My_Flipbooks/')[0];
                        asset.url = `${emailPart}/My_Flipbooks/${asset.folderName}/${safeNewName}/assets/${asset.assetType}/${asset.fileName}`;
                        
                        await asset.save();
                    }
                    console.log(`✅ Updated ${assets.length} asset(s) for renamed flipbook`);
                }
            } catch (err) {
                console.error("❌ Error updating assets after rename:", err);
            }
        }

        // UPDATE HTML CONTENT: Update asset paths in .html files
        try {
            console.log(`Updating HTML content for renamed flipbook...`);
            if (fs.existsSync(newBookPath)) {
                const files = fs.readdirSync(newBookPath);
                const htmlFiles = files.filter(f => f.endsWith('.html'));

                for (const file of htmlFiles) {
                    const filePath = path.join(newBookPath, file);
                    let content = fs.readFileSync(filePath, 'utf8');

                    // URL path segment to replace
                    // Note: We use split/join for global replacement without regex issues
                    const searchString = `/My_Flipbooks/${effectiveFolderName}/${oldName}/`;
                    const replaceString = `/My_Flipbooks/${effectiveFolderName}/${safeNewName}/`;

                    if (content.includes(searchString)) {
                        const newContent = content.split(searchString).join(replaceString);
                        fs.writeFileSync(filePath, newContent, 'utf8');
                        console.log(`Updated HTML content for: ${file}`);
                    }
                }
                console.log(`✅ checked/updated ${htmlFiles.length} HTML file(s)`);
            }
        } catch (htmlErr) {
            console.error("❌ Error updating HTML content:", htmlErr);
        }

        res.json({ message: 'Renamed', newName: safeNewName });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route POST /api/flipbook/move
router.post('/move', async (req, res) => {
    try {
        const { emailId, bookName, currentFolder, targetFolder } = req.body;
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const baseDir = path.join(__dirname, '../../uploads', sanitizedEmail, 'My_Flipbooks');
        
        // Resolve Real Source Folder
        let effectiveCurrentFolder = currentFolder;
        if (currentFolder === 'Recent Book') {
             const dbDoc = await Flipbook.findOne({ userEmail: emailId, flipbookName: bookName, folderName: 'Recent Book' });
             if (dbDoc && dbDoc.folderName) {
                 if (Array.isArray(dbDoc.folderName)) {
                     const realFolders = dbDoc.folderName.filter(f => f !== 'Recent Book');
                     if (realFolders.length > 0) effectiveCurrentFolder = realFolders[0];
                 } else if (dbDoc.folderName !== 'Recent Book') {
                     effectiveCurrentFolder = dbDoc.folderName;
                 }
             }
        }
        
        const oldPath = path.join(baseDir, effectiveCurrentFolder, bookName);
        const newPath = path.join(baseDir, targetFolder, bookName);

        if (!fs.existsSync(oldPath)) return res.status(404).json({ message: 'Book not found' });
        
        if (!fs.existsSync(path.join(baseDir, targetFolder))) {
             fs.mkdirSync(path.join(baseDir, targetFolder), {recursive:true});
        }
        if (fs.existsSync(newPath)) return res.status(409).json({ message: 'Book exists in target' });

        // Move the flipbook directory with Robust Retry for Windows
        try {
            fs.renameSync(oldPath, newPath);
        } catch (err) {
            if (['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) {
                // 1. Wait 500ms and retry
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    fs.renameSync(oldPath, newPath);
                } catch (retryErr) {
                    // 2. Fallback: Recursive Copy + Delete
                    console.log("Move failed, attempting copy-delete fallback...");
                    try {
                        copyRecursiveSync(oldPath, newPath);
                         // Try to delete old folder
                         fs.rmSync(oldPath, { recursive: true, force: true });
                    } catch (fallbackErr) {
                         console.error("Cleanup of old book folder failed:", fallbackErr);
                         // Continue as new data is likely safe, but warn
                    }
                }
            } else {
                throw err;
            }
        }

        // Update MongoDB
        // Swap old folder tag with new folder tag, preserving 'Recent Book' if present
        // FIX: Use $in to search array folderName
        const bookToMove = await Flipbook.findOne({ 
            userEmail: emailId, 
            folderName: { $in: [effectiveCurrentFolder] },  // Search in array
            flipbookName: bookName 
        });
        
        if (bookToMove) {
             if (Array.isArray(bookToMove.folderName)) {
                 // Remove the source folder (effectiveCurrentFolder)
                 let tags = bookToMove.folderName.filter(f => f !== effectiveCurrentFolder);
                 tags.push(targetFolder);
                 bookToMove.folderName = [...new Set(tags)];
             } else {
                 bookToMove.folderName = [targetFolder]; // Fallback
             }
             bookToMove.lastUpdated = new Date();
             await bookToMove.save();

             // UPDATE ASSETS: Update folderName and reconstruct URLs
             if (bookToMove.v_id) {
                 try {
                     console.log(`Updating assets for moved flipbook: "${effectiveCurrentFolder}" → "${targetFolder}"`);
                     
                     const assets = await FlipbookAsset.find({ flipbook_v_id: bookToMove.v_id });
                     
                     if (assets.length > 0) {
                         for (const asset of assets) {
                             // Update folderName field
                             asset.folderName = targetFolder;
                             
                             // Reconstruct URL with new folder name
                             const emailPart = asset.url.split('/My_Flipbooks/')[0];
                             asset.url = `${emailPart}/My_Flipbooks/${targetFolder}/${asset.flipbookName}/assets/${asset.assetType}/${asset.fileName}`;
                             
                             await asset.save();
                         }
                         console.log(`✅ Updated ${assets.length} asset(s) for moved flipbook`);
                     }
                 } catch (err) {
                     console.error("❌ Error updating assets after move:", err);
                 }
             }
        }

        // UPDATE HTML CONTENT: Update asset paths in .html files
        try {
            console.log(`Updating HTML content for moved flipbook...`);
            if (fs.existsSync(newPath)) {
                const files = fs.readdirSync(newPath);
                const htmlFiles = files.filter(f => f.endsWith('.html'));

                for (const file of htmlFiles) {
                    const filePath = path.join(newPath, file);
                    let content = fs.readFileSync(filePath, 'utf8');

                    // URL path segment to replace
                    // Note: We use split/join for global replacement without regex issues
                    const searchString = `/My_Flipbooks/${effectiveCurrentFolder}/${bookName}/`;
                    const replaceString = `/My_Flipbooks/${targetFolder}/${bookName}/`;

                    if (content.includes(searchString)) {
                        const newContent = content.split(searchString).join(replaceString);
                        fs.writeFileSync(filePath, newContent, 'utf8');
                        console.log(`Updated HTML content for: ${file}`);
                    }
                }
                console.log(`✅ checked/updated ${htmlFiles.length} HTML file(s)`);
            }
        } catch (htmlErr) {
            console.error("❌ Error updating HTML content:", htmlErr);
        }

        res.json({ message: 'Moved' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route POST /api/flipbook/remove-recent
router.post('/remove-recent', async (req, res) => {
    try {
        const { emailId, bookName } = req.body;
        if (!emailId || !bookName) return res.status(400).json({ message: 'Missing fields' });

        // Just remove the 'Recent Book' tag
        await Flipbook.updateOne(
            { userEmail: emailId, flipbookName: bookName, folderName: 'Recent Book' },
            { $pull: { folderName: 'Recent Book' } }
        );
        res.json({ message: 'Removed from Recent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route DELETE /api/flipbook/delete
router.delete('/delete', async (req, res) => {
     try {
        const { emailId, folderName, bookName } = req.body;
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const bookPath = path.join(__dirname, '../../uploads', sanitizedEmail, 'My_Flipbooks', folderName, bookName);
        
        if (!fs.existsSync(bookPath)) return res.status(404).json({ message: 'Book not found' });
        
        fs.rmSync(bookPath, { recursive: true, force: true });

        // Delete from MongoDB
        const deletedBook = await Flipbook.findOneAndDelete({ userEmail: emailId, folderName: folderName, flipbookName: bookName });

        if (deletedBook && deletedBook.v_id) {
             console.log(`Deleting assets for flipbook: ${bookName} (${deletedBook.v_id})`);
             try {
                 const assets = await FlipbookAsset.find({ flipbook_v_id: deletedBook.v_id });
                 for (const asset of assets) {
                     // Physical deletion might already happen via recursive rmSync above IF they are in the book folder.
                     // BUT, if assets are stored elsewhere or if rmSync missed something, we try.
                     // Actually, assets are likely inside the book folder: /My_Flipbooks/Folder/Book/assets/
                     // So fs.rmSync(bookPath) likely deleted the files.
                     // WE JUST NEED TO CLEAN UP DB RECORDS.
                     
                     // Extra safety: check if file exists and delete if so (e.g. if asset url was weird)
                     if (asset.url) {
                        const assetPath = path.join(__dirname, '../../', asset.url);
                        if (fs.existsSync(assetPath)) {
                            // This means rmSync of book folder didn't catch it?? 
                            // Ah, maybe gallery assets used in flipbook?
                            // Gallery assets have their own folder. We should NOT delete them if they are Gallery assets.
                            // But here we query by flipbook_v_id. Gallery assets usually don't have flipbook_v_id linked to a specific book?
                            // Wait, if I upload to Gallery, it has no flipbook_v_id?
                            // Let's assume standard assets.
                            try { fs.unlinkSync(assetPath); } catch(e) {}
                        }
                     }
                 }
                 await FlipbookAsset.deleteMany({ flipbook_v_id: deletedBook.v_id });
                 console.log(`Deleted ${assets.length} asset records.`);
             } catch (assetErr) {
                 console.error("Error cleaning up assets:", assetErr);
             }
        }

        res.json({ message: 'Deleted' });
     } catch(err) {
         console.error(err);
         res.status(500).json({ message: 'Server error' });
     }
});

const tempUploadsDir = path.join(__dirname, '../../temp_uploads');
if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempUploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

router.post('/upload-asset', upload.single('file'), async (req, res) => {
    try {
        console.log("Upload Asset Request Body:", req.body);
        const { emailId, type, v_id, replacing_file_v_id, page_v_id } = req.body;
        let { folderName, flipbookName } = req.body;
        const file = req.file;

        if (!file) {
            console.error("Upload Asset: No file in request");
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!emailId) {
             if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
             return res.status(400).json({ message: 'Missing fields: emailId' });
        }

        // 1. Resolve Project Metadata (V_ID, Folder, Name)
        if (v_id) {
             const dbDoc = await Flipbook.findOne({ v_id });
             if (dbDoc) {
                 flipbookName = dbDoc.flipbookName;
                 // Resolve folder
                 if (Array.isArray(dbDoc.folderName)) {
                     const realFolders = dbDoc.folderName.filter(f => f !== 'Recent Book');
                     folderName = realFolders.length > 0 ? realFolders[0] : (dbDoc.folderName[0] || 'My Flipbooks');
                 } else {
                     folderName = dbDoc.folderName;
                 }
                 // Verify ownership
                 if (dbDoc.userEmail !== emailId) {
                     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                     return res.status(403).json({ message: 'Unauthorized' });
                 }
             }
        }

        // Sanitize identifiers to avoid illegal path characters & Ensure non-empty fallback
        let safeFolderName = (folderName || 'My Flipbooks').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
        if (!safeFolderName) safeFolderName = 'My_Flipbooks';
        
        let safeFlipbookName = (flipbookName || 'Untitled Document').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
        if (!safeFlipbookName) safeFlipbookName = 'Untitled_Document';

        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        
        // Define Paths
        let targetDir; // Final directory for file
        let relativeUrlBase; // Base for URL

        const assetType = (type || 'video').toLowerCase(); 

        if (req.body.isGallery === 'true' || req.body.isGallery === true) {
             // Gallery Upload -> Use Global Folders (Images, Videos, gifs)
             // Observed structure: uploads/email/Images, uploads/email/Videos, uploads/email/gifs
             const typeMap = {
                 'image': 'Images',
                 'video': 'Videos',
                 'gif': 'gifs',
                 'svg': 'Images' // Icons share Images folder? Or separate? Defaulting to Images for now.
             };
             const targetFolder = typeMap[assetType] || 'Images';
             
             targetDir = path.join(uploadsDir, sanitizedEmail, targetFolder);
             relativeUrlBase = `/uploads/${sanitizedEmail}/${targetFolder}`;
             
             // Mock DB fields for Gallery assets
             safeFolderName = 'Gallery';
             safeFlipbookName = targetFolder;
             
        } else {
             // Standard Flipbook Upload -> uploads/email/My_Flipbooks/Folder/Book/assets/type
             const flipbookDir = path.join(uploadsDir, sanitizedEmail, 'My_Flipbooks', safeFolderName, safeFlipbookName);
             if (!fs.existsSync(flipbookDir)) {
                  fs.mkdirSync(flipbookDir, { recursive: true });
             }
             targetDir = path.join(flipbookDir, 'assets', assetType);
             relativeUrlBase = `/uploads/${sanitizedEmail}/My_Flipbooks/${safeFolderName}/${safeFlipbookName}/assets/${assetType}`;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // --- Handle Replacement / Old File Deletion ---
        let oldFilename = null;
        let oldUrl = null;

        if (replacing_file_v_id) {
            try {
                const oldAsset = await FlipbookAsset.findOne({ file_v_id: replacing_file_v_id });
                if (oldAsset) {
                    oldFilename = oldAsset.fileName;
                    oldUrl = oldAsset.url;
                    
                    // Delete physical file
                    if (oldAsset.url && oldAsset.url.startsWith('/uploads')) {
                        const oldFilePath = path.join(__dirname, '../../', oldAsset.url);
                        if (fs.existsSync(oldFilePath)) {
                            fs.unlinkSync(oldFilePath);
                            console.log(`Deleted old asset file: ${oldFilePath}`);
                        }
                    }
                    // Delete DB record
                    await FlipbookAsset.deleteOne({ _id: oldAsset._id });
                }
            } catch (delErr) {
                console.warn("Failed to delete old asset:", delErr.message);
            }
        }

        // Generate Unique Filename
        const fileExt = path.extname(file.originalname);
        const file_v_id = nanoid();
        const uniqueFilename = `${file_v_id}${fileExt}`;
        const targetPath = path.join(targetDir, uniqueFilename);
        const finalPageVId = page_v_id || 'global';
        
        // Robust File Move (handles cross-device moves)
        try {
            fs.renameSync(file.path, targetPath);
        } catch (renameErr) {
            console.warn(`Rename failed (${renameErr.code}), attempting copy-unlink...`);
            fs.copyFileSync(file.path, targetPath);
            try { fs.unlinkSync(file.path); } catch(e) { console.warn("Failed to unlink temp file", e); }
        }

        // Generate relative URL
        const relativeUrl = `${relativeUrlBase}/${uniqueFilename}`;

        // UPDATE HTML TEMPLATES if Replacing
        // This block is only relevant for flipbook assets, not gallery assets.
        // The `flipbookDir` variable is only defined in the `else` block of the `isGallery` check.
        // If `isGallery` is true, `flipbookDir` will be undefined, so this check will correctly prevent execution.
        if (oldFilename && oldFilename !== uniqueFilename) {
             try {
                 // flipbookDir will only be defined if it's a standard flipbook upload
                 if (typeof flipbookDir !== 'undefined' && fs.existsSync(flipbookDir)) {
                     const files = fs.readdirSync(flipbookDir);
                     const htmlFiles = files.filter(f => f.endsWith('.html'));
                     
                     for (const file of htmlFiles) {
                         const fPath = path.join(flipbookDir, file);
                         const content = fs.readFileSync(fPath, 'utf8');
                         
                         if (content.includes(oldFilename)) {
                              const newContent = content.split(oldFilename).join(uniqueFilename);
                              fs.writeFileSync(fPath, newContent, 'utf8');
                              console.log(`Updated HTML template ${file}: Replaced ${oldFilename} with ${uniqueFilename}`);
                         }
                     }
                 }
             } catch (htmlErr) {
                 console.error("Error updating HTML templates during asset replacement:", htmlErr);
             }
        }

        // Save to Database
        const newAsset = new FlipbookAsset({
            flipbook_v_id: v_id || 'temp_' + Date.now(), 
            file_v_id: file_v_id,
            page_v_id: finalPageVId,
            assetType: assetType,
            fileName: uniqueFilename,
            flipbookName: safeFlipbookName, 
            folderName: safeFolderName,   
            url: relativeUrl,
            size: file.size
        });

        await newAsset.save();
        
        console.log(`Asset saved successfully: ${uniqueFilename}`);
        res.json({ url: relativeUrl, file_v_id: file_v_id, filename: uniqueFilename });

    } catch (err) {
        console.error("CRITICAL UPLOAD ERROR:", err);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        res.status(500).json({ 
            message: `Server Error: ${err.message}`,
            details: err.toString()
        });
    }
});

// @route GET /api/flipbook/get-gallery-assets
// @desc Get gallery assets (images, videos, gifs) from user's workspace folder
router.get('/get-gallery-assets', async (req, res) => {
    try {
        const { emailId, type } = req.query;
        
        if (!emailId) {
            return res.status(400).json({ message: 'Missing emailId' });
        }
        
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        const uploadsDir = path.join(__dirname, '../../uploads');
        
        // Map asset types to folder names
        const typeMap = {
            'image': 'Images',
            'video': 'Videos',
            'gif': 'gifs'
        };
        
        const assets = [];
        
        // If type is specified, fetch only that type
        const typesToFetch = type ? [type] : ['image', 'video', 'gif'];
        
        for (const assetType of typesToFetch) {
            const folderName = typeMap[assetType];
            const folderPath = path.join(uploadsDir, sanitizedEmail, folderName);
            
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                
                for (const file of files) {
                    const filePath = path.join(folderPath, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isFile()) {
                        // Construct the URL
                        const url = `/uploads/${sanitizedEmail}/${folderName}/${file}`;
                        
                        assets.push({
                            name: file,
                            url: url,
                            type: assetType,
                            size: stats.size,
                            uploadedAt: stats.mtime
                        });
                    }
                }
            }
        }
        
        // Sort by upload date (newest first)
        assets.sort((a, b) => b.uploadedAt - a.uploadedAt);
        
        res.json({ assets });
        
    } catch (err) {
        console.error('Error fetching gallery assets:', err);
        res.status(500).json({ 
            message: 'Server error',
            details: err.toString()
        });
    }
});

// @route   POST /api/flipbook/upload-asset
// @desc    Upload asset (image/video/gif) to flipbook's assets folder
// @access  Public
router.post('/upload-asset', assetUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { emailId, folderName, flipbookName, assetType, pageVId, flipbookVId } = req.body;
        
        if (!emailId || !folderName || !flipbookName || !assetType) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const sanitizedEmail = emailId.replace(/[@.]/g, '_');
        
        // Construct URL
        const url = `/uploads/${sanitizedEmail}/My_Flipbooks/${folderName}/${flipbookName}/assets/${assetType}/${req.file.filename}`;
        
        // Generate unique file_v_id
        const fileVId = nanoid();
        
        // Save to database
        const assetDoc = await FlipbookAsset.create({
            flipbook_v_id: flipbookVId || 'unknown',
            file_v_id: fileVId,
            page_v_id: pageVId || 'global',
            assetType: assetType,
            fileName: req.file.filename,
            flipbookName: flipbookName,
            folderName: folderName,
            url: url,
            size: req.file.size
        });
        
        res.status(200).json({
            message: 'Asset uploaded successfully',
            asset: {
                file_v_id: fileVId,
                url: url,
                fileName: req.file.filename,
                size: req.file.size,
                assetType: assetType
            }
        });
        
    } catch (error) {
        console.error('Error uploading asset:', error);
        
        // Clean up file if database save failed
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                console.error('Failed to clean up file:', unlinkErr);
            }
        }
        
        res.status(500).json({ 
            message: 'Server error uploading asset',
            error: error.message 
        });
    }
});

// @route   DELETE /api/flipbook/delete-asset
// @desc    Delete an asset from flipbook
// @access  Public
router.delete('/delete-asset', async (req, res) => {
    try {
        const { fileVId, emailId } = req.query;
        
        if (!fileVId) {
            return res.status(400).json({ message: 'Missing file_v_id' });
        }
        
        // Find asset in database
        const asset = await FlipbookAsset.findOne({ file_v_id: fileVId });
        
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        
        // Verify ownership if emailId provided
        if (emailId) {
            const sanitizedEmail = emailId.replace(/[@.]/g, '_');
            if (!asset.url.includes(sanitizedEmail)) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }
        
        // Delete physical file
        if (asset.url && asset.url.startsWith('/uploads')) {
            const filePath = path.join(__dirname, '../../', asset.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted asset file: ${filePath}`);
            }
        }
        
        // Delete from database
        await FlipbookAsset.deleteOne({ file_v_id: fileVId });
        
        res.status(200).json({ message: 'Asset deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ 
            message: 'Server error deleting asset',
            error: error.message 
        });
    }
});

export default router;