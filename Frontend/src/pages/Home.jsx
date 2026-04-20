import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import CreateFlipbookModal from '../components/CreateFlipbookModal';
import shelfImg from '../assets/Home/shelf.png';
import Layer1 from '../assets/Home/Trees/Layer_1.png';
import Layer2 from '../assets/Home/Trees/Layer_2.png';
import Layer3 from '../assets/Home/Trees/Layer_3.png';
import Layer4 from '../assets/Home/Trees/Layer_4.png';
import Layer5 from '../assets/Home/Trees/Layer_5.png';
import page1 from '../assets/Home/A4_1.png';
import page2 from '../assets/Home/A4_2.png';
import page3 from '../assets/Home/A4_3.png';
import page4 from '../assets/Home/A4_4.png';
import page5 from '../assets/Home/A4_5.png';
import page6 from '../assets/Home/A4_6.png';
import ctaBg from '../assets/Home/black.png';

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const editorsContainerRef = useRef(null);
  const [scrollContainer, setScrollContainer] = useState(null);

  useEffect(() => {
      if (editorsContainerRef.current) {
          setScrollContainer(editorsContainerRef.current.parentElement);
      }
  }, []);

  const { scrollYProgress: editorsScrollProgress } = useScroll({
    target: editorsContainerRef,
    container: scrollContainer || undefined,
    offset: ["start start", "end end"]
  });

  // react-pageflip Logic
  const bookRef = useRef(null);
  const isInView = useInView(containerRef, { 
    margin: "-10% 0px 0px 0px",
    amount: 0.9 
  });
  
  const [page, setPage] = useState(0);

  const onPage = useCallback((e) => {
    setPage(e.data);
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!isInView || !bookRef.current) return;

      const delta = e.deltaY;
      const flipbook = bookRef.current.pageFlip();
      const state = flipbook.getState();
      
      // If we're flipping, ALWAYS block the scroll to keep the section pinned
      if (state === 'flipping') {
        e.preventDefault();
        return;
      }
      
      if (delta > 0) {
        // Scroll Down - Lock until page index 4 (last spread)
        if (page < 4) {
          flipbook.flipNext();
          e.preventDefault();
        }
      } else if (delta < 0) {
        // Scroll Up - Lock until page index 0 (first spread)
        if (page > 0) {
          flipbook.flipPrev();
          e.preventDefault();
        }
      }
    };

    const section = containerRef.current;
    if (section) {
      section.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (section) section.removeEventListener('wheel', handleWheel);
    };
  }, [isInView, page]);

  useEffect(() => {
    // Scroll progress etc could go here if needed
  }, []);

  const handleCreateFlipbook = () => {
    setIsCreateModalOpen(true);
  };

  const handleUploadPDF = (files) => {
    console.log("Upload PDF Clicked", files);
    setIsCreateModalOpen(false);
  };

  const handleUseTemplate = (templateData) => {
    console.log("Use Template Clicked", templateData);
    setIsCreateModalOpen(false);
    if (templateData) {
        navigate('/editor', { state: templateData });
    }
  };

  return (
    <div className="bg-white text-[#1a1a1a] font-sans">
      {/* Hero Section Container */}
      <div className="snap-start w-[100%] h-[92vh] mx-auto px-[3vw] relative flex flex-col pt-[5vh]">
        
        {/* Main Content Area */}
        <div className="flex items-start justify-between gap-[5vw] w-full">
          {/* Left Content */}
          <div className="space-y-[1.5vw] animate-in fade-in slide-in-from-left-8 duration-700 w-[45%] pt-[2vh]">
            <h1 className="text-[4vw] font-[600] tracking-tight leading-[1.1] text-gray-900">
              Bring Your Content <br />
              to Life with <span className="text-transparent text-[4.5vw] font-bold bg-clip-text bg-gradient-to-r from-[#9333ea] to-[#db2777]" style={{ filter: 'url(#inner-shadow)' }}>IDC</span>
            </h1>

            <p className="text-[1.1vw] text-gray-500 w-full leading-relaxed font-regular">
              Turn static pages into immersive, interactive digital catalogues that engage, respond, and feel alive with every interaction
            </p>

            <div className="flex items-center gap-[1.5vw] pt-[0.5vw]">
              <button 
                onClick={handleCreateFlipbook}
                className="flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.8vw] bg-white text-gray-900 border border-gray-100 rounded-[0.5vw] font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 text-[0.9vw]"
              >
                <Icon icon="material-symbols:book-ribbon" className="text-[1.3vw]" />
                Create Flipbook
              </button>
              
              <button 
                className="flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.8vw] bg-black text-white rounded-[0.5vw] font-semibold shadow-[0_0.5vw_2vw_-0.5vw_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-all duration-300 active:scale-95 text-[0.9vw]"
              >
                <Icon icon="basil:video-outline" className="text-[1.3vw]" />
                Demo video
              </button>
            </div>
          </div>

          {/* Right Content - Shelf Image */}
          <div className="relative flex justify-end animate-in fade-in zoom-in-95 duration-1000 delay-200 w-[60%] pt-[8vh]">
               <div className="relative w-full">
                  <img 
                      src={shelfImg} 
                      alt="Content Shelf" 
                      className="w-full h-auto drop-shadow-[0_5vw_6vw_rgba(0,0,0,0.2)]"
                  />
               </div>
          </div>
        </div>

        {/* Bottom Footer Text - Anchored to bottom */}
        <div className="absolute bottom-[7vh] left-[3vw] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-black text-[0.95vw] font-[500]">
            Upload, Customize, and Publish your flipbook with powerful tools and Immersive 3D effects
          </p>
        </div>
      </div>

    {/* Book Section */}
      <div 
        ref={containerRef}
        className="snap-start w-full h-[92vh] overflow-hidden bg-gradient-to-b from-[#FFFFFF] 75% to-[#55909C] 25% relative flex flex-col pt-[10vh]"
      >
            <div className="px-[3vw] relative z-20">
                <h2 className="text-[3.5vw] font-[600] text-gray-900 tracking-tight leading-tight transition-opacity duration-300">
                    {page < 2 ? "Why Creators Choose Us ?" : page < 4 ? "What You Get ?" : "How it works ?"}
                </h2>
            </div>

            {/* Environment - Book sandwiched between Tree Layers */}
            <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none flex items-end">
                <img src={Layer5} alt="Layer 5" className="absolute -bottom-[5vw] left-0 w-full h-auto" style={{ zIndex: 1 }} />
                
                {/* Custom Digital Book - Sandwiched */}
                <div className="absolute top-[45%] left-[70%] -translate-x-1/2 -translate-y-1/2 w-[46.65vw] h-[33vw] pointer-events-auto" style={{ zIndex: 2 }}>
                    <HTMLFlipBook 
                        width={1000} 
                        height={1414} 
                        size="stretch"
                        minWidth={200}
                        maxWidth={2000}
                        minHeight={300}
                        maxHeight={3000}
                        maxShadowOpacity={0.5}
                        showCover={false}
                        mobileScrollSupport={true}
                        clickEventForward={false}
                        useMouseEvents={false}
                        onFlip={onPage}
                        flippingTime={1000}
                        swipeDistance={30}
                        ref={bookRef}
                    >
                        {/* Page 1 */}
                        <div className="bg-white"><img src={page1} alt="" className="w-full h-full object-cover" /></div>
                        {/* Page 2 */}
                        <div className="bg-white"><img src={page2} alt="" className="w-full h-full object-cover" /></div>
                        {/* Page 3 */}
                        <div className="bg-white"><img src={page3} alt="" className="w-full h-full object-cover" /></div>
                        {/* Page 4 */}
                        <div className="bg-white"><img src={page4} alt="" className="w-full h-full object-cover" /></div>
                        {/* Page 5 */}
                        <div className="bg-white"><img src={page5} alt="" className="w-full h-full object-cover" /></div>
                        {/* Page 6 */}
                        <div className="bg-white relative overflow-hidden">
                             <img src={page6} alt="" className="w-full h-full object-cover" />
                        </div>
                    </HTMLFlipBook>
                </div>

                {/* Middle to Foreground Layers - static for now, can be linked to progress */}
                <img src={Layer4} alt="Layer 4" className="absolute -bottom-[10vw] left-0 w-full h-auto" style={{ zIndex: 3 }} />
                <img src={Layer3} alt="Layer 3" className="absolute -bottom-[10vw] left-0 w-full h-auto" style={{ zIndex: 4 }} />
                <img src={Layer2} alt="Layer 2" className="absolute -bottom-[10vw] left-0 w-full h-auto" style={{ zIndex: 5 }} />
                <img src={Layer1} alt="Layer 1" className="absolute -bottom-[5vw] left-0 w-full h-auto" style={{ zIndex: 6 }} />
            </div>
      </div>
 
      {/* Editors Showcase Section - 400vh Scrollytelling */}
      <div 
        ref={editorsContainerRef}
        className="snap-start w-full h-[400vh] bg-black relative"
      >
        <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-center px-[5vw]">
            {/* Background Abstract Glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Stage 1: Headline (Fades out as cards spread) */}
            <motion.div 
                style={{ 
                    opacity: useTransform(editorsScrollProgress, [0, 0.2, 0.4], [1, 1, 0]),
                    x: useTransform(editorsScrollProgress, [0, 0.4], [0, -50])
                }}
                className="absolute left-[3vw] top-[10%] z-30 max-w-[70vw] space-y-[1.5vw]"
            >
                <h2 className="text-[3vw] font-bold text-white leading-tight">
                    Create Your Flipbook With <span className="text-blue-400">3 Powerful</span> Editor
                </h2>
                <p className="text-[1.1vw] text-slate-400 font-light">
                    Choose how you want to design, edit, and experience your content.
                </p>
            </motion.div>

            {/* The Interactive Folder & Cards Container */}
            <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Stage 2 & 3: The Spread Cards (Visible during spread phase) */}
                <div className="absolute inset-0 flex items-center justify-center gap-[4vw] z-40">
                    {[
                        { 
                            id: 1, 
                            title: "Visual Editor", 
                            color: "bg-purple-600", 
                            desc: "Design your flipbook with simple and flexible tools. Customize layouts, colors, and backgrounds.",
                            icon: "hugeicons:view-main" 
                        },
                        { 
                            id: 2, 
                            title: "Page Editor", 
                            color: "bg-blue-600", 
                            desc: "Edit and organize each page with ease. Add text, images, and arrange your content for a smooth flow.",
                            icon: "hugeicons:page-edit" 
                        },
                        { 
                            id: 3, 
                            title: "3D Editor", 
                            color: "bg-amber-600", 
                            desc: "Make your flipbook more interactive with realistic visuals. Add depth and smooth effects.",
                            icon: "hugeicons:3d-view" 
                        }
                    ].map((card, i) => {
                        // Stagger the cards one-by-one
                        const staggerStart = 0.35 + (i * 0.15);
                        const staggerMove = 0.4 + (i * 0.15);
                        
                        return (
                            <motion.div 
                                key={card.id}
                                style={{
                                    opacity: useTransform(editorsScrollProgress, [staggerStart, staggerStart + 0.1], [0, 1]),
                                    y: useTransform(editorsScrollProgress, [staggerStart, staggerMove + 0.15], [100, 0]),
                                    scale: useTransform(editorsScrollProgress, [staggerStart, staggerMove + 0.15], [0.8, 1]),
                                }}
                                className="flex flex-col items-start w-[25vw] space-y-[2vw]"
                            >
                                <div className="space-y-[1vw]">
                                    <div className="flex items-center gap-[1vw]">
                                        <div className="w-[2.5vw] h-[2.5vw] rounded-full border border-white/20 flex items-center justify-center text-white text-[1vw] font-bold">
                                            {card.id}
                                        </div>
                                        <h3 className="text-[2vw] font-bold text-white">{card.title}</h3>
                                    </div>
                                    <p className="text-[0.95vw] text-slate-400 leading-relaxed font-light">
                                        {card.desc}
                                    </p>
                                </div>
                                <div className={`w-full aspect-[4/5] ${card.color} rounded-[1.5vw] shadow-2xl overflow-hidden relative group border border-white/10`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                         <Icon icon={card.icon} className="text-white/20 w-[10vw] h-[10vw] group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full p-[2vw] bg-black/40 backdrop-blur-md">
                                        <span className="text-white font-bold text-[1.2vw]">{card.title}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* The Folder (Stage 1 & 2 only) */}
                <motion.div 
                    style={{
                        scale: useTransform(editorsScrollProgress, [0, 0.3], [1, 1.2]),
                        opacity: useTransform(editorsScrollProgress, [0.5, 0.6], [1, 0]),
                        x: useTransform(editorsScrollProgress, [0, 0.4], ["15vw", "0vw"]),
                    }}
                    className="relative w-[26vw] h-[18vw] perspective-3000"
                >
                    {/* Interior Cards Peeking Out */}
                    <div className="absolute top-[-4vw] left-1/2 -translate-x-1/2 flex gap-[-1.5vw] pointer-events-none">
                         <motion.div style={{ y: useTransform(editorsScrollProgress, [0.1, 0.4], [0, -40]), rotate: -10 }} className="w-[9vw] h-[12vw] bg-purple-500 rounded-lg shadow-xl border border-white/20"></motion.div>
                         <motion.div style={{ y: useTransform(editorsScrollProgress, [0.15, 0.45], [0, -60]), rotate: 0 }} className="w-[9vw] h-[12vw] bg-blue-500 rounded-lg shadow-xl border border-white/20 -ml-[3vw]"></motion.div>
                         <motion.div style={{ y: useTransform(editorsScrollProgress, [0.2, 0.5], [0, -50]), rotate: 10 }} className="w-[9vw] h-[12vw] bg-amber-500 rounded-lg shadow-xl border border-white/20 -ml-[3vw]"></motion.div>
                    </div>

                    {/* Folder Back */}
                    <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-xl rounded-[1.5vw] border border-white/10 shadow-2xl"></div>
                    
                    {/* Folder Front (The Door) */}
                    <motion.div 
                        style={{ 
                            transformOrigin: "bottom center",
                            rotateX: useTransform(editorsScrollProgress, [0.1, 0.4], [0, -110]) 
                        }}
                        className="absolute inset-0 bg-slate-700/30 backdrop-blur-2xl rounded-[1.5vw] border-t border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center preserve-3d"
                    >
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-[10vw] h-[2.5vw] bg-slate-700/30 backdrop-blur-2xl rounded-t-[0.8vw] border-x border-t border-white/20"></div>
                         <h3 className="text-[4vw] font-bold text-white/40 tracking-widest uppercase">Editors</h3>
                    </motion.div>
                </motion.div>
            </div>
        </div>
      </div>

      <CreateFlipbookModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUpload={handleUploadPDF}
        onTemplate={handleUseTemplate}
      />

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset dy="3" dx="0" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow" />
            <feFlood floodColor="#000" floodOpacity="0.6" />
            <feComposite in2="shadow" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}