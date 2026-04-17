import React, { useState, Suspense, useRef, useMemo, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Edit3, Download, ChevronDown, Layers, Box, Info } from 'lucide-react';
import { Canvas } from "@react-three/fiber";
import { View, OrbitControls, Environment, PerspectiveCamera, ContactShadows, Html, Center } from "@react-three/drei";
import RenderModel from "./ModelLoaders";
import { GlobalLoader } from "./GlobalLoader";
const ModelThumbnail = React.memo(({ 
    materialName, 
    models, 
    materialSettings, 
    selectedTexture, 
    materialList, 
    containerRef 
}) => {
    const viewRef = useRef();
    
    // Calculate hidden materials for this specific thumbnail
    const thumbnailHiddenMaterials = useMemo(() => {
        const allMaterials = new Set();
        const list = Array.isArray(materialList) ? materialList : [];
        list.forEach(item => {
            if (typeof item === 'string') {
                allMaterials.add(item);
            } else if (item && item.materials) {
                item.materials.forEach(m => allMaterials.add(m));
            }
        });

        const selectionHidden = new Set();
        allMaterials.forEach(m => {
            if (m !== materialName) {
                selectionHidden.add(m);
            }
        });
        
        return selectionHidden;
    }, [materialName, materialList]);

    return (
      <div ref={viewRef} className="w-full h-full relative group bg-gray-500 flex items-center justify-center overflow-hidden rounded-[0.3vw] shadow-inner">
          <View track={viewRef} className="w-full h-full">
              <Suspense fallback={
                  <Html center>
                      <div className="flex flex-col items-center gap-[0.5vw]">
                          <div className="w-[1.2vw] h-[1.2vw] border-[0.15vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                  </Html>
              }>
                  <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={35} />
                  <ambientLight intensity={1.5} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} />
                  <directionalLight position={[-5, 5, 5]} intensity={1} />
                  
                  <group position={[0, 0, 0]}>
                      {models.map((model) => (
                          <RenderModel
                              key={model.id}
                              type={model.type}
                              url={model.url}
                              isSelectionDisabled={true}
                              shouldClone={true}
                              materialSettings={materialSettings}
                              hiddenMaterials={thumbnailHiddenMaterials}
                              selectedTexture={selectedTexture}
                          />
                      ))}
                  </group>
                  
                  <Environment preset="city" />
              </Suspense>
          </View>
      </div>
    );
});

