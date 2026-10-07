import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

// --- String Sanitizer Helper ---
const toSafeString = (val, fallback = "") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string") return val.trim();
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (typeof val === "object") {
        if (typeof val.name === "string" && val.name.trim()) return val.name.trim();
        if (typeof val.meshName === "string" && val.meshName.trim()) return val.meshName.trim();
        if (typeof val.material === "string" && val.material.trim()) return val.material.trim();
        if (typeof val.group === "string" && val.group.trim()) return val.group.trim();
        if (typeof val.id === "string" && val.id.trim()) return val.id.trim();
    }
    return fallback;
};

// --- Display Name Formatter Helper ---
const cleanDisplayName = (name) => {
    if (!name || typeof name !== "string") return "";
    let clean = name.trim();
    // Strip file extensions like .glb, .gltf, .obj, .fbx, .stl, etc.
    clean = clean.replace(/\.(glb|gltf|fbx|obj|stl|3ds|step|stp|iges|igs|zip)$/i, "");
    return clean || name;
};

// --- Object & Mesh Hierarchy Builder ---
// Normalizes and structures 3D models so Objects/Groups are Folders, and Meshes are nested inside
const buildObjectTree = (rawMaterials, fallbackModelName = "Model") => {
    if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) return [];

    const formatNode = (node, parentGroup = "") => {
        if (!node) return null;

        // String primitive (legacy fallback)
        if (typeof node === "string") {
            const str = node.trim();
            return {
                id: str,
                meshUuid: str,
                name: str,
                isMesh: true,
                isGroup: false,
                material: str,
                materials: [str],
                parentGroup: toSafeString(parentGroup, fallbackModelName)
            };
        }

        if (typeof node !== "object") return null;

        const hasChildren = (Array.isArray(node.children) && node.children.length > 0) || (Array.isArray(node.tree) && node.tree.length > 0);
        const isGroup = Boolean(node.isGroup || node.isModel || hasChildren);
        const nodeName = toSafeString(node.name || node.group || node.meshName, isGroup ? "Object" : "Mesh");
        const rawUuid = toSafeString(node.meshUuid || node.id || node.uuid, "");
        const uuid = rawUuid || `${isGroup ? 'grp' : 'msh'}_${nodeName}_${Math.random().toString(36).slice(2, 8)}`;
        const currentGroup = isGroup ? nodeName : parentGroup;

        let formattedChildren = [];
        const rawChildren = node.children || node.tree;
        if (Array.isArray(rawChildren)) {
            formattedChildren = rawChildren.map(c => formatNode(c, currentGroup)).filter(Boolean);
        }

        if (isGroup) {
            const descendantMats = new Set();
            const descendantMeshNames = new Set();
            const descendantUuids = new Set();
            const collectDescendants = (n) => {
                if (!n) return;
                if (n.isMesh) {
                    if (n.name) descendantMeshNames.add(n.name);
                    if (n.meshUuid) {
                        descendantMeshNames.add(n.meshUuid);
                        descendantUuids.add(n.meshUuid);
                    }
                    if (n.uuid) descendantUuids.add(n.uuid);
                    if (n.material) descendantMats.add(n.material);
                }
                if (Array.isArray(n.children)) n.children.forEach(collectDescendants);
            };
            formattedChildren.forEach(collectDescendants);

            return {
                id: uuid,
                name: nodeName,
                isGroup: true,
                isMesh: false,
                isModel: Boolean(node.isModel),
                materials: Array.from(descendantMats),
                meshNames: Array.from(descendantMeshNames),
                uuids: Array.from(descendantUuids),
                children: formattedChildren,
                parentGroup: toSafeString(parentGroup, fallbackModelName)
            };
        }

        // Leaf Mesh Node
        let primaryMat = "";
        if (typeof node.material === "string") {
            primaryMat = node.material.trim();
        } else if (Array.isArray(node.materials) && node.materials.length > 0) {
            primaryMat = toSafeString(node.materials[0], "");
        }

        return {
            id: uuid,
            meshUuid: uuid,
            name: nodeName,
            isMesh: true,
            isGroup: false,
            material: primaryMat || nodeName,
            materials: Array.isArray(node.materials) ? node.materials.map(m => toSafeString(m)).filter(Boolean) : (primaryMat ? [primaryMat] : []),
            parentGroup: toSafeString(parentGroup, fallbackModelName)
        };
    };

    const formatted = rawMaterials.map(item => {
        if (item && typeof item === "object" && Array.isArray(item.tree)) {
            const modelTitle = toSafeString(item.group || item.name, fallbackModelName);

            // Unwrap single generic wrapper nodes (e.g. RootNode -> meshes) if redundant
            let treeToProcess = item.tree;
            while (
                treeToProcess.length === 1 &&
                treeToProcess[0]?.isGroup &&
                Array.isArray(treeToProcess[0].children) &&
                treeToProcess[0].children.length > 0 &&
                /^(rootnode|root|scene|object3d|sketchfab_model|model)$/i.test((treeToProcess[0].name || "").trim())
            ) {
                treeToProcess = treeToProcess[0].children;
            }

            const children = treeToProcess.map(c => formatNode(c, modelTitle)).filter(Boolean);

            const descendantMats = new Set();
            const descendantMeshNames = new Set();
            const collectDescendants = (n) => {
                if (!n) return;
                if (n.isMesh) {
                    if (n.name) descendantMeshNames.add(n.name);
                    if (n.meshUuid) descendantMeshNames.add(n.meshUuid);
                    if (n.material) descendantMats.add(n.material);
                }
                if (Array.isArray(n.children)) n.children.forEach(collectDescendants);
            };
            children.forEach(collectDescendants);

            return {
                id: item.id || modelTitle,
                name: modelTitle,
                isGroup: true,
                isModel: true,
                materials: Array.from(descendantMats),
                meshNames: Array.from(descendantMeshNames),
                children: children,
                parentGroup: fallbackModelName
            };
        }
        return formatNode(item, fallbackModelName);
    }).filter(Boolean);

    // If all root nodes are direct leaf meshes, wrap in top-level Object Folder for clean hierarchy
    const allRootAreMeshes = formatted.every(n => n.isMesh);
    if (allRootAreMeshes && formatted.length > 0) {
        const rootTitle = toSafeString(fallbackModelName, "Object");
        const descendantMats = new Set();
        const descendantMeshNames = new Set();
        formatted.forEach(m => {
            if (m.name) descendantMeshNames.add(m.name);
            if (m.meshUuid) descendantMeshNames.add(m.meshUuid);
            if (m.material) descendantMats.add(m.material);
        });

        return [{
            id: rootTitle,
            name: rootTitle,
            isGroup: true,
            isModel: true,
            materials: Array.from(descendantMats),
            meshNames: Array.from(descendantMeshNames),
            children: formatted,
            parentGroup: rootTitle
        }];
    }

    return formatted;
};

