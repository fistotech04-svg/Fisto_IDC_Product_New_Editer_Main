import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

// --- Sub-Components for Cleanliness ---

const MaterialItem = ({ text, selected, onClick, isVisible = true, onToggleVisibility, onDelete, onRename }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(text);
    const btnRef = React.useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleMenuClick = (e) => {
        e.stopPropagation();
        if (!isMenuOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.top + rect.height / 2,
                left: rect.right + 25
            });
        }
        setIsMenuOpen(!isMenuOpen);
    };

    React.useEffect(() => {
        if (!isMenuOpen) return;
        const handleScroll = () => setIsMenuOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isMenuOpen]);

    const handleRenameSubmit = () => {
        if (tempName.trim() !== "" && tempName !== text) {
            onRename && onRename(text, tempName);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            handleRenameSubmit();
        }
        if (e.key === 'Escape') {
            e.stopPropagation();
            setTempName(text);
            setIsEditing(false);
        }
    };

    return (
        <div
            onClick={onClick}
            data-mat-name={text}
            className={`group relative flex items-center justify-between py-[0.31vw] px-[0.62vw] text-[0.7vw] font-semibold rounded-[0.42vw] cursor-pointer transition-all
                ${selected
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
        >
            {isEditing ? (
                <input 
                    autoFocus
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none border-none p-0 text-[0.7vw] min-w-0 text-inherit font-semibold"
                />
            ) : (
                <span className="truncate flex-1 pr-[0.5vw] min-w-0">{text}</span>
            )}
            
            {/* Action Buttons */}
            <div className={`flex items-center gap-[0.2vw] ${(selected || !isVisible) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility && onToggleVisibility(text); }}
                    className={`p-[0.2vw] rounded-[0.2vw] transition-colors ${selected ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-700'}`}
                    title={isVisible ? "Hide material" : "Show material"}
                >
                    <Icon icon={isVisible ? "ph:eye-bold" : "ph:eye-closed-bold"} width="0.8vw" height="0.8vw" />
                </button>
                
                <div className="relative">
                    <button 
                        ref={btnRef}
                        onClick={handleMenuClick}
                        className={`p-[0.2vw] rounded-[0.2vw] transition-colors ${selected ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-700'}`}
                    >
                        <Icon icon="ph:dots-three-bold" width="0.8vw" height="0.8vw" />
                    </button>

                    {isMenuOpen && typeof document !== 'undefined' && createPortal(
                        <>
                            <div className="fixed inset-0 z-[990]" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}></div>
                            <div 
                                style={{ top: menuPos.top, left: menuPos.left, transform: 'translateY(-50%)' }}
                                className="fixed z-[99999] bg-white rounded-[0.85vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-[0.11vw] border-gray-400 py-[0.5vw] px-[0.3vw] min-w-[10vw] animate-in fade-in zoom-in duration-200"
                            >
                                <div className="flex flex-col gap-[0.1vw]">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setIsEditing(true); }}
                                            className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-gray-100 cursor-pointer rounded-[0.6vw] text-gray-700 transition-colors group/item"
                                        >
                                            <Icon icon="mdi:edit-outline" className="w-[1.1vw] h-[1.1vw] text-gray-500" />
                                            <span className="text-[0.7vw] font-medium text-gray-600">Rename</span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onDelete && onDelete(text); }}
                                            className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-red-100 cursor-pointer rounded-[0.6vw] text-red-500 transition-colors"
                                        >
                                            <Icon icon="solar:trash-bin-trash-linear" className="w-[1.1vw] h-[1.1vw]" />
                                            <span className="text-[0.7vw] font-medium">Delete</span>
                                        </button>
                                     </div>
                                 </div>
                        </>,
                        document.body
                    )}
                </div>
            </div>
        </div>
    );
};

