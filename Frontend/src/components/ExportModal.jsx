import React, { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';

// Export Modal Component
const ExportModal = ({ isOpen, onClose, totalPages, currentPage, onExport }) => {
  const [exportType, setExportType] = useState('current'); // current, all, custom
  const [selectedPages, setSelectedPages] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null); // 'jpg', 'png', 'pdf'

  useEffect(() => {
    if (isOpen) {
      if (exportType === 'custom' && selectedPages.length === 0) {
        // Default to no pages or all pages? Screenshot implies user selects.
        // Let's default to empty or just let them select.
        // Actually, logic from previous code:
         // setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
         // Let's keep it empty or pre-select none to encourage explicit selection as per screenshot checkboxes
         // But usually "Custom" implies you want to pick.
      }
    }
  }, [isOpen, exportType, totalPages]);

  if (!isOpen) return null;

  const handleExport = async (format) => {
    setIsExporting(true);
    setExportingFormat(format);
    
    let pagesToExport = [];
    
    if (exportType === 'current') {
      pagesToExport = [currentPage]; // Use currentPage passed from props
    } else if (exportType === 'all') {
      pagesToExport = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Custom
      pagesToExport = selectedPages.sort((a, b) => a - b);
    }

    try {
        await onExport(pagesToExport, format);
    } catch (error) {
        console.error("Export failed:", error);
    } finally {
        setIsExporting(false);
        setExportingFormat(null);
        if (onClose) onClose(); // Optional: Close on success? User might want to stay. 
        // Usually modals close on success.
    }
  };

  const togglePage = (pageNum) => {
    if (selectedPages.includes(pageNum)) {
      setSelectedPages(selectedPages.filter(p => p !== pageNum));
    } else {
      setSelectedPages([...selectedPages, pageNum]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-[1vw] text-left font-sans">
      <div className="bg-[#f9fafb] rounded-[1vw] shadow-2xl w-full max-w-[25vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-[1.5vw] pb-[0.5vw]">
          <h2 className="text-[1.2vw] font-bold text-gray-900">Export File</h2>
          <button onClick={onClose} className="p-[0.3vw] hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size="1.5vw" />
          </button>
        </div>

        {/* Separator Line */}
        <div className="px-[1.5vw]">
            <div className="h-[0.1vw] bg-gray-200 w-full mb-[1.5vw]"></div>
        </div>
        
        <div className="px-[1.5vw] flex-1 overflow-y-auto custom-scrollbar">
          
          <p className="text-[0.8vw] font-medium text-gray-600 mb-[1vw]">
             Select the Export type <span className="text-red-500">*</span>
          </p>

          <div className="space-y-[1vw] mb-[1.5vw]">
            {/* Export Current Pages */}
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
              <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="exportType" 
                    value="current" 
                    checked={exportType === 'current'}
                    onChange={(e) => setExportType(e.target.value)}
                    className="peer appearance-none w-[1.2vw] h-[1.2vw] border-[0.1vw] border-gray-400 rounded-full checked:border-[#6366f1] checked:border-[0.4vw] transition-all"
                  />
              </div>
              <span className="text-gray-700 font-medium text-[0.85vw] group-hover:text-gray-900">Export Current Pages</span>
            </label>

            {/* Export Entire Pages */}
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
               <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="exportType" 
                    value="all" 
                    checked={exportType === 'all'}
                    onChange={(e) => setExportType(e.target.value)}
                    className="peer appearance-none w-[1.2vw] h-[1.2vw] border-[0.1vw] border-gray-400 rounded-full checked:border-[#6366f1] checked:border-[0.4vw] transition-all"
                  />
              </div>
              <span className="text-gray-700 font-medium text-[0.85vw] group-hover:text-gray-900">Export Entire Pages</span>
            </label>

            {/* Export Custom Selection Pages */}
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
               <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="exportType" 
                    value="custom" 
                    checked={exportType === 'custom'}
                    onChange={(e) => setExportType(e.target.value)}
                    className="peer appearance-none w-[1.2vw] h-[1.2vw] border-[0.1vw] border-gray-400 rounded-full checked:border-[#6366f1] checked:border-[0.4vw] transition-all"
                  />
              </div>
              <span className="text-gray-700 font-medium text-[0.85vw] group-hover:text-gray-900">Export Custom Selection Pages</span>
            </label>
          </div>

          {/* Custom Selection List */}
          {exportType === 'custom' && (
            <div className="bg-white border border-gray-200 rounded-[0.5vw] shadow-sm overflow-hidden mb-[1.5vw] animate-in slide-in-from-top-2 duration-200">
              <div className="px-[1vw] py-[0.8vw] border-b border-gray-100">
                  <span className="font-bold text-gray-800 text-[0.75vw]">Select Pages</span>
              </div>
              <div className="max-h-[12vw] overflow-y-auto p-[0.5vw] custom-scrollbar">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <label 
                        key={pageNum}
                        className="flex items-center gap-[0.8vw] px-[0.8vw] py-[0.5vw] hover:bg-gray-50 rounded-[0.4vw] cursor-pointer transition-all"
                    >
                         <div className="relative flex items-center justify-center">
                              <input 
                                type="checkbox"
                                checked={selectedPages.includes(pageNum)}
                                onChange={() => togglePage(pageNum)}
                                className="peer appearance-none w-[1vw] h-[1vw] border-[0.1vw] border-gray-300 rounded checked:bg-[#6366f1] checked:border-[#6366f1] transition-all"
                              />
                              <Check className="w-[0.7vw] h-[0.7vw] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                         </div>
                         <span className={`text-[0.75vw] ${selectedPages.includes(pageNum) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                             Page {pageNum}
                         </span>
                    </label>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Area - Buttons */}
        <div className="p-[1.5vw] pt-0 flex flex-col gap-[0.8vw]">
            <button 
                onClick={() => handleExport('jpg')}
                disabled={isExporting}
                className="w-full py-[0.8vw] bg-black text-white rounded-[0.6vw] font-bold text-[0.85vw] tracking-wide shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-[0.5vw]"
            >
                {isExporting && exportingFormat === 'jpg' ? <Loader2 size="1vw" className="animate-spin" /> : null}
                JPG
            </button>
            <button 
                onClick={() => handleExport('png')}
                disabled={isExporting}
                className="w-full py-[0.8vw] bg-black text-white rounded-[0.6vw] font-bold text-[0.85vw] tracking-wide shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-[0.5vw]"
            >
                {isExporting && exportingFormat === 'png' ? <Loader2 size="1vw" className="animate-spin" /> : null}
                PNG
            </button>
            <button 
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="w-full py-[0.8vw] bg-black text-white rounded-[0.6vw] font-bold text-[0.85vw] tracking-wide shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-[0.5vw]"
            >
                {isExporting && exportingFormat === 'pdf' ? <Loader2 size="1vw" className="animate-spin" /> : null}
                PDF
            </button>
        </div>
      </div>
    </div>
  );
};

// Start of Check Icon (Custom small component if lucide's Check is too big or behaves weirdly in checkbox context, 
// though standard Lucide Check is fine. I'll import it above.)
import { Check as CheckIcon } from 'lucide-react'; // Renaming just in case, but 'Check' is already imported.

export default ExportModal;
