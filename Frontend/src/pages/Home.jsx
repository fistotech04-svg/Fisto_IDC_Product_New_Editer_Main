import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import axios from 'axios';
import HTMLFlipBook from 'react-pageflip';
import { 
  Compass, 
  ArrowUpRight, 
  ArrowLeft, 
  ArrowRight, 
  MoreVertical, 
  User, 
  MapPin, 
  Eye, 
  Star, 
  BookOpen, 
  Box, 
  Video, 
  MonitorSmartphone, 
  BarChart3, 
  Sparkles,
  RotateCcw,
  Layers,
  Sun,
  Palette,
  Clock
} from 'lucide-react';
import CreateFlipbookModal from '../components/CreateFlipbookModal';
import AlertModal from '../components/AlertModal';
import PdfProcessingLoader from '../components/PdfProcessingLoader';
import Footer from './Footer';
import { convertPdfToImages, convertPdfWithInkscape, getDocumentDetails, generatePdfPageSvg, getOfficeDocType, svgToDataUrl } from '../utils/pdfUtils';
import shelfImg from '../assets/Home/shelf.png';
import page1 from '../assets/Home/A4_1.png';
import page2 from '../assets/Home/A4_2.png';
import page3 from '../assets/Home/A4_3.png';
import page4 from '../assets/Home/A4_4.png';
import page5 from '../assets/Home/A4_5.png';
import page6 from '../assets/Home/A4_6.png';
import cover1 from '../assets/Home/Home_Book_1.png';
import cover2 from '../assets/Home/Home_Book_2.png';
import cover3 from '../assets/Home/Home_Book_3.png';
import cover4 from '../assets/Home/Home_Book_4.png';
import cover5 from '../assets/Home/Home_Book_5.png';
import coverSvg1 from '../assets/cover/cover1.svg';
import coverSvg2 from '../assets/cover/cover2.svg';
import coverSvg3 from '../assets/cover/cover3.svg';
import coverSvg4 from '../assets/cover/cover4.svg';
import coverSvg5 from '../assets/cover/cover5.svg';
import slide1 from '../assets/Home/Slide_1.png';
import slide2 from '../assets/Home/Slide_2.png';
import slide3 from '../assets/Home/Slide_3.png';
import slide4 from '../assets/Home/Slide_4.png';
import heroBookImg from '../assets/Home/Hero_book.png';
import bookShowImg from '../assets/Home/Book_show.png'; 
import goldenArrow from '../assets/Home/golden_arrow.png';
import AR_image_model from '../assets/Home/AR_image_model.png';
import icon360 from '../assets/Home/360-icon.svg';
import PumpImage from '../assets/Home/Pump-image.png';
import exampleSvg from '../assets/Home/example svg.svg';
import workImg1 from '../assets/Home/work-img-1.png';
import workImg2 from '../assets/Home/work-img-2.png';
import workImg3 from '../assets/Home/work-img-3.png';
import workImg4 from '../assets/Home/work-img-4.png';
import aboutUsImg from '../assets/Home/abou-us-image.png';
import testimonialIcon from '../assets/Home/testimonial-icon.png';
import flipibookImg from '../assets/Home/Hero_book.png'

