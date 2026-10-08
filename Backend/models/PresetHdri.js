import mongoose from "mongoose";

const presetHdriSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  aliases: {
    type: [String],
    default: []
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
    required: true
  },
  file: {
    type: String,
    required: true
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

const PresetHdri = mongoose.model("PresetHdri", presetHdriSchema);

export default PresetHdri;
