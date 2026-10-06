import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveToDB } from '../../utils/dbUtils';
import Layer from './Layer';
import MainEditor from './MainEditor';
import RightSidebar from './RightSidebar';
import TooltipCustomization from './TooltipCustomization';
import TemplateModal from './TemplateModal';
import FlipbookPreview from './FlipbookPreview';
import AlertModal from '../AlertModal';
import PdfProcessingLoader from '../PdfProcessingLoader';
import PopupTemplateSelection from './PopupTemplateSelection';
import Model3DPreviewModal from './Interaction3DPreview';
import PasswordProtectModal from '../PasswordProtectModal';
import pageCacheManager from './PageCacheManager';
import { useToast } from '../CustomToast';
import { getSupabaseBaseUrl, resolveUploadsPath } from '../../utils/supabaseUtils';

import {
  parseLayersFromSVG,
  syncFilters,
  useElementAttributeSync,
  usePageManager,
  useLayerOperations,
  useDocumentImport,
  usePopupAndTemplateManager,
  useSaveEngine,
  use3DPreviewManager,
  useKeyboardShortcuts
} from './templateEditorModules';

export { parseLayersFromSVG };

const TemplateEditor = () => {
  const { folder, v_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    setSaveHandler,
    setPreviewHandler,
    setClearHandler,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    triggerSaveSuccess,
    isAutoSaveEnabled,
    isSaving,
    setIsSaving,
    currentBook,
    setCurrentBook,
    isExportModalOpen,
    setExportContext
  } = useOutletContext();

  // ── Core States ────────────────────────────────────────────────────────────
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDoublePage, setIsDoublePage] = useState(false);
  const [isRulerEnabled, setIsRulerEnabled] = useState(() => {
    const saved = localStorage.getItem('isRulerEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isTrimView, setIsTrimView] = useState(() => {
    const saved = localStorage.getItem('isTrimViewEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showPreview, setShowPreview] = useState(false);
  const [selectedLayerId, setSelectedLayerIdRaw] = useState(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());
  const [clipboard, setClipboard] = useState(null);
  const [currentFrameId, setCurrentFrameId] = useState(null);
  const [activeMainTool, setActiveMainTool] = useState('select');
  const [activeTopTool, setActiveTopTool] = useState('editor');

  const [pdfProcessing, setPdfProcessing] = useState(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // ── Refs ───────────────────────────────────────────────────────────────────
  const pagesRef = useRef(pages);
  const activePageIndexRef = useRef(activePageIndex);
  const isFirstLoadRef = useRef(true);
  const lastPageIndexRef = useRef(-1);
  const isUndoRedoActiveRef = useRef(false);
  const prevSelectedLayerIdRef = useRef(selectedLayerId);
  const prevMultiSelectedIdsRef = useRef(multiSelectedIds);
  const skipPasteResetRef = useRef(false);

  const pdfInputRef = useRef(null);
  const pdfInsertIndexRef = useRef(null);
  const replacePdfInputRef = useRef(null);
  const replacePageIndexRef = useRef(null);

  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { activePageIndexRef.current = activePageIndex; }, [activePageIndex]);

  // Guard: Never allow selectedLayerId to become null — always fall back to active page root folder
  const setSelectedLayerId = useCallback((idOrFn) => {
    setSelectedLayerIdRaw(prev => {
      const next = typeof idOrFn === 'function' ? idOrFn(prev) : idOrFn;
      if (next === null || next === undefined) {
        const rootId = pagesRef.current[activePageIndexRef.current]?.layers?.[0]?.id;
        return rootId || prev;
      }
      return next;
    });
  }, []);

  // Cleanup cache manager on unmount
  useEffect(() => {
    return () => {
      pageCacheManager.destroy();
    };
  }, []);

  // Ensure active page layers are loaded immediately if switched before background queue reached it
  useEffect(() => {
    if (pages.length === 0 || activePageIndex < 0 || activePageIndex >= pages.length) return;
    const curPage = pages[activePageIndex];
    if (curPage && curPage.html && (!curPage.layers || curPage.layers.length === 0)) {
      pageCacheManager.prioritizePage(activePageIndex);
      const parser = new DOMParser();
      const doc = parser.parseFromString(curPage.html, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      const layers = svgEl ? parseLayersFromSVG(svgEl) : [];
      pageCacheManager.setCachedLayers(curPage.id, curPage.html, layers);

      setPages(prev => {
        if (!prev[activePageIndex] || (prev[activePageIndex].layers && prev[activePageIndex].layers.length > 0)) return prev;
        const next = [...prev];
        next[activePageIndex] = { ...next[activePageIndex], layers };
        return next;
      });
    }
  }, [activePageIndex, pages]);

  // Global Settings Sync
  useEffect(() => {
    const handleToggleRuler = (e) => {
      setIsRulerEnabled(prev => e.detail !== undefined ? e.detail : !prev);
    };
    const handleToggleTrimView = (e) => {
      setIsTrimView(prev => e.detail !== undefined ? e.detail : !prev);
    };

    window.addEventListener('editor_toggleRuler', handleToggleRuler);
    window.addEventListener('editor_toggleTrimView', handleToggleTrimView);

    return () => {
      window.removeEventListener('editor_toggleRuler', handleToggleRuler);
      window.removeEventListener('editor_toggleTrimView', handleToggleTrimView);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('editor_settings_changed', {
      detail: { isRulerEnabled, isTrimView }
    }));
  }, [isRulerEnabled, isTrimView]);

  // Automatically switch to Properties panel when an element is selected while Uploads is active
  useEffect(() => {
    if (selectedLayerId) {
      setActiveMainTool((prev) => prev === 'upload' ? 'select' : prev);
    }
  }, [selectedLayerId]);

  // ── Dimensions & Default Page Data ─────────────────────────────────────────
  const getFlipbookDimensions = useCallback(() => {
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

    const state = location.state || {};
    const book = currentBook || {};

    const w = book.width || book.meta?.width || state.width;
    const h = book.height || book.meta?.height || state.height;
    if (w && h) {
      return { width: parseFloat(w), height: parseFloat(h) };
    }

    const templateId = (book.templateId || book.meta?.templateId || state.templateId || '').toLowerCase();
    const orientation = (book.orientation || book.meta?.orientation || state.orientation || '').toLowerCase();

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

    return { width: 210, height: 297 };
  }, [pages, location.state, currentBook]);

  const createDefaultPageData = useCallback((name, customW, customH) => {
    let baseWidth = customW;
    let baseHeight = customH;
    if (!baseWidth || !baseHeight) {
      const dims = getFlipbookDimensions();
      baseWidth = dims.width;
      baseHeight = dims.height;
    }
    const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
    const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
    const html = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${baseWidth} ${baseHeight}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${name}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="${baseWidth}" height="${baseHeight}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
  </g>
</svg>`;

    const layers = [
      {
        id: rootId,
        name: name,
        type: 'g',
        visible: true,
        locked: false,
        children: []
      }
    ];

    return { html, layers };
  }, [getFlipbookDimensions]);

  const createDefaultPageDataRef = useRef(createDefaultPageData);
  useEffect(() => {
    createDefaultPageDataRef.current = createDefaultPageData;
  }, [createDefaultPageData]);

  // ── Hook 1: Page Manager (History & Page Operations) ───────────────────────
  const {
    history,
    redoStack,
    setHistory,
    setRedoStack,
    saveToHistory,
    undo,
    redo,
    updatePageHtml,
    clearPage,
    insertPageAfter,
    duplicatePage,
    renamePage,
    togglePageVisibility,
    deletePage,
    movePageUp,
    movePageDown,
    movePageToFirst,
    movePageToLast,
    movePage,
    handleClearAllPages
  } = usePageManager({
    pages,
    setPages,
    activePageIndex,
    setActivePageIndex,
    selectedLayerId,
    setSelectedLayerId,
    multiSelectedIds,
    setMultiSelectedIds,
    setHasUnsavedChanges,
    createDefaultPageData,
    isUndoRedoActiveRef,
    prevSelectedLayerIdRef,
    prevMultiSelectedIdsRef,
    setAlertState,
    currentBook
  });

  // ── Hook 2: Element Attribute & Background Sync ────────────────────────────
  const {
    updateElementAttribute,
    updatePageBackground
  } = useElementAttributeSync({
    pages,
    setPages,
    activePageIndex,
    saveToHistory,
    setHasUnsavedChanges
  });

  // ── Hook 3: Layer Operations ───────────────────────────────────────────────
  const {
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    bringLayerToFront,
    sendLayerToBack,
    moveLayerForward,
    moveLayerBackward,
    reorderLayer,
    deleteLayer,
    copyLayer,
    cutLayer,
    pasteLayer,
    duplicateLayer
  } = useLayerOperations({
    pages,
    setPages,
    saveToHistory,
    clipboard,
    setClipboard,
    selectedLayerId,
    setSelectedLayerId,
    setMultiSelectedIds,
    currentFrameId,
    setCurrentFrameId,
    v_id,
    currentBook,
    skipPasteResetRef
  });

  // ── Hook 4: Document Import (PDF, Word, PPT) ───────────────────────────────
  const {
    handleAddFileClick,
    handleReplaceFileClick,
    handleReplaceFileSelect,
    handlePdfFileSelect
  } = useDocumentImport({
    pages,
    setPages,
    saveToHistory,
    setHasUnsavedChanges,
    setPdfProcessing,
    setAlertState,
    getFlipbookDimensions,
    pdfInputRef,
    replacePdfInputRef,
    pdfInsertIndexRef,
    replacePageIndexRef,
    v_id,
    activePageIndex
  });

  // ── Hook 5: Popup & Template Manager ───────────────────────────────────────
  const {
    popupEditContext,
    showPopupTemplateChange,
    setShowPopupTemplateChange,
    showTemplateModal,
    setShowTemplateModal,
    templateTargetIndex,
    onCustomizePopup,
    handleApplyPopupChanges,
    handleCancelPopupChanges,
    loadTemplate,
    handleAddTemplatePages,
    handleOpenTemplateModal
  } = usePopupAndTemplateManager({
    pages,
    setPages,
    activePageIndex,
    setActivePageIndex,
    saveToHistory,
    setHasUnsavedChanges,
    getFlipbookDimensions,
    isDoublePage,
    setIsDoublePage,
    selectedLayerId,
    setSelectedLayerId,
    multiSelectedIds,
    setMultiSelectedIds,
    currentFrameId,
    setCurrentFrameId,
    history,
    setHistory,
    redoStack,
    setRedoStack,
    activeTopTool,
    setActiveTopTool,
    createDefaultPageData
  });

  // ── Hook 6: Save Engine ────────────────────────────────────────────────────
  const {
    saveFlipbook,
    autoSaveTimerRef,
    justSavedRef,
    lastSavedHtmlsRef
  } = useSaveEngine({
    pages,
    setPages,
    currentBook,
    v_id,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    triggerSaveSuccess,
    getFlipbookDimensions,
    setActivePageIndex,
    toast,
    location,
    navigate,
    setActiveTopTool,
    setSelectedLayerId
  });

  // ── Hook 7: 3D Preview Manager ─────────────────────────────────────────────
  const {
    is3DModalOpen,
    setIs3DModalOpen,
    current3DItem,
    setCurrent3DItem,
    shadowStrength,
    setShadowStrength,
    shadowSoftness,
    setShadowSoftness,
    autoRotate,
    setAutoRotate,
    autoRotateSpeed,
    setAutoRotateSpeed,
    lockMaxZoom,
    setLockMaxZoom,
    maxZoom,
    setMaxZoom,
    bgType,
    setBgType,
    bgColor,
    setBgColor,
    customBg,
    setCustomBg,
    enableAR,
    setEnableAR,
    qrText,
    setQrText,
    qrColor,
    setQrColor,
    qrBgType,
    setQrBgType,
    qrBgColor,
    setQrBgColor,
    qrLevel,
    setQrLevel,
    qrDotType,
    setQrDotType,
    qrCornerSquareType,
    setQrCornerSquareType,
    qrCornerDotType,
    setQrCornerDotType,
    qrLogo,
    setQrLogo,
    topText,
    setTopText,
    bottomText,
    setBottomText,
    current3DHotspots,
    active3DHotspotId,
    setActive3DHotspotId,
    current3DVId
  } = use3DPreviewManager({
    setPages,
    activePageIndex
  });

  // ── Hook 8: Keyboard Shortcuts & Native Paste ──────────────────────────────
  useKeyboardShortcuts({
    selectedLayerId,
    setSelectedLayerId,
    multiSelectedIds,
    setMultiSelectedIds,
    activePageIndex,
    clipboard,
    copyLayer,
    cutLayer,
    pasteLayer,
    deleteLayer,
    undo,
    redo,
    pages,
    activeTopTool,
    updateElementAttribute
  });

  // ── Navbar Bridge Handlers ────────────────────────────────────────────────
  useEffect(() => {
    if (setSaveHandler) {
      setSaveHandler(() => () => saveFlipbook(true, popupEditContext ? popupEditContext.backup.pages : pages));
    }
    return () => {
      if (setSaveHandler) setSaveHandler(null);
    };
  }, [setSaveHandler, saveFlipbook, popupEditContext, pages]);

  useEffect(() => {
    if (setClearHandler) {
      setClearHandler(() => handleClearAllPages);
    }
    return () => {
      if (setClearHandler) setClearHandler(null);
    };
  }, [setClearHandler, handleClearAllPages]);

  const stablePreviewHandler = useCallback(async () => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.dispatchEvent(new CustomEvent('trigger-manual-save'));

    if (pages && pages.length > 0) {
      try {
        await saveToDB('editor_autosave', {
          v_id: v_id,
          pages: popupEditContext ? popupEditContext.backup.pages : pages,
          activePageIndex: popupEditContext ? popupEditContext.backup.activePageIndex : activePageIndex,
          pageName: currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook',
          timestamp: Date.now()
        });
      } catch (err) {
        console.error("Failed to save preview state to IndexedDB:", err);
      }
    }

    setTimeout(() => {
      const shareId = currentBook?.shareId || currentBook?.share?.shareId;
      if (shareId) {
        window.open(`/preview?shareId=${shareId}`, '_blank');
      } else {
        window.open('/preview', '_blank');
      }
    }, 400);
  }, [currentBook, pages, popupEditContext, activePageIndex, v_id, location.state]);

  useEffect(() => {
    if (setPreviewHandler) {
      setPreviewHandler(() => stablePreviewHandler);
    }
    return () => {
      if (setPreviewHandler) setPreviewHandler(null);
    };
  }, [setPreviewHandler, stablePreviewHandler]);

  // Track Changes for Unsaved Indicator
  useEffect(() => {
    if (pages.length > 0 && !isLoading) {
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        return;
      }
      if (justSavedRef.current) {
        justSavedRef.current = false;
        return;
      }
      setHasUnsavedChanges(true);
    }
  }, [pages, currentBook, isLoading, setHasUnsavedChanges, justSavedRef]);

  // Auto-Save Mechanism
  useEffect(() => {
    if (isAutoSaveEnabled && hasUnsavedChanges && pages.length > 0 && !isLoading && !isSaving && !isFirstLoadRef.current) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const isUserInteracting = !!document.querySelector('[data-dragging="true"]') || document.body.classList.contains('resizing-active');
        if (isUserInteracting) {
          return;
        }
        saveFlipbook(false, popupEditContext ? popupEditContext.backup.pages : pages);
      }, 2500);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [pages, isAutoSaveEnabled, hasUnsavedChanges, isLoading, isSaving, popupEditContext, saveFlipbook, autoSaveTimerRef]);

  // Sync state to IndexedDB for Preview / Customized Editor
  useEffect(() => {
    if (pages.length > 0 && !isLoading) {
      saveToDB('editor_autosave', {
        v_id: v_id,
        pages: popupEditContext ? popupEditContext.backup.pages : pages,
        activePageIndex: popupEditContext ? popupEditContext.backup.activePageIndex : activePageIndex,
        pageName: currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook',
        timestamp: Date.now()
      });
    }
  }, [pages, activePageIndex, v_id, currentBook, location.state, isLoading, popupEditContext]);

  // Live swap listener for uploaded images/videos
  useEffect(() => {
    const handleUpdateSrc = (e) => {
      const { oldSrc, newSrc } = e.detail;
      if (!oldSrc || !newSrc) return;
      setPages(prev => prev.map(page => {
        if (page.html && page.html.includes(oldSrc)) {
          return { ...page, html: page.html.split(oldSrc).join(newSrc) };
        }
        return page;
      }));
      const els = document.querySelectorAll(`[src="${oldSrc}"], [href="${oldSrc}"]`);
      els.forEach(el => {
        if (el.hasAttribute('src')) el.setAttribute('src', newSrc);
        if (el.hasAttribute('href')) el.setAttribute('href', newSrc);
        if (el.hasAttribute('xlink:href')) el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', newSrc);
      });
    };
    window.addEventListener('update-video-src', handleUpdateSrc);
    window.addEventListener('update-image-src', handleUpdateSrc);
    return () => {
      window.removeEventListener('update-video-src', handleUpdateSrc);
      window.removeEventListener('update-image-src', handleUpdateSrc);
    };
  }, []);

  // ── FIGMA-STYLE: Unified Page Selection & Frame Sync ──────────────────────
  useEffect(() => {
    if (pages.length === 0 || activePageIndex < 0 || activePageIndex >= pages.length) return;

    const lastSpreadStart = (lastPageIndexRef.current > 0) ? (lastPageIndexRef.current % 2 === 1 ? lastPageIndexRef.current : lastPageIndexRef.current - 1) : 0;
    const currentSpreadStart = (activePageIndex > 0) ? (activePageIndex % 2 === 1 ? activePageIndex : activePageIndex - 1) : 0;

    const hasSwitchedPage = lastPageIndexRef.current !== activePageIndex;
    const hasSwitchedSpread = lastSpreadStart !== currentSpreadStart;
    lastPageIndexRef.current = activePageIndex;

    const isSpread = isDoublePage && activePageIndex > 0 && (
      (activePageIndex % 2 === 1 && activePageIndex + 1 < pages.length) ||
      (activePageIndex % 2 === 0 && activePageIndex - 1 > 0)
    );

    if (isSpread) {
      const leftIdx = activePageIndex % 2 === 1 ? activePageIndex : activePageIndex - 1;
      const rightIdx = activePageIndex % 2 === 1 ? activePageIndex + 1 : activePageIndex;

      const page1 = pages[leftIdx];
      const page2 = pages[rightIdx];

      if (page1?.layers?.[0] && page2?.layers?.[0]) {
        const root1 = page1.layers[0].id;
        const root2 = page2.layers[0].id;
        const activeRoot = activePageIndex === leftIdx ? root1 : root2;

        if (hasSwitchedPage || hasSwitchedSpread || !selectedLayerId) {
          setMultiSelectedIds(new Set([activeRoot]));
          setSelectedLayerIdRaw(activeRoot);
          setCurrentFrameId(activeRoot);
        }
      }
    } else {
      const page = pages[activePageIndex];
      if (page?.layers?.[0]) {
        const rootId = page.layers[0].id;
        if (hasSwitchedPage || !selectedLayerId) {
          setMultiSelectedIds(new Set([rootId]));
          setSelectedLayerIdRaw(rootId);
          setCurrentFrameId(rootId);
        }
      }
    }
  }, [activePageIndex, isDoublePage, pages, selectedLayerId]);

  // Fallback to active page root folder if selection becomes null
  useEffect(() => {
    if (!selectedLayerId && pages.length > 0 && pages[activePageIndex]?.layers?.[0]?.id) {
      const rootId = pages[activePageIndex].layers[0].id;
      setSelectedLayerIdRaw(rootId);
      setMultiSelectedIds(new Set([rootId]));
      setCurrentFrameId(rootId);
    }
  }, [selectedLayerId, activePageIndex, pages]);

  // Sync state to ExportModal context
  useEffect(() => {
    if (setExportContext) {
      setExportContext({ pages, activePageIndex });
    }
  }, [pages, activePageIndex, setExportContext]);

  // ── Initial Flipbook Loader ───────────────────────────────────────────────
  useEffect(() => {
    const initializeEditor = async () => {
      setIsLoading(true);
      try {
        if (v_id) {
        try {
          const storedUser = localStorage.getItem('user');
          const user = storedUser ? JSON.parse(storedUser) : null;
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

          const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
            params: { emailId: user?.emailId, v_id, folderName: folder || location.state?.folderName, bookName: decodeURIComponent(v_id) }
          });

          if (res.data && res.data.pages) {
            const parser = new DOMParser();
            const sanitizedEmail = user?.emailId?.replace(/[@.]/g, "_");
            const folderNameArr = Array.isArray(res.data.meta.folderName) ? res.data.meta.folderName : [res.data.meta.folderName || 'Recent Book'];
            const actualFolderName = folderNameArr.find(f => f !== 'Recent Book' && f !== 'All Books') || folderNameArr[0] || 'Recent Book';
            const bookName = res.data.meta.flipbookName || 'Untitled Flipbook';
            const projectBaseUrl = getSupabaseBaseUrl(sanitizedEmail, actualFolderName, bookName);

            const fetchedMeta = res.data.meta || {};
            const fetchedSettings = res.data.settings || {};
            const targetWidth = fetchedMeta.width || fetchedSettings.width || location.state?.width;
            const targetHeight = fetchedMeta.height || fetchedSettings.height || location.state?.height;
            const targetTemplateId = fetchedMeta.templateId || fetchedSettings.templateId || location.state?.templateId;
            const targetOrientation = fetchedMeta.orientation || fetchedSettings.orientation || location.state?.orientation;

            setCurrentBook(prev => ({
              ...(fetchedMeta || {}),
              ...(prev || {}),
              flipbookName: fetchedMeta.flipbookName || prev?.flipbookName || 'Untitled Flipbook',
              width: targetWidth,
              height: targetHeight,
              templateId: targetTemplateId,
              orientation: targetOrientation
            }));

            const processPageItem = (p, i) => {
              const name = p.name || `Page ${i + 1}`;
              let pageHtml = p.html || p.content;

              if ((!pageHtml || typeof pageHtml !== 'string' || pageHtml.trim() === '') && location.state?.templatePages?.[i]) {
                pageHtml = location.state.templatePages[i];
              } else if (i === 0 && (!pageHtml || typeof pageHtml !== 'string' || pageHtml.trim() === '') && location.state?.initialTemplateSvg) {
                pageHtml = location.state.initialTemplateSvg;
              }

              if (!pageHtml || typeof pageHtml !== 'string' || pageHtml.trim() === '') {
                const { html, layers } = createDefaultPageDataRef.current(name, targetWidth, targetHeight);
                return {
                  id: p.v_id || i + 1,
                  v_id: p.v_id,
                  name: name,
                  isHidden: p.hide == 1 || String(p.hide) === '1',
                  html: html,
                  layers: layers,
                  isLazy: false
                };
              }

              let updatedHtml = pageHtml;
              if (updatedHtml.includes('./assets/')) {
                updatedHtml = updatedHtml.split('./assets/').join(`${projectBaseUrl}assets/`);
              }

              if (updatedHtml.includes('parsererror') || updatedHtml.includes('id="custom-ctrl-')) {
                updatedHtml = updatedHtml.replace(/<parsererror[\s\S]*?<\/parsererror>/gi, '');
                updatedHtml = updatedHtml.replace(/<[^>]*id="custom-ctrl-[^>]*>.*?<\/[^>]*>/gi, '');
              }
              updatedHtml = updatedHtml.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

              const cachedLayers = pageCacheManager.getCachedLayers(p.v_id || i + 1, updatedHtml);
              if (cachedLayers && cachedLayers.length > 0) {
                pageCacheManager.getThumbnail(p.v_id || i + 1, updatedHtml);
                return {
                  id: p.v_id || i + 1,
                  v_id: p.v_id,
                  name: name,
                  isHidden: p.hide == 1 || String(p.hide) === '1',
                  html: updatedHtml,
                  layers: cachedLayers,
                  isLazy: false
                };
              }

              const doc = parser.parseFromString(updatedHtml, 'image/svg+xml');
              const allEls = doc.querySelectorAll('*');
              allEls.forEach(el => {
                const hasDropShadow = el.getAttribute('data-effect-drop-shadow') === 'true';
                const hasInnerShadow = el.getAttribute('data-effect-inner-shadow') === 'true';
                const hasBlur = el.getAttribute('data-effect-blur') === 'true';
                const hasBackgroundBlur = el.getAttribute('data-effect-background-blur') === 'true';
                if (hasDropShadow || hasInnerShadow || hasBlur || hasBackgroundBlur) {
                  syncFilters(doc, el);
                }

                const shapeType = el.getAttribute('data-shape-type') || (el.tagName === 'rect' ? 'rectangle' : null);
                if (shapeType === 'rectangle' && (el.getAttribute('data-tl') || el.getAttribute('data-tr') || el.getAttribute('data-bl') || el.getAttribute('data-br') || el.getAttribute('rx'))) {
                  const x = parseFloat(el.getAttribute('x') || 0);
                  const y = parseFloat(el.getAttribute('y') || 0);
                  const w = parseFloat(el.getAttribute('width') || 0);
                  const h = parseFloat(el.getAttribute('height') || 0);
                  const defR = parseFloat(el.getAttribute('rx') || 0);
                  const maxR = Math.min(w / 2, h / 2);
                  const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
                  const tl = Math.min(parseR(el.getAttribute('data-tl'), defR), maxR);
                  const tr = Math.min(parseR(el.getAttribute('data-tr'), defR), maxR);
                  const bl = Math.min(parseR(el.getAttribute('data-bl'), defR), maxR);
                  const br = Math.min(parseR(el.getAttribute('data-br'), defR), maxR);

                  const d = `M ${x + tl},${y} L ${x + w - tr},${y} A ${tr},${tr} 0 0 1 ${x + w},${y + tr} L ${x + w},${y + h - br} A ${br},${br} 0 0 1 ${x + w - br},${y + h} L ${x + bl},${y + h} A ${bl},${bl} 0 0 1 ${x},${y + h - bl} L ${x},${y + tl} A ${tl},${tl} 0 0 1 ${x + tl},${y} Z`.replace(/\s+/g, ' ').trim();

                  if (el.tagName === 'rect') {
                    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    Array.from(el.attributes).forEach(a => path.setAttribute(a.name, a.value));
                    path.setAttribute('d', d);
                    path.setAttribute('data-shape-type', 'rectangle');
                    if (el.parentNode) el.parentNode.replaceChild(path, el);
                  } else {
                    el.setAttribute('d', d);
                  }
                }
              });

              updatedHtml = new XMLSerializer().serializeToString(doc);

              const svgEl = doc.querySelector('svg');
              const filterLayers = (layers) => {
                if (!layers) return layers;
                return layers
                  .filter(l => l.type !== 'parsererror')
                  .map(l => ({
                    ...l,
                    children: l.children ? filterLayers(l.children) : undefined
                  }));
              };

              let layers = filterLayers(p.layers);
              if (!layers || layers.length === 0) {
                layers = svgEl ? parseLayersFromSVG(svgEl) : [];
              }

              pageCacheManager.setCachedLayers(p.v_id || i + 1, updatedHtml, layers);
              pageCacheManager.getThumbnail(p.v_id || i + 1, updatedHtml);

              return {
                id: p.v_id || i + 1,
                v_id: p.v_id,
                name: name,
                isHidden: p.hide == 1 || String(p.hide) === '1',
                html: updatedHtml,
                layers: layers,
                isLazy: false
              };
            };

            const mappedPages = res.data.pages.map((p, idx) => processPageItem(p, idx));

            setPages(mappedPages);
            setIsLoading(false);

            const firstRootId = mappedPages[0]?.layers?.[0]?.id;
            if (firstRootId) {
              setSelectedLayerIdRaw(firstRootId);
              setMultiSelectedIds(new Set([firstRootId]));
              setCurrentFrameId(firstRootId);
            }

            mappedPages.forEach((p) => {
              const pid = p.v_id || p.id;
              lastSavedHtmlsRef.current[pid] = p.html;
            });

            let shareData = res.data.share;
            if (!shareData || !shareData.shareId) {
              const newShareId = Math.random().toString(36).substring(2, 14);
              shareData = { shareId: newShareId, access: 'public' };
              axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                emailId: user?.emailId,
                v_id: v_id,
                share: shareData
              }).catch(err => console.error('Frontend shareId auto-heal save failed:', err));
            }

            setCurrentBook(prev => ({
              ...res.data.meta,
              ...(prev || {}),
              flipbookName: res.data.meta?.flipbookName || prev?.flipbookName || 'Untitled Flipbook',
              share: shareData
            }));
            setHasUnsavedChanges(false);
          }
        } catch (err) {
          console.error("Failed to fetch flipbook:", err);
          navigate('/not-found', { replace: true });
        }
      }
      else if (location.state && location.state.pageCount) {
        const count = location.state.pageCount;
        const newPages = Array.from({ length: count }, (_item, i) => {
          const name = `Page ${i + 1}`;
          let html, layers;
          if (location.state?.templatePages?.[i]) {
            html = location.state.templatePages[i];
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            layers = svgEl ? parseLayersFromSVG(svgEl) : [];
          } else if (i === 0 && location.state?.initialTemplateSvg) {
            html = location.state.initialTemplateSvg;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            layers = svgEl ? parseLayersFromSVG(svgEl) : [];
          } else {
            const def = createDefaultPageDataRef.current(name, location.state.width, location.state.height);
            html = def.html;
            layers = def.layers;
          }
          return {
            id: i + 1,
            name,
            html,
            layers
          };
        });
        setPages(newPages);

        const newFirstRootId = newPages[0]?.layers?.[0]?.id;
        if (newFirstRootId) {
          setSelectedLayerIdRaw(newFirstRootId);
          setMultiSelectedIds(new Set([newFirstRootId]));
          setCurrentFrameId(newFirstRootId);
        }
        setCurrentBook(prev => ({
          ...(prev || {}),
          flipbookName: prev?.flipbookName || location.state.flipbookName || 'Untitled Flipbook',
          folderName: prev?.folderName || location.state.folderName || 'Recent Book',
          templateId: location.state.templateId,
          orientation: location.state.orientation,
          width: location.state.width,
          height: location.state.height
        }));
      }
      else {
        const fallbackPages = Array.from({ length: 12 }, (_item, i) => {
          const name = `Page ${i + 1}`;
          const { html, layers } = createDefaultPageDataRef.current(name);
          return {
            id: i + 1,
            name,
            html,
            layers
          };
        });
        setPages(fallbackPages);

        const fallbackFirstRootId = fallbackPages[0]?.layers?.[0]?.id;
        if (fallbackFirstRootId) {
          setSelectedLayerIdRaw(fallbackFirstRootId);
          setMultiSelectedIds(new Set([fallbackFirstRootId]));
          setCurrentFrameId(fallbackFirstRootId);
        }
        setCurrentBook(prev => ({
          ...(prev || {}),
          flipbookName: prev?.flipbookName || 'Untitled Flipbook',
          folderName: prev?.folderName || 'Recent Book'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

    initializeEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v_id, location.state]);

  // ── 3D & Security Helpers ──────────────────────────────────────────────────
  const preview3DDataUrl = useMemo(() => {
    if (!current3DItem) return null;
    try {
      const doc = new DOMParser().parseFromString(pages[activePageIndex]?.html || '', 'image/svg+xml');
      const el = doc.getElementById(current3DItem.id);
      const val = el ? el.getAttribute('data-interaction-value') : current3DItem.value;
      if (!val) return null;
      let finalVal = val;
      if (val.startsWith('{')) {
        finalVal = JSON.parse(val).data || JSON.parse(val).url || val;
      }
      if (typeof finalVal === 'string' && finalVal.startsWith('/uploads/')) {
        finalVal = resolveUploadsPath(finalVal);
      }
      return finalVal;
    } catch {
      return null;
    }
  }, [current3DItem, pages, activePageIndex]);

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return v_id ? sessionStorage.getItem(`unlocked_${v_id}`) === 'true' : false;
  });

  const accessMode = (
    currentBook?.share?.access || 
    currentBook?.share?.type || 
    currentBook?.settings?.Visibility?.access || 
    currentBook?.settings?.Visibility?.type || 
    ''
  ).toLowerCase().trim();

  const isPasswordProtected = accessMode.includes('password');

  useEffect(() => {
    if (!isPasswordProtected && v_id) {
      sessionStorage.removeItem(`unlocked_${v_id}`);
      if (currentBook?.share?.shareId) sessionStorage.removeItem(`unlocked_${currentBook.share.shareId}`);
      setIsUnlocked(false);
    }
  }, [isPasswordProtected, v_id, currentBook?.share?.shareId]);

  const isPdfProject = pages.some(p => p.html && (p.html.includes('data-name="PDF Background"') || p.html.includes('data-type="pdf-vector-layer"') || p.html.includes('Document Shield')));

  const selectedElementInteraction = useMemo(() => {
    if (!selectedLayerId || pages.length === 0 || activePageIndex < 0 || activePageIndex >= pages.length) return null;
    const page = pages[activePageIndex];
    if (page && page.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const el = doc.getElementById(selectedLayerId);
      if (el) {
        return {
          id: selectedLayerId,
          tagName: el.tagName,
          'data-interaction': el.getAttribute('data-interaction'),
          'data-tooltip-settings': el.getAttribute('data-tooltip-settings')
        };
      }
    }
    return null;
  }, [selectedLayerId, pages, activePageIndex]);

  // ── JSX Render ─────────────────────────────────────────────────────────────
  return (
    <div onContextMenu={(e) => e.preventDefault()} className="flex h-[92vh] w-full bg-white overflow-hidden relative">
      {!isLoading && isPasswordProtected && !isUnlocked && (
        <PasswordProtectModal
          v_id={v_id}
          shareId={currentBook?.share?.shareId}
          onUnlock={() => setIsUnlocked(true)}
        />
      )}
      <AnimatePresence>
        {isLoading && (
          <Motion.div
            key="editor-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white h-full w-full gap-3"
          >
            <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-[0.85vw] font-semibold text-gray-600 tracking-wide">Loading Editor...</span>
          </Motion.div>
        )}
      </AnimatePresence>

      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex h-full w-full overflow-hidden relative"
      >
        <div className={`flex flex-1 min-w-0 overflow-hidden transition-all duration-300 ${is3DModalOpen ? 'blur-md pointer-events-none' : ''}`}>
          <Layer
            pages={pages}
            activePageIndex={activePageIndex}
            setActivePageIndex={setActivePageIndex}
            isDoublePage={isDoublePage}
            insertPageAfter={insertPageAfter}
            duplicatePage={duplicatePage}
            renamePage={renamePage}
            renameLayer={renameLayer}
            deletePage={deletePage}
            movePageUp={movePageUp}
            movePageDown={movePageDown}
            movePageToFirst={movePageToFirst}
            movePageToLast={movePageToLast}
            movePage={movePage}
            clearPage={clearPage}
            togglePageVisibility={togglePageVisibility}
            onOpenTemplateModal={handleOpenTemplateModal}
            toggleLayerVisibility={toggleLayerVisibility}
            toggleLayerLock={toggleLayerLock}
            bringLayerToFront={bringLayerToFront}
            sendLayerToBack={sendLayerToBack}
            moveLayerForward={moveLayerForward}
            moveLayerBackward={moveLayerBackward}
            reorderLayer={reorderLayer}
            deleteLayer={deleteLayer}
            copyLayer={copyLayer}
            cutLayer={cutLayer}
            pasteLayer={pasteLayer}
            duplicateLayer={duplicateLayer}
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
            multiSelectedIds={multiSelectedIds}
            setMultiSelectedIds={setMultiSelectedIds}
            currentFrameId={currentFrameId}
            setCurrentFrameId={setCurrentFrameId}
            clipboard={clipboard}
            currentBook={currentBook}
            setCurrentBook={setCurrentBook}
            onSave={saveFlipbook}
            onAddFile={handleAddFileClick}
            onReplaceFile={handleReplaceFileClick}
            isExportModalOpen={isExportModalOpen}
          />

          <MainEditor
            isPdfProject={isPdfProject}
            isRulerEnabled={isRulerEnabled}
            isTrimView={isTrimView}
            pages={pages}
            activePageIndex={activePageIndex}
            setActivePageIndex={setActivePageIndex}
            clearPage={clearPage}
            deletePage={deletePage}
            onOpenTemplateModal={handleOpenTemplateModal}
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
            updatePageHtml={updatePageHtml}
            multiSelectedIds={multiSelectedIds}
            setMultiSelectedIds={setMultiSelectedIds}
            onUndo={undo}
            onRedo={redo}
            canUndo={history.length > 0}
            canRedo={redoStack.length > 0}
            currentFrameId={currentFrameId}
            setCurrentFrameId={setCurrentFrameId}
            activeMainTool={activeMainTool}
            setActiveMainTool={setActiveMainTool}
            activeTopTool={activeTopTool}
            setActiveTopTool={(tool) => {
              setActiveTopTool(tool);
              if (tool !== 'editor') {
                setActiveMainTool('select');
              }
            }}
            isPopupEditor={!!popupEditContext}
            flipbookDimensions={popupEditContext ? (popupEditContext.dimensions || { width: 800, height: 600 }) : getFlipbookDimensions()}
          />

          {(activeTopTool === 'interaction' || (isPdfProject && activeTopTool === 'editor' && activeMainTool !== 'upload')) && selectedElementInteraction?.['data-interaction'] === 'tooltip' && (
            <TooltipCustomization
              selectedElementProps={selectedElementInteraction}
              activePageIndex={activePageIndex}
              selectedLayerId={selectedLayerId}
              updateElementAttribute={updateElementAttribute}
            />
          )}
        </div>

        {/* Dark Overlay for 3D Preview Modal */}
        {is3DModalOpen && (
          <div className="absolute top-0 left-0 bottom-0 right-[24vw] z-[90] bg-black/60 pointer-events-none transition-all duration-300"></div>
        )}

        {/* 3D Preview Modal */}
        {is3DModalOpen && (
          <div className="absolute top-0 left-0 bottom-0 right-[24vw] z-[100] flex p-[2vw]">
            <Model3DPreviewModal
              isOpen={is3DModalOpen}
              dataUrl={preview3DDataUrl}
              shadowStrength={shadowStrength}
              shadowSoftness={shadowSoftness}
              autoRotate={autoRotate}
              autoRotateSpeed={autoRotateSpeed}
              lockMaxZoom={lockMaxZoom}
              maxZoom={maxZoom}
              bgType={bgType}
              bgColor={bgColor}
              customBg={customBg}
              enableAR={enableAR}
              setBgColor={setBgColor}
              qrText={qrText} qrColor={qrColor} qrBgType={qrBgType} qrBgColor={qrBgColor} qrLevel={qrLevel} qrDotType={qrDotType} qrCornerSquareType={qrCornerSquareType} qrCornerDotType={qrCornerDotType} qrLogo={qrLogo}
              topText={topText} bottomText={bottomText} vId={current3DVId}
              hotspots={current3DHotspots}
              activeHotspotId={active3DHotspotId}
              onHotspotClick={(hs) => setActive3DHotspotId(prev => prev === hs?.id ? null : (hs?.id || null))}
            />
          </div>
        )}

        <RightSidebar
          isDoublePage={isDoublePage}
          setIsDoublePage={setIsDoublePage}
          isRulerEnabled={isRulerEnabled}
          setIsRulerEnabled={setIsRulerEnabled}
          activeMainTool={activeMainTool}
          setActiveMainTool={setActiveMainTool}
          activeTopTool={activeTopTool}
          activePageIndex={activePageIndex}
          pages={pages}
          setPages={setPages}
          updatePageBackground={updatePageBackground}
          selectedLayerId={selectedLayerId}
          setSelectedLayerId={setSelectedLayerId}
          multiSelectedIds={multiSelectedIds}
          setMultiSelectedIds={setMultiSelectedIds}
          updateElementAttribute={updateElementAttribute}
          deleteLayer={deleteLayer}
          onPreview={() => setShowPreview(true)}
          flipbookDimensions={getFlipbookDimensions()}
          isPopupEditor={!!popupEditContext}
          onCustomizePopup={onCustomizePopup}
          onApplyPopupChanges={handleApplyPopupChanges}
          preview3DDataUrl={preview3DDataUrl}
          onCancelPopupChanges={handleCancelPopupChanges}
          is3DModalOpen={is3DModalOpen}
          setIs3DModalOpen={setIs3DModalOpen}
          setCurrent3DItem={setCurrent3DItem}
          shadowStrength={shadowStrength}
          setShadowStrength={setShadowStrength}
          shadowSoftness={shadowSoftness}
          setShadowSoftness={setShadowSoftness}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          autoRotateSpeed={autoRotateSpeed}
          setAutoRotateSpeed={setAutoRotateSpeed}
          lockMaxZoom={lockMaxZoom}
          setLockMaxZoom={setLockMaxZoom}
          maxZoom={maxZoom}
          setMaxZoom={setMaxZoom}
          bgType={bgType}
          setBgType={setBgType}
          bgColor={bgColor}
          setBgColor={setBgColor}
          customBg={customBg}
          setCustomBg={setCustomBg}
          enableAR={enableAR}
          setEnableAR={setEnableAR}
          qrText={qrText} setQrText={setQrText} qrColor={qrColor} setQrColor={setQrColor} qrBgType={qrBgType} setQrBgType={setQrBgType} qrBgColor={qrBgColor} setQrBgColor={setQrBgColor} qrLevel={qrLevel} setQrLevel={setQrLevel} qrDotType={qrDotType} setQrDotType={setQrDotType} qrCornerSquareType={qrCornerSquareType} setQrCornerSquareType={setQrCornerSquareType} qrCornerDotType={qrCornerDotType} setQrCornerDotType={setQrCornerDotType} qrLogo={qrLogo} setQrLogo={setQrLogo}
          topText={topText} setTopText={setTopText} bottomText={bottomText} setBottomText={setBottomText}
          current3DVId={current3DVId}
          hotspots={current3DHotspots}
          activeHotspotId={active3DHotspotId}
          onHotspotClick={(hs) => setActive3DHotspotId(hs?.id || null)}
          v_id={v_id || currentBook?.v_id}
          flipbookVId={v_id || currentBook?.v_id}
          folderName={Array.isArray(currentBook?.folderName) ? currentBook.folderName.find(f => f !== 'Recent Book' && f !== 'All Books') || currentBook.folderName[0] : (currentBook?.folderName || location.state?.folderName || 'My_Flipbooks')}
          flipbookName={currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook'}
        />

        {showTemplateModal && (
          <TemplateModal
            showTemplateModal={showTemplateModal}
            setShowTemplateModal={setShowTemplateModal}
            clearCanvas={() => clearPage(templateTargetIndex !== null ? templateTargetIndex : activePageIndex)}
            loadTemplate={loadTemplate}
            pages={pages}
            activePageIndex={activePageIndex}
            templateTargetIndex={templateTargetIndex}
            currentBook={currentBook}
            flipbookDimensions={getFlipbookDimensions()}
            onAddTemplatePages={handleAddTemplatePages}
          />
        )}

        {showPreview && (
          <FlipbookPreview
            pages={pages.filter(p => !p.isHidden).map(p => ({ ...p, content: p.html || '' }))}
            pageName={currentBook?.flipbookName || 'Preview'}
            onClose={() => setShowPreview(false)}
            isMobile={false}
            isDoublePage={isDoublePage}
            targetPage={0}
            settings={{}}
          />
        )}

        {/* Hidden File Input for PDF / Office Document Upload */}
        <input
          type="file"
          ref={pdfInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={handlePdfFileSelect}
        />

        {/* Hidden File Input for PDF / Office Document Replace */}
        <input
          type="file"
          ref={replacePdfInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={handleReplaceFileSelect}
        />

        {/* PDF Processing Loader */}
        <PdfProcessingLoader progress={pdfProcessing} onCancel={() => setPdfProcessing(null)} />

        <AlertModal
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onConfirm={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Change Popup Template Modal */}
        {showPopupTemplateChange && popupEditContext && (
          <PopupTemplateSelection
            isOpen={showPopupTemplateChange}
            onClose={() => setShowPopupTemplateChange(false)}
            onSelect={(templateId) => {
              onCustomizePopup(templateId, popupEditContext.elementId, popupEditContext.pageIndex);
              setShowPopupTemplateChange(false);
            }}
            onCustomize={(templateId) => {
              onCustomizePopup(templateId, popupEditContext.elementId, popupEditContext.pageIndex);
              setShowPopupTemplateChange(false);
            }}
            selectedTemplateId={popupEditContext.templateId}
          />
        )}

      </Motion.div>
    </div>
  );
};

export default TemplateEditor;
