// Frontend/src/pages/Forum/ModuleSelector.jsx
import React from 'react';
import { 
  LayoutGrid, 
  BookOpen, 
  PenTool, 
  SlidersHorizontal, 
  Box, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { FORUM_MODULES } from './forumData';

const iconMap = {
  LayoutGrid: LayoutGrid,
  BookOpen: BookOpen,
  PenTool: PenTool,
  SlidersHorizontal: SlidersHorizontal,
  Box: Box,
  HelpCircle: HelpCircle
};

export default function ModuleSelector({ selectedModuleId, onSelectModule, postCounts = {} }) {
  const currentModule = FORUM_MODULES.find(m => m.id === selectedModuleId) || FORUM_MODULES[0];

  return (
    <div className="w-full">
      {/* Module Tabs Header */}
      <div className="flex items-center justify-between mb-[1vh]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.75vw] font-bold tracking-wider text-gray-400 uppercase">Select Module</span>
          <span className="text-[0.75vw] text-gray-400">• Filter discussions by editor tool</span>
        </div>
      </div>

      {/* Module Horizontal Grid / Scroller */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-[0.8vw]">
        {FORUM_MODULES.map((module) => {
          const isSelected = module.id === selectedModuleId;
          const IconComponent = iconMap[module.icon] || LayoutGrid;
          const count = postCounts[module.id] !== undefined ? postCounts[module.id] : module.count;

          return (
            <button
              key={module.id}
              onClick={() => onSelectModule(module.id)}
              className={`group relative text-left p-[0.9vw] rounded-[0.8vw] border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-white border-[#ec5137] shadow-[0_4px_16px_rgba(236,81,55,0.12)] ring-2 ring-[#ec5137]/20'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 shadow-sm'
              }`}
            >
              {/* Active Top Accent Line */}
              {isSelected && (
                <div 
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: module.id === 'all' ? '#ec5137' : module.color }}
                />
              )}

              <div className="flex items-start justify-between mb-[0.6vh]">
                <div 
                  className={`w-[2.2vw] h-[2.2vw] min-w-[32px] min-h-[32px] rounded-[0.6vw] flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected ? 'shadow-sm' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected 
                      ? (module.id === 'all' ? '#ec5137' : module.color) 
                      : '#f3f4f6',
                    color: isSelected ? '#ffffff' : '#4b5563'
                  }}
                >
                  <IconComponent size={16} />
                </div>

                <span 
                  className={`text-[0.7vw] font-bold px-[0.45vw] py-[0.15vh] rounded-full transition-colors ${
                    isSelected 
                      ? 'bg-orange-50 text-[#ec5137]' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}
                >
                  {count}
                </span>
              </div>

              <div>
                <h4 className={`text-[0.85vw] font-bold leading-snug line-clamp-1 ${
                  isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                }`}>
                  {module.name}
                </h4>
                <p className="text-[0.68vw] text-gray-400 line-clamp-1 mt-[0.1vh]">
                  {module.id === 'all' ? 'All categories' : `${count} discussions`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Module Brief Banner */}
      <div className="mt-[1.2vh] bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200/80 rounded-[0.7vw] px-[1.2vw] py-[0.8vh] flex items-center justify-between text-[0.8vw]">
        <div className="flex items-center gap-[0.7vw]">
          <span className="flex items-center justify-center w-[1.4vw] h-[1.4vw] rounded-full bg-[#ec5137]/10 text-[#ec5137]">
            <Sparkles size={12} />
          </span>
          <span className="font-semibold text-gray-800">
            {currentModule.name}:
          </span>
          <span className="text-gray-600 line-clamp-1">
            {currentModule.description}
          </span>
        </div>
        <div className="text-[0.72vw] text-gray-400 font-medium whitespace-nowrap ml-[1vw]">
          Viewing {postCounts[selectedModuleId] || 0} topics
        </div>
      </div>
    </div>
  );
}
