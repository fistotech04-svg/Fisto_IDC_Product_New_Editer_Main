// Frontend/src/pages/Tickets/TicketSidebar.jsx
import React from 'react';
import { 
  BookOpen, 
  PenTool, 
  SlidersHorizontal, 
  Box, 
  CreditCard, 
  Layers, 
  PanelLeftClose, 
  PanelLeftOpen,
  LifeBuoy,
  Inbox,
  Clock,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { TICKET_MODULES } from './ticketData';

const iconMap = {
  Layers,
  BookOpen,
  PenTool,
  SlidersHorizontal,
  Box,
  CreditCard
};

export default function TicketSidebar({ 
  selectedModuleId, 
  onSelectModule, 
  isCollapsed, 
  onToggleCollapse, 
  ticketCounts = {},
  statusFilter,
  onSelectStatusFilter
}) {
  return (
    <aside 
      className={`h-full bg-white border-r border-stone-200 flex flex-col transition-all duration-200 flex-shrink-0 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Top Header */}
      <div className="h-16 border-b border-stone-200 px-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ec5137]">
              <LifeBuoy size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-stone-900 tracking-tight block leading-tight">Support Desk</span>
              <span className="text-[10px] text-stone-400 font-medium">Flipibook Helpdesk</span>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {/* Module Department Folders */}
        <div>
          {!isCollapsed && (
            <div className="px-3 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Departments
            </div>
          )}

          <nav className="space-y-1 mt-1">
            {TICKET_MODULES.map((module) => {
              const isSelected = module.id === selectedModuleId;
              const IconComponent = iconMap[module.icon] || Layers;
              const count = ticketCounts[module.id] || 0;

              return (
                <button
                  key={module.id}
                  onClick={() => onSelectModule(module.id)}
                  className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                    isCollapsed 
                      ? 'justify-center p-3' 
                      : 'px-3.5 py-2.5 justify-between'
                  } ${
                    isSelected 
                      ? 'bg-orange-50 text-[#c23d26] font-semibold ring-1 ring-orange-200/80 shadow-xs' 
                      : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                  title={isCollapsed ? `${module.name} (${count})` : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent 
                      size={18} 
                      className={isSelected ? 'text-[#ec5137]' : 'text-stone-400 group-hover:text-stone-600'} 
                    />
                    {!isCollapsed && (
                      <span className="text-sm truncate">
                        {module.name}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isSelected ? 'bg-orange-200/80 text-[#c23d26] font-bold' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Status Views */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-stone-100">
            <div className="px-3 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Quick Views
            </div>

            <div className="space-y-1 mt-1">
              <button
                onClick={() => onSelectStatusFilter('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'all' ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox size={14} className="text-stone-400" />
                  <span>All Inquiries</span>
                </div>
              </button>

              <button
                onClick={() => onSelectStatusFilter('open')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'open' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Open Tickets</span>
                </div>
              </button>

              <button
                onClick={() => onSelectStatusFilter('answered')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'answered' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Answered</span>
                </div>
              </button>

              <button
                onClick={() => onSelectStatusFilter('in_progress')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'in_progress' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-purple-500" />
                  <span>In Progress</span>
                </div>
              </button>

              <button
                onClick={() => onSelectStatusFilter('resolved')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'resolved' ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-stone-600" />
                  <span>Resolved</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
