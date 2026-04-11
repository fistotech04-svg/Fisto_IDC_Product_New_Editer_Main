import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import QRCode from 'react-qr-code';

const FlipbookSharePopup = ({ onClose, bookName = "Flipbook Name", url = "https://flipbook/page", popupSettings, isMobile = false, isLandscape = false, isTablet = false }) => {
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
                        : (isTablet ? 'w-[16vw] p-[1vw] gap-[0.8vw] rounded-[0.8vw]' : 'w-[24vw] p-[1.2vw] gap-[1vw] rounded-[1vw]')
                    } 
                    bg-white shadow-[0_1.5vw_4vw_rgba(0,0,0,0.12)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden
                `}
                style={containerStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative ${isMobile ? (isLandscape ? 'mb-0' : 'mb-0.5') : (isTablet ? 'mb-[0.15vw]' : 'mb-[0.2vw]')}`}>
                    <div className="flex items-center gap-2.5">
                        <h2 className={`${isMobile ? (isLandscape ? 'text-[13px]' : 'text-[16px]') : (isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]')} font-semibold whitespace-nowrap`} style={headerTextStyle}>Share Flipbook</h2>
                        <div className="h-[1px] flex-1 opacity-20" style={{ backgroundColor: headerTextStyle.color }}></div>
                        <button
                            onClick={onClose}
                            className={`${isMobile ? (isLandscape ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg') : (isTablet ? 'w-[1.3vw] h-[1.3vw] rounded-[0.25vw]' : 'w-[1.6vw] h-[1.6vw] rounded-[0.3vw]')} border border-[#FF4D4D] flex items-center justify-center text-[#FF4D4D] hover:bg-red-50 transition-colors`}
                        >
                            <Icon icon="lucide:x" className={isMobile ? (isLandscape ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5') : (isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]')} />
                        </button>
                    </div>
                </div>

                {/* Link Input */}
                <div className={`flex items-center w-full ${isLandscape ? 'gap-1.5' : 'gap-2'}`}>
                    <input
                        type="text"
                        value={localUrl}
                        onChange={(e) => setLocalUrl(e.target.value)}
                        className={`${isMobile ? (isLandscape ? 'h-7 px-2 text-[10px]' : 'h-9 px-3 text-[12px]') : (isTablet ? 'h-[2vw] px-[0.6vw] text-[0.7vw]' : 'h-[2.5vw] px-[0.8vw] text-[0.8vw]')} flex-1 min-w-0 border border-gray-300 rounded-lg bg-gray-50 shadow-sm outline-none text-gray-600 truncate focus:border-black transition-colors`}
                    />
                    <div className="relative flex-shrink-0">
                        <button
                            className={`${isMobile ? (isLandscape ? 'h-7 px-2' : 'h-9 px-2.5') : (isTablet ? 'h-[2vw] px-[1vw]' : 'h-[2.5vw] px-[1.2vw]')} bg-black text-white rounded-lg flex items-center gap-1 hover:bg-gray-800 transition-colors shadow-sm`}
                            onClick={() => {
                                navigator.clipboard.writeText(localUrl);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                        >
                            <Icon icon="solar:copy-bold-duotone" className={isMobile ? (isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5') : (isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]')} />
                            <span className={`${isMobile ? (isLandscape ? 'text-[10px]' : 'text-[11px]') : (isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]')} font-semibold`}>Copy</span>
                        </button>
                        {copied && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 text-black text-[10px] font-bold mt-1 animate-in fade-in slide-in-from-top-1 duration-200 z-10">
                                Copied!
                            </div>
                        )}
                    </div>
                </div>

                {/* Checkbox */}
                <div
                    className="flex items-center gap-2.5 cursor-pointer w-fit"
                    onClick={() => setShareCurrentPage(!shareCurrentPage)}
                >
                    <div className={`${isMobile ? (isLandscape ? 'w-3 h-3 rounded-[3px]' : 'w-3.5 h-3.5 rounded-[4px]') : (isTablet ? 'w-[0.7vw] h-[0.7vw] rounded-[0.15vw]' : 'w-[0.9vw] h-[0.9vw] rounded-[0.2vw]')} border-[1.5px] flex items-center justify-center transition-colors bg-white ${shareCurrentPage ? 'border-black' : 'border-gray-400'}`}>
                        {shareCurrentPage && <Icon icon="lucide:check" className={isMobile ? (isLandscape ? 'w-2 h-2 text-black' : 'w-2.5 h-2.5 text-black') : (isTablet ? 'w-[0.5vw] h-[0.5vw]' : 'w-[0.7vw] h-[0.7vw]') + ' text-black'} strokeWidth={3} />}
                    </div>
                    <span className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : (isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]')} text-gray-500 font-medium tracking-tight`}>Share Current Page only</span>
                </div>

                {/* QR Code Section */}
                <div className={`flex items-center ${isLandscape ? 'gap-2.5' : 'gap-5'}`}>
                    <div className={`${isMobile ? (isLandscape ? 'p-0.5 w-[50px]' : 'p-1.5 w-[72px]') : (isTablet ? 'p-[0.5vw] w-[6.5vw]' : 'p-[0.6vw] w-[8vw]')} flex flex-col items-center gap-0.5 border border-gray-100 rounded-lg shadow-sm bg-white`}>
                        <div className={`${isMobile ? (isLandscape ? 'w-8 h-8' : 'w-14 h-14') : (isTablet ? 'w-[5.2vw] h-[5.2vw]' : 'w-[6.5vw] h-[6.5vw]')} flex items-center justify-center`}>
                            <QRCode
                                size={256}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={localUrl}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <span className={`${isMobile ? (isLandscape ? 'text-[7px]' : 'text-[9px]') : (isTablet ? 'text-[0.5vw]' : 'text-[0.6vw]')} font-medium text-gray-400 truncate w-full text-center`}>{bookName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icon icon="mdi:share" className={`${isMobile ? (isLandscape ? 'w-3 h-3' : 'w-4 h-4') : (isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]')} text-gray-400`} />
                        <span className={`${isMobile ? (isLandscape ? 'text-[10px]' : 'text-[13px]') : (isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]')} font-medium text-gray-600`}>Through QR Code</span>
                    </div>
                </div>

                <div className={`h-[1px] w-full bg-gray-100 ${isLandscape ? 'hidden' : ''}`}></div>

                {/* Social Share */}
                <div className={`${isMobile ? (isLandscape ? 'space-y-0.5' : 'space-y-2.5') : (isTablet ? 'space-y-[0.5vw]' : 'space-y-[0.8vw]')}`}>
                    <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[13px]') : (isTablet ? 'text-[0.7vw]' : 'text-[1vw]')} font-semibold text-gray-700`}>Share Through</h3>
                    <div className="flex gap-1.5 justify-between">
                        {[
                            { id: 'whatsapp', icon: 'ic:baseline-whatsapp', color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`Check out this flipbook: ${bookName} - ${url}`)}` },
                            { id: 'twitter', icon: 'ri:twitter-x-fill', color: '#000000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this flipbook: ${bookName}`)}&url=${encodeURIComponent(url)}` },
                            { id: 'facebook', icon: 'ic:baseline-facebook', color: '#3b5998', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
                            { id: 'gmail', icon: 'logos:google-gmail', color: '#ffffff', url: `mailto:?subject=${encodeURIComponent(bookName)}&body=${encodeURIComponent(`Check out this flipbook: ${url}`)}`, hasBorder: true },
                            { id: 'drive', icon: 'logos:google-drive', color: '#ffffff', url: `https://drive.google.com/`, hasBorder: true },
                            { id: 'instagram', icon: 'skill-icons:instagram', color: '#ffffff', url: `https://www.instagram.com/` }
                        ].map((social) => (
                            <button
                                key={social.id}
                                onClick={() => window.open(social.url, '_blank')}
                                className={`${isMobile ? (isLandscape ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-xl') : (isTablet ? 'w-[2vw] h-[2vw] rounded-[0.5vw]' : 'w-[3.2vw] h-[3.2vw] rounded-[0.6vw]')} flex items-center justify-center hover:scale-110 transition-transform shadow-sm ${social.hasBorder ? 'border border-gray-100' : ''}`}
                                style={{ backgroundColor: social.color }}
                            >
                                <Icon
                                    icon={social.icon}
                                    className={`${isMobile ? (isLandscape ? 'w-3.5 h-3.5' : 'w-5 h-5') : (isTablet ? 'w-[1.6vw] h-[1.6vw]' : 'w-[2vw] h-[2vw]')}`}
                                    style={{ color: social.id === 'twitter' || social.id === 'facebook' || social.id === 'whatsapp' ? 'white' : undefined }}
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
