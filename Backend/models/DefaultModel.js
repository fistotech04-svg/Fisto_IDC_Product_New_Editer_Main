import mongoose from "mongoose";
import { nanoid } from "nanoid";

const defaultModelSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(16),
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: "General",
    index: true
  },
  description: {
    type: String,
    default: ""
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: "0 MB"
  },
  type: {
    type: String,
    default: "glb"
  },
  order: {
    type: Number,
    default: 0
  },
  materialSettings: {
    type: Object,
    default: null
  },
  transformValues: {
    type: Object,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DefaultModel = mongoose.model("DefaultModel", defaultModelSchema);

export default DefaultModel;
