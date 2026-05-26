import React, { useState } from 'react';
import { X, Upload, ChevronLeft, ChevronRight, Minus, Plus, GripVertical } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useModernToast } from './ModernToast';
import { motion, AnimatePresence } from 'framer-motion';
import { getPdfPageCount } from '../utils/pdfUtils';

const CreateFlipbookModal = ({ isOpen, onClose, onUpload, onTemplate, initialView = 'upload', initialTemplateId = 'corporate', existingFlipbooks = [] }) => {
  const [view, setView] = useState(initialView);

  // Template View State
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [pageCount, setPageCount] = useState(12);

  const getFormattedDateTime = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };

  const [flipbookName, setFlipbookName] = useState(`PDF_Flipbook_${getFormattedDateTime()}`);
  const [nameError, setNameError] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setView(initialView === 'selection' ? 'upload' : initialView);
      setSelectedTemplateId(initialTemplateId);
      setUploadedFiles([]);
      const isTemplate = (initialView === 'selection' ? 'upload' : initialView) === 'template';
      setFlipbookName(isTemplate ? `Flipbook_${getFormattedDateTime()}` : `PDF_Flipbook_${getFormattedDateTime()}`);
      setNameError(false);
    }
  }, [isOpen, initialView, initialTemplateId]);

  const handleNameChange = (e) => {
      const val = e.target.value;
      setFlipbookName(val);
      if (existingFlipbooks.includes(val.trim())) {
          setNameError(true);
      } else {
          setNameError(false);
      }
  };
  const fileInputRef = React.useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Drag and drop state for reordering files
  const dragItem = React.useRef(null);
  const dragOverItem = React.useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  const handleDragStart = (e, index) => { 
      dragItem.current = index; 
      setDragOverIndex(null);
  };
  
  const handleDragEnter = (e, index) => { 
      dragOverItem.current = index; 
      setDragOverIndex(index);
  };
  
  const handleDragEnd = () => {
      if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
          setUploadedFiles(prev => {
              const _files = [...prev];
              const draggedItem = _files[dragItem.current];
              if (!draggedItem) return prev; // Prevent undefined if index is out of bounds
              _files.splice(dragItem.current, 1);
              _files.splice(dragOverItem.current, 0, draggedItem);
              return _files;
          });
      }
      dragItem.current = null;
      dragOverItem.current = null;
      setDragOverIndex(null);
  };

  const carouselRef = React.useRef(null);
  const toast = useModernToast();

  const [templateUnit, setTemplateUnit] = useState('Cm');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFormattedDim = (dimStr) => {
    const match = dimStr.match(/\(([\d.]+)\s*x\s*([\d.]+)\s*Cm\)/i);
    if (!match) return dimStr;
    const wCm = parseFloat(match[1]);
    const hCm = parseFloat(match[2]);
    if (templateUnit === 'Cm') return `(${wCm} x ${hCm} Cm)`;
    if (templateUnit === 'Mm') return `(${Math.round(wCm * 10)} x ${Math.round(hCm * 10)} Mm)`;
    if (templateUnit === 'Px') return `(${Math.round(wCm * 10 * 96 / 25.4)} x ${Math.round(hCm * 10 * 96 / 25.4)} Px)`;
    return dimStr;
  };

  const templates = [
    { id: 'corporate', label: 'A4', title: 'Corporate Brochure', dim: '(29.7 x 42 Cm)', width: 'w-[6vw]', height: 'h-[9vw]' },
    { id: 'catalogue', label: 'A4', title: 'Product Catalogue', dim: '(21 x 29 Cm)', width: 'w-[9vw]', height: 'h-[6vw]' },
    { id: 'large_catalogue', label: 'A3', title: 'Large Catalogue', dim: '(29.7 x 42 Cm)', width: 'w-[7vw]', height: 'h-[10vw]' },
    { id: 'showcase', label: 'A3', title: 'Showcase Brochure', dim: '(42 x 29.7 Cm)', width: 'w-[10vw]', height: 'h-[7vw]' },
    { id: 'mini', label: 'A5', title: 'Mini Brochure', dim: '(14.8 x 21 Cm)', width: 'w-[5vw]', height: 'h-[7vw]' },
    { id: 'booklet', label: 'B5', title: 'Standard Booklet', dim: '(17.6 x 25 Cm)', width: 'w-[5vw]', height: 'h-[7vw]' },
    { id: 'square', label: 'Square', title: 'Square Lookbook', dim: '(25 x 25 Cm)', width: 'w-[7vw]', height: 'h-[7vw]' },
    { id: 'square_small', label: 'Square Small', title: 'Square Small', dim: '(20 x 20 Cm)', width: 'w-[6vw]', height: 'h-[6vw]' },
    { id: 'digital_mag', label: 'Mag', title: 'Digital Magazine', dim: '(22 x 28 Cm)', width: 'w-[5vw]', height: 'h-[8vw]' },
    { id: 'mobile', label: 'Mob', title: 'Mobile Flipbook', dim: '(12 x 21.3 Cm)', width: 'w-[4vw]', height: 'h-[7vw]' },
  ];

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Simulate progress for new files
  React.useEffect(() => {
    if (uploadedFiles.length > 0) {
      const timers = uploadedFiles.map(fileObj => {
        if (fileObj.progress < 100) {
          return setInterval(() => {
            setUploadedFiles(prev => prev.map(f => {
              if (f.id === fileObj.id && f.progress < 100) {
                return { ...f, progress: Math.min(f.progress + 10, 100) };
              }
              return f;
            }));
          }, 200);
        }
        return null;
      });

      return () => timers.forEach(t => t && clearInterval(t));
    }
  }, [uploadedFiles]);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB Total

    // Calculate current total size
    const currentTotalSize = uploadedFiles.reduce((sum, f) => sum + f.file.size, 0);
    let newTotalSize = currentTotalSize;

    const validFiles = [];
    for (const file of files) {
      if (newTotalSize + file.size > MAX_TOTAL_SIZE) {
        toast.error(`Total size exceeds 20MB limit. Skipping ${file.name}`);
        continue;
      }
      validFiles.push(file);
      newTotalSize += file.size;
    }

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        pages: null
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);

      // Fetch actual page count for each PDF
      newFiles.forEach(async (f) => {
        try {
          const pages = await getPdfPageCount(f.file);
          setUploadedFiles(prev => prev.map(item => item.id === f.id ? { ...item, pages } : item));
        } catch (e) {
          console.error("Error reading PDF pages", e);
          setUploadedFiles(prev => prev.map(item => item.id === f.id ? { ...item, pages: '?' } : item));
        }
      });
    }

    // Clear input so same file can be selected again
    event.target.value = '';
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateFlipbook = () => {
    if (nameError || !flipbookName.trim()) return;
    onUpload(uploadedFiles.map(f => f.file), flipbookName.trim());
  };

  const handleCreateFromTemplate = () => {
    if (nameError || !flipbookName.trim()) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    console.log("Creating from template:", template, "Pages:", pageCount);
    onTemplate({ templateId: selectedTemplateId, pageCount, flipbookName: flipbookName.trim() });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };



  // Render Upload View
  const renderUploadView = () => (
    <div className="bg-white rounded-[1vw] p-[1.25vw] md:p-[1.5vw] w-full max-w-[26vw] mx-auto flex flex-col shadow-2xl relative border border-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between pb-[0.75vw] mb-[0.5vw] border-b border-gray-200">
        <h2 className="text-[1.25vw] font-bold text-gray-900">Upload PDF</h2>
        <button
          onClick={onClose}
          className="absolute top-[1vw] right-[1vw] text-red-500 hover:text-red-700 transition-colors z-50 p-[0.15vw] hover:bg-red-50 rounded-[0.3vw] border border-red-500"
        >
          <X size="1vw" strokeWidth={2} />
        </button>
      </div>

      {/* Subtitle */}
      <p className="text-[0.65vw] text-gray-500 mb-[1vw] leading-relaxed pr-[1vw]">
        Free plan supports up to <span className="font-bold text-gray-700">12 pages</span> per flipbook. If your PDF exceeds the limit, extra pages will be automatically removed.
      </p>

      {/* Drag & Drop Box */}
      <div
        className="w-full border-[0.15vw] border-dashed border-[#4c5add] rounded-[0.75vw] flex flex-col items-center justify-center py-[1.25vw] mb-[1vw] cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={handleUploadClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
          multiple
        />
        <Upload size="1.5vw" className="text-gray-400 mb-[0.25vw]" strokeWidth={1.5} />
        <p className="text-[0.75vw] text-gray-500 mb-[0.5vw]">Drag & Drop or <span className="text-[#4c5add] font-medium">Upload</span></p>
        <div className="flex items-center gap-[0.5vw] text-[0.6vw] text-gray-600">
          Supported File format-
          <div className="flex items-center gap-[0.4vw] ml-[0.25vw]">
            <Icon icon="vscode-icons:file-type-pdf2" className="w-[1.1vw] h-[1.1vw]" />
            <Icon icon="vscode-icons:file-type-word" className="w-[1.1vw] h-[1.1vw]" />
            <Icon icon="vscode-icons:file-type-powerpoint" className="w-[1.1vw] h-[1.1vw]" />
          </div>
        </div>
      </div>

      {/* Flipbook Name */}
      <div className="mb-[1vw]">
        <label className="block text-[0.7vw] font-bold text-gray-800 mb-[0.4vw]">Flipbook Name</label>
        <input
          type="text"
          value={flipbookName}
          onChange={handleNameChange}
          className={`w-full border rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] focus:outline-none ${nameError ? 'border-red-500 text-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 text-gray-600 focus:border-[#4c5add]'}`}
        />
        {nameError && <p className="text-red-500 text-[0.55vw] mt-[0.3vw] font-medium">This flipbook name already exists.</p>}
      </div>

      {/* Uploaded Files List */}
      <div className="flex flex-col gap-[0.5vw] max-h-[12vw] overflow-y-auto custom-scrollbar mb-[1.5vw] pr-[0.5vw]">
        {uploadedFiles.filter(Boolean).map((fileObj, index) => {
          const isDragOver = dragOverIndex === index && dragItem.current !== index;
          const dropPosition = dragItem.current !== null && dragItem.current > index ? 'top' : 'bottom';
          
          return (
          <div key={fileObj.id} className="relative">
            {isDragOver && dropPosition === 'top' && (
                <div className="absolute -top-[0.25vw] left-0 right-0 h-[0.2vw] bg-[#4c5add] rounded-full z-10"></div>
            )}
            <div 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`group flex flex-col p-[0.75vw] border rounded-[0.5vw] bg-white cursor-grab active:cursor-grabbing transition-colors ${isDragOver ? 'border-[#4c5add] bg-blue-50/40' : 'border-gray-100 hover:border-[#4c5add] shadow-sm'}`}
            >
              <div className="flex items-center justify-between">
                <div className="relative flex items-center flex-1 min-w-0">
                  <div className="absolute left-0 flex items-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing">
                      <GripVertical size="0.9vw" />
                  </div>
                  
                  <div className="flex items-center gap-[0.75vw] transition-transform duration-300 ease-in-out group-hover:translate-x-[1vw]">
                    <Icon icon="bi:file-earmark-pdf-fill" className="text-[#FF4444] w-[1.25vw] h-[1.25vw] flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.75vw] font-bold text-gray-900 truncate">{fileObj.file?.name}</span>
                      <span className="text-[0.55vw] text-gray-500 font-medium">
                        {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB - {fileObj.pages ? `${fileObj.pages} Pages` : 'Loading pages...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-[0.75vw]">
                  {fileObj.progress >= 100 ? (
                    <div className="w-[1.1vw] h-[1.1vw] bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                      <Icon icon="lucide:check" width="0.75vw" height="0.75vw" strokeWidth={4} />
                    </div>
                  ) : null}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(fileObj.id); }}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    {fileObj.progress >= 100 ? (
                      <Icon icon="lucide:trash-2" width="1vw" height="1vw" />
                    ) : (
                      <X size="1vw" />
                    )}
                  </button>
                </div>
              </div>
              {fileObj.progress < 100 && (
                <div className="w-full h-[0.15vw] bg-gray-100 rounded-full mt-[0.5vw] overflow-hidden">
                  <div className="h-full bg-[#4F46E5] transition-all duration-300" style={{ width: `${fileObj.progress}%` }}></div>
                </div>
              )}
            </div>
            {isDragOver && dropPosition === 'bottom' && (
                <div className="absolute -bottom-[0.25vw] left-0 right-0 h-[0.2vw] bg-[#4c5add] rounded-full z-10"></div>
            )}
          </div>
        )})}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-[1vw] mt-auto">
        <button
          onClick={onClose}
          className="flex-1 py-[0.6vw] cursor-pointer border border-gray-300 text-gray-700 font-semibold rounded-[0.5vw] text-[0.85vw] hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateFlipbook}
          disabled={uploadedFiles.length === 0 || !uploadedFiles.every(f => f.progress === 100) || nameError || !flipbookName.trim()}
          className={`flex-1 py-[0.6vw] font-semibold cursor-pointer rounded-[0.5vw] text-[0.85vw] transition-all ${uploadedFiles.length > 0 && uploadedFiles.every(f => f.progress === 100) && !nameError && flipbookName.trim()
              ? 'bg-[#4F46E5] text-white hover:bg-[#4338ca] shadow-lg shadow-indigo-500/30 active:scale-95'
              : 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
            }`}
        >
          Create Flipbook
        </button>
      </div>

    </div>
  );

  // Render Template View
  const renderTemplateView = () => {
    const template = templates.find(t => t.id === selectedTemplateId) || templates[0];

    return (
      <div className="relative bg-white rounded-[1vw] p-[1.25vw] md:p-[1.5vw] shadow-2xl flex flex-col w-full max-w-[26vw] mx-auto border border-gray-100">
        {/* Close Button (Red) */}
        <button
          onClick={onClose}
          className="absolute top-[1vw] right-[1vw] text-red-500 border border-red-500 hover:bg-red-50 transition-colors z-50 p-[0.15vw] rounded-[0.3vw]"
        >
          <X size="1vw" strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="mb-[1vw]">
          <div className="flex items-center mb-[0.2vw]">
            <h2 className="text-[1.25vw] font-bold text-black pr-[0.75vw]">Built From Starch</h2>
            <div className="flex-1 h-[0.0625vw] bg-gray-200 mt-[0.2vw] mr-[2vw]"></div>
          </div>
          <p className="text-[0.6vw] text-gray-500">Create your flipbook from scratch and design every page your way.</p>
        </div>

        <div className="border border-gray-200 rounded-[0.5vw] p-[1.25vw] mb-[1.25vw]">
          {/* Selected Template Preview */}
          <div className="flex flex-col items-center justify-center mb-[1.25vw]">
            <div className={`bg-[#b8a9e0] text-gray-700 flex items-center justify-center font-bold text-[0.8vw] shadow-sm rounded-[0.2vw] mb-[0.5vw] ${template.width} ${template.height} max-w-[100%] max-h-[12vw]`} style={{ transform: 'scale(0.85)' }}>
              {template.label}
            </div>
            <h4 className="text-[0.8vw] font-bold text-[#3b4190]">{template.title}</h4>
            <p className="text-[0.55vw] text-gray-500">{getFormattedDim(template.dim)}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-[1vw]">
            <div>
              <label className="block text-[0.7vw] font-bold text-black mb-[0.4vw]">Flipbook Name</label>
              <input 
                  type="text" 
                  value={flipbookName} 
                  onChange={handleNameChange} 
                  placeholder="Name of the flipbook" 
                  className={`w-full border rounded-[0.3vw] px-[0.6vw] py-[0.5vw] text-[0.7vw] focus:outline-none ${nameError ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-300 focus:border-[#4F46E5] text-gray-700'}`} 
              />
              {nameError && <p className="text-red-500 text-[0.55vw] mt-[0.3vw] font-medium">This flipbook name already exists.</p>}
            </div>

            <div className="flex items-center relative" ref={unitRef}>
              <label className="text-[0.7vw] font-bold text-black mr-[0.5vw]">Units :</label>
              <div 
                className="border border-gray-200 rounded-[0.3vw] px-[0.4vw] py-[0.2vw] flex items-center bg-gray-50 shadow-sm cursor-pointer w-fit"
                onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              >
                <span className="text-[0.7vw] text-gray-600 mr-[0.75vw]">
                    {templateUnit === 'Cm' ? 'Centimeter' : templateUnit === 'Mm' ? 'Millimeter' : 'Pixel'}
                </span>
                <ChevronRight size="0.9vw" className={`text-gray-400 transition-transform ${isUnitDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
              </div>
              {isUnitDropdownOpen && (
                  <div className="absolute top-full left-[2.5vw] mt-[0.2vw] bg-white border border-gray-200 rounded-[0.3vw] shadow-lg overflow-hidden z-10 w-[7vw]">
                      {['Cm', 'Mm', 'Px'].map(u => (
                          <div 
                              key={u}
                              className="px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-700 hover:bg-gray-100 cursor-pointer"
                              onClick={() => { setTemplateUnit(u); setIsUnitDropdownOpen(false); }}
                          >
                              {u === 'Cm' ? 'Centimeter' : u === 'Mm' ? 'Millimeter' : 'Pixel'}
                          </div>
                      ))}
                  </div>
              )}
            </div>

            <div className="flex items-center">
              <label className="text-[0.7vw] font-bold text-black mr-[0.5vw]">Number of Pages :</label>
              <div className="flex items-center gap-[0.4vw]">
                <button onClick={() => setPageCount(Math.max(2, pageCount - 2))} className="text-gray-400 hover:text-gray-600 cursor-pointer outline-none">
                  <Minus size="0.9vw" />
                </button>
                <div className="border border-gray-300 w-[2.5vw] h-[1.5vw] rounded-[0.2vw] flex items-center justify-center text-[0.7vw] font-medium text-black">
                  <input type="number" value={pageCount} readOnly className="w-full h-full text-center outline-none bg-transparent no-spin cursor-default" />
                </div>
                <button onClick={() => setPageCount(Math.min(100, pageCount + 2))} className="text-gray-400 hover:text-gray-600 cursor-pointer outline-none">
                  <Plus size="0.9vw" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[0.75vw]">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-[0.4vw] py-[0.6vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreateFromTemplate} className="flex-1 bg-[#4F46E5] rounded-[0.4vw] py-[0.6vw] text-[0.8vw] font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm">
            Create Flipbook
          </button>
        </div>

      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-[1vw]">
          {/* Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>

          {/* The Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full flex justify-center"
          >
            {view === 'upload' && renderUploadView()}
            {view === 'template' && renderTemplateView()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateFlipbookModal;
