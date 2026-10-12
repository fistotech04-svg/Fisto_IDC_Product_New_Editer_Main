// Frontend/src/pages/Forum/ForumSidebar.jsx
import React from 'react';
import { 
  BookOpen, 
  PenTool, 
  SlidersHorizontal, 
  Box, 
  Layers, 
  PanelLeftClose, 
  PanelLeftOpen,
  Folder
} from 'lucide-react';
import { FORUM_MODULES } from './forumData';

const iconMap = {
  BookOpen,
  PenTool,
  SlidersHorizontal,
  Box,
  Layers
};

export default function ForumSidebar({ 
  selectedModuleId, 
  onSelectModule, 
  isCollapsed, 
  onToggleCollapse, 
  moduleCounts = {} 
}) {
  return (
    <aside 
      className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Top Header */}
      <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <Folder size={19} className="text-[#ec5137]" />
            <span className="text-base font-bold text-gray-900 tracking-tight">Modules</span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Module List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {FORUM_MODULES.map((module) => {
          const isSelected = module.id === selectedModuleId;
          const IconComponent = iconMap[module.icon] || Folder;
          const count = moduleCounts[module.id] || 0;

          return (
            <button
              key={module.id}
              onClick={() => onSelectModule(module.id)}
              className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                isCollapsed 
                  ? 'justify-center p-3' 
                  : 'px-3.5 py-3 justify-between'
              } ${
                isSelected 
                  ? 'bg-orange-50 text-[#ec5137] font-semibold shadow-xs ring-1 ring-orange-200/60' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
              }`}
              title={isCollapsed ? `${module.name} (${count})` : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconComponent 
                  size={19} 
                  className={isSelected ? 'text-[#ec5137]' : 'text-gray-400 group-hover:text-gray-600'} 
                />
                {!isCollapsed && (
                  <span className="text-sm truncate">
                    {module.name}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isSelected ? 'bg-orange-200/70 text-[#ec5137] font-bold' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
