import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import AlertModal from '../../AlertModal';

export default function AddModelModal({ isOpen, onClose, onAdd }) {
    const [isDragging, setIsDragging] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });


    const validExtensions = ['step', 'stp', 'obj', 'fbx', 'glb', 'gltf', 'stl'];

    if (!isOpen) return null;

    const handleFile = (file) => {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            setErrorModal({
                isOpen: true,
                message: `The file format ".${ext}" is not supported. Please upload one of the following: ${validExtensions.join(', ').toUpperCase()}`
            });
            return;
        }

        onAdd(file);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[0.1vw] animate-in fade-in duration-200">
            <div className="bg-white rounded-[1.2vw] w-[27vw] shadow-[0_1.5vw_4vw_-2vw_rgba(0,0,0,0.15)] p-[1.5vw] relative animate-in zoom-in-95 duration-200 border border-white">
                
                {/* Header */}
                <div className="flex items-center gap-[0.6vw] mb-[0.1vw]">
                    <h2 className="text-[1.2vw] font-bold text-gray-900 whitespace-nowrap tracking-tight">Add 3D Model</h2>
                    <div className="h-[0.05vw] flex-1 bg-gray-200 mt-[0.4vw]"></div>
                    <button 
                        onClick={onClose}
                        className="p-[0.35vw] border-[0.1vw] border-red-500 rounded-[0.6vw] text-red-500 hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                        <Icon icon="heroicons:x-mark" width="1vw" height="1vw" />
                    </button>
                </div>

                {/* Subtitle */}
                <div className="flex items-center gap-[0.2vw] mb-[1.5vw]">
                    <span className="text-red-500 text-[0.9vw] font-bold mt-[0.1vw]">*</span>
                    <p className="text-[0.75vw] font-medium text-gray-400">
                        You Can Add New Model To The Existing 3d Model
                    </p>
                </div>

                {/* Upload Area */}
                <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        handleFile(file);
                    }}
                    className={`border-[0.1vw] border-dashed rounded-[1vw] p-[2.5vw] flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                        isDragging ? 'border-[#5d5efc] bg-[#5d5efc]/5' : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50/50'
                    }`}
                    onClick={() => document.getElementById('add-model-input').click()}
                >
                    <input 
                        type="file" 
                        id="add-model-input" 
                        className="hidden" 
                        onChange={(e) => handleFile(e.target.files[0])}
                        accept=".step,.obj,.fbx,.glb,.gltf"
                    />
                    
                    <div className="text-[0.9vw] font-semibold text-gray-500 tracking-tight transition-colors mb-[1.2vw]">
                        Drag & Drop or <span className="text-[#5d5efc] font-bold">Upload</span>
                    </div>

                    <div className="mb-[1.5vw]">
                        <Icon icon="solar:upload-linear" width="3vw" height="3vw" className="text-gray-400" />
                    </div>

                    <div className="text-[0.6vw] text-gray-400 font-medium tracking-wide">
                        Supported File : <span className="uppercase text-gray-500 font-semibold">{validExtensions.join(', ')}</span>
                    </div>
                </div>

                <AlertModal
                    isOpen={errorModal.isOpen}
                    onClose={() => setErrorModal({ isOpen: false, message: '' })}
                    type="error"
                    title="Invalid File Format"
                    message={errorModal.message}
                    confirmText="Got it"
                />

            </div>
        </div>
    );
}
