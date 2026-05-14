import React, { useState } from 'react';
import { X, Link as LinkIcon, Copy, QrCode, Download, Share2, Mail, Instagram, Edit3, ArrowRight } from 'lucide-react';
import { Icon } from '@iconify/react';

const ShareModal = ({ isOpen, onClose, flipbookUrl, flipbookThumbnail }) => {
    const [addCover, setAddCover] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(flipbookUrl || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
                onClick={onClose}
            />
            
            {/* Modal Container */}
            <div className="relative bg-white rounded-[1.2vw] shadow-2xl w-[60vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-[1.5vw] py-[1.2vw] flex items-center gap-[1vw]">
                    <h2 className="text-[1.4vw] font-bold text-gray-900 whitespace-nowrap">Share Flipbook</h2>
                    <div className="flex-1 h-[1px] bg-gray-200" />
                    <button 
                        onClick={onClose}
                        className="p-[0.4vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500"
                    >
                        <X size="1.2vw" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-[2vw] pb-[2.5vw] flex gap-[2.5vw]">
                    {/* Left Column: Preview */}
                    <div className="flex-[1.1] flex flex-col">
                        <div className="relative rounded-[1vw] overflow-hidden shadow-lg aspect-[4/3] bg-gray-100 border border-gray-100">
                            <img 
                                src={flipbookThumbnail || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80"} 
                                alt="Flipbook Preview"
                                className="w-full h-full object-cover"
                            />
                            {/* Footer Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#3d3331]/80 backdrop-blur-sm py-[0.8vw] px-[1vw] flex items-center justify-center gap-[0.8vw]">
                                <span className="text-white text-[0.85vw] font-medium opacity-90">
                                    Add Cover picture while sharing the flipbook
                                </span>
                                <div 
                                    className={`w-[1.1vw] h-[1.1vw] rounded-[0.2vw] border-[0.12vw] border-white/50 flex items-center justify-center cursor-pointer transition-all ${addCover ? 'bg-white border-white' : 'hover:border-white'}`}
                                    onClick={() => setAddCover(!addCover)}
                                >
                                    {addCover && <Icon icon="lucide:check" className="text-[#3d3331] w-[0.8vw] h-[0.8vw]" strokeWidth={4} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Share Options */}
                    <div className="flex-1 flex flex-col gap-[1.5vw]">
                        {/* Flipbook Link */}
                        <div className="flex flex-col gap-[0.8vw]">
                            <div className="flex items-center gap-[0.8vw]">
                                <h3 className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap uppercase tracking-wide">Flipbook Link</h3>
                                <div className="flex-1 h-[1px] bg-gray-100" />
                            </div>
                            <div className="flex items-center gap-[0.6vw]">
                                <div className="flex-1 flex items-center gap-[0.6vw] bg-white border border-gray-300 rounded-[0.6vw] px-[0.8vw] py-[0.5vw] shadow-sm">
                                    <LinkIcon size="1vw" className="text-gray-400" />
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={flipbookUrl || "https://fisto.in/flipbook/share/2674081"}
                                        className="flex-1 bg-transparent border-none outline-none text-[0.8vw] font-medium text-gray-600 truncate"
                                    />
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className={`flex items-center gap-[0.4vw] px-[1.2vw] py-[0.55vw] rounded-[0.6vw] transition-all active:scale-95 shadow-lg ${copied ? 'bg-green-500 text-white' : 'bg-[#4A3AFF] text-white hover:bg-blue-700'}`}
                                >
                                    <Icon icon={copied ? "lucide:check" : "lucide:copy"} className="w-[1vw] h-[1vw]" />
                                    <span className="text-[0.8vw] font-bold">{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Share QR */}
                        <div className="flex flex-col gap-[0.8vw]">
                            <div className="flex items-center gap-[0.8vw]">
                                <h3 className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap uppercase tracking-wide">Share QR</h3>
                                <div className="flex-1 h-[1px] bg-gray-100" />
                            </div>
                            <div className="flex items-center gap-[1.5vw]">
                                <div className="relative w-[5.5vw] h-[5.5vw] bg-gray-100 rounded-[0.4vw] overflow-hidden border border-gray-200 group cursor-pointer shadow-sm">
                                    <img 
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://fisto.in" 
                                        alt="QR Code" 
                                        className="w-full h-full p-[0.4vw]"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 size="1vw" className="text-white" />
                                        <span className="text-white text-[0.6vw] font-bold mt-[0.1vw]">Edit</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-[0.5vw] text-gray-400 group cursor-pointer hover:text-gray-600 transition-colors">
                                    <Icon icon="lucide:corner-up-right" className="w-[1.2vw] h-[1.2vw]" />
                                    <span className="text-[0.85vw] font-bold underline underline-offset-4 decoration-gray-300">Download QR Code</span>
                                </div>
                            </div>
                        </div>

                        {/* Share Through */}
                        <div className="flex flex-col gap-[1vw]">
                            <div className="flex items-center gap-[0.8vw]">
                                <h3 className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap uppercase tracking-wide">Share Through</h3>
                                <div className="flex-1 h-[1px] bg-gray-100" />
                            </div>
                            <div className="flex items-center gap-[0.8vw]">
                                {/* Embed */}
                                <div className="w-[3.2vw] h-[3.2vw] rounded-[0.6vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm group">
                                    <Icon icon="lucide:code-2" className="w-[1.4vw] h-[1.4vw] text-gray-600 group-hover:scale-110 transition-transform" />
                                </div>
                                {/* WhatsApp */}
                                <div className="w-[3.2vw] h-[3.2vw] rounded-[0.6vw] bg-[#25D366] flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md">
                                    <Icon icon="ic:baseline-whatsapp" className="w-[1.8vw] h-[1.8vw] text-white" />
                                </div>
                                {/* X */}
                                <div className="w-[3.2vw] h-[3.2vw] rounded-[0.6vw] bg-black flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md">
                                    <Icon icon="ri:twitter-x-fill" className="w-[1.6vw] h-[1.6vw] text-white" />
                                </div>
                                {/* Gmail */}
                                <div className="w-[3.2vw] h-[3.2vw] rounded-[0.6vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                                    <Icon icon="logos:google-gmail" className="w-[1.6vw] h-[1.6vw]" />
                                </div>
                                {/* Drive */}
                                <div className="w-[3.2vw] h-[3.2vw] rounded-[0.6vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                                    <Icon icon="logos:google-drive" className="w-[1.6vw] h-[1.6vw]" />
                                </div>
                                {/* Instagram */}
                                <div className="w-[3.2vw] h-[3.2vw] rounded-[0.6vw] bg-gradient-to-tr from-[#FFDC80] via-[#F77737] via-[#E1306C] via-[#C13584] to-[#833AB4] flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md">
                                    <Icon icon="ri:instagram-line" className="w-[1.8vw] h-[1.8vw] text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