export default function Export3DModal({ 
  onClose, 
  onExport, 
  modelName = "Model Name", 
  modelSize = "80MB", 
  models = [],
  materialSettings = {},
  transformValues = {},
  hiddenMaterials = new Set(),
  deletedMaterials = new Set(),
  selectedTexture = null,
  selectedMaterial = null,
  materialList = []
}) {
  const [exportScope, setExportScope] = useState(
    selectedMaterial && 
    (selectedMaterial.isGroup || (selectedMaterial.name !== modelName && selectedMaterial.name !== "Scene" && selectedMaterial.name !== "Multiple Selection"))
      ? 'selection' 
      : 'full'
  );

  const containerRef = useRef();

  const [orientation, setOrientation] = useState('Y axis up');
  const [isAxisOpen, setIsAxisOpen] = useState(false);
  const [includeTextures, setIncludeTextures] = useState(true);
  const [embedTextures, setEmbedTextures] = useState(true);
  const [exportSeparate, setExportSeparate] = useState(false);
  const [quality, setQuality] = useState('Medium');
  const [exportFormat, setExportFormat] = useState('OBJ');
  const [fileName, setFileName] = useState(modelName);
  const [zoomLevel, setZoomLevel] = useState(50);
  const [customMaterialNames, setCustomMaterialNames] = useState({});
  const [editingMaterial, setEditingMaterial] = useState(null);
  const settingsContainerRef = useRef(null);
  const mainViewRef = useRef(null);
  const modalRef = useRef(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [showLeftTopShadow, setShowLeftTopShadow] = useState(false);
  const [showLeftBottomShadow, setShowLeftBottomShadow] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const handleScroll = (ref, setTop, setBottom) => {
      if (!ref.current) return;
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      setTop(scrollTop > 10);
      setBottom(scrollHeight > scrollTop + clientHeight + 10);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(25, prev - 25));

  const handleExportClick = () => {
      onExport?.({ 
          orientation, 
          includeTextures, 
          embedTextures, 
          exportSeparate, 
          quality, 
          exportFormat, 
          fileName,
          exportScope,
          selectedMaterial: exportScope === 'selection' ? selectedMaterial : null,
          customMaterialNames: exportScope === 'selection' ? customMaterialNames : null
      });
      onClose();
  };

  const effectiveHiddenMaterials = React.useMemo(() => {
    const baseHidden = new Set([...(hiddenMaterials || []), ...(deletedMaterials || [])]);
    
    if (exportScope === 'selection' && selectedMaterial) {
        const allMaterials = new Set();
        (materialList || []).forEach(item => {
            if (typeof item === 'string') {
                allMaterials.add(item);
            } else if (item && item.materials) {
                (item.materials || []).forEach(m => allMaterials.add(m));
            }
        });

        const selectedNames = new Set(
            selectedMaterial.isGroup 
                ? (selectedMaterial.materials || []) 
                : [selectedMaterial.name]
        );

        const selectionHidden = new Set();
        allMaterials.forEach(m => {
            if (!selectedNames.has(m)) {
                selectionHidden.add(m);
            }
        });
        
        return new Set([...baseHidden, ...selectionHidden]);
    }
    
    return baseHidden;
  }, [exportScope, selectedMaterial, hiddenMaterials, deletedMaterials, materialList]);
  
  useEffect(() => {
    // Check shadows and initialization delay
    const timer = setTimeout(() => {
        handleScroll(containerRef, setShowLeftTopShadow, setShowLeftBottomShadow);
        handleScroll(settingsContainerRef, setShowTopShadow, setShowBottomShadow);
        setIsInitializing(false);
    }, 1200);

    return () => {
        clearTimeout(timer);
    };
  }, [selectedMaterial, exportScope]);

  return (
    <div ref={modalRef} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[0.1vw] animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-[0.75vw] shadow-2xl w-[70vw] h-[42vw] flex flex-col overflow-hidden relative border border-gray-100">
        
        {/* Global Loading Overlay */}
        <GlobalLoader manualLoading={isInitializing} text="Preparing 3D Export ..." />

        {/* Header - Masking Layer */}
        <div className="px-[2vw] pt-[2vw] pb-[2vw] flex items-start justify-between bg-white w-full relative z-[30]">
            <div className="flex flex-col flex-1 pr-[2vw]">
                <div className="flex items-center gap-[1vw]">
                    <h2 className="text-[1.35vw] font-bold text-gray-900 tracking-tight">Export 3D Model</h2>
                    <div className="h-[0.1vw] bg-gray-200 flex-1 ml-[1vw] mt-[0.3vw]"></div>
                </div>
                <p className="text-[0.75vw] text-gray-400 mt-[0.3vw] font-medium">
                    <span className="text-red-500 font-bold">*</span>You can Save / Share the 3D Models Image in various Methods
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="p-[0.4vw] border cursor-pointer border-red-200 text-red-500 rounded-[0.4vw] hover:bg-red-50 transition-colors shrink-0 mt-[-0.2vw]"
                title="Close"
            >
                <X size="1.2vw" />
            </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-row px-[2vw] pb-0 pt-0 gap-[1.5vw] items-stretch bg-white flex-1 min-h-0 relative z-[10]">
            
            {/* Left Column (Conditional UI) */}
            {exportScope === 'selection' ? (
                /* Material Grid UI */
                <div className="w-[calc(44.5%-0.75vw)] bg-[#f8f9fa] rounded-[1vw] relative flex flex-col border border-gray-100 overflow-hidden h-full isolate">
                    {/* Top Opaque Mask - Ensures models clip before the header starts */}
                    <div className="absolute -top-[1vw] left-0 right-0 h-[1vw] bg-white z-[29]" />
                    
                    {/* Bottom Opaque Mask - Ensures models clip before the footer starts */}
                    <div className="absolute -bottom-[1vw] left-0 right-0 h-[1vw] bg-white z-[29]" />

                    {/* Top Shadow Indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-[3vw] bg-gradient-to-b from-black/10 to-transparent z-[25] pointer-events-none transition-opacity duration-300 ${showLeftTopShadow ? 'opacity-100' : 'opacity-0'}`} />
                                        
                    <div 
                        ref={containerRef} 
                        onScroll={() => handleScroll(containerRef, setShowLeftTopShadow, setShowLeftBottomShadow)}
                        className="w-full h-full overflow-y-auto custom-scrollbar p-[1.2vw] pr-[0.8vw]"
                    >
                        <div className="grid grid-cols-2 gap-x-[1.2vw] gap-y-[1.5vw]">
                            {(selectedMaterial?.isGroup ? (selectedMaterial.materials || []) : [selectedMaterial?.name || "Material"]).map((name, idx) => (
                                <div key={idx} className="flex flex-col gap-[0.6vw]">
                                    <div className="aspect-square bg-white rounded-[0.6vw] shadow-sm flex items-center justify-center overflow-hidden border border-gray-200/50 relative">
                                         <ModelThumbnail 
                                            materialName={name} 
                                            models={models}
                                            materialSettings={materialSettings}
                                            selectedTexture={selectedTexture}
                                            materialList={materialList}
                                            containerRef={containerRef}
                                         />
                                         {/* Local Item Border Overlay - Ensures model is clipped by rounded corners */}
                                         <div className="absolute inset-0 border border-gray-200/50 rounded-[0.6vw] pointer-events-none z-[16]" />
                                    </div>
                                    <div className="flex items-center justify-between px-[0.2vw] gap-[0.5vw]">
                                        {editingMaterial === name ? (
                                            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-[0.3vw] px-[0.4vw]">
                                                <input 
                                                    autoFocus
                                                    value={customMaterialNames[name] !== undefined ? customMaterialNames[name] : name}
                                                    onChange={(e) => setCustomMaterialNames(prev => ({ ...prev, [name]: e.target.value }))}
                                                    onBlur={() => setEditingMaterial(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingMaterial(null)}
                                                    className="w-full outline-none text-[0.8vw] font-bold text-gray-800 py-[0.2vw]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center min-w-0 flex-1">
                                                <span className="text-[0.8vw] font-bold text-gray-500 truncate">
                                                    {customMaterialNames[name] || name}
                                                </span>
                                                <span className="text-gray-400 font-medium text-[0.8vw] shrink-0">
                                                    &nbsp;.{exportFormat.toLowerCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingMaterial(editingMaterial === name ? null : name);
                                            }}
                                            className="p-[0.3vw] hover:bg-gray-100 rounded-[0.3vw] transition-colors cursor-pointer shrink-0"
                                        >
                                            <Edit3 size="0.9vw" className={`${editingMaterial === name ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Shadow Indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 h-[3vw] bg-gradient-to-t from-black/10 to-transparent z-[25] pointer-events-none transition-opacity duration-300 ${showLeftBottomShadow ? 'opacity-100' : 'opacity-0'}`} />
                </div>
            ) : (
                /* Original Full View UI (Canvas) */
                <div className="w-[calc(44.5%-0.75vw)] bg-[#f8f9fa] rounded-[1vw] p-[1.2vw] relative flex flex-col border border-gray-100 overflow-hidden h-full">
                    <div ref={mainViewRef} className="bg-gray-500 flex-1 rounded-[0.8vw] flex items-center justify-center relative overflow-hidden group border border-gray-100/50 h-full">
                        {models.length > 0 ? (
                             <div 
                                 className="w-full h-full cursor-grab active:cursor-grabbing"
                                 onWheel={(e) => {
                                     e.stopPropagation();
                                     setZoomLevel(prev => {
                                         const newVal = prev - (e.deltaY * 0.05);
                                         return Math.max(25, Math.min(200, Math.round(newVal)));
                                     });
                                 }}
                             >
                                 <Suspense fallback={
                                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f2f2] z-10 gap-[1vw]">
                                         <div className="w-[2vw] h-[2vw] border-[0.25vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                         <p className="text-[0.85vw] font-medium text-gray-400">Loading 3D Model...</p>
                                     </div>
                                 }>
                                     <View track={mainViewRef} className="w-full h-full">
                                         <PerspectiveCamera makeDefault position={[0, 0.8, 4.5]} fov={40} zoom={zoomLevel / 45} />
                                         <ambientLight intensity={1.5} />
                                         <pointLight position={[10, 10, 10]} intensity={1.5} />
                                         <directionalLight position={[-5, 5, 5]} intensity={1} />
                                         <group position={[0, -0.6, 0]}>
                                             {models.map((model) => (
                                                 <RenderModel
                                                     key={model.id}
                                                     type={model.type}
                                                     url={model.url}
                                                     isSelectionDisabled={true}
                                                     shouldClone={true}
                                                     transformValues={transformValues}
                                                     materialSettings={materialSettings}
                                                     hiddenMaterials={effectiveHiddenMaterials}
                                                     selectedTexture={selectedTexture}
                                                 />
                                             ))}
                                         </group>
                                         <Environment preset="city" />
                                         <OrbitControls 
                                             enableZoom={false} 
                                             enablePan={false}
                                             autoRotate={false}
                                             maxPolarAngle={Math.PI / 2}
                                             makeDefault
                                         />
                                     </View>
                                 </Suspense>
                             </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f2f2] z-10 gap-[1vw]">
                                <div className="w-[2vw] h-[2vw] border-[0.25vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-[0.85vw] font-medium text-gray-400">Loading 3D Model...</p>
                            </div>
                        )}
                        <div className="absolute bottom-[0.8vw] right-[0.8vw] bg-white/90 backdrop-blur-md rounded-[0.4vw] shadow-sm z-20 border border-gray-200 flex items-center overflow-hidden">
                            <button onClick={handleZoomOut} disabled={zoomLevel <= 25} className="px-[0.6vw] py-[0.4vw] hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"><ZoomOut size="0.9vw" /></button>
                            <div className="px-[0.4vw] py-[0.4vw] text-[0.75vw] font-bold text-gray-700 min-w-[2.5vw] text-center border-x border-gray-100 flex items-center justify-center">{zoomLevel}%</div>
                            <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="px-[0.6vw] py-[0.4vw] hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"><ZoomIn size="0.9vw" /></button>
                        </div>
                    </div>
                </div>
            )}


            {/* Right Column (Settings) - Masking Layer */}
            <div className="w-[calc(55.5%-0.75vw)] relative flex flex-col h-full bg-gray-100 rounded-[1vw] border border-gray-100/80 overflow-hidden z-[30]">
                {/* Top Shadow Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-[2vw] bg-gradient-to-b from-black/10 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} />
                
                <div 
                    ref={settingsContainerRef}
                    onScroll={() => handleScroll(settingsContainerRef, setShowTopShadow, setShowBottomShadow)}
                    className="w-full h-full overflow-y-auto custom-scrollbar p-[1.5vw] flex flex-col gap-[1.5vw]"
                >
                    {/* Axis / Orientation */}
                    <div>
                        <div className="flex items-center gap-[1vw] mb-[0.5vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Axis / Orientation</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[0.75vw] text-gray-500 w-[60%] leading-relaxed font-medium">Choose the correct axis orientation for compatibility with your 3D software</p>
                            <div className="flex items-center gap-[0.5vw]">
                                <span className="text-gray-400 text-[0.8vw] font-bold">:</span>
                                <div className="relative">
                                    <div 
                                        onClick={() => setIsAxisOpen(!isAxisOpen)}
                                        className="bg-white border border-gray-200 text-gray-700 text-[0.85vw] font-medium rounded-[0.5vw] px-[0.8vw] py-[0.5vw] shadow-sm cursor-pointer flex items-center justify-between min-w-[7vw] hover:bg-gray-50 transition-colors select-none"
                                    >
                                        <span>{orientation}</span>
                                        <ChevronDown size="1.1vw" className={`text-gray-500 ml-[0.5vw] transition-transform duration-200 ${isAxisOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    {isAxisOpen && (
                                        <>
                                            {/* Click outside overlay */}
                                            <div className="fixed inset-0 z-[1001]" onClick={() => setIsAxisOpen(false)} />
                                            
                                            {/* Dropdown Menu */}
                                            <div className="absolute top-[calc(100%+0.3vw)] left-0 w-full min-w-[100%] bg-white border border-gray-200 rounded-[0.5vw] shadow-lg overflow-hidden z-[1002] animate-in fade-in slide-in-from-top-1 duration-150 py-[0.2vw]">
                                                {['Y axis up', 'Z axis up'].map(opt => (
                                                    <div
                                                        key={opt}
                                                        onClick={() => {
                                                            setOrientation(opt);
                                                            setIsAxisOpen(false);
                                                        }}
                                                        className={`w-full text-left px-[0.8vw] py-[0.5vw] text-[0.85vw] transition-all cursor-pointer ${
                                                            orientation === opt 
                                                                ? 'bg-gray-100/80 font-bold text-gray-900' 
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                        </div>
                    </div>

                    {/* Texture Inclusion */}
                    <div>
                        <div className="flex items-center gap-[1vw] mt-[1vw] mb-[1vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Texture Inclusion</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <div className="flex flex-col gap-[0.8vw]">
                            <label className="flex items-center gap-[0.6vw] cursor-pointer group w-fit">
                                 <div className="relative flex items-center justify-center">
                                      <input 
                                        type="checkbox"
                                        checked={includeTextures}
                                        onChange={(e) => setIncludeTextures(e.target.checked)}
                                        className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[0.1vw] border-gray-300 rounded-[0.2vw] checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all bg-white shadow-sm hover:border-gray-400"
                                      />
                                      <Check className="w-[0.8vw] h-[0.8vw] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3.5} />
                                 </div>
                                 <span className="text-gray-700 font-medium text-[0.85vw]">Include textures</span>
                            </label>
                            <label className="flex items-center gap-[0.6vw] cursor-pointer group w-fit">
                                 <div className="relative flex items-center justify-center">
                                      <input 
                                        type="checkbox"
                                        checked={embedTextures}
                                        onChange={(e) => setEmbedTextures(e.target.checked)}
                                        className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[0.1vw] border-gray-300 rounded-[0.2vw] checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all bg-white shadow-sm hover:border-gray-400"
                                      />
                                      <Check className="w-[0.8vw] h-[0.8vw] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3.5} />
                                 </div>
                                 <span className="text-gray-700 font-medium text-[0.85vw]">Embed textures in file</span>
                            </label>
                            <label className="flex items-center gap-[0.6vw] cursor-pointer group w-fit">
                                 <div className="relative flex items-center justify-center">
                                      <input 
                                        type="checkbox"
                                        checked={exportSeparate}
                                        onChange={(e) => setExportSeparate(e.target.checked)}
                                        className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[0.1vw] border-gray-300 rounded-[0.2vw] checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all bg-white shadow-sm hover:border-gray-400"
                                      />
                                      <Check className="w-[0.8vw] h-[0.8vw] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3.5} />
                                 </div>
                                 <span className="text-gray-700 font-medium text-[0.85vw]">Export textures as separate files</span>
                            </label>
                        </div>
                    </div>

                    {/* Texture Quality / Resolution */}
                    <div className="pb-[1vw]">
                        <div className="flex items-center gap-[1vw] mt-[1vw] mb-[0.5vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Texture Quality / Resolution</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <p className="text-[0.75vw] text-gray-500 mb-[1vw] font-medium">Higher quality gives better visual detail but increases file size.</p>
                        <div className="flex items-center gap-[0.8vw]">
                            {[
                                { name: 'Low', px: '720px' },
                                { name: 'Medium', px: '1024px' },
                                { name: 'High', px: '2048px' },
                                { name: 'Original', px: '' }
                            ].map(q => (
                                <button 
                                    key={q.name}
                                onClick={() => setQuality(q.name)}
                                className={`flex-1 flex flex-col items-center justify-center py-[0.6vw] rounded-[0.5vw] border-[0.1vw] transition-all ${
                                    quality === q.name 
                                        ? 'bg-black text-white border-black font-semibold shadow-md' 
                                        : 'bg-white cursor-pointer text-gray-500 border-gray-200 hover:border-gray-300 font-medium hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-[0.85vw]">{q.name}</span>
                                {q.px && <span className={`text-[0.6vw] ${quality === q.name ? 'text-gray-300' : 'text-gray-400 font-semibold'}`}>({q.px})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Export Format */}
                <div className="mb-[1vw]">
                    <div className="flex items-center gap-[1vw] mb-[0.5vw]">
                        <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Export Format</h3>
                        <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                    </div>
                    <p className="text-[0.75vw] text-gray-500 mb-[1vw] font-medium">Choose the format that fits your workflow and target platform.</p>
                    <div className="flex items-center gap-[0.8vw]">
                        {['GLB', 'OBJ', 'FBX'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setExportFormat(f)}
                                className={`flex-1 flex flex-col items-center justify-center py-[0.6vw] rounded-[0.5vw] border-[0.1vw] transition-all cursor-pointer ${
                                    exportFormat === f 
                                        ? 'bg-black text-white border-black font-semibold shadow-md' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 font-medium hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-[0.85vw]">{f}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom Shadow Indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2vw] bg-gradient-to-t from-black/10 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} />
        </div>


        </div>
    </div>

    {/* Footer Area - Masking Layer */}
        <div className="px-[2vw] pb-[2vw] pt-[2vw] flex items-end justify-between shrink-0 bg-white relative z-[30]">
            {/* Unified Filename and Size Info */}
            <div className="flex flex-col gap-[0.5vw] w-[45%]">
                {exportScope === 'selection' && (
                    <span className="text-[0.85vw] font-semibold text-gray-800 ml-[0.2vw] -mb-[0.2vw]">Folder Name</span>
                )}
                <div className="flex items-center gap-[1vw]">
                    <div className="flex-1 bg-white border border-gray-200 rounded-[0.5vw] flex items-center px-[0.8vw] py-[0.6vw] focus-within:border-gray-400 transition-all shadow-sm">
                        <input 
                            type="text" 
                            value={fileName} 
                            onChange={(e) => setFileName(e.target.value)} 
                            className="w-full outline-none text-[0.85vw] text-gray-800 font-semibold bg-transparent" 
                            placeholder={exportScope === 'selection' ? "Folder Name" : "File Name"}
                        />
                        {exportScope !== 'selection' && (
                            <span className="text-gray-400 text-[0.85vw] font-medium mr-[0.5vw]">.{exportFormat.toLowerCase()}</span>
                        )}
                        <Edit3 size="1vw" className="text-gray-400 shrink-0" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 px-[1.2vw] py-[0.6vw] rounded-[0.5vw] text-[0.85vw] font-bold text-gray-500 whitespace-nowrap shadow-sm border-l-[0.2vw] border-l-gray-200">
                        {exportScope === 'selection' ? 'Model Size' : 'Size'}: {modelSize}
                    </div>
                </div>
            </div>

            {/* Right: Buttons */}
            <div className="flex items-center gap-[1vw]">
                <button 
                    onClick={onClose} 
                    className="flex items-center cursor-pointer gap-[0.4vw] px-[1.5vw] py-[0.65vw] bg-white border border-black hover:border-red-500 text-gray-800 font-semibold text-[0.85vw] rounded-[0.5vw] hover:bg-gray-50 hover:text-red-500 transition-colors shadow-sm"
                >
                    <X size="1.2vw" />
                    Cancel
                </button>
                <button 
                    onClick={handleExportClick} 
                    className="flex items-center cursor-pointer gap-[0.5vw] px-[1.5vw] py-[0.65vw] bg-black text-white font-semibold text-[0.85vw] rounded-[0.5vw] hover:bg-zinc-800 transition-colors shadow-md border border-black"
                >
                    <Download size="1.1vw" />
                    Export as {exportFormat}
                </button>
            </div>
        </div>

        {/* Global Unified Canvas for View.Port tracking - Optimized with masking strategy */}
        <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden rounded-[0.75vw]">
            <Canvas 
                eventSource={modalRef}
                shadows
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <View.Port />
            </Canvas>
        </div>
      </div>
    </div>
  );
}
