import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';
import ReplaceMediaModal from '../TemplateEditor/ReplaceMediaModal';

const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-[1vw] mb-[0.5vw]">
    <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">{label}</span>
    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
  </div>
);

const CustomSlider = ({ value, onChange, min = 0, max = 100, color = "#4D47FF" }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative flex-1 flex items-center h-[1vw]">
      <style>{`
        .custom-sheet-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-sheet-slider::-webkit-slider-runnable-track { height: 0.35vw; border-radius: 0.175vw; background: inherit; }
        .custom-sheet-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 0.9vw; width: 0.9vw; border-radius: 50%; background: #4D47FF; border: 0.1vw solid #4D47FF; margin-top: -0.275vw; cursor: pointer; }
      `}</style>
      <input 
        type="range" 
        min={min} max={max} value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full cursor-pointer custom-sheet-slider"
        style={{ backgroundImage: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)` }}
      />
    </div>
  );
};

const PositionPad = ({ onMove }) => (
  <div className="flex gap-[0.3vw]">
    <button 
      onClick={() => onMove('left')} 
      className="w-[2vw] h-[5.6vw] border border-gray-200 rounded-[0.2vw] flex items-center justify-center hover:bg-gray-50 transition-colors"
    >
      <Icon icon="lucide:chevron-left" className="text-gray-500 w-[1vw] h-[1vw]"/>
    </button>
    <div className="flex flex-col gap-[0.3vw]">
       <button 
         onClick={() => onMove('up')} 
         className="w-[4vw] h-[1.8vw] border border-gray-200 rounded-[0.2vw] flex items-center justify-center hover:bg-gray-50 transition-colors"
       >
         <Icon icon="lucide:chevron-up" className="text-gray-500 w-[1vw] h-[1vw]"/>
       </button>
       <div className="w-[4vw] h-[1.4vw] flex items-center justify-center text-[0.55vw] text-gray-400 font-medium">
         Move
       </div>
       <button 
         onClick={() => onMove('down')} 
         className="w-[4vw] h-[1.8vw] border border-gray-200 rounded-[0.2vw] flex items-center justify-center hover:bg-gray-50 transition-colors"
       >
         <Icon icon="lucide:chevron-down" className="text-gray-500 w-[1vw] h-[1vw]"/>
       </button>
    </div>
    <button 
      onClick={() => onMove('right')} 
      className="w-[2vw] h-[5.6vw] border border-gray-200 rounded-[0.2vw] flex items-center justify-center hover:bg-gray-50 transition-colors"
    >
      <Icon icon="lucide:chevron-right" className="text-gray-500 w-[1vw] h-[1vw]"/>
    </button>
  </div>
);

const generatePageOptions = (total) => {
  if (total <= 0) return ['Page 1'];
  const options = ['Page 1'];
  for (let i = 1; i < total; i += 2) {
    if (i + 1 < total) {
       options.push(`Page ${i + 1}-${i + 2}`);
    } else {
       options.push(`Page ${i + 1}`);
    }
  }
  return options;
};

const SheetCard = ({ sheet, onUpdate, onDelete, pages = [] }) => {
  const [isExpanded, setIsExpanded] = useState(sheet.isExpanded !== false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const fileInputRef = useRef(null);
  
  const pageOptions = generatePageOptions(pages.length);

  const handleImageSelect = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ ...sheet, image: url, imageName: file.name, imageSize: (file.size / (1024 * 1024)).toFixed(1) + 'MB' });
    }
  };

  return (
    <div className="border border-gray-200 rounded-[0.5vw] bg-white overflow-hidden mb-[0.8vw]">
      {/* Header */}
      <div className="flex items-center justify-between px-[0.8vw] py-[0.6vw] bg-[#fdfdfd] border-b border-gray-100">
        <div className="flex items-center gap-[1vw]">
           <span className="text-[0.75vw] font-semibold text-gray-800">Sheet At</span>
           <PremiumDropdown 
             options={pageOptions} 
             value={sheet.page || pageOptions[0]} 
             onChange={(val) => onUpdate({ ...sheet, page: val })}
             width="7vw" 
             buttonClassName="!bg-gray-100 !border-transparent !h-[1.8vw] !min-h-[1.8vw]" 
           />
        </div>
        <div className="flex items-center gap-[0.8vw]">
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className={`text-gray-500 hover:text-gray-800 transition-colors ${isExpanded ? 'text-[#4D47FF]' : ''}`}
           >
             <Icon icon="lucide:sliders-horizontal" className="w-[0.9vw] h-[0.9vw]" />
           </button>
           <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
             <Icon icon="lucide:trash-2" className="w-[0.9vw] h-[0.9vw]" />
           </button>
        </div>
      </div>
      
      {/* Body */}
      {isExpanded && (
        <div className="p-[1vw] pt-[0.8vw] space-y-[1.2vw]">
           {/* Add Image on Sheet */}
           <div>
             <SectionHeader label="Add Image on Sheet" />
             {sheet.image ? (
               <div className="flex items-center gap-[1vw] mt-[0.5vw]">
                  <div className="w-[7.5vw] h-[4vw] rounded-[0.2vw] overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                       <img src={sheet.image} className="w-full h-full object-cover" alt="Sheet" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[0.7vw] text-gray-700 mb-[0.1vw] truncate w-[9vw]">{sheet.imageName || 'Image Name .jpg'}</span>
                     <span className="text-[0.55vw] text-gray-400 mb-[0.5vw]">1920 X 1080 • {sheet.imageSize || '24MB'}</span>
                     <div className="flex items-center gap-[0.4vw]">
                        <button onClick={() => setShowReplaceModal(true)} className="px-[0.6vw] py-[0.25vw] bg-gray-50 border border-gray-200 rounded-[0.2vw] text-[0.65vw] text-gray-600 hover:bg-gray-100 transition-colors">
                          Replace Image
                        </button>
                        <button onClick={() => onUpdate({ ...sheet, image: null, imageName: null, imageSize: null })} className="p-[0.25vw] px-[0.4vw] bg-gray-50 border border-gray-200 rounded-[0.2vw] text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors">
                          <Icon icon="lucide:trash-2" className="w-[0.8vw] h-[0.8vw]" />
                        </button>
                     </div>
                  </div>
               </div>
             ) : (
               <div 
                 onClick={() => setShowReplaceModal(true)}
                 className="w-full h-[4.5vw] mt-[0.5vw] border-[1.5px] border-dashed border-gray-300 rounded-[0.4vw] flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors group"
               >
                 <div className="flex items-center gap-[0.5vw] text-gray-500 group-hover:text-gray-700">
                   <Icon icon="lucide:plus" className="w-[1vw] h-[1vw]" />
                   <span className="text-[0.75vw] font-medium">Add Image</span>
                 </div>
               </div>
             )}
             
             {showReplaceModal && (
                <ReplaceMediaModal
                  show={showReplaceModal}
                  size="small"
                  titleText="Add Image"
                  buttonText="Add Image"
                  onClose={() => setShowReplaceModal(false)}
                  onReplace={(file) => {
                    handleImageSelect(file);
                    setShowReplaceModal(false);
                  }}
                  mediaType="image"
                />
             )}
           </div>

           {/* Adjustments */}
           <div>
             <SectionHeader label="Adjustments" />
             <div className="flex gap-[1.5vw] mt-[0.8vw]">
                {/* Sliders Column */}
                <div className="flex-1 space-y-[0.8vw]">
                   <div>
                     <div className="flex items-center justify-between mb-[0.2vw]">
                       <span className="text-[0.65vw] text-gray-700">Scale :</span>
                       <span className="text-[0.65vw] text-gray-700">{sheet.scale !== undefined ? sheet.scale : 100}%</span>
                     </div>
                     <CustomSlider value={sheet.scale !== undefined ? sheet.scale : 100} onChange={(val) => onUpdate({ ...sheet, scale: val })} max={200} />
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-[0.2vw]">
                       <span className="text-[0.65vw] text-gray-700">Rotate :</span>
                       <span className="text-[0.65vw] text-gray-700">{sheet.rotate || 90}&deg;</span>
                     </div>
                     <CustomSlider value={sheet.rotate || 90} onChange={(val) => onUpdate({ ...sheet, rotate: val })} max={360} />
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-[0.2vw]">
                       <span className="text-[0.65vw] text-gray-700">Opacity :</span>
                       <span className="text-[0.65vw] text-gray-700">{sheet.opacity !== undefined ? sheet.opacity : 100}%</span>
                     </div>
                     <CustomSlider value={sheet.opacity !== undefined ? sheet.opacity : 100} onChange={(val) => onUpdate({ ...sheet, opacity: val })} />
                   </div>
                </div>

                {/* Position Column */}
                <div>
                   <div className="text-[0.65vw] text-gray-700 mb-[0.4vw]">Position :</div>
                   <PositionPad onMove={(dir) => console.log('Move', dir)} />
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export const TransparentSheetSection = ({ bookAppearanceSettings, onUpdateBookAppearance, pages = [] }) => {
  const sheets = bookAppearanceSettings?.transparentSheets || [];

  const addSheet = () => {
    const newSheet = { id: Date.now(), isExpanded: true, scale: 100, rotate: 90, opacity: 100 };
    onUpdateBookAppearance({ ...bookAppearanceSettings, transparentSheets: [...sheets, newSheet] });
  };

  const updateSheet = (updatedSheet) => {
    const newSheets = sheets.map(s => s.id === updatedSheet.id ? updatedSheet : s);
    onUpdateBookAppearance({ ...bookAppearanceSettings, transparentSheets: newSheets });
  };

  const deleteSheet = (id) => {
    const newSheets = sheets.filter(s => s.id !== id);
    onUpdateBookAppearance({ ...bookAppearanceSettings, transparentSheets: newSheets });
  };

  return (
    <div className="pt-[1.5vw]">
      <div className="flex items-center gap-[1vw] mb-[1vw]">
        <span className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap">Transparent Sheet</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
      </div>

      <div className="space-y-[0.8vw]">
        {sheets.map((sheet, index) => (
          <SheetCard 
            key={sheet.id || index} 
            sheet={sheet} 
            onUpdate={updateSheet} 
            onDelete={() => deleteSheet(sheet.id)} 
            pages={pages}
          />
        ))}
      </div>

      <button 
        onClick={addSheet}
        className="w-full mt-[0.5vw] flex items-center justify-center gap-[0.5vw] py-[0.6vw] bg-[#e3e3e3] text-gray-600 rounded-[0.4vw] hover:bg-gray-300 transition-colors text-[0.75vw] font-medium"
      >
        <Icon icon="lucide:plus" className="w-[0.9vw] h-[0.9vw]" />
        Add Transparent Sheet
      </button>
    </div>
  );
};
