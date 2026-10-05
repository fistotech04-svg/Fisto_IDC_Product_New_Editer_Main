import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { textureData } from "../../../data/textureData";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

export default function MaterialSelectorDrawer({
  isOpen = false,
  onClose,
  onSelectTexture,
  selectedTextureId,
  onSelectColor,
  selectedColor,
  refreshTrigger
}) {
  const [mainTab, setMainTab] = useState("texture"); // "texture" | "color"
  const [activeTab, setActiveTab] = useState("predefined"); // "predefined" | "uploaded"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedTextures, setUploadedTextures] = useState([]);
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [selectedColorState, setSelectedColorState] = useState(null);

  const predefinedTextures = textureData;

  const colorMaterials = useMemo(() => [
    { 
      id: 'c-silver', name: 'Sliver Material', hex: '#c0c0c0', color: '#c0c0c0',
      normal: 50, roughness: 50, metallic: 80, ao: 50, bump: 50, alpha: 100,
      light: '#ffffff', dark: '#8a8a8a' 
    },
    { 
      id: 'c-black', name: 'Black Matte', hex: '#111111', color: '#111111',
      normal: 40, roughness: 85, metallic: 5, ao: 100, bump: 25, alpha: 100,
      light: '#555555', dark: '#000000' 
    },
    { 
      id: 'c-white', name: 'White Ceramic', hex: '#ffffff', color: '#ffffff',
      normal: 10, roughness: 15, metallic: 0, ao: 100, bump: 5, alpha: 100,
      light: '#ffffff', dark: '#cccccc' 
    },
    { 
      id: 'c-gray', name: 'Gray Industrial', hex: '#808080', color: '#808080',
      normal: 45, roughness: 50, metallic: 45, ao: 90, bump: 20, alpha: 100,
      light: '#bbbbbb', dark: '#444444' 
    },
    { 
      id: 'c-beige', name: 'Beige Satin', hex: '#d7c4b7', color: '#d7c4b7',
      normal: 30, roughness: 65, metallic: 10, ao: 95, bump: 15, alpha: 100,
      light: '#f0e6df', dark: '#a89487' 
    },
    { 
      id: 'c-brown', name: 'Brown Leather', hex: '#653818', color: '#653818',
      normal: 75, roughness: 70, metallic: 15, ao: 85, bump: 50, alpha: 100,
      light: '#995d31', dark: '#3b1d08' 
    },
    { 
      id: 'c-red', name: 'Red Coral', hex: '#ec5137', color: '#ec5137',
      normal: 50, roughness: 50, metallic: 50, ao: 50, bump: 50, alpha: 100,
      light: '#ff7a63', dark: '#b02a14' 
    },
    { 
      id: 'c-orange', name: 'Orange Amber', hex: '#fb8c00', color: '#fb8c00',
      normal: 25, roughness: 25, metallic: 20, ao: 95, bump: 10, alpha: 100,
      light: '#ffad42', dark: '#bb4d00' 
    },
    { 
      id: 'c-yellow', name: 'Yellow Neon', hex: '#fdd835', color: '#fdd835',
      normal: 10, roughness: 20, metallic: 10, ao: 100, bump: 5, alpha: 100,
      light: '#fff263', dark: '#c49000' 
    },
    { 
      id: 'c-green', name: 'Green Emerald', hex: '#43a047', color: '#43a047',
      normal: 40, roughness: 30, metallic: 75, ao: 90, bump: 25, alpha: 100,
      light: '#6abf69', dark: '#00600f' 
    },
    { 
      id: 'c-blue', name: 'Blue Metallic', hex: '#1e88e5', color: '#1e88e5',
      normal: 35, roughness: 25, metallic: 80, ao: 95, bump: 15, alpha: 100,
      light: '#63a4ff', dark: '#004ba0' 
    },
    { 
      id: 'c-navy', name: 'Navy Steel', hex: '#0d1b2a', color: '#0d1b2a',
      normal: 50, roughness: 28, metallic: 88, ao: 100, bump: 30, alpha: 100,
      light: '#2c3e50', dark: '#04080e' 
    },
    { 
      id: 'c-purple', name: 'Purple Velvet', hex: '#8e24aa', color: '#8e24aa',
      normal: 70, roughness: 80, metallic: 10, ao: 85, bump: 55, alpha: 100,
      light: '#ae52d4', dark: '#4a0072' 
    },
    { 
      id: 'c-gold', name: 'Gold Polished', hex: '#d4af37', color: '#d4af37',
      normal: 10, roughness: 8, metallic: 96, ao: 100, bump: 5, alpha: 100,
      light: '#ffe082', dark: '#997a15' 
    },
    { 
      id: 'c-bronze', name: 'Bronze Vintage', hex: '#cd7f32', color: '#cd7f32',
      normal: 65, roughness: 38, metallic: 88, ao: 90, bump: 40, alpha: 100,
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
    if (isOpen && (activeTab === "uploaded" || refreshTrigger)) {
      fetchUploadedTextures();
      fetchCategories();
    }
  }, [isOpen, activeTab, fetchUploadedTextures, fetchCategories, refreshTrigger]);

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

  const filteredTextures = useMemo(() => {
    let list = currentTextures.filter(t => t.id !== "none");
    if (selectedCategory !== "All") {
      list = list.filter(t => (t.category || "General").toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => (t.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [currentTextures, selectedCategory, searchQuery]);

  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) return colorMaterials;
    const q = searchQuery.toLowerCase();
    return colorMaterials.filter(c => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q));
  }, [colorMaterials, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-0 left-[15.5vw] min-w-[280px] max-w-[320px] w-[20vw] h-full bg-white z-40 border-r border-gray-200 shadow-2xl flex flex-col select-none font-sans animate-in slide-in-from-left duration-200"
      style={{ left: "max(15.5vw, 210px)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-[1vw] py-[0.75vw] border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-[0.5vw]">
          <div className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] bg-[#ea543a]/10 text-[#ea543a] flex items-center justify-center">
            <Icon icon="icon-park-outline:material-two" className="w-[1.05vw] h-[1.05vw]" />
          </div>
          <h3 className="text-[0.85vw] font-bold text-gray-900">Material Library</h3>
        </div>
        <button
          onClick={onClose}
          className="w-[1.6vw] h-[1.6vw] rounded-[0.35vw] flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Icon icon="ic:round-close" className="w-[1.1vw] h-[1.1vw]" />
        </button>
      </div>

      {/* ── Mode Switcher (Texture vs Color) ── */}
      <div className="px-[1vw] pt-[0.8vw] pb-[0.4vw] flex flex-col gap-[0.6vw] bg-gray-50/60 border-b border-gray-100 shrink-0">
        <div className="grid grid-cols-2 bg-gray-200/70 p-[0.2vw] rounded-[0.5vw] text-[0.72vw]">
          <button
            onClick={() => setMainTab("texture")}
            className={`py-[0.35vw] text-center font-bold rounded-[0.4vw] transition-all cursor-pointer ${
              mainTab === "texture"
                ? "bg-white text-[#ea543a] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Texture Material
          </button>
          <button
            onClick={() => setMainTab("color")}
            className={`py-[0.35vw] text-center font-bold rounded-[0.4vw] transition-all cursor-pointer ${
              mainTab === "color"
                ? "bg-white text-[#ea543a] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Color Material
          </button>
        </div>

        {/* Texture source switch: Predefined vs Uploaded */}
        {mainTab === "texture" && (
          <div className="flex items-center gap-[0.4vw]">
            <button
              onClick={() => setActiveTab("predefined")}
              className={`flex-1 py-[0.25vw] text-[0.68vw] font-semibold rounded-[0.35vw] border transition-colors cursor-pointer ${
                activeTab === "predefined"
                  ? "bg-[#ea543a] text-white border-[#ea543a]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              Default Library
            </button>
            <button
              onClick={() => setActiveTab("uploaded")}
              className={`flex-1 py-[0.25vw] text-[0.68vw] font-semibold rounded-[0.35vw] border transition-colors cursor-pointer ${
                activeTab === "uploaded"
                  ? "bg-[#ea543a] text-white border-[#ea543a]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              My Uploads
            </button>
          </div>
        )}

        {/* Search Box */}
        <div className="relative">
          <Icon icon="solar:magnifer-linear" className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw] text-gray-400" />
          <input
            type="text"
            placeholder={mainTab === "texture" ? "Search textures..." : "Search colors..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-[1.8vw] pr-[0.8vw] py-[0.35vw] bg-white border border-gray-200 rounded-[0.45vw] text-[0.72vw] text-gray-800 placeholder-gray-400 outline-none focus:border-[#ea543a]"
          />
        </div>
      </div>

      {/* ── Category Filter Pills (Textures only) ── */}
      {mainTab === "texture" && (
        <div className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] overflow-x-auto border-b border-gray-100 shrink-0 custom-scrollbar">
          {Object.keys(categories).map((catName) => {
            const isSel = selectedCategory.toLowerCase() === catName.toLowerCase();
            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-[0.6vw] py-[0.18vw] rounded-full text-[0.65vw] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSel
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {catName} ({categories[catName]})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Materials Grid ── */}
      <div className="flex-1 overflow-y-auto p-[1vw] custom-scrollbar">
        {mainTab === "color" ? (
          <div className="grid grid-cols-3 gap-[0.75vw]">
            {filteredColors.map((col) => {
              const activeColorVal = selectedColorState || selectedColor;
              const isSelected = activeColorVal && activeColorVal.toLowerCase() === col.hex.toLowerCase();
              const isMetallic = col.metallic >= 70;
              const isRough = col.roughness >= 70;

              const sphereBg = isMetallic
                ? `radial-gradient(circle at 28% 22%, #ffffff 0%, ${col.light} 28%, ${col.hex} 60%, ${col.dark} 100%)`
                : isRough
                ? `radial-gradient(circle at 45% 45%, ${col.light} 0%, ${col.hex} 70%, ${col.dark} 100%)`
                : `radial-gradient(circle at 35% 30%, ${col.light}, ${col.hex} 55%, ${col.dark} 100%)`;

              return (
                <div
                  key={col.id}
                  onClick={() => {
                    setSelectedColorState(col.hex);
                    onSelectColor && onSelectColor(col);
                  }}
                  className={`flex flex-col items-center gap-[0.3vw] p-[0.4vw] rounded-[0.6vw] border transition-all cursor-pointer group ${
                    isSelected
                      ? "border-[#ea543a] bg-[#ea543a]/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/80"
                  }`}
                >
                  <div
                    className="w-[3.6vw] h-[3.6vw] rounded-full shadow-md transition-transform group-hover:scale-105"
                    style={{ background: sphereBg }}
                  />
                  <span className={`text-[0.65vw] font-semibold text-center w-full truncate ${
                    isSelected ? "text-[#ea543a]" : "text-gray-700"
                  }`}>
                    {col.name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {filteredTextures.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-[3vw] text-gray-400 gap-[0.4vw]">
                <Icon icon="solar:box-minimalistic-linear" className="w-[2vw] h-[2vw] opacity-40" />
                <span className="text-[0.75vw] font-medium">No materials found</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[0.75vw]">
                {filteredTextures.map((item) => {
                  const isSelected = selectedTextureId === item.id;
                  const imageSrc = resolveUploadsPath(item.preview || item.thumb);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectTexture && onSelectTexture(item)}
                      className={`flex flex-col items-center gap-[0.3vw] p-[0.4vw] rounded-[0.6vw] border transition-all cursor-pointer group ${
                        isSelected
                          ? "border-[#ea543a] bg-[#ea543a]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/80"
                      }`}
                    >
                      <div className="w-[3.6vw] h-[3.6vw] rounded-full overflow-hidden shadow-md bg-gray-200 transition-transform group-hover:scale-105">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-gray-700 via-gray-400 to-gray-200" />
                        )}
                      </div>
                      <span className={`text-[0.65vw] font-semibold text-center w-full truncate ${
                        isSelected ? "text-[#ea543a]" : "text-gray-700"
                      }`}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.25vw;
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
