import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Edit3,
  ImagePlay,
  Grid,
  Search,
  X,
} from "lucide-react";
import GalleryGif from "./GalleryGif";
import InteractionPanel from './InteractionPanel';

const galleryPreviewImages = [
  "https://convertico.com/samples/download.php?format=gif&file=mesmerizing-motion-gif.gif",
  "https://www.easygifanimator.net/images/samples/video-to-gif-sample.gif",
  "https://cdn.dribbble.com/userupload/21557392/file/original-1dc535a0588f83a40ba90ad05452ce77.gif"
];

const GifEditor = ({
  selectedElement,
  onUpdate,
  onPopupPreviewUpdate,
  currentPageVId,
  flipbookVId,
  folderName,
  flipbookName,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  pages
}) => {
  const { v_id: paramVId } = useParams();
  const activeVId = flipbookVId || paramVId;

  const fileInputRef = useRef(null);
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const open = activeSection === 'main';
  const [showGallery, setShowGallery] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [imageType, setImageType] = useState('Fill');
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);

  // Stabilize onUpdate with a ref to prevent infinite loops during parent re-renders
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Sync opacity and object-fit when element changes
  useEffect(() => {
    if (selectedElement) {
      const currentOpacity = selectedElement.style.opacity;
      setOpacity(currentOpacity ? Math.round(Number(currentOpacity) * 100) : 100);

      const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'none': 'Crop' };
      const currentFit = selectedElement.style.objectFit || 'cover';
      setImageType(fitMapRev[currentFit] || 'Fill');
    }
  }, [selectedElement]);
  
  const updateImageType = (type) => {
    setImageType(type);
    if (selectedElement) {
      const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover' };
      selectedElement.style.objectFit = fitMap[type] || 'cover';
      onUpdateRef.current?.();
    }
  };

  const handleOpacityChange = (e) => {
    const value = Number(e.target.value);
    setOpacity(value);

    if (selectedElement) {
      selectedElement.style.opacity = value / 100;
      onUpdateRef.current?.();
    }
  };

  // 🔒 Always mark selected image as GIF
  useEffect(() => {
    if (
      selectedElement?.tagName === "IMG" &&
      selectedElement.dataset.mediaType !== "gif"
    ) {
      selectedElement.dataset.mediaType = "gif";
    }
  }, [selectedElement]);

  // ✅ Direct GIF upload
  const handleGifUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/gif") {
      alert("Please upload a GIF file");
      return;
    }

    const url = URL.createObjectURL(file);

    if (selectedElement?.tagName === "IMG") {
      if (selectedElement.src?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedElement.src);
      }

      const existingFileVid = selectedElement.dataset.fileVid;
      selectedElement.src = url;
      selectedElement.dataset.mediaType = "gif";
      onUpdateRef.current?.({ newElement: selectedElement });

      // Upload to Backend
      const storedUser = localStorage.getItem('user');
      if (storedUser && (activeVId || (folderName && flipbookName))) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (activeVId) formData.append('v_id', activeVId);
          if (folderName) formData.append('folderName', folderName);
          if (flipbookName) formData.append('flipbookName', flipbookName);
          
          formData.append('type', 'gif');
          formData.append('assetType', 'gif');
          formData.append('page_v_id', currentPageVId || 'global');

          if (existingFileVid) {
              formData.append('replacing_file_v_id', existingFileVid);
          }
          // Append file LAST
          formData.append('file', file);

          try {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);

              if (res.data.url) {
                  const serverUrl = `${backendUrl}${res.data.url}`;
                  selectedElement.src = serverUrl;
                  selectedElement.dataset.fileVid = res.data.file_v_id;
                  onUpdateRef.current?.({ newElement: selectedElement });
              }
          } catch (err) {
              console.error("GIF upload failed detail:", err.response?.data || err);
          }
      }
    }
  };

  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <ImageIcon className="mx-auto mb-2" size={32} />
        <p>Click on a GIF to edit</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-[1vw] w-full">
      <div className="bg-white border border-gray-200 rounded-[0.8vw] shadow-sm overflow-hidden relative font-sans">
        {/* HEADER */}
        <div
          onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}
          className="flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-[0.5vw]">
            <ImagePlay size="1vw" className="text-gray-600"/>
            <span className="font-semibold text-gray-900 text-[0.85vw]">Gif</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} strokeWidth={2.5} />
        </div>

        {/* CONTENT */}
        {open && (
          <div className="px-[1.25vw] mb-[1.5vw] pt-[1vw] space-y-[1.25vw]">
            <div className="space-y-[1vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Upload your Gif</span>
                <div className="h-[0.1vw] w-full bg-gray-200" />
              </div>

               <div className="flex items-center justify-between pb-[0.25vw]">
                 <span className="text-[0.75vw] font-semibold text-gray-700">Select the Image type :</span>
                  <div className="relative">
                    <button 
                      onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)} 
                      className="flex items-center justify-between w-[6vw] px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[0.8vw] font-bold text-gray-700">{imageType}</span>
                      <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showImageTypeDropdown && (
                      <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowImageTypeDropdown(false)} />
                      <div className="absolute right-0 top-full mt-[0.5vw] w-[6vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                        {['Fit', 'Fill', 'Crop'].map((type) => (
                          <button 
                            key={type} 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              updateImageType(type);
                              setShowImageTypeDropdown(false); 
                            }} 
                            className={"px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      </>
                    )}
                  </div>
              </div>

              {/* FILE INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/gif"
                onChange={handleGifUpload}
                className="hidden"
              />

              <div className="flex items-center gap-[0.75vw]">
                {/* Current Image */}
                <div onClick={() => fileInputRef.current?.click()} className="w-[4.5vw] h-[4.5vw] bg-gray-50 border-2 border-dashed border-gray-300 rounded-[0.75vw] p-[0.3vw] flex items-center justify-center overflow-hidden cursor-pointer group hover:border-indigo-400 transition-colors">
                  <img
                    src={selectedElement.src}
                    alt="Current"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-shrink-0">
                  <Replace size="1.2vw" className="text-gray-300" />
                </div>

                {/* Upload Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-[4.5vw] border-2 border-dashed border-gray-200 bg-gray-50 rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-indigo-400 transition-all duration-300"
                >
                  <Upload size="1.1vw" className="text-indigo-600 mb-[0.2vw]" />
                  <p className="text-[0.65vw] text-gray-400 font-medium text-center px-[1vw]">
                    Drag & Drop or <span className="text-indigo-600 font-bold">Upload GIF</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Gallery Section */}

            <div 
              onClick={() => setShowGallery(true)}
              className="relative h-[8vw] rounded-[0.75vw] overflow-hidden cursor-pointer group border border-gray-200 select-none bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Background with thumbnails mockup */}
              <div className="absolute inset-0 p-[0.75vw] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-[0.75vw] opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-500 w-full">
                  {[...galleryPreviewImages, ...galleryPreviewImages].slice(0, 3).map((src, i) => (
                    <div key={i} className="aspect-square rounded-[0.5vw] bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                      <img src={src} alt="Gallery" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-all duration-300 group-hover:bg-black/20">
                <div className="flex items-center gap-[0.5vw] text-white bg-black/40 px-[1.2vw] py-[0.6vw] rounded-full backdrop-blur-md border border-white/20 shadow-lg group-hover:bg-black/60 group-hover:scale-105 transition-all duration-300 transform">
                  <Grid size="1.1vw" className="text-white" />
                  <span className="text-[0.85vw] font-semibold tracking-wide">GIF Gallery</span>
                </div>
              </div>
            </div>

            {/* 3. Opacity Section */}
            <div className="space-y-[0.75vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.85vw] font-semibold text-gray-900">Opacity</span>
                <div className="h-[0.1vw] w-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-[1vw] px-[0.25vw]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={handleOpacityChange}
                  className="flex-1 h-[0.25vw] appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)`,
                  }}
                />
                <span className="text-[0.85vw] font-semibold text-gray-700 w-[3vw] text-right">
                  {opacity} %
                </span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* INTERACTION PANEL */}
      {showInteraction && (
        <InteractionPanel
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onPopupPreviewUpdate={onPopupPreviewUpdate}
          pages={pages}
          activePopupElement={activePopupElement}
          onPopupUpdate={onPopupUpdate}
          TextEditorComponent={TextEditorComponent}
          ImageEditorComponent={ImageEditorComponent}
          VideoEditorComponent={VideoEditorComponent}
          GifEditorComponent={GifEditorComponent || GifEditor}
          IconEditorComponent={IconEditorComponent}
          isOpen={activeSection === 'interaction'}
          onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
        />
      )}

      {/* GALLERY MODAL */}
      {showGallery && (
        <GalleryGif
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onClose={() => setShowGallery(false)}
          currentPageVId={currentPageVId}
          flipbookVId={activeVId}
          folderName={folderName}
          flipbookName={flipbookName}
          onSelect={async (gif) => {
             // 1. Optimistic Update
             const optimisticUrl = gif.url;
             if (selectedElement.tagName === "VIDEO") {
                selectedElement.src = optimisticUrl;
                const source = selectedElement.querySelector("source");
                if (source) source.src = optimisticUrl;
                selectedElement.load();
             } else {
                selectedElement.src = optimisticUrl;
             }
             if (selectedElement.dataset.mediaType !== "gif") {
                selectedElement.dataset.mediaType = "gif";
             }
             onUpdateRef.current?.({ shouldRefresh: true });

             // 2. Backend Upload/Associate logic
             const storedUser = localStorage.getItem('user');
             if (!storedUser) {
                 setShowGallery(false);
                 return;
             }
             
             try {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                
                // Prepare File Object
                let fileToUpload = null;
                if (gif.file) {
                    fileToUpload = gif.file;
                } else {
                    // Fetch blob from URL to re-upload as asset
                    try {
                        const response = await axios.get(gif.url, { responseType: 'blob' });
                        const contentType = response.headers['content-type'] || 'image/gif';
                        const filename = gif.name ? (gif.name.endsWith('.gif') ? gif.name : `${gif.name}.gif`) : `gallery_gif.gif`;
                        
                        fileToUpload = new File([response.data], filename, { type: contentType });
                    } catch (fetchErr) {
                        console.error("Failed to fetch gallery gif for re-upload:", fetchErr);
                    }
                }
                
                if (fileToUpload) {
                    const formData = new FormData();
                    formData.append('emailId', user.emailId);
                    if (activeVId) formData.append('v_id', activeVId);
                    
                    // Defaults for unsaved books to ensure storage
                    formData.append('folderName', folderName || 'My Flipbooks');
                    formData.append('flipbookName', flipbookName || 'Untitled Document');
                    
                    formData.append('type', 'gif');
                    formData.append('assetType', 'gif');
                    formData.append('page_v_id', currentPageVId || 'global');
                    
                    // Handle Replacement
                    const existingFileVid = selectedElement.dataset.fileVid;
                    if (existingFileVid) {
                        formData.append('replacing_file_v_id', existingFileVid);
                    }
                    
                    formData.append('file', fileToUpload);
                    
                    const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
                    
                    if (res.data.url) {
                        const serverUrl = `${backendUrl}${res.data.url}`;
                        
                        // Update DOM with final server URL and new File ID
                        if (selectedElement.tagName === "VIDEO") {
                            selectedElement.src = serverUrl;
                            const source = selectedElement.querySelector("source");
                            if (source) source.src = serverUrl;
                            selectedElement.load();
                        } else {
                            selectedElement.src = serverUrl;
                        }
                        selectedElement.dataset.fileVid = res.data.file_v_id;
                        
                        onUpdateRef.current?.({ shouldRefresh: true });
                        console.log("Gallery GIF successfully stored as Asset:", res.data.filename);
                    }
                }
             } catch (err) {
                console.error("Gallery Select Backend Sync Failed:", err);
             }
             
             setShowGallery(false);
          }}
        />
      )}
    </div>
  );
};

export default GifEditor;
