import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import ColorPallet from '../../../components/CustomizedEditor/ColorPallet';

const ThumbnailPopup = ({ isOpen, onClose, bannerBg, setBannerBg }) => {
  const [isColorPalletOpen, setIsColorPalletOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#E8D4C8');

  if (!isOpen) return null;

  const colors = [
    '#8a4419ff', '#597810ff', '#20509cff', '#951b48ff', '#909018ff', '#1f8686ff',
    '#f0d5d0ff', '#d0f0dcff', '#dcd0f0ff', '#f0d0e7ff', '#e6f0d0ff', '#e7d0f0ff','#cee7f3','#ddf0d0ff', '#D0DCF0', '#F0D0DC', '#D0F0F0'
  ];
  
  const gradients = [
    'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(to right, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(to right, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)',
    'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)'
  ];

  const handleUpload = () => {
    // Implement file upload logic here
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setBannerBg({ type: 'media', value: `url(${event.target.result})` });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="absolute top-[1.5vw] right-[1vw] w-[18vw] bg-white rounded-[0.8vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-[1.2vw] z-[100]">
      <div className="flex justify-between items-center mb-[1vw]">
        <h3 className="text-[1vw] font-semibold text-gray-800">Edit Thumbnail</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors">
          <Icon icon="mdi:close" className="w-[1.2vw] h-[1.2vw] " />
        </button>
      </div>

      <div className="mb-[1.2vw]">
        <h4 className="text-[0.8vw] font-semibold text-gray-800 mb-[0.6vw]">Solid </h4>
        <div className="flex flex-wrap gap-[0.6vw]">
          {colors.map((color, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setBannerBg({ type: 'solid', value: color })}
              className="w-[2vw] h-[2vw] rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="relative">
             <button 
                type="button"
                onClick={() => setIsColorPalletOpen(!isColorPalletOpen)}
                className="w-[2vw] h-[2vw] rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm bg-gray-50 flex items-center justify-center cursor-pointer flex-shrink-0"
             >
                <Icon icon="mdi:pencil" className="text-gray-500 w-[1.2vw] h-[1.2vw]" />
             </button>
             
             {isColorPalletOpen && (
                <div className="absolute top-[-2vw] right-[15vw] w-[16vw] z-[100]">
                   <ColorPallet 
                      inline={true}
                      smallMode={false}
                      color={customColor}
                      opacity={100}
                      onChange={(c) => {
                         setCustomColor(c);
                         setBannerBg({ type: 'solid', value: c });
                      }}
                      onClose={() => setIsColorPalletOpen(false)}
                   />
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="mb-[1.2vw]">
        <h4 className="text-[0.8vw] font-semibold text-gray-800 mb-[0.6vw]">Gradient</h4>
        <div className="flex flex-wrap gap-[0.6vw]">
          {gradients.map((gradient, index) => (
            <button
              key={index}
              onClick={() => setBannerBg({ type: 'gradient', value: gradient })}
              className="w-[2vw] h-[2vw] rounded-full border border-gray-200 overflow-hidden hover:scale-110 transition-transform shadow-sm flex items-center justify-center flex-shrink-0"
              style={{ background: gradient }}
            />
          ))}
          <button 
             type="button"
             className="w-[2vw] h-[2vw] rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm bg-gray-50 flex items-center justify-center cursor-pointer flex-shrink-0"
          >
             <Icon icon="mdi:pencil" className="text-gray-500 w-[1.2vw] h-[1.2vw]" />
          </button>
        </div>
      </div>

      <div>
        <button 
          onClick={handleUpload}
          className="w-full py-[0.6vw] border border-gray-200 rounded-[0.4vw] flex items-center justify-center gap-[0.5vw] text-[0.85vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Icon icon="mdi:upload" className="w-[1vw] h-[1vw]" />
          Upload Image
        </button>
      </div>
    </div>
  );
};

export default ThumbnailPopup;
