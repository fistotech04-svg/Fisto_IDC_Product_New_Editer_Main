import React from 'react';
import { Icon } from '@iconify/react';

const activityData = [
  {
    date: 'Today',
    items: [
      { id: 1, type: 'edit', title: 'You updated your profile', desc: 'Profile information updated successfully.', time: '10:30 AM', color: 'text-green-500', bg: 'bg-green-50', dot: 'bg-green-500', icon: 'mdi:pencil-outline' },
      { id: 2, type: 'create', title: 'You created a new flipbook', desc: 'Flipbook name: Product Catalogue', time: '09:15 AM', color: 'text-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500', icon: 'mdi:book-open-outline' },
      { id: 3, type: 'send', title: 'You sent a flipbook', desc: 'Flipbook: Product Catalogue\nSent to: client@example.com', time: '08:40 AM', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500', icon: 'mdi:send-outline' },
      { id: 4, type: 'edit_flip', title: 'You edited a flipbook', desc: 'Flipbook: Interior Design Catalogue', time: '08:05 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'mdi:pencil-outline' },
      { id: 5, type: 'publish', title: 'You published a flipbook', desc: 'Flipbook: Kerala Explorer', time: '07:25 AM', color: 'text-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500', icon: 'mdi:upload-outline' }
    ]
  },
  {
    date: 'Yesterday',
    items: [
      { id: 6, type: 'publish_sys', title: 'You published a flipbook', desc: 'Flipbook: Sirius Black Construction', time: '05:45 PM', color: 'text-green-500', bg: 'bg-green-50', dot: 'bg-green-500', icon: 'mdi:file-export-outline' },
      { id: 7, type: 'send', title: 'You sent a flipbook', desc: 'Flipbook: Sirius Black Construction\nSent to: team@fist-o-com', time: '04:20 PM', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500', icon: 'mdi:send-outline' },
      { id: 8, type: 'edit_flip', title: 'You edited a flipbook', desc: 'Flipbook: Modern Architecture', time: '02:15 PM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'mdi:pencil-outline' },
      { id: 9, type: 'create', title: 'You created a new flipbook', desc: 'Flipbook name: Furniture Collection', time: '11:30 AM', color: 'text-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500', icon: 'mdi:book-open-outline' },
    ]
  },
  {
    date: 'May 20, 2025',
    items: [
      { id: 10, type: 'publish_sys', title: 'You published a flipbook', desc: 'Flipbook: Furniture Collection', time: '06:10 PM', color: 'text-green-500', bg: 'bg-green-50', dot: 'bg-green-500', icon: 'mdi:file-export-outline' },
      { id: 11, type: 'send', title: 'You sent a flipbook', desc: 'Flipbook: Furniture Collection\nSent to: interior@design.com', time: '03:40 PM', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500', icon: 'mdi:send-outline' }
    ]
  }
];

const Activity = () => {
  return (
    <div className="flex flex-col flex-1 w-full relative h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-[1.5vw]">
        <div>
          <h2 className="text-[1.25vw] font-bold text-gray-900">My Activity</h2>
          <p className="text-[0.75vw] text-gray-500 mt-[0.2vw]">Only your actions and activities will appear here.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center border border-gray-200 rounded-[0.4vw] mb-[2vw]">
        <div className="flex items-center px-[1vw] py-[0.6vw] border-r border-gray-200 bg-white rounded-l-[0.4vw] min-w-[10vw]">
           <span className="text-[0.8vw] font-semibold text-gray-700">All Activities</span>
           <Icon icon="lucide:chevron-down" className="ml-auto w-[1vw] h-[1vw] text-gray-400" />
        </div>
        <div className="flex-1 flex items-center px-[1vw]">
           <Icon icon="lucide:search" className="w-[1vw] h-[1vw] text-gray-400" />
           <input type="text" placeholder="Search activity..." className="w-full bg-transparent px-[0.5vw] py-[0.6vw] text-[0.8vw] text-gray-600 focus:outline-none" />
        </div>
        <div className="px-[1vw] py-[0.6vw] border-l border-gray-200 flex items-center justify-center">
           <Icon icon="lucide:calendar" className="w-[1vw] h-[1vw] text-gray-400" />
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="flex flex-col relative pl-[2.5vw]">
        {/* Continuous left line */}
        <div className="absolute left-[0.4vw] top-[2vw] bottom-[2vw] w-[2px] bg-gray-100 z-0"></div>
        
        {activityData.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-[2vw]">
            <h3 className="text-[0.85vw] font-bold text-gray-800 mb-[1.5vw] relative z-10 -ml-[2.5vw]">{group.date}</h3>
            
            <div className="flex flex-col gap-[1.5vw]">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-start gap-[1.5vw] relative z-10">
                  {/* Dot */}
                  <div className={`absolute left-[-2.3vw] top-[1vw] w-[0.4vw] h-[0.4vw] rounded-full ${item.dot} shadow-sm border border-white box-content ring-2 ring-white`}></div>
                  
                  {/* Icon */}
                  <div className={`w-[2.5vw] h-[2.5vw] rounded-full flex items-center justify-center ${item.bg} ${item.color} shadow-sm shrink-0`}>
                    <Icon icon={item.icon} className="w-[1.2vw] h-[1.2vw]" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 flex justify-between items-start pt-[0.2vw]">
                    <div className="flex flex-col">
                      <h4 className="text-[0.85vw] font-bold text-gray-800 leading-tight">{item.title}</h4>
                      <div className="text-[0.75vw] text-gray-500 mt-[0.3vw] leading-relaxed whitespace-pre-line">
                         {item.desc}
                      </div>
                    </div>
                    
                    {/* Time & Options */}
                    <div className="flex items-center gap-[1vw] ml-auto shrink-0">
                      <span className="text-[0.7vw] text-gray-400 font-medium">{item.time}</span>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Icon icon="lucide:more-vertical" className="w-[1.2vw] h-[1.2vw]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-[1vw] pb-[2vw]">
         <button className="flex items-center gap-[0.5vw] border border-blue-100 bg-blue-50/50 text-blue-600 px-[1.5vw] py-[0.6vw] rounded-[0.4vw] text-[0.8vw] font-semibold hover:bg-blue-50 transition-colors">
            Load More Activities
            <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw]" />
         </button>
      </div>

    </div>
  );
};

export default Activity;
