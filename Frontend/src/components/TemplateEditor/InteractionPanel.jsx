import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import PopupTemplateSelection, { TEMPLATES } from './PopupTemplateSelection';
import ModelGalleryModal from '../ThreedEditor/Components/ModelGalleryModal';
import AlertModal from '../AlertModal';
import { Canvas, useThree } from '@react-three/fiber';
import { Stage, OrbitControls, useGLTF, Environment, Center, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { resolveUploadsPath } from '../../utils/supabaseUtils';
import { fontFamilies, fontWeights } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import ColorPicker from './ColorPicker';
import HotspotCustomizationPopup, { generateHotspotSVG } from './HotspotCustomizationPopup';

const GlbModelScene = ({ url }) => {
  const { scene } = useGLTF(url);
  const { camera, size } = useThree();
  const controls = useThree(state => state.controls);

  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);
    const radius = Math.max(sizeVec.x, sizeVec.y, sizeVec.z) / 2;
    const fovRad = ((camera.fov || 50) * Math.PI) / 360;
    const dist = (radius / Math.sin(fovRad)) * 1.1; // 1.1 for 70-80% coverage

    // Do NOT use Math.max(dist, 0.1) here, it forces small models to be viewed from far away!
    camera.position.set(0, 0, dist);
    camera.near = dist / 100;
    camera.far = dist * 100;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [scene, camera, controls]);

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-10, -10, -10]} intensity={0.3} />
      <Center>
        <primitive object={scene} />
      </Center>
    </>
  );
};

const GlbModel = ({ url }) => {
  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 5] }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <React.Suspense fallback={null}>
        <GlbModelScene url={url} />
      </React.Suspense>
      <OrbitControls makeDefault enableZoom={false} enablePan={false} autoRotate={false} />
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

const ZoomTargetThumbnail = ({ targetId }) => {
  const [svgContent, setSvgContent] = useState(null);
  const [viewBox, setViewBox] = useState('0 0 100 100');
  const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;

  useEffect(() => {
    if (!targetId || !editorDoc) return;

    const updateThumb = () => {
      const el = editorDoc.getElementById(targetId);
      if (el) {
        const pageSvg = el.closest('svg');

        let localBox = { x: 0, y: 0, width: 100, height: 100 };
        let absBox = { x: 0, y: 0, width: 100, height: 100 };

        try {
          if (typeof el.getBBox === 'function') {
            localBox = el.getBBox();
          } else {
            const rect = el.getBoundingClientRect();
            localBox = { x: 0, y: 0, width: rect.width || 100, height: rect.height || 100 };
          }
        } catch (e) { }

        if (pageSvg && typeof pageSvg.createSVGPoint === 'function') {
          try {
            const elRect = el.getBoundingClientRect();
            const ctm = pageSvg.getScreenCTM();
            if (ctm) {
              const inverseCtm = ctm.inverse();
              const pt1 = pageSvg.createSVGPoint();
              pt1.x = elRect.left; pt1.y = elRect.top;
              const svgPt1 = pt1.matrixTransform(inverseCtm);

              const pt2 = pageSvg.createSVGPoint();
              pt2.x = elRect.right; pt2.y = elRect.bottom;
              const svgPt2 = pt2.matrixTransform(inverseCtm);

              absBox = { x: svgPt1.x, y: svgPt1.y, width: svgPt2.x - svgPt1.x, height: svgPt2.y - svgPt1.y };
            } else {
              absBox = localBox;
            }
          } catch (e) {
            absBox = localBox;
          }
        } else {
          absBox = localBox;
        }

        const padding = 10;
        const isFreeFrame = el.getAttribute('data-name')?.toLowerCase() === 'free frame' || el.getAttribute('data-type') === 'free-frame';

        if (isFreeFrame && pageSvg) {
          const framePadding = 0;
          const viewBoxStr = `${absBox.x - framePadding} ${absBox.y - framePadding} ${absBox.width + framePadding * 2} ${absBox.height + framePadding * 2}`;
          setViewBox(viewBoxStr);

          // For Free Frames, capture the exact area underneath it by cloning the parent SVG
          const clone = pageSvg.cloneNode(true);
          const frameInClone = clone.getElementById(targetId) || clone.querySelector(`[id="${targetId}"]`);
          if (frameInClone) frameInClone.style.display = 'none'; // hide the dashed box itself

          // Scale up the intrinsic size so it expands to fill the preview container
          const ratio = absBox.height / absBox.width;
          clone.setAttribute('width', '10000');
          clone.setAttribute('height', String(10000 * ratio));
          clone.setAttribute('viewBox', viewBoxStr);
          clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          clone.style.width = 'auto'; // allow max-width/max-height to scale it proportionally
          clone.style.height = 'auto';
          clone.style.maxWidth = '100%';
          clone.style.maxHeight = '100%';
          clone.style.overflow = 'hidden';

          setSvgContent(clone.outerHTML);
        } else {
          const viewBoxStr = `${localBox.x - padding} ${localBox.y - padding} ${localBox.width + padding * 2} ${localBox.height + padding * 2}`;
          setViewBox(viewBoxStr);

          // For normal elements, isolate and display the element directly (worked perfectly before)
          const clone = el.cloneNode(true);
          if (clone.style) {
            clone.style.display = 'block';
            clone.style.opacity = '1';
            clone.style.visibility = 'visible';
            clone.style.transform = 'none';
          }
          if (typeof clone.removeAttribute === 'function') clone.removeAttribute('transform');

          let finalHTML = clone.outerHTML;
          const isSVG = el instanceof SVGElement || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'g' || el.tagName.toLowerCase() === 'image';
          if (!isSVG) {
            finalHTML = `<foreignObject x="${localBox.x}" y="${localBox.y}" width="${localBox.width}" height="${localBox.height}">${clone.outerHTML}</foreignObject>`;
          }
          setSvgContent(finalHTML);
        }
      } else {
        setSvgContent(null);
      }
    };

    updateThumb();

    let timeoutId;
    const handleUpdate = (e) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!e.detail || e.detail.elementId === targetId || e.type === 'canvas-updated') {
          updateThumb();
        }
      }, 300);
    };

    window.addEventListener('update-interaction-badge', handleUpdate);
    window.addEventListener('canvas-updated', handleUpdate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('update-interaction-badge', handleUpdate);
      window.removeEventListener('canvas-updated', handleUpdate);
    };
  }, [targetId, editorDoc]);

  if (!svgContent) {
    return (
      <div className="w-full h-[22vh] rounded-[0.6vw] bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm animate-pulse">
        <Icon icon="tabler:photo" className="text-gray-400 text-[2vw]" />
      </div>
    );
  }

  const isFullSvg = svgContent.trim().toLowerCase().startsWith('<svg');

  return (
    <div className="w-full h-[22vh] rounded-[0.6vw] bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden p-[0.4vw]">
      {isFullSvg ? (
        <div className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain [&>svg]:overflow-hidden" dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className="max-w-full max-h-full object-contain overflow-hidden" dangerouslySetInnerHTML={{ __html: svgContent }} />
      )}
    </div>
  );
};

