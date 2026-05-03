import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Upload, X, Check, Replace } from "lucide-react";

export default function GalleryGif({ onClose, onUpdate, onSelect, selectedElement, selectedLayerId, activePageIndex, currentPageVId, flipbookVId, folderName, flipbookName }) {
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
        formData.append('assetType', 'gif');
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
    
    // If onSelect prop was passed directly
    if (onSelect) {
        onSelect(tempSelectedGif);
        onClose();
        return;
    }

    if (!selectedLayerId) return;

    // Resolve the live element
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) {
      console.error("Could not resolve live element for replacement");
      return;
    }
    
    const targetImg = (liveElement.tagName?.toLowerCase() === 'image' || liveElement.tagName?.toLowerCase() === 'img') 
      ? liveElement 
      : liveElement.querySelector('image, img');

    if (!targetImg) {
      console.error("No image target found for replacement");
      return;
    }

    const existingFileVid = liveElement.dataset.fileVid;
    
    // Set temporary preview
    if (targetImg.tagName.toLowerCase() === 'image') {
      targetImg.setAttribute('href', tempSelectedGif.url);
      targetImg.setAttribute('xlink:href', tempSelectedGif.url);
    } else {
      targetImg.src = tempSelectedGif.url;
    }
    liveElement.dataset.mediaType = "gif";
    if (onUpdate) onUpdate({ shouldRefresh: true });

    // Upload to flipbook assets for persistence
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      
      let fileToUpload = tempSelectedGif.file;
      if (!fileToUpload) {
        try {
          const response = await fetch(tempSelectedGif.url);
          const blob = await response.blob();
          fileToUpload = new File([blob], tempSelectedGif.name || 'animation.gif', { type: 'image/gif' });
        } catch (e) {
          console.error("Failed to fetch gallery GIF for re-upload:", e);
        }
      }

      if (fileToUpload) {
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (flipbookVId) formData.append('v_id', flipbookVId);
        formData.append('folderName', folderName || 'My Flipbooks');
        formData.append('flipbookName', flipbookName || 'Untitled Document');
        formData.append('type', 'gif');
        formData.append('assetType', 'gif');
        formData.append('page_v_id', currentPageVId || 'global');
        if (existingFileVid) formData.append('replacing_file_v_id', existingFileVid);
        formData.append('file', fileToUpload);
        
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          
          if (res.data.url) {
            const serverUrl = `${backendUrl}${res.data.url}`;
            if (targetImg.tagName.toLowerCase() === 'image') {
              targetImg.setAttribute('href', serverUrl);
              targetImg.setAttribute('xlink:href', serverUrl);
            } else {
              targetImg.src = serverUrl;
            }
            liveElement.dataset.fileVid = res.data.file_v_id;
            liveElement.dataset.mediaType = "gif";
            if (onUpdate) onUpdate({ shouldRefresh: true });
          }
        } catch (err) {
          console.error("Failed to upload GIF to flipbook assets:", err);
        }
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed z-[10000] bg-white border border-gray-100 rounded-[0.75vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans"
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
          className="w-[2vw] h-[2vw] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size="0.9vw" className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Upload Section */}
        <div className="px-[1vw] py-[0.5vw] mt-[0.5vw]">
          <h3 className="text-[0.8vw] font-bold text-gray-900 mb-[0.25vw]">Upload your Gif</h3>
          <p className="text-[0.65vw] text-gray-400 mb-[1vw]"><span>You Can Reuse The File Which Is Uploaded In Gallery</span><span className="text-red-500">*</span></p>
          
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="w-full h-[7vw] border-[0.15vw] border-dashed border-gray-300 rounded-[0.75vw] flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-[0.5vw]"
          >
            <p className="text-[0.8vw] text-gray-500 font-normal mb-[0.75vw]">
              Drag & Drop or <span className="text-blue-600 font-semibold">Upload</span>
            </p>
            <Upload size="1.75vw" className="text-gray-300 mb-[0.5vw]" strokeWidth={1.5} />
            <p className="text-[0.65vw] text-gray-400 text-center px-[1vw]">
              Supported File : <span className="font-medium">GIF</span>
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

        <div className="px-[1.25vw] py-[1vw]">
          <div className="flex items-center justify-between mb-[1vw]">
            <h3 className="text-[0.8vw] font-bold text-gray-900">Your Uploads</h3>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-2 gap-[0.75vw] pb-[1vw]">
            {uploadedGifs.map((item, i) => (
              <div
                key={i}
                onClick={() => setTempSelectedGif(item)}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className={`relative aspect-square w-full rounded-[0.75vw] overflow-hidden border-[0.15vw] transition-all shadow-sm ${tempSelectedGif?.url === item.url ? 'border-indigo-600 ring-[0.15vw] ring-indigo-100' : 'border-transparent hover:border-gray-200'}`}>
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  
                  {/* Selection Overlay */}
                  {tempSelectedGif?.url === item.url && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                        <div className="bg-white rounded-full p-[0.25vw] shadow-lg">
                            <Check size="0.9vw" className="text-indigo-600" />
                        </div>
                    </div>
                  )}
                </div>
                <p className="text-[0.6vw] text-gray-400 mt-[0.5vw] font-medium text-center truncate w-full px-[0.25vw]">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
          
          {uploadedGifs.length === 0 && (
            <div className="text-center py-[2vw] text-gray-400 flex flex-col items-center">
              <div className="w-[3vw] h-[3vw] bg-gray-50 rounded-full flex items-center justify-center mb-[0.75vw]">
                <Upload size="1.25vw" className="opacity-20" />
              </div>
              <p className="text-[0.8vw] font-bold text-gray-600">No GIFs uploaded</p>
              <p className="text-[0.65vw] mt-[0.2vw]">Upload your first GIF to the gallery</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white">
        <button
          onClick={onClose}
          className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] hover:bg-gray-50"
        >
          <X size="0.75vw" /> Close
        </button>
        <button
          disabled={!tempSelectedGif}
          onClick={handleReplace}
          className="flex-1 h-[2vw] bg-black text-white rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] hover:bg-zinc-800 disabled:opacity-50"
        >
          <Replace size="0.75vw" /> Replace
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
      `}</style>
    </div>
  );
}