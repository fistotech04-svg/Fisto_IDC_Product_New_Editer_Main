import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, useGLTF } from '@react-three/drei';
import { CustomQRCode } from './Model3DEditor';
import ColorPicker from './ColorPicker';

const GlbModelViewer = React.memo(({ url, autoRotate, autoRotateSpeed }) => {
  const { scene } = useGLTF(url);
  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 5] }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <Stage environment="city" adjustCamera={1.5} intensity={1}>
        <primitive object={scene} />
      </Stage>
      <OrbitControls makeDefault enableZoom={true} enablePan={true} autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />
    </Canvas>
  );
});

const Model3DPreviewModal = ({ 
  isOpen, 
  dataUrl, 
  autoRotate = true, 
  autoRotateSpeed = 1.5, 
  bgType = 'Solid', 
  bgColor: initialBgColor = '#ffffff',
  customBg = true,
  enableAR = true,
  setBgColor: externalSetBgColor,
  qrText = 'Scan Me', qrColor = '#000000', qrBgType = 'Solid', qrBgColor = '#ffffff', qrLevel = 'M', qrDotType = 'square', qrCornerSquareType = 'square', qrCornerDotType = 'square', qrLogo,
  topText, bottomText
}) => {
  const [localBgColor, setLocalBgColor] = useState(initialBgColor);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  React.useEffect(() => {
    if (initialBgColor) {
      setLocalBgColor(initialBgColor);
    }
  }, [initialBgColor]);

  const bgColor = externalSetBgColor ? initialBgColor : localBgColor;

  const handleSetBgColor = (color) => {
    setLocalBgColor(color);
    if (externalSetBgColor) {
      externalSetBgColor(color);
    }
  };

  const safeQrValue = React.useMemo(() => {
    if (!dataUrl) return qrText || "Scan Me";
    if (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:')) {
      return "AR View unavailable for local/unsaved models.";
    }
    const resolvedUrl = new URL(dataUrl, window.location.href).href;
    return `${window.location.origin}/ar-view?url=${encodeURI(resolvedUrl)}`;
  }, [dataUrl, qrText]);

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-transparent flex flex-col overflow-hidden p-[0.5vw]">
      <div className="flex-1 bg-white rounded-[1vw] shadow-md relative overflow-hidden flex flex-col pointer-events-auto border border-gray-200">
        
        {/* Top Overlays */}
        <div className="absolute top-[2vw] left-[2.5vw] z-10 flex items-center gap-[1vw] pointer-events-none">
          <span className="text-[1.1vw] font-medium text-gray-800">{topText}</span>
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
        <div className="absolute bottom-[2vw] left-[2.5vw] right-[2.5vw] z-10 flex items-end justify-between pointer-events-none">
          
          {/* Bottom Left: Adjust BG */}
          <div className="flex items-center pb-[0.5vw] min-w-[15vw] relative">
            {customBg && (
              <div className="flex items-center gap-[0.8vw] pointer-events-auto cursor-pointer" onClick={() => setShowBgColorPicker(true)}>
                <div className="w-[2vw] h-[2vw] rounded-[0.4vw] shadow-sm border border-gray-200" style={{ backgroundColor: bgType === 'Solid' ? bgColor : '#ffffff' }}></div>
                <span className="text-[0.9vw] font-medium text-gray-400">Click to Adjust BG color</span>
              </div>
            )}
            {showBgColorPicker && (
               <>
                 <div className="fixed inset-0 z-[55] cursor-default pointer-events-auto" onClick={(e) => { e.stopPropagation(); setShowBgColorPicker(false); }} />
                 <div className="absolute bottom-[calc(100%+0.5vw)] left-[0vw] z-[60] pointer-events-auto">
                     <ColorPicker 
                         color={bgColor} 
                         onChange={handleSetBgColor} 
                         hidePalette={true}
                         onClose={() => setShowBgColorPicker(false)}
                     />
                 </div>
               </>
            )}
          </div>

          {/* Bottom Center: Machine text */}
          <div className="flex items-center gap-[0.5vw] pointer-events-auto cursor-pointer absolute left-1/2 -translate-x-1/2 bottom-[0.5vw]">
            <span className="text-[1.1vw] font-semibold text-gray-500">{bottomText}</span>
          </div>

          {/* Bottom Right: QR Code */}
          <div className="flex flex-col items-center min-w-[10vw]">
            {enableAR && (
              <div className="flex flex-col items-center gap-[0.2vw] pointer-events-auto cursor-pointer">
                 <div className="w-[4.5vw] h-[4.5vw] rounded-[0.5vw] p-[0.3vw] shadow-sm flex items-center justify-center" style={{ backgroundColor: qrBgType === 'Solid' ? qrBgColor : 'transparent' }}>
                   <CustomQRCode 
                      value={safeQrValue} 
                      size={1024} 
                      margin={0}
                      fgColor={qrColor} 
                      bgColor={qrBgType === 'Solid' ? qrBgColor : 'transparent'} 
                      dotType={qrDotType} 
                      cornerSquareType={qrCornerSquareType} 
                      cornerDotType={qrCornerDotType} 
                      level={qrLevel}
                      logo={qrLogo}
                   />
                 </div>
                 <span className="text-[0.9vw] font-medium text-gray-800">{qrText || "Scan Me"}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Model3DPreviewModal;
