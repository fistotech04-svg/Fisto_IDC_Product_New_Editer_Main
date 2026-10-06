import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import backgroundComponents from './Backgrounds';
import animationComponents from './Animations';
import * as BookAppearanceHelpers from './bookAppearanceHelpers';
import { resolveUploadsPath } from '../../utils/supabaseUtils';


import { LAYOUT_DEFAULT_COLORS } from './Layout';
import LeadFormPopup from './popups/LeadFormPopup';
import { getFromDB, saveToDB } from '../../utils/dbUtils';


import {
  getIframeContent,
  TurnJsBookRenderer,
  SharedOverlays,
  InteractionPopupModal,
  InteractionSlideshowModal,
  DeviceLayoutRenderer
} from './previewAreaModules';

const PreviewArea = React.memo(({
    pages = [],
    bookName,
    targetPage = 0,
    backgroundSettings,
    bookAppearanceSettings: incomingBookAppearanceSettings,
    logoSettings: incomingLogoSettings,
    watermarkSettings,
    leadFormSettings: incomingLeadFormSettings,
    settings: incomingSettings,
    profileSettings,
    zoom = 1.0,
    menuBarSettings,
    otherSetupSettings: incomingOtherSetupSettings,
    onUpdateOtherSetup,
    hideHeader = false,
    activeLayout,
    layoutColors,
    onClose,
    isSidebarOpen,
    activeDevice: activeDeviceProp = 'Desktop',
    activeSubView,
    useNativeFullscreen = false,
    bookmarks = [],
    notes = [],
    setBookmarks,
    setNotes,
    isPublishedPreview = false,
    disableAutoGallery = false,
    onFlip: externalOnFlip,
    isLoading = false,
    externalShowTOC = false,
    v_id: incomingVId,
    vId: incomingVIdProp,
    shareId: incomingShareId,
    currentBook,
}) => {
    const [processedLogoSrc, setProcessedLogoSrc] = useState(incomingLogoSettings?.src || '');

    useEffect(() => {
        if (!incomingLogoSettings?.src) {
            setProcessedLogoSrc('');
            return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                const adj = incomingLogoSettings.adjustments || {};
                const exposure = adj.exposure || 0;
                const contrast = adj.contrast || 0;
                const saturation = adj.saturation || 0;
                const temperature = adj.temperature || 0;
                const tint = adj.tint || 0;
                const highlights = (adj.highlights || 0) / 5;
                const shadows = (adj.shadows || 0) / 5;

                const filterStr = `brightness(${100 + exposure + highlights}%) contrast(${100 + contrast + shadows}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%)`;

                ctx.filter = filterStr;
                ctx.drawImage(img, 0, 0);
                setProcessedLogoSrc(canvas.toDataURL());
            } catch (e) {
                console.error("Canvas logo filter processing failed", e);
                setProcessedLogoSrc(incomingLogoSettings.src);
            }
        };
        img.onerror = () => {
            setProcessedLogoSrc(incomingLogoSettings.src);
        };
        img.src = incomingLogoSettings.src;
    }, [incomingLogoSettings?.src, incomingLogoSettings?.adjustments]);

    const logoSettings = React.useMemo(() => {
        if (!incomingLogoSettings) return null;
        return {
            ...incomingLogoSettings,
            src: processedLogoSrc || incomingLogoSettings.src
        };
    }, [incomingLogoSettings, processedLogoSrc]);

    const bookAppearanceSettings = React.useMemo(() => {
        const rawApp = incomingBookAppearanceSettings || incomingSettings?.bookAppearanceSettings || incomingSettings?.BookAppearance || incomingSettings?.appearance || currentBook?.Customized_Settings?.BookAppearance || {};

        let validSpeed = rawApp.flipSpeed || 'Fast';
        if (validSpeed === 'medium') {
            validSpeed = 'Fast';
        } else if (validSpeed === 'Slow' && !rawApp.speedChanged) {
            validSpeed = 'Fast';
        }

        return {
            texture: 'Plain White',
            hardCover: false,
            grainIntensity: 20,
            warmth: 0,
            textureScale: 0,
            opacity: 100,
            flipStyle: 'Classic Flip',
            corner: 'Sharp',
            dropShadow: { active: true, color: '#4f4f4fff', opacity: 50, xAxis: 0, yAxis: 0, blur: 0, spread: 0 },
            ...rawApp,
            flipSpeed: validSpeed
        };
    }, [incomingBookAppearanceSettings, incomingSettings, currentBook]);

    const otherSetupSettings = React.useMemo(() => {
        return incomingOtherSetupSettings || incomingSettings?.otherSetupSettings || incomingSettings?.otherSetup || incomingSettings?.othersetup || currentBook?.Customized_Settings?.otherSetup || {};
    }, [incomingOtherSetupSettings, incomingSettings, currentBook]);

    const leadFormSettings = React.useMemo(() => {
        return incomingLeadFormSettings || incomingSettings?.leadForm || incomingSettings?.leadform || incomingSettings?.Customized_Settings?.leadForm || currentBook?.Customized_Settings?.leadForm || null;
    }, [incomingLeadFormSettings, incomingSettings, currentBook]);

    const resolvedVId = React.useMemo(() => {
        return incomingVId || incomingVIdProp || currentBook?.v_id || currentBook?.id || incomingSettings?.v_id || incomingSettings?.FlipbookInfo?.v_id || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('v_id') : null) || null;
    }, [incomingVId, incomingVIdProp, currentBook, incomingSettings]);

    const resolvedShareId = React.useMemo(() => {
        if (incomingShareId) return incomingShareId;
        if (currentBook?.shareId) return currentBook.shareId;
        if (currentBook?.share?.shareId) return currentBook.share.shareId;
        if (incomingSettings?.shareId) return incomingSettings.shareId;
        if (incomingSettings?.Visibility?.shareId) return incomingSettings.Visibility.shareId;
        if (incomingSettings?.share?.shareId) return incomingSettings.share.shareId;
        if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/\/share=[^/]+\/([^/?#]+)/);
            if (match && match[1]) return match[1];
        }
        return '';
    }, [incomingShareId, currentBook, incomingSettings]);

    const resolvedBookName = React.useMemo(() => {
        return bookName || currentBook?.flipbookName || currentBook?.title || incomingSettings?.flipbookName || incomingSettings?.FlipbookInfo?.flipbookName || 'Flipbook';
    }, [bookName, currentBook, incomingSettings]);

    const resolvedUserEmail = React.useMemo(() => {
        if (currentBook?.userEmail) return currentBook.userEmail;
        if (incomingSettings?.userEmail) return incomingSettings.userEmail;
        if (incomingSettings?.FlipbookInfo?.userEmail) return incomingSettings.FlipbookInfo.userEmail;
        if (profileSettings?.emailId || profileSettings?.email) return profileSettings.emailId || profileSettings.email;
        return '';
    }, [currentBook, incomingSettings, profileSettings]);

    const creatorProfileData = React.useMemo(() => {
        const email = resolvedUserEmail || '';
        const name = profileSettings?.name || currentBook?.authorName || (email ? email.split('@')[0] : 'Creator');
        const picture = profileSettings?.picture || currentBook?.authorPicture || null;
        const avatarBgColor = profileSettings?.avatarBgColor || currentBook?.authorBgColor || '#E8D4C8';
        const bannerBg = profileSettings?.bannerBg || { type: 'gradient', value: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' };

        return {
            name,
            email,
            emailId: email,
            userEmail: email,
            shareId: resolvedShareId,
            v_id: resolvedVId,
            profileImg: picture,
            picture,
            avatarBgColor,
            bannerBg,
            about: profileSettings?.about || '',
            mobile: profileSettings?.mobile || '',
            companyName: profileSettings?.companyName || '',
            industryType: profileSettings?.industryType || '',
            companyEmail: profileSettings?.companyEmail || '',
            website: profileSettings?.website || '',
            services: profileSettings?.services || [],
            address1: profileSettings?.address1 || '',
            address2: profileSettings?.address2 || '',
            city: profileSettings?.city || '',
            pincode: profileSettings?.pincode || '',
            state: profileSettings?.state || '',
            country: profileSettings?.country || 'INDIA',
            socials: profileSettings?.socials || {}
        };
    }, [resolvedUserEmail, profileSettings, currentBook, resolvedShareId, resolvedVId]);

    const galleryPopupSettings = React.useMemo(() => {
        const galleryFromOther = otherSetupSettings?.gallery || {};
        const galleryFromMenuBar = menuBarSettings?.interaction?.gallerySettings || {};
        return {
            ...galleryFromOther,
            ...galleryFromMenuBar,
            images: (galleryFromOther.images && galleryFromOther.images.length > 0)
                ? galleryFromOther.images
                : (galleryFromMenuBar.images || [])
        };
    }, [otherSetupSettings, menuBarSettings]);

    const hexToRgb = (hex) => {
        if (!hex) return '0, 0, 0';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };

    const layoutColorVars = React.useMemo(() => {
        const activeIdx = activeLayout || 1;
        const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || LAYOUT_DEFAULT_COLORS[1] || [];
        const saved = Array.isArray(layoutColors?.[activeIdx]) ? layoutColors[activeIdx] : [];
        const toolbarP = layoutColors?.toolbarColor?.primary;
        const toolbarS = layoutColors?.toolbarColor?.secondary;
        const popupP = layoutColors?.popupColor?.primary;
        const popupS = layoutColors?.popupColor?.secondary;

        const mergedColors = defaults.map((c) => {
            const savedItem = saved.find(s => s && s.id === c.id);
            let hexVal = c.hex;
            if (savedItem && savedItem.hex) {
                hexVal = savedItem.hex;
            } else if (toolbarP && ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'].includes(c.id)) {
                hexVal = toolbarP;
            } else if (toolbarS && ['toolbar-text-main', 'toolbar-icon', 'reset-text', 'page-number-text'].includes(c.id)) {
                hexVal = toolbarS;
            } else if (popupP && ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'].includes(c.id)) {
                hexVal = popupP;
            } else if (popupS && ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'].includes(c.id)) {
                hexVal = popupS;
            }

            return {
                ...c,
                ...(savedItem ? savedItem : {}),
                hex: hexVal
            };
        });

        return mergedColors
            .map(c => `
                --${c.id}: ${c.hex};
                --${c.id}-rgb: ${hexToRgb(c.hex)};
                --${c.id}-opacity: ${(c.opacity ?? 100) / 100};
            `)
            .join(' ');
    }, [layoutColors, activeLayout]);

    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const settings = React.useMemo(() => {
        const defaultMenuBarSettings = {
            navigation: { nextPrevButtons: true, mouseWheel: false, dragToTurn: true, pageQuickAccess: true, tableOfContents: true, pageThumbnails: true, bookmark: false, startEndNav: true },
            viewing: { zoom: true, fullScreen: true },
            interaction: { search: true, notes: true, gallery: true },
            media: { autoFlip: true, backgroundAudio: true },
            shareExport: { share: true, download: true, contact: true },
            brandingProfile: { logo: true, profile: true },
            tocSettings: { hasSettings: true, isExpanded: false }
        };
        const menuBar = menuBarSettings || otherSetupSettings?.menuBar || otherSetupSettings?.menuBarSettings || defaultMenuBarSettings;
        const nav = menuBar?.navigation || {};
        return {
            ...otherSetupSettings,
            ...menuBar,
            navigation: {
                ...defaultMenuBarSettings.navigation,
                ...(otherSetupSettings?.navigation || {}),
                ...nav,
                addTextToIconsSettings: {
                    ...(nav?.addTextToIconsSettings || {}),
                    ...(menuBar?.addTextToIconsSettings || {})
                },
                tocSettings: {
                    ...(nav?.tocSettings || {}),
                    ...(menuBar?.tocSettings || {})
                },
                bookmarkSettings: {
                    ...(nav?.bookmarkSettings || {}),
                    ...(otherSetupSettings?.navigation?.bookmarkSettings || {})
                }
            },
            viewing: {
                ...defaultMenuBarSettings.viewing,
                ...(otherSetupSettings?.viewing || {}),
                ...(menuBar?.viewing || {})
            },
            interaction: {
                ...defaultMenuBarSettings.interaction,
                ...(otherSetupSettings?.interaction || {}),
                ...(menuBar?.interaction || {})
            },
            media: {
                ...defaultMenuBarSettings.media,
                ...(otherSetupSettings?.media || {}),
                ...(menuBar?.media || {}),
                backgroundAudio: menuBar?.media?.backgroundAudio ?? menuBar?.media?.audio ?? otherSetupSettings?.media?.backgroundAudio ?? defaultMenuBarSettings.media.backgroundAudio
            },
            shareExport: {
                ...defaultMenuBarSettings.shareExport,
                ...(otherSetupSettings?.shareExport || {}),
                ...(menuBar?.shareExport || {})
            },
            brandingProfile: {
                ...defaultMenuBarSettings.brandingProfile,
                ...(otherSetupSettings?.brandingProfile || {}),
                ...(menuBar?.brandingProfile || {})
            }
        };
    }, [menuBarSettings, otherSetupSettings]);

    const bookRef = useRef();
    const containerRef = useRef();
    const screenRef = useRef();
    const isFlippingRef = useRef(false);
    const lastTapRef = useRef(0);
    const lastSyncPage = useRef(targetPage);
    const lastPreviewOpen = useRef(otherSetupSettings?.gallery?.previewOpen);

    const activeDevice = activeDeviceProp; // Desktop, Tablet, Mobile
    const isPortraitLayout = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
    const isSinglePage = activeDevice === 'Mobile' || (activeDevice === 'Tablet' && isPortraitLayout);
    const isTablet = activeDevice === 'Tablet';
    const isMobile = activeDevice === 'Mobile';
    const isPhysicalTablet = typeof navigator !== 'undefined' && (/(iPad|Tablet|PlayBook|Silk)|(Android(?!.*Mobile))/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const [isLandscape, setIsLandscape] = useState(activeDevice === 'Desktop' ? window.innerWidth > window.innerHeight : false);

    useEffect(() => {
        if (activeDevice === 'Mobile' || activeDevice === 'Tablet') {
            setIsLandscape(false);
        } else {
            setIsLandscape(window.innerWidth > window.innerHeight);
        }
    }, [activeDevice]);

    useEffect(() => {
        const handleResize = () => {
            if (activeDevice === 'Desktop') {
                setIsLandscape(window.innerWidth > window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeDevice]);

    const isMobileLandscape = isMobile && isLandscape;

    // Prevent flipbook page turn when scrolling inside scrollable text boxes
    useEffect(() => {
        const handleWheel = (e) => {
            const isScrollable = e.target.closest('[data-scrollable="true"], .flipbook-text-scrollbar, .flipbook-text-outer, .flipbook-text-viewport');
            if (isScrollable) {
                e.stopImmediatePropagation();
                e.stopPropagation();
            }
        };
        const opts = { capture: true, passive: false };
        window.addEventListener('wheel', handleWheel, opts);
        window.addEventListener('mousewheel', handleWheel, opts);
        window.addEventListener('DOMMouseScroll', handleWheel, opts);
        return () => {
            window.removeEventListener('wheel', handleWheel, opts);
            window.removeEventListener('mousewheel', handleWheel, opts);
            window.removeEventListener('DOMMouseScroll', handleWheel, opts);
        };
    }, []);

    // Listen for clicks outside the flipbook to trigger interaction blinks
    useEffect(() => {
        const handleGlobalClick = (e) => {
            const target = e.target;

            // Do not blink if clicking outside the preview area (e.g., left sidebar)
            if (containerRef.current && !containerRef.current.contains(target)) {
                return;
            }

            // Prevent blinking if clicking on toolbars or interactive UI elements (buttons/inputs)
            if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('.toolbar')) {
                return;
            }

            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    iframe.contentWindow.postMessage({ type: 'BLINK_INTERACTIONS' }, '*');
                } catch (err) { }
            });
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    // Responsive scaling logic
    const [deviceZoom, setDeviceZoom] = useState({ Desktop: zoom, Tablet: zoom, Mobile: zoom });
    const manualZoom = deviceZoom[activeDevice] ?? zoom;
    const setManualZoom = useCallback((val) => {
        setDeviceZoom(prev => {
            let newZoom = typeof val === 'function' ? val(prev[activeDevice] ?? zoom) : val;
            return { ...prev, [activeDevice]: newZoom };
        });
    }, [activeDevice, zoom]);
    const manualZoomRef = useRef(manualZoom);
    useEffect(() => { manualZoomRef.current = manualZoom; }, [manualZoom]);
    const [interactionZoom, setInteractionZoom] = useState(null);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [fitScale, setFitScale] = useState(1);
    const [active3DModelUrl, setActive3DModelUrl] = useState(null);
    const [active3DModelVId, setActive3DModelVId] = useState(null);
    const [active3DModelHotspots, setActive3DModelHotspots] = useState([]);
    const [active3DModelConfig, setActive3DModelConfig] = useState(null);
    // Declare isFullscreen here (before the computeFitScale effect that depends on it)
    const [isFullscreen, setIsFullscreen] = useState(false);





    const baseDimensions = useMemo(() => {
        if (pages && pages.length > 0) {
            for (const p of pages) {
                const htmlStr = p.html || p.content || '';
                if (htmlStr) {
                    const match = htmlStr.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
                    if (match && parseFloat(match[3]) > 0 && parseFloat(match[4]) > 0) {
                        return { width: parseFloat(match[3]), height: parseFloat(match[4]) };
                    }
                    const wMatch = htmlStr.match(/<svg[^>]*\bwidth=["']([0-9.]+)(?:px|mm)?["']/i);
                    const hMatch = htmlStr.match(/<svg[^>]*\bheight=["']([0-9.]+)(?:px|mm)?["']/i);
                    if (wMatch && hMatch && parseFloat(wMatch[1]) > 0 && parseFloat(hMatch[1]) > 0) {
                        return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
                    }
                }
            }
        }

        // Fallback: check currentBook, settings, or location state for explicit width / height or templateId + orientation
        const state = (typeof window !== 'undefined' && window.history?.state?.usr) || {};
        const w = currentBook?.width || settings?.width || state?.width;
        const h = currentBook?.height || settings?.height || state?.height;
        if (w && h) {
            return { width: parseFloat(w), height: parseFloat(h) };
        }

        const templateId = (currentBook?.templateId || settings?.templateId || settings?.format || state?.templateId || '').toLowerCase();
        const orientation = (currentBook?.orientation || settings?.orientation || state?.orientation || '').toLowerCase();
        if (templateId) {
            let baseW = 210, baseH = 297;
            if (templateId === 'corporate' || templateId === 'a4') { baseW = 210; baseH = 297; }
            else if (templateId === 'large_catalogue' || templateId === 'a3') { baseW = 297; baseH = 420; }
            else if (templateId === 'mini' || templateId === 'a5') { baseW = 148; baseH = 210; }
            else if (templateId === 'letter') { baseW = 216; baseH = 279; }
            else if (templateId === 'legal') { baseW = 216; baseH = 356; }
            else if (templateId === 'dl') { baseW = 99; baseH = 210; }
            else if (templateId === 'square') { baseW = 210; baseH = 210; }

            if (templateId !== 'square' && orientation === 'landscape') {
                return { width: baseH, height: baseW };
            }
            return { width: baseW, height: baseH };
        }

        if (orientation === 'square') {
            return { width: 210, height: 210 };
        }
        if (orientation === 'landscape') {
            return { width: 297, height: 210 };
        }

        return { width: 210, height: 297 }; // Fallback A4
    }, [pages, currentBook, settings]);

    const isTurnJs = !bookAppearanceSettings?.hardCover;
    const [actualPhysicalZoom, setActualPhysicalZoom] = useState(1);
    const currentZoom = useMemo(() => manualZoom * (activeDevice === 'Desktop' ? 1 : fitScale), [manualZoom, fitScale, activeDevice]);

    useEffect(() => {
        setManualZoom(zoom);
    }, [zoom]);

    useEffect(() => {
        // ── Keyboard: Ctrl+= / Ctrl+- ──────────────────────────────────────────
        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '0')) {
                e.preventDefault();
                setManualZoom(prev => {
                    if (e.key === '0') return 1; // Ctrl+0 reset
                    const newZoom = (e.key === '=' || e.key === '+') ? prev + 0.05 : prev - 0.05;
                    return Math.max(0.5, Math.min(newZoom, 4));
                });
            }
        };



        // ── Pinch-to-zoom (touch) ─────────────────────────────────────────────
        let pinchStartDist = null;
        let pinchStartZoom = 1;

        const getPinchDist = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.hypot(dx, dy);
        };

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                const isInsideFlipbook = e.target.closest?.('.turn-book, #turn-book, [data-turn-book], .flipbook-magazine-wrapper, .fbe-book');
                if (!isInsideFlipbook) return;
                pinchStartDist = getPinchDist(e.touches);
                pinchStartZoom = manualZoomRef.current ?? 1;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && pinchStartDist !== null) {
                e.preventDefault();
                const dist = getPinchDist(e.touches);
                const ratio = dist / pinchStartDist;
                const newZoom = Math.max(0.5, Math.min(pinchStartZoom * ratio, 4));
                setManualZoom(newZoom);
            }
        };

        const handleTouchEnd = () => {
            pinchStartDist = null;
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('touchmove', handleTouchMove, { passive: false });
            container.addEventListener('touchend', handleTouchEnd);
        }
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            }
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        // ── Scroll wheel: navigation (if enabled) ──────────
        const handleWheel = (e) => {
            if (!settings?.navigation?.mouseWheel) return;

            const target = e.target;
            const isInsideFlipbook = target.closest?.('.turn-book, #turn-book, [data-turn-book], .flipbook-magazine-wrapper, .fbe-book, .fbe-wrapper, [data-fbe]');
            if (!isInsideFlipbook) return;

            // Only flip on significant scroll to avoid accidental flips
            if (Math.abs(e.deltaY) < 10) return;

            if (isFlippingRef.current) {
                e.preventDefault();
                return;
            }

            e.preventDefault();

            if (e.deltaY > 0) {
                bookRef.current?.pageFlip()?.flipNext();
            } else if (e.deltaY < 0) {
                bookRef.current?.pageFlip()?.flipPrev();
            }

            isFlippingRef.current = true;
            setTimeout(() => {
                isFlippingRef.current = false;
            }, 300);
        };

        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [settings?.navigation?.mouseWheel]);

    useEffect(() => {
        if (!screenRef.current) {
            setFitScale(1);
            return;
        }

        const computeFitScale = () => {
            const screen = screenRef.current;
            if (!screen) return;

            const { clientWidth, clientHeight } = screen;
            const isCurrentlyFullscreen = (document.fullscreenElement === containerRef.current) || isFullscreen;

            const wFactor = isCurrentlyFullscreen ? 0.70 : 0.70;
            const hFactor = isCurrentlyFullscreen ? 0.80 : 0.80;

            const availableW = clientWidth * wFactor;
            const availableH = clientHeight * hFactor;

            // Calculate effective zoom (manualZoom only, interactionZoom is handled via CSS transform)
            // The user wants NO CSS scaling for manual zoom, meaning we apply the scale directly to the physical dimensions
            let baseZoom = manualZoom;

            // In fullscreen we might have a scaling factor applied externally
            if (isCurrentlyFullscreen) {
                baseZoom = baseZoom;
            }

            // Use the template editor height and width ratio
            const availablePageW = isSinglePage ? availableW : availableW / 2;
            const availablePageH = availableH;

            const scaleX = availablePageW / baseDimensions.width;
            const scaleY = availablePageH / baseDimensions.height;
            const scale = Math.min(scaleX, scaleY);

            const physicalZoom = baseZoom;

            setWIDTH(Math.round(baseDimensions.width * scale * physicalZoom));
            setHEIGHT(Math.round(baseDimensions.height * scale * physicalZoom));
            setActualPhysicalZoom(physicalZoom);
        };

        const observer = new ResizeObserver(computeFitScale);
        observer.observe(screenRef.current);

        // Re-run immediately on fullscreen change (before the ResizeObserver fires)
        const onFSChange = () => {
            // Use rAF to let the browser finish reflow after fullscreen transition
            requestAnimationFrame(computeFitScale);
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);

        computeFitScale();

        return () => {
            observer.disconnect();
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, [activeDevice, isSidebarOpen, isFullscreen, zoom, manualZoom, interactionZoom, baseDimensions, isTurnJs]);

    const setCurrentZoom = useCallback((val) => {
        if (typeof val === 'function') {
            setManualZoom(prev => val(prev));
        } else {
            setManualZoom(val);
        }
    }, [setManualZoom]);
    const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showNotesMenu, setShowNotesMenu] = useState(false);
    const [isAutoFlipping, setIsAutoFlipping] = useState(false);
    const [countdown, setCountdown] = useState(null);

    // Page dimensions (A4 ratio) dynamically scaled
    const [WIDTH, setWIDTH] = useState(400);
    const [HEIGHT, setHEIGHT] = useState(566);

    const [currentPage, setCurrentPage] = useState(targetPage);
    const [offset, setOffset] = useState(() => {
        // Compute the correct initial offset so first page is centered from the very first render
        if (targetPage === 0) return -(400 / 2); // WIDTH = 400, half-page shift left for cover
        if (targetPage >= (pages?.length ?? 0) - 1 && (pages?.length ?? 0) % 2 === 0) {
            return (targetPage % 2 === 0) ? -(400 / 2) : (400 / 2);
        }
        return 0;
    });
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);
    const [showThumbnailBar, setShowThumbnailBar] = useState(false);
    const [showAddBookmarkPopup, setShowAddBookmarkPopup] = useState(false);
    const [showAddNotesPopup, setShowAddNotesPopup] = useState(false);
    const [showNotesViewer, setShowNotesViewer] = useState(false);
    const [showViewBookmarkPopup, setShowViewBookmarkPopup] = useState(false);
    const [showGalleryPopup, setShowGalleryPopup] = useState(false);
    const [showSoundPopup, setShowSoundPopup] = useState(false);
    const [activePopupInteraction, setActivePopupInteraction] = useState(null);
    const [activeSlideshowInteraction, setActiveSlideshowInteraction] = useState(null);

    // Audio Logic (Centralized in Sound.jsx)
    // Audio state (for UI/Layout sync)
    const [isMuted, setIsMuted] = useState(false);
    const [isFlipMuted, setIsFlipMuted] = useState(false);
    const [flipTrigger, setFlipTrigger] = useState(0);

    // Independent Audio state for Mobile Layouts
    const [mobileIsMuted, setMobileIsMuted] = useState(false);
    const [mobileIsFlipMuted, setMobileIsFlipMuted] = useState(false);
    const [mobileFlipTrigger, setMobileFlipTrigger] = useState(0);

    const lastSoundLogicalRef = useRef(null);

    useEffect(() => {
        setShowAddNotesPopup(false);
        setShowNotesViewer(false);
        setShowAddBookmarkPopup(false);
        setShowViewBookmarkPopup(false);
        setShowGalleryPopup(false);
        setShowProfilePopup(false);
        setShowSoundPopup(false);
        setShowTOC(false);
        setShowThumbnailBar(false);
    }, [activeLayout]);

    useEffect(() => {
        if (settings?.navigation?.pageThumbnails === false) {
            setShowThumbnailBar(false);
        }
    }, [settings?.navigation?.pageThumbnails]);




    const augmentedPages = useMemo(() => {
        if (!pages || pages.length === 0) return [];
        const basePages = pages.filter(p => !p.isHidden);

        const transparentSheets = bookAppearanceSettings?.transparentSheets || [];
        if (!transparentSheets.length) return basePages;

        let finalPages = [];
        let logicalIndexCounter = 0;
        basePages.forEach((page, index) => {
            // Check for "Page 1" special case
            // If the transparent sheet is set to 'Page 1', it should appear before the actual Page 1
            if (index === 0) {
                const sheetPage1 = transparentSheets.find(s => s.page === 'Page 1');
                if (sheetPage1) {
                    const sImgScale = sheetPage1.scale !== undefined ? sheetPage1.scale / 100 : 1;
                    const sImgRotate = sheetPage1.rotate !== undefined ? sheetPage1.rotate : 0;
                    const sImgOpacity = sheetPage1.opacity !== undefined ? sheetPage1.opacity / 100 : 1;
                    const sOffsetX = sheetPage1.offsetX || 0;
                    const sOffsetY = sheetPage1.offsetY || 0;
                    const sheet1HtmlFront = sheetPage1.image
                        ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${sImgOpacity};transform:translate(${sOffsetX}%, ${sOffsetY}%) scale(${sImgScale}) rotate(${sImgRotate}deg);"><div style="width:80%;height:80%;background-image:url('${sheetPage1.image}');background-size:contain;background-position:center;background-repeat:no-repeat;"></div></div>`
                        : '';
                    const sheet1HtmlBack = sheetPage1.image
                        ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${sImgOpacity};transform:translate(${-sOffsetX}%, ${sOffsetY}%) scale(${sImgScale}) rotate(${sImgRotate}deg) scaleX(-1);"><div style="width:80%;height:80%;background-image:url('${sheetPage1.image}');background-size:contain;background-position:center;background-repeat:no-repeat;"></div></div>`
                        : '';
                    finalPages.push({
                        id: `ts-${sheetPage1.id}-front`,
                        isTransparentSheet: true,
                        sheetData: sheetPage1,
                        content: sheet1HtmlFront,
                        html: sheet1HtmlFront,
                        logicalPageIndex: logicalIndexCounter
                    });
                    finalPages.push({
                        id: `ts-${sheetPage1.id}-back`,
                        isTransparentSheet: true,
                        sheetData: sheetPage1,
                        content: sheet1HtmlBack,
                        html: sheet1HtmlBack,
                        logicalPageIndex: logicalIndexCounter
                    });
                }
            }

            finalPages.push({ ...page, isTransparentSheet: false, logicalPageIndex: logicalIndexCounter });
            logicalIndexCounter++;

            // "Page 2-3" means after Page 2 (index 1), before Page 3 (index 2)
            // Based on standard flipbooks, sheet between 2-3 is added after index 1.
            const sheetForThisGap = transparentSheets.find(s => s.page === `Page ${index + 1}-${index + 2}`);
            if (sheetForThisGap) {
                const sImgScale = sheetForThisGap.scale !== undefined ? sheetForThisGap.scale / 100 : 1;
                const sImgRotate = sheetForThisGap.rotate !== undefined ? sheetForThisGap.rotate : 0;
                const sImgOpacity = sheetForThisGap.opacity !== undefined ? sheetForThisGap.opacity / 100 : 1;
                const sOffsetX = sheetForThisGap.offsetX || 0;
                const sOffsetY = sheetForThisGap.offsetY || 0;
                const sheetHtmlFront = sheetForThisGap.image
                    ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${sImgOpacity};transform:translate(${sOffsetX}%, ${sOffsetY}%) scale(${sImgScale}) rotate(${sImgRotate}deg);"><div style="width:80%;height:80%;background-image:url('${sheetForThisGap.image}');background-size:contain;background-position:center;background-repeat:no-repeat;"></div></div>`
                    : '';
                const sheetHtmlBack = sheetForThisGap.image
                    ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${sImgOpacity};transform:translate(${-sOffsetX}%, ${sOffsetY}%) scale(${sImgScale}) rotate(${sImgRotate}deg) scaleX(-1);"><div style="width:80%;height:80%;background-image:url('${sheetForThisGap.image}');background-size:contain;background-position:center;background-repeat:no-repeat;"></div></div>`
                    : '';
                // Insert Front of transparent sheet
                finalPages.push({
                    id: `ts-${sheetForThisGap.id}-front`,
                    isTransparentSheet: true,
                    sheetData: sheetForThisGap,
                    content: sheetHtmlFront,
                    html: sheetHtmlFront,
                    logicalPageIndex: Math.max(0, logicalIndexCounter - 1)
                });
                // Insert Back of transparent sheet
                finalPages.push({
                    id: `ts-${sheetForThisGap.id}-back`,
                    isTransparentSheet: true,
                    sheetData: sheetForThisGap,
                    content: sheetHtmlBack,
                    html: sheetHtmlBack,
                    logicalPageIndex: Math.max(0, logicalIndexCounter - 1)
                });
            }
        });
        return finalPages;
    }, [pages, bookAppearanceSettings?.transparentSheets]);

    useEffect(() => {
        if (!disableAutoGallery && !isPublishedPreview && otherSetupSettings?.gallery?.previewOpen && otherSetupSettings.gallery.previewOpen !== lastPreviewOpen.current) {
            setShowGalleryPopup(true);
            lastPreviewOpen.current = otherSetupSettings.gallery.previewOpen;
        }
    }, [otherSetupSettings?.gallery?.previewOpen, isPublishedPreview, disableAutoGallery]);

    // Sync current page with targetPage prop (from TemplateEditor's activePageIndex)
    useEffect(() => {
        if (targetPage !== undefined && targetPage !== currentPage) {
            setCurrentPage(targetPage);
            // Ensure the flipbook engine also jumps to the new page
            if (bookRef.current) {
                // Determine if we need to call turnToPage or similar
                const flip = bookRef.current?.pageFlip();
                if (flip) {
                    // Use a small delay to ensure the turn engine is fully initialized
                    setTimeout(() => {
                        try { flip.turnToPage(targetPage); } catch (e) { console.warn('Flip failed', e); }
                    }, 50);
                }
            }
        }
    }, [targetPage]);

    const handleToggleAudio = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);
    const [showTOC, setShowTOC] = useState(false);

    useEffect(() => {
        if (settings?.navigation?.tableOfContents === false) {
            setShowTOC(false);
        }
    }, [settings?.navigation?.tableOfContents]);

    useEffect(() => {
        if (settings?.navigation?.bookmark === false) {
            setShowBookmarkMenu(false);
            setShowViewBookmarkPopup(false);
            setShowAddBookmarkPopup(false);
        }
    }, [settings?.navigation?.bookmark]);

    // Open TOC popup when triggered from MenuBar settings icon click
    useEffect(() => {
        if (externalShowTOC) {
            setShowTOC(true);
        }
    }, [externalShowTOC]);
    const [showExportPopup, setShowExportPopup] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);

    useEffect(() => {
        if (showSharePopup) {
            setShowProfilePopup(false);
            setShowExportPopup(false);
        }
    }, [showSharePopup]);

    useEffect(() => {
        if (showProfilePopup) {
            setShowSharePopup(false);
            setShowExportPopup(false);
        }
    }, [showProfilePopup]);

    useEffect(() => {
        if (showExportPopup) {
            setShowSharePopup(false);
            setShowProfilePopup(false);
        }
    }, [showExportPopup]);

    useEffect(() => {
        if (showThumbnailBar || showTOC || showBookmarkMenu || showMoreMenu || showNotesMenu || showSoundPopup || showGalleryPopup || showAddBookmarkPopup || showAddNotesPopup || showNotesViewer || showViewBookmarkPopup) {
            setShowSharePopup(false);
            setShowExportPopup(false);
            setShowProfilePopup(false);
        }
    }, [showThumbnailBar, showTOC, showBookmarkMenu, showMoreMenu, showNotesMenu, showSoundPopup, showGalleryPopup, showAddBookmarkPopup, showAddNotesPopup, showNotesViewer, showViewBookmarkPopup]);

    useEffect(() => {
        setShowProfilePopup(false);
    }, [activeDevice]);

    useEffect(() => {
        if (settings?.brandingProfile?.profile === false) {
            setShowProfilePopup(false);
        }
    }, [settings?.brandingProfile?.profile]);

    useEffect(() => {
        if (settings?.shareExport?.share === false) {
            setShowSharePopup(false);
        }
    }, [settings?.shareExport?.share]);

    useEffect(() => {
        if (settings?.shareExport?.download === false) {
            setShowExportPopup(false);
        }
    }, [settings?.shareExport?.download]);

    useEffect(() => {
        if (settings?.interaction?.gallery === false) {
            setShowGalleryPopup(false);
        }
    }, [settings?.interaction?.gallery]);

    useEffect(() => {
        const audioEnabled = settings?.media?.backgroundAudio ?? settings?.media?.audio ?? true;
        if (audioEnabled === false) {
            setShowSoundPopup(false);
        }
    }, [settings?.media?.backgroundAudio, settings?.media?.audio]);

    const [searchQuery, setSearchQuery] = useState('');




    const deviceStyles = {
        Desktop: { width: '100%', height: '100%', borderRadius: '0', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', flex: 1 },
        Tablet: {
            width: 'auto',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '1091/869',
            borderRadius: '0',
            margin: 'auto',
            position: 'relative',
            backgroundImage: 'url("/src/assets/cover/Tab 1.svg")',
            backgroundSize: '95% 95%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: 'transparent',
            transformOrigin: 'center center',
            flexShrink: 0
        },
    };

    const getScreenWrapperStyle = () => {
        if (activeDevice === 'Desktop') return { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 };
        if (activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet) return {
            position: 'absolute',
            top: '9.38%',
            bottom: '7.7%',
            left: '5.3%',
            right: '6.6%',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transform: 'translateZ(0)' // Establish containing block for fixed Modals
        };
        return { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, transform: 'translateZ(0)' };
    };



    const layout1Bookmarks = bookmarks;
    const layout2Bookmarks = bookmarks;
    const layout3Bookmarks = bookmarks;
    const layout4Bookmarks = bookmarks;
    const layout5Bookmarks = bookmarks;
    const layout6Bookmarks = bookmarks;
    const layout7Bookmarks = bookmarks;
    const layout8Bookmarks = bookmarks;

    const layout1Notes = useMemo(() => notes.filter(n => n.layoutId === 1), [notes]);
    const layout2Notes = useMemo(() => notes.filter(n => n.layoutId === 2), [notes]);
    const layout3Notes = useMemo(() => notes.filter(n => n.layoutId === 3), [notes]);
    const layout4Notes = useMemo(() => notes.filter(n => n.layoutId === 4), [notes]);
    const layout5Notes = useMemo(() => notes.filter(n => n.layoutId === 5), [notes]);
    const layout6Notes = useMemo(() => notes.filter(n => n.layoutId === 6), [notes]);
    const layout7Notes = useMemo(() => notes.filter(n => n.layoutId === 7), [notes]);
    const layout8Notes = useMemo(() => notes.filter(n => n.layoutId === 8), [notes]);

    const currentBookmarks = bookmarks;
    const currentNotes = useMemo(() => notes.filter(n => n.layoutId === Number(activeLayout)), [notes, activeLayout]);

    const setIsPlaying = useCallback((val) => {
        setIsAutoFlipping(val);
        // Sync with settings
        if (onUpdateOtherSetup) {
            onUpdateOtherSetup(prev => ({
                ...prev,
                toolbar: {
                    ...(prev?.toolbar || {}),
                    autoFlipEnabled: val
                }
            }));
        }
    }, [onUpdateOtherSetup]);

    // Sync isAutoFlipping state with settings
    useEffect(() => {
        if (otherSetupSettings?.toolbar?.autoFlipEnabled !== undefined) {
            setIsAutoFlipping(!!otherSetupSettings.toolbar.autoFlipEnabled);
        }
    }, [otherSetupSettings?.toolbar?.autoFlipEnabled]);

    const setShowTOCMemo = useCallback((val) => {
        console.log('🔄 PreviewArea: setShowTOCMemo triggered with value:', val);
        if (val) {
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
        }
        setShowTOC(val);
    }, []);

    const setShowThumbnailBarMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
        }
        setShowThumbnailBar(val);
    }, []);

    const setShowAddBookmarkPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
        }
        setShowAddBookmarkPopup(val);
    }, []);

    const setShowAddNotesPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowNotesViewer(false);
        }
        setShowAddNotesPopup(val);
    }, []);

    const setShowNotesViewerMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
        }
        setShowNotesViewer(val);
    }, []);

    const setShowBookmarkMenuMemo = useCallback((val) => setShowBookmarkMenu(val), []);
    const setShowMoreMenuMemo = useCallback((val) => setShowMoreMenu(val), []);
    const setShowNotesMenuMemo = useCallback((val) => setShowNotesMenu(val), []);


    const setShowGalleryPopupMemo = useCallback((val) => setShowGalleryPopup(val), []);
    const setShowSoundPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
            if (Number(activeLayout) !== 4) {
                setShowMoreMenu(false);
            }
        }
        setShowSoundPopup(val);
    }, [activeLayout]);

    const onAddNote = useCallback((note) => {
        if (setNotes) {
            setNotes(prev => [...prev, { ...note, layoutId: activeLayout }]);
        }
    }, [activeLayout, setNotes]);

    const onAddBookmark = useCallback((bookmark) => {
        if (setBookmarks) {
            setBookmarks(prev => [...prev, bookmark]);
        }
    }, [setBookmarks]);

    const onDeleteBookmark = useCallback((id) => {
        if (setBookmarks) {
            setBookmarks(prev => prev.filter(b => b.id !== id));
        }
    }, [setBookmarks]);

    const onUpdateBookmark = useCallback((id, newLabel) => {
        if (setBookmarks) {
            setBookmarks(prev => prev.map(b => b.id === id ? { ...b, label: newLabel } : b));
        }
    }, [setBookmarks]);

    const onPageClick = useCallback((index) => {
        const physicalIndex = augmentedPages.findIndex(p => p.logicalPageIndex === index && !p.isTransparentSheet);
        const targetIndex = physicalIndex !== -1 ? physicalIndex : index;
        bookRef.current?.pageFlip()?.turnToPage(targetIndex);
    }, [augmentedPages]);

    // Listen to page navigation events sent from the page iframe
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data && e.data.type === 'navigate-to-page') {
                const targetIdx = e.data.page - 1; // Convert 1-indexed to 0-indexed
                if (targetIdx >= 0 && targetIdx < pages.length) {
                    onPageClick(targetIdx);
                }
            } else if (e.data && e.data.type === 'IFRAME_WHEEL') {
                if (settings?.navigation?.mouseWheel) {
                    if (isFlippingRef.current) return;

                    // Only flip on significant scroll to avoid accidental tiny trackpad scrolls locking the flip state
                    if (Math.abs(e.data.deltaY) < 10) return;

                    if (e.data.deltaY > 0) {
                        bookRef.current?.pageFlip()?.flipNext();
                    } else if (e.data.deltaY < 0) {
                        bookRef.current?.pageFlip()?.flipPrev();
                    }

                    isFlippingRef.current = true;
                    setTimeout(() => {
                        isFlippingRef.current = false;
                    }, 300);
                }
            } else if (e.data && e.data.type === 'zoom-to-element') {
                const { rect, speed, pageNumber } = e.data;
                const scale = speed === 'Fast' ? 2.5 : speed === 'Slow' ? 1.5 : 2;
                setInteractionZoom({ scale, rect, pageNumber });
            } else if (e.data && e.data.type === 'zoom-out-element') {
                // Step 1: animate scale back to 1 (smooth, same origin)
                setInteractionZoom(prev => prev ? { ...prev, scale: 1 } : null);
                // Step 2: after transition, clear completely
                setTimeout(() => setInteractionZoom(null), 550);
            } else if (e.data && e.data.type === 'download-file') {
                const forceDownload = async (url, filename) => {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error("Network error during download");
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = filename || 'download';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                    } catch (error) {
                        console.error('Download failed, falling back to open:', error);
                        window.open(url, '_blank');
                    }
                };

                try {
                    const meta = JSON.parse(e.data.value);
                    if (meta.data) {
                        forceDownload(meta.data, meta.name || 'download');
                    }
                } catch (err) {
                    forceDownload(e.data.value, 'download');
                }
            } else if (e.data && e.data.type === 'open-email') {
                if (e.data.target === '_blank') {
                    window.open('mailto:' + e.data.value, '_blank');
                } else {
                    window.location.href = 'mailto:' + e.data.value;
                }
            } else if (e.data && e.data.type === 'show-tooltip') {
                setActiveTooltip(e.data);
            } else if (e.data && e.data.type === 'hide-tooltip') {
                setActiveTooltip(null);
            } else if (e.data && e.data.type === 'show-popup-interaction') {
                setActivePopupInteraction(e.data);
            } else if (e.data && e.data.type === 'hide-popup-interaction') {
                setActivePopupInteraction(null);
            } else if (e.data && e.data.type === 'show-slideshow-interaction') {
                setActiveSlideshowInteraction({ ...e.data, currentIndex: 0 });
            } else if (e.data && e.data.type === 'hide-slideshow-interaction') {
                setActiveSlideshowInteraction(null);
            } else if (e.data && e.data.type === 'show-3d-viewer' && e.data.url) {
                let finalUrl = e.data.url;
                if (typeof finalUrl === 'string' && finalUrl.startsWith('/uploads/')) {
                    finalUrl = resolveUploadsPath(finalUrl);
                }
                setActive3DModelUrl(finalUrl);

                setActive3DModelVId(e.data.v_id || e.data.vId || null);
                setActive3DModelHotspots(Array.isArray(e.data.hotspots) ? e.data.hotspots : []);
                if (e.data.config) {
                    setActive3DModelConfig(e.data.config);
                } else {
                    setActive3DModelConfig(null);
                }
            }
        };
        window.addEventListener('message', handleMessage);

        const handleOpenTOCPreview = () => {
            setShowTOCMemo(true);
        };
        window.addEventListener('open-toc-preview', handleOpenTOCPreview);

        const handleOpenProfilePreview = () => {
            setShowProfilePopup(true);
        };
        window.addEventListener('open-profile-preview', handleOpenProfilePreview);

        const handleCloseProfilePreview = () => {
            setShowProfilePopup(false);
        };
        window.addEventListener('close-profile-preview', handleCloseProfilePreview);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('open-toc-preview', handleOpenTOCPreview);
            window.removeEventListener('open-profile-preview', handleOpenProfilePreview);
            window.removeEventListener('close-profile-preview', handleCloseProfilePreview);
        };
    }, [pages, onPageClick, setShowTOCMemo, setShowProfilePopup]);

    const handleZoomIn = useCallback(() => setManualZoom(prev => Math.min(prev + 0.05, 2)), []);
    const handleZoomOut = useCallback(() => setManualZoom(prev => Math.max(prev - 0.05, 0.5)), []);
    const handleFullScreen = useCallback(() => {
        if (!isFullscreen) {
            if (useNativeFullscreen && containerRef.current) {
                containerRef.current.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            }
            setIsFullscreen(true);
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            setIsFullscreen(false);
        }
    }, [useNativeFullscreen, isFullscreen]);

    useEffect(() => {
        if (!useNativeFullscreen) return;
        const onFSChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, [useNativeFullscreen]);

    const handleShare = useCallback(() => {
        // Close export/download popup first
        setShowExportPopup(false);
        // Open share popup after the call stack to avoid immediate closure by outside click handlers
        setTimeout(() => setShowSharePopup(true), 0);
    }, []);

    const handleDownload = useCallback(() => {
        // Close share popup first
        setShowSharePopup(false);
        // Open export/download popup after the call stack
        setTimeout(() => setShowExportPopup(true), 0);
    }, []);

    const handleQuickSearch = useCallback((query) => {
        if (!query.trim()) return;

        const lowerQuery = query.toLowerCase();
        const foundPageIndex = pages.findIndex(page => {
            const content = (page.html || page.content || '').toLowerCase();
            return content.includes(lowerQuery);
        });

        if (foundPageIndex !== -1) {
            onPageClick(foundPageIndex);
        }
    }, [pages, onPageClick]);



    // Click inside preview area (background) to close menus
    useEffect(() => {
        const handleClickInside = (e) => {
            // 1. Only handle if click is inside the PreviewArea container
            if (!containerRef.current || !containerRef.current.contains(e.target)) {
                return;
            }

            // 2. Don't close if clicking on interactive elements (buttons, inputs, etc.) or popups
            // This ensures buttons to open popups still work and clicking inside popups doesn't close them.
            if (e.target.closest('button, input, textarea, select, a, [role="button"], .fbe-book, .fisto-menu-content, .thumbnail-bar')) {
                return;
            }

            setShowBookmarkMenu(false);
            setShowMoreMenu(false);
            setShowThumbnailBar(false);
            setShowTOC(false);
            setShowSoundPopup(false);
            setShowNotesMenu(false);
            setShowGalleryPopup(false);
        };
        document.addEventListener('click', handleClickInside);
        return () => document.removeEventListener('click', handleClickInside);
    }, [containerRef]);

    const logoObjectFit = logoSettings?.type === 'Crop' ? 'fill' : (logoSettings?.type === 'Fill' ? 'cover' : logoSettings?.type === 'Stretch' ? 'fill' : 'contain');

    // Compute crop styles for the logo image if cropData is present
    const logoCropStyle = React.useMemo(() => {
        const cd = logoSettings?.cropData;
        if (!cd || !cd.inset) return {};
        return {
            clipPath: cd.inset,
            WebkitClipPath: cd.inset,
            transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`,
            transformOrigin: 'center center'
        };
    }, [logoSettings?.cropData]);





    // Stop auto-flip when last page is reached (common for all layouts)
    useEffect(() => {
        if (isAutoFlipping && currentPage >= pages.length - 1) {
            setIsPlaying(false);
        }
    }, [currentPage, pages.length, isAutoFlipping, setIsPlaying]);

    // Handle Auto Flip logic with 3-2-1 countdown
    useEffect(() => {
        if (!isAutoFlipping || pages.length <= 1) {
            setCountdown(null);
            return;
        }

        const duration = settings.media?.autoFlipSettings?.duration || settings.toolbar?.autoFlipDuration || 5; // duration in seconds
        const showCountdown = settings.media?.autoFlipSettings?.countdown ?? settings.toolbar?.nextFlipCountdown ?? false;

        // The overall timer for the flip
        const timer = setTimeout(() => {
            if (currentPage < pages.length - 1) {
                bookRef.current?.pageFlip()?.flipNext();
            } else {
                setIsPlaying(false);
            }
        }, duration * 1000);

        let countdownInterval;
        let countdownTimer;

        if (showCountdown && duration >= 3) {
            // Start countdown 3 seconds before the flip
            const countdownStartMs = (duration - 3) * 1000;
            countdownTimer = setTimeout(() => {
                let count = 3;
                setCountdown(count);
                countdownInterval = setInterval(() => {
                    count -= 1;
                    if (count > 0) {
                        setCountdown(count);
                    } else {
                        setCountdown(null);
                        clearInterval(countdownInterval);
                    }
                }, 1000);
            }, countdownStartMs);
        }

        return () => {
            clearTimeout(timer);
            if (countdownTimer) clearTimeout(countdownTimer);
            if (countdownInterval) clearInterval(countdownInterval);
            setCountdown(null);
        };
    }, [isAutoFlipping, currentPage, pages.length, settings.toolbar?.autoFlipDuration, settings.toolbar?.nextFlipCountdown, setIsPlaying]);

    // Book Appearance Logic - Using helper functions with memoization to prevent re-render loops
    const processedAppearance = React.useMemo(() =>
        BookAppearanceHelpers.processBookAppearanceSettings(bookAppearanceSettings),
        [bookAppearanceSettings]
    );

    const {
        shadowStyle,
        shadowFilter,
        cornerRadius,
        pageOpacity,
        textureStyle,
        flipTime,
        flipStyle, // Get flipStyle from processedAppearance
        hardCover: useHardCover,
        shadowActive
    } = processedAppearance;

    // Memoize background style to prevent re-render loops
    const backgroundStyle = React.useMemo(() => {
        // Helper to mix hex and opacity
        const hexToRgba = (hex, opacity = 100) => {
            if (!hex) return `rgba(218, 219, 232, ${opacity / 100})`;
            let c = hex.substring(1).split('');
            if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            if (c.length !== 6) return hex; // Give up on malformed hex
            const val = parseInt(c.join(''), 16);
            return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity / 100})`;
        };

        const opacity = (backgroundSettings?.opacity ?? 100) / 100;

        let finalColor = backgroundSettings?.color || '#D9D9D9';
        if (finalColor.toUpperCase() === '#DADBE8' || finalColor.toUpperCase() === '#E2E4F0') {
            finalColor = '#D9D9D9';
        }

        if (backgroundSettings?.style === 'Gradient') {
            return { backgroundImage: backgroundSettings.gradient, opacity };
        } else if (backgroundSettings?.style === 'Image' && backgroundSettings.image) {
            const adj = backgroundSettings.adjustments || {};
            const exposure = adj.exposure || 0;
            const contrast = adj.contrast || 0;
            const saturation = adj.saturation || 0;
            const temperature = adj.temperature || 0;
            const tint = adj.tint || 0;
            const highlights = (adj.highlights || 0) / 5;
            const shadows = (adj.shadows || 0) / 5;

            const filterStr = `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;

            const fitMap = {
                'Fit': 'contain',
                'Fill': 'cover',
                'Stretch': '100% 100%'
            };

            // Apply crop to background via clip-path and transform for consistency
            const bgCrop = backgroundSettings.cropData;
            const cropStyle = (bgCrop && bgCrop.inset) ? {
                clipPath: bgCrop.inset,
                WebkitClipPath: bgCrop.inset,
                transform: `translate(${bgCrop.offX}%, ${bgCrop.offY}%) scale(${bgCrop.scale})`,
                transformOrigin: 'center center'
            } : {};

            return {
                backgroundColor: finalColor,
                backgroundImage: `url(${backgroundSettings.image})`,
                backgroundSize: (bgCrop && bgCrop.inset) ? '100% 100%' : (fitMap[backgroundSettings.fit] || 'cover'),
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: filterStr,
                opacity,
                ...cropStyle
            };
        }
        return { backgroundColor: hexToRgba(finalColor, backgroundSettings?.opacity ?? 100) };
    }, [backgroundSettings]);

    const {
        makeFirstLastPageHard = false,
        selectCustomHardPages = false,
        customHardPages: rawCustomHardPages
    } = bookAppearanceSettings || {};

    const customHardPages = useMemo(() => rawCustomHardPages || [], [rawCustomHardPages]);

    const onFlip = useCallback((e) => {
        const logicalIndex = e.data;
        setCurrentPage(logicalIndex);

        if (externalOnFlip) {
            externalOnFlip(logicalIndex);
        }

        // Compute offset for UI centering
        let newOffset = 0;
        const totalPages = augmentedPages.length || pages.length;
        if (logicalIndex === 0) {
            newOffset = -(WIDTH / 2);
        } else if (logicalIndex === totalPages - 1) {
            // For the back cover, shift to center the single page
            newOffset = (logicalIndex % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2);
        } else {
            newOffset = 0;
        }
        setOffset(newOffset);

        // Signal a flip to the Sound component
        if (lastSoundLogicalRef.current !== logicalIndex) {
            lastSoundLogicalRef.current = logicalIndex;
            setFlipTrigger(prev => prev + 1);
            setMobileFlipTrigger(prev => prev + 1);
        }

        // Fix for iframe cursor issue: Blur parent buttons so iframe can capture focus
        if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            document.activeElement.blur();
        }
    }, [pages.length, WIDTH, useHardCover, externalOnFlip]);

    const onTurning = useCallback((e) => {
        const logicalIndex = e.data;
        if (logicalIndex !== currentPage) {
            setCurrentPage(logicalIndex);

            if (externalOnFlip) {
                externalOnFlip(logicalIndex);
            }

            // Signal a flip to the Sound component when turning starts
            if (lastSoundLogicalRef.current !== logicalIndex) {
                lastSoundLogicalRef.current = logicalIndex;
                setFlipTrigger(prev => prev + 1);
                setMobileFlipTrigger(prev => prev + 1);
            }
        }

        // Fix for iframe cursor issue: Blur parent buttons so iframe can capture focus
        if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            document.activeElement.blur();
        }
    }, [currentPage, externalOnFlip])


    useEffect(() => {
        const visiblePages = [];
        if (currentPage === 0) {
            visiblePages.push(1);
        } else if (currentPage >= pages.length - 1) {
            visiblePages.push(pages.length);
        } else {
            visiblePages.push(currentPage + 1);
            if (currentPage + 2 <= pages.length) visiblePages.push(currentPage + 2);
        }

        if (containerRef.current) {
            containerRef.current.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow?.postMessage({ type: 'PAGE_TURNED', visiblePages }, '*');
                } catch (err) { /* cross-origin iframe – skip */ }
            });
        }

        const handleMessage = (e) => {
            if (e.data && e.data.type === 'REQUEST_PAGE_STATE') {
                if (e.source) {
                    e.source.postMessage({ type: 'PAGE_TURNED', visiblePages }, '*');
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentPage, pages.length]);

    const watermarkSettingsRef = useRef(watermarkSettings);

    useEffect(() => {
        watermarkSettingsRef.current = watermarkSettings;

        // Dynamically update the watermark in all iframes to prevent flickering
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (!iframe.contentDocument) return;
                const container = iframe.contentDocument.getElementById('flipbook-watermark-container');
                const img = iframe.contentDocument.getElementById('flipbook-watermark-img');

                if (container && img) {
                    const ws = watermarkSettings;
                    const opacity = (ws?.opacity ?? 100) / 100;

                    let positionStyle = "";
                    const offset = '4%';
                    const posX = ws?.positionX ?? 0;
                    const posY = ws?.positionY ?? 0;

                    switch (ws?.position) {
                        case 'Top Left': positionStyle = `top: ${offset}; left: ${offset}; bottom: auto; right: auto;`; break;
                        case 'Top Right': positionStyle = `top: ${offset}; right: ${offset}; bottom: auto; left: auto;`; break;
                        case 'Bottom Left': positionStyle = `bottom: ${offset}; left: ${offset}; top: auto; right: auto;`; break;
                        case 'Center': positionStyle = `top: 50%; left: 50%; bottom: auto; right: auto;`; break;
                        case 'Bottom Right':
                        default: positionStyle = `bottom: ${offset}; right: ${offset}; top: auto; left: auto;`; break;
                    }

                    if (ws?.position === 'Center') {
                        container.style.transform = `translate(calc(-50% + ${posX}%), calc(-50% + ${posY}%))`;
                    } else {
                        container.style.transform = `translate(${posX}%, ${posY}%)`;
                    }

                    container.style.cssText += positionStyle;
                    container.style.opacity = opacity;

                    const scale = (ws?.scale ?? 100) / 100;
                    const rotate = ws?.rotate ?? 0;

                    const f = ws?.adjustments || {};
                    const exposure = f.exposure || 0;
                    const contrast = f.contrast || 0;
                    const saturation = f.saturation || 0;
                    const temperature = f.temperature || 0;
                    const tint = f.tint || 0;
                    const hl = f.highlights || 0;
                    const sd = f.shadows || 0;
                    let filterStr = "";
                    filterStr += `brightness(${100 + exposure + (hl / 5)}%) `;
                    filterStr += `contrast(${100 + contrast + (sd / 5)}%) `;
                    filterStr += `saturate(${100 + saturation}%) `;
                    if (tint !== 0) filterStr += `hue-rotate(${tint}deg) `;
                    if (temperature > 0) filterStr += `sepia(${temperature / 2}%) `;
                    else if (temperature < 0) filterStr += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

                    img.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
                    img.style.filter = filterStr;
                }
            } catch (e) { }
        });
    }, [watermarkSettings]);

    const watermarkSrc = watermarkSettings?.src;

    const memoizedBuildPageDoc = useCallback((html, pageNum) => {
        return getIframeContent(html, pageNum, watermarkSettingsRef.current, pages.length, isSinglePage);
    }, [watermarkSrc, pages.length, isSinglePage]);

    const bookRendererProps = {
        augmentedPages,
        WIDTH,
        HEIGHT,
        baseDimensions,
        flipTime,
        flipStyle, // Pass flipStyle to TurnJsBookRenderer
        useHardCover,
        makeFirstLastPageHard,
        selectCustomHardPages,
        customHardPages,
        targetPage,
        bookRef,
        onFlip,
        onTurning,
        cornerRadius,
        pageOpacity,
        textureStyle,
        shadowActive,
        shadowStyle,
        shadowFilter,
        currentPage,
        singlePage: isSinglePage,
        pagesCount: pages.length,
        onPageClick,
        settings,
        setShowViewBookmarkPopup,
        buildPageDoc: memoizedBuildPageDoc,
        activeLayout,
        interactionZoom,
        activeTooltip,
        isTurnJs,
        physicalZoom: actualPhysicalZoom,
        watermarkSettings,
        style: (() => {
            if (!interactionZoom) return { transition: 'transform 0.5s ease', transform: 'scale(1)', transformOrigin: 'center center' };
            const { scale, rect, pageNumber } = interactionZoom;
            const originX = ((rect.left + rect.width / 2) / rect.windowWidth) * 100;
            const originY = ((rect.top + rect.height / 2) / rect.windowHeight) * 100;
            let finalOriginX = originX;
            if (activeDevice !== 'Mobile') {
                const isRightPage = pageNumber % 2 !== 0;
                finalOriginX = isRightPage ? 50 + (originX / 2) : originX / 2;
            }
            return {
                transform: `scale(${scale})`,
                transformOrigin: `${finalOriginX}% ${originY}%`,
                transition: 'transform 0.5s ease',
                zIndex: 50
            };
        })()
    };


    const prevSubViewRef = useRef(activeSubView);
    useEffect(() => {
        if ((activeSubView || '').toLowerCase() === 'leadform' && (prevSubViewRef.current || '').toLowerCase() !== 'leadform') {
            setLeadFormSubmitted(false);
        }
        prevSubViewRef.current = activeSubView;
    }, [activeSubView]);

    const prevEnabledRef = useRef(leadFormSettings?.enabled);
    useEffect(() => {
        const currentEnabled = leadFormSettings?.enabled === true || leadFormSettings?.enabled === 'true';
        const prevEnabled = prevEnabledRef.current === true || prevEnabledRef.current === 'true';
        if (currentEnabled && !prevEnabled && !isPublishedPreview) {
            setLeadFormSubmitted(false);
        }
        prevEnabledRef.current = leadFormSettings?.enabled;
    }, [leadFormSettings?.enabled, isPublishedPreview]);

    useEffect(() => {
        const isEnabled = leadFormSettings?.enabled === true || leadFormSettings?.enabled === 'true';
        if (!leadFormSettings || !isEnabled) {
            setShowLeadForm(false);
            return;
        }

        if (isLoading || leadFormSubmitted) {
            setShowLeadForm(false);
            return;
        }

        const isLeadFormTabActive = (activeSubView || '').toLowerCase() === 'leadform';
        if (isLeadFormTabActive) {
            setShowLeadForm(true);
            return;
        }

        const timing = leadFormSettings.appearance?.timing || 'before';
        const afterPages = leadFormSettings.appearance?.afterPages || 1;

        if (timing === 'before') {
            setShowLeadForm(true);
        } else if (timing === 'after-pages' && currentPage >= afterPages - 1) {
            setShowLeadForm(true);
        } else if (timing === 'end' && pages.length > 0 && currentPage >= pages.length - 2) {
            setShowLeadForm(true);
        } else if (timing !== 'after-seconds') {
            setShowLeadForm(false);
        }
    }, [currentPage, leadFormSettings, leadFormSubmitted, pages.length, activeSubView, isLoading]);

    // Separate useEffect for after-seconds to prevent resetting timer on page change
    useEffect(() => {
        let timeoutId;
        const isLeadFormTabActive = (activeSubView || '').toLowerCase() === 'leadform';
        if (isLeadFormTabActive || isLoading) return;

        const isEnabled = leadFormSettings?.enabled === true || leadFormSettings?.enabled === 'true';
        if (isEnabled && !leadFormSubmitted && leadFormSettings.appearance?.timing === 'after-seconds') {
            const afterSeconds = leadFormSettings.appearance?.afterSeconds || 30;
            timeoutId = setTimeout(() => {
                setShowLeadForm(true);
            }, afterSeconds * 1000);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [leadFormSettings?.enabled, leadFormSettings?.appearance?.timing, leadFormSettings?.appearance?.afterSeconds, leadFormSubmitted, activeSubView, isLoading]);



    // Consistently handle centering offset across all layouts and engines
    useEffect(() => {
        // Inject global styles for the progress bar thumb
        const thumbStyleId = 'global-custom-video-progress-style';
        if (!document.getElementById(thumbStyleId)) {
            const ts = document.createElement('style');
            ts.id = thumbStyleId;
            ts.textContent = `
            input.custom-video-progress {
              -webkit-appearance: none !important;
              appearance: none !important;
              accent-color: transparent !important;
            }
            input.custom-video-progress::-webkit-slider-thumb {
              -webkit-appearance: none !important;
              appearance: none !important;
              width: 6px !important;
              height: 6px !important;
              border-radius: 50% !important;
              background: #ffffff !important;
              cursor: pointer !important;
              box-shadow: none !important;
              border: none !important;
              margin-top: -2.5px !important;
            }
            input.custom-video-progress::-moz-range-thumb {
              width: 6px !important;
              height: 6px !important;
              border-radius: 50% !important;
              background: #ffffff !important;
              cursor: pointer !important;
              border: none !important;
              box-shadow: none !important;
            }
            input.custom-video-progress::-webkit-slider-runnable-track {
              height: 1px !important;
              background: rgba(255,255,255,0.4) !important;
              border-radius: 1px !important;
            }
            .custom-video-overlay {
              opacity: 0;
              background: transparent;
              transition: opacity 0.3s ease, background 0.3s ease !important;
            }
            .custom-video-overlay.is-paused,
            .custom-video-overlay.video-is-hovered,
            [id]:hover > .custom-video-overlay,
            [id]:hover > foreignObject > .custom-video-overlay,
            foreignObject:hover > .custom-video-overlay,
            .custom-video-overlay:hover {
              opacity: 1 !important;
              background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%) !important;
            }
          `;
            document.head.appendChild(ts);
        }

        let intervalId;
        const renderVideoControls = () => {
            document.querySelectorAll('[data-page-index] video, foreignObject video').forEach(v => {
                if (!v.hasAttribute('data-custom-ctrl-active')) {
                    v.controls = false;
                    v.removeAttribute('controls');
                }
            });

            const videos = document.querySelectorAll('.page-svg-container video, .flipbook-magazine-wrapper video');
            videos.forEach(video => {
                const fo = video.closest('foreignObject');
                const liveEl = fo ? (fo.closest('[id]') || fo) : (video.closest('[id]') || video);
                const layerId = liveEl.id;
                if (!layerId) return;

                const showControls = video.getAttribute('data-show-controls') !== 'false';

                // APPLY CUSTOM VIDEO PROPERTIES
                const pbSpeedStr = video.getAttribute('data-playback-speed');
                if (pbSpeedStr) {
                    const pbSpeed = parseFloat(pbSpeedStr.replace('x', ''));
                    if (!isNaN(pbSpeed)) video.playbackRate = pbSpeed;
                }

                if (!video.hasAttribute('data-video-props-applied')) {
                    video.setAttribute('data-video-props-applied', 'true');

                    const defVolStr = video.getAttribute('data-default-volume');
                    if (defVolStr) {
                        video.volume = parseInt(defVolStr) / 100;
                    }

                    const startTimeAttr = video.getAttribute('data-start-time');
                    let sTime = 0;
                    if (startTimeAttr) {
                        const parts = startTimeAttr.split(':').map(Number);
                        if (parts.length === 3) sTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        else if (parts.length === 2) sTime = parts[0] * 60 + parts[1];
                    }
                    const endTimeAttr = video.getAttribute('data-end-time');
                    let eTime = Infinity;
                    if (endTimeAttr) {
                        const parts = endTimeAttr.split(':').map(Number);
                        if (parts.length === 3) eTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        else if (parts.length === 2) eTime = parts[0] * 60 + parts[1];
                    }
                    video._startTime = sTime;
                    video._endTime = eTime;

                    if (sTime > 0) {
                        video.currentTime = sTime;
                    }

                    video.addEventListener('timeupdate', () => {
                        if (video._startTime > 0 && video.currentTime < video._startTime - 0.5) {
                            video.currentTime = video._startTime;
                        }
                        if (video._endTime < Infinity && video.currentTime >= video._endTime) {
                            if (video.loop) {
                                video.currentTime = video._startTime;
                            } else {
                                video.pause();
                            }
                        }
                    });

                    const resumeBehavior = video.getAttribute('data-resume-behavior');
                    if (resumeBehavior === "Start from Beginning") {
                        video.addEventListener('play', () => {
                            if (video._wasPaused) {
                                video.currentTime = video._startTime || 0;
                            }
                            video._wasPaused = false;
                        });
                        video.addEventListener('pause', () => {
                            video._wasPaused = true;
                        });
                    }

                    const playVideoWhile = video.getAttribute('data-play-video-while');
                    if (playVideoWhile === "Auto Play While on Page") {
                        video.play().catch(() => { });
                    } else if (playVideoWhile === "Click to Play") {
                        video.pause();
                    }
                }

                const ctrlId = `custom-ctrl-${layerId}`;
                let bar = document.getElementById(ctrlId);



                const mountPoint = video.parentElement || fo || liveEl;
                if (!mountPoint) return;

                if (bar && bar._video !== video) {
                    if (bar._cleanup) bar._cleanup();
                    bar.remove();
                    bar = null;
                }

                if (bar) {
                    const repBtn = bar.querySelector('.custom-repeat-btn');
                    if (repBtn) repBtn.style.opacity = video.loop ? '1' : '0.5';

                    const topC = bar.querySelector('.custom-top-container');
                    const centerC = bar.querySelector('.custom-center-container');
                    const progC = bar.querySelector('.custom-prog-container');
                    const timeW = bar.querySelector('.custom-time-wrapper');

                    if (topC) topC.style.visibility = showControls ? 'visible' : 'hidden';
                    if (centerC) centerC.style.visibility = showControls ? 'visible' : 'hidden';
                    if (progC) progC.style.visibility = showControls ? 'visible' : 'hidden';
                    if (timeW) timeW.style.visibility = showControls ? 'visible' : 'hidden';
                    if (repBtn) repBtn.style.visibility = showControls ? 'visible' : 'hidden';
                }

                if (!bar) {
                    video.controls = false;
                    video.removeAttribute('controls');
                    video.setAttribute('data-custom-ctrl-active', 'true');

                    if (mountPoint.style) {
                        mountPoint.style.position = 'relative';
                        if (!mountPoint._prevPointerEvents) {
                            mountPoint._prevPointerEvents = mountPoint.style.pointerEvents || '';
                        }
                        mountPoint.style.pointerEvents = 'none';
                    }

                    if (!window._videoHoverTrackerAdded) {
                        window._videoHoverTrackerAdded = true;
                        window.addEventListener('pointermove', (e) => {
                            document.querySelectorAll('.custom-video-overlay').forEach(b => {
                                const rect = b.getBoundingClientRect();
                                const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                                    e.clientY >= rect.top && e.clientY <= rect.bottom;
                                if (isInside) b.classList.add('video-is-hovered');
                                else b.classList.remove('video-is-hovered');
                            });
                        });
                    }

                    bar = document.createElement('div');
                    bar.id = ctrlId;
                    bar._video = video;
                    bar.className = 'custom-video-overlay' + (video.paused ? ' is-paused' : '');
                    Object.assign(bar.style, {
                        position: 'absolute', top: '0', bottom: '0', left: '0', right: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2% 3%', boxSizing: 'border-box', zIndex: '9999', pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 100%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%)',
                    });

                    const ro = new ResizeObserver(entries => {
                        for (let entry of entries) {
                            const w = entry.contentRect.width || entry.target.offsetWidth;
                            if (w > 0) bar.style.fontSize = (w * 0.01) + 'px';
                        }
                    });
                    ro.observe(bar);

                    const topContainer = document.createElement('div');
                    topContainer.className = 'custom-top-container';
                    Object.assign(topContainer.style, { display: 'flex', justifyContent: 'flex-end', width: '100%', pointerEvents: 'none' });

                    const volumeBtn = document.createElement('button');
                    Object.assign(volumeBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '7em', height: '7em', pointerEvents: 'auto', opacity: '0.8' });
                    const VOL_ON_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
                    const VOL_OFF_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

                    const updateVolumeIcon = () => { volumeBtn.innerHTML = (video.muted || video.volume === 0) ? VOL_OFF_SVG : VOL_ON_SVG; };
                    updateVolumeIcon();
                    volumeBtn.onclick = (e) => { e.stopPropagation(); video.muted = !video.muted; if (video.muted) video.setAttribute('muted', ''); else video.removeAttribute('muted'); updateVolumeIcon(); };
                    video.addEventListener('volumechange', updateVolumeIcon);
                    topContainer.appendChild(volumeBtn);

                    const centerContainer = document.createElement('div');
                    centerContainer.className = 'custom-center-container';
                    Object.assign(centerContainer.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2%', flexGrow: '1', pointerEvents: 'none', boxSizing: 'border-box' });

                    const REWIND_ICON = `<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>`;
                    const FORWARD_ICON = `<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>`;

                    const createSkipBtn = (icon, delta) => {
                        const btn = document.createElement('button');
                        Object.assign(btn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', position: 'relative' });
                        const tw = document.createElement('div');
                        Object.assign(tw.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', [delta < 0 ? 'marginLeft' : 'marginRight']: '0.5em' });
                        const t = document.createElement('div');
                        t.textContent = "3s";
                        Object.assign(t.style, { position: 'absolute', top: '50%', left: '50%', width: 'max-content', fontSize: '10em', transform: 'translate(-50%, -50%) scale(0.35)', transformOrigin: 'center center', fontFamily: 'Inter, sans-serif', color: 'white', pointerEvents: 'none' });
                        tw.appendChild(t);
                        if (delta < 0) { btn.innerHTML = icon; btn.appendChild(tw); }
                        else { btn.appendChild(tw); btn.insertAdjacentHTML('beforeend', icon); }
                        btn.onclick = (e) => { e.stopPropagation(); video.currentTime += delta; };
                        return btn;
                    };

                    centerContainer.appendChild(createSkipBtn(REWIND_ICON, -3));
                    centerContainer.appendChild(createSkipBtn(FORWARD_ICON, 3));

                    const bottomContainer = document.createElement('div');
                    Object.assign(bottomContainer.style, { display: 'flex', alignItems: 'center', width: '100%', gap: '2em', pointerEvents: 'none', paddingBottom: '2%', paddingLeft: '2%', paddingRight: '2%', boxSizing: 'border-box' });

                    const PLAY_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
                    const PAUSE_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
                    const playBtn = document.createElement('button');
                    Object.assign(playBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: "8em", height: "8em", pointerEvents: 'auto', flexShrink: '0' });
                    const onPlay = () => { playBtn.innerHTML = PAUSE_SVG; bar.classList.remove('is-paused'); };
                    const onPause = () => { playBtn.innerHTML = PLAY_SVG; bar.classList.add('is-paused'); };
                    playBtn.innerHTML = video.paused ? PLAY_SVG : PAUSE_SVG;
                    video.addEventListener('play', onPlay);
                    video.addEventListener('pause', onPause);
                    playBtn.onclick = (e) => { e.stopPropagation(); video.paused ? video.play() : video.pause(); };

                    const progContainer = document.createElement('div');
                    progContainer.className = 'custom-prog-container';
                    Object.assign(progContainer.style, { flexGrow: '1', height: '1.2em', background: 'rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', borderRadius: '0.2em' });
                    const progFill = document.createElement('div');
                    Object.assign(progFill.style, { position: 'absolute', top: '0', left: '0', bottom: '0', width: '0%', background: 'white', pointerEvents: 'none', borderRadius: '0.2em' });
                    progContainer.appendChild(progFill);

                    const timeWrapper = document.createElement('div');
                    timeWrapper.className = 'custom-time-wrapper';
                    Object.assign(timeWrapper.style, { position: 'relative', width: '28em', height: '8em', flexShrink: '0', marginLeft: '1em' });
                    const timeDisplay = document.createElement('div');
                    Object.assign(timeDisplay.style, { position: 'absolute', top: '50%', left: '0', width: 'max-content', fontSize: '10em', transform: 'translateY(-50%) scale(0.35)', transformOrigin: 'left center', fontFamily: 'Inter, sans-serif', color: 'white', pointerEvents: 'none' });
                    timeDisplay.textContent = "00:00 / 00:00";
                    timeWrapper.appendChild(timeDisplay);

                    const formatTime = (sec) => {
                        if (isNaN(sec)) return "00:00";
                        const m = Math.floor(sec / 60).toString().padStart(2, '0');
                        const s = Math.floor(sec % 60).toString().padStart(2, '0');
                        return `${m}:${s}`;
                    };

                    const onTimeUpdate = () => {
                        if (video.duration) {
                            progFill.style.width = `${(video.currentTime / video.duration) * 100}%`;
                            timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
                        }
                    };
                    video.addEventListener('timeupdate', onTimeUpdate);
                    video.addEventListener('loadedmetadata', onTimeUpdate);
                    onTimeUpdate();

                    progContainer.onpointerdown = (e) => {
                        e.stopPropagation();
                        const rect = progContainer.getBoundingClientRect();
                        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        if (video.duration) video.currentTime = pct * video.duration;
                        const onMove = (me) => {
                            const p = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
                            if (video.duration) video.currentTime = p * video.duration;
                        };
                        const onUp = () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
                        document.addEventListener('pointermove', onMove);
                        document.addEventListener('pointerup', onUp);
                    };

                    const REPEAT_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
                    const repeatBtn = document.createElement('button');
                    repeatBtn.className = 'custom-repeat-btn';
                    Object.assign(repeatBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0', opacity: video.loop ? '1' : '0.5' });
                    repeatBtn.innerHTML = REPEAT_SVG;
                    repeatBtn.onclick = (e) => { e.stopPropagation(); video.loop = !video.loop; if (video.loop) video.setAttribute('loop', ''); else video.removeAttribute('loop'); repeatBtn.style.opacity = video.loop ? '1' : '0.5'; };

                    const FS_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
                    const EXIT_FS_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
                    const fsBtn = document.createElement('button');
                    Object.assign(fsBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0' });

                    const fsStyleId = 'custom-fs-style';
                    if (!document.getElementById(fsStyleId)) {
                        const style = document.createElement('style');
                        style.id = fsStyleId;
                        style.innerHTML = `
                  foreignObject:fullscreen, foreignObject:-webkit-full-screen, foreignObject:-moz-full-screen { width: 100vw !important; height: 100vh !important; background: black !important; transform: none !important; }
                  foreignObject:fullscreen video, foreignObject:-webkit-full-screen video, foreignObject:-moz-full-screen video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
                  #temp-fs-wrapper .custom-video-overlay { font-size: 0.3vw !important; }
                  #temp-fs-wrapper .custom-video-overlay svg { stroke-width: 2.5 !important; }
                  #temp-fs-wrapper .custom-video-overlay .time-display { margin-right: 0 !important; }
                `;
                        document.head.appendChild(style);
                    }

                    const updateFsIcon = () => { fsBtn.innerHTML = document.fullscreenElement ? EXIT_FS_SVG : FS_SVG; };
                    updateFsIcon();

                    fsBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (!document.fullscreenElement) {
                            const fsWrapper = document.createElement('div');
                            fsWrapper.id = 'temp-fs-wrapper';
                            Object.assign(fsWrapper.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'black', zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center' });
                            const vPlaceholder = document.createComment('video-placeholder');
                            const bPlaceholder = document.createComment('bar-placeholder');
                            video.parentElement.insertBefore(vPlaceholder, video);
                            bar.parentElement.insertBefore(bPlaceholder, bar);
                            const wasPlaying = !video.paused;
                            fsWrapper.appendChild(video);
                            fsWrapper.appendChild(bar);
                            document.body.appendChild(fsWrapper);
                            fsWrapper._vPlaceholder = vPlaceholder;
                            fsWrapper._bPlaceholder = bPlaceholder;
                            const reqFs = fsWrapper.requestFullscreen || fsWrapper.webkitRequestFullscreen;
                            if (reqFs) {
                                reqFs.call(fsWrapper).then(() => { if (wasPlaying) video.play().catch(() => { }); }).catch(err => {
                                    if (vPlaceholder.parentNode) vPlaceholder.parentNode.insertBefore(video, vPlaceholder);
                                    if (bPlaceholder.parentNode) bPlaceholder.parentNode.insertBefore(bar, bPlaceholder);
                                    vPlaceholder.remove(); bPlaceholder.remove(); fsWrapper.remove();
                                });
                            }
                        } else {
                            if (document.exitFullscreen) document.exitFullscreen();
                            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                        }
                    };

                    const handleFsChange = () => {
                        const isFs = !!document.fullscreenElement;
                        fsBtn.innerHTML = isFs ? EXIT_FS_SVG : FS_SVG;
                        if (!isFs) {
                            const fsWrapper = document.getElementById('temp-fs-wrapper');
                            if (fsWrapper) {
                                const wasPlaying = !video.paused;
                                const vp = fsWrapper._vPlaceholder;
                                const bp = fsWrapper._bPlaceholder;
                                if (vp && vp.parentNode) { vp.parentNode.insertBefore(video, vp); vp.remove(); }
                                if (bp && bp.parentNode) { bp.parentNode.insertBefore(bar, bp); bp.remove(); }
                                fsWrapper.remove();
                                if (wasPlaying) video.play().catch(() => { });
                            }
                        }
                    };
                    document.addEventListener('fullscreenchange', handleFsChange);
                    document.addEventListener('webkitfullscreenchange', handleFsChange);

                    const disableFullScreen = video.getAttribute('data-disable-fullscreen') === 'true';

                    bottomContainer.appendChild(playBtn);
                    bottomContainer.appendChild(progContainer);
                    bottomContainer.appendChild(timeWrapper);
                    bottomContainer.appendChild(repeatBtn);
                    if (!disableFullScreen) {
                        bottomContainer.appendChild(fsBtn);
                    }

                    bar.appendChild(topContainer);
                    bar.appendChild(centerContainer);
                    bar.appendChild(bottomContainer);
                    mountPoint.appendChild(bar);

                    bar._cleanup = () => {
                        document.removeEventListener('fullscreenchange', handleFsChange);
                        document.removeEventListener('webkitfullscreenchange', handleFsChange);
                        if (ro) ro.disconnect();
                        video.removeEventListener('play', onPlay);
                        video.removeEventListener('pause', onPause);
                        video.removeEventListener('timeupdate', onTimeUpdate);
                        video.removeEventListener('loadedmetadata', onTimeUpdate);
                        video.removeEventListener('volumechange', updateVolumeIcon);
                        video.removeAttribute('data-custom-ctrl-active');
                        if (mountPoint.style && mountPoint._prevPointerEvents !== undefined) {
                            mountPoint.style.pointerEvents = mountPoint._prevPointerEvents;
                        }
                    };
                }
            });
        };

        intervalId = setInterval(renderVideoControls, 200);
        return () => {
            clearInterval(intervalId);
            document.querySelectorAll('.custom-video-overlay').forEach(b => { if (b._cleanup) b._cleanup(); b.remove(); });
        };
    }, []);

    // Consistently handle centering offset across all layouts and engines
    useEffect(() => {
        if (!pages || pages.length === 0) {
            setOffset(0);
            return;
        }

        const totalPages = augmentedPages.length || pages.length;
        // Soft cover (turn.js): Shift left to center the front cover, shift right to center the back cover
        if (currentPage === 0) {
            setOffset(-(WIDTH / 2));
        } else if (currentPage >= totalPages - 2) {
            setOffset((currentPage % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2));
        } else {
            setOffset(0);
        }
    }, [currentPage, pages.length, augmentedPages.length, WIDTH, useHardCover]);

    const layoutBackgroundSettings = React.useMemo(() => ({
        ...backgroundSettings,
        color: 'transparent',
        style: 'Solid'
    }), [backgroundSettings]);

    const layoutBackgroundStyle = React.useMemo(() => ({}), []);

    const renderSharedOverlays = () => (
        <SharedOverlays
            showGalleryPopup={showGalleryPopup}
            setShowGalleryPopupMemo={setShowGalleryPopupMemo}
            galleryPopupSettings={galleryPopupSettings}
            activeDevice={activeDevice}
            isTablet={isTablet}
            isMobile={isMobile}
            isLandscape={isLandscape}
            showBookmarkMenu={showBookmarkMenu}
            setShowBookmarkMenu={setShowBookmarkMenu}
            setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
            setShowViewBookmarkPopup={setShowViewBookmarkPopup}
            showNotesMenu={showNotesMenu}
            setShowNotesMenu={setShowNotesMenu}
            setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
            setShowNotesViewerMemo={setShowNotesViewerMemo}
            showMoreMenu={showMoreMenu}
            setShowMoreMenu={setShowMoreMenu}
            showSharePopup={showSharePopup}
            setShowSharePopup={setShowSharePopup}
            showExportPopup={showExportPopup}
            setShowExportPopup={setShowExportPopup}
            showProfilePopup={showProfilePopup}
            setShowProfilePopup={setShowProfilePopup}
            creatorProfileData={creatorProfileData}
            showSoundPopup={showSoundPopup}
            setShowSoundPopup={setShowSoundPopup}
            showTOC={showTOC}
            setShowTOC={setShowTOC}
            activeLayout={activeLayout}
            otherSetupSettings={otherSetupSettings}
            onUpdateOtherSetup={onUpdateOtherSetup}
            isSidebarOpen={isSidebarOpen}
            mobileIsMuted={mobileIsMuted}
            setMobileIsMuted={setMobileIsMuted}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            mobileIsFlipMuted={mobileIsFlipMuted}
            setMobileIsFlipMuted={setMobileIsFlipMuted}
            isFlipMuted={isFlipMuted}
            setIsFlipMuted={setIsFlipMuted}
            mobileFlipTrigger={mobileFlipTrigger}
            flipTrigger={flipTrigger}
            settings={settings}
            onClose={onClose}
            isFullscreen={isFullscreen}
            isLoading={isLoading}
            onPageClick={onPageClick}
            layoutColors={layoutColors}
            getLayoutColor={getLayoutColor}
            getLayoutColorRgba={getLayoutColorRgba}
            active3DModelUrl={active3DModelUrl}
            setActive3DModelUrl={setActive3DModelUrl}
            active3DModelVId={active3DModelVId}
            active3DModelHotspots={active3DModelHotspots}
            active3DModelConfig={active3DModelConfig}
            vId={resolvedVId}
            shareId={resolvedShareId}
            currentBook={currentBook}
            countdown={countdown}
            showAddBookmarkPopup={showAddBookmarkPopup}
            setShowAddBookmarkPopup={setShowAddBookmarkPopupMemo}
            showAddNotesPopup={showAddNotesPopup}
            setShowAddNotesPopup={setShowAddNotesPopupMemo}
            showNotesViewer={showNotesViewer}
            setShowNotesViewer={setShowNotesViewerMemo}
            showViewBookmarkPopup={showViewBookmarkPopup}
            currentPage={currentPage}
            pages={pages}
            onAddBookmark={onAddBookmark}
            onAddNote={onAddNote}
            onDeleteBookmark={onDeleteBookmark}
            onUpdateBookmark={onUpdateBookmark}
            bookmarks={bookmarks}
            notes={notes}
            isMobileLandscape={isMobileLandscape}
        />
    );

    const commonLayoutProps = {
        settings,
        bookName,
        currentBook,
        activeLayout,
        hideHeader,
        searchQuery,
        setSearchQuery,
        handleQuickSearch,
        isPublished: isPublishedPreview,
        logoSettings,
        logoObjectFit,
        logoCropStyle,
        onPageClick,
        currentPage,
        pages,
        bookRef,
        showBookmarkMenu,
        setShowBookmarkMenu: setShowBookmarkMenuMemo,
        showMoreMenu,
        setShowMoreMenu: setShowMoreMenuMemo,
        showThumbnailBar,
        setShowThumbnailBar: setShowThumbnailBarMemo,
        showTOC,
        setShowTOC: setShowTOCMemo,
        showNotesMenu,
        setShowNotesMenu: setShowNotesMenuMemo,
        showExportPopup,
        setShowExportPopup,
        showSharePopup,
        setShowSharePopup,
        showProfilePopup,
        setShowProfilePopup,
        setShowAddNotesPopup: setShowAddNotesPopupMemo,
        setShowNotesViewer: setShowNotesViewerMemo,
        setShowNotesViewerMemo,
        setShowAddBookmarkPopup: setShowAddBookmarkPopupMemo,
        setShowAddBookmarkPopupMemo,
        setShowViewBookmarkPopup,
        showViewBookmarkPopup,
        setShowGalleryPopup: setShowGalleryPopupMemo,
        setShowGalleryPopupMemo,
        showSoundPopup,
        setShowSoundPopup: setShowSoundPopupMemo,
        setShowSoundPopupMemo,
        isAutoFlipping,
        setIsPlaying,
        currentZoom,
        setCurrentZoom,
        handleZoomIn,
        handleZoomOut,
        handleFullScreen,
        handleShare,
        handleDownload,
        offset,
        isSinglePage,
        backgroundSettings: layoutBackgroundSettings,
        layoutBackgroundSettings,
        backgroundStyle: layoutBackgroundStyle,
        layoutBackgroundStyle,
        isMuted: mobileIsMuted,
        setIsMuted: setMobileIsMuted,
        isFlipMuted: mobileIsFlipMuted,
        setIsFlipMuted: setMobileIsFlipMuted,
        flipTrigger: mobileFlipTrigger,
        onToggleAudio: handleToggleAudio,
        handleToggleAudio,
        isSidebarOpen,
        isFullscreen,
        isTablet,
        isMobile,
        isLandscape,
        isMobileLandscape,
        augmentedPages,
        notes,
        profileSettings,
        onClose,
        layoutColors,
        onAddNote,
        onAddBookmark,
        onDeleteBookmark,
        onUpdateBookmark,
        setShowThumbnailBarMemo,
        setShowTOCMemo,
        setShowBookmarkMenuMemo,
        setShowMoreMenuMemo,
        setShowNotesMenuMemo,
        setShowAddNotesPopupMemo
    };

    const backgroundLayers = (
        <>
            <div className="absolute inset-0 z-0 pointer-events-none" style={backgroundStyle} />
            {backgroundSettings?.style === 'Video' && (backgroundSettings.video || backgroundSettings.media || backgroundSettings.image) && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: (backgroundSettings?.opacity ?? 100) / 100 }}>
                    <video
                        src={backgroundSettings.video || backgroundSettings.media || backgroundSettings.image}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full"
                        style={{
                            objectFit: backgroundSettings.fit === 'Fit' ? 'contain' : backgroundSettings.fit === 'Stretch' ? 'fill' : 'cover'
                        }}
                    />
                </div>
            )}
            {backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType && backgroundComponents[backgroundSettings.reactBitType] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(backgroundComponents[backgroundSettings.reactBitType])}
                </div>
            )}
            {backgroundSettings?.animation && backgroundSettings.animation !== 'None' && animationComponents[backgroundSettings.animation] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(animationComponents[backgroundSettings.animation], { backgroundSettings, backgroundStyle })}
                </div>
            )}
        </>
    );

    return (
        <div
            ref={containerRef}
            id="preview-area-root"
            className={`flex-1 flex flex-col relative min-h-0 select-none overflow-hidden ${activeDevice !== 'Desktop' ? 'items-center justify-center' : ''}`}
            style={{
                width: activeDevice !== 'Desktop' ? '100%' : 'auto',
                height: activeDevice !== 'Desktop' ? '100%' : 'auto',
                touchAction: settings.toolbar?.twoClickToZoom ? 'manipulation' : 'auto',
                ...(layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(v => v.trim()).map(v => {
                    const i = v.indexOf(':');
                    return [v.slice(0, i).trim(), v.slice(i + 1).trim()];
                })) : {})
            }}
        >

            {(!['Tablet', 'Mobile'].includes(activeDevice) || isPublishedPreview || (activeDevice === 'Tablet' && isPhysicalTablet) || (activeDevice === 'Mobile' && isPhysicalMobile)) && backgroundLayers}

            <DeviceLayoutRenderer
                activeDevice={activeDevice}
                isPublishedPreview={isPublishedPreview}
                isPhysicalTablet={isPhysicalTablet}
                isPhysicalMobile={isPhysicalMobile}
                backgroundLayers={backgroundLayers}
                screenRef={screenRef}
                commonLayoutProps={commonLayoutProps}
                bookRendererProps={bookRendererProps}
                currentBookmarks={currentBookmarks}
                currentNotes={currentNotes}
                isLandscape={isLandscape}
                activeLayout={activeLayout}
                isTablet={isTablet}
                deviceStyles={deviceStyles}
                renderSharedOverlays={renderSharedOverlays}
                layout1Bookmarks={layout1Bookmarks} layout1Notes={layout1Notes}
                layout2Bookmarks={layout2Bookmarks} layout2Notes={layout2Notes}
                layout3Bookmarks={layout3Bookmarks} layout3Notes={layout3Notes}
                layout4Bookmarks={layout4Bookmarks} layout4Notes={layout4Notes}
                layout5Bookmarks={layout5Bookmarks} layout5Notes={layout5Notes}
                layout6Bookmarks={layout6Bookmarks} layout6Notes={layout6Notes}
                layout7Bookmarks={layout7Bookmarks} layout7Notes={layout7Notes}
                layout8Bookmarks={layout8Bookmarks} layout8Notes={layout8Notes}
                setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                setShowProfilePopup={setShowProfilePopup}
                showProfilePopup={showProfilePopup}
                setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                showGalleryPopup={showGalleryPopup}
                showExportPopup={showExportPopup}
                showSoundPopup={showSoundPopup}
                setShowSoundPopupMemo={setShowSoundPopupMemo}
                showSharePopup={showSharePopup}
                showBookmarkMenu={showBookmarkMenu}
                setShowBookmarkMenuMemo={setShowBookmarkMenuMemo}
                showMoreMenu={showMoreMenu}
                setShowMoreMenuMemo={setShowMoreMenuMemo}
                showNotesMenu={showNotesMenu}
                setShowNotesMenuMemo={setShowNotesMenuMemo}
                getScreenWrapperStyle={getScreenWrapperStyle}
            />

            <AnimatePresence>
                {activePopupInteraction && (
                    <InteractionPopupModal
                        activePopupInteraction={activePopupInteraction}
                        onClose={() => setActivePopupInteraction(null)}
                    />
                )}
                {activeSlideshowInteraction && (
                    <InteractionSlideshowModal
                        activeSlideshowInteraction={activeSlideshowInteraction}
                        setActiveSlideshowInteraction={setActiveSlideshowInteraction}
                    />
                )}
            </AnimatePresence>

            {!isLoading && showLeadForm && (
                <LeadFormPopup
                    leadFormSettings={leadFormSettings}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    vId={resolvedVId}
                    shareId={resolvedShareId}
                    flipbookName={resolvedBookName}
                    userEmail={resolvedUserEmail}
                    onClose={() => {
                        setShowLeadForm(false);
                        setLeadFormSubmitted(true);
                    }}
                />
            )}

            {/* showGalleryPopup moved to renderSharedOverlays */}

            {interactionZoom?.active && (
                <div
                    className="absolute inset-0 z-[9999]"
                    style={{ cursor: 'zoom-out' }}
                    onClick={() => setInteractionZoom(null)}
                />
            )}

            {/* Centered Screen Lead Form Modal Overlay */}
            {showLeadForm && (
                <LeadFormPopup
                    leadFormSettings={leadFormSettings}
                    isTablet={isTablet}
                    isMobile={activeDevice === 'Mobile'}
                    onClose={() => setLeadFormSubmitted(true)}
                />
            )}
        </div>
    );
});

export default PreviewArea;


