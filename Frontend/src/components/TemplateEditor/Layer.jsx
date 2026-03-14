import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

const Layer = () => {
  const [expandedPage, setExpandedPage] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use a motion value for persistent Y to avoid state-related jumping during fast moves
  const y = useMotionValue(0);

  const pages = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isVisible ? '16vw' : '0vw' }}
      className="relative h-[92vh] bg-white border-r border-[#EEEEEE] overflow-visible flex-shrink-0"
    >
      {/* 
        Floating Button Drag Area
        Centered 85vh track.
      */}
      {!isVisible && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[85vh] w-[2.5vw] z-50 pointer-events-none flex items-center justify-center">
          <motion.div
            drag="y"
            // Use static constraints relative to the 85vh container
            // (85vh / 2) - half button height (approx 40px)
            dragConstraints={{ top: -300, bottom: 300 }} 
            dragElastic={0}
            dragMomentum={false}
            style={{ y }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
              // Ensure clicking isn't triggered immediately after dragging
              setTimeout(() => setIsDragging(false), 100);
            }}
            onClick={() => {
              if (!isDragging) {
                setIsVisible(true);
              }
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto cursor-pointer group select-none relative"
          >
            <svg width="2.5vw" height="auto" viewBox="0 0 60 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter transition-transform duration-300">
              <path d="M0 0C0 11.5 10 11.5 10 11.5H48C54.6274 11.5 60 16.8726 60 23.5V59.5C60 66.1274 54.6274 71.5 48 71.5H10C10 71.5 0 71.5 0 82C0 80 0 1.5 0 0Z" fill="black"/>
              <path d="M22.979 35.315C20.993 36.109 20 36.506 20 37C20 37.4925 20.987 37.8876 22.961 38.6778L22.979 38.685L25.787 39.809C27.773 40.603 28.767 41 30 41C31.233 41 32.227 40.603 34.213 39.809L37.021 38.685C39.007 37.891 40 37.494 40 37C40 36.5075 39.013 36.1124 37.039 35.3222L37.021 35.315L34.213 34.192C32.227 33.397 31.233 33 30 33C29.046 33 28.236 33.237 27 33.712L22.979 35.315Z" fill="white"/>
              <path d="M40 41C40 41 39.007 41.89 37.021 42.685L34.213 43.809C32.227 44.603 31.233 45 30 45C28.767 45 27.773 44.603 25.787 43.809L22.98 42.685C20.993 41.891 20 41 20 41M20 45C20 45 20.993 45.89 22.979 46.685L25.787 47.809C27.773 48.603 28.767 49 30 49C30.954 49 31.764 48.763 33 48.288M37.021 46.685C39.007 45.891 40 45 40 45M22.979 38.685L25.787 39.809C27.773 40.603 28.767 41 30 41C31.233 41 32.227 40.603 34.213 39.809L37.021 38.685C39.007 37.891 40 37.494 40 37C40 36.5075 39.013 36.1124 37.039 35.3222M22.979 38.685L22.961 38.6778M22.979 38.685C22.973 38.6826 22.967 38.6802 22.961 38.6778M37.021 35.315L34.213 34.192C32.227 33.397 31.233 33 30 33C29.046 33 28.236 33.237 27 33.712L22.979 35.315C20.993 36.109 20 36.506 20 37C20 37.4925 20.987 37.8876 22.961 38.6778M37.021 35.315L37.039 35.3222M37.021 35.315C37.027 35.3174 37.033 35.3198 37.039 35.3222" stroke="white" strokeWidth="1.125" strokeLinecap="round"/>
            </svg>
          </motion.div>
        </div>
      )}

      {/* Sidebar Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col px-[0.8vw] pb-[1.5vh] select-none h-full w-[16vw] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-[0.2vw] flex-shrink-0" style={{ height: '8vh' }}>
              <div className="bg-[#F1F3F4] px-[1vw] py-[0.5vh] rounded-[0.5vw] text-[0.75vw] font-medium text-[#374151]">
                Name of the Book
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-[#374151] hover:bg-gray-100 p-[0.4vw] rounded-full transition-colors flex items-center justify-center"
              >
                <ArrowLeft size="1.2vw" strokeWidth={2.5} />
              </button>
            </div>

            <div className="h-[1px] bg-[#EEEEEE] mx-[-0.8vw] mb-[2vh]"></div>

            {/* Pages Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-[0.2vw] space-y-[1.2vh] no-scrollbar pb-[2vh]">
              {pages.map((page) => {
                const isExpanded = expandedPage === page;
                return (
                  <div key={page} className="flex flex-col">
                    <motion.div 
                      layout
                      className={`flex flex-col rounded-[0.6vw] transition-all duration-300 ${
                        isExpanded 
                          ? 'bg-white border border-[#E5E7EB] shadow-sm' 
                          : 'bg-[#E5E7EB] hover:bg-[#DADADA]'
                      }`}
                    >
                      <div 
                        onClick={() => setExpandedPage(isExpanded ? null : page)}
                        className={`flex items-center justify-between px-[1vw] py-[1.4vh] cursor-pointer`}
                      >
                        <span className={`text-[0.85vw] font-semibold ${isExpanded ? 'text-[#374151]' : 'text-[#4B5563]'}`}>
                          Page {page}
                        </span>
                        <div className="flex items-center gap-[0.8vw]">
                          <Layers 
                            size="1.1vw" 
                            className={isExpanded ? 'text-[#6366F1]' : 'text-[#6B7280]'} 
                            strokeWidth={isExpanded ? 2.5 : 2}
                          />
                          <MoreVertical size="1.1vw" className="text-[#111827]" />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden bg-white rounded-b-[0.6vw]"
                          >
                            <div className="pb-[2vh] px-[1vw] space-y-[1.2vh]">
                              {[1, 2, 3, 4, 5, 6].map((layer) => (
                                <motion.div 
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.05 }}
                                  key={layer} 
                                  className="text-[0.75vw] text-[#374151] font-medium hover:text-[#6366F1] cursor-pointer"
                                >
                                  Layer Name
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Footer Add Pages Button */}
            <div className="pt-[1vh] bg-white">
              <button className="w-full bg-[#000000] text-white py-[1.5vh] rounded-[0.6vw] text-[0.9vw] font-semibold flex items-center justify-center gap-[0.8vw] hover:bg-gray-900 transition-colors shadow-sm">
                <Plus size="1.2vw" strokeWidth={2.5} />
                <span>Add Pages</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Layer;
