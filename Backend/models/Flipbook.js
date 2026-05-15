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
    settings: {
        type: Object,
        default: {}
    },
    share: {
        shareId: {
            type: String,
            default: () => nanoid(12),
            unique: true
        },
        access: {
            type: String,
            enum: ['public', 'private'],
            default: 'public'
        }
    }
});

// Ensure a user cannot have two books with the same name in the same folder
flipbookSchema.index({ userEmail: 1, folderName: 1, flipbookName: 1 }, { unique: true });

const Flipbook = mongoose.model('Flipbook', flipbookSchema);

export default Flipbook;
