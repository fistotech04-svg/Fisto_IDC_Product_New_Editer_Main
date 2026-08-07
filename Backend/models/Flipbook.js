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
    meta: {
        type: Object,
        default: {}
    },
    width: { type: Number },
    height: { type: Number },
    templateId: { type: String },
    orientation: { type: String },
    Customized_Settings: {
        type: Object,
        default: {},
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
            inviteOnly: {
                autoExpire: {
                    enabled: { type: Boolean, default: false },
                    days: { type: String, default: '0 Days' },
                    time: { type: String, default: '5 Mins' }
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
});

// Ensure a user cannot have two books with the same name in the same folder
flipbookSchema.index({ userEmail: 1, folderName: 1, flipbookName: 1 }, { unique: true });

const Flipbook = mongoose.model('Flipbook', flipbookSchema);

export default Flipbook;
