import React, { useState } from 'react';
import { X, Upload, ChevronLeft, ChevronRight, Minus, Plus, GripVertical } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useModernToast } from './ModernToast';
import { motion, AnimatePresence } from 'framer-motion';
import { getPdfPageCount } from '../utils/pdfUtils';
import AlertModal from './AlertModal';

const CreateFlipbookModal = ({ isOpen, onClose, onUpload, onTemplate, initialView = 'upload', initialTemplateId = 'corporate', existingFlipbooks = [], initialFiles = null }) => {
  const [view, setView] = useState(initialView);
  const [initialFlipbookName, setInitialFlipbookName] = useState('');
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false, confirmText: 'Okay' });

  // Template View State
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [pageCount, setPageCount] = useState(12);
  const [orientation, setOrientation] = useState('portrait');

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
      const defaultName = isTemplate ? `Flipbook_${getFormattedDateTime()}` : `PDF_Flipbook_${getFormattedDateTime()}`;
      setFlipbookName(defaultName);
      setInitialFlipbookName(defaultName);
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
  const [isDragActive, setIsDragActive] = useState(false);
  
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
    { id: 'corporate', label: 'A4', title: 'A4 Page', dim: '210 × 297 mm', wCss: '4vw', hCss: '5.8vw' },
    { id: 'large_catalogue', label: 'A3', title: 'A3 Page', dim: '297 × 420 mm', wCss: '4.6vw', hCss: '6.5vw' },
    { id: 'mini', label: 'A5', title: 'A5 Page', dim: '148 × 210 mm', wCss: '3.2vw', hCss: '4.5vw' },
    { id: 'letter', label: 'Letter', title: 'Letter Page', dim: '216 × 279 mm', wCss: '4.2vw', hCss: '5.5vw' },
    { id: 'legal', label: 'Legal', title: 'Legal Page', dim: '216 × 356 mm', wCss: '4vw', hCss: '6.6vw' },
    { id: 'dl', label: 'DL', title: 'DL Flyer', dim: '99 × 210 mm', wCss: '2.3vw', hCss: '4.9vw' },
    { id: 'square', label: 'Square', title: 'Square Page', dim: '210 × 210 mm', wCss: '4.2vw', hCss: '4.2vw' },
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
    if (event.target && event.target.value !== undefined) {
      event.target.value = '';
    }
  };

  React.useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0) {
      handleFileChange({ target: { files: initialFiles } });
    }
  }, [isOpen, initialFiles]);

  if (!isOpen) return null;

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const confirmCreation = (actionCallback) => {
    if (flipbookName.trim() === initialFlipbookName) {
      setAlertState({
        isOpen: true,
        title: 'Default Name Detected',
        message: 'Are you sure you want to continue with the default flipbook name?',
        type: 'info',
        showCancel: true,
        confirmText: 'Continue',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          actionCallback();
        }
      });
    } else {
      actionCallback();
    }
  };

  const handleCreateFlipbook = () => {
    if (nameError || !flipbookName.trim()) return;
    confirmCreation(() => {
      onUpload(uploadedFiles.map(f => f.file), flipbookName.trim());
    });
  };

  const getTemplateDimensions = (tmplId, orient) => {
    let w = 210, h = 297;
    if (tmplId === 'corporate') { w = 210; h = 297; }
    else if (tmplId === 'large_catalogue') { w = 297; h = 420; }
    else if (tmplId === 'mini') { w = 148; h = 210; }
    else if (tmplId === 'letter') { w = 216; h = 279; }
    else if (tmplId === 'legal') { w = 216; h = 356; }
    else if (tmplId === 'dl') { w = 99; h = 210; }
    else if (tmplId === 'square') { w = 210; h = 210; }

    if (tmplId !== 'square' && orient === 'landscape') {
      return { width: h, height: w };
    }
    return { width: w, height: h };
  };

  const handleCreateFromTemplate = () => {
    if (nameError || !flipbookName.trim()) return;
    confirmCreation(() => {
      const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
      const dims = getTemplateDimensions(selectedTemplateId, orientation);
      console.log("Creating from template:", template, "Pages:", pageCount, "Orientation:", orientation, "Dims:", dims);
      const isSquare = selectedTemplateId === 'square';
      onTemplate({
        templateId: selectedTemplateId,
        pageCount,
        flipbookName: flipbookName.trim(),
        orientation: isSquare ? 'square' : orientation,
        width: dims.width,
        height: dims.height
      });
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnterBox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragLeaveBox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  const handleDragOverBox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };
  const handleDropBox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const eMock = { target: { files: e.dataTransfer.files, value: '' } };
      handleFileChange(eMock);
    }
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
        className={`w-full border-[0.15vw] border-dashed rounded-[0.75vw] flex flex-col items-center justify-center py-[1.25vw] mb-[1vw] cursor-pointer transition-colors ${isDragActive ? 'border-green-500 bg-green-50/50 scale-[1.02]' : 'border-[#4c5add] hover:bg-blue-50/50'}`}
        onClick={handleUploadClick}
        onDragEnter={handleDragEnterBox}
        onDragLeave={handleDragLeaveBox}
        onDragOver={handleDragOverBox}
        onDrop={handleDropBox}
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
                      <span className="text-[0.75vw] font-bold text-gray-900 block truncate" title={fileObj.file?.name}>
                        {fileObj.file?.name?.length > 35 ? fileObj.file?.name.substring(0, 35) + '...' : fileObj.file?.name}
                      </span>
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
    const isSquare = template.id === 'square';
    const isLandscape = !isSquare && orientation === 'landscape';

    const getDisplayDim = (dimStr) => {
      if (!dimStr) return '';
      if (!isLandscape) return dimStr;
      const parts = dimStr.split(' × ');
      if (parts.length === 2) {
        const [w, hWithUnit] = parts;
        const hParts = hWithUnit.split(' ');
        const h = hParts[0];
        const unit = hParts.slice(1).join(' ');
        return `${h} × ${w}${unit ? ' ' + unit : ''}`;
      }
      return dimStr;
    };

    const previewWidth = isLandscape ? template.hCss : template.wCss;
    const previewHeight = isLandscape ? template.wCss : template.hCss;

    return (
      <div className="relative bg-white rounded-[1.25vw] p-[1.25vw] shadow-2xl flex flex-col w-full max-w-[27vw] mx-auto border border-gray-100/80">
        {/* Header */}
        <div className="mb-[1vw]">
          <div className="flex items-center justify-between mb-[0.25vw]">
            <div className="flex items-center flex-1 mr-[0.75vw]">
              <h2 className="text-[1.3vw] font-bold text-gray-900 tracking-tight pr-[0.75vw] whitespace-nowrap">Built From Scratch</h2>
              <div className="flex-1 h-[1px] bg-gray-200 mt-[0.1vw]"></div>
            </div>
            {/* Red Close Button */}
            <button
              onClick={onClose}
              className="text-red-500 border border-red-300 hover:bg-red-50 transition-colors p-[0.3vw] rounded-[0.4vw] cursor-pointer flex items-center justify-center"
            >
              <X size="1.1vw" strokeWidth={2} />
            </button>
          </div>
          <p className="text-[0.68vw] text-gray-500">Create your flipbook from scratch and design every page your way</p>
        </div>

        {/* Form Container Card */}
        <div className="border border-gray-200 rounded-[0.8vw] p-[1.2vw] mb-[1vw] bg-white">
          {/* Selected Template Preview */}
          <div className="flex flex-col items-center justify-center mb-[1vw] min-h-[8.5vw]">
            <div
              style={{ width: previewWidth, height: previewHeight }}
              className="bg-[#383e93] text-white flex items-center justify-center font-medium text-[0.85vw] shadow-sm rounded-none mb-[0.4vw] transition-all duration-300"
            >
              {template.label}
            </div>
            <p className="text-[0.75vw] text-gray-700 font-normal mt-[0.2vw]">{getDisplayDim(template.dim)}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-[1vw]">
            {/* Flipbook Name */}
            <div>
              <label className="block text-[0.75vw] font-bold text-gray-900 mb-[0.35vw]">Flipbook Name</label>
              <input
                type="text"
                value={flipbookName}
                onChange={handleNameChange}
                placeholder="Flipbook Name"
                className={`w-full border rounded-[0.5vw] px-[0.75vw] py-[0.45vw] text-[0.75vw] focus:outline-none bg-white ${
                  nameError
                    ? 'border-red-500 text-red-500 bg-red-50 focus:border-red-500'
                    : 'border-gray-200 text-gray-800 focus:border-[#4c5add]'
                }`}
              />
              {nameError && <p className="text-red-500 text-[0.55vw] mt-[0.3vw] font-medium">This flipbook name already exists.</p>}
            </div>

            {/* Pages Orientation - Hidden for Square */}
            {!isSquare && (
              <div>
                <label className="block text-[0.75vw] font-bold text-gray-900 mb-[0.4vw]">Pages Orientation</label>
                <div className="flex gap-[0.75vw]">
                  {/* Portrait Option */}
                  <div
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 flex items-center gap-[0.6vw] p-[0.5vw] rounded-[0.5vw] cursor-pointer transition-all ${
                      orientation === 'portrait'
                        ? 'border-[1.5px] border-[#4c5add] bg-[#f0f2fe]'
                        : 'border border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-[1vw] h-[1vw] rounded-full border-2 ${
                        orientation === 'portrait' ? 'border-[#4c5add]' : 'border-gray-300'
                      } flex items-center justify-center flex-shrink-0`}
                    >
                      {orientation === 'portrait' && <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#4c5add]" />}
                    </div>
                    <div className="w-[1.3vw] h-[1.7vw] border-[1.5px] border-gray-800 rounded-[0.15vw] flex items-center justify-center flex-shrink-0">
                      <svg width="0.7vw" height="0.9vw" viewBox="0 0 12 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2v12M3 5l3-3 3 3M3 11l3 3 3-3" />
                      </svg>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[0.72vw] font-bold text-gray-900">Portrait</span>
                      <span className="text-[0.55vw] text-gray-400 font-normal">Vertical</span>
                    </div>
                  </div>

                  {/* Landscape Option */}
                  <div
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 flex items-center gap-[0.6vw] p-[0.5vw] rounded-[0.5vw] cursor-pointer transition-all ${
                      orientation === 'landscape'
                        ? 'border-[1.5px] border-[#4c5add] bg-[#f0f2fe]'
                        : 'border border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-[1vw] h-[1vw] rounded-full border-2 ${
                        orientation === 'landscape' ? 'border-[#4c5add]' : 'border-gray-300'
                      } flex items-center justify-center flex-shrink-0`}
                    >
                      {orientation === 'landscape' && <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#4c5add]" />}
                    </div>
                    <div className="w-[1.7vw] h-[1.3vw] border-[1.5px] border-gray-800 rounded-[0.15vw] flex items-center justify-center flex-shrink-0">
                      <svg width="0.9vw" height="0.7vw" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6h12M5 3L2 6l3 3M11 3l3 3-3 3" />
                      </svg>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[0.72vw] font-bold text-gray-900">Landscape</span>
                      <span className="text-[0.55vw] text-gray-400 font-normal">Horizontal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Number of Pages */}
            <div>
              <div className="flex items-center gap-[0.4vw] mb-[0.35vw]">
                <span className="text-[0.75vw] font-bold text-gray-900">Number of Pages</span>
                <span className="text-[0.6vw] text-gray-500 font-normal">Min 4 - Max 12 Pages<span className="text-red-500">*</span></span>
              </div>
              <div className="flex items-center gap-[0.3vw]">
                <button
                  type="button"
                  onClick={() => setPageCount(Math.max(4, pageCount - 1))}
                  disabled={pageCount <= 4}
                  className="w-[2vw] h-[2vw] rounded-[0.3vw] border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors"
                >
                  <Minus size="0.8vw" />
                </button>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.min(12, Math.max(4, parseInt(e.target.value) || 4)))}
                  className="w-[6vw] h-[2vw] rounded-[0.3vw] border border-gray-200 text-center text-[0.75vw] font-semibold text-gray-800 outline-none focus:border-[#4c5add] bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setPageCount(Math.min(12, pageCount + 1))}
                  disabled={pageCount >= 12}
                  className="w-[2vw] h-[2vw] rounded-[0.3vw] border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors"
                >
                  <Plus size="0.8vw" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[0.75vw]">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-[0.6vw] py-[0.6vw] text-[0.8vw] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFromTemplate}
            disabled={nameError || !flipbookName.trim()}
            className={`flex-1 bg-[#4c5add] hover:bg-[#3d4bbd] text-white rounded-[0.6vw] py-[0.6vw] text-[0.8vw] font-semibold shadow-md transition-colors cursor-pointer ${
              nameError || !flipbookName.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
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
          <AlertModal
            isOpen={alertState.isOpen}
            onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            onConfirm={alertState.onConfirm}
            type={alertState.type}
            title={alertState.title}
            message={alertState.message}
            showCancel={alertState.showCancel}
            confirmText={alertState.confirmText}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateFlipbookModal;
