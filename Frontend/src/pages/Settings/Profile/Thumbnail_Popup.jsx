import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import ColorPallet from '../../../components/CustomizedEditor/ColorPallet';

const ThumbnailPopup = ({ isOpen, onClose, bannerBg, setBannerBg }) => {
  const [isColorPalletOpen, setIsColorPalletOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#E8D4C8');
  const [uploadedImage, setUploadedImage] = useState(null);

  if (!isOpen) return null;

  const colors = [
    '#8a4419ff', '#597810ff', '#20509cff', '#951b48ff', '#909018ff', '#1f8686ff',
    '#dcd0f0ff', '#e6f0d0ff', '#cee7f3','#ddf0d0ff', '#F0D0DC'
  ];
  
  const gradients = [
    'linear-gradient(to right, #597810ff  0%, #e6f0d0ff 100%)',
    'linear-gradient(to right, #cee7f3 0%, #20509cff 100%)',
    'linear-gradient(to right, #81163dff 0%, #a75573ff 50%, #F0D0DC 100%)',
    'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)',
    'linear-gradient(120deg, #e0c3fc 0%, #531b88ff 100%)'
  ];

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            setUploadedImage({
              src: event.target.result,
              name: file.name || 'Image',
              width: img.width,
              height: img.height,
              size: (file.size / 1024).toFixed(1) + ' KB'
            });
            setBannerBg({ type: 'media', value: `url(${event.target.result})` });
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="absolute top-[1.5vw] right-[1vw] w-[17vw] bg-white rounded-[0.8vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-[1.2vw] z-[100]">
      <div className="flex justify-between items-center mb-[1vw]">
        <h3 className="text-[1vw] font-semibold text-gray-800">Edit Thumbnail</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors">
          <Icon icon="mdi:close" className="w-[1.2vw] h-[1.2vw] " />
        </button>
      </div>

      <div className="mb-[1.2vw]">
        <h4 className="text-[0.8vw] font-semibold text-gray-800 mb-[0.6vw]">Solid </h4>
        <div className="flex flex-wrap gap-[0.3vw]">
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
        <div className="flex flex-wrap gap-[0.3vw]">
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
        {uploadedImage ? (
          <div className="flex gap-[1vw] items-center rounded-[0.4vw] p-[0.3vw]">
             <img src={uploadedImage.src} alt="Uploaded" className="w-[4vw] h-[4vw] object-cover rounded-[0.4vw] border border-gray-100" />
             <div className="flex-1 min-w-0">
                <h4 className="text-[0.9vw] font-medium text-gray-800 truncate">Image</h4>
                <p className="text-[0.6vw] text-gray-500 mt-[0.1vw]">
                   {uploadedImage.width} x {uploadedImage.height} • {uploadedImage.size}
                </p>
                <div className="flex gap-[0.4vw] mt-[0.6vw]">
                   <button onClick={handleUpload} className="px-[0.3vw] py-[0.3vw] border border-gray-200 rounded-[0.3vw] text-[0.7vw] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      Replace image
                   </button>
                   <button onClick={() => {
                      setUploadedImage(null);
                      setBannerBg({ type: 'gradient', value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)' });
                   }} className="p-[0.3vw] border border-gray-200 rounded-[0.3vw] text-gray-500 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center">
                      <Icon icon="mdi:trash-can-outline" className="w-[1vw] h-[1vw]" />
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[0.4vw]">
            <button 
              onClick={handleUpload}
              className="w-full py-[0.6vw] border border-gray-200 rounded-[0.4vw] flex items-center justify-center gap-[0.5vw] text-[0.85vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Icon icon="mdi:upload" className="w-[1vw] h-[1vw]" />
              Upload Image
            </button>
            <p className="text-center text-[0.65vw] text-gray-400">Recommended size: 300 × 250 px</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThumbnailPopup;
