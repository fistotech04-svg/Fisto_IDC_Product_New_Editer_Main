import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Folder, Plus, ArrowLeft, Search, MoreVertical, Trash2, Edit2, Copy, Eye, Wrench, PenTool, BarChart2, Share2, Download, FolderInput, SlidersHorizontal, CheckSquare, Check, X, Home, Library, ArrowRight, UploadCloud, Upload, ChevronLeft, ChevronRight, ChevronDown, ArrowDownUp, Globe, Lock, Settings, CloudUpload } from 'lucide-react';
import { Icon } from '@iconify/react';

import AlertModal from '../components/AlertModal';
import CreateFlipbookModal from '../components/CreateFlipbookModal';
import { convertPdfToImages, getPdfPageCount, generatePdfPageSvg } from '../utils/pdfUtils';
import PdfProcessingLoader from '../components/PdfProcessingLoader';
import ShareModal from '../components/ShareModal';
import ExportModal from '../components/ExportModal';

const sortCategories = [
    {
        id: 'recent',
        title: 'Recent Activity',
        subtitle: 'Recent Activity',
        options: ['Recently Opened', 'Recently Modified', 'Recently Created']
    },
    {
        id: 'name',
        title: 'Name',
        subtitle: 'Recent Activity',
        options: ['Name (A → Z)', 'Name (Z → A)']
    },
    {
        id: 'performance',
        title: 'Performance',
        subtitle: 'Recent Activity',
        options: ['Most Viewed', 'Most Shared', 'Most Downloaded', 'Most Liked']
    },
    {
        id: 'size',
        title: 'File & Size',
        subtitle: 'Recent Activity',
        options: ['Largest File Size', 'Smallest File Size', 'Total Pages (High → Low)', 'Total Pages (Low → High)']
    }
];

const templates = [
    { id: 'corporate', label: 'A4', title: 'Corporate Brochure', dim: '(29.7 x 42 Cm)', width: 'w-[2.25vw]', height: 'h-[3vw]' },
    { id: 'catalogue', label: 'A4', title: 'Product Catalogue', dim: '(21 x 29 Cm)', width: 'w-[3vw]', height: 'h-[2vw]' },
    { id: 'large_catalogue', label: 'A3', title: 'Large Catalogue', dim: '(29.7 x 42 Cm)', width: 'w-[2.5vw]', height: 'h-[3.5vw]' },
    { id: 'showcase', label: 'A3', title: 'Showcase Brochure', dim: '(42 x 29.7 Cm)', width: 'w-[3.5vw]', height: 'h-[2.5vw]' },
    { id: 'mini', label: 'A5', title: 'Mini Brochure', dim: '(14.8 x 21 Cm)', width: 'w-[1.75vw]', height: 'h-[2.5vw]' },
    { id: 'booklet', label: 'B5', title: 'Standard Booklet', dim: '(17.6 x 25 Cm)', width: 'w-[1.75vw]', height: 'h-[2.5vw]' },
    { id: 'square', label: 'Square', title: 'Square Lookbook', dim: '(25 x 25 Cm)', width: 'w-[2.5vw]', height: 'h-[2.5vw]' },
    { id: 'square_small', label: 'Square Small', title: 'Square Small', dim: '(20 x 20 Cm)', width: 'w-[2vw]', height: 'h-[2vw]' },
    { id: 'digital_mag', label: 'Mag', title: 'Digital Magazine', dim: '(22 x 28 Cm)', width: 'w-[1.75vw]', height: 'h-[2.75vw]' },
    { id: 'mobile', label: 'Mob', title: 'Mobile Flipbook', dim: '(12 x 21.3 Cm)', width: 'w-[1.5vw]', height: 'h-[2.5vw]' },
];