// Count total objects and leaf meshes in tree
const countStats = (nodes) => {
    let objectCount = 0;
    let meshCount = 0;
    const countRec = (n) => {
        if (!n) return;
        if (n.isGroup) objectCount++;
        if (n.isMesh) meshCount++;
        if (Array.isArray(n.children)) n.children.forEach(countRec);
    };
    if (Array.isArray(nodes)) nodes.forEach(countRec);
    return { objectCount, meshCount };
};

// Filter tree recursively based on search query
const filterTree = (nodes, query) => {
    if (!query || !query.trim()) return nodes;
    const q = query.toLowerCase().trim();

    const matchNode = (node) => {
        if (!node) return null;
        const nameMatches = node.name && node.name.toLowerCase().includes(q);

        let filteredChildren = [];
        if (Array.isArray(node.children) && node.children.length > 0) {
            filteredChildren = node.children.map(matchNode).filter(Boolean);
        }

        if (nameMatches || filteredChildren.length > 0) {
            return {
                ...node,
                children: filteredChildren.length > 0 ? filteredChildren : node.children
            };
        }
        return null;
    };

    return nodes.map(matchNode).filter(Boolean);
};

// --- Recursive Tree Item (Object Folders & Nested Meshes) ---
const TreeItem = ({
    node,
    depth = 0,
    selectedMaterial,
    onSelect,
    hiddenMaterials,
    xrayMaterials,
    onToggleVisibility,
    onToggleXray,
    onDelete,
    onRename,
    searchTerm = "",
    forceExpand = null,
    modelName = "Model"
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const displayName = toSafeString(node.name, node.isGroup ? "Object" : "Mesh");
    const visualTitle = cleanDisplayName(displayName);
    const [tempName, setTempName] = useState(visualTitle);

    // Sync expand state from toolbar
    useEffect(() => {
        if (forceExpand !== null) {
            setIsOpen(forceExpand);
        }
    }, [forceExpand]);

    // Auto-open folders when searching
    useEffect(() => {
        if (searchTerm) {
            setIsOpen(true);
        }
    }, [searchTerm]);

    useEffect(() => {
        setTempName(cleanDisplayName(displayName));
    }, [displayName]);

    const handleRenameSubmit = () => {
        if (tempName.trim() !== "" && tempName !== visualTitle) {
            onRename && onRename(displayName, tempName.trim(), node.parentGroup || modelName);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.stopPropagation();
            handleRenameSubmit();
        }
        if (e.key === "Escape") {
            e.stopPropagation();
            setTempName(visualTitle);
            setIsEditing(false);
        }
    };

    // Selection Check
    const isSelected = useMemo(() => {
        if (!selectedMaterial) return false;

        // Group / Object Folder Selection
        if (selectedMaterial.isGroup) {
            if (node.isGroup) {
                return selectedMaterial.name === node.name;
            }
            // Multi-selection (explicit)
            if (selectedMaterial.name === "Multiple Selection") {
                if (Array.isArray(selectedMaterial.uuids) && node.meshUuid) {
                    return selectedMaterial.uuids.includes(node.meshUuid);
                }
                if (Array.isArray(selectedMaterial.meshNames) && node.name) {
                    return selectedMaterial.meshNames.includes(node.name);
                }
                if (Array.isArray(selectedMaterial.materials) && node.name) {
                    return selectedMaterial.materials.includes(node.name);
                }
            }
            return false;
        }

        // Single Mesh Selection - Match ONLY this exact mesh
        if (node.isMesh) {
            const selUuid = toSafeString(selectedMaterial.meshUuid || selectedMaterial.uuid, "");
            const selMeshName = toSafeString(selectedMaterial.meshName, "");
            const selName = toSafeString(selectedMaterial.name || selectedMaterial, "");

            // 1. Authoritative check: If selection has a UUID, match node.meshUuid strictly
            if (selUuid) {
                return node.meshUuid ? selUuid === node.meshUuid : false;
            }
            // 2. Fallback when selection has no UUID (e.g. legacy selection): match mesh name
            if (selMeshName && node.name) {
                return selMeshName === node.name;
            }
            if (selName && node.name) {
                return selName === node.name;
            }
            return false;
        }

        // Folder/Group check against selName
        if (node.isGroup) {
            const selName = toSafeString(selectedMaterial.name || selectedMaterial, "");
            return selName === node.name;
        }
        return false;
    }, [selectedMaterial, node]);

    // Visibility Check
    const isVisible = useMemo(() => {
        if (!hiddenMaterials || !(hiddenMaterials instanceof Set)) return true;

        if (node.isMesh) {
            if (node.meshUuid && hiddenMaterials.has(node.meshUuid)) return false;
            if (node.name && hiddenMaterials.has(node.name)) return false;
            if (!node.meshUuid && !node.name && node.material && hiddenMaterials.has(node.material)) return false;
            return true;
        }

        if (node.isGroup) {
            // Visible if at least one descendant mesh is visible
            let hasVisibleMesh = false;
            const check = (n) => {
                if (!n) return;
                if (n.isMesh) {
                    const isHidden = (n.meshUuid && hiddenMaterials.has(n.meshUuid)) ||
                                     (n.name && hiddenMaterials.has(n.name)) ||
                                     (!n.meshUuid && !n.name && n.material && hiddenMaterials.has(n.material));
                    if (!isHidden) hasVisibleMesh = true;
                }
                if (Array.isArray(n.children)) n.children.forEach(check);
            };
            check(node);
            return hasVisibleMesh;
        }

        return true;
    }, [node, hiddenMaterials]);

    // X-Ray Check
    const isXray = useMemo(() => {
        if (!xrayMaterials || !(xrayMaterials instanceof Set)) return false;

        if (node.isMesh) {
            if (node.meshUuid && xrayMaterials.has(node.meshUuid)) return true;
            if (node.name && xrayMaterials.has(node.name)) return true;
            if (!node.meshUuid && !node.name && node.material && xrayMaterials.has(node.material)) return true;
            return false;
        }

        if (node.isGroup) {
            // Active if all child meshes are in X-Ray (or at least one when inspecting)
            let total = 0;
            let xrayCount = 0;
            const check = (n) => {
                if (!n) return;
                if (n.isMesh) {
                    total++;
                    const hasXray = (n.meshUuid && xrayMaterials.has(n.meshUuid)) ||
                                    (n.name && xrayMaterials.has(n.name)) ||
                                    (!n.meshUuid && !n.name && n.material && xrayMaterials.has(n.material));
                    if (hasXray) xrayCount++;
                }
                if (Array.isArray(n.children)) n.children.forEach(check);
            };
            check(node);
            return total > 0 && xrayCount === total;
        }

        return false;
    }, [node, xrayMaterials]);

    // Count leaf meshes under this folder
    const childMeshCount = useMemo(() => {
        if (!node.isGroup) return 0;
        let count = 0;
        const countRec = (n) => {
            if (!n) return;
            if (n.isMesh) count++;
            if (Array.isArray(n.children)) n.children.forEach(countRec);
        };
        if (Array.isArray(node.children)) node.children.forEach(countRec);
        return count;
    }, [node]);

    // --- 1. FOLDER / OBJECT ROW ---
    if (node.isGroup) {
        return (
            <div className="w-full my-[0.05vw]">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect({
                            name: displayName,
                            isGroup: true,
                            isModel: Boolean(node.isModel),
                            materials: node.materials || [],
                            meshNames: node.meshNames || [],
                            uuids: node.uuids || [],
                            parentGroup: node.parentGroup || modelName,
                            isShift: e.shiftKey
                        });
                    }}
                    title={`Object: ${visualTitle} (${childMeshCount} meshes)`}
                    className={`group relative flex items-center justify-between py-[0.38vw] px-[0.45vw] rounded-[0.45vw] text-[0.7vw] cursor-pointer transition-all duration-150 border select-none w-full min-w-0 ${
                        isSelected
                            ? "bg-indigo-50/95 border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs"
                            : "border-transparent text-gray-800 hover:bg-gray-100/75"
                    } ${!isVisible ? "opacity-40" : ""}`}
                >
                    {/* Left Selected Accent Pill */}
                    {isSelected && (
                        <div className="absolute left-0 top-[18%] bottom-[18%] w-[3px] bg-[#5d5efc] rounded-r-full" />
                    )}

                    {/* Left: Chevron + Folder Icon + Object Badge + Name + Mesh Count */}
                    <div className="flex items-center gap-[0.3vw] min-w-0 flex-1 pr-[0.2vw]">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            className="w-[1vw] h-[1vw] flex items-center justify-center rounded-[0.22vw] text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors shrink-0 cursor-pointer"
                            title={isOpen ? "Collapse folder" : "Expand folder"}
                        >
                            <Icon
                                icon="heroicons:chevron-down-20-solid"
                                width="0.75vw"
                                height="0.75vw"
                                className={`transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                            />
                        </button>

                        <div className="w-[1.2vw] h-[1.2vw] rounded-[0.28vw] flex items-center justify-center shrink-0">
                            <Icon
                                icon={isOpen ? "solar:folder-open-bold-duotone" : "solar:folder-bold-duotone"}
                                width="1vw"
                                height="1vw"
                                className={`transition-colors ${
                                    isSelected
                                        ? "text-[#5d5efc]"
                                        : node.isModel
                                            ? "text-amber-500 group-hover:text-amber-600"
                                            : "text-indigo-400 group-hover:text-indigo-500"
                                }`}
                            />
                        </div>

                        {isEditing ? (
                            <input
                                autoFocus
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white border border-indigo-400 rounded px-[0.25vw] py-[0.04vw] text-[0.68vw] text-gray-900 font-semibold outline-none w-full shadow-xs"
                            />
                        ) : (
                            <span 
                                className="truncate font-semibold text-[0.7vw] text-gray-800 tracking-tight flex-1 min-w-0 leading-tight"
                                title={displayName}
                            >
                                {visualTitle}
                            </span>
                        )}

                        <span className="text-[0.52vw] font-medium px-[0.28vw] py-[0.04vw] rounded-[0.22vw] bg-gray-100 text-gray-400 shrink-0 ml-auto mr-[0.1vw]">
                            {childMeshCount}
                        </span>
                    </div>
                </div>

                {/* Subtree with elegant guide line */}
                {isOpen && Array.isArray(node.children) && node.children.length > 0 && (
                    <div className="ml-[0.55vw] pl-[0.42vw] border-l-[1.5px] border-gray-200/80 hover:border-indigo-200/90 transition-colors space-y-[0.03vw] my-[0.04vw]">
                        {node.children.map((childNode, cIdx) => (
                            <TreeItem
                                key={childNode.id || `${displayName}_child_${cIdx}`}
                                node={childNode}
                                depth={depth + 1}
                                selectedMaterial={selectedMaterial}
                                onSelect={onSelect}
                                hiddenMaterials={hiddenMaterials}
                                xrayMaterials={xrayMaterials}
                                onToggleVisibility={onToggleVisibility}
                                onToggleXray={onToggleXray}
                                onDelete={onDelete}
                                onRename={onRename}
                                searchTerm={searchTerm}
                                forceExpand={forceExpand}
                                modelName={modelName}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- 2. LEAF MESH ROW (INSIDE OBJECT FOLDER) ---
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onSelect({
                    name: displayName,
                    meshName: displayName,
                    uuid: toSafeString(node.meshUuid || node.id, displayName),
                    meshUuid: toSafeString(node.meshUuid || node.id, displayName),
                    material: toSafeString(node.material, displayName),
                    parentGroup: toSafeString(node.parentGroup, modelName),
                    isMesh: true,
                    isShift: e.shiftKey
                });
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            data-mesh-key={toSafeString(node.meshUuid || node.id || displayName)}
            data-mesh-name={displayName}
            title={displayName}
            className={`group relative flex items-center justify-between py-[0.32vw] px-[0.42vw] rounded-[0.42vw] text-[0.68vw] cursor-pointer transition-all duration-150 border select-none w-full min-w-0 my-[0.03vw] ${
                isSelected
                    ? "bg-indigo-50/90 border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs"
                    : "border-transparent text-gray-700 hover:bg-gray-100/70"
            } ${!isVisible ? "opacity-40" : ""}`}
        >
            {/* Left Accent indicator when selected */}
            {isSelected && (
                <div className="absolute left-0 top-[18%] bottom-[18%] w-[3px] bg-[#5d5efc] rounded-r-full" />
            )}

            {/* Left: 3D Box Icon + Mesh Name */}
            <div className="flex items-center gap-[0.35vw] min-w-0 flex-1 pr-[0.2vw]">
                <div
                    className={`w-[1.15vw] h-[1.15vw] rounded-[0.26vw] flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                            ? "bg-indigo-100 text-[#5d5efc]"
                            : "bg-gray-100/90 text-gray-400 group-hover:text-[#5d5efc] group-hover:bg-indigo-50/80"
                    }`}
                >
                    <Icon icon="solar:box-minimalistic-bold-duotone" width="0.78vw" height="0.78vw" />
                </div>

                {isEditing ? (
                    <input
                        autoFocus
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border border-indigo-400 rounded px-[0.25vw] py-[0.04vw] text-[0.68vw] text-gray-900 font-semibold outline-none w-full shadow-xs"
                    />
                ) : (
                    <span 
                        className="truncate font-medium text-[0.68vw] text-gray-700 group-hover:text-gray-900 tracking-tight flex-1 min-w-0 leading-tight"
                        title={displayName}
                    >
                        {visualTitle}
                    </span>
                )}
            </div>
        </div>
    );
};

// --- Main Inspector Panel Component ---
export default function MaterialList({
    isCollapsed,
    setIsCollapsed,
    isTextureOpen,
    materials = [],
    selectedMaterial,
    onSelect,
    modelName,
    onToggleVisibility,
    onToggleXray,
    onDeleteMaterial,
    onRenameMaterial,
    onDeleteModel,
    hiddenMaterials = new Set(),
    xrayMaterials = new Set(),
    variant = "dropdown"
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [forceExpand, setForceExpand] = useState(null);
    const safeModelName = toSafeString(modelName, "Model");

    // Build structured Object -> Mesh folder hierarchy
    const objectTree = useMemo(() => {
        return buildObjectTree(materials, safeModelName);
    }, [materials, safeModelName]);

    // Filter tree according to search term
    const filteredTree = useMemo(() => {
        return filterTree(objectTree, searchTerm);
    }, [objectTree, searchTerm]);

    // Total object and mesh counts
    const { objectCount, meshCount } = useMemo(() => {
        return countStats(objectTree);
    }, [objectTree]);

    // Delete node (mesh or model)
    const handleDeleteNode = (node) => {
        if (!node) return;
        if (node.isModel && node.id && onDeleteModel) {
            onDeleteModel(node.id);
            return;
        }
        if (onDeleteMaterial) {
            onDeleteMaterial(node);
        }
    };

    // Auto-scroll to selected mesh item
    useEffect(() => {
        if (!selectedMaterial) return;
        const selUuid = toSafeString(selectedMaterial.meshUuid || selectedMaterial.uuid, "");
        const selName = toSafeString(selectedMaterial.meshName || selectedMaterial.name || selectedMaterial, "");
        if (!selName && !selUuid) return;
        if (selName === safeModelName || selName === "Scene" || selName === "Multiple Selection") return;

        const timer = setTimeout(() => {
            const element = document.querySelector(`[data-mesh-key="${selUuid || selName}"]`) || document.querySelector(`[data-mesh-name="${selName}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedMaterial, safeModelName]);

    if (variant === "panel") {
        return (
            <div className="w-full h-full flex flex-col select-none font-sans bg-transparent overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        {/* Search Bar */}
                        <div className="px-[0.75vw] pt-[0.6vw] pb-[0.35vw] w-full shrink-0">
                            <div className="relative group w-full flex items-center bg-gray-50/90 border border-gray-200/80 rounded-[0.5vw] px-[0.6vw] py-[0.35vw] focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100/70 transition-all shadow-2xs">
                                <Icon icon="heroicons:magnifying-glass-20-solid" width="0.8vw" height="0.8vw" className="text-gray-400 group-focus-within:text-[#5d5efc] transition-colors shrink-0 mr-[0.4vw]" />
                                <input
                                    type="text"
                                    placeholder="Search objects or meshes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-[0.72vw] font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0 ml-[0.3vw]"
                                        title="Clear search"
                                    >
                                        <Icon icon="heroicons:x-mark-20-solid" width="0.8vw" height="0.8vw" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Tree */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-[0.6vw] pb-[0.6vw] mt-[0.2vw] w-full [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                            <div className="space-y-[0.05vw] w-full min-w-0">
                                {filteredTree.length === 0 && (
                                    <div className="text-center py-[2vw] px-[0.5vw]">
                                        <Icon
                                            icon="solar:box-linear"
                                            className="w-[1.8vw] h-[1.8vw] text-gray-300 mx-auto mb-[0.3vw]"
                                        />
                                        <p className="text-[0.72vw] text-gray-500 font-medium">
                                            {searchTerm ? `No items matching "${searchTerm}"` : "No 3D objects loaded"}
                                        </p>
                                    </div>
                                )}

                                {filteredTree.map((itemNode, idx) => (
                                    <TreeItem
                                        key={itemNode.id || `tree_root_${idx}`}
                                        node={itemNode}
                                        depth={0}
                                        selectedMaterial={selectedMaterial}
                                        onSelect={onSelect}
                                        hiddenMaterials={hiddenMaterials}
                                        xrayMaterials={xrayMaterials}
                                        onToggleVisibility={onToggleVisibility}
                                        onToggleXray={onToggleXray}
                                        onDelete={handleDeleteNode}
                                        onRename={onRenameMaterial}
                                        searchTerm={searchTerm}
                                        forceExpand={forceExpand}
                                        modelName={safeModelName}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
            </div>
        );
    }

    return (
        <div className="relative z-40 flex flex-col w-[20vw] min-w-[290px] max-w-[360px] select-none font-sans">
            {/* --- STATIC FLOATING HEADER PILL --- */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center justify-between gap-[0.55vw] bg-white px-[0.65vw] h-[2.5vw] border border-gray-200 pointer-events-auto transition-all duration-200 cursor-pointer shadow-sm ${
                    !isCollapsed ? "rounded-t-[0.62vw] border-b-gray-100" : "rounded-[0.62vw] hover:border-gray-300 hover:shadow"
                }`}
            >
                <div className="flex items-center gap-[0.45vw] min-w-0">
                    <div className="w-[1.35vw] h-[1.35vw] rounded-[0.32vw] bg-indigo-50 text-[#5d5efc] flex items-center justify-center shrink-0 border border-indigo-100/80 shadow-2xs">
                        <Icon icon="solar:box-bold-duotone" width="0.85vw" height="0.85vw" />
                    </div>
                    <span className="text-[0.78vw] font-semibold text-gray-800 tracking-tight whitespace-nowrap">
                        Meshes
                    </span>
                    <span className="bg-indigo-50/80 text-[#5d5efc] text-[0.58vw] font-bold px-[0.38vw] py-[0.06vw] rounded-full border border-indigo-100/60 shrink-0">
                        {meshCount}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    className={`w-[1.4vw] h-[1.4vw] flex items-center justify-center rounded-[0.32vw] hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all cursor-pointer ${
                        !isCollapsed ? "bg-gray-50" : "bg-white"
                    }`}
                    title={isCollapsed ? "Expand hierarchy" : "Collapse hierarchy"}
                >
                    <Icon
                        icon="heroicons:chevron-up-20-solid"
                        width="0.82vw"
                        height="0.82vw"
                        className={`transition-transform duration-300 ${
                            isCollapsed ? "rotate-180" : "rotate-0"
                        }`}
                    />
                </button>
            </div>

            {/* --- DROPDOWN INSPECTOR CARD --- */}
            <div
                className={`absolute top-full left-0 w-full bg-white/98 backdrop-blur-md border border-gray-200/90 border-t-0 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-in-out flex flex-col pointer-events-auto overflow-hidden ${
                    isCollapsed
                        ? "max-h-0 opacity-0 -translate-y-[0.3vw] scale-98 pointer-events-none rounded-[0.62vw]"
                        : "opacity-100 translate-y-0 scale-100 rounded-b-[0.62vw] pb-[0.45vw]"
                }`}
                style={{
                    maxHeight: isCollapsed ? "0" : isTextureOpen ? "calc(88vh - 22vw)" : "calc(88vh - 12vw)"
                }}
            >
                {!isCollapsed && (
                    <>
                        {/* --- SEARCH BAR --- */}
                        <div className="px-[0.55vw] pt-[0.4vw] pb-[0.2vw] w-full">
                            <div className="relative group w-full flex items-center bg-gray-50/90 border border-gray-200/80 rounded-[0.45vw] px-[0.55vw] py-[0.3vw] focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100/70 transition-all shadow-2xs">
                                <Icon icon="heroicons:magnifying-glass-20-solid" width="0.75vw" height="0.75vw" className="text-gray-400 group-focus-within:text-[#5d5efc] transition-colors shrink-0 mr-[0.4vw]" />
                                <input
                                    type="text"
                                    placeholder="Search objects or meshes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-[0.68vw] font-medium text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0 ml-[0.3vw]"
                                        title="Clear search"
                                    >
                                        <Icon icon="heroicons:x-mark-20-solid" width="0.75vw" height="0.75vw" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- SCROLLABLE HIERARCHY TREE (OBJECT FOLDERS WITH MESHES INSIDE) --- */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-[0.45vw] pb-[0.2vw] mt-[0.1vw] w-full [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                            <div className="space-y-[0.03vw] w-full min-w-0">
                                {filteredTree.length === 0 && (
                                    <div className="text-center py-[1.8vw] px-[0.5vw]">
                                        <Icon
                                            icon="solar:box-linear"
                                            className="w-[1.6vw] h-[1.6vw] text-gray-300 mx-auto mb-[0.3vw]"
                                        />
                                        <p className="text-[0.68vw] text-gray-500 font-medium">
                                            {searchTerm ? `No items matching "${searchTerm}"` : "No 3D objects loaded"}
                                        </p>
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm("")}
                                                className="mt-[0.3vw] text-[0.6vw] text-[#5d5efc] font-semibold hover:underline cursor-pointer"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                )}

                                {filteredTree.map((itemNode, idx) => (
                                    <TreeItem
                                        key={itemNode.id || `tree_root_${idx}`}
                                        node={itemNode}
                                        depth={0}
                                        selectedMaterial={selectedMaterial}
                                        onSelect={onSelect}
                                        hiddenMaterials={hiddenMaterials}
                                        xrayMaterials={xrayMaterials}
                                        onToggleVisibility={onToggleVisibility}
                                        onToggleXray={onToggleXray}
                                        onDelete={handleDeleteNode}
                                        onRename={onRenameMaterial}
                                        searchTerm={searchTerm}
                                        forceExpand={forceExpand}
                                        modelName={safeModelName}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
