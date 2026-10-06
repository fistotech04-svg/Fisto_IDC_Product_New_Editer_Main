/**
 * use3DPreviewManager.js
 * Manages 3D Model preview state, lighting/shadow configurations,
 * interactive hotspots, QR code customization, and 3D item DOM syncing.
 */

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';

export const use3DPreviewManager = ({
  setPages,
  activePageIndex
}) => {
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [current3DItem, setCurrent3DItem] = useState(null);
  const [shadowStrength, setShadowStrength] = useState(1);
  const [shadowSoftness, setShadowSoftness] = useState(1);
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1);
  const [lockMaxZoom, setLockMaxZoom] = useState(false);
  const [maxZoom, setMaxZoom] = useState(2);
  const [bgType, setBgType] = useState('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [customBg, setCustomBg] = useState(null);
  const [enableAR, setEnableAR] = useState(true);

  // QR Code & Text configuration
  const [qrText, setQrText] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgType, setQrBgType] = useState('transparent');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrLevel, setQrLevel] = useState('M');
  const [qrDotType, setQrDotType] = useState('dots');
  const [qrCornerSquareType, setQrCornerSquareType] = useState('extra-rounded');
  const [qrCornerDotType, setQrCornerDotType] = useState('dot');
  const [qrLogo, setQrLogo] = useState(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');

  // 3D Hotspots
  const [current3DHotspots, setCurrent3DHotspots] = useState([]);
  const [active3DHotspotId, setActive3DHotspotId] = useState(null);

  const current3DVId = useMemo(() => {
    if (!current3DItem) return null;
    try {
      const dataVal = current3DItem.getAttribute ? current3DItem.getAttribute('data-interaction-value') : current3DItem['data-interaction-value'];
      if (dataVal && dataVal.startsWith('{')) {
        const parsed = JSON.parse(dataVal);
        return parsed.v_id || null;
      }
    } catch  { /* ignore */ }
    return null;
  }, [current3DItem]);

  // Load 3D model metadata and hotspots on open
  useEffect(() => {
    if (is3DModalOpen && current3DItem) {
      const dataVal = current3DItem.getAttribute ? current3DItem.getAttribute('data-interaction-value') : current3DItem['data-interaction-value'];
      if (dataVal && dataVal.startsWith('{')) {
        try {
          const parsed = JSON.parse(dataVal);
          if (parsed.v_id) {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            axios.get(`${backendUrl}/api/assets/3d-models/${user?.emailId || 'guest'}`)
              .then(res => {
                if (res.data?.success && Array.isArray(res.data.data)) {
                  const targetModel = res.data.data.find(m => m.v_id === parsed.v_id);
                  if (targetModel && Array.isArray(targetModel.hotspots)) {
                    setCurrent3DHotspots(targetModel.hotspots);
                  } else {
                    setCurrent3DHotspots([]);
                  }
                }
              })
              .catch(err => console.error("Failed to fetch 3D model metadata:", err));
          }
        } catch  { /* ignore */ }
      }
    }
  }, [current3DItem, is3DModalOpen]);

  // Sync 3D config back to SVG element attribute when modal closes
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
                    axios.post(`${backendUrl}/api/assets/3d-models/save-config`, {
                      emailId: user.emailId,
                      v_id: parsed.v_id,
                      name: bottomText
                    }).catch(() => { });
                  }
                }
              } catch  { /* ignore */ }
            }

            const serializer = new XMLSerializer();
            page.html = serializer.serializeToString(doc);
            newPages[activePageIndex] = page;
          }
        }
        return newPages;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is3DModalOpen]);

  const preview3DDataUrl = useMemo(() => {
    if (!current3DItem) return null;
    try {
      const val = current3DItem.getAttribute ? current3DItem.getAttribute('data-interaction-value') : current3DItem['data-interaction-value'];
      if (!val) return null;

      let finalVal = val;
      if (val.startsWith('{')) {
        finalVal = JSON.parse(val).data || JSON.parse(val).url || val;
      }
      if (typeof finalVal === 'string' && finalVal.startsWith('/uploads/')) {
        finalVal = resolveUploadsPath(finalVal);
      }

      return finalVal;
    } catch { /* ignore */ }
    return null;
  }, [current3DItem]);

  return {
    is3DModalOpen,
    setIs3DModalOpen,
    current3DItem,
    setCurrent3DItem,
    current3DVId,
    preview3DDataUrl,
    shadowStrength, setShadowStrength,
    shadowSoftness, setShadowSoftness,
    autoRotate, setAutoRotate,
    autoRotateSpeed, setAutoRotateSpeed,
    lockMaxZoom, setLockMaxZoom,
    maxZoom, setMaxZoom,
    bgType, setBgType,
    bgColor, setBgColor,
    customBg, setCustomBg,
    enableAR, setEnableAR,
    qrText, setQrText,
    qrColor, setQrColor,
    qrBgType, setQrBgType,
    qrBgColor, setQrBgColor,
    qrLevel, setQrLevel,
    qrDotType, setQrDotType,
    qrCornerSquareType, setQrCornerSquareType,
    qrCornerDotType, setQrCornerDotType,
    qrLogo, setQrLogo,
    topText, setTopText,
    bottomText, setBottomText,
    current3DHotspots, setCurrent3DHotspots,
    active3DHotspotId, setActive3DHotspotId
  };
};
