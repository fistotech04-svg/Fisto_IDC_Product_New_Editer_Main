import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import exploreHeroImg from '../assets/Explore/explore-hero-section.png';
import cover1 from '../assets/Explore/c-bg1.png';
import cover2 from '../assets/Explore/c-bg2.png';
import cover3 from '../assets/Explore/c-bg3.png';
import cover4 from '../assets/Explore/c-bg4.png';
import cover5 from '../assets/Explore/c-bg5.png';
import p1 from '../assets/Explore/p1.png';
import p2 from '../assets/Explore/p2.png';
import p3 from '../assets/Explore/p3.png';
import p4 from '../assets/Explore/p4.png';
import p5 from '../assets/Explore/p5.png';
import Footer from './Footer';
import ShareModal from '../components/ShareModal';
import ExportModal from '../components/ExportModal';
import CreatorProfileModal from './CreatorProfileModal';
import { useToast } from '../components/CustomToast';

const covers = [cover1, cover2, cover3, cover4, cover5];
const profiles = [p1, p2, p3, p4, p5];

const defaultColors = [
    '#4c5add', '#2563eb', '#059669', '#d97706', '#dc2626',
    '#7c3aed', '#db2777', '#0891b2', '#8a4419', '#597810'
];

const defaultGradients = [
    'linear-gradient(to bottom right, #059669, #a7f3d0)',
    'linear-gradient(to bottom right, #d97706, #fde68a)',
    'linear-gradient(to bottom right, #2563eb, #bfdbfe)',
    'linear-gradient(to bottom right, #dc2626, #fecaca)',
    'linear-gradient(to bottom right, #0d9488, #99f6e4)'
];

const getAvatarColor = (identifier, customColor) => {
    if (customColor && customColor !== '#E8D4C8' && customColor !== '#ffffff' && customColor !== 'transparent') {
        return customColor;
    }
    if (!identifier) return defaultColors[0];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    return defaultColors[Math.abs(hash) % defaultColors.length];
};

