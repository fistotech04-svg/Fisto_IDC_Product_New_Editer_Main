import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Check, X } from 'lucide-react';

const activityData = [
  {
    date: 'Today',
    items: [
      { id: 1, type: 'edit', title: 'You updated your profile', desc: 'Profile information updated successfully.', time: '10:30 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'lucide:user' },
      { id: 2, type: 'create', title: 'You created a new flipbook', desc: 'Flipbook name: Product Catalogue', time: '09:15 AM', color: 'text-indigo-500', bg: 'bg-indigo-50', dot: 'bg-indigo-500', icon: 'lucide:book-open' },
      { id: 3, type: 'send', title: 'You sent a flipbook', desc: 'Flipbook: Product Catalogue\nSent to: client@example.com', time: '08:40 AM', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500', icon: 'lucide:send' },
      { id: 4, type: 'edit_flip', title: 'You edited a flipbook', desc: 'Flipbook: Interior Design Catalogue', time: '08:05 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'lucide:edit-3' },
      { id: 5, type: 'publish', title: 'You published a flipbook', desc: 'Flipbook: Kerala Explorer', time: '07:25 AM', color: 'text-green-500', bg: 'bg-green-50', dot: 'bg-green-500', icon: 'lucide:layout-template' }
    ]
  },
  {
    date: 'Yesterday',
    items: [
      { id: 6, type: 'edit', title: 'You updated your profile', desc: 'Profile information updated successfully.', time: '10:30 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'lucide:user' },
      { id: 7, type: 'create', title: 'You created a new flipbook', desc: 'Flipbook name: Product Catalogue', time: '09:15 AM', color: 'text-indigo-500', bg: 'bg-indigo-50', dot: 'bg-indigo-500', icon: 'lucide:book-open' },
      { id: 8, type: 'edit_flip', title: 'You edited a flipbook', desc: 'Flipbook: Interior Design Catalogue', time: '08:05 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'lucide:edit-3' },
    ]
  },
  {
    date: 'May 20, 2026',
    items: [
      { id: 9, type: 'edit', title: 'You updated your profile', desc: 'Profile information updated successfully.', time: '10:30 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'lucide:user' },
      { id: 10, type: 'create', title: 'You created a new flipbook', desc: 'Flipbook name: Product Catalogue', time: '09:15 AM', color: 'text-indigo-500', bg: 'bg-indigo-50', dot: 'bg-indigo-500', icon: 'lucide:book-open' },
      { id: 11, type: 'edit_flip', title: 'You edited a flipbook', desc: 'Flipbook: Interior Design Catalogue', time: '08:05 AM', color: 'text-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', icon: 'lucide:edit-3' },
    ]
  }
];

const activityOptions = [
  'All Activities',
  'Flipbook Creation',
  'Flipbook Updation',
  'Profile Creation',
  'Profile Updation',
  'Published Flipbook',
  'Un-Published Flipbook'
];

const Activity = () => {
  const [portalTarget, setPortalTarget] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('All Activities');
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setPortalTarget(document.getElementById('save-buttons-portal-target'));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredData = activityData.map(group => {
    let filteredItems = group.items;

    if (selectedActivity !== 'All Activities') {
      filteredItems = filteredItems.filter(item => {
        switch (selectedActivity) {
          case 'Flipbook Creation': return item.type === 'create';
          case 'Flipbook Updation': return item.type === 'edit_flip';
          case 'Profile Creation': return item.type === 'create_profile';
          case 'Profile Updation': return item.type === 'edit';
          case 'Published Flipbook': return item.type === 'publish';
          case 'Un-Published Flipbook': return item.type === 'unpublish';
          default: return true;
        }
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query)
      );
    }

    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  const filterSearchBar = (
    <div className="flex items-center gap-[1vw]">
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center px-[1vw] py-[0.59vw] border border-gray-200 rounded-[0.4vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[12vw] shadow-sm select-none"
        >
          <span className="text-[0.85vw] font-medium text-gray-700">{selectedActivity}</span>
          <Icon icon={isDropdownOpen ? "lucide:chevron-up" : "lucide:chevron-down"} className="ml-auto w-[1vw] h-[1vw] text-gray-400" />
        </div>
        
        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+0.5vw)] left-0 w-[14vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-[0.5vw] z-50">
            {activityOptions.map((option, idx) => (
              <div 
                key={idx}
                className={`px-[1.5vw] py-[0.6vw] text-[0.8vw] cursor-pointer transition-colors text-left ${selectedActivity === option ? 'text-[#312e81] font-medium bg-[#f8f8fc]/50' : 'text-gray-600 hover:text-[#312e81] hover:bg-[#f8f8fc]/50'}`}
                onClick={() => {
                  setSelectedActivity(option);
                  setIsDropdownOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center border border-gray-200 rounded-[0.4vw] bg-white w-[25vw] shadow-sm">
        <div className="flex-1 flex items-center px-[1vw]">
          <Icon icon="lucide:search" className="w-[1vw] h-[1vw] text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-[0.5vw] py-[0.59vw] text-[0.85vw] text-gray-600 focus:outline-none" 
          />
        </div>
        <div className="px-[1vw] py-[0.59vw] border-l border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 rounded-r-[0.4vw]">
          <Icon icon="lucide:calendar" className="w-[1vw] h-[1vw] text-gray-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 w-full relative h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-[1.5vw] custom-scrollbar pr-[1vw]">
        {portalTarget ? createPortal(filterSearchBar, portalTarget) : filterSearchBar}
      </div>

      {/* Activity Timeline Container */}
      <div className="p-[2vw] pt-0 flex-1 ">
        <div className="flex flex-col relative pl-[2.5vw] overflow-y-auto">
          {/* Continuous left line */}
          <div className="absolute left-[0.4vw] top-[1.5vw] bottom-[2vw] w-[2px] bg-gray-200 z-0"></div>

          {filteredData.length > 0 ? filteredData.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-[2.5vw]">
              <h3 className="text-[1.1vw] font-medium text-gray-900 mb-[1.5vw] relative z-10 -ml-[2.5vw]">{group.date}</h3>

              <div className="flex flex-col gap-[2vw]">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-[1.5vw] relative z-10">
                    {/* Dot */}
                    <div className={`absolute left-[-2.3vw] top-[1.25vw] w-[0.4vw] h-[0.4vw] rounded-full ${item.dot} shadow-sm border-[0.15vw] border-white box-content ring-2 ring-white/50 z-20`}></div>

                    {/* Icon */}
                    <div className={`w-[2.8vw] h-[2.8vw] rounded-full flex items-center justify-center ${item.bg} ${item.color} shadow-sm shrink-0 z-10`}>
                      <Icon icon={item.icon} className="w-[1.2vw] h-[1.2vw]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex justify-between items-center h-[2.8vw]">
                      <div className="flex flex-col justify-center h-full">
                        <h4 className="text-[0.85vw] font-medium text-gray-800 leading-tight">{item.title}</h4>
                        <div className="text-[0.75vw] text-gray-400 mt-[0.3vw] leading-relaxed whitespace-pre-line">
                          {item.desc}
                        </div>
                      </div>

                      {/* Time & Options */}
                      <div className="flex items-center gap-[1.5vw] ml-auto shrink-0 h-full">
                        <span className="text-[0.7vw] text-gray-400 font-medium uppercase tracking-wide">{item.time}</span>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <Icon icon="lucide:more-vertical" className="w-[1.2vw] h-[1.2vw]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-[5vw] text-gray-400 relative z-10 -ml-[2.5vw]">
              <Icon icon="lucide:search-x" className="w-[3vw] h-[3vw] mb-[1vw]" />
              <p className="text-[1vw]">No activities found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredData.length > 0 && (
          <div className="flex justify-center mt-[1vw]">
            <button className="flex items-center gap-[0.5vw] text-blue-600 px-[1.5vw] py-[0.6vw] text-[0.8vw] font-semibold hover:text-blue-700 transition-colors bg-transparent border-none">
              Load More Activities
              <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw]" />
            </button>
          </div>
        )}
      </div>


    </div>
  );
};

export default Activity;
