import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

// --- Tree & Data Processing Helpers ---

const getNormalizedTreeData = (materials) => {
    if (!materials || !Array.isArray(materials) || materials.length === 0) return [];
    if (materials.length === 1 && materials[0]?.tree) {
        return materials[0].tree;
    }
    if (materials.some((m) => m && typeof m === "object" && m.tree)) {
        return materials.map((m) => {
            if (m.tree) {
                return {
                    id: m.id,
                    name: m.group || m.name || "Model",
                    isGroup: true,
                    isModel: true,
                    children: m.tree,
                    materials: m.materials || []
                };
            }
            return m;
        });
    }
    return materials;
};

// Intelligently flatten single-child dummy CAD wrapper chains (e.g. Drone_leg_F -> F_P1_G -> ... -> F_P6_G -> F_P7 becomes Drone_leg_F -> F_P7)
const simplifyTree = (nodes) => {
    if (!Array.isArray(nodes)) return [];

    const clean = (item) => {
        if (!item || typeof item === "string") return item;
        if (item.isMesh || !item.children || item.children.length === 0) return item;

        // Clean children recursively first
        let children = item.children.map(clean).filter(Boolean);

        // While this group only has 1 child and that child is a group with children, unwrap it
        while (children.length === 1 && children[0].isGroup && Array.isArray(children[0].children) && children[0].children.length > 0) {
            children = children[0].children;
        }

        return {
            ...item,
            children
        };
    };

    return nodes.map(clean).filter(Boolean);
};

// Extract unique materials with applied parts count
const extractUniqueMaterials = (nodes) => {
    const matMap = new Map();

    const traverse = (item, parentPath = []) => {
        if (!item) return;
        if (typeof item === "string") {
            if (!matMap.has(item)) {
                matMap.set(item, { name: item, count: 1, meshes: [] });
            }
            return;
        }

        const currentPath = item.name ? [...parentPath, item.name] : parentPath;

        if (item.isMesh || (!item.isGroup && (!item.children || item.children.length === 0))) {
            const matName = item.material || (Array.isArray(item.materials) ? item.materials[0] : item.name);
            if (matName) {
                if (!matMap.has(matName)) {
                    matMap.set(matName, {
                        name: matName,
                        count: 0,
                        meshes: []
                    });
                }
                const entry = matMap.get(matName);
                entry.count += 1;
                entry.meshes.push({
                    id: item.id || item.meshUuid || item.name,
                    name: item.name,
                    meshUuid: item.meshUuid || item.id,
                    parentGroup: parentPath[parentPath.length - 1] || "",
                    path: currentPath
                });
            }
        }

        if (Array.isArray(item.children)) {
            item.children.forEach((child) => traverse(child, currentPath));
        } else if (Array.isArray(item.materials)) {
            item.materials.forEach((m) => {
                if (typeof m === "string" && !matMap.has(m)) {
                    matMap.set(m, { name: m, count: 1, meshes: [] });
                }
            });
        }
    };

    if (Array.isArray(nodes)) {
        nodes.forEach((n) => traverse(n));
    }
    return Array.from(matMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

// Filter tree recursively
const filterTreeNodes = (nodes, query) => {
    if (!query || !query.trim()) return nodes;
    const lowerQ = query.toLowerCase().trim();

    const matchNode = (node) => {
        if (typeof node === "string") {
            return node.toLowerCase().includes(lowerQ) ? node : null;
        }

        const nameMatches = (node.name || node.group || "").toLowerCase().includes(lowerQ);
        const matMatches = (node.material || "").toLowerCase().includes(lowerQ);
        const matsMatch = (node.materials || []).some((m) => String(m).toLowerCase().includes(lowerQ));

        let filteredChildren = [];
        if (node.children && node.children.length > 0) {
            filteredChildren = node.children.map(matchNode).filter(Boolean);
        }

        if (nameMatches || matMatches || matsMatch || filteredChildren.length > 0) {
            return {
                ...node,
                children: filteredChildren.length > 0 ? filteredChildren : node.children
            };
        }

        return null;
    };

    return nodes.map(matchNode).filter(Boolean);
};

// --- Sub-Components ---

// Context Menu Portal
const ItemContextMenu = ({ isOpen, onClose, anchorRef, onRename, onDelete, itemName }) => {
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPos({
            top: rect.top + rect.height / 2,
            left: rect.right + 10
        });

        const handleScroll = () => onClose();
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen, anchorRef, onClose]);

    if (!isOpen || typeof document === "undefined") return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[99998]"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            <div
                style={{ top: pos.top, left: pos.left, transform: "translateY(-50%)" }}
                className="fixed z-[99999] bg-white rounded-[0.6vw] shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200 py-[0.3vw] px-[0.25vw] min-w-[8.5vw] animate-in fade-in zoom-in-95 duration-150"
            >
                <div className="flex flex-col gap-[0.1vw]">
                    {onRename && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                onRename();
                            }}
                            className="w-full flex items-center gap-[0.45vw] px-[0.6vw] py-[0.35vw] hover:bg-gray-50 cursor-pointer rounded-[0.4vw] text-gray-700 transition-colors group"
                        >
                            <Icon icon="mdi:edit-outline" className="w-[0.9vw] h-[0.9vw] text-gray-400 group-hover:text-indigo-600 transition-colors" />
                            <span className="text-[0.68vw] font-medium text-gray-700 group-hover:text-gray-900">Rename</span>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                onDelete();
                            }}
                            className="w-full flex items-center gap-[0.45vw] px-[0.6vw] py-[0.35vw] hover:bg-red-50 cursor-pointer rounded-[0.4vw] text-red-600 transition-colors group"
                        >
                            <Icon icon="solar:trash-bin-trash-linear" className="w-[0.9vw] h-[0.9vw] text-red-500 group-hover:text-red-700 transition-colors" />
                            <span className="text-[0.68vw] font-medium">Delete</span>
                        </button>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
};

