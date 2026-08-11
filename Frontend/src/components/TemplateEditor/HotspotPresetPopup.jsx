import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

// SVG imports removed as per user instruction

const presets = [
  { id: 'open-link', name: 'Open Link', cssStyle: { background: 'rgba(53, 156, 253, 0.4)' }, innerCssStyle: { background: 'linear-gradient(90deg, #359CFD 0%, #257EFC 100%)' }, iconifyIcon: 'stash:link-solid' },
  { id: 'whatsapp', name: 'WhatsApp', cssStyle: { background: 'rgba(52, 168, 83, 0.24)' }, innerCssStyle: { background: '#34A853' }, iconifyIcon: 'ic:outline-whatsapp' },
  { id: 'navigate', name: 'Navigate Page', cssStyle: { background: 'rgba(97, 73, 247, 0.24)' }, innerCssStyle: { background: 'linear-gradient(90deg, #7A63FC 0%, #5A45FA 100%)' }, iconifyIcon: 'iconoir:page-search' },
  { id: '3d-viewer', name: '3D Viewer', cssStyle: { background: 'rgba(53, 156, 253, 0.4)' }, innerCssStyle: { background: 'linear-gradient(90deg, #359CFD 0%, #257EFC 100%)' }, iconifyIcon: 'mage:box-3d' },
  { id: 'call', name: 'Call', cssStyle: { background: 'rgba(25, 178, 171, 0.24)' }, innerCssStyle: { background: 'linear-gradient(90deg, #32D3C2 0%, #19B2AB 100%)' }, iconifyIcon: 'ic:sharp-call' },
  { id: 'email', name: 'Email', cssStyle: { background: 'rgba(254, 124, 21, 0.24)' }, innerCssStyle: { background: 'linear-gradient(90deg, #FD8F2F 0%, #FE7C15 100%)' }, iconifyIcon: 'tabler:mail' },
  { id: 'location', name: 'Location', cssStyle: { background: 'rgba(254, 124, 21, 0.24)' }, innerCssStyle: { background: 'linear-gradient(90deg, #FD8F2F 0%, #FE7C15 100%)' }, iconifyIcon: 'weui:location-filled' },
  { id: 'youtube', name: 'You tube', cssStyle: { background: 'rgba(255, 0, 0, 0.24)' }, innerCssStyle: { background: '#FFFFFF' }, iconifyIcon: 'selfhst:youtube' },
  { id: 'instagram', name: 'Instagram', cssStyle: { background: 'linear-gradient(45deg, rgba(253, 203, 110, 0.4), rgba(225, 48, 108, 0.4), rgba(131, 58, 180, 0.4))' }, innerCssStyle: { background: 'linear-gradient(45deg, #FDCB6E, #E1306C, #833AB4)' }, iconifyIcon: 'mdi:instagram' },
  { id: 'x', name: 'X', cssStyle: { background: 'rgba(0, 0, 0, 0.24)' }, innerCssStyle: { background: '#000000' }, iconifyIcon: 'ri:twitter-x-fill' },
  { id: 'facebook', name: 'Facebook', cssStyle: { background: 'rgba(61, 90, 152, 0.24)' }, innerCssStyle: { background: '#3D5A98' }, iconifyIcon: 'ri:facebook-fill' },
  { id: 'linkedin', name: 'Linked in', cssStyle: { background: 'rgba(10, 102, 194, 0.24)' }, innerCssStyle: { background: '#0A66C2' }, iconifyIcon: 'ri:linkedin-fill' },
  { id: 'video', name: 'Video', cssStyle: { background: 'rgba(53, 156, 253, 0.4)' }, innerCssStyle: { background: 'linear-gradient(90deg, #359CFD 0%, #257EFC 100%)' }, iconifyIcon: 'mingcute:play-fill' },
  { id: 'popup', name: 'Popup', cssStyle: { background: 'rgba(25, 178, 171, 0.24)' }, innerCssStyle: { background: 'linear-gradient(90deg, #32D3C2 0%, #19B2AB 100%)' }, iconifyIcon: 'carbon:popup' },
  { id: 'slideshow', name: 'Slideshow', cssStyle: { background: 'rgba(25, 192, 37, 0.24)' }, innerCssStyle: { background: '#19C025' }, iconifyIcon: 'streamline-sharp:slide-show-play' },
  { id: 'zoom', name: 'Zoom', cssStyle: { background: 'rgba(53, 156, 253, 0.4)' }, innerCssStyle: { background: 'linear-gradient(90deg, #359CFD 0%, #257EFC 100%)' }, iconifyIcon: 'fluent:zoom-in-32-regular' },
  { id: 'download', name: 'Download', cssStyle: { background: 'rgba(243, 50, 106, 0.24)' }, innerCssStyle: { background: 'linear-gradient(90deg, #FD6994 0%, #F3326A 100%)' }, iconifyIcon: 'lucide:download' },
  { id: 'info', name: 'Info Popup', cssStyle: { background: 'rgba(0, 0, 0, 0.24)' }, innerCssStyle: { background: '#000000' }, iconifyIcon: 'fontisto:info' }
];

