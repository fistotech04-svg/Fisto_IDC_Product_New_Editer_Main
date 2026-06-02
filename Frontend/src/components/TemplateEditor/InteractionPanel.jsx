import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import PopupTemplateSelection, { TEMPLATES } from './PopupTemplateSelection';

// Helper for international phone validation
const validatePhoneNumber = (value) => {
  if (!value) return true; // Empty is treated as valid (not yet filled)
  // Strip non-digits
  const clean = value.replace(/\D/g, '');
  if (clean.length === 0) return true;

  // Custom validation rules based on dial code
  if (clean.startsWith('91')) {
    // India: +91 followed by exactly 10 digits
    return clean.length === 12;
  }
  if (clean.startsWith('1')) {
    // US/Canada: +1 followed by exactly 10 digits
    return clean.length === 11;
  }
  if (clean.startsWith('44')) {
    // UK: +44 followed by exactly 10 digits
    return clean.length === 12;
  }

  // Generic validation rule: international numbers must be between 10 and 15 digits total
  return clean.length >= 10 && clean.length <= 15;
};


const CallInteractionInput = ({ initialValue, onSave }) => {
  const [localValue, setLocalValue] = useState(initialValue || '');
  
  const hasDigits = localValue.replace(/\D/g, '').length > 0;
  const isInvalid = !validatePhoneNumber(localValue);
  const isValidAndFilled = validatePhoneNumber(localValue) && hasDigits;

  const borderColor = isValidAndFilled ? '#22C55E' : (isInvalid ? '#EF4444' : '#D1D5DB');
  const textColor = isValidAndFilled ? '#22C55E' : (isInvalid ? '#EF4444' : '#374151');
  const bgColor = isValidAndFilled ? '#F0FDF4' : (isInvalid ? '#FEF2F2' : '#F3F4F6');

  useEffect(() => {
    setLocalValue(initialValue || '');
  }, [initialValue]);

  return (
    <div className="w-full h-full relative">
      <PhoneInput
        country={'in'}
        preferredCountries={['in', 'us', 'gb']}
        value={localValue.replace(/^\+/, '')}
        onChange={(phone) => {
          const formatted = phone.startsWith('+') ? phone : '+' + phone;
          setLocalValue(formatted);
        }}
        onBlur={() => {
          if (localValue !== initialValue) {
            onSave(localValue);
          }
        }}
        placeholder="1234567890"
        containerStyle={{
          width: '100%',
          height: '100%'
        }}
        inputStyle={{
          width: '100%',
          height: '100%',
          border: `1px solid ${borderColor}`,
          borderRadius: '0.5vw',
          fontSize: '0.8vw',
          color: textColor,
          fontWeight: '500',
          paddingLeft: '3.4vw',
          backgroundColor: '#FFFFFF',
          outline: 'none',
          boxShadow: 'none',
          transition: 'border-color 0.2s'
        }}
        buttonStyle={{
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          borderRight: 'none',
          borderRadius: '0.5vw 0 0 0.5vw',
          width: '2.8vw',
          height: '100%',
          top: '0',
          left: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0'
        }}
        dropdownStyle={{
          width: '14vw',
          maxHeight: '20vh',
          fontSize: '0.75vw',
          borderRadius: '0.4vw',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'left'
        }}
      />
      {isInvalid && (
        <div className="absolute left-[0.2vw] -bottom-[1.8vh] text-[#EF4444] text-[0.6vw] font-medium whitespace-nowrap z-10">
          Please enter the valid number *
        </div>
      )}
      {isValidAndFilled && (
        <div className="absolute right-0 -bottom-[4vh] z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(localValue);
            }}
            className="flex items-center gap-[0.3vw] bg-[#22C55E] hover:bg-[#16A34A] text-white px-[0.8vw] py-[0.5vh] rounded-[0.3vw] shadow-sm transition-colors"
          >
            <Icon icon="lucide:check" className="text-[0.9vw]" />
            <span className="text-[0.7vw] font-medium">Done</span>
          </button>
        </div>
      )}
    </div>
  );
};


