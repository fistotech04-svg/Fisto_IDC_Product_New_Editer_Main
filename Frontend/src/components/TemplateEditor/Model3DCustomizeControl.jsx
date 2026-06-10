import React from 'react';
import { Icon } from '@iconify/react';

const Model3DCustomizeControl = ({
  autoRotate,
  setAutoRotate,
  autoRotateSpeed,
  setAutoRotateSpeed,
  lockMaxZoom,
  setLockMaxZoom,
  maxZoom,
  setMaxZoom
}) => {
  return (
    <div className="bg-white rounded-[0.6vw] p-[1.5vw] shadow-sm flex flex-col gap-[1.5vh]">
      <h3 className="text-[1vw] font-bold text-gray-800 border-b border-gray-100 pb-[1vh]">3D Model Customization</h3>
      
      <div className="flex items-center justify-between border border-gray-200 p-[1vw] rounded-[0.4vw]">
        <span className="text-[0.85vw] font-medium text-gray-700">Auto Rotate</span>
        <div 
          className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors ${autoRotate ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
          onClick={() => setAutoRotate(!autoRotate)}
        >
          <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-md transform transition-transform ${autoRotate ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}></div>
        </div>
      </div>

      <div className="flex items-center justify-between border border-gray-200 p-[1vw] rounded-[0.4vw]">
        <span className="text-[0.85vw] font-medium text-gray-700">Auto Rotate Speed :</span>
        <div className="flex items-center gap-[0.5vw] bg-white border border-gray-200 rounded-[0.3vw] px-[0.5vw] py-[0.2vh]">
          <Icon icon="lucide:chevron-left" className="text-gray-500 cursor-pointer hover:text-black" onClick={() => setAutoRotateSpeed(Math.max(0, autoRotateSpeed - 0.5))} />
          <span className="text-[0.85vw] font-medium text-gray-700 w-[2vw] text-center">{autoRotateSpeed.toFixed(1)} x</span>
          <Icon icon="lucide:chevron-right" className="text-gray-500 cursor-pointer hover:text-black" onClick={() => setAutoRotateSpeed(autoRotateSpeed + 0.5)} />
        </div>
      </div>

      <div className="flex items-center justify-between border border-gray-200 p-[1vw] rounded-[0.4vw]">
        <span className="text-[0.85vw] font-medium text-gray-700">Lock Maximum Zoom</span>
        <div 
          className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors ${lockMaxZoom ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
          onClick={() => setLockMaxZoom(!lockMaxZoom)}
        >
          <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-md transform transition-transform ${lockMaxZoom ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}></div>
        </div>
      </div>

      <div className="flex items-center justify-between border border-gray-200 p-[1vw] rounded-[0.4vw]">
        <span className="text-[0.85vw] font-medium text-gray-700">Maximum Zoom % :</span>
        <div className="flex items-center gap-[0.5vw] bg-white border border-gray-200 rounded-[0.3vw] px-[0.5vw] py-[0.2vh]">
          <Icon icon="lucide:chevron-left" className="text-gray-500 cursor-pointer hover:text-black" onClick={() => setMaxZoom(Math.max(1, maxZoom - 0.5))} />
          <span className="text-[0.85vw] font-medium text-gray-700 w-[2vw] text-center">{maxZoom.toFixed(1)} x</span>
          <Icon icon="lucide:chevron-right" className="text-gray-500 cursor-pointer hover:text-black" onClick={() => setMaxZoom(maxZoom + 0.5)} />
        </div>
      </div>
    </div>
  );
};

export default Model3DCustomizeControl;
