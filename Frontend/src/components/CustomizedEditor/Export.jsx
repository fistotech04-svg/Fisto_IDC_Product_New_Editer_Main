import React, { useState, useEffect } from 'react';
import { Download, X, Loader2, Check } from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

// Export Component handling Button + Popup + Download Logic
const Export = ({
    isOpen,
    onClose,
    hideButton = false,
    pages = [],
    bookName = "Flipbook",
    currentPage = 1,
    isThreedEditor = false,
    isMobile = false,
    isLandscape = false,
    isTablet = false
}) => {
    // Internal state for popup visibility if not controlled externally
    const [internalShow, setInternalShow] = useState(false);

    // Derived visibility: External 'isOpen' takes precedence if defined
    const show = isOpen !== undefined ? isOpen : internalShow;

    const handleOpen = () => {
        if (!isThreedEditor) {
            setInternalShow(true);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setInternalShow(false);
        }
    };

    // --- Popup State ---
    const [exportType, setExportType] = useState('current'); // current, all, custom
    const [selectedPages, setSelectedPages] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportingFormat, setExportingFormat] = useState(null); // 'jpg', 'png', 'pdf'

    // Reset selections when opening
    useEffect(() => {
        if (show) {
            // Optional: reset or keep state? ExportModal kept state.
            // keeping state for now.
        }
    }, [show]);

    const totalPages = pages.length;

    const togglePage = (pageNum) => {
        if (selectedPages.includes(pageNum)) {
            setSelectedPages(selectedPages.filter(p => p !== pageNum));
        } else {
            setSelectedPages([...selectedPages, pageNum]);
        }
    };

    // --- Download Logic (Ported from MainEditor.jsx) ---
    const handleDownloadPages = async (pagesToExport, format = 'png') => {
        try {
            const PAGE_WIDTH = 595;
            const PAGE_HEIGHT = 842;

            // Helper to sanitize filenames
            const sanitizeName = (name) => (name || 'Untitled').replace(/[^a-z0-9 _-]/gi, '_').replace(/\s+/g, '_');
            const bookNameClean = sanitizeName(bookName) || 'Flipbook';

            // Helper to render page to canvas
            const renderPageToCanvas = async (html, scale = 4) => {
                const hiddenFrame = document.createElement('iframe');
                hiddenFrame.style.width = `${PAGE_WIDTH}px`;
                hiddenFrame.style.height = `${PAGE_HEIGHT}px`;
                hiddenFrame.style.position = 'fixed';
                hiddenFrame.style.top = '0';
                hiddenFrame.style.left = '0';
                hiddenFrame.style.zIndex = '-9999';
                hiddenFrame.style.border = 'none';
                document.body.appendChild(hiddenFrame);

                const doc = hiddenFrame.contentDocument;
                if (!doc) throw new Error("Could not create iframe document");

                doc.write(html);
                doc.close();

                // Inject styles
                const style = doc.createElement('style');
                style.innerHTML = `
                    html, body {
                        width: 595px !important;
                        height: 842px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: white !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                `;

                if (doc.head) doc.head.appendChild(style);
                else if (doc.body) doc.body.appendChild(style);
                else {
                    const head = doc.createElement('head');
                    doc.documentElement.appendChild(head);
                    head.appendChild(style);
                }

                // Wait for images/content to load
                await new Promise(resolve => setTimeout(resolve, 1500));

                const canvas = await html2canvas(doc.documentElement, {
                    scale: scale,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                    x: 0,
                    y: 0,
                    backgroundColor: '#ffffff'
                });

                document.body.removeChild(hiddenFrame);
                return canvas;
            };

            if (format === 'pdf') {
                const pdf = new jsPDF('p', 'pt', [PAGE_WIDTH, PAGE_HEIGHT]);

                for (let i = 0; i < pagesToExport.length; i++) {
                    const pageNum = pagesToExport[i];
                    const page = pages.find((p, idx) => (idx + 1) === pageNum);
                    const pageHTML = page?.html || page?.content || '';

                    const canvas = await renderPageToCanvas(pageHTML, 4);
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);

                    if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
                }

                pdf.save(`${bookNameClean}.pdf`);

            } else {
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const ext = format === 'jpg' ? 'jpg' : 'png';

                if (pagesToExport.length === 1) {
                    const pageNum = pagesToExport[0];
                    const page = pages.find((p, i) => (i + 1) === pageNum);
                    const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);

                    const canvas = await renderPageToCanvas(page?.html || page?.content || '', 4);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            saveAs(blob, `${bookNameClean}_${pageNameClean}.${ext}`);
                        } else {
                            throw new Error("Failed to generate image blob");
                        }
                    }, mimeType);

                } else {
                    const zip = new JSZip();

                    for (const pageNum of pagesToExport) {
                        const page = pages.find((p, i) => (i + 1) === pageNum);
                        const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);

                        const canvas = await renderPageToCanvas(page?.html || page?.content || '', 4);

                        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType));
                        if (blob) {
                            zip.file(`${pageNameClean}.${ext}`, blob);
                        }
                    }

                    const content = await zip.generateAsync({ type: 'blob' });
                    saveAs(content, `${bookNameClean}.zip`);
                }
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. See console for details.");
        }
    };

    const handleExportClick = async (format) => {
        setIsExporting(true);
        setExportingFormat(format);

        let pagesToExport = [];

        if (exportType === 'current') {
            pagesToExport = [currentPage + 1]; // currentPage is 0-indexed usually in PreviewArea, adjust if needed
            // Wait, PreviewArea passes currentPage (0-indexed). Logic below expects 1-based page numbers?
            // "const page = pages.find((p, idx) => (idx + 1) === pageNum);"
            // So if currentPage is 0, pageNum should be 1.
        } else if (exportType === 'all') {
            pagesToExport = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // Custom
            pagesToExport = selectedPages.sort((a, b) => a - b);
        }

        try {
            await handleDownloadPages(pagesToExport, format);
        } catch (error) {
            console.error("Export process error:", error);
        } finally {
            setIsExporting(false);
            setExportingFormat(null);
            handleClose();
        }
    };


    return (
        <>
            {/* Export Button (Optional, can be hidden) */}
            {!hideButton && (
                <button
                    onClick={handleOpen}
                    disabled={isThreedEditor}
                    className={`bg-black text-white rounded-lg flex items-center justify-center transition-colors px-5 py-2.5 ml-1 ${isThreedEditor
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : 'hover:bg-gray-800'
                        }`}
                    style={{ gap: '0.5rem' }}
                >
                    <Download size={18} />
                    <span className="font-medium text-sm">Export</span>
                </button>
            )}

            {/* Export Modal UI */}
            {show && (
                <div 
                    className={`absolute inset-0 z-[5000] flex items-center justify-center p-4 font-sans bg-transparent`} 
                    onClick={handleClose}
                >
                    <div 
                        className={`
                            ${isMobile 
                                ? `bg-[#f9fafb] ${isLandscape ? 'w-full p-2' : 'w-[95%] max-w-[360px] p-5'} rounded-2xl shadow-2xl border border-gray-200` 
                                : `bg-[#f9fafb] ${isTablet ? 'rounded-[0.8vw] w-[15vw]' : 'rounded-[1vw] w-[22vw]'} shadow-2xl border border-white/20`
                            }
                            flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200
                        `} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between ${isMobile ? (isLandscape ? 'mb-2' : 'mb-4') : (isTablet ? 'p-[1vw] pb-[0.4vw]' : 'p-[1.2vw] pb-[0.5vw]')}`}>
                            <h2 className={`${isMobile ? (isLandscape ? 'text-[14px]' : 'text-[17px]') : (isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]')} font-bold text-gray-900`}>
                                {isMobile ? 'Download File' : 'Export File'}
                            </h2>
                            <button 
                                onClick={handleClose} 
                                className={`rounded-full transition-colors flex items-center justify-center ${isMobile ? (isLandscape ? 'w-6 h-6 bg-gray-100' : 'w-8 h-8 bg-gray-100') + ' hover:bg-gray-200 text-gray-500' : 'p-[0.2vw] hover:bg-gray-200 text-gray-500'}`}
                            >
                                <X className={isMobile ? (isLandscape ? 'w-3 h-3' : 'w-4 h-4') : (isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]')} />
                            </button>
                        </div>

                        {!isMobile && (
                            <div className={isTablet ? 'px-[1vw]' : 'px-[1.2vw]'}>
                                <div className={`h-px bg-gray-200 w-full ${isTablet ? 'mb-[0.8vw]' : 'mb-[1vw]'}`}></div>
                            </div>
                        )}

                        <div className={`${isMobile ? (isLandscape ? 'mb-2' : 'mb-6') : (isTablet ? 'px-[1vw]' : 'px-[1.2vw]') + ' flex-1 overflow-y-auto custom-scrollbar'}`}>
                            <p className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[13px]') : (isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]')} font-medium text-gray-600 mb-2`}>
                                Select the Export type <span className="text-red-500">*</span>
                            </p>

                            <div className={`${isMobile ? (isLandscape ? 'space-y-1.5' : 'space-y-3') : (isTablet ? 'space-y-[0.6vw] mb-[1vw]' : 'space-y-[0.8vw] mb-[1.2vw]')}`}>
                                {[
                                    { id: 'current', label: 'Export Current Pages' },
                                    { id: 'all', label: 'Export Entire Pages' },
                                    { id: 'custom', label: 'Export Custom Selection Pages' }
                                ].map((option) => (
                                    <label key={option.id} className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name="exportType"
                                                value={option.id}
                                                checked={exportType === option.id}
                                                onChange={(e) => setExportType(e.target.value)}
                                                className={`peer appearance-none border-gray-400 rounded-full transition-all ${isMobile ? (isLandscape ? 'w-3 h-3 border-[1.5px] checked:border-[3px]' : 'w-4 h-4 border-[1.5px] checked:border-[4px]') + ' checked:border-[#6366f1]' : (isTablet ? 'w-[0.9vw] h-[0.9vw] border-[1.5px] border-gray-400 checked:border-[#6366f1] checked:border-[3px]' : 'w-[1.1vw] h-[1.1vw] border-[1.5px] border-gray-400 checked:border-[#6366f1] checked:border-[4px]')}`}
                                            />
                                        </div>
                                        <span className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[14px]') : (isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]')} font-medium text-gray-700`}>{option.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Custom Selection List */}
                            {exportType === 'custom' && (
                                <div className={`border mt-3 animate-in slide-in-from-top-2 duration-200 ${isMobile ? 'bg-white border-gray-200 rounded-xl overflow-hidden mb-2 shadow-sm' : `bg-white border-gray-200 ${isTablet ? 'rounded-[0.4vw] mb-[0.8vw]' : 'rounded-[0.5vw] mb-[1vw]'} shadow-sm overflow-hidden`}`}>
                                    <div className={`${isMobile ? 'px-3 py-2 border-b border-gray-100' : (isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1vw] py-[0.6vw]') + ' border-b border-gray-100'}`}>
                                        <span className={`${isMobile ? 'text-gray-800 text-[12px]' : (isTablet ? 'text-gray-800 text-[0.6vw]' : 'text-gray-800 text-[0.75vw]')} font-semibold`}>Select Pages</span>
                                    </div>
                                    <div className={`${isMobile ? 'max-h-[140px] p-2' : (isTablet ? 'max-h-[7.5vw] p-[0.3vw]' : 'max-h-[9vw] p-[0.4vw]')} overflow-y-auto custom-scrollbar`}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                            <label
                                                key={pageNum}
                                                className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPages.includes(pageNum)}
                                                        onChange={() => togglePage(pageNum)}
                                                        className={`peer appearance-none border-gray-300 rounded-[4px] transition-all ${isMobile ? 'w-4 h-4 border-[1.5px] checked:bg-[#6366f1] checked:border-[#6366f1]' : (isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]') + ' border-[1.5px] checked:bg-[#6366f1] border-gray-300'}`}
                                                    />
                                                    <Check className={`${isMobile ? 'w-3 h-3 text-white' : (isTablet ? 'w-[0.6vw] h-[0.6vw]' : 'w-[0.7vw] h-[0.7vw]') + ' text-white'} absolute opacity-0 peer-checked:opacity-100 pointer-events-none`} strokeWidth={3} />
                                                </div>
                                                <span className={`${isMobile ? 'text-gray-900 text-[13px]' : (isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]')} ${selectedPages.includes(pageNum) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                    Page {pageNum}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Area - Buttons */}
                        <div className={`${isMobile ? (isLandscape ? 'grid grid-cols-2 gap-2 mt-1' : 'flex flex-col gap-3') : (isTablet ? 'p-[1vw] pt-0 flex flex-col gap-[0.5vw]' : 'p-[1.2vw] pt-0 flex flex-col gap-[0.6vw]')}`}>
                            {['jpg', 'png', 'pdf'].map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => handleExportClick(fmt)}
                                    disabled={isExporting}
                                    className={`
                                        w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50
                                        ${isMobile 
                                            ? (isLandscape ? 'py-1.5' : 'py-2.5') + ' bg-black text-white rounded-xl font-bold ' + (isLandscape ? 'text-[11px]' : 'text-[14px]') + ' shadow-sm hover:bg-gray-900' 
                                            : (isTablet ? 'py-[0.5vw] bg-black text-white rounded-[0.3vw] font-semibold text-[0.7vw] tracking-wide shadow-lg hover:bg-gray-900' : 'py-[0.6vw] bg-black text-white rounded-[0.4vw] font-semibold text-[0.8vw] tracking-wide shadow-lg hover:bg-gray-900')
                                        }
                                        ${isLandscape && fmt === 'pdf' ? 'col-span-2' : ''}
                                    `}
                                >
                                    {isExporting && exportingFormat === fmt ? <Loader2 className={isMobile ? (isLandscape ? 'w-3 h-3 animate-spin' : 'w-4 h-4 animate-spin') : (isTablet ? 'w-[0.8vw] h-[0.8vw] animate-spin' : 'w-[1vw] h-[1vw] animate-spin')} /> : null}
                                    {fmt.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Export;
