import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, useGLTF } from '@react-three/drei';
import { createPortal } from 'react-dom';
import Model3DCustomizeControl from './Model3DCustomizeControl';

const GlbModelViewer = ({ url, autoRotate, autoRotateSpeed }) => {
  const { scene } = useGLTF(url);
  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 5] }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <Stage environment="city" adjustCamera intensity={1}>
        <primitive object={scene} />
      </Stage>
      <OrbitControls enableZoom={true} enablePan={true} autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />
    </Canvas>
  );
};

const Model3DPreviewModal = ({ 
  isOpen, 
  dataUrl, 
  autoRotate, 
  autoRotateSpeed, 
  bgType, 
  bgColor 
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex-1 bg-transparent flex flex-col overflow-hidden">
      <div className="flex-1 bg-white rounded-[1vw] shadow-lg relative overflow-hidden flex flex-col pointer-events-auto border border-gray-200">
        
        {/* Top Overlays */}
        <div className="absolute top-[2vh] left-[2vw] z-10 flex items-center gap-[0.5vw]">
          <div className="relative flex items-center justify-center bg-white/80 p-[0.5vw] rounded-full shadow-sm backdrop-blur-sm">
            <Icon icon="lucide:rotate-3d" className="text-gray-700 text-[1.5vw]" />
          </div>
          <span className="text-[1vw] font-medium text-gray-800 bg-white/80 px-[0.8vw] py-[0.4vh] rounded-[0.5vw] shadow-sm backdrop-blur-sm">3D Preview Mode</span>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full h-full relative" style={{ backgroundColor: bgType === 'Solid' ? bgColor : 'transparent' }}>
          {dataUrl ? (
            <GlbModelViewer url={dataUrl} autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No Model Data</span>
            </div>
          )}
        </div>

        {/* Bottom Overlays */}
        <div className="absolute bottom-[2vh] left-0 w-full px-[2vw] flex items-end justify-between z-10 pointer-events-none">
          {/* Center bottom: Tag */}
          <div className="flex items-center gap-[0.5vw] pointer-events-auto cursor-pointer bg-white/80 px-[1vw] py-[0.5vh] rounded-[0.5vw] shadow-sm backdrop-blur-sm">
            <span className="text-[1vw] font-semibold text-gray-700">3D Interaction Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model3DPreviewModal;
