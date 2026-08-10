import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

// Import all preset icons
import iconOpenLink from '../../assets/hotspot preset icon/openlink.svg';
import iconWhatsApp from '../../assets/hotspot preset icon/whatsapp.svg';
import iconNavigation from '../../assets/hotspot preset icon/Navigation.svg';
import icon3D from '../../assets/hotspot preset icon/3D.svg';
import iconCall from '../../assets/hotspot preset icon/Call.svg';
import iconEmail from '../../assets/hotspot preset icon/email.svg';
import iconLocation from '../../assets/hotspot preset icon/location.svg';
import iconYoutube from '../../assets/hotspot preset icon/yotube.svg';
import iconInstagram from '../../assets/hotspot preset icon/instagram.svg';
import iconX from '../../assets/hotspot preset icon/X.svg';
import iconFacebook from '../../assets/hotspot preset icon/facebook.svg';
import iconLinkedIn from '../../assets/hotspot preset icon/linkedin.svg';
import iconVideo from '../../assets/hotspot preset icon/vedio.svg';
import iconPopup from '../../assets/hotspot preset icon/popup.svg';
import iconSlideshow from '../../assets/hotspot preset icon/slideshow.svg';
import iconZoom from '../../assets/hotspot preset icon/zoom.svg';
import iconDownload from '../../assets/hotspot preset icon/download.svg';
import iconInfo from '../../assets/hotspot preset icon/info.svg';

const presets = [
  { id: 'open-link', name: 'Open Link', icon: iconOpenLink },
  { id: 'whatsapp', name: 'WhatsApp', icon: iconWhatsApp },
  { id: 'navigate', name: 'Navigate Page', icon: iconNavigation },
  { id: '3d-viewer', name: '3D Viewer', icon: icon3D },
  { id: 'call', name: 'Call', icon: iconCall },
  { id: 'email', name: 'Email', icon: iconEmail },
  { id: 'location', name: 'Location', icon: iconLocation },
  { id: 'youtube', name: 'You tube', icon: iconYoutube },
  { id: 'instagram', name: 'Instagram', icon: iconInstagram },
  { id: 'x', name: 'X', icon: iconX },
  { id: 'facebook', name: 'Facebook', icon: iconFacebook },
  { id: 'linkedin', name: 'Linked in', icon: iconLinkedIn },
  { id: 'video', name: 'Video', icon: iconVideo },
  { id: 'popup', name: 'Popup', icon: iconPopup },
  { id: 'slideshow', name: 'Slideshow', icon: iconSlideshow },
  { id: 'zoom', name: 'Zoom', icon: iconZoom },
  { id: 'download', name: 'Download', icon: iconDownload },
  { id: 'info', name: 'Info Popup', icon: iconInfo }
];

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
                    html: `<image href="${preset.icon}" width="52" height="52"/>`,
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
                      html: `<image href="${preset.icon}" width="52" height="52"/>`,
                      presetId: preset.id 
                    }
                  });
                }
                if (onClose) onClose();
              }}
              className="flex flex-col items-center justify-start gap-[0.6vh] group transition-transform hover:scale-105 cursor-grab active:cursor-grabbing"
            >
              <div className="w-[3vw] h-[3vw] flex items-center justify-center rounded-full bg-transparent overflow-hidden">
                <img src={preset.icon} alt={preset.name} className="w-full h-full object-contain pointer-events-none" />
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
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'button', style: 'blue-rect', isHotspot: true }));
            }}
            className="bg-[#2B85FF] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-[0.3vw] shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Button
          </button>
          
          {/* Orange Rect Button */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'button', style: 'orange-rect', isHotspot: true }));
            }}
            className="bg-[#F87A18] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-[0.3vw] shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Button
          </button>

          {/* Purple Pill with Icon */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'button', style: 'purple-pill-icon', isHotspot: true }));
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
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'button', style: 'yellow-pill', isHotspot: true }));
            }}
            className="bg-[#FFCC00] text-white text-[0.75vw] font-medium px-[1vw] py-[0.6vh] rounded-full shadow-sm hover:opacity-90 cursor-grab active:cursor-grabbing"
          >
            Round Button
          </button>

          {/* Purple Pill Button */}
          <button
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'button', style: 'purple-pill', isHotspot: true }));
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
