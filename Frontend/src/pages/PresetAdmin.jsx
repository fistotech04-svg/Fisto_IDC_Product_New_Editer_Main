import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import axios from "axios";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, Html } from "@react-three/drei";
import RenderModel from "../components/ThreedEditor/Components/ModelLoaders";
import { resolveUploadsPath } from "../utils/supabaseUtils";
import { fetchHdris } from "../data/hdriData";
import { fetchMaterials } from "../data/textureData";
import { useToast } from "../components/CustomToast";

// Auto-fit wrapper for 3D model viewer
const AutoFitPreview = ({ children, targetSize = 2.5 }) => {
  const groupRef = useRef();
  const [isFitted, setIsFitted] = useState(false);
  const fittedRef = useRef(false);

  const computeFit = useCallback(() => {
    const group = groupRef.current;
    if (!group) return false;

    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    group.rotation.set(0, 0, 0);
    group.updateMatrixWorld(true);

    const box = new THREE.Box3();
    let hasMesh = false;

    group.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        if (child.geometry) {
          if (!child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
          }
          child.updateWorldMatrix(true, false);
          const meshBox = new THREE.Box3().setFromObject(child);
          if (!meshBox.isEmpty()) {
            box.union(meshBox);
            hasMesh = true;
          }
        }
      }
    });

    if (!hasMesh || box.isEmpty()) return false;

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    if (!isFinite(maxDim) || maxDim <= 0.0001) return false;

    const center = new THREE.Vector3();
    box.getCenter(center);

    const scale = targetSize / maxDim;
    group.scale.setScalar(scale);
    group.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    group.updateMatrixWorld(true);

    return true;
  }, [targetSize]);

  useEffect(() => {
    fittedRef.current = false;
    setIsFitted(false);
  }, [children]);

  useFrame(() => {
    if (!fittedRef.current) {
      if (computeFit()) {
        fittedRef.current = true;
        setIsFitted(true);
      }
    }
  });

  return (
    <group ref={groupRef} visible={isFitted}>
      {children}
    </group>
  );
};