const CallInteractionInput = ({ initialValue, onSave, isWhatsApp }) => {
  const parsedInitial = React.useMemo(() => {
    if (!initialValue) return { country: 'af', nationalNumber: '', dialCode: '93' };
    const str = initialValue.startsWith('+') ? initialValue : '+' + initialValue;
    try {
      const phoneNumber = parsePhoneNumberFromString(str);
      if (phoneNumber && phoneNumber.country) {
        return {
          country: phoneNumber.country.toLowerCase(),
          nationalNumber: phoneNumber.nationalNumber,
          dialCode: phoneNumber.countryCallingCode
        };
      }
    } catch (e) {}
    return { country: 'af', nationalNumber: '', dialCode: '93' };
  }, [initialValue]);

  const [localValue, setLocalValue] = useState(parsedInitial.nationalNumber);
  const [selectedCountry, setSelectedCountry] = useState(parsedInitial.country);
  const [dialCode, setDialCode] = useState(parsedInitial.dialCode);
  const [isSaved, setIsSaved] = useState(true);
  const containerRef = useRef(null);

  const cleanLocal = localValue.replace(/\D/g, '');
  let isInvalid = false;
  let hasDigits = false;

  if (isWhatsApp) {
    const localNumber = localValue.replace(/^\+91/, '').replace(/\D/g, '');
    hasDigits = localNumber.length > 0;
    if (hasDigits) {
      const firstDigit = localNumber.charAt(0);
      const validStart = ['6', '7', '8', '9'].includes(firstDigit);
      isInvalid = !validStart || localNumber.length !== 10;
    }
  } else {
    hasDigits = localValue.trim().length > 0;
    if (hasDigits) {
      try {
        isInvalid = !isValidPhoneNumber(localValue, selectedCountry.toUpperCase());
      } catch (e) {
        isInvalid = true;
      }
    }
  }

  const isValidAndFilled = hasDigits && !isInvalid;
  const isUnsavedValid = isValidAndFilled && !isSaved;

  const textColor = isInvalid ? '#EF4444' : '#374151';
  const borderColor = isUnsavedValid ? '#22C55E' : (isInvalid ? '#EF4444' : '#D1D5DB');
  const bgColor = isUnsavedValid ? '#F0FDF4' : (isInvalid ? '#FEF2F2' : '#F3F4F6');

  useEffect(() => {
    if (initialValue) {
      const str = initialValue.startsWith('+') ? initialValue : '+' + initialValue;
      try {
        const phoneNumber = parsePhoneNumberFromString(str);
        if (phoneNumber && phoneNumber.country) {
          setSelectedCountry(phoneNumber.country.toLowerCase());
          setLocalValue(phoneNumber.nationalNumber);
          setDialCode(phoneNumber.countryCallingCode);
        }
      } catch (e) {}
    } else {
      setLocalValue('');
      setSelectedCountry('af');
      setDialCode('93');
    }
    setIsSaved(true);
  }, [initialValue]);

  useEffect(() => {
    if (!containerRef.current || isWhatsApp) return;

    const removeTitle = () => {
      if (!containerRef.current) return;
      const flags = containerRef.current.querySelectorAll('.selected-flag');
      flags.forEach(el => {
        if (el.hasAttribute('title')) {
          el.removeAttribute('title');
        }
      });
    };

    removeTitle();

    const observer = new MutationObserver(() => {
      removeTitle();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title']
    });

    return () => observer.disconnect();
  }, [isWhatsApp]);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      {!isWhatsApp && (
        <style>{`
          .react-tel-input .flag-dropdown .selected-flag,
          .react-tel-input .flag-dropdown:hover .selected-flag,
          .react-tel-input .flag-dropdown.open-dropdown .selected-flag,
          .react-tel-input .flag-dropdown:focus .selected-flag {
            background-color: transparent !important;
            width: 100% !important;
            justify-content: center !important;
          }
          .react-tel-input .country-list .country {
            padding: 0.6vw 0.6vw 0.6vw 2.6vw !important;
          }
          .react-tel-input .country-list .flag {
            left: 0.8vw !important;
            margin-top: 0.2vw !important;
          }
          .react-tel-input .country-list {
            margin: 0 !important;
            left: 0 !important;
            transform: none !important;
            top: 100% !important;
            bottom: auto !important;
            margin-top: 0.2vw !important;
            z-index: 99999 !important;
          }
        `}</style>
      )}
      {isWhatsApp ? (
        <div className="relative w-full h-full bg-white rounded-[0.6vw]">
          <div className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10">
            <Icon icon="ic:outline-whatsapp" className="text-[#22C55E] text-[1.4vw]" />
          </div>
          <div className="absolute left-[2.4vw] top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center bg-[#F3F4F6] rounded-[0.4vw] px-[0.4vw] h-[70%] z-10">
            <span className="text-[0.85vw] text-gray-700 font-medium">+91</span>
            <Icon icon="lucide:chevron-down" className="text-gray-500 text-[0.8vw] ml-[0.3vw]" />
          </div>
          <input
            type="text"
            value={localValue.replace(/^\+91/, '').replace(/\D/g, '')}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 10) {
                setLocalValue(val ? '+91' + val : '');
                setIsSaved(false);
              }
            }}
            onBlur={() => {
              const saveVal = '+91' + localValue.replace(/\D/g, '');
              if (saveVal !== initialValue) {
                onSave(saveVal);
                setIsSaved(true);
              }
            }}
            placeholder="1234567890"
            className="w-full h-full rounded-[0.6vw] text-[0.85vw] font-medium text-gray-700 outline-none transition-all bg-transparent relative z-0"
            style={{
              paddingLeft: '6vw',
              border: `1px solid ${borderColor}`,
              boxShadow: isUnsavedValid ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
              color: textColor
            }}
          />
        </div>
      ) : (
        <PhoneInput
          country={selectedCountry}
          preferredCountries={['in', 'us', 'gb']}
          disableCountryGuess={true}
          value={'+' + dialCode + localValue}
          onChange={(phone, data) => {
            let nationalNum = phone;
            if (data && data.dialCode && phone.startsWith(data.dialCode)) {
              nationalNum = phone.substring(data.dialCode.length);
            }
            setLocalValue(nationalNum);
            
            if (data && data.countryCode && data.countryCode !== selectedCountry) {
              setSelectedCountry(data.countryCode);
              setDialCode(data.dialCode);
            }
            setIsSaved(false);
          }}
          onBlur={() => {
            const saveVal = '+' + dialCode + localValue;
            if (saveVal !== initialValue) {
              onSave(saveVal);
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
            paddingLeft: '3.8vw',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            boxShadow: isUnsavedValid ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
          buttonStyle={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRight: '1px solid #D1D5DB',
            borderRadius: '0.6vw 0 0 0.6vw',
            width: '3.2vw',
            height: '100%',
            top: '0',
            left: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          dropdownStyle={{
            width: '14vw',
            maxHeight: '20vh',
            fontSize: '0.8vw',
            borderRadius: '0.6vw',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #E5E7EB',
            textAlign: 'left',
            zIndex: 50
          }}
        />
      )}
      {/* Green Checkmark inside input when valid */}
      {isValidAndFilled && (
        <div className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[1vw] h-[1vw] bg-[#22C55E] rounded-full flex items-center justify-center">
            <Icon icon="lucide:check" className="text-white text-[0.7vw]" strokeWidth="3" />
          </div>
        </div>
      )}
      {isInvalid && (
        <div className="absolute left-[0.2vw] -bottom-[2.5vh] text-[#EF4444] text-[0.7vw] font-normal whitespace-nowrap z-10">
          Please enter the valid number *
        </div>
      )}
      {isValidAndFilled && !isWhatsApp && (
        <div className="absolute left-[0.2vw] -bottom-[2.5vh] text-[#22C55E] text-[0.7vw] font-normal whitespace-nowrap z-10">
          Phone Number Linked
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
        top: `${rect.bottom + 5}px`, // Open downwards, 5px gap
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

  const isLocked = ['youtube', 'instagram', 'x', 'facebook', 'linkedin'].includes(item.presetId);

  return (
    <>
      <div
        ref={triggerRef}
        data-dropdown-trigger="true"
        className={`h-[3.5vh] bg-white border border-gray-200/80 shadow-sm rounded-[0.5vw] flex items-center justify-center gap-[0.4vw] px-[0.8vw] transition-all duration-300 relative select-none group ${isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:border-[#5145F6]/40 cursor-pointer'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isLocked) return;
          setOpenDropdownId(isDropdownOpen ? null : item.id);
        }}
      >
        <span className="text-[0.85vw] text-gray-700 font-medium font-sans group-hover:text-[#5145F6] transition-colors">{currentAction.label}</span>
        {!isLocked && (
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" className="stroke-gray-500 group-hover:stroke-[#5145F6] transition-colors" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4" />
          </svg>
        )}
      </div>

      {isDropdownOpen && dropdownStyles.left && createPortal(
        <div
          data-dropdown-menu="true"
          className="bg-white border border-gray-200 rounded-[0.8vw] shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col gap-[0.5vh] p-[0.5vw] max-h-[60vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-left"
          style={dropdownStyles}
        >
          {actionTypes.map(action => (
            <div
              key={action.id}
              className="flex items-center gap-[0.8vw] px-[0.8vw] py-[0.8vh] rounded-[0.4vw] bg-[#F9FAFB] hover:bg-gray-100 cursor-pointer transition-colors group"
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
              <Icon icon={action.icon} className="text-gray-600 text-[1.3vw]" />
              <span className="text-[0.9vw] text-gray-700 font-medium">{action.label}</span>
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
  boxStyle, // custom styles
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
        style={boxStyle}
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
  const [editingHotspotId, setEditingHotspotId] = useState(null);

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
  const [linkBehaviorOverrides, setLinkBehaviorOverrides] = useState({});
  const [whatsappMessageOverrides, setWhatsappMessageOverrides] = useState({});
  const [highlightOverrides, setHighlightOverrides] = useState({});
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
    { id: 'whatsapp', label: 'WhatsApp', icon: 'ic:outline-whatsapp' },
    { id: 'email', label: 'Email', icon: 'ic:outline-mail' },
    { id: 'call', label: 'Call', icon: 'fluent:call-24-regular' },
    { id: 'navigate-to', label: 'Navigate to', icon: 'iconoir:page-search' },
    { id: '3d-viewer', label: '3D Viewer', icon: 'mage:box-3d' },
    { id: 'popup', label: 'Popup', icon: 'carbon:popup' },
    { id: 'slideshow', label: 'Slideshow', icon: 'clarity:image-gallery-line' },
    { id: 'zoom', label: 'Zoom', icon: 'fluent:zoom-in-32-regular' },
    { id: 'download', label: 'Download', icon: 'mynaui:download' },
    { id: 'info-box', label: 'Info Box', icon: 'fontisto:info' }
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
      setLinkBehaviorOverrides({});
      setWhatsappMessageOverrides({});
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
      } else if (dataType === 'icon' || dataType === 'hotspot' || idLower.includes('icon') || idLower.includes('hotspot') || el.classList?.contains('iconify')) {
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
      } else if (dataType === 'icon' || dataType === 'hotspot' || idLower.includes('icon') || idLower.includes('hotspot') || el.classList?.contains('iconify')) {
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

        const imageEl = foundEl.querySelector('image');
        const isHotspot = foundEl.getAttribute('data-is-hotspot') === 'true' || 
                          (foundEl.getAttribute('data-type') === 'icon' || foundEl.getAttribute('data-type') === 'hotspot') && imageEl && imageEl.getAttribute('width') === '52';
        let hotspotIconSrc = foundEl.getAttribute('data-hotspot-icon-src');
        if (!hotspotIconSrc && isHotspot && imageEl) {
           hotspotIconSrc = imageEl.getAttribute('href');
        }
        
        let hotspotHtml = null;
        let hotspotBBox = "0 0 24 24";
        if (isHotspot && !hotspotIconSrc) {
           hotspotHtml = foundEl.innerHTML;
           const rectMatch = hotspotHtml.match(/<rect[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/);
           if (rectMatch) {
             hotspotBBox = `0 0 ${rectMatch[1]} ${rectMatch[2]}`;
           }
        }

        list.push({
          id: foundEl.id,
          tagName: foundEl.tagName,
          dataName: foundEl.getAttribute('data-name'),
          label: info.name,
          actionId: foundEl.getAttribute('data-interaction') || 'open-link',
          value: foundEl.getAttribute('data-interaction-value') || '',
          tooltipSettings: foundEl.getAttribute('data-tooltip-settings') || '',
          trigger: foundEl.getAttribute('data-interaction-trigger') || 'click',
          linkBehavior: foundEl.getAttribute('data-interaction-link-behavior') || 'current',
          zoomTargetId: foundEl.getAttribute('data-zoom-target') || null,
          zoomLevel: foundEl.getAttribute('data-zoom-level') || '2X',
          isHotspot: isHotspot,
          hotspotIconSrc: hotspotIconSrc,
          hotspotHtml: hotspotHtml,
          hotspotBBox: hotspotBBox,
          presetId: foundEl.getAttribute('data-preset-id') || null,
          bgColor: foundEl.getAttribute('data-bg-color') || null,
          iconColor: foundEl.getAttribute('data-icon-color') || null
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
    if (dt === 'icon' || dt === 'hotspot' || dn.includes('icon') || dn.includes('hotspot') || el.classList?.contains('iconify')) return 'Icon';
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
    if (dataType === 'icon' || dataType === 'hotspot' || dataName.includes('icon') || dataName.includes('hotspot')) return 'Icon';
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
                    ? 'border-[#5145F6]/50 ring-2 ring-[#5145F6]/15 bg-white/95 z-[50]'
                    : 'border-white/40 hover:border-[#5145F6]/30 z-[10]'
                    }`}
                >

                  {/* Card Header / Settings */}
                  <div className="flex flex-col">
                    {/* Top Row: Icon + Dropdowns */}
                    <div className={`flex items-center justify-between gap-[0.8vw] ${isCollapsed ? 'py-[1.6vh] pl-[0.8vw] pr-[1.2vw]' : 'pt-[1.2vh] pl-[0.8vw] pr-[1.2vw] pb-[1.2vh]'}`}>
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
                        
                        {item.isHotspot && (
                          <div className="px-[1.6vw] pt-[2vh] pb-[0.5vh]">
                            <div className="w-full h-[12vh] border border-gray-200 rounded-[0.5vw] bg-white flex items-center justify-center relative shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                              {/* Edit Button */}
                              <div 
                                className="absolute top-[0.6vw] right-[0.6vw] w-[1.8vw] h-[1.8vw] bg-white border border-gray-200 rounded-[0.3vw] shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingHotspotId(item.id);
                                }}
                              >
                                <Icon icon="lucide:edit" className="text-gray-500 text-[0.9vw]" />
                              </div>
                              
                              {/* Icon Preview */}
                              {item.hotspotIconSrc ? (
                                <img src={item.hotspotIconSrc} alt="hotspot" className="w-[4.5vw] h-[4.5vw] object-contain pointer-events-none" />
                              ) : item.hotspotHtml ? (
                                <div className="w-[8vw] h-[4.5vw] flex items-center justify-center overflow-hidden pointer-events-none">
                                  <svg 
                                    className="w-full h-full" 
                                    viewBox={item.hotspotBBox || "0 0 24 24"} 
                                    preserveAspectRatio="xMidYMid meet"
                                    dangerouslySetInnerHTML={{ __html: item.hotspotHtml }} 
                                  />
                                </div>
                              ) : (
                                <div className="w-[4.5vw] h-[4.5vw] flex items-center justify-center rounded-full bg-[#EFF6FF] border-[0.15vw] border-[#BFDBFE]">
                                  <Icon icon="ph:link-bold" className="text-[#3B82F6] text-[2.2vw]" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className={`flex flex-col gap-[1.5vh] w-full ${resolvedActionId === 'slideshow' ? 'px-[1vw]' : 'px-[1.6vw]'} ${['open-link', 'whatsapp', 'email', 'navigate-to', 'call', 'slideshow', 'zoom', 'info-box', 'download', 'popup', '3d-viewer'].includes(resolvedActionId) ? (item.isHotspot ? 'pt-[1vh] pb-[1.5vh]' : 'pt-[1vh] pb-[1.5vh]') : 'pt-[4vh] pb-[4vh]'}`}>
                          <div className="flex items-start gap-[0.5vw] w-full">
                            {(() => {
                              if (item.isHotspot) return null;
                              if (['open-link', 'whatsapp', 'email', 'navigate-to', 'call', 'slideshow', 'zoom', 'info-box', 'download', 'popup', '3d-viewer'].includes(resolvedActionId)) return null;

                              const labelMarginClass =
                                ['audio', 'zoom'].includes(resolvedActionId) ? 'mt-[3.5vh]' :
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
                                  <div className="flex flex-col w-full gap-[0.8vh]" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[0.8vw] text-black font-normal">Select Page to Navigate</span>
                                    <div className="relative w-full">
                                      <div
                                        data-dropdown-trigger="true"
                                        className="w-full h-[4.5vh] border border-gray-500 rounded-[0.5vw] flex items-center justify-between px-[0.8vw] bg-white cursor-pointer select-none"
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
                                        <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.6vw] shadow-xl py-[0.5vh] max-h-[15vh] overflow-y-auto ${dropdownDirectionOverrides[pageDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
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
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'info-box' ? (
                              (() => {
                                let infoData = {
                                  text: '', fontFamily: 'Poppins', fontWeight: 'Regular', fontSize: '14',
                                  textColor: '#555555', bgColor: '#FFFFFF', animationStyle: 'Default', animationSpeed: 'Default'
                                };
                                try {
                                  if (resolvedValue && resolvedValue.startsWith('{')) {
                                    infoData = { ...infoData, ...JSON.parse(resolvedValue) };
                                  }
                                } catch (e) { }

                                const handleInfoChange = (key, val) => {
                                  const newData = { ...infoData, [key]: val };
                                  const storedVal = JSON.stringify(newData);
                                  setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                };

                                const saveInfoToCanvas = (dataToSave = infoData) => {
                                  if (updateElementAttribute) {
                                    const storedVal = JSON.stringify(dataToSave);
                                    const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                    updateElementAttribute(targetIdx, item.id, {
                                      'data-interaction': 'info-box',
                                      'data-interaction-value': storedVal
                                    });
                                  }
                                };

                                const updateInfo = (key, val) => {
                                  const newData = { ...infoData, [key]: val };
                                  handleInfoChange(key, val);
                                  setTimeout(() => saveInfoToCanvas(newData), 50);
                                };

                                return (
                                  <div className="flex flex-col w-full gap-[1.2vh]" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-[0.8vh]">
                                      <span className="text-[0.85vw] text-black font-medium">Enter Information</span>
                                      <div className="relative w-full">
                                        <textarea
                                          className="w-full h-[9vh] border border-gray-300 rounded-[0.4vw] p-[0.6vw] pb-[1.5vw] outline-none resize-none focus:border-[#5145F6] transition-colors"
                                          style={{
                                            color: infoData.textColor,
                                            backgroundColor: infoData.bgColor,
                                            fontFamily: infoData.fontFamily,
                                            fontWeight: infoData.fontWeight === 'Bold' ? '800' : infoData.fontWeight === 'Semi Bold' ? '600' : infoData.fontWeight === 'Medium' ? '500' : infoData.fontWeight === 'Regular' ? '400' : infoData.fontWeight === 'Light' ? '200' : infoData.fontWeight === 'Extra Light' ? '100' : infoData.fontWeight === 'Thin' ? '50' : 'normal',
                                            fontSize: `${infoData.fontSize}px`
                                          }}
                                          placeholder="Enter text"
                                          maxLength={100}
                                          value={infoData.text}
                                          onChange={(e) => handleInfoChange('text', e.target.value)}
                                          onBlur={() => saveInfoToCanvas()}
                                        />
                                        <span className="absolute bottom-[0.4vw] right-[0.6vw] text-[0.7vw] text-gray-400 font-medium">
                                          {(infoData.text || '').length}/100
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-[0.8vh]">
                                      <div className="relative w-full">
                                        {(() => {
                                          const fontDropId = `info-font-drop-${item.id}`;
                                          const isFontDropOpen = openDropdownId === fontDropId;
                                          return (
                                            <>
                                              <div
                                                data-dropdown-trigger="true"
                                                className={`w-full h-[4vh] border ${isFontDropOpen ? 'border-[#5145F6]' : 'border-gray-300'} rounded-[0.4vw] flex items-center justify-between px-[0.8vw] bg-white cursor-pointer select-none transition-colors`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!isFontDropOpen) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    setDropdownDirectionOverrides(prev => ({ ...prev, [fontDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                  }
                                                  setOpenDropdownId(isFontDropOpen ? null : fontDropId);
                                                }}
                                              >
                                                <span className="text-[0.8vw] text-gray-600 truncate">{infoData.fontFamily}</span>
                                                <Icon
                                                  icon="lucide:chevron-down"
                                                  className={`text-gray-400 text-[1vw] transition-transform duration-200 ${isFontDropOpen ? 'rotate-180' : ''}`}
                                                />
                                              </div>
                                              {isFontDropOpen && (
                                                <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.6vw] shadow-lg py-[0.5vh] max-h-[20vh] overflow-y-auto ${dropdownDirectionOverrides[fontDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
                                                  {fontFamilies.map(font => (
                                                    <div
                                                      key={font}
                                                      className={`px-[1vw] py-[0.8vh] text-[0.85vw] cursor-pointer transition-colors ${font === infoData.fontFamily ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                      style={{ fontFamily: font }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateInfo('fontFamily', font);
                                                        setOpenDropdownId(null);
                                                      }}
                                                    >
                                                      {font}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                      <div className="flex gap-[0.8vw]">
                                        <div className="relative w-[65%]">
                                          {(() => {
                                            const weightDropId = `info-weight-drop-${item.id}`;
                                            const isWeightDropOpen = openDropdownId === weightDropId;
                                            const infoFontWeights = [
                                              { label: 'Thin', value: '50' },
                                              { label: 'Extra Light', value: '100' },
                                              { label: 'Light', value: '200' },
                                              { label: 'Regular', value: '400' },
                                              { label: 'Medium', value: '500' },
                                              { label: 'Semi Bold', value: '600' },
                                              { label: 'Bold', value: '800' }
                                            ];
                                            return (
                                              <>
                                                <div
                                                  data-dropdown-trigger="true"
                                                  className={`w-full h-[4vh] border ${isWeightDropOpen ? 'border-[#5145F6]' : 'border-gray-300'} rounded-[0.4vw] flex items-center justify-between px-[0.8vw] bg-white cursor-pointer select-none transition-colors`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isWeightDropOpen) {
                                                      const rect = e.currentTarget.getBoundingClientRect();
                                                      const spaceBelow = window.innerHeight - rect.bottom;
                                                      setDropdownDirectionOverrides(prev => ({ ...prev, [weightDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                    }
                                                    setOpenDropdownId(isWeightDropOpen ? null : weightDropId);
                                                  }}
                                                >
                                                  <span className="text-[0.8vw] text-gray-600 truncate">{infoData.fontWeight}</span>
                                                  <Icon
                                                    icon="lucide:chevron-down"
                                                    className={`text-gray-400 text-[1vw] transition-transform duration-200 ${isWeightDropOpen ? 'rotate-180' : ''}`}
                                                  />
                                                </div>
                                                {isWeightDropOpen && (
                                                  <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.6vw] shadow-lg py-[0.5vh] max-h-[20vh] overflow-y-auto ${dropdownDirectionOverrides[weightDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
                                                    {infoFontWeights.map(fw => (
                                                      <div
                                                        key={fw.label}
                                                        className={`px-[1vw] py-[0.8vh] text-[0.85vw] cursor-pointer transition-colors ${fw.label === infoData.fontWeight ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                        style={{ fontWeight: fw.value }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          updateInfo('fontWeight', fw.label);
                                                          setOpenDropdownId(null);
                                                        }}
                                                      >
                                                        {fw.label}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                        <div className="relative w-[35%]">
                                          {(() => {
                                            const sizeDropId = `info-size-drop-${item.id}`;
                                            const isSizeDropOpen = openDropdownId === sizeDropId;
                                            const sizes = Array.from({ length: 50 }, (_, i) => String((i + 1) * 2));
                                            return (
                                              <>
                                                <div
                                                  data-dropdown-trigger="true"
                                                  className={`w-full h-[4vh] border ${isSizeDropOpen ? 'border-[#5145F6]' : 'border-gray-300'} rounded-[0.4vw] flex items-center justify-between px-[0.8vw] bg-white cursor-pointer select-none transition-colors`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isSizeDropOpen) {
                                                      const rect = e.currentTarget.getBoundingClientRect();
                                                      const spaceBelow = window.innerHeight - rect.bottom;
                                                      setDropdownDirectionOverrides(prev => ({ ...prev, [sizeDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                    }
                                                    setOpenDropdownId(isSizeDropOpen ? null : sizeDropId);
                                                  }}
                                                >
                                                  <span className="text-[0.8vw] text-gray-600 truncate">{infoData.fontSize}</span>
                                                  <Icon
                                                    icon="lucide:chevron-down"
                                                    className={`text-gray-400 text-[1vw] transition-transform duration-200 ${isSizeDropOpen ? 'rotate-180' : ''}`}
                                                  />
                                                </div>
                                                {isSizeDropOpen && (
                                                  <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.6vw] shadow-lg py-[0.5vh] max-h-[20vh] overflow-y-auto ${dropdownDirectionOverrides[sizeDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
                                                    {sizes.map(size => (
                                                      <div
                                                        key={size}
                                                        className={`px-[1vw] py-[0.8vh] text-[0.85vw] cursor-pointer text-center transition-colors ${size === String(infoData.fontSize) ? 'bg-[#5145F6] text-white font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          updateInfo('fontSize', size);
                                                          setOpenDropdownId(null);
                                                        }}
                                                      >
                                                        {size}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-[0.8vw] mt-[0.5vh]">
                                      <span className="text-[0.85vw] text-black font-semibold">Colors</span>
                                      <div className="flex-1 h-[1px] bg-gray-200"></div>
                                    </div>

                                    <div className="flex flex-col gap-[0.8vh]">
                                      {(() => {
                                        const colorDropId = `info-text-color-${item.id}`;
                                        const isColorDropOpen = openDropdownId === colorDropId;
                                        return (
                                          <div className="flex items-center justify-between relative">
                                            <span className="text-[0.85vw] text-gray-800 font-medium">Text Color :</span>
                                            <div className="flex items-center gap-[0.5vw]">
                                              <div
                                                data-dropdown-trigger="true"
                                                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 cursor-pointer"
                                                style={{ backgroundColor: infoData.textColor }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenDropdownId(isColorDropOpen ? null : colorDropId);
                                                }}
                                              />
                                              <div className="flex items-center justify-between w-[9vw] h-[4vh] border border-gray-300 rounded-[0.4vw] px-[0.6vw] bg-white">
                                                <input
                                                  type="text"
                                                  className="text-[0.8vw] text-gray-600 outline-none w-[4.5vw] bg-transparent uppercase"
                                                  value={infoData.textColor}
                                                  onChange={(e) => handleInfoChange('textColor', e.target.value)}
                                                  onBlur={() => saveInfoToCanvas()}
                                                />
                                                <span className="text-[0.8vw] text-gray-600">100%</span>
                                              </div>
                                            </div>
                                            {isColorDropOpen && createPortal(
                                              <>
                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); saveInfoToCanvas(); }} />
                                                <div data-dropdown-menu="true" className="fixed z-[60]" style={{ right: '15vw', top: '45vh' }} onClick={(e) => e.stopPropagation()}>
                                                  <ColorPicker
                                                    color={infoData.textColor}
                                                    onChange={(color) => handleInfoChange('textColor', color)}
                                                    onClose={() => { setOpenDropdownId(null); saveInfoToCanvas(); }}
                                                    hidePalette={true}
                                                    disableGradient={true}
                                                  />
                                                </div>
                                              </>,
                                              document.body
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {(() => {
                                        const bgColorDropId = `info-bg-color-${item.id}`;
                                        const isBgColorDropOpen = openDropdownId === bgColorDropId;
                                        return (
                                          <div className="flex items-center justify-between relative">
                                            <span className="text-[0.85vw] text-gray-800 font-medium">Bg Color :</span>
                                            <div className="flex items-center gap-[0.5vw]">
                                              <div
                                                data-dropdown-trigger="true"
                                                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 cursor-pointer"
                                                style={{ backgroundColor: infoData.bgColor }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenDropdownId(isBgColorDropOpen ? null : bgColorDropId);
                                                }}
                                              />
                                              <div className="flex items-center justify-between w-[9vw] h-[4vh] border border-gray-300 rounded-[0.4vw] px-[0.6vw] bg-white">
                                                <input
                                                  type="text"
                                                  className="text-[0.8vw] text-gray-600 outline-none w-[4.5vw] bg-transparent uppercase"
                                                  value={infoData.bgColor}
                                                  onChange={(e) => handleInfoChange('bgColor', e.target.value)}
                                                  onBlur={() => saveInfoToCanvas()}
                                                />
                                                <span className="text-[0.8vw] text-gray-600">100%</span>
                                              </div>
                                            </div>
                                            {isBgColorDropOpen && createPortal(
                                              <>
                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); saveInfoToCanvas(); }} />
                                                <div data-dropdown-menu="true" className="fixed z-[60]" style={{ right: '15vw', top: '45vh' }} onClick={(e) => e.stopPropagation()}>
                                                  <ColorPicker
                                                    color={infoData.bgColor}
                                                    onChange={(color) => handleInfoChange('bgColor', color)}
                                                    onClose={() => { setOpenDropdownId(null); saveInfoToCanvas(); }}
                                                    hidePalette={true}
                                                    disableGradient={true}
                                                  />
                                                </div>
                                              </>,
                                              document.body
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>

                                    <div className="flex items-center gap-[0.8vw] mt-[0.5vh]">
                                      <span className="text-[0.85vw] text-black font-semibold">Animation</span>
                                      <div className="flex-1 h-[1px] bg-gray-200"></div>
                                    </div>

                                    <div className="flex flex-col gap-[1vh]">
                                      {(() => {
                                        const animStyleDropId = `info-anim-style-${item.id}`;
                                        const isAnimStyleDropOpen = openDropdownId === animStyleDropId;
                                        const animStyles = ['Default', 'Fade in', 'Slide up', 'Zoom in', 'Bounce in'];
                                        return (
                                          <div className="flex items-center justify-between">
                                            <span className="text-[0.85vw] text-gray-800 font-medium">Animation Style :</span>
                                            <div className="relative w-[10vw]">
                                              <div
                                                data-dropdown-trigger="true"
                                                className={`w-full h-[4vh] border ${isAnimStyleDropOpen ? 'border-[#5145F6]' : 'border-gray-300'} rounded-[0.4vw] flex items-center justify-between px-[0.8vw] bg-white cursor-pointer select-none transition-colors`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!isAnimStyleDropOpen) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    setDropdownDirectionOverrides(prev => ({ ...prev, [animStyleDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                  }
                                                  setOpenDropdownId(isAnimStyleDropOpen ? null : animStyleDropId);
                                                }}
                                              >
                                                <span className="text-[0.8vw] text-gray-600 truncate">{infoData.animationStyle}</span>
                                                <Icon
                                                  icon="lucide:chevron-down"
                                                  className={`text-gray-400 text-[1vw] transition-transform duration-200 ${isAnimStyleDropOpen ? 'rotate-180' : ''}`}
                                                />
                                              </div>
                                              {isAnimStyleDropOpen && (
                                                <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.6vw] shadow-lg py-[0.5vh] max-h-[20vh] overflow-y-auto ${dropdownDirectionOverrides[animStyleDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
                                                  {animStyles.map(style => (
                                                    <div
                                                      key={style}
                                                      className={`px-[1vw] py-[0.8vh] text-[0.85vw] cursor-pointer transition-colors ${style === infoData.animationStyle ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateInfo('animationStyle', style);
                                                        setOpenDropdownId(null);
                                                      }}
                                                    >
                                                      {style}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                      {(() => {
                                        const animSpeedDropId = `info-anim-speed-${item.id}`;
                                        const isAnimSpeedDropOpen = openDropdownId === animSpeedDropId;
                                        const animSpeeds = ['Default', 'Slow', 'Medium', 'Fast'];
                                        return (
                                          <div className="flex items-center justify-between">
                                            <span className="text-[0.85vw] text-gray-800 font-medium">Animation Speed :</span>
                                            <div className="relative w-[10vw]">
                                              <div
                                                data-dropdown-trigger="true"
                                                className={`w-full h-[4vh] border ${isAnimSpeedDropOpen ? 'border-[#5145F6]' : 'border-gray-300'} rounded-[0.4vw] flex items-center justify-between px-[0.8vw] bg-white cursor-pointer select-none transition-colors`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!isAnimSpeedDropOpen) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    setDropdownDirectionOverrides(prev => ({ ...prev, [animSpeedDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                  }
                                                  setOpenDropdownId(isAnimSpeedDropOpen ? null : animSpeedDropId);
                                                }}
                                              >
                                                <span className="text-[0.8vw] text-gray-600 truncate">{infoData.animationSpeed}</span>
                                                <Icon
                                                  icon="lucide:chevron-down"
                                                  className={`text-gray-400 text-[1vw] transition-transform duration-200 ${isAnimSpeedDropOpen ? 'rotate-180' : ''}`}
                                                />
                                              </div>
                                              {isAnimSpeedDropOpen && (
                                                <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.6vw] shadow-lg py-[0.5vh] max-h-[20vh] overflow-y-auto ${dropdownDirectionOverrides[animSpeedDropId] === 'up' ? 'bottom-[calc(100%+0.4vh)] origin-bottom' : 'top-[calc(100%+0.4vh)] origin-top'}`}>
                                                  {animSpeeds.map(speed => (
                                                    <div
                                                      key={speed}
                                                      className={`px-[1vw] py-[0.8vh] text-[0.85vw] cursor-pointer transition-colors ${speed === infoData.animationSpeed ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateInfo('animationSpeed', speed);
                                                        setOpenDropdownId(null);
                                                      }}
                                                    >
                                                      {speed}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
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
                                  <div className="flex flex-col w-full gap-[0.8vh]" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[0.85vw] text-black font-normal">{fileMeta ? "Download Preview" : "Upload Download File"}</span>
                                    <CommonDropBox
                                      boxClassName={`w-full h-[18vh] rounded-[0.6vw] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${fileMeta ? 'p-0' : 'bg-[#F3F4F6] hover:bg-gray-100 p-[0.3vw] gap-[0.5vh]'}`}
                                      boxStyle={!fileMeta ? {
                                        backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='10' ry='10' stroke='%238A94A6' stroke-width='2' stroke-dasharray='5%2c 8' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`
                                      } : {}}
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

                                        const optionsDropId = `download-options-${item.id}`;
                                        const isOptionsDropOpen = openDropdownId === optionsDropId;

                                        const threeDots = (
                                          <div className="absolute top-[0.4vw] right-[0.4vw] z-[20]" onClick={(e) => e.stopPropagation()}>
                                            <div
                                              data-dropdown-trigger="true"
                                              className="bg-white rounded-[0.2vw] shadow-sm p-[0.1vw] flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(isOptionsDropOpen ? null : optionsDropId);
                                              }}
                                            >
                                              <Icon icon="lucide:more-vertical" className="text-gray-700 text-[1vw]" />
                                            </div>
                                            {isOptionsDropOpen && (
                                              <div data-dropdown-menu="true" className="absolute right-0 top-[calc(100%+0.2vw)] bg-white border border-gray-200 rounded-[0.4vw] shadow-lg py-[0.4vh] min-w-[7vw] z-[99999] flex flex-col">
                                                <div
                                                  className="px-[0.8vw] py-[0.6vh] text-[0.8vw] text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-[0.4vw]"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(null);
                                                    const inputEl = document.getElementById(`download-upload-${item.id}`);
                                                    if (inputEl) inputEl.click();
                                                  }}
                                                >
                                                  <Icon icon="lucide:refresh-cw" className="text-[0.9vw]" /> Replace
                                                </div>
                                                <div
                                                  className="px-[0.8vw] py-[0.6vh] text-[0.8vw] text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-[0.4vw]"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(null);
                                                    setItemValueOverrides(prev => ({ ...prev, [item.id]: null }));
                                                    const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                    if (updateElementAttribute) {
                                                      updateElementAttribute(targetIdx, item.id, {
                                                        'data-interaction': 'download',
                                                        'data-interaction-value': ''
                                                      });
                                                    }
                                                  }}
                                                >
                                                  <Icon icon="lucide:trash-2" className="text-[0.9vw]" /> Delete
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );

                                        if (isImage && cleanData) {
                                          return (
                                            <>
                                              <img src={cleanData} alt={meta.name} className="w-full h-full object-contain bg-[#F8F9FA]" />
                                              {threeDots}
                                            </>
                                          );
                                        }
                                        return (
                                          <div className="w-full h-full bg-[#F3F4F6] flex flex-col items-center justify-center relative border border-gray-200">
                                            <Icon icon="fluent:document-checkmark-24-regular" className="text-[#5145F6] text-[2vw]" />
                                            <span className="text-[0.6vw] font-medium text-gray-500 mt-[0.2vh] truncate text-center w-[12vw]" title={meta.name}>
                                              {meta.name}
                                            </span>
                                            {threeDots}
                                          </div>
                                        );
                                      }}
                                      emptyIcon=""
                                      emptyTitle={
                                        <div className="flex items-center gap-[0.4vw]">
                                          <Icon icon="lucide:plus" className="text-[1.2vw] text-[#9CA3AF]" />
                                          <span className="text-[0.85vw] text-[#9CA3AF] font-medium">Add Download File</span>
                                        </div>
                                      }
                                      subText=""
                                    />
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'call' ? (
                              (() => {
                                const val = item.value || '';
                                return (
                                  <div className="flex flex-col w-full gap-[0.8vh]" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[0.85vw] text-black font-normal">Enter your Number</span>
                                    <div className="relative w-full h-[4.5vh]">
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
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'slideshow' ? (
                              (() => {
                                let images = [];
                                try {
                                  if (resolvedValue) {
                                    images = JSON.parse(resolvedValue);
                                    if (!Array.isArray(images)) images = [];
                                  }
                                } catch (e) { }

                                return (
                                  <div className="flex flex-col w-full gap-[1.5vh] pb-[1vh]" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col w-full gap-[0.3vh]">
                                      <div className="flex items-center w-full">
                                        <span className="text-[0.85vw] text-black font-semibold mr-[0.5vw]">Upload Images</span>
                                        <div className="flex-1 border-t border-gray-300 mt-[0.2vh]"></div>
                                      </div>
                                      <span className="text-[0.6vw] text-gray-400">You Can Add up to only 6 Images in slideshow <span className="text-red-500">*</span></span>
                                    </div>

                                    {/* Hidden File Input */}
                                    <input
                                      type="file"
                                      id={`slideshow-upload-${item.id}`}
                                      className="hidden"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        if (!files.length) return;

                                        const spaceLeft = 6 - images.length;
                                        const filesToAdd = files.slice(0, spaceLeft);

                                        if (files.length > spaceLeft) {
                                          alert(`You can only add up to 6 images. Only the first ${spaceLeft} were added.`);
                                        }

                                        let loadedImages = [...images];
                                        let loadedCount = 0;

                                        filesToAdd.forEach((file) => {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            loadedImages.push({
                                              name: file.name,
                                              data: event.target.result
                                            });
                                            loadedCount++;
                                            if (loadedCount === filesToAdd.length) {
                                              const storedVal = JSON.stringify(loadedImages);
                                              setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                              if (updateElementAttribute) updateElementAttribute(targetIdx, item.id, { 'data-interaction': 'slideshow', 'data-interaction-value': storedVal });
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      }}
                                    />

                                    {images.length > 0 && (
                                      <div className="flex items-center gap-[0.5vw] flex-wrap mt-[0.2vh]">
                                        {images.map((img, idx) => (
                                          <div key={idx} className="relative w-[3.2vw] h-[3.2vw] rounded-[0.4vw] overflow-hidden border border-gray-300 shadow-sm group bg-white shrink-0">
                                            <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                                            <div
                                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const newImages = [...images];
                                                newImages.splice(idx, 1);
                                                const storedVal = JSON.stringify(newImages);
                                                setItemValueOverrides(prev => ({ ...prev, [item.id]: storedVal }));
                                                const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                if (updateElementAttribute) updateElementAttribute(targetIdx, item.id, { 'data-interaction': 'slideshow', 'data-interaction-value': storedVal });
                                              }}
                                            >
                                              <Icon icon="lucide:trash-2" className="text-white text-[1vw]" />
                                            </div>
                                          </div>
                                        ))}

                                        {images.length < 6 && (
                                          <div
                                            className="w-[3.2vw] h-[3.2vw] rounded-[0.4vw] border-[1.5px] border-dashed border-gray-400 bg-gray-50/80 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shrink-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              document.getElementById(`slideshow-upload-${item.id}`).click();
                                            }}
                                          >
                                            <Icon icon="lucide:upload" className="text-gray-400 text-[1vw] mb-[0.2vh]" />
                                            <span className="text-[0.6vw] text-gray-400 font-medium">Upload</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {images.length === 0 && (
                                      <div
                                        className="w-full h-[8.5vh] rounded-[0.8vw] border-[2px] border-dashed border-gray-400/80 bg-[#F5F5F5] flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          document.getElementById(`slideshow-upload-${item.id}`).click();
                                        }}
                                      >
                                        <div className="flex items-center text-gray-500 gap-[0.5vw] pointer-events-none">
                                          <Icon icon="lucide:plus" className="text-[1.2vw]" />
                                          <span className="text-[0.9vw] font-medium tracking-wide">Add Image</span>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex flex-col gap-[1vh] mt-[0.5vh]">
                                      {(() => {
                                        const effectDropId = `slideshow-effect-${item.id}`;
                                        const isEffectDropOpen = openDropdownId === effectDropId;
                                        const slideshowEffects = [
                                          { value: 'Spring Bounce', label: 'Spring Bounce' },
                                          { value: 'Cover Flow', label: 'Cover Flow' },
                                          { value: 'Play Cards', label: 'Play Cards' },
                                          { value: '3D Flip', label: '3D Flip' },
                                          { value: 'Zoom', label: 'Zoom' },
                                          { value: 'Drop', label: 'Drop' }
                                        ];
                                        const savedEffect = document.getElementById(item.id)?.getAttribute('data-interaction-slideshow-effect');
                                        const currentEffect = itemValueOverrides[effectDropId] || savedEffect || 'Play Cards';
                                        const currentEffectLabel = slideshowEffects.find(e => e.value === currentEffect)?.label || 'Play Cards';

                                        return (
                                          <div className="flex items-center justify-between relative">
                                            <span className="text-[0.8vw] text-black font-medium whitespace-nowrap">Transaction Effects :</span>
                                            <div
                                              data-dropdown-trigger="true"
                                              className={`w-[8.5vw] h-[3.5vh] border ${isEffectDropOpen ? 'border-[#5145F6]' : 'border-gray-600'} rounded-[0.4vw] flex items-center justify-between px-[0.6vw] cursor-pointer bg-white transition-colors`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isEffectDropOpen) {
                                                  const rect = e.currentTarget.getBoundingClientRect();
                                                  const spaceBelow = window.innerHeight - rect.bottom;
                                                  setDropdownDirectionOverrides(prev => ({ ...prev, [effectDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                }
                                                setOpenDropdownId(isEffectDropOpen ? null : effectDropId);
                                              }}
                                            >
                                              <span className="text-[0.75vw] text-gray-600 truncate">{currentEffectLabel}</span>
                                              <Icon icon="lucide:arrow-right-left" className={`text-gray-600 text-[0.9vw] transition-transform duration-200 ${isEffectDropOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                            {isEffectDropOpen && createPortal(
                                              <div data-dropdown-menu="true" className="fixed right-[15.5vw] top-1/2 -translate-y-1/2 w-[22vw] z-[999999] bg-white border border-gray-200 rounded-[0.8vw] shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-[1vw]">
                                                <div className="flex items-center justify-between mb-[1vw]">
                                                  <span className="text-[0.9vw] font-semibold text-gray-900">Effects</span>
                                                  <div className="flex-1 h-[1px] bg-gray-200 mx-[0.8vw]"></div>
                                                  <button 
                                                    className="w-[1.6vw] h-[1.6vw] flex items-center justify-center border border-red-500 rounded-[0.4vw] text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                                                  >
                                                    <Icon icon="lucide:x" className="text-[0.9vw]" />
                                                  </button>
                                                </div>                                                <style>{`
                                                  @keyframes anim-spring-bounce {
                                                    0%, 100% { transform: translateY(0) scale(1); }
                                                    50% { transform: translateY(-30%) scale(1.1); }
                                                  }
                                                  .preview-anim-spring-bounce > div { animation: anim-spring-bounce 1.5s infinite ease-in-out; }
                                                  .preview-anim-spring-bounce > div:nth-child(1) { animation-delay: 0s; }
                                                  .preview-anim-spring-bounce > div:nth-child(2) { animation-delay: 0.15s; }
                                                  .preview-anim-spring-bounce > div:nth-child(3) { animation-delay: 0.3s; }
                                                
                                                  @keyframes anim-cover-flow {
                                                    0% { transform: perspective(100px) rotateY(0deg); }
                                                    50% { transform: perspective(100px) rotateY(45deg); }
                                                    100% { transform: perspective(100px) rotateY(0deg); }
                                                  }
                                                  .preview-anim-cover-flow > div { animation: anim-cover-flow 2s infinite ease-in-out; }
                                                  .preview-anim-cover-flow > div:nth-child(1) { animation-delay: 0s; }
                                                  .preview-anim-cover-flow > div:nth-child(2) { animation-delay: 0.2s; }
                                                  .preview-anim-cover-flow > div:nth-child(3) { animation-delay: 0.4s; }
                                                
                                                  @keyframes anim-play-cards {
                                                    0% { transform: translateX(0) rotate(0deg); z-index: 1; }
                                                    50% { transform: translateX(30%) rotate(10deg) scale(1.1); z-index: 10; }
                                                    100% { transform: translateX(0) rotate(0deg); z-index: 1; }
                                                  }
                                                  .preview-anim-play-cards > div { animation: anim-play-cards 1.5s infinite ease-in-out; }
                                                  .preview-anim-play-cards > div:nth-child(1) { animation-delay: 0s; }
                                                  .preview-anim-play-cards > div:nth-child(2) { animation-delay: 0.2s; }
                                                  .preview-anim-play-cards > div:nth-child(3) { animation-delay: 0.4s; }
                                                
                                                  @keyframes anim-3d-flip {
                                                    0% { transform: perspective(200px) rotateY(0deg); }
                                                    100% { transform: perspective(200px) rotateY(360deg); }
                                                  }
                                                  .preview-anim-3d-flip > div { animation: anim-3d-flip 2s infinite linear; }
                                                  .preview-anim-3d-flip > div:nth-child(1) { animation-delay: 0s; }
                                                  .preview-anim-3d-flip > div:nth-child(2) { animation-delay: 0.3s; }
                                                  .preview-anim-3d-flip > div:nth-child(3) { animation-delay: 0.6s; }
                                                
                                                  @keyframes anim-zoom {
                                                    0%, 100% { transform: scale(1); }
                                                    50% { transform: scale(1.3); }
                                                  }
                                                  .preview-anim-zoom > div { animation: anim-zoom 1.5s infinite ease-in-out; }
                                                  .preview-anim-zoom > div:nth-child(1) { animation-delay: 0s; }
                                                  .preview-anim-zoom > div:nth-child(2) { animation-delay: 0.2s; }
                                                  .preview-anim-zoom > div:nth-child(3) { animation-delay: 0.4s; }
                                                
                                                  @keyframes anim-drop {
                                                    0% { transform: translateY(-100%); opacity: 0; }
                                                    20%, 80% { transform: translateY(0); opacity: 1; }
                                                    100% { transform: translateY(100%); opacity: 0; }
                                                  }
                                                  .preview-anim-drop > div { animation: anim-drop 2s infinite ease-in; }
                                                  .preview-anim-drop > div:nth-child(1) { animation-delay: 0s; }
                                                  .preview-anim-drop > div:nth-child(2) { animation-delay: 0.3s; }
                                                  .preview-anim-drop > div:nth-child(3) { animation-delay: 0.6s; }
                                                `}</style>
                                                <div className="grid grid-cols-3 gap-[0.8vw]">
                                                  {slideshowEffects.map(eff => (
                                                    <div
                                                      key={eff.value}
                                                      className={`flex flex-col items-center gap-[0.8vh] p-[0.6vw] cursor-pointer rounded-[0.6vw] transition-all border ${eff.value === currentEffect ? 'border-[#5145F6] bg-[#F1F5F9] shadow-sm' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setItemValueOverrides(prev => ({ ...prev, [effectDropId]: eff.value }));
                                                        const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                        if (updateElementAttribute) updateElementAttribute(targetIdx, item.id, { 'data-interaction-slideshow-effect': eff.value });
                                                      }}
                                                    >
                                                      <div className="w-[4vw] h-[4vw] bg-white rounded-[0.4vw] flex items-center justify-center overflow-hidden border border-gray-200 relative shadow-sm">
                                                        <div className={`flex gap-[0.2vw] preview-anim-${eff.value.replace(/\s+/g, '-').toLowerCase()}`}>
                                                          <div className="w-[0.6vw] h-[2vw] bg-[#f3f4f6] rounded-[0.1vw]"></div>
                                                          <div className="w-[0.6vw] h-[2vw] bg-[#d1d5db] rounded-[0.1vw]"></div>
                                                          <div className="w-[0.6vw] h-[2vw] bg-[#9ca3af] rounded-[0.1vw]"></div>
                                                        </div>
                                                      </div>
                                                      <span className={`text-[0.75vw] text-center ${eff.value === currentEffect ? 'text-[#5145F6] font-semibold' : 'text-gray-600 font-medium'}`}>{eff.label}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                                <div className="flex justify-center gap-[1vw] mt-[1.5vh] pt-[1.5vh] border-t border-gray-100">
                                                  <button 
                                                    className="px-[2vw] py-[0.8vh] border border-gray-300 rounded-[0.4vw] text-[0.8vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-[0.4vw]"
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                                                  >
                                                    <Icon icon="lucide:x" className="text-[0.9vw]" />
                                                    Close
                                                  </button>
                                                  <button 
                                                    className="px-[2vw] py-[0.8vh] bg-black text-white rounded-[0.4vw] text-[0.8vw] font-medium hover:bg-gray-800 transition-colors flex items-center gap-[0.4vw]"
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                                                  >
                                                    <Icon icon="lucide:refresh-cw" className="text-[0.9vw]" />
                                                    Replace
                                                  </button>
                                                </div>
                                              </div>
                                            , document.body)}
                                          </div>
                                        );
                                      })()}

                                      {(() => {
                                        const speedDropId = `slideshow-speed-${item.id}`;
                                        const isSpeedDropOpen = openDropdownId === speedDropId;
                                        const slideshowSpeeds = ['Slow', 'Medium', 'Fast'];
                                        const savedSpeed = document.getElementById(item.id)?.getAttribute('data-interaction-slideshow-speed');
                                        const currentSpeed = itemValueOverrides[speedDropId] || savedSpeed || 'Medium';

                                        return (
                                          <div className="flex items-center justify-between relative">
                                            <span className="text-[0.8vw] text-black font-medium whitespace-nowrap">Transaction Speed :</span>
                                            <div
                                              data-dropdown-trigger="true"
                                              className={`w-[8.5vw] h-[3.5vh] border ${isSpeedDropOpen ? 'border-[#5145F6]' : 'border-gray-600'} rounded-[0.4vw] flex items-center justify-between px-[0.6vw] cursor-pointer bg-white transition-colors`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isSpeedDropOpen) {
                                                  const rect = e.currentTarget.getBoundingClientRect();
                                                  const spaceBelow = window.innerHeight - rect.bottom;
                                                  setDropdownDirectionOverrides(prev => ({ ...prev, [speedDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                                }
                                                setOpenDropdownId(isSpeedDropOpen ? null : speedDropId);
                                              }}
                                            >
                                              <span className="text-[0.75vw] text-gray-600 truncate">{currentSpeed}</span>
                                              <Icon icon="lucide:chevron-down" className={`text-gray-600 text-[1vw] transition-transform duration-200 ${isSpeedDropOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                            {isSpeedDropOpen && (
                                              <div data-dropdown-menu="true" className={`absolute right-0 w-[8.5vw] z-[99999] bg-white border border-gray-200 rounded-[0.5vw] shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-[0.5vh] ${dropdownDirectionOverrides[speedDropId] === 'up' ? 'bottom-[calc(100%+0.5vh)] origin-bottom' : 'top-[calc(100%+0.5vh)] origin-top'}`}>
                                                {slideshowSpeeds.map(spd => (
                                                  <div
                                                    key={spd}
                                                    className={`px-[1vw] py-[1vh] text-[0.85vw] cursor-pointer transition-colors ${spd === currentSpeed ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setItemValueOverrides(prev => ({ ...prev, [speedDropId]: spd }));
                                                      const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                      if (updateElementAttribute) updateElementAttribute(targetIdx, item.id, { 'data-interaction-slideshow-speed': spd });
                                                      setOpenDropdownId(null);
                                                    }}
                                                  >
                                                    {spd}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'popup' ? (
                              <div className="flex flex-col w-full">
                                <span className="text-[0.9vw] font-medium text-black mb-[1vh]">Popup Preview</span>
                                {resolvedValue ? (
                                  <div className="flex flex-col gap-[1.5vh] w-full">
                                    <div className="w-full bg-white rounded-[0.5vw] border border-gray-100 flex flex-col p-[0.3vw] shadow-sm relative overflow-visible group">
                                      <div className="flex items-center justify-between px-[0.6vw] pt-[0.4vh] pb-[0.6vh]">
                                        <span className="text-[0.6vw] text-gray-500">Enter Popup Heading here</span>
                                        <span className="text-[0.7vw] text-gray-400">×</span>
                                      </div>

                                      {/* Inner container for image */}
                                      <div className="relative w-full h-[18vh] rounded-[0.4vw] overflow-hidden bg-[#F4F5F7] border border-gray-100">
                                        {TEMPLATES.find(tpl => tpl.id === resolvedValue)?.image ? (
                                          <img
                                            src={TEMPLATES.find(tpl => tpl.id === resolvedValue)?.image}
                                            alt="Selected Template"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : null}

                                        {/* 3 dots menu inside the image box */}
                                        <div className="absolute top-[0.4vh] right-[0.2vw] z-10">
                                          <div
                                            className="p-[0.2vw] cursor-pointer bg-white/50 backdrop-blur-sm rounded-[0.2vw] opacity-0 group-hover:opacity-100 transition-opacity"
                                            data-dropdown-trigger="true"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenDropdownId(openDropdownId === `popup-${item.id}` ? null : `popup-${item.id}`);
                                            }}
                                          >
                                            <Icon icon="bi:three-dots-vertical" className="text-gray-800 drop-shadow-md text-[1.2vw]" />
                                          </div>
                                        </div>
                                      </div>

                                      {/* 3 dots dropdown menu (placed outside hidden overflow) */}
                                      {openDropdownId === `popup-${item.id}` && (
                                        <div
                                          data-dropdown-menu="true"
                                          className="absolute top-[4vh] right-[0.5vw] w-[9.5vw] bg-white rounded-[0.4vw] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-200 py-[0.4vh] flex flex-col z-20"
                                        >
                                          <div
                                            className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-gray-50 cursor-pointer transition-colors group/menu"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenDropdownId(null);
                                              setActiveTemplateSelectionId(item.id);
                                            }}
                                          >
                                            <Icon icon="carbon:template" className="text-gray-800 text-[1.1vw] group-hover/menu:text-black" />
                                            <span className="text-[0.75vw] text-gray-700 font-medium group-hover/menu:text-gray-900">Change Template</span>
                                          </div>
                                          <div
                                            className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.6vh] hover:bg-red-50 cursor-pointer transition-colors group/menu"
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
                                            <Icon icon="iconamoon:trash-light" className="text-[#EF4444] text-[1.1vw] group-hover/menu:text-red-600" />
                                            <span className="text-[0.75vw] text-[#EF4444] font-medium group-hover/menu:text-red-600">Delete</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Edit Button */}
                                    <div
                                      className="w-full bg-white border border-gray-100 shadow-sm rounded-[0.5vw] flex items-center justify-center py-[1vh] cursor-pointer hover:shadow-md transition-shadow gap-[0.8vw] group"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onCustomizePopup) {
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          onCustomizePopup(resolvedValue, item.id, targetIdx);
                                        }
                                      }}
                                    >
                                      <Icon icon="bx:edit" className="text-[1.4vw] text-black group-hover:text-gray-700 transition-colors" />
                                      <span className="text-[1vw] text-black font-medium group-hover:text-gray-700 transition-colors">Edit Popup</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full bg-[#FAFAFA] rounded-[0.5vw] border border-gray-100 flex flex-col p-[0.3vw] shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center justify-between px-[0.6vw] pt-[0.4vh] pb-[0.6vh]">
                                      <span className="text-[0.6vw] text-gray-500">Enter Popup Heading here</span>
                                      <span className="text-[0.7vw] text-gray-400">×</span>
                                    </div>
                                    <div
                                      onClick={(e) => { e.stopPropagation(); setActiveTemplateSelectionId(item.id); }}
                                      className="w-full relative py-[1.8vh] border-[1.5px] border-dashed border-[#A0AEC0] rounded-[0.4vw] bg-[#F4F5F7] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors group overflow-hidden"
                                    >
                                      <div className="flex flex-col items-center gap-[1vh] mt-[0.2vh]">
                                        <div className="flex items-center gap-[0.5vw] text-[#8A94A6] group-hover:text-gray-600 transition-colors">
                                          <Icon icon="lucide:plus" className="text-[1.2vw]" strokeWidth="2" />
                                          <span className="text-[0.95vw] font-medium">Add Popup File</span>
                                        </div>
                                        <span className="text-[0.75vw] text-gray-400">or</span>
                                        <div className="flex items-center gap-[0.5vw] bg-white px-[1.5vw] py-[0.8vh] rounded-[0.4vw] shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-gray-100 mt-[0.2vh] hover:shadow-md transition-shadow">
                                          <Icon icon="bx:layout" className="text-[1.2vw] text-black" />
                                          <span className="text-[0.9vw] text-black font-medium">Choose Template</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : resolvedActionId === '3d-viewer' ? (
                              (() => {
                                let fileMeta = null;
                                try {
                                  if (resolvedValue && resolvedValue.startsWith('{')) {
                                    fileMeta = JSON.parse(resolvedValue);
                                  }
                                } catch (e) { }

                                return (
                                  <div className="flex-1 min-w-0 flex flex-col gap-[1vh]" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[0.8vw] text-gray-900 font-medium tracking-wide">
                                      {fileMeta ? '3D Model Preview' : 'Upload 3D Model'}
                                    </span>
                                  
                                    {(() => {
                                      const handle3DFileSelect = (file) => {
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
                                          const defaultConfig = JSON.stringify({
                                            shadowStrength: 35, shadowSoftness: 35, autoRotate: true, autoRotateSpeed: 1.5, lockMaxZoom: true, maxZoom: 4.5, bgType: 'Solid', bgColor: '#000000', customBg: true, enableAR: true, qrText: 'Scan Me', qrColor: '#000000', qrBgType: 'Solid', qrBgColor: '#ffffff', qrLevel: 'L', qrDotType: 'square', qrCornerSquareType: 'square', qrCornerDotType: 'square', qrLogo: null, topText: 'You can Rotate 3D Model', bottomText: file.name || '3D Model'
                                          });
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction': '3d-viewer',
                                            'data-interaction-value': storedVal,
                                            'data-interaction-config': defaultConfig
                                          });
                                        }
                                      };

                                      return (
                                        <>
                                          {/* Hidden file input */}
                                          <input
                                            type="file"
                                            id={`3d-upload-${item.id}`}
                                            className="hidden"
                                            accept=".glb,.gltf"
                                            onChange={(e) => handle3DFileSelect(e.target.files?.[0])}
                                          />

                                          {!fileMeta ? (
                                            <div className="flex flex-row w-full gap-[0.5vw] items-stretch">
                                              <div className="flex-1 h-[11vh]">
                                                <CommonDropBox
                                                  id={`3d-upload-${item.id}`}
                                                  accept=".glb,.gltf"
                                                  onFileSelect={handle3DFileSelect}
                                                  fileMeta={fileMeta}
                                                  boxClassName="w-full h-[11vh] border-2 border-dashed border-[#8A94A6] rounded-[0.6vw] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all p-[0.3vw]"
                                                  emptyIcon="prime:upload"
                                                  subText="File Format : GLB"
                                                />
                                              </div>
                                              <div 
                                                className="w-[6vw] h-[11vh] rounded-[0.6vw] flex flex-col items-center justify-center relative overflow-hidden shadow-sm flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity" 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActive3DGalleryItem(item);
                                                }}
                                              >
                                                <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80')" }} />
                                                <div className="absolute inset-0 bg-[#0A0F1C] opacity-60 mix-blend-multiply" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] to-transparent opacity-80" />
                                                <div className="z-10 flex flex-col items-center gap-[0.5vh]">
                                                  <Icon icon="clarity:image-gallery-solid" className="text-white text-[1.4vw]" />
                                                  <span className="text-[0.8vw] font-medium text-white tracking-wide">Gallery</span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col w-full gap-[1.2vh]">
                                              <CommonDropBox
                                                id={`3d-upload-${item.id}`}
                                                accept=".glb,.gltf"
                                                onFileSelect={handle3DFileSelect}
                                                fileMeta={fileMeta}
                                                boxClassName="w-full h-[18vh] border border-gray-200 rounded-[0.5vw] shadow-sm relative group bg-white flex items-center justify-center cursor-pointer"
                                                renderPreview={(meta) => (
                                                  <div className="w-full h-full relative group rounded-[0.5vw]">
                                                    <div className="absolute inset-0 overflow-hidden rounded-[0.5vw] flex items-center justify-center pointer-events-none">
                                                      <div className="absolute inset-0 bg-white z-0" />
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
                                                      {/* 3 dots menu */}
                                                      <div className="absolute top-[0.4vh] right-[0.2vw] pointer-events-auto">
                                                        <div
                                                          className="p-[0.2vw] cursor-pointer bg-white/50 rounded-full hover:bg-white/80 transition-colors backdrop-blur-sm"
                                                          data-dropdown-trigger="true"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownId(openDropdownId === `3d-menu-${item.id}` ? null : `3d-menu-${item.id}`);
                                                          }}
                                                        >
                                                          <Icon icon="bi:three-dots-vertical" className="text-gray-800 drop-shadow-sm text-[1.2vw]" />
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
                                              />
                                              
                                              <button
                                                className="w-full h-[4.5vh] border border-gray-200 rounded-[0.5vw] shadow-sm bg-white flex items-center justify-center gap-[0.6vw] hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (fileMeta && fileMeta.data) {
                                                    setCurrent3DItem(item);
                                                    setIs3DModalOpen(true);
                                                  }
                                                }}
                                              >
                                                <Icon icon="bx:edit" className="text-black text-[1.3vw]" />
                                                <span className="text-[0.9vw] font-medium text-black tracking-wide">Edit Popup View</span>
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                );
                              })()
                            ) : resolvedActionId === 'zoom' ? (
                              <div className="flex flex-col w-full gap-[1vh]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col gap-[0.5vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-medium select-none">Zoom View</span>
                                  <ZoomTargetThumbnail targetId={item.id} />
                                </div>

                                <div className="flex items-center justify-between w-full mt-[0.5vh]">
                                  <span className="text-[0.85vw] text-gray-600 font-medium whitespace-nowrap">Zoom Level :</span>
                                  <div className="relative w-[12vw]">
                                    <select
                                      className="w-full appearance-none h-[4vh] px-[0.8vw] text-[0.8vw] text-gray-600 border border-gray-300 rounded-[0.4vw] bg-white outline-none focus:border-[#5145F6]"
                                      value={item.zoomLevel || '2X'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTimeout(() => {
                                          if (updateElementAttribute) {
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, { 'data-zoom-level': val });
                                          }
                                        }, 0);
                                      }}
                                    >
                                      <option value="1.5X">1.5X</option>
                                      <option value="2X">2X</option>
                                      <option value="2.5X">2.5X</option>
                                      <option value="3X">3X</option>
                                    </select>
                                    <Icon icon="lucide:chevron-down" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 text-[1vw] pointer-events-none" />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between w-full">
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
                              </div>
                            ) : resolvedActionId === 'open-link' ? (
                              <div className="flex flex-col w-full gap-[0.8vh]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col gap-[0.2vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-normal select-none">Enter your link</span>
                                  <div className="w-full h-[4.5vh] border border-[#C5C5C5] rounded-[0.5vw] flex items-center px-[0.8vw] bg-white overflow-hidden hover:border-gray-400 focus-within:border-[#5145F6] transition-colors shadow-sm">
                                    <Icon icon="ph:globe" className="text-gray-500 text-[1.2vw] flex-shrink-0 mr-[0.5vw]" />
                                    <input
                                      type="text"
                                      placeholder="https://maps.app.go..."
                                      value={localInputValues[item.id] !== undefined ? localInputValues[item.id] : (resolvedValue || '')}
                                      className="flex-1 text-[0.85vw] text-gray-600 placeholder-gray-400 bg-transparent outline-none truncate font-medium"
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
                                              'data-interaction': 'open-link',
                                              'data-interaction-value': val
                                            });
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-[0.2vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-normal select-none">Behavior</span>
                                  <div className="relative w-full">
                                    <select
                                      className="w-full appearance-none h-[4.5vh] px-[1vw] pr-[2.5vw] text-[0.85vw] text-gray-600 font-normal border border-[#C5C5C5] rounded-[0.5vw] bg-white outline-none focus:border-[#5145F6] shadow-sm hover:border-gray-400 transition-colors cursor-pointer"
                                      value={linkBehaviorOverrides[item.id] || item.linkBehavior || 'current'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setLinkBehaviorOverrides(prev => ({ ...prev, [item.id]: val }));
                                        if (updateElementAttribute) {
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction-link-behavior': val
                                          });
                                        }
                                      }}
                                    >
                                      <option value="current">Open in - Current Tab</option>
                                      <option value="new">Open in - New Tab</option>
                                    </select>
                                    <Icon icon="lucide:chevron-down" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500 text-[1vw] pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            ) : resolvedActionId === 'whatsapp' ? (
                              <div className="flex flex-col w-full gap-[1.5vh]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col gap-[0.4vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-normal select-none">Enter your WhatsApp Number</span>
                                  <div className="w-full h-[4.5vh]">
                                    <CallInteractionInput
                                      initialValue={localInputValues[item.id] !== undefined ? localInputValues[item.id] : (resolvedValue || '')}
                                      onSave={(val) => {
                                        setLocalInputValues(prev => ({ ...prev, [item.id]: val }));
                                        if (updateElementAttribute) {
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction': 'whatsapp',
                                            'data-interaction-value': val
                                          });
                                        }
                                      }}
                                      isWhatsApp={true}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-[0.4vh]">
                                  <div className="flex items-center gap-[0.3vw]">
                                    <span className="text-[0.8vw] text-gray-800 font-normal select-none">Pre filled Message</span>
                                    <span className="text-[0.6vw] text-gray-500 font-normal select-none">(Optional)</span>
                                  </div>
                                  <div className="relative w-full h-[4.5vh] border border-[#C5C5C5] rounded-[0.5vw] flex items-center px-[0.8vw] bg-white overflow-hidden hover:border-gray-400 focus-within:border-[#5145F6] transition-colors shadow-sm">
                                    <Icon icon="lucide:message-square-text" className="text-gray-500 text-[1.1vw] flex-shrink-0 mr-[0.5vw]" />
                                    <input
                                      type="text"
                                      placeholder="Hello! I have a question"
                                      maxLength={100}
                                      value={whatsappMessageOverrides[item.id] !== undefined ? whatsappMessageOverrides[item.id] : (item.whatsappMessage || '')}
                                      className="flex-1 text-[0.85vw] text-gray-600 placeholder-gray-400 bg-transparent outline-none font-normal"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setWhatsappMessageOverrides(prev => ({ ...prev, [item.id]: val }));
                                      }}
                                      onBlur={() => {
                                        const val = whatsappMessageOverrides[item.id];
                                        if (val !== undefined && val !== item.whatsappMessage) {
                                          if (updateElementAttribute) {
                                            const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                            updateElementAttribute(targetIdx, item.id, {
                                              'data-interaction-whatsapp-message': val
                                            });
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                      }}
                                    />
                                    <span className="text-[0.7vw] text-gray-400 ml-[0.5vw] select-none whitespace-nowrap">
                                      {((whatsappMessageOverrides[item.id] !== undefined ? whatsappMessageOverrides[item.id] : (item.whatsappMessage || '')) || '').length}/100
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-[0.4vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-normal select-none">Behavior</span>
                                  <div className="relative w-full">
                                    <select
                                      className="w-full appearance-none h-[4.5vh] px-[1vw] pr-[2.5vw] text-[0.85vw] text-gray-600 font-normal border border-[#C5C5C5] rounded-[0.5vw] bg-white outline-none focus:border-[#5145F6] shadow-sm hover:border-gray-400 transition-colors cursor-pointer"
                                      value={linkBehaviorOverrides[item.id] || item.linkBehavior || 'current'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setLinkBehaviorOverrides(prev => ({ ...prev, [item.id]: val }));
                                        if (updateElementAttribute) {
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction-link-behavior': val
                                          });
                                        }
                                      }}
                                    >
                                      <option value="current">Open in - Current Tab</option>
                                      <option value="new">Open in - New Tab</option>
                                    </select>
                                    <Icon icon="lucide:chevron-down" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500 text-[1vw] pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            ) : resolvedActionId === 'email' ? (
                              <div className="flex flex-col w-full gap-[1.5vh]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col gap-[0.4vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-normal select-none">Enter your Email Address</span>
                                  <div className="w-full h-[4.5vh] border border-gray-400 rounded-[0.5vw] flex items-center px-[0.8vw] bg-white overflow-hidden hover:border-gray-500 focus-within:border-[#5145F6] transition-colors shadow-sm">
                                    <Icon icon="ic:outline-mail" className="text-gray-600 text-[1.2vw] mr-[0.5vw]" />
                                    <input
                                      type="email"
                                      placeholder="Enter Email Id"
                                      value={localInputValues[item.id] !== undefined ? localInputValues[item.id] : (resolvedValue || '')}
                                      className="w-full h-full text-[0.85vw] font-medium text-gray-700 placeholder-gray-400 bg-transparent outline-none truncate"
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
                                              'data-interaction': 'email',
                                              'data-interaction-value': val
                                            });
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-[0.4vh]">
                                  <span className="text-[0.8vw] text-gray-800 font-normal select-none">Behavior</span>
                                  <div className="relative w-full">
                                    <select
                                      className="w-full appearance-none h-[4.5vh] px-[1vw] pr-[2.5vw] text-[0.85vw] text-gray-600 font-normal border border-gray-400 rounded-[0.5vw] bg-white outline-none focus:border-[#5145F6] shadow-sm hover:border-gray-500 transition-colors cursor-pointer"
                                      value={linkBehaviorOverrides[item.id] || item.linkBehavior || 'current'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setLinkBehaviorOverrides(prev => ({ ...prev, [item.id]: val }));
                                        if (updateElementAttribute) {
                                          const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                          updateElementAttribute(targetIdx, item.id, {
                                            'data-interaction-link-behavior': val
                                          });
                                        }
                                      }}
                                    >
                                      <option value="current">Open in - Current Tab</option>
                                      <option value="new">Open in - New Tab</option>
                                    </select>
                                    <Icon icon="lucide:chevron-down" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500 text-[1vw] pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 h-[4vh] border border-gray-400 rounded-[0.5vw] flex items-center px-[0.8vw] bg-white overflow-hidden">
                                <input
                                  type="text"
                                  placeholder={resolvedActionId === 'email' ? "Enter Email Address..." : "Enter URL..."}
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

                          {/* Tooltip extra options removed */}

                          {/* Popup extra options */}
                          {resolvedActionId === 'popup' && (
                            <div className="flex flex-col gap-[1.5vh] w-full mt-[1.5vh]">
                              {/* Animation Dropdown */}
                              <div className="flex items-center w-full gap-[0.5vw]">
                                <span className="w-[6.5vw] text-[0.9vw] text-black font-medium whitespace-nowrap">Animation :</span>
                                <div className="relative flex-1">
                                  {(() => {
                                    const animDropId = `popup-anim-${item.id}`;
                                    const isAnimDropOpen = openDropdownId === animDropId;
                                    const popupAnimations = [
                                      { value: 'Fade In /Out', label: 'Fade in' },
                                      { value: 'Slide Up', label: 'Slide Up' },
                                      { value: 'Slide Down', label: 'Slide Down' },
                                      { value: 'Zoom In', label: 'Zoom In' }
                                    ];
                                    const savedAnim = document.getElementById(item.id)?.getAttribute('data-interaction-popup-animation');
                                    const currentAnim = itemValueOverrides[animDropId] || savedAnim || item.popupAnimation || 'Fade In /Out';
                                    const currentAnimLabel = popupAnimations.find(a => a.value === currentAnim)?.label || 'Fade in';

                                    return (
                                      <>
                                        <div
                                          data-dropdown-trigger="true"
                                          className={`w-full h-[4.5vh] border ${isAnimDropOpen ? 'border-[#5145F6]' : 'border-gray-400'} rounded-[0.4vw] flex items-center justify-between px-[1vw] bg-white cursor-pointer select-none transition-colors`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isAnimDropOpen) {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              const spaceBelow = window.innerHeight - rect.bottom;
                                              setDropdownDirectionOverrides(prev => ({ ...prev, [animDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                            }
                                            setOpenDropdownId(isAnimDropOpen ? null : animDropId);
                                          }}
                                        >
                                          <span className="text-[0.85vw] text-gray-600 font-medium truncate">{currentAnimLabel}</span>
                                          <Icon
                                            icon="lucide:chevron-down"
                                            className={`text-gray-400 text-[1.2vw] transition-transform duration-200 ${isAnimDropOpen ? 'rotate-180' : ''}`}
                                          />
                                        </div>
                                        {isAnimDropOpen && (
                                          <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.5vw] shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-[0.5vh] ${dropdownDirectionOverrides[animDropId] === 'up' ? 'bottom-[calc(100%+0.5vh)] origin-bottom' : 'top-[calc(100%+0.5vh)] origin-top'}`}>
                                            {popupAnimations.map(anim => (
                                              <div
                                                key={anim.value}
                                                className={`px-[1vw] py-[1vh] text-[0.85vw] cursor-pointer transition-colors ${anim.value === currentAnim ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setItemValueOverrides(prev => ({ ...prev, [animDropId]: anim.value }));
                                                  if (updateElementAttribute) {
                                                    const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                    updateElementAttribute(targetIdx, item.id, {
                                                      'data-interaction-popup-animation': anim.value
                                                    });
                                                  }
                                                  setOpenDropdownId(null);
                                                }}
                                              >
                                                {anim.label}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Animation Speed Dropdown */}
                              <div className="flex items-center w-full gap-[0.5vw]">
                                <span className="w-[6.5vw] text-[0.9vw] text-black font-medium whitespace-nowrap">Speed :</span>
                                <div className="relative flex-1">
                                  {(() => {
                                    const speedDropId = `popup-speed-${item.id}`;
                                    const isSpeedDropOpen = openDropdownId === speedDropId;
                                    const popupSpeeds = ['Slow', 'Medium', 'Fast'];
                                    const savedSpeed = document.getElementById(item.id)?.getAttribute('data-interaction-popup-speed');
                                    const currentSpeed = itemValueOverrides[speedDropId] || savedSpeed || item.popupSpeed || 'Medium';

                                    return (
                                      <>
                                        <div
                                          data-dropdown-trigger="true"
                                          className={`w-full h-[4.5vh] border ${isSpeedDropOpen ? 'border-[#5145F6]' : 'border-gray-400'} rounded-[0.4vw] flex items-center justify-between px-[1vw] bg-white cursor-pointer select-none transition-colors`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isSpeedDropOpen) {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              const spaceBelow = window.innerHeight - rect.bottom;
                                              setDropdownDirectionOverrides(prev => ({ ...prev, [speedDropId]: spaceBelow < 250 ? 'up' : 'down' }));
                                            }
                                            setOpenDropdownId(isSpeedDropOpen ? null : speedDropId);
                                          }}
                                        >
                                          <span className="text-[0.85vw] text-gray-600 font-medium truncate">{currentSpeed}</span>
                                          <Icon
                                            icon="lucide:chevron-down"
                                            className={`text-gray-400 text-[1.2vw] transition-transform duration-200 ${isSpeedDropOpen ? 'rotate-180' : ''}`}
                                          />
                                        </div>
                                        {isSpeedDropOpen && (
                                          <div data-dropdown-menu="true" className={`absolute left-0 z-[99999] w-full bg-white border border-gray-200 rounded-[0.5vw] shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-[0.5vh] ${dropdownDirectionOverrides[speedDropId] === 'up' ? 'bottom-[calc(100%+0.5vh)] origin-bottom' : 'top-[calc(100%+0.5vh)] origin-top'}`}>
                                            {popupSpeeds.map(speed => (
                                              <div
                                                key={speed}
                                                className={`px-[1vw] py-[1vh] text-[0.85vw] cursor-pointer transition-colors ${speed === currentSpeed ? 'bg-[#F1F5F9] text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setItemValueOverrides(prev => ({ ...prev, [speedDropId]: speed }));
                                                  if (updateElementAttribute) {
                                                    const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                                                    updateElementAttribute(targetIdx, item.id, {
                                                      'data-interaction-popup-speed': speed
                                                    });
                                                  }
                                                  setOpenDropdownId(null);
                                                }}
                                              >
                                                {speed}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer (Highlight Component) */}
                        <div className={`bg-white/80 backdrop-blur-sm border-t border-gray-100/60 pl-[1.6vw] pr-[1.2vw] py-[1.8vh] flex items-center justify-between rounded-b-[0.8vw]`}>
                          <div 
                            className="flex items-center gap-[0.6vw] cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isCurrentlyOn = highlightOverrides[item.id] !== undefined 
                                ? highlightOverrides[item.id] 
                                : (item['data-show-highlight'] !== 'false'); // Default to true
                              
                              setHighlightOverrides(prev => ({ ...prev, [item.id]: !isCurrentlyOn }));
                              
                              const targetIdx = item.pageIndex !== undefined ? item.pageIndex : activePageIndex;
                              if (updateElementAttribute) {
                                updateElementAttribute(targetIdx, item.id, {
                                  'data-show-highlight': (!isCurrentlyOn).toString()
                                });
                              }
                            }}
                          >
                            <div className={`w-[1.2vw] h-[1.2vw] flex-shrink-0 rounded-[0.25vw] flex items-center justify-center transition-colors ${
                              (highlightOverrides[item.id] !== undefined ? highlightOverrides[item.id] : item['data-show-highlight'] !== 'false')
                                ? 'bg-[#5145F6]'
                                : 'border border-gray-300 bg-white group-hover:border-[#5145F6]'
                            }`}>
                              {(highlightOverrides[item.id] !== undefined ? highlightOverrides[item.id] : item['data-show-highlight'] !== 'false') && (
                                <Icon icon="lucide:check" className="text-white text-[0.9vw]" strokeWidth="3" />
                              )}
                            </div>
                            <span className={`text-[0.85vw] font-medium transition-colors ${
                              (highlightOverrides[item.id] !== undefined ? highlightOverrides[item.id] : item['data-show-highlight'] !== 'false')
                                ? 'text-gray-600'
                                : 'text-gray-400 group-hover:text-gray-600'
                            }`}>
                              Highlight interaction in preview
                            </span>
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
                              const isHotspot = item.isHotspot || (frameEl && frameEl.getAttribute('data-is-hotspot') === 'true');

                              if ((isFreeFrame || isHotspot) && deleteLayer) {
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
            const galleryModelName = model.displayName || model.name || '3D Model';
            const defaultConfig = JSON.stringify({
              shadowStrength: 35, shadowSoftness: 35, autoRotate: true, autoRotateSpeed: 1.5, lockMaxZoom: true, maxZoom: 4.5, bgType: 'Solid', bgColor: '#000000', customBg: true, enableAR: true, qrText: 'Scan Me', qrColor: '#000000', qrBgType: 'Solid', qrBgColor: '#ffffff', qrLevel: 'L', qrDotType: 'square', qrCornerSquareType: 'square', qrCornerDotType: 'square', qrLogo: null, topText: 'You can Rotate 3D Model', bottomText: galleryModelName
            });
            if (updateElementAttribute) {
              updateElementAttribute(targetIdx, currentItem.id, {
                'data-interaction': '3d-viewer',
                'data-interaction-value': storedVal,
                'data-interaction-config': defaultConfig
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

      {editingHotspotId && (() => {
        const item = interactiveElementsList.find(i => i.id === editingHotspotId);
        
        // Helper to get default color based on action type
        const getDefaultBgColor = (actionId) => {
          const colorMap = {
            'whatsapp': '#34A853',
            'instagram': 'linear-gradient(45deg, rgba(255, 221, 85, 1) 0%, rgba(255, 84, 62, 1) 50%, rgba(200, 55, 171, 1) 100%)',
            'youtube': '#FF0000',
            'email': '#F97316',
            'location': '#F97316',
            'facebook': '#3D5A98',
            'linkedin': '#0A66C2',
            'x': '#000000',
            'navigate-to': '#8B5CF6',
            'slideshow': '#22C55E',
            'popup': '#14B8A6'
          };
          return colorMap[actionId] || '#359CFD';
        };

        return (
          <HotspotCustomizationPopup
            isOpen={true}
            onClose={() => setEditingHotspotId(null)}
            initialData={{
               preset: item?.presetId || 'preset3',
               iconColor: item?.iconColor || '#FFFFFF',
               bgColor: item?.bgColor || getDefaultBgColor(item?.presetId || item?.actionId),
               iconStyle: 'style1',
               src: item?.hotspotIconSrc || null,
               actionId: item?.actionId,
               hotspotHtml: item?.hotspotHtml || null,
               hotspotBBox: item?.hotspotBBox || null
            }}
            onSave={(data) => {
               if (!item) return;
               const html = data.customHtml || generateHotspotSVG(data.preset, data.bgColor, data.iconColor, data.src);
               window.dispatchEvent(new CustomEvent('update-hotspot-style', {
                 detail: {
                   id: item.id,
                   pageIndex: item.pageIndex,
                   presetId: data.preset,
                   iconSrc: data.src,
                   html: html,
                   bgColor: data.bgColor,
                   iconColor: data.iconColor
                 }
               }));
            }}
          />
        );
      })()}

    </div>
  );
};

export default React.memo(InteractionPanel);