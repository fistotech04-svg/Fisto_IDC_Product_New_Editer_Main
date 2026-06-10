import React from 'react';
import { Icon } from '@iconify/react';
import Model3DCustomizeControl from './Model3DCustomizeControl';

const Model3DEditor = ({
  onClose,
  shadowStrength, setShadowStrength,
  shadowSoftness, setShadowSoftness,
  autoRotate, setAutoRotate,
  autoRotateSpeed, setAutoRotateSpeed,
  lockMaxZoom, setLockMaxZoom,
  maxZoom, setMaxZoom,
  bgType, setBgType,
  bgColor, setBgColor,
  customBg, setCustomBg,
  enableAR, setEnableAR
}) => {
  return (
    <div className="flex flex-col gap-[2vh]">
      
      {/* Action Buttons */}
      <div className="flex gap-[1vw]">
        <button 
          className="flex-1 bg-[#22C55E] hover:bg-green-600 text-white font-semibold py-[1.2vh] rounded-[0.4vw] shadow-md flex items-center justify-center gap-[0.5vw] transition-colors"
          onClick={onClose}
        >
          <Icon icon="lucide:check" className="text-[1.2vw]" />
          <span className="text-[0.9vw]">Save Changes</span>
        </button>
        <button 
          className="flex-1 bg-white hover:bg-red-50 text-[#EF4444] font-semibold py-[1.2vh] rounded-[0.4vw] shadow border border-red-100 flex items-center justify-center gap-[0.5vw] transition-colors"
          onClick={onClose}
        >
          <Icon icon="lucide:x" className="text-[1.2vw]" />
          <span className="text-[0.9vw]">Close</span>
        </button>
      </div>

      {/* Shadow Settings */}
      <div className="bg-white rounded-[0.6vw] p-[1.5vw] shadow-sm flex flex-col gap-[1.5vh]">
        <h3 className="text-[1vw] font-bold text-gray-800 border-b border-gray-100 pb-[1vh]">Shadow Settings</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-[0.85vw] font-medium text-gray-600">Strength :</span>
          <div className="flex items-center gap-[1vw] flex-1 ml-[1vw]">
            <input 
              type="range" min="0" max="100" 
              value={shadowStrength} onChange={(e) => setShadowStrength(e.target.value)} 
              className="w-full h-[0.6vh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5145F6]" 
            />
            <span className="text-[0.8vw] font-semibold text-gray-600 w-[2.5vw] text-right">{shadowStrength} %</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[0.85vw] font-medium text-gray-600">Softness :</span>
          <div className="flex items-center gap-[1vw] flex-1 ml-[1vw]">
            <input 
              type="range" min="0" max="100" 
              value={shadowSoftness} onChange={(e) => setShadowSoftness(e.target.value)} 
              className="w-full h-[0.6vh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5145F6]" 
            />
            <span className="text-[0.8vw] font-semibold text-gray-600 w-[2.5vw] text-right">{shadowSoftness} %</span>
          </div>
        </div>
      </div>

      {/* 3D Model Customization */}
      <Model3DCustomizeControl 
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        autoRotateSpeed={autoRotateSpeed}
        setAutoRotateSpeed={setAutoRotateSpeed}
        lockMaxZoom={lockMaxZoom}
        setLockMaxZoom={setLockMaxZoom}
        maxZoom={maxZoom}
        setMaxZoom={setMaxZoom}
      />

      {/* Background Color */}
      <div className="bg-white rounded-[0.6vw] p-[1.5vw] shadow-sm flex flex-col gap-[1.5vh]">
        <h3 className="text-[1vw] font-bold text-gray-800 border-b border-gray-100 pb-[1vh]">Background Color</h3>
        
        <div className="flex items-center gap-[1vw]">
          <span className="text-[0.85vw] font-medium text-gray-600 w-[4vw]">Type :</span>
          <select className="flex-1 border border-gray-300 rounded-[0.3vw] px-[0.5vw] py-[0.5vh] text-[0.85vw] text-gray-700 outline-none" value={bgType} onChange={(e) => setBgType(e.target.value)}>
            <option value="Solid">Solid</option>
            <option value="Transparent">Transparent</option>
          </select>
        </div>

        <div className="flex items-center gap-[1vw]">
          <span className="text-[0.85vw] font-medium text-gray-600 w-[4vw]">BG Color :</span>
          <div className="flex-1 border border-gray-300 rounded-[0.3vw] px-[0.5vw] py-[0.5vh] flex items-center justify-between">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-[1.5vw] h-[1.5vw] rounded-[0.2vw] border-none outline-none cursor-pointer p-0" />
            <span className="text-[0.85vw] text-gray-600 font-medium ml-[1vw] flex-1">{bgColor.toUpperCase()}</span>
            <span className="text-[0.85vw] text-gray-400 font-medium">100%</span>
          </div>
        </div>

        <div className="flex items-center justify-between border border-gray-200 p-[1vw] rounded-[0.4vw] mt-[0.5vh]">
          <span className="text-[0.85vw] font-medium text-gray-700">Custom Background</span>
          <div 
            className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors ${customBg ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
            onClick={() => setCustomBg(!customBg)}
          >
            <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-md transform transition-transform ${customBg ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </div>

      {/* AR View */}
      <div className="bg-white rounded-[0.6vw] p-[1.5vw] shadow-sm flex flex-col gap-[1.5vh]">
        <h3 className="text-[1vw] font-bold text-gray-800 border-b border-gray-100 pb-[1vh]">AR View</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[0.85vw] font-medium text-gray-800">Enable AR (Augmented Reality)</span>
            <span className="text-[0.7vw] text-gray-400 mt-[0.2vh]">Allow User To View This Model In AR</span>
          </div>
          <div 
            className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors ${enableAR ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
            onClick={() => setEnableAR(!enableAR)}
          >
            <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-md transform transition-transform ${enableAR ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </div>

      {/* QR Themes Placeholder */}
      <div className="bg-white rounded-[0.6vw] p-[1.5vw] shadow-sm flex flex-col gap-[1.5vh]">
        <h3 className="text-[1vw] font-bold text-gray-800 border-b border-gray-100 pb-[1vh]">QR Themes</h3>
        <span className="text-[0.8vw] text-gray-500 italic">More options...</span>
      </div>

    </div>
  );
};

export default Model3DEditor;
