import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveToDB } from '../../utils/dbUtils';
import Layer from './Layer';
import MainEditor from './MainEditor';
import RightSidebar from './RightSidebar';
import TooltipCustomization from './TooltipCustomization';
import TemplateModal from './TemplateModal';
import FlipbookPreview from './FlipbookPreview';
import { convertPdfToImages, generatePdfPageSvg } from '../../utils/pdfUtils';
import AlertModal from '../AlertModal';
import PdfProcessingLoader from '../PdfProcessingLoader';
import PopupTemplateSelection, { TEMPLATES as popupTemplates } from './PopupTemplateSelection';
import Model3DPreviewModal from './Interaction3DPreview';

/**
 * Internal helper to parse layers from SVG content recursively.
 * Ensures the layer panel stays in sync with the SVG DOM structure.
 */
const parseLayersFromSVG = (element) => {
  return Array.from(element.children)
    .filter(child => {
      if (['defs', 'metadata', 'style', 'title', 'desc', 'parsererror'].includes(child.tagName.toLowerCase())) return false;
      if (child.getAttribute('data-name') === 'Overlay') return false;
      if (child.classList.contains('svg-drop-shadow-caster')) return false;
      if (child.classList.contains('internal-crop-rect')) return false;
      if (child.classList.contains('internal-crop-pattern')) return false;

      const isEffectNode = Array.from(child.classList).some(cls =>
        cls.includes('-stroke-overlay') ||
        cls.includes('-inner-shadow') ||
        cls.includes('-fill-layer') ||
        cls === 'inner-shadow-overlay'
      );
      if (isEffectNode) return false;

      return true;
    })
    .flatMap(child => {
      // If this is an inner crop wrapper, unwrap it by returning its children directly
      if (child.tagName.toLowerCase() === 'svg' && child.classList.contains('svg-crop-wrapper')) {
        return parseLayersFromSVG(child);
      }
      // Ensure element has a unique ID for selection and state tracking
      let id = child.getAttribute('id') || child.id;
      if (!id) {
        id = `${child.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;
        child.setAttribute('id', id);
        if ('id' in child) {
          try { child.id = id; } catch (e) { }
        }
      }
      const rawName = child.getAttribute('data-name') || id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
      const cleanName = rawName.replace(/^tpl-[a-z0-9]{4}-/, '');

      const layer = {
        id,
        name: cleanName,
        type: child.tagName.toLowerCase(),
        visible: child.getAttribute('data-hidden') !== 'true',
        locked: child.getAttribute('data-locked') === 'true'
      };

      // VIRTUAL EFFECT LAYERS FOR IMAGE/VIDEO/GIF GROUP
      const isGroup = child.getAttribute('data-is-image-group') === 'true' ||
        child.getAttribute('data-is-video-group') === 'true' ||
        child.getAttribute('data-is-gif-group') === 'true';

      if (child.tagName.toLowerCase() === 'g' && child.children.length > 0 && !isGroup) {
        const subLayers = parseLayersFromSVG(child);
        if (subLayers.length > 0) layer.children = subLayers;
      } else if (isGroup) {
        // Strip IDs from all descendants of an Image Group so they can't be selected individually
        const stripIds = (node) => {
          Array.from(node.children).forEach(descendant => {
            descendant.removeAttribute('id');
            stripIds(descendant);
          });
        };
        stripIds(child);
      }

      const isText = child.tagName.toLowerCase() === 'text' ||
        (child.tagName.toLowerCase() === 'foreignobject' && child.getAttribute('data-type') !== 'video' && child.getAttribute('data-type') !== 'iframe');

      if (isGroup || isText) {
        let coreName = 'Image';
        let coreType = 'image';
        if (child.getAttribute('data-is-video-group') === 'true') {
          coreName = 'Video';
          coreType = 'video';
        } else if (child.getAttribute('data-is-gif-group') === 'true') {
          coreName = 'GIF';
          coreType = 'image';
        } else if (isText) {
          coreName = 'Text';
          coreType = 'text';
        }
        layer.name = coreName;
        layer.type = coreType;
        // Strip children to show as a single flat element in the layers panel
        delete layer.children;
      }

      return [layer];
    });
};

/**
 * TemplateEditor Layout Component
 * Integrates the various sub-components into a single editor interface.
 */
export const syncGradient = (doc, element, baseAttr) => {
    const type = element.getAttribute(`${baseAttr}-type`); // 'solid' or 'gradient'
    const currentValue = element.getAttribute(baseAttr);
    const isUrl = currentValue && currentValue.startsWith('url(#');
    const gradType = element.getAttribute(`${baseAttr}-gradient-type`) || 'linear'; // 'linear', 'radial', 'angular', or 'diamond'
    const stopsJson = element.getAttribute(`${baseAttr}-stops`);

    if (type === 'solid' || type === 'none') {
      return;
    }
    if (!type && !isUrl) return;
    if (!stopsJson) return;

    let stops = [];
    try { stops = JSON.parse(stopsJson); } catch (e) { return; }

    const svgRoot = element.closest ? element.closest('svg') : null || doc.querySelector('svg');
    if (!svgRoot) return; // Prevent crash if no SVG found in document

    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    if (!element.id) {
      element.id = `${element.tagName}-${Math.random().toString(36).substr(2, 9)}`;
    }
    const gradId = `grad-${element.id}-${baseAttr}`;
    let gradEl = defs.querySelector(`[id="${gradId}"]`);

    const svgGradType = (gradType === 'angular' || gradType === 'diamond') ? (gradType === 'angular' ? 'linear' : 'radial') : gradType;

    if (gradEl && gradEl.tagName.toLowerCase() !== `${svgGradType}gradient`.toLowerCase()) {
      gradEl.remove();
      gradEl = null;
    }

    if (!gradEl) {
      gradEl = doc.createElementNS("http://www.w3.org/2000/svg", `${svgGradType}Gradient`);
      gradEl.id = gradId;
      defs.appendChild(gradEl);
    }

    if (svgGradType === 'linear') {
      let angleStr = element.getAttribute(`${baseAttr}-angle`);
      if (!angleStr && currentValue) {
         const match = currentValue.match(/(\d+)deg/);
         if (match) angleStr = match[1];
      }
      const angleDeg = parseFloat(angleStr || '0');
      const theta = (angleDeg - 90) * (Math.PI / 180);
      const length = Math.abs(Math.cos(theta)) + Math.abs(Math.sin(theta));
      const x1 = 50 - (Math.cos(theta) * length * 50);
      const y1 = 50 - (Math.sin(theta) * length * 50);
      const x2 = 50 + (Math.cos(theta) * length * 50);
      const y2 = 50 + (Math.sin(theta) * length * 50);

      gradEl.setAttribute('x1', `${x1}%`);
      gradEl.setAttribute('y1', `${y1}%`);
      gradEl.setAttribute('x2', `${x2}%`);
      gradEl.setAttribute('y2', `${y2}%`);
    } else {
      let radiusStr = element.getAttribute(`${baseAttr}-radius`);
      if (!radiusStr && currentValue) {
        const maxPctMatch = [...currentValue.matchAll(/([\d.]+)%/g)].map(m => parseFloat(m[1]));
        if (maxPctMatch.length > 0) radiusStr = Math.max(...maxPctMatch).toString();
      }
      const radius = parseFloat(radiusStr || '100');
      
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', `${50 * (radius / 100)}%`);
    }

    while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);
    stops.forEach(s => {
      const stop = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop.setAttribute('offset', `${s.offset}%`);
      stop.setAttribute('stop-color', s.color);
      stop.setAttribute('stop-opacity', (s.opacity !== undefined && s.opacity !== null) ? s.opacity : 1);
      gradEl.appendChild(stop);
    });

    element.setAttribute(baseAttr, `url(#${gradId})`);

    if (element.tagName.toLowerCase() === 'g') {
      Array.from(element.querySelectorAll('path, rect, circle, ellipse, polyline, polygon')).forEach(child => {
        child.removeAttribute(baseAttr);
        if (child.style) child.style.removeProperty(baseAttr);
      });
    }
  };

const TemplateEditor = () => {
  const { folder, v_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    setSaveHandler,
    setPreviewHandler,
    setHasUnsavedChanges,
    triggerSaveSuccess,
    isAutoSaveEnabled,
    isSaving,
    setIsSaving,
    currentBook,
    setCurrentBook,
    isExportModalOpen,
    setExportContext
  } = useOutletContext();

  // ── States & Refs ──────────────────────────────────────────────────────────
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDoublePage, setIsDoublePage] = useState(false);
  const [isRulerEnabled, setIsRulerEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTargetIndex, setTemplateTargetIndex] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());
  const [clipboard, setClipboard] = useState(null);
  const [currentFrameId, setCurrentFrameId] = useState(null);
  const [activeMainTool, setActiveMainTool] = useState('select');
  const [activeTopTool, setActiveTopTool] = useState('editor');
  const [popupEditContext, setPopupEditContext] = useState(null);
  const [showPopupTemplateChange, setShowPopupTemplateChange] = useState(false);

  // Automatically switch to the Properties panel ('select' tool) when an element 
  // is selected while the Uploads panel is active.
  useEffect(() => {
    if (selectedLayerId) {
      setActiveMainTool((prev) => prev === 'upload' ? 'select' : prev);
    }
  }, [selectedLayerId]);

  // 3D Customization States
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [current3DItem, setCurrent3DItem] = useState(null);
  const [shadowStrength, setShadowStrength] = useState(35);
  const [shadowSoftness, setShadowSoftness] = useState(35);
  const [autoRotate, setAutoRotate] = useState(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.5);
  const [lockMaxZoom, setLockMaxZoom] = useState(true);
  const [maxZoom, setMaxZoom] = useState(4.5);
  const [bgType, setBgType] = useState('Solid');
  const [bgColor, setBgColor] = useState('#000000');
  const [customBg, setCustomBg] = useState(true);
  const [enableAR, setEnableAR] = useState(true);
  const [qrText, setQrText] = useState('Scan Me');
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgType, setQrBgType] = useState('Solid');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrLevel, setQrLevel] = useState('L');
  const [qrDotType, setQrDotType] = useState('square');
  const [qrCornerSquareType, setQrCornerSquareType] = useState('square');
  const [qrCornerDotType, setQrCornerDotType] = useState('square');
  const [qrLogo, setQrLogo] = useState(null);

  const [topText, setTopText] = useState('You can Rotate 3D object');
  const [bottomText, setBottomText] = useState('Machine');

  useEffect(() => {
    if (current3DItem && is3DModalOpen) {
      const doc = new DOMParser().parseFromString(pages[activePageIndex]?.html || '', 'image/svg+xml');
      const el = doc.getElementById(current3DItem.id);
      if (el) {
        const confStr = el.getAttribute('data-interaction-config');
        if (confStr) {
          try {
            const conf = JSON.parse(confStr);
            if (conf.shadowStrength !== undefined) setShadowStrength(conf.shadowStrength);
            if (conf.shadowSoftness !== undefined) setShadowSoftness(conf.shadowSoftness);
            if (conf.autoRotate !== undefined) setAutoRotate(conf.autoRotate);
            if (conf.autoRotateSpeed !== undefined) setAutoRotateSpeed(conf.autoRotateSpeed);
            if (conf.lockMaxZoom !== undefined) setLockMaxZoom(conf.lockMaxZoom);
            if (conf.maxZoom !== undefined) setMaxZoom(conf.maxZoom);
            if (conf.bgType !== undefined) setBgType(conf.bgType);
            if (conf.bgColor !== undefined) setBgColor(conf.bgColor);
            if (conf.customBg !== undefined) setCustomBg(conf.customBg);
            if (conf.enableAR !== undefined) setEnableAR(conf.enableAR);
            if (conf.qrText !== undefined) setQrText(conf.qrText);
            if (conf.qrColor !== undefined) setQrColor(conf.qrColor);
            if (conf.qrBgType !== undefined) setQrBgType(conf.qrBgType);
            if (conf.qrBgColor !== undefined) setQrBgColor(conf.qrBgColor);
            if (conf.qrLevel !== undefined) setQrLevel(conf.qrLevel);
            if (conf.qrDotType !== undefined) setQrDotType(conf.qrDotType);
            if (conf.qrCornerSquareType !== undefined) setQrCornerSquareType(conf.qrCornerSquareType);
            if (conf.qrCornerDotType !== undefined) setQrCornerDotType(conf.qrCornerDotType);
            if (conf.qrLogo !== undefined) setQrLogo(conf.qrLogo);
            if (conf.topText !== undefined) setTopText(conf.topText);
            if (conf.bottomText !== undefined) setBottomText(conf.bottomText);
          } catch (e) { }
        }

        // Fetch latest displayName from DB for Modal Name
        const dataVal = el.getAttribute('data-interaction-value');
        if (dataVal && dataVal.startsWith('{')) {
          try {
            const parsed = JSON.parse(dataVal);
            if (parsed.v_id) {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              axios.get(`${backendUrl}/api/3d-models/get-model/${parsed.v_id}`)
                .then(res => {
                  if (res.data && res.data.displayName) {
                    setBottomText(res.data.displayName);
                  } else if (res.data && res.data.name) {
                    setBottomText(res.data.name);
                  }
                })
                .catch(err => console.error("Failed to fetch 3D model name:", err));
            }
          } catch (e) { }
        }
      }
    }
  }, [current3DItem, is3DModalOpen]); // Load only on open

  useEffect(() => {
    if (!is3DModalOpen && current3DItem) {
      const configObj = {
        shadowStrength, shadowSoftness, autoRotate, autoRotateSpeed, lockMaxZoom, maxZoom,
        bgType, bgColor, customBg, enableAR,
        qrText, qrColor, qrBgType, qrBgColor, qrLevel, qrDotType, qrCornerSquareType, qrCornerDotType, qrLogo,
        topText, bottomText
      };

      setPages(prevPages => {
        const newPages = [...prevPages];
        if (!newPages[activePageIndex]) return newPages;
        const page = { ...newPages[activePageIndex] };
        if (page.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(page.html, 'image/svg+xml');
          const el = doc.getElementById(current3DItem.id);
          if (el) {
            el.setAttribute('data-interaction-config', JSON.stringify(configObj));

            // Save the manually updated Modal Name (bottomText) back to DB
            const dataVal = el.getAttribute('data-interaction-value');
            if (dataVal && dataVal.startsWith('{')) {
              try {
                const parsed = JSON.parse(dataVal);
                if (parsed.v_id) {
                  parsed.name = bottomText;
                  el.setAttribute('data-interaction-value', JSON.stringify(parsed));

                  const storedUser = localStorage.getItem('user');
                  const user = storedUser ? JSON.parse(storedUser) : null;
                  if (user?.emailId) {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                    axios.post(`${backendUrl}/api/3d-models/rename-label`, {
                      emailId: user.emailId,
                      modelId: parsed.v_id,
                      newName: bottomText
                    }).catch(err => console.error("Failed to update 3D model name in DB:", err));
                  }
                }
              } catch (e) { }
            }

            const serializer = new XMLSerializer();
            page.html = serializer.serializeToString(doc.documentElement);
            newPages[activePageIndex] = page;
          }
        }
        return newPages;
      });
    }
  }, [is3DModalOpen, current3DItem, activePageIndex, shadowStrength, shadowSoftness, autoRotate, autoRotateSpeed, lockMaxZoom, maxZoom, bgType, bgColor, customBg, enableAR, qrText, qrColor, qrBgType, qrBgColor, qrLevel, qrDotType, qrCornerSquareType, qrCornerDotType, qrLogo, topText, bottomText]); // Save on close with latest values

  useEffect(() => {
    const handleOpen = () => setShowPopupTemplateChange(true);
    window.addEventListener('open-change-popup-template', handleOpen);
    return () => window.removeEventListener('open-change-popup-template', handleOpen);
  }, []);

  useEffect(() => {
    if (!v_id && !location.state) {
      navigate('/unauthorized', { replace: true });
    }
  }, [v_id, location.state, navigate]);

  const [pdfProcessing, setPdfProcessing] = useState(null); // { current, total, message }
  const pdfInputRef = useRef(null);
  const pdfInsertIndexRef = useRef(null);
  const replacePdfInputRef = useRef(null);
  const replacePageIndexRef = useRef(null);

  const autoSaveTimerRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const justSavedRef = useRef(false);
  const lastPageIndexRef = useRef(-1);
  const historyRef = useRef([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const MAX_HISTORY = 50;

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const lastSavedHtmlsRef = useRef({});
  // Ref to prevent the page-selection effect from resetting to root during paste
  const skipPasteResetRef = useRef(false);

  // Sync state to ExportModal context
  useEffect(() => {
    if (setExportContext) {
      setExportContext({ pages, activePageIndex });
    }
  }, [pages, activePageIndex, setExportContext]);

  // ── Save Logic ─────────────────────────────────────────────────────────────
  const saveFlipbook = async (isManual = false, overridePages = null) => {
    let pagesToSave = overridePages || pages;
    if (isSaving || !pagesToSave || pagesToSave.length === 0) return;

    try {
      setIsSaving(true);
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const sanitizedEmail = user?.emailId?.replace(/[@.]/g, "_");
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      // Extract and upload 3D models into the flipbook's assets/3D_Model/ folder before saving
      const fNameFor3D = Array.isArray(currentBook?.folderName)
        ? currentBook.folderName.find(f => f !== 'Recent Book' && f !== 'Recent book') || currentBook.folderName[0]
        : (currentBook?.folderName || location.state?.folderName || 'Recent Book');
      const bNameFor3D = currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook';

      pagesToSave = await Promise.all(pagesToSave.map(async (p) => {
        if (!p.html || (!p.html.includes('data-interaction="3d-viewer"') && !p.html.includes('data-interaction="download"') && !p.html.includes('data-interaction="audio"'))) return p;

        let newHtml = p.html;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(newHtml, 'image/svg+xml');
          const threedElements = doc.querySelectorAll('[data-interaction="3d-viewer"]');

          for (let el of threedElements) {
            let dataVal = el.getAttribute('data-interaction-value');
            if (!dataVal) continue;

            let actualDataUri = null;

            if (dataVal.startsWith('{')) {
              try {
                const originalJson = JSON.parse(dataVal);
                if (originalJson.data && (originalJson.data.startsWith('data:') || originalJson.data.startsWith('blob:'))) {
                  actualDataUri = originalJson.data;
                }
              } catch (e) { }
            } else if (dataVal.startsWith('data:') || dataVal.startsWith('blob:')) {
              actualDataUri = dataVal;
            }

            if (actualDataUri) {
              let blob;
              if (actualDataUri.startsWith('blob:')) {
                const res = await fetch(actualDataUri);
                blob = await res.blob();
              } else {
                const parts = actualDataUri.split(',');
                const mimeString = parts[0].split(':')[1].split(';')[0];
                let byteString;
                if (parts[0].indexOf('base64') >= 0) {
                  byteString = atob(parts[1]);
                } else {
                  byteString = decodeURI(parts[1]);
                }
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                blob = new Blob([ab], { type: mimeString });
              }

              const formData = new FormData();
              formData.append('emailId', user?.emailId);
              formData.append('folderName', fNameFor3D);
              formData.append('flipbookName', bNameFor3D);

              let isFromGallery = false;
              let fileName = `model_${Date.now()}.glb`;
              try {
                if (dataVal.startsWith('{')) {
                  const originalJson = JSON.parse(dataVal);
                  if (originalJson.fromGallery) isFromGallery = true;
                  if (originalJson.name) fileName = originalJson.name;
                }
              } catch (e) { }

              if (isFromGallery) {
                formData.append('skipGlobalGallery', 'true');
              }

              formData.append('model', blob, fileName);

              const uploadRes = await axios.post(`${backendUrl}/api/flipbook/upload-3d-model`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });

              if (uploadRes.data && uploadRes.data.url) {
                // url is relative: ./assets/3D_Model/<filename>
                const finalUrl = uploadRes.data.url;
                const absoluteUrl = `${backendUrl}/uploads/${sanitizedEmail}/My_Flipbooks/${fNameFor3D}/${bNameFor3D}/${finalUrl.replace(/^\.\//, '')}`;

                let newHtmlVal = dataVal.replace(actualDataUri, absoluteUrl);
                if (dataVal.startsWith('{') && uploadRes.data.v_id) {
                  try {
                    const obj = JSON.parse(newHtmlVal);
                    obj.v_id = uploadRes.data.v_id;
                    newHtmlVal = JSON.stringify(obj);
                  } catch (e) { }
                }

                const escapedOld = dataVal.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                const escapedNew = newHtmlVal.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

                if (newHtml.includes(escapedOld)) {
                  newHtml = newHtml.replace(escapedOld, escapedNew);
                } else if (newHtml.includes(dataVal)) {
                  newHtml = newHtml.replace(dataVal, newHtmlVal);
                } else {
                  newHtml = newHtml.replace(actualDataUri, absoluteUrl);
                }

                // Update live DOM immediately to prevent stale interaction states in UI
                try {
                  const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                  if (editorDoc) {
                    const liveEls = editorDoc.querySelectorAll('[data-interaction="3d-viewer"]');
                    liveEls.forEach(lEl => {
                      const lDataVal = lEl.getAttribute('data-interaction-value');
                      if (lDataVal && lDataVal === dataVal) {
                        lEl.setAttribute('data-interaction-value', newHtmlVal);
                      } else if (lDataVal && lDataVal.includes(actualDataUri)) {
                        lEl.setAttribute('data-interaction-value', lDataVal.replace(actualDataUri, absoluteUrl));
                      }
                    });
                  }
                } catch (e) { }
              }
            }
          }
          // --- DIRECT STRING SEARCH base64 extraction and upload ---
          // Regex engines often fail silently or hit length limits on 3MB+ contiguous strings.
          // We use a pure indexOf search to safely extract huge data URIs.
          const uniqueDataUris = new Set();
          let searchIndex = 0;
          while (searchIndex < newHtml.length) {
            const imgIdx = newHtml.indexOf('data:image/', searchIndex);
            const audIdx = newHtml.indexOf('data:audio/', searchIndex);
            const vidIdx = newHtml.indexOf('data:video/', searchIndex);

            let foundIdx = -1;
            const indices = [imgIdx, audIdx, vidIdx].filter(idx => idx !== -1);
            if (indices.length > 0) {
              foundIdx = Math.min(...indices);
            }

            if (foundIdx === -1) break;

            // The data URI is embedded in a JSON string, so it ends at &quot; or "
            const endIdx1 = newHtml.indexOf('&quot;', foundIdx);
            const endIdx2 = newHtml.indexOf('"', foundIdx);

            let endIdx = -1;
            if (endIdx1 !== -1 && endIdx2 !== -1) endIdx = Math.min(endIdx1, endIdx2);
            else if (endIdx1 !== -1) endIdx = endIdx1;
            else if (endIdx2 !== -1) endIdx = endIdx2;

            if (endIdx !== -1) {
              const dataUri = newHtml.substring(foundIdx, endIdx);
              if (dataUri.includes(';base64,')) {
                uniqueDataUris.add(dataUri);
              }
              searchIndex = endIdx;
            } else {
              break;
            }
          }

          for (const actualDataUri of uniqueDataUris) {
            try {
              // Browsers (like Chrome) limit fetch() URLs to ~2MB.
              // To handle 3MB+ data URIs, we manually convert base64 to Blob.
              const parts = actualDataUri.split(',');
              const mimeString = parts[0].split(':')[1].split(';')[0];

              // Handle URL encoded data URIs (e.g. svg+xml) or pure base64
              let byteString;
              if (parts[0].indexOf('base64') >= 0) {
                byteString = atob(parts[1]);
              } else {
                byteString = decodeURI(parts[1]);
              }

              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: mimeString });

              const isAudio = blob.type.startsWith('audio/');
              const isVideo = blob.type.startsWith('video/');
              const assetType = isAudio ? 'audio' : (isVideo ? 'video' : 'image');

              const formData = new FormData();
              formData.append('emailId', user?.emailId);
              formData.append('folderName', fNameFor3D);
              formData.append('flipbookName', bNameFor3D);
              formData.append('type', assetType);
              formData.append('page_v_id', 'global');
              if (currentVId || v_id) {
                formData.append('v_id', currentVId || v_id);
              }
              formData.append('file', blob, `asset_${Date.now()}`);

              const uploadRes = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });

              if (uploadRes.data && uploadRes.data.url) {
                const finalUrl = uploadRes.data.url;
                const assetPathMatch = finalUrl.match(/assets\/[^/]+\/[^/]+$/);
                const sanitizedEmail = user?.emailId?.replace(/[@.]/g, "_");
                const absoluteUrl = assetPathMatch
                  ? `${backendUrl}/uploads/${sanitizedEmail}/My_Flipbooks/${fNameFor3D}/${bNameFor3D}/${assetPathMatch[0]}`
                  : finalUrl;

                // Replace the data URI directly in the raw HTML
                newHtml = newHtml.split(actualDataUri).join(absoluteUrl);

                // Update the live DOM element so InteractionPanel shows the image immediately
                try {
                  const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                  if (editorDoc) {
                    const liveEls = editorDoc.querySelectorAll(`[data-interaction="download"], [data-interaction="audio"]`);
                    liveEls.forEach(lEl => {
                      const lDataVal = lEl.getAttribute('data-interaction-value');
                      if (lDataVal && lDataVal.includes(actualDataUri)) {
                        lEl.setAttribute('data-interaction-value', lDataVal.split(actualDataUri).join(absoluteUrl));
                      }
                    });
                  }
                } catch (e) { }

                console.log(`[Save] Uploaded large asset directly: ${absoluteUrl}`);
              }
            } catch (err) {
              console.error('[Save] Failed to upload large asset directly:', err);
            }
          }
        } catch (err) {
          console.error('Error processing 3D models or assets in page before save', err);
        }

        if (newHtml && !newHtml.includes('id="global-fonts-style"')) {
          const fontsStyle = `<style id="global-fonts-style">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&amp;family=Inter:wght@300;400;500;600;700;900&amp;family=Roboto:wght@300;400;500;700;900&amp;family=Outfit:wght@300;400;500;600;700;900&amp;family=Montserrat:wght@300;400;500;600;700;900&amp;family=Playfair+Display:ital,wght@0,400..900;1,400..900&amp;family=Nunito+Sans:wght@300;400;500;600;700;900&amp;display=swap');
@font-face { font-family: 'Designer_Signature'; src: url('${window.location.origin}/lib/Fonts/designer_signature/Designer_Signature.otf') format('opentype'); }
@font-face { font-family: 'Open Sans'; src: url('${window.location.origin}/lib/Fonts/Open_Sans/OpenSans-VariableFont_wdth,wght.ttf') format('truetype'); }
@font-face { font-family: 'Lato'; src: url('${window.location.origin}/lib/Fonts/Lato/Lato-Regular.ttf') format('truetype'); }
@font-face { font-family: 'Oswald'; src: url('${window.location.origin}/lib/Fonts/Oswald/Oswald-VariableFont_wght.ttf') format('truetype'); }
@font-face { font-family: 'Merriweather'; src: url('${window.location.origin}/lib/Fonts/Merriweather/Merriweather-VariableFont_opsz,wdth,wght.ttf') format('truetype'); }
</style>`;
          if (newHtml.includes('<defs>')) {
            newHtml = newHtml.replace('<defs>', '<defs>' + fontsStyle);
          } else {
            newHtml = newHtml.replace(/<svg[^>]*>/i, '$&<defs>' + fontsStyle + '</defs>');
          }
        }

        return { ...p, html: newHtml };
      }));

      const modifiedPagesIndices = [];
      pagesToSave.forEach((p, index) => {
        const pid = p.v_id || p.id;
        if (!lastSavedHtmlsRef.current[pid] || lastSavedHtmlsRef.current[pid] !== p.html) {
          modifiedPagesIndices.push(index);
        }
      });

      const CHUNK_SIZE = 1;
      let currentVId = v_id;
      let lastRes = null;

      if (modifiedPagesIndices.length === 0) {
        // No content changes, but maybe order/name/deletions changed. Send just the structure!
        const payloadPages = pagesToSave.map((p, index) => ({
          pageName: p.name || `Page ${index + 1}`,
          content: undefined,
          v_id: p.v_id || (typeof p.id === 'string' && p.id.length > 5 ? p.id : null)
        }));

        const payload = {
          emailId: user?.emailId,
          v_id: currentVId,
          flipbookName: currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook',
          folderName: Array.isArray(currentBook?.folderName) ? currentBook.folderName[0] : (currentBook?.folderName || location.state?.folderName || 'Recent Book'),
          overwrite: true,
          pages: payloadPages
        };

        lastRes = await axios.post(`${backendUrl}/api/flipbook/save`, payload);
        if (lastRes.data && lastRes.data.v_id) {
          currentVId = lastRes.data.v_id;
        }
      } else {
        // Chunk the modified indices
        for (let skip = 0; skip < modifiedPagesIndices.length; skip += CHUNK_SIZE) {
          const currentChunkIndices = new Set(modifiedPagesIndices.slice(skip, skip + CHUNK_SIZE));

          const payloadPages = await Promise.all(pagesToSave.map(async (p, index) => {
            const isModified = currentChunkIndices.has(index);
            let content = isModified ? p.html : undefined;
            let contentChunkId = undefined;

            const folderNameArr = Array.isArray(currentBook?.folderName) ? currentBook.folderName : [currentBook?.folderName || location.state?.folderName || 'Recent Book'];
            const fName = folderNameArr.find(f => f !== 'Recent Book' && f !== 'All Books') || folderNameArr[0] || 'Recent Book';
            const bName = currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook';
            const projectBaseUrl = `${backendUrl}/uploads/${sanitizedEmail}/My_Flipbooks/${fName}/${bName}/`;

            // Convert absolute paths back to relative for storage portability
            if (content && content.includes(projectBaseUrl)) {
              content = content.split(projectBaseUrl).join('./');
            }

            // CHUNKED UPLOAD LOGIC: If content is too large (> 2MB), upload in chunks
            const CHUNK_THRESHOLD = 2 * 1024 * 1024; // 2MB
            if (content && content.length > CHUNK_THRESHOLD) {
              const uploadId = `chunked-${Math.random().toString(36).substr(2, 9)}`;
              const CHUNK_DATA_SIZE = 1 * 1024 * 1024; // 1MB chunks
              const totalChunks = Math.ceil(content.length / CHUNK_DATA_SIZE);

              console.log(`[Save] Page ${index + 1} is large (${(content.length / 1024 / 1024).toFixed(2)} MB). Uploading in ${totalChunks} chunks...`);

              for (let i = 0; i < totalChunks; i++) {
                const chunk = content.substr(i * CHUNK_DATA_SIZE, CHUNK_DATA_SIZE);
                await axios.post(`${backendUrl}/api/flipbook/save/chunk`, {
                  uploadId,
                  chunkIndex: i,
                  totalChunks,
                  chunkData: chunk
                });
              }
              content = undefined;
              contentChunkId = uploadId;
            }

            return {
              pageName: p.name || `Page ${index + 1}`,
              content,
              contentChunkId,
              v_id: p.v_id || (typeof p.id === 'string' && p.id.length > 5 ? p.id : null)
            };
          }));

          const payload = {
            emailId: user?.emailId,
            v_id: currentVId,
            flipbookName: currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook',
            folderName: Array.isArray(currentBook?.folderName) ? currentBook.folderName[0] : (currentBook?.folderName || location.state?.folderName || 'Recent Book'),
            overwrite: true,
            pages: payloadPages
          };

          const payloadSize = JSON.stringify(payload).length;
          console.log(`[Save] Chunk diffing: sending modified pages ${Array.from(currentChunkIndices).map(n => n + 1).join(', ')}. Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);

          lastRes = await axios.post(`${backendUrl}/api/flipbook/save`, payload);
          if (lastRes.data && lastRes.data.v_id) {
            currentVId = lastRes.data.v_id;
          }
        }
      }

      if (lastRes && lastRes.data && lastRes.data.v_id) {
        // Track successfully saved HTML to rapidly skip unchanged pages next time
        pagesToSave.forEach(p => {
          const pid = p.v_id || p.id;
          lastSavedHtmlsRef.current[pid] = p.html;
        });

        setHasUnsavedChanges(false);
        justSavedRef.current = true;
        setPages(pagesToSave);
        window.dispatchEvent(new CustomEvent('flipbook-saved'));
        triggerSaveSuccess({
          name: currentBook?.flipbookName || location.state?.flipbookName || 'Untitled Flipbook',
          folder: Array.isArray(currentBook?.folderName) ? currentBook.folderName[0] : (currentBook?.folderName || location.state?.folderName || 'Recent Book'),
          isManual
        });
        console.log("Flipbook saved successfully:", lastRes.data);

        // Transition to project URL if we don't have a v_id yet
        if (!v_id) {
          const folderName = Array.isArray(currentBook?.folderName) ? currentBook.folderName[0] : (currentBook?.folderName || location.state?.folderName || 'Recent Book');
          const newUrl = `/editor/${encodeURIComponent(folderName)}/${lastRes.data.v_id}`;
          navigate(newUrl, { replace: true, state: location.state });
        }
      }
    } catch (err) {
      console.error("Failed to save flipbook:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Internal server error";
      const is413 = err?.response?.status === 413;
      alert(is413 ? "Save failed: The content size is too large for the server." : `Failed to save flipbook: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Allow external components (like InteractionPanel) to trigger a manual save
  useEffect(() => {
    const handleManualSave = () => {
      saveFlipbook(true, popupEditContext ? popupEditContext.backup.pages : pages);
    };
    window.addEventListener('trigger-manual-save', handleManualSave);
    return () => window.removeEventListener('trigger-manual-save', handleManualSave);
  }, [pages, popupEditContext, isSaving]);

  // Listen for the select-layer custom event to select elements by ID
  useEffect(() => {
    const handleSelectLayer = (e) => {
      const targetLayerId = e.detail?.layerId || (e.detail?.ids && e.detail.ids.length > 0 ? e.detail.ids[0] : null);
      if (targetLayerId) {
        // Find which page this layer belongs to
        let foundIdx = -1;
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          if (page && page.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(page.html, 'image/svg+xml');
            if (doc.getElementById(targetLayerId)) {
              foundIdx = i;
              break;
            }
          }
        }

        if (foundIdx !== -1 && foundIdx !== activePageIndex) {
          setActivePageIndex(foundIdx);
        }

        setSelectedLayerId(targetLayerId);
        setMultiSelectedIds(new Set([targetLayerId]));
        setCurrentFrameId(targetLayerId);
      } else {
        setSelectedLayerId(null);
        setMultiSelectedIds(new Set());
        setCurrentFrameId(null);
      }
    };
    window.addEventListener('select-layer', handleSelectLayer);
    return () => window.removeEventListener('select-layer', handleSelectLayer);
  }, [pages, activePageIndex]);

  // Register Save Handler to Navbar (Pass true for manual save)
  useEffect(() => {
    const handleSaveRequest = () => {
      // Force any active inputs to blur so onBlur event can update React state
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      // Wait for React to process the state update from the blur event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-manual-save'));
      }, 100);
    };
    if (setSaveHandler) {
      setSaveHandler(() => handleSaveRequest);
    }
    return () => {
      if (setSaveHandler) setSaveHandler(null);
    };
  }, [setSaveHandler]);

  // Register Preview Handler to Navbar
  const stablePreviewHandler = useCallback(() => {
    // Force save first
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.dispatchEvent(new CustomEvent('trigger-manual-save'));

    setTimeout(() => {
      const shareId = currentBook?.shareId || currentBook?.share?.shareId;
      if (shareId) {
        window.open(`/preview?shareId=${shareId}`, '_blank');
      } else {
        window.open('/preview', '_blank');
      }
    }, 500); // Give save a moment to complete
  }, [currentBook]);

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
  }, [pages, currentBook]);

  // ── Auto-Save Mechanism ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAutoSaveEnabled && pages.length > 0 && !isLoading) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveFlipbook(false, popupEditContext ? popupEditContext.backup.pages : pages); // false = auto save
      }, 1500);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [pages, isAutoSaveEnabled, currentBook, popupEditContext]);

  // Sync state to IndexedDB for Customized Editor
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
  }, [pages, activePageIndex, isLoading, currentBook, location.state, v_id, popupEditContext]);

  useEffect(() => {
    const handleUpdateSrc = (e) => {
      const { oldSrc, newSrc } = e.detail;
      setPages(prevPages => prevPages.map(page => {
        if (page.html && page.html.includes(oldSrc)) {
          return { ...page, html: page.html.split(oldSrc).join(newSrc) };
        }
        return page;
      }));
      // Update live DOM elements with the temporary URL
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

  // Helper to get flipbook dimensions. Prioritizes the first page with a PDF background
  // to ensure the project maintains its primary aspect ratio.
  const getFlipbookDimensions = useCallback(() => {
    // 1. Try to find the first page that has a PDF background
    const pdfPage = pages.find(p => p.html && p.html.includes('data-name="PDF Background"'));
    const sourcePage = pdfPage || pages[0];

    if (sourcePage && sourcePage.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sourcePage.html, 'image/svg+xml');
      const viewBox = doc.documentElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/);
        if (parts.length === 4) {
          return { width: parseFloat(parts[2]), height: parseFloat(parts[3]) };
        }
      }
    }
    return { width: 210, height: 297 }; // Default A4
  }, [pages]);

  const createDefaultPageData = (name) => {
    const { width: baseWidth, height: baseHeight } = getFlipbookDimensions();
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
  };


  // ── Popup Customization Handlers ──────────────────────────────────────────
  const onCustomizePopup = async (templateId, elementId, pageIndex) => {
    const isAlreadyEditing = !!popupEditContext;

    // Try to find existing custom HTML on the element
    let initialSvgText = null;
    let existingTemplateId = null;
    try {
      const originalPage = isAlreadyEditing ? popupEditContext.backup.pages[pageIndex] : pages[pageIndex];
      if (originalPage && originalPage.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalPage.html, 'image/svg+xml');
        const el = doc.getElementById(elementId) || doc.querySelector(`[data-name="${elementId}"]`);
        if (el) {
          existingTemplateId = el.getAttribute('data-interaction-value');
          if (existingTemplateId === templateId) {
            initialSvgText = el.getAttribute('data-interaction-popup-custom-html');
          }
        }
      }
    } catch (e) {
      console.error("Error checking for existing custom HTML:", e);
    }

    // Backup current states
    const backupContext = isAlreadyEditing ? { ...popupEditContext, templateId } : {
      backup: {
        pages: [...pages],
        activePageIndex,
        isDoublePage,
        selectedLayerId,
        multiSelectedIds: new Set(multiSelectedIds),
        currentFrameId,
        history: [...history],
        redoStack: [...redoStack],
        activeTopTool
      },
      elementId,
      pageIndex,
      templateId
    };

    const loadPopupData = (svgText, isNewTemplate = false) => {
      // If it's a new template, patch the backup pages so a 'Cancel' leaves the new template applied
      if (isNewTemplate) {
        const newBackupPages = [...backupContext.backup.pages];
        if (newBackupPages[pageIndex]) {
          const pageParser = new DOMParser();
          const pageDoc = pageParser.parseFromString(newBackupPages[pageIndex].html, 'image/svg+xml');
          const targetEl = pageDoc.getElementById(elementId) || pageDoc.querySelector(`[data-name="${elementId}"]`);
          if (targetEl) {
            targetEl.setAttribute('data-interaction', 'popup');
            targetEl.setAttribute('data-interaction-value', templateId);
            targetEl.setAttribute('data-interaction-popup-custom-html', svgText);
            const serializer = new XMLSerializer();
            newBackupPages[pageIndex] = {
              ...newBackupPages[pageIndex],
              html: serializer.serializeToString(pageDoc.documentElement)
            };
            backupContext.backup.pages = newBackupPages;
          }
        }
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgEl = doc.documentElement;

      let popupWidth = 800;
      let popupHeight = 600;
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/);
        if (parts.length === 4) {
          popupWidth = parseFloat(parts[2]);
          popupHeight = parseFloat(parts[3]);
        }
      } else {
        const w = svgEl.getAttribute('width');
        const h = svgEl.getAttribute('height');
        if (w && h && !w.includes('%') && !h.includes('%')) {
          popupWidth = parseFloat(w);
          popupHeight = parseFloat(h);
        }
      }
      backupContext.dimensions = { width: popupWidth, height: popupHeight };

      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');

      // Wrap popup content in a frame if it doesn't already have one,
      // so it behaves exactly like a page in the normal editor.
      const hasFrame = Array.from(svgEl.children).some(c => c.getAttribute('data-type') === 'frame');
      if (!hasFrame) {
        const frame = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
        frame.setAttribute('data-type', 'frame');
        frame.setAttribute('data-name', 'Popup Template');
        frame.setAttribute('id', `popup-frame-${Math.random().toString(36).substr(2, 9)}`);

        // Move children into the frame (leaving defs/style at the root if possible)
        const childrenToMove = Array.from(svgEl.children).filter(c =>
          c.tagName.toLowerCase() !== 'defs' &&
          c.tagName.toLowerCase() !== 'style'
        );
        childrenToMove.forEach(c => frame.appendChild(c));

        svgEl.appendChild(frame);
      }

      let layers = parseLayersFromSVG(svgEl);
      if (layers.length === 0) {
        layers = [{
          id: 'layer-1',
          name: 'Background',
          type: 'rect',
          visible: true,
          locked: false
        }];
      }

      const serializer = new XMLSerializer();
      const serializedSvg = serializer.serializeToString(svgEl);

      // Perform the swap
      setPopupEditContext(backupContext);
      setPages([{
        id: 'popup-1',
        name: 'Popup Template',
        html: serializedSvg,
        layers: layers
      }]);
      setActivePageIndex(0);
      setIsDoublePage(false);
      setSelectedLayerId(null);
      setMultiSelectedIds(new Set());
      setCurrentFrameId(null);
      setHistory([]);
      setRedoStack([]);
      setActiveTopTool('editor');
    };

    if (initialSvgText && initialSvgText.trim() !== '') {
      loadPopupData(initialSvgText, false);
    } else {
      const template = popupTemplates.find(t => t.id === templateId);
      if (template && template.image) {
        try {
          const res = await fetch(template.image);
          if (!res.ok) throw new Error("Failed to fetch template image");
          const svgText = await res.text();
          loadPopupData(svgText, true);
        } catch (err) {
          console.error("Failed to fetch template SVG, using fallback:", err);
          const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
            <g id="layer-1" data-name="Background">
              <rect width="100%" height="100%" fill="#ffffff" rx="16" />
            </g>
            <g id="layer-2" data-name="Content">
              <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Popup Template</text>
            </g>
          </svg>`;
          loadPopupData(fallbackSvg, true);
        }
      } else {
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
          <g id="layer-1" data-name="Background">
            <rect width="100%" height="100%" fill="#ffffff" rx="16" />
          </g>
          <g id="layer-2" data-name="Content">
            <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Popup Template</text>
          </g>
        </svg>`;
        loadPopupData(fallbackSvg, true);
      }
    }
  };

  const handleApplyPopupChanges = () => {
    if (!popupEditContext) return;
    const { backup, elementId, pageIndex, templateId } = popupEditContext;

    // Save customized HTML
    const customHtml = pages[0]?.html || '';

    // Restore original book states FIRST
    setPages(backup.pages);
    setActivePageIndex(backup.activePageIndex);
    setIsDoublePage(backup.isDoublePage);
    setSelectedLayerId(backup.selectedLayerId);
    setMultiSelectedIds(backup.multiSelectedIds);
    setCurrentFrameId(backup.currentFrameId);
    setHistory(backup.history);
    setRedoStack(backup.redoStack);
    setActiveTopTool(backup.activeTopTool);

    // Reset context
    setPopupEditContext(null);

    // Apply attributes on the interactive element
    setTimeout(() => {
      // Find the element and dispatch update to InteractionPanel
      const updateEl = document.getElementById(elementId) || document.querySelector(`[data-name="${elementId}"]`);
      if (updateEl) {
        updateEl.setAttribute('data-interaction', 'popup');
        updateEl.setAttribute('data-interaction-value', templateId);
        updateEl.setAttribute('data-interaction-popup-custom-html', customHtml);
        // Force state sync
        setPages(prevPages => {
          const newPages = [...prevPages];
          if (newPages[pageIndex]) {
            const serializer = new XMLSerializer();
            // Need to update the page HTML properly
            const parser = new DOMParser();
            const doc = parser.parseFromString(newPages[pageIndex].html, 'image/svg+xml');
            const targetEl = doc.getElementById(elementId) || doc.querySelector(`[data-name="${elementId}"]`);
            if (targetEl) {
              targetEl.setAttribute('data-interaction', 'popup');
              targetEl.setAttribute('data-interaction-value', templateId);
              targetEl.setAttribute('data-interaction-popup-custom-html', customHtml);
              newPages[pageIndex].html = serializer.serializeToString(doc.documentElement);
            }
          }
          return newPages;
        });
      }
    }, 0);
  };

  const handleCancelPopupChanges = () => {
    if (!popupEditContext) return;
    const { backup } = popupEditContext;

    // Restore everything
    setPages(backup.pages);
    setActivePageIndex(backup.activePageIndex);
    setIsDoublePage(backup.isDoublePage);
    setSelectedLayerId(backup.selectedLayerId);
    setMultiSelectedIds(backup.multiSelectedIds);
    setCurrentFrameId(backup.currentFrameId);
    setHistory(backup.history);
    setRedoStack(backup.redoStack);
    setActiveTopTool(backup.activeTopTool);

    setPopupEditContext(null);
  };

  // ── FIGMA-STYLE: Unified Page Selection & Frame Sync ──────────────────────────
  useEffect(() => {
    if (pages.length === 0 || activePageIndex < 0 || activePageIndex >= pages.length) return;

    // Track spread transitions to avoid unnecessary selection resets
    const lastSpreadStart = (lastPageIndexRef.current > 0) ? (lastPageIndexRef.current % 2 === 1 ? lastPageIndexRef.current : lastPageIndexRef.current - 1) : 0;
    const currentSpreadStart = (activePageIndex > 0) ? (activePageIndex % 2 === 1 ? activePageIndex : activePageIndex - 1) : 0;

    const hasSwitchedPage = lastPageIndexRef.current !== activePageIndex;
    const hasSwitchedSpread = lastSpreadStart !== currentSpreadStart;
    lastPageIndexRef.current = activePageIndex;

    // A: Double Page Spread Logic (Can be on odd OR even index if it's a middle spread)
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
        // The active page root — determines which frame context is "entered"
        const activeRoot = activePageIndex === leftIdx ? root1 : root2;

        // On any page switch: always clear old selection and reset to roots.
        // Set currentFrameId to the active page root so the first single click
        // can immediately select child elements without needing to enter the frame first.
        if (hasSwitchedPage || hasSwitchedSpread) {
          setMultiSelectedIds(new Set([root1, root2]));
          setSelectedLayerId(activeRoot);
          setCurrentFrameId(activeRoot);
        } else {
          // Selection became empty — restore roots (Only if not using a tool)
          // Skip reset if a paste operation just happened (skipPasteResetRef guard)
          const currentIds = multiSelectedIds || new Set();
          if (!skipPasteResetRef.current && currentIds.size === 0 && activeMainTool === 'select') {
            setMultiSelectedIds(new Set([root1, root2]));
            setSelectedLayerId(activeRoot);
            setCurrentFrameId(activeRoot);
          }
        }
      }
    } else {
      // B: Single Page Logic (Cover, Last Page, or Standard Single View)
      const page = pages[activePageIndex];
      if (page?.layers?.[0]) {
        const rootId = page.layers[0].id;

        // Auto-select root ONLY if we just landed here OR selection became empty (Only if not using a tool)
        // Skip reset if a paste operation just happened (skipPasteResetRef guard)
        const currentIds = multiSelectedIds || new Set();
        if (!skipPasteResetRef.current && (hasSwitchedPage || (currentIds.size === 0 && activeMainTool === 'select'))) {
          setMultiSelectedIds(new Set([rootId]));
          setSelectedLayerId(rootId);
          setCurrentFrameId(rootId);
        }
      }
    }
  }, [activePageIndex, isDoublePage, pages, multiSelectedIds.size]);

  // ── NEW: Spread Alignment Snapping ───────────────────────────────────────────
  // UPDATED: Only snap if we are in double-page mode AND current logic requires it for initial navigation.
  // We allow clicking the right-side page to set the active index to even (right page).
  useEffect(() => {
    if (!isDoublePage) return;
    // If we were on single page view and switched to double, we might need a jump.
  }, [isDoublePage]);


  const saveToHistory = (currentState = pages) => {
    setHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === currentState) return prev;
      return [...prev.slice(-(MAX_HISTORY - 1)), currentState];
    });
    setRedoStack([]); // Clear redo on new action
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setRedoStack(prev => [pages, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setPages(prevState);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setHistory(prev => [...prev, pages]);
    setRedoStack(prev => prev.slice(1));
    setPages(nextState);
  };

  const updatePageHtml = (pageIndex, html) => {
    setPages(prev => {
      saveToHistory(prev);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      const newLayers = svgEl ? parseLayersFromSVG(svgEl) : [];

      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page) return prev;

      updated[pageIndex] = {
        ...page,
        html,
        layers: newLayers
      };
      return updated;
    });
  };

  const clearPage = (index) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        // Find existing background color to preserve it
        let currentBg = '#ffffff';
        const parser = new DOMParser();
        if (updated[index].html) {
          const oldDoc = parser.parseFromString(updated[index].html, 'image/svg+xml');
          currentBg = oldDoc.querySelector('[data-name="Overlay"]')?.getAttribute('fill') || '#ffffff';
        }

        const { html, layers } = createDefaultPageData(updated[index].name);

        // Apply existing background to new default HTML
        const newDoc = parser.parseFromString(html, 'image/svg+xml');
        const newOverlay = newDoc.querySelector('[data-name="Overlay"]');
        if (newOverlay) {
          newOverlay.setAttribute('fill', currentBg);
        }

        updated[index] = {
          ...updated[index],
          html: new XMLSerializer().serializeToString(newDoc),
          layers
        };
      }
      return updated;
    });
    setHasUnsavedChanges(true);
    setSelectedLayerId(null);
    setMultiSelectedIds(new Set());
  };

  const insertPageAfter = (index) => {
    if (pages.length >= 12) {
      setAlertState({
        isOpen: true,
        title: 'Limit Reached',
        message: 'You can only have up to 12 pages in a flipbook.',
        type: 'warning'
      });
      return;
    }
    saveToHistory();
    setPages(prev => {
      const name = `Page ${prev.length + 1}`;
      const { html, layers } = createDefaultPageData(name);
      const newPage = {
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: name,
        html,
        layers
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const duplicatePage = (index) => {
    if (pages.length >= 12) {
      setAlertState({
        isOpen: true,
        title: 'Limit Reached',
        message: 'You can only have up to 12 pages in a flipbook.',
        type: 'warning'
      });
      return;
    }
    saveToHistory();
    setPages(prev => {
      const pageToDuplicate = prev[index];
      const newPage = {
        ...pageToDuplicate,
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: `${pageToDuplicate.name} (Copy)`
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const renamePage = (id, newName) => {
    setPages(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPage = { ...p, name: newName };

        // Synchronize name with the SVG's root frame data-name
        if (p.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(p.html, 'image/svg+xml');
          const rootGroup = doc.querySelector('g[data-type="frame"]');
          if (rootGroup) {
            rootGroup.setAttribute('data-name', newName);
            updatedPage.html = new XMLSerializer().serializeToString(doc);
            // Re-parse layers to keep the layer panel header in sync
            updatedPage.layers = parseLayersFromSVG(doc.documentElement);
          }
        }
        return updatedPage;
      }
      return p;
    }));
    setHasUnsavedChanges(true);
  };

  const deletePage = (index) => {
    if (pages.length <= 1) {
      setAlertState({
        isOpen: true,
        title: 'Cannot Delete Page',
        message: 'A flipbook must have at least one page. You cannot delete the only remaining page.',
        type: 'warning'
      });
      return;
    }
    saveToHistory();
    setPages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
    if (activePageIndex >= pages.length - 1) {
      setActivePageIndex(Math.max(0, pages.length - 2));
    }
    setHasUnsavedChanges(true);
  };

  const movePageUp = (index) => {
    if (index === 0) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
    setActivePageIndex(index - 1);
  };

  const movePageDown = (index) => {
    if (index === pages.length - 1) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
    setActivePageIndex(index + 1);
  };

  const movePageToFirst = (index) => {
    if (index === 0) return;
    saveToHistory();
    movePage(index, 0, true); // true indicates history is already saved
  };

  const movePageToLast = (index) => {
    if (index === pages.length - 1) return;
    saveToHistory();
    movePage(index, pages.length - 1, true); // true indicates history is already saved
  };


  const movePage = (fromIndex, toIndex, alreadySaved = false) => {
    if (fromIndex === toIndex) return;
    if (!alreadySaved) saveToHistory();

    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, page);
      return updated;
    });
    setActivePageIndex(toIndex);
    setHasUnsavedChanges(true);
  };

  const handleAddFileClick = (index) => {
    pdfInsertIndexRef.current = index;
    if (pdfInputRef.current) pdfInputRef.current.click();
  };

  const handleReplaceFileClick = (index) => {
    replacePageIndexRef.current = index;
    if (replacePdfInputRef.current) replacePdfInputRef.current.click();
  };

  const handleReplaceFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setAlertState({
        isOpen: true,
        title: 'Invalid File',
        message: 'Please select a PDF file.',
        type: 'error'
      });
      return;
    }

    e.target.value = '';

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const emailId = user?.emailId;

    if (!emailId || !v_id) return;

    setPdfProcessing({ current: 0, total: 1, message: 'Processing replacement...', fileName: file.name });

    try {
      const images = await convertPdfToImages(file, 2, 1);
      if (!images || images.length === 0) return;

      const image = images[0];
      const firstW = image.width;
      const firstH = image.height;

      let { width: baseWidth, height: baseHeight } = getFlipbookDimensions();

      const widthMatch = Math.abs(firstW - baseWidth) < 0.5;
      const heightMatch = Math.abs(firstH - baseHeight) < 0.5;

      if (!widthMatch || !heightMatch) {
        setAlertState({
          isOpen: true,
          title: 'Dimension Mismatch',
          message: `This file (${firstW.toFixed(0)}x${firstH.toFixed(0)}mm) does not match the existing flipbook size (${baseWidth.toFixed(0)}x${baseHeight.toFixed(0)}mm). Please upload a file with matching dimensions.`,
          type: 'error'
        });
        return;
      }

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image.blob);
      });

      saveToHistory();
      let newPages = [];

      setPages(prev => {
        const updated = [...prev];
        const pageIndex = replacePageIndexRef.current;
        const page = updated[pageIndex];
        const updatedPage = { ...page };

        if (updatedPage.html.includes('data-name="PDF Background"')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(updatedPage.html, 'image/svg+xml');
          const img = doc.querySelector('image[data-name="PDF Background"]');
          if (img) {
            img.setAttribute('href', base64Data);
            if (img.hasAttribute('xlink:href')) img.setAttribute('xlink:href', base64Data);
          }
          updatedPage.html = new XMLSerializer().serializeToString(doc.documentElement);
          updatedPage.layers = parseLayersFromSVG(doc.documentElement);
        } else {
          const pageName = updatedPage.name || "Replaced Page";
          const absoluteHtml = generatePdfPageSvg(base64Data, pageName, baseWidth, baseHeight);
          const parser = new DOMParser();
          const doc = parser.parseFromString(absoluteHtml, 'image/svg+xml');
          updatedPage.html = absoluteHtml;
          updatedPage.layers = parseLayersFromSVG(doc.documentElement);
        }

        updated[pageIndex] = updatedPage;
        newPages = updated;
        return updated;
      });

      setHasUnsavedChanges(true);

      setTimeout(() => {
        saveFlipbook(false, newPages);
      }, 800);

    } catch (error) {
      console.error("Error replacing file:", error);
      setAlertState({
        isOpen: true,
        title: 'Error',
        message: 'Failed to replace file. Please try again.',
        type: 'error'
      });
    } finally {
      setPdfProcessing(null);
      if (replacePdfInputRef.current) replacePdfInputRef.current.value = '';
    }
  };

  const handlePdfFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert("Please select a PDF file.");
      return;
    }

    // Reset input
    e.target.value = '';

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const emailId = user?.emailId;

    if (!emailId || !v_id) {
      console.error("Missing emailId or v_id for asset upload");
      return;
    }

    const isPdfProject = pages.some(p => p.html && p.html.includes('data-name="PDF Background"'));
    const isDefaultBlank = !isPdfProject && (pages.length === 0 ||
      (pages.length === 1 && (!pages[0].html || pages[0].html.includes('data-name="Page 1"'))));

    const maxAllowed = 12;
    const currentCount = isDefaultBlank ? 0 : pages.length;
    const remainingSlots = maxAllowed - currentCount;

    if (remainingSlots <= 0) {
      setAlertState({
        isOpen: true,
        title: 'Limit Reached',
        message: `The flipbook already has ${pages.length} pages. The maximum allowed is ${maxAllowed}.`,
        type: 'warning'
      });
      setPdfProcessing(null);
      return;
    }

    setPdfProcessing({ current: 0, total: 1, message: 'Processing PDF...', fileName: file.name });

    try {
      const images = await convertPdfToImages(file, 2, remainingSlots);
      if (!images || images.length === 0) return;

      // 1. Check internal uniformity of the incoming PDF
      const firstW = images[0].width;
      const firstH = images[0].height;
      const isInternalUniform = images.every(img =>
        Math.abs(img.width - firstW) < 0.5 &&
        Math.abs(img.height - firstH) < 0.5
      );

      if (!isInternalUniform) {
        setAlertState({
          isOpen: true,
          title: 'Non-Uniform PDF',
          message: 'The selected PDF contains pages with different sizes. For a consistent flipbook, all pages in the PDF must have identical dimensions.',
          type: 'error'
        });
        return;
      }

      // 2. Enforce Project Dimensions
      let { width: baseWidth, height: baseHeight } = getFlipbookDimensions();

      // If the flipbook already has PDF content or multiple pages, we lock the size
      if (!isDefaultBlank) {
        // Check if the new PDF matches the established project size (with 0.5mm tolerance)
        const widthMatch = Math.abs(firstW - baseWidth) < 0.5;
        const heightMatch = Math.abs(firstH - baseHeight) < 0.5;

        if (!widthMatch || !heightMatch) {
          setAlertState({
            isOpen: true,
            title: 'Dimension Mismatch',
            message: `This PDF (${firstW.toFixed(0)}x${firstH.toFixed(0)}mm) does not match the existing flipbook size (${baseWidth.toFixed(0)}x${baseHeight.toFixed(0)}mm). Please upload a PDF with matching dimensions.`,
            type: 'error'
          });
          return;
        }
      } else {
        // Adoption phase: If we're starting from a blank project, adopt the PDF's dimensions
        baseWidth = firstW;
        baseHeight = firstH;
      }

      let completed = 0;
      const uploadPromises = images.map(async (image, i) => {
        const newPageVId = 'page_' + Math.random().toString(36).substr(2, 9);
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image.blob);
        });

        completed++;
        setPdfProcessing({ current: completed, total: images.length, message: `Processing page ${completed} of ${images.length}...` });

        const existingNames = pages.map(p => p.name || "");
        const pdfNums = existingNames
          .filter(n => n.startsWith("PDF Page "))
          .map(n => parseInt(n.replace("PDF Page ", "")))
          .filter(n => !isNaN(n));
        const startNum = pdfNums.length > 0 ? Math.max(...pdfNums) + 1 : 1;

        const pageName = `PDF Page ${startNum + i}`;
        const absoluteHtml = generatePdfPageSvg(base64Data, pageName, baseWidth, baseHeight);

        const parser = new DOMParser();
        const doc = parser.parseFromString(absoluteHtml, 'image/svg+xml');
        const layers = parseLayersFromSVG(doc.documentElement);

        return {
          id: newPageVId,
          v_id: newPageVId,
          name: pageName,
          html: absoluteHtml,
          layers
        };
      });

      const newPages = await Promise.all(uploadPromises);

      saveToHistory();
      let finalPages = [];
      setPages(prev => {
        const updated = [...prev];
        const insertIdx = pdfInsertIndexRef.current !== null ? pdfInsertIndexRef.current + 1 : updated.length;

        // If starting from a blank page, replace it with the PDF content
        if (isDefaultBlank && updated.length === 1) {
          finalPages = newPages;
          return newPages;
        }

        updated.splice(insertIdx, 0, ...newPages);
        finalPages = updated;
        return updated;
      });
      setHasUnsavedChanges(true);

      // Force an auto-save after successful PDF insertion, passing the new pages directly
      setTimeout(() => {
        saveFlipbook(false, finalPages);
      }, 800);

    } catch (error) {
      console.error("PDF upload error:", error);
      alert("Failed to process PDF. Please try again.");
    } finally {
      setPdfProcessing(null);
    }
  };

  const toggleLayerVisibility = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let forceState = null;
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');

      const processLayers = (layersList) => {
        return layersList.map(layer => {
          let newLayer = { ...layer };
          if (idList.includes(layer.id)) {
            if (forceState === null) forceState = !layer.visible;
            newLayer.visible = forceState;
            const element = doc.querySelector(`[id="${layer.id}"]`);
            if (element) {
              if (!newLayer.visible) {
                element.setAttribute('data-hidden', 'true');
                element.style.display = 'none';
              } else {
                element.removeAttribute('data-hidden');
                element.style.display = '';
              }
            }
          }
          if (newLayer.children) newLayer.children = processLayers(newLayer.children);
          return newLayer;
        });
      };

      const newLayers = processLayers(page.layers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const toggleLayerLock = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let forceState = null;
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');

      const processLayers = (layersList) => {
        return layersList.map(layer => {
          let newLayer = { ...layer };
          if (idList.includes(layer.id)) {
            if (forceState === null) forceState = !layer.locked;
            newLayer.locked = forceState;
            const element = doc.querySelector(`[id="${layer.id}"]`);
            if (element) {
              if (newLayer.locked) {
                element.setAttribute('data-locked', 'true');
                element.style.pointerEvents = 'none';
              } else {
                element.removeAttribute('data-locked');
                element.style.pointerEvents = '';
              }
            }
          }
          if (newLayer.children) newLayer.children = processLayers(newLayer.children);
          return newLayer;
        });
      };

      const newLayers = processLayers(page.layers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const renameLayer = (pageIndex, layerId, newName) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const renameInLayers = (layersList) => {
        return layersList.map(layer => {
          if (layer.id === layerId) {
            return { ...layer, name: newName };
          }
          if (layer.children) {
            return { ...layer, children: renameInLayers(layer.children) };
          }
          return layer;
        });
      };

      const newLayers = renameInLayers(page.layers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        element.setAttribute('data-name', newName);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = {
        ...page,
        layers: newLayers,
        html: newHtml
      };
      return updated;
    });
  };

  const bringLayerToFront = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        const toMove = list.filter(l => idList.includes(l.id));
        if (toMove.length > 0) {
          toMove.forEach(item => {
            const idx = list.findIndex(l => l.id === item.id);
            if (idx !== -1) {
              list.splice(idx, 1);
              list.push(item);
              const element = doc.querySelector(`[id="${item.id}"]`);
              if (element && element.parentNode) element.parentNode.appendChild(element);
            }
          });
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const sendLayerToBack = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        const toMove = list.filter(l => idList.includes(l.id)).reverse();
        if (toMove.length > 0) {
          toMove.forEach(item => {
            const idx = list.findIndex(l => l.id === item.id);
            if (idx !== -1) {
              list.splice(idx, 1);
              list.unshift(item);
              const element = doc.querySelector(`[id="${item.id}"]`);
              if (element && element.parentNode) {
                const overlay = element.parentNode.querySelector(':scope > [data-name="Overlay"]');
                if (overlay) {
                  // If there is an overlay, move after it
                  element.parentNode.insertBefore(element, overlay.nextSibling);
                } else {
                  // Standard send to back
                  element.parentNode.insertBefore(element, element.parentNode.firstChild);
                }
              }
            }
          });
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const moveLayerForward = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        // Iterate backwards to not mess up indices as we move things forward
        for (let i = list.length - 1; i >= 0; i--) {
          if (idList.includes(list[i].id) && i < list.length - 1) {
            const item = list.splice(i, 1)[0];
            list.splice(i + 1, 0, item);
            const element = doc.querySelector(`[id="${item.id}"]`);
            if (element && element.parentNode && element.nextElementSibling) {
              element.parentNode.insertBefore(element.nextElementSibling, element);
            }
          }
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const moveLayerBackward = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        for (let i = 0; i < list.length; i++) {
          if (idList.includes(list[i].id) && i > 0) {
            const item = list.splice(i, 1)[0];
            list.splice(i - 1, 0, item);
            const element = doc.querySelector(`[id="${item.id}"]`);
            if (element && element.parentNode && element.previousElementSibling) {
              const prev = element.previousElementSibling;
              // Check if we are trying to move behind the Overlay
              if (prev.getAttribute('data-name') === 'Overlay') {
                // Do nothing, we are already as far back as we can go!
                return;
              }
              element.parentNode.insertBefore(element, prev);
            }
          }
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const reorderLayer = (pageIndex, sourceId, targetId) => {
    if (sourceId === targetId) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const newLayers = JSON.parse(JSON.stringify(page.layers));

      // 1. Find and remove source item
      let sourceItem = null;
      let sourcePath = null;
      const findAndRemove = (list, path = []) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === sourceId) {
            sourceItem = list.splice(i, 1)[0];
            sourcePath = [...path];
            return true;
          }
          if (list[i].children && findAndRemove(list[i].children, [...path, list[i].id])) return true;
        }
        return false;
      };

      findAndRemove(newLayers);
      if (!sourceItem) return updated;

      // 2. Find target and its parent to insert
      let inserted = false;
      const findAndInsert = (list) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === targetId) {
            // To move ABOVE in sidebar (rendered TOP in canvas), we insert AFTER in array
            // since the list is reversed in the UI component
            list.splice(i + 1, 0, sourceItem);
            inserted = true;
            return true;
          }
          if (list[i].children && findAndInsert(list[i].children)) return true;
        }
        return false;
      };

      findAndInsert(newLayers);

      if (!inserted) {
        // Fallback: Return to original spot or just append if target lost
        newLayers.push(sourceItem);
      }

      // 3. Update SVG DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const sourceEl = doc.querySelector(`[id="${sourceId}"]`);
      const targetEl = doc.querySelector(`[id="${targetId}"]`);

      if (sourceEl && targetEl && targetEl.parentNode) {
        // SVG z-index: last child is on top. 
        // To move ABOVE target in sidebar, it must be AFTER target in DOM.
        targetEl.parentNode.insertBefore(sourceEl, targetEl.nextSibling);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });
  };



  const syncFilters = (doc, element) => {
    const svgRoot = doc.querySelector('svg');
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const filterId = `filter-${element.id}`;
    let filterEl = defs.querySelector(`[id="${filterId}"]`);

    const hasDropShadow = element.getAttribute('data-effect-drop-shadow') === 'true';
    const hasInnerShadow = element.getAttribute('data-effect-inner-shadow') === 'true';
    const hasBlur = element.getAttribute('data-effect-blur') === 'true';
    const hasBackgroundBlur = element.getAttribute('data-effect-background-blur') === 'true';
    const hasClipContent = hasBlur && element.getAttribute('data-effect-blur-clip') === 'true';

    if (!hasDropShadow && !hasInnerShadow && !hasBlur && !hasBackgroundBlur) {
      if (filterEl) filterEl.remove();
      element.removeAttribute('filter');
      element.style.backdropFilter = '';
      return;
    }

    if (!filterEl) {
      filterEl = doc.createElementNS("http://www.w3.org/2000/svg", "filter");
      filterEl.id = filterId;
      filterEl.setAttribute('x', '-50%');
      filterEl.setAttribute('y', '-50%');
      filterEl.setAttribute('width', '200%');
      filterEl.setAttribute('height', '200%');
      defs.appendChild(filterEl);
    }

    // Clear existing primitives
    while (filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);

    // Helper to get attribute with default
    const getVal = (attr, def) => element.getAttribute(attr) || def;

    // We chain effects by tracking the current input name
    let currentIn = "SourceGraphic";

    // Wait, Blur is moved to the end!

    // 2. Drop Shadow
    if (hasDropShadow) {
      const color = getVal('data-effect-drop-shadow-color', '#000000');
      const opacity = parseFloat(getVal('data-effect-drop-shadow-opacity', '25')) / 100;
      const dx = getVal('data-effect-drop-shadow-x', '0');
      const dy = getVal('data-effect-drop-shadow-y', '4');
      const blur = parseFloat(getVal('data-effect-drop-shadow-blur', '4'));
      const spread = parseFloat(getVal('data-effect-drop-shadow-spread', '0'));

      // a. Spread (Morphology)
      let dsSource = 'SourceAlpha';
      if (spread !== 0) {
        // a. Spread (Morphology)
        const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
        morph.setAttribute('radius', Math.abs(spread));
        morph.setAttribute('in', 'SourceAlpha');
        morph.setAttribute('result', 'ds_morph');
        filterEl.appendChild(morph);
        dsSource = 'ds_morph';
      }

      // b. Blur
      const gauss = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      gauss.setAttribute('stdDeviation', blur);
      gauss.setAttribute('in', dsSource);
      gauss.setAttribute('result', 'ds_blur');
      filterEl.appendChild(gauss);

      // c. Offset
      const offset = doc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
      offset.setAttribute('dx', dx);
      offset.setAttribute('dy', dy);
      offset.setAttribute('in', 'ds_blur');
      offset.setAttribute('result', 'ds_offset');
      filterEl.appendChild(offset);

      // d. Color
      const flood = doc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
      flood.setAttribute('flood-color', color);
      flood.setAttribute('flood-opacity', opacity);
      flood.setAttribute('result', 'ds_flood');
      filterEl.appendChild(flood);

      // e. Composite (Clip to Alpha)
      const comp = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      comp.setAttribute('in', 'ds_flood');
      comp.setAttribute('in2', 'ds_offset');
      comp.setAttribute('operator', 'in');
      comp.setAttribute('result', 'ds_final');
      filterEl.appendChild(comp);

      // f. Merge with current chain
      const merge = doc.createElementNS("http://www.w3.org/2000/svg", "feMerge");
      const nodeShadow = doc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      nodeShadow.setAttribute('in', 'ds_final');
      const nodeInput = doc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      nodeInput.setAttribute('in', currentIn);
      merge.appendChild(nodeShadow);
      merge.appendChild(nodeInput);
      merge.setAttribute('result', 'drop_shadow_merged');
      filterEl.appendChild(merge);

      currentIn = "drop_shadow_merged";
    }

    // 3. Inner Shadow
    if (hasInnerShadow) {
      const color = getVal('data-effect-inner-shadow-color', '#000000');
      const opacity = parseFloat(getVal('data-effect-inner-shadow-opacity', '25')) / 100;
      const dx = getVal('data-effect-inner-shadow-x', '0');
      const dy = getVal('data-effect-inner-shadow-y', '4');
      const blur = parseFloat(getVal('data-effect-inner-shadow-blur', '4'));
      const spread = parseFloat(getVal('data-effect-inner-shadow-spread', '0'));

      // a. Spread (Morphology)
      const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spread));
      morph.setAttribute('in', 'SourceAlpha');
      morph.setAttribute('result', 'is_morph');
      filterEl.appendChild(morph);

      // b. Blur
      const gauss = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      gauss.setAttribute('stdDeviation', blur);
      gauss.setAttribute('in', 'is_morph');
      gauss.setAttribute('result', 'is_blur');
      filterEl.appendChild(gauss);

      // c. Offset
      const offset = doc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
      offset.setAttribute('dx', dx);
      offset.setAttribute('dy', dy);
      offset.setAttribute('in', 'is_blur');
      offset.setAttribute('result', 'is_offset');
      filterEl.appendChild(offset);

      // d. Invert to get inner part
      const compOut = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compOut.setAttribute('operator', 'out');
      compOut.setAttribute('in', 'SourceAlpha');
      compOut.setAttribute('in2', 'is_offset');
      compOut.setAttribute('result', 'is_inverse');
      filterEl.appendChild(compOut);

      // e. Color
      const flood = doc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
      flood.setAttribute('flood-color', color);
      flood.setAttribute('flood-opacity', opacity);
      flood.setAttribute('result', 'is_flood');
      filterEl.appendChild(flood);

      // f. Clip color to inner shape
      const compIn = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compIn.setAttribute('operator', 'in');
      compIn.setAttribute('in', 'is_flood');
      compIn.setAttribute('in2', 'is_inverse');
      compIn.setAttribute('result', 'is_final');
      filterEl.appendChild(compIn);

      // g. Composite over current chain
      const compOver = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compOver.setAttribute('operator', 'over');
      compOver.setAttribute('in', 'is_final');
      compOver.setAttribute('in2', currentIn);
      compOver.setAttribute('result', 'inner_shadow_merged');
      filterEl.appendChild(compOver);

      currentIn = "inner_shadow_merged";
    }

    // 4. Layer Blur (Applied LAST so it blurs shadows and strokes too)
    if (hasBlur) {
      const blurVal = parseFloat(getVal('data-effect-blur-value', '0.3'));
      const spreadVal = parseFloat(getVal('data-effect-blur-spread', '0'));

      let blurSource = currentIn;

      // a. Spread (Morphology)
      if (spreadVal !== 0) {
        const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        morph.setAttribute('operator', spreadVal >= 0 ? 'dilate' : 'erode');
        morph.setAttribute('radius', Math.abs(spreadVal));
        morph.setAttribute('in', currentIn);
        morph.setAttribute('result', 'blur_morph');
        filterEl.appendChild(morph);
        blurSource = "blur_morph";
      }

      // b. Blur
      const blurNode = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      blurNode.setAttribute('stdDeviation', blurVal);
      blurNode.setAttribute('in', blurSource);
      blurNode.setAttribute('result', 'blur_out');
      filterEl.appendChild(blurNode);
      currentIn = "blur_out";
    }

    if (hasClipContent) {
      const compClip = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compClip.setAttribute('operator', 'in');
      compClip.setAttribute('in', currentIn);
      compClip.setAttribute('in2', 'SourceAlpha');
      compClip.setAttribute('result', 'clipped_final');
      filterEl.appendChild(compClip);
      currentIn = 'clipped_final';
    }

    element.setAttribute('filter', `url(#${filterId})`);

    // Background Blur via Backdrop Filter (CSS style)
    if (hasBackgroundBlur) {
      const bBlur = getVal('data-effect-background-blur-value', '10');
      element.style.backdropFilter = `blur(${bBlur}px)`;
      element.style.webkitBackdropFilter = `blur(${bBlur}px)`;
    } else {
      element.style.backdropFilter = '';
      element.style.webkitBackdropFilter = '';
    }
  };

  const updateElementAttribute = (pageIndex, elementId, attribute, value) => {
    saveToHistory();
    // Special case: ImageEditor serializes the whole SVG and passes it directly
    if (attribute === '__dom_sync__') {
      const safeParseSVG = (htmlStr) => {
        let safeStr = htmlStr;
        if (!safeStr.includes('xmlns:xlink=')) {
          safeStr = safeStr.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
        }
        const parser = new DOMParser();
        let doc = parser.parseFromString(safeStr, 'image/svg+xml');
        if (doc.querySelector('parsererror')) {
          console.warn("Strict XML parsing failed, falling back to HTML parsing for layers");
          doc = parser.parseFromString(safeStr, 'text/html');
        }
        return doc;
      };
      setPages(prev => {
        const updated = [...prev];
        const page = updated[pageIndex];
        if (!page) return updated;

        let newLayers = page.layers;
        if (value) {
          const doc = safeParseSVG(value);
          const svgEl = doc.querySelector('svg');
          if (svgEl) {
            newLayers = parseLayersFromSVG(svgEl);
          }
        }

        updated[pageIndex] = { ...page, html: value, layers: newLayers };
        return updated;
      });
      return;
    }
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html) return prev;

      const parser = new DOMParser();
      let safeStr = page.html;
      if (!safeStr.includes('xmlns:xlink=')) safeStr = safeStr.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
      let doc = parser.parseFromString(safeStr, 'image/svg+xml');
      if (doc.querySelector('parsererror')) doc = parser.parseFromString(safeStr, 'text/html');
      let element = doc.getElementById(elementId);
      if (!element) {
        element = doc.querySelector(`[data-name="${elementId}"]`);
      }
      if (element) {
        const updates = (typeof attribute === 'object' && attribute !== null)
          ? Object.entries(attribute)
          : [[attribute, value]];

        // ── Pass 1: Write all attribute values onto the element first ──────────
        // This is critical for batch corner-radius updates: we must ensure every
        // data-tl/tr/bl/br and rx value is committed before any shape redraw
        // reads them, otherwise redraws triggered mid-loop see stale values.
        updates.forEach(([attr, val]) => {
          if (val === null || val === 'none' || val === '#') {
            if (attr === 'fill' || attr === 'stroke') {
              element.setAttribute(attr, 'none');
            } else {
              element.removeAttribute(attr);
            }
            if (attr === 'stroke-width') element.setAttribute('stroke', 'none');
          } else {
            element.setAttribute(attr, val);
            if (attr === 'stroke-width' && val !== '0' && (element.getAttribute('stroke') === 'none' || !element.getAttribute('stroke'))) {
              element.setAttribute('stroke', '#000000');
            }
          }
        });

        // ── Pass 2: Shape redraws — all attrs are now committed ───────────────
        // Track whether a rect has already been redrawn in this batch so we
        // don't emit multiple redundant path rewrites for the same element.
        let rectRedrawnThisBatch = false;

        updates.forEach(([attr, val]) => {
          if (val === null || val === 'none' || val === '#') return; // no redraw needed

          // --- DYNAMIC SHAPE REDRAW (FOR POLYGON/STAR/ROUNDED RECT) ---
          const isRectCorner = ['data-tl', 'data-tr', 'data-bl', 'data-br'].includes(attr);
          if (attr === 'data-count' || attr === 'data-rx' || attr === 'data-ry' || attr === 'data-ratio' || attr === 'data-radius' || isRectCorner || attr === 'rx') {
            const shapeType = element.getAttribute('data-shape-type') || (element.tagName === 'rect' ? 'rectangle' : null);

            if (shapeType === 'polygon' || shapeType === 'star') {
              const cx = parseFloat(element.getAttribute('data-cx') || 0);
              const cy = parseFloat(element.getAttribute('data-cy') || 0);
              const rx = parseFloat(element.getAttribute('data-rx') || 0);
              const count = parseInt(element.getAttribute('data-count') || 3);
              const cr = parseFloat(element.getAttribute('data-radius') || 0);

              const pts = [];
              if (shapeType === 'polygon') {
                for (let i = 0; i < count; i++) {
                  const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
                  pts.push({ x: cx + rx * Math.cos(angle), y: cy + rx * Math.sin(angle) });
                }
              } else if (shapeType === 'star') {
                const ratio = parseFloat(element.getAttribute('data-ratio') || 40) / 100;
                const ri = rx * ratio;
                const sides = count * 2;
                for (let i = 0; i < sides; i++) {
                  const r = (i % 2 === 0) ? rx : ri;
                  const angle = (Math.PI / count) * i - Math.PI / 2;
                  pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
                }
              }

              if (cr > 0 && pts.length > 2) {
                let pathData = "";
                const cornerPoints = pts.map((curr, i) => {
                  const prev = pts[(i + pts.length - 1) % pts.length];
                  const next = pts[(i + 1) % pts.length];
                  const d1 = { x: curr.x - prev.x, y: curr.y - prev.y };
                  const d2 = { x: next.x - curr.x, y: next.y - curr.y };
                  const l1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
                  const l2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
                  const limit = Math.min(cr, l1 / 2, l2 / 2);
                  return {
                    q: { x: curr.x, y: curr.y },
                    p1: { x: curr.x - (d1.x / l1) * limit, y: curr.y - (d1.y / l1) * limit },
                    p2: { x: curr.x + (d2.x / l2) * limit, y: curr.y + (d2.y / l2) * limit }
                  };
                });
                cornerPoints.forEach((cp, i) => {
                  if (i === 0) pathData += `M ${cp.p1.x} ${cp.p1.y}`;
                  else pathData += ` L ${cp.p1.x} ${cp.p1.y}`;
                  pathData += ` Q ${cp.q.x} ${cp.q.y}, ${cp.p2.x} ${cp.p2.y}`;
                });
                pathData += " Z";
                element.setAttribute('d', pathData);
              } else {
                element.setAttribute('d', `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')} Z`);
              }
            }
            else if (shapeType === 'rectangle' && (isRectCorner || attr === 'rx') && !rectRedrawnThisBatch) {
              // All corner attrs are already written in Pass 1 — read them fresh.
              rectRedrawnThisBatch = true;
              const x = parseFloat(element.getAttribute('x') || 0);
              const y = parseFloat(element.getAttribute('y') || 0);
              const w = parseFloat(element.getAttribute('width') || 0);
              const h = parseFloat(element.getAttribute('height') || 0);
              const defR = parseFloat(element.getAttribute('rx') || 0);

              // Clamp each corner radius to at most half the rect's shorter dimension.
              // Without clamping, radii > w/2 or h/2 cause bezier arcs to cross,
              // producing the unwanted eye/lens shape (matching CSS border-radius behaviour).
              const maxR = Math.min(w / 2, h / 2);
              const tl = Math.min(parseFloat(element.getAttribute('data-tl') || defR), maxR);
              const tr = Math.min(parseFloat(element.getAttribute('data-tr') || defR), maxR);
              const bl = Math.min(parseFloat(element.getAttribute('data-bl') || defR), maxR);
              const br = Math.min(parseFloat(element.getAttribute('data-br') || defR), maxR);

              const d = `
                    M ${x + tl},${y}
                    L ${x + w - tr},${y}
                    A ${tr},${tr} 0 0 1 ${x + w},${y + tr}
                    L ${x + w},${y + h - br}
                    A ${br},${br} 0 0 1 ${x + w - br},${y + h}
                    L ${x + bl},${y + h}
                    A ${bl},${bl} 0 0 1 ${x},${y + h - bl}
                    L ${x},${y + tl}
                    A ${tl},${tl} 0 0 1 ${x + tl},${y}
                    Z
                 `.replace(/\s+/g, ' ').trim();

              if (element.tagName === 'rect') {
                const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                Array.from(element.attributes).forEach(a => path.setAttribute(a.name, a.value));
                path.setAttribute('d', d);
                path.setAttribute('data-shape-type', 'rectangle');
                element.parentNode.replaceChild(path, element);
              } else {
                element.setAttribute('d', d);
              }
            }
          }
        });

        // --- GRADIENT SYNC ---
        const checkGrad = (attr) => attr.startsWith('fill') || attr.startsWith('stroke') || attr.includes('-stops') || attr.includes('-gradient-type') || attr.includes('-type') || attr.includes('stroke-');
        const hasGradRelated = typeof attribute === 'object' && attribute !== null
          ? Object.keys(attribute).some(checkGrad)
          : checkGrad(attribute);

        if (hasGradRelated) {
          const primaryAttr = typeof attribute === 'object' && attribute !== null ? Object.keys(attribute)[0] : attribute;
          const base = (primaryAttr.startsWith('fill') || primaryAttr.includes('fill-')) ? 'fill' : 'stroke';
          syncGradient(doc, element, base);

          if (element.tagName.toLowerCase() === 'g') {
            const children = element.querySelectorAll('path, rect, circle, ellipse, polyline, polygon');
            children.forEach(child => {
              updates.forEach(([attr]) => {
                if (attr === 'fill' || attr === 'stroke' || attr === 'stroke-width' || attr === 'stroke-dasharray' || attr === 'opacity') {
                  child.removeAttribute(attr);
                  if (child.style) child.style.removeProperty(attr);
                }
              });
              if (typeof attribute === 'object' && attribute !== null ? Object.keys(attribute).some(a => a.includes('-stops') || a.includes('-gradient-type') || a.includes('-type')) : (attribute.includes('-stops') || attribute.includes('-gradient-type') || attribute.includes('-type'))) {
                child.removeAttribute(base);
                if (child.style) child.style.removeProperty(base);
              }
            });
          }

          updates.forEach(([attr, val]) => {
            if (attr === 'stroke' && val !== 'none' && val !== '#') {
              const currentWidth = element.getAttribute('stroke-width');
              if (!currentWidth || currentWidth === '0') {
                element.setAttribute('stroke-width', '1');
              }
            }
          });
        }

        const hasEffectRelated = typeof attribute === 'object' && attribute !== null
          ? Object.keys(attribute).some(a => a.startsWith('data-effect-'))
          : attribute.startsWith('data-effect-');
        if (hasEffectRelated) {
          syncFilters(doc, element);
        }

        const serializer = new XMLSerializer();
        updated[pageIndex] = { ...page, html: serializer.serializeToString(doc.documentElement) };
      }
      return updated;
    });
  };

  const updatePageBackground = (pageIndex, color) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (page && page.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(page.html, 'image/svg+xml');
        const overlay = doc.querySelector('[data-name="Overlay"]');
        if (overlay) {
          overlay.setAttribute('fill', color);
          page.html = new XMLSerializer().serializeToString(doc);
        }
        updated[pageIndex] = { ...page };
      }
      return updated;
    });
  };

  const deleteLayer = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');

      const deleteFromLayers = (layersList) => {
        for (let i = layersList.length - 1; i >= 0; i--) {
          const layerId = layersList[i].id;
          if (idList.includes(layerId)) {
            const element = doc.querySelector(`[id="${layerId}"]`);
            // PROTECT THE BASE OVERLAY & ROOT FOLDER
            if (element && (element.getAttribute('data-name') === 'Overlay' || element.getAttribute('data-type') === 'frame')) {
              continue;
            }
            layersList.splice(i, 1);
            if (element) element.remove();
          } else if (layersList[i].children) {
            deleteFromLayers(layersList[i].children);
          }
        }
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      deleteFromLayers(newLayers);

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });

    if (idList.includes(selectedLayerId)) setSelectedLayerId(null);
    setMultiSelectedIds(prev => {
      const next = new Set(prev);
      idList.forEach(id => next.delete(id));
      return next;
    });
  };

  const copyLayer = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    const page = pages[pageIndex];
    if (!page) return;

    const parser = new DOMParser();
    if (!page.html) return;
    const doc = parser.parseFromString(page.html, 'image/svg+xml');

    const clipboardItems = [];
    const findLayers = (layersList, parentId = null, alreadyCopyingAncestor = false) => {
      for (let layer of layersList) {
        const isSelected = idList.includes(layer.id);

        if (isSelected && !alreadyCopyingAncestor) {
          const element = doc.querySelector(`[id="${layer.id}"]`);
          if (element) {
            let svgSnippet = new XMLSerializer().serializeToString(element);

            // Extract external definitions (clipPath, grads) used by this snippet
            const defSnippets = [];
            const collectedIds = new Set();
            const extractDefs = (snippet) => {
              const urlRegex = /url\(['"]?#([^)'"]+)['"]?\)/g;
              let match;
              while ((match = urlRegex.exec(snippet)) !== null) {
                const defId = match[1];
                if (!collectedIds.has(defId)) {
                  collectedIds.add(defId);
                  const safeId = defId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                  const defEl = doc.querySelector(`[id="${safeId}"]`);
                  if (defEl) {
                    const defHtml = new XMLSerializer().serializeToString(defEl);
                    defSnippets.push(defHtml);
                    extractDefs(defHtml);
                  }
                }
              }

              const hrefRegex = /href=['"]#([^'"]+)['"]/g;
              while ((match = hrefRegex.exec(snippet)) !== null) {
                const defId = match[1];
                if (!collectedIds.has(defId)) {
                  collectedIds.add(defId);
                  const safeId = defId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                  const defEl = doc.querySelector(`[id="${safeId}"]`);
                  if (defEl) {
                    const defHtml = new XMLSerializer().serializeToString(defEl);
                    defSnippets.push(defHtml);
                    extractDefs(defHtml);
                  }
                }
              }
            };
            extractDefs(svgSnippet);

            clipboardItems.push({
              layer: JSON.parse(JSON.stringify(layer)),
              svgSnippet: svgSnippet,
              defSnippets: defSnippets,
              originalParentId: parentId
            });
          }
        }

        if (layer.children) {
          findLayers(layer.children, layer.id, alreadyCopyingAncestor || isSelected);
        }
      }
    };

    findLayers(page.layers);
    if (clipboardItems.length > 0) {
      setClipboard(clipboardItems);
    }
  };

  const cutLayer = (pageIndex, ids) => {
    copyLayer(pageIndex, ids);
    deleteLayer(pageIndex, ids);
  };

  const pasteLayer = (pageIndex) => {
    if (!clipboard || !Array.isArray(clipboard)) return;
    saveToHistory();

    const prepareLayer = (l) => {
      const id = `${l.type}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        ...l,
        id: id,
        children: l.children ? l.children.map(prepareLayer) : undefined
      };
    };

    const newItems = clipboard.map(item => ({
      ...item,
      newLayer: prepareLayer(item.layer)
    }));

    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page) return updated;

      let newLayers = JSON.parse(JSON.stringify(page.layers || []));
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'image/svg+xml');
      const svgRoot = doc.querySelector('svg');

      // Ensure <defs> exists on the target page
      let defs = doc.querySelector('defs');
      if (!defs && svgRoot) {
        defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgRoot.insertBefore(defs, svgRoot.firstChild);
      }

      newItems.forEach(({ svgSnippet, defSnippets, newLayer, originalParentId }) => {
        // Add missing defs to the current page's <defs>
        if (defSnippets && defs) {
          defSnippets.forEach(defHtml => {
            const defDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${defHtml}</svg>`, 'image/svg+xml');
            const defEl = defDoc.querySelector('svg').firstElementChild;
            if (defEl && defEl.id) {
              // Check if it already exists, if not, append to defs
              const safeId = defEl.id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
              if (!doc.querySelector(`[id="${safeId}"]`)) {
                defs.appendChild(doc.importNode(defEl, true));
              }
            }
          });
        }

        const snippetDoc = parser.parseFromString(svgSnippet, 'image/svg+xml');
        const newElement = doc.importNode(snippetDoc.documentElement, true);
        newElement.setAttribute('id', newLayer.id);

        if (newLayer.type === 'g') {
          const updateRecursiveIds = (el, meta) => {
            if (meta.children) {
              Array.from(el.children).forEach((childEl, i) => {
                if (meta.children[i]) {
                  childEl.setAttribute('id', meta.children[i].id);
                  updateRecursiveIds(childEl, meta.children[i]);
                }
              });
            }
          };
          updateRecursiveIds(newElement, newLayer);
        }

        let pasted = false;
        if (selectedLayerId) {
          const insertNextTo = (list, isTopLevel = true) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === selectedLayerId) {
                if (isTopLevel) {
                  // Never paste alongside a top-level root folder, paste inside it
                  list[i].children = [...(list[i].children || []), newLayer];
                  return { method: 'inside', parentId: list[i].id };
                } else {
                  list.splice(i + 1, 0, newLayer);
                  return { method: 'alongside' };
                }
              }
              if (list[i].children) {
                const res = insertNextTo(list[i].children, false);
                if (res) return res;
              }
            }
            return false;
          };

          const result = insertNextTo(newLayers, true);
          if (result) {
            if (result.method === 'inside') {
              const parentEl = doc.querySelector(`[id="${result.parentId}"]`);
              if (parentEl) {
                parentEl.appendChild(newElement);
                pasted = true;
              }
            } else {
              const selectedEl = doc.querySelector(`[id="${selectedLayerId}"]`);
              if (selectedEl && selectedEl.parentNode) {
                selectedEl.parentNode.insertBefore(newElement, selectedEl.nextSibling);
                pasted = true;
              }
            }
          }
        }

        if (!pasted && currentFrameId) {
          const insertInside = (list) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === currentFrameId) {
                list[i].children = [...(list[i].children || []), newLayer];
                return true;
              }
              if (list[i].children && insertInside(list[i].children)) return true;
            }
            return false;
          };
          if (insertInside(newLayers)) {
            const parentEl = doc.querySelector(`[id="${currentFrameId}"]`);
            if (parentEl) {
              parentEl.appendChild(newElement);
              pasted = true;
            }
          }
        }

        if (!pasted && originalParentId) {
          const insertAtEnd = (list) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === originalParentId) {
                list[i].children = [...(list[i].children || []), newLayer];
                return true;
              }
              if (list[i].children && insertAtEnd(list[i].children)) return true;
            }
            return false;
          };
          if (insertAtEnd(newLayers)) {
            const parentEl = doc.querySelector(`[id="${originalParentId}"]`);
            if (parentEl) {
              parentEl.appendChild(newElement);
              pasted = true;
            }
          }
        }

        // 4. Fallback: Always insert into the page's root frame to keep it inside the page layer
        if (!pasted) {
          const topFrame = newLayers.find(l => l.type === 'g');
          if (topFrame) {
            topFrame.children = [...(topFrame.children || []), newLayer];
            const rootEl = doc.querySelector(`[id="${topFrame.id}"]`);
            if (rootEl) rootEl.appendChild(newElement);
            else if (svgRoot) svgRoot.appendChild(newElement);
          } else {
            newLayers.push(newLayer);
            if (svgRoot) svgRoot.appendChild(newElement);
          }
        }
      });

      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });

    // Select all newly pasted elements.
    // Set guard first so the page-selection useEffect (which reacts to pages changing)
    // doesn't reset selection back to the root frame during this paste operation.
    const newIds = new Set(newItems.map(item => item.newLayer.id));
    const lastNewId = newItems.length > 0 ? newItems[newItems.length - 1].newLayer.id : null;

    skipPasteResetRef.current = true;

    // We can set multiSelectedIds immediately for visual handles
    setMultiSelectedIds(newIds);

    // Defer setSelectedLayerId so that when RightSidebar renders the properties panel (e.g. TextEditor),
    // the LIVE DOM has already been updated with the new HTML. Otherwise, document.getElementById
    // during render will return null and the property editors will crash/return null.
    setTimeout(() => {
      if (lastNewId) setSelectedLayerId(lastNewId);

      // Clear the guard after the selection has been safely applied
      setTimeout(() => { skipPasteResetRef.current = false; }, 50);
    }, 50);
  };

  // ── KEYBOARD SHORTCUTS (Cut, Copy, Paste) ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input, textarea or contenteditable element
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) ||
        document.activeElement.contentEditable === 'true') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            redo(); // Ctrl+Shift+Z
          } else {
            undo(); // Ctrl+Z
          }
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'y') {
          redo(); // Ctrl+Y
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'c') {
          const idsToCopy = multiSelectedIds.size > 0 ? multiSelectedIds : (selectedLayerId ? [selectedLayerId] : []);
          if (idsToCopy && (Array.isArray(idsToCopy) ? idsToCopy.length > 0 : idsToCopy.size > 0)) {
            copyLayer(activePageIndex, idsToCopy);
          }
        } else if (e.key.toLowerCase() === 'x') {
          const idsToCut = multiSelectedIds.size > 0 ? multiSelectedIds : (selectedLayerId ? [selectedLayerId] : []);
          if (idsToCut && (Array.isArray(idsToCut) ? idsToCut.length > 0 : idsToCut.size > 0)) {
            cutLayer(activePageIndex, idsToCut);
          }
        } else if (e.key.toLowerCase() === 'v') {
          if (clipboard) {
            pasteLayer(activePageIndex);
          }
        }
      } else {
        // Handle physical Delete and Backspace keys (no modifiers)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          // Only allow deletion in the main editor mode. 
          // Prevent accidental deletion while interacting with Interaction/Animation panels.
          if (activeTopTool === 'editor') {
            if (multiSelectedIds.size > 0) {
              deleteLayer(activePageIndex, multiSelectedIds);
              setMultiSelectedIds(new Set());
              setSelectedLayerId(null);
            } else if (selectedLayerId) {
              deleteLayer(activePageIndex, selectedLayerId);
              setSelectedLayerId(null);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, multiSelectedIds, activePageIndex, clipboard, copyLayer, cutLayer, pasteLayer, deleteLayer, undo, redo, pages, activeTopTool]);

  const loadTemplate = async (templateUrl, prefetchedContent = null) => {
    try {
      let content = prefetchedContent;
      if (!content) {
        const response = await fetch(templateUrl);
        content = await response.text();
      }

      const parser = new DOMParser();
      const targetIndex = templateTargetIndex !== null ? templateTargetIndex : activePageIndex;
      const currentPage = pages[targetIndex];

      if (!currentPage) return;

      // 0. Detect and dynamically load any new fonts used in the template
      const fontsToLoad = new Set();
      const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
      let match;
      while ((match = cssRegex.exec(content)) !== null) {
        let f = match[1] || match[2];
        f = f.split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }
      const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
      while ((match = attrRegex.exec(content)) !== null) {
        let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }

      fontsToLoad.forEach(font => {
        const fontId = `dynamic-font-${font.replace(/\s+/g, '-')}`;
        if (!document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.href = `https://fonts.googleapis.com/css?family=${font.replace(/\s+/g, '+')}:300,400,500,600,700,800,900&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });

      // 1. Parse template content
      const templateDoc = parser.parseFromString(content, 'image/svg+xml');
      const templateSvg = templateDoc.querySelector('svg');
      if (!templateSvg) return;

      // --- CRITICAL: Scope all IDs and Classes in the template to avoid collisions ---
      const tplPrefix = `tpl-${Math.random().toString(36).substr(2, 4)}`;
      const allTplElements = templateSvg.querySelectorAll('*');
      const idRefRegex = /url\(['"]?#([^)'"]+)['"]?\)/g;

      // Step A: Prefix every ID and update references in attributes
      allTplElements.forEach(el => {
        // IDs
        if (el.id) el.id = `${tplPrefix}-${el.id}`;

        // Classes
        const classVal = el.getAttribute('class');
        if (classVal) {
          const prefixedClasses = classVal.split(/\s+/).map(c => c ? `${tplPrefix}-${c}` : c).join(' ');
          el.setAttribute('class', prefixedClasses);
        }

        // Direct Attributes that refer to IDs (fill, stroke, etc.)
        const refAttrs = ['fill', 'stroke', 'filter', 'mask', 'clip-path'];
        refAttrs.forEach(attr => {
          const val = el.getAttribute(attr);
          if (val) {
            const newVal = val.replace(idRefRegex, `url(#${tplPrefix}-$1)`);
            if (newVal !== val) el.setAttribute(attr, newVal);
          }
        });

        // Inline Styles (e.g. style="fill:url(#id)")
        const styleText = el.getAttribute('style');
        if (styleText && styleText.includes('url(#')) {
          el.setAttribute('style', styleText.replace(idRefRegex, `url(#${tplPrefix}-$1)`));
        }

        // Links
        ['xlink:href', 'href'].forEach(attr => {
          const val = el.getAttribute(attr);
          if (val && val.startsWith('#')) {
            el.setAttribute(attr, `#${tplPrefix}-${val.substring(1)}`);
          }
        });
      });

      // Step B: Update references and CLASS selectors INSIDE <style> blocks
      const tplStyles_scoping = templateSvg.querySelectorAll('style');
      tplStyles_scoping.forEach(style => {
        if (style.textContent) {
          // 1. Update ID references: url(#id) -> url(#prefix-id)
          let css = style.textContent.replace(idRefRegex, `url(#${tplPrefix}-$1)`);
          // 2. Update Class selectors: .st0 { -> .prefix-st0 {
          // This matches a dot followed by alphanumeric/dashes, ensuring it's a class selector
          css = css.replace(/\.([a-zA-Z0-9_-]+)(?=[^{}]*\{)/g, `.${tplPrefix}-$1`);
          style.textContent = css;
        }
      });
      // -------------------------------------------------------------------

      // 2. Always start with a fresh canvas when applying a template, preserving the background color
      const oldDoc = parser.parseFromString(currentPage.html || '', 'image/svg+xml');
      const currentBg = oldDoc.querySelector('[data-name="Overlay"]')?.getAttribute('fill') || '#ffffff';

      const { html: defaultHtml } = createDefaultPageData(currentPage.name);
      const pageDoc = parser.parseFromString(defaultHtml, 'image/svg+xml');
      let pageSvg = pageDoc.querySelector('svg');

      const newOverlay = pageSvg.querySelector('[data-name="Overlay"]');
      if (newOverlay) {
        newOverlay.setAttribute('fill', currentBg);
      }

      // 3. Find the Root Folder (<g>) - prioritized by data-type="frame"
      const rootFolder = pageSvg.querySelector('g[data-type="frame"]') || pageSvg.querySelector('g');

      // 4. Calculate Scale to Fit (Target: Actual Flipbook Dimensions)
      const { width: targetW, height: targetH } = getFlipbookDimensions();
      let templateWidth = parseFloat(templateSvg.getAttribute('width'));
      let templateHeight = parseFloat(templateSvg.getAttribute('height'));
      const viewBoxStr = templateSvg.getAttribute('viewBox');
      let viewBoxX = 0;
      let viewBoxY = 0;

      if (viewBoxStr) {
        const parts = viewBoxStr.trim().split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
          viewBoxX = parts[0];
          viewBoxY = parts[1];
          templateWidth = parts[2];
          templateHeight = parts[3];
        }
      }

      // Default to target dimensions if unknown to avoid division by zero
      if (!templateWidth) templateWidth = targetW;
      if (!templateHeight) templateHeight = targetH;

      const scale = Math.min(targetW / templateWidth, targetH / templateHeight);
      const offsetX = (targetW - templateWidth * scale) / 2;
      const offsetY = (targetH - templateHeight * scale) / 2;

      // 5. Handle Defs, Style and Resource merging
      const RESOURCE_TAGS = ['mask', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'symbol', 'marker'];

      // Automatically move ALL resource tags found ANYWHERE in the template into our target defs
      const allResources = templateSvg.querySelectorAll(RESOURCE_TAGS.join(','));
      let targetDefs = pageSvg.querySelector('defs');

      if (allResources.length > 0) {
        if (!targetDefs) {
          targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
        }
        allResources.forEach(res => {
          const imported = pageDoc.importNode(res, true);
          targetDefs.appendChild(imported);
        });
      }

      const templateDefs = templateSvg.querySelector('defs');
      if (templateDefs) {
        if (!targetDefs) {
          targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
        }
        Array.from(templateDefs.children).forEach(child => {
          targetDefs.appendChild(pageDoc.importNode(child, true));
        });
      }

      const templateStyles = templateSvg.querySelectorAll('style');
      if (templateStyles.length > 0) {
        let targetStyle = pageSvg.querySelector('style');
        if (!targetStyle) {
          targetStyle = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
          const firstEl = pageSvg.firstChild;
          pageSvg.insertBefore(targetStyle, firstEl);
        }
        templateStyles.forEach(s => {
          targetStyle.textContent += s.textContent + '\n';
        });
      }

      // 6. Inject template content into root folder (Ungrouped)
      // Extract children from the template - if it has a single main container <g>, we enter it
      const getExplodedTemplateChildren = (svg) => {
        // Now identify renderable content (filtering out metadata/defs/style)
        let infants = Array.from(svg.children).filter(child =>
          !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
          !RESOURCE_TAGS.includes(child.tagName.toLowerCase())
        );

        // If there's exactly one main group, we "explode" it to take its contents directly
        if (infants.length === 1 && infants[0].tagName.toLowerCase() === 'g') {
          const mainGroup = infants[0];
          const children = Array.from(mainGroup.children);

          // IMPORTANT: Transfer visual inheritance (fill, stroke, masks, etc.)
          // This prevents elements from losing their masks or colors when the container is exploded.
          const attrsToInherit = [
            'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
            'opacity', 'visibility', 'filter', 'color', 'clip-path', 'mask',
            'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
          ];
          attrsToInherit.forEach(attr => {
            const val = mainGroup.getAttribute(attr);
            if (val) {
              children.forEach(child => {
                if (!child.hasAttribute(attr)) {
                  child.setAttribute(attr, val);
                }
              });
            }
          });

          // Inherit the main container's style to keep text styling stable
          const groupStyle = mainGroup.getAttribute('style');
          if (groupStyle) {
            children.forEach(child => {
              const childStyle = child.getAttribute('style');
              child.setAttribute('style', childStyle ? `${groupStyle}; ${childStyle}` : groupStyle);
            });
          }

          // Inherit the main container's classes
          const groupClass = mainGroup.getAttribute('class');
          if (groupClass) {
            children.forEach(child => {
              const childClass = child.getAttribute('class');
              child.setAttribute('class', childClass ? `${groupClass} ${childClass}` : groupClass);
            });
          }

          // Inherit the main container's transform to keep positions stable
          const groupTransform = mainGroup.getAttribute('transform') || '';
          if (groupTransform) {
            children.forEach(child => {
              const childTransform = child.getAttribute('transform') || '';
              child.setAttribute('transform', `${groupTransform} ${childTransform}`.trim());
            });
          }

          return children;
        }
        return infants;
      };

      const finalTemplateElements = getExplodedTemplateChildren(templateSvg);

      // 6. Inject template content into root folder (Ungrouped & Non-Destructive)
      if (rootFolder || pageSvg) {
        const targetParent = rootFolder || pageSvg;

        // Find the 'Overlay' layer (absolute background) to insert AFTER it
        const overlayChild = Array.from(targetParent.children).find(el => el.getAttribute('data-name') === 'Overlay');
        const nextSiblingRef = overlayChild ? overlayChild.nextSibling : targetParent.firstChild;

        // Inherit visual attributes from the original template SVG
        const svgAttrs = [
          'fill', 'stroke', 'stroke-width', 'opacity', 'visibility', 'filter', 'color', 'clip-path', 'mask',
          'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
        ];

        finalTemplateElements.forEach(child => {
          const imported = pageDoc.importNode(child, true);

          // Inherit top-level SVG attributes if not explicitly set on element
          svgAttrs.forEach(attr => {
            const val = templateSvg.getAttribute(attr);
            if (val && !imported.hasAttribute(attr)) {
              imported.setAttribute(attr, val);
            }
          });

          // Inherit top-level style
          const svgStyle = templateSvg.getAttribute('style');
          if (svgStyle) {
            const importedStyle = imported.getAttribute('style');
            imported.setAttribute('style', importedStyle ? `${svgStyle}; ${importedStyle}` : svgStyle);
          }

          // Inherit top-level class
          const svgClass = templateSvg.getAttribute('class');
          if (svgClass) {
            const importedClass = imported.getAttribute('class');
            imported.setAttribute('class', importedClass ? `${svgClass} ${importedClass}` : svgClass);
          }

          // Apply scaling and translation to fit A4
          const currentTransform = imported.getAttribute('transform') || '';
          const fittingTransform = `translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-viewBoxX}, ${-viewBoxY})`;
          imported.setAttribute('transform', `${fittingTransform} ${currentTransform}`.trim());

          // Insert into target parent
          if (nextSiblingRef) {
            targetParent.insertBefore(imported, nextSiblingRef);
          } else {
            targetParent.appendChild(imported);
          }
        });
      }

      // 7. Update HTML and Layers state
      const serializer = new XMLSerializer();

      const parseLayersAndSetIds = (element) => {
        return Array.from(element.children)
          .filter(child =>
            !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
            child.getAttribute('data-name') !== 'Overlay'
          )
          .map((child) => {
            const id = child.getAttribute('id') || child.id || `${child.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;
            if (!child.getAttribute('id') && !child.id) child.setAttribute('id', id);

            const rawName = child.getAttribute('data-name') || id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
            // Strip the unique template prefix for cleaner display (e.g. tpl-a1b2-MyLayer -> MyLayer)
            const cleanName = rawName.replace(/^tpl-[a-z0-9]{4}-/, '');

            const layer = {
              id: id,
              name: cleanName,
              type: child.tagName.toLowerCase(),
              visible: true,
              locked: false
            };

            if (child.tagName.toLowerCase() === 'g' && child.children.length > 0) {
              layer.children = parseLayersAndSetIds(child);
            }

            return layer;
          });
      };

      const updatedLayers = parseLayersAndSetIds(pageSvg);
      const updatedHtml = serializer.serializeToString(pageSvg);

      setPages(prev => {
        const updated = [...prev];
        if (updated[targetIndex]) {
          updated[targetIndex] = {
            ...updated[targetIndex],
            html: updatedHtml,
            layers: updatedLayers
          };
        }
        return updated;
      });

      // Update selection to the new root folder of the active page
      if (updatedLayers.length > 0 && targetIndex === activePageIndex) {
        const rootId = updatedLayers[0].id;
        setSelectedLayerId(rootId);
        setMultiSelectedIds(new Set([rootId]));
        setCurrentFrameId(rootId);
      }

      setTemplateTargetIndex(null);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleOpenTemplateModal = (index) => {
    if (popupEditContext) {
      setShowPopupTemplateChange(true);
    } else {
      setTemplateTargetIndex(index !== undefined ? index : activePageIndex);
      setShowTemplateModal(true);
    }
  };

  useEffect(() => {
    const initializeEditor = async () => {
      setIsLoading(true);

      if (v_id) {
        try {
          const storedUser = localStorage.getItem('user');
          const user = storedUser ? JSON.parse(storedUser) : null;
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

          const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
            params: { emailId: user?.emailId, v_id, folderName: folder || location.state?.folderName, bookName: decodeURIComponent(v_id), metadataOnly: true }
          });

          if (res.data && res.data.pages) {
            const parser = new DOMParser();
            const sanitizedEmail = user?.emailId?.replace(/[@.]/g, "_");
            const folderNameArr = Array.isArray(res.data.meta.folderName) ? res.data.meta.folderName : [res.data.meta.folderName || 'Recent Book'];
            const actualFolderName = folderNameArr.find(f => f !== 'Recent Book' && f !== 'All Books') || folderNameArr[0] || 'Recent Book';
            const bookName = res.data.meta.flipbookName || 'Untitled Flipbook';
            const projectBaseUrl = `${backendUrl}/uploads/${sanitizedEmail}/My_Flipbooks/${actualFolderName}/${bookName}/`;

            const mappedPages = await Promise.all(res.data.pages.map(async (p, i) => {
              const name = p.name || `Page ${i + 1}`;
              let pageHtml = p.html;

              if (!pageHtml && p.fileName) {
                try {
                  const htmlRes = await axios.get(`${projectBaseUrl}${p.fileName}?t=${Date.now()}`);
                  pageHtml = htmlRes.data;
                } catch (e) {
                  console.error(`Failed to fetch HTML for ${p.fileName}`, e);
                }
              }

              if (!pageHtml || typeof pageHtml !== 'string' || pageHtml.trim() === '') {
                const { html, layers } = createDefaultPageData(name);
                return {
                  id: p.v_id || i + 1,
                  name: name,
                  html: html,
                  layers: layers
                };
              }

              // Transform relative paths to absolute for the editor's canvas
              let updatedHtml = pageHtml;
              if (updatedHtml.includes('./assets/')) {
                updatedHtml = updatedHtml.split('./assets/').join(`${projectBaseUrl}assets/`);
              }

              if (updatedHtml.includes('parsererror') || updatedHtml.includes('id="custom-ctrl-')) {
                const temp = document.createElement('div');
                temp.innerHTML = updatedHtml;
                temp.querySelectorAll('parsererror').forEach(el => el.remove());
                temp.querySelectorAll('[id^="custom-ctrl-"]').forEach(el => el.remove());
                updatedHtml = temp.innerHTML;
              }

              // Re-parse layers from HTML if missing or invalid (source of truth)
              const doc = parser.parseFromString(updatedHtml, 'image/svg+xml');
              
              // Force rebuild of effects and dynamic shapes to ensure they are visually correct upon reload
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
                  const tl = Math.min(parseFloat(el.getAttribute('data-tl') || defR), maxR);
                  const tr = Math.min(parseFloat(el.getAttribute('data-tr') || defR), maxR);
                  const bl = Math.min(parseFloat(el.getAttribute('data-bl') || defR), maxR);
                  const br = Math.min(parseFloat(el.getAttribute('data-br') || defR), maxR);

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

              // Serialize doc back to updatedHtml so the rebuilt elements are saved to state
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
                if (svgEl) {
                  layers = parseLayersFromSVG(svgEl);
                } else {
                  layers = [];
                }
              }

              return {
                id: p.v_id || i + 1,
                v_id: p.v_id,
                name: name,
                html: updatedHtml,
                layers: layers
              };
            }));

            setPages(mappedPages);

            // Initialize tracking reference to avoid massive resyncs of untouched pages
            mappedPages.forEach((p, i) => {
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
              flipbookName: prev?.flipbookName || res.data.meta.flipbookName,
              share: shareData
            }));
            setHasUnsavedChanges(false);

          }
        } catch (err) {
          console.error("Failed to fetch flipbook:", err);
          // Redirect to 404 if flipbook not found or other fetch error
          navigate('/not-found', { replace: true });
        }
      }
      else if (location.state && location.state.pageCount) {
        const count = location.state.pageCount;
        const newPages = Array.from({ length: count }, (_, i) => {
          const name = `Page ${i + 1}`;
          const { html, layers } = createDefaultPageData(name);
          return {
            id: i + 1,
            name,
            html,
            layers
          };
        });
        setPages(newPages);
        setCurrentBook(prev => ({
          ...(prev || {}),
          flipbookName: prev?.flipbookName || location.state.flipbookName || 'Untitled Flipbook',
          folderName: prev?.folderName || location.state.folderName || 'Recent Book'
        }));
      }
      else {
        setPages(Array.from({ length: 12 }, (_, i) => {
          const name = `Page ${i + 1}`;
          const { html, layers } = createDefaultPageData(name);
          return {
            id: i + 1,
            name,
            html,
            layers
          };
        }));
        setCurrentBook(prev => ({
          ...(prev || {}),
          flipbookName: prev?.flipbookName || 'Untitled Flipbook',
          folderName: prev?.folderName || 'Recent Book'
        }));
      }

      setIsLoading(false);
    };

    initializeEditor();
  }, [v_id, location.state]);

  const preview3DDataUrl = React.useMemo(() => {
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
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        finalVal = `${backendUrl}${finalVal}`;
      }
      return finalVal;
    } catch (e) {
      return null;
    }
  }, [current3DItem, pages, activePageIndex]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white h-[92vh]">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPdfProject = pages.some(p => p.html && p.html.includes('data-name="PDF Background"'));

  const selectedElementInteraction = (() => {
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
  })();

  return (
    <div className="flex h-[92vh] w-full bg-white overflow-hidden relative">
      <div className={`flex flex-1 transition-all duration-300 ${is3DModalOpen ? 'blur-md pointer-events-none' : ''}`}>
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
          isPopupEditor={!!popupEditContext}
          isExportModalOpen={isExportModalOpen}
        />

        <MainEditor
          isPdfProject={isPdfProject}
          isDoublePage={isDoublePage}
          isRulerEnabled={isRulerEnabled}
          pages={pages}
          activePageIndex={activePageIndex}
          setActivePageIndex={setActivePageIndex}
          insertPageAfter={insertPageAfter}
          duplicatePage={duplicatePage}
          clearPage={clearPage}
          deletePage={deletePage}
          onOpenTemplateModal={handleOpenTemplateModal}
          onAddFile={handleAddFileClick}
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
          onSave={saveFlipbook}
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

      {/* Dark Overlay for blurred content */}
      {is3DModalOpen && (
        <div className="absolute top-0 left-0 bottom-0 right-[24vw] z-[90] bg-black/60 pointer-events-none transition-all duration-300"></div>
      )}

      {/* 3D Preview Modal (rendered in place of main editor when active) */}
      {is3DModalOpen && (
        <div className="absolute top-0 left-0 bottom-0 right-[24vw] z-[100] flex p-[2vw]">
          <Model3DPreviewModal
            isOpen={is3DModalOpen}
            dataUrl={preview3DDataUrl}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            bgType={bgType}
            bgColor={bgColor}
            customBg={customBg}
            enableAR={enableAR}
            setBgColor={setBgColor}
            qrText={qrText} qrColor={qrColor} qrBgType={qrBgType} qrBgColor={qrBgColor} qrLevel={qrLevel} qrDotType={qrDotType} qrCornerSquareType={qrCornerSquareType} qrCornerDotType={qrCornerDotType} qrLogo={qrLogo}
            topText={topText} bottomText={bottomText}
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
      />

      {showTemplateModal && (
        <TemplateModal
          showTemplateModal={showTemplateModal}
          setShowTemplateModal={setShowTemplateModal}
          clearCanvas={() => clearPage(templateTargetIndex !== null ? templateTargetIndex : activePageIndex)}
          loadTemplate={loadTemplate}
        />
      )}

      {showPreview && (
        <FlipbookPreview
          pages={pages.map(p => ({ ...p, content: p.html || '' }))}
          pageName={currentBook?.flipbookName || 'Preview'}
          onClose={() => setShowPreview(false)}
          isMobile={false}
          isDoublePage={isDoublePage}
          targetPage={0}
          settings={{}}
        />
      )}

      {/* Hidden File Input for PDF Upload */}
      <input
        type="file"
        ref={pdfInputRef}
        style={{ display: 'none' }}
        accept=".pdf,application/pdf"
        onChange={handlePdfFileSelect}
      />

      {/* Hidden File Input for PDF Replace */}
      <input
        type="file"
        ref={replacePdfInputRef}
        style={{ display: 'none' }}
        accept=".pdf,application/pdf"
        onChange={handleReplaceFileSelect}
      />

      {/* PDF Processing Overlay */}
      <PdfProcessingLoader progress={pdfProcessing} />

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

    </div>
  );
};

export default TemplateEditor;
