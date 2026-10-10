/**
 * 15 Curated Floor Presets for the 3D Editor
 */
export const FLOOR_PRESETS = [
  {
    id: "grid",
    name: "Infinite Grid",
    category: "Technical",
    icon: "solar:widget-bold",
    floorType: "grid",
    floorColor: "#1a1a20",
    floorRoughness: 20,
    floorReflectivity: 65,
    floorBlur: 50,
    description: "Default Blender-style anti-aliased viewport grid with XYZ axes"
  },
  {
    id: "glass_dark",
    name: "Obsidian Glass",
    category: "Glass & Mirror",
    icon: "solar:mirror-bold",
    floorType: "glass_dark",
    floorColor: "#121216",
    floorRoughness: 12,
    floorReflectivity: 85,
    floorBlur: 30,
    description: "Deep dark high-gloss mirror surface with sharp reflections"
  },
  
  {
    id: "cyclorama",
    name: "Seamless Cyc Wall",
    category: "Studio & Lighting",
    icon: "solar:tv-bold",
    floorType: "cyclorama",
    floorColor: "#232329",
    floorRoughness: 60,
    floorReflectivity: 30,
    floorBlur: 50,
    description: "Curved photo-studio infinity cyclorama cove backdrop"
  },

  {
    id: "brushed_metal",
    name: "Brushed Steel",
    category: "Textures & Patterns",
    icon: "solar:shield-star-bold",
    floorType: "brushed_metal",
    floorColor: "#32353b",
    floorRoughness: 45,
    floorReflectivity: 50,
    floorBlur: 70,
    description: "Industrial anodized matte steel showroom floor plate"
  },
  {
    id: "shadow_catcher",
    name: "Floating Shadow",
    category: "Technical",
    icon: "solar:sun-fog-bold",
    floorType: "shadow_catcher",
    floorColor: "#1a1a20",
    floorRoughness: 50,
    floorReflectivity: 0,
    floorBlur: 50,
    description: "Transparent invisible ground with soft grounding contact shadow"
  }
];

export const FLOOR_CATEGORIES = [
  "All",
  "Technical",
  "Glass & Mirror",
  "Studio & Lighting",
  "Textures & Patterns"
];