import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const flipbookSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    folderName: {
        type: [String], // Array of strings to support tags like 'Recent Book'
        required: true
    },
    flipbookName: {
        type: String,
        required: true
    },
    pages: [{
        pageNumber: { type: Number, required: true },
        name: { type: String, required: true }, // Display Name
        fileName: { type: String, required: true }, // Actual file name
        v_id: { type: String, required: true } // Unique ID for finding assets
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    v_id: {
        type: String,
        required: true,
        unique: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    Customized_Settings: {
        FlipbookInfo: {
            category: { type: String, default: '' },
            language: { type: String, default: '' },
            tags: [{ type: String }],
            quotes: { type: String, default: '' },
            about: { type: String, default: '' },
            width: { type: Number },
            height: { type: Number },
            templateId: { type: String },
            orientation: { type: String }
        },
        Visibility: {
            shareId: {
                type: String,
                default: () => nanoid(12),
                sparse: true
            },
            access: {
                type: String,
                enum: ['public', 'private', 'password', 'invite_only', 'Public', 'Private', 'Password Protect', 'Invite Only Access'],
                default: 'public'
            },
            password: { type: String, default: '' },
            accessKey: { type: String, default: '' },
            isPasswordSaved: { type: Boolean, default: false },
            otp: { type: String, default: null },
            inviteOnly: {
                autoExpire: {
                    enabled: { type: Boolean, default: false },
                    days: { type: String, default: '0 Days' },
                    time: { type: String, default: '5 Mins' },
                    duration: { type: String, default: '5 Mins' },
                    grantedAt: { type: Date, default: Date.now }
                },
                emails: [{
                    email: { type: String },
                    status: { type: String, default: 'valid' }
                }],
                domains: [{
                    domain: { type: String },
                    status: { type: String, default: 'valid' }
                }]
            }
        }
    }
}, { strict: true });

// Ensure a user cannot have two books with the same name in the same folder
flipbookSchema.index({ userEmail: 1, folderName: 1, flipbookName: 1 }, { unique: true });

const Flipbook = mongoose.model('Flipbook', flipbookSchema);

// Auto-drop problematic legacy non-sparse unique index share.shareId_1 if it exists in MongoDB
Flipbook.collection.dropIndex('share.shareId_1').catch(() => {});
Flipbook.collection.dropIndex('Customized_Settings.Visibility.shareId_1').catch(() => {});

export default Flipbook;