const generateSvgPayload = (preset) => {
  let outerFill = preset.cssStyle?.background || 'rgba(0,0,0,0.5)';
  let defsInner = '';
  let innerFill = '';

  const processGradient = (bg, idPrefix) => {
    if (bg.includes('linear-gradient')) {
      const colors = [...bg.matchAll(/(rgba\([^)]+\)|rgb\([^)]+\)|#[a-fA-F0-9]{3,6})/g)].map(m => m[0]);
      if (colors.length >= 2) {
        const gradId = `${idPrefix}-${preset.id}`;
        let stops = '';
        if (colors.length === 2) {
            stops = `<stop offset="0%" stop-color="${colors[0]}" /><stop offset="100%" stop-color="${colors[1]}" />`;
        } else if (colors.length >= 3) {
            stops = `<stop offset="0%" stop-color="${colors[0]}" /><stop offset="50%" stop-color="${colors[1]}" /><stop offset="100%" stop-color="${colors[2]}" />`;
        }
        let x2 = "100%", y2 = "0%";
        if (bg.includes('45deg')) {
            x2 = "100%"; y2 = "100%";
        }
        defsInner += `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
        return `url(#${gradId})`;
      } else {
        return 'currentColor';
      }
    } else {
      return bg;
    }
  };

  if (preset.innerCssStyle?.background) {
    innerFill = processGradient(preset.innerCssStyle.background, 'inner-grad');
  }
  
  if (outerFill.includes('linear-gradient')) {
    outerFill = processGradient(outerFill, 'outer-grad');
  }

  let defsWrapper = defsInner ? `<defs>${defsInner}</defs>` : '';
  let svgString = defsWrapper;
  svgString += `<circle cx="26" cy="26" r="26" fill="${outerFill}" />`;
  
  if (innerFill) {
    svgString += `<circle cx="26" cy="26" r="19" fill="${innerFill}" />`;
  }

  if (preset.iconifyIcon === 'stash:link-solid') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" fill-rule="evenodd" d="M12.415 4.84a4.775 4.775 0 0 1 6.752 6.752l-.013.013l-2.264 2.265a4.776 4.776 0 0 1-7.201-.516a1 1 0 0 1 1.601-1.198a2.774 2.774 0 0 0 4.185.3l2.259-2.259a2.776 2.776 0 0 0-3.925-3.923L12.516 7.56a1 1 0 0 1-1.41-1.418l1.298-1.291zM8.818 9.032a4.775 4.775 0 0 1 5.492 1.614a1 1 0 0 1-1.601 1.198a2.775 2.775 0 0 0-4.185-.3l-2.258 2.259a2.775 2.775 0 0 0 3.923 3.924l1.285-1.285a1 1 0 1 1 1.414 1.414l-1.291 1.291l-.012.013a4.775 4.775 0 0 1-6.752-6.752l.012-.013L7.11 10.13a4.8 4.8 0 0 1 1.708-1.098" clip-rule="evenodd"/></g>`;
  } else if (preset.iconifyIcon === 'ic:outline-whatsapp') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01m-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18l-3.12.82l.83-3.04l-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81c-.23-.08-.39-.12-.56.12c-.17.25-.64.81-.78.97c-.14.17-.29.19-.54.06c-.25-.12-1.05-.39-1.99-1.23c-.74-.66-1.23-1.47-1.38-1.72c-.14-.25-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31c-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74c.59.26 1.05.41 1.41.52c.59.19 1.13.16 1.56.1c.48-.07 1.47-.6 1.67-1.18c.21-.58.21-1.07.14-1.18s-.22-.16-.47-.28"/></g>`;
  } else if (preset.iconifyIcon === 'iconoir:page-search') {
    svgString += `<g transform="translate(14, 14)"><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M20 12V5.749a.6.6 0 0 0-.176-.425l-3.148-3.148A.6.6 0 0 0 16.252 2H4.6a.6.6 0 0 0-.6.6v18.8a.6.6 0 0 0 .6.6H11M8 10h8M8 6h4m-4 8h3m9.5 6.5L22 22"/><path d="M15 18a3 3 0 1 0 6 0a3 3 0 0 0-6 0m1-16v3.4a.6.6 0 0 0 .6.6H20"/></g></g>`;
  } else if (preset.iconifyIcon === 'mage:box-3d') {
    svgString += `<g transform="translate(14, 14)"><g fill="none" stroke="white" stroke-width="1.5"><path d="M10.55 2.876L4.595 6.182a2.98 2.98 0 0 0-1.529 2.611v6.414a2.98 2.98 0 0 0 1.529 2.61l5.957 3.307a2.98 2.98 0 0 0 2.898 0l5.957-3.306a2.98 2.98 0 0 0 1.529-2.611V8.793a2.98 2.98 0 0 0-1.529-2.61L13.45 2.876a2.98 2.98 0 0 0-2.898 0Z"/><path d="M20.33 6.996L12 12L3.67 6.996M12 21.49V12"/></g></g>`;
  } else if (preset.iconifyIcon === 'ic:sharp-call') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" d="m21 15.46l-5.27-.61l-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97z"/></g>`;
  } else if (preset.iconifyIcon === 'tabler:mail') {
    svgString += `<g transform="translate(14, 14)"><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m3 7l9 6l9-6"/></g></g>`;
  } else if (preset.iconifyIcon === 'weui:location-filled') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" fill-rule="evenodd" d="M11.262 22.134S4 16.018 4 10a8 8 0 1 1 16 0c0 6.018-7.262 12.134-7.262 12.134c-.404.372-1.069.368-1.476 0M12 13.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7"/></g>`;
  } else if (preset.iconifyIcon === 'selfhst:youtube') {
    svgString += `<svg x="14" y="14" width="24" height="24" viewBox="0 0 512 512"><path fill="red" d="M501.3 132.8c-5.9-22-23.2-39.4-45.3-45.3c-39.9-10.7-200-10.7-200-10.7s-160.1 0-200 10.7c-22 5.9-39.4 23.2-45.3 45.3C0 172.7 0 256 0 256s0 83.3 10.7 123.2c5.9 22 23.2 39.4 45.3 45.3c39.9 10.7 200 10.7 200 10.7s160.1 0 200-10.7c22-5.9 39.4-23.2 45.3-45.3C512 339.3 512 256 512 256s0-83.3-10.7-123.2"/><path fill="#fff" d="m204.8 332.8l133-76.8l-133-76.8z"/></svg>`;
  } else if (preset.iconifyIcon === 'mdi:instagram') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></g>`;
  } else if (preset.iconifyIcon === 'ri:twitter-x-fill') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" d="m17.687 3.063l-4.996 5.711l-4.32-5.711H2.112l7.477 9.776l-7.086 8.099h3.034l5.469-6.25l4.78 6.25h6.102l-7.794-10.304l6.625-7.571zm-1.064 16.06L5.654 4.782h1.803l10.846 14.34z"/></g>`;
  } else if (preset.iconifyIcon === 'ri:facebook-fill') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/></g>`;
  } else if (preset.iconifyIcon === 'ri:linkedin-fill') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></g>`;
  } else if (preset.iconifyIcon === 'mingcute:play-fill') {
    svgString += `<g transform="translate(14, 14)"><path fill="white" fill-rule="evenodd" d="M5.669 4.76a1.47 1.47 0 0 1 2.04-1.177c1.062.453 3.442 1.532 6.462 3.276c3.021 1.744 5.146 3.266 6.069 3.958c.788.59.79 1.763.001 2.355c-.914.687-3.013 2.191-6.07 3.956c-3.06 1.766-5.412 2.832-6.464 3.28a1.467 1.467 0 0 1-2.038-1.177c-.138-1.141-.396-3.734-.396-7.236c0-3.5.257-6.092.396-7.235" clip-rule="evenodd"/></g>`;
  } else if (preset.iconifyIcon === 'carbon:popup') {
    svgString += `<svg x="14" y="14" width="24" height="24" viewBox="0 0 32 32"><path fill="white" d="M28 4H10a2.006 2.006 0 0 0-2 2v14a2.006 2.006 0 0 0 2 2h18a2.006 2.006 0 0 0 2-2V6a2.006 2.006 0 0 0-2-2m0 16H10V6h18Z"/><path fill="white" d="M18 26H4V16h2v-2H4a2.006 2.006 0 0 0-2 2v10a2.006 2.006 0 0 0 2 2h14a2.006 2.006 0 0 0 2-2v-2h-2Z"/></svg>`;
  } else if (preset.iconifyIcon === 'streamline-sharp:slide-show-play') {
    svgString += `<g transform="translate(14, 14)"><g fill="none" stroke="white" stroke-width="1.5"><path d="M20.5 6h-17v13h17zM12 19v3M2 2h20v4H2zM1 19h22"/><path d="M10.651 15.5v-6l4.072 3z"/></g></g>`;
  } else if (preset.iconifyIcon === 'fluent:zoom-in-32-regular') {
    svgString += `<svg x="14" y="14" width="24" height="24" viewBox="0 0 32 32"><path fill="white" d="M13.5 7a1 1 0 0 1 1 1v4.5H19a1 1 0 1 1 0 2h-4.5V19a1 1 0 1 1-2 0v-4.5H8a1 1 0 1 1 0-2h4.5V8a1 1 0 0 1 1-1m0-5C19.851 2 25 7.149 25 13.5c0 2.828-1.021 5.418-2.715 7.42l.024-.026l6.398 6.399a1 1 0 1 1-1.414 1.414l-6.398-6.398c-2 1.68-4.58 2.691-7.395 2.691C7.149 25 2 19.851 2 13.5S7.149 2 13.5 2m0 2a9.5 9.5 0 1 0 0 19a9.5 9.5 0 0 0 0-19"/></svg>`;
  } else if (preset.iconifyIcon === 'lucide:download') {
    svgString += `<g transform="translate(14, 14)"><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10l5 5l5-5"/></g></g>`;
  } else if (preset.iconifyIcon === 'fontisto:info') {
    svgString += `<svg x="14" y="14" width="24" height="24" viewBox="0 0 11 24"><path fill="white" d="M8.436.006a2.24 2.24 0 0 1 2.408 2.354v-.006a3.156 3.156 0 0 1-3.151 3.01l-.065-.001h.003a2.15 2.15 0 0 1-2.367-2.398l-.001.01A3.087 3.087 0 0 1 8.44.004h-.005zM3.489 24c-1.268 0-2.199-.783-1.311-4.226l1.456-6.108c.254-.978.295-1.369 0-1.369a9.6 9.6 0 0 0-3.035 1.359l.033-.021l-.633-1.057c3.086-2.622 6.638-4.159 8.158-4.159c1.268 0 1.48 1.526.845 3.874l-1.666 6.421c-.296 1.135-.168 1.526.126 1.526a6.55 6.55 0 0 0 2.863-1.456l-.008.007l.72.979c-3.004 3.052-6.281 4.232-7.549 4.232z"/></svg>`;
  }

  return svgString;
};

