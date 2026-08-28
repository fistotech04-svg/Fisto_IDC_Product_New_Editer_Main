import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import QRCode from 'react-qr-code';

const FlipbookSharePopup = ({ onClose, bookName = "Flipbook Name", url = "https://flipbook/page", popupSettings, isMobile = false, isLandscape = false, isPublished = true }) => {
    const [shareCurrentPage, setShareCurrentPage] = useState(false);
    const [localUrl, setLocalUrl] = useState(url);
    const [copied, setCopied] = useState(false);

    const containerStyle = {
        backgroundColor: popupSettings?.backgroundColor?.fill || '#ffffff',
        border: popupSettings?.backgroundColor?.stroke && popupSettings.backgroundColor.stroke !== '#' ? `1px solid ${popupSettings.backgroundColor.stroke}` : '1px solid #e5e7eb',
        fontFamily: popupSettings?.textProperties?.font || 'Poppins'
    };

    const headerTextStyle = {
        color: popupSettings?.textProperties?.fill || '#111827',
        fontFamily: popupSettings?.textProperties?.font || 'Poppins'
    };

    return (
        <div
            className={`absolute inset-0 z-[5000] flex items-center justify-center pointer-events-auto bg-transparent ${isMobile ? 'p-4' : ''}`}
            onClick={onClose}
        >
            <div
                className={`
                    ${isMobile
                        ? (isLandscape ? 'w-[350px] p-2.5 rounded-xl gap-1.5' : 'w-[95%] max-w-[380px] p-4 gap-3.5 rounded-2xl')
                        : 'w-[24vw] p-[1.2vw] gap-[1vw] rounded-[1vw]'
                    } 
                    bg-white shadow-[0_1.5vw_4vw_rgba(0,0,0,0.12)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden
                `}
                style={containerStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative ${isMobile ? (isLandscape ? 'mb-0' : 'mb-0.5') : 'mb-[0.2vw]'}`}>
                    <div className="flex items-center gap-2.5">
                        <h2 className={`${isMobile ? (isLandscape ? 'text-[13px]' : 'text-[16px]') : 'text-[1.1vw]'} font-semibold whitespace-nowrap`} style={headerTextStyle}>Share Flipbook</h2>
                        <div className="h-[1px] flex-1 opacity-20" style={{ backgroundColor: headerTextStyle.color }}></div>
                        <button
                            onClick={onClose}
                            className={`${isMobile ? (isLandscape ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg') : 'w-[1.6vw] h-[1.6vw] rounded-[0.3vw]'} border border-[#FF4D4D] flex items-center justify-center text-[#FF4D4D] hover:bg-red-50 transition-colors`}
                        >
                            <Icon icon="lucide:x" className={isMobile ? (isLandscape ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5') : 'w-[1vw] h-[1vw]'} />
                        </button>
                    </div>
                </div>

                {/* Link Input Section */}
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center gap-2">
                        <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : 'text-[1vw]'} font-semibold text-gray-700 whitespace-nowrap`}>Flipbook Link</h3>
                        <div className="flex-1 h-[1px] bg-gray-100" />
                    </div>
                    <div className={`flex items-center w-full ${isLandscape ? 'gap-1.5' : 'gap-2'}`}>
                        <input
                            type="text"
                            value={isPublished ? localUrl : 'Publish flipbook to enable link sharing'}
                            onChange={(e) => isPublished && setLocalUrl(e.target.value)}
                            readOnly={!isPublished}
                            className={`${isMobile ? (isLandscape ? 'h-7 px-2 text-[10px]' : 'h-9 px-3 text-[12px]') : 'h-[2.5vw] px-[0.8vw] text-[0.8vw]'} flex-1 min-w-0 border border-gray-300 rounded-lg bg-gray-50 shadow-sm outline-none text-gray-600 truncate focus:border-black transition-colors ${!isPublished ? 'italic text-amber-600 font-medium' : ''}`}
                        />
                        <div className="relative flex-shrink-0">
                            <button
                                disabled={!isPublished}
                                className={`${isMobile ? (isLandscape ? 'h-7 px-2' : 'h-9 px-2.5') : 'h-[2.5vw] px-[1.2vw]'} ${!isPublished ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60' : 'bg-black text-white hover:bg-gray-800 cursor-pointer'} rounded-lg flex items-center gap-1 transition-colors shadow-sm`}
                                onClick={() => {
                                    if (!isPublished) {
                                        alert("Please publish your flipbook first to copy or share the link.");
                                        return;
                                    }
                                    navigator.clipboard.writeText(localUrl);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                            >
                                <Icon icon="solar:copy-bold-duotone" className={isMobile ? (isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5') : 'w-[1.2vw] h-[1.2vw]'} />
                                <span className={`${isMobile ? (isLandscape ? 'text-[10px]' : 'text-[11px]') : 'text-[0.8vw]'} font-semibold`}>Copy</span>
                            </button>
                            {copied && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 text-black text-[10px] font-bold mt-1 animate-in fade-in slide-in-from-top-1 duration-200 z-10">
                                    Copied!
                                </div>
                            )}
                        </div>
                    </div>
                    {!isPublished && (
                        <p className="text-[10px] text-gray-500 italic mt-1 leading-tight">
                            * Flipbook is currently unpublished. Click "Publish" in top bar to enable link sharing.
                        </p>
                    )}
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center gap-2">
                        <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : 'text-[1vw]'} font-semibold text-gray-700 whitespace-nowrap`}>Share QR</h3>
                        <div className="flex-1 h-[1px] bg-gray-100" />
                    </div>
                    <div className={`flex items-center ${isLandscape ? 'gap-2.5' : 'gap-4'}`}>
                        <div className={`${isMobile ? (isLandscape ? 'p-0.5 w-[50px]' : 'p-1.5 w-[72px]') : 'p-[0.6vw] w-[8vw]'} flex flex-col items-center gap-0.5 border border-gray-100 rounded-lg shadow-sm bg-white shrink-0`}>
                            <div className={`${isMobile ? (isLandscape ? 'w-8 h-8' : 'w-14 h-14') : 'w-[6.5vw] h-[6.5vw]'} flex items-center justify-center`}>
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={localUrl}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-9 overflow-hidden flex-1 max-w-[140px]">
                            <button
                                className="flex-1 px-2 font-bold text-[11px] flex items-center justify-center gap-1.5 text-gray-700 hover:bg-gray-50 transition-colors h-full whitespace-nowrap"
                            >
                                <Icon icon="lucide:download" className="w-3.5 h-3.5 text-gray-400" />
                                <span>Download JPG</span>
                            </button>
                            <div className="w-[1px] h-5 bg-gray-200 shrink-0" />
                            <button
                                className="px-2 h-full hover:bg-gray-50 transition-colors flex items-center justify-center shrink-0"
                            >
                                <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`h-[1px] w-full bg-gray-100 ${isLandscape ? 'hidden' : ''}`}></div>

                {/* Social Share */}
                <div className={`${isMobile ? (isLandscape ? 'space-y-0.5' : 'space-y-2.5') : 'space-y-[0.8vw]'}`}>
                    <div className="flex items-center gap-2">
                        <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : 'text-[1vw]'} font-semibold text-gray-700 whitespace-nowrap`}>Share Through</h3>
                        <div className="flex-1 h-[1px] bg-gray-100" />
                    </div>
                    <div className="flex gap-2 justify-start flex-wrap">
                        {/* Embed Option */}
                        <button
                            className={`${isMobile ? (isLandscape ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-xl') : 'w-[3.2vw] h-[3.2vw] rounded-[0.6vw]'} flex items-center justify-center border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm`}
                            title="Embed"
                        >
                            <Icon icon="lucide:code-2" className={`${isMobile ? (isLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4') : 'w-[2vw] h-[2vw]'} text-gray-600`} />
                        </button>
                        {[
                            { id: 'whatsapp', icon: 'ic:baseline-whatsapp', color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`Check out this flipbook: ${bookName} - ${url}`)}` },
                            { id: 'twitter', icon: 'ri:twitter-x-fill', color: '#000000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this flipbook: ${bookName}`)}&url=${encodeURIComponent(url)}` },
                            { id: 'gmail', icon: 'logos:google-gmail', color: '#ffffff', url: `mailto:?subject=${encodeURIComponent(bookName)}&body=${encodeURIComponent(`Check out this flipbook: ${url}`)}`, hasBorder: true },
                            { id: 'linkedin', icon: 'ri:linkedin-fill', color: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
                            { id: 'instagram', icon: 'skill-icons:instagram', color: '#ffffff', url: `https://www.instagram.com/` }
                        ].map((social) => (
                            <button
                                key={social.id}
                                onClick={() => window.open(social.url, '_blank')}
                                className={`${isMobile ? (isLandscape ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-xl') : 'w-[3.2vw] h-[3.2vw] rounded-[0.6vw]'} flex items-center justify-center hover:scale-110 transition-transform shadow-sm ${social.hasBorder ? 'border border-gray-100' : ''}`}
                                style={{ backgroundColor: social.color }}
                            >
                                <Icon
                                    icon={social.icon}
                                    className={`${isMobile ? (isLandscape ? 'w-3.5 h-3.5' : 'w-5 h-5') : 'w-[2vw] h-[2vw]'}`}
                                    style={{ color: social.id === 'twitter' || social.id === 'whatsapp' || social.id === 'linkedin' ? 'white' : undefined }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipbookSharePopup;
