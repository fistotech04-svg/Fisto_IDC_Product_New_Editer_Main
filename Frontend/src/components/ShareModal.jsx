import React, { useState, useRef, useEffect } from 'react';
import { X, Link as LinkIcon, Copy, QrCode, Download, Share2, Mail, Instagram, Edit3, ArrowRight, ChevronRight, ChevronLeft, Check, Sliders, Upload, ChevronDown } from 'lucide-react';
import { Icon } from '@iconify/react';
import ColorPicker from './ThreedEditor/ColorPicker';
import TemplateColorPicker from './TemplateEditor/ColorPicker';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';

// Custom QR Code component utilizing qr-code-styling for premium aesthetics
const CustomQRCode = React.forwardRef(({ 
    value, 
    size = 256, 
    fgColor = '#000000', 
    bgColor = '#ffffff', 
    dotType = 'square', 
    cornerSquareType = 'square', 
    cornerDotType = 'square', 
    level = 'M', 
    logo = '',
    style = {}
}, ref) => {
    const containerRef = useRef(null);
    const qrStylingRef = useRef(null);

    useEffect(() => {
        const qrCode = new QRCodeStyling({
            type: 'svg',
            width: size,
            height: size,
            data: value || 'https://google.com',
            margin: Math.max(2, Math.round(size * 0.05)),
            dotsOptions: {
                color: fgColor,
                type: dotType
            },
            backgroundOptions: {
                color: bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor
            },
            cornersSquareOptions: {
                color: fgColor,
                type: cornerSquareType
            },
            cornersDotOptions: {
                color: fgColor,
                type: cornerDotType
            },
            qrOptions: {
                errorCorrectionLevel: level
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 5,
                hideBackgroundDots: true
            },
            image: logo || undefined
        });

        qrStylingRef.current = qrCode;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            qrCode.append(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    useEffect(() => {
        if (!qrStylingRef.current) return;

        const animFrame = requestAnimationFrame(() => {
            qrStylingRef.current.update({
                type: 'svg',
                width: size,
                height: size,
                data: value || 'https://google.com',
                margin: Math.max(2, Math.round(size * 0.05)),
                dotsOptions: {
                    color: fgColor,
                    type: dotType
                },
                backgroundOptions: {
                    color: bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor
                },
                cornersSquareOptions: {
                    color: fgColor,
                    type: cornerSquareType
                },
                cornersDotOptions: {
                    color: fgColor,
                    type: cornerDotType
                },
                qrOptions: {
                    errorCorrectionLevel: level
                },
                image: logo || undefined
            });
        });

        return () => cancelAnimationFrame(animFrame);
    }, [value, size, fgColor, bgColor, dotType, cornerSquareType, cornerDotType, level, logo]);

    React.useImperativeHandle(ref, () => ({
        download: async (options) => {
            if (qrStylingRef.current) {
                try {
                    await qrStylingRef.current.download(options);
                } catch (e) {
                    console.error('Error downloading QR code via qr-code-styling:', e);
                }
            }
        }
    }));

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden" style={style}>
            <style dangerouslySetInnerHTML={{ __html: `
                .qr-styling-container-fisto canvas,
                .qr-styling-container-fisto svg {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    display: block !important;
                }
            ` }} />
            <div 
                ref={containerRef} 
                className="qr-styling-container-fisto flex items-center justify-center w-full h-full"
            />
        </div>
    );
});


const ShareModal = ({ isOpen, onClose, flipbookUrl, flipbookThumbnail, currentBook }) => {
    const [addCover, setAddCover] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditingQR, setIsEditingQR] = useState(false);
    const [activeQRTab, setActiveQRTab] = useState('templates');
    const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [exportFormat, setExportFormat] = useState('JPG');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    
    // Customization States
    const [qrColor, setQrColor] = useState('#2E7D32');
    const [qrBgColor, setQrBgColor] = useState('transparent');
    const [qrLevel, setQrLevel] = useState('M');
    const [qrBgType, setQrBgType] = useState('Color');
    const [customBgColor, setCustomBgColor] = useState('#D7D8E8');
    const [showBgTypeDropdown, setShowBgTypeDropdown] = useState(false);
    const [qrBgFit, setQrBgFit] = useState('Fit');
    const [qrBgOpacity, setQrBgOpacity] = useState(100);
    const [showBgFitDropdown, setShowBgFitDropdown] = useState(false);
    const [bgTypeDirection, setBgTypeDirection] = useState('down');
    const [bgFitDirection, setBgFitDirection] = useState('down');

    // Shape customization states
    const [qrDotType, setQrDotType] = useState('square');
    const [qrCornerSquareType, setQrCornerSquareType] = useState('square');
    const [qrCornerDotType, setQrCornerDotType] = useState('square');

    // Shape dropdown states
    const [showDotTypeDropdown, setShowDotTypeDropdown] = useState(false);
    const [showCornerSquareTypeDropdown, setShowCornerSquareTypeDropdown] = useState(false);
    const [showCornerDotTypeDropdown, setShowCornerDotTypeDropdown] = useState(false);
    const [showQrColorPicker, setShowQrColorPicker] = useState(false);
    const [showQrBgColorPicker, setShowQrBgColorPicker] = useState(false);
    const [showCustomBgColorPicker, setShowCustomBgColorPicker] = useState(false);
    const [qrBgImage, setQrBgImage] = useState(null);
    const [qrLogo, setQrLogo] = useState(null);
    
    // New states for poster text and dimensions
    const [text1, setText1] = useState('ACCEPTING NEW CLIENTS');
    const [text2, setText2] = useState('Tap to scan');
    const [qrWidth, setQrWidth] = useState(1080);
    const [qrHeight, setQrHeight] = useState(880);
    
    // Typography States
    const [activeTextEditor, setActiveTextEditor] = useState(null); // 'text1' or 'text2' or null
    
    // Text 1 Typography states
    const [text1FontFamily, setText1FontFamily] = useState('Poppins');
    const [text1FontSize, setText1FontSize] = useState(24);
    const [text1FontWeight, setText1FontWeight] = useState('Semi Bold');
    const [text1LetterSpacing, setText1LetterSpacing] = useState('Auto');
    const [text1LineHeight, setText1LineHeight] = useState('Auto');
    const [text1Align, setText1Align] = useState('center');
    const [text1Bold, setText1Bold] = useState(true);
    const [text1Italic, setText1Italic] = useState(false);
    const [text1Underline, setText1Underline] = useState(false);
    const [text1Color, setText1Color] = useState('#2E7D32');
    const [text1ColorOpacity, setText1ColorOpacity] = useState(100);
    
    // Text 2 Typography states
    const [text2FontFamily, setText2FontFamily] = useState('Poppins');
    const [text2FontSize, setText2FontSize] = useState(12);
    const [text2FontWeight, setText2FontWeight] = useState('Bold');
    const [text2LetterSpacing, setText2LetterSpacing] = useState('Auto');
    const [text2LineHeight, setText2LineHeight] = useState('Auto');
    const [text2Align, setText2Align] = useState('center');
    const [text2Bold, setText2Bold] = useState(true);
    const [text2Italic, setText2Italic] = useState(false);
    const [text2Underline, setText2Underline] = useState(false);
    const [text2Color, setText2Color] = useState('#2E7D32');
    const [text2ColorOpacity, setText2ColorOpacity] = useState(90);

    // Dropdown toggle states for the Typography popup
    const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
    const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
    const [showFontWeightDropdown, setShowFontWeightDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showLetterSpacingSlider, setShowLetterSpacingSlider] = useState(false);
    const [showLineHeightSlider, setShowLineHeightSlider] = useState(false);
    
    const qrRef = useRef();
    const mainQrRef = useRef(null);
    const posterPreviewRef = useRef(null);

    const qrThemes = [
        { name: 'Classic Black', fg: '#000000', bg: '#ffffff', dotType: 'square', cornerSquareType: 'square', cornerDotType: 'square' },
        { name: 'Ocean Blue', fg: '#4A3AFF', bg: '#ffffff', dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
        { name: 'Forest Green', fg: '#2E7D32', bg: '#ffffff', dotType: 'classy', cornerSquareType: 'square', cornerDotType: 'square' },
        { name: 'Ruby Red', fg: '#D32F2F', bg: '#ffffff', dotType: 'extra-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
        { name: 'Modern Dot', fg: '#000000', bg: '#ffffff', dotType: 'dots', cornerSquareType: 'dot', cornerDotType: 'dot' },
        { name: 'Royal Gold', fg: '#8C6B2D', bg: '#FFFDE7', dotType: 'classy-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'square' }
    ];

    const posterTemplates = [
        {
            name: 'Classic Emerald',
            bgType: 'Color',
            bgColor: '#D7D8E8',
            qrColor: '#2E7D32',
            qrBgColor: 'transparent',
            text1Color: '#2E7D32',
            text2Color: '#2E7D32',
            dotType: 'square',
            cornerSquareType: 'square',
            cornerDotType: 'square',
            fontFamily: 'Poppins'
        },
        {
            name: 'Ocean Breeze',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 50%, #90CAF9 100%)',
            qrColor: '#0D47A1',
            qrBgColor: '#ffffff',
            text1Color: '#FFFFFF',
            text2Color: '#E3F2FD',
            dotType: 'rounded',
            cornerSquareType: 'extra-rounded',
            cornerDotType: 'dot',
            fontFamily: 'Montserrat'
        },
        {
            name: 'Sunset Glow',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #FF7B89 0%, #FF9A8B 40%, #FFD3B6 100%)',
            qrColor: '#880E4F',
            qrBgColor: '#ffffff',
            text1Color: '#4A0E17',
            text2Color: '#880E4F',
            dotType: 'classy-rounded',
            cornerSquareType: 'dot',
            cornerDotType: 'dot',
            fontFamily: 'Playfair Display'
        },
        {
            name: 'Midnight Luxury',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
            qrColor: '#FFD700',
            qrBgColor: '#102027',
            text1Color: '#FFD700',
            text2Color: '#ECEFF1',
            dotType: 'classy',
            cornerSquareType: 'square',
            cornerDotType: 'square',
            fontFamily: 'Outfit'
        },
        {
            name: 'Cyberpunk Neon',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #f72585 0%, #7209b7 50%, #3f37c9 100%)',
            qrColor: '#4CC9F0',
            qrBgColor: '#12061C',
            text1Color: '#4CC9F0',
            text2Color: '#F72585',
            dotType: 'dots',
            cornerSquareType: 'dot',
            cornerDotType: 'dot',
            fontFamily: 'Inter'
        },
        {
            name: 'Organic Terra',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #D4A373 0%, #E9D8A6 60%, #FEFAE0 100%)',
            qrColor: '#556B2F',
            qrBgColor: 'transparent',
            text1Color: '#432818',
            text2Color: '#556B2F',
            dotType: 'extra-rounded',
            cornerSquareType: 'extra-rounded',
            cornerDotType: 'dot',
            fontFamily: 'Poppins'
        },
        {
            name: 'Bubblegum Pop',
            bgType: 'Image',
            bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
            qrColor: '#D81B60',
            qrBgColor: '#ffffff',
            text1Color: '#880E4F',
            text2Color: '#D81B60',
            dotType: 'rounded',
            cornerSquareType: 'extra-rounded',
            cornerDotType: 'dot',
            fontFamily: 'Montserrat'
        },
        {
            name: 'Urban Brick',
            bgType: 'Image',
            bgImage: 'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=800&q=80',
            qrColor: '#1A237E',
            qrBgColor: '#ffffff',
            text1Color: '#1A237E',
            text2Color: '#B71C1C',
            dotType: 'square',
            cornerSquareType: 'square',
            cornerDotType: 'square',
            fontFamily: 'Outfit'
        },
        {
            name: 'Lavender Dream',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            qrColor: '#E0F7FA',
            qrBgColor: '#311B92',
            text1Color: '#FFFFFF',
            text2Color: '#E1BEE7',
            dotType: 'classy-rounded',
            cornerSquareType: 'dot',
            cornerDotType: 'dot',
            fontFamily: 'Playfair Display'
        }
    ];

    const applyPosterTemplate = (tpl, idx) => {
        setSelectedTemplateIdx(idx);
        setQrBgType(tpl.bgType);
        if (tpl.bgType === 'Color') {
            setCustomBgColor(tpl.bgColor);
            setQrBgImage(null);
        } else {
            setQrBgImage(tpl.bgImage);
            setQrBgOpacity(100);
            setQrBgFit('Fill');
        }
        setQrColor(tpl.qrColor);
        setQrBgColor(tpl.qrBgColor);
        setText1Color(tpl.text1Color);
        setText2Color(tpl.text2Color);
        setQrDotType(tpl.dotType);
        setQrCornerSquareType(tpl.cornerSquareType);
        setQrCornerDotType(tpl.cornerDotType);
        if (tpl.fontFamily) {
            setText1FontFamily(tpl.fontFamily);
            setText2FontFamily(tpl.fontFamily);
        }
    };

    const downloadQRCode = async () => {
        if (!isEditingQR) {
            // Main Share View: Download only the QR code
            try {
                if (mainQrRef.current) {
                    mainQrRef.current.download({
                        name: `${currentBook?.flipbookName?.replace(/\s+/g, '-') || 'share'}-qr`,
                        extension: 'png'
                    });
                } else {
                    console.warn('mainQrRef.current is not available');
                }
            } catch (error) {
                console.error('Error downloading QR code:', error);
            }
            return;
        }

        // Edit QR Poster view
        if (!posterPreviewRef.current || isDownloading) return;
        
        setIsDownloading(true);
        try {
            // Get actual pixel dimensions of the preview card
            const rect = posterPreviewRef.current.getBoundingClientRect();
            const width = rect.width || 400; // fallback if 0
            const height = rect.height || 600; // fallback if 0

            // Render the entire customized poster element to a high-resolution canvas
            const canvas = await html2canvas(posterPreviewRef.current, {
                useCORS: true,
                allowTaint: false, // set to false to avoid crash if some assets don't support CORS
                scale: 3, // 3x scale up for razor-sharp high-resolution print export
                backgroundColor: null,
                logging: false,
                width: width,
                height: height,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('poster-preview-container');
                    if (clonedElement) {
                        clonedElement.style.width = `${width}px`;
                        clonedElement.style.height = `${height}px`;
                    }
                    
                    // Replace SVG with an Image element containing the serialized SVG data
                    const originalSvg = posterPreviewRef.current.querySelector('svg');
                    const clonedSvg = clonedDoc.querySelector('svg');
                    if (originalSvg && clonedSvg) {
                        try {
                            const svgString = new XMLSerializer().serializeToString(originalSvg);
                            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
                            
                            const img = clonedDoc.createElement('img');
                            img.src = svgDataUrl;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.display = 'block';
                            if (clonedSvg.className) img.className = clonedSvg.className;
                            
                            clonedSvg.parentNode.replaceChild(img, clonedSvg);
                        } catch (svgErr) {
                            console.error('Error serializing SVG for export:', svgErr);
                        }
                    }
                    
                    // Explicitly copy canvas content from original DOM to cloned DOM
                    const originalCanvases = posterPreviewRef.current.querySelectorAll('canvas');
                    const clonedCanvases = clonedDoc.querySelectorAll('canvas');
                    originalCanvases.forEach((origCanvas, index) => {
                        const destCanvas = clonedCanvases[index];
                        if (destCanvas) {
                            const destCtx = destCanvas.getContext('2d');
                            destCanvas.width = origCanvas.width;
                            destCanvas.height = origCanvas.height;
                            destCtx.drawImage(origCanvas, 0, 0);
                        }
                    });
                }
            });
            
            const format = exportFormat.toLowerCase();
            const fileExt = format === 'jpeg' || format === 'jpg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';
            const mimeType = fileExt === 'jpg' ? 'image/jpeg' : fileExt === 'webp' ? 'image/webp' : 'image/png';
            
            const dataUrl = canvas.toDataURL(mimeType, 1.0);
            const link = document.createElement('a');
            link.download = `${currentBook?.flipbookName?.replace(/\s+/g, '-') || 'share'}-poster.${fileExt}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting poster image:', error);
            alert('Error generating poster image: ' + error.message);
        } finally {
            setIsDownloading(false);
        }
    };

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
            <div className="relative bg-white w-[52vw] rounded-[1vw] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
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
                <div className="p-[1.2vw] pt-[0.8vw] flex flex-col gap-[1.2vw]">
                    {!isEditingQR ? (
                        <div className="flex gap-[1.5vw]">
                            {/* Left Column: Preview */}
                            <div className="flex-[1.1] flex flex-col">
                                <div className="relative rounded-[1vw] overflow-hidden shadow-lg aspect-square bg-gray-100">
                                    {currentBook?.firstPageHtml ? (
                                        <>
                                            <style dangerouslySetInnerHTML={{ __html: `
                                                .svg-preview-container svg {
                                                    max-width: 100%;
                                                    max-height: 100%;
                                                    width: auto !important;
                                                    height: auto !important;
                                                    box-shadow: 0 0.4vw 1.2vw rgba(0, 0, 0, 0.08);
                                                    border-radius: 0.4vw;
                                                    background: #ffffff;
                                                    display: block;
                                                }
                                            `}} />
                                            <div 
                                                className="w-full h-full p-[0.8vw] flex items-center justify-center svg-preview-container"
                                                dangerouslySetInnerHTML={{ __html: currentBook.firstPageHtml }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: '#ffffff'
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <img 
                                            src={flipbookThumbnail || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80"} 
                                            alt="Flipbook Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
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
                                            ref={qrRef}
                                            className="relative w-[4.1vw] h-[4.1vw] bg-gray-100 rounded-[0.4vw] overflow-hidden border border-gray-200 group cursor-pointer shadow-sm flex items-center justify-center"
                                            onClick={() => setIsEditingQR(true)}
                                        >
                                            <CustomQRCode 
                                                ref={mainQrRef}
                                                value={publicUrl}
                                                size={128}
                                                fgColor={qrColor}
                                                bgColor={qrBgColor}
                                                dotType={qrDotType}
                                                cornerSquareType={qrCornerSquareType}
                                                cornerDotType={qrCornerDotType}
                                                level={qrLevel}
                                                style={{ width: '100%', height: '100%', padding: '0.3vw' }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 size="0.8vw" className="text-white" />
                                                <span className="text-white text-[0.5vw] font-bold mt-[0.1vw]">Edit</span>
                                            </div>
                                        </div>
                                        <div 
                                            className="flex items-center gap-[0.4vw] text-gray-400 group cursor-pointer hover:text-gray-600 transition-colors"
                                            onClick={downloadQRCode}
                                        >
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
                                <div 
                                    ref={posterPreviewRef} 
                                    id="poster-preview-container" 
                                    className="relative w-full h-[25vw] rounded-[1vw] border-[0.1vw] border-[#A5D6A7] p-[1.5vw] flex flex-col items-center shadow-sm overflow-hidden ml-[0.5vw] bg-white"
                                >
                                    {/* High Quality Exporting Overlay */}
                                    {isDownloading && (
                                        <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-[0.6vw] animate-in fade-in duration-200 pointer-events-auto">
                                            <div className="bg-[#4A3AFF]/10 p-[0.8vw] rounded-full">
                                                <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-[1.8vw] h-[1.8vw]" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[0.8vw] font-black text-gray-800 tracking-tight">Generating HD Poster</p>
                                                <p className="text-[0.6vw] text-gray-500 font-bold mt-[0.1vw]">Applying 3x upscale render...</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Color Background Layer (Bottom) */}
                                    <div 
                                        className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
                                        style={{
                                            backgroundColor: !customBgColor.includes('gradient') ? customBgColor : 'transparent',
                                            backgroundImage: customBgColor.includes('gradient') ? customBgColor : 'none',
                                        }}
                                    />
                                    
                                    {/* Image Background Layer (Top - rendered with dynamic opacity over the color layer) */}
                                    {qrBgType === 'Image' && qrBgImage && (
                                        <img 
                                            src={qrBgImage.startsWith('data:') ? qrBgImage : `${qrBgImage}${qrBgImage.includes('?') ? '&' : '?'}cors=1`}
                                            crossOrigin="anonymous"
                                            className="absolute inset-0 pointer-events-none transition-all duration-300 z-[1]"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: qrBgFit === 'Fit' ? 'contain' : qrBgFit === 'Fill' ? 'cover' : 'fill',
                                                opacity: qrBgOpacity / 100,
                                            }}
                                        />
                                    )}
                                    
                                    {/* Top Text */}
                                    <div className="text-center mb-[2vw] shrink-0 relative z-10">
                                        <h3 
                                            className="text-center tracking-tight font-black"
                                            style={{
                                                fontFamily: text1FontFamily,
                                                fontSize: typeof text1FontSize === 'number' ? `${text1FontSize / 15}vw` : '1.6vw',
                                                fontWeight: text1Bold ? (text1FontWeight === 'Regular' ? '400' : text1FontWeight === 'Medium' ? '500' : text1FontWeight === 'Semi Bold' ? '600' : text1FontWeight === 'Bold' ? '700' : '900') : '400',
                                                letterSpacing: text1LetterSpacing === 'Auto' ? 'normal' : `${text1LetterSpacing}px`,
                                                lineHeight: text1LineHeight === 'Auto' ? '1.1' : text1LineHeight,
                                                textAlign: text1Align,
                                                color: text1Color,
                                                opacity: text1ColorOpacity / 100,
                                                fontStyle: text1Italic ? 'italic' : 'normal',
                                                textDecoration: text1Underline ? 'underline' : 'none',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {text1}
                                        </h3>
                                    </div>
                                    
                                    {/* QR Code Area */}
                                    <div className="flex-1 flex flex-col items-center justify-start w-full relative min-h-0 z-10">
                                        <span 
                                            className="mb-[1.5vw] uppercase text-center font-bold"
                                            style={{
                                                fontFamily: text2FontFamily,
                                                fontSize: typeof text2FontSize === 'number' ? `${text2FontSize / 15}vw` : '0.7vw',
                                                fontWeight: text2Bold ? (text2FontWeight === 'Regular' ? '400' : text2FontWeight === 'Medium' ? '500' : text2FontWeight === 'Semi Bold' ? '600' : text2FontWeight === 'Bold' ? '700' : '900') : '400',
                                                letterSpacing: text2LetterSpacing === 'Auto' ? '0.2em' : `${text2LetterSpacing}px`,
                                                lineHeight: text2LineHeight === 'Auto' ? 'normal' : text2LineHeight,
                                                textAlign: text2Align,
                                                color: text2Color,
                                                opacity: text2ColorOpacity / 100,
                                                fontStyle: text2Italic ? 'italic' : 'normal',
                                                textDecoration: text2Underline ? 'underline' : 'none',
                                            }}
                                        >
                                            {text2}
                                        </span>
                                        
                                        <div className="relative p-[1.2vw] shrink-0">
                                            {/* Decorative Corners */}
                                            <div 
                                                className="absolute top-0 left-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-l-[3px] rounded-tl-[0.8vw]" 
                                                style={{ borderColor: qrColor }}
                                            />
                                            <div 
                                                className="absolute top-0 right-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-r-[3px] rounded-tr-[0.8vw]" 
                                                style={{ borderColor: qrColor }}
                                            />
                                            <div 
                                                className="absolute bottom-0 left-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-l-[3px] rounded-bl-[0.8vw]" 
                                                style={{ borderColor: qrColor }}
                                            />
                                            <div 
                                                className="absolute bottom-0 right-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-r-[3px] rounded-br-[0.8vw]" 
                                                style={{ borderColor: qrColor }}
                                            />
                                            
                                            {/* The QR Code - Styled to match image (no background box) */}
                                            <div className="flex items-center justify-center relative">
                                                <CustomQRCode 
                                                    value={publicUrl}
                                                    size={300}
                                                    fgColor={qrColor}
                                                    bgColor={qrBgColor === '#ffffff' ? 'transparent' : qrBgColor}
                                                    dotType={qrDotType}
                                                    cornerSquareType={qrCornerSquareType}
                                                    cornerDotType={qrCornerDotType}
                                                    level={qrLevel}
                                                    logo={qrLogo}
                                                    style={{ width: '10vw', height: '10vw' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Templates & Customize */}
                            <div className="flex-[1.25] flex flex-col gap-[1vw] h-[25vw]">
                                <div className="flex-1 flex flex-col bg-gray-100 rounded-[1vw] border border-gray-200 shadow-sm relative">
                                    {/* Tabs Header */}
                                    <div className="flex bg-gray-200/90 border-b border-gray-300 shrink-0 rounded-t-[1vw]">
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
                                                    {posterTemplates.map((tpl, idx) => (
                                                        <button 
                                                            key={idx} 
                                                            onClick={() => applyPosterTemplate(tpl, idx)}
                                                            className={`aspect-[3/4] rounded-[0.8vw] overflow-hidden cursor-pointer active:scale-98 transition-all group relative w-full text-left outline-none flex flex-col items-center justify-between p-[0.6vw] ${
                                                                selectedTemplateIdx === idx 
                                                                    ? 'border-[0.18vw] border-[#4A3AFF] shadow-lg ring-[0.1vw] ring-[#4A3AFF]/20 scale-[1.02]' 
                                                                    : 'border border-gray-200 hover:border-[#4A3AFF]/80 hover:shadow-sm'
                                                            }`}
                                                            style={tpl.bgType === 'Color' ? { background: tpl.bgColor } : {}}
                                                        >
                                                            {tpl.bgType === 'Image' && (
                                                                <img 
                                                                    src={tpl.bgImage} 
                                                                    alt={tpl.name} 
                                                                    className="absolute inset-0 w-full h-full object-cover" 
                                                                />
                                                            )}
                                                            {/* Dark glass overlay for image background readability */}
                                                            {tpl.bgType === 'Image' && <div className="absolute inset-0 bg-black/10" />}
                                                            
                                                            {/* Active Template Floating Checkmark Badge */}
                                                            {selectedTemplateIdx === idx && (
                                                                <div className="absolute top-[0.4vw] right-[0.4vw] bg-[#4A3AFF] text-white w-[1.2vw] h-[1.2vw] rounded-full flex items-center justify-center shadow-md z-30 border border-white/30 animate-in zoom-in-50 duration-150">
                                                                    <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-white" strokeWidth={4} />
                                                                </div>
                                                            )}
                                                            
                                                            {/* Mini Poster Content */}
                                                            <div className="relative w-full h-full flex flex-col items-center justify-between z-10 select-none pointer-events-none">
                                                                {/* Mini Title */}
                                                                <div className="text-center w-full leading-tight mt-[0.1vw]">
                                                                    <p 
                                                                        style={{ color: tpl.text1Color, fontFamily: tpl.fontFamily }} 
                                                                        className="text-[0.4vw] font-black tracking-tight uppercase line-clamp-1"
                                                                    >
                                                                        {text1 || 'ACCEPTING NEW CLIENTS'}
                                                                    </p>
                                                                </div>
                                                                
                                                                {/* Mini QR Area */}
                                                                <div className="flex flex-col items-center justify-center relative my-auto p-[0.3vw]">
                                                                    {/* Decorative L-Corners in Mini */}
                                                                    <div className="absolute top-0 left-0 w-[0.4vw] h-[0.4vw] border-t-[1px] border-l-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    <div className="absolute top-0 right-0 w-[0.4vw] h-[0.4vw] border-t-[1px] border-r-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    <div className="absolute bottom-0 left-0 w-[0.4vw] h-[0.4vw] border-b-[1px] border-l-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    <div className="absolute bottom-0 right-0 w-[0.4vw] h-[0.4vw] border-b-[1px] border-r-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    
                                                                    {/* Stylized QR Code Icon */}
                                                                    <div 
                                                                        className="w-[1.6vw] h-[1.6vw] flex flex-col justify-between p-[0.1vw] rounded-[0.1vw]" 
                                                                        style={{ color: tpl.qrColor }}
                                                                    >
                                                                        <Icon icon="lucide:qr-code" className="w-full h-full" style={{ color: tpl.qrColor }} />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Mini Subtitle */}
                                                                <div className="text-center w-full leading-none mb-[1.2vw]">
                                                                    <p 
                                                                        style={{ color: tpl.text2Color, fontFamily: tpl.fontFamily }} 
                                                                        className="text-[0.28vw] font-bold tracking-widest uppercase truncate"
                                                                    >
                                                                        {text2 || 'TAP TO SCAN'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Template Name Capsule Badge */}
                                                            <div className="absolute bottom-[0.4vw] left-[0.4vw] bg-[#2D3139]/80 rounded-[0.25vw] px-[0.4vw] py-[0.15vw] max-w-[85%] flex items-center shadow-md z-20">
                                                                <p className="text-[0.45vw] font-bold text-white tracking-wider truncate uppercase whitespace-nowrap leading-none">
                                                                    {tpl.name}
                                                                </p>
                                                            </div>
                                                        </button>
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
                                                                        <input 
                                                                            type="number" 
                                                                            value={qrWidth} 
                                                                            onChange={(e) => setQrWidth(parseInt(e.target.value) || 0)}
                                                                            className="w-[3vw] text-center text-[0.8vw] font-semibold text-gray-700 outline-none no-spin" 
                                                                        />
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setQrWidth(prev => prev + 10)}
                                                                        className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"
                                                                    >
                                                                        <ChevronRight size="0.9vw" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-[0.4vw]">
                                                                <span className="text-[0.7vw] font-medium text-gray-500 uppercase whitespace-nowrap">h :</span>
                                                                <div className="flex items-center gap-[0.3vw]">
                                                                    <button 
                                                                        onClick={() => setQrHeight(prev => Math.max(0, prev - 10))}
                                                                        className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"
                                                                    >
                                                                        <ChevronLeft size="0.9vw" />
                                                                    </button>
                                                                    <div className="flex items-center border border-gray-300 rounded-[0.4vw] px-[0.4vw] py-[0.15vw] bg-white">
                                                                        <input 
                                                                            type="number" 
                                                                            value={qrHeight} 
                                                                            onChange={(e) => setQrHeight(parseInt(e.target.value) || 0)}
                                                                            className="w-[3vw] text-center text-[0.8vw] font-semibold text-gray-700 outline-none no-spin" 
                                                                        />
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setQrHeight(prev => prev + 10)}
                                                                        className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"
                                                                    >
                                                                        <ChevronRight size="0.9vw" />
                                                                    </button>
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
                                                                        value={text1}
                                                                        onChange={(e) => setText1(e.target.value)}
                                                                    />
                                                                    <Edit3 size="0.8vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400" />
                                                                </div>
                                                                <button 
                                                                    onClick={() => setActiveTextEditor(activeTextEditor === 'text1' ? null : 'text1')}
                                                                    className={`p-[0.4vw] rounded-[0.4vw] transition-colors cursor-pointer ${activeTextEditor === 'text1' ? 'bg-[#4A3AFF] text-white hover:bg-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                                                                >
                                                                    <Sliders size="1vw" />
                                                                </button>
                                                            </div>
                                                        </div>
 
                                                        <div className="flex items-start gap-[0.5vw] min-w-0">
                                                            <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Enter Text 2 :</span>
                                                            <div className="flex-1 flex items-center gap-[0.5vw]">
                                                                <div className="flex-1 relative">
                                                                    <textarea 
                                                                        className="w-full px-[0.8vw] py-[0.6vw] border border-gray-400 rounded-[0.6vw] text-[0.8vw] font-medium text-gray-700 outline-none focus:border-black transition-colors pr-[2.2vw] resize-none h-[4vw]"
                                                                        placeholder="Supporting Text"
                                                                        value={text2}
                                                                        onChange={(e) => setText2(e.target.value)}
                                                                    />
                                                                    <Edit3 size="0.8vw" className="absolute right-[0.6vw] bottom-[0.6vw] text-gray-400" />
                                                                </div>
                                                                <button 
                                                                    onClick={() => setActiveTextEditor(activeTextEditor === 'text2' ? null : 'text2')}
                                                                    className={`p-[0.4vw] rounded-[0.4vw] transition-colors cursor-pointer ${activeTextEditor === 'text2' ? 'bg-[#4A3AFF] text-white hover:bg-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                                                                >
                                                                    <Sliders size="1vw" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Edit QR Code */}
                                                    <div className="flex items-start gap-[0.5vw] min-w-0">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Edit QR Code :</span>
                                                        <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0">
                                                            <div className="bg-white border border-gray-200 rounded-[0.8vw] p-[0.8vw] flex gap-[1vw] relative overflow-hidden shadow-sm">
                                                                <div 
                                                                    ref={qrRef}
                                                                    className="w-[10.5vw] h-[10.5vw] bg-gray-100 rounded-[0.5vw] flex items-center justify-center relative group shrink-0"
                                                                >
                                                                    <CustomQRCode 
                                                                        value={publicUrl}
                                                                        size={256}
                                                                        fgColor={qrColor}
                                                                        bgColor={qrBgColor}
                                                                        dotType={qrDotType}
                                                                        cornerSquareType={qrCornerSquareType}
                                                                        cornerDotType={qrCornerDotType}
                                                                        level={qrLevel}
                                                                        style={{ width: '100%', height: '100%', padding: '0.8vw' }}
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                                        <div className="bg-white/90 backdrop-blur-sm px-[0.6vw] py-[0.3vw] rounded-[0.4vw] flex items-center gap-[0.3vw] shadow-sm border border-gray-100">
                                                                            <Icon icon="ri:loop-left-line" className="text-[0.8vw]" />
                                                                            <span className="text-[0.7vw] font-bold">Theme</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-2 gap-[0.5vw] min-w-0 h-[10.5vw] overflow-hidden pr-[0.4vw] content-start">
                                                                    {qrThemes.map((theme, i) => (
                                                                        <div 
                                                                            key={i} 
                                                                            onClick={() => {
                                                                                setQrColor(theme.fg);
                                                                                setQrBgColor(theme.bg);
                                                                                setQrDotType(theme.dotType || 'square');
                                                                                setQrCornerSquareType(theme.cornerSquareType || 'square');
                                                                                setQrCornerDotType(theme.cornerDotType || 'square');
                                                                            }}
                                                                            className="w-full h-[3.1vw] bg-white border border-gray-200 rounded-[0.5vw] cursor-pointer flex items-center justify-center p-[0.32vw] shadow-sm hover:border-[#4A3AFF] transition-all"
                                                                        >
                                                                            <CustomQRCode 
                                                                                value="1"
                                                                                size={64}
                                                                                fgColor={theme.fg}
                                                                                bgColor={theme.bg}
                                                                                dotType={theme.dotType || 'square'}
                                                                                cornerSquareType={theme.cornerSquareType || 'square'}
                                                                                cornerDotType={theme.cornerDotType || 'square'}
                                                                                level="L"
                                                                                style={{ width: '100%', height: '100%' }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* QR Colors (Now under Edit QR Code) */}
                                                            <div className="flex flex-col gap-[0.8vw] mt-[0.2vw]">
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">QR Color :</span>
                                                                    <div className="flex-1 flex items-center gap-[0.5vw] min-w-0 relative">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setShowQrColorPicker(!showQrColorPicker);
                                                                                setShowQrBgColorPicker(false);
                                                                            }}
                                                                            className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 outline-none"
                                                                            style={{ backgroundColor: qrColor }}
                                                                        />
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm min-w-0">
                                                                            <input 
                                                                                type="text" 
                                                                                value={qrColor} 
                                                                                onChange={(e) => setQrColor(e.target.value)}
                                                                                onClick={() => {
                                                                                    setShowQrColorPicker(true);
                                                                                    setShowQrBgColorPicker(false);
                                                                                }}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none min-w-0 cursor-pointer"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100 shrink-0">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">BG Color :</span>
                                                                    <div className="flex-1 flex items-center gap-[0.5vw] min-w-0 relative">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setShowQrBgColorPicker(!showQrBgColorPicker);
                                                                                setShowQrColorPicker(false);
                                                                            }}
                                                                            className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 outline-none"
                                                                            style={{ backgroundColor: qrBgColor === 'transparent' ? '#ffffff' : qrBgColor }}
                                                                        />
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm min-w-0">
                                                                            <input 
                                                                                type="text" 
                                                                                value={qrBgColor} 
                                                                                onChange={(e) => setQrBgColor(e.target.value)}
                                                                                onClick={() => {
                                                                                    setShowQrBgColorPicker(true);
                                                                                    setShowQrColorPicker(false);
                                                                                }}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none min-w-0 cursor-pointer"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100 shrink-0">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">QR Level :</span>
                                                                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-[0.6vw] p-[0.3vw] gap-[0.3vw] shadow-sm min-w-0">
                                                                        {[
                                                                            { label: 'Low', value: 'L' },
                                                                            { label: 'Medium', value: 'M' },
                                                                            { label: 'High', value: 'H' }
                                                                        ].map((level) => (
                                                                            <button
                                                                                key={level.value}
                                                                                onClick={() => setQrLevel(level.value)}
                                                                                className={`flex-1 px-[1vw] py-[0.3vw] rounded-[0.4vw] text-[0.75vw] cursor-pointer font-semibold transition-all ${qrLevel === level.value ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                                                            >
                                                                                {level.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Dot Style Selection */}
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">Dot Style :</span>
                                                                    <div className="flex-1 relative">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setShowDotTypeDropdown(!showDotTypeDropdown);
                                                                                setShowCornerSquareTypeDropdown(false);
                                                                                setShowCornerDotTypeDropdown(false);
                                                                            }}
                                                                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                                                                        >
                                                                            <span className="capitalize">{qrDotType.replace('-', ' ')}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showDotTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {showDotTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowDotTypeDropdown(false)} />
                                                                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] max-h-[12vw] overflow-y-auto custom-scrollbar">
                                                                                    {['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrDotType(type);
                                                                                                setShowDotTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrDotType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type.replace('-', ' ')}
                                                                                            {qrDotType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Eye Frame Style Selection */}
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">Eye Frame :</span>
                                                                    <div className="flex-1 relative">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setShowCornerSquareTypeDropdown(!showCornerSquareTypeDropdown);
                                                                                setShowDotTypeDropdown(false);
                                                                                setShowCornerDotTypeDropdown(false);
                                                                            }}
                                                                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                                                                        >
                                                                            <span className="capitalize">{qrCornerSquareType.replace('-', ' ')}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showCornerSquareTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {showCornerSquareTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowCornerSquareTypeDropdown(false)} />
                                                                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]">
                                                                                    {['square', 'dot', 'extra-rounded'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrCornerSquareType(type);
                                                                                                setShowCornerSquareTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrCornerSquareType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type.replace('-', ' ')}
                                                                                            {qrCornerSquareType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Eye Ball Style Selection */}
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">Eye Ball :</span>
                                                                    <div className="flex-1 relative">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setShowCornerDotTypeDropdown(!showCornerDotTypeDropdown);
                                                                                setShowDotTypeDropdown(false);
                                                                                setShowCornerSquareTypeDropdown(false);
                                                                            }}
                                                                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                                                                        >
                                                                            <span className="capitalize">{qrCornerDotType.replace('-', ' ')}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showCornerDotTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {showCornerDotTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowCornerDotTypeDropdown(false)} />
                                                                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]">
                                                                                    {['square', 'dot'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrCornerDotType(type);
                                                                                                setShowCornerDotTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrCornerDotType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type.replace('-', ' ')}
                                                                                            {qrCornerDotType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-start gap-[0.5vw] min-w-0 mt-[0.2vw]">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0 mt-[0.4vw]">Add Logo :</span>
                                                                    <div className="flex-1 flex flex-col items-center gap-[0.4vw]">
                                                                        <label className="w-full h-[4.5vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden">
                                                                            <input 
                                                                                type="file" 
                                                                                className="hidden" 
                                                                                accept="image/*"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        const reader = new FileReader();
                                                                                        reader.onloadend = () => {
                                                                                            setQrLogo(reader.result);
                                                                                        };
                                                                                        reader.readAsDataURL(file);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {qrLogo ? (
                                                                                <div className="absolute inset-0 flex items-center justify-center bg-white p-[0.3vw]">
                                                                                    <img 
                                                                                        src={qrLogo} 
                                                                                        alt="Logo Preview" 
                                                                                        className="h-full object-contain"
                                                                                    />
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setQrLogo(null);
                                                                                        }}
                                                                                        className="absolute top-[0.2vw] right-[0.2vw] p-[0.2vw] bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors z-10"
                                                                                    >
                                                                                        <X size="0.6vw" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center pointer-events-none">
                                                                                    <p className="text-[0.55vw] font-medium text-gray-500">Drag & Drop or <span className="text-blue-600">Upload</span></p>
                                                                                    <Upload size="0.9vw" className="text-gray-400 group-hover:text-gray-600 transition-colors mt-[0.2vw]" />
                                                                                    <p className="text-[0.5vw] text-gray-400 mt-[0.2vw]">Supported File Format : JPG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </label>
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
                                                                                    {['Color', 'Image'].map((type) => (
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
                                                                        <label className="w-full h-[6vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden mt-[0.2vw]">
                                                                            <input 
                                                                                type="file" 
                                                                                accept="image/*" 
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files[0];
                                                                                    if (file) {
                                                                                        setQrBgImage(URL.createObjectURL(file));
                                                                                    }
                                                                                }}
                                                                                className="hidden" 
                                                                            />
                                                                            {qrBgImage ? (
                                                                                <div className="w-full h-full relative">
                                                                                    <img src={qrBgImage} className="w-full h-full object-cover" alt="Background preview" />
                                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                        <p className="text-[0.6vw] font-semibold text-white">Change Image</p>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center pointer-events-none">
                                                                                    <Upload size="1.2vw" className="text-gray-400 group-hover:text-[#4A3AFF] transition-colors" />
                                                                                    <p className="text-[0.6vw] font-medium text-gray-500 mt-[0.3vw]">Drag & Drop or <span className="text-[#4A3AFF]">Upload</span></p>
                                                                                    <p className="text-[0.5vw] text-gray-400 mt-[0.1vw]">Supported File Format : JPG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </label>

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

                                                                {qrBgType === 'Color' && (
                                                                    <div className="flex items-center gap-[0.6vw] mt-[0.2vw] relative">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setShowCustomBgColorPicker(!showCustomBgColorPicker);
                                                                                setShowQrColorPicker(false);
                                                                                setShowQrBgColorPicker(false);
                                                                            }}
                                                                            className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 outline-none animate-in fade-in duration-200"
                                                                            style={{ background: customBgColor }}
                                                                        />
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm">
                                                                            <input 
                                                                                type="text" 
                                                                                value={customBgColor} 
                                                                                onChange={(e) => setCustomBgColor(e.target.value)}
                                                                                onClick={() => {
                                                                                    setShowCustomBgColorPicker(true);
                                                                                    setShowQrColorPicker(false);
                                                                                    setShowQrBgColorPicker(false);
                                                                                }}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none cursor-pointer font-mono"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100">100%</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Floating Color Pickers (Rendered at Right Column level to prevent overflow clipping) */}
                                    {showQrColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[990] cursor-default" onClick={() => setShowQrColorPicker(false)} />
                                            <div className="absolute left-[-4vw] top-[2.2vw] z-[999] animate-in fade-in zoom-in-95 duration-200">
                                                <ColorPicker 
                                                    color={qrColor}
                                                    onChange={(hex) => setQrColor(hex)}
                                                    opacity={100}
                                                    onClose={() => setShowQrColorPicker(false)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {showQrBgColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[990] cursor-default" onClick={() => setShowQrBgColorPicker(false)} />
                                            <div className="absolute left-[-4vw] top-[4.8vw] z-[999] animate-in fade-in zoom-in-95 duration-200">
                                                <ColorPicker 
                                                    color={qrBgColor === 'transparent' ? '#ffffff' : qrBgColor}
                                                    onChange={(hex) => setQrBgColor(hex)}
                                                    opacity={100}
                                                    onClose={() => setShowQrBgColorPicker(false)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {showCustomBgColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[990] cursor-default" onClick={() => setShowCustomBgColorPicker(false)} />
                                            <div className="absolute left-[calc(100%+1.5vw)] top-[0vw] z-[999] animate-in fade-in zoom-in-95 duration-200">
                                                <TemplateColorPicker 
                                                    color={customBgColor}
                                                    onChange={(val) => setCustomBgColor(val)}
                                                    opacity={qrBgOpacity}
                                                    onOpacityChange={(op) => setQrBgOpacity(op)}
                                                    onClose={() => setShowCustomBgColorPicker(false)}
                                                />
                                            </div>
                                        </>
                                    )}
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
                                             <button 
                                                 onClick={downloadQRCode}
                                                 disabled={isDownloading}
                                                 className={`flex-1 py-[0.7vw] px-[0.5vw] font-bold text-[0.8vw] flex items-center justify-center gap-[0.5vw] whitespace-nowrap transition-colors ${
                                                     isDownloading 
                                                         ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                                         : 'text-gray-700 cursor-pointer hover:bg-gray-50'
                                                 }`}
                                             >
                                                 {isDownloading ? (
                                                     <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-[0.9vw] h-[0.9vw] shrink-0" />
                                                 ) : (
                                                     <Download size="0.9vw" className="text-gray-400 shrink-0" />
                                                 )}
                                                 <span className="truncate">
                                                     {isDownloading ? 'Generating...' : `Export as ${exportFormat}`}
                                                 </span>
                                             </button>
                                             <div className="w-[1px] h-[1vw] bg-gray-200 shrink-0" />
                                             <button 
                                                 onClick={() => !isDownloading && setShowExportDropdown(!showExportDropdown)}
                                                 disabled={isDownloading}
                                                 className={`px-[0.6vw] py-[0.7vw] transition-all shrink-0 ${
                                                     isDownloading 
                                                         ? 'bg-gray-50 cursor-not-allowed opacity-50' 
                                                         : showExportDropdown ? 'bg-gray-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                                                 }`}
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

                {/* Typography Editor Popup floating on the right */}
                {activeTextEditor && (() => {
                    const isT1 = activeTextEditor === 'text1';
                    const fontFamily = isT1 ? text1FontFamily : text2FontFamily;
                    const setFontFamily = isT1 ? setText1FontFamily : setText2FontFamily;
                    const fontSize = isT1 ? text1FontSize : text2FontSize;
                    const setFontSize = isT1 ? setText1FontSize : setText2FontSize;
                    const fontWeight = isT1 ? text1FontWeight : text2FontWeight;
                    const setFontWeight = isT1 ? setText1FontWeight : setText2FontWeight;
                    const letterSpacing = isT1 ? text1LetterSpacing : text2LetterSpacing;
                    const setLetterSpacing = isT1 ? setText1LetterSpacing : setText2LetterSpacing;
                    const lineHeight = isT1 ? text1LineHeight : text2LineHeight;
                    const setLineHeight = isT1 ? setText1LineHeight : setText2LineHeight;
                    const align = isT1 ? text1Align : text2Align;
                    const setAlign = isT1 ? setText1Align : setText2Align;
                    const bold = isT1 ? text1Bold : text2Bold;
                    const setBold = isT1 ? setText1Bold : setText2Bold;
                    const italic = isT1 ? text1Italic : text2Italic;
                    const setItalic = isT1 ? setText1Italic : setText2Italic;
                    const underline = isT1 ? text1Underline : text2Underline;
                    const setUnderline = isT1 ? setText1Underline : setText2Underline;
                    const color = isT1 ? text1Color : text2Color;
                    const setColor = isT1 ? setText1Color : setText2Color;
                    const opacity = isT1 ? text1ColorOpacity : text2ColorOpacity;
                    const setOpacity = isT1 ? setText1ColorOpacity : setText2ColorOpacity;

                    const fontFamilies = ['Poppins', 'Inter', 'Roboto', 'Outfit', 'Montserrat', 'Playfair Display'];
                    const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64];
                    const fontWeights = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Black'];

                    return (
                        <div className="absolute top-[1.2vw] left-[calc(100%+1vw)] z-[70] w-[21vw] bg-white border border-gray-200 rounded-[1.2vw] shadow-2xl p-[1.2vw] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-[1vw]">
                            <style dangerouslySetInnerHTML={{ __html: `
                                .typography-color-picker > div:first-child > div:first-child > *:first-child {
                                    display: none !important;
                                }
                                .typography-color-picker > div:first-child > div:first-child::before {
                                    content: "Text Color";
                                    font-size: 0.85vw;
                                    font-weight: 600;
                                    color: #111827;
                                    font-family: inherit;
                                }
                            ` }} />
                            {/* Typography Header */}
                            <div className="flex items-center justify-between gap-[0.5vw]">
                                <span className="font-bold text-[0.85vw] text-gray-900 shrink-0">Typography</span>
                                <div className="flex-1 h-[1px] bg-gray-200" />
                                <button 
                                    onClick={() => {
                                        setActiveTextEditor(null);
                                        setShowFontFamilyDropdown(false);
                                        setShowFontSizeDropdown(false);
                                        setShowFontWeightDropdown(false);
                                        setShowLetterSpacingSlider(false);
                                        setShowLineHeightSlider(false);
                                    }}
                                    className="p-[0.2vw] rounded-full hover:bg-gray-100 transition-colors text-red-500 cursor-pointer"
                                >
                                    <X size="0.9vw" />
                                </button>
                            </div>
 
                            {/* Row 1: Font Family & Size */}
                            <div className="flex items-center gap-[0.6vw] relative">
                                {/* Font Family Selector */}
                                <div className="relative flex-1">
                                    <button 
                                        onClick={() => {
                                            setShowFontFamilyDropdown(!showFontFamilyDropdown);
                                            setShowFontSizeDropdown(false);
                                            setShowFontWeightDropdown(false);
                                            setShowLetterSpacingSlider(false);
                                            setShowLineHeightSlider(false);
                                        }}
                                        className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                                    >
                                        <span className="truncate" style={{ fontFamily: fontFamily }}>{fontFamily}</span>
                                        <ChevronDown size="0.8vw" className="text-gray-400 shrink-0" />
                                    </button>
                                    {showFontFamilyDropdown && (
                                        <div className="absolute left-0 right-0 top-[2.4vw] z-[80] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                            {fontFamilies.map((font) => (
                                                <button
                                                    key={font}
                                                    type="button"
                                                    onClick={() => {
                                                        setFontFamily(font);
                                                        setShowFontFamilyDropdown(false);
                                                    }}
                                                    className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    style={{ fontFamily: font }}
                                                >
                                                    {font}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                 <div className="relative w-[5.5vw]">
                                    <button 
                                        onClick={() => {
                                            setShowFontSizeDropdown(!showFontSizeDropdown);
                                            setShowFontFamilyDropdown(false);
                                            setShowFontWeightDropdown(false);
                                            setShowLetterSpacingSlider(false);
                                            setShowLineHeightSlider(false);
                                        }}
                                        className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                                    >
                                        <span>{fontSize}</span>
                                        <ChevronDown size="0.8vw" className="text-gray-400 shrink-0" />
                                    </button>
                                    {showFontSizeDropdown && (
                                        <div className="absolute left-0 right-0 top-[2.4vw] z-[80] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                            {fontSizes.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        setFontSize(size);
                                                        setShowFontSizeDropdown(false);
                                                    }}
                                                    className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
 
                            {/* Row 2: Weight, Character Spacing, Line Height */}
                            <div className="flex items-center gap-[0.6vw] relative">
                                {/* Font Weight */}
                                <div className="relative flex-1">
                                    <button 
                                        onClick={() => {
                                            setShowFontWeightDropdown(!showFontWeightDropdown);
                                            setShowFontFamilyDropdown(false);
                                            setShowFontSizeDropdown(false);
                                            setShowLetterSpacingSlider(false);
                                            setShowLineHeightSlider(false);
                                        }}
                                        className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                                    >
                                        <span>{fontWeight}</span>
                                        <ChevronDown size="0.8vw" className="text-gray-400 shrink-0" />
                                    </button>
                                    {showFontWeightDropdown && (
                                        <div className="absolute left-0 right-0 top-[2.4vw] z-[80] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                            {fontWeights.map((w) => (
                                                <button
                                                    key={w}
                                                    type="button"
                                                    onClick={() => {
                                                        setFontWeight(w);
                                                        setShowFontWeightDropdown(false);
                                                    }}
                                                    className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    {w}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Character Spacing */}
                                <div className="relative w-[5.5vw]">
                                    <div 
                                        onMouseDown={(e) => {
                                            if (e.button !== 0) return;
                                            
                                            // Lock global double arrow cursor and prevent text selection during scrubbing drag
                                            document.body.style.cursor = 'ew-resize';
                                            document.body.style.userSelect = 'none';
                                            
                                            const startX = e.clientX;
                                            const startVal = letterSpacing === 'Auto' ? (isT1 ? 0 : 2) : parseFloat(letterSpacing);
                                            let hasDragged = false;
                                            
                                            const handleMouseMove = (moveEvent) => {
                                                const deltaX = moveEvent.clientX - startX;
                                                if (Math.abs(deltaX) > 3) {
                                                    hasDragged = true;
                                                }
                                                const change = Math.round(deltaX / 8);
                                                const newVal = Math.min(40, Math.max(isT1 ? -5 : 0, startVal + change));
                                                setLetterSpacing(newVal);
                                            };
                                            
                                            const handleMouseUp = () => {
                                                window.removeEventListener('mousemove', handleMouseMove);
                                                window.removeEventListener('mouseup', handleMouseUp);
                                                
                                                // Reset global styles
                                                document.body.style.cursor = '';
                                                document.body.style.userSelect = '';
                                                
                                                if (!hasDragged) {
                                                    setShowLetterSpacingSlider(!showLetterSpacingSlider);
                                                    setShowLineHeightSlider(false);
                                                    setShowFontFamilyDropdown(false);
                                                    setShowFontSizeDropdown(false);
                                                    setShowFontWeightDropdown(false);
                                                }
                                            };
                                            
                                            window.addEventListener('mousemove', handleMouseMove);
                                            window.addEventListener('mouseup', handleMouseUp);
                                        }}
                                        className="relative w-full h-[2.2vw] border border-gray-300 rounded-[0.6vw] bg-white flex items-center px-[0.6vw] hover:border-gray-400 transition-all group cursor-ew-resize select-none"
                                        title="Drag horizontally to scrub value"
                                    >
                                        <input 
                                            type="text" 
                                            value={letterSpacing}
                                            readOnly
                                            className="w-full text-center text-[0.7vw] font-semibold text-gray-700 outline-none bg-transparent cursor-ew-resize select-none pointer-events-none"
                                        />
                                        <Icon icon="solar:paragraph-spacing-linear" width="1.2vw" height="1.2vw" rotate={1} className="text-gray-400 shrink-0 pointer-events-none" />
                                    </div>
                                    {showLetterSpacingSlider && (
                                        <>
                                            <div className="fixed inset-0 z-[80]" onClick={() => setShowLetterSpacingSlider(false)} />
                                            <div className="absolute right-0 top-[2.4vw] z-[90] p-[0.8vw] bg-white border border-gray-200 rounded-[0.8vw] shadow-xl w-[12vw] flex flex-col gap-[0.6vw] animate-in fade-in slide-in-from-top-2 duration-150">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[0.7vw] font-bold text-gray-400 uppercase tracking-wider">Spacing</span>
                                                    <button 
                                                        onClick={() => setLetterSpacing('Auto')}
                                                        className={`px-[0.4vw] py-[0.1vw] rounded-[0.3vw] text-[0.65vw] font-bold border transition-colors ${letterSpacing === 'Auto' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        Auto
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-[0.4vw]">
                                                    <input 
                                                        type="range"
                                                        min={isT1 ? -5 : 0}
                                                        max={30}
                                                        value={letterSpacing === 'Auto' ? (isT1 ? 0 : 2) : letterSpacing}
                                                        onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                                                        className="flex-1 h-[0.3vw] accent-[#2E7D32] cursor-pointer"
                                                    />
                                                    <span className="text-[0.7vw] font-bold text-gray-700 w-[2.2vw] text-right shrink-0">
                                                        {letterSpacing === 'Auto' ? (isT1 ? '0px' : '2px') : `${letterSpacing}px`}
                                                    </span>
                                                </div>
                                                <div className="text-[0.6vw] font-semibold text-gray-400 mt-[-0.2vw]">
                                                    Default: {isT1 ? "0px" : "2px (0.2em)"}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Line Height */}
                                <div className="relative w-[5.5vw]">
                                    <div 
                                        onMouseDown={(e) => {
                                            if (e.button !== 0) return;
                                            
                                            // Lock global double arrow cursor and prevent text selection during scrubbing drag
                                            document.body.style.cursor = 'ew-resize';
                                            document.body.style.userSelect = 'none';
                                            
                                            const startX = e.clientX;
                                            const startVal = lineHeight === 'Auto' ? (isT1 ? 1.1 : 1.2) : parseFloat(lineHeight);
                                            let hasDragged = false;
                                            
                                            const handleMouseMove = (moveEvent) => {
                                                const deltaX = moveEvent.clientX - startX;
                                                if (Math.abs(deltaX) > 3) {
                                                    hasDragged = true;
                                                }
                                                const change = deltaX / 100;
                                                const newVal = parseFloat(Math.min(3.0, Math.max(0.5, startVal + change)).toFixed(1));
                                                setLineHeight(newVal);
                                            };
                                            
                                            const handleMouseUp = () => {
                                                window.removeEventListener('mousemove', handleMouseMove);
                                                window.removeEventListener('mouseup', handleMouseUp);
                                                
                                                // Reset global styles
                                                document.body.style.cursor = '';
                                                document.body.style.userSelect = '';
                                                
                                                if (!hasDragged) {
                                                    setShowLineHeightSlider(!showLineHeightSlider);
                                                    setShowLetterSpacingSlider(false);
                                                    setShowFontFamilyDropdown(false);
                                                    setShowFontSizeDropdown(false);
                                                    setShowFontWeightDropdown(false);
                                                }
                                            };
                                            
                                            window.addEventListener('mousemove', handleMouseMove);
                                            window.addEventListener('mouseup', handleMouseUp);
                                        }}
                                        className="relative w-full h-[2.2vw] border border-gray-300 rounded-[0.6vw] bg-white flex items-center px-[0.6vw] hover:border-gray-400 transition-all group cursor-ew-resize select-none"
                                        title="Drag horizontally to scrub value"
                                    >
                                        <input 
                                            type="text" 
                                            value={lineHeight}
                                            readOnly
                                            className="w-full text-center text-[0.7vw] font-semibold text-gray-700 outline-none bg-transparent cursor-ew-resize select-none pointer-events-none"
                                        />
                                        <Icon icon="solar:paragraph-spacing-linear" width="1.2vw" height="1.2vw" className="text-gray-400 shrink-0 pointer-events-none" />
                                    </div>
                                    {showLineHeightSlider && (
                                        <>
                                            <div className="fixed inset-0 z-[80]" onClick={() => setShowLineHeightSlider(false)} />
                                            <div className="absolute right-0 top-[2.4vw] z-[90] p-[0.8vw] bg-white border border-gray-200 rounded-[0.8vw] shadow-xl w-[12vw] flex flex-col gap-[0.6vw] animate-in fade-in slide-in-from-top-2 duration-150">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[0.7vw] font-bold text-gray-400 uppercase tracking-wider">Height</span>
                                                    <button 
                                                        onClick={() => setLineHeight('Auto')}
                                                        className={`px-[0.4vw] py-[0.1vw] rounded-[0.3vw] text-[0.65vw] font-bold border transition-colors ${lineHeight === 'Auto' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        Auto
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-[0.4vw]">
                                                    <input 
                                                        type="range"
                                                        min="0.5"
                                                        max="3.0"
                                                        step="0.1"
                                                        value={lineHeight === 'Auto' ? (isT1 ? 1.1 : 1.2) : lineHeight}
                                                        onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                                                        className="flex-1 h-[0.3vw] accent-[#2E7D32] cursor-pointer"
                                                    />
                                                    <span className="text-[0.7vw] font-bold text-gray-700 w-[2.2vw] text-right shrink-0">
                                                        {lineHeight === 'Auto' ? (isT1 ? '1.1' : '1.2') : lineHeight}
                                                    </span>
                                                </div>
                                                <div className="text-[0.6vw] font-semibold text-gray-400 mt-[-0.2vw]">
                                                    Default: {isT1 ? "1.1" : "1.2 (normal)"}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Align, Bold, Underline/Italic, List */}
                            <div className="flex items-center gap-[0.5vw]">
                                <button 
                                    onClick={() => {
                                        const aligns = ['left', 'center', 'right', 'justify'];
                                        const idx = aligns.indexOf(align);
                                        setAlign(aligns[(idx + 1) % aligns.length]);
                                    }}
                                    className="w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer shadow-sm"
                                >
                                    <Icon icon={
                                        align === 'center' ? "lucide:align-center" : 
                                        align === 'right' ? "lucide:align-right" : 
                                        align === 'justify' ? "lucide:align-justify" : 
                                        "lucide:align-left"
                                    } className="w-[1vw] h-[1vw]" />
                                </button>

                                <button 
                                    onClick={() => setBold(!bold)}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${bold ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <span className="font-bold text-[0.85vw]">B</span>
                                </button>

                                <button 
                                    onClick={() => {
                                        if (!underline && !italic) {
                                            setUnderline(true);
                                        } else if (underline && !italic) {
                                            setUnderline(false);
                                            setItalic(true);
                                        } else {
                                            setItalic(false);
                                            setUnderline(false);
                                        }
                                    }}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${underline || italic ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <span className="font-medium text-[0.85vw]">{underline ? 'U' : italic ? 'I' : '-'}</span>
                                </button>

                                <button 
                                    className="w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer shadow-sm"
                                >
                                    <Icon icon="lucide:list" className="w-[1vw] h-[1vw]" />
                                </button>
                            </div>

                            {/* Text Color Section */}
                            <div className="flex flex-col gap-[0.8vw]">
                                <div className="flex items-center gap-[0.5vw]">
                                    <span className="font-bold text-[0.8vw] text-gray-900 shrink-0">Text Color</span>
                                    <div className="flex-1 h-[1px] bg-gray-200" />
                                </div>

                                <div className="flex items-center gap-[0.6vw]">
                                    <span className="text-[0.75vw] font-bold text-gray-600 min-w-[2vw]">Fill :</span>
                                    
                                    <div className="relative">
                                        <div 
                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-all"
                                            style={{ backgroundColor: color }}
                                        />
                                        {showColorPicker && (
                                            <>
                                                <div className="fixed inset-0 z-[80]" onClick={() => setShowColorPicker(false)} />
                                                <ColorPicker 
                                                    color={color}
                                                    onChange={(newCol) => setColor(newCol)}
                                                    opacity={opacity}
                                                    onOpacityChange={(newOp) => setOpacity(newOp)}
                                                    onClose={() => setShowColorPicker(false)}
                                                    className="absolute right-[calc(100%+0.8vw)] top-1/2 -translate-y-1/2 z-[90] typography-color-picker"
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="w-[10.5vw] flex items-center border border-gray-300 rounded-[0.6vw] bg-white overflow-hidden shadow-sm h-[2.2vw] px-[0.6vw]">
                                        <input 
                                            type="text" 
                                            value={color} 
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-[4vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none bg-transparent"
                                            maxLength={7}
                                        />
                                        <div className="flex-1 flex items-center justify-end gap-[0.1vw] border-l border-gray-200 pl-[0.5vw] ml-[0.5vw] shrink-0">
                                            <input 
                                                type="number" 
                                                value={opacity} 
                                                onChange={(e) => setOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-[1.8vw] text-center text-[0.75vw] font-bold text-gray-700 outline-none bg-transparent no-spin"
                                            />
                                            <span className="text-[0.75vw] font-bold text-gray-400 shrink-0 select-none">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default ShareModal;
