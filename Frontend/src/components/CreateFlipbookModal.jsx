import React, { useState } from 'react';
import { X, Upload, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { Icon } from '@iconify/react';

const CreateFlipbookModal = ({ isOpen, onClose, onUpload, onTemplate }) => {
  const [view, setView] = useState('selection'); // 'selection' | 'upload' | 'template'
  const fileInputRef = React.useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const carouselRef = React.useRef(null);

  // Template View State
  const [selectedTemplateId, setSelectedTemplateId] = useState('corporate');
  const [pageCount, setPageCount] = useState(12);

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
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateFlipbook = () => {
    onUpload(uploadedFiles.map(f => f.file));
  };

  const handleCreateFromTemplate = () => {
    // Logic for creating from templat
    const template = templates.find(t => t.id === selectedTemplateId);
    console.log("Creating from template:", template, "Pages:", pageCount);
    onTemplate({ templateId: selectedTemplateId, pageCount }); 
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Render Selection View
  const renderSelectionView = () => (
    <div className="flex flex-col md:flex-row gap-[1vw] md:gap-[1.25vw] justify-center items-stretch">
            
      {/* Option 1: Upload PDF - Light Purple Background */}
      <div className="flex-1 bg-[#F5F6FF] rounded-[1vw] p-[1.25vw] md:p-[2vw] flex flex-col items-center text-center shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
        
        {/* Iconify Icon: PDF */}
        <div className="w-[3vw] h-[3vw] mb-[0.75vw] flex items-center justify-center">
             <Icon icon="bi:file-earmark-pdf-fill" width="2.5vw" height="2.5vw" className='text-[#FF4444]'/>
        </div>
        
        <h3 className="text-[1.15vw] font-bold text-gray-900 mb-[0.5vw]">Upload PDF</h3>
        <p className="text-[0.75vw] text-gray-500 mb-[1.5vw] leading-relaxed font-medium">
          Upload your ready PDF file and instantly convert it into a smooth, interactive flipbook
        </p>

        <button 
          onClick={() => setView('upload')}
          className="mt-auto w-full max-w-[12.5vw] py-[0.6vw] bg-[#4F46E5] text-white rounded-[0.75vw] font-bold text-[0.875vw] hover:bg-[#4338ca] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
        >
          Upload
        </button>
      </div>

      {/* Option 2: Build Using Templates - White Background */}
      <div className="flex-1 bg-white rounded-[1vw] p-[1.25vw] md:p-[2vw] flex flex-col items-center text-center shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
        
        {/* Iconify Icon: Templates */}
        <div className="w-[3vw] h-[3vw] mb-[0.75vw] flex items-center justify-center">
             <Icon icon="raphael:paper" width="2.5vw" height="2.5vw" />
        </div>
        
        <h3 className="text-[1.15vw] font-bold text-gray-900 mb-[0.5vw]">Build Using Templates</h3>
        <p className="text-[0.75vw] text-gray-500 mb-[1.5vw] leading-relaxed font-medium">
          Choose from ready-made page templates and design a flipbook from scratch
        </p>

        <button 
          onClick={() => setView('template')}
          className="mt-auto w-full max-w-[12.5vw] py-[0.6vw] bg-[#4F46E5] text-white rounded-[0.75vw] font-bold text-[0.875vw] hover:bg-[#4338ca] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
        >
          Select Pages
        </button>
      </div>

    </div>
  );

  // Render Upload View
  const renderUploadView = () => (
    <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.5vw] p-[1.25vw] md:p-[1.5vw] shadow-2xl flex justify-center w-full max-w-[40vw] mx-auto">
      <div className="bg-white rounded-[1vw] p-[1.25vw] md:p-[2vw] w-full text-center flex flex-col shadow-lg relative min-h-[22vw]">
        
         {/* Close Button for Upload View (Red) */}
         <button
            onClick={() => {
                setView('selection');
                setUploadedFiles([]); // Clear files on back
            }} 
            className="absolute top-[0.75vw] right-[0.75vw] text-red-500 hover:text-red-700 transition-colors z-50 p-[0.25vw] hover:bg-red-50 rounded-full"
         >
            <X size="1.1vw" />
         </button>

        <div className="flex items-center justify-between mb-[0.75vw] pb-[0.5vw] border-b border-gray-100">
           <h2 className="text-[1.25vw] font-bold text-gray-900">Upload PDF</h2>
        </div>

        <div className="mb-[1vw] text-left">
            <p className="text-[0.75vw] text-gray-500">Upload your ready PDF file and instantly convert it into a smooth, interactive flipbook</p>
        </div>

        {/* Container for centering content */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
            {uploadedFiles.length === 0 ? (
                /* Empty State - Compact Upload Box Centered */
                <div 
                className="border-2 border-dashed border-[#3b4190] rounded-[0.75vw] bg-white flex flex-col items-center justify-center gap-[0.5vw] hover:bg-gray-50 transition-colors cursor-pointer w-[10vw] h-[8vw] mx-auto"
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
                    <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#f0f2ff] flex items-center justify-center text-[#3b4190] mb-[0.25vw]">
                        <Upload size="1.25vw" />
                    </div>
                    <h4 className="text-[#3b4190] font-bold text-[0.75vw]">Upload PDF</h4>
                    <p className="text-gray-400 text-[0.6vw]">Browse or Drop</p>
                </div>
            ) : (
                /* With Files - Split Layout */
                <div className="flex-1 flex flex-col justify-start pt-[0.5vw] h-full">
                    <div className="flex-1 flex gap-[1vw] items-start h-full">
                        {/* Left: Small Upload Box */}
                        <div 
                            className="w-[7vw] h-[7vw] border-2 border-dashed border-[#3b4190] rounded-[0.75vw] bg-white flex flex-col items-center justify-center gap-[0.5vw] hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0"
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
                            <div className="w-[1.5vw] h-[1.5vw] rounded-[0.5vw] flex items-center justify-center text-[#3b4190]">
                                <Upload size="1vw" />
                            </div>
                            <span className="text-[#3b4190] font-medium text-[0.6vw] text-center px-[0.25vw]">Add PDF</span>
                        </div>

                        {/* Right: File List - Takes remaining space and scrolls */}
                        <div className="flex-1 flex flex-col gap-[0.5vw] h-full max-h-[11.25vw] overflow-y-auto pr-[0.5vw] custom-scrollbar">
                            {uploadedFiles.map((fileObj) => (
                                <div key={fileObj.id} className="relative flex items-center gap-[0.75vw] p-[0.5vw] bg-gray-50 rounded-[0.5vw] border border-gray-100 flex-shrink-0">
                                    {/* PDF Icon */}
                                    <div className="w-[1.75vw] h-[1.75vw] flex-shrink-0 flex items-center justify-center bg-red-50 rounded-[0.375vw]">
                                        <Icon icon="bi:file-earmark-pdf-fill" width="0.875vw" height="0.875vw" className='text-[#FF4444]'/>
                                    </div>
                                    
                                    {/* Info & Progress */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-[0.25vw]">
                                            <span className="text-[0.625vw] font-semibold text-gray-800 truncate pr-[0.5vw]">{fileObj.file.name}</span>
                                            <button 
                                                onClick={() => handleRemoveFile(fileObj.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size="0.75vw" />
                                            </button>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-[0.125vw] bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#4F46E5] transition-all duration-300 ease-out"
                                                style={{ width: `${fileObj.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Button */}
                    <div className="mt-[1.5vw] flex justify-center pb-[0.25vw]">
                        <button 
                            onClick={handleCreateFlipbook}
                            className="px-[2vw] py-[0.6vw] bg-[#6366f1] text-white rounded-[0.75vw] font-bold text-[0.875vw] hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
                        >
                            Create Flipbook
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  // Render Template View
  const renderTemplateView = () => (
    <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.5vw] p-[1.25vw] md:p-[1.5vw] shadow-2xl flex justify-center w-full max-w-[60vw] mx-auto">
      <div className="bg-white rounded-[1vw] p-[1.25vw] md:p-[2vw] w-full flex flex-col shadow-lg relative min-h-[25vw]">
         {/* Close Button (Red) */}
         <button
            onClick={() => setView('selection')} 
            className="absolute top-[0.75vw] right-[0.75vw] text-red-500 hover:text-red-700 transition-colors z-50 p-[0.25vw] hover:bg-red-50 rounded-full"
         >
            <X size="1.1vw" />
         </button>

         {/* Header */}
         <div className="mb-[1vw]">
            <div className="flex items-center gap-[0.75vw] mb-[0.25vw]">
                 <h2 className="text-[1.5vw] font-bold text-gray-900">Build Using Templates</h2>
                 <div className="flex-1 h-[0.0625vw] bg-gray-200 mt-[0.5vw]"></div>
            </div>
            <p className="text-[0.75vw] text-gray-500">Choose from ready-made page templates and design a flipbook from scratch</p>
         </div>

         {/* Templates Carousel */}
         <div className="flex items-center justify-between gap-[1vw] mb-[1.5vw] px-[1vw] py-[0.5vw] min-h-[10vw]">
             {/* Left Arrow */}
             <button 
                onClick={scrollLeft}
                className="p-[0.375vw] rounded-full hover:bg-gray-100 text-gray-400 z-10"
             >
                 <ChevronLeft size="1.25vw" />
             </button>

             {/* Cards Container - Scrollable */}
             <div 
                ref={carouselRef}
                className="flex items-end gap-[1.5vw] md:gap-[2vw] overflow-x-auto scrollnav-hidden scroll-smooth py-[1vw] px-[0.5vw]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
             >
                 {templates.map((template) => {
                     const isSelected = selectedTemplateId === template.id;
                     return (
                         <div 
                             key={template.id} 
                             className="flex flex-col items-center gap-[0.5vw] cursor-pointer group flex-shrink-0"
                             onClick={() => setSelectedTemplateId(template.id)}
                         >
                             {/* The Shape Box */}
                             <div 
                                className={`
                                    ${template.width} ${template.height} 
                                    border rounded-[0.25vw] flex items-center justify-center shadow-sm transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-[#3b4190] border-[#3b4190] text-white shadow-xl scale-105' 
                                        : 'bg-gray-50 border-gray-300 text-[#3b4190] group-hover:border-[#3b4190] group-hover:scale-105'
                                    }
                                `}
                             >
                                 <span className="text-[0.875vw] font-medium">{template.label}</span>
                             </div>

                             {/* Label */}
                             <div className="text-center w-[6vw]">
                                 <p className={`text-[0.625vw] font-bold transition-colors truncate ${isSelected ? 'text-[#3b4190]' : 'text-gray-700'}`}>
                                     {template.title}
                                 </p>
                                 <p className="text-[0.56vw] text-gray-400">{template.dim}</p>
                             </div>
                         </div>
                     );
                 })}
             </div>

             {/* Right Arrow */}
             <button 
                onClick={scrollRight}
                className="p-[0.375vw] rounded-full hover:bg-gray-100 text-gray-400 z-10"
             >
                 <ChevronRight size="1.25vw" />
             </button>
         </div>

         {/* Page Count Selector */}
         <div className="flex items-center justify-center gap-[0.75vw] mb-[2vw]">
             <span className="text-[0.875vw] font-medium text-gray-900">Number of Pages<span className="text-red-500">*</span> :</span>
             
             <button 
                onClick={() => setPageCount(Math.max(2, pageCount - 2))}
                className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
             >
                 <Minus size="1.25vw" strokeWidth={1.5} />
             </button>
             
             <div className="w-[3vw] h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center justify-center text-[0.875vw] font-bold text-gray-900 bg-white overflow-hidden">
                 <input 
                    type="number"
                    value={pageCount}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 2;
                        if (val > 12) val = 12;
                        if (val < 2) val = 2;
                        if (val % 2 !== 0) val = val + 1;
                        if (val > 12) val = 12; 
                        setPageCount(val);
                    }}
                    className="w-full h-full text-center focus:outline-none bg-transparent"
                 />
             </div>

             <button 
                onClick={() => setPageCount(Math.min(12, pageCount + 2))}
                className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
             >
                 <Plus size="1.25vw" strokeWidth={1.5} />
             </button>
         </div>

         {/* Create Button */}
         <div className="flex justify-center mt-auto">
            <button 
                onClick={handleCreateFromTemplate}
                className="px-[4vw] py-[0.6vw] bg-[#6366f1] text-white rounded-[0.75vw] font-medium text-[1.125vw] hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
            >
                Create
            </button>
         </div>

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-[1vw]">
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      ></div>

      {/* The Container */}
      <div className={`relative z-10 w-full transform transition-all animate-in fade-in zoom-in-95 duration-200 ${view === 'template' ? 'max-w-[60vw]' : 'max-w-[36vw]'}`}>
        
        {view === 'selection' && (
             <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.5vw] p-[1.25vw] md:p-[1.5vw] shadow-2xl">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-[0.75vw] right-[0.75vw] text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-[0.375vw] z-50" 
                >
                    <X size="1vw" />
                </button>
                {renderSelectionView()}
             </div>
        )}
        
        {view === 'upload' && renderUploadView()}
        
        {view === 'template' && renderTemplateView()}

      </div>
    </div>
  );
};

export default CreateFlipbookModal;
