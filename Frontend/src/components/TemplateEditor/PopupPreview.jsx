import React, { useRef, useEffect } from 'react';
import { X, Type, Image as ImageIcon } from 'lucide-react';

const S3_URL = 'https://codia-f2c.s3.us-west-1.amazonaws.com';
const PROXY_URL = '/s3-image';

const PopupPreview = ({ content, styles, elementType, elementSource, renderId, mode, onClose, onUpdateContent, onUpdateImage, onSelectElement, isWorkspaceModal = false }) => {
    const fileInputRef = React.useRef(null);
    const iframeRef = useRef(null);
    const lastRenderId = useRef(null);

    const {
        font = 'Poppins',
        size = '24',
        weight = 'Semi Bold',
        fill = '#ffffff',
        fillOpacity = 100,
        autoWidth = true,
        autoHeight = true,
        fit = 'Fit',
        stroke,
        strokeType = 'solid',
        strokeWidth = 1,
        strokeOpacity = 100,
        strokeDashLength = 4,
        strokeDashGap = 4,
        strokePosition = 'center',
        strokeRoundCorners = false
    } = styles || {};

    const hexToRgba = (hex, opacity) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        const alpha = (opacity / 100).toFixed(2);
        return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : hex;
    };

    const bgColor = hexToRgba(fill, fillOpacity);

    // Locked to fixed dimensions as per user request
    const isAutoWidth = false;
    const isAutoHeight = false;

    const fontWeight =
        weight === 'Bold' ? '700' :
            weight === 'Semi Bold' ? '600' : '400';

    const getObjectFit = () => {
        if (fit === 'Fill') return 'cover';
        if (fit === 'Stretch') return 'fill';
        return 'contain'; // Default for 'Fit'
    };

    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (onUpdateImage) onUpdateImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    // Enhanced HTML detection to support fragments and full documents
    const isHTML = content && (
        content.trim().toLowerCase().startsWith('<!doctype') ||
        /<[a-z][\s\S]*>/i.test(content)
    );

    const proxiedContent = React.useMemo(() => content?.split(S3_URL).join(PROXY_URL), [content]);
    const proxiedSource = React.useMemo(() => elementSource?.split(S3_URL).join(PROXY_URL), [elementSource]);

    // Effect 1: Full Content Reload (Template Selection)
    useEffect(() => {
        if (!isHTML || !iframeRef.current) return;
        const shouldUpdate = lastRenderId.current !== renderId;

        if (shouldUpdate && content) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;

            // Initial write of content
            doc.open();
            doc.write(proxiedContent);
            doc.close();

            lastRenderId.current = renderId;

            // Attach Click/Submit Listeners
            const attachTarget = doc.body || doc;
            attachTarget.addEventListener('click', (e) => {
                const target = e.target;
                if (!onSelectElement) return;

                // Detection Logic
                const tagName = target.tagName;

                // Strict check: if it's a DIV, it's only text if it has NO element children and has text content
                const isText = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'B', 'STRONG', 'I', 'EM'].includes(tagName)
                    || (tagName === 'DIV' && target.children.length === 0 && target.textContent.trim().length > 0);

                const isGif = tagName === 'IMG' && (target.dataset?.mediaType === 'gif' || target.src?.toLowerCase().endsWith('.gif'));
                const isImage = tagName === 'IMG' && !isGif;
                const isVideo = tagName === 'VIDEO';
                const isIcon = tagName === 'SVG' || target.closest('svg');

                // If it's a DIV with children, or the body itself, treat it as background
                const isLayoutContainer = tagName === 'BODY' || (tagName === 'DIV' && target.children.length > 0);

                if (!isLayoutContainer && (isText || isImage || isGif || isVideo || isIcon)) {
                    // Prevent closing popup if clicking editable element
                    e.stopPropagation();

                    // If it's an icon, we might want to select the actual SVG element or its closest SVG parent
                    const selectionTarget = isIcon ? (tagName === 'SVG' ? target : target.closest('svg')) : target;

                    // Reset other editable elements
                    doc.querySelectorAll('[contenteditable="true"]').forEach(el => {
                        if (el !== selectionTarget) el.contentEditable = "false";
                    });

                    // Only enable text editing for text elements
                    if (isText) {
                        selectionTarget.contentEditable = "true";
                        selectionTarget.focus();
                    }

                    if (onSelectElement) onSelectElement(selectionTarget);
                } else {
                    // Clicking background (empty space)
                    e.stopPropagation();
                    if (onSelectElement) onSelectElement('background');
                }
            });

            // Sync content on input (typing) - Debounced to improve performance
            const syncTimer = { current: null };
            attachTarget.addEventListener('input', () => {
                if (syncTimer.current) clearTimeout(syncTimer.current);
                syncTimer.current = setTimeout(() => {
                    if (onUpdateContent) onUpdateContent("<!DOCTYPE html>" + doc.documentElement.outerHTML);
                }, 300);
            });

            // Prevent default form submissions or link navigations in preview
            attachTarget.addEventListener('submit', (e) => e.preventDefault());
            doc.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', (e) => e.preventDefault());
            });

            // Add auto-scale script to fit template to preview box without clipping or scrolling
            const scaleScript = doc.createElement('script');
            scaleScript.id = 'auto-scale-script';
            scaleScript.textContent = `
                (function() {
                    function fit() {
                        const target = document.querySelector('.a4-landscape') || document.body.firstElementChild;
                        if (!target) return;
                        
                        // Reset target styling for measurement
                        target.style.transformOrigin = 'center center';
                        target.style.margin = '0';
                        target.style.position = 'absolute';
                        target.style.left = '50%';
                        target.style.top = '50%';
                        
                        const vw = window.innerWidth;
                        const vh = window.innerHeight;
                        const tw = target.offsetWidth || target.scrollWidth;
                        const th = target.offsetHeight || target.scrollHeight;

                        if (tw > 0 && th > 0) {
                            // Uniform scaling: fit both width and height (smaller ratio)
                            const scale = Math.min(vw / tw, vh / th);
                            target.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
                        }
                    }

                    window.addEventListener('resize', fit);
                    const observer = new MutationObserver(fit);
                    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
                    fit();
                    // Multi-pass for font/asset loads
                    setTimeout(fit, 100);
                    setTimeout(fit, 500);
                })();
            `;
            if (doc.body) {
                doc.body.appendChild(scaleScript);
            } else if (doc.documentElement) {
                doc.documentElement.appendChild(scaleScript);
            }
        }
    }, [content, renderId, isHTML, onSelectElement, onUpdateContent]);

    // Effect 2: Dynamic Theme/Style Updates (Live Color/Opacity)
    useEffect(() => {
        if (!isHTML || !iframeRef.current) return;
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        if (!doc) return;

        // Ensure dynamic style tag exists
        let styleTag = doc.getElementById('dynamic-theme-styles');
        if (!styleTag) {
            styleTag = doc.createElement('style');
            styleTag.id = 'dynamic-theme-styles';
            if (doc.head) doc.head.appendChild(styleTag);
            else if (doc.body) doc.body.appendChild(styleTag);
        }

        styleTag.textContent = `
            html, body { 
                background: transparent !important; 
                margin: 0 !important; 
                padding: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                overflow: hidden !important;
                display: flex !important; 
                align-items: center !important; 
                justify-content: center !important; 
                position: relative !important;
            }
            :root {
                --popup-fill: ${fill};
                --popup-fill-rgba: ${bgColor};
            }
            /* Fallback: Ensure there is a base opaque background (white) 
               Using :where() gives 0 specificity so template classes (like bg-cream) can override it */
            :where(.a4-landscape, body > div:first-child) {
                background-color: #ffffff;
            }

            /* Apply background color as an overlay using inset box-shadow 
               This preserves the original template background (images/colors) underneath 
               while allowing the fill color/opacity to tint or cover it. 
               The shadow sits above background but below text content. */
            .a4-landscape, body > div:first-child {
                box-shadow: inset 0 0 0 200vmax var(--popup-fill-rgba) !important;
            }
            ::-webkit-scrollbar { width: 0px; height: 0px; background: transparent; }
        `;
    }, [bgColor, fill, isHTML]);

    return (
        <div
            className={`${isWorkspaceModal ? 'absolute inset-[1vw]' : 'fixed inset-0'} z-[10] flex items-center justify-center bg-black/40 backdrop-blur-[0.15vw] cursor-default pointer-events-auto animate-fadeIn`}
            onClick={(e) => {
                if (onSelectElement) onSelectElement(null); // Clear inner selection
                onClose && onClose();
            }}
        >
            <div
                className={`${isHTML ? '' : 'border-gray-100 shadow-[0_1.5vw_4vw_rgba(0,0,0,0.15)]'} rounded-[1vw] relative flex flex-col items-center pointer-events-auto scale-in-center transition-all duration-300`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectElement) onSelectElement('background');
                }}
                style={{
                    width: isHTML ? 'auto' : '99%',
                    aspectRatio: isHTML ? '297/210' : 'auto', // Matches A4 Landscape to remove side gaps
                    maxWidth: isHTML ? '95vw' : '65vw',
                    height: '85%',
                    maxHeight: '95vh',
                    minWidth: isHTML ? 'auto' : '20vw',
                    minHeight: isHTML ? 'auto' : '25vw',
                    padding: isHTML ? '0' : '4vw 3vw',
                    overflow: 'hidden',
                    backgroundColor: isHTML ? 'transparent' : bgColor,
                    border: 'none'
                }}
            >
                {stroke && stroke !== 'none' && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                        <svg width="100%" height="100%" className="block overflow-visible">
                            <rect
                                x={strokePosition === 'inside' ? strokeWidth / 2 : strokePosition === 'outside' ? -strokeWidth / 2 : 0}
                                y={strokePosition === 'inside' ? strokeWidth / 2 : strokePosition === 'outside' ? -strokeWidth / 2 : 0}
                                rx="16"
                                ry="16"
                                fill="none"
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeType === 'dashed' ? `${strokeDashLength},${strokeDashGap}` : 'none'}
                                strokeLinecap={strokeRoundCorners ? 'round' : 'square'}
                                style={{
                                    strokeOpacity: strokeOpacity / 100,
                                    width: strokePosition === 'inside' ? `calc(100% - ${strokeWidth}px)` : strokePosition === 'outside' ? `calc(100% + ${strokeWidth}px)` : '100%',
                                    height: strokePosition === 'inside' ? `calc(100% - ${strokeWidth}px)` : strokePosition === 'outside' ? `calc(100% + ${strokeWidth}px)` : '100%'
                                }}
                            />
                        </svg>
                    </div>
                )}
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&display=swap');
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                    .scale-in-center { animation: scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
                `}</style>


                {mode !== 'preview' && (
                    <button
                        onClick={onClose}
                        className="absolute top-[1vw] right-[1vw] z-10 p-[0.5vw] hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600 hover:rotate-90 bg-white/80 backdrop-blur-sm shadow-sm"
                    >
                        <X size="1.2vw" />
                    </button>
                )}

                <div className="w-full flex-grow flex flex-col items-center justify-center relative overflow-hidden min-h-[10vw]">
                    {isHTML ? (
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full border-none"
                            title="Popup Content"
                            scrolling="no"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    ) : elementType === 'image' ? (
                        <div className="w-full flex flex-col items-center gap-[2vw]">
                            {elementSource ? (
                                <div
                                    onClick={handleImageClick}
                                    className="relative group cursor-pointer"
                                >
                                    <img
                                        src={proxiedSource}
                                        alt="Popup Content"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectElement) onSelectElement(e.target);
                                        }}
                                        className="max-w-full max-h-[50vh] object-contain"
                                        style={{
                                            objectFit: getObjectFit(),
                                            width: fit === 'Stretch' ? '100%' : 'auto',
                                            height: fit === 'Stretch' ? '100%' : 'auto'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon size="3vw" className="text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-400 text-[0.85vw] italic py-[2vw] flex flex-col items-center gap-[0.5vw]">
                                    <ImageIcon size="2.5vw" className="opacity-20" />
                                    <span>No background image selected</span>
                                </div>
                            )}

                            {content && (
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelectElement) onSelectElement(e.target);
                                    }}
                                    onBlur={(e) => onUpdateContent && onUpdateContent(e.target.innerText)}
                                    className="break-words whitespace-pre-wrap w-full text-center px-[1vw] outline-none border-b border-transparent hover:border-gray-200 focus:border-indigo-400 transition-all"
                                    style={{
                                        fontFamily: `'${font}', sans-serif`,
                                        fontSize: `calc(${size}vw / 10)`, // Approximate conversion for preview consistency
                                        fontWeight: fontWeight,
                                        color: fill,
                                        lineHeight: '1.6'
                                    }}
                                >
                                    {content}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full text-center px-4 py-4">
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateContent && onUpdateContent(e.target.innerText)}
                                className="break-words whitespace-pre-wrap w-full outline-none border-b border-transparent hover:border-gray-200 focus:border-indigo-400 transition-all"
                                style={{
                                    fontFamily: `'${font}', sans-serif`,
                                    fontSize: `calc(${size}vw / 10)`,
                                    fontWeight: fontWeight,
                                    color: fill,
                                    lineHeight: '1.6'
                                }}
                            >
                                {content || elementSource}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupPreview;