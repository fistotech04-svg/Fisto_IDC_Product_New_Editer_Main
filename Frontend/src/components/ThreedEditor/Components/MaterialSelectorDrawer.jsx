import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { textureData, fetchMaterials } from "../../../data/textureData";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";
import AddMaterial from "./AddMaterial";
import AlertModal from "../../../components/AlertModal";

export default function MaterialSelectorDrawer({
  isOpen = false,
  onClose,
  onSelectTexture,
  selectedTextureId,
  onSelectColor,
  selectedColor,
  onOpenAddMaterial,
  refreshTrigger
}) {
  const [activeTab, setActiveTab] = useState("predefined"); // "predefined" | "uploaded"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedTextures, setUploadedTextures] = useState([]);
  const [presetMaterialsList, setPresetMaterialsList] = useState(() => [...textureData]);
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [activeFolderMenuId, setActiveFolderMenuId] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [showInternalAddMaterial, setShowInternalAddMaterial] = useState(false);

  // High-performance direct DOM dragging refs
  const modalRef = useRef(null);
  const isDraggingRef = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });
  const startMouseRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const rAFRef = useRef(null);

  // Predefined categories from the reference UI
  const predefinedCategoryList = useMemo(() => [
    "All", "Metal", "Rock", "Floor", "Wall", "Glass", "Plastic", 
    "Wood", "Cloth", "Rubber", "Paper", "Fiber", "Skin", "X-Ray"
  ], []);

  useEffect(() => {
    fetchMaterials().then((loaded) => {
      if (Array.isArray(loaded) && loaded.length > 0) {
        setPresetMaterialsList([...loaded]);
      }
    });
  }, []);

  // Set default category when activeTab changes
  useEffect(() => {
    if (activeTab === "predefined") {
      setSelectedCategory("All");
    } else {
      if (fetchedCategories.length > 0) {
        setSelectedCategory(fetchedCategories[0].name);
      } else {
        setSelectedCategory("");
      }
    }
  }, [activeTab, fetchedCategories]);

  // Smooth Hardware-Accelerated Dragging
  const handleMouseDownHeader = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    
    isDraggingRef.current = true;
    startMouseRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: posRef.current.x, y: posRef.current.y };
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - startMouseRef.current.x;
      const deltaY = e.clientY - startMouseRef.current.y;
      
      posRef.current = {
        x: startPosRef.current.x + deltaX,
        y: startPosRef.current.y + deltaY
      };

      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      
      rAFRef.current = requestAnimationFrame(() => {
        if (modalRef.current) {
          modalRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
        }
      });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);

    const handleClickOutsideFolderMenu = (e) => {
      if (!e.target.closest('.folder-menu-container') && !e.target.closest('.folder-menu-btn')) {
        setActiveFolderMenuId(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutsideFolderMenu);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleClickOutsideFolderMenu);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const getUserEmail = () => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("user_profile");
      const u = stored ? JSON.parse(stored) : null;
      return u?.emailId || u?.email || null;
    } catch (_) {
      return null;
    }
  };

  // Fetch uploaded textures
  const fetchUploadedTextures = useCallback(async () => {
    const email = getUserEmail();
    if (!email) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/textures/get?email=${email}`);
      if (response.data.textures) {
        const mapped = response.data.textures.map(t => {
          const firstAvailableMap = t.maps ? Object.values(t.maps).find(url => Boolean(url)) : null;
          const previewUrl = t.maps?.preview || t.maps?.base || firstAvailableMap;
          return {
            id: t._id,
            name: t.materialName,
            category: typeof t.materialCategory === 'object' ? t.materialCategory?.name : (t.materialCategory || "Texture 1"),
            thumb: previewUrl,
            preview: previewUrl,
            maps: t.maps || {},
            isUploaded: true
          };
        });
        setUploadedTextures(mapped);
      }
    } catch (error) {
      console.error("Error fetching uploaded textures:", error);
    }
  }, []);

  // Fetch user categories / folders
  const fetchCategories = useCallback(async () => {
    const email = getUserEmail();
    if (!email) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/textures/categories/get?email=${email}`);
      if (response.data.categories) {
        setFetchedCategories(response.data.categories);
        if (response.data.categories.length > 0 && activeTab === "uploaded") {
          setSelectedCategory(prev => {
            const exists = response.data.categories.some(c => c.name.toLowerCase() === prev.toLowerCase());
            return exists ? prev : response.data.categories[0].name;
          });
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      fetchUploadedTextures();
      fetchCategories();
    }
  }, [isOpen, fetchUploadedTextures, fetchCategories, refreshTrigger]);

  // Handle Add Folder creation
  const handleCreateFolder = async (e) => {
    e?.preventDefault();
    const folderName = newFolderName.trim();
    if (!folderName) {
      setIsAddingFolder(false);
      return;
    }

    const email = getUserEmail();
    if (!email) return;

    try {
      setIsCreatingFolder(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/textures/categories/add`, {
        name: folderName,
        userEmail: email
      });
      setNewFolderName("");
      setIsAddingFolder(false);
      await fetchCategories();
      setSelectedCategory(folderName);
    } catch (err) {
      console.error("Error creating folder:", err);
      setFetchedCategories(prev => [...prev, { name: folderName, _id: 'local_' + Date.now() }]);
      setSelectedCategory(folderName);
      setNewFolderName("");
      setIsAddingFolder(false);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Handle Rename Folder
  const handleRenameFolder = async (folderId, newName) => {
    const cleanName = (newName || "").trim();
    if (!cleanName || !folderId) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.put(`${backendUrl}/api/textures/categories/rename/${folderId}`, {
        name: cleanName
      });
      setEditingFolderId(null);
      setEditingFolderName("");
      await fetchCategories();
      await fetchUploadedTextures();
      setSelectedCategory(cleanName);
    } catch (err) {
      console.error("Error renaming folder:", err);
      setEditingFolderId(null);
    }
  };

  // Handle Delete Folder
  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    setIsDeletingFolder(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.delete(`${backendUrl}/api/textures/categories/delete/${deletingFolder._id}`);
      setDeletingFolder(null);
      await fetchCategories();
      await fetchUploadedTextures();
      setSelectedCategory(prev => {
        const remaining = fetchedCategories.filter(c => c._id !== deletingFolder._id);
        return remaining.length > 0 ? remaining[0].name : "";
      });
    } catch (err) {
      console.error("Error deleting folder:", err);
    } finally {
      setIsDeletingFolder(false);
    }
  };

  // Uploaded category folder list (only real backend categories)
  const uploadedCategoryList = useMemo(() => {
    return fetchedCategories.map(c => c.name);
  }, [fetchedCategories]);

  // Map category aliases to textureData categories
  const categoryAliasMap = useMemo(() => ({
    "metal": ["metal", "metallic", "iron", "copper", "bronze", "silver", "gold", "steel"],
    "rock": ["rock", "stone", "concrete", "marble", "granite"],
    "floor": ["floor", "tiles", "brick", "paving", "ground"],
    "wall": ["wall", "plaster", "concrete", "paint"],
    "glass": ["glass", "transparent", "crystal"],
    "plastic": ["plastic", "synthetic", "pvc", "acrylic"],
    "wood": ["wood", "bark", "plank", "timber"],
    "cloth": ["cloth", "fabric", "textile", "cotton", "linen", "leather"],
    "rubber": ["rubber", "tire", "latex", "silicone"],
    "paper": ["paper", "cardboard"],
    "fiber": ["fiber", "carbon", "cloth", "fabric"],
    "skin": ["skin", "organic", "flesh", "leather"],
    "x-ray": ["xray", "x-ray", "transparent", "glass"]
  }), []);

  // Dedicated X-Ray Material Preset Definition
  const xrayMaterialPreset = useMemo(() => ({
    id: "mat_xray_preset",
    name: "X-Ray",
    category: "X-Ray",
    isXray: true,
    isPredefinedPreset: true,
    presetType: "xray",
    color: "#5ec4e0",
    emissiveColor: "#3a8fb0",
    emissiveIntensity: 100,
    roughness: 42,
    metallic: 0,
    alpha: 42,
    transparent: true,
    preview: null,
    maps: {}
  }), []);

  // Material list builder
  const activeMaterialsList = useMemo(() => {
    if (activeTab === "predefined") {
      const lowerCat = selectedCategory.toLowerCase();

      // Dedicated X-Ray Category -> Return ONLY the single X-Ray material
      if (lowerCat === "x-ray" || lowerCat === "xray") {
        return [xrayMaterialPreset];
      }

      // "All" Category -> Return all preset materials + X-Ray preset
      if (lowerCat === "all") {
        const nonNoneTextures = presetMaterialsList.filter(t => t.id !== "none");
        return [...nonNoneTextures, xrayMaterialPreset];
      }

      const matchingAliases = categoryAliasMap[lowerCat] || [lowerCat];
      
      let found = presetMaterialsList.filter(t => {
        if (t.id === "none") return false;
        const itemCat = (t.category || "").toLowerCase();
        const itemName = (t.name || "").toLowerCase();
        return matchingAliases.some(alias => itemCat.includes(alias) || itemName.includes(alias));
      });

      if (found.length < 8) {
        const standardNames = ["Sliver", "Iron", "Copper", "Bronze", "Steel", "Chrome", "Titanium", "Gold", "Brass", "Nickel", "Cobalt", "Platinum"];
        const placeholderCards = standardNames.slice(0, 12).map((matName, idx) => ({
          id: `pred_${lowerCat}_${idx}`,
          name: matName,
          category: selectedCategory,
          preview: null,
          isPredefinedPreset: true,
          presetType: matName.toLowerCase(),
          maps: {}
        }));
        
        if (found.length > 0) {
          return found;
        }
        return placeholderCards;
      }
      return found;
    } else {
      const userList = uploadedTextures.filter(t => {
        const tCat = (t.category || "").toLowerCase();
        return tCat === selectedCategory.toLowerCase();
      });
      return userList;
    }
  }, [activeTab, selectedCategory, uploadedTextures, categoryAliasMap, xrayMaterialPreset, presetMaterialsList]);

  // Filtered by Search Query
  const displayedMaterials = useMemo(() => {
    if (!searchQuery.trim()) return activeMaterialsList;
    const q = searchQuery.toLowerCase();
    return activeMaterialsList.filter(m => (m.name || "").toLowerCase().includes(q));
  }, [activeMaterialsList, searchQuery]);

  // Sphere preview styling generator
  const getSphereGradient = (name = "", presetType = "") => {
    const n = (name + " " + presetType).toLowerCase();
    if (n.includes("x-ray") || n.includes("xray")) {
      return "radial-gradient(circle at 35% 30%, #e0f7fa 0%, #00e5ff 40%, #0052cc 80%, #001033 100%)";
    }
    if (n.includes("sliver") || n.includes("silver") || n.includes("chrome") || n.includes("platinum")) {
      return "radial-gradient(circle at 30% 28%, #ffffff 0%, #d4d4d8 25%, #71717a 65%, #18181b 100%)";
    }
    if (n.includes("iron") || n.includes("steel") || n.includes("titanium") || n.includes("black")) {
      return "radial-gradient(circle at 32% 30%, #71717a 0%, #3f3f46 35%, #18181b 75%, #09090b 100%)";
    }
    if (n.includes("copper") || n.includes("amber") || n.includes("orange")) {
      return "radial-gradient(circle at 30% 28%, #fca5a5 0%, #991b1b 30%, #450a0a 75%, #1c0505 100%)";
    }
    if (n.includes("bronze") || n.includes("brass") || n.includes("gold")) {
      return "radial-gradient(circle at 30% 28%, #d97706 0%, #78350f 35%, #451a03 75%, #1e0b02 100%)";
    }
    return "radial-gradient(circle at 30% 28%, #e4e4e7 0%, #71717a 40%, #27272a 80%, #09090b 100%)";
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        ref={modalRef}
        className="absolute w-[30.8vw] min-w-[415px] max-w-[495px] max-h-[52vh] bg-white rounded-[1.1vw] shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-gray-100 z-50 flex flex-col overflow-hidden font-sans select-none will-change-transform animate-in fade-in zoom-in-95 duration-150"
        style={{ 
          right: "max(24vw, 320px)",
          top: "6.5vw",
          transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
        }}
      >
        {/* Top Drag Handle Indicator & Header Area (Draggable) */}
        <div 
          onMouseDown={handleMouseDownHeader}
          className="cursor-grab active:cursor-grabbing select-none bg-white hover:bg-gray-50/50 transition-colors"
        >
          <div className="w-full flex justify-center pt-[0.2vw] pb-0 shrink-0">
            <Icon 
              icon="material-symbols-light:drag-handle" 
              className="w-[1.5vw] h-[1.1vw] text-gray-400 hover:text-gray-600 transition-colors pointer-events-none" 
            />
          </div>

          {/* Header */}
          <div className="px-[1.1vw] pt-[0.1vw] pb-[0.45vw] flex items-start justify-between shrink-0">
            <div className="flex flex-col pointer-events-none">
              <h2 className="text-[0.95vw] font-bold text-gray-900 tracking-tight leading-none">
                Materials
              </h2>
              <p className="text-[0.62vw] text-gray-400 font-normal mt-[0.2vw]">
                Drag and Drop Material to your Model
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-[0.2vw] rounded-full hover:bg-gray-100 transition-colors cursor-pointer pointer-events-auto"
              aria-label="Close"
            >
              <Icon icon="ic:round-close" className="w-[0.95vw] h-[0.95vw]" />
            </button>
          </div>
        </div>

        {/* Tabs: Predefined Materials | Uploaded Materials */}
        <div className="px-[1.1vw] border-b border-gray-200/80 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setActiveTab("predefined")}
              className={`relative flex-1 py-[0.45vw] text-center text-[0.72vw] font-medium transition-colors cursor-pointer ${
                activeTab === "predefined"
                  ? "text-[#ea543a] font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Predefined Materials
              {activeTab === "predefined" && (
                <span className="absolute bottom-0 left-0 right-0 h-[0.14vw] bg-[#ea543a] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("uploaded")}
              className={`relative flex-1 py-[0.45vw] text-center text-[0.72vw] font-medium transition-colors cursor-pointer ${
                activeTab === "uploaded"
                  ? "text-[#ea543a] font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Uploaded Materials
              {activeTab === "uploaded" && (
                <span className="absolute bottom-0 left-0 right-0 h-[0.14vw] bg-[#ea543a] rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-[1.1vw] pt-[0.6vw] pb-[0.5vw] shrink-0">
          <div className="relative flex items-center">
            <Icon 
              icon="solar:magnifer-linear" 
              className="absolute left-[0.65vw] w-[0.8vw] h-[0.8vw] text-gray-400 pointer-events-none" 
            />
            <input
              type="text"
              placeholder="Search Material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-[1.8vw] pr-[0.8vw] py-[0.38vw] bg-gray-50/80 border border-gray-200/90 rounded-[0.45vw] text-[0.68vw] text-gray-800 placeholder-gray-400 outline-none focus:border-[#ea543a] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Main Content Area: Left Sidebar (Categories) + Right Grid (Materials) */}
        <div 
          className="flex-1 min-h-[220px] max-h-[38vh] h-[36vh] flex overflow-hidden border-t border-gray-100"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Left Vertical Categories Column */}
          <div 
            className="w-[6.8vw] min-w-[90px] max-w-[110px] h-auto max-h-[35vh] overflow-y-auto overflow-x-hidden overscroll-contain border-r border-gray-100 py-[0.3vw] flex flex-col shrink-0 custom-scrollbar"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-[0.15vw] flex-1">
              {activeTab === "predefined" ? (
                predefinedCategoryList.map((catName) => {
                  const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
                  return (
                    <div key={catName} className="relative px-[0.45vw]">
                      <button
                        onClick={() => setSelectedCategory(catName)}
                        className={`w-full text-left px-[0.6vw] py-[0.36vw] rounded-[0.35vw] text-[0.7vw] font-medium transition-all cursor-pointer truncate ${
                          isSelected
                            ? "bg-[#fff1ed] text-[#ea543a] font-semibold border-l-[0.18vw] border-[#ea543a]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {catName}
                      </button>
                    </div>
                  );
                })
              ) : (
                fetchedCategories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  const isEditing = editingFolderId === cat._id;
                  const isMenuOpen = activeFolderMenuId === cat._id;

                  return (
                    <div key={cat._id || cat.name} className="relative px-[0.45vw] group/folder">
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleRenameFolder(cat._id, editingFolderName);
                          }}
                          className="flex items-center gap-[0.15vw] py-[0.2vw]"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            className="w-full px-[0.3vw] py-[0.2vw] text-[0.65vw] border border-[#ea543a] rounded-[0.2vw] outline-none"
                          />
                          <button
                            type="submit"
                            className="p-[0.15vw] text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            title="Save"
                          >
                            <Icon icon="solar:check-read-linear" className="w-[0.75vw] h-[0.75vw]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFolderId(null);
                              setEditingFolderName("");
                            }}
                            className="p-[0.15vw] text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </form>
                      ) : (
                        <div className="relative flex items-center">
                          <button
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`w-full text-left pl-[0.6vw] pr-[1.4vw] py-[0.36vw] rounded-[0.35vw] text-[0.7vw] font-medium transition-all cursor-pointer truncate ${
                              isSelected
                                ? "bg-[#fff1ed] text-[#ea543a] font-semibold border-l-[0.18vw] border-[#ea543a]"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            title={cat.name}
                          >
                            {cat.name}
                          </button>

                          {/* 3-dots folder options menu button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFolderMenuId(isMenuOpen ? null : cat._id);
                            }}
                            className={`folder-menu-btn absolute right-[0.2vw] p-[0.15vw] rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 cursor-pointer transition-opacity ${
                              isMenuOpen ? "opacity-100" : "opacity-0 group-hover/folder:opacity-100"
                            }`}
                            title="Folder options"
                          >
                            <Icon icon="solar:menu-dots-bold" className="w-[0.65vw] h-[0.65vw]" />
                          </button>

                          {/* Options dropdown - positioned inside sidebar bounds */}
                          {isMenuOpen && (
                            <div className="folder-menu-container absolute right-[0.2vw] top-full mt-[0.15vw] z-50 bg-white border border-gray-200/90 rounded-[0.4vw] shadow-[0_4px_16px_rgba(0,0,0,0.15)] py-[0.2vw] w-[5.2vw] min-w-[70px] animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFolderMenuId(null);
                                  setEditingFolderId(cat._id);
                                  setEditingFolderName(cat.name);
                                }}
                                className="w-full text-left px-[0.45vw] py-[0.28vw] text-[0.6vw] text-gray-700 hover:bg-gray-50 flex items-center gap-[0.3vw] cursor-pointer"
                              >
                                <Icon icon="solar:pen-linear" className="w-[0.68vw] h-[0.68vw] text-gray-500" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFolderMenuId(null);
                                  setDeletingFolder(cat);
                                }}
                                className="w-full text-left px-[0.45vw] py-[0.28vw] text-[0.6vw] text-red-600 hover:bg-red-50 flex items-center gap-[0.3vw] cursor-pointer"
                              >
                                <Icon icon="solar:trash-bin-trash-linear" className="w-[0.68vw] h-[0.68vw] text-red-500" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {activeTab === "uploaded" && fetchedCategories.length === 0 && (
                <div className="px-[0.5vw] py-[1vw] text-center text-[0.58vw] text-gray-400">
                  No folders yet. Click + Add Folder below.
                </div>
              )}
            </div>

            {/* Add Folder Button in Uploaded Materials Tab */}
            {activeTab === "uploaded" && (
              <div className="p-[0.35vw] pt-[0.5vw] border-t border-gray-100 mt-auto shrink-0">
                {isAddingFolder ? (
                  <form onSubmit={handleCreateFolder} className="flex flex-col gap-[0.2vw]">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Folder Name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full px-[0.3vw] py-[0.18vw] text-[0.6vw] border border-[#ea543a] rounded-[0.2vw] outline-none"
                      disabled={isCreatingFolder}
                    />
                    <div className="flex items-center gap-[0.15vw]">
                      <button
                        type="submit"
                        disabled={isCreatingFolder}
                        className="flex-1 py-[0.15vw] bg-[#ea543a] text-white text-[0.58vw] rounded-[0.2vw] font-bold cursor-pointer"
                      >
                        {isCreatingFolder ? "Adding..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingFolder(false);
                          setNewFolderName("");
                        }}
                        className="px-[0.2vw] py-[0.15vw] text-gray-500 hover:text-gray-800 text-[0.58vw] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingFolder(true)}
                    className="w-full flex items-center gap-[0.2vw] px-[0.35vw] py-[0.3vw] text-[#ea543a] hover:bg-[#fff1ed] rounded-[0.3vw] text-[0.62vw] font-semibold transition-colors cursor-pointer"
                  >
                    <Icon icon="ic:round-plus" className="w-[0.75vw] h-[0.75vw]" />
                    <span>Add Folder</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Materials Grid (4 Columns) */}
          <div 
            className="flex-1 h-auto max-h-[35vh] min-w-0 overflow-y-auto overscroll-contain px-[0.7vw] py-[0.5vw] custom-scrollbar"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-x-[0.45vw] gap-y-[0.55vw]">
              {/* First Item: Upload Button Box in Uploaded Materials */}
              {activeTab === "uploaded" && (
                <div
                  onClick={() => {
                    if (onOpenAddMaterial) onOpenAddMaterial(selectedCategory);
                    else setShowInternalAddMaterial(true);
                  }}
                  className="flex flex-col items-center gap-[0.25vw] group cursor-pointer"
                >
                  <div className="w-[3.3vw] h-[3.3vw] min-w-[42px] min-h-[42px] rounded-[0.6vw] border-[0.1vw] border-dashed border-gray-300 hover:border-[#ea543a] bg-gray-50 hover:bg-[#fff1ed]/40 flex items-center justify-center transition-all group-hover:scale-105 shadow-2xs">
                    <Icon 
                      icon="solar:upload-linear" 
                      className="w-[1.05vw] h-[1.05vw] min-w-[15px] min-h-[15px] text-gray-400 group-hover:text-[#ea543a] transition-colors" 
                    />
                  </div>
                  <span className="text-[0.58vw] font-medium text-gray-600 group-hover:text-[#ea543a] text-center truncate w-full px-[0.1vw]">
                    Upload
                  </span>
                </div>
              )}

              {/* Material Cards */}
              {displayedMaterials.map((item) => {
                const isSelected = selectedTextureId === item.id;
                const imageSrc = item.preview ? resolveUploadsPath(item.preview) : (item.thumb ? resolveUploadsPath(item.thumb) : null);
                const sphereGradient = getSphereGradient(item.name, item.presetType);

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => onSelectTexture && onSelectTexture(item)}
                    className="flex flex-col items-center gap-[0.25vw] group cursor-pointer"
                  >
                    <div 
                      className={`w-[3.3vw] h-[3.3vw] min-w-[42px] min-h-[42px] rounded-[0.6vw] overflow-hidden bg-gray-100 border border-gray-200/60 flex items-center justify-center transition-all group-hover:scale-105 relative ${
                        isSelected 
                          ? "ring-[0.14vw] ring-[#ea543a] ring-offset-1 border-[#ea543a]" 
                          : "hover:border-gray-300 hover:shadow-xs"
                      }`}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.name}
                          className="w-full h-full object-cover p-[0.1vw]"
                          loading="lazy"
                        />
                      ) : (
                        <div 
                          className="w-full h-full rounded-[0.5vw]" 
                          style={{ background: sphereGradient }}
                        />
                      )}
                    </div>
                    <span 
                      title={item.name}
                      className={`text-[0.58vw] font-medium text-center w-full truncate px-[0.1vw] transition-colors ${
                        isSelected ? "text-[#ea543a] font-semibold" : "text-gray-700 group-hover:text-gray-900"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {displayedMaterials.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-[2vw] text-gray-400 gap-[0.3vw]">
                <Icon icon="solar:box-minimalistic-linear" className="w-[1.8vw] h-[1.8vw] opacity-40" />
                <span className="text-[0.65vw] font-medium">No materials in this category</span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>
      </div>

      {showInternalAddMaterial && (
        <AddMaterial
          isOpen={showInternalAddMaterial}
          initialCategory={selectedCategory}
          onClose={() => setShowInternalAddMaterial(false)}
          onUpdateSuccess={() => {
            fetchUploadedTextures();
            fetchCategories();
          }}
        />
      )}

      {/* Delete Folder Confirmation Alert */}
      {deletingFolder && (
        <AlertModal
          isOpen={!!deletingFolder}
          type="error"
          title="Delete Folder?"
          message={`Are you sure you want to delete the folder "${deletingFolder.name}" and all materials inside it? This action cannot be undone.`}
          confirmText="Delete Folder"
          cancelText="Cancel"
          showCancel={true}
          onConfirm={handleDeleteFolder}
          onClose={() => setDeletingFolder(null)}
          isLoading={isDeletingFolder}
        />
      )}
    </>
  );
}