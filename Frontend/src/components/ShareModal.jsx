import React, { useState } from 'react';
import { X, Link as LinkIcon, Copy, QrCode, Download, Share2, Mail, Instagram, Edit3, ArrowRight, ChevronRight, ChevronLeft, Check, Sliders, Upload, ChevronDown } from 'lucide-react';
import { Icon } from '@iconify/react';

const ShareModal = ({ isOpen, onClose, flipbookUrl, flipbookThumbnail, currentBook }) => {
    const [addCover, setAddCover] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditingQR, setIsEditingQR] = useState(false);
    const [activeQRTab, setActiveQRTab] = useState('templates');
    const [exportFormat, setExportFormat] = useState('JPG');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    
    // Customization States
    const [qrColor, setQrColor] = useState('#000000');
    const [qrBgColor, setQrBgColor] = useState('#ffffff');
    const [qrSize, setQrSize] = useState('Medium');
    const [qrBgType, setQrBgType] = useState('Solid');
    const [customBgColor, setCustomBgColor] = useState('#D7D8E8');
    const [showBgTypeDropdown, setShowBgTypeDropdown] = useState(false);
    const [qrBgFit, setQrBgFit] = useState('Fit');
    const [qrBgOpacity, setQrBgOpacity] = useState(100);
    const [showBgFitDropdown, setShowBgFitDropdown] = useState(false);
    const [bgTypeDirection, setBgTypeDirection] = useState('down');
    const [bgFitDirection, setBgFitDirection] = useState('down');

    const toggleBgTypeDropdown = (e) => {
        if (!showBgTypeDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setBgTypeDirection(spaceBelow < 120 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setBgTypeDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowBgTypeDropdown(!showBgTypeDropdown);
    };

    const toggleBgFitDropdown = (e) => {
        if (!showBgFitDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setBgFitDirection(spaceBelow < 120 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setBgFitDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowBgFitDropdown(!showBgFitDropdown);
    };

    if (!isOpen) return null;

    const publicUrl = flipbookUrl || (currentBook ? `${window.location.origin}/share=public/${currentBook.share?.shareId || currentBook.v_id}` : window.location.href);

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareModel = async (platform = 'native') => {
        const shareTitle = currentBook?.flipbookName || 'Check out my flipbook!';
        const shareUrl = publicUrl;
        
        if (platform === 'native' && navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: 'I created a flipbook on Fisto. Take a look!',
                    url: shareUrl
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            let url = '';
            switch(platform) {
                case 'whatsapp':
                    url = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
                    break;
                case 'x':
                    url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'mail':
                    url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent('Check out this flipbook: ' + shareUrl)}`;
                    break;
                case 'drive':
                    // Just copy link for drive
                    handleCopy();
                    return;
                case 'instagram':
                    handleCopy();
                    return;
                default:
                    handleCopy();
                    return;
            }
            if (url) window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
                onClick={onClose}
            />
            
            {/* Modal Container */}
            <div className="relative bg-white w-[52vw] rounded-[1vw] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-[1.2vw] py-[0.8vw] flex items-center gap-[0.8vw] border-b border-gray-50">
                    {!isEditingQR ? (
                        <>
                            <h2 className="text-[1.1vw] font-bold text-gray-900 whitespace-nowrap">Share Flipbook</h2>
                        </>
                    ) : (
                        <div className="flex items-center gap-[0.5vw]">
                            <button 
                                onClick={() => setIsEditingQR(false)}
                                className="text-[1.1vw] font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                Share Flipbook
                            </button>
                            <ChevronRight size="1vw" className="text-gray-300" />
                            <h2 className="text-[1.1vw] font-bold text-gray-800">Edit QR</h2>
                        </div>
                    )}
                    <div className="flex-1 h-[1px] bg-gray-200" />
                    <button 
                        onClick={onClose}
                        className="p-[0.3vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer"
                    >
                        <X size="1vw" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-[1.2vw] pt-[0.8vw] flex flex-col gap-[1.2vw] overflow-hidden">
                    {!isEditingQR ? (
                        <div className="flex gap-[1.5vw]">
                            {/* Left Column: Preview */}
                            <div className="flex-[1.1] flex flex-col">
                                <div className="relative rounded-[1vw] overflow-hidden shadow-lg aspect-square bg-gray-100">
                                    <img 
                                        src={flipbookThumbnail || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80"} 
                                        alt="Flipbook Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Footer Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-[#3d3331]/80 backdrop-blur-sm py-[0.6vw] px-[0.8vw] flex items-center justify-center gap-[0.6vw] rounded-b-[1vw]">
                                        <span className="text-white text-[0.75vw] font-medium opacity-90">
                                            Add Cover picture while sharing
                                        </span>
                                        <div 
                                            className={`w-[1vw] h-[1vw] rounded-[0.2vw] border-[0.1vw] border-white/50 flex items-center justify-center cursor-pointer transition-all ${addCover ? 'bg-white border-white' : 'hover:border-white'}`}
                                            onClick={() => setAddCover(!addCover)}
                                        >
                                            {addCover && <Icon icon="lucide:check" className="text-[#3d3331] w-[0.7vw] h-[0.7vw]" strokeWidth={4} />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Share Options */}
                            <div className="flex-1 flex flex-col gap-[1.5vw]">
                                {/* Flipbook Link */}
                                <div className="flex flex-col gap-[0.6vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Flipbook Link</h3>
                                        <div className="flex-1 h-[1px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center gap-[0.5vw]">
                                        <div className="flex-1 flex items-center gap-[0.5vw] bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.4vw] shadow-sm">
                                            <LinkIcon size="0.9vw" className="text-gray-400" />
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={publicUrl}
                                                className="flex-1 bg-transparent border-none outline-none text-[0.75vw] font-medium text-gray-600 truncate"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleCopy}
                                            className={`flex items-center gap-[0.4vw] px-[1vw] py-[0.4vw] cursor-pointer rounded-[0.4vw] transition-all active:scale-95 shadow-lg ${copied ? 'bg-green-500 text-white' : 'bg-[#4A3AFF] text-white hover:bg-blue-700'}`}
                                        >
                                            <Icon icon={copied ? "lucide:check" : "lucide:copy"} className="w-[0.9vw] h-[0.9vw]" />
                                            <span className="text-[0.75vw] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Share QR */}
                                <div className="flex flex-col gap-[0.6vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Share QR</h3>
                                        <div className="flex-1 h-[1px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center gap-[1vw]">
                                        <div 
                                            className="relative w-[4.1vw] h-[4.1vw] bg-gray-100 rounded-[0.4vw] overflow-hidden border border-gray-200 group cursor-pointer shadow-sm"
                                            onClick={() => setIsEditingQR(true)}
                                        >
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`} 
                                                alt="QR Code" 
                                                className="w-full h-full p-[0.3vw]"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 size="0.8vw" className="text-white" />
                                                <span className="text-white text-[0.5vw] font-bold mt-[0.1vw]">Edit</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-[0.4vw] text-gray-400 group cursor-pointer hover:text-gray-600 transition-colors">
                                            <Icon icon="mdi:share" className="w-[1vw] h-[1vw]" />
                                            <span className="text-[0.75vw] font-bold underline underline-offset-4 decoration-gray-300">Download QR Code</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Share Through */}
                                <div className="flex flex-col gap-[0.8vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Share Through</h3>
                                        <div className="flex-1 h-[1px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center gap-[0.6vw]">
                                        {/* Embed */}
                                        <div className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm group">
                                            <Icon icon="lucide:code-2" className="w-[1.2vw] h-[1.2vw] text-gray-600 transition-transform" />
                                        </div>
                                        {/* WhatsApp */}
                                        <div 
                                            onClick={() => shareModel('whatsapp')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-[#25D366] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ic:baseline-whatsapp" className="w-[1.5vw] h-[1.5vw] text-white" />
                                        </div>
                                        {/* X */}
                                        <div 
                                            onClick={() => shareModel('x')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-black flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ri:twitter-x-fill" className="w-[1.4vw] h-[1.4vw] text-white" />
                                        </div>
                                        {/* Gmail */}
                                        <div 
                                            onClick={() => shareModel('mail')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                                        >
                                            <Icon icon="logos:google-gmail" className="w-[1.4vw] h-[1.4vw]" />
                                        </div>
                                        {/* Drive */}
                                        <div 
                                            onClick={() => shareModel('drive')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                                        >
                                            <Icon icon="logos:google-drive" className="w-[1.4vw] h-[1.4vw]" />
                                        </div>
                                        {/* Instagram */}
                                        <div 
                                            onClick={() => shareModel('instagram')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ri:instagram-line" className="w-[2.2vw] h-[2.2vw] text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* EDIT QR VIEW */
                        <div className="flex gap-[1.5vw] animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Left Column: QR Poster Preview */}
                            <div className="flex-[0.75] flex flex-col">
                                <div className="relative w-full h-[25vw] bg-[#E8F5E9] rounded-[1vw] border-[0.1vw] border-[#A5D6A7] p-[1.5vw] flex flex-col items-center shadow-sm overflow-hidden ml-[0.5vw]">
                                    {/* Top Text */}
                                    <div className="text-center mb-[2vw] shrink-0">
                                        <h3 className="text-[1.6vw] font-black text-[#2E7D32] leading-[1.1] uppercase tracking-tight">ACCEPTING<br />NEW CLIENTS</h3>
                                    </div>
                                    
                                    {/* QR Code Area */}
                                    <div className="flex-1 flex flex-col items-center justify-start w-full relative min-h-0">
                                        <span className="text-[0.7vw] font-bold text-[#2E7D32] mb-[1.5vw] uppercase tracking-[0.2em] opacity-90">Tap to scan</span>
                                        
                                        <div className="relative p-[1.2vw] shrink-0">
                                            {/* Decorative Corners */}
                                            <div className="absolute top-0 left-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-l-[3px] border-[#2E7D32] rounded-tl-[0.8vw]" />
                                            <div className="absolute top-0 right-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-r-[3px] border-[#2E7D32] rounded-tr-[0.8vw]" />
                                            <div className="absolute bottom-0 left-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-l-[3px] border-[#2E7D32] rounded-bl-[0.8vw]" />
                                            <div className="absolute bottom-0 right-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-r-[3px] border-[#2E7D32] rounded-br-[0.8vw]" />
                                            
                                            {/* The QR Code - Styled to match image (no background box) */}
                                            <div className="flex items-center justify-center relative">
                                                <img 
                                                    src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://fisto.in&color=2E7D32&bgcolor=ffffff&ecc=H" 
                                                    alt="Theme Large QR"
                                                    className="w-[10vw] h-[10vw] object-contain mix-blend-multiply"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Background Glow */}
                                    <div className="absolute -bottom-[5vw] -right-[5vw] w-[15vw] h-[15vw] bg-[#A5D6A7]/30 blur-[3vw] rounded-full" />
                                </div>
                            </div>

                            {/* Right Column: Templates & Customize */}
                            <div className="flex-[1.25] flex flex-col gap-[1vw] h-[25vw]">
                                <div className="flex-1 flex flex-col bg-gray-100 rounded-[1vw] overflow-hidden border border-gray-200 shadow-sm relative">
                                    {/* Tabs Header */}
                                    <div className="flex bg-gray-200/90 border-b border-gray-300 shrink-0">
                                        <button 
                                            onClick={() => setActiveQRTab('templates')}
                                            className={`flex-1 py-[0.5vw] text-[0.75vw] font-semibold transition-all relative ${activeQRTab === 'templates' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Templates
                                            {activeQRTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-[0.1vw] bg-black rounded-full" />}
                                        </button>
                                        <button 
                                            onClick={() => setActiveQRTab('customize')}
                                            className={`flex-1 py-[0.5vw] text-[0.75vw] font-semibold transition-all relative ${activeQRTab === 'customize' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Customize
                                            {activeQRTab === 'customize' && <div className="absolute bottom-0 left-0 right-0 h-[0.1vw] bg-black rounded-full" />}
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="flex-1 overflow-hidden relative">
                                        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-[1vw] custom-scrollbar">
                                            {activeQRTab === 'templates' ? (
                                                <div className="grid grid-cols-3 gap-[0.8vw]">
                                                    {[
                                                        "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&q=80",
                                                        "https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=400&q=80"
                                                    ].map((url, idx) => (
                                                        <div key={idx} className="aspect-square rounded-[0.6vw] overflow-hidden border border-gray-200 cursor-pointer hover:border-[#4A3AFF] transition-all group relative">
                                                            <img src={url} alt={`Template ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-[0.8vw]">
                                                    {/* Dimensions */}
                                                    <div className="flex items-center gap-[0.5vw] min-w-0">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0">Dimension :</span>
                                                        <div className="flex items-center gap-[0.5vw]">
                                                            <div className="flex items-center gap-[0.4vw]">
                                                                <span className="text-[0.7vw] font-medium text-gray-500 uppercase whitespace-nowrap">w :</span>
                                                                <div className="flex items-center gap-[0.3vw]">
                                                                    <button className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"><ChevronLeft size="0.9vw" /></button>
                                                                    <div className="flex items-center border border-gray-300 rounded-[0.4vw] px-[0.4vw] py-[0.15vw] bg-white">
                                                                        <input type="number" defaultValue="1080" className="w-[3vw] text-center text-[0.8vw] font-semibold text-gray-700 outline-none no-spin" />
                                                                    </div>
                                                                    <button className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"><ChevronRight size="0.9vw" /></button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-[0.4vw]">
                                                                <span className="text-[0.7vw] font-medium text-gray-500 uppercase whitespace-nowrap">h :</span>
                                                                <div className="flex items-center gap-[0.3vw]">
                                                                    <button className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"><ChevronLeft size="0.9vw" /></button>
                                                                    <div className="flex items-center border border-gray-300 rounded-[0.4vw] px-[0.4vw] py-[0.15vw] bg-white">
                                                                        <input type="number" defaultValue="880" className="w-[3vw] text-center text-[0.8vw] font-semibold text-gray-700 outline-none no-spin" />
                                                                    </div>
                                                                    <button className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"><ChevronRight size="0.9vw" /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Text Inputs */}
                                                    <div className="flex flex-col gap-[0.6vw]">
                                                        <div className="flex items-start gap-[0.5vw] min-w-0">
                                                            <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Enter Text 1 :</span>
                                                            <div className="flex-1 flex items-center gap-[0.5vw]">
                                                                <div className="flex-1 relative">
                                                                    <input 
                                                                        type="text" 
                                                                        className="w-full px-[0.8vw] py-[0.5vw] border border-gray-400 rounded-[0.6vw] text-[0.8vw] font-medium text-gray-700 outline-none focus:border-black transition-colors pr-[2.2vw]"
                                                                        placeholder="Title"
                                                                    />
                                                                    <Edit3 size="0.8vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400" />
                                                                </div>
                                                                <button className="p-[0.4vw] rounded-[0.4vw] hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"><Sliders size="1vw" /></button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-[0.5vw] min-w-0">
                                                            <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Enter Text 2 :</span>
                                                            <div className="flex-1 flex items-center gap-[0.5vw]">
                                                                <div className="flex-1 relative">
                                                                    <textarea 
                                                                        className="w-full px-[0.8vw] py-[0.6vw] border border-gray-400 rounded-[0.6vw] text-[0.8vw] font-medium text-gray-700 outline-none focus:border-black transition-colors pr-[2.2vw] resize-none h-[4vw]"
                                                                        placeholder="Supporting Text"
                                                                    />
                                                                    <Edit3 size="0.8vw" className="absolute right-[0.6vw] bottom-[0.6vw] text-gray-400" />
                                                                </div>
                                                                <button className="p-[0.4vw] rounded-[0.4vw] hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"><Sliders size="1vw" /></button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Edit QR Code */}
                                                    <div className="flex items-start gap-[0.5vw] min-w-0">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Edit QR Code :</span>
                                                        <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0">
                                                            <div className="bg-white border border-gray-200 rounded-[0.8vw] p-[0.8vw] flex gap-[1vw] relative overflow-hidden shadow-sm">
                                                                <div className="w-[10.5vw] h-[10.5vw] bg-gray-100 rounded-[0.5vw] flex items-center justify-center relative group shrink-0">
                                                                    <img 
                                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}&color=${qrColor.replace('#', '')}&bgcolor=${qrBgColor.replace('#', '')}`}
                                                                        alt="QR Preview"
                                                                        className="w-full h-full p-[0.8vw] object-contain"
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                                        <div className="bg-white/90 backdrop-blur-sm px-[0.6vw] py-[0.3vw] rounded-[0.4vw] flex items-center gap-[0.3vw] shadow-sm border border-gray-100">
                                                                            <Icon icon="ri:loop-left-line" className="text-[0.8vw]" />
                                                                            <span className="text-[0.7vw] font-bold">Theme</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-2 gap-[0.5vw] min-w-0 h-[10.5vw] overflow-y-auto custom-scrollbar pr-[0.4vw] content-start">
                                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                                                        <div key={i} className="aspect-square bg-gray-400 rounded-[0.3vw] cursor-pointer hover:scale-105 transition-transform" />
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* QR Colors (Now under Edit QR Code) */}
                                                            <div className="flex flex-col gap-[0.8vw] mt-[0.2vw]">
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">QR Color :</span>
                                                                    <div className="flex-1 flex items-center gap-[0.5vw] min-w-0">
                                                                        <div className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0" style={{ backgroundColor: qrColor }}></div>
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm min-w-0">
                                                                            <input 
                                                                                type="text" 
                                                                                value={qrColor} 
                                                                                onChange={(e) => setQrColor(e.target.value)}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none min-w-0"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100 shrink-0">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">BG Color :</span>
                                                                    <div className="flex-1 flex items-center gap-[0.5vw] min-w-0">
                                                                        <div className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0" style={{ backgroundColor: qrBgColor }}></div>
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm min-w-0">
                                                                            <input 
                                                                                type="text" 
                                                                                value={qrBgColor} 
                                                                                onChange={(e) => setQrBgColor(e.target.value)}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none min-w-0"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100 shrink-0">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">QR Size :</span>
                                                                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-[0.6vw] p-[0.3vw] gap-[0.3vw] shadow-sm min-w-0">
                                                                        {['Small', 'Medium', 'Large'].map((size) => (
                                                                            <button
                                                                                key={size}
                                                                                onClick={() => setQrSize(size)}
                                                                                className={`flex-1 px-[1vw] py-[0.3vw] rounded-[0.4vw] text-[0.75vw] cursor-pointer font-semibold transition-all ${qrSize === size ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                                                            >
                                                                                {size}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-start gap-[0.5vw] min-w-0 mt-[0.2vw]">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0 mt-[0.4vw]">Add Logo :</span>
                                                                    <div className="flex-1 flex flex-col items-center gap-[0.4vw]">
                                                                        <div className="w-full h-[4.5vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden">
                                                                            <div className="flex flex-col items-center pointer-events-none">
                                                                                <p className="text-[0.55vw] font-medium text-gray-500">Drag & Drop or <span className="text-blue-600">Upload</span></p>
                                                                                <Upload size="0.9vw" className="text-gray-400 group-hover:text-gray-600 transition-colors mt-[0.2vw]" />
                                                                                <p className="text-[0.5vw] text-gray-400 mt-[0.2vw]">Supported File Format : JPG, PNG</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Background Customize */}
                                                    <div className="flex items-start gap-[0.5vw] min-w-0 mt-[0.4vw]">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.4vw]">Background :</span>
                                                        <div className="flex-1 bg-white border border-gray-200 rounded-[0.8vw] shadow-sm">
                                                            <div className="px-[0.8vw] py-[0.4vw] border-b border-gray-100 bg-gray-50/30">
                                                                <span className="text-[0.7vw] font-bold text-gray-800">Customize your BG</span>
                                                            </div>
                                                            <div className="p-[0.6vw] flex flex-col gap-[0.6vw]">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="relative w-[7.5vw]">
                                                                        <button 
                                                                            onClick={toggleBgTypeDropdown}
                                                                            className="w-full bg-white border border-gray-200 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-300 transition-all"
                                                                        >
                                                                            <span>{qrBgType}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showBgTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        
                                                                        {showBgTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowBgTypeDropdown(false)} />
                                                                                <div className={`absolute ${bgTypeDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] duration-200`}>
                                                                                    {['Solid', 'Gradient', 'Image'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrBgType(type);
                                                                                                setShowBgTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrBgType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type}
                                                                                            {qrBgType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {qrBgType === 'Image' && (
                                                                        <div className="relative w-[6.5vw]">
                                                                            <button 
                                                                                onClick={toggleBgFitDropdown}
                                                                                className="w-full bg-white border border-gray-200 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-300 transition-all"
                                                                            >
                                                                                <span>{qrBgFit}</span>
                                                                                <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showBgFitDropdown ? 'rotate-180' : ''}`} />
                                                                            </button>
                                                                            
                                                                            {showBgFitDropdown && (
                                                                                <>
                                                                                    <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowBgFitDropdown(false)} />
                                                                                    <div className={`absolute ${bgFitDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] duration-200`}>
                                                                                        {['Fit', 'Fill', 'Stretch'].map((fit) => (
                                                                                            <button
                                                                                                key={fit}
                                                                                                onClick={() => {
                                                                                                    setQrBgFit(fit);
                                                                                                    setShowBgFitDropdown(false);
                                                                                                }}
                                                                                                className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrBgFit === fit ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                            >
                                                                                                {fit}
                                                                                                {qrBgFit === fit && <Check size="0.7vw" />}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {qrBgType === 'Image' && (
                                                                    <>
                                                                        <div className="w-full h-[6vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden mt-[0.2vw]">
                                                                            <div className="flex flex-col items-center pointer-events-none">
                                                                                <Upload size="1.2vw" className="text-gray-400 group-hover:text-[#4A3AFF] transition-colors" />
                                                                                <p className="text-[0.6vw] font-medium text-gray-500 mt-[0.3vw]">Drag & Drop or <span className="text-[#4A3AFF]">Upload</span></p>
                                                                                <p className="text-[0.5vw] text-gray-400 mt-[0.1vw]">Supported File Format : JPG, PNG</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-[0.8vw] px-[0.2vw] mt-[0.2vw]">
                                                                            <span className="text-[0.75vw] font-semibold text-gray-700 w-[4.5vw] shrink-0">Opacity :</span>
                                                                            <div className="flex-1 flex items-center gap-[0.8vw]">
                                                                                <input 
                                                                                    type="range" 
                                                                                    min="0" 
                                                                                    max="100" 
                                                                                    value={qrBgOpacity}
                                                                                    onChange={(e) => setQrBgOpacity(e.target.value)}
                                                                                    className="flex-1 h-[0.25vw] bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#4A3AFF] hover:accent-[#3b2fd9] transition-all"
                                                                                />
                                                                                <span className="text-[0.75vw] font-bold text-gray-500 w-[2.5vw] text-right">{qrBgOpacity}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="flex items-center gap-[0.6vw] mt-[0.2vw]">
                                                                    <div className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0" style={{ backgroundColor: customBgColor }}></div>
                                                                    <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm">
                                                                        <input 
                                                                            type="text" 
                                                                            value={customBgColor} 
                                                                            onChange={(e) => setCustomBgColor(e.target.value)}
                                                                            className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none"
                                                                        />
                                                                        <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100">100%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex items-center gap-[0.6vw] mt-auto shrink-0">
                                     <button 
                                         onClick={() => setIsEditingQR(false)}
                                        className="flex-1 py-[0.7vw] rounded-[0.5vw] border border-gray-200 text-gray-700 font-bold text-[0.8vw] hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center gap-[0.4vw] shadow-sm whitespace-nowrap"
                                     >
                                        <X size="0.9vw" className="text-gray-500" /> Cancel
                                     </button>
                                     
                                     <div className="flex-1 relative">
                                         <div className="flex items-center bg-white border border-gray-200 rounded-[0.5vw] shadow-sm hover:border-gray-300 transition-all group overflow-hidden h-full">
                                            <button className="flex-1 py-[0.7vw] px-[0.5vw] text-gray-700 font-bold text-[0.8vw] flex items-center justify-center gap-[0.5vw] whitespace-nowrap">
                                                 <Download size="0.9vw" className="text-gray-400 shrink-0" /> 
                                                 <span className="truncate">Export as {exportFormat}</span>
                                             </button>
                                             <div className="w-[1px] h-[1vw] bg-gray-200 shrink-0" />
                                             <button 
                                                 onClick={() => setShowExportDropdown(!showExportDropdown)}
                                                className={`px-[0.6vw] py-[0.7vw] transition-all shrink-0 ${showExportDropdown ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                             >
                                                 <ChevronRight size="0.9vw" className={`${showExportDropdown ? '-rotate-90' : 'rotate-90'} text-gray-400 transition-transform duration-200`} />
                                             </button>
                                         </div>

                                         {/* Dropdown Menu */}
                                          {showExportDropdown && (
                                             <>
                                                 <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowExportDropdown(false)} />
                                                 <div className="absolute bottom-[calc(100%+0.5vw)] right-0 w-full bg-white border border-gray-100 rounded-[0.6vw] shadow-xl z-50 py-[0.4vw] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                     {['JPG', 'PNG', 'WebP'].map((format) => (
                                                         <button
                                                             key={format}
                                                             onClick={() => {
                                                                 setExportFormat(format);
                                                                 setShowExportDropdown(false);
                                                             }}
                                                             className={`w-full text-left px-[1vw] py-[0.6vw] text-[0.75vw] font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${exportFormat === format ? 'text-[#4A3AFF]' : 'text-gray-600'}`}
                                                         >
                                                             {format}
                                                             {exportFormat === format && <Check size="0.8vw" />}
                                                         </button>
                                                     ))}
                                                 </div>
                                             </>
                                         )}
                                     </div>

                                     <button 
                                         onClick={() => setIsEditingQR(false)}
                                        className="flex-1 py-[0.7vw] rounded-[0.5vw] bg-black text-white font-bold text-[0.8vw] hover:bg-gray-800 transition-all cursor-pointer shadow-md flex items-center justify-center gap-[0.5vw] whitespace-nowrap"
                                     >
                                         <Check size="1vw" /> Save
                                     </button>
                                 </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
