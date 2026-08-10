import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import ColorPicker from './ColorPicker';
import { generateCompositeHotspotSvg } from './hotspotUtils';

import preset1 from '../../assets/hotspot preset icon/preset customize icon/vedio1.svg';
import preset2 from '../../assets/hotspot preset icon/preset customize icon/vedio2.svg';
import preset3 from '../../assets/hotspot preset icon/preset customize icon/vedio3.svg';
import preset4 from '../../assets/hotspot preset icon/preset customize icon/vedio4.svg';
import preset5 from '../../assets/hotspot preset icon/preset customize icon/vedio5.svg';
import preset6 from '../../assets/hotspot preset icon/preset customize icon/vedio6.svg';

import arrow1 from '../../assets/hotspot preset icon/preset customize icon/arrowicon1.svg';
import arrow2 from '../../assets/hotspot preset icon/preset customize icon/arrowicon2.svg';
import arrow3 from '../../assets/hotspot preset icon/preset customize icon/arrowicon3.svg';
import arrow4 from '../../assets/hotspot preset icon/preset customize icon/arrowicon4.svg';
import arrow5 from '../../assets/hotspot preset icon/preset customize icon/arrowicon5.svg';
import arrow6 from '../../assets/hotspot preset icon/preset customize icon/arrowicon6.svg';