const InteractionPanel = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  deleteLayer,
  pages,
  flipbookDimensions = { width: 210, height: 297 },
  onCustomizePopup
}) => {
  const [activeTemplateSelectionId, setActiveTemplateSelectionId] = useState(null);
  const [dimensionUnit, setDimensionUnit] = useState('px');
  const [openCardIds, setOpenCardIds] = useState({});
  const [isInteractionCardExpanded, setIsInteractionCardExpanded] = useState(true);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState(selectedLayerId || null);
  const [urlValue, setUrlValue] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [collapsedCardIds, setCollapsedCardIds] = useState({});
  // Immediate local override for action type so card header updates without waiting for pages re-sync
  const [cardActionOverrides, setCardActionOverrides] = useState({});

  // Immediate local overrides for input values and triggers to eliminate dropdown lag and system hang
  const [itemValueOverrides, setItemValueOverrides] = useState({});
  const [itemTriggerOverrides, setItemTriggerOverrides] = useState({});
  const [localInputValues, setLocalInputValues] = useState({});

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioPlaybackTimes, setAudioPlaybackTimes] = useState({});
  const [audioProgressPercent, setAudioProgressPercent] = useState({});
  const activeAudioRef = useRef(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  const actionTypes = [
    { id: 'open-link', label: 'Open Link', icon: 'gg:link' },
    { id: 'navigate-to', label: 'Navigate to', icon: 'famicons:navigate-circle-outline' },
    { id: 'call', label: 'Call', icon: 'fluent:call-24-regular' },
    { id: 'zoom', label: 'Zoom', icon: 'tabler:zoom-in-area' },
    { id: 'download', label: 'Download', icon: 'mynaui:download' },
    { id: 'popup', label: 'Popup', icon: 'carbon:popup' },
    { id: 'tooltip', label: 'Tooltip', icon: 'fluent:tooltip-quote-12-regular' },
    { id: '3d-viewer', label: '3D Viewer', icon: 'gis:cube-3d' },
    { id: 'audio', label: 'Audio', icon: 'iconoir:sound-high-solid' }
  ];
  const [selectedActionType, setSelectedActionType] = useState(actionTypes[0]);

  const panelStateRef = useRef({ updateElementAttribute, activePageIndex, pages, actionTypes });
  useEffect(() => {
    panelStateRef.current = { updateElementAttribute, activePageIndex, pages, actionTypes };
  });

  // Cached DOMParser DOMs for all pages to avoid expensive re-parsing on every render
  const parsedPagesDOMsRef = useRef({});

  // Keep track of the previously selected layer ID to prevent override flashes
  const prevLayerIdRef = useRef(selectedLayerId);

  // Sync activeLayerId on canvas selection
  useEffect(() => {
    if (selectedLayerId) {
      setActiveLayerId(selectedLayerId);
      if (selectedElementProps) {
        const savedVal = selectedElementProps['data-interaction-value'] || '';
        setUrlValue(savedVal);

        const interactionType = selectedElementProps['data-interaction'];
        if (interactionType) {
          setOpenCardIds(prev => {
            if (!prev[selectedLayerId]) {
              return { ...prev, [selectedLayerId]: true };
            }
            return prev;
          });
        }
      }

      setCollapsedCardIds(prev => {
        const next = { ...prev };
        setOpenCardIds(openPrev => {
          Object.keys(openPrev).forEach(id => {
            next[id] = true;
          });
          next[selectedLayerId] = false;
          return openPrev;
        });
        return next;
      });
    } else {
      setActiveLayerId(null);
      setUrlValue('');
    }

    // ONLY clear temporary local overrides if the user actually clicked a DIFFERENT element
    if (prevLayerIdRef.current !== selectedLayerId) {
      setItemValueOverrides({});
      setItemTriggerOverrides({});
      setLocalInputValues({});
      prevLayerIdRef.current = selectedLayerId;
    }
  }, [selectedLayerId, selectedElementProps]);

  // Listen for the event fired by the "Add Interaction" badge on the canvas
  useEffect(() => {
    const handleAddInteraction = (e) => {
      const elementId = e.detail?.elementId;
      if (elementId) {
        setOpenCardIds(prev => {
          setCollapsedCardIds(prevCollapsed => {
            const nextCollapsed = { ...prevCollapsed };
            Object.keys(prev).forEach(id => {
              if (id !== elementId) {
                nextCollapsed[id] = true;
              }
            });
            nextCollapsed[elementId] = false;
            return nextCollapsed;
          });
          return {
            ...prev,
            [elementId]: true
          };
        });
        setActiveLayerId(elementId);

        const { updateElementAttribute, activePageIndex, pages, actionTypes } = panelStateRef.current;
        if (updateElementAttribute) {
          let existingType = 'open-link';
          let existingVal = '';
          const page = pages?.[activePageIndex];
          if (page && page.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(page.html, 'image/svg+xml');
            const el = doc.getElementById(elementId);
            if (el) {
              existingType = el.getAttribute('data-interaction') || 'open-link';
              existingVal = el.getAttribute('data-interaction-value') || '';
            }
          }

          updateElementAttribute(activePageIndex, elementId, {
            'data-interaction': existingType,
            'data-interaction-value': existingVal
          });

          const foundAction = actionTypes.find(a => a.id === existingType);
          if (foundAction) {
            window.dispatchEvent(new CustomEvent('update-interaction-badge', {
              detail: {
                elementId: elementId,
                actionType: foundAction
              }
            }));
          }
        }
      }
    };
    window.addEventListener('add-free-frame', handleAddInteraction);
    return () => window.removeEventListener('add-free-frame', handleAddInteraction);
  }, []);

  // Broadcast visual badge state (icon/checkmark) updates to MainEditor canvas whenever elements exist, page changes, or selection changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const elements = Array.from(editorDoc.querySelectorAll('[data-interaction]'));
      elements.forEach(el => {
        const actionId = el.getAttribute('data-interaction');
        if (actionId) {
          const found = actionTypes.find(a => a.id === actionId);
          if (found) {
            window.dispatchEvent(new CustomEvent('update-interaction-badge', {
              detail: {
                elementId: el.id,
                actionType: found
              }
            }));
          }
        }
      });
    }, 40);

    return () => clearTimeout(timer);
  }, [pages, activePageIndex, selectedLayerId]);

  // Close action dropdown when clicking anywhere outside it (including canvas area)
  useEffect(() => {
    if (!openDropdownId) return;
    const handleGlobalMouseDown = (e) => {
      // If the click is NOT inside a dropdown trigger or the dropdown menu, close it
      if (!e.target.closest('[data-dropdown-trigger]') && !e.target.closest('[data-dropdown-menu]')) {
        setOpenDropdownId(null);
      }
    };
    // Use window + mousedown + capture:true so it fires before any canvas stopPropagation
    window.addEventListener('mousedown', handleGlobalMouseDown, true);
    return () => window.removeEventListener('mousedown', handleGlobalMouseDown, true);
  }, [openDropdownId]);

  // Dynamic element type and ID extraction helper
  const detectElementDisplayInfo = (id, targetPageIndex = null) => {
    if (!id) return { type: 'Element', number: '432', name: 'Element 432' };

    // 1. Try to find the element in the live DOM first (fastest and most accurate!)
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    let el = editorDoc.getElementById(id);

    // 2. If not found in live DOM, use our super fast cached parsed DOMs
    if (!el) {
      if (targetPageIndex !== null) {
        const cached = parsedPagesDOMsRef.current[targetPageIndex];
        if (cached && cached.doc) {
          el = cached.doc.getElementById(id);
        } else {
          const page = pages[targetPageIndex];
          if (page && page.html) {
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(page.html, 'image/svg+xml');
              parsedPagesDOMsRef.current[targetPageIndex] = { html: page.html, doc };
              el = doc.getElementById(id);
            } catch (e) {
              console.error("DOM Parsing failed", e);
            }
          }
        }
      } else {
        // Search all pages
        for (let i = 0; i < pages.length; i++) {
          const cached = parsedPagesDOMsRef.current[i];
          if (cached && cached.doc) {
            const found = cached.doc.getElementById(id);
            if (found) {
              el = found;
              break;
            }
          } else {
            const page = pages[i];
            if (page && page.html) {
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(page.html, 'image/svg+xml');
                parsedPagesDOMsRef.current[i] = { html: page.html, doc };
                const found = doc.getElementById(id);
                if (found) {
                  el = found;
                  break;
                }
              } catch (e) {
                console.error("DOM Parsing failed", e);
              }
            }
          }
        }
      }
    }

    // Fallback number from id
    const idNum = id.match(/\d+/)?.[0] || id.substring(Math.max(0, id.length - 3));

    if (!el) {
      return { type: 'Element', number: idNum, name: `Element ${idNum}` };
    }

    const tagName = el.tagName.toLowerCase();
    const dataType = (el.getAttribute('data-type') || '').toLowerCase();
    const dataName = (el.getAttribute('data-name') || '').toLowerCase();
    const idLower = el.id.toLowerCase();
    const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';

    let detectedType = 'Element';
    if (tagName === 'g' || tagName === 'svg') {
      const deepType = deepDetectType(el);
      if (deepType) {
        detectedType = deepType;
      } else {
        detectedType = 'Group';
      }
    } else {
      if (dataType === 'gif' || dataName.includes('gif') || idLower.includes('gif') || href.toLowerCase().endsWith('.gif')) {
        detectedType = 'GIF';
      } else if (dataType === 'video' || tagName === 'video' || idLower.includes('video')) {
        detectedType = 'Video';
      } else if (dataType === 'icon' || idLower.includes('icon') || el.classList?.contains('iconify')) {
        detectedType = 'Icon';
      } else if (tagName === 'image' || tagName === 'img' || dataType === 'image' || idLower.includes('image')) {
        detectedType = 'Image';
      } else if (tagName === 'text' || tagName === 'tspan' || dataType === 'text' || idLower.includes('text')) {
        detectedType = 'Text';
      } else if (tagName === 'rect' || tagName === 'circle' || tagName === 'ellipse' || tagName === 'path' || tagName === 'polygon' || tagName === 'polyline') {
        detectedType = 'Shape';
      }
    }

    return {
      type: detectedType,
      number: idNum,
      name: `${detectedType} ${idNum}`
    };
  };

  function detectTypeFromElement(el, id) {
    const idNum = id.match(/\d+/)?.[0] || id.substring(Math.max(0, id.length - 3));
    if (!el) return { type: 'Element', number: idNum, name: `Element ${idNum}` };

    const tagName = el.tagName.toLowerCase();
    const dataType = (el.getAttribute('data-type') || '').toLowerCase();
    const dataName = (el.getAttribute('data-name') || '').toLowerCase();
    const idLower = el.id.toLowerCase();
    const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';

    let detectedType = 'Element';
    if (tagName === 'g' || tagName === 'svg') {
      const deepType = deepDetectType(el);
      if (deepType) {
        detectedType = deepType;
      } else {
        detectedType = 'Group';
      }
    } else {
      if (dataType === 'gif' || dataName.includes('gif') || idLower.includes('gif') || href.toLowerCase().endsWith('.gif')) {
        detectedType = 'GIF';
      } else if (dataType === 'video' || tagName === 'video' || idLower.includes('video')) {
        detectedType = 'Video';
      } else if (dataType === 'icon' || idLower.includes('icon') || el.classList?.contains('iconify')) {
        detectedType = 'Icon';
      } else if (tagName === 'image' || tagName === 'img' || dataType === 'image' || idLower.includes('image')) {
        detectedType = 'Image';
      } else if (tagName === 'text' || tagName === 'tspan' || dataType === 'text' || idLower.includes('text')) {
        detectedType = 'Text';
      } else if (tagName === 'rect' || tagName === 'circle' || tagName === 'ellipse' || tagName === 'path' || tagName === 'polygon' || tagName === 'polyline') {
        detectedType = 'Shape';
      }
    }

    return {
      type: detectedType,
      number: idNum,
      name: `${detectedType} ${idNum}`
    };
  }

  // Scans all SVG DOMs across all pages to retrieve all active/added interaction cards
  const interactiveElementsList = React.useMemo(() => {
    if (!pages || pages.length === 0) return [];

    const openCardKeys = Object.keys(openCardIds).filter(id => openCardIds[id]);
    if (openCardKeys.length === 0) return [];

    const list = [];

    // Pre-populate/update the cache for all pages that changed
    pages.forEach((page, i) => {
      if (page && page.html) {
        const cached = parsedPagesDOMsRef.current[i];
        if (!cached || cached.html !== page.html) {
          try {
            const parser = new DOMParser();
            parsedPagesDOMsRef.current[i] = {
              html: page.html,
              doc: parser.parseFromString(page.html, 'image/svg+xml')
            };
          } catch (e) {
            console.error("DOM Cache Parse failed", e);
          }
        }
      }
    });

    openCardKeys.forEach(id => {
      let foundEl = null;
      let foundPageIndex = -1;

      // 1. ALWAYS check live DOM first (super fast, O(1))
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const liveEl = editorDoc.getElementById(id);
      if (liveEl) {
        foundEl = liveEl;
        foundPageIndex = activePageIndex;
      } else {
        // 2. Only if not in live DOM, use cached DOMs
        for (let i = 0; i < pages.length; i++) {
          const cached = parsedPagesDOMsRef.current[i];
          if (cached && cached.doc) {
            const el = cached.doc.getElementById(id);
            if (el) {
              foundEl = el;
              foundPageIndex = i;
              break;
            }
          }
        }
      }

      if (foundEl) {
        const info = detectTypeFromElement(foundEl, id);

        list.push({
          id: foundEl.id,
          tagName: foundEl.tagName,
          dataName: foundEl.getAttribute('data-name'),
          label: info.name,
          actionId: foundEl.getAttribute('data-interaction') || 'open-link',
          value: foundEl.getAttribute('data-interaction-value') || '',
          tooltipSettings: foundEl.getAttribute('data-tooltip-settings') || '',
          trigger: foundEl.getAttribute('data-interaction-trigger') || 'click',
          pageIndex: foundPageIndex
        });
      }
    });

    return list;
  }, [pages, openCardIds, activePageIndex]);

  const convertValue = (mmValue) => {
    const val = parseFloat(mmValue || 0);
    if (dimensionUnit === 'px') return Math.round(val * 96 / 25.4);
    if (dimensionUnit === 'cm') return (val / 10).toFixed(2);
    return Math.round(val); // mm
  };

  const handleDimensionChange = (attr, rawValue) => {
    if (!selectedElementProps) return;
    const tag = selectedElementProps.tagName;
    const finalAttr = tag === 'circle' ? 'r' : attr;

    let finalVal = rawValue;
    if (tag === 'circle') {
      finalVal = (parseFloat(rawValue) / 2).toString();
    }

    updateElementAttribute(activePageIndex, selectedLayerId, finalAttr, finalVal);
  };

  const groupId = selectedElementProps?.['data-group-id'] || '432';

  // Deep recursive helper: scan all descendants for dominant type
  function deepDetectType(el) {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase() || '';
    const dt = el.getAttribute('data-type') || '';
    const dn = (el.getAttribute('data-name') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const href = el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('src') || '';

    // Direct type checks on this element
    if (dt === 'gif' || dn.includes('gif') || id.includes('gif') || href.toLowerCase().endsWith('.gif')) return 'GIF';
    if (dt === 'video' || tag === 'video' || tag === 'iframe' || dn.includes('video')) return 'Video';
    if (dt === 'icon' || dn.includes('icon') || el.classList?.contains('iconify')) return 'Icon';
    if (tag === 'image' || tag === 'img' || dt === 'image' || dn.includes('image') || id.includes('image') || (href && !href.toLowerCase().endsWith('.gif'))) return 'Image';
    if (tag === 'text' || tag === 'tspan' || dt === 'text' || dn.includes('text') || id.includes('text')) return 'Text';
    if (tag === 'rect') return 'Rectangle';
    if (tag === 'circle') return 'Circle';
    if (tag === 'ellipse') return 'Ellipse';
    if (tag === 'path' || tag === 'polygon' || tag === 'polyline') return 'Shape';
    if (tag === 'line') return 'Line';

    // Recurse into children — prioritize specific types over generic
    const typePriority = ['GIF', 'Video', 'Icon', 'Image', 'Text', 'Rectangle', 'Circle', 'Ellipse', 'Shape', 'Line'];
    let found = null;
    for (const child of Array.from(el.children || [])) {
      const childType = deepDetectType(child);
      if (childType) {
        const ci = typePriority.indexOf(childType);
        const fi = found ? typePriority.indexOf(found) : 999;
        if (ci < fi) found = childType;
      }
    }
    return found;
  }

  // Detect element type label from props and DOM attributes
  const getElementLabel = (props) => {
    if (!props) return 'Element';

    // Try parsed active page DOM element first (most accurate and scoped to prevent duplicates!)
    let el = null;
    if (activeLayerId) {
      const cached = parsedPagesDOMsRef.current[activePageIndex];
      if (cached && cached.doc) {
        el = cached.doc.getElementById(activeLayerId);
      } else {
        const page = pages[activePageIndex];
        if (page && page.html) {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(page.html, 'image/svg+xml');
            parsedPagesDOMsRef.current[activePageIndex] = { html: page.html, doc };
            el = doc.getElementById(activeLayerId);
          } catch (e) {
            console.error("DOM label Parsing failed", e);
          }
        }
      }
    }
    // Fallback to live DOM if not parsed
    if (!el && activeLayerId) {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      el = editorDoc.getElementById(activeLayerId);
    }

    const tagName = (props.tagName || el?.tagName || '').toLowerCase();
    const dataType = (el?.getAttribute('data-type') || '').toLowerCase();
    const dataName = (el?.getAttribute('data-name') || '').toLowerCase();

    // Quick wins from props flags (set in RightSidebar)
    if (props.isText) return 'Text';
    if (props.isGif) return 'GIF';
    if (props.isVideo) return 'Video';
    if (props.isIcon) return 'Icon';
    if (props.isImage) return 'Image';

    // Check data-type/data-name on the element itself
    if (dataType === 'text' || dataName.includes('text')) return 'Text';
    if (dataType === 'gif' || dataName.includes('gif')) return 'GIF';
    if (dataType === 'video' || dataName.includes('video')) return 'Video';
    if (dataType === 'icon' || dataName.includes('icon')) return 'Icon';
    if (dataType === 'image' || dataName.includes('image')) return 'Image';

    // For groups: deep-scan all descendants
    if (tagName === 'g' || tagName === 'svg') {
      const deepType = deepDetectType(el);
      if (deepType) {
        // If group contains a single dominant type, label it as "Type Group"
        if (['Image', 'Text', 'Icon', 'GIF', 'Video'].includes(deepType)) return `${deepType} Group`;
        return deepType;
      }
      return 'Group';
    }

    // Single element fallback
    if (tagName === 'image' || tagName === 'img') return 'Image';
    if (tagName === 'text' || tagName === 'tspan') return 'Text';
    if (tagName === 'rect') return 'Rectangle';
    if (tagName === 'circle') return 'Circle';
    if (tagName === 'ellipse') return 'Ellipse';
    if (tagName === 'path' || tagName === 'polygon' || tagName === 'polyline') return 'Shape';
    if (tagName === 'line') return 'Line';
    if (tagName === 'foreignobject') return props.isVideo ? 'Video' : 'Text';

    return 'Element';
  };

  return (
    <div className="flex flex-col gap-[3vh] p-[1.5vw] bg-[#fbfbfb] h-full overflow-y-auto no-scrollbar">

      {/* Select Free Frame Section */}
      <div className="space-y-[1.5vh]">
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Select Free Frame</span>
          <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
        </div>

        <div
          onClick={() => {
            window.dispatchEvent(new CustomEvent('add-free-frame', {
              detail: { pageIndex: activePageIndex }
            }));
          }}
          className="w-[92%] mx-auto h-[11.5vh] bg-[#E5E7EB]/50 flex flex-col items-center justify-center cursor-pointer hover:bg-[#E5E7EB]/70 transition-all group relative rounded-[0.1vw] overflow-visible"
          style={{
            backgroundImage: `linear-gradient(to right, #4B5563 60%, transparent 40%), linear-gradient(to right, #4B5563 60%, transparent 40%), linear-gradient(to bottom, #4B5563 60%, transparent 40%), linear-gradient(to bottom, #4B5563 60%, transparent 40%)`,
            backgroundPosition: 'left top, left bottom, left top, right top',
            backgroundRepeat: 'repeat-x, repeat-x, repeat-y, repeat-y',
            backgroundSize: '1vw 0.1vw, 1vw 0.1vw, 0.1vw 1vw, 0.1vw 1vw'
          }}
        >
          {/* Sharp L-corners with Black Fill */}

          {/* Top Left */}
          <div className="absolute -top-[0.15vw] -left-[0.15vw] w-[0.9vw] h-[0.9vw]">
            <div className="absolute top-0 left-0 w-full h-[0.3vw] bg-black border border-black"></div>
            <div className="absolute top-0 left-0 w-[0.3vw] h-full bg-black border border-black"></div>
          </div>

          {/* Top Right */}
          <div className="absolute -top-[0.15vw] -right-[0.15vw] w-[0.9vw] h-[0.9vw]">
            <div className="absolute top-0 right-0 w-full h-[0.3vw] bg-black border border-black"></div>
            <div className="absolute top-0 right-0 w-[0.3vw] h-full bg-black border border-black"></div>
          </div>

          {/* Bottom Left */}
          <div className="absolute -bottom-[0.15vw] -left-[0.15vw] w-[0.9vw] h-[0.9vw]">
            <div className="absolute bottom-0 left-0 w-full h-[0.3vw] bg-black border border-black"></div>
            <div className="absolute bottom-0 left-0 w-[0.3vw] h-full bg-black border border-black"></div>
          </div>

          {/* Bottom Right */}
          <div className="absolute -bottom-[0.15vw] -right-[0.15vw] w-[0.9vw] h-[0.9vw]">
            <div className="absolute bottom-0 right-0 w-full h-[0.3vw] bg-black border border-black"></div>
            <div className="absolute bottom-0 right-0 w-[0.3vw] h-full bg-black border border-black"></div>
          </div>

          <span className="text-[0.9vw] font-medium text-[#4B5563] tracking-tight">Click To Add Free Frame</span>
        </div>
      </div>

      {/* Add Interaction Button */}
      {activeLayerId && !openCardIds[activeLayerId] && (
        <div className="mt-[0.5vh] flex justify-center">
          <button
            onClick={() => { }}
            className="w-[92%] mx-auto h-[5.8vh] bg-[#3F3F46] rounded-[0.5vw] flex items-center justify-center text-white shadow-sm hover:bg-[#27272A] transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="text-[0.85vw] font-semibold tracking-wide flex items-center gap-[0.4vw]">
              <span className="text-[1.2vw] font-light leading-[1]">+</span> Add Interaction to {activeLayerId ? detectElementDisplayInfo(activeLayerId).name : 'Group 432'}
            </span>
          </button>
        </div>
      )}      {/* Interactions in this Page Section */}
      <div className="space-y-[1.5vh] mt-[2vh]">
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Interactions in this Page</span>
          <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
        </div>

        {/* Interaction List */}
        <div className="flex flex-col gap-[1.5vh] pb-[2vh]">

          {interactiveElementsList.length > 0 ? (
            interactiveElementsList.map(item => {
              const isCollapsed = !!collapsedCardIds[item.id];
              const isDropdownOpen = openDropdownId === item.id;
              // Use local override (immediate) if available, else fall back to item.actionId from pages
              const resolvedActionId = cardActionOverrides[item.id] || item.actionId;
              const currentAction = actionTypes.find(a => a.id === resolvedActionId) || actionTypes[0];
              // Respect trigger and value local overrides to bypass DOM parsing lag
              const resolvedTrigger = itemTriggerOverrides[item.id] !== undefined ? itemTriggerOverrides[item.id] : (item.trigger || 'click');
              const resolvedValue = itemValueOverrides[item.id] !== undefined ? itemValueOverrides[item.id] : item.value;

              const isSelected = activeLayerId === item.id;

              let tooltipSettings = {
                text: 'Tooltip',
                textColor: '#ffffff',
                bgColor: '#1a1a1a',
                fontFamily: 'Poppins',
                fontWeight: 'Regular',
                fontSize: 14,
                align: 'center',
                bold: false,
                italic: false
              };
              if (item.tooltipSettings) {
                try {
                  tooltipSettings = { ...tooltipSettings, ...JSON.parse(item.tooltipSettings) };
                } catch (e) { }
              }

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveLayerId(item.id);
                    setCollapsedCardIds(prev => {
                      const next = { ...prev };
                      Object.keys(openCardIds).forEach(id => {
                        next[id] = true;
                      });
                      next[item.id] = false;
                      return next;
                    });
                    window.dispatchEvent(new CustomEvent('select-layer', {
                      detail: { layerId: item.id }
                    }));
                  }}
                  className={`w-full mx-auto bg-white border rounded-[0.8vw] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col relative cursor-pointer transition-all duration-200 ${isSelected
                    ? 'border-[#4A3AFF] ring-2 ring-[#4A3AFF]/15 shadow-[0_4px_16px_rgba(74,58,255,0.08)]'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >

                  {/* Card Header / Settings */}
                  <div className={`flex flex-col ${isCollapsed ? 'py-[1.5vh] px-[1.6vw]' : 'p-[1.6vw]'}`}>
                    {/* Top Row: Icon + Dropdowns */}
                    <div className="flex items-center justify-between gap-[0.8vw]">
                      <div className="flex items-center gap-[0.8vw]">
                        {/* Touch Icon */}
                        <div className="flex-shrink-0 text-gray-500 flex items-center">
                          <svg width="1.4vw" height="1.4vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7.99791H6.176C4.679 7.99791 3.93 7.99791 3.466 7.55791C3 7.12091 3 6.41391 3 5.00091C3 3.58791 3 2.88091 3.465 2.44291C3.93 2.00391 4.679 2.00391 6.176 2.00391H17.823C19.321 2.00391 20.07 2.00391 20.535 2.44291C21 2.88191 21 3.58691 21 4.99991C21 6.41291 21 7.11991 20.535 7.55891C20.07 7.99791 19.321 7.99791 17.823 7.99791H16.5" />
                            <path d="M7.42375 17.5184L6.54475 16.3864L5.42475 14.9414C4.98275 14.3964 4.90275 13.7304 5.18275 13.1414C5.28206 12.9339 5.43587 12.7573 5.62775 12.6304C6.24475 12.2234 7.09575 12.1744 7.62775 12.7114L9.59875 14.3894V6.63744C9.59875 5.77444 10.4187 5.02344 11.3447 5.02344C12.2707 5.02344 13.0967 5.77444 13.0967 6.63744V10.7274C14.6217 10.6054 17.0677 11.1684 18.5117 12.2754C19.7727 13.2404 20.5777 13.7774 19.5257 16.9554C19.1997 17.9384 18.3847 19.2914 18.2527 19.6734C18.1217 20.0534 17.9817 20.2804 18.0317 21.9934" />
                          </svg>
                        </div>

                        {/* Expanded state pills directly in header */}
                        {!isCollapsed ? (
                          <div className="flex items-center gap-[0.6vw]">
                            {/* Action selector dropdown styled as a pill */}
                            <div
                              data-dropdown-trigger="true"
                              className="h-[3.6vh] bg-[#F3F4F6] rounded-[0.5vw] flex items-center justify-center gap-[0.4vw] px-[0.8vw] cursor-pointer hover:bg-gray-200 transition-colors relative select-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(isDropdownOpen ? null : item.id);
                              }}
                            >
                              <span className="text-[0.8vw] text-gray-700 font-semibold">{currentAction.label}</span>
                              <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4" />
                              </svg>
                              {isDropdownOpen && (
                                <div data-dropdown-menu="true" className="absolute bottom-[calc(100%+0.5vh)] left-0 w-[11vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl flex flex-col py-[0.5vh] z-[100] max-h-[39vh] overflow-y-auto no-scrollbar">
                                  {actionTypes.map(action => (
                                    <div
                                      key={action.id}
                                      className="flex items-center gap-[0.8vw] px-[1vw] py-[1vh] hover:bg-gray-50 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        // Immediately update card display via local override
                                        setCardActionOverrides(prev => ({ ...prev, [item.id]: action.id }));

                                        // Defer the heavy DOM update so the dropdown closes instantly and lag is eliminated
                                        setTimeout(() => {
                                          if (updateElementAttribute) {
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, 'data-interaction', action.id);
                                          }
                                          window.dispatchEvent(new CustomEvent('update-interaction-badge', {
                                            detail: {
                                              elementId: item.id,
                                              actionType: action
                                            }
                                          }));
                                        }, 50);
                                      }}
                                    >
                                      <Icon icon={action.icon} className="text-gray-600 text-[1.2vw]" />
                                      <span className="text-[0.85vw] text-gray-700 font-medium">{action.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Trigger Pill */}
                            {resolvedActionId === 'tooltip' ? (
                              <div className="h-[3.6vh] px-[0.8vw] bg-[#F3F4F6] rounded-[0.5vw] flex items-center justify-center cursor-pointer select-none relative pr-[1.6vw]">
                                <select
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  value={resolvedTrigger}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setItemTriggerOverrides(prev => ({ ...prev, [item.id]: val }));
                                    setTimeout(() => {
                                      if (updateElementAttribute) {
                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                        updateElementAttribute(targetIdx, item.id, {
                                          'data-interaction-trigger': val
                                        });
                                      }
                                    }, 50);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="click">Click</option>
                                  <option value="hover">Hover</option>
                                </select>
                                <span className="text-[0.8vw] text-gray-700 font-semibold capitalize pointer-events-none">{item.trigger || 'click'}</span>
                                <Icon icon="lucide:chevron-down" className="text-gray-500 text-[0.8vw] absolute right-[0.4vw] pointer-events-none" />
                              </div>
                            ) : (
                              <div className="h-[3.6vh] px-[0.8vw] bg-[#F3F4F6] rounded-[0.5vw] flex items-center justify-center cursor-default select-none">
                                <span className="text-[0.8vw] text-gray-700 font-semibold">Click</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[0.95vw] font-medium text-gray-800 select-none">{currentAction.label}</span>
                        )}
                      </div>

                      {/* Collapse/Expand Toggle Chevron */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedCardIds(prev => {
                            const isNowCollapsed = !prev[item.id];
                            if (isNowCollapsed && resolvedActionId === 'tooltip') {
                              window.dispatchEvent(new CustomEvent('hide-tooltip-customization'));
                            }
                            return { ...prev, [item.id]: isNowCollapsed };
                          });
                        }}
                        className={`flex-shrink-0 cursor-pointer text-gray-800 hover:text-black transition-transform duration-200 p-[0.2vw] ${isCollapsed ? 'rotate-180' : ''}`}
                      >
                        <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </div>
                    </div>

                    {/* Input Row */}
                    {!isCollapsed && (
                      <div className="flex flex-col gap-[1.5vh] w-full mt-[2vh]">
                        {/* Label + Arrow row */}
                        <div className="flex items-center gap-[0.5vw] w-full">
                          <div className="h-[4vh] px-[0.6vw] bg-[#F3F4F6] rounded-[0.4vw] flex items-center justify-center flex-shrink-0 max-w-[5vw] overflow-hidden">
                            <span className="text-[0.7vw] text-gray-600 font-medium truncate">{item.label}</span>
                          </div>

                          <span className="text-gray-400 shrink-0 select-none tracking-widest font-mono">---&gt;</span>

                            {resolvedActionId === 'navigate-to' ? (
                              <div className="w-[8.5vw] flex-shrink-0 h-[4vh] border border-gray-300 rounded-[0.4vw] flex items-center px-[0.6vw] bg-white overflow-hidden relative">
                                <select
                                  value={resolvedValue || '1'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setItemValueOverrides(prev => ({ ...prev, [item.id]: val }));
                                    setTimeout(() => {
                                      if (updateElementAttribute) {
                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                        updateElementAttribute(targetIdx, item.id, {
                                          'data-interaction': 'navigate-to',
                                          'data-interaction-value': val
                                        });
                                      }
                                    }, 50);
                                  }}
                                  onClick={(e) => e.stopPropagation()} // Prevent card selection click trigger
                                  className="w-full h-full text-[0.8vw] text-gray-700 bg-transparent outline-none cursor-pointer appearance-none pr-[1.8vw] font-medium"
                                >
                                  {Array.from({ length: pages?.length || 0 }, (_, i) => (
                                    <option key={i + 1} value={(i + 1).toString()}>
                                      Page {i + 1}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                  <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </div>
                              </div>
                            ) : resolvedActionId === 'download' ? (
                              (() => {
                                let fileMeta = null;
                                try {
                                  if (item.value && item.value.startsWith('{')) {
                                    fileMeta = JSON.parse(item.value);
                                  }
                                } catch (e) { }

                                return (
                                  <div className="flex-1 flex flex-col items-center justify-center gap-[0.5vh]" onClick={(e) => e.stopPropagation()}>
                                    {/* Hidden file input */}
                                    <input
                                      type="file"
                                      id={`download-upload-${item.id}`}
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && file.type.startsWith('image/') && updateElementAttribute) {
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            const base64Data = reader.result;
                                            const storedVal = JSON.stringify({
                                              name: file.name,
                                              type: file.type,
                                              size: file.size,
                                              data: base64Data
                                            });
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, {
                                              'data-interaction': 'download',
                                              'data-interaction-value': storedVal
                                            });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />

                                    {/* Dropzone Area */}
                                    <div
                                      onClick={() => document.getElementById(`download-upload-${item.id}`)?.click()}
                                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#5145F6]', 'bg-[#5145F6]/5'); }}
                                      onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#5145F6]', 'bg-[#5145F6]/5'); }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-[#5145F6]', 'bg-[#5145F6]/5');
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && file.type.startsWith('image/') && updateElementAttribute) {
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            const storedVal = JSON.stringify({
                                              name: file.name,
                                              type: file.type,
                                              size: file.size,
                                              data: reader.result
                                            });
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, {
                                              'data-interaction': 'download',
                                              'data-interaction-value': storedVal
                                            });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className={
                                        fileMeta
                                          ? "w-[7.5vw] h-[8.5vh] border-[1.8px] border-dashed border-gray-400 rounded-[1vw] bg-[#F4F5F7] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden p-[0.3vw]"
                                          : "w-full h-[10vh] border-2 border-dashed border-[#A0AEC0] rounded-[0.8vw] bg-[#F9FAFB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all gap-[0.5vh] px-[0.5vw]"
                                      }
                                    >
                                      {fileMeta ? (
                                        (() => {
                                          const isImage = fileMeta.type?.startsWith('image/') || fileMeta.name?.match(/\.(jpg|jpeg|png|gif)$/i);
                                          if (isImage && fileMeta.data) {
                                            return <img src={fileMeta.data} alt={fileMeta.name} className="w-full h-full object-contain" />;
                                          }
                                          return (
                                            <Icon icon="fluent:document-checkmark-24-regular" className="text-[#5145F6] text-[2vw]" />
                                          );
                                        })()
                                      ) : (
                                        <>
                                          <Icon icon="solar:upload-linear" className="text-gray-400 text-[1.5vw]" />
                                          <span className="text-[0.7vw] text-[#4A5568] font-medium text-center">
                                            Drag & Drop or <span className="text-[#5145F6] font-bold">Upload</span>
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    {/* Subtext */}
                                    <span className={`text-[0.6vw] font-medium text-gray-500 mt-[0.2vh] truncate text-center ${fileMeta ? 'w-[7.5vw]' : 'w-full'}`} title={fileMeta?.name}>
                                      {fileMeta ? fileMeta.name : 'File Format : JPG, PNG'}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'call' ? (
                              (() => {
                                const val = item.value || '';
                                return (
                                  <div
                                    className="w-[9.2vw] flex-shrink-0 h-[4.2vh] relative"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <CallInteractionInput
                                      initialValue={val}
                                      onSave={(newValue) => {
                                        if (updateElementAttribute) {
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction': 'call',
                                            'data-interaction-value': newValue
                                          });
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'tooltip' ? (
                              <div
                                className="flex-grow flex items-center justify-end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLayerId(item.id);
                                  window.dispatchEvent(new CustomEvent('select-layer', {
                                    detail: { layerId: item.id }
                                  }));
                                }}
                              >
                                <div className="w-[8.2vw] h-[7.2vh] border border-gray-400 rounded-[0.4vw] bg-white flex items-center justify-center relative cursor-pointer hover:border-indigo-400 transition-all duration-200">
                                  <div className="flex flex-col items-center select-none w-[80%]">
                                    <div className="w-full h-[3.2vh] bg-[#262626] rounded-[0.2vw] flex items-center justify-center text-white text-[0.8vw] font-normal leading-none">
                                      Tooltip
                                    </div>
                                    <div
                                      style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '5px solid transparent',
                                        borderRight: '5px solid transparent',
                                        borderTop: '6px solid #262626',
                                        marginTop: '-1px'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : resolvedActionId === 'audio' ? (
                              (() => {
                                let audioMeta = null;
                                try {
                                  if (resolvedValue && resolvedValue.startsWith('{')) {
                                    audioMeta = JSON.parse(resolvedValue);
                                  }
                                } catch (e) { }
                                const hasAudio = !!resolvedValue;
                                const audioName = audioMeta ? audioMeta.name : (resolvedValue ? resolvedValue.split('/').pop() : 'Audio File');
                                return (
                                  <div className="flex-grow flex flex-col items-end justify-center gap-[0.5vh]" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="file"
                                      id={`audio-upload-${item.id}`}
                                      className="hidden"
                                      accept="audio/*,.mp3,.wav,.m4a,.ogg"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && updateElementAttribute) {
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            const base64Data = reader.result;
                                            const tempAudio = new Audio(base64Data);
                                            const saveAudioMetadata = (durationStr) => {
                                              const storedVal = JSON.stringify({ name: file.name, type: file.type || 'audio/mpeg', size: file.size, duration: durationStr, data: base64Data });
                                              setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                              updateElementAttribute(targetIdx, item.id, { 'data-interaction': 'audio', 'data-interaction-value': storedVal });
                                            };
                                            tempAudio.onloadedmetadata = () => {
                                              const durationSec = tempAudio.duration;
                                              let durationStr = '3:15';
                                              if (!isNaN(durationSec) && isFinite(durationSec)) {
                                                const mins = Math.floor(durationSec / 60);
                                                const secs = Math.floor(durationSec % 60);
                                                durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                                              }
                                              saveAudioMetadata(durationStr);
                                            };
                                            tempAudio.onerror = () => { saveAudioMetadata('3:15'); };
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    {hasAudio ? (
                                      <div className="flex items-center" title={audioName}>
                                        {(() => {
                                          const isPlaying = playingAudioId === item.id;
                                          return (
                                            <div
                                              className="relative w-[5.6vw] h-[5.6vw] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200"
                                              onClick={() => {
                                                if (isPlaying) {
                                                  if (activeAudioRef.current) activeAudioRef.current.pause();
                                                  setPlayingAudioId(null);
                                                } else {
                                                  if (activeAudioRef.current) activeAudioRef.current.pause();
                                                  const audioSrc = audioMeta?.data || resolvedValue;
                                                  if (audioSrc) {
                                                    try {
                                                      const audio = new Audio(audioSrc);
                                                      activeAudioRef.current = audio;
                                                      setPlayingAudioId(item.id);
                                                      setAudioPlaybackTimes(prev => ({ ...prev, [item.id]: '0:00' }));
                                                      setAudioProgressPercent(prev => ({ ...prev, [item.id]: 0 }));
                                                      audio.ontimeupdate = () => {
                                                        const cur = audio.currentTime;
                                                        const tot = audio.duration || 1;
                                                        const mins = Math.floor(cur / 60);
                                                        const secs = Math.floor(cur % 60);
                                                        setAudioPlaybackTimes(prev => ({ ...prev, [item.id]: `${mins}:${secs < 10 ? '0' : ''}${secs}` }));
                                                        setAudioProgressPercent(prev => ({ ...prev, [item.id]: (cur / tot) * 100 }));
                                                      };
                                                      audio.play().catch(err => { console.error("Audio playback failed", err); setPlayingAudioId(null); });
                                                      audio.onended = () => { setPlayingAudioId(null); setAudioPlaybackTimes(prev => ({ ...prev, [item.id]: '0:00' })); setAudioProgressPercent(prev => ({ ...prev, [item.id]: 0 })); };
                                                    } catch (err) { console.error("Failed to construct Audio", err); }
                                                  }
                                                }
                                              }}
                                            >
                                              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none drop-shadow-sm" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="46" stroke="#D1D5DB" strokeWidth="4.5" fill="none" />
                                                <circle cx="50" cy="50" r="46" stroke={isPlaying ? "#4A3AFF" : "#818CF8"} strokeWidth="4.5" fill="none" strokeDasharray="289.02" strokeDashoffset={289.02 - ((audioProgressPercent[item.id] || 0) / 100) * 289.02} strokeLinecap="round" className="transition-all duration-300 ease-linear" />
                                              </svg>
                                              <div className="absolute inset-0 m-[4px] bg-white rounded-full flex flex-col items-center justify-center pointer-events-none">
                                                <Icon icon="iconoir:sound-high-solid" className="text-black text-[1.6vw] mb-[0.3vh]" />
                                                <span className="text-[0.6vw] text-gray-600 font-medium tracking-wide leading-none select-none">
                                                  {audioPlaybackTimes[item.id] || '0:00'} / {audioMeta?.duration || '3:15'}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center">
                                        <div
                                          onClick={() => document.getElementById(`audio-upload-${item.id}`)?.click()}
                                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#5145F6]', 'bg-[#5145F6]/5'); }}
                                          onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#5145F6]', 'bg-[#5145F6]/5'); }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-[#5145F6]', 'bg-[#5145F6]/5');
                                            const file = e.dataTransfer.files?.[0];
                                            const isAudio = file && (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.m4a') || file.name.toLowerCase().endsWith('.ogg'));
                                            if (isAudio && updateElementAttribute) {
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                const base64Data = reader.result;
                                                const tempAudio = new Audio(base64Data);
                                                const saveAudioMetadata = (durationStr) => {
                                                  const storedVal = JSON.stringify({ name: file.name, type: file.type || 'audio/mpeg', size: file.size, duration: durationStr, data: base64Data });
                                                  setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                                  const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                  updateElementAttribute(targetIdx, item.id, { 'data-interaction': 'audio', 'data-interaction-value': storedVal });
                                                };
                                                tempAudio.onloadedmetadata = () => {
                                                  const durationSec = tempAudio.duration;
                                                  let durationStr = '3:15';
                                                  if (!isNaN(durationSec) && isFinite(durationSec)) { const mins = Math.floor(durationSec / 60); const secs = Math.floor(durationSec % 60); durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`; }
                                                  saveAudioMetadata(durationStr);
                                                };
                                                tempAudio.onerror = () => { saveAudioMetadata('3:15'); };
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                          className="w-[10.5vw] h-[8.5vh] border-[1.8px] border-dashed border-gray-400 rounded-[1vw] bg-[#F4F5F7] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all gap-[0.5vh] p-[0.3vw]"
                                        >
                                          <Icon icon="material-symbols:audio-file" className="text-gray-500 text-[1.8vw]" />
                                          <span className="text-[0.75vw] text-gray-600 font-normal text-center leading-none select-none">
                                            Drag &amp; Drop or <span className="text-[#4A3AFF] font-semibold">Upload</span>
                                          </span>
                                        </div>
                                        <span className="text-[0.65vw] text-gray-500 font-normal mt-[0.5vh] text-center select-none">File Format : MP3,</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'popup' ? (
                              <div
                                onClick={(e) => { e.stopPropagation(); setActiveTemplateSelectionId(item.id); }}
                                className="flex-1 h-[7vh] border-[1.5px] border-dashed border-[#A0AEC0] rounded-[0.6vw] bg-[#F9FAFB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group relative overflow-hidden"
                              >
                                {resolvedValue ? (
                                  <div className="relative w-full h-full rounded-[0.4vw] overflow-hidden group">
                                    <img
                                      src={TEMPLATES.find(tpl => tpl.id === resolvedValue)?.image || ''}
                                      alt="Selected Template"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-[0.5vw] z-10 backdrop-blur-sm">
                                      <button
                                        className="p-[0.3vw] bg-white rounded-[0.3vw] hover:bg-gray-100 transition-colors shadow-sm"
                                        title="Change Template"
                                        onClick={(e) => { e.stopPropagation(); setActiveTemplateSelectionId(item.id); }}
                                      >
                                        <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#4A3AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M12 20h9" />
                                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                      </button>
                                      <button
                                        className="p-[0.3vw] bg-white rounded-[0.3vw] hover:bg-red-50 transition-colors shadow-sm"
                                        title="Delete Template"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setItemValueOverrides(prev => ({ ...prev, [item.id]: null }));
                                          if (updateElementAttribute) {
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, { 'data-interaction-value': null });
                                          }
                                        }}
                                      >
                                        <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 6h18" />
                                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <svg width="1.4vw" height="1.4vw" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#4A3AFF] transition-colors mb-[0.2vh]">
                                      <rect x="3" y="4" width="18" height="4" rx="1" />
                                      <rect x="3" y="10" width="7" height="10" rx="1" />
                                      <line x1="13" y1="11" x2="21" y2="11" />
                                      <line x1="13" y1="15" x2="21" y2="15" />
                                      <line x1="13" y1="19" x2="18" y2="19" />
                                    </svg>
                                    <span className="text-[0.6vw] text-[#4B5563] font-medium group-hover:text-gray-700 transition-colors select-none text-center leading-tight">
                                      Click to Choose <span className="text-[#4A3AFF] font-semibold">Template</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : resolvedActionId === 'zoom' ? (
                              <div className="flex-1 flex flex-col items-center justify-center gap-[0.5vh] w-full h-[10vh] border-2 border-dashed border-[#A0AEC0] rounded-[0.8vw] bg-[#F9FAFB] cursor-pointer hover:bg-gray-50 transition-all">
                                <Icon icon="tabler:zoom-in-area" className="text-gray-500 text-[1.8vw] mb-[0.2vh]" />
                                <span className="text-[0.7vw] text-[#4A5568] font-medium text-center">
                                  Customize <span className="text-[#5145F6] font-bold">Zoom Frame</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex-1 h-[4vh] border border-gray-300 rounded-[0.4vw] flex items-center px-[0.6vw] bg-white overflow-hidden">
                                <input
                                  type="text"
                                  placeholder="Enter URL..."
                                  value={localInputValues[item.id] !== undefined ? localInputValues[item.id] : (resolvedValue || '')}
                                  className="w-full text-[0.8vw] text-gray-700 placeholder-gray-400 bg-transparent outline-none truncate"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalInputValues(prev => ({ ...prev, [item.id]: val }));
                                  }}
                                  onBlur={() => {
                                    const val = localInputValues[item.id];
                                    if (val !== undefined && val !== item.value) {
                                      if (updateElementAttribute) {
                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                        updateElementAttribute(targetIdx, item.id, {
                                          'data-interaction': resolvedActionId,
                                          'data-interaction-value': val
                                        });
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.target.blur();
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>

                        {/* Popup extra options */}
                        {resolvedActionId === 'popup' && (
                          <div className="flex flex-col gap-[1.5vh] w-full mt-[0.5vh]">
                            {/* Animation Section Header */}
                            <div className="flex items-center gap-[0.5vw] w-full">
                              <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Animation</span>
                              <div className="h-[0.1vh] flex-1 bg-gray-200"></div>
                            </div>

                            {/* Animation Dropdown */}
                            <div className="relative w-full">
                              <select
                                value={item.popupAnimation || 'Fade In /Out'}
                                onChange={(e) => {
                                  if (updateElementAttribute) {
                                    const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                    updateElementAttribute(targetIdx, item.id, {
                                      'data-interaction-popup-animation': e.target.value
                                    });
                                  }
                                }}
                                className="w-full h-[4.5vh] px-[1vw] text-[0.8vw] text-gray-600 border border-[#C5C5C5] rounded-[0.6vw] bg-white outline-none focus:border-[#4A3AFF] appearance-none pr-[2.5vw] font-medium shadow-sm hover:border-gray-400 transition-colors cursor-pointer"
                              >
                                <option value="Fade In /Out">Fade In /Out</option>
                                <option value="Slide Up">Slide Up</option>
                                <option value="Slide Down">Slide Down</option>
                                <option value="Zoom In">Zoom In</option>
                              </select>
                              <div className="absolute right-[1vw] top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </div>
                            </div>

                            {/* Animation Speed Dropdown */}
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[0.85vw] text-gray-700 font-medium whitespace-nowrap">Animation Speed :</span>
                              <div className="relative w-[9vw]">
                                <select
                                  className="w-full appearance-none h-[4.5vh] px-[1vw] pr-[1vw] text-[0.8vw] text-gray-600 border border-[#C5C5C5] rounded-[0.6vw] bg-white outline-none focus:border-[#4A3AFF] pr-[2.5vw] font-medium shadow-sm hover:border-gray-400 transition-colors cursor-pointer"
                                  value={item.popupSpeed || 'Medium'}
                                  onChange={(e) => {
                                    if (updateElementAttribute) {
                                      const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                      updateElementAttribute(targetIdx, item.id, {
                                        'data-interaction-popup-speed': e.target.value
                                      });
                                    }
                                  }}
                                >
                                  <option value="Slow">Slow</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Fast">Fast</option>
                                </select>
                                <div className="absolute right-[1vw] top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Zoom speed row */}
                        {resolvedActionId === 'zoom' && (
                          <div className="flex items-center justify-between w-full mt-[1vh]">
                            <span className="text-[0.85vw] text-gray-600 font-medium whitespace-nowrap">Zoom Speed :</span>
                            <div className="relative w-[12vw]">
                              <select
                                className="w-full appearance-none h-[4vh] px-[0.8vw] text-[0.8vw] text-gray-600 border border-gray-300 rounded-[0.4vw] bg-white outline-none focus:border-[#5145F6]"
                                value={resolvedValue || 'Medium'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemValueOverrides(prev => ({ ...prev, [item.id]: val }));
                                  setTimeout(() => {
                                    if (updateElementAttribute) {
                                      const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                      updateElementAttribute(targetIdx, item.id, {
                                        'data-interaction': 'zoom',
                                        'data-interaction-value': val
                                      });
                                    }
                                  }, 50);
                                }}
                              >
                                <option value="Slow">Slow</option>
                                <option value="Medium">Medium</option>
                                <option value="Fast">Fast</option>
                              </select>
                              <Icon icon="lucide:chevron-down" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 text-[1vw] pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer (Highlight Component) */}
                  {!isCollapsed && (
                    <div className="bg-[#F9FAFB] border-t border-gray-100 p-[1.6vw] flex items-center justify-between rounded-b-[0.8vw]">
                      <div className="flex items-center gap-[0.6vw]">
                        {/* Custom Radio Button */}
                        <div className="w-[1.2vw] h-[1.2vw] rounded-full border-2 border-[#5145F6] flex items-center justify-center bg-white">
                          <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#5145F6]"></div>
                        </div>
                        <span className="text-[0.8vw] text-gray-600 font-medium">Highlight the Component</span>
                      </div>

                      {/* Trash Icon */}
                      <button
                        onClick={() => {
                          setOpenCardIds(prev => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          });
                          
                          if (item.dataName === 'Free Frame') {
                             if (deleteLayer) {
                               const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                               deleteLayer(targetIdx, item.id);
                             }
                             // Manually remove badge since element is destroyed
                             const badge = document.getElementById(`interaction-badge-${item.id}`);
                             if (badge) badge.remove();
                          } else {
                            if (updateElementAttribute) {
                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                              updateElementAttribute(targetIdx, item.id, {
                                'data-interaction': null,
                                'data-interaction-value': null
                              });
                            }
                            // Fire event to reset canvas badge visual state
                            window.dispatchEvent(new CustomEvent('update-interaction-badge', {
                              detail: {
                                elementId: item.id,
                                actionType: null
                              }
                            }));
                          }
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center w-[1.5vw] h-[1.5vw] rounded-full hover:bg-red-50"
                      >
                        <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="text-center text-[0.8vw] text-gray-400 py-[2vh]">
              Select an element to configure interactions
            </div>
          )}

        </div>
      </div>

      {/* Popup Template Selection Gallery Modal */}
      <PopupTemplateSelection
        isOpen={activeTemplateSelectionId !== null}
        onClose={() => setActiveTemplateSelectionId(null)}
        onCustomize={(templateId) => {
          if (onCustomizePopup) {
            onCustomizePopup(templateId, activeTemplateSelectionId, activePageIndex);
          }
          setActiveTemplateSelectionId(null);
        }}
        onSelect={(templateId) => {
          if (updateElementAttribute && activeTemplateSelectionId) {
            setItemValueOverrides(prev => ({ ...prev, [activeTemplateSelectionId]: templateId }));
            updateElementAttribute(activePageIndex, activeTemplateSelectionId, {
              'data-interaction': 'popup',
              'data-interaction-value': templateId
            });
          }
        }}
        selectedTemplateId={
          activeTemplateSelectionId
            ? (itemValueOverrides[activeTemplateSelectionId] !== undefined
              ? itemValueOverrides[activeTemplateSelectionId]
              : interactiveElementsList.find(item => item.id === activeTemplateSelectionId)?.value)
            : ''
        }
      />

    </div>
  );
};

export default React.memo(InteractionPanel);