// Material Row (for Materials Tab)
const MaterialRow = ({
    material,
    selected,
    onSelect,
    isVisible = true,
    onToggleVisibility,
    onDelete,
    onRename,
    parentGroup
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(material.name);
    const btnRef = useRef(null);

    const handleRenameSubmit = () => {
        if (tempName.trim() !== "" && tempName !== material.name) {
            onRename && onRename(material.name, tempName, parentGroup);
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
            setTempName(material.name);
            setIsEditing(false);
        }
    };

    return (
        <div
            onClick={(e) =>
                onSelect({
                    name: material.name,
                    material: material.name,
                    parentGroup: parentGroup,
                    isShift: e.shiftKey
                })
            }
            data-mat-name={material.name}
            className={`group/mat relative flex items-center justify-between py-[0.3vw] px-[0.45vw] rounded-[0.4vw] text-[0.7vw] cursor-pointer transition-all border my-[0.05vw] select-none min-w-full w-max ${
                selected
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold shadow-xs"
                    : "border-transparent text-gray-700 hover:bg-gray-100/70"
            } ${!isVisible ? "opacity-40" : ""}`}
        >
            <div className="flex items-center gap-[0.35vw] min-w-0 pr-[0.5vw]">
                <div
                    className={`w-[1.1vw] h-[1.1vw] rounded-[0.28vw] flex items-center justify-center shrink-0 ${
                        selected
                            ? "bg-indigo-100 text-[#5d5efc]"
                            : "bg-gray-100 text-gray-500 group-hover/mat:text-[#5d5efc] group-hover/mat:bg-indigo-50"
                    } transition-colors`}
                >
                    <Icon icon="solar:palette-bold-duotone" width="0.75vw" height="0.75vw" />
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
                        className="bg-white border border-indigo-300 rounded px-[0.2vw] py-[0.05vw] text-[0.7vw] text-gray-900 font-semibold outline-none"
                    />
                ) : (
                    <span className="whitespace-nowrap font-semibold tracking-tight">{material.name}</span>
                )}

                <span
                    className={`text-[0.52vw] font-bold px-[0.3vw] py-[0.05vw] rounded-[0.22vw] shrink-0 whitespace-nowrap ${
                        selected
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-400 group-hover/mat:text-gray-600"
                    }`}
                >
                    {material.count} {material.count === 1 ? "part" : "parts"}
                </span>
            </div>

            <div
                className={`flex items-center gap-[0.12vw] shrink-0 ml-[0.2vw] ${
                    isMenuOpen || selected || !isVisible ? "opacity-100" : "opacity-0 group-hover/mat:opacity-100"
                } transition-opacity`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility && onToggleVisibility(material.name, isVisible);
                    }}
                    className="p-[0.16vw] rounded-[0.2vw] hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title={isVisible ? "Hide material" : "Show material"}
                >
                    <Icon icon={isVisible ? "ph:eye-bold" : "ph:eye-closed-bold"} width="0.72vw" height="0.72vw" />
                </button>

                <button
                    ref={btnRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-[0.16vw] rounded-[0.2vw] hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Options"
                >
                    <Icon icon="ph:dots-three-bold" width="0.72vw" height="0.72vw" />
                </button>

                <ItemContextMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    anchorRef={btnRef}
                    itemName={material.name}
                    onRename={() => setIsEditing(true)}
                    onDelete={onDelete ? () => onDelete(material.name) : null}
                />
            </div>
        </div>
    );
};

