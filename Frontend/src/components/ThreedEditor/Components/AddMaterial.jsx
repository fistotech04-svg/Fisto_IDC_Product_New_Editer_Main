import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { X, Upload, Check, AlertCircle, Edit3, ChevronDown } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/CustomToast";

export default function AddMaterial({ isOpen, onClose }) {
  const [materialName, setMaterialName] = useState("");
  const [category, setCategory] = useState("");
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for all maps
  const [maps, setMaps] = useState({
    preview: null,
    base: null,
    metallic: null,
    roughness: null,
    normal: null,
    ao: null,
    displacement: null,
    opacity: null,
    emissive: null
  });

  const [mapFiles, setMapFiles] = useState({
    preview: null,
    base: null,
    metallic: null,
    roughness: null,
    normal: null,
    ao: null,
    displacement: null,
    opacity: null,
    emissive: null
  });

  const handleMapUpload = (id, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMaps(prev => ({ ...prev, [id]: url }));
    setMapFiles(prev => ({ ...prev, [id]: file }));
  };

  const uploadFileInChunks = async (file, id, email, material, field) => {
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${id}_${Date.now()}`;
    let finalUrl = null;

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunkIndex", i);
        formData.append("totalChunks", totalChunks);
        formData.append("uploadId", uploadId);
        formData.append("fileName", file.name);
        formData.append("userEmail", email);
        formData.append("materialName", material);
        formData.append("fieldName", field);
        formData.append("chunk", chunk);

        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/textures/upload-chunk`, formData);
        
        if (i === totalChunks - 1) {
            finalUrl = response.data.url;
        }
    }
    return finalUrl;
  };

  const handleAddMaterial = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const email = user?.emailId;
    
    if (!email) {
        toast.error("User session not found. Please login again.");
        return;
    }

    if (!materialName.trim()) {
        toast.error("Please enter a material name.");
        return;
    }

    if (!category.trim()) {
        toast.error("Please enter a material category.");
        return;
    }

    // Required Surface Maps check
    const requiredMaps = ["base", "metallic", "roughness", "normal"];
    const missingMaps = requiredMaps.filter(m => !mapFiles[m]);
    
    if (missingMaps.length > 0) {
        toast.error(`Please upload all required surface maps: ${missingMaps.join(", ").toUpperCase()}`);
        return;
    }

    setIsSubmitting(true);
    
    try {
        const uploadedMaps = {};
        const mapKeys = Object.keys(mapFiles).filter(key => mapFiles[key]);
        
        // Sequential chunked upload for all provided files
        for (const key of mapKeys) {
            uploadedMaps[key] = await uploadFileInChunks(mapFiles[key], key, email, materialName, key);
        }

        // Finalize material creation in DB
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/textures/add`, {
            userEmail: email,
            materialName,
            materialCategory: category,
            maps: uploadedMaps
        });

        if (response.status === 201) {
            toast.success("Material created successfully!");
            // Reset state
            setMaterialName("");
            setCategory("");
            setMaps({
                preview: null, base: null, metallic: null, roughness: null, normal: null,
                ao: null, displacement: null, opacity: null, emissive: null
            });
            setMapFiles({
                preview: null, base: null, metallic: null, roughness: null, normal: null,
                ao: null, displacement: null, opacity: null, emissive: null
            });
            onClose();
        }
    } catch (error) {
        console.error("Upload Error:", error);
        toast.error(error.response?.data?.message || "Failed to add material. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const scrollRef = useRef(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 10);
      setShowBottomShadow(scrollHeight > scrollTop + clientHeight + 10);
  };

  useEffect(() => {
     // Initial check for shadows
     handleScroll();
     window.addEventListener('resize', handleScroll);
     return () => window.removeEventListener('resize', handleScroll);
  }, [isOpen]);

  if (!isOpen) return null;

  const MapUploadBox = ({ label, id, isRequired = false, isSmall = false }) => {
    const fileInputRef = useRef(null);
    const hasTexture = !!maps[id];

    return (
      <div className={`flex flex-col items-center ${isSmall ? 'w-[10vw]' : 'w-[12vw]'}`}>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*"
          onChange={(e) => handleMapUpload(id, e.target.files[0])}
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full ${isSmall ? 'h-[8.5vw]' : 'h-[10vw]'} border-[0.12vw] border-dashed ${hasTexture ? 'border-transparent' : 'border-gray-300'} rounded-[0.8vw] bg-gray-50 flex flex-col items-center justify-between py-[0.8vw] px-[0.5vw] hover:bg-gray-100 hover:border-[#5d5efc] transition-all cursor-pointer group relative overflow-hidden shadow-sm`}
        >
          {hasTexture ? (
             <>
               {/* Texture Preview */}
               <img src={maps[id]} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-[0.7vw]" />
               
               {/* Black Gradient Shadow at bottom */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
               
               {/* White Label at bottom */}
               <div className="absolute bottom-[0.8vw] left-0 right-0 px-[0.5vw] flex items-center justify-center z-20">
                  <span className="text-[0.8vw] font-bold text-white tracking-tight drop-shadow-sm">{label}</span>
               </div>
             </>
          ) : (
            <>
              {/* Label inside the box at the top */}
              <div className="text-[0.8vw] font-bold text-gray-900 flex items-center gap-[0.2vw] z-10">
                {label} {isRequired && <span className="text-red-500">*</span>}
              </div>
              
              <div className="flex flex-col items-center gap-[0.4vw] z-10">
                <Icon icon="heroicons:arrow-up-tray-20-solid" width="1.4vw" className="text-gray-400 group-hover:text-[#5d5efc] transition-colors" />
              </div>

              <div className="flex flex-col items-center z-10">
                <span className="text-[0.55vw] font-medium text-gray-500">Click to <span className="text-[#5d5efc] font-bold">Upload</span> JPG or PNG</span>
                <span className="text-[0.5vw] text-gray-400 font-medium">(2048px recommended)</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-[50vw] max-h-[90vh] rounded-[1.2vw] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header - Fixed */}
        <div className="px-[2vw] pt-[1.5vw] pb-[1vw] flex items-start justify-between border-b border-gray-50">
          <div className="flex flex-col gap-[0.3vw] flex-1">
            <div className="flex items-center gap-[1vw]">
                <h2 className="text-[1.4vw] font-bold text-gray-900 tracking-tight whitespace-nowrap">Add New Material</h2>
                <div className="h-[0.1vw] bg-gray-100 flex-1 ml-[0.5vw]"></div>
            </div>
            <p className="text-[0.8vw] text-gray-500 font-medium">Upload texture maps to create a new material.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-[2vw] h-[2vw] rounded-full border border-red-200 text-red-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all ml-[2vw]"
          >
            <X size="1.2vw" />
          </button>
        </div>

        {/* Scrollable Content Container with relative wrapper for shadows */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* Top Shadow - Subtle Visibility */}
            <div className={`absolute top-0 left-0 right-0 h-[2.5vw] bg-gradient-to-b from-black/5 via-black/5 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} />

            {/* Scrollable Content Area */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto custom-scrollbar px-[2vw] py-[1.2vw] flex flex-col gap-[1.2vw]"
            >
          
          {/* Top Section: Preview & Settings - Reduced Size */}
          <div className="flex gap-[1.5vw] bg-gray-200 p-[1.2vw] rounded-[0.8vw] border border-gray-100">
            {/* Main Preview Upload */}
            <div className="flex flex-col gap-[0.4vw]">
                <span className="text-[0.75vw] font-bold text-gray-900">Material Preview</span>
                <input 
                  type="file" 
                  id="preview-upload"
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleMapUpload('preview', e.target.files[0])}
                />
                <div 
                    onClick={() => document.getElementById('preview-upload').click()}
                    className={`w-[10vw] h-[8.5vw] border-[0.12vw] border-dashed ${maps.preview ? 'border-transparent' : 'border-gray-400'} rounded-[0.8vw] bg-white flex flex-col items-center justify-center gap-[0.8vw] hover:border-[#5d5efc] transition-all cursor-pointer group shadow-sm relative overflow-hidden`}
                >
                    {maps.preview ? (
                        <>
                            <img src={maps.preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-[0.7vw]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                            <div className="absolute bottom-[0.8vw] left-0 right-0 px-[0.5vw] flex items-center justify-center z-20">
                                <span className="text-[0.7vw] font-bold text-white tracking-tight drop-shadow-sm uppercase">Main Preview</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col items-center">
                                <span className="text-[0.55vw] font-medium text-gray-500">Drag & Drop or <span className="text-[#5d5efc] font-bold">Upload</span></span>
                            </div>
                            <Icon icon="heroicons:arrow-up-tray-20-solid" width="1.6vw" className="text-gray-400 group-hover:text-[#5d5efc] transition-all" />
                            <span className="text-[0.45vw] text-gray-400 font-bold uppercase tracking-wider">Supported File: JPG, PNG</span>
                        </>
                    )}
                </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 flex flex-col gap-[0.8vw] justify-center">
                <div className="flex flex-col gap-[0.4vw]">
                    <span className="text-[0.8vw] font-bold text-gray-900">Material Name</span>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Enter Texture Name"
                            value={materialName}
                            onChange={(e) => setMaterialName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-[0.5vw] px-[0.8vw] py-[0.6vw] text-[0.75vw] font-semibold text-gray-800 outline-none focus:border-gray-400 transition-all shadow-sm group-hover:border-gray-300"
                        />
                        <Edit3 size="0.9vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-all" />
                    </div>
                </div>

                <div className="flex flex-col gap-[0.4vw]">
                    <span className="text-[0.8vw] font-bold text-gray-900">Material Category</span>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Enter Category (e.g., Bike Texture)"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-[0.5vw] px-[0.8vw] py-[0.6vw] text-[0.75vw] font-semibold text-gray-800 outline-none focus:border-gray-400 transition-all shadow-sm group-hover:border-gray-300"
                        />
                        <Edit3 size="0.9vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-all" />
                    </div>
                </div>
            </div>
          </div>

          {/* Notes Alert */}
          <div className="bg-red-50/50 border border-red-100/50 py-[0.6vw] px-[1vw] rounded-[0.5vw] flex items-center gap-[0.6vw]">
            <AlertCircle size="1vw" className="text-red-500" />
            <p className="text-[0.7vw] font-medium text-gray-600">
                <span className="font-bold text-red-500 uppercase tracking-tight mr-[0.4vw]">Notes:</span>
                Upload the correct texture maps in their respective slots to achieve accurate material appearance.
            </p>
          </div>

          {/* Surface Maps Section */}
          <div className="flex flex-col gap-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
                <h3 className="text-[1vw] font-bold text-gray-900 tracking-tight">Surface Maps</h3>
                <span className="text-red-500 text-[1vw]">*</span>
                <div className="h-[0.1vw] flex-1 bg-gray-50 ml-[0.5vw]"></div>
            </div>
            <div className="grid grid-cols-4 gap-[1.5vw]">
                <MapUploadBox label="Base Map" id="base" isSmall />
                <MapUploadBox label="Metallic Map" id="metallic" isSmall />
                <MapUploadBox label="Roughness Map" id="roughness" isSmall />
                <MapUploadBox label="Normal Map" id="normal" isSmall />
            </div>
          </div>

          {/* Advanced Maps Section */}
          <div className="flex flex-col gap-[1vw]">
             <div className="flex items-center gap-[0.5vw]">
                <h3 className="text-[1vw] font-bold text-gray-900 tracking-tight">Advanced Maps <span className="text-gray-400 font-medium">(Optional)</span></h3>
                <div className="h-[0.1vw] flex-1 bg-gray-50 ml-[0.5vw]"></div>
             </div>
             <div className="grid grid-cols-4 gap-[1.5vw]">
                <MapUploadBox label="A/O Map" id="ao" isSmall />
                <MapUploadBox label="Displacement" id="displacement" isSmall />
                <MapUploadBox label="Opacity Map" id="opacity" isSmall />
                <MapUploadBox label="Emissive Map" id="emissive" isSmall />
            </div>
          </div>

          {/* Bottom Shadow - Corrected Position & Subtle Visibility */}
          <div className={`absolute bottom-0 left-0 right-0 h-[2.5vw] bg-gradient-to-t from-black/10 via-black/5 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        </div>

        {/* Footer Area - Fixed */}
        <div className="px-[2vw] py-[1.2vw] flex items-center justify-center gap-[1.5vw] border-t border-gray-100 bg-white">
            <button 
                onClick={onClose}
                className="flex-1 flex items-center cursor-pointer justify-center gap-[0.5vw] py-[0.8vw] border-[0.1vw] border-gray-800 rounded-[0.5vw] text-[0.85vw] font-bold text-gray-800 hover:bg-gray-50 transition-all shadow-sm"
            >
                <X size="1vw" />
                Cancel
            </button>
            <button 
                onClick={handleAddMaterial}
                disabled={isSubmitting}
                className={`flex-1 flex items-center cursor-pointer justify-center gap-[0.8vw] py-[0.8vw] bg-black text-white rounded-[0.5vw] text-[0.85vw] font-bold hover:bg-zinc-800 transition-all shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSubmitting ? (
                    <Icon icon="line-md:loading-twotone-loop" width="1.2vw" />
                ) : (
                    <Check size="1.2vw" />
                )}
                {isSubmitting ? "Creating..." : "Add Material"}
            </button>
        </div>

      </div>
    </div>
  );
}