const HotspotCustomizationPopup = ({ 
  onClose, 
  onSave, 
  initialHotspotIconSrc,
  initialIconColor = '#FFFFFF',
  initialBgColor = '#2F91FD',
  initialIconStyle = 0,
  initialBgStyle = 0
}) => {
  const [iconColor, setIconColor] = useState(initialIconColor);
  const [bgColor, setBgColor] = useState(initialBgColor);
  const [iconStyle, setIconStyle] = useState(initialIconStyle);
  const [bgStyle, setBgStyle] = useState(initialBgStyle);
  
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const popupRef = useRef(null);

  const iconStyles = [
    arrow1,
    arrow2,
    arrow3,
    arrow4,
    arrow5,
    arrow6
  ];

  const bgStyles = [
    preset1,
    preset2,
    preset3,
    preset4,
    preset5,
    preset6
  ];

  // Recolors only the background SVG (strips play path and recolors blues)
  const BgSvg = ({ src, bgColor, iconColor, className }) => {
    const [svgContent, setSvgContent] = useState('');
    useEffect(() => {
      if (!src) return;
      fetch(src)
        .then(r => r.text())
        .then(text => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          // Remove ANY path with fill-rule="evenodd" (these are the play button paths)
          doc.querySelectorAll('path[fill-rule="evenodd"]').forEach(p => p.remove());
          // Recolor blues → bgColor
          doc.querySelectorAll('*').forEach(el => {
            const fill = el.getAttribute('fill');
            if (fill && /#2782FC|#359CFD|#257EFC|#0081FF|#3296FC|#3297FD|#0052C0/i.test(fill)) el.setAttribute('fill', bgColor);
            const stroke = el.getAttribute('stroke');
            if (stroke && /#2782FC|#359CFD|#257EFC|#0081FF|#3296FC|#3297FD|#0052C0/i.test(stroke)) el.setAttribute('stroke', bgColor);
            const sc = el.getAttribute('stop-color');
            if (sc && /#2782FC|#359CFD|#257EFC|#0081FF|#3296FC|#3297FD|#0052C0/i.test(sc)) el.setAttribute('stop-color', bgColor);
            // Also recolor any white fills that remain (e.g. inner ring in vedio3)
            if (fill && /^(white|#fff{3,6})$/i.test(fill)) el.setAttribute('fill', bgColor);
            if (stroke && /^(white|#fff{3,6})$/i.test(stroke)) el.setAttribute('stroke', bgColor);
          });
          const svgEl = doc.querySelector('svg');
          if (svgEl) { svgEl.setAttribute('width', '100%'); svgEl.setAttribute('height', '100%'); }
          setSvgContent(new XMLSerializer().serializeToString(doc));
        })
        .catch(() => {});
    }, [src, bgColor, iconColor]);
    return <div className={className} dangerouslySetInnerHTML={{ __html: svgContent }} />;
  };

  // Click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeColorPicker && !e.target.closest('[data-color-picker="true"]')) {
        setActiveColorPicker(null);
      }
    };
    if (activeColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeColorPicker]);

  const toggleColorPicker = (e, type) => {
    e.stopPropagation();
    if (activeColorPicker === type) {
      setActiveColorPicker(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      // Position to the left of the button
      setPickerPosition({ top: rect.top, right: window.innerWidth - rect.left + 10 });
      setActiveColorPicker(type);
    }
  };

  const handleSave = () => {
    onSave({
      iconColor,
      bgColor,
      iconStyle,
      bgStyle
    });
    onClose();
  };

  const popupContent = (
    <div className="fixed inset-0 bg-black/40 z-[99999] flex items-center justify-center font-sans">
      <div 
        ref={popupRef}
        className="bg-white rounded-[0.6vw] w-[36vw] h-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-[1.5vw] pt-[1.5vh] pb-[1vh] flex items-center border-b border-gray-100">
          <h2 className="text-[1vw] font-semibold text-black">Hotspot Customization</h2>
          <div className="flex-1 border-t border-gray-200 ml-[1vw]"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex px-[1.5vw] py-[2vh] gap-[1.5vw]">
          {/* Left Preview */}
          <div className="flex flex-col w-[40%] h-full">
            <span className="text-[0.7vw] text-gray-800 font-medium mb-[0.8vh]">Preview</span>
            <div className="flex-1 bg-white rounded-[0.4vw] border border-gray-200 flex flex-col relative overflow-hidden">
              {/* Preview Circle */}
              <div className="flex-1 flex items-center justify-center p-[1.5vw]">
                <div className="relative w-[10vw] h-[10vw]">
                  {/* Background layer */}
                  <BgSvg src={bgStyles[bgStyle]} bgColor={bgColor} iconColor={iconColor} className="w-full h-full" />
                  {/* Icon layer via CSS mask */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      style={{
                        backgroundColor: iconColor,
                        WebkitMaskImage: `url(${iconStyles[iconStyle]})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url(${iconStyles[iconStyle]})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        width: '35%',
                        height: '35%',
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Bottom preset selector indicator */}
              <div className="w-full border-t border-gray-100 px-[1vw] py-[1vh]">
                <span className="text-[0.6vw] text-gray-400 font-medium mb-[0.6vh] block">Preset</span>
                <div className="flex justify-between items-center gap-[0.3vw]">
                  {bgStyles.map((styleSrc, idx) => (
                    <div 
                      key={idx}
                      className={`w-[2.4vw] h-[2.4vw] rounded-[0.3vw] flex items-center justify-center border transition-all overflow-hidden ${bgStyle === idx ? 'border-gray-800 shadow-sm' : 'border-gray-200 cursor-pointer hover:border-gray-400'}`}
                      onClick={() => setBgStyle(idx)}
                    >
                      <BgSvg src={styleSrc} bgColor={bgColor} iconColor={iconColor} className="w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex-1 flex flex-col justify-center gap-[2vh]">
            
            {/* Icon Style */}
            <div className="flex items-center">
              <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Style :</span>
              <div className="flex items-center gap-[0.4vw] ml-[0.5vw]">
                {iconStyles.map((style, idx) => (
                  <button
                    key={idx}
                    className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] border transition-colors ${iconStyle === idx ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                    onClick={() => setIconStyle(idx)}
                  >
                    <img src={style} alt={`Icon Style ${idx + 1}`} className="w-[100%] h-[100%] object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Color */}
            <div className="flex items-center relative">
              <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Color :</span>
              <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                <div 
                  className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm"
                  style={{ backgroundColor: iconColor }}
                  onClick={(e) => toggleColorPicker(e, 'iconColor')}
                ></div>
                <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw]">
                  <span className="text-[0.65vw] text-gray-600 uppercase font-mono">{iconColor}</span>
                  <span className="text-[0.6vw] text-gray-400">100%</span>
                </div>
              </div>
            </div>

            {/* Bg Color */}
            <div className="flex items-center relative">
              <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Bg Color :</span>
              <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                <div 
                  className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm"
                  style={{ backgroundColor: bgColor }}
                  onClick={(e) => toggleColorPicker(e, 'bgColor')}
                ></div>
                <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw]">
                  <span className="text-[0.65vw] text-gray-600 uppercase font-mono">{bgColor}</span>
                  <span className="text-[0.6vw] text-gray-400">100%</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-[1.5vw] py-[1.5vh] flex justify-end gap-[0.6vw] mt-auto border-t border-gray-50 bg-gray-50/50">
          <button 
            className="px-[1vw] py-[0.5vh] text-[0.7vw] font-medium text-gray-700 bg-white border border-gray-200 rounded-[0.3vw] hover:bg-gray-50 flex items-center gap-[0.3vw] transition-colors"
            onClick={onClose}
          >
            <Icon icon="lucide:x" className="text-[0.8vw]" /> Cancel
          </button>
          <button
            onClick={async () => {
              const svgStr = await generateCompositeHotspotSvg(bgStyles[bgStyle], iconStyles[iconStyle], bgColor, iconColor);
              if (onSave) onSave({ 
                iconColor, 
                bgColor, 
                iconStyle, 
                bgStyle,
                generatedSvgString: svgStr
              });
              onClose();
            }}
            className="px-[1.5vw] py-[0.8vh] bg-black text-white text-[0.8vw] font-medium rounded-[0.3vw] hover:bg-gray-800 transition-colors flex items-center gap-[0.4vw]"
          >
            <Icon icon="lucide:check" className="text-[0.8vw]" /> Save Changes
          </button>
        </div>
      </div>
      
      {/* Color Picker Render */}
      {activeColorPicker && (
        <div
          data-color-picker="true"
          className="fixed z-[999999] animate-in fade-in zoom-in-95 duration-200"
          style={{ top: `${pickerPosition.top}px`, right: `${pickerPosition.right}px` }}
        >
          <div className="bg-white rounded-[0.8vw] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-[0.4vw]">
            <ColorPicker
              color={activeColorPicker === 'iconColor' ? iconColor : bgColor}
              onChange={(c) => {
                const hex = c.hex;
                if (activeColorPicker === 'iconColor') setIconColor(hex);
                else setBgColor(hex);
              }}
              disableAlpha={true}
            />
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(popupContent, document.body) : null;
};

export default HotspotCustomizationPopup;
