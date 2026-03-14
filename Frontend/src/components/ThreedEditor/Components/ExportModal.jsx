import React, { useState } from 'react';
import { Icon } from '@iconify/react';

export default function ExportModal({ onClose, onExport }) {
    const [selectedFormat, setSelectedFormat] = useState('glb');
    const formats = [
        { id: 'glb', label: 'GLB', desc: 'Binary GLTF (Recommended)', icon: 'tabler:box-model-2' },
        { id: 'obj', label: 'OBJ', desc: 'Wavefront Object', icon: 'tabler:box-model' },
        { id: 'stl', label: 'STL', desc: 'Stereolithography', icon: 'tabler:printer' },
    ];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[0.1vw] animate-in fade-in duration-200">
            <div className="bg-white rounded-[1vw] w-[21vw] shadow-[0_2vw_5vw_-1vw_rgba(0,0,0,0.1)] p-[1.25vw] relative animate-in zoom-in-95 duration-200">
                 {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-[0.8vw] right-[0.8vw] p-[0.4vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
                >
                    <Icon icon="heroicons:x-mark" width="1.1vw" height="1.1vw" />
                </button>

                <h2 className="text-[1.1vw] font-bold text-gray-900 mb-[0.1vw]">Export 3D Model</h2>
                <p className="text-[0.73vw] text-gray-400 font-medium mb-[1.2vw]">Choose a format for your target platform.</p>

                <div className="space-y-[0.6vw] mb-[1.6vw]">
                    {formats.map((fmt) => (
                        <div 
                            key={fmt.id}
                            onClick={() => !fmt.disabled && setSelectedFormat(fmt.id)}
                            className={`flex items-center p-[0.65vw] rounded-[0.8vw] border-[0.1vw] transition-all cursor-pointer group select-none ${
                                fmt.disabled ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' : 
                                selectedFormat === fmt.id 
                                    ? 'border-[#5d5efc] bg-[#5d5efc]/5 shadow-sm' 
                                    : 'border-gray-200 hover:border-[#5d5efc]/60 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`w-[2vw] h-[2vw] rounded-[0.5vw] flex items-center justify-center shrink-0 mr-[0.8vw] ${
                                selectedFormat === fmt.id ? 'bg-[#5d5efc] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                            }`}>
                                <Icon icon={fmt.icon} width="1.2vw" height="1.2vw" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-[0.75vw] ${selectedFormat === fmt.id ? 'text-[#5d5efc]' : 'text-gray-800'}`}>
                                    {fmt.label}
                                </div>
                                <div className="text-[0.6vw] text-gray-400 truncate">{fmt.desc}</div>
                            </div>
                            
                            <div className={`w-[1vw] h-[1vw] rounded-full border-[0.1vw] flex items-center justify-center ${
                                selectedFormat === fmt.id ? 'border-[#5d5efc] bg-[#5d5efc]' : 'border-gray-300'
                            }`}>
                                {selectedFormat === fmt.id && <Icon icon="heroicons:check" width="0.6vw" height="0.6vw" className="text-white" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-[0.6vw]">
                    <button 
                        onClick={onClose}
                        className="flex-1 cursor-pointer py-[0.8vw] text-[0.75vw] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-[0.8vw] transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            onExport(selectedFormat);
                            onClose();
                        }}
                        className="flex-1 cursor-pointer py-[0.8vw] text-[0.75vw] font-semibold text-white bg-[#5d5efc] hover:bg-[#4d4eec] rounded-[0.8vw] transition-all shadow-lg shadow-[#5d5efc]/20 active:scale-95"
                    >
                        Export Model
                    </button>
                </div>
            </div>
        </div>
    );
}
