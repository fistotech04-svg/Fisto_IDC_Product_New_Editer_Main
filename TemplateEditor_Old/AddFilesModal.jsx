import React, { useState, useRef } from 'react';
import { X, Upload, FileType } from 'lucide-react';

const AddFilesModal = ({ isOpen, onClose, onUpload, isLoading }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onUpload && onUpload(files);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onUpload && onUpload(files);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {isLoading ? (
                <></>
            ) : (
                <div
                    className="bg-white rounded-[1.5vw] w-full max-w-[25vw] p-[1.5vw] shadow-2xl relative animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-[0.5vw]">
                        <div className="flex items-center gap-[0.8vw] flex-1">
                            <h3 className="text-[1.1vw] font-bold text-[#1e234a]">Upload Files to the Book</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        {/* Close Button Styled like screenshot */}
                        <button
                            onClick={onClose}
                            className="ml-[0.8vw] p-[0.3vw] rounded-full border border-red-200 cursor-pointer bg-white hover:bg-red-50 transition-colors group"
                        >
                            <X size="1.2vw" className="text-red-500 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Subtitle */}
                    <p className="text-[0.6vw] font-medium mb-[1vw]">
                        <span className="text-red-500 font-bold">*</span>
                        <span className="text-gray-400 font-normal ml-[0.2vw]">You Can Add Files To The Entire Page</span>
                    </p>

                    {/* Drag and Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            w-full py-[2.5vw] border-[0.15vw] border-dashed rounded-[1.2vw] 
                            flex flex-col items-center justify-center cursor-pointer transition-all
                            ${isDragging
                                ? 'border-[#6C63FF] bg-[#6C63FF]/5 scale-[0.99]'
                                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }
                        `}
                    >
                        <Upload size="2.5vw" className="text-gray-300 mb-[0.8vw]" />

                        <p className="text-[0.85vw] font-medium text-gray-700 mb-[0.2vw]">
                            Drag & Drop or <span className="text-[#6C63FF] hover:underline">Upload</span>
                        </p>

                        <p className="text-[0.6vw] text-gray-400 mt-[0.8vw] uppercase tracking-wider font-semibold">
                            Supported File : <span className="text-gray-500">PDF, JPG, PNG, JPEG</span>
                        </p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,image/jpeg,image/png,image/jpg"
                        />
                    </div>
                </div>
            )}
        </div >
    );
};

export default AddFilesModal;
