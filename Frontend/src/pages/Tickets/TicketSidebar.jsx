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
  CheckCircle2
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
      className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Top Header */}
      <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <LifeBuoy size={20} className="text-[#ec5137]" />
            <span className="text-base font-bold text-gray-900 tracking-tight">Support Desk</span>
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

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {/* Module Department Folders */}
        <div>
          {!isCollapsed && (
            <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
                      ? 'bg-orange-50 text-[#ec5137] font-semibold shadow-xs ring-1 ring-orange-200/60' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
                  }`}
                  title={isCollapsed ? `${module.name} (${count})` : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent 
                      size={18} 
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
        </div>

        {/* Quick Status Views */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-gray-100">
            <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Views
            </div>

            <div className="space-y-1 mt-1">
              <button
                onClick={() => onSelectStatusFilter('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'all' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox size={14} className="text-gray-400" />
                  <span>All Inquiries</span>
                </div>
              </button>

              <button
                onClick={() => onSelectStatusFilter('open')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'open' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Open Tickets</span>
                </div>
              </button>

              <button
                onClick={() => onSelectStatusFilter('in_progress')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'in_progress' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
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
                  statusFilter === 'resolved' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Resolved</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-200 bg-gray-50/70 text-xs text-gray-500">
          <p className="leading-snug">
            Need urgent assistance? Response time is typically within 2 business hours.
          </p>
        </div>
      )}
    </aside>
  );
}