// Testimonials Section Component - Stacked Animated Card Carousel with Autoplay (4s)
const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Industrial Marketing Manager",
      company: "Manufacturing Brand",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      quote: "Flipibook helped us present our product range with interactive page flips, 3D product views and video content. Customers can explore product details more clearly, and our digital catalogue is easier to share.",
      rating: 5
    },
    {
      id: 2,
      name: "Senior Product Strategist",
      company: "Global Tech Corp",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
      quote: "Transforming our static PDF brochures into interactive digital experiences doubled our customer engagement rate within weeks. The embedded 3D models allow buyers to inspect every angle effortlessly.",
      rating: 5
    },
    {
      id: 3,
      name: "Director of Digital Sales",
      company: "Innovate Hardware Solutions",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      quote: "The seamless integration of videos and page-flip animations made our sales collateral stand out in trade shows and client presentations. Absolutely essential tool for modern B2B marketing.",
      rating: 5
    },
    {
      id: 4,
      name: "Head of Marketing",
      company: "Precision Machinery Ltd",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      quote: "Our distribution partners love the interactive flipbooks! Being able to update product catalogs on the fly without printing costs has saved us thousands while keeping our clients informed.",
      rating: 5
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-play interval every 4 seconds (4000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="w-full bg-[#f8f9fb] pt-[10vh] px-[5vw] flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* Top Header & Subtitle */}
      <div className="text-center max-w-[60vw] mb-[8vh] space-y-[1.5vh]">
        <h2 className="text-[3.4vw] sm:text-[3.2vw] font-bold text-[#22252a] tracking-tight leading-[1.15]">
          The Smarter Way to <br/> Present products
        </h2>
        <p className="text-[1.3vw] sm:text-[1.25vw] text-[#262F3B] font-normal leading-relaxed">
          Turn static PDFs into engaging digital catalogue experiences.
        </p>
      </div>

      {/* Stacked Cards Container */}
      <div className="relative w-full max-w-[56vw] h-[32vw] min-h-[420px] flex items-center justify-center mb-[4vh]">
        {testimonials.map((item, index) => {
          // Compute relative position in stack
          const total = testimonials.length;
          const offset = (index - activeIndex + total) % total;

          // Only render top 3 visible stack layers
          if (offset > 2) return null;

          // Card visual stack transformation styles
          const scale = 1 - offset * 0.05;
          const translateY = offset * 2.8; // in vw
          const zIndex = 20 - offset;
          const opacity = offset === 0 ? 1 : offset === 1 ? 0.9 : 0.7;

          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={{
                scale,
                y: `${translateY}vw`,
                opacity,
                zIndex
              }}
              transition={{
                duration: 0.6,
                ease: [0.32, 0.72, 0, 1]
              }}
              className="absolute top-0 left-0 right-0 mx-auto w-full bg-white rounded-[1.6vw] p-[3.2vw] border border-gray-100/80 flex flex-col justify-between"
              style={{
                boxShadow: offset === 0 
                  ? '0 30px 70px -15px rgba(0, 0, 0, 0.09), 0 12px 25px -5px rgba(0, 0, 0, 0.04)' 
                  : '0 15px 35px -10px rgba(0,0,0,0.05)'
              }}
            >
              {/* 3D Orange Quote Icon overlapping top-right of active top card */}
              {offset === 0 && (
                <div className="absolute -top-[3vw] right-[1.8vw] w-[8vw] h-[8vw] min-w-[70px] min-h-[70px] z-30 pointer-events-none drop-shadow-2xl">
                  <img 
                    src={testimonialIcon} 
                    alt="Quote Icon" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Author & Header Info Row */}
              <div className="flex items-center gap-[1.8vw] mb-[2.5vh]">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-[5.2vw] h-[5.2vw] min-w-[60px] min-h-[60px] rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                />
                <div className="flex flex-col text-left">
                  <h4 className="text-[1.45vw] font-bold text-[#1e232d] leading-tight tracking-tight">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-[0.4vw]">
                    <p 
                      className="text-[1.1vw] text-[#4a5264] font-medium leading-tight inline-block pb-[0.2vh]"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #7b8fae 35%, rgba(255,255,255,0) 0%)',
                        backgroundPosition: 'bottom',
                        backgroundSize: '8px 1.5px',
                        backgroundRepeat: 'repeat-x'
                      }}
                    >
                      {item.company}
                    </p>
                  </div>
                  
                  {/* Star Rating Row */}
                  <div className="flex items-center gap-[0.3vw] mt-[0.8vh]">
                    {[...Array(item.rating)].map((_, i) => (
                      <span key={i} className="text-[#ff9500] text-[1.3vw] font-bold leading-none">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote Body Paragraph */}
              <p className="text-[1.35vw] text-[#4b5262] font-normal leading-[1.65] tracking-normal text-left pl-[0.2vw]">
                &ldquo;{item.quote}&rdquo;
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

// FAQ Section Component - Smooth Accordion (CodePen Byjaaqd mechanics)
const FAQSection = ({ navigate }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What files can I upload?",
      answer: "You can upload PDF files, Microsoft Word (.docx), PowerPoint (.pptx), and high-resolution images (.jpg, .png). Our system automatically converts them into smooth, interactive flipbooks."
    },
    {
      question: "Can I customise page layouts?",
      answer: "Yes! You can fully customize backgrounds, toolbar branding, add hot-spots, clickable links, video embeds, and 3D product widgets using our drag-and-drop editor."
    },
    {
      question: "Can I add 3D models and videos?",
      answer: "Absolutely. Flipibook supports interactive GLTF/GLB 3D models, YouTube/Vimeo embeds, self-hosted MP4 videos, and audio tracks directly on your flipbook pages."
    },
    {
      question: "Does Flipibook support 360° views?",
      answer: "Yes, you can integrate 360-degree interactive product spin views so buyers can inspect products from every angle."
    },
    {
      question: "Can I share my catalogue online?",
      answer: "You can instantly share your flipbook via a short web URL, QR code, or embed it seamlessly directly into your website or e-commerce store."
    },
    {
      question: "Can I track catalogue engagement?",
      answer: "Yes! Our real-time analytics dashboard gives you insights on total reads, page views, time spent per page, button clicks, and visitor locations."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-[#f8f9fb] pb-[5vh] px-[5vw] flex flex-col items-center justify-center font-sans relative">
      {/* Section Header */}
      <div className="text-center max-w-[60vw] mb-[7vh] space-y-[1.2vh]">
        <h2 className="text-[3.4vw] sm:text-[3.2vw] font-bold text-[#22252a] tracking-tight leading-[1.15]">
          Common Questions About <br />
          <span className="text-[#f15a24]">Flipibook</span>
        </h2>
        <p className="text-[1.3vw] sm:text-[1.25vw] text-[#5e636e] font-normal leading-relaxed">
          Turn static PDFs into engaging digital catalogue experiences.
        </p>
      </div>

      {/* 2-Column FAQ Grid */}
      <div className="w-full max-w-[75vw] grid grid-cols-1 md:grid-cols-2 gap-[1.5vw] items-start">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              onClick={() => toggleFAQ(index)}
              className={`bg-white border rounded-[0.9vw] p-[1.6vw] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                isOpen ? 'border-[#f15a24]/40 bg-white ring-2 ring-[#f15a24]/10' : 'border-gray-200/90 hover:border-gray-300'
              }`}
            >
              {/* Question Header Row */}
              <div className="flex items-center justify-between gap-[1vw]">
                <h3 className="text-[1.5vw] font-semibold text-[#1e232d] leading-snug text-left">
                  {faq.question}
                </h3>
                <div
                  className={`w-[1.8vw] h-[1.8vw] min-w-[26px] min-h-[26px] flex items-center justify-center rounded-full text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? 'rotate-90 text-[#f15a24]' : ''
                  }`}
                >
                  <Icon icon="ep:arrow-right" className="w-[2vw] h-[2vw] stroke-[2.5]" />
                </div>
              </div>

              {/* Answer Content with Smooth Expand Animation */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-[1.05vw] text-[#5e636e] font-normal leading-relaxed text-left pt-[1.5vh] border-t border-gray-100 mt-[1.5vh]">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Interactive Digital Catalogue (IDC) Hero Section Component
const HeroSection = ({ navigate, page1, page2, page3, page4, page5, page6 }) => {
  const containerRef = useRef(null);
  const heroBookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Scroll animations with framer-motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Transform values for pinned scroll effect
  const orangeScale = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.92, 1, 1]);
  const orangeY = useTransform(scrollYProgress, [0, 0.4, 0.8], ["5vw", "0vw", "0vw"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7], [1, 0.95, 0.9]);
  const bookScale = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.95, 1.02, 1]);

  const handlePrevPage = () => {
    if (heroBookRef.current) {
      heroBookRef.current.pageFlip()?.flipPrev();
    }
  };

  const handleNextPage = () => {
    if (heroBookRef.current) {
      heroBookRef.current.pageFlip()?.flipNext();
    }
  };

  const onHeroBookFlip = useCallback((e) => {
    setCurrentPage(e.data + 1);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-auto min-h-[115vh] bg-white p-5 font-sans overflow-visible flex flex-col justify-between">
      {/* Sticky Hero Viewport Container */}
      
        
        {/* Top Header & Branding Row */}
        <motion.div style={{ opacity: headerOpacity }} className="flex flex-col md:flex-row justify-between items-start z-10 w-full mb-4 lg:mb-[0.8vw] gap-4 md:gap-0">
          {/* Main Title */}
          <div>
            <h1 className="text-[26px] sm:text-[34px] lg:text-[3.6vw] font-bold font-popins text-[#35363A] leading-[1.07]">
              INTERACTIVE <br />
              DIGITAL <span className="text-[#EA7233] text-[18px] sm:text-[24px] lg:text-[2.3vw]">CATALOGUE</span> <span className="text-[#35363A] font-bold text-[18px] sm:text-[24px] lg:text-[2.3vw]">(IDC)</span>
            </h1>
          </div>

          {/* Top-Right Branding & Reviews */}
          <div className="flex flex-col items-start md:items-end text-left md:text-right">
            {/* YOUR CONTENT. STORY. Main Title */}
            <div className="flex items-center gap-2 lg:gap-[0.8vw]">
              {/* Dual-tone gradient text "YOUR" */}
              <span 
                className="text-[26px] sm:text-[34px] lg:text-[3.6vw] font-bold tracking-tight leading-none bg-clip-text text-transparent select-none"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, #1e293b 0%, #1e293b 50%, #cbd5e1 50%, #cbd5e1 100%)'
                }}
              >
                YOUR
              </span>
              <span className="text-[11px] sm:text-[13px] lg:text-[1vw] font-bold text-gray-800 tracking-wider text-left leading-[1.25] font-sans">
                CONTENT.<br />STORY.
              </span>
            </div>
            
            {/* Taglines with bullets */}
            <div className="flex items-center gap-[0.6vw] text-[10px] sm:text-[12px] lg:text-[0.8vw] font-bold tracking-wider text-[#ea7233] uppercase mt-[0.4vw]">
              <span className="text-[#ea7233]">•</span>
              <span className="">INTERACTIVE</span>
              <span className="text-[#ea7233]">•</span>
              <span className="">IMMERSIVE</span>
              <span className="text-[#ea7233]">•</span>
              <span className="">INTELLIGENT</span>
            </div>

            {/* Bottom Orange Accent Line */}
            <div className="w-12 lg:w-[4vw] h-[3px] lg:h-[0.25vw] bg-[#ea7233] rounded-full mt-2 lg:mt-[0.5vw] self-start ml-1 lg:ml-[0.3vw]" />
          </div>
        </motion.div>
          
        {/* Center Orange Interactive Hero Container */}
        <motion.div 
          style={{ scale: orangeScale, y: orangeY }}
          className="relative flex-1 min-h-[65vh] lg:min-h-[75vh] bg-[#e65c00] rounded-2xl md:rounded-[2vw] shadow-2xl p-3 sm:p-5 pt-16 sm:pt-20 lg:p-[1.2vw] flex flex-col justify-between overflow-visible transition-all duration-300 w-full"
        >
          {/* AR / 360° Card overlapping upper-left edge */}
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute -top-10 sm:-top-14 lg:-top-[7.5vw] left-2 sm:left-6 lg:left-[3.5vw] z-30 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl sm:rounded-2xl lg:rounded-[1.8vw] shadow-[0_1vw_2.5vw_rgba(0,0,0,0.2)] p-2 sm:p-3 lg:p-[0.7vw] lg:pb-[0.4vw] flex flex-col items-center w-32 sm:w-44 lg:w-[13.5vw] min-w-[125px] sm:min-w-[170px] overflow-hidden group hover:scale-105 transition-transform duration-300"
          >
            {/* Top Solid White Container for AR, 360 Icon & Motor Image */}
            <div className="w-full bg-white rounded-lg sm:rounded-xl lg:rounded-[1.3vw] p-1.5 sm:p-2 lg:p-[0.8vw] lg:pt-[0.6vw] lg:pb-[0.4vw] flex flex-col items-center shadow-inner">
              {/* Header row: AR + 360° icon */}
              <div className="w-full flex justify-between items-center px-1 lg:px-[0.2vw] mb-0.5 lg:mb-[0.2vw]">
                <span className="text-sm sm:text-lg lg:text-[1.8vw] font-medium text-[#2d2d2d] leading-none tracking-tight font-sans">AR</span>
                <img src={icon360} alt="360-icon" className="w-5 sm:w-8 lg:w-[3.4vw] h-auto object-contain" />
              </div>

              {/* AR Motor Image on pure white background */}
              <div className="relative w-full h-12 sm:h-18 lg:h-[6.5vw] min-h-[50px] sm:min-h-[80px] flex items-center justify-center my-0.5 lg:my-[0.3vw] bg-white">
                <img 
                  src={AR_image_model} 
                  alt="AR Product Motor"
                  className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            </div>

            {/* Bottom Label Container */}
            <div className="w-full py-0.5 sm:py-1 lg:py-[0.55vw] px-0.5 lg:px-[0.2vw] flex items-center justify-center">
              <span className="text-[9px] sm:text-xs lg:text-[0.8vw] font-bold text-[#111111] text-center leading-none tracking-tight">
                One Interaactive Experience
              </span>
            </div>
          </motion.div>

          {/* Customer Reviews */}
          <div className="flex flex-col absolute -top-10 sm:-top-14 lg:-top-[5.8vw] right-2 sm:right-6 lg:right-[3.5vw] z-30 items-end">
            <div className="flex -space-x-1.5 sm:-space-x-2 lg:-space-x-[0.4vw]">
              <img className="inline-block w-5 h-5 sm:w-7 sm:h-7 lg:w-[2vw] lg:h-[2vw] rounded-full ring-1 ring-[#FD9F0D] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="user" />
              <img className="inline-block w-5 h-5 sm:w-7 sm:h-7 lg:w-[2vw] lg:h-[2vw] rounded-full ring-1 ring-[#FD9F0D] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="user" />
              <img className="inline-block w-5 h-5 sm:w-7 sm:h-7 lg:w-[2vw] lg:h-[2vw] rounded-full ring-1 ring-[#FD9F0D] object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="user" />
              <img className="inline-block w-5 h-5 sm:w-7 sm:h-7 lg:w-[2vw] lg:h-[2vw] rounded-full ring-1 ring-[#FD9F0D] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="user" />
            </div>
            <div className="flex text-[#FD9F0D] text-[10px] sm:text-sm lg:text-[1.4vw]">★★★★★</div>
            <span className="text-[8px] sm:text-[11px] lg:text-[0.7vw] text-gray-600 font-bold leading-none text-right">Rated 10,000+ Customer Reviews</span>
          </div>

          {/* SVG Definitions for Dashed Arrows with Arrowheads */}
          <svg className="absolute w-0 h-0 pointer-events-none">
            <defs>
              <marker
                id="arrowhead-left"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <polygon points="0 1.5, 9 5, 0 8.5" fill="#ffffff" />
              </marker>
            </defs>
          </svg>

          {/* Mobile & Tablet Feature Badges Grid (Visible only on < lg screens) */}
          <div className="lg:hidden flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 my-2 z-20">
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="carbon:cube" className="text-xs sm:text-sm" /> 3D Model
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="mdi:cube-scan" className="text-xs sm:text-sm" /> AR View
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="fa:cube" className="text-xs sm:text-sm" /> Interactive
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="ant-design:play-circle-outlined" className="text-xs sm:text-sm" /> Video
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="charm:sound-up" className="text-xs sm:text-sm" /> Flip Sound
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="material-symbols:ads-click-rounded" className="text-xs sm:text-sm" /> Hotspots
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Icon icon="akar-icons:arrow-up-right" className="text-xs sm:text-sm" /> Exploder
            </span>
            <span className="bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
              <img src={icon360} className="w-3 h-auto object-contain" /> 360° View
            </span>
          </div>

          {/* Desktop Left Features Column (Hidden on < lg screens) */}
          <div className="hidden lg:flex lg:absolute lg:left-[8vw] lg:top-1/2 lg:-translate-y-1/2 flex-col gap-[2vw] z-20 pointer-events-auto">
            {/* 3D Model */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">3D Model</span>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="carbon:cube" className="text-[1.3vw]" />
              </div>
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 2,20 Q 35,0 65,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
            </div>

            {/* AR View */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">AR View</span>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="mdi:cube-scan" className="text-[1.3vw]" />
              </div>
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 2,20 Q 35,0 65,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
            </div>

            {/* Interactive */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">Interactive</span>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="fa:cube" className="text-[1.2vw]" />
              </div>
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 2,20 Q 35,0 65,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
            </div>

            {/* Video */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">Video</span>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="ant-design:play-circle-outlined" className="text-[1.3vw]" />
              </div>
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 2,20 Q 35,0 65,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* Desktop Right Features Column (Hidden on < lg screens) */}
          <div className="hidden lg:flex lg:absolute lg:right-[8vw] lg:top-1/2 lg:-translate-y-1/2 flex-col gap-[2vw] z-20 pointer-events-auto items-start">
            {/* Flip Sound */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 68,20 Q 35,0 7,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="charm:sound-up" className="text-[1.3vw]" />
              </div>
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">Flip Sound</span>
            </div>

            {/* Hotspots */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 68,20 Q 35,0 7,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="material-symbols:ads-click-rounded" className="text-[1.3vw]" />
              </div>
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">Hotspots</span>
            </div>

            {/* Exploder */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 68,20 Q 35,0 7,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Icon icon="akar-icons:arrow-up-right" className="text-[1.3vw]" />
              </div>
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">Exploder</span>
            </div>

            {/* 360° View */}
            <div className="flex items-center gap-[0.8vw] group cursor-pointer">
              <svg className="w-[4.5vw] h-[2vw] text-white/90 hidden lg:block overflow-visible" viewBox="0 0 70 25">
                <path d="M 68,20 Q 35,0 7,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrowhead-left)" className="animate-pulse" />
              </svg>
              <div className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <img src={icon360} className="w-[1.4vw] h-auto object-contain" />
              </div>
              <span className="text-white font-semibold text-[1.1vw] drop-shadow-sm group-hover:text-amber-200 transition-colors">360° View</span>
            </div>
          </div>

          {/* Central Flipbook Catalogue */}
          <motion.div 
            style={{ scale: bookScale }}
            className="relative my-auto mx-auto w-full max-w-[92vw] sm:max-w-[80vw] lg:w-[50vw] lg:max-w-[880px] h-[55vw] sm:h-[42vw] lg:h-[34vw] min-h-[220px] max-h-[750px] flex items-center justify-center z-10 drop-shadow-[0_1.5vw_2.5vw_rgba(0,0,0,0.3)] my-2 lg:my-auto"
          >
            <img src={flipibookImg} className="w-full h-full object-contain" />
          </motion.div>

          {/* Bottom Bar Controls */}
          <div className="relative z-20 flex flex-col md:flex-row items-center justify-between pt-2 lg:pt-[0.8vw] pb-1 lg:pb-[0.2vw] px-2 sm:px-4 lg:px-[3vw] w-full max-w-full lg:max-w-[63vw] mx-auto gap-2 md:gap-0">
            {/* Pagination Controls on Mobile (First) */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-[1vw] w-full md:w-auto">
              <button 
                onClick={handlePrevPage}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-[2.2vw] lg:h-[2.2vw] rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                <Icon icon="lucide:chevron-left" className="text-sm sm:text-base lg:text-[1.2vw]" />
              </button>

              <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-[0.8vw]">
                <div className="w-10 sm:w-24 lg:w-[14vw] h-[2px] bg-white/40 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full transition-all duration-300" />
                </div>
                <span className="text-white text-xs sm:text-sm lg:text-[0.85vw] font-medium tracking-wide whitespace-nowrap">
                  0{currentPage} / 30
                </span>
                <div className="w-10 sm:w-24 lg:w-[14vw] h-[2px] bg-white/40 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full transition-all duration-300" />
                </div>
              </div>

              <button 
                onClick={handleNextPage}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-[2.2vw] lg:h-[2.2vw] rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                <Icon icon="lucide:chevron-right" className="text-sm sm:text-base lg:text-[1.2vw]" />
              </button>
            </div>

            {/* Bottom Actions Row: Thumbnails on Left, Share & Fullscreen on Right */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-[1.8vw] pt-1 md:pt-0">
              {/* Thumbnails */}
              <button className="flex items-center md:flex-col gap-1 lg:gap-[0.2vw] text-white hover:text-amber-200 transition-colors cursor-pointer group">
                <Icon icon="hugeicons:menu-square" className="text-base sm:text-xl lg:text-[1.5vw] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs lg:text-[0.75vw] font-medium">Thumbnails</span>
              </button>

              {/* Share & Fullscreen */}
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-[1.8vw]">
                <button className="flex items-center md:flex-col gap-1 lg:gap-[0.2vw] text-white hover:text-amber-200 transition-colors cursor-pointer group">
                  <Icon icon="ph:share-network" className="text-base sm:text-xl lg:text-[1.5vw] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-xs lg:text-[0.75vw] font-medium">Share</span>
                </button>

                <button className="flex items-center md:flex-col gap-1 lg:gap-[0.2vw] text-white hover:text-amber-200 transition-colors cursor-pointer group">
                  <Icon icon="akar-icons:full-screen" className="text-base sm:text-xl lg:text-[1.5vw] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-xs lg:text-[0.75vw] font-medium">Full Screen</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div className="w-full flex items-center justify-center pt-6 sm:pt-10 lg:pt-[5.5vw] pb-3 lg:pb-[1vw] px-4 lg:px-[3vw] max-w-[1920px] mx-auto z-20">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-[1.2vw] w-full sm:w-auto">
            <button
              onClick={() => navigate('/my-flipbooks')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 lg:px-[1.8vw] lg:py-[0.7vw] bg-[#1e232a] text-white rounded-lg font-bold shadow-lg hover:bg-black hover:shadow-xl transition-all duration-300 active:scale-95 text-xs sm:text-sm lg:text-[0.85vw] group cursor-pointer"
            >
              <span>My FlipBook</span>
              <Icon icon="lucide:arrow-right" className="text-sm lg:text-[1vw] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 lg:px-[1.8vw] lg:py-[0.7vw] bg-white text-gray-800 border border-gray-200 rounded-lg font-bold shadow-md hover:bg-gray-50 hover:shadow-lg transition-all duration-300 active:scale-95 text-xs sm:text-sm lg:text-[0.85vw] group cursor-pointer"
            >
              <Icon icon="lucide:play-circle" className="text-sm lg:text-[1vw] text-gray-700" />
              <span>View Live Demo</span>
            </button>
          </div>
        </motion.div>
        


      
    </div>
    
  );
};

// Smart Solutions for Modern Industries Section Component
const SmartSolutionsSection = () => {
  const sectionRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('Industries');

  const industryNodes = [
    { id: 'Architecture', label: 'Architecture', icon: 'fluent:building-16-regular', left: '8%', top: '61%' },
    { id: 'Industries', label: 'Industries', icon: 'fluent-emoji-high-contrast:factory', left: '25%', top: '14%' },
    { id: 'Education', label: 'Education', icon: 'boxicons:education-filled', left: '50%', top: '6%' },
    { id: 'Medical', label: 'Medical', icon: 'mdi:hospital', left: '75%', top: '14%' },
    { id: 'Agriculture', label: 'Agriculture', icon: 'fluent-emoji-high-contrast:factory', left: '92%', top: '61%' },
  ];

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen lg:h-[100vh] bg-white font-sans py-8 lg:pt-[1vw] lg:pb-[1.5vw] px-4 sm:px-8 lg:px-[5vw] flex flex-col justify-between overflow-hidden">
      
      {/* 1. BACKGROUND HEADING WITH TEXT SMOKE GRADIENT FADE */}
      <div className="relative w-full flex justify-center pointer-events-none select-none z-0">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-2xl sm:text-4xl lg:text-[6.2vw] font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-b from-[#cbd5e1] via-[#e2e8f0]/90 to-white/10 text-center leading-tight"
        >
          IT STARTS WITH A CLICK
        </motion.h2>
      </div>

      {/* CENTER & RIGHT MAIN CONTENT CONTAINER (Grid 5: col-span-3 for pump image, col-span-2 for text) */}
      <div 
        className="relative lg:absolute lg:top-[4vw] lg:left-1/2 lg:-translate-x-1/2 z-10 w-full max-w-[1600px] h-auto lg:h-[20vw] grid grid-cols-1 lg:grid-cols-5 items-center gap-6 lg:gap-[2vw] my-6 lg:my-0"
      >
        
        {/* CENTER 3D MODEL & CIRCULAR ORBIT NAVIGATION (Grid col-span-3) */}
        <div className="relative w-full lg:w-[84vw] col-span-1 lg:col-span-3 flex items-center justify-center min-h-[220px] sm:min-h-[280px] lg:min-h-[28vw] py-4 lg:py-0">
          
          {/* Exact Figma Vector Orbit (Arc + Dashed lines + Orange Badges + Labels) */}
          <img 
            src={exampleSvg} 
            alt="IDC Industry Categories Orbit" 
            className="absolute w-[88vw] sm:w-[65vw] lg:w-[36vw] max-w-[660px] h-auto pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] z-10 select-none" 
          />

          {/* Center 3D Motor Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-20 w-[60vw] sm:w-[40vw] lg:w-[22vw] max-w-[500px] flex flex-col items-center justify-center pt-16 sm:pt-24 lg:pt-[15vw]"
          >
            <img 
              src={PumpImage} 
              alt="Industrial Machinery Motor 3D Model"
              className="w-full h-auto max-h-[180px] sm:max-h-[240px] lg:max-h-[20vw] object-contain drop-shadow-[0_1.5vw_2vw_rgba(0,0,0,0.18)] hover:scale-105 transition-transform duration-700" 
            />
            
            {/* Soft Ground Shadow */}
            <div className="w-[85%] h-3 lg:h-[1.2vw] bg-black/15 rounded-full filter blur-md -mt-2 lg:-mt-[0.6vw] pointer-events-none" />
          </motion.div>
        </div>

        {/* RIGHT SIDE TEXT CONTENT (Grid col-span-2) */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full lg:w-[80%] col-span-1 lg:col-span-2 ml-0 lg:ml-[5vw] flex flex-col justify-center space-y-2.5 lg:space-y-[0.8vw] text-center lg:text-left items-center lg:items-start z-10 pl-0 lg:pl-[1vw] px-4 lg:px-0"
        >
          {/* Main Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-[2.8vw] font-bold text-gray-900 leading-[1.15] tracking-tight font-sans">
            Smart Solutions for <br />
            Modern Industries
          </h2>

          {/* Thin Black Accent Line under heading */}
          <div className="w-10 lg:w-[2.2vw] h-[2.5px] bg-gray-900 rounded-full my-1 lg:my-[0.2vw]" />

          {/* Description */}
          <p className="text-xs sm:text-base lg:text-[1vw] text-gray-500 font-normal leading-relaxed max-w-full lg:max-w-[70%]">
            Turn static pages into immersive, interactive digital experiences that engage, respond and feel alive with every interaction.
          </p>
        </motion.div>
      </div>

      {/* 6. BOTTOM FEATURE CARDS */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-[1.5vw] mt-6 lg:mt-[-0.5vw] mb-4 lg:mb-[0.8vw] px-2 lg:px-0"
      >
        {/* CARD 1: Immersive 3D */}
        <motion.div 
          whileHover={{ y: -4, boxShadow: '0 1vw 2vw rgba(0,0,0,0.06)' }}
          className="bg-white p-3 sm:p-4 lg:p-[1vw] w-full lg:w-[22vw] rounded-xl lg:rounded-[1vw] border border-gray-100/80 shadow-sm flex items-center gap-3 lg:gap-[1vw] transition-all duration-300"
        >
          <div className="w-10 h-10 lg:w-[3vw] lg:h-[3vw] bg-black text-white rounded-lg lg:rounded-[0.6vw] flex items-center justify-center shadow-sm shrink-0">
            <Icon icon="lucide:box" className="w-5 h-5 lg:w-[2vw] lg:h-[2vw] text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base lg:text-[1vw] font-bold text-gray-900 mb-0.5 lg:mb-[0.1vw]">Immersive 3D</h3>
            <p className="text-xs sm:text-sm lg:text-[0.9vw] text-gray-500 leading-snug">
              Add depth with realistic models and smooth page-turn effects.
            </p>
          </div>
        </motion.div>

        {/* CARD 2: Interactive Elements */}
        <motion.div 
          whileHover={{ y: -4, boxShadow: '0 1vw 2vw rgba(0,0,0,0.06)' }}
          className="bg-white p-3 sm:p-4 lg:p-[1vw] w-full lg:w-[22vw] rounded-xl lg:rounded-[1vw] border border-gray-100/80 shadow-sm flex items-center gap-3 lg:gap-[1vw] transition-all duration-300"
        >
          <div className="w-10 h-10 lg:w-[3vw] lg:h-[3vw] bg-black text-white rounded-lg lg:rounded-[0.6vw] flex items-center justify-center shadow-sm shrink-0">
            <Icon icon="mdi:cursor-default-click-outline" className="w-5 h-5 lg:w-[2vw] lg:h-[2vw] text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base lg:text-[1vw] font-bold text-gray-900 mb-0.5 lg:mb-[0.1vw]">Interactive Elements</h3>
            <p className="text-xs sm:text-sm lg:text-[0.9vw] text-gray-500 leading-snug">
              Engage your users with rich interactive content.
            </p>
          </div>
        </motion.div>

        {/* CARD 3: Publish Anywhere */}
        <motion.div 
          whileHover={{ y: -4, boxShadow: '0 1vw 2vw rgba(0,0,0,0.06)' }}
          className="bg-white p-3 sm:p-4 lg:p-[1vw] w-full lg:w-[22vw] rounded-xl lg:rounded-[1vw] border border-gray-100/80 shadow-sm flex items-center gap-3 lg:gap-[1vw] transition-all duration-300"
        >
          <div className="w-10 h-10 lg:w-[3vw] lg:h-[3vw] bg-black text-white rounded-lg lg:rounded-[0.6vw] flex items-center justify-center shadow-sm shrink-0">
            <Icon icon="clarity:world-line" className="w-5 h-5 lg:w-[2vw] lg:h-[2vw] text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base lg:text-[1vw] font-bold text-gray-900 mb-0.5 lg:mb-[0.1vw]">Publish Anywhere</h3>
            <p className="text-xs sm:text-sm lg:text-[0.9vw] text-gray-500 leading-snug">
              Share and publish across all platforms and devices.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

// How It Works - 4 Simple Steps Section Component
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Upload & Select",
      desc: "Upload your PDF or choose from professionally designed templates.",
      image: workImg1
    },
    {
      number: "02",
      title: "Page Layouts",
      desc: "Upload your PDF or choose from professionally designed templates.",
      image: workImg2
    },
    {
      number: "03",
      title: "Publish & Share",
      desc: "Upload your PDF or choose from professionally designed templates.",
      image: workImg3
    },
    {
      number: "04",
      title: "Analyse Performance",
      desc: "Upload your PDF or choose from professionally designed templates.",
      image: workImg4
    }
  ];

  return (
    <section className="relative w-full bg-white font-sans py-10 lg:py-[4vw] px-4 sm:px-8 lg:px-[6vw] flex flex-col items-center justify-between border-t border-gray-100">
      
      {/* Top Header */}
      <div className="text-center max-w-full lg:max-w-[60vw] mx-auto mb-8 lg:mb-[3vw] space-y-2 lg:space-y-[0.6vw] px-2">
        <span className="text-xs lg:text-[0.85vw] font-semibold text-gray-800 uppercase tracking-[0.25em] block font-sans">
          HOW IT WORKS
        </span>
        <h2 className="text-2xl sm:text-4xl lg:text-[2.8vw] font-bold text-gray-900 tracking-tight leading-tight font-sans">
          Create Your <span className="text-[#ea7233]">Flipibook</span> in 4 Simple Steps
        </h2>
        <p className="text-xs sm:text-base lg:text-[0.95vw] text-gray-800 font-normal leading-relaxed font-sans">
          From upload to publish, everything you need in one simple process.
        </p>
      </div>

      {/* 4 Cards Grid: 2 cards per row on mobile & tablet, 4 cards on desktop */}
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-[1.8vw] items-stretch justify-items-center">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center group w-full">
            {/* Top Grey Card Box with Image & Step Number */}
            <div className="w-full bg-[#dedede] rounded-xl sm:rounded-2xl lg:rounded-[0.1vw] p-2.5 sm:p-4 lg:p-[1.5vw] lg:pt-[1vw] flex flex-col justify-between aspect-[1/1.08] lg:aspect-[1/1.12] relative shadow-sm group-hover:shadow-md transition-shadow duration-300 overflow-hidden">
              {/* Large Step Number 01 02 03 04 */}
              <span className="text-2xl sm:text-4xl lg:text-[5.5vw] font-bold text-white/95 leading-none select-none block text-left font-sans z-10">
                {step.number}
              </span>

              {/* Step Image */}
              <div className="flex-1 flex items-center justify-center p-1 sm:p-2 lg:p-[0.5vw] w-full h-full">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full max-h-[100px] sm:max-h-[160px] lg:max-h-none object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-sm" 
                />
              </div>
            </div>

            {/* Bottom Title & Description */}
            <div className="mt-2 sm:mt-4 lg:mt-[1.2vw] text-center flex flex-col items-center w-full px-1 lg:px-[0.5vw]">
              {/* Title with side dash lines */}
              <div className="flex items-center justify-center gap-1 sm:gap-3 lg:gap-[0.8vw] w-full mb-1 lg:mb-[0.4vw]">
                <span className="hidden sm:inline-block w-3 sm:w-8 lg:w-[2vw] h-[1.5px] bg-gray-400"></span>
                <h3 className="text-xs sm:text-base lg:text-[1.1vw] font-bold text-gray-900 leading-tight font-sans">
                  {step.title}
                </h3>
                <span className="hidden sm:inline-block w-3 sm:w-8 lg:w-[2vw] h-[1.5px] bg-gray-400"></span>
              </div>

              {/* Description */}
              <p className="text-[10px] sm:text-sm lg:text-[0.9vw] text-gray-500 font-normal leading-tight sm:leading-relaxed max-w-full lg:max-w-[92%] font-sans">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// About Us Section Component
const AboutUsSection = ({ navigate }) => {
  return (
    <section className="relative w-full bg-white font-sans py-10 lg:py-[5vw] px-4 sm:px-8 lg:px-[6vw] flex flex-col justify-between overflow-hidden border-t border-gray-100">
      
      {/* Top Layout: Left Content + Right Image */}
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-[4vw] mb-8 lg:mb-[3.5vw]">
        
        {/* Left Column: Headline & Description */}
        <div className="flex flex-col justify-center space-y-4 lg:space-y-[1.4vw] text-center lg:text-left items-center lg:items-start">
          {/* Sub-heading tag */}
          <div className="flex items-center gap-2 lg:gap-[0.8vw]">
            <span className="text-xs lg:text-[0.85vw] font-bold text-gray-900 uppercase font-sans">
              ABOUT US
            </span>
            <span className="w-8 lg:w-[3.5vw] h-[1.8px] bg-gray-800 inline-block rounded-full"></span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-4xl lg:text-[3.2vw] font-bold text-gray-900 leading-[1.12] tracking-tight font-poppins">
            Bringing Your <br />
            <span className="text-[#ea7233]">Products</span> to Life
          </h2>

          {/* Paragraph 1 */}
          <p className="text-xs sm:text-base lg:text-[1.1vw] text-gray-800 font-normal max-w-full lg:max-w-[80%] font-sans pt-1 lg:pt-[0.4vw]">
            Flipibook by FIST-O Tech Pvt Ltd transforms static catalogues into interactive digital experiences with 3D models, videos, 360° views, and augmented reality.
          </p>

          {/* Paragraph 2 */}
          <p className="text-xs sm:text-base lg:text-[1.1vw] text-gray-800 font-normal max-w-full lg:max-w-[80%] font-sans">
            We help businesses showcase products in a more engaging and informative way, making product discovery simple and interactive.
          </p>
        </div>

        {/* Right Column: About Us Showcase Image (Laptop + Tablet + Phone with 3D Pump) */}
        <div className="relative w-full flex items-center justify-center my-4 lg:my-0">
          <img 
            src={aboutUsImg} 
            alt="Fisto IDC Interactive Catalogue Showcase" 
            className="w-full max-w-[92vw] sm:max-w-[500px] lg:max-w-[640px] h-auto object-contain drop-shadow-xl lg:absolute lg:right-[-5.9vw] lg:top-[-13vw] hover:scale-102 transition-transform duration-500" 
          />
        </div>
      </div>

      {/* Bottom Row: Our Mission, Our Vision, and Explore Live Demo CTA */}
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-[1.8vw] items-center">
        
        {/* Card 1: Our Mission */}
        <div className="bg-white p-4 lg:p-[1.2vw] rounded-xl lg:rounded-[1.2vw] border border-gray-100 shadow-[0_0.6vw_1.8vw_rgba(0,0,0,0.04)] flex items-center gap-3 lg:gap-[1.2vw] w-full">
          <div className="w-10 h-10 lg:w-[3.2vw] lg:h-[3.2vw] bg-black text-white rounded-lg lg:rounded-[0.8vw] flex items-center justify-center shadow-md shrink-0">
            <Icon icon="fluent:target-arrow-20-regular" className="text-xl lg:text-[2.2vw] text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base lg:text-[1.05vw] font-bold text-gray-900 mb-0.5 lg:mb-[0.2vw] font-sans">
              Our <span className="text-[#ea7233]">Mission</span>
            </h3>
            <p className="text-xs sm:text-sm lg:text-[0.8vw] text-gray-600 leading-snug font-sans">
              To help businesses communicate their products clearly through accessible, interactive digital catalogues.
            </p>
          </div>
        </div>

        {/* Card 2: Our Vision */}
        <div className="bg-white p-4 lg:p-[1.2vw] rounded-xl lg:rounded-[1.2vw] border border-gray-100 shadow-[0_0.6vw_1.8vw_rgba(0,0,0,0.04)] flex items-center gap-3 lg:gap-[1.2vw] w-full">
          <div className="w-10 h-10 lg:w-[3.2vw] lg:h-[3.2vw] bg-black text-white rounded-lg lg:rounded-[0.8vw] flex items-center justify-center shadow-md shrink-0">
            <Icon icon="ant-design:eye-outlined" className="text-xl lg:text-[2.2vw] text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base lg:text-[1.05vw] font-bold text-gray-900 mb-0.5 lg:mb-[0.2vw] font-sans">
              Our <span className="text-[#ea7233]">Vision</span>
            </h3>
            <p className="text-xs sm:text-sm lg:text-[0.8vw] text-gray-600 leading-snug font-sans">
              To make product discovery more immersive, informative and engaging for every audience.
            </p>
          </div>
        </div>

        {/* Card 3: Explore the Live Demo Button */}
        <div className="flex items-center justify-center md:justify-end w-full">
          <button 
            onClick={() => navigate && navigate('/templates')}
            className="w-full md:w-auto justify-center bg-[#1a1f26] text-white px-6 py-3 lg:px-[2vw] lg:py-[1.1vw] rounded-lg text-xs sm:text-sm lg:text-[1vw] font-semibold hover:bg-black transition-all flex items-center gap-2 lg:gap-[0.8vw] shadow-lg cursor-pointer group"
          >
            <span>Explore the Live Demo</span>
            <Icon icon="lucide:arrow-right" className="text-sm lg:text-[1.2vw] text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

    </section>
  );
};

// Real-time 3D Particle Wave Dots Canvas Component
const WaveDotsCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const cols = 55;
    const rows = 28;
    let count = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width = canvas.parentElement?.clientWidth || 600;
      const height = canvas.height = canvas.parentElement?.clientHeight || 350;

      ctx.clearRect(0, 0, width, height);

      count += 0.025;

      const gapX = width / cols;
      const gapY = height / rows;

      for (let ix = 0; ix < cols; ix++) {
        for (let iy = 0; iy < rows; iy++) {
          const x = ix * gapX;
          
          // Sinusoidal 3D wave motion formula
          const wave1 = Math.sin((ix * 0.18) + count) * 16;
          const wave2 = Math.cos((iy * 0.22) + count * 0.85) * 12;
          const y = height * 0.45 + (iy - rows / 2) * (gapY * 0.7) + wave1 + wave2;

          // Depth-based size and opacity
          const depthRatio = iy / rows;
          const opacity = Math.max(0.05, Math.min(0.85, (1 - depthRatio * 0.6) * (ix / cols)));
          const size = Math.max(0.6, (1 - depthRatio * 0.4) * 2.2);

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.75})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute bottom-0 left-0 w-[42vw] h-[25vw] pointer-events-none z-0 opacity-80"
    />
  );
};

// Isolated 4-Step Interactive Workflow Section Component (Height: 100vh, Wheel Locked, Auto-Fitting)
const WorkflowScrollSection = ({ slides, goldenArrow }) => {
  const containerRef = useRef(null);
  const reelRef = useRef(null);
  const stepRefs = useRef([]);
  const [activeStep, setActiveStep] = useState(0);
  const [reelY, setReelY] = useState(0);
  const stepCooldownRef = useRef(0);
  const topExitTimeRef = useRef(0);
  const bottomExitTimeRef = useRef(0);
  const hasAutoSnappedRef = useRef(false);

  const isInView = useInView(containerRef, {
    amount: 0.6
  });

  // Auto-snap container to fit 100% dead on screen when user scrolls near it
  useEffect(() => {
    if (isInView && containerRef.current && !hasAutoSnappedRef.current) {
      hasAutoSnappedRef.current = true;
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (!isInView) {
      hasAutoSnappedRef.current = false;
    }
  }, [isInView]);

  // Lock section exits for 650ms whenever activeStep changes so fast scrolling cannot skip steps
  useEffect(() => {
    const lockUntil = Date.now() + 650;
    stepCooldownRef.current = lockUntil;
    topExitTimeRef.current = lockUntil;
    bottomExitTimeRef.current = lockUntil;
  }, [activeStep]);

  // Calculate dynamic center alignment so active step's title row matches golden arrow 100%
  const updateAlignment = useCallback(() => {
    if (reelRef.current && stepRefs.current[activeStep]) {
      const parentHeight = reelRef.current.parentElement.offsetHeight;
      const stepElem = stepRefs.current[activeStep];
      const titleRow = stepElem.querySelector('.title-row') || stepElem;
      
      const stepTop = stepElem.offsetTop;
      const titleHeight = titleRow.offsetHeight;
      
      // Optical adjustment (-42px) to align text baseline 100% dead straight with golden arrow tip
      const targetY = (parentHeight / 2) - stepTop - (titleHeight / 2) - 42;
      setReelY(targetY);
    }
  }, [activeStep]);

  useEffect(() => {
    updateAlignment();
    const timer = setTimeout(updateAlignment, 350);
    return () => clearTimeout(timer);
  }, [activeStep, updateAlignment]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const delta = e.deltaY;
      if (Math.abs(delta) < 5) return;

      const now = Date.now();

      if (delta > 0) {
        // Scroll Down
        const isEnteringOrInView = rect.top < vh * 0.95 && rect.top > -vh * 0.5;

        if (activeStep < 3 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (now >= stepCooldownRef.current) {
            stepCooldownRef.current = now + 550;
            setActiveStep(prev => {
              const next = prev + 1;
              if (next === 3) bottomExitTimeRef.current = Date.now() + 600;
              return next;
            });
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        } else if (activeStep === 3 && isEnteringOrInView) {
          // At Step 3 (04 Analyze Performance) - Lock wheel until exit hold passes
          if (now < bottomExitTimeRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      } else if (delta < 0) {
        // Scroll Up
        const isEnteringOrInView = rect.bottom > vh * 0.05 && rect.bottom < vh * 1.5;

        if (activeStep > 0 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (now >= stepCooldownRef.current) {
            stepCooldownRef.current = now + 550;
            setActiveStep(prev => {
              const next = prev - 1;
              if (next === 0) topExitTimeRef.current = Date.now() + 600;
              return next;
            });
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        } else if (activeStep === 0 && isEnteringOrInView) {
          // At Step 0 (01 Upload / Select) - Lock wheel until exit hold passes
          if (now < topExitTimeRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [activeStep]);

  const steps = [
    {
      number: "01",
      title: "Upload / Select",
      label: "Page",
      desc: "Start from scratch, upload PDFs, import content, or choose from professionally designed templates to create your publication."
    },
    {
      number: "02",
      title: "Customize Pages & Layouts",
      label: "Section",
      desc: "Design pages, customize layouts, apply themes, add branding, configure animations, 3D effects, hotspots, media, and interactive elements."
    },
    {
      number: "03",
      title: "Publish & Share",
      label: "Flipbook",
      desc: "Publish instantly with custom links, embed on websites, share across platforms, manage privacy settings, and control audience access."
    },
    {
      number: "04",
      title: "Analyze Performance",
      label: "of your Books",
      desc: "Track views, monitor reader engagement, analyze page performance, measure interactions, and gain actionable insights from audience behavior."
    }
  ];

  return (
    <div ref={containerRef} className="snap-start w-full min-h-[100vh] h-[100vh] bg-black text-white font-sans relative flex flex-col lg:flex-row items-center justify-between px-[6vw] py-[6vh] overflow-hidden gap-[3vw] border-t border-white/10">
      
      {/* Left Column - Dynamic Slide Preview Card Image */}
      <div className="relative w-full lg:w-[42vw] aspect-[4/3] rounded-[1.2vw] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-white/10 bg-[#0c0c0e] flex items-center justify-center group flex-shrink-0 z-20">
        <motion.img 
          key={activeStep}
          src={slides[activeStep]} 
          alt="Workflow preview" 
          initial={{ opacity: 0.3, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full object-cover"
        />

        {/* Glossy Overlay Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none"></div>
      </div>

      {/* Center Fixed Golden Arrow (Stationary at Vertical Center) */}
      <div className="hidden lg:flex items-center justify-center w-[2vw] min-w-[28px] h-[2vw] z-30 flex-shrink-0">
        <img 
          src={goldenArrow} 
          alt="Active pointer" 
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]" 
        />
      </div>

      {/* Right Column - Vertically Translating Text Reel */}
      <div className="flex-1 h-[70vh] relative overflow-hidden flex items-center justify-start z-10 pl-[1vw]">
        <motion.div 
          ref={reelRef}
          animate={{ y: reelY }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="flex flex-col space-y-[4.5vh] w-full max-w-[42vw]"
        >
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div 
                key={step.number}
                ref={el => stepRefs.current[idx] = el}
                className={`group cursor-default transition-all duration-500 relative py-[0.5vh] ${
                  isActive ? "opacity-100 scale-100" : "opacity-30 scale-98 hover:opacity-60"
                }`}
              >
                <div className="title-row flex items-center gap-[1.5vw]">
                  {/* Step Number */}
                  <span className={`text-[3.6vw] font-extrabold tracking-tighter leading-none transition-colors duration-300 ${
                    isActive ? "text-white" : "text-gray-600"
                  }`}>
                    {step.number}
                  </span>

                  {/* Title & Underline Line Container */}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <h3 className={`text-[2vw] font-bold tracking-tight transition-colors duration-300 ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}>
                        {step.title}
                      </h3>
                      {isActive && step.label && (
                        <span className="text-[0.75vw] text-gray-400 font-normal uppercase tracking-widest pl-[1vw]">
                          {step.label}
                        </span>
                      )}
                    </div>

                    {/* Underline Line */}
                    <div className={`w-full h-[1px] mt-[0.8vh] transition-colors duration-300 ${
                      isActive ? "bg-gray-500" : "bg-gray-800/40"
                    }`}></div>
                  </div>
                </div>

                {/* Expanded Subtitle Description when active in Center */}
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="pl-[5.2vw] pt-[1.5vh] overflow-hidden"
                  >
                    <p className="text-[0.92vw] text-gray-400 font-normal leading-relaxed max-w-[34vw]">
                      {step.desc}
                    </p>
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

    </div>
  );
};

// Isolated 3D Reading Experience Showcase Component (using Book_show.png)
const ThreeDExperienceSection = ({ bookShowImg }) => {
  const [activeHotspot, setActiveHotspot] = useState(null);

  const features = [
    {
      id: "models",
      title: "3D Models",
      desc: "Import realistic 3D models into your flipbook pages.",
      icon: <Box className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "18%",
      leftOffset: "-5vw"
    },
    {
      id: "rotate",
      title: "360° Rotate",
      desc: "Rotate and explore every model from every angle.",
      icon: <RotateCcw className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "36%",
      leftOffset: "-5vw"
    },
    {
      id: "texture",
      title: "Texture Editor",
      desc: "Apply materials, textures, and realistic surface finishes.",
      icon: <Layers className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "55%",
      leftOffset: "-5vw"
    },
    {
      id: "lighting",
      title: "Lighting",
      desc: "Adjust lights, shadows, reflections, and scene ambience.",
      icon: <Sun className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "73%",
      leftOffset: "-5vw"
    },
    {
      id: "background",
      title: "Background Color",
      desc: "Customize popup backgrounds to match your brand style.",
      icon: <Palette className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "92%",
      leftOffset: "-5vw"
    }
  ];

  return (
    <div className="snap-start w-full min-h-[96vh] bg-black text-white font-sans relative flex flex-col lg:flex-row items-center justify-between px-[5vw] py-[6vh] overflow-hidden gap-[2vw] border-t border-white/10">
      
      {/* Left Column Text & CTA */}
      <div className="max-w-[25vw] flex flex-col justify-center z-10 space-y-[2.5vh] pt-[2vh] flex-shrink-0">
        {/* Top Tag Header */}
        <div className="flex items-center gap-[0.6vw]">
          <span className="w-[3px] h-[1.3vw] min-h-[16px] bg-blue-500 rounded-full inline-block"></span>
          <h4 className="text-[0.8vw] font-bold text-gray-400 uppercase tracking-widest">
            3D FLIPBOOK EXPERIENCE
          </h4>
        </div>

        {/* Main Title */}
        <h2 className="text-[3.2vw] font-extrabold text-white leading-[1.1] tracking-tight">
          Not Just Pages. <br />
          A <span className="text-blue-500 font-black">3D</span> Reading <br />
          Experience.
        </h2>

        {/* Subtitle Paragraph */}
        <p className="text-[0.88vw] text-gray-400 font-normal leading-relaxed max-w-[19vw]">
          Transform static flipbooks into immersive experiences with realistic 3D objects, interactive hotspots, videos, audio, and smooth page transitions.
        </p>

        {/* CTA Button */}
        <div className="pt-[1.5vh]">
          <button className="flex items-center gap-[0.8vw] px-[1.6vw] py-[1.1vh] bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-[0.85vw] shadow-[0_10px_25px_rgba(79,70,229,0.35)] hover:shadow-[0_15px_35px_rgba(79,70,229,0.5)] transition-all duration-300 active:scale-98 group cursor-pointer">
            Bring Your Products Into 3D
            <ArrowRight className="w-[1vw] h-[1vw] text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Shared Container for Image & Perfectly Aligned Right List */}
      <div className="flex-1 relative flex items-center justify-between z-10 w-full pl-[1vw]">
        <div className="relative w-full max-w-[76vw] aspect-[16/9] flex items-center justify-between mx-auto">
          
          {/* Center Image */}
          <div className="w-[74%] h-full relative flex items-center justify-center scale-105">
            <img 
              src={bookShowImg} 
              alt="3D Reading Experience" 
              className="w-full h-full object-contain" 
            />
          </div>

          {/* Right Column - 5 Features Positioned 100% Dead On Matching the 5 Blue Lines */}
          <div className="w-[26%] h-full relative z-10">
            {features.map((item) => {
              const isHovered = activeHotspot === item.id;
              return (
                <div 
                  key={item.id}
                  style={{ top: item.top, marginLeft: item.leftOffset }}
                  className={`absolute transform -translate-y-1/2 flex items-center gap-[0.8vw] group transition-all duration-300 cursor-pointer w-full ${
                    isHovered ? "opacity-100 scale-102" : "opacity-85 hover:opacity-100"
                  }`}
                  onMouseEnter={() => setActiveHotspot(item.id)}
                  onMouseLeave={() => setActiveHotspot(null)}
                >
                  {/* Circular Badge Icon */}
                  <div className={`w-[2.4vw] h-[2.4vw] min-w-[32px] min-h-[32px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-300 shadow-md ${
                    isHovered 
                      ? "border-blue-400 bg-blue-600/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                      : "border-white/20 bg-black/60 backdrop-blur-md text-gray-300 group-hover:border-white/40"
                  }`}>
                    {item.icon}
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 space-y-[0.1vh]">
                    <h3 className={`text-[0.95vw] font-bold tracking-tight transition-colors duration-300 ${
                      isHovered ? "text-blue-400" : "text-white group-hover:text-gray-200"
                    }`}>
                      {item.title}
                    </h3>
                    <p className="text-[0.72vw] text-gray-400 font-normal leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Digital Catalogue Section Component with Top Floating Stats Bar
const InteractiveDigitalCatalogueSection = ({ onOpenCreateModal }) => {
  const stats = [
    {
      id: 1,
      value: "10K+",
      label: "Active Users",
      icon: <User className="w-[1.2vw] h-[1.2vw] text-indigo-600 stroke-[2]" />,
      bg: "bg-indigo-50/90"
    },
    {
      id: 2,
      value: "50K+",
      label: "Flipbooks Created",
      icon: <BookOpen className="w-[1.2vw] h-[1.2vw] text-indigo-600 stroke-[2]" />,
      bg: "bg-indigo-50/90"
    },
    {
      id: 3,
      value: "1M+",
      label: "Readers Engaged",
      icon: <BarChart3 className="w-[1.2vw] h-[1.2vw] text-purple-600 stroke-[2]" />,
      bg: "bg-purple-50/90"
    },
    {
      id: 4,
      value: "99.9%",
      label: "Uptime & Reliable",
      icon: <Sparkles className="w-[1.2vw] h-[1.2vw] text-indigo-600 stroke-[2]" />,
      bg: "bg-indigo-50/90"
    },
    {
      id: 5,
      value: "24/7",
      label: "Customer Support",
      icon: <Clock className="w-[1.2vw] h-[1.2vw] text-purple-600 stroke-[2]" />,
      bg: "bg-purple-50/90"
    }
  ];

  return (
    <div className="snap-start w-full bg-white text-gray-900 font-sans relative py-[8vh] px-[5vw] overflow-hidden border-t border-gray-100 flex flex-col items-center">
      
      {/* Top Floating Stats Bar Pill Card */}
      <div className="w-full max-w-[86vw] bg-white border border-gray-200/90 rounded-2xl sm:rounded-full p-[1.1vw] px-[3vw] shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-wrap md:flex-nowrap items-center justify-between gap-[2vw] mb-[8vh] z-10">
        {stats.map((stat, idx) => (
          <React.Fragment key={stat.id}>
            <div className="flex items-center gap-[0.9vw]">
              <div className={`w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full ${stat.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                {stat.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[1.15vw] min-text-[16px] font-extrabold text-gray-900 leading-tight">
                  {stat.value}
                </span>
                <span className="text-[0.75vw] min-text-[11px] text-gray-500 font-medium">
                  {stat.label}
                </span>
              </div>
            </div>
            {idx < stats.length - 1 && (
              <div className="hidden md:block w-[1px] h-[2vw] bg-gray-100"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Section Content Area */}
      <div className="w-full max-w-[86vw] relative flex flex-col md:flex-row items-center justify-between gap-[4vw] py-[4vh] z-10">
        
        {/* Giant Watermark Background Text "IDC" */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[22vw] font-black text-gray-100/70 pointer-events-none select-none z-0 tracking-tighter leading-none">
          IDC
        </div>

        {/* Left Headline */}
        <div className="relative z-10 max-w-[48vw] space-y-[1vh]">
          {/* Subheader with Line */}
          <div className="flex items-center gap-[1.2vw]">
            <h3 className="text-[1.8vw] font-medium text-gray-800 tracking-tight">
              Let&apos;s Build Your Dream
            </h3>
            <span className="flex-1 max-w-[12vw] h-[1px] bg-gray-300"></span>
          </div>

          {/* Main Title */}
          <h2 className="text-[3.8vw] font-black text-gray-900 leading-[1.08] tracking-tight">
            Interactive Digital Catalogue
          </h2>
        </div>

        {/* Right Description & Buttons */}
        <div className="relative z-10 max-w-[28vw] flex flex-col space-y-[2.5vh]">
          <p className="text-[0.95vw] text-gray-600 font-normal leading-relaxed">
            Turn your static content into an immersive digital experience with 3D, animations, and smart interactions.
          </p>

          <div className="flex items-center gap-[1vw] pt-[1vh]">
            <button 
              onClick={onOpenCreateModal}
              className="bg-black hover:bg-gray-800 text-white px-[1.6vw] py-[1.1vh] rounded-[0.5vw] font-semibold text-[0.9vw] shadow-md transition-all flex items-center gap-[0.6vw] cursor-pointer group"
            >
              <BookOpen className="w-[1vw] h-[1vw] text-white" />
              Create Flipbook
            </button>

            <button 
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-[1.6vw] py-[1.1vh] rounded-[0.5vw] font-semibold text-[0.9vw] transition-all flex items-center gap-[0.6vw] cursor-pointer"
            >
              <Video className="w-[1vw] h-[1vw] text-gray-700" />
              Demo video
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const navigate = useNavigate();

  // User Data
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const emailId = user?.emailId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(null);
  const isUploadCancelledRef = useRef(false);
  const createdFlipbookVIdRef = useRef(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
    showCancel: false,
    onConfirm: null
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      showCancel: false,
      onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
    });
  };
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
  const flipCooldownRef = useRef(0);

  const [page, setPage] = useState(0);

  const onPage = useCallback((e) => {
    setPage(e.data);
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!containerRef.current || !bookRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const delta = e.deltaY;
      if (Math.abs(delta) < 5) return;

      const flipbook = bookRef.current.pageFlip();
      const state = flipbook ? flipbook.getState() : '';
      const now = Date.now();
      const isFlipping = state === 'flipping' || now < flipCooldownRef.current;

      if (delta > 0) {
        // Scroll Down
        const isEnteringOrInView = rect.top < vh * 0.95 && rect.top > -vh * 0.5;

        if (page < 4 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (!isFlipping) {
            flipCooldownRef.current = now + 650;
            flipbook.flipNext();
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      } else if (delta < 0) {
        // Scroll Up
        const isEnteringOrInView = rect.bottom > vh * 0.05 && rect.bottom < vh * 1.5;

        if (page > 0 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (!isFlipping) {
            flipCooldownRef.current = now + 650;
            flipbook.flipPrev();
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [page]);

  useEffect(() => {
    // Scroll progress etc could go here if needed
  }, []);

  // Helper: convert a Blob to a base64 data URI
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const handleCreateFlipbook = () => {
    setIsCreateModalOpen(true);
  };

  const handleUploadPDF = async (files, customName) => {
    if (!files || files.length === 0) return;
    setIsCreateModalOpen(false);
    setIsLoading(true);
    isUploadCancelledRef.current = false;
    createdFlipbookVIdRef.current = null;

    const firstFile = files[0];
    const initialDocType = firstFile._docType || getOfficeDocType(firstFile.name);
    const initialDocLabel = initialDocType === 'word' ? 'Word document' : initialDocType === 'powerpoint' ? 'PowerPoint presentation' : 'file';
    const initialPageCount = firstFile._pageCount || 1;

    // INSTANT LOADER APPEARANCE (0ms latency - immediately on button click!)
    setProcessingProgress({
      current: 1,
      total: files.length,
      fileIndex: 0,
      totalFiles: files.length,
      pageCount: initialPageCount,
      message: files.length > 1
        ? `Converting queued ${initialDocLabel} 1 of ${files.length} (${firstFile.name})...`
        : `Converting ${initialDocLabel}: ${firstFile.name}...`,
      fileName: firstFile.name,
      stage: 'converting'
    });

    try {
      // PDF 12-page limit (commented out for now - can re-enable later):
      // const MAX_TOTAL_PAGES = 12;
      const MAX_TOTAL_PAGES = Infinity;
      let totalPdfSize = 0;
      for (const file of files) {
        totalPdfSize += file.size || 0;
      }
      let allImages = [];

      // Step 1 — Extract pages from all PDFs
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        if (isUploadCancelledRef.current) return;
        const file = files[fileIndex];
        if (allImages.length >= MAX_TOTAL_PAGES) break;

        const remainingPages = MAX_TOTAL_PAGES - allImages.length;
        const docType = file._docType || getOfficeDocType(file.name);
        const docLabel = docType === 'word' ? 'Word document' : docType === 'powerpoint' ? 'PowerPoint presentation' : 'file';
        const detectedCount = file._pageCount || 1;

        setProcessingProgress({
          current: fileIndex + 1,
          total: files.length,
          fileIndex,
          totalFiles: files.length,
          pageCount: detectedCount,
          message: files.length > 1
            ? `Converting queued ${docLabel} ${fileIndex + 1} of ${files.length} (${file.name})...`
            : `Converting ${docLabel}: ${file.name}...`,
          fileName: file.name,
          stage: 'converting'
        });
        const images = await convertPdfWithInkscape(file, remainingPages, backendUrl);
        if (isUploadCancelledRef.current) return;
        allImages = [...allImages, ...images];
      }

      if (isUploadCancelledRef.current) return;

      if (allImages.length === 0) {
        showAlert("Error", "No pages could be extracted from the selected files.");
        return;
      }

      const firstW = allImages[0].width;
      const firstH = allImages[0].height;
      const isUniform = allImages.every(img =>
        Math.abs(img.width - firstW) < 1 &&
        Math.abs(img.height - firstH) < 1
      );
      if (!isUniform) {
        showAlert("Uniformity Error", "Selected PDF pages have different dimensions. All pages in a flipbook must have the same size to ensure a professional layout.");
        return;
      }
      const maxWidth = firstW;
      const maxHeight = firstH;

      const now = new Date();
      const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const defaultPrefix = initialDocType === 'word' ? 'Word_Flipbook_' : initialDocType === 'powerpoint' ? 'PPT_Flipbook_' : 'PDF_Flipbook_';
      let uniqueName = customName;
      if (!uniqueName || (uniqueName.startsWith('PDF_Flipbook_') && initialDocType !== 'pdf')) {
        uniqueName = customName ? customName.replace(/^PDF_Flipbook_/, defaultPrefix) : `${defaultPrefix}${timeString}`;
      }
      const targetFolder = 'My_Flipbooks';

      // Step 2 — Encode pages and save flipbook in a single high-speed request
      setProcessingProgress({
        current: 0,
        total: allImages.length,
        totalFiles: files.length,
        message: 'Saving pages & binding flipbook...',
        fileName: uniqueName,
        stage: 'saving'
      });
      const allPages = await Promise.all(allImages.map(async (img, idx) => {
        const pageIndex = idx + 1;
        const base64Url = img.dataUrl || (img.content ? svgToDataUrl(img.content) : "") || (img.blob ? await blobToBase64(img.blob) : "");
        const html = img.content || generatePdfPageSvg(base64Url, `Page ${pageIndex}`, maxWidth, maxHeight, true);
        return {
          pageName: `Page ${pageIndex}`,
          content: html,
          pageNumber: pageIndex
        };
      }));

      if (isUploadCancelledRef.current) return;

      // For standard flipbooks (up to 20 pages), save in a single request!
      if (allPages.length <= 20) {
        setProcessingProgress({
          current: allPages.length,
          total: allPages.length,
          totalFiles: files.length,
          message: 'Saving pages & binding flipbook...',
          fileName: uniqueName,
          stage: 'saving'
        });
        const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
          emailId,
          flipbookName: uniqueName,
          pages: allPages,
          overwrite: true,
          folderName: targetFolder,
          keepBase64: true,
          fileSize: totalPdfSize || allImages.reduce((sum, img) => sum + (img.blob?.size || 0), 0)
        });
        const v_id = createRes.data.v_id;
        createdFlipbookVIdRef.current = v_id;

        if (isUploadCancelledRef.current) {
          axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
          return;
        }

        setProcessingProgress({
          current: allPages.length,
          total: allPages.length,
          totalFiles: files.length,
          message: 'Opening flipbook...',
          fileName: uniqueName,
          stage: 'done'
        });

        // Navigate to the editor
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${v_id}`);
        return;
      }

      // For extra large flipbooks (> 20 pages), save initial batch then batch remaining
      const initialBatch = allPages.slice(0, 20);
      const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
        emailId,
        flipbookName: uniqueName,
        pages: initialBatch,
        overwrite: true,
        folderName: targetFolder,
        keepBase64: true,
        fileSize: totalPdfSize || allImages.reduce((sum, img) => sum + (img.blob?.size || 0), 0)
      });
      const v_id = createRes.data.v_id;
      createdFlipbookVIdRef.current = v_id;

      const BATCH_SIZE = 15;
      for (let i = 20; i < allPages.length; i += BATCH_SIZE) {
        if (isUploadCancelledRef.current) {
          axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
          return;
        }
        const batchPages = allPages.slice(i, i + BATCH_SIZE);
        setProcessingProgress({
          current: Math.min(i + BATCH_SIZE, allPages.length),
          total: allPages.length,
          totalFiles: files.length,
          message: `Saving pages ${i + 1} to ${Math.min(i + BATCH_SIZE, allPages.length)} of ${allPages.length}...`,
          fileName: uniqueName,
          stage: 'saving'
        });
        await axios.post(`${backendUrl}/api/flipbook/save-pages-batch`, {
          emailId,
          v_id,
          pages: batchPages,
          keepBase64: true,
          fileSize: totalPdfSize
        });
      }

      if (isUploadCancelledRef.current) {
        axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
        return;
      }

      setProcessingProgress({
        current: allPages.length,
        total: allPages.length,
        totalFiles: files.length,
        message: 'Opening flipbook...',
        fileName: uniqueName,
        stage: 'done'
      });

      // Step 4 — Navigate to the editor
      navigate(`/editor/${encodeURIComponent(targetFolder)}/${v_id}`);

    } catch (error) {
      if (!isUploadCancelledRef.current) {
        console.error("PDF/Document conversion error:", error);
        const rawMsg = error.response?.data?.message || error.message || "";
        const isCorrupt = error.response?.data?.isCorrupted ||
                          /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error/i.test(rawMsg);
        const userMessage = isCorrupt
            ? (rawMsg.includes("is corrupted") || rawMsg.includes("corrupted, unreadable") ? rawMsg : "Your file is corrupted, unreadable, or password-protected. Please check your document and try again.")
            : (rawMsg || "Failed to process document. Please try again.");
        showAlert(isCorrupt ? "File Corrupted" : "Error", userMessage);
      }
    } finally {
      setIsLoading(false);
      setProcessingProgress(null);
      isUploadCancelledRef.current = false;
    }
  };

  const handleCancelUploadPDF = () => {
    isUploadCancelledRef.current = true;
    setIsLoading(false);
    setProcessingProgress(null);
    if (createdFlipbookVIdRef.current) {
      axios.delete(`${backendUrl}/api/flipbook/delete/${createdFlipbookVIdRef.current}`, { params: { emailId } }).catch(() => {});
      createdFlipbookVIdRef.current = null;
    }
  };

  const handleUseTemplate = async (templateData) => {
    setIsCreateModalOpen(false);
    if (!templateData) return;

    if (!emailId) {
      navigate('/editor', { state: templateData });
      return;
    }

    setIsLoading(true);
    try {
      const pageCount = templateData.pageCount || 12;
      const pages = Array.from({ length: pageCount }, (_, i) => ({
        pageName: `Page ${i + 1}`,
        content: ''
      }));

      const now = new Date();
      const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const uniqueName = templateData.flipbookName || `Flipbook_${timeString}`;
      const targetFolder = 'My_Flipbooks';

      const res = await axios.post(`${backendUrl}/api/flipbook/save`, {
        emailId,
        flipbookName: uniqueName,
        pages: pages,
        overwrite: true,
        folderName: targetFolder,
        meta: {
          width: templateData.width,
          height: templateData.height,
          templateId: templateData.templateId,
          orientation: templateData.orientation
        }
      });

      if (res.data && res.data.v_id) {
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`, { state: templateData });
      } else {
        navigate('/editor', { state: templateData });
      }
    } catch (e) {
      console.error("Creation failed", e);
      navigate('/editor', { state: templateData });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-[#1a1a1a] font-sans overflow-x-hidden scroll-smooth">
      {/* Hero Section Container with Pin/Scroll animation */}
      <section className="relative lg:sticky lg:top-0 z-10 snap-start snap-always w-full bg-white">
        <HeroSection navigate={navigate} page1={page1} page2={page2} page3={page3} page4={page4} page5={page5} page6={page6} bookShowImg={bookShowImg} />
      </section>

      {/* Smart Solutions for Modern Industries Section */}
      <section className="relative lg:sticky lg:top-0 z-20 snap-start snap-always w-full bg-white">
        <SmartSolutionsSection />
      </section>

      {/* How It Works - 4 Simple Steps Section */}
      <section className="relative lg:sticky lg:top-0 z-30 snap-start snap-always w-full bg-white">
        <HowItWorksSection />
      </section>

      {/* About Us Section */}
      <section className="relative lg:sticky lg:top-0 z-40 snap-start snap-always w-full bg-white">
        <AboutUsSection navigate={navigate} />
      </section>

      {/* Testimonials Stacked Section */}
      <section className="relative lg:sticky lg:top-0 z-50 snap-start snap-always w-full bg-white">
        <TestimonialsSection />
      </section>

      {/* FAQ Section */}
      <section className="relative lg:sticky lg:top-0 z-60 snap-start snap-always w-full bg-white">
        <FAQSection navigate={navigate} />
      </section>

      {/* Book Section - Featured Flipbook */}
      <section className="relative lg:sticky lg:top-0 z-70 snap-start snap-always w-full bg-[#e6e6e8]">
        <div
          ref={containerRef}
          className="w-full min-h-[92vh] bg-[#e6e6e8] relative flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 lg:px-[5vw] py-8 lg:py-[8vh] overflow-hidden font-sans gap-6 lg:gap-[2vw]"
        >
          {/* Left Column Text Block */}
          <div className="max-w-full lg:max-w-[25vw] flex flex-col justify-start self-center lg:self-start z-10 space-y-3 lg:space-y-[2.5vh] pt-2 lg:pt-[2vh] text-center lg:text-left items-center lg:items-start">
            {/* Top Tag Header */}
            <div className="flex items-center gap-2 lg:gap-[0.6vw]">
              <span className="w-[3px] h-4 lg:h-[1.3vw] min-h-[16px] bg-[#3b4998] rounded-full inline-block"></span>
              <h4 className="text-xs lg:text-[0.9vw] font-bold text-gray-500 uppercase">
                FEATURED FLIPBOOK
              </h4>
            </div>

            {/* Main Title */}
            <h2 className="text-2xl sm:text-4xl lg:text-[3.2vw] font-semibold text-gray-900 leading-[1.15] tracking-tight">
              Ideas Inspire. <br />
              Knowledge <br />
              Transforms.
            </h2>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base lg:text-[1vw] text-gray-500 font-normal leading-relaxed lg:leading-[1.75]">
              Explore handpicked flipbooks across creativity, business, lifestyle, and more. <br />
              Read. Learn. Share. Make every page a meaningful experience.
            </p>
          </div>

          {/* Center Column - 3D Interactive Flipbook */}
          <div className="relative flex-1 flex items-center justify-center z-10 px-2 lg:px-[1vw] w-full">
            <div className="relative w-full max-w-[92vw] sm:max-w-[80vw] lg:w-[44vw] lg:max-w-[720px] h-[55vw] sm:h-[42vw] lg:h-[31vw] max-h-[500px] flex items-center justify-center drop-shadow-[0_25px_40px_rgba(0,0,0,0.25)]">
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
                useMouseEvents={true}
                onFlip={onPage}
                flippingTime={1000}
                swipeDistance={30}
                ref={bookRef}
                className="drop-shadow-2xl"
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
                <div className="bg-white">
                  <img src={page6} alt="" className="w-full h-full object-cover" />
                </div>
              </HTMLFlipBook>
            </div>
          </div>

          {/* Right Column Text Block */}
          <div className="max-w-full lg:max-w-[22vw] flex flex-col justify-center z-10 space-y-3 lg:space-y-[2.5vh] text-center lg:text-left items-center lg:items-start">
            {/* Main Title */}
            <h3 className="text-xl sm:text-3xl lg:text-[2.2vw] font-semibold text-gray-900 leading-[1.2] tracking-tight">
              The Art of <br />
              Thoughtful <br />
              Living
            </h3>

            {/* Page Counter Line */}
            <div className="pb-2 lg:pb-[1.5vh] border-b border-gray-300 w-32 lg:w-[12vw]">
              <span className="text-sm lg:text-[1.1vw] text-gray-400 font-medium">
                {Math.floor(page / 2) + 1}/3 Pages
              </span>
            </div>

            {/* Paragraph Description */}
            <p className="text-xs sm:text-sm lg:text-[0.9vw] text-gray-500 font-normal leading-relaxed lg:leading-[1.7]">
              Explore timeless insights on mindfulness, creativity, and purposeful living through beautifully crafted stories and practical ideas.
            </p>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <section className="relative z-[80] w-full bg-[#1e232a]">
        <Footer />
      </section>



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

      {/* PDF Processing Overlay */}
      <PdfProcessingLoader progress={processingProgress} onCancel={handleCancelUploadPDF} />

      {/* General Loading Overlay */}
      <AnimatePresence>
        {isLoading && !processingProgress && (
          <motion.div
            key="home-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-[8vh] left-0 right-0 bottom-0 z-40 flex flex-col items-center justify-center bg-white gap-3"
          >
            <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-[0.85vw] font-semibold text-gray-600 tracking-wide">Loading...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
}