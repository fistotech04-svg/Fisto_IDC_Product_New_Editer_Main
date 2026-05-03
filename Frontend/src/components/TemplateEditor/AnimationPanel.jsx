import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Icon } from '@iconify/react';
import {
  Sparkles,
  ChevronDown,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
  Replace,
  ScanEye
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS                                   */
/* -------------------------------------------------------------------------- */

const ANIMATION_VARIANTS = {
  'none': {},
  'fade-in': { initial: { opacity: 0 }, animate: { opacity: 1 } },
  'fade-out': { initial: { opacity: 1 }, animate: { opacity: 0 } },
  'slide-up': { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  'slide-down': { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  'slide-left': { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  'slide-right': { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  'back-in-up': { initial: { y: 500, scale: 0.7, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'back-in-down': { initial: { y: -500, scale: 0.7, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'back-in-left': { initial: { x: -500, scale: 0.7, opacity: 0 }, animate: { x: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'back-in-right': { initial: { x: 500, scale: 0.7, opacity: 0 }, animate: { x: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'zoom-in': { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  'zoom-in-up': { initial: { scale: 0.1, y: 100, opacity: 0 }, animate: { scale: 1, y: 0, opacity: 1 } },
  'zoom-in-down': { initial: { scale: 0.1, y: -100, opacity: 0 }, animate: { scale: 1, y: 0, opacity: 1 } },
  'zoom-out': { initial: { scale: 1, opacity: 1 }, animate: { scale: 0, opacity: 0 } },
  'rotate-in': { initial: { rotate: -200, opacity: 0, scale: 0 }, animate: { rotate: 0, opacity: 1, scale: 1 } },
  'rotate-in-down-left': { initial: { rotate: -45, transformOrigin: 'left bottom', opacity: 0 }, animate: { rotate: 0, opacity: 1 } },
  'rotate-in-up-right': { initial: { rotate: -90, transformOrigin: 'right bottom', opacity: 0 }, animate: { rotate: 0, opacity: 1 } },
  'bounce-in': { initial: { scale: 0.3, opacity: 0 }, animate: { scale: [0.3, 1.1, 0.9, 1.03, 0.97, 1], opacity: 1 }, transition: { duration: 0.75 } },
  'bounce-out': { initial: { scale: 1, opacity: 1 }, animate: { scale: [1, 0.97, 1.03, 0.9, 1.1, 0.3], opacity: 0 }, transition: { duration: 0.75 } },
  'flip-in': { initial: { rotateX: -90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 }, transition: { duration: 0.4 } },
  'flip-in-y': { initial: { rotateY: -90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, transition: { duration: 0.4 } },
  'roll-in': { initial: { x: -100, rotate: -120, opacity: 0 }, animate: { x: 0, rotate: 0, opacity: 1 } },
  'pulse': { animate: { scale: [1, 1.1, 1] }, transition: { repeat: Infinity, duration: 1 } },
  'tada': { animate: { scale: [1, 0.9, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1], rotate: [0, -3, -3, 3, -3, 3, -3, 3, -3, 0] }, transition: { repeat: Infinity, duration: 1 } },
  'rubber-band': { animate: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1] }, transition: { repeat: Infinity, duration: 2 } },
  'jello': { animate: { skewX: [0, -12.5, 6.25, -3.125, 1.5625, -0.78125, 0.390625, -0.1953125, 0], skewY: [0, -12.5, 6.25, -3.125, 1.5625, -0.78125, 0.390625, -0.1953125, 0] }, transition: { repeat: Infinity, duration: 2 } },
  'heartbeat': { animate: { scale: [1, 1.3, 1, 1.3, 1] }, transition: { repeat: Infinity, duration: 1.3, ease: "easeInOut" } },
  'glitch': { animate: { x: [0, -2, 2, -2, 2, 0], y: [0, 1, -1, 1, -1, 0], filter: ["none", "hue-rotate(90deg)", "hue-rotate(-90deg)", "none"] }, transition: { repeat: Infinity, duration: 0.2 } },
  'blur-in': { initial: { filter: "blur(20px)", opacity: 0 }, animate: { filter: "blur(0px)", opacity: 1 } },
  'focus-in': { initial: { filter: "blur(12px)", opacity: 0, scale: 1.2 }, animate: { filter: "blur(0px)", opacity: 1, scale: 1 } },
  'neon-glow': { animate: { textShadow: ["0 0 4px #4f46e5", "0 0 15px #4f46e5", "0 0 4px #4f46e5"], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }, transition: { repeat: Infinity, duration: 1.5 } },
  'swing': { animate: { rotate: [0, 15, -10, 5, -5, 0] }, transition: { repeat: Infinity, duration: 2 } },
  'wobble': { animate: { x: [0, -25, 20, -15, 10, -5, 0], rotate: [0, -5, 3, -3, 2, -1, 0] }, transition: { repeat: Infinity, duration: 2 } },
  'float': { animate: { y: [0, -15, 0] }, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
  'perspective-in': { initial: { rotateX: -60, opacity: 0, z: -500 }, animate: { rotateX: 0, opacity: 1, z: 0 }, transition: { duration: 1, type: "spring" } },
  'glass-reveal': { initial: { opacity: 0, backdropFilter: "blur(20px)" }, animate: { opacity: 1, backdropFilter: "blur(0px)" }, transition: { duration: 1.5 } },
};

/* -------------------------------------------------------------------------- */
/*                                WAAPI DEFINITIONS                           */
/* -------------------------------------------------------------------------- */

const WAAPI_ANIMATIONS = {
  'none': [],
  'fade-in': [{ opacity: 0 }, { opacity: 1 }],
  'fade-out': [{ opacity: 1 }, { opacity: 0 }],
  'blur-in': [{ filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0)', opacity: 1 }],
  'focus-in': [{ filter: 'blur(12px)', opacity: 0, transform: 'scale(1.2)' }, { filter: 'blur(0)', opacity: 1, transform: 'scale(1)' }],
  'glass-reveal': [{ opacity: 0, backdropFilter: 'blur(20px)' }, { opacity: 1, backdropFilter: 'blur(0px)' }],
  'perspective-in': [{ transform: 'perspective(400px) rotateX(-60deg) translateZ(-500px)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg) translateZ(0)', opacity: 1 }],
  'slide-up': [{ transform: 'translateY(100px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
  'slide-down': [{ transform: 'translateY(-100px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
  'slide-left': [{ transform: 'translateX(100px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
  'slide-right': [{ transform: 'translateX(-100px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
  'back-in-up': [{ transform: 'translateY(500px) scale(0.7)', opacity: 0 }, { transform: 'translateY(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateY(0) scale(1)', opacity: 1 }],
  'back-in-down': [{ transform: 'translateY(-500px) scale(0.7)', opacity: 0 }, { transform: 'translateY(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateY(0) scale(1)', opacity: 1 }],
  'back-in-left': [{ transform: 'translateX(-500px) scale(0.7)', opacity: 0 }, { transform: 'translateX(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateX(0) scale(1)', opacity: 1 }],
  'back-in-right': [{ transform: 'translateX(500px) scale(0.7)', opacity: 0 }, { transform: 'translateX(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateX(0) scale(1)', opacity: 1 }],
  'zoom-in': [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
  'zoom-out': [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }],
  'zoom-in-up': [{ transform: 'scale(0.1) translateY(100px)', opacity: 0 }, { transform: 'scale(1) translateY(0)', opacity: 1 }],
  'zoom-in-down': [{ transform: 'scale(0.1) translateY(-100px)', opacity: 0 }, { transform: 'scale(1) translateY(0)', opacity: 1 }],
  'rotate-in': [{ transform: 'rotate(-200deg) scale(0)', opacity: 0 }, { transform: 'rotate(0) scale(1)', opacity: 1 }],
  'rotate-in-down-left': [{ transform: 'rotate(-45deg)', transformOrigin: 'left bottom', opacity: 0 }, { transform: 'rotate(0)', transformOrigin: 'left bottom', opacity: 1 }],
  'rotate-in-up-right': [{ transform: 'rotate(-90deg)', transformOrigin: 'right bottom', opacity: 0 }, { transform: 'rotate(0)', transformOrigin: 'right bottom', opacity: 1 }],
  'bounce-in': [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 0.8, offset: 0.5 }, { transform: 'scale(0.9)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
  'bounce-out': [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.1)', opacity: 0.8, offset: 0.2 }, { transform: 'scale(0.3)', opacity: 0, offset: 1 }],
  'flip-in': [{ transform: 'perspective(400px) rotateX(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 }],
  'flip-in-y': [{ transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }],
  'roll-in': [{ transform: 'translateX(-100px) rotate(-120deg)', opacity: 0 }, { transform: 'translateX(0) rotate(0)', opacity: 1 }],
  'pulse': [{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.5 }, { transform: 'scale(1)' }],
  'heartbeat': [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.14 }, { transform: 'scale(1)', offset: 0.28 }, { transform: 'scale(1.3)', offset: 0.42 }, { transform: 'scale(1)', offset: 0.7 }],
  'float': [{ transform: 'translateY(0)' }, { transform: 'translateY(-15px)', offset: 0.5 }, { transform: 'translateY(0)' }],
  'neon-glow': [{ filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }, { filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(79, 70, 229, 0.8))', offset: 0.5 }, { filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }],
  'tada': [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(0.9) rotate(-3deg)', offset: 0.1 }, { transform: 'scale(0.9) rotate(-3deg)', offset: 0.2 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.3 }, { transform: 'scale(1.1) rotate(-3deg)', offset: 0.4 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.5 }, { transform: 'scale(1.1) rotate(-3deg)', offset: 0.6 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.7 }, { transform: 'scale(1.1) rotate(-3deg)', offset: 0.8 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.9 }, { transform: 'scale(1) rotate(0)' }],
  'rubber-band': [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.25, 0.75)', offset: 0.3 }, { transform: 'scale(0.75, 1.25)', offset: 0.4 }, { transform: 'scale(1.15, 0.85)', offset: 0.5 }, { transform: 'scale(0.95, 1.05)', offset: 0.65 }, { transform: 'scale(1.05, 0.95)', offset: 0.75 }, { transform: 'scale(1, 1)' }],
  'jello': [{ transform: 'skew(0,0)' }, { transform: 'skew(-12.5deg, -12.5deg)', offset: 0.22 }, { transform: 'skew(6.25deg, 6.25deg)', offset: 0.33 }, { transform: 'skew(-3.125deg, -3.125deg)', offset: 0.44 }, { transform: 'skew(1.5625deg, 1.5625deg)', offset: 0.55 }, { transform: 'skew(-0.78deg, -0.78deg)', offset: 0.66 }, { transform: 'skew(0.39deg, 0.39deg)', offset: 0.77 }, { transform: 'skew(-0.2deg, -0.2deg)', offset: 0.88 }, { transform: 'skew(0,0)' }],
  'swing': [{ transform: 'rotate(0deg)' }, { transform: 'rotate(15deg)', offset: 0.2 }, { transform: 'rotate(-10deg)', offset: 0.4 }, { transform: 'rotate(5deg)', offset: 0.6 }, { transform: 'rotate(-5deg)', offset: 0.8 }, { transform: 'rotate(0deg)' }],
  'wobble': [{ transform: 'translateX(0%) rotate(0deg)' }, { transform: 'translateX(-25%) rotate(-5deg)', offset: 0.15 }, { transform: 'translateX(20%) rotate(3deg)', offset: 0.3 }, { transform: 'translateX(-15%) rotate(-3deg)', offset: 0.45 }, { transform: 'translateX(10%) rotate(2deg)', offset: 0.6 }, { transform: 'translateX(-5%) rotate(-1deg)', offset: 0.75 }, { transform: 'translateX(0%) rotate(0deg)' }],
  'glitch': [{ transform: 'translate(0)' }, { transform: 'translate(-2px, 2px)', offset: 0.2 }, { transform: 'translate(2px, -2px)', offset: 0.4 }, { transform: 'translate(-2px, 2px)', offset: 0.6 }, { transform: 'translate(2px, -2px)', offset: 0.8 }, { transform: 'translate(0)' }],
};

const ANIMATION_GALLERY_ITEMS = [
  { id: 'none', label: 'None', icon: 'None' },
  { id: 'fade-in', label: 'Fade In', icon: 'Bars' },
  { id: 'fade-out', label: 'Fade Out', icon: 'Bars' },
  { id: 'glass-reveal', label: 'Glass Reveal', icon: 'Bars' },
  { id: 'zoom-in', label: 'Zoom In', icon: 'Circle' },
  { id: 'zoom-out', label: 'Zoom Out', icon: 'Circle' },
  { id: 'zoom-in-up', label: 'Zoom Up', icon: 'Circle' },
  { id: 'zoom-in-down', label: 'Zoom Down', icon: 'Circle' },
  { id: 'rotate-in', label: 'Rotate In', icon: 'Circle' },
  { id: 'perspective-in', label: 'Perspective', icon: 'Bars' },
  { id: 'blur-in', label: 'Blur In', icon: 'Bars' },
  { id: 'focus-in', label: 'Focus In', icon: 'Circle' },
  { id: 'slide-up', label: 'Slide Up', icon: 'Bars' },
  { id: 'slide-down', label: 'Slide Down', icon: 'Bars' },
  { id: 'slide-left', label: 'Slide Left', icon: 'Bars' },
  { id: 'slide-right', label: 'Slide Right', icon: 'Bars' },
  { id: 'back-in-up', label: 'Back Up', icon: 'Bars' },
  { id: 'back-in-down', label: 'Back Down', icon: 'Bars' },
  { id: 'back-in-left', label: 'Back Left', icon: 'Bars' },
  { id: 'back-in-right', label: 'Back Right', icon: 'Bars' },
  { id: 'rotate-in-down-left', label: 'Rotate DL', icon: 'Circle' },
  { id: 'rotate-in-up-right', label: 'Rotate UR', icon: 'Circle' },
  { id: 'bounce-in', label: 'Bounce In', icon: 'Circle' },
  { id: 'bounce-out', label: 'Bounce Out', icon: 'Circle' },
  { id: 'flip-in', label: 'Flip X', icon: 'Bars' },
  { id: 'flip-in-y', label: 'Flip Y', icon: 'Bars' },
  { id: 'roll-in', label: 'Roll In', icon: 'Circle' },
  { id: 'pulse', label: 'Pulse', icon: 'Circle' },
  { id: 'heartbeat', label: 'Heartbeat', icon: 'Circle' },
  { id: 'float', label: 'Floating', icon: 'Circle' },
  { id: 'neon-glow', label: 'Neon Glow', icon: 'Circle' },
  { id: 'tada', label: 'Tada', icon: 'Circle' },
  { id: 'rubber-band', label: 'Rubber', icon: 'Circle' },
  { id: 'jello', label: 'Jello', icon: 'Circle' },
  { id: 'swing', label: 'Swing', icon: 'Circle' },
  { id: 'wobble', label: 'Wobble', icon: 'Circle' },
  { id: 'glitch', label: 'Glitch', icon: 'Circle' },
];

const EASING_OPTIONS = [
  'Linear',
  'Smooth',
  'Ease In',
  'Ease Out',
  'Ease In & Out',
  'Bounce'
];



/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

const Stepper = React.memo(({ label, value, onChange, unit = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const step = 0.1;
      let newVal = Math.max(0, parseFloat((startValRef.current + dx * step).toFixed(1)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = value;
  };

  return (
  <div className="flex items-center justify-between">
    <span className="text-[0.65vw] font-medium text-gray-500 whitespace-nowrap">{label} :</span>
    <div className="flex items-center gap-[0.25vw]">
      <button 
        onClick={() => onChange(Math.max(0, parseFloat((value - 0.1).toFixed(1))))}
        className="p-[0.25vw] text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size="0.85vw" />
      </button>
      <div 
        onMouseDown={onMouseDown}
        className="w-[4vw] h-[2vw] border border-gray-300 rounded-[0.4vw] flex items-center justify-center text-[0.7vw] font-medium text-gray-800 bg-white shadow-sm cursor-ew-resize select-none active:border-indigo-500 transition-colors"
      >
        {value}{unit}
      </div>
      <button 
        onClick={() => onChange(parseFloat((value + 0.1).toFixed(1)))}
        className="p-[0.25vw] text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronRight size="0.85vw" />
      </button>
    </div>
  </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                             RENDER SECTION                                 */
/* -------------------------------------------------------------------------- */

const AnimationSection = React.memo(({ 
  settings, title, sectionKey, onUpdateSetting, onOpenGallery, onPreview,
  showEasingSelector, setShowEasingSelector, showTopDropdowns, mainType, actionType,
  onMainTypeChange, onActionTypeChange, showMainTypeSelector, setShowMainTypeSelector
}) => {
  const isClose = sectionKey === 'close';
  const galleryItem = ANIMATION_GALLERY_ITEMS.find(a => a.id === settings.type);
  
  return (
    <div className="space-y-[1vw] transition-all duration-300">
      {/* Top Dropdowns (for On Page mode) */}
      {showTopDropdowns && (
        <div className="flex gap-[0.75vw] my-[1vw]">
          <div className="flex-1 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMainTypeSelector(showMainTypeSelector === 'context' ? null : 'context'); }}
              className="w-full h-[2.5vw] flex items-center justify-between px-[0.75vw] bg-gray-50/50 border border-gray-100 rounded-[0.75vw] hover:bg-gray-100 transition-colors group"
            >
               <span className="text-[0.75vw] font-medium text-gray-600">{mainType}</span>
               <ArrowRightLeft size="0.75vw" className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            {showMainTypeSelector === 'context' && (
              <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 w-[7.75vw] mt-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-hidden animate-in zoom-in-95 duration-200">
                {['While Opening', 'On Page'].map(type => (
                  <button key={type} onClick={(e) => onMainTypeChange(e, type)} className="w-[7.75vw] text-center px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMainTypeSelector(showMainTypeSelector === 'action' ? null : 'action'); }}
              className="w-full h-[2.5vw] flex items-center justify-between px-[0.75vw] bg-gray-50/50 border border-gray-100 rounded-[0.75vw] hover:bg-gray-100 transition-colors group"
            >
               <span className="text-[0.75vw] font-medium text-gray-600">{actionType}</span>
               <ArrowRightLeft size="0.75vw" className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            {showMainTypeSelector === 'action' && (
              <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 w-full mt-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-hidden animate-in zoom-in-95 duration-200">
                {['Click', 'Hover', 'Always'].map(type => (
                  <button key={type} onClick={(e) => onActionTypeChange(e, type)} className="w-full text-center px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={(e) => onPreview(e, settings.type, settings)}
             className="w-[2.5vw] h-[2.5vw] flex items-center justify-center bg-white border border-indigo-600 rounded-[0.75vw] text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors flex-shrink-0"
             title="Preview"
          >
            <ScanEye size="1vw" />
          </button>
        </div>
      )}

      {title && (
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.75vw] font-bold text-gray-900 whitespace-nowrap">{title}</span>
          <div className="h-[0.05vw] w-full bg-gray-100" />
        </div>
      )}
      
      <div className="flex gap-[1vw] pt-[1vw] items-start">
        {/* Style Preview Card */}
        <div 
          onClick={(e) => onPreview(e, settings.type, settings)}
          className="anim-panel-preview-card w-[5.8vw] h-[7vw]  relative group rounded-[0.8vw] overflow-hidden border border-gray-200 bg-white shadow-[0_0.05vw_0.4vw_rgba(0,0,0,0.04)] hover:shadow-xs transition-all duration-300 flex-shrink-0 flex flex-col cursor-pointer"
        >
          {/* Top Section: Graphic & Replace Button */}
          <div className="flex-1 relative w-full flex items-center justify-center">
             
             {/* Replace Button - Z-Index 20 to sit above overlay */}
             <div 
               onClick={(e) => { e.stopPropagation(); onOpenGallery(settings.type); }}
               className="anim-panel-replace-btn absolute top-[0.5vw] right-[0.5vw] w-[1.75vw] h-[1.75vw] rounded-[0.4vw] flex items-center justify-center cursor-pointer transition-all duration-200 z-20 group-hover:bg-white group-hover:shadow-sm"
               title="Replace Animation"
             >
               <Icon icon="ph:arrows-left-right" width="0.85vw" height="0.85vw" className="text-gray-400 group-hover:text-gray-900 transition-colors overlay:hidden" />
             </div>

             {/* Graphic */}
             <div className="pt-[1.5vw] group-hover:opacity-40 transition-opacity duration-100 relative z-0">
               {galleryItem?.icon === 'None' ? (
                 <div className="anim-panel-none-icon w-[2vw] h-[2vw] rounded-full border-[0.15vw] border-gray-400 flex items-center justify-center -rotate-45">
                   <div className="w-[0.1vw] h-full bg-gray-400" />
                 </div>
               ) : galleryItem?.icon === 'Circle' ? (
                 <div className="anim-panel-circle-icon w-[2vw] h-[2vw] rounded-full border-[0.1vw] border-gray-700 flex items-center justify-center">
                   <div className="w-[1.25vw] h-[1.25vw] rounded-full border-[0.1vw] border-dashed border-gray-800" />
                 </div>
               ) : (
                 <div className="anim-panel-bars flex items-end gap-[0.375vw]">
                    <div className="anim-panel-bar w-[0.625vw] h-[1.75vw] bg-gray-300 rounded-[0.05vw]" />
                    <div className="anim-panel-bar w-[0.625vw] h-[1.75vw] bg-gray-400 rounded-[0.05vw]" />
                    <div className="anim-panel-bar w-[0.625vw] h-[1.75vw] bg-gray-600 rounded-[0.05vw]" />
                 </div>
               )}
             </div>
          </div>

          {/* Divider */}
          <div className="h-[0.05vw] w-full bg-gray-100 relative z-0" />

          {/* Bottom Section: Label */}
          <div className="h-[2.25vw] w-full flex items-center justify-center bg-white relative z-0">
             <span className="text-[0.6vw] font-medium text-gray-500 truncate px-[0.5vw]">{galleryItem?.label || 'None'}</span>
          </div>

          {/* Dark Overlay on Hover - Z-Index 10 */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-300 transition-opacity duration-300 pointer-events-none z-10" />


        </div>

        {/* Steppers */}
        <div className="flex-1 space-y-[0.625vw]">
          <Stepper label="Fix Delay" value={settings.delay} onChange={(v) => onUpdateSetting('delay', v)} unit="s" />
          <Stepper label="Fix Duration" value={settings.duration} onChange={(v) => onUpdateSetting('duration', v)} unit="s" />
          <Stepper label="Fix Speed" value={settings.speed} onChange={(v) => onUpdateSetting('speed', v)} />
        </div>
      </div>

      {/* Easing Dropdown */}
      <div className="flex items-center justify-between gap-[0.5vw]">
        <span className="text-[0.75vw] font-medium text-gray-800 leading-none">Select the Easing Effects :</span>
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowEasingSelector(showEasingSelector === sectionKey ? null : sectionKey); }}
            className="flex items-center justify-between px-[0.75vw] py-[0.75vw] bg-gray-50/50 border border-gray-100 rounded-[0.75vw] hover:bg-gray-100 transition-colors group min-w-[6.2vw]"
          >
             <span className="text-[0.75vw] font-medium text-gray-600">{settings.easing}</span>
             <ChevronDown size="0.85vw" className={`text-gray-400 transition-transform duration-300 ${showEasingSelector === sectionKey ? 'rotate-180' : ''}`} />
          </button>
          {showEasingSelector === sectionKey && (
            <div onClick={(e) => e.stopPropagation()} className="absolute bottom-full left-0 w-full mb-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-visible animate-in zoom-in-95 duration-200">
              {EASING_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onUpdateSetting('easing', opt); setShowEasingSelector(null); }}
                  className="w-full text-center overflow-visible px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Options - Only show for "While Open & Close" mode */}
      {!showTopDropdowns && (
        <div className="space-y-[0.75vw] pt-[0.25vw]">
          <button onClick={() => onUpdateSetting('everyVisit', !settings.everyVisit)} className="flex items-center gap-[0.75vw] w-full overflow-visible text-left group">
            <div className={`w-[1.25vw] h-[1.25vw] rounded-full border-2 flex items-center justify-center transition-all ${settings.everyVisit ? 'border-indigo-600 bg-white ring-4 ring-indigo-50' : 'border-gray-300'}`}>
              <div className={`w-[0.65vw] h-[0.65vw] rounded-full transition-all ${settings.everyVisit ? 'bg-indigo-600' : 'bg-transparent'}`} />
            </div>
            <span className="text-[0.7vw] font-medium text-gray-500 group-hover:text-gray-800 transition-colors">Animate in Every Visit</span>
          </button>
          
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const AnimationPanel = ({ selectedElement, onUpdate, isOpen: externalIsOpen, onToggle }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const [mainType, setMainType] = useState('While Opening');
  const [actionType, setActionType] = useState('Click');
  const [showMainTypeSelector, setShowMainTypeSelector] = useState(null); // 'context' or 'action'
  const [showEasingSelector, setShowEasingSelector] = useState(null); // 'open' or 'close'


  const [showGallery, setShowGallery] = useState(false);
  const [gallerySection, setGallerySection] = useState('open'); // 'open' or 'close'
  const [tempSelectedAnim, setTempSelectedAnim] = useState(null);

  // States for animation settings
  const [openSettings, setOpenSettings] = useState({
    type: 'none', delay: 0, duration: 1, speed: 1, easing: 'Linear',
    everyVisit: true, fadeStart: true, fadeStartEnd: true
  });

  const [closeSettings, setCloseSettings] = useState({
    type: 'none', delay: 0, duration: 1, speed: 1, easing: 'Linear',
    everyVisit: true, fadeEnd: true
  });

  const [interactSettings, setInteractSettings] = useState({
    type: 'none', delay: 0, duration: 1, speed: 1, easing: 'Linear',
    everyVisit: true // Note: interaction triggers usually force play, but we keep structure
  });

  // Unique refs for sync and preview
  const lastElementRef = useRef(null);
  const isInitializedRef = useRef(false);
  const updateTimeoutRef = useRef(null);
  const previewCleanupRef = useRef(null);

  /* -------------------------------------------------------------------------- */
  /*                                SYNC LOGIC                                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!selectedElement) return;

    // Load values from DOM
    let newMainType = selectedElement.getAttribute('data-animation-trigger') || 'While Opening';
    if (newMainType === 'While Open & Close') newMainType = 'While Opening'; // Backward compatibility
    
    const newActionType = selectedElement.getAttribute('data-animation-action') || 'Click';

      
    const loadSettings = (prefix) => ({
      type: selectedElement.getAttribute(`data-animation-${prefix}-type`) || 'none',
      delay: parseFloat(selectedElement.getAttribute(`data-animation-${prefix}-delay`)) || 0,
      duration: parseFloat(selectedElement.getAttribute(`data-animation-${prefix}-duration`)) || 1,
      speed: parseFloat(selectedElement.getAttribute(`data-animation-${prefix}-speed`)) || 1,
      easing: selectedElement.getAttribute(`data-animation-${prefix}-easing`) || 'Linear',
      everyVisit: selectedElement.getAttribute(`data-animation-${prefix}-every-visit`) !== 'false',
      fadeStart: selectedElement.getAttribute(`data-animation-${prefix}-fade-start`) !== 'false',
      fadeEnd: selectedElement.getAttribute(`data-animation-${prefix}-fade-end`) !== 'false',
      fadeStartEnd: selectedElement.getAttribute(`data-animation-${prefix}-fade-start-end`) !== 'false'
    });

    const newOpen = loadSettings('open');
    const newClose = loadSettings('close');
    const newInteract = loadSettings('interact');

    // Update state only if changed (Deep Compare)
    setMainType(prev => prev !== newMainType ? newMainType : prev);
    setActionType(prev => prev !== newActionType ? newActionType : prev);

    
    setOpenSettings(prev => JSON.stringify(prev) !== JSON.stringify(newOpen) ? newOpen : prev);
    setCloseSettings(prev => JSON.stringify(prev) !== JSON.stringify(newClose) ? newClose : prev);
    setInteractSettings(prev => JSON.stringify(prev) !== JSON.stringify(newInteract) ? newInteract : prev);

    lastElementRef.current = selectedElement;
  }, [selectedElement]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (previewCleanupRef.current) previewCleanupRef.current();
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMainTypeSelector(null);
      setShowEasingSelector(null);
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                UPDATE LOGIC                                */
  /* -------------------------------------------------------------------------- */

  const updateAttribute = useCallback((attr, value) => {
    if (!selectedElement) return;
    selectedElement.setAttribute(attr, value);
    
    // Debounce
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (onUpdate) onUpdate();
    }, 50);
  }, [selectedElement, onUpdate]);

  const updateSetting = useCallback((section, key, value) => {
    let setter;
    if (section === 'open') setter = setOpenSettings;
    else if (section === 'close') setter = setCloseSettings;
    else setter = setInteractSettings;

    setter(prev => ({ ...prev, [key]: value }));
    updateAttribute(`data-animation-${section}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
  }, [updateAttribute]);

  const handleMainTypeChange = useCallback((e, type) => {
    if (e) e.stopPropagation();
    setMainType(type);
    updateAttribute('data-animation-trigger', type);
    setShowMainTypeSelector(null);
  }, [updateAttribute]);

  const handleActionTypeChange = useCallback((e, type) => {
    if (e) e.stopPropagation();
    setActionType(type);
    updateAttribute('data-animation-action', type);
    setShowMainTypeSelector(null);
  }, [updateAttribute]);



  /* -------------------------------------------------------------------------- */
  /*                               PREVIEW LOGIC                                */
  /* -------------------------------------------------------------------------- */

  const previewAnimation = useCallback((e, animType, animSettings) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!selectedElement) return;

    // 1. Cancel previous
    if (previewCleanupRef.current) {
      previewCleanupRef.current();
      previewCleanupRef.current = null;
    }

    const type = animType || animSettings?.type;
    const keyframes = WAAPI_ANIMATIONS[type];
    if (!type || !keyframes || keyframes.length === 0) return;

    // Helper: Map Easing
    const getWaapiEase = (name) => {
       const map = {
         'Linear': 'linear',
         'Smooth': 'ease-in-out',
         'Ease In': 'ease-in',
         'Ease Out': 'ease-out',
         'Ease In & Out': 'ease-in-out',
         'Bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
       };
       return map[name] || 'linear';
    };

    const duration = ((parseFloat(animSettings?.duration || 1)) / (parseFloat(animSettings?.speed || 1))) * 1000;
    const delay = (parseFloat(animSettings?.delay || 0)) * 1000;
    const easing = getWaapiEase(animSettings?.easing || 'Linear');

    try {
      const animation = selectedElement.animate(keyframes, {
        duration,
        delay,
        easing,
        fill: 'forwards' 
      });

      const cancel = () => {
        animation.cancel();
      };

      previewCleanupRef.current = cancel;

      let previewTime = duration + delay + 100;
      if (['pulse', 'tada', 'rubber-band', 'jello', 'heartbeat', 'glitch', 'neon-glow', 'swing', 'wobble', 'float'].includes(type) && !animType) {
         // If triggering from settings (not gallery click) and it's a loop type, maybe let it run longer? 
         // But "preview without save" usually means run once or briefly. 
         // We will enforce the duration + strict timeout to ensure it resets.
      }

      const timer = setTimeout(() => {
        cancel();
        if (previewCleanupRef.current === cancel) previewCleanupRef.current = null;
      }, previewTime);

    } catch (err) {
      console.error("Preview error:", err);
    }
  }, [selectedElement]);

  const handleReset = useCallback((e) => {
    if (e) e.stopPropagation();
    if (!selectedElement) return;

    // 1. Remove ALL data-animation- attributes
    const attributes = selectedElement.attributes;
    const toRemove = [];
    for (let i = 0; i < attributes.length; i++) {
        const name = attributes[i].name;
        if (name.startsWith('data-animation-')) {
            toRemove.push(name);
        }
    }
    toRemove.forEach(attr => selectedElement.removeAttribute(attr));

    // 2. Clear element styles that might have been left by WAAPI fill:forwards
    selectedElement.style.opacity = '';
    selectedElement.style.transform = '';
    selectedElement.style.filter = '';
    selectedElement.style.backdropFilter = '';

    // 3. Reset local states to complete defaults
    const defaultSettings = {
      type: 'none', delay: 0, duration: 1, speed: 1, easing: 'Linear',
      everyVisit: true, fadeStart: true, fadeStartEnd: true, fadeEnd: true
    };

    setOpenSettings(defaultSettings);
    setCloseSettings(defaultSettings);
    setInteractSettings(defaultSettings);
    setMainType('While Opening');
    setActionType('Click');

    // 4. Notify parent of the change
    if (onUpdate) onUpdate();
  }, [selectedElement, onUpdate]);

  /* -------------------------------------------------------------------------- */
  /*                             RENDER SECTION                                 */
  /* -------------------------------------------------------------------------- */



  const handleOpenUpdate = useCallback((k, v) => updateSetting('open', k, v), [updateSetting]);
  const handleCloseUpdate = useCallback((k, v) => updateSetting('close', k, v), [updateSetting]);
  const handleInteractUpdate = useCallback((k, v) => updateSetting('interact', k, v), [updateSetting]);
  const handleOpenGallery = useCallback((type) => { setGallerySection('open'); setTempSelectedAnim(type); setShowGallery(true); }, []);
  const handleCloseGallery = useCallback((type) => { setGallerySection('close'); setTempSelectedAnim(type); setShowGallery(true); }, []);
  const handleInteractGallery = useCallback((type) => { setGallerySection('interact'); setTempSelectedAnim(type); setShowGallery(true); }, []);

  const hasAnimation = openSettings.type !== 'none' || closeSettings.type !== 'none' || interactSettings.type !== 'none';

  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-2 w-full max-w-sm">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
        input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type='range']::-webkit-slider-runnable-track { height: 0.25vw; border-radius: 0.125vw; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 0.75vw; width: 0.75vw; border-radius: 50%; background: #6366f1; border: 0.1vw solid #ffffff; box-shadow: 0 0.05vw 0.15vw rgba(0,0,0,0.2); margin-top: -0.25vw; cursor: pointer; }
      `}</style>
      <div className="bg-white border border-gray-200 rounded-[0.8vw] shadow-sm overflow-visible">
        {/* Panel Header */}
        <div 
          className={`flex items-center justify-between px-[1vw] py-[1vw] cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${isOpen ? 'rounded-t-[0.8vw]' : 'rounded-[0.8vw]'}`}
          onClick={onToggle || (() => setInternalIsOpen(!internalIsOpen))}
        >
          <div className="flex items-center gap-[0.5vw]">
            <Sparkles size="1vw" className="text-gray-600" />
            <span className="font-medium text-gray-700 text-[0.85vw]">Animation</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            {hasAnimation && (
              <button 
                onClick={handleReset}
                className=" rounded-[0.4vw] text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                title="Reset All Animations"
              >
                <Icon icon="ix:reset" className="w-[1.1vw] h-[1.1vw]" />
              </button>
            )}
            <ChevronUp 
              size="1vw" 
              className={`text-gray-500 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`} 
            />
          </div>
        </div>

        {isOpen && (
          <div className="space-y-[1.25vw] px-[1.25vw] pb-[1.25vw] pt-[1vw]">
            {mainType === 'While Opening' && (
              <>
                {/* Mode Dropdown */}
                <div className="flex gap-[0.75vw] mb-[1vw]">
                  <div className="flex-1 relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMainTypeSelector(showMainTypeSelector === 'context' ? null : 'context'); }}
                      className="w-[7.75vw] h-[2.5vw] flex items-center justify-between px-[0.75vw] bg-gray-50/50 border border-gray-100 rounded-[0.75vw] hover:bg-gray-100 transition-colors group"
                    >
                       <span className="text-[0.75vw] font-medium text-gray-600">{mainType}</span>
                       <ArrowRightLeft size="0.75vw" className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    {showMainTypeSelector === 'context' && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 w-[7.75vw] mt-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-hidden animate-in zoom-in-95 duration-200">
                        {['While Opening', 'On Page'].map(type => (
                          <button key={type} onClick={(e) => handleMainTypeChange(e, type)} className="w-[7.75vw] text-center px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => previewAnimation(e, openSettings.type, openSettings)}
                     className="w-[2.5vw] h-[2.5vw] flex items-center justify-center bg-indigo-50 border border-indigo-600 rounded-[0.75vw] text-indigo-600 shadow-sm hover:bg-indigo-200 transition-colors flex-shrink-0"
                     title="Preview Animation"
                  >
                    <ScanEye size="1vw" />
                  </button>
                </div>

                {/* Animation Sections */}
                <AnimationSection 
                  sectionKey="open" settings={openSettings} 
                  onUpdateSetting={handleOpenUpdate} onOpenGallery={handleOpenGallery} onPreview={previewAnimation}
                  showEasingSelector={showEasingSelector} setShowEasingSelector={setShowEasingSelector}
                  showTopDropdowns={false}
                />
              </>
            )}

            {/* On Page Mode */}
            {mainType === 'On Page' && (
              <AnimationSection 
                sectionKey="interact" settings={interactSettings} 
                onUpdateSetting={handleInteractUpdate} onOpenGallery={handleInteractGallery} onPreview={previewAnimation}
                showEasingSelector={showEasingSelector} setShowEasingSelector={setShowEasingSelector}
                showTopDropdowns={true}
                mainType={mainType}
                actionType={actionType}
                onMainTypeChange={handleMainTypeChange}
                onActionTypeChange={handleActionTypeChange}
                showMainTypeSelector={showMainTypeSelector}
                setShowMainTypeSelector={setShowMainTypeSelector}
              />
            )}
          </div>
        )}
      </div>

      {/* Animation Gallery Modal */}
      {showGallery && (
        <div className="anim-panel-gallery-modal fixed z-[50] bg-white  rounded-[0.6vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '20vw', height: '34vw', top: '55%', left: '80%', transform: 'translate(-50%, -50%)' }}>
          <div className="anim-panel-gallery-header flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-100">
            <h2 className="text-[0.9vw] font-semibold text-gray-900">Animation Gallery</h2>
            <button onClick={() => setShowGallery(false)} className="anim-panel-close-btn w-[2vw] h-[2vw] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X size="0.9vw" className="text-gray-400" />
            </button>
          </div>

          <div className="anim-panel-gallery-content flex-1 px-[1vw] py-[1vw] overflow-y-auto custom-scrollbar">
            <h3 className="text-[0.7vw] font-semibold text-gray-900 mb-[1vw]">Choose Animation</h3>
            <div className="anim-panel-gallery-grid grid grid-cols-3 gap-x-[1vw] gap-y-[1.5vw]">
              {ANIMATION_GALLERY_ITEMS.map((anim, idx) => (
                <div key={idx} className="anim-panel-gallery-item group cursor-pointer flex flex-col items-center" onClick={(e) => {
                  setTempSelectedAnim(anim.id);
                  let targetSettings;
                  if (gallerySection === 'open') targetSettings = openSettings;
                  else if (gallerySection === 'close') targetSettings = closeSettings;
                  else targetSettings = interactSettings;
                  
                  previewAnimation(e, anim.id, targetSettings);
                }}>
                  <div className={`anim-panel-item-card aspect-square w-full rounded-[0.4vw] border-2 flex flex-col items-center justify-center transition-all bg-gray-50/30 overflow-hidden ${
                    tempSelectedAnim === anim.id ? 'border-gray-400 ring-2 ring-gray-100 bg-white' : 'border-transparent hover:bg-white hover:shadow-sm'
                  }`}>
                    <div className="anim-panel-item-icon flex-1 flex items-center justify-center p-[0.25vw]">
                      {anim.icon === 'None' ? (
                        <div className="anim-panel-none-icon w-[2vw] h-[2vw] rounded-full border-[0.15vw] border-gray-400 flex items-center justify-center -rotate-45"><div className="w-[0.1vw] h-full bg-gray-400" /></div>
                      ) : anim.icon === 'Circle' ? (
                        <motion.div 
                          variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                          transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 2 }}
                          className="anim-panel-circle-icon w-[2vw] h-[2vw] rounded-full border-[0.1vw] border-gray-700 flex items-center justify-center"
                        >
                          <div className="w-[1.25vw] h-[1.25vw] rounded-full border-[0.1vw] border-dashed border-gray-800" />
                        </motion.div>
                      ) : (
                        <div className="anim-panel-bars-icon flex items-end gap-[0.25vw] h-[1.5vw]">
                          <motion.div 
                            variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                            transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 1.5 }} className="anim-panel-bar-1 w-[0.5vw] h-[1.5vw] bg-gray-300 rounded-[0.05vw]" 
                          />
                          <motion.div 
                            variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                            transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 1.5, delay: 0.1 }} className="anim-panel-bar-2 w-[0.5vw] h-[1.5vw] bg-gray-400 rounded-[0.05vw]" 
                          />
                          <motion.div 
                            variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                            transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 1.5, delay: 0.2 }} className="anim-panel-bar-3 w-[0.5vw] h-[1.5vw] bg-gray-600 rounded-[0.05vw]" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`anim-panel-item-label text-[0.6vw] mt-[0.5vw] font-medium text-center leading-tight transition-colors ${tempSelectedAnim === anim.id ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>{anim.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="anim-panel-gallery-footer p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white">
            <button onClick={() => setShowGallery(false)} className="anim-panel-gallery-close cursor-pointer flex-1 h-[2vw] border border-gray-300 rounded-[0.4vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] hover:bg-gray-50 transition-colors">
              <X size="0.8vw" /> Close
            </button>
            <button 
              disabled={!tempSelectedAnim}
              onClick={() => {
                if (tempSelectedAnim) {
                  updateSetting(gallerySection, 'type', tempSelectedAnim);
                  setShowGallery(false);
                }
              }}
              className="anim-panel-gallery-replace flex-1 cursor-pointer h-[2vw] bg-black text-white rounded-[0.4vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              <Replace size="0.7vw" /> Replace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationPanel;
