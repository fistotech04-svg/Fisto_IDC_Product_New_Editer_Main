import mongoose from "mongoose";
import { nanoid } from "nanoid";

const InteractionThreedModelSchema = new mongoose.Schema({
  v_id: {
    type: String,
    default: () => nanoid(20),
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  flipbookName: {
    type: String,
    required: true
  },
  folderName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: null
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: String
  },
  type: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const InteractionThreedModel = mongoose.models.InteractionThreedModel || mongoose.model("InteractionThreedModel", InteractionThreedModelSchema);

export default InteractionThreedModel;
