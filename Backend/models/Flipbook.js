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
        Branding: {
            logoSettings: {
                src: { type: String, default: '' },
                url: { type: String, default: '' },
                type: { type: String, default: 'Fit' },
                opacity: { type: Number, default: 100 },
                cropData: { type: Object, default: null },
                adjustments: {
                    exposure: { type: Number, default: 0 },
                    contrast: { type: Number, default: 0 },
                    saturation: { type: Number, default: 0 },
                    temperature: { type: Number, default: 0 },
                    tint: { type: Number, default: 0 },
                    highlights: { type: Number, default: 0 },
                    shadows: { type: Number, default: 0 }
                }
            },
            watermarkSettings: {
                src: { type: String, default: '' },
                type: { type: String, default: 'Fit' },
                opacity: { type: Number, default: 64 },
                position: { type: String, default: 'Bottom Right' },
                cropData: { type: Object, default: null },
                adjustments: {
                    exposure: { type: Number, default: 0 },
                    contrast: { type: Number, default: 0 },
                    saturation: { type: Number, default: 0 },
                    temperature: { type: Number, default: 0 },
                    tint: { type: Number, default: 0 },
                    highlights: { type: Number, default: 0 },
                    shadows: { type: Number, default: 0 }
                }
            },
            preloaderSettings: {
                layout: { type: String, default: 'spinner' },
                text: { type: String, default: 'Loading Modal Please Wait....' },
                font: { type: String, default: 'Poppins' },
                bgColor: { type: String, default: '#2D2F33' },
                textColor: { type: String, default: '#ffffff' },
                spinnerColor: { type: String, default: '#3B3C8A' },
                showPercentage: { type: Boolean, default: false }
            }
        },
        Background: {
            // Primary background type (Solid, Gradient, Image, Video, Media, Themes, ReactBits, Animations, Gallery, etc.)
            style: { 
                type: String, 
                default: 'Solid' 
            },
            color: { type: String, default: '#FFFFFF' },
            opacity: { type: Number, default: 100, min: 0, max: 100 },
            gradient: { type: String, default: '' },
            gradientType: { type: String, default: 'linear' },
            gradientAngle: { type: Number, default: 90 },
            gradientRadius: { type: Number, default: 50 },
            gradientStops: [
                {
                    offset: { type: Number, min: 0, max: 100 },
                    color: { type: String }
                }
            ],
            image: { type: String, default: '' },
            video: { type: String, default: '' },
            fit: { 
                type: String, 
                default: 'Cover' 
            },
            cropData: { type: Object, default: null },
            adjustments: {
                exposure: { type: Number, default: 0 },
                contrast: { type: Number, default: 0 },
                saturation: { type: Number, default: 0 },
                temperature: { type: Number, default: 0 },
                tint: { type: Number, default: 0 },
                highlights: { type: Number, default: 0 },
                shadows: { type: Number, default: 0 }
            },
            // Dynamic WebGL/Canvas ReactBits Theme
            reactBitType: { type: String, default: '' },
            // Independent Overlay Animation (e.g., Snow, Rain, FallingLeaves) that overlays on top of background
            animation: { type: String, default: '' },
            savedSolidColor: { type: String, default: '' },
            savedNonThemeSettings: { type: Object, default: null }
        },
        MenuBar: {
            navigation: {
                addTextToIcons: { type: Boolean, default: false },
                addTextToIconsSettings: {
                    font: { type: String, default: 'Arial' }
                },
                nextPrevButtons: { type: Boolean, default: true },
                mouseWheel: { type: Boolean, default: true },
                dragToTurn: { type: Boolean, default: true },
                pageQuickAccess: { type: Boolean, default: true },
                tableOfContents: { type: Boolean, default: true },
                tocSettings: {
                    addSearch: { type: Boolean, default: true },
                    addPageNumber: { type: Boolean, default: true },
                    addSerialNumberHeading: { type: Boolean, default: true },
                    addSerialNumberSubheading: { type: Boolean, default: true },
                    content: [
                        {
                            id: { type: mongoose.Schema.Types.Mixed },
                            title: { type: String, default: '' },
                            page: { type: String, default: '' },
                            subheadings: [
                                {
                                    id: { type: mongoose.Schema.Types.Mixed },
                                    title: { type: String, default: '' },
                                    page: { type: String, default: '' }
                                }
                            ]
                        }
                    ]
                },
                pageThumbnails: { type: Boolean, default: true },
                bookmark: { type: Boolean, default: true },
                bookmarkSettings: {
                    icon: { type: String, default: 'default' },
                    font: { type: String, default: 'Poppins' },
                    color: { type: String, default: '#C45A5A' },
                    shape: { type: Number, default: 1 },
                    style: { type: Number, default: 1 },
                    items: [
                        {
                            id: { type: mongoose.Schema.Types.Mixed },
                            title: { type: String, default: '' },
                            page: { type: String, default: '' }
                        }
                    ]
                },
                startEndNav: { type: Boolean, default: true },
                
            },
            viewing: {
                zoom: { type: Boolean, default: true },
                zoomSettings: {
                    maximumZoom: { type: Number, default: 4 },
                    twoClickToZoom: { type: Boolean, default: true }
                },
                fullScreen: { type: Boolean, default: true }
            },
            interaction: {
                search: { type: Boolean, default: true },
                gallery: { type: Boolean, default: true },
                gallerySettings: {
                    imageFitType: { type: String, default: 'Fill All' },
                    images: [
                        {
                            id: { type: mongoose.Schema.Types.Mixed },
                            url: { type: String, default: '' },
                            src: { type: String, default: '' },
                            name: { type: String, default: '' },
                            fileName: { type: String, default: '' }
                        }
                    ],
                    transitionEffect: { type: String, default: 'Linear' },
                    primaryColor: { type: String, default: '#4F46E5' },
                    secondaryColor: { type: String, default: '#9CA3AF' },
                    bgColor: { type: String, default: '#FFFFFF' },
                    navigationIconType: { type: String, default: 'Chevron' },
                    autoPlay: { type: Boolean, default: true },
                    speed: { type: Number, default: 2 },
                    infiniteLoop: { type: Boolean, default: true },
                    showDots: { type: Boolean, default: true },
                }
            },
            media: {
                autoFlip: { type: Boolean, default: true },
                autoFlipSettings: {
                    duration: { type: Number, default: 4 },
                    countdown: { type: Boolean, default: true }
                },
                audio: { type: Boolean, default: true },
                audioSettings: {
                    flipSound: { type: String, default: 'Soft Paper Flip' },
                    pageSpecificSound: { type: Boolean, default: false },
                    bgSound: { type: String, default: 'BG Sound 1' },
                    bgSoundFile: { type: String, default: '' },
                    customBgSounds: [
                        {
                            id: { type: mongoose.Schema.Types.Mixed },
                            name: { type: String, default: '' },
                            url: { type: String, default: '' },
                            fileName: { type: String, default: '' }
                        }
                    ]
                }
            },
            shareExport: {
                share: { type: Boolean, default: true },
                download: { type: Boolean, default: true }
            },
            brandingProfile: {
                logo: { type: Boolean, default: true },
                profile: { type: Boolean, default: true }
            }
        },
        Layouts: {
            layoutStyle: { type: mongoose.Schema.Types.Mixed, default: 1 },
            layoutColors: {
                toolbarColor: {
                    primary: { type: String, default: '' },
                    secondary: { type: String, default: '' }
                },
                popupColor: {
                    primary: { type: String, default: '' },
                    secondary: { type: String, default: '' }
                }
            }
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
