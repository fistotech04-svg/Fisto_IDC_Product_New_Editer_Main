import mongoose from "mongoose";

const presetMaterialSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  preview: {
    type: String,
    default: null
  },
  maps: {
    map: { type: String, default: null },
    normalMap: { type: String, default: null },
    roughnessMap: { type: String, default: null },
    displacementMap: { type: String, default: null },
    metalnessMap: { type: String, default: null },
    aoMap: { type: String, default: null },
    alphaMap: { type: String, default: null },
    emissiveMap: { type: String, default: null },
    bumpMap: { type: String, default: null }
  },
  color: {
    type: String,
    default: null
  },
  metallic: {
    type: Number,
    default: null
  },
  roughness: {
    type: Number,
    default: null
  },
  alpha: {
    type: Number,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PresetMaterial = mongoose.model("PresetMaterial", presetMaterialSchema);

export default PresetMaterial;
