import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  ArrowRightLeft,
  MoreVertical,
  Replace,
  Upload,
  Trash2,
  X,
  Check
} from 'lucide-react';
import GalleryImage from './GalleryImage';
import axios from 'axios';

const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const Toggle = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative w-[2.2vw] h-[1.2vw] transition-colors duration-200 ease-in-out rounded-full focus:outline-none ${active ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
  >
    <div className={`absolute left-[0.125vw] top-[0.125vw] bg-white w-[0.95vw] h-[0.95vw] rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${active ? 'translate-x-[1vw]' : 'translate-x-0'}`} />
  </button>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.5vw] py-[0.25vw] mt-[0.25vw]">
    <span className="text-[0.75vw] font-semibold text-black-900 whitespace-nowrap">{title}</span>
    <div className="h-[0.05vw] flex-1 bg-gray-200" />
  </div>
);

const SlideshowProperties = ({ selectedElement, onUpdate, isOpen, onToggle, opacity, onUpdateOpacity, setPreviewSrc, setIsUpdatingDOM, currentPageVId, flipbookVId, folderName, flipbookName }) => {
  const [showEffectDropdown, setShowEffectDropdown] = useState(false);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef(null);
  
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);
  const [newReplaceImg, setNewReplaceImg] = useState(null);
  const replaceInputRef = useRef(null);
  
  // Slideshow specific states
  const [slideshowSettings, setSlideshowSettings] = useState({
    autoPlay: true,
    speed: 2,
    infiniteLoop: false,
    showArrows: true,
    showDots: true,
    imageFitType: 'Fill All',
    transitionEffect: 'Linear',
    dragToSlide: false,
    dotColor: '#000000',
    dotOpacity: 100
  });
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hydratedElement, setHydratedElement] = useState(null); // Track which element matches current state

  const onUpdateRef = useRef(onUpdate);
  const onUpdateOpacityRef = useRef(onUpdateOpacity);
  const setPreviewSrcRef = useRef(setPreviewSrc);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onUpdateOpacityRef.current = onUpdateOpacity;
    setPreviewSrcRef.current = setPreviewSrc;
  });

  // Ref to prevent persistence for one cycle during hydration
  const shouldSkipPersistence = useRef(false);

  // Hydrate Slideshow State from DOM
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.dataset.slideshow) {
        try {
          const savedData = JSON.parse(selectedElement.dataset.slideshow);
          if (savedData) {
            shouldSkipPersistence.current = true;
            setSlideshowSettings(prev => ({ ...prev, ...savedData.settings }));
            setSlideshowImages(savedData.images || []);
            setActiveSlideIndex(0);
            setHydratedElement(selectedElement); // Mark as hydrated
          }
        } catch (e) {
          console.error("Failed to parse slideshow data", e);
        }
      } else {
        // Reset to default for new element if it has no slideshow data
        // This prevents state leakage from previous element
        
        // IMPORTANT: Skip persistence for this reset to prevent tagging the new element as a slideshow
        shouldSkipPersistence.current = true;

        setSlideshowSettings({
          autoPlay: true,
          speed: 2,
          infiniteLoop: false,
          showArrows: true,
          showDots: true,
          imageFitType: 'Fill All',
          transitionEffect: 'Linear',
          dragToSlide: false,
          dotColor: '#000000',
          dotOpacity: 100
        });
        
        const currentSrc = selectedElement.getAttribute('src') || selectedElement.src;
        if (currentSrc) {
          const initialFileVid = selectedElement.dataset.fileVid || null;
          setSlideshowImages([{ id: Date.now(), url: currentSrc, name: 'Main Image', file_v_id: initialFileVid }]);
        } else {
          setSlideshowImages([]);
        }
        setActiveSlideIndex(0);
        setHydratedElement(selectedElement); // Mark as hydrated (even if default)
      }
    }
  }, [selectedElement]);

  // Persist Slideshow Slides & Settings to DOM
  useEffect(() => {
    if (shouldSkipPersistence.current) {
      shouldSkipPersistence.current = false;
      return;
    }

    if (selectedElement) {
      if (slideshowImages.length > 0) {
        const dataToSave = {
          settings: slideshowSettings,
          images: slideshowImages
        };
        selectedElement.setAttribute('data-slideshow', JSON.stringify(dataToSave));
        selectedElement.setAttribute('data-is-slideshow', 'true');
        if (onUpdateRef.current) onUpdateRef.current();
      }
    }
  }, [slideshowSettings, slideshowImages]);

  // Safety: Clamp active index if images are removed
  useEffect(() => {
    if (slideshowImages.length > 0 && activeSlideIndex >= slideshowImages.length) {
      setActiveSlideIndex(slideshowImages.length - 1);
    }
  }, [slideshowImages.length, activeSlideIndex]);

  // Auto Play Effect
  useEffect(() => {
    let interval;
    if (slideshowSettings.autoPlay && slideshowImages.length > 1) {
      interval = setInterval(() => {
        setActiveSlideIndex((prev) => {
          const next = prev + 1;
          if (next >= slideshowImages.length) {
            return slideshowSettings.infiniteLoop ? 0 : prev;
          }
          return next;
        });
      }, slideshowSettings.speed * 1000);
    }
    return () => clearInterval(interval);
  }, [slideshowSettings.autoPlay, slideshowSettings.speed, slideshowSettings.infiniteLoop, slideshowImages.length]);

  // Sync Template Image Src with Active Slide and Apply Effects
  useEffect(() => {
    // Only apply if the current state belongs to the selected element
    if (slideshowImages[activeSlideIndex] && selectedElement && selectedElement === hydratedElement) {
      const activeImg = slideshowImages[activeSlideIndex];
      const currentSrc = selectedElement.getAttribute('src');

      if (currentSrc !== activeImg.url) {
        if (setIsUpdatingDOM) setIsUpdatingDOM(true);
        const effect = slideshowSettings.transitionEffect;
        const baseOpacity = (opacity / 100).toString();

        const finishTransition = () => {
          selectedElement.src = activeImg.url;
          selectedElement.removeAttribute('data-original-src');
          if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
          
             setTimeout(() => {
                selectedElement.style.transition = '';
                selectedElement.style.transform = '';
                selectedElement.style.opacity = baseOpacity;
                selectedElement.style.filter = ''; 
                if (setIsUpdatingDOM) setIsUpdatingDOM(false);
             }, 50);
        };

        if (effect === 'Fade') {
            selectedElement.style.transition = 'opacity 0.4s ease-in-out';
            selectedElement.style.opacity = '0.2';
            setTimeout(() => {
                finishTransition();
                requestAnimationFrame(() => { selectedElement.style.opacity = baseOpacity; });
            }, 400);
        } else if (effect === 'Slide' || effect === 'Push') {
            selectedElement.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
            selectedElement.style.transform = 'translateX(-30%)';
            selectedElement.style.opacity = '0';
            setTimeout(() => {
                selectedElement.src = activeImg.url;
                if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
                selectedElement.style.transition = 'none';
                selectedElement.style.transform = 'translateX(30%)';
                void selectedElement.offsetWidth;
                selectedElement.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
                selectedElement.style.transform = 'translateX(0)';
                selectedElement.style.opacity = baseOpacity;
                setTimeout(() => {
                    selectedElement.style.transition = '';
                    selectedElement.style.transform = '';
                    if (setIsUpdatingDOM) setIsUpdatingDOM(false);
                }, 400);
            }, 400);
        } else if (effect === 'Flip') {
            selectedElement.style.transition = 'transform 0.5s ease-in-out';
            selectedElement.style.transform = 'rotateY(90deg)';
            setTimeout(() => {
                selectedElement.src = activeImg.url;
                if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
                selectedElement.style.transition = 'none';
                selectedElement.style.transform = 'rotateY(-90deg)';
                void selectedElement.offsetWidth;
                selectedElement.style.transition = 'transform 0.5s ease-in-out';
                selectedElement.style.transform = 'rotateY(0deg)';
                setTimeout(() => {
                    selectedElement.style.transition = '';
                    selectedElement.style.transform = '';
                    if (setIsUpdatingDOM) setIsUpdatingDOM(false);
                }, 500);
            }, 500);
        } else if (effect === 'Reveal' || effect === 'Zoom') {
            selectedElement.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease';
            selectedElement.style.transform = 'scale(0.8)';
            selectedElement.style.opacity = '0.5';
            setTimeout(() => {
                selectedElement.src = activeImg.url;
                if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
                selectedElement.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease';
                selectedElement.style.transform = 'scale(1)';
                selectedElement.style.opacity = baseOpacity;
                setTimeout(() => {
                    selectedElement.style.transition = '';
                    selectedElement.style.transform = '';
                    if (setIsUpdatingDOM) setIsUpdatingDOM(false);
                }, 400);
            }, 400);
        } else {
            finishTransition();
        }
      }
    }
  }, [slideshowImages, activeSlideIndex, selectedElement, slideshowSettings.transitionEffect, opacity]);

  // Apply Image Fit (Fit All / Fill All) to DOM
  useEffect(() => {
    if (selectedElement) {
      selectedElement.style.objectFit = slideshowSettings.imageFitType === 'Fill All' ? 'cover' : 'contain';
    }
  }, [selectedElement, slideshowSettings.imageFitType]);

  // Inject Slideshow Controls
  useEffect(() => {
    if (!selectedElement || !selectedElement.parentElement) return;

    const doc = selectedElement.ownerDocument;
    const parent = selectedElement.parentElement;
    
    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    let overlay = parent.querySelector('.slideshow-overlay-controls');
    if (!overlay) {
      overlay = doc.createElement('div');
      overlay.className = 'slideshow-overlay-controls';
      overlay.style.cssText = `position: absolute; inset: 0; z-index: 10; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between;`;
      parent.appendChild(overlay);
    }
    overlay.innerHTML = '';

    if (!slideshowSettings.autoPlay && slideshowSettings.showArrows && slideshowImages.length > 1) {
      const createArrow = (direction) => {
        const isLeft = direction === 'left';
        const canGoBack = slideshowSettings.infiniteLoop || activeSlideIndex > 0;
        const canGoNext = slideshowSettings.infiniteLoop || activeSlideIndex < slideshowImages.length - 1;
        if (isLeft && !canGoBack) return null;
        if (!isLeft && !canGoNext) return null;

        const btn = doc.createElement('div');
        btn.style.cssText = `position: absolute; top: 50%; ${isLeft ? 'left: 0.5vw;' : 'right: 0.5vw;'} transform: translateY(-50%); width: 2.8vw; height: 2.8vw; background: rgba(255, 255, 255, 0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; box-shadow: 0 0.1vw 0.25vw rgba(0,0,0,0.2); transition: background 0.2s; z-index: 20;`;
        btn.innerHTML = isLeft ? `<svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>` : `<svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
        btn.onclick = (e) => {
          e.stopPropagation(); e.preventDefault();
          setActiveSlideIndex(prev => isLeft ? (prev === 0 ? slideshowImages.length - 1 : prev - 1) : (prev === slideshowImages.length - 1 ? 0 : prev + 1));
        };
        return btn;
      };
      const left = createArrow('left'); if (left) overlay.appendChild(left);
      const right = createArrow('right'); if (right) overlay.appendChild(right);
    }

    if (slideshowSettings.showDots && slideshowImages.length > 1) {
      const dotsContainer = doc.createElement('div');
      dotsContainer.style.cssText = `position: absolute; bottom: 0.8vw; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5vw; pointer-events: auto; padding: 0.35vw 0.6vw; background: rgba(0,0,0,0.1); border-radius: 1vw; backdrop-filter: blur(0.15vw);`;
      slideshowImages.forEach((_, idx) => {
        const dot = doc.createElement('div');
        const isActive = idx === activeSlideIndex;
        dot.style.cssText = `width: 1.1vw; height: 1.1vw; border-radius: 50%; cursor: pointer; transition: all 0.2s; background-color: ${isActive ? slideshowSettings.dotColor : 'rgba(255,255,255,0.5)'}; opacity: ${isActive ? 1 : (slideshowSettings.dotOpacity / 100)}; transform: ${isActive ? 'scale(1.2)' : 'scale(1)'}; box-shadow: 0 0.05vw 0.1vw rgba(0,0,0,0.1);`;
        dot.onclick = (e) => { e.stopPropagation(); e.preventDefault(); setActiveSlideIndex(idx); };
        dotsContainer.appendChild(dot);
      });
      overlay.appendChild(dotsContainer);
    }

    if (!slideshowSettings.autoPlay && slideshowSettings.dragToSlide && slideshowImages.length > 1) {
      const dragLayer = doc.createElement('div');
      dragLayer.style.cssText = `position: absolute; inset: 0; z-index: 5; cursor: grab; pointer-events: auto;`;
      dragLayer.onmousedown = (e) => {
        e.stopPropagation();
        const startX = e.clientX;
        let isDragging = false;
        const move = (mv) => { if (Math.abs(mv.clientX - startX) > 10) isDragging = true; };
        const up = (upE) => {
          if (isDragging) {
            const diff = upE.clientX - startX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) setActiveSlideIndex(prev => prev === 0 ? (slideshowSettings.infiniteLoop ? slideshowImages.length - 1 : 0) : prev - 1);
              else setActiveSlideIndex(prev => prev === slideshowImages.length - 1 ? (slideshowSettings.infiniteLoop ? 0 : prev) : prev + 1);
            }
          }
          doc.removeEventListener('mousemove', move); doc.removeEventListener('mouseup', up);
        };
        doc.addEventListener('mousemove', move); doc.addEventListener('mouseup', up);
      };
      overlay.insertBefore(dragLayer, overlay.firstChild);
    }

    return () => { if (overlay) overlay.remove(); };
  }, [slideshowSettings, slideshowImages, activeSlideIndex, selectedElement]);

  const uploadFile = async (file, replacingVideoId = null) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const formData = new FormData();
    formData.append('emailId', user.emailId);
    if (flipbookVId) formData.append('v_id', flipbookVId);
    
    // Provide defaults for unsaved books
    formData.append('folderName', folderName || 'My Flipbooks');
    formData.append('flipbookName', flipbookName || 'Untitled Document');
    
    formData.append('type', 'image');
    formData.append('assetType', 'Image');
    formData.append('page_v_id', currentPageVId || 'global');
    
    if (replacingVideoId) {
        formData.append('replacing_file_v_id', replacingVideoId);
    }
    formData.append('file', file);

    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
        if (res.data.url) {
            return {
                url: `${backendUrl}${res.data.url}`,
                file_v_id: res.data.file_v_id,
                name: res.data.filename
            };
        }
    } catch (err) {
        console.error("Slideshow image upload failed:", err);
    }
    return null;
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 4 - slideshowImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // 1. Create Optimistic State with Blob URLs
    const optimisticImages = filesToUpload.filter(file => file.type.startsWith('image/')).map((file, idx) => ({
      id: Date.now() + idx, 
      url: URL.createObjectURL(file), 
      name: file.name,
      isUploading: true,
      file_orig: file // Keep reference for upload
    }));

    if (optimisticImages.length === 0) return;

    setSlideshowImages(prev => [...prev, ...optimisticImages]);
    e.target.value = '';

    // 2. Upload in Background and Update State
    for (const img of optimisticImages) {
        const uploadedData = await uploadFile(img.file_orig);
        
        setSlideshowImages(prev => prev.map(item => {
            if (item.id === img.id) {
                if (uploadedData) {
                    return { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false };
                } else {
                    // Upload failed, maybe keep blob or remove? Keeping blob for now but marking error could be better.
                    // For now, just remove uploading flag
                    return { ...item, isUploading: false };
                }
            }
            return item;
        }));
    }
  };



  const handleReplaceUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const imageUrl = URL.createObjectURL(file);
    setNewReplaceImg({ url: imageUrl, name: file.name, file: file }); // Store file object for upload
    e.target.value = '';
  };

  const confirmReplace = async () => {
    if (!newReplaceImg || replaceTargetIndex === null) return;
    
    const targetImage = slideshowImages[replaceTargetIndex];
    const fileToUpload = newReplaceImg.file;

    // Optimistic Update
    setSlideshowImages(prev => {
      const updated = [...prev];
      if (updated[replaceTargetIndex]) {
        updated[replaceTargetIndex] = { 
            ...updated[replaceTargetIndex], 
            url: newReplaceImg.url, 
            name: newReplaceImg.name,
            isUploading: true
        };
      }
      return updated;
    });
    
    setShowReplaceModal(false);
    setReplaceTargetIndex(null);
    setNewReplaceImg(null);

    // Upload
    if (fileToUpload) {
        const uploadedData = await uploadFile(fileToUpload, targetImage.file_v_id); // Pass existing v_id for replacement
        
        if (uploadedData) {
             setSlideshowImages(prev => prev.map((item, idx) => {
                 if (idx === replaceTargetIndex || (item.isUploading && item.url === newReplaceImg.url)) { // Fallback matching
                      return { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false };
                 }
                 return item;
             }));
        }
    }
    
    if (onUpdateRef.current) onUpdateRef.current();
  };

  const deleteImage = async (index) => {
    const img = slideshowImages[index];
    if (!img) return;

    // Optimistic remove
    setSlideshowImages(prev => prev.filter((_, idx) => idx !== index));
    setOpenContextMenu(null);

    // Backend delete
    if (img.file_v_id) {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                await axios.post(`${backendUrl}/api/flipbook/delete-asset`, {
                    emailId: user.emailId,
                    file_v_id: img.file_v_id,
                    assetType: 'Image',
                    folderName: folderName || 'My Flipbooks',
                    bookName: flipbookName || 'Untitled Document'
                });
            }
        } catch (error) {
            console.error("Failed to delete asset from backend:", error);
        }
    }
  };

  const handleGallerySelect = async (img) => {
    // 1. Determine if we are REPLACING or ADDING
    const isReplacing = activeSlideIndex < slideshowImages.length;
    let replacingId = null;
    
    if (isReplacing) {
        replacingId = slideshowImages[activeSlideIndex]?.file_v_id;
    }

    // 2. Optimistic Update (Show generic/gallery URL immediately)
    const optimisticId = Date.now();
    setSlideshowImages(prev => {
        const updated = [...prev];
        const newImgObj = { 
            id: optimisticId, 
            url: img.url, 
            name: img.name, 
            file_v_id: null, // Temp null, will update after upload
            isUploading: true 
        };
        
        if (isReplacing) {
            updated[activeSlideIndex] = newImgObj;
        } else if (updated.length < 4) {
            updated.push(newImgObj);
        }
        return updated;
    });

    setOpenContextMenu(null);
    setShowGallery(false);

    // 3. Backend Association (Upload/Copy)
    try {
        let uploaded = null;
        if (img.file) {
            uploaded = await uploadFile(img.file, replacingId);
        } else {
            // Existing gallery image - fetch blob and re-upload/associate
            try {
                const response = await fetch(img.url);
                const blob = await response.blob();
                const file = new File([blob], img.name || 'gallery_image.png', { type: blob.type || 'image/png' });
                uploaded = await uploadFile(file, replacingId);
            } catch (fetchErr) {
                console.error("Failed to fetch gallery image blob:", fetchErr);
            }
        }

        // 4. Update State with Permanent ID
        if (uploaded) {
            setSlideshowImages(prev => prev.map(item => {
                if (item.id === optimisticId) { // Match by our temp ID
                    return { 
                        ...item, 
                        url: uploaded.url, 
                        name: uploaded.name, 
                        file_v_id: uploaded.file_v_id, 
                        isUploading: false 
                    };
                }
                return item;
            }));
        } else {
             // Fallback: Remove uploading flag
             setSlideshowImages(prev => prev.map(item => {
                if (item.id === optimisticId) return { ...item, isUploading: false };
                return item; 
             }));
        }

    } catch (error) {
        console.error("Failed to associate gallery image:", error);
    }
  };

  const updateSetting = (key, value) => {
    setSlideshowSettings({ ...slideshowSettings, [key]: value });
  };

  const effects = ['Linear', 'Fade', 'Slide', 'Push', 'Flip', 'Reveal'];

  return (
    <div className="space-y-[1vw]">
      {/* Slideshow Image Management UI */}
      <div className="space-y-[1vw]">
          <div className="flex items-center gap-[0.5vw] py-[0.25vw]">
    <span className="text-[0.75vw] font-semibold text-black-900 whitespace-nowrap">Slideshow</span>
    <div className="h-[0.05vw] flex-1 bg-gray-200" />
  </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[0.75vw] font-semibold text-gray-700">You Can Upload up to 4 Images :</span>
            <div className="relative">
                <button 
                  onClick={() => setShowFitDropdown(!showFitDropdown)}
                  className="flex items-center justify-between w-[4.5vw] px-[0.5vw] py-[0.375vw] bg-white border border-gray-300 rounded-[0.4vw] hover:border-indigo-400 transition-all text-[0.6vw] font-medium text-gray-700 shadow-sm"
                >
                  <span>{slideshowSettings.imageFitType || 'Fill All'}</span>
                  <ChevronDown size="0.75vw" className={`text-gray-400 transition-transform ${showFitDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFitDropdown && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowFitDropdown(false)} />
                    <div className="absolute right-0 top-full mt-[0.25vw] w-[4.5vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-xl z-[100] py-[0.25vw] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {['Fit All', 'Fill All'].map(type => (
                        <button 
                          key={type}
                          onClick={() => {
                            updateSetting('imageFitType', type);
                            setShowFitDropdown(false);
                          }}
                          className="w-full text-left px-[0.75vw] py-[0.5vw] text-[0.6vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[0.65vw] px-[0.125vw]">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="relative group/slot">
                <div 
                  onClick={() => setActiveSlideIndex(i)}
                  className={`aspect-[1/1] w-full rounded-[0.75vw] cursor-pointer border-[0.1vw] transition-all duration-300 relative flex items-center justify-center group/card hover:scale-[1.05] hover:-translate-y-[0.25vw] hover:z-20 ${
                    activeSlideIndex === i 
                      ? 'border-[#6366f1] shadow-[0_0.65vw_1.25vw_-0.4vw_rgba(99,102,241,0.3)]' 
                      : (slideshowImages[i] ? 'border-gray-200 hover:border-gray-400 hover:shadow-[0_0.75vw_1.5vw_-0.5vw_rgba(0,0,0,0.15)]' : 'border-gray-400 hover:border-indigo-400 shadow-sm')
                  } ${!slideshowImages[i] ? 'bg-gray-50/50 border-dashed' : 'bg-white shadow-sm'}`}
                >
                  {slideshowImages[i] ? (
                    <img src={slideshowImages[i].url} className="w-full h-full object-cover rounded-[0.6vw]" alt="" />
                  ) : (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setActiveSlideIndex(i); fileInputRef.current?.click(); }}
                      className="flex flex-col items-center justify-center gap-[0.375vw] opacity-30 group-hover/card:opacity-60 transition-all duration-300"
                    >
                      <Upload size="0.95vw" strokeWidth={1.5} className="text-gray-900" />
                      <span className="text-[0.6vw] font-semibold text-gray-900">Upload</span>
                    </div>
                  )}
 
                  {/* Actions Trigger - Premium Design */}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOpenContextMenu(openContextMenu === i ? null : i); 
                    }}
                    className={`absolute -top-[0.375vw] -right-[0.375vw] w-[2vw] h-[2vw] rounded-full bg-white shadow-[0_0.1vw_0.5vw_rgba(0,0,0,0.1)] border-[0.1vw] border-black flex items-center justify-center transition-all duration-200 z-30 ${
                      openContextMenu === i ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover/card:opacity-100 group-hover/card:scale-100'
                    } hover:bg-gray-50 active:scale-95`}
                  >
                    <MoreVertical size="0.75vw" className="text-black" strokeWidth={2.5} />
                  </button>
                </div>

                {openContextMenu === i && (
                  <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setOpenContextMenu(null)} />
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 mt-[0.25vw] w-[7.5vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <button 
                        onClick={() => { 
                          if (slideshowImages[i]) {
                             setReplaceTargetIndex(i);
                             setShowReplaceModal(true);
                             setOpenContextMenu(null);
                          } else {
                             setActiveSlideIndex(i); 
                             fileInputRef.current?.click(); 
                             setOpenContextMenu(null); 
                          }
                        }}
                        className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors"
                      >
                        {slideshowImages[i] ? "Replace Image" : "Upload Image"}
                      </button>
                      <button 
                        onClick={() => { setActiveSlideIndex(i); setShowGallery(true); setOpenContextMenu(null); }}
                        className={`w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors ${slideshowImages[i] ? 'border-b border-gray-50' : ''}`}
                      >
                        Image Gallery
                      </button>
                      {slideshowImages[i] && (
                        <button 
                          onClick={() => deleteImage(i)}
                          className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-red-500 hover:bg-red-50 text-left transition-colors"
                        >
                          Delete Image
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".jpg, .jpeg, .png" className="hidden" />
      </div>

      {/* Opacity Slider */}
      <div className="space-y-[0.75vw] py-[0.5vw]">
        <SectionHeader title="Opacity" />
        <div className="flex items-center gap-[0.75vw] px-[0.25vw]">
          <div className="flex-1">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={opacity} 
              onChange={(e) => onUpdateOpacityRef.current?.(Number(e.target.value))} 
              className="w-full h-[0.25vw] rounded-full appearance-none cursor-pointer" 
              style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)` }} 
            />
          </div>
          <span className="text-[0.65vw] font-semibold text-gray-700 w-[2.5vw] text-right">{opacity}%</span>
        </div>
      </div>

      {/* Properties Accordion */}
      <div className="border border-gray-100 rounded-[0.75vw] shadow-sm bg-white">
        <button 
          onClick={onToggle} 
          className={`w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.85vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors ${isOpen ? 'rounded-t-[0.8vw]' : 'rounded-[0.8vw]'}`}
        >
          <span>Slideshow Properties</span>
          <ChevronDown size="1vw" className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="relative px-[1.5vw] pb-[1.25vw] pt-[0.75vw] border-t border-gray-100">
          <div className="space-y-[1vw] animate-in slide-in-from-top-2 duration-300">
            {/* Mode Toggle */}
            {/* Mode Select Dropdown */}
            <div className="flex justify-start pt-[0.25vw] relative z-20">
              <div className="relative">
                <button 
                  onClick={(e) => {
                    if (!showModeDropdown) {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const spaceBelow = window.innerHeight - rect.bottom;
                       setDropUp(spaceBelow < 120);
                    }
                    setShowModeDropdown(!showModeDropdown);
                  }}
                  className="flex items-center justify-between w-[9.5vw] px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-sm hover:border-indigo-300 transition-all text-[0.75vw] font-semibold text-gray-700"
                >
                  <span>{slideshowSettings.autoPlay ? 'Auto Slide Mode' : 'Manual Slide Mode'}</span>
                  <ArrowRightLeft size="0.75vw" className={`text-gray-400 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showModeDropdown && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowModeDropdown(false)} />
                    <div className={`absolute left-0 w-full min-w-[9.5vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-hidden z-[100] py-[0.25vw] animate-in fade-in zoom-in-95 duration-150 ${dropUp ? 'bottom-full mb-[0.5vw] origin-bottom' : 'top-full mt-[0.5vw] origin-top'}`}>
                      {[
                        { label: 'Auto Slide Mode', value: true },
                        { label: 'Manual Slide Mode', value: false }
                      ].map((mode) => (
                        <button 
                          key={mode.label}
                          onClick={() => {
                            updateSetting('autoPlay', mode.value);
                            setShowModeDropdown(false);
                          }}
                          className={`w-full px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-left hover:bg-gray-50 transition-colors ${slideshowSettings.autoPlay === mode.value ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600 hover:text-indigo-600'}`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Slide Effect */}
            <div className="space-y-[0.75vw]">
              <SectionHeader title="Slide Effect" />
              <div className="flex items-center justify-between">
                <span className="text-[0.75vw] font-medium text-gray-600">Select Slide Effects :</span>
                <div className="relative">
                  <button 
                    onClick={() => setShowEffectDropdown(!showEffectDropdown)}
                    className="flex items-center justify-between w-[6vw] px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-sm hover:border-indigo-300 transition-all text-[0.65vw] font-semibold text-gray-700"
                  >
                    <span>{slideshowSettings.transitionEffect || 'Linear'}</span>
                    <ChevronDown size="0.75vw" className={`text-gray-400 transition-transform ${showEffectDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showEffectDropdown && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowEffectDropdown(false)} />
                      <div className="absolute right-0 top-full mt-[0.5vw] w-full min-w-[6vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-hidden z-[100] py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                        {effects.map((eff) => (
                          <button 
                            key={eff} 
                            onClick={() => {
                              updateSetting('transitionEffect', eff);
                              setShowEffectDropdown(false);
                            }} 
                            className="w-full px-[1vw] py-[0.5vw] text-[0.65vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"
                          >
                            {eff}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="space-y-[1vw]">
              <SectionHeader title="Navigation Controls" />
              
              {slideshowSettings.autoPlay && (
                <div className="flex items-center justify-between px-0 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-[0.75vw] font-medium text-gray-700 whitespace-nowrap">Auto Slide Duration</span>
                  <div className="flex-1 mx-[1vw] h-[0.05vw] border-t border-gray-100 border-dashed" />
                  <div className="flex items-center gap-[0.375vw]">
                    <button 
                      onClick={() => updateSetting('speed', Math.max(1, slideshowSettings.speed - 1))}
                      className="w-[1.75vw] h-[1.75vw] flex items-center justify-center border border-gray-200 rounded-[0.3vw] text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                    >
                      <ChevronLeft size="0.75vw" />
                    </button>
                    <div className="w-[2.75vw] h-[1.75vw] border border-gray-200 rounded-[0.3vw] text-[0.65vw] font-semibold text-gray-700 bg-white shadow-sm overflow-hidden">
                      <DraggableSpan 
                        label={`${slideshowSettings.speed}s`}
                        value={slideshowSettings.speed}
                        onChange={(v) => updateSetting('speed', v)}
                        min={1}
                        max={20}
                        className="w-full h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => updateSetting('speed', Math.min(20, slideshowSettings.speed + 1))}
                      className="w-[1.75vw] h-[1.75vw] flex items-center justify-center border border-gray-200 rounded-[0.3vw] text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                    >
                      <ChevronRight size="0.75vw" />
                    </button>
                  </div>
                </div>
              )}

              {!slideshowSettings.autoPlay && (
                <div className="space-y-[0.75vw] pt-[0.25vw] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[0.75vw] font-medium text-gray-700">Drag to Slide</span>
                    <div className="flex-1 mx-[1vw] h-[0.05vw] border-t border-gray-100 border-dashed" />
                    <Toggle active={slideshowSettings.dragToSlide} onClick={() => updateSetting('dragToSlide', !slideshowSettings.dragToSlide)} />
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[0.75vw] font-medium text-gray-700">Navigation Buttons</span>
                    <div className="flex-1 mx-[1vw] h-[0.05vw] border-t border-gray-200 border-dashed" />
                    <Toggle active={slideshowSettings.showArrows} onClick={() => updateSetting('showArrows', !slideshowSettings.showArrows)} />
                  </div>
                </div>
              )}
            </div>

            {/* Other Controls */}
            <div className="space-y-[0.75vw]">
              <SectionHeader title="Other Controls" />
              
              <div className="flex items-center justify-between">
                <span className="text-[0.75vw] font-medium text-gray-600">Pagination Dots</span>
                <div className="flex items-center gap-[0.75vw] flex-1 px-[1vw]">
                  <div className="h-[0.05vw] w-full border-t border-gray-100 border-dashed" />
                </div>
                <Toggle active={slideshowSettings.showDots} onClick={() => updateSetting('showDots', !slideshowSettings.showDots)} />
              </div>

              {slideshowSettings.showDots && (
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-[0.75vw] font-medium text-gray-600">Dot Color :</span>
                  <div className="flex items-center gap-[0.5vw]">
                    <div className="relative group/color">
                      <div 
                        className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 shadow-sm cursor-pointer overflow-hidden"
                        style={{ backgroundColor: slideshowSettings.dotColor }}
                      >
                        <input 
                          type="color" 
                          value={slideshowSettings.dotColor}
                          onChange={(e) => updateSetting('dotColor', e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center bg-white border border-gray-200 rounded-[0.6vw] px-[0.65vw] py-[0.375vw] shadow-sm gap-[0.5vw]">
                      <input 
                        type="text" 
                        value={slideshowSettings.dotColor.toUpperCase()}
                        onChange={(e) => updateSetting('dotColor', e.target.value)}
                        className="w-[3.5vw] text-[0.6vw] font-semibold text-gray-700 outline-none"
                      />
                      <div className="w-[0.05vw] h-[0.75vw] bg-gray-200" />
                      <DraggableSpan 
                        label={`${slideshowSettings.dotOpacity}%`}
                        value={slideshowSettings.dotOpacity}
                        onChange={(v) => updateSetting('dotOpacity', v)}
                        className="text-[0.6vw] font-semibold text-gray-500 w-[2vw] text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[0.75vw] font-medium text-gray-600">Infinity Loop Mode</span>
                <div className="flex items-center gap-[0.75vw] flex-1 px-[1vw]">
                  <div className="h-[0.05vw] w-full border-t border-gray-100 border-dashed" />
                </div>
                <Toggle active={slideshowSettings.infiniteLoop} onClick={() => updateSetting('infiniteLoop', !slideshowSettings.infiniteLoop)} />
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Internal Gallery Modal */}
      {/* Internal Gallery Modal */}
      {showGallery && (
        <GalleryImage 
          onClose={() => setShowGallery(false)}
          onSelect={handleGallerySelect}
          currentPageVId={currentPageVId}
          flipbookVId={flipbookVId}
          folderName={folderName}
          flipbookName={flipbookName}
        />
      )}

      {/* Replace Image Modal*/}
      {showReplaceModal && replaceTargetIndex !== null && slideshowImages[replaceTargetIndex] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-[1vw]">
           <div className="fixed inset-0 bg-black/40 backdrop-blur-[0.15vw]" onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} />
           <div className="relative bg-white rounded-[2vw] shadow-2xl w-[28vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 p-[2vw]">
              {/* HEADER */}
              <div className="flex items-center gap-[1vw] mb-[2.5vw]">
                <h2 className="text-[1.1vw] font-semibold text-gray-700 whitespace-nowrap">Replace Image</h2>
                <div className="h-[0.1vw] w-full bg-gray-100 flex-1" />
                <button 
                  onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} 
                  className="w-[1.5vw] h-[1.5vw] flex items-center justify-center rounded-[0.75vw] border-[0.15vw] border-[#ff6b6b] text-[#ff6b6b] hover:bg-red-50 transition-colors shrink-0"
                >
                  <X size="1vw" strokeWidth={2.5} />
                </button>
              </div>
 
              {/* CONTENT AREA */}
              <div className="flex flex-col gap-[1.5vw] mb-[2vw]">
                <div className="flex items-center justify-between gap-[1vw]">
                  {/* Left: Current Image container */}
                  <div className="flex flex-col items-center gap-[0.5vw] w-[8vw]">
                    <div className="w-[6vw] h-[6vw] rounded-[1.25vw] border-[0.15vw] border-dashed border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden p-[0.5vw]">
                       <img src={slideshowImages[replaceTargetIndex].url} className="w-full h-full object-contain rounded-[0.5vw]" alt="current" />
                    </div>
                    <span className="text-[0.9vw] font-semibold text-gray-400 truncate w-full text-center">Current</span>
                  </div>
 
                  {/* Middle: Replacement Connector - Vertically Centered */}
                  <div className="flex items-center justify-center pt-[0.5vw]">
                    <Replace size="1.5vw" className="text-gray-400" strokeWidth={1.5} />
                  </div>
 
                  {/* Right: Upload Drop-zone - Matches height of left box */}
                  <div className="flex flex-col items-center gap-[0.5vw] flex-1">
                    <div 
                      onClick={() => replaceInputRef.current?.click()}
                      className={`w-full h-[6vw] rounded-[1.25vw] border-[0.15vw] border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                        newReplaceImg ? 'border-gray-400 bg-indigo-50/20' : 'border-gray-400 bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                       {newReplaceImg ? (
                         <div className="relative w-full h-full p-[0.5vw] flex items-center justify-center">
                            <img src={newReplaceImg.url} className="w-full h-full object-contain rounded-[0.5vw]" alt="new" />
                            <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Upload size="1.25vw" className="text-black-900" />
                            </div>
                         </div>
                       ) : (
                         <>
                           <Upload size="1.5vw" className="text-gray-400 mb-[0.25vw] group-hover:-translate-y-1 transition-transform" />
                           <p className="text-[0.8vw] text-gray-500 font-medium">Drag & Drop or <span className="text-indigo-600 font-semibold">Upload</span></p>
                         </>
                       )}
                    </div>
                    <p className="text-[0.7vw] text-gray-400 font-medium italic">Supported File Format : JPG, PNG</p>
                  </div>
                </div>
              </div>
 
              {/* FOOTER BUTTONS */}
              <div className="flex items-center justify-end gap-[0.75vw] mt-[1vw]">
                 <button 
                  onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} 
                  className="px-[1.5vw] h-[2vw] rounded-[0.5vw] border-[0.15vw] border-gray-700 text-gray-700 font-semibold text-[0.9vw] flex items-center gap-[0.5vw] hover:bg-gray-50 transition-all"
                 >
                   <X size="1vw" strokeWidth={2.5} /> Close
                 </button>
                 <button 
                  onClick={confirmReplace}
                  disabled={!newReplaceImg}
                  className={`px-[2vw] h-[2vw] rounded-[0.5vw] font-semibold text-[0.9vw] flex items-center gap-[0.5vw] shadow-lg transition-all ${
                    newReplaceImg 
                      ? 'bg-gray-600 text-white hover:bg-gray-700 hover:scale-[1.02] active:scale-95' 
                      : 'bg-gray-200 text-black-900 cursor-not-allowed shadow-none'
                  }`}
                 >
                   <Replace size="1vw" strokeWidth={2.5} /> Replace
                 </button>
              </div>
 
              <input type="file" ref={replaceInputRef} onChange={handleReplaceUpload} accept="image/*" className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default SlideshowProperties;
