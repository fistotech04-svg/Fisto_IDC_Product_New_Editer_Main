/**
 * svgFilterUtils.js
 * SVG DOM manipulation, layer parsing, gradient definitions, and complex SVG filter pipelines
 * (drop-shadow, inner-shadow, blur, backdrop-blur, clip wrappers).
 */

export const parseLayersFromSVG = (element) => {
  return Array.from(element.children)
    .filter(child => {
      if (['defs', 'metadata', 'style', 'title', 'desc', 'parsererror'].includes(child.tagName.toLowerCase())) return false;
      if (child.getAttribute('data-name') === 'Overlay' || child.getAttribute('data-name') === 'Document Shield' || child.getAttribute('data-type') === 'shield') return false;
      if (child.getAttribute('style')?.includes('display:none') || child.getAttribute('style')?.includes('display: none')) return false;
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
          try { child.id = id; } catch  { /* ignore */ }
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

      const isPdfVector = child.getAttribute('data-type') === 'pdf-vector-layer';

      if (child.tagName.toLowerCase() === 'g' && child.children.length > 0 && !isGroup && !isPdfVector) {
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
    try { stops = JSON.parse(stopsJson); } catch { return; }

    const svgRoot = (element.closest ? element.closest('svg') : null) || doc.querySelector('svg');
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


export   const syncFilters = (doc, element) => {
    const svgRoot = doc.querySelector('svg');
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const baseFilterId = `filter-${element.id}`;
    
    // Cache-busting: Remove any existing filters for this element to force a fresh render
    Array.from(defs.querySelectorAll(`[id^="${baseFilterId}"]`)).forEach(old => old.remove());

    const filterId = `${baseFilterId}-${Math.random().toString(36).substr(2, 4)}`;

    const hasDropShadow = element.getAttribute('data-effect-drop-shadow') === 'true';
    const hasInnerShadow = element.getAttribute('data-effect-inner-shadow') === 'true';
    const hasBlur = element.getAttribute('data-effect-blur') === 'true';
    const hasBackgroundBlur = element.getAttribute('data-effect-background-blur') === 'true';
    const hasClipContent = hasBlur && element.getAttribute('data-effect-blur-clip') === 'true';

    if (!hasDropShadow && !hasInnerShadow && !hasBlur && !hasBackgroundBlur) {
      element.removeAttribute('filter');
      element.style.backdropFilter = '';
      return;
    }

    let filterEl = doc.createElementNS("http://www.w3.org/2000/svg", "filter");
    filterEl.id = filterId;
    filterEl.setAttribute('x', '-50%');
    filterEl.setAttribute('y', '-50%');
    filterEl.setAttribute('width', '200%');
    filterEl.setAttribute('height', '200%');
    defs.appendChild(filterEl);

    // Helper to get attribute with default
    const getVal = (attr, def) => element.getAttribute(attr) || def;

    const isForeignObject = element.tagName.toLowerCase() === 'foreignobject';

    if (isForeignObject && !hasInnerShadow && !hasClipContent) {
      const inner = element.firstElementChild;
      if (inner) {
        if (!hasDropShadow && !hasBlur && !hasBackgroundBlur) {
          inner.style.removeProperty('filter');
          inner.style.removeProperty('backdrop-filter');
          inner.style.removeProperty('-webkit-backdrop-filter');
        } else {
          let innerCssFilter = '';
          let outerCssFilter = '';

          if (hasBlur) {
            const blurVal = getVal('data-effect-blur-value', '0.3');
            innerCssFilter += `blur(${blurVal}px) `;
          }
          if (hasDropShadow) {
            const color = getVal('data-effect-drop-shadow-color', '#000000');
            const dx = getVal('data-effect-drop-shadow-x', '2');
            const dy = getVal('data-effect-drop-shadow-y', '2');
            const blur = getVal('data-effect-drop-shadow-blur', '4');
            const opacity = parseFloat(getVal('data-effect-drop-shadow-opacity', '25')) / 100;

            const r = parseInt(color.slice(1, 3), 16) || 0;
            const g = parseInt(color.slice(3, 5), 16) || 0;
            const b = parseInt(color.slice(5, 7), 16) || 0;

            const dropShadowStr = `drop-shadow(${dx}px ${dy}px ${blur}px rgba(${r},${g},${b},${opacity})) `;
            if (hasClipContent) {
              outerCssFilter += dropShadowStr;
            } else {
              innerCssFilter += dropShadowStr;
            }
          }

          if (innerCssFilter.trim()) {
            inner.style.setProperty('filter', innerCssFilter.trim(), 'important');
          } else {
            inner.style.removeProperty('filter');
          }
          if (outerCssFilter.trim()) {
            element.style.setProperty('filter', outerCssFilter.trim(), 'important');
          } else {
            element.style.removeProperty('filter');
          }

          if (hasClipContent) {
            const rx = element.getAttribute('rx') || '0';
            const roundStr = rx !== '0' && rx !== '0px' ? ` round ${parseFloat(rx)}px` : '';
            inner.style.setProperty('clip-path', `inset(0% 0% 0% 0%${roundStr})`, 'important');
          } else {
            inner.style.removeProperty('clip-path');
          }

          if (hasBackgroundBlur) {
            const bBlur = getVal('data-effect-background-blur-value', '10');
            inner.style.setProperty('backdrop-filter', `blur(${bBlur}px)`, 'important');
            inner.style.setProperty('-webkit-backdrop-filter', `blur(${bBlur}px)`, 'important');
          } else {
            inner.style.removeProperty('backdrop-filter');
            inner.style.removeProperty('-webkit-backdrop-filter');
          }
        }
      }

      element.removeAttribute('filter');
      if (filterEl) filterEl.remove();
      return;
    }

    // We chain effects by tracking the graphic layer
    let currentIn = "SourceGraphic";

    // 1. Layer Blur (Applied FIRST if Clip Content is ON)
    if (hasBlur && hasClipContent) {
      const blurVal = parseFloat(getVal('data-effect-blur-value', '0.3'));
      const spreadVal = parseFloat(getVal('data-effect-blur-spread', '0'));

      let blurSource = currentIn;

      if (spreadVal !== 0) {
        const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        morph.setAttribute('operator', spreadVal >= 0 ? 'dilate' : 'erode');
        morph.setAttribute('radius', Math.abs(spreadVal));
        morph.setAttribute('in', currentIn);
        morph.setAttribute('result', 'blur_morph_first');
        filterEl.appendChild(morph);
        blurSource = "blur_morph_first";
      }

      const blurNode = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      blurNode.setAttribute('stdDeviation', blurVal);
      blurNode.setAttribute('in', blurSource);
      blurNode.setAttribute('result', 'blur_out_first');
      filterEl.appendChild(blurNode);
      currentIn = "blur_out_first";
    }

    // 2. Clip Content (Clips the blurred SourceGraphic to the original Alpha, restoring crisp stroke if needed)
    if (hasClipContent) {
      const bgStrokeWidth = parseFloat(getVal('data-bg-stroke-width', '0'));
      const textStrokeWidth = parseFloat(getVal('stroke-width', '0'));
      const strokeErodeRadius = bgStrokeWidth > 0 ? bgStrokeWidth : textStrokeWidth;
      
      let insideMask = 'SourceAlpha';

      if (strokeErodeRadius > 0 && isForeignObject) {
        const borderMorph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        borderMorph.setAttribute('operator', 'erode');
        borderMorph.setAttribute('radius', strokeErodeRadius);
        borderMorph.setAttribute('in', 'SourceAlpha');
        borderMorph.setAttribute('result', 'clip_inside_mask');
        filterEl.appendChild(borderMorph);
        insideMask = 'clip_inside_mask';
      }

      const compClip = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compClip.setAttribute('operator', 'in');
      compClip.setAttribute('in', currentIn);
      compClip.setAttribute('in2', insideMask);
      compClip.setAttribute('result', 'clipped_blur');
      filterEl.appendChild(compClip);
      currentIn = 'clipped_blur';

      if (strokeErodeRadius > 0 && isForeignObject) {
        // Extract crisp stroke from original SourceGraphic
        const crispStroke = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
        crispStroke.setAttribute('operator', 'out');
        crispStroke.setAttribute('in', 'SourceGraphic');
        crispStroke.setAttribute('in2', insideMask);
        crispStroke.setAttribute('result', 'crisp_stroke');
        filterEl.appendChild(crispStroke);
        
        // Composite crisp stroke over the blurred interior
        const restoreStroke = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
        restoreStroke.setAttribute('operator', 'over');
        restoreStroke.setAttribute('in', 'crisp_stroke');
        restoreStroke.setAttribute('in2', currentIn);
        restoreStroke.setAttribute('result', 'restored_final');
        filterEl.appendChild(restoreStroke);
        currentIn = 'restored_final';
      }
    }

    // 3. Inner Shadow (Generated from crisp Alpha, drawn OVER the blurred/clipped content)
    if (hasInnerShadow) {
      const color = getVal('data-effect-inner-shadow-color', '#000000');
      const opacity = parseFloat(getVal('data-effect-inner-shadow-opacity', '25')) / 100;
      const dx = getVal('data-effect-inner-shadow-x', '2');
      const dy = getVal('data-effect-inner-shadow-y', '2');
      const blur = parseFloat(getVal('data-effect-inner-shadow-blur', '4'));
      const spread = parseFloat(getVal('data-effect-inner-shadow-spread', '0'));
      const bgStrokeWidth = parseFloat(getVal('data-bg-stroke-width', '0'));
      const textStrokeWidth = parseFloat(getVal('stroke-width', '0'));
      const strokeErodeRadius = bgStrokeWidth > 0 ? bgStrokeWidth : textStrokeWidth;

      let baseAlpha = 'SourceAlpha';
      if (strokeErodeRadius > 0 && isForeignObject) {
        const borderMorph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        borderMorph.setAttribute('operator', 'erode');
        borderMorph.setAttribute('radius', strokeErodeRadius);
        borderMorph.setAttribute('in', 'SourceAlpha');
        borderMorph.setAttribute('result', 'base_alpha');
        filterEl.appendChild(borderMorph);
        baseAlpha = 'base_alpha';
      }

      let isSource = baseAlpha;
      if (spread !== 0) {
        const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
        morph.setAttribute('radius', Math.abs(spread));
        morph.setAttribute('in', baseAlpha);
        morph.setAttribute('result', 'is_morph');
        filterEl.appendChild(morph);
        isSource = 'is_morph';
      }

      const gauss = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      gauss.setAttribute('stdDeviation', blur);
      gauss.setAttribute('in', isSource);
      gauss.setAttribute('result', 'is_blur');
      filterEl.appendChild(gauss);

      const offset = doc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
      offset.setAttribute('dx', dx);
      offset.setAttribute('dy', dy);
      offset.setAttribute('in', 'is_blur');
      offset.setAttribute('result', 'is_offset');
      filterEl.appendChild(offset);

      const compOut = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compOut.setAttribute('operator', 'out');
      compOut.setAttribute('in', baseAlpha);
      compOut.setAttribute('in2', 'is_offset');
      compOut.setAttribute('result', 'is_inverse');
      filterEl.appendChild(compOut);

      const flood = doc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
      flood.setAttribute('flood-color', color);
      flood.setAttribute('flood-opacity', opacity);
      flood.setAttribute('result', 'is_flood');
      filterEl.appendChild(flood);

      const compIn = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compIn.setAttribute('operator', 'in');
      compIn.setAttribute('in', 'is_flood');
      compIn.setAttribute('in2', 'is_inverse');
      compIn.setAttribute('result', 'is_final');
      filterEl.appendChild(compIn);

      const compOver = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      compOver.setAttribute('operator', 'over');
      compOver.setAttribute('in', 'is_final');
      compOver.setAttribute('in2', currentIn);
      compOver.setAttribute('result', 'inner_shadow_merged');
      filterEl.appendChild(compOver);

      currentIn = "inner_shadow_merged";
    }

    // 4. Drop Shadow (Generated from crisp Alpha, merged UNDER the final result)
    if (hasDropShadow) {
      const color = getVal('data-effect-drop-shadow-color', '#000000');
      const opacity = parseFloat(getVal('data-effect-drop-shadow-opacity', '25')) / 100;
      const dx = getVal('data-effect-drop-shadow-x', '2');
      const dy = getVal('data-effect-drop-shadow-y', '2');
      const blur = parseFloat(getVal('data-effect-drop-shadow-blur', '4'));
      const spread = parseFloat(getVal('data-effect-drop-shadow-spread', '0'));

      let dsSource = 'SourceAlpha';
      if (spread !== 0) {
        const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
        morph.setAttribute('radius', Math.abs(spread));
        morph.setAttribute('in', 'SourceAlpha');
        morph.setAttribute('result', 'ds_morph');
        filterEl.appendChild(morph);
        dsSource = 'ds_morph';
      }

      const gauss = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      gauss.setAttribute('stdDeviation', blur);
      gauss.setAttribute('in', dsSource);
      gauss.setAttribute('result', 'ds_blur');
      filterEl.appendChild(gauss);

      const offset = doc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
      offset.setAttribute('dx', dx);
      offset.setAttribute('dy', dy);
      offset.setAttribute('in', 'ds_blur');
      offset.setAttribute('result', 'ds_offset');
      filterEl.appendChild(offset);

      const flood = doc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
      flood.setAttribute('flood-color', color);
      flood.setAttribute('flood-opacity', opacity);
      flood.setAttribute('result', 'ds_flood');
      filterEl.appendChild(flood);

      const comp = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      comp.setAttribute('in', 'ds_flood');
      comp.setAttribute('in2', 'ds_offset');
      comp.setAttribute('operator', 'in');
      comp.setAttribute('result', 'ds_final');
      filterEl.appendChild(comp);

      const merge = doc.createElementNS("http://www.w3.org/2000/svg", "feMerge");
      const nodeShadow = doc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      nodeShadow.setAttribute('in', 'ds_final');
      const nodeInput = doc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      nodeInput.setAttribute('in', currentIn); // Merge shadow behind the final blurred/clipped content
      merge.appendChild(nodeShadow);
      merge.appendChild(nodeInput);
      merge.setAttribute('result', 'drop_shadow_merged');
      filterEl.appendChild(merge);
      currentIn = "drop_shadow_merged";
    }

    // 5. Layer Blur (Applied LAST if Clip Content is OFF, so it blurs shadows and strokes too)
    if (hasBlur && !hasClipContent) {
      const blurVal = parseFloat(getVal('data-effect-blur-value', '0.3'));
      const spreadVal = parseFloat(getVal('data-effect-blur-spread', '0'));

      let blurSource = currentIn;

      if (spreadVal !== 0) {
        const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
        morph.setAttribute('operator', spreadVal >= 0 ? 'dilate' : 'erode');
        morph.setAttribute('radius', Math.abs(spreadVal));
        morph.setAttribute('in', currentIn);
        morph.setAttribute('result', 'blur_morph_last');
        filterEl.appendChild(morph);
        blurSource = "blur_morph_last";
      }

      const blurNode = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      blurNode.setAttribute('stdDeviation', blurVal);
      blurNode.setAttribute('in', blurSource);
      blurNode.setAttribute('result', 'blur_out_last');
      filterEl.appendChild(blurNode);
      currentIn = "blur_out_last";
    }

    const finalFilterUrl = `url(#${filterId})`;
    if (isForeignObject) {
      const inner = element.firstElementChild;
      if (inner) {
        inner.style.removeProperty('clip-path');
        inner.style.setProperty('filter', finalFilterUrl, 'important');
        element.removeAttribute('filter');
      }
    } else {
      element.setAttribute('filter', finalFilterUrl);
    }

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