class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(err) {
    console.warn("[PresetAdmin] 3D Model preview error:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-200 text-center text-[10px] max-w-xs shadow-xs">
            <p className="font-semibold mb-0.5">Preview failed</p>
            <p className="text-[9px] text-red-500 break-all">{this.state.error?.message || "Format error"}</p>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

// Inline 3D card preview component for default model cards
const ModelCardThumbnail = ({ model }) => {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const modelUrl = resolveUploadsPath(model?.url || model?.modelUrl || model?.path);
  const thumbUrl = model?.thumbnailUrl ? resolveUploadsPath(model.thumbnailUrl) : null;

  useEffect(() => {
    if (thumbUrl || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [thumbUrl, modelUrl]);

  if (thumbUrl) {
    return (
      <img
        src={thumbUrl}
        alt={model.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center bg-gray-50 overflow-hidden">
      {isInView && modelUrl ? (
        <Canvas
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
          camera={{ fov: 35, position: [2.5, 2.0, 3.2] }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <directionalLight position={[-5, -2, -5]} intensity={0.5} />
          <Suspense
            fallback={
              <Html center className="pointer-events-none">
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-[#ea543a] rounded-full animate-spin" />
                  <span className="text-[9px] font-medium text-gray-400">Loading 3D...</span>
                </div>
              </Html>
            }
          >
            <Environment preset="city" />
            <AutoFitPreview targetSize={2.0}>
              <PreviewErrorBoundary>
                <RenderModel
                  url={modelUrl}
                  type={model.type || "glb"}
                  isSelectionDisabled={true}
                  shouldClone={true}
                />
              </PreviewErrorBoundary>
            </AutoFitPreview>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
              target={[0, 0, 0]}
              autoRotate={false}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Icon icon="solar:box-bold" className="w-10 h-10 text-[#ea543a]/70" />
          <span className="text-[10px] font-bold uppercase mt-1 tracking-wider text-gray-500">
            {model.type || "GLB"}
          </span>
        </div>
      )}
    </div>
  );
};

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").trim().replace(/\/+$/, "");

export default function PresetAdmin() {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("materials"); // 'materials' | 'hdris' | 'models'
  const [materials, setMaterials] = useState([]);
  const [hdris, setHdris] = useState([]);
  const [defaultModels, setDefaultModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Reset page whenever tab, category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCategory, searchQuery]);

  // Modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isHdriModalOpen, setIsHdriModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState(null);
  const [previewWireframe, setPreviewWireframe] = useState(false);
  const [previewAutoRotate, setPreviewAutoRotate] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'material' | 'hdri' | 'model'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag-and-drop state trackers
  const [isDraggingMatPreview, setIsDraggingMatPreview] = useState(false);
  const [isDraggingHdriPreview, setIsDraggingHdriPreview] = useState(false);
  const [isDraggingHdriFile, setIsDraggingHdriFile] = useState(false);
  const [isDraggingModelFile, setIsDraggingModelFile] = useState(false);
  const [draggingMapKey, setDraggingMapKey] = useState(null);

  // Form states for Material
  const [matForm, setMatForm] = useState({
    name: "",
    category: "General",
    color: "#ffffff",
    metallic: 0,
    roughness: 0.5,
    previewUrl: "",
    previewFile: null,
    maps: {},
    mapFiles: {}
  });

  // Form states for HDRI
  const [hdriForm, setHdriForm] = useState({
    name: "",
    category: "Day",
    previewUrl: "",
    previewFile: null,
    fileUrl: "",
    hdrFile: null
  });

  // Form states for Default 3D Model
  const [modelForm, setModelForm] = useState({
    name: "",
    category: "Furniture",
    description: "",
    modelFile: null,
    modelUrl: ""
  });

  const [modelPreviewBlobUrl, setModelPreviewBlobUrl] = useState(null);
  // Category suggestion states & refs for each modal
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const categoryContainerRef = useRef(null);

  const [showMatCategorySuggestions, setShowMatCategorySuggestions] = useState(false);
  const matCategoryContainerRef = useRef(null);

  const [showHdriCategorySuggestions, setShowHdriCategorySuggestions] = useState(false);
  const hdriCategoryContainerRef = useRef(null);

  // Close category suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(e.target)) {
        setShowCategorySuggestions(false);
      }
      if (matCategoryContainerRef.current && !matCategoryContainerRef.current.contains(e.target)) {
        setShowMatCategorySuggestions(false);
      }
      if (hdriCategoryContainerRef.current && !hdriCategoryContainerRef.current.contains(e.target)) {
        setShowHdriCategorySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up model preview object URL when changing or closing modal
  useEffect(() => {
    if (modelForm.modelFile) {
      const blobUrl = URL.createObjectURL(modelForm.modelFile);
      setModelPreviewBlobUrl(blobUrl);
      return () => URL.revokeObjectURL(blobUrl);
    } else {
      setModelPreviewBlobUrl(null);
    }
  }, [modelForm.modelFile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, hdriRes, modelRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/presets/materials`).catch(() => ({ data: { materials: [] } })),
        axios.get(`${BACKEND_URL}/api/presets/hdri`).catch(() => ({ data: { hdris: [] } })),
        axios.get(`${BACKEND_URL}/api/presets/models`).catch(() => ({ data: { models: [] } }))
      ]);

      if (matRes.data?.materials) {
        const normalized = matRes.data.materials.map(item => ({
          ...item,
          preview: item.preview ? resolveUploadsPath(item.preview) : null
        }));
        setMaterials(normalized);
      }
      if (hdriRes.data?.hdris) {
        const normalized = hdriRes.data.hdris.map(item => ({
          ...item,
          preview: item.preview ? resolveUploadsPath(item.preview) : null,
          file: item.file ? resolveUploadsPath(item.file) : null
        }));
        setHdris(normalized);
      }
      if (modelRes.data?.models) {
        const normalized = modelRes.data.models.map(item => ({
          ...item,
          thumbnailUrl: item.thumbnailUrl ? resolveUploadsPath(item.thumbnailUrl) : null,
          modelUrl: item.modelUrl ? resolveUploadsPath(item.modelUrl) : null
        }));
        setDefaultModels(normalized);
      }
    } catch (err) {
      console.error("Failed to load presets:", err);
      toast.error("Failed to load preset data from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter lists based on tab, category, and search
  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || m.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const filteredHdris = hdris.filter(h => {
    const matchSearch = h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        h.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || h.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const filteredModels = defaultModels.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || m.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Current active filtered list & pagination calculation
  const currentFilteredList = activeTab === "materials"
    ? filteredMaterials
    : activeTab === "hdris"
    ? filteredHdris
    : filteredModels;

  const totalItems = currentFilteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedMaterials = filteredMaterials.slice((safeCurrentPage - 1) * itemsPerPage, (safeCurrentPage - 1) * itemsPerPage + itemsPerPage);
  const paginatedHdris = filteredHdris.slice((safeCurrentPage - 1) * itemsPerPage, (safeCurrentPage - 1) * itemsPerPage + itemsPerPage);
  const paginatedModels = filteredModels.slice((safeCurrentPage - 1) * itemsPerPage, (safeCurrentPage - 1) * itemsPerPage + itemsPerPage);

  const categories = activeTab === "materials" 
    ? ["All", ...new Set(materials.map(m => m.category).filter(Boolean))]
    : activeTab === "hdris"
    ? ["All", ...new Set(hdris.map(h => h.category).filter(Boolean))]
    : ["All", ...new Set(defaultModels.map(m => m.category).filter(Boolean))];

  // Distinct existing categories for auto-suggestion dropdowns
  const existingModelCategories = Array.from(
    new Set(
      defaultModels
        .map(m => (m.category || "").trim())
        .filter(c => c && c.toLowerCase() !== "all")
    )
  );

  const matchedCategorySuggestions = existingModelCategories.filter(cat => {
    const currentVal = (modelForm.category || "").trim().toLowerCase();
    if (!currentVal) return true;
    return cat.toLowerCase().includes(currentVal);
  });

  const existingMatCategories = Array.from(
    new Set(
      materials
        .map(m => (m.category || "").trim())
        .filter(c => c && c.toLowerCase() !== "all")
    )
  );

  const matchedMatCategorySuggestions = existingMatCategories.filter(cat => {
    const currentVal = (matForm.category || "").trim().toLowerCase();
    if (!currentVal) return true;
    return cat.toLowerCase().includes(currentVal);
  });

  // Default HDRI categories along with any custom categories in database
  const defaultHdriCategories = ["Day", "Evening", "Indoor", "Night", "Studio", "Nature", "Urban"];
  const existingHdriCategories = Array.from(
    new Set([
      ...defaultHdriCategories,
      ...hdris.map(h => (h.category || "").trim()).filter(c => c && c.toLowerCase() !== "all")
    ])
  );

  const matchedHdriCategorySuggestions = existingHdriCategories.filter(cat => {
    const currentVal = (hdriForm.category || "").trim().toLowerCase();
    if (!currentVal) return true;
    return cat.toLowerCase().includes(currentVal);
  });

  // Material Modal Handlers
  const openNewMaterialModal = () => {
    setEditingItem(null);
    setMatForm({
      name: "",
      category: "Fabric",
      color: "#ffffff",
      metallic: 0,
      roughness: 0.5,
      previewUrl: "",
      previewFile: null,
      maps: {},
      mapFiles: {}
    });
    setIsMaterialModalOpen(true);
  };

  const openEditMaterialModal = (item) => {
    setEditingItem(item);
    setMatForm({
      name: item.name || "",
      category: item.category || "General",
      color: item.color || "#ffffff",
      metallic: item.metallic ?? 0,
      roughness: item.roughness ?? 0.5,
      previewUrl: item.preview || "",
      previewFile: null,
      maps: item.maps ? { ...item.maps } : {},
      mapFiles: {}
    });
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!matForm.name.trim()) {
      toast.error("Please provide a material name");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", matForm.name.trim());
      formData.append("category", matForm.category || "General");
      formData.append("color", matForm.color || "#ffffff");
      formData.append("metallic", matForm.metallic);
      formData.append("roughness", matForm.roughness);

      if (matForm.previewFile) {
        formData.append("preview", matForm.previewFile);
      } else if (matForm.previewUrl) {
        formData.append("previewUrl", matForm.previewUrl);
      }

      const existingMaps = { ...matForm.maps };
      formData.append("maps", JSON.stringify(existingMaps));

      Object.entries(matForm.mapFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      if (editingItem) {
        await axios.put(`${BACKEND_URL}/api/presets/materials/${editingItem.id}`, formData);
        toast.success("Material preset updated successfully!");
      } else {
        await axios.post(`${BACKEND_URL}/api/presets/materials`, formData);
        toast.success("New material preset created successfully!");
      }

      setIsMaterialModalOpen(false);
      await loadData();
      await fetchMaterials(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save material preset");
    } finally {
      setIsSubmitting(false);
    }
  };

  // HDRI Modal Handlers
  const openNewHdriModal = () => {
    setEditingItem(null);
    setHdriForm({
      name: "",
      category: "Day",
      previewUrl: "",
      previewFile: null,
      fileUrl: "",
      hdrFile: null
    });
    setIsHdriModalOpen(true);
  };

  const openEditHdriModal = (item) => {
    setEditingItem(item);
    setHdriForm({
      name: item.name || "",
      category: item.category || "Day",
      previewUrl: item.preview || "",
      previewFile: null,
      fileUrl: item.file || "",
      hdrFile: null
    });
    setIsHdriModalOpen(true);
  };

  const handleSaveHdri = async (e) => {
    e.preventDefault();
    if (!hdriForm.name.trim()) {
      toast.error("Please provide an HDRI name");
      return;
    }

    if (!editingItem && !hdriForm.previewFile && !hdriForm.previewUrl) {
      toast.error("Please provide a preview image");
      return;
    }

    if (!editingItem && !hdriForm.hdrFile && !hdriForm.fileUrl) {
      toast.error("Please upload or provide an HDR/EXR file");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", hdriForm.name.trim());
      formData.append("category", hdriForm.category || "Day");

      if (hdriForm.previewFile) {
        formData.append("preview", hdriForm.previewFile);
      } else if (hdriForm.previewUrl) {
        formData.append("previewUrl", hdriForm.previewUrl);
      }

      if (hdriForm.hdrFile) {
        formData.append("file", hdriForm.hdrFile);
      } else if (hdriForm.fileUrl) {
        formData.append("fileUrl", hdriForm.fileUrl);
      }

      if (editingItem) {
        await axios.put(`${BACKEND_URL}/api/presets/hdri/${editingItem.id}`, formData);
        toast.success("HDRI preset updated successfully!");
      } else {
        await axios.post(`${BACKEND_URL}/api/presets/hdri`, formData);
        toast.success("New HDRI preset created successfully!");
      }

      setIsHdriModalOpen(false);
      await loadData();
      await fetchHdris(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save HDRI preset");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default Model Modal Handlers
  const openNewModelModal = () => {
    setEditingItem(null);
    setModelForm({
      name: "",
      category: "Furniture",
      description: "",
      modelFile: null,
      modelUrl: ""
    });
    setIsModelModalOpen(true);
  };

  const openEditModelModal = (item) => {
    setEditingItem(item);
    setModelForm({
      name: item.name || "",
      category: item.category || "General",
      description: item.description || "",
      modelFile: null,
      modelUrl: item.url || ""
    });
    setIsModelModalOpen(true);
  };

  const handleSaveModel = async (e) => {
    e.preventDefault();
    if (!modelForm.name.trim()) {
      toast.error("Please provide a model name");
      return;
    }

    if (!editingItem && !modelForm.modelFile && !modelForm.modelUrl) {
      toast.error("Please upload a 3D model file (.glb / .gltf / .obj / .stl)");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", modelForm.name.trim());
      formData.append("category", modelForm.category || "General");
      formData.append("description", modelForm.description || "");

      if (modelForm.modelFile) {
        formData.append("model", modelForm.modelFile);
      } else if (modelForm.modelUrl) {
        formData.append("modelUrl", modelForm.modelUrl);
      }

      if (editingItem) {
        await axios.put(`${BACKEND_URL}/api/presets/models/${editingItem.id}`, formData);
        toast.success("Default 3D model updated successfully!");
      } else {
        await axios.post(`${BACKEND_URL}/api/presets/models`, formData);
        toast.success("New default 3D model added successfully!");
      }

      setIsModelModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save default model");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteItem = async () => {
    if (!deleteConfirmItem || !deleteType) return;
    setIsSubmitting(true);
    try {
      if (deleteType === "material") {
        await axios.delete(`${BACKEND_URL}/api/presets/materials/${deleteConfirmItem.id}`);
        toast.success(`Material "${deleteConfirmItem.name}" deleted.`);
        await loadData();
        await fetchMaterials(true);
      } else if (deleteType === "hdri") {
        await axios.delete(`${BACKEND_URL}/api/presets/hdri/${deleteConfirmItem.id}`);
        toast.success(`HDRI "${deleteConfirmItem.name}" deleted.`);
        await loadData();
        await fetchHdris(true);
      } else if (deleteType === "model") {
        await axios.delete(`${BACKEND_URL}/api/presets/models/${deleteConfirmItem.id}`);
        toast.success(`Default Model "${deleteConfirmItem.name}" deleted.`);
        await loadData();
      }
      setDeleteConfirmItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete preset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans overflow-y-auto">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 relative flex items-center justify-between">
          {/* Left: Back Action */}
          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => navigate("/editor/threed_editor")}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer"
              title="Return to 3D Editor"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-[#ea543a]" />
              <span className="hidden sm:inline">Back to 3D Editor</span>
            </button>
          </div>

          {/* Center: Brand Title & Icon */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a] shadow-2xs shrink-0">
              <Icon icon="solar:palette-bold" className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-base font-bold text-gray-900 leading-tight tracking-tight">3D Asset Studio</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Curate materials, environments & models for users</p>
            </div>
          </div>

          {/* Right: Add Action Button */}
          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => {
                if (activeTab === "materials") openNewMaterialModal();
                else if (activeTab === "hdris") openNewHdriModal();
                else openNewModelModal();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#ea543a] hover:bg-[#d9442a] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer active:scale-98"
            >
              <Icon icon="lucide:plus" className="w-4 h-4" />
              <span>
                {activeTab === "materials" ? "Add Material" : activeTab === "hdris" ? "Add HDRI" : "Add Default Model"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-6 sm:px-12 lg:px-16 xl:px-24 py-8 flex-1 flex flex-col">
        {/* Navigation Tabs & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center bg-gray-200/70 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("materials");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "materials"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon icon="fluent:paint-brush-24-filled" className="w-4 h-4 text-[#ea543a]" />
              <span>Preset Materials</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {materials.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("hdris");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "hdris"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon icon="ant-design:sun-outlined" className="w-4 h-4 text-[#ea543a]" />
              <span>Preset HDRIs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {hdris.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("models");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "models"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon icon="solar:box-minimalistic-bold" className="w-4 h-4 text-[#ea543a]" />
              <span>Default 3D Models</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {defaultModels.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Icon icon="lucide:search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ea543a]/20 focus:border-[#ea543a]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="lucide:x" className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-[#ea543a] rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500 font-medium">Loading presets...</p>
          </div>
        ) : (
          <div className="flex-1">
            {activeTab === "materials" ? (
              /* MATERIAL GRID */
              filteredMaterials.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Icon icon="fluent:paint-brush-24-filled" className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">No preset materials found</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    {searchQuery ? "Try refining your search term or category filter." : "Create your first preset material for the 3D editor."}
                  </p>
                  <button
                    onClick={openNewMaterialModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ea543a] text-white rounded-lg text-sm font-semibold hover:bg-[#d9442a]"
                  >
                    <Icon icon="lucide:plus" className="w-4 h-4" />
                    <span>Add Preset Material</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden flex flex-col group relative"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        {mat.preview ? (
                          <img
                            src={mat.preview}
                            alt={mat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : mat.color ? (
                          <div className="w-full h-full" style={{ backgroundColor: mat.color }} />
                        ) : (
                          <Icon icon="fluent:cube-24-regular" className="w-10 h-10 text-gray-300" />
                        )}

                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white uppercase tracking-wider">
                          {mat.category || "General"}
                        </span>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                          <button
                            onClick={() => openEditMaterialModal(mat)}
                            className="p-2 bg-white text-gray-700 hover:text-[#ea543a] rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Edit Preset"
                          >
                            <Icon icon="lucide:edit-2" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmItem(mat);
                              setDeleteType("material");
                            }}
                            className="p-2 bg-white text-gray-700 hover:text-red-600 rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Delete Preset"
                          >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 truncate" title={mat.name}>
                            {mat.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>Maps: {Object.values(mat.maps || {}).filter(Boolean).length}</span>
                            {mat.color && (
                              <span className="inline-block w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: mat.color }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === "hdris" ? (
              /* HDRI GRID */
              filteredHdris.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Icon icon="ant-design:sun-outlined" className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">No preset HDRIs found</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    {searchQuery ? "Try refining your search term or category filter." : "Create your first preset environment for lighting."}
                  </p>
                  <button
                    onClick={openNewHdriModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ea543a] text-white rounded-lg text-sm font-semibold hover:bg-[#d9442a]"
                  >
                    <Icon icon="lucide:plus" className="w-4 h-4" />
                    <span>Add Preset HDRI</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedHdris.map((hdri) => (
                    <div
                      key={hdri.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden flex flex-col group relative"
                    >
                      <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        {hdri.preview ? (
                          <img
                            src={hdri.preview}
                            alt={hdri.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Icon icon="ant-design:sun-outlined" className="w-8 h-8 text-gray-300" />
                        )}

                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white uppercase tracking-wider">
                          {hdri.category || "Day"}
                        </span>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                          <button
                            onClick={() => openEditHdriModal(hdri)}
                            className="p-2 bg-white text-gray-700 hover:text-[#ea543a] rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Edit Preset"
                          >
                            <Icon icon="lucide:edit-2" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmItem(hdri);
                              setDeleteType("hdri");
                            }}
                            className="p-2 bg-white text-gray-700 hover:text-red-600 rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Delete Preset"
                          >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 truncate" title={hdri.name}>
                            {hdri.name}
                          </h4>
                          <span className="text-xs text-gray-400 truncate block mt-0.5">
                            {hdri.file ? hdri.file.split("/").pop() : "No file attached"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* DEFAULT 3D MODELS GRID */
              filteredModels.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Icon icon="solar:box-minimalistic-bold" className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">No default 3D models added</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    {searchQuery ? "Try refining your search term or category filter." : "Upload default models that will be available for all users in the 3D model gallery."}
                  </p>
                  <button
                    onClick={openNewModelModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ea543a] text-white rounded-lg text-sm font-semibold hover:bg-[#d9442a]"
                  >
                    <Icon icon="lucide:plus" className="w-4 h-4" />
                    <span>Upload Default Model</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedModels.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden flex flex-col group relative"
                    >
                      {/* 3D Model Card Preview */}
                      <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        <ModelCardThumbnail model={item} />

                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white uppercase tracking-wider">
                          {item.category || "General"}
                        </span>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                          <button
                            onClick={() => setPreviewModel(item)}
                            className="p-2 bg-white text-gray-700 hover:text-[#ea543a] rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Preview 3D Model"
                          >
                            <Icon icon="lucide:eye" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModelModal(item)}
                            className="p-2 bg-white text-gray-700 hover:text-[#ea543a] rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Edit Default Model"
                          >
                            <Icon icon="lucide:edit-2" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmItem(item);
                              setDeleteType("model");
                            }}
                            className="p-2 bg-white text-gray-700 hover:text-red-600 rounded-lg shadow-sm transition-transform hover:scale-110"
                            title="Delete Default Model"
                          >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 truncate" title={item.name}>
                            {item.name}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                            <span className="uppercase font-semibold text-gray-500">{item.type || 'GLB'}</span>
                            <span>{item.size || '0 MB'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="mt-8 pt-4 pb-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    Showing <span className="font-semibold text-gray-800">{startIndex + 1}</span> to <span className="font-semibold text-gray-800">{endIndex}</span> of <span className="font-semibold text-gray-800">{totalItems}</span> {activeTab === "materials" ? "materials" : activeTab === "hdris" ? "HDRIs" : "models"}
                  </span>
                  <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-gray-200 rounded-lg text-xs py-1 px-2 font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ea543a]"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                    >
                      <Icon icon="lucide:chevron-left" className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let start = Math.max(1, safeCurrentPage - 2);
                        let end = Math.min(totalPages, start + maxVisible - 1);
                        if (end - start + 1 < maxVisible) {
                          start = Math.max(1, end - maxVisible + 1);
                        }

                        if (start > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setCurrentPage(1)}
                              className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              1
                            </button>
                          );
                          if (start > 2) {
                            pages.push(
                              <span key="start-dots" className="px-1 text-gray-400 text-xs">...</span>
                            );
                          }
                        }

                        for (let p = start; p <= end; p++) {
                          const isCurrent = p === safeCurrentPage;
                          pages.push(
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-[#ea543a] text-white shadow-xs scale-105"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        }

                        if (end < totalPages) {
                          if (end < totalPages - 1) {
                            pages.push(
                              <span key="end-dots" className="px-1 text-gray-400 text-xs">...</span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <Icon icon="lucide:chevron-right" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MATERIAL MODAL (ADD / EDIT) */}
      {/* ============================================================== */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="fluent:paint-brush-24-filled" className="w-5 h-5 text-[#ea543a]" />
                <h3 className="text-base font-bold text-gray-900">
                  {editingItem ? "Edit Preset Material" : "Add Preset Material"}
                </h3>
              </div>
              <button
                onClick={() => setIsMaterialModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={matForm.name}
                    onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                    placeholder="e.g. Brushed Brass"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                  />
                </div>
                <div ref={matCategoryContainerRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Category *
                    </label>
                    {existingMatCategories.length > 0 && (
                      <span className="text-[11px] text-gray-400">
                        {existingMatCategories.length} existing {existingMatCategories.length === 1 ? "category" : "categories"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={matForm.category}
                      onChange={(e) => {
                        setMatForm({ ...matForm, category: e.target.value });
                        setShowMatCategorySuggestions(true);
                      }}
                      onFocus={() => setShowMatCategorySuggestions(true)}
                      placeholder="e.g. Metal, Fabric, Wood, Plastic, Leather"
                      className="w-full px-4 py-3 bg-gray-50/60 border border-gray-200 rounded-xl text-[14px] focus:bg-white focus:border-[#ea543a] focus:ring-2 focus:ring-[#ea543a]/20 outline-none transition-all placeholder:text-gray-400"
                    />

                    {existingMatCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowMatCategorySuggestions(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        tabIndex={-1}
                      >
                        <Icon
                          icon="lucide:chevron-down"
                          className={`w-4 h-4 transition-transform duration-200 ${
                            showMatCategorySuggestions ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Material Category Suggestions Dropdown */}
                  {showMatCategorySuggestions && matchedMatCategorySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 animate-in fade-in duration-150">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Suggested Material Categories
                      </div>
                      {matchedMatCategorySuggestions.map((cat) => {
                        const isSelected = matForm.category?.trim().toLowerCase() === cat.toLowerCase();
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setMatForm(prev => ({ ...prev, category: cat }));
                              setShowMatCategorySuggestions(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#ea543a]/10 text-[#ea543a]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon icon="fluent:paint-brush-24-filled" className="w-3.5 h-3.5 text-[#ea543a]/70" />
                              <span>{cat}</span>
                            </div>
                            {isSelected && (
                              <Icon icon="lucide:check" className="w-3.5 h-3.5 text-[#ea543a]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Preview Image / Thumbnail
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingMatPreview(true); }}
                  onDragLeave={() => setIsDraggingMatPreview(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingMatPreview(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setMatForm(prev => ({ ...prev, previewFile: e.dataTransfer.files[0] }));
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 transition-all ${
                    isDraggingMatPreview
                      ? "border-[#ea543a] bg-[#ea543a]/5 scale-[1.01]"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual Preview Box */}
                    <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-white shadow-2xs flex items-center justify-center relative group">
                      {(matForm.previewFile || matForm.previewUrl) ? (
                        <>
                          <img
                            src={matForm.previewFile ? URL.createObjectURL(matForm.previewFile) : matForm.previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setMatForm(prev => ({ ...prev, previewFile: null, previewUrl: "" }))}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                          <Icon icon="solar:gallery-bold" className="w-7 h-7 text-gray-400" />
                          <span className="text-[10px] text-gray-400 mt-1">Preview</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left w-full space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="cursor-pointer">
                          <span className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-[#ea543a] text-gray-700 hover:text-[#ea543a] rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                            <Icon icon="lucide:upload-cloud" className="w-4 h-4 text-[#ea543a]" />
                            {matForm.previewFile ? "Change Image" : "Choose / Drop Image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setMatForm(prev => ({ ...prev, previewFile: e.target.files[0] }));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs text-gray-400">or drag & drop here</span>
                      </div>
                      <input
                        type="text"
                        value={matForm.previewUrl}
                        onChange={(e) => setMatForm({ ...matForm, previewUrl: e.target.value })}
                        placeholder="Or paste image URL (e.g. https://...)"
                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a]/20 placeholder:text-gray-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  PBR Maps (Upload files or existing URLs)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: "map", label: "Base Color / Albedo" },
                    { key: "normalMap", label: "Normal Map" },
                    { key: "roughnessMap", label: "Roughness Map" },
                    { key: "metalnessMap", label: "Metallic Map" },
                    { key: "displacementMap", label: "Displacement / Height" },
                    { key: "aoMap", label: "Ambient Occlusion (AO)" },
                  ].map((mapItem) => {
                    const hasFile = !!matForm.mapFiles[mapItem.key];
                    const hasUrl = !!matForm.maps[mapItem.key];
                    const mapPreviewSrc = hasFile
                      ? URL.createObjectURL(matForm.mapFiles[mapItem.key])
                      : hasUrl
                      ? matForm.maps[mapItem.key]
                      : null;
                    const isDragOver = draggingMapKey === mapItem.key;

                    return (
                      <div
                        key={mapItem.key}
                        onDragOver={(e) => { e.preventDefault(); setDraggingMapKey(mapItem.key); }}
                        onDragLeave={() => setDraggingMapKey(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingMapKey(null);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setMatForm(prev => ({
                              ...prev,
                              mapFiles: { ...prev.mapFiles, [mapItem.key]: e.dataTransfer.files[0] }
                            }));
                          }
                        }}
                        className={`border rounded-xl p-2.5 transition-all flex flex-col justify-between ${
                          isDragOver
                            ? "border-[#ea543a] bg-[#ea543a]/10 scale-[1.02]"
                            : hasFile || hasUrl
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-gray-200 bg-gray-50/60 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-gray-700 truncate">
                            {mapItem.label}
                          </span>
                          {(hasFile || hasUrl) && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          )}
                        </div>

                        {/* Thumbnail Preview & Dropzone */}
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-white flex items-center justify-center">
                            {mapPreviewSrc ? (
                              <img src={mapPreviewSrc} alt={mapItem.label} className="w-full h-full object-cover" />
                            ) : (
                              <Icon icon="solar:gallery-bold" className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="cursor-pointer block">
                              <span className="text-[10px] font-semibold text-[#ea543a] hover:underline truncate block">
                                {hasFile ? matForm.mapFiles[mapItem.key].name : hasUrl ? "Loaded from server" : "Click / Drop file"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setMatForm(prev => ({
                                      ...prev,
                                      mapFiles: { ...prev.mapFiles, [mapItem.key]: e.target.files[0] }
                                    }));
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            {hasFile && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMatForm(prev => {
                                    const nextFiles = { ...prev.mapFiles };
                                    delete nextFiles[mapItem.key];
                                    return { ...prev, mapFiles: nextFiles };
                                  });
                                }}
                                className="text-[9px] text-red-500 hover:underline block"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Tint Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={matForm.color || "#ffffff"}
                      onChange={(e) => setMatForm({ ...matForm, color: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0"
                    />
                    <span className="text-xs text-gray-600">{matForm.color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Metallic ({matForm.metallic})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={matForm.metallic}
                    onChange={(e) => setMatForm({ ...matForm, metallic: parseFloat(e.target.value) })}
                    className="w-full accent-[#ea543a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Roughness ({matForm.roughness})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={matForm.roughness}
                    onChange={(e) => setMatForm({ ...matForm, roughness: parseFloat(e.target.value) })}
                    className="w-full accent-[#ea543a]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#ea543a] hover:bg-[#d9442a] text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? "Update Preset" : "Create Preset"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HDRI MODAL (ADD / EDIT) */}
      {/* ============================================================== */}
      {isHdriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="ant-design:sun-outlined" className="w-5 h-5 text-[#ea543a]" />
                <h3 className="text-base font-bold text-gray-900">
                  {editingItem ? "Edit Preset HDRI" : "Add Preset HDRI"}
                </h3>
              </div>
              <button
                onClick={() => setIsHdriModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHdri} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  HDRI Environment Name *
                </label>
                <input
                  type="text"
                  required
                  value={hdriForm.name}
                  onChange={(e) => setHdriForm({ ...hdriForm, name: e.target.value })}
                  placeholder="e.g. Sunset Field"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                />
              </div>

              <div ref={hdriCategoryContainerRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Category *
                  </label>
                  {existingHdriCategories.length > 0 && (
                    <span className="text-[11px] text-gray-400">
                      {existingHdriCategories.length} existing {existingHdriCategories.length === 1 ? "category" : "categories"}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={hdriForm.category}
                    onChange={(e) => {
                      setHdriForm({ ...hdriForm, category: e.target.value });
                      setShowHdriCategorySuggestions(true);
                    }}
                    onFocus={() => setShowHdriCategorySuggestions(true)}
                    placeholder="e.g. Day, Evening, Indoor, Studio, Night"
                    className="w-full px-4 py-3 bg-gray-50/60 border border-gray-200 rounded-xl text-[14px] focus:bg-white focus:border-[#ea543a] focus:ring-2 focus:ring-[#ea543a]/20 outline-none transition-all placeholder:text-gray-400"
                  />

                  {existingHdriCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHdriCategorySuggestions(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      <Icon
                        icon="lucide:chevron-down"
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showHdriCategorySuggestions ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* HDRI Category Suggestions Dropdown */}
                {showHdriCategorySuggestions && matchedHdriCategorySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 animate-in fade-in duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Suggested Lighting Categories
                    </div>
                    {matchedHdriCategorySuggestions.map((cat) => {
                      const isSelected = hdriForm.category?.trim().toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setHdriForm(prev => ({ ...prev, category: cat }));
                            setShowHdriCategorySuggestions(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#ea543a]/10 text-[#ea543a]"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon icon="ant-design:sun-outlined" className="w-3.5 h-3.5 text-[#ea543a]/70" />
                            <span>{cat}</span>
                          </div>
                          {isSelected && (
                            <Icon icon="lucide:check" className="w-3.5 h-3.5 text-[#ea543a]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Tonemapped Preview Image (JPG / PNG) *
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingHdriPreview(true); }}
                  onDragLeave={() => setIsDraggingHdriPreview(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingHdriPreview(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setHdriForm(prev => ({ ...prev, previewFile: e.dataTransfer.files[0] }));
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 transition-all ${
                    isDraggingHdriPreview
                      ? "border-[#ea543a] bg-[#ea543a]/5 scale-[1.01]"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-white shadow-2xs flex items-center justify-center relative group">
                      {(hdriForm.previewFile || hdriForm.previewUrl) ? (
                        <>
                          <img
                            src={hdriForm.previewFile ? URL.createObjectURL(hdriForm.previewFile) : hdriForm.previewUrl}
                            alt="HDRI Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setHdriForm(prev => ({ ...prev, previewFile: null, previewUrl: "" }))}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                          <Icon icon="ant-design:sun-outlined" className="w-6 h-6 text-gray-400" />
                          <span className="text-[9px] text-gray-400 mt-0.5">Panoramic</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left w-full space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="cursor-pointer">
                          <span className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-[#ea543a] text-gray-700 hover:text-[#ea543a] rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                            <Icon icon="lucide:upload-cloud" className="w-4 h-4 text-[#ea543a]" />
                            {hdriForm.previewFile ? "Change Image" : "Choose / Drop Image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setHdriForm(prev => ({ ...prev, previewFile: e.target.files[0] }));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs text-gray-400">or drag & drop</span>
                      </div>
                      <input
                        type="text"
                        value={hdriForm.previewUrl}
                        onChange={(e) => setHdriForm({ ...hdriForm, previewUrl: e.target.value })}
                        placeholder="Or paste preview URL (e.g. https://...)"
                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a]/20 placeholder:text-gray-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  HDR / EXR Radiance File (.hdr / .exr) *
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingHdriFile(true); }}
                  onDragLeave={() => setIsDraggingHdriFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingHdriFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setHdriForm(prev => ({ ...prev, hdrFile: e.dataTransfer.files[0] }));
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    isDraggingHdriFile
                      ? "border-[#ea543a] bg-[#ea543a]/5 scale-[1.01]"
                      : hdriForm.hdrFile
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a] mx-auto mb-2">
                    <Icon icon="ant-design:sun-outlined" className="w-5 h-5" />
                  </div>
                  <label className="cursor-pointer inline-block">
                    <span className="px-4 py-2 bg-white border border-gray-200 hover:border-[#ea543a] text-gray-700 hover:text-[#ea543a] rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                      <Icon icon="lucide:upload-cloud" className="w-4 h-4 text-[#ea543a]" />
                      {hdriForm.hdrFile ? "Change HDR/EXR File" : "Choose or Drop HDR/EXR File"}
                    </span>
                    <input
                      type="file"
                      accept=".hdr,.exr"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setHdriForm({ ...hdriForm, hdrFile: e.target.files[0] });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Drop high-dynamic range 360° light map (.hdr, .exr)
                  </p>

                  {hdriForm.hdrFile && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-left">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-800 truncate">
                          {hdriForm.hdrFile.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 shrink-0 ml-2">
                        {(hdriForm.hdrFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-200/60">Or enter direct HDR/EXR file URL:</div>
                  <input
                    type="text"
                    value={hdriForm.fileUrl}
                    onChange={(e) => setHdriForm({ ...hdriForm, fileUrl: e.target.value })}
                    placeholder="https://...environment.hdr or .exr"
                    className="w-full px-3.5 py-2 mt-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a]/20 placeholder:text-gray-400 transition-all text-left"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsHdriModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#ea543a] hover:bg-[#d9442a] text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? "Update Preset" : "Create Preset"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DEFAULT 3D MODEL MODAL (ADD / EDIT) */}
      {/* ============================================================== */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:box-minimalistic-bold" className="w-5 h-5 text-[#ea543a]" />
                <h3 className="text-base font-bold text-gray-900">
                  {editingItem ? "Edit Default 3D Model" : "Upload Default 3D Model"}
                </h3>
              </div>
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Model Name *
                </label>
                <input
                  type="text"
                  required
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                  placeholder="e.g. Modern Office Chair"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                />
              </div>

              <div ref={categoryContainerRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Category *
                  </label>
                  {existingModelCategories.length > 0 && (
                    <span className="text-[11px] text-gray-400">
                      {existingModelCategories.length} existing {existingModelCategories.length === 1 ? "category" : "categories"}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={modelForm.category}
                    onChange={(e) => {
                      setModelForm({ ...modelForm, category: e.target.value });
                      setShowCategorySuggestions(true);
                    }}
                    onFocus={() => setShowCategorySuggestions(true)}
                    placeholder="e.g. Packaging, Furniture, Electronics"
                    className="w-full px-4 py-3 bg-gray-50/60 border border-gray-200 rounded-xl text-[14px] focus:bg-white focus:border-[#ea543a] focus:ring-2 focus:ring-[#ea543a]/20 outline-none transition-all placeholder:text-gray-400"
                  />

                  {/* Toggle Dropdown arrow */}
                  {existingModelCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCategorySuggestions(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      <Icon
                        icon="lucide:chevron-down"
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showCategorySuggestions ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Auto Suggestion Dropdown */}
                {showCategorySuggestions && matchedCategorySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 animate-in fade-in duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Suggested Categories
                    </div>
                    {matchedCategorySuggestions.map((cat) => {
                      const isSelected = modelForm.category?.trim().toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setModelForm(prev => ({ ...prev, category: cat }));
                            setShowCategorySuggestions(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#ea543a]/10 text-[#ea543a]"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:folder-tag-bold" className="w-3.5 h-3.5 text-[#ea543a]/70" />
                            <span>{cat}</span>
                          </div>
                          {isSelected && (
                            <Icon icon="lucide:check" className="w-3.5 h-3.5 text-[#ea543a]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={modelForm.description}
                  onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                  placeholder="Optional brief description of the 3D model..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  {editingItem ? "3D Model File (.glb / .gltf / .obj / .stl)" : "Upload 3D Model File (.glb / .gltf / .obj / .stl) *"}
                </label>

                {/* Live 3D Model Interactive Preview Box inside Modal */}
                {(modelPreviewBlobUrl || editingItem?.url) && (
                  <div className="mb-3 rounded-2xl border border-gray-200 overflow-hidden bg-slate-900/5 h-48 w-full relative">
                    <Canvas
                      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
                      camera={{ fov: 40, position: [2.5, 2.0, 3.2] }}
                      className="w-full h-full"
                    >
                      <ambientLight intensity={1.5} />
                      <directionalLight position={[5, 8, 5]} intensity={1.2} />
                      <directionalLight position={[-5, -2, -5]} intensity={0.5} />
                      <Suspense
                        fallback={
                          <Html center>
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#ea543a] rounded-full animate-spin" />
                              <span className="text-[10px] font-semibold text-gray-500">Rendering preview...</span>
                            </div>
                          </Html>
                        }
                      >
                        <Environment preset="city" />
                        <AutoFitPreview targetSize={2.0}>
                          <PreviewErrorBoundary>
                            <RenderModel
                              url={modelPreviewBlobUrl || resolveUploadsPath(editingItem.url)}
                              type={modelForm.modelFile ? (modelForm.modelFile.name.split('.').pop().toLowerCase()) : (editingItem?.type || "glb")}
                              isSelectionDisabled={true}
                              shouldClone={true}
                            />
                          </PreviewErrorBoundary>
                        </AutoFitPreview>
                        <OrbitControls enableZoom={true} enablePan={false} autoRotate={true} autoRotateSpeed={1.5} />
                      </Suspense>
                    </Canvas>
                    <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white pointer-events-none flex items-center gap-1.5">
                      <Icon icon="solar:box-minimalistic-bold" className="w-3.5 h-3.5 text-[#ea543a]" />
                      <span>Live 3D Preview (Drag to rotate)</span>
                    </div>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingModelFile(true); }}
                  onDragLeave={() => setIsDraggingModelFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingModelFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setModelForm(prev => ({ ...prev, modelFile: e.dataTransfer.files[0] }));
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    isDraggingModelFile
                      ? "border-[#ea543a] bg-[#ea543a]/5 scale-[1.01]"
                      : modelForm.modelFile
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a] mx-auto mb-2.5">
                    <Icon icon="solar:box-minimalistic-bold" className="w-6 h-6" />
                  </div>
                  <label className="cursor-pointer inline-block">
                    <span className="px-4 py-2 bg-white border border-gray-200 hover:border-[#ea543a] text-gray-700 hover:text-[#ea543a] rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                      <Icon icon="lucide:upload-cloud" className="w-4 h-4 text-[#ea543a]" />
                      {modelForm.modelFile ? "Choose Different 3D Model" : (editingItem ? "Change Model File" : "Choose or Drop 3D Model")}
                    </span>
                    <input
                      type="file"
                      accept=".glb,.gltf,.obj,.stl"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setModelForm({ ...modelForm, modelFile: e.target.files[0] });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Drag and drop your 3D asset file here (.glb, .gltf, .obj, .stl up to 150 MB)
                  </p>
                </div>

                {modelForm.modelFile ? (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-800 truncate">
                        {modelForm.modelFile.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 shrink-0 ml-2">
                      {(modelForm.modelFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ) : editingItem?.url ? (
                  <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-700 font-medium truncate">
                      Current: {editingItem.name} ({editingItem.type?.toUpperCase() || 'GLB'})
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                      {editingItem.size || 'Existing file'}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#ea543a] hover:bg-[#d9442a] text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? "Update Model" : "Save Model"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon icon="lucide:alert-triangle" className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Preset?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{deleteConfirmItem.name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* 3D MODEL PREVIEW MODAL */}
      {/* ============================================================== */}
      {previewModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a]">
                  <Icon icon="solar:box-bold" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {previewModel.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="font-semibold text-gray-600 uppercase">{previewModel.type || 'GLB'}</span>
                    <span>•</span>
                    <span>{previewModel.category || 'General'}</span>
                    <span>•</span>
                    <span>{previewModel.size || '0 MB'}</span>
                  </div>
                </div>
              </div>

              {/* Viewer Controls & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewAutoRotate((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    previewAutoRotate
                      ? "bg-[#ea543a]/10 text-[#ea543a] border-[#ea543a]/30"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                  }`}
                  title="Toggle Auto Rotation"
                >
                  <Icon icon="lucide:rotate-cw" className={`w-3.5 h-3.5 ${previewAutoRotate ? "animate-spin" : ""}`} />
                  <span>Auto-Rotate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWireframe((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    previewWireframe
                      ? "bg-[#ea543a]/10 text-[#ea543a] border-[#ea543a]/30"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                  }`}
                  title="Toggle Wireframe mode"
                >
                  <Icon icon="lucide:grid" className="w-3.5 h-3.5" />
                  <span>Wireframe</span>
                </button>
                <button
                  onClick={() => setPreviewModel(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 ml-2"
                >
                  <Icon icon="lucide:x" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3D Canvas Viewport */}
            <div className="flex-1 w-full h-full relative bg-radial from-gray-100 via-gray-200 to-gray-300">
              <Canvas
                shadows
                camera={{ position: [0, 1.5, 4], fov: 45 }}
                gl={{ preserveDrawingBuffer: true, antialias: true }}
                className="w-full h-full"
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
                <directionalLight position={[-5, -2, -5]} intensity={0.4} />

                <Suspense
                  fallback={
                    <Html center>
                      <div className="flex flex-col items-center justify-center gap-2 bg-white/90 backdrop-blur-xs px-4 py-3 rounded-xl shadow-lg border border-gray-200">
                        <div className="w-6 h-6 border-2 border-[#ea543a] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium text-gray-700">Loading 3D asset...</span>
                      </div>
                    </Html>
                  }
                >
                  <Environment preset="city" />
                  <PreviewErrorBoundary>
                    <AutoFitPreview targetSize={2.4}>
                      <RenderModel
                        url={resolveUploadsPath(previewModel.url || previewModel.modelUrl || previewModel.path)}
                        type={previewModel.type || "glb"}
                        wireframe={previewWireframe}
                      />
                    </AutoFitPreview>
                  </PreviewErrorBoundary>
                </Suspense>

                <OrbitControls
                  makeDefault
                  autoRotate={previewAutoRotate}
                  autoRotateSpeed={2.0}
                  enableDamping
                  dampingFactor={0.05}
                  minDistance={0.5}
                  maxDistance={20}
                />
              </Canvas>

              {/* Instructions badge */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-white/90 flex items-center gap-2 pointer-events-none select-none">
                <Icon icon="lucide:mouse-pointer" className="w-3.5 h-3.5 text-[#ea543a]" />
                <span>Drag to rotate • Scroll to zoom • Right-click to pan</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
