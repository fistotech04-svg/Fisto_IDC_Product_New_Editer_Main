import React, { useState, Suspense } from 'react';
import { X, Check, ZoomIn, ZoomOut, Edit3, Download, ChevronDown, Layers, Box, Info } from 'lucide-react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import RenderModel from "./ModelLoaders";

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

  const [orientation, setOrientation] = useState('Y axis up');
  const [isAxisOpen, setIsAxisOpen] = useState(false);
  const [includeTextures, setIncludeTextures] = useState(true);
  const [embedTextures, setEmbedTextures] = useState(true);
  const [exportSeparate, setExportSeparate] = useState(false);
  const [quality, setQuality] = useState('Medium');
  const [exportFormat, setExportFormat] = useState('OBJ');
  const [fileName, setFileName] = useState(modelName);
  const [zoomLevel, setZoomLevel] = useState(75);

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
          selectedMaterial: exportScope === 'selection' ? selectedMaterial : null 
      });
      onClose();
  };

  const effectiveHiddenMaterials = React.useMemo(() => {
    const baseHidden = new Set([...(hiddenMaterials || []), ...(deletedMaterials || [])]);
    
    if (exportScope === 'selection' && selectedMaterial) {
        const allMaterials = new Set();
        materialList.forEach(group => {
            if (group.materials) {
                group.materials.forEach(m => allMaterials.add(m));
            }
        });

        const selectedNames = new Set(
            selectedMaterial.isGroup 
                ? selectedMaterial.materials 
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[0.1vw] animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-[0.75vw] shadow-2xl w-[70vw] h-[40vw] flex flex-col overflow-hidden relative border border-gray-100">
        
        {/* Header */}
        <div className="px-[2vw] pt-[2vw] pb-[1vw] flex items-start justify-between bg-white w-full">
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
        <div className="flex flex-row px-[2vw] pb-[1vw] pt-[1vw] gap-[1.5vw] items-stretch bg-white flex-1 min-h-0">
            
            {/* Left Column (Conditional UI) */}
            {exportScope === 'selection' ? (
                /* Material Grid UI (Matches Image) */
                <div className="w-[45%] bg-[#f8f9fa] rounded-[1vw] p-[1.5vw] relative flex flex-col items-start justify-start border border-gray-100 overflow-hidden">
                    <div className="w-full h-full overflow-y-auto custom-scrollbar pr-[0.4vw]">
                        <div className="grid grid-cols-2 gap-x-[1.5vw] gap-y-[2vw]">
                            {(selectedMaterial.isGroup ? selectedMaterial.materials : [selectedMaterial.name]).map((name, idx) => (
                                <div key={idx} className="flex flex-col gap-[0.8vw]">
                                    <div className="aspect-square bg-white rounded-[0.5vw] shadow-sm flex items-center justify-center overflow-hidden border border-gray-200/50 p-[1vw]">
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-[0.3vw]">
                                             <Box size="3vw" className="text-gray-200" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-[0.2vw]">
                                        <span className="text-[0.8vw] font-bold text-gray-600 truncate max-w-[80%]">{name}.{exportFormat.toLowerCase()}</span>
                                        <Edit3 size="0.9vw" className="text-gray-400 cursor-pointer hover:text-gray-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            ) : (
                /* Original Full View UI (Canvas) */
                <div className="w-[45%] flex flex-col">
                    <div className="bg-gray-500 flex-1 rounded-[1vw] flex items-center justify-center relative overflow-hidden group border border-gray-100 min-h-[22vw]">
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
                                     <Canvas>
                                         <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={45} zoom={zoomLevel / 50} />
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
                                     </Canvas>
                                 </Suspense>
                             </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f2f2] z-10 gap-[1vw]">
                                <div className="w-[2vw] h-[2vw] border-[0.25vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-[0.85vw] font-medium text-gray-400">Loading 3D Model...</p>
                            </div>
                        )}
                        <div className="absolute bottom-[1vw] right-[1vw] bg-white/90 backdrop-blur-md rounded-[0.4vw] shadow-sm z-20 border border-gray-200 flex items-center overflow-hidden">
                            <button onClick={handleZoomOut} disabled={zoomLevel <= 25} className="px-[0.6vw] py-[0.4vw] hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"><ZoomOut size="0.9vw" /></button>
                            <div className="px-[0.4vw] py-[0.4vw] text-[0.75vw] font-bold text-gray-700 min-w-[2.5vw] text-center border-x border-gray-100 flex items-center justify-center">{zoomLevel}%</div>
                            <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="px-[0.6vw] py-[0.4vw] hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"><ZoomIn size="0.9vw" /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Column (Settings) */}
            <div className="w-[55%] bg-gray-100 rounded-[1vw] p-[1.5vw] flex flex-col gap-[1.5vw] border border-gray-100/80 overflow-y-auto h-full max-h-full custom-scrollbar">
                

                
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
                </div>

                {/* Texture Inclusion */}
                <div>
                    <div className="flex items-center gap-[1vw] mb-[1vw]">
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
                <div>
                    <div className="flex items-center gap-[1vw] mb-[0.5vw]">
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
        </div>

        {/* Footer Area */}
        <div className="px-[2vw] pb-[2vw] pt-[1vw] flex items-center justify-between shrink-0 bg-white">
            {exportScope === 'selection' ? (
                /* Enhanced Footer for Selection Mode (Matches Image) */
                <div className="flex flex-col gap-[0.5vw] w-[45%]">
                    <span className="text-[0.85vw] font-bold text-gray-800 ml-[0.2vw]">Folder Name</span>
                    <div className="flex items-center gap-[1vw]">
                        <div className="flex-1 bg-white border border-gray-200 rounded-[0.5vw] flex items-center px-[0.8vw] py-[0.6vw] focus-within:border-gray-400 shadow-sm">
                            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full outline-none text-[0.85vw] text-gray-700 font-bold bg-transparent" />
                            <Edit3 size="1vw" className="text-gray-400 shrink-0 ml-[0.5vw]" />
                        </div>
                        <div className="bg-[#f8f9fa] border border-gray-100 px-[1vw] py-[0.6vw] rounded-[0.5vw] text-[0.85vw] font-bold text-gray-500 whitespace-nowrap shadow-sm border-l-[0.2vw] border-l-gray-200">
                            Model Size : {modelSize}
                        </div>
                    </div>
                </div>
            ) : (
                /* Original Footer for Full Mode */
                <div className="flex items-center gap-[1vw] w-[45%]">
                    <div className="flex-1 bg-white border border-gray-300 rounded-[0.5vw] flex items-center px-[0.8vw] py-[0.6vw] focus-within:border-gray-500 transition-all shadow-sm">
                        <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full outline-none text-[0.85vw] text-gray-800 font-semibold bg-transparent" />
                        <span className="text-gray-400 text-[0.85vw] font-medium mr-[0.5vw]">.{exportFormat.toLowerCase()}</span>
                        <Edit3 size="1vw" className="text-gray-400 shrink-0" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 px-[1.2vw] py-[0.6vw] rounded-[0.5vw] text-[0.85vw] font-semibold text-gray-500 whitespace-nowrap shadow-sm">
                        Size: {modelSize}
                    </div>
                </div>
            )}

            {/* Right: Buttons */}
            <div className="flex items-center gap-[1vw]">
                {exportScope === 'selection' ? (
                    <>
                        <button onClick={onClose} className="flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.7vw] bg-white border border-gray-300 hover:border-black text-gray-700 font-bold text-[0.85vw] rounded-[0.6vw] hover:bg-gray-50 transition-all shadow-sm min-w-[8vw] justify-center">
                            <X size="1.1vw" />
                            Cancel
                        </button>
                        <button onClick={handleExportClick} className="flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.7vw] bg-black text-white font-bold text-[0.85vw] rounded-[0.6vw] hover:bg-zinc-800 transition-all shadow-lg border border-black min-w-[12vw] justify-center">
                            <Download size="1.1vw" />
                            Export as {exportFormat}
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onClose} className="flex items-center cursor-pointer gap-[0.4vw] px-[1.5vw] py-[0.65vw] bg-white border border-black hover:border-red-500 text-gray-800 font-semibold text-[0.85vw] rounded-[0.5vw] hover:bg-gray-50 hover:text-red-500 transition-colors shadow-sm">
                            <X size="1.2vw" />
                            Cancel
                        </button>
                        <button onClick={handleExportClick} className="flex items-center cursor-pointer gap-[0.5vw] px-[1.5vw] py-[0.65vw] bg-black text-white font-semibold text-[0.85vw] rounded-[0.5vw] hover:bg-zinc-800 transition-colors shadow-md border border-black">
                            <Download size="1.1vw" />
                            Export as {exportFormat}
                        </button>
                    </>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