// Hierarchy Tree Node (Compact Indentation, Discrete Single-Mesh Selection, Working Visibility & Delete)
const TreeNode = ({
    node,
    depth = 0,
    parentGroup = "",
    selectedMaterial,
    onSelect,
    hiddenMaterials,
    onToggleVisibility,
    onDelete,
    onRename,
    onDeleteModel,
    checkIfSelected,
    searchTerm = "",
    forceExpand = null
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const btnRef = useRef(null);

    const isGroup = Boolean(node.isGroup || (Array.isArray(node.children) && node.children.length > 0));
    const nodeName = node.name || node.group || "Node";
    const [tempName, setTempName] = useState(nodeName);
    const nodeMaterials = node.materials || (node.material ? [node.material] : []);

    // Accurate selection check (identifies individual mesh UUID / mesh Name vs whole group)
    const isNodeSelected = checkIfSelected(nodeMaterials[0] || nodeName, parentGroup, node);

    useEffect(() => {
        if (forceExpand !== null) {
            setIsOpen(forceExpand);
        }
    }, [forceExpand]);

    useEffect(() => {
        if (searchTerm) {
            setIsOpen(true);
            return;
        }
        if (!selectedMaterial) return;
        const selName = typeof selectedMaterial === "object" ? selectedMaterial.name : selectedMaterial;
        if (nodeMaterials.includes(selName)) {
            setIsOpen(true);
        }
    }, [selectedMaterial, nodeMaterials, searchTerm]);

    const handleRenameSubmit = () => {
        if (tempName.trim() !== "" && tempName !== nodeName) {
            onRename && onRename(nodeName, tempName, parentGroup);
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
            setTempName(nodeName);
            setIsEditing(false);
        }
    };

    if (isGroup) {
        const childCount = node.children ? node.children.length : node.materials ? node.materials.length : 0;
        const allGroupHidden = nodeMaterials.length > 0 && nodeMaterials.every((m) => hiddenMaterials?.has(m));

        return (
            <div className="w-full my-[0.03vw]">
                {/* Folder Row */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect({
                            name: nodeName,
                            isGroup: true,
                            materials: nodeMaterials,
                            parentGroup: parentGroup || nodeName,
                            isShift: e.shiftKey
                        });
                    }}
                    className={`group/row relative flex items-center justify-between py-[0.22vw] px-[0.32vw] rounded-[0.32vw] cursor-pointer transition-all border select-none min-w-full w-max ${
                        isNodeSelected
                            ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs font-semibold"
                            : "border-transparent hover:bg-gray-100/70 text-gray-700"
                    } ${allGroupHidden ? "opacity-45" : ""}`}
                    title={`Group: ${nodeName} (${childCount} items)`}
                >
                    <div className="flex items-center gap-[0.22vw] min-w-0 pr-[0.4vw]">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            className="w-[0.8vw] h-[0.8vw] flex items-center justify-center rounded-[0.15vw] text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors shrink-0 cursor-pointer"
                        >
                            <Icon
                                icon="heroicons:chevron-down-20-solid"
                                width="0.65vw"
                                height="0.65vw"
                                className={`transition-transform duration-150 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                            />
                        </button>

                        <Icon
                            icon={isOpen ? "solar:folder-open-bold-duotone" : "solar:folder-bold-duotone"}
                            width="0.78vw"
                            height="0.78vw"
                            className={`shrink-0 transition-colors ${
                                isNodeSelected
                                    ? "text-[#5d5efc]"
                                    : "text-amber-500/80 group-hover/row:text-amber-500"
                            }`}
                        />

                        {isEditing ? (
                            <input
                                autoFocus
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white border border-indigo-300 rounded px-[0.2vw] py-[0.04vw] text-[0.68vw] text-gray-900 font-semibold outline-none"
                            />
                        ) : (
                            <span className="whitespace-nowrap text-[0.68vw] font-semibold text-gray-800 tracking-tight">
                                {nodeName}
                            </span>
                        )}

                        <span
                            className={`text-[0.5vw] font-bold px-[0.25vw] py-[0.03vw] rounded-[0.18vw] shrink-0 whitespace-nowrap ${
                                isNodeSelected
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-gray-100 text-gray-400 group-hover/row:text-gray-600"
                            }`}
                        >
                            {childCount}
                        </span>
                    </div>

                    <div
                        className={`flex items-center gap-[0.1vw] shrink-0 ml-[0.15vw] ${
                            isMenuOpen || isNodeSelected || allGroupHidden
                                ? "opacity-100"
                                : "opacity-0 group-hover/row:opacity-100"
                        } transition-opacity`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {node.isModel && node.id && onDeleteModel && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteModel(node.id);
                                }}
                                className="p-[0.14vw] rounded-[0.18vw] hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete model"
                            >
                                <Icon icon="solar:trash-bin-trash-linear" width="0.68vw" height="0.68vw" />
                            </button>
                        )}

                        <button
                            ref={btnRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className="p-[0.14vw] rounded-[0.18vw] hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                            title="More options"
                        >
                            <Icon icon="ph:dots-three-bold" width="0.68vw" height="0.68vw" />
                        </button>

                        <ItemContextMenu
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            anchorRef={btnRef}
                            itemName={nodeName}
                            onRename={() => setIsEditing(true)}
                            onDelete={node.id && onDeleteModel ? () => onDeleteModel(node.id) : null}
                        />
                    </div>
                </div>

                {/* Subtree with ultra-compact left guide line */}
                {isOpen && (
                    <div className="ml-[0.32vw] pl-[0.28vw] border-l-[0.06vw] border-gray-200/80 my-[0.02vw] space-y-[0.02vw]">
                        {node.children && node.children.length > 0
                            ? node.children.map((childNode, cIdx) => (
                                  <TreeNode
                                      key={childNode.id || `${nodeName}_child_${cIdx}`}
                                      node={childNode}
                                      depth={depth + 1}
                                      parentGroup={nodeName}
                                      selectedMaterial={selectedMaterial}
                                      onSelect={onSelect}
                                      hiddenMaterials={hiddenMaterials}
                                      onToggleVisibility={onToggleVisibility}
                                      onDelete={onDelete}
                                      onRename={onRename}
                                      onDeleteModel={onDeleteModel}
                                      checkIfSelected={checkIfSelected}
                                      searchTerm={searchTerm}
                                      forceExpand={forceExpand}
                                  />
                              ))
                            : node.materials &&
                              node.materials.map((mat, matIdx) => {
                                  const isMatVisible = !hiddenMaterials?.has(mat);
                                  const isSelected = checkIfSelected(mat, nodeName, { name: mat });
                                  return (
                                      <div
                                          key={matIdx}
                                          onClick={(e) =>
                                              onSelect({
                                                  name: mat,
                                                  material: mat,
                                                  parentGroup: nodeName,
                                                  isShift: e.shiftKey
                                              })
                                          }
                                          data-mat-name={mat}
                                          className={`group/item flex items-center justify-between py-[0.18vw] px-[0.3vw] rounded-[0.3vw] text-[0.68vw] cursor-pointer transition-all border min-w-full w-max ${
                                              isSelected
                                                  ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold"
                                                  : "border-transparent text-gray-700 hover:bg-gray-100/60"
                                          } ${!isMatVisible ? "opacity-40" : ""}`}
                                      >
                                          <div className="flex items-center gap-[0.22vw] min-w-0 pr-[0.35vw]">
                                              <Icon
                                                  icon="solar:palette-bold-duotone"
                                                  width="0.74vw"
                                                  height="0.74vw"
                                                  className={`shrink-0 ${isSelected ? "text-[#5d5efc]" : "text-gray-400 group-hover/item:text-gray-600"}`}
                                              />
                                              <span className="whitespace-nowrap">{mat}</span>
                                          </div>
                                          <div
                                              className={`flex items-center gap-[0.1vw] shrink-0 ${
                                                  isSelected || !isMatVisible ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
                                              }`}
                                              onClick={(e) => e.stopPropagation()}
                                          >
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      onToggleVisibility && onToggleVisibility(mat, isMatVisible);
                                                  }}
                                                  className="p-[0.14vw] rounded-[0.18vw] hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                                  title={isMatVisible ? "Hide material" : "Show material"}
                                              >
                                                  <Icon
                                                      icon={isMatVisible ? "ph:eye-bold" : "ph:eye-closed-bold"}
                                                      width="0.68vw"
                                                      height="0.68vw"
                                                  />
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                    </div>
                )}
            </div>
        );
    }

    // Leaf Mesh Part
    const targetMat = node.material || (node.materials && node.materials[0]) || nodeName;
    const isVisible = !hiddenMaterials?.has(targetMat) && !hiddenMaterials?.has(nodeName);

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onSelect({
                    name: targetMat,
                    material: targetMat,
                    meshUuid: node.meshUuid || node.id,
                    meshName: nodeName,
                    parentGroup: parentGroup,
                    isShift: e.shiftKey
                });
            }}
            data-mat-name={targetMat}
            className={`group/row relative flex items-center justify-between py-[0.2vw] px-[0.32vw] rounded-[0.32vw] text-[0.68vw] cursor-pointer transition-all border my-[0.02vw] select-none min-w-full w-max ${
                isNodeSelected
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold shadow-xs"
                    : "border-transparent text-gray-700 hover:bg-gray-100/60"
            } ${!isVisible ? "opacity-40" : ""}`}
            title={`Part: ${nodeName}${targetMat ? ` (Material: ${targetMat})` : ""}`}
        >
            <div className="flex items-center gap-[0.22vw] min-w-0 pr-[0.4vw]">
                <Icon
                    icon="solar:box-minimalistic-bold-duotone"
                    width="0.74vw"
                    height="0.74vw"
                    className={`shrink-0 ${
                        isNodeSelected ? "text-[#5d5efc]" : "text-gray-400 group-hover/row:text-indigo-500"
                    } transition-colors`}
                />

                {isEditing ? (
                    <input
                        autoFocus
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border border-indigo-300 rounded px-[0.2vw] py-[0.04vw] text-[0.68vw] text-gray-900 font-semibold outline-none"
                    />
                ) : (
                    <span className="whitespace-nowrap font-medium text-gray-800">{nodeName}</span>
                )}

                {node.material && node.material !== nodeName && (
                    <span
                        className={`text-[0.5vw] font-semibold px-[0.25vw] py-[0.03vw] rounded-[0.18vw] shrink-0 whitespace-nowrap border ${
                            isNodeSelected
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                : "bg-gray-100 text-gray-500 border-gray-200/60 group-hover/row:border-gray-300"
                        }`}
                        title={`Material: ${node.material}`}
                    >
                        {node.material}
                    </span>
                )}
            </div>

            <div
                className={`flex items-center gap-[0.1vw] shrink-0 ml-[0.15vw] ${
                    isMenuOpen || isNodeSelected || !isVisible ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
                } transition-opacity`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility && onToggleVisibility(targetMat, isVisible);
                    }}
                    className="p-[0.14vw] rounded-[0.18vw] hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title={isVisible ? "Hide element" : "Show element"}
                >
                    <Icon icon={isVisible ? "ph:eye-bold" : "ph:eye-closed-bold"} width="0.68vw" height="0.68vw" />
                </button>

                <button
                    ref={btnRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-[0.14vw] rounded-[0.18vw] hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Options"
                >
                    <Icon icon="ph:dots-three-bold" width="0.68vw" height="0.68vw" />
                </button>

                <ItemContextMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    anchorRef={btnRef}
                    itemName={nodeName}
                    onRename={() => setIsEditing(true)}
                    onDelete={onDelete ? () => onDelete(targetMat) : null}
                />
            </div>
        </div>
    );
};

// --- Main Component ---

export default function MaterialList({
    isCollapsed,
    setIsCollapsed,
    isTextureOpen,
    materials = [],
    selectedMaterial,
    onSelect,
    modelName,
    onToggleVisibility,
    onDeleteMaterial,
    onRenameMaterial,
    onDeleteModel,
    hiddenMaterials = new Set()
}) {
    // Mode tabs: "materials" (default direct list) | "tree" (hierarchy outliner)
    const [viewMode, setViewMode] = useState("materials");
    const [searchTerm, setSearchTerm] = useState("");
    const [forceExpand, setForceExpand] = useState(null);

    // Properly toggle visibility to parent (takes current visibility and sends target state)
    const handleToggleVisibility = (matName, isCurrentlyVisible) => {
        if (onToggleVisibility) {
            onToggleVisibility(matName, !isCurrentlyVisible);
        }
    };

    const handleDelete = (matName) => {
        if (onDeleteMaterial) {
            onDeleteMaterial(matName);
        }
    };

    // Accurate selection matcher distinguishing individual mesh from entire material/group
    const checkIfSelected = (matName, parentG = null, node = null) => {
        if (!selectedMaterial) return false;

        // 1. Group / Folder selection
        if (selectedMaterial.isGroup) {
            if (node?.isGroup) {
                return selectedMaterial.name === node.name || selectedMaterial.name === matName;
            }
            return Array.isArray(selectedMaterial.materials) && selectedMaterial.materials.includes(matName);
        }

        const selName = selectedMaterial.name || selectedMaterial;
        const selMeshUuid = selectedMaterial.meshUuid || selectedMaterial.uuid;
        const selMeshName = selectedMaterial.meshName;

        // 2. Specific Mesh selection in Outliner Tree
        if (node && !node.isGroup) {
            const nodeUuid = node.meshUuid || node.id;
            const nodeName = node.name;

            // If a specific mesh UUID was selected, check match
            if (selMeshUuid && nodeUuid) {
                return selMeshUuid === nodeUuid;
            }
            // If a specific mesh name was selected, check match
            if (selMeshName && nodeName) {
                return selMeshName === nodeName;
            }
        }

        // 3. Material level selection (e.g. from Materials Tab or direct material string)
        if (parentG && selectedMaterial.parentGroup) {
            return selName === matName && selectedMaterial.parentGroup === parentG;
        }
        return selName === matName;
    };

    // Auto-scroll to selected element
    useEffect(() => {
        if (!selectedMaterial) return;
        const matName = typeof selectedMaterial === "object" ? selectedMaterial.name : selectedMaterial;
        if (!matName || matName === (modelName || "Model") || matName === "Multiple Selection") return;

        const timer = setTimeout(() => {
            const element = document.querySelector(`[data-mat-name="${matName}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedMaterial, modelName, viewMode]);

    // Data parsing
    const rawTreeData = useMemo(() => getNormalizedTreeData(materials), [materials]);
    const treeData = useMemo(() => simplifyTree(rawTreeData), [rawTreeData]);
    const uniqueMaterialsList = useMemo(() => extractUniqueMaterials(treeData), [treeData]);

    // Search filters
    const filteredTree = useMemo(() => filterTreeNodes(treeData, searchTerm), [treeData, searchTerm]);
    const filteredMaterials = useMemo(() => {
        if (!searchTerm.trim()) return uniqueMaterialsList;
        const q = searchTerm.toLowerCase().trim();
        return uniqueMaterialsList.filter((m) => m.name.toLowerCase().includes(q));
    }, [uniqueMaterialsList, searchTerm]);

    // Toggle All Visibility
    const allMaterialsHidden = useMemo(() => {
        if (uniqueMaterialsList.length === 0) return false;
        return uniqueMaterialsList.every((m) => hiddenMaterials?.has(m.name));
    }, [uniqueMaterialsList, hiddenMaterials]);

    const handleToggleAllVisibility = () => {
        if (!onToggleVisibility) return;
        const targetVisible = allMaterialsHidden; // if all hidden -> show all (true), else hide all (false)
        uniqueMaterialsList.forEach((m) => {
            const isHidden = hiddenMaterials?.has(m.name);
            if (targetVisible && isHidden) {
                onToggleVisibility(m.name, true); // unhide/show
            } else if (!targetVisible && !isHidden) {
                onToggleVisibility(m.name, false); // hide
            }
        });
    };

    const isEntireModelSelected =
        selectedMaterial === (modelName || "Model") ||
        (selectedMaterial && selectedMaterial.name === (modelName || "Model"));

    return (
        <div className="relative z-40 flex flex-col w-[17.5vw] min-w-[16vw] max-w-[22vw] select-none font-sans">
            {/* --- STATIC FLOATING HEADER PILL --- */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center justify-between gap-[0.6vw] bg-white px-[0.75vw] h-[2.5vw] border border-gray-200 pointer-events-auto transition-all duration-300 cursor-pointer ${
                    !isCollapsed ? "rounded-t-[0.62vw] border-b-transparent shadow-xs" : "rounded-[0.62vw] shadow-sm hover:border-gray-300"
                }`}
            >
                <div className="flex items-center gap-[0.45vw] min-w-0">
                    <div className="w-[1.4vw] h-[1.4vw] rounded-[0.35vw] bg-indigo-50/80 text-[#5d5efc] flex items-center justify-center shrink-0">
                        <Icon icon="solar:layers-minimalistic-bold-duotone" width="0.95vw" height="0.95vw" />
                    </div>
                    <span className="text-[0.78vw] font-bold text-gray-800 tracking-tight whitespace-nowrap">
                        Materials
                    </span>
                    <span className="bg-gray-100 text-gray-500 text-[0.58vw] font-bold px-[0.35vw] py-[0.1vw] rounded-[0.28vw] shrink-0">
                        {uniqueMaterialsList.length}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center border border-gray-100 hover:bg-gray-50 rounded-[0.4vw] transition-all group cursor-pointer ${
                        !isCollapsed ? "bg-gray-50" : "bg-white"
                    }`}
                    title={isCollapsed ? "Expand panel" : "Collapse panel"}
                >
                    <Icon
                        icon="heroicons:chevron-up-20-solid"
                        width="0.9vw"
                        height="0.9vw"
                        className={`text-gray-500 group-hover:text-gray-900 transition-transform duration-300 ${
                            isCollapsed ? "rotate-180" : "rotate-0"
                        }`}
                    />
                </button>
            </div>

            {/* --- DROPDOWN INSPECTOR CARD --- */}
            <div
                className={`absolute top-full left-0 w-full bg-white border border-gray-200 border-t-0 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out flex flex-col pointer-events-auto overflow-hidden ${
                    isCollapsed
                        ? "max-h-0 opacity-0 -translate-y-[0.3vw] scale-98 pointer-events-none rounded-[0.62vw]"
                        : "opacity-100 translate-y-0 scale-100 rounded-b-[0.62vw] pb-[0.4vw]"
                }`}
                style={{
                    maxHeight: isCollapsed ? "0" : isTextureOpen ? "calc(92vh - 22.5vw)" : "calc(92vh - 13.5vw)"
                }}
            >
                {!isCollapsed && (
                    <>
                        {/* --- VIEW MODE TABS --- */}
                        <div className="px-[0.55vw] pt-[0.35vw] pb-[0.15vw]">
                            <div className="flex bg-gray-100/80 p-[0.18vw] rounded-[0.45vw] gap-[0.15vw]">
                                <button
                                    onClick={() => setViewMode("materials")}
                                    className={`flex-1 py-[0.25vw] px-[0.3vw] rounded-[0.35vw] text-[0.65vw] font-bold flex items-center justify-center gap-[0.3vw] transition-all cursor-pointer ${
                                        viewMode === "materials"
                                            ? "bg-white text-[#5d5efc] shadow-xs"
                                            : "text-gray-500 hover:text-gray-800"
                                    }`}
                                    title="View all unique materials directly"
                                >
                                    <Icon icon="solar:palette-bold-duotone" width="0.75vw" height="0.75vw" />
                                    <span>Materials</span>
                                    <span className="text-[0.52vw] px-[0.25vw] py-[0.02vw] rounded-full bg-indigo-50 text-indigo-600 font-bold">
                                        {uniqueMaterialsList.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setViewMode("tree")}
                                    className={`flex-1 py-[0.25vw] px-[0.3vw] rounded-[0.35vw] text-[0.65vw] font-bold flex items-center justify-center gap-[0.3vw] transition-all cursor-pointer ${
                                        viewMode === "tree"
                                            ? "bg-white text-[#5d5efc] shadow-xs"
                                            : "text-gray-500 hover:text-gray-800"
                                    }`}
                                    title="View model parts hierarchy tree"
                                >
                                    <Icon icon="solar:structure-bold-duotone" width="0.75vw" height="0.75vw" />
                                    <span>Hierarchy</span>
                                </button>
                            </div>
                        </div>

                        {/* --- SEARCH BAR --- */}
                        <div className="px-[0.55vw] pt-[0.15vw] pb-[0.15vw]">
                            <div className="relative group w-full">
                                <div className="absolute left-[0.45vw] top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5d5efc] transition-colors pointer-events-none">
                                    <Icon icon="heroicons:magnifying-glass-20-solid" width="0.75vw" height="0.75vw" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={viewMode === "materials" ? "Search materials..." : "Search hierarchy parts..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-[1.6vw] pr-[1.6vw] py-[0.3vw] bg-gray-50/90 border border-gray-200/80 rounded-[0.42vw] text-[0.68vw] font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-[0.45vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                        title="Clear search"
                                    >
                                        <Icon icon="heroicons:x-mark-20-solid" width="0.75vw" height="0.75vw" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- QUICK ACTION TOOLBAR --- */}
                        <div className="px-[0.55vw] py-[0.1vw] flex items-center justify-between text-gray-500">
                            {viewMode === "tree" ? (
                                <div className="flex items-center gap-[0.2vw]">
                                    <button
                                        onClick={() => setForceExpand(true)}
                                        className="px-[0.35vw] py-[0.15vw] rounded-[0.25vw] bg-gray-50 hover:bg-indigo-50 border border-gray-200/70 text-gray-600 hover:text-[#5d5efc] text-[0.55vw] font-semibold flex items-center gap-[0.2vw] transition-colors cursor-pointer"
                                        title="Expand all folders"
                                    >
                                        <Icon icon="solar:maximize-square-minimalistic-bold-duotone" width="0.65vw" height="0.65vw" />
                                        <span>Expand All</span>
                                    </button>
                                    <button
                                        onClick={() => setForceExpand(false)}
                                        className="px-[0.35vw] py-[0.15vw] rounded-[0.25vw] bg-gray-50 hover:bg-indigo-50 border border-gray-200/70 text-gray-600 hover:text-[#5d5efc] text-[0.55vw] font-semibold flex items-center gap-[0.2vw] transition-colors cursor-pointer"
                                        title="Collapse all folders"
                                    >
                                        <Icon icon="solar:minimize-square-minimalistic-bold-duotone" width="0.65vw" height="0.65vw" />
                                        <span>Collapse All</span>
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[0.55vw] text-gray-400 font-medium pl-[0.1vw]">
                                    {uniqueMaterialsList.length} materials in model
                                </span>
                            )}

                            <button
                                onClick={handleToggleAllVisibility}
                                className={`px-[0.35vw] py-[0.15vw] rounded-[0.25vw] border text-[0.55vw] font-semibold flex items-center gap-[0.2vw] transition-colors cursor-pointer ${
                                    allMaterialsHidden
                                        ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                                        : "border-gray-200/70 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-[#5d5efc]"
                                }`}
                                title={allMaterialsHidden ? "Show all components" : "Hide all components"}
                            >
                                <Icon
                                    icon={allMaterialsHidden ? "ph:eye-closed-bold" : "ph:eye-bold"}
                                    width="0.68vw"
                                    height="0.68vw"
                                />
                                <span>{allMaterialsHidden ? "Show All" : "Hide All"}</span>
                            </button>
                        </div>

                        {/* --- SCROLLABLE CONTENT LIST (HORIZONTALLY & VERTICALLY SCROLLABLE WITH ZERO EXTRA PADDING) --- */}
                        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-[0.4vw] pb-[0.3vw] mt-[0.1vw]">
                            {/* Sticky "Entire Model" option */}
                            {(!searchTerm || (modelName || "Model").toLowerCase().includes(searchTerm.toLowerCase())) && (
                                <div className="sticky top-0 bg-white z-10 pt-[0.1vw] pb-[0.2vw] min-w-full w-max">
                                    <div
                                        onClick={(e) =>
                                            onSelect({
                                                name: modelName || "Model",
                                                parentGroup: modelName || "Model",
                                                isShift: e.shiftKey
                                            })
                                        }
                                        className={`py-[0.28vw] px-[0.45vw] flex items-center gap-[0.35vw] text-[0.68vw] font-bold rounded-[0.38vw] cursor-pointer transition-all border ${
                                            isEntireModelSelected
                                                ? "bg-indigo-50 text-indigo-900 border-indigo-200 shadow-xs"
                                                : "bg-gray-50/90 text-gray-800 hover:bg-gray-100/80 border-gray-100"
                                        }`}
                                    >
                                        <Icon
                                            icon="solar:box-bold-duotone"
                                            width="0.82vw"
                                            height="0.82vw"
                                            className={`shrink-0 ${
                                                isEntireModelSelected ? "text-[#5d5efc]" : "text-gray-400"
                                            }`}
                                        />
                                        <span className="whitespace-nowrap">
                                            {modelName === "Scene" ? "Entire Scene" : modelName || "Entire Model"}
                                        </span>
                                        {isEntireModelSelected && (
                                            <Icon
                                                icon="heroicons:check-circle-20-solid"
                                                width="0.75vw"
                                                height="0.75vw"
                                                className="text-[#5d5efc] shrink-0"
                                            />
                                        )}
                                    </div>
                                    <div className="h-[0.05vw] bg-gray-100 mx-[0.2vw] mt-[0.2vw]" />
                                </div>
                            )}

                            {/* TAB 1: MATERIALS VIEW */}
                            {viewMode === "materials" && (
                                <div className="min-w-full w-max space-y-[0.03vw]">
                                    {filteredMaterials.length === 0 && (
                                        <div className="text-center py-[1.5vw] px-[0.5vw]">
                                            <Icon
                                                icon="solar:palette-linear"
                                                className="w-[1.5vw] h-[1.5vw] text-gray-300 mx-auto mb-[0.3vw]"
                                            />
                                            <p className="text-[0.65vw] text-gray-500 font-medium">
                                                {searchTerm ? `No materials matching "${searchTerm}"` : "No materials found"}
                                            </p>
                                        </div>
                                    )}

                                    {filteredMaterials.map((mat) => {
                                        const isSelected = checkIfSelected(mat.name, modelName);
                                        const isVisible = !hiddenMaterials?.has(mat.name);
                                        return (
                                            <MaterialRow
                                                key={mat.name}
                                                material={mat}
                                                selected={isSelected}
                                                onSelect={onSelect}
                                                isVisible={isVisible}
                                                onToggleVisibility={handleToggleVisibility}
                                                onDelete={handleDelete}
                                                onRename={onRenameMaterial}
                                                parentGroup={modelName}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* TAB 2: HIERARCHY OUTLINER TREE */}
                            {viewMode === "tree" && (
                                <div className="min-w-full w-max space-y-[0.03vw]">
                                    {filteredTree.length === 0 && (
                                        <div className="text-center py-[1.5vw] px-[0.5vw]">
                                            <Icon
                                                icon="solar:magnifer-linear"
                                                className="w-[1.5vw] h-[1.5vw] text-gray-300 mx-auto mb-[0.3vw]"
                                            />
                                            <p className="text-[0.65vw] text-gray-500 font-medium">
                                                {searchTerm ? `No parts matching "${searchTerm}"` : "No hierarchy found"}
                                            </p>
                                        </div>
                                    )}

                                    {filteredTree.map((item, idx) => (
                                        <TreeNode
                                            key={item.id || `root_${idx}`}
                                            node={item}
                                            depth={0}
                                            parentGroup={modelName}
                                            selectedMaterial={selectedMaterial}
                                            onSelect={onSelect}
                                            hiddenMaterials={hiddenMaterials}
                                            onToggleVisibility={handleToggleVisibility}
                                            onDelete={handleDelete}
                                            onRename={onRenameMaterial}
                                            onDeleteModel={onDeleteModel}
                                            checkIfSelected={checkIfSelected}
                                            searchTerm={searchTerm}
                                            forceExpand={forceExpand}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
