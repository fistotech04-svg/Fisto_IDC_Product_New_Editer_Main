import { useEffect, useCallback } from 'react';
import { getTopLevelFrames } from './frameHierarchyUtils';

/**
 * Hook managing insertion of external media and assets:
 * - Images, GIFs, Video uploads, Iframe embeds (YouTube, Vimeo, Drive, Loom, Wistia)
 * - Hotspots, icon badges, style updates
 * - Masked image shapes (clipping masks)
 * - Background preloading of page images for smooth rendering
 */
export const useCanvasAssetInsertion = ({
  pages = [],
  activePageIndex = 0,
  baseWidth = 210,
  baseHeight = 297,
  updatePageHtml,
  saveModifiedPageHtml,
  setSelectedLayerId,
  setMultiSelectedIds,
  setActiveMainTool,
  setActiveTopTool,
  drawOverlayHighlight,
  currentFrameIdRef,
  setCurrentFrameId,
  selectedLayerIdRef,
  multiSelectedIdsRef
}) => {
  const insertImageIntoPage = useCallback((pageIdx, rawDataUrl, dataType = 'image', dropPoint = null, targetShapeId = null) => {
    if (!rawDataUrl) return;
    if (typeof setActiveMainTool === 'function') {
      setActiveMainTool('select');
    }

    let dataUrl = typeof rawDataUrl === 'string' ? rawDataUrl.trim() : rawDataUrl;
    if (typeof dataUrl === 'string') {
      if (dataUrl.includes('\n') || dataUrl.includes('\r')) {
        const lines = dataUrl.split(/[\r\n]+/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        if (lines.length > 0) dataUrl = lines[0];
      }
      if (dataUrl.includes('<img') || dataUrl.includes('<a ')) {
        const match = dataUrl.match(/(?:src|href)=["']([^"']+)["']/i);
        if (match && match[1]) {
          dataUrl = match[1];
        }
      }
    }

    const container = document.querySelector(`.page-svg-container[data-page-index="${pageIdx}"]`);
    const svg = container?.querySelector('svg');
    if (!svg) {
      console.error(`[CanvasAssetInsertion] Could not find SVG container for page ${pageIdx}`);
      return;
    }

    const groupId = `image-group-${Math.random().toString(36).substr(2, 9)}`;
    const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    newGroup.id = groupId;
    newGroup.setAttribute('data-type', dataType || 'image');
    if (dataType === 'gif') {
      newGroup.setAttribute('data-name', 'GIF Group');
      newGroup.setAttribute('data-is-gif-group', 'true');
    } else if (dataType === 'video') {
      newGroup.setAttribute('data-name', 'Video Group');
      newGroup.setAttribute('data-is-video-group', 'true');
    } else {
      newGroup.setAttribute('data-name', 'Image Group');
      newGroup.setAttribute('data-is-image-group', 'true');
    }

    const imgId = `image-${Math.random().toString(36).substr(2, 9)}`;
    const newImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    newImg.id = imgId;
    newImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
    newImg.setAttribute('href', dataUrl);
    if (dataType === 'gif') {
      newImg.setAttribute('data-name', 'GIF');
    } else if (dataType === 'video') {
      newImg.setAttribute('data-name', 'Video');
    } else {
      newImg.setAttribute('data-name', 'Image');
    }
    newImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    newGroup.appendChild(newImg);

    let inserted = false;
    const placeImageInFrame = (imgWidth = 100, imgHeight = 100) => {
      if (inserted) return;
      inserted = true;

      if (targetShapeId && dataType === 'image') {
        const shapeEl = svg.querySelector(`[id="${targetShapeId}"]`);
        if (shapeEl) {
          try {
            if (!shapeEl.hasAttribute('data-original-fill')) {
              shapeEl.setAttribute('data-original-fill', shapeEl.getAttribute('fill') || '#d0ccff');
            }
            shapeEl.setAttribute('data-masked-image-url', dataUrl);
            shapeEl.setAttribute('data-masked-image-type', dataType);

            let defs = svg.querySelector('defs');
            if (!defs) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              svg.insertBefore(defs, svg.firstChild);
            }

            const safeShapeId = (targetShapeId || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
            const clipId = `clip-shape-${safeShapeId}`;
            let clip = defs.querySelector(`clipPath[id="${clipId}"]`);
            if (!clip) {
              clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
              clip.id = clipId;
              defs.appendChild(clip);
            } else {
              clip.innerHTML = '';
            }

            const cleanClipShape = shapeEl.cloneNode(true);
            cleanClipShape.removeAttribute('id');
            cleanClipShape.removeAttribute('fill');
            cleanClipShape.removeAttribute('stroke');
            cleanClipShape.removeAttribute('stroke-width');
            cleanClipShape.removeAttribute('transform');
            clip.appendChild(cleanClipShape);

            const imageId = `masked-img-${safeShapeId}`;
            let imageEl = svg.querySelector(`image[id="${imageId}"]`);
            if (!imageEl) {
              imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
              imageEl.id = imageId;
              shapeEl.parentNode.insertBefore(imageEl, shapeEl);
            }

            try {
              const bbox = shapeEl.getBBox();
              imageEl.setAttribute('x', bbox.x);
              imageEl.setAttribute('y', bbox.y);
              imageEl.setAttribute('width', bbox.width);
              imageEl.setAttribute('height', bbox.height);

              const transform = shapeEl.getAttribute('transform');
              if (transform) {
                imageEl.setAttribute('transform', transform);
              } else {
                imageEl.removeAttribute('transform');
              }
            } catch {
              imageEl.setAttribute('x', '0');
              imageEl.setAttribute('y', '0');
              imageEl.setAttribute('width', '100%');
              imageEl.setAttribute('height', '100%');
            }

            imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
            imageEl.setAttribute('href', dataUrl);
            imageEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            imageEl.setAttribute('clip-path', `url(#${clipId})`);
            imageEl.setAttribute('data-is-mask-image', 'true');
            imageEl.setAttribute('data-target-shape', safeShapeId);

            shapeEl.setAttribute('fill', 'none');

            const patternId = `pattern-shape-${safeShapeId}`;
            const oldPattern = defs.querySelector(`pattern[id="${patternId}"]`);
            if (oldPattern) oldPattern.remove();

            if (saveModifiedPageHtml) {
              saveModifiedPageHtml(pageIdx, svg);
            } else if (updatePageHtml) {
              updatePageHtml(pageIdx, svg.outerHTML);
            }

            if (setSelectedLayerId) setSelectedLayerId(targetShapeId);
            if (selectedLayerIdRef) selectedLayerIdRef.current = targetShapeId;
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([targetShapeId]));
            if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([targetShapeId]);

            if (setActiveMainTool) setActiveMainTool('select');
            setTimeout(() => {
              const el = document.getElementById(targetShapeId);
              if (el && typeof drawOverlayHighlight === 'function') {
                drawOverlayHighlight(el, 'selected');
              }
            }, 50);
            return;
          } catch (err) {
            console.error('[CanvasAssetInsertion] Masking image failed:', err);
          }
        }
      }

      const topFrames = getTopLevelFrames(svg);
      const targetFrame = currentFrameIdRef?.current ? svg.querySelector(`[id="${currentFrameIdRef.current}"]`) : null;
      const rootFrame = targetFrame || topFrames[0] || svg.querySelector('g') || svg;

      if (rootFrame) {
        try {
          let pWidth = baseWidth || 210, pHeight = baseHeight || 297;
          let pX = 0, pY = 0;

          try {
            const viewBoxAttr = svg.getAttribute('viewBox');
            if (viewBoxAttr) {
              const vb = viewBoxAttr.split(/[\s,]+/).map(Number);
              if (vb.length === 4 && !isNaN(vb[2]) && !isNaN(vb[3]) && vb[2] > 0 && vb[3] > 0) {
                pX = vb[0];
                pY = vb[1];
                pWidth = vb[2];
                pHeight = vb[3];
              }
            }
            if (rootFrame.getBBox) {
              const bbox = rootFrame.getBBox();
              if (bbox.width > 0 && bbox.height > 0) {
                pWidth = bbox.width;
                pHeight = bbox.height;
                pX = bbox.x;
                pY = bbox.y;
              }
            }
          } catch { /* ignored */ }

          const targetInitialSize = Math.min(pWidth * 0.4, 90);
          let displayWidth = targetInitialSize;
          let displayHeight = (imgHeight / imgWidth) * displayWidth;

          if (displayHeight > targetInitialSize) {
            displayHeight = targetInitialSize;
            displayWidth = (imgWidth / imgHeight) * displayHeight;
          }

          const cx = dropPoint && typeof dropPoint.x === 'number' ? dropPoint.x : (pX + pWidth / 2);
          const cy = dropPoint && typeof dropPoint.y === 'number' ? dropPoint.y : (pY + pHeight / 2);

          newGroup.setAttribute('data-object-fit', 'Fit');
          newImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          newImg.setAttribute('x', (cx - displayWidth / 2).toString());
          newImg.setAttribute('y', (cy - displayHeight / 2).toString());
          newImg.setAttribute('width', displayWidth.toString());
          newImg.setAttribute('height', displayHeight.toString());

          rootFrame.appendChild(newGroup);

          if (saveModifiedPageHtml) {
            saveModifiedPageHtml(pageIdx, svg);
          } else if (updatePageHtml) {
            updatePageHtml(pageIdx, svg.outerHTML);
          }

          if (setSelectedLayerId) setSelectedLayerId(groupId);
          if (selectedLayerIdRef) selectedLayerIdRef.current = groupId;
          if (setMultiSelectedIds) setMultiSelectedIds(new Set([groupId]));
          if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([groupId]);

          if (setActiveMainTool) setActiveMainTool('select');
          if (setCurrentFrameId && rootFrame.id) {
            setCurrentFrameId(rootFrame.id);
            if (currentFrameIdRef) currentFrameIdRef.current = rootFrame.id;
          }

          setTimeout(() => {
            const el = document.getElementById(groupId);
            if (el && typeof drawOverlayHighlight === 'function') {
              drawOverlayHighlight(el, 'selected');
            }
          }, 50);
        } catch (err) {
          console.error('[CanvasAssetInsertion] Failed to insert image into SVG frame:', err);
        }
      }
    };

    const i = new Image();
    i.referrerPolicy = 'no-referrer';
    i.onload = () => {
      placeImageInFrame(i.width || 100, i.height || 100);
    };
    i.onerror = () => {
      placeImageInFrame(100, 100);
    };
    i.src = dataUrl;
  }, [baseHeight, baseWidth, currentFrameIdRef, drawOverlayHighlight, multiSelectedIdsRef, saveModifiedPageHtml, selectedLayerIdRef, setActiveMainTool, setCurrentFrameId, setMultiSelectedIds, setSelectedLayerId, updatePageHtml]);

  // Handle external asset insertion events
  useEffect(() => {
    const handleAddIcon = (e) => {
      const { icon, pageIndex } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      let svgW = 793;
      let svgH = 1121;
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
          svgW = parts[2];
          svgH = parts[3];
        }
      } else {
        const wAttr = parseFloat(svg.getAttribute('width'));
        const hAttr = parseFloat(svg.getAttribute('height'));
        if (!isNaN(wAttr) && wAttr > 0) svgW = wAttr;
        if (!isNaN(hAttr) && hAttr > 0) svgH = hAttr;
      }
      const centerX = e.detail.dropPoint ? e.detail.dropPoint.x : (svgW / 2);
      const centerY = e.detail.dropPoint ? e.detail.dropPoint.y : (svgH / 2);

      const newId = `icon-${Date.now()}`;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.id = newId;
      g.setAttribute('data-type', 'icon');
      g.setAttribute('transform', `translate(${centerX - 6}, ${centerY - 6}) scale(0.5)`);
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke', '#000000');
      g.setAttribute('stroke-width', '1');

      if (icon.html) g.innerHTML = icon.html;
      else if (icon.d) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', icon.d);
        g.appendChild(path);
      }

      if (icon.html) {
        const rects = g.querySelectorAll('rect');
        rects.forEach(rect => {
          if (!rect.hasAttribute('fill')) {
            rect.setAttribute('fill', 'none');
          }
        });
      }

      const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
      targetContainer.appendChild(g);

      if (updatePageHtml) updatePageHtml(targetPageIndex, svg.outerHTML);

      if (setSelectedLayerId) setSelectedLayerId(newId);
      if (selectedLayerIdRef) selectedLayerIdRef.current = newId;
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
      if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([newId]);

      if (setActiveMainTool) setActiveMainTool('select');
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }, 50);
    };

    const handleAddHotspot = (e) => {
      const { icon, pageIndex } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      let svgW = 793;
      let svgH = 1121;
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
          svgW = parts[2];
          svgH = parts[3];
        }
      } else {
        const wAttr = parseFloat(svg.getAttribute('width'));
        const hAttr = parseFloat(svg.getAttribute('height'));
        if (!isNaN(wAttr) && wAttr > 0) svgW = wAttr;
        if (!isNaN(hAttr) && hAttr > 0) svgH = hAttr;
      }
      const centerX = e.detail.dropPoint ? e.detail.dropPoint.x : (svgW / 2);
      const centerY = e.detail.dropPoint ? e.detail.dropPoint.y : (svgH / 2);

      const newId = `hotspot-${Date.now()}`;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.id = newId;
      g.setAttribute('data-type', 'hotspot');
      g.setAttribute('transform', `translate(${centerX - 12}, ${centerY - 12}) scale(0.5)`);
      g.setAttribute('data-is-hotspot', 'true');
      g.setAttribute('data-show-highlight', 'false');

      const currentPresetId = e.detail.presetId || (icon && icon.presetId);
      if (currentPresetId) {
        g.setAttribute('data-preset-id', currentPresetId);
        const actionMap = {
          'youtube': 'open-link',
          'instagram': 'open-link',
          'x': 'open-link',
          'facebook': 'open-link',
          'linkedin': 'open-link',
          'open-link': 'open-link',
          'navigate-to': 'navigate-to',
          'whatsapp': 'whatsapp',
          'call': 'call',
          'email': 'email',
          'video': 'popup',
          'popup': 'popup',
          'slideshow': 'slideshow',
          'zoom': 'zoom',
          'download': 'download',
          'audio': 'audio',
          'info-box': 'info-box',
          'location': 'open-link',
          '3d-viewer': '3d-viewer',
          'interactive-button': 'open-link'
        };
        const actionType = actionMap[currentPresetId];
        if (actionType) {
          g.setAttribute('data-interaction', actionType);
        }
      }

      if (icon?.bgColor) g.setAttribute('data-bg-color', icon.bgColor);
      if (icon?.iconColor) g.setAttribute('data-icon-color', icon.iconColor);

      if (icon?.html) {
        g.innerHTML = icon.html;
      } else if (icon?.d) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', icon.d);
        g.appendChild(path);
      } else if (icon?.src) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', icon.src);
        image.setAttribute('width', '48');
        image.setAttribute('height', '48');
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        g.appendChild(image);
      }

      const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
      targetContainer.appendChild(g);

      if (updatePageHtml) updatePageHtml(targetPageIndex, svg.outerHTML);

      if (setSelectedLayerId) setSelectedLayerId(newId);
      if (selectedLayerIdRef) selectedLayerIdRef.current = newId;
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
      if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([newId]);

      if (setActiveMainTool) setActiveMainTool('select');
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }, 50);

      if (e.detail.isHotspot && typeof setActiveTopTool === 'function') {
        setActiveTopTool('interaction');
      }
    };

    const handleUploadVideo = (e) => {
      const { videoUrl, originalUrl, pageIndex, file } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;

      const container = document.querySelector(`.page-svg-container[data-page-index="${targetPageIndex}"]`);
      const svg = container?.querySelector('svg');
      if (!svg) return;

      const rawUrl = originalUrl || videoUrl || '';
      const lowerRaw = rawUrl.toLowerCase();
      const isYouTube = lowerRaw.includes('youtube.com') || lowerRaw.includes('youtu.be') || (videoUrl && videoUrl.includes('youtube.com/embed'));
      const isVimeo = lowerRaw.includes('vimeo.com') || (videoUrl && videoUrl.includes('vimeo.com/video'));
      const isDailymotion = lowerRaw.includes('dailymotion') || lowerRaw.includes('dai.ly');
      const isLoom = lowerRaw.includes('loom.com');
      const isWistia = lowerRaw.includes('wistia.com');
      const isGoogleDrive = lowerRaw.includes('drive.google.com');

      const isIframe = isYouTube || isVimeo || isDailymotion || isLoom || isWistia || isGoogleDrive || (videoUrl && (videoUrl.includes('embed') || videoUrl.includes('player') || videoUrl.includes('preview')));

      let finalEmbedUrl = videoUrl;
      if (isYouTube) {
        let videoId = '';
        if (rawUrl.includes('youtu.be/')) videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
        else if (rawUrl.includes('watch?v=')) videoId = rawUrl.split('v=')[1]?.split('&')[0];
        else if (rawUrl.includes('shorts/')) videoId = rawUrl.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
        else if (rawUrl.includes('embed/')) videoId = rawUrl.split('embed/')[1]?.split('?')[0]?.split('&')[0];
        if (videoId) finalEmbedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
      } else if (isVimeo) {
        let videoId = rawUrl.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
        if (videoId && !isNaN(videoId)) finalEmbedUrl = `https://player.vimeo.com/video/${videoId}`;
      } else if (isDailymotion) {
        let videoId = '';
        if (rawUrl.includes('dai.ly/')) videoId = rawUrl.split('dai.ly/')[1]?.split('?')[0];
        else if (rawUrl.includes('video/')) videoId = rawUrl.split('video/')[1]?.split('?')[0];
        if (videoId) finalEmbedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
      } else if (isLoom) {
        let videoId = rawUrl.split('loom.com/share/')[1]?.split('?')[0];
        if (videoId) finalEmbedUrl = `https://www.loom.com/embed/${videoId}`;
      } else if (isWistia) {
        let videoId = rawUrl.split('wistia.com/medias/')[1]?.split('?')[0];
        if (videoId) finalEmbedUrl = `https://fast.wistia.net/embed/iframe/${videoId}`;
      } else if (isGoogleDrive) {
        const match = rawUrl.match(/\/d\/([^/]+)/);
        if (match && match[1]) finalEmbedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      }

      const newId = `video-${Date.now()}`;
      let displayWidth = 120;
      let displayHeight = 67.5;

      const svgW = (svg.getAttribute('width') && !svg.getAttribute('width').includes('%')) ? parseFloat(svg.getAttribute('width')) : (baseWidth || 210);
      const svgH = (svg.getAttribute('height') && !svg.getAttribute('height').includes('%')) ? parseFloat(svg.getAttribute('height')) : (baseHeight || 297);

      const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      fo.id = newId;
      fo.setAttribute('data-type', 'video');
      fo.setAttribute('data-name', 'Video');
      fo.setAttribute('data-object-fit', 'Fit');
      if (file && file.name) fo.setAttribute('data-filename', file.name);
      if (file && file.size) fo.setAttribute('data-filesize', file.size);

      if (isIframe) {
        fo.setAttribute('data-is-iframe', 'true');
        fo.setAttribute('data-video-url', rawUrl);

        const iframe = document.createElement('iframe');
        iframe.src = finalEmbedUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', 'true');

        const intrinsicW = 640;
        const intrinsicH = 360;
        const targetW = Math.min(svgW * 0.75, 160);
        displayWidth = targetW;
        displayHeight = (intrinsicH / intrinsicW) * displayWidth;

        fo.appendChild(iframe);
      } else {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.display = 'block';
        video.setAttribute('controls', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('preload', 'metadata');

        const tempVid = document.createElement('video');
        tempVid.src = videoUrl;
        tempVid.onloadedmetadata = () => {
          if (tempVid.videoWidth && tempVid.videoHeight) {
            const aspect = tempVid.videoWidth / tempVid.videoHeight;
            const targetW = Math.min(svgW * 0.75, 160);
            const dynamicW = targetW;
            const dynamicH = dynamicW / aspect;
            fo.setAttribute('width', dynamicW.toString());
            fo.setAttribute('height', dynamicH.toString());
            fo.setAttribute('x', ((svgW - dynamicW) / 2).toString());
            fo.setAttribute('y', ((svgH - dynamicH) / 2).toString());
            if (updatePageHtml) updatePageHtml(targetPageIndex, svg.outerHTML);
          }
        };

        fo.appendChild(video);
      }

      const topFrames = getTopLevelFrames(svg);
      const rootFrame = topFrames[0] || svg.querySelector('g') || svg;

      let cx = svgW / 2;
      let cy = svgH / 2;
      try {
        if (rootFrame.getBBox) {
          const bbox = rootFrame.getBBox();
          if (bbox.width > 0 && bbox.height > 0) {
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
          }
        }
      } catch { /* ignored */ }

      fo.setAttribute('width', displayWidth.toString());
      fo.setAttribute('height', displayHeight.toString());
      fo.setAttribute('x', (cx - displayWidth / 2).toString());
      fo.setAttribute('y', (cy - displayHeight / 2).toString());

      rootFrame.appendChild(fo);

      if (updatePageHtml) updatePageHtml(targetPageIndex, svg.outerHTML);

      if (setSelectedLayerId) setSelectedLayerId(newId);
      if (selectedLayerIdRef) selectedLayerIdRef.current = newId;
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
      if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([newId]);

      if (setActiveMainTool) setActiveMainTool('select');
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }, 50);
    };

    const handleAddImage = (e) => {
      if (typeof setActiveMainTool === 'function') {
        setActiveMainTool('select');
      }
      const { url, gifUrl, pageIndex, dropPoint, type, targetShapeId } = e.detail || {};
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const mediaUrl = gifUrl || url;
      if (!mediaUrl) return;
      const dataType = type || (gifUrl || mediaUrl.toLowerCase().endsWith('.gif') ? 'gif' : 'image');
      insertImageIntoPage(targetPageIndex, mediaUrl, dataType, dropPoint, targetShapeId);
    };

    const handleUploadImageEvent = (e) => {
      const { pageIndex, dataUrl, dataType } = e.detail;
      insertImageIntoPage(pageIndex, dataUrl, dataType);
    };

    window.addEventListener('add-icon-to-editor', handleAddIcon);
    window.addEventListener('add-hotspot-to-editor', handleAddHotspot);
    window.addEventListener('update-hotspot-style', (e) => {
      const { id, pageIndex, html, presetId, iconSrc, bgColor, iconColor } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      const g = svg.getElementById(id);
      if (!g) return;

      if (html) {
        g.innerHTML = html;
      }
      if (presetId) g.setAttribute('data-preset-id', presetId);
      if (iconSrc) {
        g.setAttribute('data-hotspot-icon-src', iconSrc);
      } else {
        g.removeAttribute('data-hotspot-icon-src');
      }
      if (bgColor) g.setAttribute('data-bg-color', bgColor);
      if (iconColor) g.setAttribute('data-icon-color', iconColor);

      if (updatePageHtml) updatePageHtml(targetPageIndex, svg.outerHTML);
    });
    window.addEventListener('add-image-to-editor', handleAddImage);
    window.addEventListener('upload-video-to-editor', handleUploadVideo);
    window.addEventListener('upload-image-to-editor', handleUploadImageEvent);

    return () => {
      window.removeEventListener('add-icon-to-editor', handleAddIcon);
      window.removeEventListener('add-hotspot-to-editor', handleAddHotspot);
      window.removeEventListener('add-image-to-editor', handleAddImage);
      window.removeEventListener('upload-video-to-editor', handleUploadVideo);
      window.removeEventListener('upload-image-to-editor', handleUploadImageEvent);
    };
  }, [activePageIndex, pages, updatePageHtml, setSelectedLayerId, selectedLayerIdRef, setMultiSelectedIds, multiSelectedIdsRef, setActiveMainTool, setActiveTopTool, drawOverlayHighlight, baseWidth, baseHeight, insertImageIntoPage]);

  // Pre-load all images for instant view
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    const loadedUrls = new Set();
    pages.forEach(page => {
      if (!page.html) return;

      const regex = /(?:src|href)="([^"]+)"/g;
      let match;
      while ((match = regex.exec(page.html)) !== null) {
        const url = match[1];
        if (url && !loadedUrls.has(url)) {
          const img = new Image();
          img.src = url;
          if (img.decode) {
            img.decode().catch(() => { });
          }
          loadedUrls.add(url);
        }
      }

      const styleRegex = /url\(["']?([^"']+)["']?\)/g;
      while ((match = styleRegex.exec(page.html)) !== null) {
        const url = match[1];
        if (url && !loadedUrls.has(url)) {
          const img = new Image();
          img.src = url;
          if (img.decode) {
            img.decode().catch(() => { });
          }
          loadedUrls.add(url);
        }
      }
    });
  }, [pages]);

  return {
    insertImageIntoPage
  };
};

export default useCanvasAssetInsertion;