const MaterialGroup = ({ id, group, materials, selectedMaterial, onSelect, hiddenMaterials, onToggleVisibility, onDelete, onRename, onDeleteModel, checkIfSelected }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Determine if this group is the active one
    const isGroupSelected = selectedMaterial && typeof selectedMaterial === 'object' && selectedMaterial.isGroup && selectedMaterial.name === group;

    const handleGroupClick = (e) => {
        e.stopPropagation();
        onSelect({ name: group, isGroup: true, materials: materials, parentGroup: group, isShift: e.shiftKey });
        setIsOpen(!isOpen);
    };

    // Auto-expand if a child material is selected
    React.useEffect(() => {
        if (!selectedMaterial) return;
        const matName = typeof selectedMaterial === 'object' ? selectedMaterial.name : selectedMaterial;
        if (materials.includes(matName)) {
            setIsOpen(true);
        }
    }, [selectedMaterial, materials]);

    const toggleOpen = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    }

    return (
        <div className="mb-[0.42vw]">
            <div 
                onClick={handleGroupClick}
                className={`flex items-center justify-between px-[0.42vw] py-[0.31vw] cursor-pointer rounded-[0.42vw] group select-none transition-colors
                    ${isGroupSelected ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-50/80 border border-transparent"}`}
                title="Select Group"
            >
                <div className="flex items-center gap-[0.42vw] min-w-0 flex-1">
                     <Icon 
                        icon={isOpen ? "solar:folder-open-bold-duotone" : "solar:folder-bold-duotone"} 
                        width="0.73vw" height="0.73vw"
                        className={`${isGroupSelected ? "text-indigo-500" : "text-gray-400 group-hover:text-[#5d5efc]"} transition-colors shrink-0`} 
                     />
                     <span className={`${isGroupSelected ? "text-indigo-700" : "text-gray-500 group-hover:text-gray-700"} text-[0.75vw] font-semibold transition-colors truncate min-w-0 flex-1`}>
                        {group}
                     </span>
                     <span className={`${isGroupSelected ? "text-indigo-400" : "text-gray-400"} text-[0.55vw] font-semibold shrink-0`}>( {materials.length} )</span>
                </div>
                <div className="flex items-center gap-[0.2vw] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteModel && onDeleteModel(id); }}
                        className="p-[0.21vw] hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-[0.21vw] transition-colors"
                        title="Delete entire model"
                    >
                        <Icon icon="ph:trash-bold" width="0.75vw" height="0.75vw" />
                    </button>
                    <div onClick={toggleOpen} className="p-[0.21vw] hover:bg-gray-200 rounded-[0.21vw]">
                        <Icon 
                            icon="heroicons:chevron-down-20-solid" 
                            width="0.73vw" height="0.73vw"
                            className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                        />
                    </div>
                </div>
            </div>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[200vw] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="pl-[0.42vw] space-y-[0.1vw] border-l-[0.1vw] border-gray-100/80 ml-[0.52vw] my-[0.21vw]">
                    {materials.map((mat, matIdx) => (
                        <MaterialItem 
                            key={matIdx} 
                            text={mat} 
                            selected={checkIfSelected(mat, group)} 
                            onClick={(e) => onSelect({ name: mat, parentGroup: group, isShift: e.shiftKey })} 
                            isVisible={!hiddenMaterials?.has(mat)}
                            onToggleVisibility={onToggleVisibility}
                            onDelete={onDelete}
                            onRename={(oldN, newN) => onRename && onRename(oldN, newN, group)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function MaterialList({ isCollapsed, setIsCollapsed, isTextureOpen, materials = [], selectedMaterial, onSelect, modelName, onToggleVisibility, onDeleteMaterial, onRenameMaterial, onDeleteModel, hiddenMaterials = new Set() }) {

    const [searchTerm, setSearchTerm] = useState("");

    const handleToggleVisibility = (matName) => {
        const isCurrentlyHidden = hiddenMaterials.has(matName);
        if (onToggleVisibility) onToggleVisibility(matName, isCurrentlyHidden);
    };

    const handleDelete = (matName) => {
        if (onDeleteMaterial) onDeleteMaterial(matName);
    };

    // Helper to check if a material is effectively selected (individual or part of group)
    const checkIfSelected = (matName, parentG = null) => {
        if (!selectedMaterial) return false;
        
        // Handling Multiple Selection Group
        if (selectedMaterial.isGroup) {
            // If checking a group itself
            if (parentG === null) {
                return selectedMaterial.name === matName;
            }
            // If checking an individual material
            return selectedMaterial.materials.includes(matName);
        }
        
        // Handling Single Selection
        const selName = selectedMaterial.name || selectedMaterial;
        const selParent = selectedMaterial.parentGroup;
        
        if (parentG) {
             return selName === matName && selParent === parentG;
        }
        return selName === matName;
    };

    // Auto-scroll to selected material
    React.useEffect(() => {
        if (!selectedMaterial) return;
        
        const matName = typeof selectedMaterial === 'object' ? selectedMaterial.name : selectedMaterial;
        // Don't scroll to "Multiple Selection" or generic model nodes
        if (!matName || matName === (modelName || "Model") || matName === "Multiple Selection") return;

        // Small timeout to ensure DOM is updated and dropdowns are expanded if necessary
        const timer = setTimeout(() => {
            const element = document.querySelector(`[data-mat-name="${matName}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedMaterial, modelName]);

    // Filtering logic
    const filteredMaterials = materials.map(item => {
        if (typeof item === 'object' && item.group) {
            const matchesGroup = item.group.toLowerCase().includes(searchTerm.toLowerCase());
            const filteredGroupMats = item.materials.filter(m => 
                m.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (matchesGroup || filteredGroupMats.length > 0) {
                return {
                    ...item,
                    materials: matchesGroup ? item.materials : filteredGroupMats
                };
            }
            return null;
        } else {
            return (typeof item === 'string' && item.toLowerCase().includes(searchTerm.toLowerCase())) ? item : null;
        }
    }).filter(Boolean);

    return (
        <div className="relative z-40 flex flex-col w-[13.5vw] select-none">
            {/* STATIC FLOATING HEADER */}
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center justify-between gap-[0.83vw] bg-white px-[1vw] h-[2.5vw] border border-gray-200 pointer-events-auto transition-all duration-300 cursor-pointer ${!isCollapsed ? "rounded-t-[0.62vw] border-b-transparent shadow-none" : "rounded-[0.62vw] shadow-sm"}`}
            >
                <div className="flex items-baseline gap-[0.5vw]">
                    <Icon icon="solar:layers-minimalistic-bold-duotone" width="1.1vw" height="1.1vw" className="text-gray-500 shrink-0 self-center" />
                    <span className="text-[0.85vw] font-semibold text-gray-700 tracking-tight whitespace-nowrap">
                        Materials
                    </span>
                    <span className="bg-gray-100 text-gray-500 text-[0.6vw] font-bold px-[0.4vw] py-[0.15vw] rounded-[0.31vw] shrink-0">
                        {materials.reduce((acc, item) => acc + (item.group ? item.materials.length : 1), 0)}
                    </span>
                </div>
                
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    className={`w-[1.7vw] h-[1.7vw] flex items-center justify-center border border-gray-100 hover:bg-gray-50 rounded-[0.42vw] transition-all group cursor-pointer ${!isCollapsed ? "bg-gray-50" : "bg-white"
                        }`}
                >
                    <Icon
                        icon={isCollapsed ? "heroicons:chevron-down-20-solid" : "heroicons:chevron-up-20-solid"}
                        width="0.95vw" height="0.95vw"
                        className={`text-gray-500 group-hover:text-gray-900 transition-transform duration-300`}
                    />
                </button>
            </div>

            {/* DROPDOWN CONTENT */}
            {/* DROPDOWN CONTENT Wrapper */}
            <div
                className={`absolute top-full left-0 w-full bg-white border border-gray-200 border-t-0 transition-all duration-500 ease-in-out flex flex-col pointer-events-auto ${isCollapsed ? "max-h-0 opacity-0 -translate-y-[0.42vw] scale-95 pointer-events-none rounded-[0.62vw] overflow-hidden" : "opacity-100 translate-y-0 scale-100 rounded-b-[0.62vw] rounded-t-none pb-[0.42vw]"
                    }`}
                style={{
                    maxHeight: isCollapsed ? "0" : (isTextureOpen ? "calc(92vh - 23vw)" : "calc(92vh - 14.06vw)")
                }}
            >
                {/* SEARCH BAR */}
                {!isCollapsed && (
                    <div className="px-[0.62vw] pt-[0.42vw] pb-[0.21vw]">
                        <div className="relative group">
                            <div className="absolute left-[0.62vw] top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Icon icon="heroicons:magnifying-glass-20-solid" width="0.85vw" height="0.85vw" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search materials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-[2vw] pr-[2vw] py-[0.42vw] bg-gray-50 border border-gray-100 rounded-[0.52vw] text-[0.7vw] font-semibold text-gray-700 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-200 focus:ring-[0.15vw] focus:ring-indigo-50 transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-[0.62vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <Icon icon="heroicons:x-mark-20-solid" width="0.85vw" height="0.85vw" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* MATERIALS LIST */}
                {/* MATERIALS SCROLL LIST */}
                <div className="flex-1 overflow-y-auto space-y-[0.21vw] custom-scrollbar px-[0.42vw] pb-[0.2vw] mt-[0.21vw]">
                    {/* Model Name Parent Item (Sticky) */}
                    {(!searchTerm || (modelName || "Model").toLowerCase().includes(searchTerm.toLowerCase())) && (
                        <div className="sticky top-0 bg-white z-10 pt-[0.2vw] pb-[0.42vw]">
                            <div 
                                onClick={(e) => onSelect({ name: (modelName || "Model"), parentGroup: (modelName || "Model"), isShift: e.shiftKey })}
                                className={`py-[0.42vw] px-[0.62vw] flex items-center gap-[0.52vw] text-[0.7vw] font-semibold rounded-[0.42vw] cursor-pointer transition-all border border-transparent
                                    ${(checkIfSelected(modelName || "Model"))
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                                        : "bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-100/50"
                                    }`}
                            >
                                <Icon icon="ph:cube-duotone" width="1vw" height="1vw" className={`shrink-0 ${(selectedMaterial === (modelName || "Model") || (selectedMaterial && selectedMaterial.name === (modelName || "Model"))) ? "text-indigo-500" : "text-gray-400"}`} />
                                <span className="truncate flex-1 min-w-0">{modelName === "Scene" ? "Entire Scene" : (modelName || "Entire Model")}</span>
                                {(selectedMaterial === (modelName || "Model") || (selectedMaterial && selectedMaterial.name === (modelName || "Model"))) && <Icon icon="heroicons:check-circle-20-solid" width="0.73vw" height="0.73vw" className="text-indigo-500 shrink-0" />}
                            </div>
                            <div className="h-[0.05vw] bg-gray-100 mx-[0.2vw] mt-[0.42vw]"></div>
                        </div>
                    )}

                    {/* Material Items */}
                    <div className="space-y-[0.1vw]">
                        {filteredMaterials.length === 0 && (
                             <div className="text-center py-[1vw] text-[0.65vw] text-gray-400 font-medium italic">
                                {searchTerm ? `No matches for "${searchTerm}"` : "No materials found"}
                             </div>
                        )}

                        {filteredMaterials.map((item, idx) => {
                            // Check if it's a group
                            if (typeof item === 'object' && item.group) {
                                return (
                                    <MaterialGroup 
                                        key={idx} 
                                        id={item.id}
                                        group={item.group} 
                                        materials={item.materials} 
                                        selectedMaterial={selectedMaterial} 
                                        onSelect={onSelect} 
                                        hiddenMaterials={hiddenMaterials}
                                        onToggleVisibility={handleToggleVisibility}
                                        onDelete={handleDelete}
                                        onRename={onRenameMaterial}
                                        onDeleteModel={onDeleteModel}
                                        checkIfSelected={checkIfSelected}
                                    />
                                );
                            } else {
                                // Standard string item
                                return (
                                    <MaterialItem 
                                        key={idx} 
                                        text={item} 
                                        selected={checkIfSelected(item, modelName)} 
                                        onClick={(e) => onSelect({ name: item, parentGroup: modelName, isShift: e.shiftKey })} 
                                        isVisible={!hiddenMaterials.has(item)}
                                        onToggleVisibility={handleToggleVisibility}
                                        onDelete={handleDelete}
                                        onRename={(oldN, newN) => onRenameMaterial && onRenameMaterial(oldN, newN, modelName)}
                                    />
                                );
                            }
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
