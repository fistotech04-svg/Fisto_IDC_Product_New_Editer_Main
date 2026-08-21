import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveUploadsPath } from '../utils/supabaseUtils';
import p1 from '../assets/Explore/p1.png';
import cover1 from '../assets/Explore/c-bg1.png';
import cover2 from '../assets/Explore/c-bg2.png';
import cover3 from '../assets/Explore/c-bg3.png';
import cover4 from '../assets/Explore/c-bg4.png';
import cover5 from '../assets/Explore/c-bg5.png';

const covers = [cover1, cover2, cover3, cover4, cover5];

const defaultColors = [
  '#4c5add', '#2563eb', '#059669', '#d97706', '#dc2626', 
  '#7c3aed', '#db2777', '#0891b2', '#8a4419', '#597810'
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

const defaultMockBooks = [
    { title: "Thinking, Fast and Slow", cover: cover1, pages: 28, views: '12.5k', rating: 4.5, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "The Art of Spending Money", cover: cover2, pages: 32, views: '8.1k', rating: 4.8, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "Games People Play", cover: cover3, pages: 24, views: '15.3k', rating: 4.6, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "The Psychology of Leadership", cover: cover4, pages: 40, views: '9.4k', rating: 4.9, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "Just Keep Buying", cover: cover5, pages: 36, views: '11.2k', rating: 4.7, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "Seduction", cover: cover1, pages: 20, views: '6.5k', rating: 4.3, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "Thinking, Fast and Slow 2", cover: cover2, pages: 28, views: '10.1k', rating: 4.5, description: '“Bring your content to life with a real, interactive experience”' },
    { title: "The Art of Spending Money 2", cover: cover3, pages: 30, views: '7.8k', rating: 4.6, description: '“Bring your content to life with a real, interactive experience”' },
];

const CreatorFlipbookCard = ({ book, creator, onOpenBook }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const authorName = creator?.name || 'Creator';
    const authorAvatar = (creator?.profileImg && creator?.profileImg !== 'color_only') ? creator?.profileImg : ((creator?.picture && creator?.picture !== 'color_only') ? creator?.picture : null);
    const authorLocation = creator?.city ? `${creator?.city} 📍` : (creator?.location || 'Coimbatore 📍');
    const avatarColor = getAvatarColor(authorName || creator?.email, creator?.avatarBgColor);

    const handleOpen = () => {
        if (onOpenBook) {
            onOpenBook(book);
        } else {
            const targetShareId = book.shareId || book.v_id;
            const rawAcc = String(book.access || 'public').toLowerCase();
            if (targetShareId) {
                window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
            }
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-[0.7vw] overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)] relative group">
            {/* Thumbnail Container */}
            <div className="relative w-full aspect-[4/4] flex items-center justify-center cursor-pointer" onClick={handleOpen}>
                <img src={book.cover} alt={book.title || "Flipbook Cover"} className="w-full h-full object-cover" />

                {/* Menu Button */}
                <div 
                    className={`absolute top-[0.5vw] right-[0.5vw] transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="bg-white/80 backdrop-blur-sm p-[0.15vw] rounded-[0.3vw] hover:bg-white text-gray-800 focus:outline-none transition-colors shadow-sm cursor-pointer"
                    >
                        <svg className="w-[1vw] h-[1vw]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-[110%] right-0 w-[8.5vw] bg-white rounded-[0.5vw] shadow-[0_8px_25px_rgb(0,0,0,0.12)] py-[0.8vh] z-20 border border-gray-100">
                            {[
                                { name: 'View Book', icon: <svg className="w-[0.9vw] h-[0.9vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> },
                                { name: 'Add to Shelf', icon: <Icon icon="ri:book-shelf-line" className="w-[0.9vw] h-[0.9vw]" /> },
                                { name: 'Share', icon: <svg className="w-[0.9vw] h-[0.9vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg> },
                                { name: 'Download', icon: <svg className="w-[0.9vw] h-[0.9vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> },
                                { name: 'Report', icon: <svg className="w-[0.9vw] h-[0.9vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> }
                            ].map((menuItem, mIdx) => (
                                <button
                                    key={mIdx}
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (menuItem.name === 'View Book') {
                                            handleOpen();
                                        }
                                    }}
                                    className="w-[7.8vw] flex items-center mx-[0.35vw] gap-[0.6vw] px-[0.6vw] py-[0.6vh] transition-colors text-left rounded-md text-gray-600 hover:text-black hover:bg-gray-50 cursor-pointer"
                                >
                                    <span className="transition-colors flex items-center justify-center">{menuItem.icon}</span>
                                    <span className="text-[0.68vw] font-medium transition-colors">{menuItem.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Card Details */}
            <div className="p-[0.8vw] flex flex-col flex-1 bg-white">
                {/* Author Info */}
                <div className="flex items-center gap-[0.5vw]">
                    {authorAvatar ? (
                        <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-[2vw] h-[2vw] rounded-full border border-gray-200 object-cover shrink-0"
                        />
                    ) : (
                        <div 
                            className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-white text-[0.9vw] font-bold shrink-0 shadow-inner"
                            style={{ backgroundColor: avatarColor }}
                        >
                            {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0 pr-[0.4vw]">
                        <span className="text-[0.75vw] font-semibold text-gray-900 leading-tight truncate">{authorName}</span>
                        <span className="text-[0.62vw] text-gray-400 mt-[0.1vh] truncate">{authorLocation}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-[0.25vw] justify-start text-[0.65vw] text-gray-700 font-medium mt-[1vh] whitespace-nowrap">
                    <div className="flex items-center gap-[0.25vw]">
                        <span className="text-black font-semibold">{book.pages || 28}</span>
                        <span className="font-normal text-gray-500">Pages</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-[0.25vw]">
                        <svg className="w-[0.75vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        {book.views || '12.5k'}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-[0.25vw]">
                        <svg className="w-[0.75vw] text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1L12.7 6.5L19 7.4L14.5 11.8L15.6 18.1L10 15.2L4.4 18.1L5.5 11.8L1 7.4L7.3 6.5Z"></path></svg>
                        {book.rating || 4.5}
                    </span>
                </div>

                {/* Title & Desc & Button */}
                <div className="relative flex-1 mt-[0.8vh]">
                    <h4 className="text-[0.78vw] font-semibold text-black truncate tracking-tight">{book.title || 'Name of the Flipbook'}</h4>
                    <p className="text-[0.62vw] text-gray-500 leading-relaxed mt-[0.3vh] pr-[1.8vw] line-clamp-2">{book.description || '“Bring your content to life with a real, interactive experience”'}</p>

                    {/* Action Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpen();
                        }}
                        className="absolute bottom-[0.2vw] right-[-0.2vw] bg-black text-white w-[1.6vw] h-[1.6vw] rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
                    >
                        <svg className="w-[1.2vw] h-[1.2vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7l-10 10M17 7H8M17 7v9"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function CreatorProfileModal({ isOpen, onClose, creator, isPreview = false }) {
    const [viewMode, setViewMode] = useState('shelf');
    const [profileData, setProfileData] = useState(null);
    const [booksData, setBooksData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const currentUserEmail = (() => {
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
        } catch (e) {}
        return '';
    })();
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeout = useRef(null);
    const [isChildScrollable, setIsChildScrollable] = useState(false);

    useEffect(() => {
        if (scrollProgress >= 0.99) {
            setIsChildScrollable(true);
        } else if (!isScrolling) {
            setIsChildScrollable(false);
        }
    }, [scrollProgress, isScrolling]);

    useEffect(() => {
        const handleScroll = (e) => {
            const container = document.getElementById('creator-profile-container');
            const scrollTop = container?.scrollTop || 0;
            // 12vw is roughly the distance to shrink the banner
            const maxScroll = window.innerWidth * 0.12;
            const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
            setScrollProgress(progress);

            setIsScrolling(true);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                setIsScrolling(false);
            }, 150);
        };

        const container = document.getElementById('creator-profile-container');
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }
        handleScroll();
        
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isOpen]);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const targetEmail = creator?.emailId || creator?.email || creator?.userEmail || '';

    useEffect(() => {
        if (!isOpen) return;

        const initialProfile = {
            name: creator?.name || '',
            email: targetEmail,
            emailId: targetEmail,
            picture: creator?.picture || null,
            avatarBgColor: creator?.avatarBgColor || '#E8D4C8',
            about: creator?.about || '',
            mobile: creator?.mobile || '',
            companyName: creator?.companyName || '',
            industryType: creator?.industryType || '',
            companyEmail: creator?.companyEmail || '',
            website: creator?.website || '',
            services: creator?.services || [],
            address1: creator?.address1 || '',
            address2: creator?.address2 || '',
            city: creator?.city || '',
            pincode: creator?.pincode || '',
            state: creator?.state || '',
            country: creator?.country || 'INDIA',
            socials: creator?.socials || {},
            followers: creator?.followers || [],
            following: creator?.following || [],
            bannerBg: creator?.bannerBg || { type: 'gradient', value: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' }
        };

        setProfileData(initialProfile);

        const fetchCreatorData = async () => {
            setIsLoading(true);
            try {
                const params = {};
                if (currentUserEmail) params.currentEmail = currentUserEmail;
                if (targetEmail) {
                    params.emailId = targetEmail;
                } else if (creator?.shareId) {
                    params.shareId = creator.shareId;
                } else if (creator?.v_id) {
                    params.v_id = creator.v_id;
                } else if (typeof window !== 'undefined') {
                    const match = window.location.pathname.match(/\/share=[^/]+\/([^/?#]+)/);
                    if (match && match[1]) params.shareId = match[1];
                }

                if (!params.emailId && !params.shareId && !params.v_id) {
                    setIsLoading(false);
                    return;
                }

                const res = await axios.get(`${backendUrl}/api/explore/creator`, {
                    params
                });
                if (res.data?.success) {
                    if (res.data.profile) {
                        setProfileData(res.data.profile);
                    }
                    const rawBooks = res.data.books || [];
                    const formatted = rawBooks.map((b, idx) => ({
                        rawBook: b,
                        v_id: b.v_id,
                        shareId: b.Customized_Settings?.Visibility?.shareId || b.Visibility?.shareId || b.v_id,
                        access: b.Customized_Settings?.Visibility?.access || b.Visibility?.access || 'public',
                        title: b.flipbookName || `Flipbook ${idx + 1}`,
                        cover: covers[idx % covers.length],
                        pages: b.pages?.length || 0,
                        views: b.views || '1.2k',
                        rating: b.rating || 4.5,
                        description: b.Customized_Settings?.FlipbookInfo?.quotes || '“Bring your content to life with a real, interactive experience”'
                    }));
                    setBooksData(formatted);
                }
            } catch (err) {
                console.error("[CreatorProfileModal] Error fetching creator details from backend:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCreatorData();
    }, [isOpen, targetEmail, backendUrl, creator, currentUserEmail]);

    const profileUser = profileData || creator || {};
    const books = booksData.length > 0 ? booksData : (isPreview ? defaultMockBooks : (targetEmail ? [] : defaultMockBooks));

    const handleToggleFollowModal = async () => {
        if (!currentUserEmail) {
            alert("Please log in to follow creators.");
            return;
        }
        const targetEmail = profileUser?.emailId || profileUser?.email;
        if (!targetEmail || targetEmail.toLowerCase() === currentUserEmail.toLowerCase()) return;

        const wasFollowing = profileUser?.isFollowing || (profileUser?.followers && profileUser.followers.some(f => f.toLowerCase() === currentUserEmail.toLowerCase()));

        // Optimistic update
        setProfileData(prev => {
            if (!prev) return prev;
            const newFollowers = wasFollowing
                ? (prev.followers || []).filter(f => f.toLowerCase() !== currentUserEmail.toLowerCase())
                : [...(prev.followers || []), currentUserEmail];
            return {
                ...prev,
                isFollowing: !wasFollowing,
                followers: newFollowers
            };
        });

        setIsFollowLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/explore/toggle-follow`, {
                currentEmail: currentUserEmail,
                targetEmail
            });
            if (res.data?.success) {
                setProfileData(prev => ({
                    ...prev,
                    isFollowing: res.data.isFollowing,
                    followers: res.data.followers
                }));
            }
        } catch (err) {
            console.error("Error toggling follow in modal:", err);
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleOpenBook = (book) => {
        const targetShareId = book.shareId || book.v_id;
        const rawAcc = String(book.access || 'public').toLowerCase();
        if (targetShareId) {
            window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={
                    isPreview
                        ? "absolute inset-0 z-[160] flex items-center justify-center bg-gray-900/30 backdrop-blur-[2px] pt-[9vh] pb-[8vh] px-[5vw]"
                        : "fixed top-[8vh] inset-x-0 bottom-0 z-[5000] flex items-center justify-center bg-gray-900/30 backdrop-blur-[2px] pb-[2vw]"
                }>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={
                            isPreview
                                ? "bg-[#f8f9fa] w-full h-full p-[1vw] rounded-[1.5vw] flex flex-col relative shadow-2xl overflow-hidden"
                                : "bg-[#f8f9fa] w-[85vw] h-[85vh] p-[1vw] mt-[2vw] rounded-[1.5vw] flex flex-col relative shadow-2xl overflow-hidden"
                        }
                        style={isPreview ? { zoom: 0.8 } : {}}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-[1.5vw] right-[1.5vw] z-50 bg-white/50 hover:bg-white rounded-[0.4vw] p-[0.4vw] shadow-sm transition-colors border border-gray-900/10 cursor-pointer"
                        >
                            <Icon icon="mingcute:close-fill" className="w-[1vw] h-[1vw] text-gray-600" />
                        </button>

                            {/* Overall Scroll Container */}
                            <div id="creator-profile-container" className="flex flex-col flex-1 h-full min-h-0 bg-transparent relative overflow-y-auto no-scrollbar">
                                {/* Dummy spacer to create 12vw scroll area */}
                                <div style={{ height: `calc(100% + 12vw)` }} className="w-full absolute top-0 left-0 pointer-events-none z-[-1]"></div>

                                {/* Sticky wrapper for actual content */}
                                <div className="sticky top-0 h-full flex flex-col w-full min-h-0 pointer-events-auto">

                                {/* Banner */}
                                <div className="relative w-full rounded-[1vw] z-[05] flex-shrink-0" style={{ height: `${12 - (6 * scrollProgress)}vw`, willChange: 'height' }}>
                                    {isLoading ? (
                                        <div className="absolute inset-0 rounded-[1vw] bg-gray-200 animate-pulse"></div>
                                    ) : (
                                        <div 
                                            className="absolute top-0 inset-x-0 rounded-[1vw] overflow-hidden" 
                                            style={{ 
                                                height: `${12 - (6 * scrollProgress)}vw`, 
                                                willChange: 'height',
                                                background: profileUser?.bannerBg?.type === 'solid' ? profileUser?.bannerBg?.value : undefined,
                                                backgroundImage: (profileUser?.bannerBg?.type === 'gradient' || profileUser?.bannerBg?.type === 'media')
                                                    ? profileUser?.bannerBg?.value
                                                    : (profileUser?.bannerBg?.value || 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)'),
                                                backgroundSize: profileUser?.bannerBg?.type === 'media' ? 'cover' : undefined,
                                                backgroundPosition: 'center'
                                            }}
                                        >
                                            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 150%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% -50%, rgba(255,255,255,0.4) 0%, transparent 50%)' }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* Main Content Area */}
                                <div className="flex flex-col md:flex-row relative gap-[1vw] flex-1 min-h-0 min-w-0 w-full z-[40]" style={{ marginTop: `${1 - 0.35 * scrollProgress}vw`, willChange: 'margin-top' }}>

                            {/* Left Column (Avatar + Info) */}
                            <div className="w-[22vw] flex-shrink-0 h-full bg-white border border-gray-200 rounded-[1vw] shadow-sm relative flex flex-col min-h-0">
                                {/* Bottom Fade Shadow */}
                                <div className="absolute bottom-0 left-0 w-full h-[2vw] bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-50 rounded-b-[1vw]"></div>
                                
                                <div className="flex flex-col items-center flex-1 min-h-0 z-[50] w-full">

                                    {/* Top border eraser for container */}
                                    <div
                                        className="absolute top-[-0.2vw] left-[calc(50%-6vw)] w-[12vw] h-[0.4vw] bg-white z-10 pointer-events-none"
                                        style={{ transform: `scaleX(${1 - (0.30 * scrollProgress)})`, transformOrigin: 'center', willChange: 'transform' }}
                                    ></div>

                                    {/* Avatar Wrapper */}
                                    <div 
                                        className="relative flex justify-center items-center z-30 w-[9.6vw] h-[9.6vw] mt-[-4.8vw]"
                                        style={{ transform: `scale(${1 - (0.30 * scrollProgress)})`, transformOrigin: 'center', willChange: 'transform' }}
                                    >
                                        {/* Left Smooth Corner */}
                                        <svg className="absolute top-[2.55vw] -left-[0.8vw] w-[1.2vw] h-[1.6vw] z-10 pointer-events-none" viewBox="0 0 10 10">
                                            <path d="M0,10 L10,10 L10,0 A10,10 0 0,1 0,10 Z" fill="white" />
                                        </svg>
                                        {/* Right Smooth Corner */}
                                        <svg className="absolute top-[2.55vw] -right-[0.8vw] w-[1.2vw] h-[1.6vw] z-10 pointer-events-none" viewBox="0 0 10 10">
                                            <path d="M10,10 L0,10 L0,0 A10,10 0 0,0 10,10 Z" fill="white" />
                                        </svg>

                                        <div className="w-full h-full rounded-full bg-white p-[0.64vw] relative flex items-center justify-center">
                                            {/* Semi-circle border for the bottom half */}
                                            <div
                                                className="absolute bottom-0 left-0 w-full h-[50%] border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-full pointer-events-none z-20"
                                                style={{ clipPath: 'polygon(0 16%, 100% 16%, 100% 100%, 0 100%)' }}
                                            ></div>

                                            <svg className="absolute bottom-[41.5%] -left-[0.88vw] w-[1.12vw] h-[0.88vw] z-10 pointer-events-none overflow-visible" viewBox="0 0 10 10">
                                                <path d="M -7 0 L 0 0 A 10 10 0 0 1 10 10" fill="none" stroke="#e6e8ec" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                            </svg>
                                            <svg className="absolute bottom-[41.5%] -right-[0.92vw] w-[1.12vw] h-[0.88vw] z-10 pointer-events-none overflow-visible" viewBox="0 0 10 10">
                                                <path d="M 17 0 L 10 0 A 10 10 0 0 0 0 10" fill="none" stroke="#e6e8ec" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                            </svg>

                                            {isLoading ? (
                                                <div className="w-[8.56vw] h-[8.56vw] rounded-full bg-gray-200 animate-pulse shadow-inner z-10"></div>
                                            ) : (
                                                <div 
                                                    className="w-[8.56vw] h-[8.56vw] rounded-full overflow-hidden relative shadow-inner z-10 flex items-center justify-center transition-colors duration-300"
                                                    style={{ backgroundColor: (profileUser?.picture && profileUser?.picture !== 'color_only') ? '#ffffff' : getAvatarColor(profileUser?.name || profileUser?.email, profileUser?.avatarBgColor) }}
                                                >
                                                    {(profileUser?.picture && profileUser?.picture !== 'color_only') ? (
                                                        <img src={profileUser?.picture.startsWith('blob:') || profileUser?.picture.startsWith('data:') ? profileUser?.picture : resolveUploadsPath(profileUser?.picture)} alt={profileUser?.name || "Profile Avatar"} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white text-[3.2vw] font-bold drop-shadow-md">
                                                            {profileUser?.name ? profileUser?.name.charAt(0).toUpperCase() : 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Left Action Button (Follow) */}
                                        {!isLoading && currentUserEmail && (profileUser?.emailId || profileUser?.email) && (profileUser.emailId || profileUser.email).toLowerCase() !== currentUserEmail.toLowerCase() && (
                                            <div className="absolute top-[6.5vw] -left-[5vw] z-40 flex items-center">
                                                <button 
                                                    onClick={handleToggleFollowModal}
                                                    disabled={isFollowLoading}
                                                    className={`w-[5.2vw] h-[1.7vw] rounded-full text-[0.85vw] font-medium transition-all cursor-pointer flex items-center justify-center gap-[0.3vw] ${
                                                        profileUser?.isFollowing
                                                            ? 'bg-white text-black border border-gray-200 shadow-inner hover:bg-gray-50'
                                                            : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                                                    }`}
                                                >
                                                    {isFollowLoading ? (
                                                        <Icon icon="line-md:loading-loop" className="w-[0.9vw] h-[0.9vw]" />
                                                    ) : profileUser?.isFollowing ? (
                                                        <span>Unfollow</span>
                                                    ) : (
                                                        <span>Follow</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Right Action Button (Share) */}
                                        {!isLoading && (
                                            <div 
                                                className="absolute top-[6.5vw] -right-[5.5vw] z-40"
                                                style={{ transform: `scale(${1 / (1 - (0.30 * scrollProgress))})`, transformOrigin: 'left center', willChange: 'transform' }}
                                            >
                                                <button className="flex items-center gap-[0.4vw] px-[0.8vw] py-[0.4vw] transition-colors text-[1vw] font-semibold text-gray-700 cursor-pointer">
                                                    <Icon icon="ic:round-share" className="w-[1.2vw] h-[1.2vw]" /> Share
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name & Email */}
                                    {isLoading ? (
                                        <div className="flex flex-col items-center mt-[0.8vw] gap-[0.4vw] w-full px-[1.5vw]">
                                            <div className="h-[1.3vw] w-[10vw] bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-[0.7vw] w-[8vw] bg-gray-100 rounded animate-pulse"></div>
                                            <div className="h-[0.8vw] w-[9vw] bg-gray-100 rounded animate-pulse mt-[0.3vw]"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-[1.3vw] font-bold text-gray-900 mt-[0.8vw] w-full px-[1.5vw] text-center truncate">{profileUser?.name || 'Creator'}</h2>
                                            {profileUser?.email && (
                                                <p className="text-[0.7vw] text-gray-400 px-[1.5vw] text-center truncate">{profileUser?.email}</p>
                                            )}
                                            {/* Followers & Following Stats */}
                                            <div className="flex items-center justify-center gap-[1.2vw] mt-[0.6vw] w-full px-[1.5vw]">
                                                <div className="flex items-center gap-[0.3vw]">
                                                    <span className="text-[0.85vw] font-bold text-gray-900 leading-none">
                                                        {profileUser?.followers?.length || 0}
                                                    </span>
                                                    <span className="text-[0.7vw] text-gray-500 font-medium leading-none">Followers</span>
                                                </div>
                                                <div className="w-[1px] h-[0.8vw] bg-gray-300"></div>
                                                <div className="flex items-center gap-[0.3vw]">
                                                    <span className="text-[0.85vw] font-bold text-gray-900 leading-none">
                                                        {profileUser?.following?.length || 0}
                                                    </span>
                                                    <span className="text-[0.7vw] text-gray-500 font-medium leading-none">Following</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Info Sections */}
                                    {isLoading ? (
                                        <div className="w-full mt-[1.2vw] px-[1.5vw] pb-[2vw] flex flex-col gap-[1vw]">
                                            <div className="space-y-[0.4vw]">
                                                <div className="h-[0.85vw] w-[5vw] bg-gray-200 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-full bg-gray-100 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-4/5 bg-gray-100 rounded animate-pulse"></div>
                                            </div>
                                            <div className="space-y-[0.4vw] pt-[0.5vw]">
                                                <div className="h-[0.85vw] w-[9vw] bg-gray-200 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-3/4 bg-gray-100 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-1/2 bg-gray-100 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-2/3 bg-gray-100 rounded animate-pulse"></div>
                                            </div>
                                            <div className="space-y-[0.4vw] pt-[0.5vw]">
                                                <div className="h-[0.85vw] w-[6vw] bg-gray-200 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-full bg-gray-100 rounded animate-pulse"></div>
                                                <div className="h-[0.7vw] w-1/2 bg-gray-100 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div id="left-scroll-container" className={`w-full mt-[1vw] pb-[2vw] flex flex-col flex-1 min-h-0 no-scrollbar text-left ${isChildScrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                                            {/* About */}
                                            <div className="px-[1.5vw] py-[0.8vw]">
                                                <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                                                    <Icon icon="mdi:information" className="w-[1vw] h-[1vw] text-gray-600" /> About
                                                </h3>
                                                <p className="text-[0.75vw] text-gray-500 leading-relaxed whitespace-pre-wrap">
                                                    {profileUser?.about || "“Bring your content to life with a real, interactive experience”"}
                                                </p>
                                            </div>

                                            {/* Contact Number */}
                                            {profileUser?.mobile ? (
                                                <div className="px-[1.5vw] py-[0.8vw] bg-[#FAFAFA]">
                                                    <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                                                        <Icon icon="ph:phone-call-fill" className="w-[1vw] h-[1vw] text-gray-600" /> Contact Number
                                                    </h3>
                                                    <p className="text-[0.75vw] text-gray-500">{profileUser?.mobile}</p>
                                                </div>
                                            ) : null}

                                            {/* Company Details */}
                                            <div className="px-[1.5vw] py-[0.8vw]">
                                                <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                                                    <Icon icon="mingcute:qrcode-2-fill" className="w-[1vw] h-[1vw] text-gray-600" /> Company / Organization Details
                                                </h3>
                                                <div className="flex flex-col gap-[0.4vw] text-[0.75vw]">
                                                    <p><span className="font-semibold text-gray-700">Name :</span> <span className="text-gray-500">{profileUser?.companyName || 'Not specified'}</span></p>
                                                    <p><span className="font-semibold text-gray-700">Industry Type :</span> <span className="text-gray-500">{profileUser?.industryType || 'Not specified'}</span></p>
                                                    <p><span className="font-semibold text-gray-700">Gmail :</span> <span className="text-gray-500">{profileUser?.companyEmail || profileUser?.email || 'Not specified'}</span></p>
                                                    {profileUser?.website ? (
                                                        <p><span className="font-semibold text-gray-700">Website :</span> <a href={profileUser?.website.startsWith('http') ? profileUser?.website : `https://${profileUser?.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{profileUser?.website}</a></p>
                                                    ) : (
                                                        <p><span className="font-semibold text-gray-700">Website :</span> <span className="text-gray-500">Not specified</span></p>
                                                    )}
                                                    <p><span className="font-semibold text-gray-700">Services :</span> <span className="text-gray-500">{Array.isArray(profileUser?.services) && profileUser?.services.length > 0 ? profileUser?.services.join(', ') : (typeof profileUser?.services === 'string' && profileUser?.services ? profileUser?.services : 'Not specified')}</span></p>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {(profileUser?.address1 || profileUser?.address2 || profileUser?.city || profileUser?.state) ? (
                                                <div className="px-[1.5vw] py-[0.8vw] bg-[#FAFAFA] rounded-b-[1vw]">
                                                    <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                                                        <Icon icon="carbon:location-filled" className="w-[1vw] h-[1vw] text-gray-600" /> Address
                                                    </h3>
                                                    <div className="text-[0.75vw] text-gray-500">
                                                        {profileUser?.address1 && <div>{profileUser?.address1}</div>}
                                                        {profileUser?.address2 && <div>{profileUser?.address2}</div>}
                                                        <div>{[profileUser?.city, profileUser?.state, profileUser?.pincode].filter(Boolean).join(', ')}</div>
                                                        {profileUser?.country && <div>{profileUser?.country}</div>}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div className="flex-1 flex flex-col h-full bg-white border border-gray-200 rounded-[1vw] shadow-sm relative overflow-hidden">
                                {/* Bottom Fade Shadow */}
                                <div className="absolute bottom-0 left-0 w-full h-[2vw] bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-50"></div>
                                
                                {/* Header */}
                                {isLoading ? (
                                    <div className="border border-gray-100 rounded-[0.6vw] shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-[0.7vw] px-[1vw] flex items-center justify-between shrink-0 mb-[1vw] bg-white mt-[1vw] mr-[1vw] ml-[1vw]">
                                        <div className="h-[1.2vw] w-[14vw] bg-gray-200 rounded animate-pulse"></div>
                                        <div className="flex items-center gap-[1.5vw]">
                                            <div className="h-[1.5vw] w-[5vw] bg-gray-100 rounded animate-pulse"></div>
                                            <div className="h-[1.5vw] w-[5vw] bg-gray-100 rounded animate-pulse"></div>
                                            <div className="h-[1.5vw] w-[5vw] bg-gray-100 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-gray-100 rounded-[0.6vw] shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-[0.5vw] px-[0.5vw] flex items-center justify-between shrink-0 mb-[1vw] bg-white mt-[1vw] mr-[1vw] ml-[1vw]">
                                        <h3 className="text-[1vw] font-semibold text-gray-900">Published Flipbooks ({books.length})</h3>
                                        
                                        <div className="flex items-center gap-[2vw]">
                                            {/* Stats */}
                                            <div className="flex items-center gap-[1.5vw] text-[0.75vw] text-gray-600">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-[0.4vw]">
                                                        <Icon icon="ph:book-open" className="w-[1vw] h-[1vw] text-gray-700" />
                                                        <span className="font-semibold text-[0.9vw] text-gray-500">{books.length}</span>
                                                    </div>
                                                    <span className="text-[0.6vw] text-gray-500 mt-[0.2vh]">Total Books</span>
                                                </div>
                                                <div className="w-[1px] h-[3vh] bg-gray-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-[0.4vw]">
                                                        <Icon icon="ph:star-fill" className="w-[1vw] h-[1vw] text-yellow-400" />
                                                        <span className="font-semibold text-[0.9vw] text-gray-500">4.5</span>
                                                    </div>
                                                    <span className="text-[0.6vw] text-gray-500 mt-[0.2vh]">Overall Ratings</span>
                                                </div>
                                                <div className="w-[1px] h-[3vh] bg-gray-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-[0.4vw]">
                                                        <Icon icon="ph:eye" className="w-[1vw] h-[1vw] text-gray-700" />
                                                        <span className="font-semibold text-[0.9vw] text-gray-500">{books.length > 0 ? `${(books.length * 1.2).toFixed(1)}K` : '0'}</span>
                                                    </div>
                                                    <span className="text-[0.6vw] text-gray-500 mt-[0.2vh]">Total Views</span>
                                                </div>
                                            </div>

                                            {/* View Toggles */}
                                            <div className="flex items-center gap-[0.5vw]">
                                                <button 
                                                    onClick={() => setViewMode('shelf')}
                                                    className={`flex items-center gap-[0.4vw] px-[0.8vw] py-[0.5vh] rounded-[0.4vw] border transition-colors cursor-pointer ${viewMode === 'shelf' ? 'border-gray-300 text-gray-900 bg-white shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    <Icon icon="mdi:bookshelf" className="w-[1vw] h-[1vw]" />
                                                    <span className="text-[0.75vw] font-medium">Shelf View</span>
                                                </button>
                                                <button 
                                                    onClick={() => setViewMode('list')}
                                                    className={`flex items-center gap-[0.4vw] px-[0.8vw] py-[0.5vh] rounded-[0.4vw] border transition-colors cursor-pointer ${viewMode === 'list' ? 'border-gray-300 text-gray-900 bg-white shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    <Icon icon="ph:list-dashes" className="w-[1vw] h-[1vw]" />
                                                    <span className="text-[0.75vw] font-medium">List View</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Catalog Section */}
                                <div id="main-scroll-container" className={`flex-1 px-[1.5vw] pb-[2vw] no-scrollbar ${isChildScrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                                    {isLoading ? (
                                        viewMode === 'shelf' ? (
                                            <div className="flex flex-col gap-[3vw] pt-[1vw] bg-[#d5e0d8] rounded-[0.8vw] px-[2vw] pb-[3vw] border border-gray-200 inset-shadow-sm">
                                                {[0, 1].map((shelfIdx) => (
                                                    <div key={shelfIdx} className="relative w-full flex justify-around items-end pt-[3vw] border-b-[0.8vw] border-[#d4a373] shadow-[0_12px_15px_-5px_rgba(0,0,0,0.3)] bg-gradient-to-t from-[#e6ccb2] to-transparent">
                                                        <div className="absolute bottom-[-0.8vw] left-[2%] w-[0.6vw] h-[0.8vw] bg-[#b07d5b]"></div>
                                                        <div className="absolute bottom-[-0.8vw] right-[2%] w-[0.6vw] h-[0.8vw] bg-[#b07d5b]"></div>
                                                        {[0, 1, 2, 3].map((bIdx) => (
                                                            <div key={bIdx} className="relative w-[18%] flex justify-center z-10">
                                                                <div className="w-full h-[14vw] bg-gray-300/80 rounded-r-[0.3vw] animate-pulse shadow-md"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[0.8vw]">
                                                {[0, 1, 2, 3, 4, 5, 6, 7].map((sIdx) => (
                                                    <div key={sIdx} className="bg-white border border-gray-200 rounded-[0.8vw] p-[0.6vw] flex flex-col gap-[0.5vw] shadow-sm animate-pulse">
                                                        <div className="w-full h-[12vw] bg-gray-200 rounded-[0.5vw]"></div>
                                                        <div className="h-[0.9vw] w-3/4 bg-gray-200 rounded mt-[0.2vw]"></div>
                                                        <div className="h-[0.7vw] w-1/2 bg-gray-100 rounded"></div>
                                                        <div className="flex items-center gap-[0.4vw] mt-[0.3vw] pt-[0.4vw] border-t border-gray-100">
                                                            <div className="w-[1.6vw] h-[1.6vw] rounded-full bg-gray-200 shrink-0"></div>
                                                            <div className="flex flex-col gap-[0.2vw] flex-1">
                                                                <div className="h-[0.6vw] w-2/3 bg-gray-200 rounded"></div>
                                                                <div className="h-[0.5vw] w-1/3 bg-gray-100 rounded"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : books.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-[8vh] text-gray-400">
                                            <Icon icon="ph:book-open" className="w-[3vw] h-[3vw] text-gray-300 mb-[1vh]" />
                                            <span className="text-[1vw] font-medium text-gray-600">No published flipbooks yet</span>
                                            <span className="text-[0.75vw] text-gray-400 mt-[0.3vh]">This creator hasn't published any flipbooks to explore.</span>
                                        </div>
                                    ) : viewMode === 'shelf' ? (
                                        <div className="flex flex-col gap-[3vw] pt-[1vw] bg-[#d5e0d8] rounded-[0.8vw] px-[2vw] pb-[3vw] border border-gray-200 inset-shadow-sm">
                                            {Array.from({ length: Math.ceil(books.length / 4) }).map((_, rowIndex) => (
                                                <div key={rowIndex} className="relative w-full flex justify-around items-end pt-[3vw] border-b-[0.8vw] border-[#d4a373] shadow-[0_12px_15px_-5px_rgba(0,0,0,0.3)] bg-gradient-to-t from-[#e6ccb2] to-transparent">
                                                    {/* Shelf Supports */}
                                                    <div className="absolute bottom-[-0.8vw] left-[2%] w-[0.6vw] h-[0.8vw] bg-[#b07d5b]"></div>
                                                    <div className="absolute bottom-[-0.8vw] right-[2%] w-[0.6vw] h-[0.8vw] bg-[#b07d5b]"></div>
                                                    
                                                    {books.slice(rowIndex * 4, rowIndex * 4 + 4).map((book, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            onClick={() => handleOpenBook(book)}
                                                            className="relative w-[18%] flex justify-center cursor-pointer group z-10 transition-transform duration-300 hover:translate-y-[-0.5vw]"
                                                        >
                                                            <img
                                                                src={book.cover}
                                                                alt={book.title}
                                                                className="w-full h-auto object-contain drop-shadow-[10px_5px_10px_rgba(0,0,0,0.3)] rounded-r-[0.3vw]"
                                                            />
                                                            <div className="absolute top-[30%] right-[-1.5vw] flex-col gap-[0.3vw] opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenBook(book);
                                                                    }}
                                                                    className="bg-white rounded-full p-[0.3vw] shadow-md hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <Icon icon="ph:book-open" className="w-[1vw] h-[1vw] text-gray-700" />
                                                                </button>
                                                                <button className="bg-gray-900 rounded-full p-[0.3vw] shadow-md mt-[0.5vw] hover:bg-gray-800 flex items-center justify-center cursor-pointer">
                                                                    <Icon icon="mdi:information-variant" className="w-[1vw] h-[1vw] text-white" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[0.8vw]">
                                            {books.map((book, idx) => (
                                                <CreatorFlipbookCard 
                                                    key={idx} 
                                                    book={book} 
                                                    creator={profileUser} 
                                                    onOpenBook={handleOpenBook}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
