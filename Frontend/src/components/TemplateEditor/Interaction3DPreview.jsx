import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { CustomQRCode } from './Model3DEditor';
import ColorPicker from './ColorPicker';
import axios from 'axios';

const ModelScene = ({ 
  url, 
  autoRotate = true, 
  autoRotateSpeed = 1.5,
  shadowStrength = 35,
  shadowSoftness = 35,
  lockMaxZoom = true,
  maxZoom = 4.5
}) => {
  const { scene } = useGLTF(url);
  const { camera, controls } = useThree();
  const [modelBounds, setModelBounds] = useState({ radius: 1.5, height: 1 });

  // Set initial camera framing ONLY when model url/scene changes
  React.useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = sphere.radius || 1.5;
    const height = size.y || 1;
    setModelBounds({ radius, height });

    const fov = camera.fov || 50;
    const fovRad = (fov * Math.PI) / 360;
    const dist = (radius / Math.sin(fovRad)) * 1.3;

    camera.position.set(0, 0, Math.max(dist, 1.5));
    camera.near = Math.max(0.01, dist / 100);
    camera.far = Math.max(1000, dist * 100);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [url, scene, camera, controls]);

  const numShadowStrength = Number(shadowStrength) || 0;
  const numShadowSoftness = Number(shadowSoftness) || 0;
  const numAutoRotateSpeed = Number(autoRotateSpeed) || 1.5;
  const numMaxZoom = Number(maxZoom) || 4.5;

  const baseDist = React.useMemo(() => {
    const fovRad = ((camera.fov || 50) * Math.PI) / 360;
    return (modelBounds.radius / Math.sin(fovRad)) * 1.3;
  }, [modelBounds.radius, camera.fov]);

  const minZoomDist = lockMaxZoom ? Math.max(0.1, baseDist / Math.max(1, numMaxZoom)) : 0.1;
  const maxZoomDist = lockMaxZoom ? Math.max(baseDist, baseDist * Math.max(1, numMaxZoom)) : 500;

  const shadowY = -modelBounds.height / 2 - 0.01;

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-10, -10, -10]} intensity={0.3} />

      <Center>
        <primitive object={scene} />
      </Center>

      {numShadowStrength > 0 && (
        <ContactShadows
          position={[0, shadowY, 0]}
          opacity={numShadowStrength / 100}
          blur={(numShadowSoftness / 100) * 3 + 0.2}
          far={modelBounds.radius * 4}
          resolution={1024}
          scale={modelBounds.radius * 6}
          color="#000000"
        />
      )}

      <OrbitControls 
        makeDefault 
        enableZoom={true} 
        enablePan={true} 
        autoRotate={autoRotate} 
        autoRotateSpeed={numAutoRotateSpeed} 
        minDistance={minZoomDist}
        maxDistance={maxZoomDist}
      />
    </>
  );
};

const GlbModelViewer = React.memo(({ 
  url, 
  autoRotate = true, 
  autoRotateSpeed = 1.5,
  shadowStrength = 35,
  shadowSoftness = 35,
  lockMaxZoom = true,
  maxZoom = 4.5
}) => {
  const [timestamp, setTimestamp] = useState('');

  React.useEffect(() => {
    const bc = new BroadcastChannel('threed_model_updates');
    bc.onmessage = (e) => {
      if (e.data && e.data.type === 'model-saved') {
        setTimestamp(`?v=${e.data.timestamp}`);
      }
    };
    return () => bc.close();
  }, []);

  const finalUrl = React.useMemo(() => {
    return timestamp ? `${url}${timestamp}` : url;
  }, [url, timestamp]);

  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 5] }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <React.Suspense fallback={null}>
        <ModelScene 
          url={finalUrl}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          shadowStrength={shadowStrength}
          shadowSoftness={shadowSoftness}
          lockMaxZoom={lockMaxZoom}
          maxZoom={maxZoom}
        />
      </React.Suspense>
    </Canvas>
  );
});

const Model3DPreviewModal = ({ 
  isOpen, 
  dataUrl, 
  shadowStrength = 35,
  shadowSoftness = 35,
  autoRotate = true, 
  autoRotateSpeed = 1.5, 
  lockMaxZoom = true,
  maxZoom = 4.5,
  bgType = 'Solid', 
  bgColor: initialBgColor = '#ffffff',
  customBg = true,
  enableAR = true,
  setBgColor: externalSetBgColor,
  qrText = 'Scan Me', qrColor = '#000000', qrBgType = 'Solid', qrBgColor = '#ffffff', qrLevel = 'M', qrDotType = 'square', qrCornerSquareType = 'square', qrCornerDotType = 'square', qrLogo,
  topText, bottomText: initialBottomText, vId
}) => {
  const [localBgColor, setLocalBgColor] = useState(initialBgColor);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bottomText, setBottomText] = useState(initialBottomText);

  React.useEffect(() => {
    setBottomText(initialBottomText);
  }, [initialBottomText]);

  React.useEffect(() => {
    if (isOpen && vId) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      axios.get(`${backendUrl}/api/3d-models/get-model/${vId}`)
        .then(res => {
           if (res.data && res.data.displayName) {
               setBottomText(res.data.displayName);
           } else if (res.data && res.data.name) {
               setBottomText(res.data.name);
           }
        })
        .catch(err => console.error("Failed to fetch latest 3D model name:", err));
    }
  }, [isOpen, vId]);

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
    if (!dataUrl && !vId) return qrText || "Scan Me";
    
    let resolvedVId = vId || null;
    if (!resolvedVId && typeof dataUrl === 'string' && dataUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(dataUrl);
        if (parsed.v_id) resolvedVId = parsed.v_id;
        if (parsed.vId) resolvedVId = parsed.vId;
      } catch (e) {}
    }

    if (resolvedVId) {
      return `${window.location.origin}/ar-view?id=${resolvedVId}`;
    }

    if (dataUrl && (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:'))) {
      return "AR View unavailable for local/unsaved models.";
    }

    const resolvedUrl = new URL(dataUrl, window.location.href).href;
    return `${window.location.origin}/ar-view?url=${encodeURIComponent(resolvedUrl)}`;
  }, [dataUrl, qrText, vId]);

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
            <GlbModelViewer 
              url={dataUrl} 
              autoRotate={autoRotate} 
              autoRotateSpeed={autoRotateSpeed} 
              shadowStrength={shadowStrength}
              shadowSoftness={shadowSoftness}
              lockMaxZoom={lockMaxZoom}
              maxZoom={maxZoom}
            />
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
