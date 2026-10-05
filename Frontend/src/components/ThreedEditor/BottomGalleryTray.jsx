import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { textureData } from "../../data/textureData";
import { resolveUploadsPath } from "../../utils/supabaseUtils";

export default function BottomGalleryTray({
  isVisible = true,
  onSelectTexture,
  selectedTextureId,
  onSelectColor,
  selectedColor,
  onAddMaterialClick,
  refreshTrigger
}) {
  const scrollRef = useRef(null);
  const [mainTab, setMainTab] = useState("texture"); // "texture" | "color"
  const [activeTab, setActiveTab] = useState("predefined"); // "predefined" | "uploaded"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploadedTextures, setUploadedTextures] = useState([]);
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [selectedColorState, setSelectedColorState] = useState(null);

  const predefinedTextures = textureData;

  const colorMaterials = useMemo(() => [
    { 
      id: 'c-black', name: 'Black Matte', hex: '#111111', color: '#111111',
      normal: 40, roughness: 85, metallic: 5, ao: 100, bump: 25, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#555555', dark: '#000000' 
    },
    { 
      id: 'c-white', name: 'White Ceramic', hex: '#ffffff', color: '#ffffff',
      normal: 10, roughness: 15, metallic: 0, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ffffff', dark: '#cccccc' 
    },
    { 
      id: 'c-gray', name: 'Gray Industrial', hex: '#808080', color: '#808080',
      normal: 45, roughness: 50, metallic: 45, ao: 90, bump: 20, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#bbbbbb', dark: '#444444' 
    },
    { 
      id: 'c-beige', name: 'Beige Satin', hex: '#d7c4b7', color: '#d7c4b7',
      normal: 30, roughness: 65, metallic: 10, ao: 95, bump: 15, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#f0e6df', dark: '#a89487' 
    },
    { 
      id: 'c-brown', name: 'Brown Leather', hex: '#653818', color: '#653818',
      normal: 75, roughness: 70, metallic: 15, ao: 85, bump: 50, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#995d31', dark: '#3b1d08' 
    },
    { 
      id: 'c-red', name: 'Red Car Gloss', hex: '#e53935', color: '#e53935',
      normal: 15, roughness: 12, metallic: 25, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ff6659', dark: '#9a0007' 
    },
    { 
      id: 'c-orange', name: 'Orange Amber', hex: '#fb8c00', color: '#fb8c00',
      normal: 25, roughness: 25, metallic: 20, ao: 95, bump: 10, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ffad42', dark: '#bb4d00' 
    },
    { 
      id: 'c-yellow', name: 'Yellow Neon Glow', hex: '#fdd835', color: '#fdd835',
      normal: 10, roughness: 20, metallic: 10, ao: 100, bump: 5, emissiveColor: '#fdd835', emissiveIntensity: 45,
      light: '#fff263', dark: '#c49000' 
    },
    { 
      id: 'c-green', name: 'Green Emerald', hex: '#43a047', color: '#43a047',
      normal: 40, roughness: 30, metallic: 75, ao: 90, bump: 25, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#6abf69', dark: '#00600f' 
    },
    { 
      id: 'c-blue', name: 'Blue Metallic', hex: '#1e88e5', color: '#1e88e5',
      normal: 35, roughness: 25, metallic: 80, ao: 95, bump: 15, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#63a4ff', dark: '#004ba0' 
    },
    { 
      id: 'c-navy', name: 'Navy Anodized Steel', hex: '#0d1b2a', color: '#0d1b2a',
      normal: 50, roughness: 28, metallic: 88, ao: 100, bump: 30, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#2c3e50', dark: '#04080e' 
    },
    { 
      id: 'c-purple', name: 'Purple Velvet', hex: '#8e24aa', color: '#8e24aa',
      normal: 70, roughness: 80, metallic: 10, ao: 85, bump: 55, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ae52d4', dark: '#4a0072' 
    },
    { 
      id: 'c-pink', name: 'Pink Pearl', hex: '#e91e63', color: '#e91e63',
      normal: 20, roughness: 18, metallic: 40, ao: 100, bump: 8, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ff6090', dark: '#b0003a' 
    },
    { 
      id: 'c-cyan', name: 'Cyan Glossy', hex: '#00acc1', color: '#00acc1',
      normal: 15, roughness: 14, metallic: 15, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#5ddef4', dark: '#007c91' 
    },
    { 
      id: 'c-teal', name: 'Teal Brushed Metal', hex: '#00897b', color: '#00897b',
      normal: 60, roughness: 42, metallic: 82, ao: 90, bump: 35, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#4ebaaa', dark: '#005b4f' 
    },
    { 
      id: 'c-gold', name: 'Gold Polished', hex: '#d4af37', color: '#d4af37',
      normal: 10, roughness: 8, metallic: 96, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ffe082', dark: '#997a15' 
    },
    { 
      id: 'c-silver', name: 'Silver Chrome', hex: '#c0c0c0', color: '#c0c0c0',
      normal: 5, roughness: 5, metallic: 98, ao: 100, bump: 2, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ffffff', dark: '#8a8a8a' 
    },
    { 
      id: 'c-bronze', name: 'Bronze Vintage', hex: '#cd7f32', color: '#cd7f32',
      normal: 65, roughness: 38, metallic: 88, ao: 90, bump: 40, emissiveColor: '#000000', emissiveIntensity: 0,
      light: '#ffa500', dark: '#8b4513' 
    }
  ], []);

  const fetchUploadedTextures = useCallback(async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user?.emailId) return;

    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/textures/get?email=${user.emailId}`);
      if (response.data.textures) {
        const mapped = response.data.textures.map(t => ({
          id: t._id,
          name: t.materialName,
          category: typeof t.materialCategory === 'object' ? t.materialCategory?.name : (t.materialCategory || "Custom"),
          thumb: t.maps.preview || t.maps.base,
          maps: t.maps,
          isUploaded: true
        }));
        setUploadedTextures(mapped);
      }
    } catch (error) {
      console.error("Error fetching uploaded textures:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user?.emailId) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/textures/categories/get?email=${user.emailId}`);
      if (response.data.categories) {
        setFetchedCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "uploaded" || refreshTrigger) {
      fetchUploadedTextures();
      fetchCategories();
    }
  }, [activeTab, fetchUploadedTextures, fetchCategories, refreshTrigger]);

  const currentTextures = activeTab === "predefined" ? predefinedTextures : uploadedTextures;

  const categories = useMemo(() => {
    const counts = {};
    currentTextures.forEach(t => {
      const cat = t.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const allCategoryNames = new Set();
    if (activeTab === "uploaded") {
      fetchedCategories.forEach(c => allCategoryNames.add(c.name));
    }
    Object.keys(counts).forEach(name => allCategoryNames.add(name));

    const realTextureCount = currentTextures.filter(t => t.id !== "none").length;
    const finalObj = { All: realTextureCount };
    Array.from(allCategoryNames).sort().forEach(name => {
      if (name !== "All") {
        finalObj[name] = counts[name] || 0;
      }
    });

    return finalObj;
  }, [currentTextures, fetchedCategories, activeTab]);

  useEffect(() => {
    setSelectedCategory("All");
  }, [activeTab]);

  const filteredTextures = useMemo(() => {
    const list = currentTextures.filter(t => t.id !== "none");
    if (selectedCategory === "All") return list;
    return list.filter(t => (t.category || "General").toLowerCase() === selectedCategory.toLowerCase());
  }, [currentTextures, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isDropdownOpen && !e.target.closest('.category-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 shrink-0 select-none relative w-full flex flex-col z-20">
      {/* ─── Top Filter & Subcategory Header ─── */}
      <div className="flex items-center justify-between px-[1.2vw] pt-[0.45vw] pb-[0.35vw] border-b border-gray-100 text-[0.72vw]">
        <div className="flex items-center gap-[1.2vw]">
          {/* Main Mode: Texture vs Color */}
          <div className="flex bg-[#f3f4f6] p-[0.2vw] rounded-[0.45vw] border border-gray-100 gap-[0.2vw]">
            <button 
              onClick={() => setMainTab("texture")}
              className={`px-[0.65vw] py-[0.22vw] text-[0.65vw] font-semibold rounded-[0.35vw] transition-all cursor-pointer ${
                mainTab === "texture" 
                  ? "bg-black text-white shadow-xs" 
                  : "bg-white text-gray-500 hover:text-gray-900"
              }`}
            >
              Texture Material
            </button>
            <button 
              onClick={() => setMainTab("color")}
              className={`px-[0.65vw] py-[0.22vw] text-[0.65vw] font-semibold rounded-[0.35vw] transition-all cursor-pointer ${
                mainTab === "color" 
                  ? "bg-black text-white shadow-xs" 
                  : "bg-white text-gray-500 hover:text-gray-900"
              }`}
            >
              Color Material
            </button>
          </div>

          {/* Subtabs: Predefined vs Uploaded (only in Texture mode) */}
          {mainTab === "texture" && (
            <div className="flex bg-[#f3f4f6] p-[0.2vw] rounded-[0.45vw] border border-gray-100 gap-[0.2vw]">
              <button 
                onClick={() => setActiveTab("predefined")}
                className={`px-[0.65vw] py-[0.22vw] text-[0.65vw] font-semibold rounded-[0.35vw] transition-all cursor-pointer ${
                  activeTab === "predefined" 
                    ? "bg-black text-white shadow-xs" 
                    : "bg-white text-gray-500 hover:text-gray-900"
                }`}
              >
                Predefined
              </button>
              <button 
                onClick={() => setActiveTab("uploaded")}
                className={`px-[0.65vw] py-[0.22vw] text-[0.65vw] font-semibold rounded-[0.35vw] transition-all cursor-pointer ${
                  activeTab === "uploaded" 
                    ? "bg-black text-white shadow-xs" 
                    : "bg-white text-gray-500 hover:text-gray-900"
                }`}
              >
                Uploaded
              </button>
            </div>
          )}

          {/* Category Dropdown (Filter categorized materials) */}
          {mainTab === "texture" && (
            <div className="flex items-center gap-[0.5vw]">
              <span className="text-[0.68vw] font-semibold text-gray-700">Category:</span>
              <div className="relative category-dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-[0.7vw] py-[0.25vw] bg-[#f3f4f6] hover:bg-gray-100 border border-gray-200/80 rounded-[0.45vw] flex items-center gap-[0.5vw] text-gray-800 font-semibold text-[0.68vw] cursor-pointer transition-colors"
                >
                  <span className="capitalize">{selectedCategory} ({categories[selectedCategory] || 0})</span>
                  <Icon icon="heroicons:chevron-down-20-solid" className={`w-[0.8vw] h-[0.8vw] text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-[0.3vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-2xl z-50 min-w-[9vw] max-h-[10vw] overflow-y-auto custom-scrollbar py-[0.2vw]">
                    {Object.entries(categories).map(([cat, count]) => {
                      const isSelected = cat.toLowerCase() === selectedCategory.toLowerCase();
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-[0.7vw] py-[0.35vw] text-[0.66vw] font-semibold flex items-center justify-between transition-colors cursor-pointer capitalize ${
                            isSelected
                              ? "bg-[#5d5efc] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[0.6vw] ${isSelected ? "text-white/80" : "text-gray-400"}`}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Upload Action if on uploaded tab */}
        {mainTab === "texture" && activeTab === "uploaded" && onAddMaterialClick && (
          <button
            onClick={onAddMaterialClick}
            className="flex items-center gap-[0.3vw] px-[0.65vw] py-[0.25vw] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-[0.4vw] font-semibold text-[0.65vw] border border-indigo-200 transition-all cursor-pointer"
          >
            <Icon icon="heroicons:plus-20-solid" className="w-[0.85vw] h-[0.85vw]" />
            <span>Add Material</span>
          </button>
        )}
      </div>

      {/* ─── Horizontal Scrollable Sphere Thumbnails ─── */}
      <div className="h-[6.5vw] px-[1.2vw] py-[0.35vw] flex items-center gap-[0.5vw] overflow-hidden relative w-full">
        {/* Scroll Left Button */}
        <button
          onClick={scrollLeft}
          className="w-[1.8vw] h-[1.8vw] rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all cursor-pointer shrink-0 z-10"
        >
          <Icon icon="heroicons:chevron-left-20-solid" className="w-[1.1vw] h-[1.1vw]" />
        </button>

        {/* Scrollable Gallery */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-[1.1vw] overflow-x-auto overflow-y-hidden custom-scrollbar py-[0.2vw] px-[0.4vw]"
        >
          {mainTab === "color" ? (
            colorMaterials.map((col) => {
              const activeColorVal = selectedColorState || selectedColor;
              const isSelected = activeColorVal && activeColorVal.toLowerCase() === col.hex.toLowerCase();
              const isMetallic = col.metallic >= 70;
              const isEmissive = col.emissiveIntensity > 0;
              const isRough = col.roughness >= 70;

              const sphereBg = isMetallic
                ? `radial-gradient(circle at 28% 22%, #ffffff 0%, ${col.light} 28%, ${col.hex} 60%, ${col.dark} 100%)`
                : isRough
                ? `radial-gradient(circle at 45% 45%, ${col.light} 0%, ${col.hex} 70%, ${col.dark} 100%)`
                : `radial-gradient(circle at 35% 30%, ${col.light}, ${col.hex} 55%, ${col.dark} 100%)`;

              const sphereShadow = isEmissive
                ? `0 0 12px ${col.hex}, inset -2px -4px 6px rgba(0,0,0,0.3)`
                : isMetallic
                ? `inset -2px -4px 6px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.25)`
                : `inset -2px -4px 6px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.2)`;

              return (
                <div
                  key={col.id}
                  onClick={() => {
                    setSelectedColorState(col.hex);
                    onSelectColor && onSelectColor(col);
                  }}
                  className="flex flex-col items-center gap-[0.25vw] cursor-pointer group shrink-0"
                  style={{ width: "4.8vw" }}
                >
                  <div
                    className={`w-[3.6vw] h-[3.6vw] rounded-[0.7vw] p-[0.2vw] bg-[#f3f4f6] border transition-all duration-200 overflow-hidden flex items-center justify-center ${
                      isSelected
                        ? "border-[#ea543a] ring-2 ring-[#ea543a]/20 scale-105 shadow-md"
                        : "border-gray-200 group-hover:border-gray-300 group-hover:scale-105 shadow-2xs"
                    }`}
                  >
                    <div
                      className="w-full h-full rounded-full transition-transform"
                      style={{ background: sphereBg, boxShadow: sphereShadow }}
                    />
                  </div>
                  <span
                    className={`text-[0.62vw] font-semibold text-center w-full truncate transition-colors ${
                      isSelected ? "text-[#ea543a]" : "text-gray-600 group-hover:text-gray-900"
                    }`}
                    title={col.name}
                  >
                    {col.name}
                  </span>
                </div>
              );
            })
          ) : (
            <>
              {filteredTextures.length === 0 && (
                <div className="flex items-center justify-center w-full py-[1vw] text-gray-400 font-medium text-[0.72vw]">
                  <span>No materials found in this category</span>
                </div>
              )}
              {filteredTextures.map((item) => {
                const isSelected = selectedTextureId === item.id;
                const imageSrc = resolveUploadsPath(item.preview || item.thumb);

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectTexture && onSelectTexture(item)}
                    className="flex flex-col items-center gap-[0.25vw] cursor-pointer group shrink-0"
                    style={{ width: "4.8vw" }}
                  >
                    {/* Sphere Thumbnail */}
                    <div
                      className={`w-[3.6vw] h-[3.6vw] rounded-[0.7vw] p-[0.2vw] bg-gradient-to-b from-gray-100 to-gray-200 border transition-all duration-200 overflow-hidden flex items-center justify-center ${
                        isSelected
                          ? "border-[#ea543a] ring-2 ring-[#ea543a]/20 scale-105 shadow-md"
                          : "border-gray-200 group-hover:border-gray-300 group-hover:scale-105 shadow-2xs"
                      }`}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-full shadow-inner"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-gray-700 via-gray-400 to-gray-200 shadow-inner" />
                      )}
                    </div>

                    {/* Title */}
                    <span
                      className={`text-[0.62vw] font-semibold text-center w-full truncate transition-colors ${
                        isSelected ? "text-[#ea543a]" : "text-gray-600 group-hover:text-gray-900"
                      }`}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={scrollRight}
          className="w-[1.8vw] h-[1.8vw] rounded-full bg-white hover:bg-gray-50 border border-gray-200/80 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all cursor-pointer shrink-0 z-10"
        >
          <Icon icon="heroicons:chevron-right-20-solid" className="w-[1.1vw] h-[1.1vw]" />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 0.25vw;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
