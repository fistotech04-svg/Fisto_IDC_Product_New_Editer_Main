import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MaterialList from "./MaterialList";

const TopToolbar = ({ 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    isTextureOpen, 
    onReset, 
    targetPosition, 
    materialList, 
    selectedMaterial, 
    hiddenMaterials,
    onSelectMaterial, 
    onToggleVisibility,
    onDeleteMaterial,
    onDeleteModel,
    modelName, 
    onRename,
    onRenameMaterial,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState("");

    const startEditing = () => {
        setTempName(modelName || "");
        setIsEditingName(true);
    };

    const stopEditing = () => {
        if (isEditingName && tempName !== modelName) {
            if (onRename) onRename(tempName);
        }
        setIsEditingName(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            stopEditing();
        }
    };

    return (
        <div className="absolute inset-x-0 left-[1.04vw] z-30 pointer-events-none">
            {/* Left Section: Materials + Undo/Redo */}
            <div className="absolute top-[1.04vw] left-0 flex items-start gap-[0.62vw] pointer-events-auto transition-none">
                <MaterialList 
                    isCollapsed={isSidebarCollapsed} 
                    setIsCollapsed={setIsSidebarCollapsed} 
                    isTextureOpen={isTextureOpen}
                    materials={materialList}
                    selectedMaterial={selectedMaterial}
                    hiddenMaterials={hiddenMaterials}
                    onSelect={onSelectMaterial}
                    onToggleVisibility={onToggleVisibility}
                    onDeleteMaterial={onDeleteMaterial}
                    onDeleteModel={onDeleteModel}
                    onRenameMaterial={onRenameMaterial}
                    modelName={modelName}
                    models={materialList} // Actually TopToolbar passes 'materialList' as 'materials' to list, but it's a bit mixed up. Wait.
                />
                
                <div className="flex items-center bg-white h-[2.5vw] px-[0.4vw] rounded-[0.62vw] border border-gray-200 gap-[0.21vw] shadow-sm">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className={`w-[2.2vw] h-[2vw] flex items-center justify-center rounded-[0.42vw] hover:bg-gray-50 transition-all text-gray-700 ${!canUndo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Icon icon="lucide:undo-dot" width="1.1vw" height="1.1vw" />
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        className={`w-[2.2vw] h-[2vw] flex items-center justify-center rounded-[0.42vw] hover:bg-gray-50 transition-all text-gray-700 ${!canRedo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Icon icon="lucide:redo-dot" width="1.1vw" height="1.1vw" />
                    </button>
                </div>
            </div>

            {/* Center: Model Name Section (Individual Item) */}
            <div className="absolute top-[1.04vw] left-1/2 -translate-x-1/2 pointer-events-auto">
                <div 
                    onClick={!isEditingName ? startEditing : undefined}
                    className={`flex items-center bg-white h-[2.5vw] px-[1.2vw] gap-[0.6vw] rounded-[0.62vw] ${!isEditingName ? "cursor-pointer hover:bg-gray-50 group border border-transparent hover:border-gray-200" : "border border-blue-500 ring-[0.1vw] ring-blue-100"} transition-all`}
                >
                    {isEditingName ? (
                        <input 
                            autoFocus
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={stopEditing}
                            onKeyDown={handleKeyDown}
                            className="text-[0.85vw] font-semibold text-gray-800 tracking-tight outline-none bg-transparent w-[10.42vw] text-center"
                        />
                    ) : (
                        <>
                            <span className="text-[0.85vw] font-semibold text-gray-600 tracking-tight">{modelName || "Untitled Model"}</span>
                            <Icon icon="heroicons:pencil-square" width="0.95vw" height="0.95vw" className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </>
                    )}
                </div>
            </div>

            {/* Right: Coordinates & Reset Section (Individual Box) */}
            <div className="absolute top-[1.04vw] right-[1.04vw] flex items-center gap-[0.62vw] pointer-events-auto">
                <div className="bg-white h-[2.5vw] px-[1.2vw] rounded-[0.62vw] border border-gray-200 flex items-center gap-[1.2vw] shadow-sm">
                    <div className="text-[0.7vw] font-semibold flex items-baseline gap-[0.42vw]">
                        <span className="text-gray-400 uppercase tracking-widest text-[0.55vw]">X</span>
                        <span className="text-gray-700 min-w-[1.2vw] text-left">{targetPosition?.x ?? 0}</span>
                    </div>
                    <div className="text-[0.7vw] font-semibold flex items-baseline gap-[0.42vw]">
                        <span className="text-gray-400 uppercase tracking-widest text-[0.55vw]">Y</span>
                        <span className="text-gray-700 min-w-[1.2vw] text-left">{targetPosition?.y ?? 0}</span>
                    </div>
                    <div className="text-[0.7vw] font-semibold flex items-baseline gap-[0.42vw]">
                        <span className="text-gray-400 uppercase tracking-widest text-[0.55vw]">Z</span>
                        <span className="text-gray-700 min-w-[1.2vw] text-left">{targetPosition?.z ?? 0}</span>
                    </div>
                    
                    <div className="h-[1.2vw] w-px bg-gray-200 ml-[-0.2vw]"></div>

                    <button 
                        onClick={onReset}
                        className="text-[0.75vw] font-semibold text-blue-600 hover:text-blue-700 transition-all uppercase tracking-wide flex items-center h-full pt-[0.1vw]"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopToolbar;