const HotspotPresetPopup = ({ onClose, onSelectPreset }) => {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const filteredPresets = presets.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const popupRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      const trigger = document.getElementById('hotspot-trigger-container');
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        setPosition({
          top: rect.top - window.innerHeight * 0.40,
          left: rect.right - window.innerWidth * 0.10,
        });
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      const trigger = document.getElementById('hotspot-trigger-container');
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target) && 
        (!trigger || !trigger.contains(event.target))
      ) {
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const popupContent = (
    <div 
      ref={popupRef}
      className="fixed w-[18vw] bg-white rounded-[0.8vw] shadow-[0_1vw_3vw_-0.5vw_rgba(0,0,0,0.2)] border border-gray-400 z-[999999] flex flex-col font-sans" 
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Controls */}
      <div className="flex items-center gap-[0.5vw] p-[1.2vw] pb-[0.8vw]">
        <div className="relative flex-1">
          <Icon icon="lucide:search" className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 w-[0.9vw] h-[0.9vw]" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-[2vw] pr-[0.4vw] py-[0.5vh] bg-gray-50 border border-gray-200 rounded-[0.3vw] text-[0.8vw] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="relative w-[5.5vw]">
          <select className="w-full pl-[0.4vw] pr-[1.2vw] py-[0.5vh] bg-white border border-gray-200 rounded-[0.3vw] text-[0.8vw] appearance-none focus:outline-none focus:border-blue-500 cursor-pointer text-gray-700">
            <option>Style 1</option>
            <option>Style 2</option>
          </select>
          <Icon icon="lucide:chevron-down" className="absolute right-[0.4vw] top-1/2 -translate-y-1/2 text-gray-500 w-[0.8vw] h-[0.8vw] pointer-events-none" />
        </div>
      </div>

      {/* Content Area */}
      <div className="px-[1.2vw] pb-[1.2vw]">
        <div className="flex items-center mb-[1.2vh] w-full">
          <h3 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Interactive Hotspot</h3>
          <div className="h-px bg-gray-200 flex-grow ml-[0.6vw]"></div>
        </div>

        {/* Icons Grid */}
        <div className="grid grid-cols-4 gap-y-[1.5vh] gap-x-[0.4vw]">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'icon',
                  isHotspot: true,
                  icon: { 
                    html: generateSvgPayload(preset),
                    presetId: preset.id 
                  }
                }));
              }}
              onDragEnd={() => {
                if (onClose) onClose();
              }}
              onClick={() => {
                if (onSelectPreset) {
                  onSelectPreset({
                    type: 'icon',
                    isHotspot: true,
                    icon: { 
                      html: generateSvgPayload(preset),
                      presetId: preset.id 
                    }
                  });
                }
                if (onClose) onClose();
              }}
              className="flex flex-col items-center justify-start gap-[0.6vh] group transition-transform hover:scale-105 cursor-grab active:cursor-grabbing"
            >
              <div 
                className="w-[3vw] h-[3vw] flex items-center justify-center rounded-full overflow-hidden relative"
                style={preset.cssStyle}
              >
                {preset.innerCssStyle && (
                  <div 
                    className="w-[2.2vw] h-[2.2vw] rounded-full absolute"
                    style={preset.innerCssStyle}
                  ></div>
                )}
                {preset.iconifyIcon && (
                  <Icon icon={preset.iconifyIcon} className="w-[1.2vw] h-[1.2vw] text-white absolute pointer-events-none" />
                )}
              </div>
              <span className="text-[0.65vw] text-gray-600 font-medium text-center leading-tight group-hover:text-gray-900 transition-colors">
                {preset.name}
              </span>
            </button>
          ))}
          {filteredPresets.length === 0 && (
            <div className="col-span-4 py-[2vh] text-center text-[0.8vw] text-gray-500">
              No presets found.
            </div>
          )}
        </div>

        {/* Interactive Buttons Section */}
        <div className="flex items-center mt-[2.5vh] mb-[1.2vh] w-full">
          <h3 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Interactive Buttons</h3>
          <div className="h-px bg-gray-200 flex-grow ml-[0.6vw]"></div>
        </div>
        
        <div className="flex flex-wrap gap-x-[0.6vw] gap-y-[1.2vh]">
          {/* Blue Rect Button */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ 
                type: 'icon', 
                isHotspot: true,
                icon: { presetId: 'open-link', html: '<rect width="180" height="60" rx="8" fill="#2B85FF" /><text x="90" y="38" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="500" text-anchor="middle">Button</text>' }
              }));
            }}
            className="bg-[#2B85FF] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-[0.3vw] shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Button
          </button>
          
          {/* Orange Rect Button */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ 
                type: 'icon', 
                isHotspot: true,
                icon: { presetId: 'open-link', html: '<rect width="180" height="60" rx="8" fill="#F87A18" /><text x="90" y="38" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="500" text-anchor="middle">Button</text>' }
              }));
            }}
            className="bg-[#F87A18] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-[0.3vw] shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Button
          </button>

          {/* Purple Pill with Icon */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ 
                type: 'icon', 
                isHotspot: true,
                icon: { presetId: 'open-link', html: '<rect width="200" height="60" rx="30" fill="#7859FF" /><path d="M55,30 l8,8 l16,-16" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" /><text x="120" y="38" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="500" text-anchor="middle">Icon</text>' }
              }));
            }}
            className="bg-[#7859FF] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-full shadow-sm hover:opacity-90 flex items-center gap-[0.4vw] cursor-grab active:cursor-grabbing"
          >
            <Icon icon="lucide:check" className="w-[0.8vw] h-[0.8vw]" strokeWidth={3} />
            Icon
          </button>

          {/* Yellow Pill Button */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ 
                type: 'icon', 
                isHotspot: true,
                icon: { presetId: 'open-link', html: '<rect width="220" height="60" rx="30" fill="#FFCC00" /><text x="110" y="38" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="500" text-anchor="middle">Round Button</text>' }
              }));
            }}
            className="bg-[#FFCC00] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-full shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Round Button
          </button>

          {/* Purple Pill Button */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ 
                type: 'icon', 
                isHotspot: true,
                icon: { presetId: 'open-link', html: '<rect width="180" height="60" rx="30" fill="#7859FF" /><text x="90" y="38" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="500" text-anchor="middle">Button</text>' }
              }));
            }}
            className="bg-[#7859FF] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-full shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Button
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(popupContent, document.body) : null;
};

export default HotspotPresetPopup;
