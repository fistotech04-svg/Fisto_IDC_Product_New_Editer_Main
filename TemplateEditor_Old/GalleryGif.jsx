import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Upload, X, Check, Replace } from "lucide-react";

export default function GalleryGif({ onClose, onUpdate, onSelect, selectedElement, currentPageVId, flipbookVId, folderName, flipbookName }) {
  const [tempSelectedGif, setTempSelectedGif] = useState(null);
  const [uploadedGifs, setUploadedGifs] = useState([]);
  const galleryInputRef = useRef(null);

  // Fetch gallery GIFs when modal opens
  useEffect(() => {
    const fetchGalleryAssets = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      try {
        const res = await axios.get(`${backendUrl}/api/flipbook/get-gallery-assets`, {
          params: {
            emailId: user.emailId,
            type: 'gif'
          }
        });
        
        if (res.data.assets) {
          const formattedAssets = res.data.assets.map(asset => ({
            id: asset.name,
            name: asset.name.replace(/\.[^/.]+$/, ''),
            url: `${backendUrl}${asset.url}`,
            type: asset.type,
            uploadedAt: asset.uploadedAt
          }));
          
          setUploadedGifs(formattedAssets);
        }
      } catch (err) {
        console.error('Failed to fetch gallery assets:', err);
      }
    };
    
    fetchGalleryAssets();
  }, []);

  const handleModalFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's a gif
    const isGif = file.type === 'image/gif';
    
    if (!isGif) {
      alert('Please select a valid GIF file');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const newGifData = {
      id: Date.now(),
      name: file.name.split('.')[0],
      url: fileUrl,
      type: file.type,
      file: file  // Store file for later upload
    };
    
    setUploadedGifs((prev) => [newGifData, ...prev]);
    setTempSelectedGif(newGifData);
    e.target.value = '';

    // Upload to Backend
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        formData.append('isGallery', 'true');
        formData.append('type', 'gif'); 
        formData.append('file', file);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);

            if (res.data.url) {
                const serverUrl = `${backendUrl}${res.data.url}`;
                setUploadedGifs((prev) => prev.map(v => v.id === newGifData.id ? { ...v, url: serverUrl, file_v_id: res.data.file_v_id } : v));
                setTempSelectedGif(prev => prev && prev.id === newGifData.id ? { ...prev, url: serverUrl, file_v_id: res.data.file_v_id } : prev);
                console.log("Gallery GIF uploaded:", serverUrl);
            }
        } catch (err) {
            console.error("Gallery Upload Error:", err);
        }
    }
  };

  const handleReplace = async () => {
    if (!tempSelectedGif) return;

    if (onUpdate && typeof onUpdate.onSelect === 'function') {
        onUpdate.onSelect(tempSelectedGif);
        onClose();
        return;
    }
    
    // If onSelect prop was passed directly (preferred pattern)
    if (onSelect) {
        onSelect(tempSelectedGif);
        onClose();
        return;
    }

    if (!selectedElement) return;
    
    const existingFileVid = selectedElement.dataset.fileVid;
    
    // If the gallery GIF has a file object (newly uploaded), upload it to flipbook assets
    if (tempSelectedGif.file) {
      // Set temporary preview
      if (selectedElement.tagName === "VIDEO") {
        selectedElement.src = tempSelectedGif.url;
        selectedElement.dataset.mediaType = "gif";
        const source = selectedElement.querySelector("source");
        if (source) source.src = tempSelectedGif.url;
        selectedElement.load();
      } else {
        selectedElement.src = tempSelectedGif.url;
        selectedElement.dataset.mediaType = "gif";
      }
      if (onUpdate) onUpdate();
      
      // Upload to flipbook assets
      const storedUser = localStorage.getItem('user');
      if (storedUser && (flipbookVId || (folderName && flipbookName))) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (flipbookVId) formData.append('v_id', flipbookVId);
        // Provide defaults for unsaved books
        formData.append('folderName', folderName || 'My Flipbooks');
        formData.append('flipbookName', flipbookName || 'Untitled Document');
        formData.append('type', 'gif');
        formData.append('assetType', 'gif');
        formData.append('page_v_id', currentPageVId || 'global');
        if (existingFileVid) formData.append('replacing_file_v_id', existingFileVid);
        formData.append('file', tempSelectedGif.file);
        
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          
          if (res.data.url) {
            const serverUrl = `${backendUrl}${res.data.url}`;
            if (selectedElement.tagName === "VIDEO") {
              selectedElement.src = serverUrl;
              selectedElement.dataset.fileVid = res.data.file_v_id;
              selectedElement.dataset.mediaType = "gif";
              const source = selectedElement.querySelector("source");
              if (source) source.src = serverUrl;
              selectedElement.load();
            } else {
              selectedElement.src = serverUrl;
              selectedElement.dataset.fileVid = res.data.file_v_id;
              selectedElement.dataset.mediaType = "gif";
            }
            if (onUpdate) onUpdate();
          }
        } catch (err) {
          console.error("Failed to upload GIF to flipbook assets:", err);
        }
      }
    } else {
      // If it's an already uploaded GIF from gallery, fetch and re-upload to flipbook assets
      try {
        const response = await fetch(tempSelectedGif.url);
        const blob = await response.blob();
        const file = new File([blob], tempSelectedGif.name || 'animation.gif', { type: 'image/gif' });
        
        // Set temporary preview
        if (selectedElement.tagName === "VIDEO") {
          selectedElement.src = tempSelectedGif.url;
          selectedElement.dataset.mediaType = "gif";
          const source = selectedElement.querySelector("source");
          if (source) source.src = tempSelectedGif.url;
          selectedElement.load();
        } else {
          selectedElement.src = tempSelectedGif.url;
          selectedElement.dataset.mediaType = "gif";
        }
        if (onUpdate) onUpdate();
        
        // Upload to flipbook assets
        const storedUser = localStorage.getItem('user');
        if (storedUser && (flipbookVId || (folderName && flipbookName))) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (flipbookVId) formData.append('v_id', flipbookVId);
          // Provide defaults for unsaved books
          formData.append('folderName', folderName || 'My Flipbooks');
          formData.append('flipbookName', flipbookName || 'Untitled Document');
          formData.append('type', 'gif');
          formData.append('assetType', 'gif');
          formData.append('page_v_id', currentPageVId || 'global');
          if (existingFileVid) formData.append('replacing_file_v_id', existingFileVid);
          formData.append('file', file);
          
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
            
            if (res.data.url) {
              const serverUrl = `${backendUrl}${res.data.url}`;
              if (selectedElement.tagName === "VIDEO") {
                selectedElement.src = serverUrl;
                selectedElement.dataset.fileVid = res.data.file_v_id;
                selectedElement.dataset.mediaType = "gif";
                const source = selectedElement.querySelector("source");
                if (source) source.src = serverUrl;
                selectedElement.load();
              } else {
                selectedElement.src = serverUrl;
                selectedElement.dataset.fileVid = res.data.file_v_id;
                selectedElement.dataset.mediaType = "gif";
              }
              if (onUpdate) onUpdate();
            }
          } catch (err) {
            console.error("Failed to upload GIF to flipbook assets:", err);
          }
        }
      } catch (error) {
        console.error('Failed to fetch and upload gallery GIF:', error);
        // Fallback: just use the gallery URL
        if (selectedElement.tagName === "VIDEO") {
          selectedElement.src = tempSelectedGif.url;
          const source = selectedElement.querySelector("source");
          if (source) source.src = tempSelectedGif.url;
          selectedElement.load();
        } else {
          selectedElement.src = tempSelectedGif.url;
        }
        if (onUpdate) onUpdate();
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed z-[10000] bg-white border border-gray-100 rounded-[1vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans"
      style={{
        width: '20vw',
        height: '34vw',
        top: '55%',
        left: '80%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-100">
        <h2 className="text-[0.9vw] font-bold text-gray-900">Gif Gallery</h2>
        <button 
          onClick={onClose}
          className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size="1vw" className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Upload Section */}
        <div className="px-[1vw] py-[0.5vw] mt-[0.5vw]">
          <h3 className="text-[0.75vw] font-bold text-gray-900 mb-[0.25vw]">Upload your Gif</h3>
          <p className="text-[0.6vw] text-gray-400 mb-[0.75vw]">You Can Reuse The File Which Is Uploaded In Gallery <span className="text-red-500">*</span></p>
          
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="w-full h-[7vw] border-2 border-dashed border-gray-200 rounded-[0.75vw] flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group mb-[0.5vw] shadow-sm"
          >
             <Upload size="1.5vw" className="text-indigo-400 mb-[0.5vw] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <p className="text-[0.7vw] text-gray-500 font-medium mb-[0.2vw]">
              Drag & Drop or <span className="text-indigo-600 font-bold">Upload</span>
            </p>
           
            <p className="text-[0.6vw] text-gray-400 text-center px-[0.5vw]">
              Supported File : <span className="font-bold">GIF</span>
            </p>
          </div>
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleModalFileUpload}
            accept="image/gif"
            className="hidden"
          />
        </div>

        <div className="px-[1vw] py-[0.75vw]">
          <div className="flex items-center justify-between mb-[0.75vw]">
            <h3 className="text-[0.75vw] font-bold text-gray-900">Your Uploads</h3>
            <span className="text-[0.6vw] font-medium text-gray-400 uppercase tracking-tight">{uploadedGifs.length} Items</span>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-2 gap-[0.75vw] pb-[1vw]">
            {uploadedGifs.map((item, i) => (
              <div
                key={i}
                onClick={() => setTempSelectedGif(item)}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className={`relative aspect-video w-full rounded-[0.75vw] overflow-hidden border-2 transition-all shadow-sm ${tempSelectedGif?.url === item.url ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-transparent hover:border-gray-200'}`}>
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  
                  {/* Selection Overlay */}
                  {tempSelectedGif?.url === item.url && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-white rounded-full p-[0.3vw] shadow-lg animate-in zoom-in duration-200">
                            <Check size="0.8vw" className="text-indigo-600" strokeWidth={3} />
                        </div>
                    </div>
                  )}
                </div>
                <p className="text-[0.6vw] text-gray-500 mt-[0.4vw] font-semibold text-center truncate w-full px-[0.25vw]">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
          
          {uploadedGifs.length === 0 && (
            <div className="text-center py-[2vw] text-gray-400">
               <div className="w-[3vw] h-[3vw] bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-[0.75vw]">
                <Upload size="1.25vw" className="opacity-20" />
              </div>
              <p className="text-[0.8vw] font-bold text-gray-600">No GIFs uploaded</p>
              <p className="text-[0.6vw] mt-[0.2vw]">Upload your first GIF to the gallery</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white">
        <button
          onClick={onClose}
          className="flex-1 h-[2.5vw] border border-gray-200 rounded-[0.6vw] text-[0.75vw] font-bold flex items-center justify-center gap-[0.4vw] hover:bg-gray-50 transition-colors text-gray-600"
        >
          <X size="1vw" /> Close
        </button>
        <button
          disabled={!tempSelectedGif}
          onClick={handleReplace}
          className="flex-1 h-[2.5vw] bg-black text-white rounded-[0.6vw] text-[0.75vw] font-bold flex items-center justify-center gap-[0.4vw] hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          <Replace size="1vw" /> Replace
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
      `}</style>
    </div>
  );
}