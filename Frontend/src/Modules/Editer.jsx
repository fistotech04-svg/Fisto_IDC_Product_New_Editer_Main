import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';

// IndexedDB Helpers
const DB_NAME = 'Fisto3DContext';
const STORE_NAME = 'EditorState';
const STATE_KEY = 'threed_editor_state';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToDB = async (key, value) => {
   try {
       const db = await initDB();
       return new Promise((resolve, reject) => {
           const tx = db.transaction(STORE_NAME, 'readwrite');
           const store = tx.objectStore(STORE_NAME);
           store.put(value, key);
           tx.oncomplete = () => resolve();
           tx.onerror = () => reject(tx.error);
       });
   } catch (err) {
       console.error("IDB Save Error", err);
   }
};

const getFromDB = async (key) => {
   try {
       const db = await initDB();
       return new Promise((resolve, reject) => {
           const tx = db.transaction(STORE_NAME, 'readonly');
           const store = tx.objectStore(STORE_NAME);
           const req = store.get(key);
           req.onsuccess = () => resolve(req.result);
           req.onerror = () => reject(req.error);
       });
   } catch (err) {
       console.error("IDB Load Error", err);
       return null;
   }
};

const Editor = () => {
  // Auto Save Preferences
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => {
    // Priority: Local Storage -> User Data (if available) -> Default True
    const stored = localStorage.getItem('isAutoSaveEnabled');
    if (stored !== null) return JSON.parse(stored);
    
    // Fallback: Default true (Effect will sync with backend)
    return true;
  });

  // Sync state with backend on mount
  useEffect(() => {
      const fetchSettings = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const res = await axios.get(`${backendUrl}/api/usersetting/get-settings`, {
                    params: { emailId: user.emailId }
                });
                
                if (res.data && res.data.isAutoSaveEnabled !== undefined) {
                    setIsAutoSaveEnabled(res.data.isAutoSaveEnabled);
                    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(res.data.isAutoSaveEnabled));
                }
            } catch (err) {
                console.error("Failed to fetch user settings", err);
            }
        }
      };
      fetchSettings();
  }, []);

  const toggleAutoSave = async (value) => {
    setIsAutoSaveEnabled(value);
    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(value));
    
    // Sync with Backend
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            
            await axios.post(`${backendUrl}/api/usersetting/update-autosave`, {
                emailId: user.emailId,
                isAutoSaveEnabled: value
            });
        }
    } catch (error) {
        console.error("Failed to sync auto-save preference:", error);
    }
  };

  const [exportHandler, setExportHandler] = useState(null);
  const [saveHandler, setSaveHandler] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);

  // Save Success State for Toast
  const [saveSuccessInfo, setSaveSuccessInfo] = useState(null);

  const handleSaveSuccess = (info) => {
      setSaveSuccessInfo(info);
      setTimeout(() => {
          setSaveSuccessInfo(null);
      }, 3000);
  };

  const handleExport = () => {
    if (exportHandler) {
      exportHandler();
    } else {
      console.warn("Export handler is not attached.");
    }
  };

  const handleSave = () => {
    if (saveHandler) {
      saveHandler();
    } else {
      console.warn("Save handler is not attached.");
    }
  };

  // 3D Editor Persistence State
  const [threedState, setThreedState] = useState({
      modelUrl: null,
      modelFile: null,
      modelType: 'glb',
      modelStats: {
        vertexCount: "0",
        polygonCount: "0",
        materialCount: "0",
        fileSize: "0 MB",
        dimensions: "0 X 0 X 0 unit"
      },
      transformValues: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      materialSettings: {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'city',
        color: '#000000', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        lightPosition: { x: 10, y: 10, z: 10 }
      },
      modelName: "",
      materialList: [],
  });

  const [isRestoring, setIsRestoring] = useState(true);

  // Restore State from IndexedDB on Mount
  useEffect(() => {
      const loadState = async () => {
          try {
              const savedState = await getFromDB(STATE_KEY);
              if (savedState) {
                  // Reconstruct URL from Blob if present
                  let restoredUrl = null;
                  if (savedState.modelFile instanceof Blob) {
                      restoredUrl = URL.createObjectURL(savedState.modelFile);
                  }
                  
                  let restoredModels = savedState.models;
                  if (restoredModels && Array.isArray(restoredModels)) {
                      restoredModels = restoredModels.map(m => {
                          if (m.file instanceof Blob) {
                              return { ...m, url: URL.createObjectURL(m.file) };
                          }
                          // If it's not a blob, keep the URL that was saved (likely a remote backend URL)
                          return m;
                      });
                  }
                  
                  setThreedState({
                      ...savedState,
                      modelUrl: restoredUrl || savedState.modelUrl, // Use saved URL as fallback
                      models: restoredModels
                  });
              }
          } catch (e) {
              console.error("Failed to restore 3D state", e);
          } finally {
              setIsRestoring(false);
          }
      };
      
      loadState();
  }, []);

  // Save State to IndexedDB on Change
  useEffect(() => {
      if (isRestoring) return; // Don't save while restoring

      const saveTimer = setTimeout(() => {
          // Prepare state for saving (exclude transient blob URLs)
          const stateToSave = {
              ...threedState,
              modelUrl: threedState.modelUrl?.startsWith('blob:') ? null : threedState.modelUrl
          };
          if (stateToSave.models && Array.isArray(stateToSave.models)) {
              stateToSave.models = stateToSave.models.map(m => ({ 
                  ...m, 
                  url: m.url?.startsWith('blob:') ? null : m.url 
              }));
          }
          saveToDB(STATE_KEY, stateToSave);
      }, 1000); // Debounce saves

      return () => clearTimeout(saveTimer);
  }, [threedState, isRestoring]);

  // Cleanup 3D Model URL on Editor Unmount (Global cleanup)
  useEffect(() => {
     return () => {
         if (threedState.modelUrl) {
             URL.revokeObjectURL(threedState.modelUrl);
         }
         if (threedState.models && Array.isArray(threedState.models)) {
             threedState.models.forEach(m => {
                 if (m.url) URL.revokeObjectURL(m.url);
             });
         }
     };
  }, []); // Only on unmount of the Layout

  // Memoize context - include threedState
  const contextValue = React.useMemo(() => ({ 
    setExportHandler, 
    setSaveHandler,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    triggerSaveSuccess: handleSaveSuccess,
    isAutoSaveEnabled,
    threedState,        // 3D State getter
    setThreedState,      // 3D State setter
    currentBook,
    setCurrentBook
  }), [isAutoSaveEnabled, hasUnsavedChanges, threedState, currentBook]);

  if (isRestoring) {
      return (
          <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
             <div className="w-10 h-10 border-4 border-[#3b4190]/30 border-t-[#3b4190] rounded-full animate-spin"></div>
             <p className="mt-4 text-gray-500 font-medium">Restoring Editor Session...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar 
        onExport={handleExport} 
        onSave={handleSave} 
        hasUnsavedChanges={hasUnsavedChanges}
        saveSuccessInfo={saveSuccessInfo}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
        currentBook={currentBook}
      />
      <div className="flex-1 overflow-hidden">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
};

export default Editor;