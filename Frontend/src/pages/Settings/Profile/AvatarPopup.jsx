import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import ColorPallet from '../../../components/CustomizedEditor/ColorPallet';
import p1 from '../../../assets/settings/p1.png';
import p2 from '../../../assets/settings/p2.png';
import p3 from '../../../assets/settings/p3.png';
import p4 from '../../../assets/settings/p4.png';
import p5 from '../../../assets/settings/p5.png';

const AvatarPopup = ({ isOpen, onClose, onSelectAvatar, onSelectColor }) => {
  const [isColorPalletOpen, setIsColorPalletOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#E8D4C8');

  if (!isOpen) return null;

  const colors = [
    '#8a4419ff', '#597810ff', '#20509cff', '#951b48ff', '#909018ff', '#1f8686ff',
    '#f0d5d0ff', '#d0f0dcff', '#dcd0f0ff', '#f0d0e7ff', '#e6f0d0ff', '#e7d0f0ff','#cee7f3','#ddf0d0ff', '#D0DCF0', '#F0D0DC', '#D0F0F0'
  ];
  
  const avatars = [p1, p2, p3, p4, p5];

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
          onSelectAvatar(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="absolute top-[2vw] left-[2vw] w-[18vw] bg-white rounded-[0.8vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-[1.2vw] z-50">
      <div className="flex justify-between items-center mb-[1vw]">
        <h3 className="text-[1vw] font-semibold text-gray-800">Edit Profile</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors">
          <Icon icon="mdi:close" className="w-[1.2vw] h-[1.2vw]" />
        </button>
      </div>

      <div className="mb-[1.2vw]">
        <h4 className="text-[0.8vw] font-semibold text-gray-800 mb-[0.6vw]">Solid Color</h4>
        <div className="flex flex-wrap gap-[0.6vw]">
          {colors.map((color, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelectColor(color)}
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
                <div className="absolute top-[-5vw] right-[-17vw] w-[16vw] z-[100]">
                   <ColorPallet 
                      inline={true}
                      smallMode={false}
                      color={customColor}
                      opacity={100}
                      onChange={(c) => {
                         setCustomColor(c);
                         onSelectColor(c);
                      }}
                      onClose={() => setIsColorPalletOpen(false)}
                   />
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="mb-[1.2vw]">
        <h4 className="text-[0.8vw] font-semibold text-gray-800 mb-[0.6vw]">Avatar</h4>
        <div className="grid grid-cols-5 gap-[0.6vw]">
          {avatars.map((avatar, index) => (
            <button
              key={index}
              onClick={() => onSelectAvatar(avatar)}
              className="w-[2.5vw] h-[2.5vw] rounded-full border border-gray-200 overflow-hidden hover:scale-110 transition-transform bg-[#f5f5f5] shadow-sm flex items-center justify-center"
            >
              <img src={avatar} alt={`Avatar ${index + 1}`} className="w-[90%] h-[90%] object-cover rounded-full" />
            </button>
          ))}
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

export default AvatarPopup;
