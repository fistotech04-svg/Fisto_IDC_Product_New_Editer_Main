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

  const categories = activeTab === "materials" 
    ? ["All", ...new Set(materials.map(m => m.category).filter(Boolean))]
    : activeTab === "hdris"
    ? ["All", ...new Set(hdris.map(h => h.category).filter(Boolean))]
    : ["All", ...new Set(defaultModels.map(m => m.category).filter(Boolean))];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/editor/threed_editor")}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 text-sm font-medium"
              title="Return to 3D Editor"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-[#ea543a]" />
              <span className="hidden sm:inline">Back to 3D Editor</span>
            </button>
            <div className="h-5 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a]">
                <Icon icon="solar:shield-star-bold" className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Admin Preset Management</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage preset 3D materials, HDRIs, and default models for users</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
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
                  {filteredMaterials.map((mat) => (
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
                  {filteredHdris.map((hdri) => (
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
                  {filteredModels.map((item) => (
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
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MATERIAL MODAL (ADD / EDIT) */}
      {/* ============================================================== */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={matForm.category}
                    onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                    placeholder="e.g. Metal, Fabric, Wood"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Preview Image / Thumbnail
                </label>
                <div className="flex items-center gap-4">
                  {(matForm.previewFile || matForm.previewUrl) && (
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                      <img
                        src={matForm.previewFile ? URL.createObjectURL(matForm.previewFile) : matForm.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setMatForm({ ...matForm, previewFile: e.target.files[0] });
                        }
                      }}
                      className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ea543a]/10 file:text-[#ea543a] hover:file:bg-[#ea543a]/20 cursor-pointer"
                    />
                    <div className="text-[11px] text-gray-400 mt-1">Or provide image URL:</div>
                    <input
                      type="text"
                      value={matForm.previewUrl}
                      onChange={(e) => setMatForm({ ...matForm, previewUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs mt-1 outline-none"
                    />
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
                    return (
                      <div key={mapItem.key} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50">
                        <span className="text-[11px] font-semibold text-gray-700 block mb-1 truncate">
                          {mapItem.label}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setMatForm(prev => ({
                                ...prev,
                                mapFiles: { ...prev.mapFiles, [mapItem.key]: e.target.files[0] }
                              }));
                            }
                          }}
                          className="text-[10px] w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-gray-200 file:text-gray-700"
                        />
                        {(hasFile || hasUrl) && (
                          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1 truncate">
                            <Icon icon="lucide:check-circle" className="w-3 h-3 shrink-0" />
                            <span className="truncate">{hasFile ? matForm.mapFiles[mapItem.key].name : "Loaded from server"}</span>
                          </div>
                        )}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Category *
                </label>
                <select
                  value={hdriForm.category}
                  onChange={(e) => setHdriForm({ ...hdriForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                >
                  <option value="Day">Day</option>
                  <option value="Evening">Evening</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Night">Night</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tonemapped Preview Image (JPG / PNG) *
                </label>
                <div className="flex items-center gap-4">
                  {(hdriForm.previewFile || hdriForm.previewUrl) && (
                    <div className="w-20 h-14 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                      <img
                        src={hdriForm.previewFile ? URL.createObjectURL(hdriForm.previewFile) : hdriForm.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setHdriForm({ ...hdriForm, previewFile: e.target.files[0] });
                        }
                      }}
                      className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ea543a]/10 file:text-[#ea543a] hover:file:bg-[#ea543a]/20 cursor-pointer"
                    />
                    <div className="text-[11px] text-gray-400 mt-1">Or enter preview URL:</div>
                    <input
                      type="text"
                      value={hdriForm.previewUrl}
                      onChange={(e) => setHdriForm({ ...hdriForm, previewUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs mt-1 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  HDR / EXR Radiance File (.hdr / .exr) *
                </label>
                <input
                  type="file"
                  accept=".hdr,.exr"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setHdriForm({ ...hdriForm, hdrFile: e.target.files[0] });
                    }
                  }}
                  className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ea543a]/10 file:text-[#ea543a] hover:file:bg-[#ea543a]/20 cursor-pointer"
                />
                {hdriForm.hdrFile && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    Selected: {hdriForm.hdrFile.name} ({(hdriForm.hdrFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                <div className="text-[11px] text-gray-400 mt-2">Or enter direct HDR/EXR file URL:</div>
                <input
                  type="text"
                  value={hdriForm.fileUrl}
                  onChange={(e) => setHdriForm({ ...hdriForm, fileUrl: e.target.value })}
                  placeholder="https://...file.hdr or file.exr"
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs mt-1 outline-none"
                />
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
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={modelForm.category}
                  onChange={(e) => setModelForm({ ...modelForm, category: e.target.value })}
                  placeholder="e.g. Furniture, Electronics, Architecture"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ea543a] focus:ring-1 focus:ring-[#ea543a] outline-none"
                />
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {editingItem ? "Change 3D Model (.glb / .gltf / .obj / .stl)" : "Upload 3D Model (.glb / .gltf / .obj / .stl) *"}
                </label>
                <div className="border-2 border-dashed border-gray-200 hover:border-[#ea543a]/50 rounded-xl p-4 transition-colors bg-gray-50/50 flex flex-col items-center justify-center text-center">
                  <Icon icon="solar:box-minimalistic-bold" className="w-8 h-8 text-[#ea543a]/70 mb-2" />
                  <label className="cursor-pointer">
                    <span className="px-3.5 py-1.5 bg-white border border-gray-300 hover:border-[#ea543a] text-gray-700 hover:text-[#ea543a] text-xs font-semibold rounded-lg shadow-2xs inline-block transition-colors">
                      {modelForm.modelFile ? "Choose Different File" : (editingItem ? "Change Model File" : "Choose 3D Model File")}
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
                    Supported formats: GLB, GLTF, OBJ, STL (Max: 150 MB)
                  </p>
                </div>

                {modelForm.modelFile ? (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-800 truncate">
                        {modelForm.modelFile.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-600 shrink-0 ml-2">
                      {(modelForm.modelFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ) : editingItem?.url ? (
                  <div className="mt-2 p-2 rounded-lg bg-gray-100/70 border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium truncate">
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
