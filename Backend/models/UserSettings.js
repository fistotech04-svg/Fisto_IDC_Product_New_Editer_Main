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
  }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema, 'UserSettings');

export default UserSettings;
