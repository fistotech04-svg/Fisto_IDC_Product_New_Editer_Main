// Frontend/src/pages/Forum/ForumModuleHeader.jsx
import React from 'react';
import { 
  BookOpen, 
  PenTool, 
  SlidersHorizontal, 
  Box, 
  Layers, 
  Plus, 
  CheckCircle2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { FORUM_MODULES } from './forumData';

const iconMap = {
  BookOpen,
  PenTool,
  SlidersHorizontal,
  Box,
  Layers
};

export default function ForumModuleHeader({ 
  selectedModuleId, 
  onOpenCreateModal, 
  postsCount = 0,
  solvedCount = 0 
}) {
  const currentModule = FORUM_MODULES.find(m => m.id === selectedModuleId) || FORUM_MODULES[0];
  const IconComponent = iconMap[currentModule.icon] || BookOpen;

  return (
    <div className="bg-white border-b border-gray-200 px-[1.8vw] py-[1.8vh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[1.2vh]">
        {/* Module Title & Details */}
        <div className="flex items-center gap-[0.9vw]">
          <div 
            className="w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] rounded-[0.7vw] flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: currentModule.color }}
          >
            <IconComponent size={20} />
          </div>

          <div>
            <div className="flex items-center gap-[0.5vw]">
              <h1 className="text-[1.3vw] font-bold text-gray-900 tracking-tight leading-none">
                {currentModule.name} Forum
              </h1>
              <span className="text-[0.68vw] font-semibold px-[0.45vw] py-[0.1vh] rounded bg-gray-100 text-gray-600 border border-gray-200">
                {currentModule.badgeText}
              </span>
            </div>
            <p className="text-[0.78vw] text-gray-500 mt-[0.3vh] max-w-[42vw] leading-tight">
              {currentModule.tagline}
            </p>
          </div>
        </div>

        {/* Action Button: Locked to this module */}
        <div className="flex items-center gap-[1vw]">
          {/* Quick Counter */}
          <div className="hidden md:flex items-center gap-[0.8vw] text-[0.72vw] text-gray-500 pr-[0.5vw] border-r border-gray-200">
            <div className="flex items-center gap-[0.3vw]">
              <MessageSquare size={12} className="text-[#ec5137]" />
              <span className="font-bold text-gray-800">{postsCount}</span>
              <span>Topics</span>
            </div>
            <div className="flex items-center gap-[0.3vw]">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="font-bold text-gray-800">{solvedCount}</span>
              <span>Solved</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenCreateModal}
            className="px-[1.2vw] py-[0.8vh] rounded-[0.5vw] font-bold text-[0.8vw] text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all shadow-xs flex items-center gap-[0.35vw] cursor-pointer"
          >
            <Plus size={15} />
            <span>Report Issue / Ask in {currentModule.shortName}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