const CustomDropdown = ({ options, value, onChange, className, buttonClassName, renderButton }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {renderButton ? (
                renderButton(value, isOpen, setIsOpen)
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors focus:outline-none ${buttonClassName}`}
                >
                    <span className="font-medium pr-4">{value}</span>
                    <Icon icon="lucide:chevron-down" className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-xl shadow-lg py-1.5 z-50 border border-gray-100">
                    {options.map((opt, idx) => (
                        <div
                            key={idx}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-[#ea7233] cursor-pointer transition-colors font-medium"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FlipbookCard = ({ v_id, shareId, access, rawBook, coverImg, profileImg, authorPicture, authorBgColor, bookName, authorName, location, pages, views, rating, description, onShare, onDownload, onProfileClick, onAddToShelf, isAddedToShelf }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const menuRef = useRef(null);

    const handleOpenBook = () => {
        const targetShareId = shareId || v_id;
        const rawAcc = String(access).toLowerCase();
        if (targetShareId) {
            window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayAvatar = (authorPicture && authorPicture !== 'color_only') ? authorPicture : null;
    const avatarColor = getAvatarColor(authorName || rawBook?.userEmail, authorBgColor);

    const isShareEnabled = (book) => {
        if (!book) return true;
        const target = book.rawBook || book;
        const cs = target.Customized_Settings || target.settings || {};
        if (cs.MenuBar?.shareExport?.share !== undefined) return Boolean(cs.MenuBar.shareExport.share);
        if (cs.shareExport?.share !== undefined) return Boolean(cs.shareExport.share);
        if (cs.Other_Setup?.shareExport?.share !== undefined) return Boolean(cs.Other_Setup.shareExport.share);
        if (cs.ShareExport?.share !== undefined) return Boolean(cs.ShareExport.share);
        if (target.shareExport?.share !== undefined) return Boolean(target.shareExport.share);
        return true;
    };

    const isDownloadEnabled = (book) => {
        if (!book) return true;
        const target = book.rawBook || book;
        const cs = target.Customized_Settings || target.settings || {};
        if (cs.MenuBar?.shareExport?.download !== undefined) return Boolean(cs.MenuBar.shareExport.download);
        if (cs.shareExport?.download !== undefined) return Boolean(cs.shareExport.download);
        if (cs.Other_Setup?.shareExport?.download !== undefined) return Boolean(cs.Other_Setup.shareExport.download);
        if (cs.ShareExport?.download !== undefined) return Boolean(cs.ShareExport.download);
        if (target.shareExport?.download !== undefined) return Boolean(target.shareExport.download);
        return true;
    };

    const canShare = isShareEnabled(rawBook);
    const canDownload = isDownloadEnabled(rawBook);

    const menuItems = [
        { name: 'View Book', icon: <Icon icon="lucide:eye" className="w-4 h-4" /> },
        { name: 'Creator Profile', icon: <Icon icon="solar:user-bold" className="w-4 h-4" /> },
        { name: isAddedToShelf ? 'Book Added' : 'Add to Shelf', icon: isAddedToShelf ? <Icon icon="lucide:check" className="w-4 h-4 text-green-500" /> : <Icon icon="ri:book-shelf-line" className="w-4 h-4" /> },
        ...(canShare ? [{ name: 'Share', icon: <Icon icon="lucide:share-2" className="w-4 h-4" /> }] : []),
        ...(canDownload ? [{ name: 'Download', icon: <Icon icon="lucide:download" className="w-4 h-4" /> }] : []),
        { name: 'Report', icon: <Icon icon="lucide:flag" className="w-4 h-4" /> }
    ];

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group">
            
            {/* Thumbnail Container */}
            <div className="relative w-full aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center">
                <img src={coverImg} alt="Flipbook Cover" className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" />

                {/* Top Right Floating Icons */}
                <div className="absolute top-2.5 right-2.5 flex flex-col items-center gap-1.5 z-10">
                    {/* Favorite Heart Button */}
                    <button
                        onClick={() => setIsLiked(!isLiked)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                    >
                        <Icon
                            icon={isLiked ? "fa6-solid:heart" : "fa6-regular:heart"}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? "text-red-500" : "text-slate-900"}`}
                        />
                    </button>

                    {/* Menu Dropdown Button */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-900 hover:bg-white transition-colors shadow-sm"
                        >
                            <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl py-1 z-30 border border-slate-100">
                                {menuItems.map((menuItem, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            if (menuItem.name === 'View Book') {
                                                handleOpenBook();
                                            } else if (menuItem.name === 'Creator Profile') {
                                                if (onProfileClick) onProfileClick({ name: authorName, profileImg: displayAvatar, picture: displayAvatar, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location });
                                            } else if (menuItem.name === 'Share') {
                                                if (onShare) onShare(rawBook);
                                            } else if (menuItem.name === 'Download') {
                                                if (onDownload) onDownload(rawBook);
                                            } else if (menuItem.name === 'Add to Shelf' || menuItem.name === 'Book Added') {
                                                if (onAddToShelf) onAddToShelf(rawBook);
                                            }
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left rounded-lg text-xs text-slate-700 hover:text-[#ea7233] hover:bg-orange-50/50 font-medium"
                                    >
                                        <span>{menuItem.icon}</span>
                                        <span>{menuItem.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Details */}
            <div className="pt-3 pb-1 px-1 flex flex-col flex-1 bg-white">
                
                {/* Author Info */}
                <div className="flex items-center gap-2">
                    {displayAvatar ? (
                        <img
                            src={displayAvatar}
                            alt={authorName}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 object-cover cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                            onClick={() => onProfileClick && onProfileClick({ name: authorName, profileImg: displayAvatar, picture: displayAvatar, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location })}
                        />
                    ) : (
                        <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer hover:opacity-80 transition-opacity shadow-inner"
                            style={{ backgroundColor: avatarColor }}
                            onClick={() => onProfileClick && onProfileClick({ name: authorName, profileImg: null, picture: null, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location })}
                        >
                            {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}

                    <div
                        className="flex flex-col min-w-0 cursor-pointer"
                        onClick={() => onProfileClick && onProfileClick({ name: authorName, profileImg: displayAvatar, picture: displayAvatar, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location })}
                    >
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight truncate hover:text-[#ea7233] transition-colors">
                            {authorName || 'Alex Johnson'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                            <span>{location ? String(location).replace(/📍/g, '').trim() : 'Coimbatore'}</span>
                            <Icon icon="fa6-solid:map-pin" className="w-2.5 h-3.5 text-red-500 shrink-0" />
                        </span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 font-medium mt-2.5 pb-1 border-b border-slate-100 whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{pages || 12} Pages</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-slate-600">
                        <Icon icon="lucide:eye" className="w-3 h-3 text-slate-400" />
                        {views || '12.5k'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-slate-800">
                        <Icon icon="fa6-solid:star" className="w-3 h-3 text-amber-400" />
                        {rating || 4.5}
                    </span>
                </div>

                {/* Title & Description & Arrow Button */}
                <div className="relative pt-2 flex-1 flex flex-col justify-between min-h-[4rem]">
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate tracking-tight pr-8">
                            {bookName || 'Name of the Flipbook'}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-1 pr-8 line-clamp-2">
                            {description || '“Bring your content to life with a real, interactive experience”'}
                        </p>
                    </div>

                    {/* Action Arrow Button */}
                    <button
                        onClick={handleOpenBook}
                        className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ea7233] hover:bg-[#d65a1c] text-white flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-110"
                    >
                        <Icon icon="lucide:arrow-up-right" className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </div>

            </div>
        </div>
    );
};

const FlipbookCardSkeleton = () => {
    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs animate-pulse flex flex-col justify-between">
            <div className="w-full aspect-[4/3] bg-slate-200 rounded-xl mb-3"></div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="space-y-1 flex-1">
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-2 bg-slate-100 rounded w-1/3"></div>
                    </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
        </div>
    );
};

const CreatorCard = ({ creator, onProfileClick, onToggleFollow, isFollowingLoading, currentUserEmail, index = 0 }) => {
    const emailKey = (creator.emailId || creator.email || '').toLowerCase();
    const isSelf = currentUserEmail && emailKey === currentUserEmail.toLowerCase();
    const displayAvatar = creator.picture && creator.picture !== 'color_only' ? creator.picture : null;
    const avatarColor = getAvatarColor(creator.name || emailKey, creator.avatarBgColor);

    const presetGradients = [
        'linear-gradient(135deg, #be8639 0%, #8c5b1e 100%)',
        'linear-gradient(135deg, #c68e41 0%, #9e6727 100%)',
        'linear-gradient(135deg, #ae772e 0%, #784c17 100%)',
        'linear-gradient(135deg, #be8639 0%, #9e6727 100%)',
        'linear-gradient(135deg, #c68e41 0%, #784c17 100%)'
    ];

    let bannerStyle = presetGradients[index % presetGradients.length];

    if (creator.bannerBg) {
        const val = typeof creator.bannerBg === 'string' ? creator.bannerBg : (creator.bannerBg.value || '');
        if (val) {
            // Check if it's an image URL or path
            if (val.startsWith('http') || val.startsWith('data:') || val.startsWith('/') || val.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
                bannerStyle = `url("${val}") center/cover no-repeat`;
            } else if (val.includes('#be8639') || val.includes('#9e6727')) {
                // Legacy default teal -> use requested #be8639 gradient
                bannerStyle = presetGradients[index % presetGradients.length];
            } else {
                // Custom color, gradient, or CSS background set by user
                bannerStyle = val;
            }
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group">
            
            {/* Top Banner & Header */}
            <div>
                {/* Banner Gradient */}
                <div
                    className="w-full h-28 sm:h-32 relative cursor-pointer"
                    style={{ background: bannerStyle }}
                    onClick={() => onProfileClick(creator)}
                />

                {/* Avatar & Follow Row (overlapping banner) */}
                <div className="px-5 flex items-end justify-between -mt-10 mb-2 relative z-10">
                    <div
                        className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-white shadow-sm overflow-hidden cursor-pointer shrink-0"
                        onClick={() => onProfileClick(creator)}
                    >
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt={creator.name}
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            <div
                                className="w-full h-full rounded-full flex items-center justify-center text-white text-xl font-bold"
                                style={{ backgroundColor: avatarColor }}
                            >
                                {creator.name ? creator.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>

                    {!isSelf && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFollow(emailKey);
                            }}
                            disabled={isFollowingLoading}
                            className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs mb-1 cursor-pointer flex items-center justify-center gap-1 ${
                                creator.isFollowing
                                    ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                                    : 'bg-black text-white hover:bg-slate-800'
                            }`}
                        >
                            {isFollowingLoading ? (
                                <Icon icon="line-md:loading-loop" className="w-3.5 h-3.5" />
                            ) : creator.isFollowing ? (
                                <span>Following</span>
                            ) : (
                                <span>Follow</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Left Aligned Creator Info */}
                <div className="px-5 pt-1 pb-3 text-left">
                    <h3
                        className="text-base sm:text-lg font-bold text-slate-900 leading-snug cursor-pointer hover:text-[#ea7233] transition-colors truncate"
                        onClick={() => onProfileClick(creator)}
                    >
                        {creator.name || 'Monkey D. Luffy'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {creator.industryType || creator.companyName || 'Product Designer'}
                    </p>
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2 font-normal">
                        {creator.about || '"Bring your content to life with a real, interactive experience"'}
                    </p>
                </div>
            </div>

            {/* Bottom Stats Footer */}
            <div className="px-5 py-3 border-t border-slate-100/80 flex items-center justify-around text-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs sm:text-sm">
                        <Icon icon="boxicons:book" className="w-4 h-4 text-slate-700" />
                        <span>{creator.totalBooks !== undefined && creator.totalBooks !== null ? creator.totalBooks : (creator.booksCount || 0)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total Books</span>
                </div>
                
                <div className="w-[1px] h-7 bg-slate-100" />

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs sm:text-sm">
                        <Icon icon="lucide:user" className="w-3.5 h-3.5 text-slate-700" />
                        <span>{creator.followersCount !== undefined && creator.followersCount !== null ? creator.followersCount : (creator.followers?.length || 0)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Followers</span>
                </div>
            </div>

        </div>
    );
};

const Explore = () => {
    const [exploreMode, setExploreMode] = useState('books'); // 'books' | 'creators'
    const [booksData, setBooksData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();
    const [shelfBookIds, setShelfBookIds] = useState([]);

    // Mobile/Tab Filter Drawer State
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Sidebar Filter States
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedPages, setSelectedPages] = useState([]);
    const [selectedPublishDates, setSelectedPublishDates] = useState([]);
    
    // Creator Sidebar Filter States
    const [industrySearch, setIndustrySearch] = useState('');
    const [selectedCreatorCategories, setSelectedCreatorCategories] = useState([]);
    const [selectedCreatorTypes, setSelectedCreatorTypes] = useState([]);
    const [selectedLocationCountry, setSelectedLocationCountry] = useState('All Countries');
    const [selectedLocationState, setSelectedLocationState] = useState('All States');
    const [selectedLocationCity, setSelectedLocationCity] = useState('All Cities');
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);
    const [selectedCreatorBooks, setSelectedCreatorBooks] = useState([]);
    const [selectedCreatorFollowers, setSelectedCreatorFollowers] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Most Popular');
    const [category, setCategory] = useState('All Category');

    const currentUserEmail = React.useMemo(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                if (u?.emailId || u?.email) return (u.emailId || u.email).toLowerCase();
            }
            const storedProfile = localStorage.getItem('user_profile');
            if (storedProfile) {
                const p = JSON.parse(storedProfile);
                if (p?.emailId || p?.email) return (p.emailId || p.email).toLowerCase();
            }
        } catch (e) { }
        return '';
    }, []);

    const [topCreators, setTopCreators] = useState([]);
    const [isCreatorsLoading, setIsCreatorsLoading] = useState(true);
    const [followingLoadingMap, setFollowingLoadingMap] = useState({});

    useEffect(() => {
        if (!currentUserEmail) return;
        const fetchShelfBooks = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const res = await axios.get(`${backendUrl}/api/profile/my-shelf-books?emailId=${encodeURIComponent(currentUserEmail)}`);
                if (res.data && res.data.books) {
                    setShelfBookIds(res.data.books.map(b => b.v_id));
                }
            } catch (err) {
                console.error("Error fetching shelf books:", err);
            }
        };
        fetchShelfBooks();
    }, [currentUserEmail]);

    const handleToggleFollow = async (targetEmail) => {
        if (!currentUserEmail) {
            toast.error("Please log in to follow creators.");
            return;
        }
        if (!targetEmail) return;

        const normTarget = targetEmail.trim().toLowerCase();
        if (normTarget === currentUserEmail) return;

        const prevCreators = [...topCreators];
        const targetCreator = topCreators.find(c => (c.emailId || c.email)?.toLowerCase() === normTarget);
        const wasFollowing = targetCreator?.isFollowing || false;

        setTopCreators(prev => prev.map(c => {
            if ((c.emailId || c.email)?.toLowerCase() === normTarget) {
                const newCount = wasFollowing ? Math.max(0, (c.followersCount || 1) - 1) : (c.followersCount || 0) + 1;
                return {
                    ...c,
                    isFollowing: !wasFollowing,
                    followersCount: newCount
                };
            }
            return c;
        }));

        setFollowingLoadingMap(prev => ({ ...prev, [normTarget]: true }));

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/explore/toggle-follow`, {
                currentEmail: currentUserEmail,
                targetEmail: normTarget
            });

            if (res.data?.success) {
                setTopCreators(prev => prev.map(c => {
                    if ((c.emailId || c.email)?.toLowerCase() === normTarget) {
                        return {
                            ...c,
                            isFollowing: res.data.isFollowing,
                            followersCount: res.data.followersCount,
                            followers: res.data.followers
                        };
                    }
                    return c;
                }));
            } else {
                setTopCreators(prevCreators);
            }
        } catch (err) {
            console.error("Error toggling follow status:", err);
            setTopCreators(prevCreators);
        } finally {
            setFollowingLoadingMap(prev => ({ ...prev, [normTarget]: false }));
        }
    };

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedBookForModal, setSelectedBookForModal] = useState(null);

    const navigate = useNavigate();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedCreator, setSelectedCreator] = useState(null);

    const handleProfileClick = (creator) => {
        const creatorEmail = creator?.emailId || creator?.email || creator?.userEmail || '';
        if (creatorEmail) {
            navigate(`/profile/${encodeURIComponent(creatorEmail)}`);
        } else {
            setSelectedCreator(creator);
            setIsProfileModalOpen(true);
        }
    };

    const handleOpenShareModal = (rawBook) => {
        setSelectedBookForModal(rawBook);
        setIsShareModalOpen(true);
    };

    const handleOpenExportModal = (rawBook) => {
        setSelectedBookForModal(rawBook);
        setIsExportModalOpen(true);
    };

    const handleAddToShelf = async (rawBook) => {
        if (!currentUserEmail) {
            toast.error("Please log in to add books to your shelf.");
            return;
        }
        const isAdded = shelfBookIds.includes(rawBook.v_id);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        try {
            if (isAdded) {
                const res = await axios.post(`${backendUrl}/api/profile/remove-from-shelf`, {
                    emailId: currentUserEmail,
                    bookId: rawBook.v_id
                });
                if (res.data?.success) {
                    toast.success("Book removed from your shelf.");
                    setShelfBookIds(prev => prev.filter(id => id !== rawBook.v_id));
                } else {
                    toast.error(res.data?.message || "Failed to remove book from shelf");
                }
            } else {
                const res = await axios.post(`${backendUrl}/api/profile/add-to-shelf`, {
                    emailId: currentUserEmail,
                    bookId: rawBook.v_id,
                    folderName: 'My Flipbooks'
                });
                if (res.data?.success) {
                    toast.success("Book successfully added to your shelf!");
                    setShelfBookIds(prev => [...prev, rawBook.v_id]);
                } else {
                    toast.error(res.data?.message || "Failed to add book to shelf");
                    if (res.data?.message === 'Book is already on your shelf') {
                        setShelfBookIds(prev => [...prev, rawBook.v_id]);
                    }
                }
            }
        } catch (err) {
            console.error("Error managing shelf:", err);
            toast.error(err.response?.data?.message || "Error updating shelf");
        }
    };

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        const fetchPublishedBooks = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${backendUrl}/api/explore/published`);

                if (response.data && response.data.books) {
                    const formattedBooks = response.data.books.map(book => {
                        let rawOrient = (book.Customized_Settings?.FlipbookInfo?.orientation || '').toLowerCase();
                        if (!rawOrient) {
                            const w = book.Customized_Settings?.FlipbookInfo?.width;
                            const h = book.Customized_Settings?.FlipbookInfo?.height;
                            if (w && h) {
                                rawOrient = w > h ? 'landscape' : w < h ? 'portrait' : 'square';
                            } else {
                                rawOrient = 'portrait';
                            }
                        }

                        let typeName = 'Portrait';
                        if (rawOrient.includes('landscape')) typeName = 'Landscape';
                        else if (rawOrient.includes('square')) typeName = 'Square';
                        else if (rawOrient.includes('portrait')) typeName = 'Portrait';

                        const has3D = Boolean(
                            book.has3D || 
                            book.is3D || 
                            book.has3DModels || 
                            (book.Customized_Settings?.InteractionThreedModel && Object.keys(book.Customized_Settings.InteractionThreedModel).length > 0)
                        );

                        const vis = book.Customized_Settings?.Visibility || book.Visibility || {};
                        const shareId = vis.shareId || book.v_id;
                        const access = (vis.access || 'public').toLowerCase();

                        return {
                            rawBook: book,
                            v_id: book.v_id,
                            shareId: shareId,
                            access: access,
                            userEmail: book.userEmail,
                            bookName: book.flipbookName,
                            authorName: book.authorName || (book.userEmail ? book.userEmail.split('@')[0] : "Creator"),
                            location: book.city || book.location || "Coimbatore",
                            authorPicture: book.authorPicture || null,
                            authorBgColor: book.authorBgColor || '#E8D4C8',
                            pages: book.pages?.length || 12,
                            views: "12.5k",
                            rating: 4.5,
                            description: book.Customized_Settings?.FlipbookInfo?.quotes,
                            type: typeName,
                            has3D: has3D,
                            is3D: has3D,
                            category: book.Customized_Settings?.FlipbookInfo?.category || "Catalog"
                        };
                    }).filter(book => book.access === 'public');

                    setBooksData(formattedBooks);
                }
            } catch (err) {
                console.error("Error fetching data from backend API:", err);
                setError("Failed to load flipbooks from server.");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTopCreators = async () => {
            try {
                setIsCreatorsLoading(true);
                const params = {};
                if (currentUserEmail) params.excludeEmail = currentUserEmail;

                const res = await axios.get(`${backendUrl}/api/explore/top-creators`, { params });
                if (res.data && res.data.creators) {
                    setTopCreators(res.data.creators);
                }
            } catch (err) {
                console.error("Error fetching top creators from backend API:", err);
            } finally {
                setIsCreatorsLoading(false);
            }
        };

        fetchPublishedBooks();
        fetchTopCreators();
    }, [currentUserEmail]);

    // Filter booksData based on active selections
    const filteredBooks = booksData.filter(book => {
        if (searchQuery && !book.bookName.toLowerCase().includes(searchQuery.toLowerCase()) && !book.authorName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        if (selectedTypes.length > 0) {
            const isTypeMatched = selectedTypes.some(typeOpt => {
                if (typeOpt === "3D Added Flipbook") {
                    return book.has3D || book.is3D;
                }
                return book.type?.toLowerCase() === typeOpt.toLowerCase();
            });
            if (!isTypeMatched) return false;
        }

        if (selectedCategories.length > 0) {
            const isCatMatched = selectedCategories.some(catOpt =>
                book.category?.toLowerCase() === catOpt.toLowerCase()
            );
            if (!isCatMatched) return false;
        }

        if (selectedPages.length > 0 && !selectedPages.includes('All')) {
            const bookPages = Number(book.pages || 1);
            const isPageMatched = selectedPages.some(pageOpt => {
                if (pageOpt === '1 - 8 Pages') return bookPages >= 1 && bookPages <= 8;
                if (pageOpt === '8 - 16 Pages') return bookPages > 8 && bookPages <= 16;
                if (pageOpt === '16 - 24 Pages') return bookPages > 16 && bookPages <= 24;
                if (pageOpt === '24 - MAX Pages') return bookPages > 24;
                return true;
            });
            if (!isPageMatched) return false;
        }

        if (selectedPublishDates.length > 0 && !selectedPublishDates.includes('All Time')) {
            const rawDate = book.rawBook?.createdAt || book.rawBook?.updatedAt;
            if (rawDate) {
                const created = new Date(rawDate);
                const now = new Date();
                const diffDays = (now - created) / (1000 * 60 * 60 * 24);
                const isDateMatched = selectedPublishDates.some(dateOpt => {
                    if (dateOpt === 'Today') return diffDays <= 1;
                    if (dateOpt === 'Before 3 days') return diffDays <= 3;
                    if (dateOpt === 'This Week') return diffDays <= 7;
                    if (dateOpt === 'This Month') return diffDays <= 30;
                    if (dateOpt === 'This Year') return diffDays <= 365;
                    return true;
                });
                if (!isDateMatched) return false;
            }
        }

        return true;
    });

    // Dynamic Filter Count Helpers for Books
    const getCategoryCount = (item) => {
        const norm = item.toLowerCase();
        return booksData.filter(b => {
            const cat = (b.category || '').toLowerCase();
            if (norm.includes('photograph')) return cat.includes('photo');
            return cat === norm;
        }).length;
    };

    const getTypeCount = (item) => {
        if (item === "3D Added Flipbook") {
            return booksData.filter(b => b.has3D || b.is3D).length;
        }
        const norm = item.toLowerCase();
        return booksData.filter(b => (b.type || '').toLowerCase() === norm).length;
    };

    const getPageCount = (item) => {
        if (item === 'All') return booksData.length;
        if (item === '1 - 8 Pages') return booksData.filter(b => b.pages >= 1 && b.pages <= 8).length;
        if (item === '8 - 16 Pages') return booksData.filter(b => b.pages > 8 && b.pages <= 16).length;
        if (item === '16 - 24 Pages') return booksData.filter(b => b.pages > 16 && b.pages <= 24).length;
        if (item === '24 - MAX Pages') return booksData.filter(b => b.pages > 24).length;
        return booksData.length;
    };

    const getPublishDateCount = (item) => {
        if (item === 'All Time') return booksData.length;
        const now = new Date();
        return booksData.filter(b => {
            if (!b.rawBook?.createdAt) return true;
            const created = new Date(b.rawBook.createdAt);
            const diffDays = (now - created) / (1000 * 60 * 60 * 24);
            if (item === 'Today') return diffDays <= 1;
            if (item === 'Before 3 days') return diffDays <= 3;
            if (item === 'This Week') return diffDays <= 7;
            if (item === 'This Month') return diffDays <= 30;
            if (item === 'This Year') return diffDays <= 365;
            return true;
        }).length;
    };

    const getIndustryCount = (item) => {
        const norm = item.toLowerCase();
        return topCreators.filter(c => {
            const ind = (c.industryType || c.companyName || 'Manufacturing').toLowerCase();
            return ind.includes(norm);
        }).length;
    };

    const getCreatorTypeCount = (item) => {
        const norm = item.toLowerCase();
        return topCreators.filter(c => {
            const role = (c.role || c.creatorType || 'Individual').toLowerCase();
            return role.includes(norm);
        }).length;
    };

    const getSpecializationCount = (item) => {
        const norm = item.toLowerCase().split(' ')[0];
        return topCreators.filter(c => {
            const spec = (c.specialization || c.industryType || 'Product Catalogues').toLowerCase();
            return spec.includes(norm);
        }).length;
    };

    const getCreatorCategoryCount = (item) => {
        if (item === 'All') return topCreators.length;
        const norm = item.toLowerCase().split(' ')[0];
        return topCreators.filter(c => {
            const ind = (c.industryType || c.companyName || 'Product Designer').toLowerCase();
            return ind.includes(norm);
        }).length;
    };

    const getCreatorBooksFilterCount = (item) => {
        if (item === 'All') return topCreators.length;
        return topCreators.filter(c => {
            const bCount = c.totalBooks !== undefined ? c.totalBooks : (c.booksCount || 0);
            if (item === '1 - 5 Books') return bCount >= 1 && bCount <= 5;
            if (item === '5 - 10 Books') return bCount > 5 && bCount <= 10;
            if (item === '10+ Books') return bCount > 10;
            return true;
        }).length;
    };

    const getCreatorFollowersFilterCount = (item) => {
        if (item === 'All') return topCreators.length;
        return topCreators.filter(c => {
            const fCount = c.followersCount !== undefined ? c.followersCount : (c.followers?.length || 0);
            if (item === '1 - 50 Followers') return fCount >= 1 && fCount <= 50;
            if (item === '50 - 200 Followers') return fCount > 50 && fCount <= 200;
            if (item === '200+ Followers') return fCount > 200;
            return true;
        }).length;
    };

    const filteredCreators = topCreators.filter(creator => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const nameMatch = creator.name?.toLowerCase().includes(q);
            const emailMatch = (creator.emailId || creator.email)?.toLowerCase().includes(q);
            const companyMatch = creator.companyName?.toLowerCase().includes(q);
            const industryMatch = creator.industryType?.toLowerCase().includes(q);
            if (!nameMatch && !emailMatch && !companyMatch && !industryMatch) return false;
        }

        if (selectedCreatorCategories.length > 0 && !selectedCreatorCategories.includes('All')) {
            const ind = (creator.industryType || creator.companyName || 'Manufacturing').toLowerCase();
            const isMatch = selectedCreatorCategories.some(cat => ind.includes(cat.toLowerCase().split(' ')[0]));
            if (!isMatch) return false;
        }

        if (selectedCreatorTypes.length > 0) {
            const role = (creator.role || creator.creatorType || 'Individual').toLowerCase();
            const isMatch = selectedCreatorTypes.some(type => role.includes(type.toLowerCase().split(' ')[0]));
            if (!isMatch) return false;
        }

        if (selectedSpecializations.length > 0) {
            const spec = (creator.specialization || creator.industryType || 'Product Catalogues').toLowerCase();
            const isMatch = selectedSpecializations.some(s => spec.includes(s.toLowerCase().split(' ')[0]));
            if (!isMatch) return false;
        }

        if (selectedCreatorBooks.length > 0 && !selectedCreatorBooks.includes('All')) {
            const bCount = creator.totalBooks !== undefined ? creator.totalBooks : (creator.booksCount || 0);
            const isMatch = selectedCreatorBooks.some(range => {
                if (range === '1 - 5 Books') return bCount >= 1 && bCount <= 5;
                if (range === '5 - 10 Books') return bCount > 5 && bCount <= 10;
                if (range === '10+ Books') return bCount > 10;
                return true;
            });
            if (!isMatch) return false;
        }

        if (selectedCreatorFollowers.length > 0 && !selectedCreatorFollowers.includes('All')) {
            const fCount = creator.followersCount !== undefined ? creator.followersCount : (creator.followers?.length || 0);
            const isMatch = selectedCreatorFollowers.some(range => {
                if (range === '1 - 50 Followers') return fCount >= 1 && fCount <= 50;
                if (range === '50 - 200 Followers') return fCount > 50 && fCount <= 200;
                if (range === '200+ Followers') return fCount > 200;
                return true;
            });
            if (!isMatch) return false;
        }

        return true;
    });

    const handleResetAll = () => {
        setSelectedCategories([]);
        setSelectedTypes([]);
        setSelectedPages([]);
        setSelectedPublishDates([]);
        setIndustrySearch('');
        setSelectedCreatorCategories([]);
        setSelectedCreatorTypes([]);
        setSelectedLocationCountry('All Countries');
        setSelectedLocationState('All States');
        setSelectedLocationCity('All Cities');
        setSelectedSpecializations([]);
        setSelectedCreatorBooks([]);
        setSelectedCreatorFollowers([]);
        setSearchQuery('');
    };

    const removeChip = (type, val) => {
        if (type === 'type') setSelectedTypes(prev => prev.filter(t => t !== val));
        if (type === 'cat') setSelectedCategories(prev => prev.filter(c => c !== val));
        if (type === 'page') setSelectedPages(prev => prev.filter(p => p !== val));
        if (type === 'date') setSelectedPublishDates(prev => prev.filter(d => d !== val));
        if (type === 'creatorCat') setSelectedCreatorCategories(prev => prev.filter(c => c !== val));
        if (type === 'creatorBook') setSelectedCreatorBooks(prev => prev.filter(b => b !== val));
        if (type === 'creatorFollower') setSelectedCreatorFollowers(prev => prev.filter(f => f !== val));
    };

    return (
        <div className="w-full bg-white text-slate-900 font-sans min-h-screen pb-12">
            
            {/* ------------------------------------------------------------- */}
            {/* ORIGINAL HERO SECTION BANNER (UNTOUCHED) */}
            {/* ------------------------------------------------------------- */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-[#f5f5f5] border-b border-gray-100 px-[5vw]"
            >
                <div className="max-w-[85vw] mx-auto flex flex-col md:flex-row items-center justify-between gap-[3vw]">
                    {/* Left Text Block */}
                    <div className="max-w-[44vw] space-y-[1.8vh]">
                        <h1 className="text-[3.2vw] text-gray-900 font-normal tracking-tight leading-tight">
                            Explore IDC
                        </h1>

                        <p className="text-[0.9vw] text-gray-600 font-normal leading-relaxed">
                            Discover immersive digital catalogues created by businesses, designers, and creators worldwide. Explore interactive flipbooks enhanced with 3D models, hotspots, videos, animations, and rich multimedia experiences.
                        </p>

                        <div className="w-[7vw] h-[0.3vh] min-h-[2px] bg-gray-800 rounded-full mt-[1.8vh]"></div>
                    </div>

                    {/* Right Hero Graphic */}
                    <div className="relative flex justify-center md:justify-end self-end">
                        <img
                            src={exploreHeroImg}
                            alt="Explore IDC Hero Graphic"
                            className="h-[35vh] max-h-[400px] w-auto object-contain object-bottom shrink-0 block"
                        />
                    </div>
                </div>
            </motion.div>

            {/* ------------------------------------------------------------- */}
            {/* MAIN SEPARATE TWO-COLUMN LAYOUT: SIDEBAR & RIGHT CONTENT */}
            {/* ------------------------------------------------------------- */}
            {/* MOBILE & TABLET FILTER SLIDE-OVER DRAWER MODAL */}
            {isFilterDrawerOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsFilterDrawerOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-white shadow-2xl p-5 overflow-y-auto flex flex-col justify-between z-10 space-y-6">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                                <div className="flex items-center gap-2">
                                    <Icon icon="fluent:filter-28-filled" className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {exploreMode === 'creators' ? 'Filter Creators' : 'Filter Books'}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <Icon icon="lucide:x" className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drawer Filters (Reused sidebar filter list) */}
                            {exploreMode === 'creators' ? (
                                <div className="space-y-5">
                                    {/* 1. Creator Category */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="iconamoon:category" className="w-4 h-4 text-slate-700" />
                                            <span>Creator Category</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'All',
                                                'Product Designer',
                                                'Graphic Designer',
                                                'Business / Brand',
                                                'Photographer',
                                                'Agency / Studio'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCreatorCategories.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedCreatorCategories([...selectedCreatorCategories, item]);
                                                                else setSelectedCreatorCategories(selectedCreatorCategories.filter(c => c !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getCreatorCategoryCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Total Books Created */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="fluent:document-one-page-multiple-20-regular" className="w-4 h-4 text-slate-700" />
                                            <span>Books Created</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'All',
                                                '1 - 5 Books',
                                                '5 - 10 Books',
                                                '10+ Books'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCreatorBooks.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedCreatorBooks([...selectedCreatorBooks, item]);
                                                                else setSelectedCreatorBooks(selectedCreatorBooks.filter(b => b !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getCreatorBooksFilterCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Followers Range */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="fa6-regular:user" className="w-4 h-4 text-slate-700" />
                                            <span>Followers Range</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'All',
                                                '1 - 50 Followers',
                                                '50 - 200 Followers',
                                                '200+ Followers'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCreatorFollowers.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedCreatorFollowers([...selectedCreatorFollowers, item]);
                                                                else setSelectedCreatorFollowers(selectedCreatorFollowers.filter(f => f !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getCreatorFollowersFilterCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* 1. Category */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="iconamoon:category" className="w-4 h-4 text-slate-700" />
                                            <span>Category</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'Brochure',
                                                'Catalog',
                                                'Magazine',
                                                'Portfolio',
                                                'Storybook',
                                                'Photographs Book'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedCategories([...selectedCategories, item]);
                                                                else setSelectedCategories(selectedCategories.filter(c => c !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getCategoryCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Flipbook Type */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="fluent-emoji-high-contrast:page-facing-up" className="w-4 h-4 text-slate-700" />
                                            <span>Flipbook Type</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'Landscape',
                                                'Portrait',
                                                'Square',
                                                '3D Added Flipbook'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTypes.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedTypes([...selectedTypes, item]);
                                                                else setSelectedTypes(selectedTypes.filter(t => t !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getTypeCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Pages */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="fluent:document-one-page-multiple-20-regular" className="w-4 h-4 text-slate-700" />
                                            <span>Pages</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'All',
                                                '1 - 8 Pages',
                                                '8 - 16 Pages',
                                                '16 - 24 Pages',
                                                '24 - MAX Pages'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPages.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedPages([...selectedPages, item]);
                                                                else setSelectedPages(selectedPages.filter(p => p !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getPageCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4. Publish Date */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Icon icon="uiw:date" className="w-4 h-4 text-slate-700" />
                                            <span>Publish Date</span>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {[
                                                'All Time',
                                                'Today',
                                                'Before 3 days',
                                                'This Week',
                                                'This Month',
                                                'This Year'
                                            ].map((item, idx) => (
                                                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPublishDates.includes(item)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedPublishDates([...selectedPublishDates, item]);
                                                                else setSelectedPublishDates(selectedPublishDates.filter(d => d !== item));
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                        />
                                                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                        {getPublishDateCount(item)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Bottom Actions */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                                Reset All
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFilterDrawerOpen(false)}
                                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#ea7233] hover:bg-[#d65a1c] transition-colors shadow-xs"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MAIN SEPARATE TWO-COLUMN LAYOUT: SIDEBAR & RIGHT CONTENT */}
            {/* ------------------------------------------------------------- */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                
                {/* LEFT SIDEBAR FILTER PANEL (Desktop visible, Mobile/Tablet toggleable) */}
                <aside className="hidden lg:block w-64 shrink-0 space-y-6">
                    
                    {/* Header Title & Reset All Link */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Icon icon="fluent:filter-28-filled" className="w-6 h-6 text-slate-900" />
                            <h2 className="text-2xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                {exploreMode === 'creators' ? 'Filter Creators' : 'Filter Books'}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="text-xs sm:text-sm font-semibold text-red-500 hover:text-red-600 cursor-pointer transition-colors"
                        >
                            Reset All
                        </button>
                    </div>

                    {exploreMode === 'creators' ? (
                        <>
                            {/* 1. Industry */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="lucide:building-2" className="w-4 h-4 text-slate-700" />
                                    <span>Industry</span>
                                </div>
                                <div className="space-y-2 pt-1">
                                    {[
                                        'Manufacturing',
                                        'Healthcare',
                                        'Education',
                                        'Real Estate',
                                        'Architecture',
                                        'Travel & Hospitality',
                                        'Food & Beverage',
                                        'Automotive'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCreatorCategories.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCreatorCategories([...selectedCreatorCategories, item]);
                                                        else setSelectedCreatorCategories(selectedCreatorCategories.filter(c => c !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Creator Type */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="fa6-regular:user" className="w-4 h-4 text-slate-700" />
                                    <span>Creator Type</span>
                                </div>
                                <div className="space-y-2 pt-1">
                                    {[
                                        'Individual',
                                        'Freelancer',
                                        'Agency',
                                        'Company / Organization'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCreatorTypes.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCreatorTypes([...selectedCreatorTypes, item]);
                                                        else setSelectedCreatorTypes(selectedCreatorTypes.filter(t => t !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getCreatorTypeCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Location (Country, State, City) */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="fa6-solid:map-pin" className="w-4 h-4 text-slate-700" />
                                    <span>Location</span>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500">Country</span>
                                        <select
                                            value={selectedLocationCountry}
                                            onChange={(e) => setSelectedLocationCountry(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#ea7233]"
                                        >
                                            <option value="All Countries">All Countries</option>
                                            <option value="India">India</option>
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500">State</span>
                                        <select
                                            value={selectedLocationState}
                                            onChange={(e) => setSelectedLocationState(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#ea7233]"
                                        >
                                            <option value="All States">All States</option>
                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                            <option value="California">California</option>
                                            <option value="London">London</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500">City</span>
                                        <select
                                            value={selectedLocationCity}
                                            onChange={(e) => setSelectedLocationCity(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#ea7233]"
                                        >
                                            <option value="All Cities">All Cities</option>
                                            <option value="Coimbatore">Coimbatore</option>
                                            <option value="Chennai">Chennai</option>
                                            <option value="San Francisco">San Francisco</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Specialization */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="iconamoon:category" className="w-4 h-4 text-slate-700" />
                                    <span>Specialization</span>
                                </div>
                                <div className="space-y-2 pt-1">
                                    {[
                                        'Product Catalogues',
                                        'Brochures',
                                        'Portfolios',
                                        'Interactive Presentations',
                                        '3D Showcases'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSpecializations.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedSpecializations([...selectedSpecializations, item]);
                                                        else setSelectedSpecializations(selectedSpecializations.filter(s => s !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getSpecializationCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Followers Range */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="fa6-regular:user" className="w-4 h-4 text-slate-700" />
                                    <span>Followers Range</span>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    {[
                                        'All',
                                        '1 - 50 Followers',
                                        '50 - 200 Followers',
                                        '200+ Followers'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCreatorFollowers.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCreatorFollowers([...selectedCreatorFollowers, item]);
                                                        else setSelectedCreatorFollowers(selectedCreatorFollowers.filter(f => f !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs sm:text-sm text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getCreatorFollowersFilterCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 1. Category */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="iconamoon:category" className="w-4 h-4 text-slate-700" />
                                    <span>Category</span>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    {[
                                        'Brochure',
                                        'Catalog',
                                        'Magazine',
                                        'Portfolio',
                                        'Storybook',
                                        'Photographs Book'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCategories([...selectedCategories, item]);
                                                        else setSelectedCategories(selectedCategories.filter(c => c !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs sm:text-sm text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getCategoryCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                    <button type="button" className="text-xs text-slate-400 font-semibold flex items-center gap-1 pt-1 hover:text-slate-600">
                                        <span>Show more</span>
                                        <Icon icon="lucide:chevron-down" className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* 2. Flipbook Type */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="fluent-emoji-high-contrast:page-facing-up" className="w-4 h-4 text-slate-700" />
                                    <span>Flipbook Type</span>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    {[
                                        'Landscape',
                                        'Portrait',
                                        'Square',
                                        '3D Added Flipbook'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTypes.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedTypes([...selectedTypes, item]);
                                                        else setSelectedTypes(selectedTypes.filter(t => t !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs sm:text-sm text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getTypeCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                    <button type="button" className="text-xs text-slate-400 font-semibold flex items-center gap-1 pt-1 hover:text-slate-600">
                                        <span>Show more</span>
                                        <Icon icon="lucide:chevron-down" className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* 3. Pages */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="fluent:document-one-page-multiple-20-regular" className="w-4 h-4 text-slate-700" />
                                    <span>Pages</span>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    {[
                                        'All',
                                        '1 - 8 Pages',
                                        '8 - 16 Pages',
                                        '16 - 24 Pages',
                                        '24 - MAX Pages'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPages.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedPages([...selectedPages, item]);
                                                        else setSelectedPages(selectedPages.filter(p => p !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs sm:text-sm text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getPageCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Publish Date */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                    <Icon icon="uiw:date" className="w-4 h-4 text-slate-700" />
                                    <span>Publish Date</span>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    {[
                                        'All Time',
                                        'Today',
                                        'Before 3 days',
                                        'This Week',
                                        'This Month',
                                        'This Year'
                                    ].map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPublishDates.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedPublishDates([...selectedPublishDates, item]);
                                                        else setSelectedPublishDates(selectedPublishDates.filter(d => d !== item));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#ea7233] focus:ring-[#ea7233] cursor-pointer accent-[#ea7233]"
                                                />
                                                <span className="text-xs sm:text-sm text-slate-700 font-medium group-hover:text-slate-900">{item}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                                                {getPublishDateCount(item)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                </aside>

                {/* RIGHT MAIN CONTENT SECTION */}
                <main className="flex-1 w-full flex flex-col gap-6">
                    
                    {/* Right Section Top Control Bar */}
                    <div className="w-full flex flex-col gap-4">
                        <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            
                            {/* Explore by & Applied Filters Column */}
                            <div className="flex flex-col gap-2.5 w-full lg:w-auto">
                                {/* Explore by Title & Switcher Pills */}
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                                        Explore by :
                                    </h1>

                                    {/* Books / Creators Toggle Pills */}
                                    <div className="bg-slate-100/90 p-1 rounded-xl inline-flex items-center gap-1 border border-slate-200/60">
                                        <button
                                            type="button"
                                            onClick={() => setExploreMode('books')}
                                            className={`px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                                                exploreMode === 'books'
                                                    ? 'bg-black text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                            }`}
                                        >
                                            Books
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExploreMode('creators')}
                                            className={`px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                                                exploreMode === 'creators'
                                                    ? 'bg-black text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                            }`}
                                        >
                                            Creators
                                        </button>
                                    </div>
                                </div>

                                {/* Applied Filters Row (Directly below Explore by) */}
                                {(selectedTypes.length > 0 || selectedCategories.length > 0 || selectedPages.filter(p => p !== 'All').length > 0 || selectedPublishDates.filter(d => d !== 'All Time').length > 0) && (
                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                        <span className="text-xs sm:text-sm font-semibold text-slate-800 mr-1">Applied Filters :</span>
                                        
                                        {selectedTypes.map(type => (
                                            <span key={`type-${type}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#ea7233] border border-orange-200 bg-orange-50/60 shadow-2xs">
                                                <span>{type}</span>
                                                <button type="button" onClick={() => removeChip('type', type)} className="hover:text-red-600 cursor-pointer">
                                                    <Icon icon="lucide:x" className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}

                                        {selectedCategories.map(cat => (
                                            <span key={`cat-${cat}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#ea7233] border border-orange-200 bg-orange-50/60 shadow-2xs">
                                                <span>{cat}</span>
                                                <button type="button" onClick={() => removeChip('cat', cat)} className="hover:text-red-600 cursor-pointer">
                                                    <Icon icon="lucide:x" className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}

                                        {selectedPages.filter(p => p !== 'All').map(p => (
                                            <span key={`page-${p}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#ea7233] border border-orange-200 bg-orange-50/60 shadow-2xs">
                                                <span>{p}</span>
                                                <button type="button" onClick={() => removeChip('page', p)} className="hover:text-red-600 cursor-pointer">
                                                    <Icon icon="lucide:x" className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}

                                        {selectedPublishDates.filter(d => d !== 'All Time').map(d => (
                                            <span key={`date-${d}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#ea7233] border border-orange-200 bg-orange-50/60 shadow-2xs">
                                                <span>{d}</span>
                                                <button type="button" onClick={() => removeChip('date', d)} className="hover:text-red-600 cursor-pointer">
                                                    <Icon icon="lucide:x" className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Controls: Filter Toggle Button, Search, Sort By & Favorites */}
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                
                                {/* Mobile / Tablet Filter Hamburger Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsFilterDrawerOpen(true)}
                                    className="flex lg:hidden items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 font-bold transition-colors shadow-2xs cursor-pointer"
                                >
                                    <Icon icon="fluent:filter-28-filled" className="w-4 h-4 text-[#ea7233]" />
                                    <span>Filters</span>
                                </button>

                                {/* Search Input Bar */}
                                <div className="relative flex-1 lg:w-72">
                                    <Icon icon="lucide:search" className="w-4 h-4 text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search Flipbook..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ea7233] bg-white transition-all shadow-2xs"
                                    />
                                </div>

                                {/* Sort By Selector */}
                                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white shadow-2xs">
                                    <span className="text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">Sort by :</span>
                                    <CustomDropdown
                                        options={['Most Popular', 'Newest', 'Top Rated']}
                                        value={sortBy}
                                        onChange={setSortBy}
                                        buttonClassName="border-none py-0 px-1 text-slate-800 font-bold bg-transparent hover:bg-transparent"
                                    />
                                </div>

                                {/* Favorites Button */}
                                <button
                                    type="button"
                                    className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:text-red-500 bg-white hover:bg-slate-50 font-semibold transition-colors shadow-2xs cursor-pointer"
                                >
                                    <Icon icon="fa6-solid:heart" className="w-3.5 h-3.5 text-red-500" />
                                    <span>Favorites</span>
                                </button>

                            </div>

                        </div>
                    </div>

                    {/* CARDS GRID */}
                    {exploreMode === 'creators' ? (
                        isCreatorsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
                                {[...Array(8)].map((_, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs animate-pulse h-64"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
                                {filteredCreators.map((creator, index) => {
                                    const emailKey = (creator.emailId || creator.email || '').toLowerCase();
                                    return (
                                        <CreatorCard
                                            key={emailKey || index}
                                            index={index}
                                            creator={creator}
                                            onProfileClick={handleProfileClick}
                                            onToggleFollow={handleToggleFollow}
                                            isFollowingLoading={Boolean(followingLoadingMap[emailKey])}
                                            currentUserEmail={currentUserEmail}
                                        />
                                    );
                                })}
                                {filteredCreators.length === 0 && (
                                    <div className="col-span-full py-16 text-center font-semibold text-slate-600 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        No creators found matching your search.
                                    </div>
                                )}
                            </div>
                        )
                    ) : isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                            {[...Array(10)].map((_, idx) => (
                                <FlipbookCardSkeleton key={idx} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-red-500">
                            <Icon icon="lucide:alert-circle" className="w-10 h-10 mx-auto mb-2" />
                            <p className="font-semibold text-sm">{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                            {filteredBooks.map((book, index) => (
                                <FlipbookCard
                                    key={book.v_id || index}
                                    v_id={book.v_id}
                                    shareId={book.shareId}
                                    access={book.access}
                                    rawBook={book.rawBook}
                                    coverImg={covers[index % 5]}
                                    profileImg={profiles[index % 5]}
                                    authorPicture={book.authorPicture}
                                    authorBgColor={book.authorBgColor}
                                    bookName={book.bookName}
                                    authorName={book.authorName}
                                    location={book.location}
                                    pages={book.pages}
                                    views={book.views}
                                    rating={book.rating}
                                    description={book.description}
                                    onShare={handleOpenShareModal}
                                    onDownload={handleOpenExportModal}
                                    onProfileClick={handleProfileClick}
                                    onAddToShelf={handleAddToShelf}
                                    isAddedToShelf={shelfBookIds.includes(book.v_id)}
                                />
                            ))}
                            {filteredBooks.length === 0 && (
                                <div className="col-span-full py-16 text-center font-semibold text-slate-600 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    No flipbooks found matching your filters.
                                </div>
                            )}
                        </div>
                    )}
                </main>

            </div>

            {/* Footer */}
            <div className="mt-16">
                <Footer />
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                currentBook={selectedBookForModal}
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                currentBook={selectedBookForModal}
                isFromMyFlipbooks={true}
            />

            {/* Profile Modal */}
            <CreatorProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                creator={selectedCreator}
            />

        </div>
    );
};

export default Explore;
