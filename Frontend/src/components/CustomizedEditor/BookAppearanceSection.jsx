import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';
import * as BookAppearanceHelpers from './bookAppearanceHelpers';
import { 
  CustomColorPicker, 
  EffectControlRow, 
  DraggableSpan 
} from './AppearanceShared';

const BookAppearanceSection = ({ 
  bookAppearanceSettings, 
  onUpdateBookAppearance,
  pages = []
}) => {
  const [showShadowColorPicker, setShowShadowColorPicker] = useState(false);
  const [shadowPickerPos, setShadowPickerPos] = useState({ x: 0, y: 0 });

  const handleColorPick = async () => {
    if (!window.EyeDropper) return;
    const eyeDropper = new window.EyeDropper();
    try {
      const result = await eyeDropper.open();
      onUpdateBookAppearance({
        ...bookAppearanceSettings,
        dropShadow: {
          ...(bookAppearanceSettings?.dropShadow || {}),
          color: result.sRGBHex
        }
      });
    } catch (e) {
      console.log('EyeDropper cancelled or failed', e);
    }
  };

  return (
    <div className="p-[1vw] ">
      {/* Book Paper Texture */}
      <div className="space-y-[0vw] ">
        <div className="flex items-center gap-[0.5vw]">
          <h3 className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Book Paper Texture</h3>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
        </div>
        <p className="text-[0.6vw] text-gray-400 font-sm  mb-[0.5vw] ">
          The chosen paper texture will be applied to every page of the flipbook.
        </p>
        
        <div className="flex items-center gap-[0.7vw] py-[0.5vw]">
          <div className="relative group">
            <div 
              className="w-[4.5vw] h-[4.5vw] bg-transparent rounded-[0.6vw] border-2 border-gray-200 overflow-hidden flex items-center justify-center hover:scale-105 duration-300 shadow-sm"
            >
              {bookAppearanceSettings?.texture && bookAppearanceSettings.texture !== 'Plain White' ? (
                <div 
                   className="w-full h-full rounded-[0.5vw]"
                   style={{
                      backgroundImage: BookAppearanceHelpers.processBookAppearanceSettings(bookAppearanceSettings).textureStyle.backgroundImage,
                      backgroundSize: 'contain',
                      opacity: 0.8
                   }}
                />
              ) : (
                <div className="w-full h-full rounded-[0.6vw] " />
              )}
            </div>
          </div>
          
          <div className="flex-1 space-y-[0vw]">
            <div className="flex flex-col gap-[0.3vw] pt-[0.2vw]">
              <span className="text-[0.8vw] font-semibold text-gray-700">Texture :</span>
              <div className="pt-[0.4vw]">
                <PremiumDropdown 
                  options={['Plain White', 'Soft Matte Paper', 'Premium Art Paper', 'Photo Album Paper', 'Soft Linen Paper', 'Light Grain Paper', 'Fine Texture Paper', 'Smooth Print Paper']}
                  value={bookAppearanceSettings?.texture || 'Soft Matte Paper'}
                  onChange={(opt) => onUpdateBookAppearance({...bookAppearanceSettings, texture: opt})}
                  width="9.5vw"
                  buttonClassName="!border-gray-600 !rounded-[0.5vw]"
                  align="left"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Section */}
      <div className="flex flex-col gap-[0vw] pt-[0.2vw]">
        {[
          { label: 'Grain Intensity', key: 'grainIntensity', min: -100, max: 100 },
          { label: 'Warmth', key: 'warmth', min: -100, max: 100 },
          { label: 'Texture Scale', key: 'textureScale', min: -50, max: 50 },
          { label: 'Opacity', key: 'opacity', min: 0, max: 100 }
        ].map((item) => {
          const val = bookAppearanceSettings?.[item.key] ?? (item.key === 'opacity' ? 100 : 0);
          
          return (
            <div key={item.key} className="flex flex-col mb-[0.2vw]">
              <div className="flex items-center mb-[-0.2vw]">
                <DraggableSpan 
                  label={item.label} 
                  value={val} 
                  onChange={(v) => onUpdateBookAppearance({...bookAppearanceSettings, [item.key]: v})}
                  min={item.min} 
                  max={item.max} 
                  className="text-[0.75vw] font-semibold text-gray-700" 
                />
                <Icon 
                  icon="lucide:rotate-ccw" 
                  className="w-[0.9vw] h-[0.9vw] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors ml-[0.2vw]" 
                  onClick={() => onUpdateBookAppearance({...bookAppearanceSettings, [item.key]: item.key === 'opacity' ? 100 : 0})} 
                />
              </div>
              
              <div className="flex items-center gap-[0.5vw]">
                <div className="flex-1 relative h-[1.2vw] flex items-center">
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={val}
                    onChange={(e) => onUpdateBookAppearance({...bookAppearanceSettings, [item.key]: parseInt(e.target.value)})}
                    className="w-full h-[0.5vw] rounded-full appearance-none cursor-pointer accent-[#5551FF] z-10 bg-transparent"
                  />
                  <div 
                    className="absolute inset-x-0 h-[0.25vw] rounded-full -z-0"
                    style={{ 
                      background: item.key === 'warmth' 
                        ? 'linear-gradient(to right, #4387f5ff 0%, #E5E7EB 50%, #FFE4B5 100%)' 
                        : '#E5E7EB'
                    }}
                  >
                    { (item.key === 'opacity') && (
                       <div 
                         className="h-full bg-[#5551FF] rounded-full" 
                         style={{ 
                           width: `${((val - item.min) / (item.max - item.min)) * 100}%` 
                         }} 
                       />
                    )}
                    {(item.key !== 'opacity' && item.key !== 'warmth') && (
                      <div 
                        className="absolute top-0 bottom-0 bg-[#5551FF] rounded-full" 
                        style={{ 
                          left: val >= 0 ? '50%' : `${50 - (Math.abs(val) / item.max * 50)}%`, 
                          width: `${(Math.abs(val) / item.max * 50)}%` 
                        }} 
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div 
                    className="w-[2vw] h-[1.5vw] flex items-center justify-between pl-[0.5vw] cursor-ew-resize select-none text-[0.75vw] font-semibold text-gray-700"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startVal = val;
                      const handleMove = (moveEvent) => {
                        const dx = moveEvent.clientX - startX;
                        const newVal = Math.max(item.min, Math.min(item.max, startVal + Math.round(dx)));
                        onUpdateBookAppearance({...bookAppearanceSettings, [item.key]: newVal});
                      };
                      const handleUp = () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
                      window.addEventListener('mousemove', handleMove);
                      window.addEventListener('mouseup', handleUp);
                    }}
                  >
                    {val}{item.key === 'opacity' ? '%' : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hard Cover Settings - Designed From Image */}
      <div className="space-y-[0.5vw] pt-[1vw]">
        <div className="flex items-center gap-[0.5vw]">
          <h3 className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Hard Cover Settings</h3>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
        </div>

        <div className="flex flex-col gap-[1vw]">
          <div className="flex items-center justify-between px-[0.2vw]">
            <span className="text-[0.75vw] font-semibold text-gray-700">Make First & Last Page Hard</span>
            <button 
              onClick={() => {
                const newValue = !bookAppearanceSettings?.makeFirstLastPageHard;
                let currentHardPages = [...(bookAppearanceSettings?.customHardPages || [])];
                
                if (newValue) {
                  // When enabling first/last, ensure they are in customHardPages
                  const firstIdx = 0;
                  const lastIdxGroupStart = (Math.ceil(pages.length / 2) - 1) * 2;
                  
                  const pagesToAdd = [firstIdx, firstIdx + 1, lastIdxGroupStart];
                  if (lastIdxGroupStart + 1 < pages.length) pagesToAdd.push(lastIdxGroupStart + 1);
                  
                  currentHardPages = Array.from(new Set([...currentHardPages, ...pagesToAdd]));
                }

                onUpdateBookAppearance({
                  ...bookAppearanceSettings, 
                  makeFirstLastPageHard: newValue,
                  hardCover: newValue ? (newValue || bookAppearanceSettings?.selectCustomHardPages) : false,
                  selectCustomHardPages: newValue ? bookAppearanceSettings?.selectCustomHardPages : false,
                  customHardPages: newValue ? currentHardPages : []
                });
              }}
              className={`w-[2.3vw] h-[1.1vw] rounded-full relative transition-all duration-300 ${bookAppearanceSettings?.makeFirstLastPageHard ? 'bg-[#5551FF]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-[0.1vw] w-[0.9vw] h-[0.9vw] bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${bookAppearanceSettings?.makeFirstLastPageHard ? 'left-[1.3vw]' : 'left-[0.1vw]'}`}>
                {bookAppearanceSettings?.makeFirstLastPageHard && (
                  <Icon icon="lucide:check" className="text-[#5551FF] w-[0.6vw] h-[0.6vw]" strokeWidth={3} />
                )}
              </div>
            </button>
          </div>

          {/* Select Custom Hard Pages */}
          <div className={`flex items-center justify-between px-[0.2vw] ${!bookAppearanceSettings?.makeFirstLastPageHard ? 'opacity-50' : ''}`}>
            <span className="text-[0.75vw] font-semibold text-gray-700">Select Custom Hard Pages</span>
            <button 
              disabled={!bookAppearanceSettings?.makeFirstLastPageHard}
              onClick={() => onUpdateBookAppearance({
                ...bookAppearanceSettings, 
                selectCustomHardPages: !bookAppearanceSettings?.selectCustomHardPages
              })}
              className={`w-[2.3vw] h-[1.1vw] rounded-full relative transition-all duration-300 ${bookAppearanceSettings?.makeFirstLastPageHard ? 'cursor-not-allowed' : 'cursor-pointer'} ${bookAppearanceSettings?.selectCustomHardPages ? 'bg-[#5551FF]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-[0.1vw] w-[0.9vw] h-[0.9vw] bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${bookAppearanceSettings?.selectCustomHardPages ? 'left-[1.3vw]' : 'left-[0.1vw]'}`}>
                {bookAppearanceSettings?.selectCustomHardPages && (
                  <Icon icon="lucide:check" className="text-[#5551FF] w-[0.6vw] h-[0.6vw]" strokeWidth={3} />
                )}
              </div>
            </button>
          </div>

          {/* Custom Pages Selection List - Only visible when the toggle is turned ON */}
          {bookAppearanceSettings?.selectCustomHardPages && (
            <div className="mt-[0.2vw] border border-gray-200 rounded-[0.5vw] overflow-hidden bg-[#F8F9FA] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-[#F1F3F4] px-[0.5vw] py-[0.6vw] border-b border-gray-200">
                <span className="text-[0.75vw] font-semibold text-gray-800">Select Pages</span>
              </div>
              <div className="max-h-[10vw] overflow-y-auto pl-[0.9vw] pt-[0.5vw] pb-[0.5vw] space-y-[0.1vw] bg-white custom-scrollbar">
                {pages.length > 0 ? (
                  Array.from({ length: Math.ceil(pages.length / 2) }).map((_, groupIdx) => {
                    const idx1 = groupIdx * 2;
                    const idx2 = idx1 + 1;
                    const hasIdx2 = idx2 < pages.length;
                    
                    const isFirstSpread = groupIdx === 0;
                    const isLastSpread = groupIdx === (Math.ceil(pages.length / 2) - 1);
                    const isForced = bookAppearanceSettings?.makeFirstLastPageHard && (isFirstSpread || isLastSpread);
                    
                    const isSelected = isForced || (bookAppearanceSettings?.customHardPages || []).includes(idx1);
                    const label = hasIdx2 ? `Page ${idx1 + 1}-${idx2 + 1}` : `Page ${idx1 + 1}`;
                    
                    return (
                      <label 
                        key={groupIdx} 
                        className={`flex items-center gap-[0.8vw] px-[0.6vw] py-[0.45vw] transition-colors rounded-[0.4vw] ${
                          isForced ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer group'
                        }`}
                      >
                        <div 
                          className={`w-[1vw] h-[1vw] rounded-[0.15vw] border-[0.15vw] flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-[#5551FF] border-[#5551FF]' 
                              : 'border-gray-500 bg-white group-hover:border-gray-600'
                          } ${isForced ? 'cursor-not-allowed' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (isForced) return;
                            
                            const currentHardPages = bookAppearanceSettings?.customHardPages || [];
                            let newHardPages;
                            if (isSelected) {
                              newHardPages = currentHardPages.filter(p => p !== idx1 && p !== idx2);
                            } else {
                              newHardPages = [...currentHardPages, idx1];
                              if (hasIdx2) newHardPages.push(idx2);
                            }
                            onUpdateBookAppearance({...bookAppearanceSettings, customHardPages: newHardPages});
                          }}
                        >
                          {isSelected && (
                            <Icon icon="lucide:check" className="text-white w-[0.75vw] h-[0.75vw]" strokeWidth={4} />
                          )}
                        </div>
                        <span className={`text-[0.75vw] font-medium ${
                          isSelected ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {label}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-center py-[2vw] text-gray-400 text-[0.7vw]">
                    No pages available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Flipping Styles */}
      <div className="space-y-[0.5vw] pt-[1.5vw]">
        <div className="flex items-center gap-[1.5vw]">
          <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Page Flipping Styles</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
        </div>
        <div className="flex items-center justify-between  pl-[0.5vw]">
          <span className="text-[0.75vw] font-semibold text-gray-700">Flip Style :</span>
          <PremiumDropdown
            options={['Classic Flip', 'Smooth Flip', 'Fast Flip', 'Page Curl', '3D Flip', 'Slide Pages']}
            value={bookAppearanceSettings?.flipStyle || 'Classic Flip'}
            onChange={(opt) => onUpdateBookAppearance({ ...bookAppearanceSettings, flipStyle: opt })}
            width="10vw"
            buttonClassName="!border-gray-600 !rounded-[0.5vw]"
            align="right"
          />
        </div>
        <div className="flex items-center justify-between pl-[0.5vw] pb-[1vw]">
          <span className="text-[0.75vw] font-semibold text-gray-700">Flip Speed :</span>
          <PremiumDropdown
            options={['Slow', 'Medium', 'Fast']}
            value={bookAppearanceSettings?.flipSpeed || 'Slow'}
            onChange={(opt) => onUpdateBookAppearance({ ...bookAppearanceSettings, flipSpeed: opt })}
            width="10vw"
            buttonClassName="!border-gray-600 !rounded-[0.5vw]"
            align="right"
          />
        </div>
      </div>

      {/* Book Corner Radius */}
      <div className="space-y-[0.5vw] pt-[0.5vw]">
        <div className="flex items-center gap-[1vw]">
          <h3 className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Book Corner Radius</h3>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
        </div>
        <div className="flex items-center justify-between pl-[0.5vw]">
          <div className="flex items-center gap-[0.3vw]">
            <Icon icon="material-symbols:rounded-corner" className="w-[1vw] h-[1vw] text-gray-900" />
            <span className="text-[0.75vw] font-semibold text-gray-700">Corner Radius :</span>
          </div>
          <PremiumDropdown
            options={['Sharp', 'Soft', 'Round']}
            value={bookAppearanceSettings?.corner || 'Sharp'}
            onChange={(opt) => onUpdateBookAppearance({ ...bookAppearanceSettings, corner: opt })}
            width="10vw"
            buttonClassName="!border-gray-600 !rounded-[0.5vw]"
            align="right"
          />
        </div>
      </div>

      {/* Drop Shadow */}
      <div className="space-y-[1vw] pt-[1.5vw]">
        <div className="flex items-center gap-[1vw]">
          <h3 className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Drop Shadow</h3>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
        </div>
        
        <div className="flex items-start gap-[1vw] pl-[0.5vw]">
          {/* Shadow Preview */}
          <div 
            className="w-[4.5vw] h-[4vw] rounded-[0.2vw] relative overflow-hidden border border-gray-100 flex items-center justify-center cursor-pointer group shadow-sm bg-white"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setShadowPickerPos({ x: rect.left - 100, y: rect.top - 100 });
              setShowShadowColorPicker(true);
            }}
          >
            <div 
              className="absolute inset-0 z-0" 
              style={{ 
                backgroundImage: `conic-gradient(#f3f4f6 90deg, #fff 90deg 180deg, #f3f4f6 180deg 270deg, #fff 270deg)`,
                backgroundSize: '10px 10px'
              }} 
            />
            <div 
              className="absolute inset-0 z-10"
              style={{ 
                background: `linear-gradient(to right, ${bookAppearanceSettings?.dropShadow?.color || '#000000'}, transparent)`,
                opacity: (bookAppearanceSettings?.dropShadow?.opacity || 35) / 100
              }}
            />
            <span className="relative z-20 text-[0.8vw] font-bold text-white drop-shadow-md">
              {bookAppearanceSettings?.dropShadow?.opacity || 35} %
            </span>
          </div>

          <div className="flex-1 space-y-[0.8vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.75vw] font-semibold text-gray-700">Code :</span>
              <div className="relative group/input">
                <input 
                  type="text"
                  value={bookAppearanceSettings?.dropShadow?.color || '#000000'}
                  onChange={(e) => onUpdateBookAppearance({ 
                    ...bookAppearanceSettings, 
                    dropShadow: { ...bookAppearanceSettings.dropShadow, color: e.target.value } 
                  })}
                  className="w-[10vw] h-[1.8vw] bg-white border border-gray-600 rounded-[0.5vw] px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 focus:outline-none hover:border-[#7C3AED] transition-colors"
                />
                <div className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 w-[1vw] h-[1vw]">
                  <Icon 
                    icon="ph:eyedropper-bold" 
                    className="w-full h-full text-gray-400 group-hover/input:text-[#7C3AED] transition-colors" 
                  />
                  {'EyeDropper' in window ? (
                    <button 
                      onClick={handleColorPick} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                  ) : (
                    <input 
                      type="color" 
                      value={bookAppearanceSettings?.dropShadow?.color || '#000000'} 
                      onChange={(e) => onUpdateBookAppearance({ 
                        ...bookAppearanceSettings, 
                        dropShadow: { ...bookAppearanceSettings.dropShadow, color: e.target.value } 
                      })} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[0.75vw] font-semibold text-gray-700">Opacity :</span>
              <div className="flex items-center w-[10vw]">
                <div className="relative flex-1 h-[0.25vw] bg-gray-100 rounded-full">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#7c5dff] rounded-full"
                    style={{ width: `${bookAppearanceSettings?.dropShadow?.opacity || 35}%` }}
                  />
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={bookAppearanceSettings?.dropShadow?.opacity || 35}
                    onChange={(e) => onUpdateBookAppearance({ 
                      ...bookAppearanceSettings, 
                      dropShadow: { ...bookAppearanceSettings.dropShadow, opacity: parseInt(e.target.value) } 
                    })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-[1vw] h-[1vw] bg-indigo-600 rounded-full border-[2.5px] border-white shadow-xl pointer-events-none"
                    style={{ left: `calc(${bookAppearanceSettings?.dropShadow?.opacity || 35}% - 0.5vw)` }}
                  />
                </div>
                <span className="text-[0.75vw] font-semibold text-gray-500 w-[2.2vw] text-right whitespace-nowrap">
                  {bookAppearanceSettings?.dropShadow?.opacity || 35}%
                </span>
              </div>
            </div>
          </div>
        </div>

       <div className="space-y-[0.5vw] pt-[0.5vw] px-[0.5vw] pl-[0.5vw] w-fit">
                 {['X Axis', 'Y Axis', 'Blur %', 'Spread'].map((label, idx) => {
                   const keys = ['xAxis', 'yAxis', 'blur', 'spread'];
                   const key = keys[idx];
                   return (
                     <EffectControlRow
                       key={key}
                       label={label}
                       value={bookAppearanceSettings?.dropShadow?.[key] || 0}
                       onChange={(v) => onUpdateBookAppearance({ ...bookAppearanceSettings, dropShadow: { ...bookAppearanceSettings.dropShadow, [key]: v } })}
                       min={key === 'spread' ? -20 : -50} 
                       max={50}
                     />
                   );
                 })}
               </div>
             </div>

      {/* Instructions */}
      <div className="space-y-[0.5vw] pt-[1.5vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Flipbook Instructions</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
        </div>
        <div className="space-y-[1vw] pl-[0.5vw]">
          {['first', 'every'].map((type) => (
            <label key={type} className="flex items-center gap-[0.8vw] cursor-pointer">
              <div className={`w-[1vw] h-[1vw] rounded-full border flex items-center justify-center ${bookAppearanceSettings?.instructions === type ? 'border-[#5551FF]' : 'border-gray-200'}`}>
                {bookAppearanceSettings?.instructions === type && <div className="w-[0.6vw] h-[0.6vw] bg-[#5551FF] rounded-full" />}
              </div>
              <input type="radio" checked={bookAppearanceSettings?.instructions === type} onChange={() => onUpdateBookAppearance({ ...bookAppearanceSettings, instructions: type })} className="hidden" />
              <span className="text-[0.75vw] font-semibold text-gray-700">{type === 'first' ? 'Provide on Very first time only' : 'Provide on Every time they open'}</span>
            </label>
          ))}
        </div>
      </div>

      {showShadowColorPicker && (
        <CustomColorPicker
          color={bookAppearanceSettings?.dropShadow?.color || '#000000'}
          onChange={(newColor) => onUpdateBookAppearance({ ...bookAppearanceSettings, dropShadow: { ...bookAppearanceSettings.dropShadow, color: newColor } })}
          onClose={() => setShowShadowColorPicker(false)}
          position={shadowPickerPos}
        />
      )}
    </div>
  );
};

export default BookAppearanceSection;



