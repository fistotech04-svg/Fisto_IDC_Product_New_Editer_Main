import React, { useState } from 'react';
import { SquarePlay, Image as ImageIcon, CloudUpload } from 'lucide-react';
import { Icon } from '@iconify/react';

const RightSidebar = ({ isDoublePage, setIsDoublePage }) => {

  return (
    <div 
      className="bg-[#FFFFFF] border-l border-[#EEEEEE] flex flex-col overflow-hidden select-none flex-shrink-0"
      style={{ width: '24vw', height: '92vh' }}
    >
      {/* Top Header - 8vh consistent with Layer */}
      <div className="flex items-center justify-between px-[1.5vw] flex-shrink-0" style={{ height: '8vh' }}>
        <div className="flex items-center gap-[1vw]">
          {/* Toggle Switch */}
          <div 
            onClick={() => setIsDoublePage(!isDoublePage)}
            className={`w-[2.4vw] h-[1.2vw] rounded-full relative cursor-pointer transition-colors duration-300 ${isDoublePage ? 'bg-[#5145F6]' : 'bg-[#D1D5DB]'}`}
          >
             <div className={`absolute top-[0.15vw] w-[0.9vw] h-[0.9vw] bg-white rounded-full transition-all duration-300 ${isDoublePage ? 'left-[1.35vw]' : 'left-[0.15vw]'}`}></div>
          </div>
          <span className="text-[0.95vw] font-semibold text-[#111827]">Double Page</span>
        </div>

        <button className="bg-[#5145F6] text-white flex items-center gap-[0.3vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] shadow-md hover:bg-[#4338CA] transition-all">
          <Icon icon="ic:baseline-preview" className='text-white' width="1.5vw" height="1.5vw" />
          <span className="text-[0.9vw] font-semibold">Preview</span>
        </button>
      </div>

      <div className="h-[1px] bg-[#EEEEEE] mx-[-1.5vw]"></div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f6f7]">
        <div className="p-[1.5vw] flex flex-col gap-[3.5vh]">
          {/* Upload Files Section */}
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-center gap-[0.75vw]">
              <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Upload Files</span>
              <div className="h-[0.1vw] flex-1 bg-gray-300 opacity-50"></div>
            </div>

            {/* Upload Box */}
            <div
              className="w-full h-[10vw] border-2 border-dashed rounded-[1.25vw] bg-white flex flex-col items-center justify-center p-[1vw] transition-all group shadow-sm border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md"
            >
              <div className="text-[0.75vw] font-semibold text-gray-500 mb-[1.5vw] tracking-tight">
                Drag & Drop or <span className="text-blue-600 font-bold">Upload</span>
              </div>

              <div className="mb-[1.5vw] transition-colors text-gray-400 group-hover:text-blue-500">
                <Icon icon="heroicons:arrow-up-tray" width="2vw" />
              </div>

              <div className="text-center">
                <div className="text-[0.65vw] font-bold text-gray-600 uppercase tracking-wide mb-[0.25vw]">
                  Supported File
                </div>
                <div className="text-[0.55vw] text-gray-400 leading-relaxed uppercase max-w-[12vw] font-medium text-center">
                  Image, Video, Audio, GIF, SVG
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Button Section */}
          <div className="mt-[1vh]">
            <div 
              className="w-full h-[6vh] rounded-[0.8vw] relative overflow-hidden flex items-center justify-center cursor-pointer shadow-lg group transition-transform hover:scale-[1.01]"
            >
              {/* Collage Background */}
              <div className="absolute inset-0 flex">
                <img 
                  src="https://images.unsplash.com/photo-1557683316-973673baf926?w=200&q=80" 
                  className="w-1/3 h-full object-cover brightness-[0.4] transition-all duration-500 group-hover:brightness-[0.6]" 
                  alt=""
                />
                <img 
                  src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=80" 
                  className="w-1/3 h-full object-cover brightness-[0.4] transition-all duration-500 group-hover:brightness-[0.6]" 
                  alt=""
                />
                <img 
                  src="https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=200&q=80" 
                  className="w-1/3 h-full object-cover brightness-[0.4] transition-all duration-500 group-hover:brightness-[0.6]" 
                  alt=""
                />
              </div>
              
              {/* Center Content */}
              <div className="relative z-10 flex items-center gap-[1vw] text-white">
                <ImageIcon size="1.4vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                <span className="text-[1.1vw] font-bold">Gallery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
