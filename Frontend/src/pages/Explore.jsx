import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import exploreHeroImg from '../assets/Explore/explore-hero-section.svg';
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

const covers = [cover1, cover2, cover3, cover4, cover5];
const profiles = [p1, p2, p3, p4, p5];

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
                    className={`flex items-center justify-between w-full border-[1.5px] border-gray-300 rounded-[0.5vw] px-[1vw] py-[0.6vh] text-[0.9vw] text-gray-500 bg-white hover:bg-gray-50 transition-colors focus:outline-none ${buttonClassName}`}
                >
                    <span className="font-normal pr-[2vw]">{value}</span>
                    <svg className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
            )}

            {isOpen && (
                <div className="absolute top-full left-0 mt-[0.5vh] w-full bg-white rounded-[0.5vw] shadow-[0_4px_15px_rgba(0,0,0,0.1)] py-[1vh] z-50 border border-gray-100">
                    {options.map((opt, idx) => (
                        <div
                            key={idx}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="px-[1.2vw] py-[0.8vh] text-[0.9vw] text-[#4a5568] hover:bg-gray-50 hover:text-black cursor-pointer transition-colors"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FlipbookCard = ({ coverImg, profileImg }) => {
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

    return (
        <div className="bg-white border border-gray-100 rounded-[0.8vw] overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.06)] relative group">
            {/* Thumbnail Container */}
            <div className="relative w-full aspect-[4/4] flex items-center justify-center hover:scale-[1.1] transition-transform duration-300 ">
                <img src={coverImg} alt="Flipbook Cover" className="w-full h-full object-cover" />

                {/* Menu Button */}
                <div className="absolute top-[0.8vw] right-[0.8vw]" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="bg-white/80 backdrop-blur-sm p-[0.1vw] rounded-[0.3vw] hover:bg-white text-gray-800 focus:outline-none transition-colors shadow-sm"
                    >
                        <svg className="w-[1.2vw] h-[1.2vw]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-[110%] right-0 w-[9.5vw] bg-white rounded-[0.6vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-[1.2vh] z-20 border border-gray-100">
                            {[
                                { name: 'View Book', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> },
                                { name: 'Creator Profile', icon: <Icon icon="solar:user-bold" className="w-[1vw] h-[1vw]" /> },
                                { name: 'Add to Shelf', icon: <Icon icon="ri:book-shelf-line" className="w-[1vw] h-[1vw]" /> },
                                { name: 'Share', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg> },
                                { name: 'Download', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> },
                                { name: 'Report', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> }
                            ].map((menuItem, idx) => (
                                <button key={idx} className="w-[8.8vw] flex items-center mx-[0.5vw] gap-[0.8vw] px-[0.8vw] py-[0.8vh] transition-colors text-left rounded-md text-gray-600 hover:text-black hover:bg-gray-50">
                                    <span className="transition-colors flex items-center justify-center">{menuItem.icon}</span>
                                    <span className="text-[0.75vw] font-medium transition-colors">{menuItem.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Card Details */}
            <div className="p-[1.2vw] flex flex-col flex-1 bg-white">
                {/* Author Info */}
                <div className="flex items-center gap-[0.6vw]">
                    <img
                        src={profileImg}
                        alt="Author Avatar"
                        className="w-[2.2vw] h-[2.2vw] rounded-full bg-teal-100 border border-gray-200 object-cover"
                    />
                    <div className="flex flex-col">
                        <span className="text-[0.85vw] font-medium text-gray-900 leading-tight">Alex Johnson</span>
                        <span className="text-[0.7vw] text-gray-400 mt-[0.2vh]">Coimbatore 📍</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-[0.3vw] justify-start text-[0.75vw] text-gray-700 font-medium mt-[1.5vh] whitespace-nowrap">
                    <div className="flex items-center gap-[0.3vw]">
                        <span className="text-black font-semibold">12</span>
                        <span className="font-normal text-gray-500">Pages</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-[0.3vw]">
                        <svg className="w-[0.9vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        12.5k
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-[0.3vw]">
                        <svg className="w-[0.9vw] text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        4.5
                    </span>
                </div>

                {/* Title & Desc & Button */}
                <div className="relative flex-1 mt-[1.2vh]">
                    <h4 className="text-[0.9vw] font-semibold text-black truncate tracking-tight">Name of the Flipbook</h4>
                    <p className="text-[0.7vw] text-gray-500 leading-relaxed mt-[0.5vh] pr-[2vw]">“Bring your content to life with a real, interactive experience”</p>

                    {/* Action Button */}
                    <button className="absolute bottom-[0.5vw] right-[-0.5vw] bg-black text-white w-[2vw] h-[2vw] rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md">
                        <svg className="w-[1.5vw] h-[15vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7l-10 10M17 7H8M17 7v9"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Explore = () => {
    const [category, setCategory] = useState("All Category");
    const [sortBy, setSortBy] = useState("Most Popular");

    return (
        <div className="w-full bg-white font-sans pb-0">
            {/* Hide Scrollbar Globally for this page */}
            <style>{`
                /* Hide scrollbar for Chrome, Safari and Opera */
                ::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                * {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>

            {/* Top Hero Section Banner */}
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
                            className="h-[42vh] max-h-[460px] w-auto object-contain object-bottom shrink-0 block"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Main Content Section */}
            <div className="w-full px-[2vw] md:px-[3vw] py-[4vh] space-y-[4vh]">

                {/* Top Control Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-[2vw]">
                    <div className="flex items-center gap-[1vw]">
                        <h2 className="text-[1.8vw] font-medium text-gray-900">Explore IDC by :</h2>
                        <CustomDropdown
                            options={['All Category', 'Brochure', 'Catalog']}
                            value={category}
                            onChange={setCategory}
                            className="min-w-[12vw]"
                        />
                    </div>

                    <div className="flex items-center gap-[1.5vw] w-full md:w-auto">
                        <div className="relative flex items-center w-full md:w-[22vw]">
                            <svg className="w-[1vw] h-[1vw] text-gray-400 absolute left-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" placeholder="Search Flipbook..." className="w-full border-[1.5px] border-gray-300 rounded-[0.5vw] pl-[2.8vw] pr-[1vw] py-[0.6vh] text-[0.9vw] text-gray-700 outline-none focus:border-gray-400 placeholder-gray-400 transition-all" />
                        </div>

                        <div className="flex items-center justify-between border-[1.5px] border-gray-300 rounded-[0.5vw] p-[0.3vw] pl-[1vw] bg-white">
                            <div className="flex items-center gap-[0.5vw] text-gray-600 text-[0.9vw]">
                                <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                                <span className="font-medium whitespace-nowrap">Sort by : </span>
                            </div>

                            <CustomDropdown
                                options={['Most Popular', 'Newest']}
                                value={sortBy}
                                onChange={setSortBy}
                                className="ml-[0.5vw]"
                                renderButton={(val, isOpen, setIsOpen) => (
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="flex items-center justify-between w-full gap-[0.8vw] bg-[#f3f4f6] rounded-[0.4vw] px-[0.8vw] py-[0.3vh] focus:outline-none"
                                    >
                                        <span className="text-[0.85vw] text-gray-700 font-medium whitespace-nowrap">{val}</span>
                                        <svg className={`w-[0.9vw] h-[0.9vw] text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Layout Grid */}
                <div className="flex flex-col md:flex-row gap-[2vw] items-start">

                    {/* Left Sidebar */}
                    <div className="w-full md:w-[16vw] flex-shrink-0 bg-white border border-gray-200 rounded-[1vw] p-[1.5vw] space-y-[2vh]">
                        <div className="flex items-center gap-[0.5vw] border-b border-gray-100 pb-[1vh]">
                            <svg className="w-[1.2vw] h-[1.2vw] text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                            <span className="font-semibold text-[1vw] text-gray-800">Filter Books By</span>
                        </div>

                        {/* Flipbook Type */}
                        <div className="space-y-[1vh]">
                            <h3 className="font-semibold text-[0.9vw] text-gray-800">Flipbook Type</h3>
                            <div className="space-y-[0.8vh]">
                                {['Landscape', 'Portrait', 'Square', '3D Added Flipbook'].map((type, i) => (
                                    <label key={i} className="flex items-center justify-between cursor-pointer">
                                        <span className="text-[0.85vw] text-gray-600">{type}</span>
                                        <input type="checkbox" className="w-[1vw] h-[1vw] rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked={type === 'Portrait'} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-[1vh] pt-[1vh]">
                            <h3 className="font-semibold text-[0.9vw] text-gray-800">Category</h3>
                            <div className="space-y-[0.8vh]">
                                {['Brochure', 'Catalog', 'Magazine', 'Portfolio', 'Storybook', 'Photography Book', 'Product Catalog'].map((cat, i) => (
                                    <label key={i} className="flex items-center justify-between cursor-pointer">
                                        <span className="text-[0.85vw] text-gray-600">{cat}</span>
                                        <input type="checkbox" className="w-[1vw] h-[1vw] rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked={cat === 'Catalog'} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Ratings */}
                        <div className="space-y-[1vh] pt-[1vh]">
                            <h3 className="font-semibold text-[0.9vw] text-gray-800">Ratings</h3>
                            <div className="space-y-[0.8vh]">
                                {[
                                    { val: 5, stars: [1, 1, 1, 1, 1] },
                                    { val: 4.5, stars: [1, 1, 1, 1, 0.5] },
                                    { val: 4, stars: [1, 1, 1, 1, 0] }
                                ].map((rate, i) => (
                                    <label key={i} className="flex items-center gap-[0.5vw] cursor-pointer">
                                        <input type="radio" name="rating" className="w-[1vw] h-[1vw] border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked={rate.val === 4.5} />
                                        <span className="text-[0.85vw] text-gray-600 w-[3vw]">{rate.val} Star</span>
                                        <div className="flex gap-[0.2vw]">
                                            {rate.stars.map((s, idx) => (
                                                <svg key={idx} className={`w-[0.9vw] h-[0.9vw] ${s === 1 ? 'text-yellow-400' : s === 0.5 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                            ))}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Max Pages */}
                        <div className="space-y-[1vh] pt-[1vh]">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-[0.9vw] text-gray-800">Max Pages</h3>
                                <span className="text-[0.75vw] text-gray-400">4 - 100</span>
                            </div>
                            <div className="flex items-center gap-[1vw]">
                                <input type="range" min="4" max="100" defaultValue="24" className="w-full h-[0.4vh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                <span className="text-[0.8vw] text-gray-600 whitespace-nowrap">24 pgs</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Area (Books + Creators) */}
                    <div className="flex-1 flex flex-col">
                        {/* Books Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[1.5vw]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((item, index) => (
                                <FlipbookCard key={item} coverImg={covers[index % 5]} profileImg={profiles[index % 5]} />
                            ))}
                        </div>

                        {/* Top Creators Section */}
                        <div className="w-full pt-[6vh]">
                            <h2 className="text-[1.5vw] font-semibold text-black mb-[3vh]">Top Creators</h2>
                            <div className="ml-[1vw] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[1.5vw]">
                                {[
                                    { name: 'Monkey D. Luffy', role: 'Product Designer', banner: 'bg-gradient-to-br from-emerald-600 to-emerald-100', profileImg: p1 },
                                    { name: 'Monkey D. Luffy', role: 'Product Designer', banner: 'bg-gradient-to-br from-yellow-600 to-yellow-100', profileImg: p2 },
                                    { name: 'Monkey D. Luffy', role: 'Product Designer', banner: 'bg-gradient-to-br from-blue-600 to-blue-100', profileImg: p3 },
                                    { name: 'Monkey D. Luffy', role: 'Product Designer', banner: 'bg-gradient-to-br from-red-600 to-red-100', profileImg: p4 },
                                    { name: 'Monkey D. Luffy', role: 'Product Designer', banner: 'bg-gradient-to-br from-teal-600 to-teal-100', profileImg: p5 }
                                ].map((creator, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-[1vw] overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                                        {/* Banner */}
                                        <div className={`h-[14vh] w-full ${creator.banner}`}></div>

                                        {/* Body */}
                                        <div className="px-[1.2vw] pb-[1.2vw] relative bg-white flex-1 flex flex-col">
                                            {/* Avatar & Follow Button */}
                                            <div className="flex justify-between items-end -mt-[2.5vw] mb-[1vh]">
                                                <div className="relative shrink-0 z-10">
                                                    <div className="w-[6vw] h-[6w]  rounded-full border-[0.25vw] border-white overflow-hidden bg-white shadow-sm relative z-10">
                                                        <img src={creator.profileImg} alt="Creator" className="w-full h-full object-cover bg-gray-50" />
                                                    </div>
                                                    {/* Left Smooth Corner */}
                                                    <svg className="absolute top-[1.7vw] -left-[0.6vw] w-[0.8vw] h-[0.8vw] z-10" viewBox="0 0 10 10">
                                                        <path d="M0,10 L10,10 L10,0 A10,10 0 0,1 0,10 Z" fill="white" />
                                                    </svg>
                                                    {/* Right Smooth Corner */}
                                                    <svg className="absolute top-[1.7vw] -right-[0.58vw] w-[0.8vw] h-[0.8vw] z-10" viewBox="0 0 10 10">
                                                        <path d="M10,10 L0,10 L0,0 A10,10 0 0,0 10,10 Z" fill="white" />
                                                    </svg>
                                                </div>
                                                <button className="bg-black text-white px-[1.5vw] py-[0.3vh] rounded-full text-[0.8vw] font-medium hover:bg-gray-800 transition-colors z-10 mb-[1vw] mr-[0.5vw]">
                                                    Follow
                                                </button>
                                            </div>

                                            {/* Info */}
                                            <h4 className="text-[1vw] font-bold text-gray-900 mt-[0.5vh]">{creator.name}</h4>
                                            <p className="text-[0.7vw] text-gray-400">{creator.role}</p>
                                            <p className="text-[0.7vw] text-gray-500 mt-[1vh] leading-relaxed line-clamp-3 flex-1">“Bring your content to life with a real, interactive experience”</p>

                                            {/* Divider */}
                                            <div className="w-full h-[1px] mt-[1.5vh] mb-[1vh]"></div>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between px-[0.5vw]">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-[0.3vw] text-gray-800 font-semibold text-[0.85vw]">
                                                        <Icon icon="boxicons:book" className="w-[1.1vw] h-[1.1vw]" />
                                                        <span>8</span>
                                                    </div>
                                                    <span className="text-[0.65vw] text-gray-400 mt-[0.2vh]">Total Books</span>
                                                </div>
                                                <div className="w-[1px] h-[2.5vh] bg-gray-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-[0.3vw] text-gray-800 font-semibold text-[0.85vw]">
                                                        <Icon icon="lucide:user" className="w-[1vw] h-[1vw]" />
                                                        <span>451</span>
                                                    </div>
                                                    <span className="text-[0.65vw] text-gray-400 mt-[0.2vh]">Followers</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Explore;