export default function MyFlipbooks() {
    const navigate = useNavigate();

    // User Data
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const emailId = user?.emailId;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    const [activeFolder, setActiveFolder] = useState(() => localStorage.getItem('last_active_folder') || 'Recent Book');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [sortOption, setSortOption] = useState('Recently Created');
    const [activeSortCategory, setActiveSortCategory] = useState(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const statusDropdownRef = useRef(null);
    const sortDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Template Carousel State
    const [templateIndex, setTemplateIndex] = useState(0);

    const nextTemplate = () => {
        if (templateIndex < templates.length - 5) {
            setTemplateIndex(templateIndex + 1);
        }
    };

    const prevTemplate = () => {
        if (templateIndex > 0) {
            setTemplateIndex(templateIndex - 1);
        }
    };

    // Persist Active Folder
    useEffect(() => {
        localStorage.setItem('last_active_folder', activeFolder);
    }, [activeFolder]);
    const [folders, setFolders] = useState([]);
    const [books, setBooks] = useState([]);

    // Data Fetching
    const fetchData = async () => {
        if (!emailId) return;
        setIsLoading(true);
        try {
            // Fetch Folders
            const folderRes = await axios.get(`${backendUrl}/api/flipbook/folders`, { params: { emailId } });
            // Filter out System Folders
            let folderNames = (folderRes.data.folders || []).filter(f => f !== 'Public Book' && f !== 'Recent Book' && f !== 'Recent book');

            // Ensure Recent Book is at the top (if we add it back manually or keep it)
            folderNames = folderNames.sort((a, b) => a.localeCompare(b));

            // Add Recent Book manually at top
            folderNames = ['Recent Book', ...folderNames];

            setFolders(folderNames.map(name => ({ id: name, name })));

            // Fetch Books
            const booksRes = await axios.get(`${backendUrl}/api/flipbook/list`, { params: { emailId } });
            setBooks(booksRes.data.books || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [emailId]);

    useEffect(() => {
        setSelectedBooks([]);
    }, [activeFolder]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialView, setCreateModalInitialView] = useState('selection');
    const [selectedTemplateIdForModal, setSelectedTemplateIdForModal] = useState('corporate');
    const [initialDroppedFiles, setInitialDroppedFiles] = useState(null);

    const handleUploadBoxDragOver = (e) => {
        e.preventDefault();
    };

    const handleUploadBoxDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setInitialDroppedFiles(Array.from(e.dataTransfer.files));
            setCreateModalInitialView('upload');
            setIsCreateModalOpen(true);
        }
    };

    // Inline Folder Creation State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderInputName, setNewFolderInputName] = useState('');
    const folderListRef = useRef(null);

    // Auto-scroll to bottom when creating folder
    useEffect(() => {
        if (isCreatingFolder && folderListRef.current) {
            folderListRef.current.scrollTo({
                top: folderListRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [isCreatingFolder]);

    const [isLoading, setIsLoading] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(null);
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'error',
        showCancel: false,
        onConfirm: null
    });

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedFlipbook, setSelectedFlipbook] = useState(null);

    const handleShareClick = (book) => {
        let resolvedBook = { ...book };
        if (resolvedBook.folder === 'Recent Book' || resolvedBook.folder === 'Recent book') {
            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
            if (physicalBook) resolvedBook.folder = physicalBook.folder;
        }
        setSelectedFlipbook(resolvedBook);
        setIsShareModalOpen(true);
    };

    const handleDownloadClick = (book) => {
        let resolvedBook = { ...book };
        if (resolvedBook.folder === 'Recent Book' || resolvedBook.folder === 'Recent book') {
            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
            if (physicalBook) resolvedBook.folder = physicalBook.folder;
        }
        setSelectedFlipbook(resolvedBook);
        setIsExportModalOpen(true);
    };


    const showAlert = (title, message, type = 'error') => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            showCancel: false,
            onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
        });
    };

    const handleUploadPDF = async (files, customName) => {
        if (!files || files.length === 0) return;
        setIsCreateModalOpen(false);
        setIsLoading(true);

        try {
            let allImages = [];

            // 1. Extract images from all PDFs
            for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
                const file = files[fileIndex];

                setProcessingProgress({
                    current: 0,
                    total: 1,
                    message: `Extracting pages from ${file.name}...`
                });

                // convertPdfToImages(file, scale, limit)
                const images = await convertPdfToImages(file, 2);
                allImages = [...allImages, ...images];
            }

            if (allImages.length > 0) {
                const firstW = allImages[0].width;
                const firstH = allImages[0].height;
                const isUniform = allImages.every(img =>
                    Math.abs(img.width - firstW) < 1 &&
                    Math.abs(img.height - firstH) < 1
                );

                if (!isUniform) {
                    showAlert("Uniformity Error", "Selected PDF pages have different dimensions. All pages in a flipbook must have the same size to ensure a professional layout.");
                    return;
                }

                var maxWidth = firstW;
                var maxHeight = firstH;
            } else {
                showAlert("Error", "No pages could be extracted from the selected files.");
                return;
            }

            // 2. Create the unified flipbook record
            const now = new Date();
            const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            const uniqueName = customName || `PDF_Flipbook_${timeString}`;
            const targetFolder = activeFolder === 'Recent Book' ? 'My Flipbooks' : activeFolder;

            setProcessingProgress({ current: 0, total: allImages.length, message: 'Creating flipbook...' });

            // Create empty pages structure first
            const initialPages = allImages.map((_, i) => ({
                pageName: `Page ${i + 1}`,
                content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxWidth} ${maxHeight}" width="100%" height="100%"></svg>`
            }));

            const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
                emailId,
                flipbookName: uniqueName,
                pages: initialPages,
                overwrite: true,
                folderName: targetFolder
            });

            const v_id = createRes.data.v_id;

            // 3. Upload all aggregated pages as assets
            const uploadedAssets = [];
            for (let i = 0; i < allImages.length; i++) {
                setProcessingProgress({
                    current: i + 1,
                    total: allImages.length,
                    message: `Uploading page ${i + 1} of ${allImages.length}...`
                });

                const formData = new FormData();
                formData.append('file', allImages[i].blob, `page-${i + 1}.svg`);
                formData.append('emailId', emailId);
                formData.append('type', 'image');
                formData.append('v_id', v_id);
                formData.append('folderName', targetFolder);
                formData.append('flipbookName', uniqueName);
                formData.append('page_v_id', 'global');

                const uploadRes = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedAssets.push(uploadRes.data.url);
            }

            // 4. Update the flipbook with final SVG content
            const finalPages = allImages.map((img, i) => {
                const assetUrl = uploadedAssets[i]; // e.g., /uploads/.../assets/image/filename.png
                const filename = assetUrl.split('/').pop();
                const relativeUrl = `./assets/image/${filename}`;
                const html = generatePdfPageSvg(relativeUrl, `Page ${i + 1}`, maxWidth, maxHeight);

                return {
                    pageName: `Page ${i + 1}`,
                    content: html
                };
            });

            await axios.post(`${backendUrl}/api/flipbook/save`, {
                emailId,
                v_id,
                flipbookName: uniqueName,
                pages: finalPages,
                overwrite: true,
                folderName: targetFolder
            });

            // 5. Navigate to customized editor for PDF
            navigate(`/editor/customized_editor/${encodeURIComponent(targetFolder)}/${v_id}`);

        } catch (error) {
            console.error("PDF conversion error:", error);
            showAlert("Error", "Failed to process PDF. Please try again.");
        } finally {
            setIsLoading(false);
            setProcessingProgress(null);
        }
    };

    const handleUseTemplate = async (templateData) => {
        setIsCreateModalOpen(false);
        if (!templateData) return;

        // Check Auto-Save Preference
        let isAutoSave = true;
        try {
            const storedSetting = localStorage.getItem('isAutoSaveEnabled');
            if (storedSetting !== null) isAutoSave = JSON.parse(storedSetting);
        } catch (e) { console.warn("Error reading auto-save setting", e); }

        // Check for Email - Mandatory for backend creation
        if (!emailId) {
            console.error("Cannot pre-create flipbook: No user email found.");
            navigate('/editor', { state: templateData });
            return;
        }

        // Always pre-create the flipbook record to ensure we have a stable v_id
        // for assets and saves, regardless of whether periodic auto-save is enabled.
        setIsLoading(true);
        console.log("Pre-creating flipbook record...");

        try {
            const pageCount = templateData.pageCount || 12;
            const pages = Array.from({ length: pageCount }, (_, i) => ({
                pageName: `Page ${i + 1}`,
                content: ''
            }));

            const now = new Date();
            const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            const uniqueName = templateData.flipbookName || `Flipbook_${timeString}`;
            const targetFolder = activeFolder === 'Recent Book' ? 'My Flipbooks' : activeFolder;

            console.log(`Saving new flipbook "${uniqueName}" to "${targetFolder}"...`);
            const res = await axios.post(`${backendUrl}/api/flipbook/save`, {
                emailId,
                flipbookName: uniqueName,
                pages: pages,
                overwrite: true,
                folderName: targetFolder
            });

            console.log("Creation result:", res.data);

            if (res.data && res.data.v_id) {
                const redirectUrl = `/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`;
                console.log("Navigating with v_id:", redirectUrl);
                navigate(redirectUrl, { state: templateData });
            } else {
                console.warn("Backend didn't return v_id, using fallback editor route");
                navigate('/editor', { state: templateData });
            }
        } catch (e) {
            console.error("Creation failed", e);
            showAlert('Creation Error', 'Backend creation failed. You can still edit, but must save manually.', 'warning');
            navigate('/editor', { state: templateData });
        } finally {
            setIsLoading(false);
        }
    };

    // Renaming States
    const [editingId, setEditingId] = useState(null);
    const [tempName, setTempName] = useState('');

    // Menu Action State
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [folderMenuPos, setFolderMenuPos] = useState({ top: 0, left: 0, isDropup: false });

    // Open Inline Create
    const handleAddFolderClick = () => {
        setIsCreatingFolder(true);
        setNewFolderInputName('');
    };

    const saveNewFolder = async () => {
        if (!newFolderInputName.trim()) {
            setIsCreatingFolder(false);
            return;
        }
        await handleCreateFolder(newFolderInputName.trim());
        setIsCreatingFolder(false);
        setNewFolderInputName('');
    };

    // Create Folder
    const handleCreateFolder = async (name) => {
        setIsLoading(true);
        try {
            await axios.post(`${backendUrl}/api/flipbook/folder/create`, { emailId, folderName: name });
            await fetchData();
            setActiveFolder(name);
        } catch (err) {
            console.error(err);
            showAlert('Create Failed', err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (folder) => {
        setEditingId(folder.id);
        setTempName(folder.name);
    };

    const saveEdit = async () => {
        if (!editingId || !tempName.trim()) {
            setEditingId(null);
            return;
        }

        const folder = folders.find(f => f.id === editingId);
        if (!folder || folder.name === tempName.trim()) {
            setEditingId(null);
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${backendUrl}/api/flipbook/folder/rename`, {
                emailId,
                oldName: folder.name,
                newName: tempName.trim()
            });
            if (activeFolder === folder.name) setActiveFolder(tempName.trim());
            await fetchData();
        } catch (err) {
            console.error(err);
            const msg = err.response?.status === 409 ? 'Folder name already exists.' : (err.response?.data?.message || err.message);
            showAlert('Rename Failed', msg);
        } finally {
            setIsLoading(false);
            setEditingId(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        }
    };

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        folderId: null,
        folderName: ''
    });

    const handleDeleteFolderClick = (folder) => {
        setActiveMenuId(null);
        setDeleteConfirmation({
            isOpen: true,
            folderId: folder.id,
            folderName: folder.name
        });
    };

    const confirmDelete = async () => {
        if (deleteConfirmation.folderId) {
            setIsLoading(true);
            try {
                await axios.delete(`${backendUrl}/api/flipbook/folder`, {
                    data: { emailId, folderName: deleteConfirmation.folderName }
                });

                if (activeFolder === deleteConfirmation.folderName) setActiveFolder('Recent Book');
                await fetchData();
            } catch (err) {
                console.error(err);
                showAlert('Delete Failed', err.response?.data?.message || err.message);
            } finally {
                setIsLoading(false);
            }
        }
        setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' });
    };

    const handleDuplicateFolder = async (folder) => {
        setActiveMenuId(null);
        setIsLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/flipbook/folder/duplicate`, {
                emailId, folderName: folder.name
            });
            const newName = res.data.newFolderName;

            await fetchData();

            startEditing({ id: newName, name: newName });

        } catch (err) {
            console.error(err);
            showAlert('Duplicate Failed', err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    /* Selection State */
    const [selectedBooks, setSelectedBooks] = useState([]);

    /* Menu State */
    const [activeBookMenu, setActiveBookMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, isDropup: false });

    // Book Renaming State
    const [editingBookId, setEditingBookId] = useState(null);
    const [tempBookTitle, setTempBookTitle] = useState('');

    // Book Delete Confirmation
    const [deleteBookConfirmation, setDeleteBookConfirmation] = useState({
        isOpen: false,
        bookId: null,
        bookTitle: ''
    });

    // Book Move State
    const [moveBookModal, setMoveBookModal] = useState({
        isOpen: false,
        bookId: null,
        isBulk: false // Added to track bulk move
    });

    // Conflict / Rename & Move State
    const [conflictModal, setConflictModal] = useState({
        isOpen: false,
        book: null,
        targetFolder: '',
        newName: ''
    });

    // --- Selection Logic ---
    const handleSelectAll = () => {
        if (selectedBooks.length === filteredBooks.length) {
            setSelectedBooks([]);
        } else {
            setSelectedBooks(filteredBooks.map(b => b.id));
        }
    };

    const toggleBookSelection = (id) => {
        setSelectedBooks(prev =>
            prev.includes(id) ? prev.filter(bookId => bookId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedBooks.length === 0) return;
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: 'BULK',
            bookTitle: `${selectedBooks.length} Selected Books`
        });
    };

    const handleBulkMove = () => {
        if (selectedBooks.length === 0) return;
        setMoveBookModal({
            isOpen: true,
            bookId: 'BULK',
            isBulk: true
        });
    };

    // --- Book Handlers ---

    const handleDuplicateBook = async (book) => {
        setActiveBookMenu(null);
        setIsLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/flipbook/duplicate`, {
                emailId,
                folderName: book.folder,
                bookName: book.realName
            });
            const newName = res.data.newBookName;
            await fetchData();

            const newId = `${book.folder}_${newName}`;
            startEditingBook({ id: newId, title: newName, folder: book.folder, realName: newName });

        } catch (err) {
            console.error(err);
            showAlert('Duplicate Failed', err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFromRecent = async (book) => {
        setActiveBookMenu(null);
        setIsLoading(true);
        try {
            await axios.post(`${backendUrl}/api/flipbook/remove-recent`, {
                emailId,
                bookName: book.realName
            });
            await fetchData();
        } catch (err) {
            console.error(err);
            showAlert('Remove Failed', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBookClick = (book) => {
        setActiveBookMenu(null);
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: book.id,
            bookTitle: book.title
        });
    };

    const confirmDeleteBook = async () => {
        setIsLoading(true);
        try {
            const isRecent = activeFolder === 'Recent Book';
            const endpoint = isRecent ? `${backendUrl}/api/flipbook/remove-recent` : `${backendUrl}/api/flipbook/delete`;

            if (deleteBookConfirmation.bookId === 'BULK') {
                await Promise.all(selectedBooks.map(bookId => {
                    const book = books.find(b => b.id === bookId);
                    if (book) {
                        if (isRecent) {
                            return axios.post(endpoint, {
                                emailId,
                                bookName: book.realName
                            });
                        } else {
                            return axios.delete(endpoint, {
                                data: { emailId, folderName: book.folder, bookName: book.realName }
                            });
                        }
                    }
                    return Promise.resolve();
                }));
                setSelectedBooks([]);
            } else if (deleteBookConfirmation.bookId) {
                const book = books.find(b => b.id === deleteBookConfirmation.bookId);
                if (book) {
                    if (isRecent) {
                        await axios.post(endpoint, { emailId, bookName: book.realName });
                    } else {
                        await axios.delete(endpoint, {
                            data: { emailId, folderName: book.folder, bookName: book.realName }
                        });
                    }
                }
                setSelectedBooks(prev => prev.filter(id => id !== deleteBookConfirmation.bookId));
            }
            await fetchData();
        } catch (err) {
            console.error(err);
            showAlert('Delete Failed', err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
            setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' });
        }
    };

    const startEditingBook = (book) => {
        setActiveBookMenu(null);
        setEditingBookId(book.id);
        setTempBookTitle(book.title);
    };

    const saveBookEdit = async () => {
        if (editingBookId && tempBookTitle.trim()) {
            const book = books.find(b => b.id === editingBookId);

            // Frontend duplicate check (Global Uniqueness)
            const isDuplicate = books.some(b =>
                b.title.toLowerCase() === tempBookTitle.trim().toLowerCase() &&
                b.id !== editingBookId
            );

            if (isDuplicate) {
                showAlert('Name Exists', 'A flipbook with this name already exists (possibly in another folder). Please choose a unique name.');
                setEditingBookId(null); // Revert to previous name
                return; // Stop execution
            }

            if (book && book.title !== tempBookTitle.trim()) {
                setIsLoading(true);
                try {
                    await axios.post(`${backendUrl}/api/flipbook/rename`, {
                        emailId,
                        folderName: book.folder,
                        oldName: book.realName,
                        newName: tempBookTitle.trim()
                    });
                    await fetchData();
                } catch (err) {
                    console.error(err);
                    const msg = err.response?.status === 409 ? 'Flipbook name already exists.' : (err.response?.data?.message || err.message);
                    showAlert('Rename Failed', msg);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        setEditingBookId(null);
    };

    const handleBookKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveBookEdit();
        }
    };

    const handleMoveBookClick = (book) => {
        setActiveBookMenu(null);
        setMoveBookModal({
            isOpen: true,
            bookId: book.id
        });
    };

    const confirmMoveBook = async (targetFolder) => {
        // Helper to perform the actual move request
        const performMove = async (book, targetId) => {
            await axios.post(`${backendUrl}/api/flipbook/move`, {
                emailId,
                bookName: book.realName,
                currentFolder: book.folder,
                targetFolder: targetId
            });
        };

        try {
            if (moveBookModal.bookId === 'BULK') {
                for (const bookId of selectedBooks) {
                    const book = books.find(b => b.id === bookId);
                    if (book) {
                        try {
                            await performMove(book, targetFolder);
                        } catch (err) {
                            if (err.response?.status === 409) {
                                setConflictModal({
                                    isOpen: true,
                                    book,
                                    targetFolder,
                                    newName: book.realName
                                });
                                setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
                                return;
                            }
                            console.error(err);
                        }
                    }
                }
                setSelectedBooks([]);
                setActiveFolder(targetFolder);
            } else if (moveBookModal.bookId) {
                const book = books.find(b => b.id === moveBookModal.bookId);
                if (book) {
                    try {
                        await performMove(book, targetFolder);
                    } catch (err) {
                        if (err.response?.status === 409) {
                            setConflictModal({
                                isOpen: true,
                                book,
                                targetFolder,
                                newName: book.realName
                            });
                            setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
                            return;
                        }
                        throw err;
                    }
                }
            }
            await fetchData();
        } catch (err) {
            console.log(err);
            showAlert('Move Failed', err.response?.data?.message || err.message);
        }
        setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
        setIsCreatingInMove(false); // Reset create mode
        setNewMoveFolderName('');
    };

    const handleRenameAndMove = async () => {
        const { book, newName, targetFolder } = conflictModal;
        if (!book || !newName.trim() || !targetFolder) return;

        setIsLoading(true);
        try {
            // 1. Rename in Source
            if (newName.trim() !== book.realName) {
                await axios.post(`${backendUrl}/api/flipbook/rename`, {
                    emailId,
                    folderName: book.folder,
                    oldName: book.realName,
                    newName: newName.trim()
                });
            } else {
                showAlert("Name Exists", "Please choose a different name to resolve the conflict.");
                setIsLoading(false);
                return;
            }

            // 2. Move to Target
            await axios.post(`${backendUrl}/api/flipbook/move`, {
                emailId,
                bookName: newName.trim(), // Use new name
                currentFolder: book.folder,
                targetFolder
            });

            await fetchData();
            setConflictModal({ isOpen: false, book: null, targetFolder: '', newName: '' });

        } catch (err) {
            console.error(err);
            const msg = err.response?.status === 409 ? 'Name still conflicts (in source or target).' : err.message;
            showAlert('Action Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Create Folder in Move Modal Logic ---
    const [isCreatingInMove, setIsCreatingInMove] = useState(false);
    const [newMoveFolderName, setNewMoveFolderName] = useState('');
    const moveModalListRef = useRef(null);

    useEffect(() => {
        if (isCreatingInMove && moveModalListRef.current) {
            moveModalListRef.current.scrollTo({
                top: moveModalListRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [isCreatingInMove]);

    const handleCreateFolderAndMove = async () => {
        if (!newMoveFolderName.trim()) return;
        const name = newMoveFolderName.trim();
        try {
            await axios.post(`${backendUrl}/api/flipbook/folder/create`, { emailId, folderName: name });
            await confirmMoveBook(name);
        } catch (err) { console.error(err); }
    };



    // Filter books by active folder, search query, and status
    const filteredBooks = books.filter(book => {
        const matchesFolder = book.folder === activeFolder;
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.realName.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter !== 'All Status') {
            if (statusFilter === 'Public') matchesStatus = book.isPublic !== false;
            else if (statusFilter === 'Private') matchesStatus = book.isPublic === false;
            else if (statusFilter === 'Protected') matchesStatus = book.status === 'protected' || book.isProtected === true;
            else if (statusFilter === 'Email') matchesStatus = book.status === 'email' || book.isEmailProtected === true;
        }
        return matchesFolder && matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const parseDate = (dateVal) => {
            if (!dateVal) return 0;
            let parsed = new Date(dateVal).getTime();
            if (!isNaN(parsed)) return parsed;

            // Attempt to parse DD-MM-YYYY or DD/MM/YYYY
            if (typeof dateVal === 'string') {
                const parts = dateVal.split(/[-/]/);
                if (parts.length === 3 && parts[2].length === 4) {
                    parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                    if (!isNaN(parsed)) return parsed;
                }
            }
            return 0;
        };

        if (sortOption === 'Recently Created') {
            return parseDate(b.createdAt || b.created) - parseDate(a.createdAt || a.created);
        }
        if (sortOption === 'Recently Opened' || sortOption === 'Recently Modified') {
            // Fallback to created date if opened/modified fields don't exist
            return parseDate(b.updatedAt || b.createdAt || b.created) - parseDate(a.updatedAt || a.createdAt || a.created);
        }
        if (sortOption === 'Name (A → Z)') {
            return (a.title || '').localeCompare(b.title || '');
        }
        if (sortOption === 'Name (Z → A)') {
            return (b.title || '').localeCompare(a.title || '');
        }
        if (sortOption === 'Most Viewed' || sortOption === 'Most Shared' || sortOption === 'Most Downloaded' || sortOption === 'Most Liked') {
            return (b.views || 0) - (a.views || 0);
        }
        if (sortOption === 'Largest File Size') {
            return (parseInt(b.size) || 0) - (parseInt(a.size) || 0);
        }
        if (sortOption === 'Smallest File Size') {
            return (parseInt(a.size) || 0) - (parseInt(b.size) || 0);
        }
        if (sortOption === 'Total Pages (High → Low)') {
            return (parseInt(b.pages) || 0) - (parseInt(a.pages) || 0);
        }
        if (sortOption === 'Total Pages (Low → High)') {
            return (parseInt(a.pages) || 0) - (parseInt(b.pages) || 0);
        }
        return 0;
    });

    const isAllSelected = filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length;

    return (
        <div className="flex bg-[#eef0f8] h-full">
            {/* Sidebar */}
            <aside className="w-[18vw] bg-white h-[92vh] fixed left-0 top-[8vh] border-r border-gray-100 flex flex-col p-[1.5vw] z-20">

                {/* Back to Home */}
                <Link
                    to="/home"
                    className="w-full flex items-center justify-center gap-[0.5vw] px-[1vw] py-[0.75vw] rounded-[0.5vw] border-[1.5px] border-gray-800 text-gray-900 font-bold hover:bg-gray-50 transition-colors text-[1vw] mb-[2vw]"
                >
                    <Home size="1.2vw" />
                    Back to Home
                </Link>

                {/* Folders Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Static Header Area */}
                    <div className="flex-none mb-[1vw]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                                <span className="text-[0.875vw] font-bold text-gray-600">Your Folders</span>
                                <div className="h-[1px] bg-gray-200 flex-1 ml-[0.5vw] mr-[0.5vw]"></div>
                            </div>
                            <button
                                onClick={handleAddFolderClick}
                                className="flex items-center cursor-pointer gap-[0.25vw] px-[0.75vw] py-[0.375vw] rounded-[0.5vw] border border-[#3b4190] shadow-sm text-[#3b4190] font-medium text-[0.75vw] bg-white hover:bg-blue-50 transition-colors"
                            >
                                <Plus size="0.8vw" /> Create
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Folder List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.25vw] pb-[1vw]" ref={folderListRef}>
                        <div className="space-y-[0.25vw]">
                            {folders.map(folder => {
                                const isEditing = editingId === folder.id;
                                const isActive = activeFolder === folder.name;
                                const displayName = folder.name === 'Recent Book' ? 'Recent Book' : folder.name;

                                const getFolderCount = (fName) => {
                                    if (fName === 'Recent Book') {
                                        return books.length;
                                    }
                                    return books.filter(b => b.folder === fName).length;
                                };
                                const folderCount = getFolderCount(folder.name);

                                return isEditing ? (
                                    <div key={folder.id} className="w-full px-[1vw] py-[0.6vw] rounded-[0.5vw] border border-[#3b4190] bg-white shadow-sm">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-[0.875vw] font-medium text-gray-900 focus:outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        key={folder.id}
                                        onClick={() => setActiveFolder(folder.name)}
                                        className={`relative group w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] rounded-[0.5vw] transition-all text-[0.875vw] font-medium text-left cursor-pointer
                              ${isActive
                                                ? 'bg-[#eef0f8] text-[#3b4190]'
                                                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                          `}
                                    >
                                        <Folder size="1.1vw" className={isActive ? "text-[#3b4190]" : "text-gray-500"} />
                                        <span className="truncate flex-1">{displayName}</span>

                                        {folder.name !== 'Recent Book' && (
                                            <div className="relative flex items-center justify-end h-[1.5vw] min-w-[1.5vw]">
                                                <span className={`text-[0.75vw] font-semibold transition-all duration-300 ease-in-out ${isActive ? 'text-[#3b4190]' : 'text-gray-400'} ${activeMenuId === folder.id ? 'pr-[2vw]' : 'pr-[0.5vw] group-hover:pr-[2vw]'}`}>
                                                    {folderCount}
                                                </span>

                                                {/* Options Menu Trigger */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (activeMenuId === folder.id) {
                                                            setActiveMenuId(null);
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                            const isDropup = spaceBelow < 120;
                                                            setFolderMenuPos({
                                                                top: isDropup ? rect.top - 5 : rect.bottom + 5,
                                                                left: rect.right,
                                                                isDropup
                                                            });
                                                            setActiveMenuId(folder.id);
                                                        }
                                                    }}
                                                    className={`absolute right-0 p-[0.375vw] flex items-center justify-center rounded-[0.5vw] bg-transparent transition-all ${isActive
                                                        ? 'hover:bg-gray-50 text-[#3b4190]'
                                                        : 'hover:bg-gray-100 text-gray-500'
                                                        } ${activeMenuId === folder.id ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}
                                                >
                                                    <MoreVertical size="0.9vw" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* New Folder Input */}
                            {isCreatingFolder && (
                                <div className="w-full px-[1vw] py-[0.6vw] rounded-[0.5vw] border border-[#3b4190] bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Folder Name..."
                                        value={newFolderInputName}
                                        onChange={(e) => setNewFolderInputName(e.target.value)}
                                        onBlur={saveNewFolder}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                saveNewFolder();
                                            }
                                            if (e.key === 'Escape') {
                                                setIsCreatingFolder(false);
                                            }
                                        }}
                                        className="w-full text-[0.875vw] font-medium text-gray-900 focus:outline-none placeholder-gray-400"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-none pt-[0.5vw]">
                        <div className="mb-[1vw] border-t border-gray-100"></div>

                        <div className="w-full flex items-center justify-between px-[1vw] py-[0.6vw] rounded-[0.5vw] transition-all text-[0.875vw] font-medium cursor-pointer hover:bg-red-50 text-red-500">
                            <div className="flex items-center gap-[0.75vw]">
                                <Trash2 size="1.1vw" />
                                <span>Trash</span>
                            </div>
                            <span className="text-[0.75vw] font-semibold">2</span>
                        </div>
                    </div>
                </div>

                {/* Upgrade to Pro Card */}
                <div className="mt-auto relative z-30 pt-[1.5vw]">
                    <div className="absolute -top-[1vw] right-[0.5vw] text-[2.5vw] drop-shadow-lg z-40 transform rotate-[15deg]">
                        👑
                    </div>
                    <div className="w-full bg-[#0a0a0a] rounded-[0.75vw] p-[1.25vw] relative overflow-hidden text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-500 via-gray-900 to-black"></div>

                        {/* CSS Noise texture overlay */}
                        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                        <div className="relative z-10 flex flex-col gap-[0.25vw]">
                            <h3 className="text-[1.1vw] font-bold tracking-wide">Upgrade to Pro</h3>
                            <p className="text-[0.65vw] text-gray-300 mb-[0.75vw] leading-relaxed pr-[1vw]">
                                Unlock more Storage, templates and Premium features.
                            </p>
                            <button className="w-full bg-white text-black py-[0.5vw] px-[0.75vw] rounded-[0.5vw] text-[0.75vw] font-bold flex items-center justify-center gap-[0.375vw] hover:bg-gray-100 transition-colors shadow-md mt-[0.25vw]">
                                Update Profile <ArrowRight size="0.9vw" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Global Folder Dropdown Portal */}
                {activeMenuId && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                        <div
                            className="fixed z-[101] w-[8vw] bg-white rounded-[0.5vw] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                            style={{
                                top: folderMenuPos.top,
                                left: folderMenuPos.left,
                                transform: folderMenuPos.isDropup ? 'translate(-100%, -100%)' : 'translate(-100%, 0)'
                            }}
                        >
                            {(() => {
                                const folder = folders.find(f => f.id === activeMenuId);
                                if (!folder) return null;
                                return (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(folder);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                        >
                                            <Edit2 size="0.8vw" />
                                            Rename
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateFolder(folder);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                        >
                                            <Copy size="0.8vw" />
                                            Duplicate
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFolderClick(folder);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size="0.8vw" />
                                            Delete
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}
            </aside>

            {/* Main Content */}
            <main
                className="flex-1 ml-[18vw] px-[2vw] pb-[2vw] pt-[1vw] relative overflow-hidden bg-[#d9dbe9] flex flex-col"
            >

                <h1 className="text-[1.45vw] font-semibold text-gray-900 mb-[1.25vw] relative z-10">Quick Create your Flipbook</h1>

                {/* Quick Create Section */}
                <div className="w-full flex gap-[1vw] mb-[1.5vw] z-10 relative">
                    {/* Upload Box */}
                    <div
                        className="w-[30%] bg-white rounded-[0.75vw] border-[0.15vw] border-dashed border-[#4c5add] flex flex-col items-center justify-center py-[0.75vw] cursor-pointer hover:bg-blue-50/50 transition-colors shadow-sm min-h-[5.5vw]"
                        onClick={() => { setCreateModalInitialView('upload'); setIsCreateModalOpen(true); }}
                        onDragOver={handleUploadBoxDragOver}
                        onDrop={handleUploadBoxDrop}
                    >

                        <CloudUpload size="2vw" className="text-gray-500 mb-[0.25vw]" strokeWidth={1.5} />
                        <p className="text-[0.85vw] text-gray-500 mb-[0.5vw]">Drag & Drop or <span className="text-[#4c5add]">Upload</span></p>
                        <div className="flex items-center gap-[0.5vw] text-[0.65vw] text-gray-600">
                            Supported File format-
                            <div className="flex items-center gap-[0.5vw] ml-[0.25vw]">
                                <Icon icon="vscode-icons:file-type-pdf2" className="w-[1.25vw] h-[1.25vw]" />
                                <Icon icon="vscode-icons:file-type-word" className="w-[1.25vw] h-[1.25vw]" />
                                <Icon icon="vscode-icons:file-type-powerpoint" className="w-[1.25vw] h-[1.25vw]" />
                            </div>
                        </div>
                    </div>

                    {/* Create From Scratch Box */}
                    <div className="flex-1 bg-white rounded-[0.75vw] py-[0.75vw] px-[1.5vw] shadow-sm flex items-center justify-between min-h-[5.5vw]">
                        <div className="w-[30%] pl-[0.5vw]">
                            <h3 className="text-[1.1vw] font-bold text-gray-700 mb-[0.15vw]">Create From Scratch</h3>
                            <p className="text-[0.65vw] text-gray-500 leading-relaxed pr-[1vw]">Begin with a blank canvas and design your flipbook your way.</p>
                        </div>

                        <div className="flex-1 flex items-center justify-between px-[1vw]">
                            <button onClick={prevTemplate} className={`p-[0.25vw] rounded-full transition-colors ${templateIndex > 0 ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`} disabled={templateIndex === 0}><ChevronLeft size="1.25vw" /></button>

                            <div className="flex-1 flex justify-center items-center overflow-hidden">
                                <div className="w-[28vw] overflow-hidden">
                                    <div
                                        className="flex items-end gap-[0.75vw] transition-transform duration-500 ease-in-out w-max"
                                        style={{ transform: `translateX(calc(-${templateIndex} * 5.75vw))` }}
                                    >
                                        {templates.map((template) => (
                                            <div
                                                key={template.id}
                                                className="flex flex-col items-center gap-[0.25vw] cursor-pointer group shrink-0 w-[5vw]"
                                                onClick={() => {
                                                    setSelectedTemplateIdForModal(template.id);
                                                    setCreateModalInitialView('template');
                                                    setIsCreateModalOpen(true);
                                                }}
                                            >
                                                <div className={`${template.width} ${template.height} bg-[#a7a2e5] rounded-[0.2vw] shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center text-gray-700 text-[0.45vw] font-bold text-center p-[0.1vw] leading-tight`}>{template.label}</div>
                                                <div className="text-center mt-[0.15vw]">
                                                    <p className="text-[0.45vw] font-bold text-gray-600 group-hover:text-[#4c5add]">{template.title}</p>
                                                    <p className="text-[0.40vw] font-semibold text-gray-400">{template.dim}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={nextTemplate} className={`p-[0.25vw] rounded-full transition-colors ${templateIndex < templates.length - 5 ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`} disabled={templateIndex >= templates.length - 5}><ChevronRight size="1.25vw" /></button>
                        </div>
                    </div>
                </div>

                {/* List Container */}
                <div className="w-full flex-1 min-h-0 bg-transparent border border-gray-300 rounded-[1vw] p-[1.5vw] relative flex flex-col shadow-sm">

                    {/* Filter Bar */}
                    <div className="flex items-center justify-between mb-[1.5vw] z-30 relative w-full">
                        <div className="flex items-center gap-[1vw]">
                            {/* Search Input */}
                            <div className="relative w-[18vw]">
                                <Search className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-500" size="1vw" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-[2.5vw] pr-[1vw] py-[0.5vw] rounded-[0.5vw] border border-gray-300 text-[0.875vw] focus:outline-none focus:ring-1 focus:ring-[#4c5add] focus:border-[#4c5add] bg-white text-gray-700 placeholder-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Dropdowns */}
                            <div className="relative" ref={statusDropdownRef}>
                                <button
                                    onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsSortDropdownOpen(false); }}
                                    className="flex items-center justify-between min-w-[8vw] px-[1vw] py-[0.5vw] bg-white border border-gray-300 rounded-[0.5vw] text-[0.875vw] text-gray-600 hover:bg-gray-50 shadow-sm"
                                >
                                    <div className="flex items-center gap-[0.5vw]">
                                        {statusFilter === 'All Status' && <Icon icon="lucide:layers" className="w-[0.9vw] h-[0.9vw]" />}
                                        {statusFilter === 'Public' && <Globe size="0.9vw" />}
                                        {statusFilter === 'Private' && <Lock size="0.9vw" />}
                                        {statusFilter === 'Protected' && <Icon icon="lucide:shield" className="w-[0.9vw] h-[0.9vw]" />}
                                        {statusFilter === 'Email' && <Icon icon="lucide:mail" className="w-[0.9vw] h-[0.9vw]" />}
                                        <span>{statusFilter}</span>
                                    </div>
                                    <ChevronDown size="0.9vw" className="text-gray-400 ml-[0.5vw]" />
                                </button>
                                {isStatusDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[0.25vw] w-full bg-white border border-gray-200 rounded-[0.5vw] shadow-lg z-50 py-[0.25vw]">
                                        {['All Status', 'Public', 'Private', 'Protected', 'Email'].map((status) => {
                                            let StatusIcon = null;
                                            if (status === 'All Status') StatusIcon = <Icon icon="lucide:layers" className="w-[0.9vw] h-[0.9vw]" />;
                                            else if (status === 'Public') StatusIcon = <Globe size="0.9vw" />;
                                            else if (status === 'Private') StatusIcon = <Lock size="0.9vw" />;
                                            else if (status === 'Protected') StatusIcon = <Icon icon="lucide:shield" className="w-[0.9vw] h-[0.9vw]" />;
                                            else if (status === 'Email') StatusIcon = <Icon icon="lucide:mail" className="w-[0.9vw] h-[0.9vw]" />;

                                            return (
                                                <button
                                                    key={status}
                                                    onClick={() => { setStatusFilter(status); setIsStatusDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] text-[0.875vw] text-gray-700 hover:bg-blue-50 hover:text-[#4c5add] transition-colors"
                                                >
                                                    {StatusIcon}
                                                    <span>{status}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsStatusDropdownOpen(false); }}
                                    className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-white border border-gray-300 rounded-[0.5vw] text-[0.875vw] text-gray-600 hover:bg-gray-50 shadow-sm min-w-[12vw] justify-between"
                                >
                                    <div className="flex items-center gap-[0.5vw]">
                                        <Icon icon="lucide:filter" className="w-[0.9vw] h-[0.9vw] text-gray-400" />
                                        <span>{sortOption}</span>
                                    </div>
                                    <ChevronDown size="0.9vw" className="text-gray-400 ml-[0.25vw]" />
                                </button>
                                {isSortDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[0.25vw] flex z-50">
                                        {/* Main Categories Box */}
                                        <div className="w-[14vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-lg py-[0.5vw] flex flex-col relative">
                                            {sortCategories.map(category => (
                                                <div
                                                    key={category.id}
                                                    className={`px-[1vw] py-[0.5vw] cursor-pointer flex justify-between items-center transition-colors ${activeSortCategory === category.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                                    onMouseEnter={() => setActiveSortCategory(category.id)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.875vw] text-gray-700 font-medium leading-tight">{category.title}</span>
                                                        <span className="text-[0.55vw] text-gray-400 mt-[0.1vw]">
                                                            ● {category.options.includes(sortOption) ? sortOption : category.options[0]}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size="0.9vw" className="text-gray-400" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Sub Categories Box */}
                                        {activeSortCategory && (
                                            <div className="ml-[0.5vw] min-w-[12vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-lg py-[0.5vw] flex flex-col h-fit">
                                                {sortCategories.find(c => c.id === activeSortCategory)?.options.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => { setSortOption(option); setIsSortDropdownOpen(false); setActiveSortCategory(null); }}
                                                        className="w-full text-left px-[1vw] py-[0.5vw] text-[0.875vw] text-gray-700 hover:bg-blue-50 hover:text-[#4c5add] transition-colors whitespace-nowrap"
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-[1vw]">
                            {/* Selected Actions */}
                            {selectedBooks.length > 0 && (
                                <div className="flex items-center gap-[0.5vw] mr-[1vw]">
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.4vw] bg-white text-red-500 border border-red-200 rounded-[0.5vw] hover:bg-red-50 transition-colors shadow-sm text-[0.75vw] font-semibold"
                                    >
                                        <Trash2 size="0.9vw" /> {activeFolder === 'Recent Book' ? 'Remove' : 'Delete'}
                                    </button>
                                    {activeFolder !== 'Recent Book' && (
                                        <button
                                            onClick={handleBulkMove}
                                            className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.4vw] bg-[#4c5add] text-white rounded-[0.5vw] hover:bg-[#3f4bc0] transition-colors shadow-sm text-[0.75vw] font-semibold"
                                        >
                                            <FolderInput size="0.9vw" /> Move
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Checkbox for multiple selection */}
                            <label className="flex items-center gap-[0.5vw] cursor-pointer" onClick={(e) => { e.preventDefault(); handleSelectAll(); }}>
                                <div className={`w-[1.1vw] h-[1.1vw] rounded-[0.15vw] border flex items-center justify-center transition-all ${isAllSelected ? 'bg-gray-400 border-gray-400' : 'border-gray-400 bg-transparent'}`}>
                                    {isAllSelected && <Check size="0.8vw" className="text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-[0.875vw] font-medium text-gray-600">Multiple Selection</span>
                            </label>
                        </div>
                    </div>

                    {/* Content Area */}
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center z-10">
                            <div className="animate-spin rounded-full h-[3vw] w-[3vw] border-[0.25vw] border-white/20 border-t-white"></div>
                            <p className="text-white/80 mt-[1vw] font-medium text-[0.875vw]">Loading Flipbooks...</p>
                        </div>
                    ) : filteredBooks.length > 0 ? (
                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar pr-[0.5vw] z-10 space-y-[1vw] min-h-0"
                            onScroll={() => setActiveBookMenu(null)} // Close menu on scroll
                        >
                            {filteredBooks.map((book, index) => {
                                const isBookEditing = editingBookId === book.id;
                                const isSelected = selectedBooks.includes(book.id);

                                // Resolve the actual folder location if in virtual 'Recent Book' folder
                                let actualFolder = book.folder;
                                if (actualFolder === 'Recent Book' || actualFolder === 'Recent book') {
                                    const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
                                    if (physicalBook) actualFolder = physicalBook.folder;
                                }

                                // Use actualFolder and book.realName (folder name on server) to generate the base path
                                const iframeBaseUrl = `${backendUrl}/uploads/${user?.emailId?.replace(/[@.]/g, "_")}/My_Flipbooks/${encodeURIComponent(actualFolder)}/${encodeURIComponent(book.realName)}/`;

                                return (
                                    <div
                                        key={book.id}
                                        className="flex items-center gap-[0.5vw] group" // Flex container for Checkbox + Card
                                    >
                                        {/* Checkbox Outside Card - Visible only on Select */}
                                        <div
                                            className={`transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden
                                            ${selectedBooks.length > 0 ? 'w-[2vw] opacity-100 mr-[0.5vw]' : 'w-0 opacity-0'}
                                        `}
                                            onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id); }}
                                        >
                                            <div className={`w-[1.25vw] h-[1.25vw] rounded-[0.25vw] border-[0.125vw] flex items-center justify-center transition-colors flex-shrink-0
                                            ${isSelected
                                                    ? 'bg-white border-white'
                                                    : 'border-white hover:bg-white/10'
                                                }`}
                                            >
                                                {isSelected && <Check size="0.9vw" className="text-[#343868]" strokeWidth={3} />}
                                            </div>
                                        </div>

                                        {/* The Card */}
                                        <div
                                            onDoubleClick={() => toggleBookSelection(book.id)}
                                            className="w-full bg-white rounded-[0.75vw] p-[0.75vw] flex gap-[1vw] items-center shadow-lg relative transition-all duration-200 hover:scale-[1.01]"
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-[8vw] h-[6vw] bg-gray-100 rounded-[0.5vw] overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center relative">
                                                {book.firstPageHtml ? (
                                                    <iframe
                                                        title={`Preview of ${book.title}`}
                                                        className="w-full h-full border-none pointer-events-none"
                                                        srcDoc={`
                                                    <!DOCTYPE html>
                                                    <html>
                                                    <head>
                                                        <base href="${iframeBaseUrl}">
                                                        <style>
                                                            html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: transparent; }
                                                            svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        ${book.firstPageHtml.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')}
                                                    </body>
                                                    </html>
                                                `}
                                                    />
                                                ) : book.image ? (
                                                    <img src={`${backendUrl}${book.image}`} alt={book.title} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                                        <BookOpen size="2vw" strokeWidth={1.5} />
                                                        <span className="text-[0.6vw] mt-1 uppercase font-bold tracking-wider">No Preview</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between h-[6vw] py-[0.25vw]">
                                                {/* Header Row */}
                                                <div className="flex justify-between items-start w-full mb-[0.25vw]">
                                                    <div>
                                                        <div className="flex items-center gap-[0.5vw]">
                                                            {isBookEditing ? (
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={tempBookTitle}
                                                                    onChange={(e) => setTempBookTitle(e.target.value)}
                                                                    onBlur={saveBookEdit}
                                                                    onKeyDown={handleBookKeyDown}
                                                                    className="text-[1.125vw] font-bold text-gray-800 border-b border-[#4c5add] focus:outline-none w-[16vw]"
                                                                />
                                                            ) : (
                                                                <h3 className="text-[1.125vw] font-bold text-gray-800">{book.title}</h3>
                                                            )}

                                                            {/* Public / Private Pill */}
                                                            <div className={`flex items-center gap-[0.25vw] px-[0.5vw] py-[0.1vw] rounded-[0.25vw] text-[0.55vw] font-bold ${book.isPublic !== false ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                {book.isPublic !== false ? <Icon icon="subway:world-1" className="w-[0.6vw] h-[0.6vw]" /> : <Lock size="0.6vw" />}
                                                                {book.isPublic !== false ? 'Public' : 'Private'}
                                                            </div>
                                                        </div>
                                                        <p className="text-[0.65vw] text-gray-400 font-medium mt-[0.25vw]">{book.pages} Pages</p>
                                                    </div>

                                                    <div className="flex gap-[1.5vw] text-[0.65vw] text-gray-400 font-medium">
                                                        <span>Created on : {book.created}</span>
                                                        <span>Views : {book.views || 245}</span>
                                                        <span>Size : {book.size || '24MB'}</span>
                                                    </div>
                                                </div>

                                                {/* Action Row */}
                                                <div className="flex items-center justify-between w-full mt-auto pt-[0.5vw]">
                                                    <button className="flex items-center cursor-pointer gap-[0.375vw] text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                                        <Eye size="0.9vw" /> View Book
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            let targetFolder = book.folder;
                                                            if (targetFolder === 'Recent Book') {
                                                                const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                                                if (physicalBook) targetFolder = physicalBook.folder;
                                                            }
                                                            const identifier = book.v_id || encodeURIComponent(book.realName);
                                                            navigate(`/editor/customized_editor/${encodeURIComponent(targetFolder)}/${identifier}`);
                                                        }}
                                                        className="flex items-center gap-[0.375vw] cursor-pointer text-[0.75vw] font-semibold text-[#4c5add] hover:text-[#3a44b1] transition-colors"
                                                    >
                                                        <Wrench size="0.9vw" /> Customize
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            let targetFolder = book.folder;
                                                            if (targetFolder === 'Recent Book') {
                                                                const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                                                if (physicalBook) targetFolder = physicalBook.folder;
                                                            }
                                                            const identifier = book.v_id || encodeURIComponent(book.realName);
                                                            navigate(`/editor/${encodeURIComponent(targetFolder)}/${identifier}`);
                                                        }}
                                                        className="flex items-center gap-[0.375vw] cursor-pointer text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        <PenTool size="0.9vw" /> Open in Editor
                                                    </button>
                                                    <button className="flex items-center gap-[0.375vw] cursor-pointer text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                                        <BarChart2 size="0.9vw" /> Statistic
                                                    </button>
                                                    <button
                                                        onClick={() => handleShareClick(book)}
                                                        className="flex items-center gap-[0.375vw] cursor-pointer text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        <Share2 size="0.9vw" /> Share
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadClick(book)}
                                                        className="flex items-center gap-[0.375vw] cursor-pointer text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        <Download size="0.9vw" /> Download
                                                    </button>

                                                    {/* More Options */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Calculate position
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const screenHeight = window.innerHeight;
                                                                const spaceBelow = screenHeight - rect.bottom;
                                                                const menuHeight = 160; // Approx height

                                                                // Determine if we should show above or below
                                                                const showAbove = spaceBelow < menuHeight;

                                                                setMenuPosition({
                                                                    top: showAbove ? (rect.top - 5) : (rect.bottom + 5),
                                                                    left: rect.right,
                                                                    isDropup: showAbove,
                                                                    activeId: book.id
                                                                });

                                                                setActiveBookMenu(activeBookMenu === book.id ? null : book.id);
                                                                setActiveBookMenu(activeBookMenu === book.id ? null : book.id);
                                                            }}
                                                            className="flex items-center gap-[0.25vw] cursor-pointer text-[0.75vw] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                                                        >
                                                            <MoreVertical size="0.9vw" /> More
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State - Perfectly Centered */
                        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 pb-[3vw]">
                            {activeFolder === 'Recent Book' ? (
                                <>
                                    <div
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="w-[4vw] h-[4vw] rounded-full bg-[#4c5add]/10 flex items-center justify-center mb-[1vw] backdrop-blur-sm border border-[#4c5add]/20 cursor-pointer hover:bg-[#4c5add]/20 transition-all"
                                    >
                                        <Plus size="2vw" className="text-[#4c5add]" />
                                    </div>
                                    <h3 className="text-[1.25vw] font-medium text-[#4c5add] mb-[0.25vw]">Create Flipbook</h3>
                                    <p className="text-[#4c5add]/60 text-[0.875vw]">There are no flipbooks in {activeFolder}</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-[4vw] h-[4vw] rounded-full bg-[#4c5add]/5 flex items-center justify-center mb-[1vw] backdrop-blur-sm border border-[#4c5add]/10">
                                        <Folder size="2vw" className="text-[#4c5add]/50" />
                                    </div>
                                    <h3 className="text-[1.25vw] font-medium text-[#4c5add] mb-[0.25vw]">No Flipbooks Found</h3>
                                    <p className="text-[#4c5add]/60 text-[0.875vw]">This folder is empty</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Decorative blob inside card */}
                    <div className="absolute -bottom-[5vw] -right-[5vw] w-[24vw] h-[24vw] bg-[#4c5add] rounded-full blur-[5vw] opacity-50 pointer-events-none"></div>
                </div>
            </main>

            {/* Fixed Book Menu Portal */}
            {activeBookMenu && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveBookMenu(null); }}></div>
                    <div
                        className="fixed z-[101] w-[12vw] bg-white rounded-[0.75vw] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: menuPosition.isDropup ? 'translate(-100%, -100%)' : 'translate(-100%, 0)'
                        }}
                    >
                        {/* Find active book */}
                        {(() => {
                            const book = books.find(b => b.id === activeBookMenu);
                            if (!book) return null;
                            return (
                                <>
                                    <button
                                        onClick={() => startEditingBook(book)}
                                        className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-700 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                                    >
                                        <Edit2 size="0.9vw" className="group-hover:text-white" />
                                        Rename
                                    </button>
                                    <button
                                        onClick={() => handleMoveBookClick(book)}
                                        className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                                    >
                                        <FolderInput size="0.9vw" className="group-hover:text-white" />
                                        Move to folder
                                    </button>
                                    {activeFolder !== 'Recent Book' && (
                                        <button
                                            onClick={() => handleDuplicateBook(book)}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                                        >
                                            <Plus size="0.9vw" className="border border-current rounded-[0.125vw] p-[0.0625vw] group-hover:border-white" />
                                            Duplicate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (activeFolder === 'Recent Book') {
                                                handleRemoveFromRecent(book);
                                            } else {
                                                handleDeleteBookClick(book);
                                            }
                                        }}
                                        className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors group"
                                    >
                                        <Trash2 size="0.9vw" className="group-hover:text-white" />
                                        {activeFolder === 'Recent Book' ? 'Remove' : 'Delete'}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </>
            )}



            {/* Move Book Modal */}
            {moveBookModal.isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[1.5vw] w-full max-w-[25vw] p-[1.5vw] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-[1vw]">
                            <h3 className="text-[1.25vw] font-bold text-[#343868]">Move to Folder</h3>
                            {!isCreatingInMove ? (
                                <button
                                    onClick={() => setIsCreatingInMove(true)}
                                    className="flex items-center gap-[0.35vw] px-[0.75vw] py-[0.35vw] rounded-full border border-gray-200 shadow-sm text-gray-600 font-medium text-[0.75vw] bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <Plus size="0.85vw" /> New Folder
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsCreatingInMove(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size="1vw" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-[0.5vw] max-h-[15vw] overflow-y-auto custom-scrollbar pr-[0.25vw] mb-[1.25vw] scroll-smooth" ref={moveModalListRef}>
                            {/* Create Folder Input */}
                            {isCreatingInMove && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-[0.75vw]">
                                    <label className="block text-[0.75vw] font-medium text-gray-500 mb-[0.25vw]">New Folder Name</label>
                                    <div className="w-full flex items-center gap-[0.5vw] p-[0.35vw] rounded-[0.75vw] border border-[#3b4190] bg-[#3b4190]/5">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Enter folder name..."
                                            value={newMoveFolderName}
                                            onChange={(e) => setNewMoveFolderName(e.target.value)}
                                            className="flex-1 px-[0.5vw] py-[0.25vw] bg-transparent text-[0.85vw] font-medium focus:outline-none text-[#343868] placeholder-gray-400"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolderAndMove()}
                                        />
                                        <button onClick={handleCreateFolderAndMove} className="p-[0.35vw] bg-[#3b4190] text-white rounded-[0.5vw] hover:bg-[#2f3575] transition-colors">
                                            <Check size="0.9vw" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {folders.filter(f => f.name !== 'Recent Book').map(folder => {
                                let isCurrent = false;

                                if (moveBookModal.bookId === 'BULK') {
                                    if (activeFolder !== 'Recent Book') {
                                        isCurrent = folder.name === activeFolder;
                                    }
                                } else {
                                    const book = books.find(b => b.id === moveBookModal.bookId);
                                    if (book) {
                                        let currentRealFolder = book.folder;
                                        if (book.folder === 'Recent Book') {
                                            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                            if (physicalBook) currentRealFolder = physicalBook.folder;
                                        }
                                        isCurrent = folder.name === currentRealFolder;
                                    }
                                }

                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => confirmMoveBook(folder.name)}
                                        disabled={isCurrent}
                                        className={`w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.75vw] rounded-[0.75vw] border text-[0.85vw] font-medium transition-all group text-left
                                       ${isCurrent
                                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#3b4190] hover:bg-blue-50/50 hover:text-[#3b4190]'
                                            }
                                   `}
                                    >
                                        <Folder size="1vw" className={isCurrent ? "text-gray-300" : "text-gray-400 group-hover:text-[#3b4190]"} />
                                        <span className="truncate flex-1">{folder.name}</span>
                                        {isCurrent && <span className="text-[0.65vw] text-gray-400 font-normal ml-2">(Current)</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => {
                                setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
                                setIsCreatingInMove(false);
                                setNewMoveFolderName('');
                            }}
                            className="w-full py-[0.65vw] rounded-[0.75vw] border border-gray-300 text-gray-600 text-[0.85vw] font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Folder Delete Alert */}
            <AlertModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' })}
                onConfirm={confirmDelete}
                type="error"
                title="Delete Folder"
                message={`Are you sure you want to delete "${deleteConfirmation.folderName}"? This action cannot be undone.`}
                showCancel={true}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isLoading}
            />

            {/* Book Delete Alert */}
            <AlertModal
                isOpen={deleteBookConfirmation.isOpen}
                onClose={() => setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' })}
                onConfirm={confirmDeleteBook}
                type="error"
                title={deleteBookConfirmation.bookId === 'BULK' ? "Delete Multiple Flipbooks" : "Delete Flipbook"}
                message={`Are you sure you want to delete "${deleteBookConfirmation.bookTitle}"? This action cannot be undone.`}
                showCancel={true}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isLoading}
            />

            {/* Create Flipbook Modal */}
            <CreateFlipbookModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setInitialDroppedFiles(null); }}
                onUpload={handleUploadPDF}
                onTemplate={handleUseTemplate}
                initialView={createModalInitialView}
                initialTemplateId={selectedTemplateIdForModal}
                existingFlipbooks={books.map(b => b.realName || b.title)}
                initialFiles={initialDroppedFiles}
            />

            {/* PDF Processing Overlay */}
            <PdfProcessingLoader progress={processingProgress} />

            {/* General Loading Overlay (without specific progress) */}
            {isLoading && !processingProgress && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-[1vw] max-w-[20vw] w-full text-center">
                        <div className="w-[3.5vw] h-[3.5vw] border-[0.3vw] border-white/30 border-t-white rounded-full animate-spin mb-[0.5vw]"></div>
                        <p className="text-white font-bold text-[1.15vw] drop-shadow-sm">Loading...</p>
                    </div>
                </div>
            )}

            {/* Generic Alert Modal */}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                showCancel={alertState.showCancel}
                onConfirm={alertState.onConfirm}
                isLoading={isLoading}
            />

            {/* Conflict / Rename & Move Modal */}
            {conflictModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[1vw] w-full max-w-[28vw] p-[1.5vw] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-[1.5vw]">
                            <div className="w-[3vw] h-[3vw] bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-[0.75vw]">
                                <CheckSquare size="1.5vw" className="text-orange-600" />
                            </div>
                            <h3 className="text-[1.25vw] font-semibold text-gray-900 mb-[0.5vw]">Flipbook Already Exists</h3>
                            <p className="text-[0.875vw] text-gray-500">
                                A flipbook named <span className="font-semibold text-gray-800">"{conflictModal.book?.realName}"</span> already exists in <span className="font-semibold text-[#3b4190]">{conflictModal.targetFolder}</span>.
                            </p>
                            <p className="text-[0.875vw] text-gray-500 mt-[0.25vw]">Please rename it to continue moving.</p>
                        </div>

                        <div className="mb-[1.5vw]">
                            <label className="block text-[0.75vw] font-semibold text-gray-700 uppercase mb-[0.5vw]">New Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={conflictModal.newName}
                                onChange={(e) => setConflictModal(prev => ({ ...prev, newName: e.target.value }))}
                                className="w-full px-[1vw] py-[0.75vw] rounded-[0.75vw] border border-gray-300 focus:border-[#3b4190] focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 font-medium transition-all text-[0.875vw]"
                            />
                        </div>

                        <div className="flex gap-[0.75vw]">
                            <button
                                onClick={() => setConflictModal({ isOpen: false, book: null, targetFolder: '', newName: '' })}
                                className="flex-1 py-[0.625vw] rounded-[0.75vw] border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-[0.875vw]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenameAndMove}
                                className="flex-1 py-[0.625vw] rounded-[0.75vw] bg-[#3b4190] text-white font-semibold hover:bg-[#323675] transition-colors shadow-lg shadow-blue-900/20 text-[0.875vw]"
                            >
                                Rename & Move
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                currentBook={selectedFlipbook}
                flipbookThumbnail={selectedFlipbook?.image ? `${backendUrl}${selectedFlipbook.image}` : null}
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                currentBook={selectedFlipbook}
                isFromMyFlipbooks={true}
            />
        </div>
    );
}