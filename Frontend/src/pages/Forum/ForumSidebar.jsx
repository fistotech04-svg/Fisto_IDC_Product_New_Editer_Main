// Frontend/src/pages/Forum/ForumSidebar.jsx
import React from 'react';
import { 
  BookOpen, 
  FileText, 
  Settings, 
  Box, 
  Repeat, 
  User, 
  ChevronRight,
  PanelLeftClose, 
  PanelLeftOpen,
  Folder
} from 'lucide-react';
import { FORUM_MODULES } from './forumData';

const iconMap = {
  BookOpen,
  FileText,
  Settings,
  Box,
  Repeat,
  User
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
      className={`h-full bg-white border-r border-orange-100/80 flex flex-col transition-all duration-200 flex-shrink-0 select-none z-20 ${
        isCollapsed 
          ? 'w-16 overflow-visible' 
          : 'w-full sm:w-[260px] md:w-[280px] lg:w-[290px]'
      }`}
    >
      {/* Top Header */}
      <div className={`h-16 border-b border-orange-100/70 px-4 flex items-center bg-white flex-shrink-0 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isCollapsed && (
          <div>
            <h2 className="text-sm font-semibold text-stone-900 tracking-tight">Modules</h2>
            <p className="text-[11px] text-stone-500">Discussion feeds by area</p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-stone-500 hover:text-[#ec5137] hover:bg-orange-50 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Module List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {FORUM_MODULES.map((module) => {
          const isSelected = module.id === selectedModuleId;
          const IconComponent = iconMap[module.icon] || Folder;
          const count = moduleCounts[module.id] || 0;

          if (isCollapsed) {
            // Clean minimized single button - no double nested pills
            return (
              <div
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className={`relative group w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isSelected 
                    ? 'bg-[#ec5137] text-white shadow-sm shadow-[#ec5137]/25' 
                    : 'bg-stone-50 hover:bg-orange-50 text-stone-600 hover:text-[#ec5137] border border-stone-200/80 hover:border-orange-200'
                }`}
              >
                <IconComponent size={18} />

                {/* Floating tooltip on hover */}
                <div className="absolute left-full ml-2.5 px-3 py-1.5 bg-stone-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  <div className="font-medium">{module.name}</div>
                  <div className="text-[10px] text-stone-300">{count} discussions</div>
                </div>
              </div>
            );
          }

          // Expanded layout
          return (
            <div
              key={module.id}
              onClick={() => onSelectModule(module.id)}
              className={`w-full rounded-xl transition-all duration-150 cursor-pointer border p-3 flex items-center justify-between ${
                isSelected 
                  ? 'bg-orange-50/70 border-[#ec5137]/40 shadow-xs ring-1 ring-[#ec5137]/20' 
                  : 'bg-white border-stone-200/80 hover:border-orange-200 hover:bg-stone-50/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSelected 
                      ? 'bg-[#ec5137] text-white shadow-xs' 
                      : 'bg-orange-50 text-[#ec5137]'
                  }`}
                >
                  <IconComponent size={18} />
                </div>

                <div className="min-w-0">
                  <span className={`text-sm block truncate ${
                    isSelected ? 'text-[#c23d26] font-semibold' : 'text-stone-800 font-medium'
                  }`}>
                    {module.name}
                  </span>
                  <span className="text-xs text-stone-500 block mt-0.2">
                    <span className={isSelected ? 'text-[#c23d26] font-medium' : 'text-stone-700'}>{count}</span> {count === 1 ? 'discussion' : 'discussions'}
                  </span>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                isSelected ? 'text-[#ec5137]' : 'text-stone-400'
              }`}>
                <ChevronRight size={15} />
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

