import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Folder, Plus, ArrowLeft, Search, MoreVertical, Trash2, Edit2, Copy, Eye, Wrench, PenTool, BarChart2, Share2, Download, FolderInput, SlidersHorizontal, CheckSquare, Check, X } from 'lucide-react';
import DashboardBg from '../assets/images/myflipbook.png';


import AlertModal from '../components/AlertModal';
import CreateFlipbookModal from '../components/CreateFlipbookModal';

export default function MyFlipbooks() {
  const navigate = useNavigate();
  
  // User Data
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const emailId = user?.emailId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const [activeFolder, setActiveFolder] = useState(() => localStorage.getItem('last_active_folder') || 'Recent Book');
  
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
  const [alertState, setAlertState] = useState({
      isOpen: false,
      title: '',
      message: '',
      type: 'error',
      showCancel: false,
      onConfirm: null
  });

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

  const handleUploadPDF = (files) => {
    if (!files || files.length === 0) return;
    setIsCreateModalOpen(false);
    navigate('/editor', { state: { uploadFiles: files } });
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

    // If Auto-Save is DISABLED, do not save to backend yet. 
    // Just navigate to the editor with the template data.
    if (!isAutoSave) {
        console.log("Auto-save is disabled. Skipping backend pre-creation.");
        navigate('/editor', { state: templateData });
        return;
    }

    // Pre-create flipbook to get v_id and avoid "redirect" effect
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
        const uniqueName = `Flipbook_${timeString}`;
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
            navigate(redirectUrl);
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
        
    } catch(err) { 
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

    } catch(err) { 
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
      } catch(err) {
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
    } catch(err) { 
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
              } catch(err) { 
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
      } catch(err) { 
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



  // Filter books by active folder
  const filteredBooks = books.filter(book => book.folder === activeFolder);
  const isAllSelected = filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length;

  return (
    <div className="flex bg-[#eef0f8] min-h-screen pt-[8vh]">
      {/* Sidebar */}
      <aside className="w-[18vw] bg-white h-[92vh] fixed left-0 top-[8vh] border-r border-gray-100 flex flex-col p-[1.5vw] z-20">
        
        {/* Create Button */}
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-black text-white cursor-pointer py-[0.75vw] px-[1vw] rounded-[0.5vw] flex items-center justify-center gap-[0.5vw] font-semibold mb-[2vw] hover:bg-gray-800 transition-colors shadow-lg text-[0.9vw]"
        >
          <BookOpen size="1.1vw" />
          Create Flipbook
        </button>

        {/* Folders Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Static Header Area */}
          <div className="flex-none">
            <div className="mb-[0.5vw] flex items-center">
                <span className="text-[0.875vw] font-bold text-gray-800">Your Folders</span>
                <div className="h-[0.0625vw] bg-gray-200 flex-1 ml-[1vw]"></div>
            </div>
            <div className="flex justify-end mb-[1vw]">
                <button 
                  onClick={handleAddFolderClick}
                  className="flex items-center cursor-pointer gap-[0.375vw] px-[0.75vw] py-[0.375vw] rounded-[0.5vw] border border-gray-200 shadow-sm text-gray-500 font-medium text-[0.75vw] bg-white hover:bg-gray-50 transition-colors"
                >
                    <Plus size="0.9vw" /> Folder
                </button>
            </div>
          </div>

          {/* Scrollable Folder List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.25vw] pb-[1vw]" ref={folderListRef}>
            <div className="space-y-[0.75vw]">
              {folders.map(folder => {
                  const isEditing = editingId === folder.id;
                  const isActive = activeFolder === folder.name;
                  
                  return isEditing ? (
                      <div key={folder.id} className="w-full px-[1vw] py-[0.75vw] rounded-[0.75vw] border border-[#3b4190] bg-white shadow-md">
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
                          className={`relative group w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.75vw] rounded-[0.75vw] border transition-all text-[0.875vw] font-medium text-left cursor-pointer
                              ${isActive 
                                  ? 'bg-[#3b4190] text-white border-[#3b4190] shadow-md' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#3b4190] hover:text-[#3b4190]'
                              }
                          `}
                      >
                          <Folder size="1.1vw" fill={isActive ? "currentColor" : "none"} />
                          <span className="truncate flex-1">{folder.name}</span>

                          {/* Options Menu Trigger */}
                          {folder.name !== 'Recent Book' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                                }}
                                className={`p-[0.375vw] rounded-[0.5vw] transition-all rotate-90 ${
                                    isActive 
                                        ? 'hover:bg-white/20 text-white' 
                                        : 'hover:bg-gray-100 text-gray-500'
                                } ${activeMenuId === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <MoreVertical size="1vw" />
                            </button>
                          )}

                          {/* Dropdown Menu */}
                          {activeMenuId === folder.id && (
                              <>
                                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                  <div className="absolute right-[0.5vw] top-[2.5vw] w-[10vw] bg-white rounded-[0.75vw] shadow-xl border border-gray-100 z-40 overflow-hidden py-[0.25vw] animate-in fade-in zoom-in-95 duration-100">
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              startEditing(folder);
                                              setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                      >
                                          <Edit2 size="0.9vw" />
                                          Rename
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDuplicateFolder(folder);
                                          }}
                                          className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                      >
                                          <Copy size="0.9vw" />
                                          Duplicate
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFolderClick(folder);
                                          }}
                                          className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                          <Trash2 size="0.9vw" />
                                          Delete
                                      </button>
                                  </div>
                              </>
                          )}
                      </div>
                  );
              })}
              
              {/* New Folder Input */}
              {isCreatingFolder && (
                   <div className="w-full px-4 py-3 rounded-xl border-2 border-[#3b4190] bg-white shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                      <input 
                          autoFocus
                          type="text"
                          placeholder="Name..."
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
                          className="w-full text-sm font-medium text-gray-900 focus:outline-none placeholder-gray-400"
                      />
                   </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-auto pt-[1vw]">
             <Link to="/home" className="w-full flex items-center justify-center gap-[0.5vw] px-[1vw] py-[0.75vw] rounded-[0.5vw] border-2 border-[#3b4190] text-[#3b4190] font-medium hover:bg-blue-50 transition-colors text-[0.9vw]">
                 <ArrowLeft size="1.1vw" />
                 Back to Home
             </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 ml-[18vw] p-[2vw] relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${DashboardBg})` }}
      >
           
           <h1 className="text-[2vw] font-semibold text-[#00000] mb-[2vw] relative z-10">My Flipbooks</h1>

           {/* Blue Container Card */}
           <div className="w-full h-[calc(92vh-140px)] bg-[#343b854d] rounded-[1.5vw] p-[1.5vw] shadow-2xl relative flex flex-col">
                <div className="flex items-center justify-between mb-[1.5vw] z-10">
                    <h2 className="text-[1.5vw] font-semibold text-[#343868]">Recent - Flipbooks</h2>
                    
                    <div className="flex items-center gap-[1vw]">
                        {selectedBooks.length > 0 && (
                            <>
                                <button 
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-white text-red-500 border border-red-200 rounded-[0.5vw] hover:bg-red-50 transition-colors shadow-sm text-[0.875vw] font-semibold"
                                >
                                    <Trash2 size="1vw" /> {activeFolder === 'Recent Book' ? 'Remove' : 'Delete'}
                                </button>
                                {activeFolder !== 'Recent Book' && (
                                    <button 
                                        onClick={handleBulkMove}
                                        className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-[#4c5add] text-white rounded-[0.5vw] hover:bg-[#3f4bc0] transition-colors shadow-sm text-[0.875vw] font-semibold"
                                    >
                                        <FolderInput size="1vw" /> Move to Folder
                                    </button>
                                )}
                                <div className="w-[0.0625vw] h-[1.5vw] bg-gray-300 mx-[0.5vw]"></div>
                            </>
                        )}

                        <button 
                            onClick={handleSelectAll}
                            className="flex items-center gap-[0.75vw] cursor-pointer group"
                        >
                            <div className={`w-[1.25vw] h-[1.25vw] rounded-[0.25vw] border-2 flex items-center justify-center transition-all
                                ${isAllSelected 
                                    ? 'bg-white border-white' 
                                    : 'border-white bg-transparent hover:bg-white/10'
                                }`}
                            >
                                {isAllSelected && <Check size="0.9vw" className="text-[#343868]" strokeWidth={3} />}
                            </div>
                            <span className="text-[1vw] font-medium text-white group-hover:text-gray-200 transition-colors">Select All</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-[0.75vw] mb-[1.5vw] z-10">
                    <div className="relative w-[20vw]">
                        <Search className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-[#343b85]" size="1.1vw" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full pl-[2.5vw] pr-[1vw] py-[0.6vw] rounded-full border-none text-[0.875vw] focus:outline-none focus:ring-2 focus:ring-blue-300 text-[#343b85] bg-white shadow-lg"
                        />
                    </div>
                    <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] rounded-full bg-white text-[#343b85] text-[0.875vw] font-semibold shadow-lg hover:bg-gray-50 transition-all">
                        <SlidersHorizontal size="1.1vw" />
                        Filter
                    </button>
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
                            
                            return (
                                <div 
                                    key={book.id} 
                                    className="flex items-center gap-[1vw] group" // Flex container for Checkbox + Card
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
                                    <div className="w-[8vw] h-[6vw] bg-gray-100 rounded-[0.5vw] overflow-hidden flex-shrink-0 border border-gray-100">
                                        <img src={"https://plus.unsplash.com/premium_photo-1677567996070-68fa4181775a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Ym9va3N8ZW58MHx8MHx8fDA%3D"} alt={book.title} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-between h-[6vw] py-[0.25vw]">
                                        {/* Header Row */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {isBookEditing ? (
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        value={tempBookTitle} 
                                                        onChange={(e) => setTempBookTitle(e.target.value)}
                                                        onBlur={saveBookEdit}
                                                        onKeyDown={handleBookKeyDown}
                                                        className="text-[1.125vw] font-bold text-gray-900 border-b border-blue-500 focus:outline-none mb-[0.25vw] w-[16vw]"
                                                    />
                                                ) : (
                                                    <h3 className="text-[1.125vw] font-bold text-gray-900">{book.title}</h3>
                                                )}
                                                <p className="text-[0.75vw] text-gray-500 font-medium">{book.pages} Pages</p>
                                            </div>
                                            <div className="flex gap-[1.5vw] text-[0.625vw] text-gray-400 font-medium">
                                                <span>Created on : {book.created}</span>
                                                <span>Views : {book.views}</span>
                                                <span>Size : {book.size}</span>
                                            </div>
                                        </div>

                                        {/* Action Row */}
                                        <div className="flex items-center justify-between w-full mt-auto pt-[0.5vw]">
                                            <button className="flex items-center gap-[0.375vw] text-[0.75vw] font-semibold text-gray-600 hover:text-blue-600 transition-colors">
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
                                                }}
                                                className="flex items-center gap-[0.375vw] text-[0.75vw] font-semibold text-gray-600 hover:text-[#3f4bc0] transition-colors"
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
                                                    // Use v_id if available for stable URL, otherwise fallback to name
                                                    const identifier = book.v_id || encodeURIComponent(book.realName);
                                                    navigate(`/editor/${encodeURIComponent(targetFolder)}/${identifier}`);
                                                }}
                                                className="flex items-center gap-[0.375vw] text-[0.75vw] font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                                            >
                                                <PenTool size="0.9vw" /> Open in Editor
                                            </button>
                                            <button className="flex items-center gap-[0.375vw] text-[0.75vw] font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                                <BarChart2 size="0.9vw" /> Statistic
                                            </button>
                                            <button className="flex items-center gap-[0.375vw] text-[0.75vw] font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                                <Share2 size="0.9vw" /> Share
                                            </button>
                                            <button className="flex items-center gap-[0.375vw] text-[0.75vw] font-semibold text-gray-500 hover:text-gray-800 transition-colors">
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
                                                className="flex items-center gap-[0.25vw] text-[0.75vw] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
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
                                className="w-[4vw] h-[4vw] rounded-full bg-white/10 flex items-center justify-center mb-[1vw] backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                            >
                                <Plus size="2vw" className="text-white" />
                            </div>
                            <h3 className="text-[1.25vw] font-medium text-white mb-[0.25vw]">Create Flipbook</h3>
                            <p className="text-white/50 text-[0.875vw]">There are no flipbooks in {activeFolder}</p>
                        </>
                    ) : (
                        <>
                            <div className="w-[4vw] h-[4vw] rounded-full bg-white/5 flex items-center justify-center mb-[1vw] backdrop-blur-sm border border-white/10">
                                <Folder size="2vw" className="text-white/50" />
                            </div>
                            <h3 className="text-[1.25vw] font-medium text-white mb-[0.25vw]">No Flipbooks Found</h3>
                            <p className="text-white/50 text-[0.875vw]">This folder is empty</p>
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
      />

      {/* Create Flipbook Modal */}
      <CreateFlipbookModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUpload={handleUploadPDF}
        onTemplate={handleUseTemplate}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="flex flex-col items-center gap-[0.75vw]">
                 <div className="w-[3vw] h-[3vw] border-[0.25vw] border-white/30 border-t-white rounded-full animate-spin"></div>
                 <p className="text-white font-medium text-[1.125vw]">Processing...</p>
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
                          onChange={(e) => setConflictModal(prev => ({...prev, newName: e.target.value}))}
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
    </div>
  );
}