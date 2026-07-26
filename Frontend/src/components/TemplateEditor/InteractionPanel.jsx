import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import PopupTemplateSelection, { TEMPLATES } from './PopupTemplateSelection';
import ModelGalleryModal from '../ThreedEditor/Components/ModelGalleryModal';
import AlertModal from '../AlertModal';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { resolveUploadsPath } from '../../utils/supabaseUtils';
import { motion, AnimatePresence } from 'framer-motion';
const GlbModel = ({ url }) => {
  const { scene } = useGLTF(url);
  return (
    <Canvas camera={{ fov: 50 }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <Stage environment="city" adjustCamera intensity={1}>
        <primitive object={scene} />
      </Stage>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
    </Canvas>
  );
};

const GlbThumbnail = ({ dataUrl }) => {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!dataUrl) return;
    let active = true;
    let url = null;

    // Convert base64 data URL to Blob URL to prevent memory leaks and parsing issues in useGLTF
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => {
        if (active) setBlobUrl(dataUrl);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [dataUrl]);

  if (!blobUrl) return <div className="w-full h-full flex items-center justify-center text-[0.7vw] text-[#5145F6] font-medium animate-pulse">Loading...</div>;
  return (
    <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[0.7vw] text-[#5145F6] font-medium animate-pulse">Rendering...</div>}>
      <GlbModel url={blobUrl} />
    </React.Suspense>
  );
};

// Helper for international phone validation
const validatePhoneNumber = (value) => {
  if (!value) return true; // Empty is treated as valid (not yet filled)
  // Strip non-digits
  const clean = value.replace(/\D/g, '');
  if (clean.length === 0) return true;

  // Custom validation rules based on dial code
  if (clean.startsWith('91')) {
    // India: +91 followed by exactly 10 digits starting with 6, 7, 8, or 9
    return clean.length === 12 && /^[6-9]/.test(clean.substring(2));
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
  const [isSaved, setIsSaved] = useState(true);

  const hasDigits = localValue.replace(/\D/g, '').length > 0;
  const isInvalid = !validatePhoneNumber(localValue);
  const isValidAndFilled = validatePhoneNumber(localValue) && hasDigits;
  const isUnsavedValid = isValidAndFilled && !isSaved;

  const borderColor = isUnsavedValid ? '#22C55E' : (isInvalid ? '#EF4444' : '#D1D5DB');
  const textColor = isUnsavedValid ? '#22C55E' : (isInvalid ? '#EF4444' : '#374151');
  const bgColor = isUnsavedValid ? '#F0FDF4' : (isInvalid ? '#FEF2F2' : '#F3F4F6');

  useEffect(() => {
    setLocalValue(initialValue || '');
    setIsSaved(true);
  }, [initialValue]);

  return (
    <div className="w-full h-full relative">
      <PhoneInput
        country={'in'}
        preferredCountries={['in', 'us', 'gb']}
        countryCodeEditable={false}
        value={localValue.replace(/^\+/, '')}
        onChange={(phone) => {
          const formatted = phone.startsWith('+') ? phone : '+' + phone;
          setLocalValue(formatted);
          setIsSaved(false);
        }}
        onBlur={() => {
          if (localValue !== initialValue) {
            onSave(localValue);
            setIsSaved(true);
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
          borderRadius: '0.6vw',
          fontSize: '0.85vw',
          color: textColor,
          fontWeight: '500',
          paddingLeft: '3.4vw',
          backgroundColor: '#FFFFFF',
          outline: 'none',
          boxShadow: isUnsavedValid ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}
        buttonStyle={{
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          borderRight: 'none',
          borderRadius: '0.6vw 0 0 0.6vw',
          width: '3vw',
          height: '100%',
          top: '0',
          left: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          transition: 'all 0.3s ease'
        }}
        dropdownStyle={{
          width: '14vw',
          maxHeight: '20vh',
          fontSize: '0.8vw',
          borderRadius: '0.6vw',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB',
          textAlign: 'left'
        }}
      />
      {isInvalid && (
        <div className="absolute left-[0.2vw] -bottom-[1.8vh] text-[#EF4444] text-[0.6vw] font-medium whitespace-nowrap z-10">
          Please enter the valid number *
        </div>
      )}
      {isUnsavedValid && (
        <div className="absolute right-0 -bottom-[4vh] z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(localValue);
              setIsSaved(true);
            }}
            className="flex items-center gap-[0.3vw] bg-[#22C55E] hover:bg-[#16A34A] text-white px-[0.8vw] py-[0.5vh] rounded-[0.3vw] shadow-sm transition-colors"
          >
            <Icon icon="lucide:check" className="text-[0.9vw]" />
            <span className="text-[0.75vw] font-medium">Done</span>
          </button>
        </div>
      )}
    </div>
  );
};


const ActionDropdown = ({ item, currentAction, actionTypes, isDropdownOpen, setOpenDropdownId, updateElementAttribute, activePageIndex, setCardActionOverrides, setItemValueOverrides, setLocalInputValues, setTooltipSettingsOverrides }) => {
  const triggerRef = useRef(null);
  const [dropdownStyles, setDropdownStyles] = useState({});

  useEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: 'fixed',
        left: `${rect.left}px`,
        bottom: `${window.innerHeight - rect.top + 5}px`, // Open upwards, 5px gap
        width: '11vw',
        zIndex: 999999
      });
    } else {
      setDropdownStyles({});
    }
  }, [isDropdownOpen]);

  // Close dropdown when scrolling to avoid detached floating menu
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleScroll = (e) => {
      // Don't close if scrolling inside the dropdown itself
      if (e.target.closest && e.target.closest('[data-dropdown-menu="true"]')) return;
      setOpenDropdownId(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isDropdownOpen, setOpenDropdownId]);

  return (
    <>
      <div
        ref={triggerRef}
        data-dropdown-trigger="true"
        className="py-[0.7vh] bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:border-[#5145F6]/40 rounded-[0.5vw] flex items-center justify-center gap-[0.4vw] px-[0.8vw] cursor-pointer transition-all duration-300 relative select-none group"
        onClick={(e) => {
          e.stopPropagation();
          setOpenDropdownId(isDropdownOpen ? null : item.id);
        }}
      >
        <span className="text-[0.85vw] text-gray-700 font-medium font-sans group-hover:text-[#5145F6] transition-colors">{currentAction.label}</span>
        <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" className="stroke-gray-500 group-hover:stroke-[#5145F6] transition-colors" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4" />
        </svg>
      </div>

      {isDropdownOpen && dropdownStyles.left && createPortal(
        <div
          data-dropdown-menu="true"
          className="bg-white/95 backdrop-blur-md border border-gray-100 rounded-[0.8vw] shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col p-[0.4vw] max-h-[39vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 origin-bottom-left"
          style={dropdownStyles}
        >
          {actionTypes.map(action => (
            <div
              key={action.id}
              className="flex items-center gap-[0.8vw] px-[0.8vw] py-[0.7vh] rounded-[0.4vw] hover:bg-indigo-50/60 cursor-pointer transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(null);
                setCardActionOverrides(prev => ({ ...prev, [item.id]: action.id }));
                if (setItemValueOverrides) setItemValueOverrides(prev => ({ ...prev, [item.id]: null }));
                if (setLocalInputValues) setLocalInputValues(prev => ({ ...prev, [item.id]: '' }));
                if (setTooltipSettingsOverrides) setTooltipSettingsOverrides(prev => ({ ...prev, [item.id]: null }));

                setTimeout(() => {
                  if (updateElementAttribute) {
                    const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                    updateElementAttribute(targetIdx, item.id, {
                      'data-interaction': action.id,
                      'data-interaction-value': null,
                      'data-tooltip-settings': null
                    });
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
        </div>,
        document.body
      )}
    </>
  );
};


const CommonDropBox = ({
  id,
  accept,
  onFileSelect,
  fileMeta, // Object or null. If null, shows empty state
  emptyIcon = "prime:upload",
  emptyTitle = <>Drag & Drop or <span className="text-[#5145F6] font-semibold hover:underline">Upload</span></>,
  subText,
  renderPreview,
  boxClassName, // override entire box classes if needed
  hideInput = false,
  isUploading = false,
}) => {
  const inputRef = useRef(null);

  return (
    <div className="flex flex-col items-center justify-center w-full relative">
      {!hideInput && (
        <input
          type="file"
          id={id}
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileSelect) onFileSelect(file);
            if (e.target) e.target.value = '';
          }}
        />
      )}
      <div
        onClick={() => { if (!isUploading) { if (inputRef.current) inputRef.current.click(); else document.getElementById(id)?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); if (!isUploading) e.currentTarget.classList.add('border-[#5145F6]', 'bg-[#5145F6]/5'); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#5145F6]', 'bg-[#5145F6]/5'); }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-[#5145F6]', 'bg-[#5145F6]/5');
          if (isUploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file && onFileSelect) onFileSelect(file);
        }}
        className={
          boxClassName || "w-full h-[11vh] border-2 border-dashed border-[#8A94A6] rounded-[0.6vw] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden p-[0.3vw] gap-[0.5vh]"
        }
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-transparent">
            <Icon icon="eos-icons:loading" className="text-[#5145F6] text-[1.8vw]" />
            <span className="text-[0.65vw] text-[#5145F6] mt-2 font-medium">Uploading...</span>
          </div>
        ) : fileMeta ? (
          renderPreview ? renderPreview(fileMeta) : (
            <>
              <Icon icon="fluent:document-checkmark-24-regular" className="text-[#5145F6] text-[2vw]" />
              <span className="text-[0.6vw] font-medium text-gray-500 mt-[0.2vh] truncate text-center w-[7vw]" title={fileMeta.name}>
                {fileMeta.name}
              </span>
            </>
          )
        ) : (
          <>
            <span className="text-[0.75vw] text-[#6B7280] font-normal text-center select-none">
              {emptyTitle}
            </span>
            <Icon icon={emptyIcon} className="text-[#6B7280] text-[1.6vw] my-[0.2vh]" />
            {subText && <span className="text-[0.65vw] text-[#9CA3AF] font-normal select-none">{subText}</span>}
          </>
        )}
      </div>
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
  onCustomizePopup,
  setIs3DModalOpen,
  setCurrent3DItem
}) => {
  const [activeTemplateSelectionId, setActiveTemplateSelectionId] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'warning', showCancel: false, confirmText: 'Okay', cancelText: 'Cancel', onConfirm: null });
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
  const [active3DGalleryItem, setActive3DGalleryItem] = useState(null);

  // Immediate local overrides for input values and triggers to eliminate dropdown lag and system hang
  const [itemValueOverrides, setItemValueOverrides] = useState({});
  const [itemTriggerOverrides, setItemTriggerOverrides] = useState({});
  const [localInputValues, setLocalInputValues] = useState({});
  const [dropdownDirectionOverrides, setDropdownDirectionOverrides] = useState({});
  const [uploadingItems, setUploadingItems] = useState({});

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioPlaybackTimes, setAudioPlaybackTimes] = useState({});
  const [audioProgressPercent, setAudioProgressPercent] = useState({});
  const [tooltipSettingsOverrides, setTooltipSettingsOverrides] = useState({});
  const activeAudioRef = useRef(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  // Clear itemValueOverrides upon save to force reloading from new absolute URLs
  useEffect(() => {
    const handleSaveComplete = () => {
      setItemValueOverrides({});
    };
    window.addEventListener('flipbook-saved', handleSaveComplete);
    return () => window.removeEventListener('flipbook-saved', handleSaveComplete);
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
      setTooltipSettingsOverrides({});
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

  // Sync existing interactions from the page HTML into openCardIds when page loads or changes
  useEffect(() => {
    if (!pages || pages.length === 0) return;
    const page = pages[activePageIndex];
    if (!page || !page.html) return;

    let doc;
    const cached = parsedPagesDOMsRef.current[activePageIndex];
    if (cached && cached.html === page.html && cached.doc) {
      doc = cached.doc;
    } else {
      try {
        const parser = new DOMParser();
        doc = parser.parseFromString(page.html, 'image/svg+xml');
      } catch (e) {
        return;
      }
    }

    const interactEls = doc.querySelectorAll('[data-interaction]');
    const newlyFoundIds = [];
    interactEls.forEach(el => {
      const type = el.getAttribute('data-interaction');
      if (el.id && type && type !== 'none') {
        newlyFoundIds.push(el.id);
      }
    });

    setOpenCardIds(prev => {
      let hasChanges = false;
      const next = {};
      newlyFoundIds.forEach(id => {
        next[id] = true;
        if (!prev[id]) {
          hasChanges = true;
        }
      });
      Object.keys(prev).forEach(id => {
        if (prev[id] && !next[id]) {
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });

    if (newlyFoundIds.length > 0) {
      setCollapsedCardIds(prev => {
        let hasChanges = false;
        const next = { ...prev };
        newlyFoundIds.forEach(id => {
          if (next[id] === undefined) {
            next[id] = (id !== selectedLayerId);
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [pages, activePageIndex, selectedLayerId]);

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

    // Search within the target page's container to avoid matching duplicate IDs from other pages
    const pageIdxToSearch = targetPageIndex !== null ? targetPageIndex : activePageIndex;
    const activeContainer = editorDoc.querySelector(`.page-svg-container[data-page-index="${pageIdxToSearch}"]`);
    let el = activeContainer ? activeContainer.querySelector(`[id="${CSS.escape(id)}"]`) : editorDoc.getElementById(id);

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
      const activeContainer = editorDoc.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const liveEl = activeContainer ? activeContainer.querySelector(`[id="${CSS.escape(id)}"]`) : editorDoc.getElementById(id);
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
      const activeContainer = editorDoc.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      el = activeContainer ? activeContainer.querySelector(`[id="${CSS.escape(activeLayerId)}"]`) : editorDoc.getElementById(activeLayerId);
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
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.4vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Select Free Frame</span>
          <div className="h-px flex-grow bg-gray-100"></div>
        </div>
        <div
          onClick={() => {
            window.dispatchEvent(new CustomEvent('add-free-frame', {
              detail: { pageIndex: activePageIndex }
            }));
          }}
          className="w-[18vw] mx-auto h-[6vw] border-[0.15vw] border-dashed border-black bg-[#E5E7EB]/40 flex flex-col items-center justify-center cursor-pointer hover:bg-[#E5E7EB]/60 transition-all group relative"
          style={{ borderDasharray: "10, 15" }}
        >
          {/* Perfect Corner markers - Top Left */}
          <div className="absolute -top-[0.225vw] -left-[0.225vw] w-[1vw] h-[1vw]">
            <div className="absolute top-0 left-0 w-full h-[0.3vw] bg-black"></div>
            <div className="absolute top-0 left-0 w-[0.3vw] h-full bg-black"></div>
          </div>
          {/* Perfect Corner markers - Top Right */}
          <div className="absolute -top-[0.225vw] -right-[0.225vw] w-[1vw] h-[1vw]">
            <div className="absolute top-0 right-0 w-full h-[0.3vw] bg-black"></div>
            <div className="absolute top-0 right-0 w-[0.3vw] h-full bg-black"></div>
          </div>
          {/* Perfect Corner markers - Bottom Left */}
          <div className="absolute -bottom-[0.225vw] -left-[0.225vw] w-[1vw] h-[1vw]">
            <div className="absolute bottom-0 left-0 w-full h-[0.3vw] bg-black"></div>
            <div className="absolute bottom-0 left-0 w-[0.3vw] h-full bg-black"></div>
          </div>
          {/* Perfect Corner markers - Bottom Right */}
          <div className="absolute -bottom-[0.225vw] -right-[0.225vw] w-[1vw] h-[1vw]">
            <div className="absolute bottom-0 right-0 w-full h-[0.3vw] bg-black"></div>
            <div className="absolute bottom-0 right-0 w-[0.3vw] h-full bg-black"></div>
          </div>

          <span className="text-[0.8vw] font-medium text-gray-600">Click To Add Free Frame</span>
        </div>
      </div>

      {/* Add Interaction Button Removed */}      {/* Interactions in this Page Section */}
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
                  className={`w-full mx-auto bg-white/70 backdrop-blur-md border rounded-[0.8vw] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col relative transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${isSelected
                    ? 'border-[#5145F6]/50 ring-2 ring-[#5145F6]/15 bg-white/95'
                    : 'border-white/40 hover:border-[#5145F6]/30'
                    }`}
                >

                  {/* Card Header / Settings */}
                  <div className="flex flex-col">
                    {/* Top Row: Icon + Dropdowns */}
                    <div className={`flex items-center justify-between gap-[0.8vw] ${isCollapsed ? 'py-[1.6vh] pl-[0.8vw] pr-[1.2vw]' : 'pt-[2vh] pl-[0.8vw] pr-[1.2vw] pb-[2vh]'}`}>
                      <div className="flex items-center gap-[0.8vw]">
                        {/* Touch Icon */}
                        <div className="flex-shrink-0 text-gray-500 flex items-center pl-[0.6vw]">
                          <Icon icon="hugeicons:touch-interaction-01" className="text-[1.4vw]" />
                        </div>

                        {/* Expanded state pills directly in header */}
                        {!isCollapsed ? (
                          <div className="flex items-center gap-[0.6vw]">
                            {/* Action selector dropdown styled as a pill */}
                            <ActionDropdown
                              item={item}
                              currentAction={currentAction}
                              actionTypes={actionTypes}
                              isDropdownOpen={isDropdownOpen}
                              setOpenDropdownId={setOpenDropdownId}
                              updateElementAttribute={updateElementAttribute}
                              activePageIndex={activePageIndex}
                              setCardActionOverrides={setCardActionOverrides}
                              setItemValueOverrides={setItemValueOverrides}
                              setLocalInputValues={setLocalInputValues}
                              setTooltipSettingsOverrides={setTooltipSettingsOverrides}
                            />

                            {/* Trigger Pill Custom Dropdown */}
                            {(() => {
                              const triggerDropId = `trigger-drop-${item.id}`;
                              const isTriggerDropOpen = openDropdownId === triggerDropId;

                              return (
                                <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div
                                    data-dropdown-trigger="true"
                                    className="py-[0.8vh] pl-[0.8vw] pr-[1.6vw] bg-[#F3F4F6] rounded-[0.5vw] flex items-center justify-center cursor-pointer select-none hover:bg-gray-200 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(isTriggerDropOpen ? null : triggerDropId);
                                    }}
                                  >
                                    <span className="text-[0.9vw] text-gray-700 font-normal font-sans capitalize">{resolvedTrigger}</span>
                                    <Icon icon="lucide:chevron-down" className={`text-gray-500 text-[0.8vw] absolute right-[0.4vw] transition-transform duration-200 ${isTriggerDropOpen ? 'rotate-180' : ''}`} />
                                  </div>

                                  {isTriggerDropOpen && (
                                    <div data-dropdown-menu="true" className="absolute right-0 top-[calc(100%+0.4vh)] z-[99999] w-full bg-white border border-gray-200 rounded-[0.5vw] shadow-xl py-[0.5vh] flex flex-col">
                                      <div
                                        className={`px-[0.8vw] py-[0.6vh] text-[0.85vw] font-sans cursor-pointer transition-colors ${resolvedTrigger === 'click' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setItemTriggerOverrides(prev => ({ ...prev, [item.id]: 'click' }));
                                          setOpenDropdownId(null);
                                          setTimeout(() => {
                                            if (updateElementAttribute) {
                                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                              updateElementAttribute(targetIdx, item.id, {
                                                'data-interaction-trigger': 'click'
                                              });
                                            }
                                          }, 50);
                                        }}
                                      >
                                        Click
                                      </div>
                                      <div
                                        className={`px-[0.8vw] py-[0.6vh] text-[0.85vw] font-sans transition-colors ${resolvedTrigger === 'hover' ? 'bg-gray-100 text-gray-900 font-medium' : ''} ${resolvedActionId !== 'tooltip' ? 'text-gray-400 cursor-not-allowed bg-gray-50/50' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (resolvedActionId !== 'tooltip') return;
                                          setItemTriggerOverrides(prev => ({ ...prev, [item.id]: 'hover' }));
                                          setOpenDropdownId(null);
                                          setTimeout(() => {
                                            if (updateElementAttribute) {
                                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                              updateElementAttribute(targetIdx, item.id, {
                                                'data-interaction-trigger': 'hover'
                                              });
                                            }
                                          }, 50);
                                        }}
                                        title={resolvedActionId !== 'tooltip' ? 'Hover is only available for Tooltip' : ''}
                                      >
                                        Hover
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-[0.95vw] font-medium text-gray-800 select-none">{currentAction.label}</span>
                        )}
                      </div>

                      {/* Collapse/Expand Toggle Chevron */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!isSelected) {
                            setActiveLayerId(item.id);
                            window.dispatchEvent(new CustomEvent('select-layer', {
                              detail: { layerId: item.id }
                            }));
                          }

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
                  </div>

                  {/* Input Row */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                        exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-gradient-to-b from-gray-50/40 to-transparent"
                      >
                        <div className="w-full border-t border-gray-100/60"></div>
                        <div className="flex flex-col gap-[1.5vh] w-full px-[1.6vw] pt-[4vh] pb-[4vh]">
                          <div className="flex items-start gap-[0.5vw] w-full">
                            {(() => {
                              const labelMarginClass =
                                ['download', 'audio', '3d-viewer', 'popup', 'zoom'].includes(resolvedActionId) ? 'mt-[3.5vh]' :
                                  resolvedActionId === 'tooltip' ? 'mt-[1.6vh]' :
                                    resolvedActionId === 'call' ? 'mt-[0.1vh]' : 'mt-0';

                              const hasAudioFile = resolvedActionId === 'audio' && !!resolvedValue;
                              const shouldStretchArrow = resolvedActionId === 'tooltip' || hasAudioFile;

                              return (
                                <>
                                  <div className={`flex items-center transition-all duration-300 flex-shrink-0 ${labelMarginClass}`}>
                                    <div className="h-[4vh] px-[0.8vw] bg-[#F3F4F6] rounded-[0.5vw] flex items-center justify-center max-w-[7vw] overflow-hidden">
                                      <span className="text-[0.75vw] text-gray-600 font-medium truncate">{item.label}</span>
                                    </div>
                                  </div>

                                  <div className={`flex items-center text-[#9CA3AF] transition-all duration-300 ${shouldStretchArrow ? 'flex-1 mx-[0.5vw]' : 'flex-shrink-0 ml-[0.5vw] mr-[0.2vw] w-[1.6vw]'} ${labelMarginClass} h-[4vh]`}>
                                    <svg width="100%" height="2" className={`${shouldStretchArrow ? 'flex-1' : 'w-full'} mr-[-1px]`} preserveAspectRatio="none">
                                      <line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                                    </svg>
                                    <svg width="0.6vw" height="0.8vw" viewBox="0 0 8 12" fill="none" className="flex-shrink-0">
                                      <path d="M1 2l6 4-6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                </>
                              );
                            })()}

                            {resolvedActionId === 'navigate-to' ? (
                              (() => {
                                const pageDropId = `page-drop-${item.id}`;
                                const isPageDropOpen = openDropdownId === pageDropId;
                                const selectedPage = resolvedValue || '1';
                                return (
                                  <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <div
                                      data-dropdown-trigger="true"
                                      className="w-[8.5vw] h-[4vh] border border-gray-900 rounded-[0.5vw] flex items-center justify-between px-[0.6vw] bg-white cursor-pointer select-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isPageDropOpen) {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const spaceBelow = window.innerHeight - rect.bottom;
                                          setDropdownDirectionOverrides(prev => ({ ...prev, [pageDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                        }
                                        setOpenDropdownId(isPageDropOpen ? null : pageDropId);
                                      }}
                                    >
                                      <span className="text-[0.8vw] text-gray-700 font-medium font-sans">Page {selectedPage}</span>
                                      <Icon
                                        icon="lucide:chevron-down"
                                        className={`text-gray-700 text-[1vw] transition-transform duration-200 ${isPageDropOpen ? 'rotate-180' : ''}`}
                                      />
                                    </div>
                                    {isPageDropOpen && (
                                      <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-[8.5vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl py-[0.5vh] max-h-[15vh] overflow-y-auto ${dropdownDirectionOverrides[pageDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
                                        {Array.from({ length: pages?.length || 0 }, (_, i) => (
                                          <div
                                            key={i + 1}
                                            className={`px-[0.8vw] py-[0.7vh] text-[0.8vw] font-sans cursor-pointer rounded-[0.3vw] mx-[0.3vw] transition-colors ${String(i + 1) === String(selectedPage) ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const val = (i + 1).toString();
                                              setItemValueOverrides(prev => ({ ...prev, [item.id]: val }));
                                              setOpenDropdownId(null);
                                              setTimeout(() => {
                                                if (updateElementAttribute) {
                                                  const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                  updateElementAttribute(targetIdx, item.id, {
                                                    'data-interaction': 'navigate-to',
                                                    'data-interaction-value': val
                                                  });
                                                }
                                              }, 250);
                                            }}
                                          >
                                            Page {i + 1}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'download' ? (
                              (() => {
                                let fileMeta = null;
                                try {
                                  if (resolvedValue && resolvedValue.startsWith('{')) {
                                    fileMeta = JSON.parse(resolvedValue);
                                  }
                                } catch (e) { }

                                return (
                                  <div className="flex-1 flex flex-col items-center justify-center gap-[0.5vh]" onClick={(e) => e.stopPropagation()}>
                                    <CommonDropBox
                                      className="w-full"
                                      id={`download-upload-${item.id}`}
                                      accept="*"
                                      onFileSelect={(file) => {
                                        if (file && updateElementAttribute) {
                                          const storedUser = localStorage.getItem('user');
                                          if (!storedUser) { alert("You must be logged in to upload a file."); return; }

                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            let base64Data = reader.result;
                                            base64Data = base64Data.replace(/^data:([^;]+);/, 'data:download-$1;');

                                            const storedVal = JSON.stringify({
                                              name: file.name, type: file.type, size: file.size, data: base64Data
                                            });
                                            setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, {
                                              'data-interaction': 'download',
                                              'data-interaction-value': storedVal
                                            });
                                            setUploadingItems(prev => ({ ...prev, [item.id]: false }));
                                          };
                                          reader.onerror = () => setUploadingItems(prev => ({ ...prev, [item.id]: false }));
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      isUploading={uploadingItems[item.id]}
                                      fileMeta={fileMeta}
                                      renderPreview={(meta) => {
                                        const isImage = meta.type?.startsWith('image/') || meta.name?.match(/\.(jpg|jpeg|png|gif)$/i);
                                        const cleanData = meta.data ? meta.data.replace('data:download-', 'data:').trim() : '';
                                        if (isImage && cleanData) {
                                          return <img src={cleanData} alt={meta.name} className="w-full h-full object-contain" />;
                                        }
                                        return <Icon icon="fluent:document-checkmark-24-regular" className="text-[#5145F6] text-[2vw]" />;
                                      }}
                                      emptyIcon="prime:upload"
                                      subText="File Format : Any"
                                    />
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'call' ? (
                              (() => {
                                const val = item.value || '';
                                return (
                                  <div
                                    className="w-[10.5vw] flex-shrink-0 h-[4.2vh] relative ml-[-0.4vw]"
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
                                className="flex-1 flex items-center justify-end"
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
                                  <div className="flex-1 flex flex-col items-end justify-center gap-[0.5vh]" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="file"
                                      id={`audio-upload-${item.id}`}
                                      className="hidden"
                                      accept="audio/*,.mp3,.wav,.m4a,.ogg"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && updateElementAttribute) {
                                          const storedUser = localStorage.getItem('user');
                                          if (!storedUser) { alert("You must be logged in to upload audio."); return; }

                                          setUploadingItems(prev => ({ ...prev, [item.id]: true }));

                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            const base64Data = reader.result;
                                            const tempAudio = new Audio(base64Data);

                                            const saveAudioMetadata = (durationStr) => {
                                              const storedVal = JSON.stringify({ name: file.name, type: file.type || 'audio/mpeg', size: file.size, duration: durationStr, data: base64Data });
                                              setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                              updateElementAttribute(targetIdx, item.id, { 'data-interaction': 'audio', 'data-interaction-value': storedVal });
                                              setUploadingItems(prev => ({ ...prev, [item.id]: false }));
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
                                          reader.onerror = () => setUploadingItems(prev => ({ ...prev, [item.id]: false }));
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
                                                  let rawData = audioMeta?.data || resolvedValue;
                                                  const audioSrc = rawData ? rawData.trim() : '';
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
                                      <div className="flex flex-col items-center justify-center w-full">
                                        <CommonDropBox
                                          id={`audio-upload-${item.id}`}
                                          accept="audio/*,.mp3,.wav,.m4a,.ogg"
                                          hideInput={true}
                                          onFileSelect={(file) => {
                                            const isAudio = file && (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.m4a') || file.name.toLowerCase().endsWith('.ogg'));
                                            if (isAudio && updateElementAttribute) {
                                              const storedUser = localStorage.getItem('user');
                                              if (!storedUser) {
                                                alert("You must be logged in to upload audio.");
                                                return;
                                              }
                                              const user = JSON.parse(storedUser);

                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                const base64Data = reader.result;
                                                const tempAudio = new Audio(base64Data);

                                                const saveAudioMetadata = (durationStr) => {
                                                  const storedVal = JSON.stringify({ name: file.name, type: file.type || 'audio/mpeg', size: file.size, duration: durationStr, data: base64Data });
                                                  setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                                  const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                  updateElementAttribute(targetIdx, item.id, { 'data-interaction': 'audio', 'data-interaction-value': storedVal });
                                                  setUploadingItems(prev => ({ ...prev, [item.id]: false }));
                                                };

                                                tempAudio.onloadedmetadata = () => {
                                                  const durationSec = tempAudio.duration;
                                                  let durationStr = '3:15';
                                                  if (!isNaN(durationSec) && isFinite(durationSec)) { const mins = Math.floor(durationSec / 60); const secs = Math.floor(durationSec % 60); durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`; }
                                                  saveAudioMetadata(durationStr);
                                                };
                                                tempAudio.onerror = () => { saveAudioMetadata('3:15'); };
                                              };
                                              reader.onerror = () => setUploadingItems(prev => ({ ...prev, [item.id]: false }));
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                          fileMeta={null}
                                          isUploading={uploadingItems[item.id]}
                                          emptyIcon="material-symbols:audio-file"
                                          subText="File Format : MP3, WAV, OGG"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'popup' ? (
                              resolvedValue ? (
                                <div className="flex-1 relative w-full h-[11vh] rounded-[0.6vw] group shadow-sm border border-gray-200">
                                  {/* Inner container for image to keep rounded corners without clipping the dropdown */}
                                  <div className="absolute inset-0 rounded-[0.6vw] overflow-hidden pointer-events-none">
                                    <img
                                      src={TEMPLATES.find(tpl => tpl.id === resolvedValue)?.image || ''}
                                      alt="Selected Template"
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Dim Overlay */}
                                    <div className="absolute inset-0 bg-black/40"></div>
                                  </div>

                                  {/* Edit Button overlay in center */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onCustomizePopup) {
                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                        onCustomizePopup(resolvedValue, item.id, targetIdx);
                                      }
                                    }}
                                    className="absolute inset-0 m-auto w-[2.2vw] h-[2.2vw] bg-white/30 backdrop-blur-[4px] rounded-[0.5vw] flex items-center justify-center cursor-pointer hover:bg-white/40 transition-all shadow-md z-10"
                                    title="Customize Template"
                                  >
                                    <Icon icon="mdi:edit" className="text-white drop-shadow-sm text-[1.3vw]" />
                                  </div>
                                  {/* 3 dots menu */}
                                  <div className="absolute top-[0.4vh] right-[0.2vw] z-10">
                                    <div
                                      className="p-[0.2vw] cursor-pointer"
                                      data-dropdown-trigger="true"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(openDropdownId === `popup-${item.id}` ? null : `popup-${item.id}`);
                                      }}
                                    >
                                      <Icon icon="bi:three-dots-vertical" className="text-white drop-shadow-md text-[1.2vw]" />
                                    </div>

                                    {openDropdownId === `popup-${item.id}` && (
                                      <div
                                        data-dropdown-menu="true"
                                        className="absolute top-[100%] right-0 mt-[2.5vh] w-[9.5vw] bg-white rounded-[0.4vw] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-200 py-[0.4vh] flex flex-col z-20"
                                      >
                                        <div
                                          className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-gray-50 cursor-pointer transition-colors group"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            setActiveTemplateSelectionId(item.id);
                                          }}
                                        >
                                          <Icon icon="carbon:template" className="text-gray-800 text-[1.1vw] group-hover:text-black" />
                                          <span className="text-[0.75vw] text-gray-700 font-medium group-hover:text-gray-900">Change Template</span>
                                        </div>
                                        <div
                                          className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-red-50 cursor-pointer transition-colors group"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            setItemValueOverrides(prev => ({ ...prev, [item.id]: null }));
                                            if (updateElementAttribute) {
                                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                              updateElementAttribute(targetIdx, item.id, { 'data-interaction-value': null });
                                            }
                                          }}
                                        >
                                          <Icon icon="iconamoon:trash-light" className="text-[#EF4444] text-[1.1vw] group-hover:text-red-600" />
                                          <span className="text-[0.75vw] text-[#EF4444] font-medium group-hover:text-red-600">Delete</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={(e) => { e.stopPropagation(); setActiveTemplateSelectionId(item.id); }}
                                  className="w-full h-[11vh] border-2 border-dashed border-[#8A94A6] rounded-[0.6vw] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group relative overflow-hidden"
                                >
                                  <span className="text-[0.75vw] text-[#6B7280] font-normal text-center select-none mb-[0.2vh]">
                                    Click to Choose <span className="text-[#5145F6] font-semibold group-hover:underline">Template</span>
                                  </span>
                                  <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] group-hover:text-[#5145F6] transition-colors">
                                    <rect x="3" y="4" width="18" height="4" rx="1" />
                                    <rect x="3" y="10" width="7" height="10" rx="1" />
                                    <line x1="13" y1="11" x2="21" y2="11" />
                                    <line x1="13" y1="15" x2="21" y2="15" />
                                    <line x1="13" y1="19" x2="18" y2="19" />
                                  </svg>
                                </div>
                              )
                            ) : resolvedActionId === '3d-viewer' ? (
                              (() => {
                                let fileMeta = null;
                                try {
                                  if (resolvedValue && resolvedValue.startsWith('{')) {
                                    fileMeta = JSON.parse(resolvedValue);
                                  }
                                } catch (e) { }

                                return (
                                  <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-[1.2vh]" onClick={(e) => e.stopPropagation()}>
                                    {/* Hidden file input */}
                                    <input
                                      type="file"
                                      id={`3d-upload-${item.id}`}
                                      className="hidden"
                                      accept=".glb,.gltf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) && updateElementAttribute) {
                                          const objectUrl = URL.createObjectURL(file);
                                          const storedVal = JSON.stringify({
                                            name: file.name,
                                            type: 'model/gltf-binary',
                                            size: file.size,
                                            data: objectUrl
                                          });
                                          setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction': '3d-viewer',
                                            'data-interaction-value': storedVal
                                          });
                                        }
                                      }}
                                    />

                                    <CommonDropBox
                                      id={`3d-upload-${item.id}`}
                                      accept=".glb,.gltf"
                                      onFileSelect={(file) => {
                                        if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) && updateElementAttribute) {
                                          const objectUrl = URL.createObjectURL(file);
                                          const storedVal = JSON.stringify({
                                            name: file.name,
                                            type: 'model/gltf-binary',
                                            size: file.size,
                                            data: objectUrl
                                          });
                                          setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction': '3d-viewer',
                                            'data-interaction-value': storedVal
                                          });
                                        }
                                      }}
                                      fileMeta={fileMeta}
                                      boxClassName="w-full h-[11vh] border-2 border-dashed border-[#8A94A6] rounded-[0.6vw] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all p-[0.3vw]"
                                      renderPreview={(meta) => (
                                        <div className="w-full h-full relative group rounded-[0.5vw]">
                                          <div className="absolute inset-0 overflow-hidden rounded-[0.5vw] flex items-center justify-center pointer-events-none">
                                            <div className="absolute inset-0 bg-[#F4F5F7] z-0" />
                                            {meta.data ? (
                                              <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                                                <GlbThumbnail dataUrl={meta.data} />
                                              </div>
                                            ) : (
                                              <Icon icon="gis:cube-3d" className="text-[#5145F6] text-[2vw] relative z-10" />
                                            )}
                                          </div>

                                          {/* Hover Menu Overlay */}
                                          <div className={`absolute inset-0 transition-opacity z-20 pointer-events-none ${openDropdownId === '3d-menu-' + item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

                                            {/* Edit Button (Center) */}
                                            <div
                                              className="absolute inset-0 m-auto w-[4.5vw] h-[2.2vw] bg-black/40 backdrop-blur-[4px] rounded-[0.5vw] flex items-center justify-center gap-[0.4vw] cursor-pointer hover:bg-black/60 transition-all shadow-md pointer-events-auto"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (fileMeta && fileMeta.data) {
                                                  setCurrent3DItem(item);
                                                  setIs3DModalOpen(true);
                                                }
                                              }}
                                              title="Edit 3D Model"
                                            >
                                              <Icon icon="mdi:edit" className="text-white drop-shadow-sm text-[1.1vw]" />
                                              <span className="text-white text-[0.75vw] font-medium drop-shadow-sm">Edit</span>
                                            </div>

                                            {/* 3 dots menu */}
                                            <div className="absolute top-[0.4vh] right-[0.2vw] pointer-events-auto">
                                              <div
                                                className="p-[0.2vw] cursor-pointer bg-black/20 rounded-full hover:bg-black/40 transition-colors backdrop-blur-[2px]"
                                                data-dropdown-trigger="true"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenDropdownId(openDropdownId === `3d-menu-${item.id}` ? null : `3d-menu-${item.id}`);
                                                }}
                                              >
                                                <Icon icon="bi:three-dots-vertical" className="text-white drop-shadow-md text-[1.2vw]" />
                                              </div>

                                              {openDropdownId === `3d-menu-${item.id}` && (
                                                <div
                                                  data-dropdown-menu="true"
                                                  className="absolute top-[100%] right-0 mt-[0.5vh] w-[9.5vw] bg-white rounded-[0.4vw] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-200 py-[0.4vh] flex flex-col z-50"
                                                >
                                                  <div
                                                    className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-gray-50 cursor-pointer transition-colors group"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenDropdownId(null);
                                                      document.getElementById(`3d-upload-${item.id}`)?.click();
                                                    }}
                                                  >
                                                    <Icon icon="lucide:replace" className="text-gray-800 text-[1.1vw] group-hover:text-black" />
                                                    <span className="text-[0.75vw] text-gray-700 font-medium group-hover:text-gray-900">Replace</span>
                                                  </div>
                                                  <div
                                                    className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-gray-50 cursor-pointer transition-colors group"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenDropdownId(null);
                                                      if (!fileMeta) {
                                                        setAlertState({
                                                          isOpen: true,
                                                          title: 'Action Required',
                                                          message: 'Please Place Interaction Before Edit Your Model',
                                                          type: 'warning'
                                                        });
                                                        return;
                                                      }
                                                      if (fileMeta.data && fileMeta.data.startsWith('blob:')) {
                                                        setAlertState({
                                                          isOpen: true,
                                                          title: 'Save Required',
                                                          message: 'Please save your flipbook to continue editing the 3D model.',
                                                          type: 'warning',
                                                          showCancel: true,
                                                          confirmText: 'Save and Go',
                                                          cancelText: 'Cancel',
                                                          onConfirm: () => {
                                                            setAlertState(prev => ({ ...prev, isOpen: false }));
                                                            window.dispatchEvent(new CustomEvent('trigger-manual-save'));
                                                            const handleSaved = () => {
                                                              window.removeEventListener('flipbook-saved', handleSaved);
                                                              setTimeout(() => {
                                                                const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                                                                const activeContainer = editorDoc.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                                                                const liveEl = activeContainer ? activeContainer.querySelector(`[id="${CSS.escape(item.id)}"]`) : editorDoc.getElementById(item.id);
                                                                if (liveEl) {
                                                                  const newVal = liveEl.getAttribute('data-interaction-value');
                                                                  try {
                                                                    const newMeta = JSON.parse(newVal);
                                                                    localStorage.setItem('tempThreedEditModel', JSON.stringify({ url: newMeta.data, name: newMeta.name, type: newMeta.type || 'glb' }));
                                                                    const editUrl = newMeta.v_id ? `/editor/threed_editor/${newMeta.v_id}` : '/editor/threed_editor';
                                                                    window.open(editUrl, '_blank');
                                                                  } catch (e) { }
                                                                }
                                                              }, 200);
                                                            };
                                                            window.addEventListener('flipbook-saved', handleSaved);
                                                          }
                                                        });
                                                        return;
                                                      }
                                                      localStorage.setItem('tempThreedEditModel', JSON.stringify({ url: fileMeta.data, name: fileMeta.name, type: fileMeta.type || 'glb' }));
                                                      const editUrl = fileMeta.v_id ? `/editor/threed_editor/${fileMeta.v_id}` : '/editor/threed_editor';
                                                      window.open(editUrl, '_blank');
                                                    }}
                                                  >
                                                    <Icon icon="lucide:settings-2" className="text-gray-800 text-[1.1vw] group-hover:text-black" />
                                                    <span className="text-[0.75vw] text-gray-700 font-medium group-hover:text-gray-900">3D Edit</span>
                                                  </div>
                                                  <div
                                                    className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-gray-50 cursor-pointer transition-colors group"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenDropdownId(null);
                                                      setActive3DGalleryItem(item);
                                                    }}
                                                  >
                                                    <Icon icon="clarity:image-gallery-solid" className="text-gray-800 text-[1.1vw] group-hover:text-black" />
                                                    <span className="text-[0.75vw] text-gray-700 font-medium group-hover:text-gray-900">3D Gallery</span>
                                                  </div>
                                                  <div
                                                    className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-red-50 cursor-pointer transition-colors group"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenDropdownId(null);
                                                      setItemValueOverrides(prev => ({ ...prev, [item.id]: null }));
                                                      if (updateElementAttribute) {
                                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                        updateElementAttribute(targetIdx, item.id, {
                                                          'data-interaction': '3d-viewer',
                                                          'data-interaction-value': ''
                                                        });
                                                      }
                                                    }}
                                                  >
                                                    <Icon icon="ic:round-clear" className="text-[#EF4444] text-[1.1vw] group-hover:text-red-600" />
                                                    <span className="text-[0.75vw] text-[#EF4444] font-medium group-hover:text-red-600">Clear</span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      emptyIcon="prime:upload"
                                      subText="File Format : GLB"
                                    />

                                    {!fileMeta && (
                                      <>
                                        <span className="text-[0.65vw] text-gray-400 font-medium uppercase select-none">OR</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActive3DGalleryItem(item);
                                          }}
                                          className="w-full h-[6vh] bg-[#0A0F1C] rounded-[0.6vw] shadow-md flex items-center justify-center gap-[0.5vw] hover:bg-[#111827] transition-all relative overflow-hidden group cursor-pointer"
                                        >
                                          <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80')" }} />
                                          <div className="absolute inset-0 bg-gradient-to-r from-[#000000] to-transparent opacity-80" />
                                          <div className="z-10 flex items-center gap-[0.6vw] px-[1vw]">
                                            <Icon icon="clarity:image-gallery-solid" className="text-white text-[1.1vw]" />
                                            <span className="text-[0.9vw] font-semibold text-white tracking-wide whitespace-nowrap">3D Gallery</span>
                                          </div>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'zoom' ? (
                              <div className="flex flex-col items-center justify-center gap-[0.2vh] w-full h-[11vh] border-2 border-dashed border-[#8A94A6] rounded-[0.6vw] bg-[#F8F9FA] cursor-pointer hover:bg-gray-50 transition-all group">
                                <span className="text-[0.75vw] text-[#6B7280] font-normal text-center select-none">
                                  Customize <span className="text-[#5145F6] font-semibold group-hover:underline">Zoom Frame</span>
                                </span>
                                <Icon icon="tabler:zoom-in-area" className="text-[#6B7280] text-[1.6vw] group-hover:text-[#5145F6] transition-colors" />
                              </div>
                            ) : (
                              <div className="flex-1 h-[4vh] border border-gray-400 rounded-[0.5vw] flex items-center px-[0.8vw] bg-white overflow-hidden">
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
                                    if (val !== undefined && val !== resolvedValue) {
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

                          {/* Tooltip extra options (Animation) */}
                          {resolvedActionId === 'tooltip' && (
                            <div className="flex flex-col gap-[1.2vh] w-full mt-[1.5vh]">
                              <div className="flex items-center gap-[0.4vw]">
                                <span className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Animation</span>
                                <div className="h-[1px] flex-grow bg-gray-150"></div>
                              </div>
                              <div className="relative" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                <select
                                  className="w-full appearance-none h-[3.8vh] px-[0.8vw] text-[0.8vw] text-gray-600 border border-gray-200 rounded-[0.4vw] bg-white outline-none focus:border-[#5145F6] cursor-pointer"
                                  value={(tooltipSettingsOverrides[item.id] && tooltipSettingsOverrides[item.id].animation !== undefined) ? tooltipSettingsOverrides[item.id].animation : (tooltipSettings.animation || 'Default')}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTooltipSettingsOverrides(prev => ({ ...prev, [item.id]: { ...prev[item.id], animation: val } }));
                                    if (updateElementAttribute) {
                                      const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                      const newSettings = { ...tooltipSettings, animation: val };
                                      updateElementAttribute(targetIdx, item.id, {
                                        'data-tooltip-settings': JSON.stringify(newSettings)
                                      });
                                    }
                                  }}
                                >
                                  <option value="Default">Default</option>
                                  <option value="Fade In /Out">Fade In /Out</option>
                                  <option value="Slide Up">Slide Up</option>
                                  <option value="Zoom In">Zoom In</option>
                                  <option value="Bounce In">Bounce In</option>
                                </select>
                                <Icon icon="lucide:chevron-down" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 text-[0.9vw] pointer-events-none" />
                              </div>

                              <div className="flex items-center justify-between w-full mt-[0.5vh]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                <span className="text-[0.8vw] text-gray-500 font-medium whitespace-nowrap">Speed :</span>
                                <div className="relative w-[11.2vw]">
                                  <select
                                    className="w-full appearance-none h-[3.8vh] px-[0.8vw] text-[0.8vw] text-gray-600 border border-gray-200 rounded-[0.4vw] bg-white outline-none focus:border-[#5145F6] cursor-pointer"
                                    value={(tooltipSettingsOverrides[item.id] && tooltipSettingsOverrides[item.id].speed !== undefined) ? tooltipSettingsOverrides[item.id].speed : (tooltipSettings.speed || 'Medium')}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTooltipSettingsOverrides(prev => ({ ...prev, [item.id]: { ...prev[item.id], speed: val } }));
                                      if (updateElementAttribute) {
                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                        const newSettings = { ...tooltipSettings, speed: val };
                                        updateElementAttribute(targetIdx, item.id, {
                                          'data-tooltip-settings': JSON.stringify(newSettings)
                                        });
                                      }
                                    }}
                                  >
                                    <option value="Slow">Slow</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Fast">Fast</option>
                                  </select>
                                  <Icon icon="lucide:chevron-down" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 text-[0.9vw] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                          )}

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

                        {/* Card Footer (Highlight Component) */}
                        <div className={`bg-white/80 backdrop-blur-sm border-t border-gray-100/60 pl-[1.6vw] pr-[1.2vw] py-[1.8vh] flex items-center justify-between rounded-b-[0.8vw]`}>
                          <div className="flex items-center gap-[0.6vw]">
                            {/* Custom Radio Button */}
                            <div className="w-[1.1vw] h-[1.1vw] flex-shrink-0 rounded-full border-[0.15vw] border-[#5145F6] flex items-center justify-center bg-white">
                              <div className="w-[0.45vw] h-[0.45vw] rounded-full bg-[#5145F6]"></div>
                            </div>
                            <span className="text-[0.8vw] text-gray-600 font-medium">Highlight the Component</span>
                          </div>

                          {/* Trash Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;

                              // Check if it's a Free Frame
                              const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                              const activeContainer = editorDoc.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                              const frameEl = activeContainer ? activeContainer.querySelector(`[id="${CSS.escape(item.id)}"]`) : editorDoc.getElementById(item.id);
                              const isFreeFrame = frameEl && (frameEl.getAttribute('data-type') === 'free-frame' || frameEl.getAttribute('data-name')?.toLowerCase() === 'free frame');

                              if (isFreeFrame && deleteLayer) {
                                deleteLayer(targetIdx, item.id);
                              } else {
                                if (updateElementAttribute) {
                                  updateElementAttribute(targetIdx, item.id, {
                                    'data-interaction': null,
                                    'data-interaction-value': null,
                                    'data-interaction-intent': null,
                                    'data-interaction-config': null,
                                    'data-interaction-popup-custom-html': null,
                                    'data-interaction-popup-animation': null,
                                    'data-interaction-popup-speed': null,
                                    'data-tooltip-settings': null
                                  });
                                }
                                if (typeof setSelectedLayerId !== 'undefined' && setSelectedLayerId) setSelectedLayerId(null);
                                if (typeof setMultiSelectedIds !== 'undefined' && setMultiSelectedIds) setMultiSelectedIds(new Set());

                                setItemValueOverrides(prev => { const next = { ...prev }; delete next[item.id]; return next; });
                                setCardActionOverrides(prev => { const next = { ...prev }; delete next[item.id]; return next; });
                              }

                              setOpenCardIds(prev => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });

                              // Fire event to reset canvas badge visual state
                              window.dispatchEvent(new CustomEvent('update-interaction-badge', {
                                detail: {
                                  elementId: item.id,
                                  actionType: null
                                }
                              }));
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center w-[1.8vw] h-[1.8vw] rounded-full hover:bg-red-50"
                          >
                            <Icon icon="material-symbols-light:delete-outline-rounded" className="text-[1.5vw]" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
        onSelect={async (templateId) => {
          if (updateElementAttribute && activeTemplateSelectionId) {
            setItemValueOverrides(prev => ({ ...prev, [activeTemplateSelectionId]: templateId }));

            let fallbackHtml = '';
            const template = TEMPLATES.find(t => t.id === templateId);
            if (template && template.image) {
              try {
                const res = await fetch(template.image);
                if (res.ok) {
                  fallbackHtml = await res.text();
                }
              } catch (err) { }
            }
            if (!fallbackHtml) {
              fallbackHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
                <g id="layer-1" data-name="Background"><rect width="100%" height="100%" fill="#ffffff" rx="16" /></g>
                <g id="layer-2" data-name="Content"><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Popup Template</text></g>
              </svg>`;
            }

            updateElementAttribute(activePageIndex, activeTemplateSelectionId, {
              'data-interaction': 'popup',
              'data-interaction-value': templateId,
              'data-interaction-popup-custom-html': fallbackHtml
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

      {/* 3D Gallery Modal */}
      <ModelGalleryModal
        isOpen={!!active3DGalleryItem}
        onClose={() => setActive3DGalleryItem(null)}
        hideDelete={true}
        onSelectModel={async (model) => {
          if (!active3DGalleryItem) return;
          const currentItem = active3DGalleryItem;
          setActive3DGalleryItem(null); // Close modal immediately

          const fullUrl = model.url ? resolveUploadsPath(model.url) : '';



          try {
            // Fetch as a blob so it behaves exactly like a direct upload,
            // allowing TemplateEditor's save process to store it in assets/3D_Model/
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const storedVal = JSON.stringify({
              name: model.name || 'model.glb',
              type: model.type || 'model/gltf-binary',
              size: model.size || blob.size,
              data: objectUrl,
              fromGallery: true
            });

            setItemValueOverrides(prev => ({ ...prev, [currentItem.id]: storedVal }));
            const targetIdx = currentItem.pageIndex !== undefined ? currentItem.pageIndex : activePageIndex;
            if (updateElementAttribute) {
              updateElementAttribute(targetIdx, currentItem.id, {
                'data-interaction': '3d-viewer',
                'data-interaction-value': storedVal
              });
            }
          } catch (error) {
            console.error("Failed to fetch gallery model as blob:", error);
          }
        }}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        showCancel={alertState.showCancel}
        confirmText={alertState.confirmText || 'Okay'}
        cancelText={alertState.cancelText || 'Cancel'}
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
};

export default React.memo(InteractionPanel);