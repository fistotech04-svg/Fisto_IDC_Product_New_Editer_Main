import React from 'react';
import TopToolbar from './TopToolbar';

const MainEditor = () => {
  return (
    <div 
      className="bg-[#F3F4F6] flex-1 flex flex-col overflow-hidden h-[92vh]"
    >
      <TopToolbar />
      <div className="flex-1 relative flex items-center justify-center p-[2vw] overflow-hidden">
        {/* Canvas Area container - this can scroll if the canvas is larger than the area, 
            but MainEditor itself remains fixed height and non-scrollable */}
        <div className="w-full h-full flex items-center justify-center overflow-auto">
            
        </div>
      </div>
    </div>
  );
};

export default MainEditor;
