import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true
  },
  isAutoSaveEnabled: {
    type: Boolean,
    default: true
  },
  maxStorage: {
    type: Number,
    default: 300 * 1024 * 1024 // 300MB in bytes
  }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema, 'UserSettings');

export default UserSettings;
