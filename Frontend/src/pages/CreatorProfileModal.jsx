import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import p1 from '../assets/Explore/p1.png';
import cover1 from '../assets/Explore/c-bg1.png';
import cover2 from '../assets/Explore/c-bg2.png';
import cover3 from '../assets/Explore/c-bg3.png';
import cover4 from '../assets/Explore/c-bg4.png';
import cover5 from '../assets/Explore/c-bg5.png';

export default function CreatorProfileModal({ isOpen, onClose, creator }) {
    const [viewMode, setViewMode] = useState('shelf');

    if (!isOpen) return null;

    // Mock books data for the shelf
    const books = [
        { title: "Thinking, Fast and Slow", cover: cover1 },
        { title: "The Art of Spending Money", cover: cover2 },
        { title: "Games People Play", cover: cover3 },
        { title: "The Psychology of Leadership", cover: cover4 },
        { title: "Just Keep Buying", cover: cover5 },
        { title: "Seduction", cover: cover1 },
        { title: "Thinking, Fast and Slow 2", cover: cover2 },
        { title: "The Art of Spending Money 2", cover: cover3 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[40] flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-[2vw] pb-[2vw] pt-[10vh]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#f8f9fa] w-[85vw] h-[85vh] p-[1vw] mt-[2vw] rounded-[1.2vw] flex flex-col relative shadow-2xl overflow-y-auto overflow-x-hidden no-scrollbar"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-[1.5vw] right-[1.5vw] z-50 bg-white/50 hover:bg-white rounded-[0.4vw] p-[0.4vw] shadow-sm transition-colors border border-black/10"
                        >
                            <Icon icon="mingcute:close-fill" className="w-[1vw] h-[1vw] text-gray-600" />
                        </button>

                        {/* Banner */}
                        <div className="relative w-full rounded-[1vw] z-[05] flex-shrink-0 h-[8vw]">
                            <div className="absolute top-0 inset-x-0 rounded-[1vw] overflow-hidden h-[14vw]" style={{ backgroundImage: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' }}>
                                <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.6) 0%, transparent 70%), radial-gradient(ellipse at bottom right, rgba(255,255,255,0.4) 0%, transparent 60%)' }}></div>
                                <div className="absolute inset-0 opacity-20 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 80%)' }}></div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex flex-col md:flex-row relative mt-[1vw] bg-white border-2 border-gray-200 rounded-[1vw] shadow-sm flex-1 min-h-0 min-w-0 w-full z-[40]">

                            {/* Left Column (Avatar + Info) */}
                            <div className="w-[22vw] flex-shrink-0 border-r-2 border-gray-200 relative flex flex-col min-h-0">
                                <div className="flex flex-col items-center flex-1 min-h-0 z-[50] w-full">

                                    {/* Avatar Wrapper */}
                                    <div className="relative flex justify-center items-center z-30 w-full px-[2vw] mt-[-5vw]">
                                        <div className="flex justify-between items-end w-full">
                                            <div className="w-[11.5vw] h-[11.5vw] rounded-full overflow-hidden relative bg-white border-[0.4vw] border-white flex items-center justify-center shadow-sm">
                                                <img src={creator?.profileImg || p1} alt="Profile Avatar" className="w-full h-full object-cover" />
                                            </div>
                                            {/* Share Button */}
                                            <button className="flex items-center gap-[0.4vw] mb-[2vw] px-[1vw] py-[0.5vw] bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-[0.8vw] font-medium text-gray-700">
                                                <Icon icon="ph:share-network-fill" className="w-[1.2vw] h-[1.2vw]" /> Share
                                            </button>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <h2 className="text-[1.5vw] font-semibold text-gray-900 mt-[1vw] w-full px-[2vw] text-left truncate">{creator?.name || 'Luffy'}</h2>

                                    {/* Info Sections */}
                                    <div id="left-scroll-container" className="w-full mt-[1vw] pb-[2vw] flex flex-col flex-1 overflow-y-auto min-h-0 no-scrollbar text-left">
                                        {/* About */}
                                        <div className="px-[2vw] py-[1vw]">
                                            <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                                                <Icon icon="mdi:information" className="w-[1vw] h-[1vw]" /> About
                                            </h3>
                                            <p className="text-[0.75vw] text-gray-500 leading-relaxed whitespace-pre-wrap">
                                                I'm going to be the King of the Pirates — that's my dream, and I'm never giving up on it. I love adventure, freedom, and good food (especially meat). I may not be the smartest, but I always trust my instincts and fight for what I believe in.
                                            </p>
                                        </div>

                                        {/* Contact Number */}
                                        <div className="px-[2vw] py-[1vw] bg-[#FAFAFA]">
                                            <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                                                <Icon icon="ph:phone-call-fill" className="w-[1vw] h-[1vw]" /> Contact Number
                                            </h3>
                                            <p className="text-[0.75vw] text-gray-500">6383319976</p>
                                        </div>

                                        {/* Company Details */}
                                        <div className="px-[2vw] py-[1vw]">
                                            <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                                                <Icon icon="mingcute:qrcode-2-fill" className="w-[1vw] h-[1vw]" /> Company / Organization Details
                                            </h3>
                                            <div className="flex flex-col gap-[0.4vw] text-[0.75vw]">
                                                <p><span className="font-semibold text-gray-700">Name :</span> <span className="text-gray-500">Fist-o Tech Private lmt</span></p>
                                                <p><span className="font-semibold text-gray-700">Industry Type :</span> <span className="text-gray-500">Software Development</span></p>
                                                <p><span className="font-semibold text-gray-700">Gmail :</span> <span className="text-gray-500">fistotech@gmail.com</span></p>
                                                <p><span className="font-semibold text-gray-700">Website :</span> <a href="#" className="text-blue-500 underline">Fist-o.com</a></p>
                                                <p><span className="font-semibold text-gray-700">Services :</span> <span className="text-gray-500">Website Development, 3D Animations, IDC</span></p>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="px-[2vw] py-[1vw] bg-[#FAFAFA] rounded-bl-[1vw]">
                                            <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                                                <Icon icon="carbon:location-filled" className="w-[1vw] h-[1vw]" /> Address
                                            </h3>
                                            <div className="text-[0.75vw] text-gray-500">
                                                <div>No. 45, Lake View Street, Near Central Bus Stand,</div>
                                                <div>Gandhipuram , Coimbatore,</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div className="flex-1 flex flex-col h-full overflow-hidden pb-[1vw]">
                                {/* Header */}
                                <div className="border border-gray-100 rounded-[0.6vw] shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-[0.8vw] px-[1.5vw] flex items-center justify-between shrink-0 mb-[1vw] bg-white mt-[1.5vw] mr-[1.5vw] ml-[1.5vw]">
                                    <h3 className="text-[1.1vw] font-bold text-gray-900">Published Flipbooks (8)</h3>
                                    
                                    <div className="flex items-center gap-[2vw]">
                                        {/* Stats */}
                                        <div className="flex items-center gap-[1.5vw] text-[0.75vw] text-gray-600">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-[0.4vw]">
                                                    <Icon icon="ph:book-open" className="w-[1.1vw] h-[1.1vw] text-gray-700" />
                                                    <span className="font-bold text-[0.9vw] text-gray-900">8</span>
                                                </div>
                                                <span className="text-[0.6vw] text-gray-400 mt-[0.2vh]">Total Books</span>
                                            </div>
                                            <div className="w-[1px] h-[3vh] bg-gray-200"></div>
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-[0.4vw]">
                                                    <Icon icon="ph:star-fill" className="w-[1.1vw] h-[1.1vw] text-yellow-400" />
                                                    <span className="font-bold text-[0.9vw] text-gray-900">4.5</span>
                                                </div>
                                                <span className="text-[0.6vw] text-gray-400 mt-[0.2vh]">Overall Ratings</span>
                                            </div>
                                            <div className="w-[1px] h-[3vh] bg-gray-200"></div>
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-[0.4vw]">
                                                    <Icon icon="ph:eye" className="w-[1.2vw] h-[1.2vw] text-gray-700" />
                                                    <span className="font-bold text-[0.9vw] text-gray-900">2.5K</span>
                                                </div>
                                                <span className="text-[0.6vw] text-gray-400 mt-[0.2vh]">Total Views</span>
                                            </div>
                                        </div>

                                        {/* View Toggles */}
                                        <div className="flex items-center gap-[0.5vw]">
                                            <button 
                                                onClick={() => setViewMode('shelf')}
                                                className={`flex items-center gap-[0.4vw] px-[0.8vw] py-[0.5vh] rounded-[0.4vw] border transition-colors ${viewMode === 'shelf' ? 'border-gray-300 text-gray-900 bg-white shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <Icon icon="mdi:bookshelf" className="w-[1vw] h-[1vw]" />
                                                <span className="text-[0.75vw] font-medium">Shelf View</span>
                                            </button>
                                            <button 
                                                onClick={() => setViewMode('list')}
                                                className={`flex items-center gap-[0.4vw] px-[0.8vw] py-[0.5vh] rounded-[0.4vw] border transition-colors ${viewMode === 'list' ? 'border-gray-300 text-gray-900 bg-white shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <Icon icon="ph:list-dashes" className="w-[1vw] h-[1vw]" />
                                                <span className="text-[0.75vw] font-medium">List View</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Catalog Section */}
                                <div id="main-scroll-container" className="flex-1 overflow-y-auto px-[1.5vw] pb-[2vw] no-scrollbar">
                                    {viewMode === 'shelf' ? (
                                        <div className="flex flex-col gap-[3vw] pt-[1vw] bg-[#d5e0d8] rounded-[0.8vw] px-[2vw] pb-[3vw] border border-gray-200 inset-shadow-sm">
                                            {Array.from({ length: Math.ceil(books.length / 4) }).map((_, rowIndex) => (
                                                <div key={rowIndex} className="relative w-full flex justify-around items-end pt-[3vw] border-b-[0.8vw] border-[#d4a373] shadow-[0_12px_15px_-5px_rgba(0,0,0,0.3)] bg-gradient-to-t from-[#e6ccb2] to-transparent">
                                                    {/* Shelf Supports */}
                                                    <div className="absolute bottom-[-0.8vw] left-[2%] w-[0.6vw] h-[0.8vw] bg-[#b07d5b]"></div>
                                                    <div className="absolute bottom-[-0.8vw] right-[2%] w-[0.6vw] h-[0.8vw] bg-[#b07d5b]"></div>
                                                    
                                                    {books.slice(rowIndex * 4, rowIndex * 4 + 4).map((book, idx) => (
                                                        <div key={idx} className="relative w-[18%] flex justify-center cursor-pointer group z-10 transition-transform duration-300 hover:translate-y-[-0.5vw]">
                                                            <img
                                                                src={book.cover}
                                                                alt={book.title}
                                                                className="w-full h-auto object-contain drop-shadow-[10px_5px_10px_rgba(0,0,0,0.3)] rounded-r-[0.3vw]"
                                                            />
                                                            <div className="absolute top-[30%] right-[-1.5vw] flex-col gap-[0.3vw] opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="bg-white rounded-full p-[0.3vw] shadow-md hover:bg-gray-100 flex items-center justify-center">
                                                                    <Icon icon="ph:dots-three-vertical-bold" className="w-[1vw] h-[1vw] text-gray-700" />
                                                                </button>
                                                                <button className="bg-black rounded-full p-[0.3vw] shadow-md mt-[0.5vw] hover:bg-gray-800 flex items-center justify-center">
                                                                    <Icon icon="mdi:information-variant" className="w-[1vw] h-[1vw] text-white" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1vw]">
                                            {books.map((book, idx) => (
                                                <div key={idx} className="border border-gray-200 rounded-[0.8vw] overflow-visible group hover:shadow-lg transition-shadow bg-white flex flex-col shadow-sm relative cursor-pointer p-[1vw]">
                                                    
                                                    {/* Top Right Menu */}
                                                    <button className="absolute top-[1.2vw] right-[1.2vw] z-20 text-gray-400 hover:text-gray-700 bg-white/80 rounded-full p-[0.2vw]">
                                                        <Icon icon="ph:dots-three-vertical-bold" className="w-[1.2vw] h-[1.2vw]" />
                                                    </button>

                                                    {/* Cover Section */}
                                                    <div className="relative h-[12vw] bg-[#e4a382] flex items-center justify-center rounded-[0.4vw]">
                                                        <img
                                                            src={book.cover}
                                                            alt={book.title}
                                                            className="w-[85%] h-[90%] object-contain transform group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                                                        />
                                                        <div className="absolute top-[0.5vw] left-[0.5vw] bg-black/40 backdrop-blur-md text-white text-[0.6vw] font-medium px-[0.6vw] py-[0.2vw] rounded-[0.2vw]">
                                                            28 Pages
                                                        </div>
                                                    </div>

                                                    {/* Stats Tags Section */}
                                                    <div className="flex flex-wrap gap-[0.3vw] mt-[0.8vw]">
                                                        <div className="flex items-center gap-[0.2vw] bg-gray-50 px-[0.4vw] py-[0.2vw] rounded-[0.2vw] border border-gray-100">
                                                            <Icon icon="ph:star-fill" className="text-yellow-400 w-[0.6vw] h-[0.6vw]" />
                                                            <span className="text-[0.55vw] text-gray-700 font-medium">4.5 <span className="text-gray-400 font-normal">(1,200) rated</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-[0.2vw] bg-gray-50 px-[0.4vw] py-[0.2vw] rounded-[0.2vw] border border-gray-100">
                                                            <Icon icon="mdi:bookshelf" className="text-orange-800 w-[0.6vw] h-[0.6vw]" />
                                                            <span className="text-[0.55vw] text-gray-700 font-medium">2.5K <span className="text-gray-400 font-normal">added to shelf</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-[0.2vw] bg-gray-50 px-[0.4vw] py-[0.2vw] rounded-[0.2vw] border border-gray-100 mt-[0.2vw]">
                                                            <Icon icon="ph:eye-fill" className="text-gray-500 w-[0.6vw] h-[0.6vw]" />
                                                            <span className="text-[0.55vw] text-gray-700 font-medium">12.5k <span className="text-gray-400 font-normal">reader</span></span>
                                                        </div>
                                                        <div className="flex items-center bg-gray-50 px-[0.4vw] py-[0.2vw] rounded-[0.2vw] border border-gray-100 mt-[0.2vw]">
                                                            <span className="text-[0.55vw] text-gray-600 font-medium">Product Catalogue</span>
                                                        </div>
                                                    </div>

                                                    {/* Details Section */}
                                                    <div className="flex items-start justify-between mt-[1vw]">
                                                        <div className="flex-1 min-w-0 pr-[1vw]">
                                                            <h4 className="text-[0.85vw] font-bold text-gray-900 truncate">
                                                                Name of the Flipbook
                                                            </h4>
                                                            <p className="text-[0.65vw] text-gray-500 mt-[0.3vw] leading-tight line-clamp-2">
                                                                Bring your content to life with a real, interactive experience.
                                                            </p>
                                                        </div>
                                                        <button className="bg-black text-white p-[0.4vw] rounded-full hover:bg-gray-800 transition-colors flex-shrink-0 shadow-md">
                                                            <Icon icon="mingcute:arrow-right-up-line" className="w-[1vw] h-[1vw]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
