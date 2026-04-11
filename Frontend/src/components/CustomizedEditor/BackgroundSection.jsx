import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { ArrowLeftRight, Minus, RefreshCw, ChevronDown, X, Check } from 'lucide-react';
import backgroundComponents from './Backgrounds';
import animationComponents from './Animations';
import PremiumDropdown from './PremiumDropdown';
import {
  solidPalette,
  hexToRgb,
  generateGradientString,
  getColorAtOffset,
  CustomColorPicker,
  AdjustmentSlider,
  SectionLabel,
  DraggableSpan,
  ImageCropOverlay
} from './AppearanceShared';
const VIDEO_THEMES = [
  '/src/assets/Videos/vdo1.mp4', '/src/assets/Videos/vdo2.mp4', '/src/assets/Videos/vdo3.mp4',
  '/src/assets/Videos/vdo4.mp4', '/src/assets/Videos/vdo5.mp4', '/src/assets/Videos/vdo6.mp4',
  '/src/assets/Videos/vdo7.mp4', '/src/assets/Videos/vdo8.mp4', '/src/assets/Videos/vdo9.mp4',
  '/src/assets/Videos/vdo10.mp4', '/src/assets/Videos/vdo11.mp4', '/src/assets/Videos/vdo12.mp4',
  '/src/assets/Videos/vdo13.mp4', '/src/assets/Videos/vdo14.mp4', '/src/assets/Videos/vdo15.mp4',
  '/src/assets/Videos/vdo16.mp4', '/src/assets/Videos/vdo17.mp4', '/src/assets/Videos/vdo18.mp4',
  '/src/assets/Videos/vdo19.mp4', '/src/assets/Videos/vdo20.mp4', '/src/assets/Videos/vdo21.mp4'
];

const BACKGROUND_IMAGE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26];

const themeStaticCache = {};

const ThemePreview = React.memo(({ name, isLive }) => {
  const [isCached, setIsCached] = React.useState(isLive);
  
  useEffect(() => {
    if (isLive) {
      setIsCached(true);
    }
  }, [isLive]);

  const BackgroundComponent = backgroundComponents[name];

  if (!themeStaticCache[name]) {
    switch (name) {
      case 'Antigravity': themeStaticCache[name] = <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-pink-400 rotate-45"></div><div className="w-1.5 h-1.5 rounded-full bg-pink-300 -rotate-12"></div><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div></div>; break;
      case 'ColorBlends': themeStaticCache[name] = <div className="w-full h-full bg-gradient-to-bl from-pink-400 via-purple-500 to-blue-600 opacity-50"></div>; break;
      case 'DarkVeil': themeStaticCache[name] = <div className="w-full h-full bg-black/80 flex items-center justify-center"><div className="w-full h-[1px] bg-red-500/30 blur-[1px]"></div></div>; break;
      case 'DotGrid': themeStaticCache[name] = <div className="grid grid-cols-3 gap-1 opacity-40"><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div>; break;
      case 'FloatingLines': themeStaticCache[name] = <div className="flex flex-col gap-1.5 opacity-40"><div className="w-8 h-[1px] bg-blue-300"></div><div className="w-8 h-[1px] bg-pink-300 translate-x-2"></div><div className="w-8 h-[1px] bg-blue-300"></div></div>; break;
      case 'Galaxy': themeStaticCache[name] = <div className="text-white text-[10px] opacity-60">✨🌌</div>; break;
      case 'GridScan': themeStaticCache[name] = <div className="w-full h-full bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:8px_8px]"><div className="w-full h-[2px] bg-cyan-400/30"></div></div>; break;
      case 'Hyperspeed': themeStaticCache[name] = <div className="flex gap-0.5"><div className="w-10 h-[1px] bg-blue-400/50"></div><div className="w-10 h-[1px] bg-red-400/50"></div></div>; break;
      case 'Iridescence': themeStaticCache[name] = <div className="w-full h-full bg-gradient-to-tr from-green-300 via-blue-300 to-purple-300 opacity-40 blur-sm"></div>; break;
      case 'LightPillar': themeStaticCache[name] = <div className="flex gap-1.5 items-end"><div className="w-[2px] h-8 bg-white/40 shadow-[0_0_5px_white]"></div><div className="w-[1.5px] h-6 bg-white/20"></div></div>; break;
      case 'LightRays': themeStaticCache[name] = <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1),transparent)] flex items-end justify-center"><div className="w-[1px] h-full bg-white/20 rotate-12"></div></div>; break;
      case 'LiquidEther': themeStaticCache[name] = <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#5227FF33,_#000)] blur-[3px]"></div>; break;
      case 'Orb': themeStaticCache[name] = <div className="w-6 h-6 rounded-full bg-indigo-500/40 blur-[4px]"></div>; break;
      case 'Particles': themeStaticCache[name] = <div className="grid grid-cols-4 gap-1 opacity-50"><div className="w-1 h-1 bg-white rounded-full translate-x-1 translate-y-2"></div><div className="w-0.5 h-0.5 bg-blue-300 rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div>; break;
      case 'PixelSnow': themeStaticCache[name] = <div className="grid grid-cols-4 gap-2 opacity-60"><div className="w-0.5 h-0.5 bg-white"></div><div className="w-0.5 h-0.5 bg-white"></div><div className="w-0.5 h-0.5 bg-white"></div></div>; break;
      case 'Prism': themeStaticCache[name] = <div className="w-4 h-4 rotate-45 border border-white/30 bg-white/5"></div>; break;
      case 'PrismaticBurst': themeStaticCache[name] = <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent)]"></div>; break;
      case 'Silk': themeStaticCache[name] = <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 opacity-50 blur-[2px]"></div>; break;
      case 'SplashCursor': themeStaticCache[name] = <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,100,0.1),transparent)]"></div>; break;
      case 'Threads': themeStaticCache[name] = <div className="w-full h-full opacity-40 overflow-hidden flex flex-col gap-0.5"><div className="w-full h-[1px] bg-white opacity-20 -rotate-12 translate-y-2"></div><div className="w-full h-[1px] bg-white opacity-40 -rotate-12 translate-y-1"></div><div className="w-full h-[1px] bg-white opacity-30 -rotate-12"></div></div>; break;
      case 'Waves': themeStaticCache[name] = <div className="w-full h-full border-t border-white/20 mt-4 rounded-full"></div>; break;
      default: themeStaticCache[name] = <div className="text-gray-400 opacity-20"><Icon icon="lucide:sparkles" className="w-6 h-6" /></div>; break;
    }
  }

  return (
    <>
      <div 
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: isLive ? 0 : 1 }}
      >
        {themeStaticCache[name]}
      </div>
      {isCached && BackgroundComponent && (
        <div 
          className="scale-[0.2] origin-center w-[500%] h-[500%] absolute pointer-events-none transition-opacity duration-300"
          style={{ opacity: isLive ? 1 : 0 }}
        >
          <BackgroundComponent />
        </div>
      )}
    </>
  );
});

const AnimatedThemeItem = React.memo(({ name, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div 
      onClick={() => onSelect(name)} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className={`aspect-video w-full h-20 rounded-lg bg-black border-2 relative overflow-hidden transition-all ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.05]'}`}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ThemePreview name={name} isLive={isSelected || isHovered} />
          </div>
          <div className={`absolute inset-x-0 transition-all duration-300 ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/80 flex items-center justify-center' : 'bottom-0 py-1 bg-black/10 backdrop-blur-sm text-center'}`}>
            <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>{name}</span>
          </div>
      </div>
    </div>
  );
});

const VideoThemeItem = React.memo(({ vdo, i, isSelected, onSelect }) => (
  <div 
    onClick={() => onSelect(vdo)}
    className={`aspect-video w-full h-20 rounded-lg bg-black border-2 relative overflow-hidden transition-all cursor-pointer ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.05]'}`}
  >
    <video src={vdo} className="w-full h-full object-cover" muted loop preload="metadata" onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
    <div className={`absolute inset-x-0 transition-all duration-300 ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/80 flex items-center justify-center' : 'bottom-0 py-1 bg-black/40 backdrop-blur-sm text-center'}`}>
      <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>Video {i + 1}</span>
    </div>
  </div>
));

const ImageThemeItem = React.memo(({ img, i, isSelected, onSelect }) => (
  <div 
    onClick={() => onSelect(img)}
    className={`aspect-video w-full h-20 rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all cursor-pointer group ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.05]'}`}
  >
    <img src={img} alt={`Background Theme ${i}`} className="w-full h-full object-cover" loading="eager" decoding="async" />
    <div className={`absolute inset-x-0 transition-all duration-300 ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/80 flex items-center justify-center' : 'bottom-0 py-1 bg-black/40 backdrop-blur-sm text-center opacity-0 group-hover:opacity-100'}`}>
      <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>Theme {i}</span>
    </div>
  </div>
));

const animationStaticCache = {};

const AnimationPreview = React.memo(({ name, isLive }) => {
  const [isCached, setIsCached] = React.useState(isLive);
  
  useEffect(() => {
    if (isLive) {
      setIsCached(true);
    }
  }, [isLive]);

  const AnimationComponent = animationComponents[name];

  if (!animationStaticCache[name]) {
    switch (name) {
      case 'FallingLeaves': animationStaticCache[name] = <div className="text-red-500 text-[10px] animate-bounce">🍂</div>; break;
      case 'Snow': animationStaticCache[name] = <div className="text-white text-[12px] animate-pulse">❄️</div>; break;
      case 'Bubbles': animationStaticCache[name] = <div className="w-4 h-2 rounded-full border border-blue-300/50 bg-blue-100/20"></div>; break;
      case 'Confetti': animationStaticCache[name] = <div className="flex gap-0.5"><div className="w-1 h-1 bg-red-400"></div><div className="w-1 h-1 bg-yellow-400"></div><div className="w-1 h-1 bg-blue-400"></div></div>; break;
      case 'Rain': animationStaticCache[name] = <div className="w-[1px] h-3 bg-blue-400 rotate-[15deg] opacity-50"></div>; break;
      case 'Fireflies': animationStaticCache[name] = <div className="w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_5px_#fef08a]"></div>; break;
      case 'Matrix': animationStaticCache[name] = <div className="text-[8px] text-green-500 font-mono">1010</div>; break;
      case 'Hearts': animationStaticCache[name] = <div className="text-red-400 text-[10px]">❤</div>; break;
      case 'TwinklingStars': animationStaticCache[name] = <div className="text-white text-[10px]">⭐</div>; break;
      case 'Petals': animationStaticCache[name] = <div className="text-pink-300 text-[10px]">🌸</div>; break;
      case 'BinaryRain': animationStaticCache[name] = <div className="text-[6px] text-green-700 font-mono">0110</div>; break;
      case 'Balloons': animationStaticCache[name] = <div className="w-5 h-3 bg-violet-400 rounded-t-full"></div>; break;
      case 'Lightning': animationStaticCache[name] = <Icon icon="lucide:zap" className="w-4 h-4 text-yellow-300" />; break;
      case 'Orbs': animationStaticCache[name] = <div className="w-4 h-4 rounded-full bg-indigo-400/30 blur-[2px]"></div>; break;
      case 'Scanlines': animationStaticCache[name] = <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]"></div>; break;
      case 'Fireworks': animationStaticCache[name] = <div className="text-orange-400 text-[10px]">🎆</div>; break;
      case 'Glitch': animationStaticCache[name] = <div className="w-4 h-2 bg-blue-500/30 skew-x-12"></div>; break;
      case 'Butterflies': animationStaticCache[name] = <div className="text-purple-400 text-[10px]">🦋</div>; break;
      case 'Clouds': animationStaticCache[name] = <Icon icon="lucide:cloud" className="w-4 h-4 text-white opacity-40" />; break;
      case 'SpaceWarp': animationStaticCache[name] = <div className="text-white text-[8px]">✨🚀</div>; break;
      case 'Jellyfish': animationStaticCache[name] = <div className="text-cyan-400 text-[10px]">🏮</div>; break;
      case 'PaperPlanes': animationStaticCache[name] = <Icon icon="lucide:send" className="w-4 h-4 text-white/40" />; break;
      case 'MusicalNotes': animationStaticCache[name] = <div className="text-white/40 text-[10px]">♪♫</div>; break;
      case 'AutumnMix': animationStaticCache[name] = <div className="text-orange-600 text-[10px]">🍂🎃</div>; break;
      case 'FloatingGeo': animationStaticCache[name] = <div className="w-3 h-3 border border-white/20 rotate-45"></div>; break;
      case 'DustMotes': animationStaticCache[name] = <div className="w-0.5 h-0.5 bg-white/40 rounded-full"></div>; break;
      case 'Nebula': animationStaticCache[name] = <div className="w-6 h-6 rounded-full bg-purple-500/20 blur-[4px]"></div>; break;
      case 'Birds': animationStaticCache[name] = <div className="text-black/40 text-[10px]">🐦</div>; break;
      case 'Plankton': animationStaticCache[name] = <div className="w-1 h-1 bg-cyan-200/30 rounded-full"></div>; break;
      case 'FireEmbers': animationStaticCache[name] = <div className="w-1 h-1 bg-orange-500 rounded-full"></div>; break;
      case 'WaterDrops': animationStaticCache[name] = <div className="w-2 h-3 bg-blue-200/20 rounded-full"></div>; break;
      case 'Mist': animationStaticCache[name] = <div className="w-full h-2 bg-white/20 blur-[2px] mt-4"></div>; break;
      case 'Disco': animationStaticCache[name] = <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-blue-500 opacity-40"></div>; break;
      case 'Meteors': animationStaticCache[name] = <div className="w-4 h-[1px] bg-white rotate-45"></div>; break;
      case 'Sparkles': animationStaticCache[name] = <div className="text-yellow-200 text-[10px]">✨</div>; break;
      default: animationStaticCache[name] = null; break;
    }
  }

  return (
    <>
      <div 
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: isLive ? 0 : 1 }}
      >
        {animationStaticCache[name]}
      </div>
      {isCached && AnimationComponent && (
        <div 
          className="scale-[0.2] origin-center w-[500%] h-[500%] absolute pointer-events-none transition-opacity duration-300"
          style={{ opacity: isLive ? 1 : 0 }}
        >
          <AnimationComponent />
        </div>
      )}
    </>
  );
});

const AnimationThemeItem = React.memo(({ name, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div 
      onClick={() => onSelect(name)} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className={`aspect-video w-full h-20 rounded-lg bg-black border-2 relative overflow-hidden transition-all ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200'}`}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/10">
          <AnimationPreview name={name} isLive={isSelected || isHovered} />
        </div>
        <div className={`absolute inset-x-0 transition-all duration-300 ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/80 flex items-center justify-center' : 'bottom-0 py-1 bg-black/10 backdrop-blur-sm text-center'}`}>
          <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>{name}</span>
        </div>
      </div>
    </div>
  );
});

const BackgroundSection = ({ 
  backgroundSettings, 
  onUpdateBackground 
}) => {
  const [activeTab, setActiveTab] = useState('Background');
  const [deferredTab, setDeferredTab] = useState('Background');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Defer rendering of heavy tab content to keep the UI responsive
  useEffect(() => {
    if (activeTab !== deferredTab) {
      setIsTransitioning(true);
      // Increased delay to ensure the UI paints the loader/active button state first
      const timer = setTimeout(() => {
        setDeferredTab(activeTab);
        setIsTransitioning(false);
      }, 40); 
      return () => clearTimeout(timer);
    }
  }, [activeTab, deferredTab]);

  const [themeType, setThemeType] = useState('Animated Themes');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showGallery, setShowGallery] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [localGallerySelected, setLocalGallerySelected] = useState(null);
  const [showBgCropOverlay, setShowBgCropOverlay] = useState(false);
  const galleryInputRef = useRef(null);

  // Load gallery images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('customized_editor_gallery');
    if (savedImages) {
      try {
        setUploadedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Failed to load gallery images", e);
      }
    }
  }, []);

  // Save gallery images to localStorage when updated
  useEffect(() => {
    if (uploadedImages.length > 0) {
      localStorage.setItem('customized_editor_gallery', JSON.stringify(uploadedImages));
    }
  }, [uploadedImages]);
  
  // Preload background image and video themes for instant access
  useEffect(() => {
    const preloadAssets = () => {
      // Preload images using link tags and memory objects
      BACKGROUND_IMAGE_IDS.forEach((id) => {
        const url = `/src/assets/bgimg/i${id}.jpg`;
        // Hard cache in memory
        const img = new Image();
        img.src = url;
        
        // Browser preload hint
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      });

      // Preload video metadata for fast hover playback
      VIDEO_THEMES.forEach((vdo) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = vdo;
        document.head.appendChild(link);
      });
    };
    
    const timer = setTimeout(preloadAssets, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImageData = { id: Date.now(), url: event.target.result };
      setUploadedImages((prev) => [newImageData, ...prev]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
     if (backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType) {
         setSelectedTheme(backgroundSettings.reactBitType);
     } else {
         setSelectedTheme(null);
     }
  }, [backgroundSettings.style, backgroundSettings.reactBitType]);

  useEffect(() => {
    if (!selectedTheme) return;
    
    // Guard: Only update if the style or theme type is actually different
    if (backgroundSettings?.style === 'ReactBits' && backgroundSettings?.reactBitType === selectedTheme) return;

    const updates = { 
         ...backgroundSettings, 
         style: 'ReactBits', 
         reactBitType: selectedTheme,
         color: '#000000'
    };
    // Improved state saving: capture a snapshot of current settings if we're not already in a theme
    if (backgroundSettings.style !== 'ReactBits') {
      updates.savedNonThemeSettings = {
        style: backgroundSettings.style,
        color: backgroundSettings.color,
        gradient: backgroundSettings.gradient,
        gradientType: backgroundSettings.gradientType,
        gradientStops: backgroundSettings.gradientStops,
        gradientAngle: backgroundSettings.gradientAngle,
        gradientRadius: backgroundSettings.gradientRadius,
        image: backgroundSettings.image,
        fit: backgroundSettings.fit,
        adjustments: backgroundSettings.adjustments,
        cropData: backgroundSettings.cropData,
        opacity: backgroundSettings.opacity
      };
      
      // Maintain backward compatibility for UI elements that specifically rely on savedSolidColor
      if (backgroundSettings.style === 'Solid' || backgroundSettings.color) {
        updates.savedSolidColor = backgroundSettings.color;
      }
    } else if (backgroundSettings.savedNonThemeSettings) {
      // Preserve existing saved settings if we're just switching between themes
      updates.savedNonThemeSettings = backgroundSettings.savedNonThemeSettings;
      updates.savedSolidColor = backgroundSettings.savedSolidColor;
    }

    onUpdateBackground(updates);
  }, [selectedTheme, backgroundSettings.style, backgroundSettings.reactBitType]);

  const [editingGradientStopIndex, setEditingGradientStopIndex] = useState(null);
  const [pendingNewStopOffset, setPendingNewStopOffset] = useState(null);

  // Optimization: Keep a ref of backgroundSettings to allow stable callbacks
  const settingsRef = React.useRef(backgroundSettings);
  React.useEffect(() => {
    settingsRef.current = backgroundSettings;
  }, [backgroundSettings]);

  const fileInputRef = useRef(null);
  const bgStyle = (backgroundSettings?.style === 'ReactBits' || !backgroundSettings?.style) ? 'Solid' : backgroundSettings.style;

  useEffect(() => {
    if (bgStyle === 'Gradient' && backgroundSettings.gradientStops && !backgroundSettings.gradient) {
      const gradient = generateGradientString(
        backgroundSettings.gradientType || 'Linear', 
        backgroundSettings.gradientStops,
        backgroundSettings.gradientAngle || 0,
        backgroundSettings.gradientRadius || 100
      );
      onUpdateBackground({ ...backgroundSettings, gradient });
    }
  }, [bgStyle, backgroundSettings.gradientStops, backgroundSettings.gradient, onUpdateBackground]);

  useEffect(() => {
    if (bgStyle === 'Gradient' && !backgroundSettings.gradientStops) {
      const stops = [
        { color: '#63D0CD', offset: 0, opacity: 100 },
        { color: '#4B3EFE', offset: 100, opacity: 100 }
      ];
      onUpdateBackground({
        ...backgroundSettings,
        gradientType: 'Linear',
        gradientStops: stops,
        gradientRadius: 100,
        gradientAngle: 0,
        gradient: generateGradientString('Linear', stops, 0, 100)
      });
    }
  }, [bgStyle, backgroundSettings.gradientStops, onUpdateBackground]);

  useEffect(() => {
    if (pendingNewStopOffset !== null && backgroundSettings.gradientStops) {
      const index = backgroundSettings.gradientStops.findIndex(s => s.offset === pendingNewStopOffset);
      if (index !== -1) {
        openGradientStopPicker(index);
        setPendingNewStopOffset(null);
      }
    }
  }, [backgroundSettings.gradientStops, pendingNewStopOffset]);

  const updateGradientStop = (index, updates) => {
    const newStops = [...(backgroundSettings.gradientStops || [])];
    newStops[index] = { ...newStops[index], ...updates };
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear', 
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const removeGradientStop = (index) => {
    if (backgroundSettings.gradientStops.length <= 2) return;
    const newStops = backgroundSettings.gradientStops.filter((_, i) => i !== index);
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear', 
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
    const color = getColorAtOffset(offset, backgroundSettings.gradientStops || []);
    const newStop = { color: color, offset, opacity: 100 };
    const newStops = [...(backgroundSettings.gradientStops || []), newStop].sort((a, b) => a.offset - b.offset);
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear', 
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    
    setPickerPos({ x: e.clientX - 100, y: rect.top - 100 });
    setPendingNewStopOffset(offset);
    
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const reverseGradient = () => {
    const newStops = [...(backgroundSettings.gradientStops || [])].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear', 
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const resetGradient = () => {
    const newStops = [
      { color: '#63D0CD', offset: 0, opacity: 100 },
      { color: '#4B3EFE', offset: 100, opacity: 100 }
    ];
    const gradient = generateGradientString('Linear', newStops, 0, 100);
    onUpdateBackground({
      ...backgroundSettings,
      gradientType: 'Linear',
      gradientStops: newStops,
      gradientAngle: 0,
      gradientRadius: 100,
      gradient
    });
  };

  const openGradientStopPicker = (index) => {
    setEditingGradientStopIndex(index);
  };

  const setBgStyle = (style) => {
    setSelectedTheme(null);
    if (style === 'Gradient' && backgroundSettings.gradientStops) {
      const gradient = generateGradientString(
        backgroundSettings.gradientType || 'Linear', 
        backgroundSettings.gradientStops,
        backgroundSettings.gradientAngle || 0,
        backgroundSettings.gradientRadius || 100
      );
      onUpdateBackground({ ...backgroundSettings, style, gradient, reactBitType: null });
    } else if (style === 'Solid' && backgroundSettings.savedSolidColor) {
      onUpdateBackground({ ...backgroundSettings, style, color: backgroundSettings.savedSolidColor, reactBitType: null });
    } else {
      onUpdateBackground({ ...backgroundSettings, style, reactBitType: null });
    }
  };

  const handleColorSelect = (color) => {
    setSelectedTheme(null);
    onUpdateBackground({ ...backgroundSettings, style: 'Solid', color, reactBitType: null });
  };

  const handleAdjustmentChange = (key, value) => {
    onUpdateBackground({
      ...backgroundSettings,
      adjustments: {
        ...(backgroundSettings?.adjustments || {}),
        [key]: value
      }
    });
  };

  const handleAnimatedThemeSelect = React.useCallback((name) => {
    setSelectedTheme(name);
  }, []);

  const handleVideoThemeSelect = React.useCallback((vdo) => {
    setSelectedTheme(null);
    onUpdateBackground({ ...settingsRef.current, style: 'Video', image: vdo, fit: 'Fill', reactBitType: null, color: '#000000' });
  }, [onUpdateBackground]);

  const handleImageThemeSelect = React.useCallback((img) => {
    setSelectedTheme(null);
    onUpdateBackground({ ...settingsRef.current, style: 'Image', image: img, fit: 'Fill', reactBitType: null });
  }, [onUpdateBackground]);

  const handleAnimationSelect = React.useCallback((n) => {
    const current = settingsRef.current;
    const updates = { ...current, animation: n };
    if (current.style !== 'ReactBits' && (!current.animation || current.animation === 'None')) {
      updates.savedNonThemeSettings = {
        style: current.style,
        color: current.color,
        gradient: current.gradient,
        gradientType: current.gradientType,
        gradientStops: current.gradientStops,
        gradientAngle: current.gradientAngle,
        gradientRadius: current.gradientRadius,
        image: current.image,
        fit: current.fit,
        adjustments: current.adjustments,
        cropData: current.cropData,
        opacity: current.opacity,
        savedSolidColor: current.savedSolidColor
      };
    }
    onUpdateBackground(updates);
  }, [onUpdateBackground]);

  // Top-level Memoized Grids to avoid "Rendered more hooks" errors and improve performance
  const animatedThemesList = React.useMemo(() => {
    if (deferredTab !== 'Themes') return null;
    return Object.keys(backgroundComponents).sort().map((name) => (
      <AnimatedThemeItem 
        key={name}
        name={name}
        isSelected={selectedTheme === name}
        onSelect={handleAnimatedThemeSelect}
      />
    ));
  }, [selectedTheme, handleAnimatedThemeSelect, deferredTab]);

  const videoThemesList = React.useMemo(() => {
    if (deferredTab !== 'Themes') return null;
    return VIDEO_THEMES.map((vdo, i) => (
      <VideoThemeItem 
        key={vdo}
        vdo={vdo}
        i={i}
        isSelected={backgroundSettings.image === vdo}
        onSelect={handleVideoThemeSelect}
      />
    ));
  }, [backgroundSettings.image, handleVideoThemeSelect, deferredTab]);

  const backgroundThemesList = React.useMemo(() => {
    if (deferredTab !== 'Themes') return null;
    return BACKGROUND_IMAGE_IDS.map((i) => {
      const img = `/src/assets/bgimg/i${i}.jpg`;
      return (
        <ImageThemeItem 
          key={img}
          img={img}
          i={i}
          isSelected={backgroundSettings.image === img}
          onSelect={handleImageThemeSelect}
        />
      );
    });
  }, [backgroundSettings.image, handleImageThemeSelect, deferredTab, themeType]);

  const animationsList = React.useMemo(() => {
    if (deferredTab !== 'Animations') return null;
    return Object.keys(animationComponents).sort().map((name) => (
      <AnimationThemeItem 
        key={name} 
        name={name}
        isSelected={backgroundSettings.animation === name}
        onSelect={handleAnimationSelect}
      />
    ));
  }, [backgroundSettings.animation, handleAnimationSelect, deferredTab]);

  const resetAllAdjustments = () => {
    onUpdateBackground({
      ...backgroundSettings,
      adjustments: {
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0
      }
    });
  };

  return (
    <div className="px-[1vw] flex flex-col relative">
      {/* Tabs */}
      <div className="sticky top-0 z-[50] grid grid-cols-3 gap-[0.55vw] py-[0.5vw] pb-[1vw] mb-[1vw] bg-[#ffffff] -mx-[1vw] px-[1vw] border-b border-gray-50">
        {['Background', 'Themes', 'Animations'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`w-full py-[0.59vw] text-[0.80vw] font-semibold rounded-[0.5vw] transition-all active:scale-95 border border-transparent ${
              activeTab === tab 
                ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-500/20' 
                : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Background' && (
        <div className="flex flex-col gap-[1vw]">
          <div className="flex items-center justify-between w-full mb-[0.5vw]">
            <PremiumDropdown 
              options={['Solid', 'Gradient', 'Image']}
              value={bgStyle}
              onChange={(style) => setBgStyle(style)}
              width="7vw"
              align="right"
            />

            {bgStyle === 'Gradient' && (
              <PremiumDropdown 
                options={['Linear', 'Radial', 'Angular', 'Diamond']}
                value={backgroundSettings.gradientType || 'Linear'}
                onChange={(type) => {
                  const newAngle = type === 'Radial' ? 0 : (backgroundSettings.gradientAngle || 0);
                  const gradient = generateGradientString(
                    type, 
                    backgroundSettings.gradientStops || [],
                    newAngle,
                    backgroundSettings.gradientRadius || 100
                  );
                  onUpdateBackground({ 
                    ...backgroundSettings, 
                    gradientType: type, 
                    gradientAngle: newAngle,
                    gradient 
                  });
                }}
                width="7vw"
                align="right"
                
              />
            )}

            {bgStyle === 'Image' && (
              <PremiumDropdown 
                options={backgroundSettings.image ? ['Fit', 'Fill', 'Stretch', 'Crop'] : ['Fit', 'Fill', 'Stretch']}
                value={backgroundSettings.fit}
                onChange={(fill) => {
                  if (fill === 'Crop') {
                    setShowBgCropOverlay(true);
                  } else {
                    onUpdateBackground({ ...backgroundSettings, fit: fill });
                  }
                }}
                width="6vw"
                align="right"
              />
            )}
          </div>

          {bgStyle === 'Solid' && (
            <div className="flex flex-col gap-[1.5vw]">
              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Pick Colors From Pallet</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                
                <div className="flex items-center justify-between gap-[1vw]">
                  <span className="text-[0.75vw] font-semibold text-gray-700">Fill :</span>
                  <div className="flex-1 flex gap-[0.5vw] items-center color-picker-trigger">
                    <div 
                      className="w-[2vw] h-[2vw] border border-gray-600 rounded-[0.5vw] shadow-sm cursor-pointer hover:border-indigo-400 transition-colors" 
                      style={{ backgroundColor: (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPickerPos({ x: rect.left - 0, y: rect.top - 0 });
                        setShowColorPicker(true);
                      }}
                    />
                    <div className="flex-1 h-[2vw] border border-gray-600 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors">
                      <input 
                         type="text"
                         value={(() => {
                           const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                           if (!colorStr) return '#000000';
                           if (colorStr.length === 9) return colorStr.slice(0, 7).toUpperCase();
                           return colorStr.toUpperCase();
                         })()}
                         onChange={(e) => {
                           let newHex = e.target.value;
                           if (!newHex.startsWith('#')) newHex = '#' + newHex;
                           const validHex = newHex.slice(0, 7);
                           const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                           let newOpacity = 100;
                           if (colorStr && colorStr.length === 9) {
                             newOpacity = Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
                           }
                           let alphaHex = '';
                           if (newOpacity < 100) {
                             alphaHex = Math.round((newOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
                           }
                           onUpdateBackground({ ...backgroundSettings, style: 'Solid', color: validHex + alphaHex });
                         }}
                         className="text-[0.85vw] font-medium text-gray-700 font-mono bg-transparent w-[4vw] outline-none"
                      />
                      <DraggableSpan 
                         label={`${(() => {
                           const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                           if (!colorStr || colorStr.length !== 9) return 100;
                           return Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
                         })()}%`}
                         value={(() => {
                           const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                           if (!colorStr || colorStr.length !== 9) return 100;
                           return Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
                         })()}
                         onChange={(newOpacity) => {
                           const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                           const hex = (colorStr && colorStr.length === 9) ? colorStr.slice(0, 7) : (colorStr || '#000000');
                           let alphaHex = '';
                           if (newOpacity < 100) {
                             alphaHex = Math.round((newOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
                           }
                           onUpdateBackground({ ...backgroundSettings, style: 'Solid', color: hex + alphaHex });
                         }}
                         min={0}
                         max={100}
                         className="text-[0.85vw] font-medium text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Solid Colors</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                
                <div className="grid grid-cols-6 gap-[0.725vw] px-[0.25vw]">
                  {solidPalette.map((color, i) => (
                    <button 
                      key={i}
                      onClick={() => handleColorSelect(color)}
                      className={`aspect-square rounded-[0.5vw] border shadow-sm transition-all hover:scale-110 ${backgroundSettings.color.toLowerCase() === color.toLowerCase() ? 'border-[#3E4491] border-[0.125vw] ring-[0.125vw] ring-indigo-100 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {bgStyle === 'Gradient' && (
            <div className="space-y-[1.5vw] ">
              <div>
                <div className="flex items-center gap-[0.75vw] mb-[2vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Customize your Color</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                  <div className="flex gap-[0.5vw]">
                    <button onClick={resetGradient} className="w-[2.25vw] h-[2.25vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.5vw] shadow-[0_0.2vw_0.4vw_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors" title="Reset Gradient">
                      <Icon icon="ix:reset" className="w-[1.2vw] h-[1.2vw] text-gray-600" />
                    </button>
                    <button onClick={reverseGradient} className="w-[2.25vw] h-[2.25vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.5vw] shadow-[0_0.2vw_0.4vw_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors" title="Swap Directions">
                      <ArrowLeftRight size="1.2vw" className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-[0.75vw] mb-[1.5vw]">
                  {(() => {
                    const gType = backgroundSettings.gradientType || 'Linear';
                    const gStops = backgroundSettings.gradientStops || [];
                    const gAngle = backgroundSettings.gradientAngle || 0;
                    const stopsStr = [...gStops].sort((a,b)=>a.offset-b.offset).map(s => {
                      const rgb = hexToRgb(s.color);
                      const op = (s.opacity || 100) / 100;
                      return `rgba(${rgb.r},${rgb.g},${rgb.b},${op}) ${s.offset}%`;
                    }).join(', ');

                    let previewBg = '';
                    let previewStyle = {};

                    if (gType === 'Angular') {
                      previewBg = generateGradientString('Angular', gStops, gAngle, backgroundSettings.gradientRadius || 100);
                      previewStyle = { background: previewBg, borderRadius: '0.4vw' };
                    } else if (gType === 'Diamond') {
                      previewBg = generateGradientString('Diamond', gStops, gAngle, backgroundSettings.gradientRadius || 100);
                      previewStyle = { background: previewBg, borderRadius: '0.4vw' };
                    } else if (gType === 'Radial') {
                      previewBg = generateGradientString('Radial', gStops, gAngle, backgroundSettings.gradientRadius || 100);
                      previewStyle = { background: previewBg, borderRadius: '50%' };
                    } else {
                      previewBg = `linear-gradient(${gAngle}deg, ${stopsStr})`;
                      previewStyle = { background: previewBg, borderRadius: '0.4vw' };
                    }

                    return (
                      <div className="flex items-center gap-[1vw]">
                        <div className="relative flex-shrink-0 shadow-md border border-gray-100" style={{ width: '4vw', height: '4vw', ...previewStyle }} />
                        <div className="flex-1 flex flex-col gap-[0.375vw]">
                          <span className="text-[0.625vw] font-semibold text-gray-500 uppercase tracking-wide">{gType} Gradient</span>
                          {(gType === 'Linear' || gType === 'Angular') && (
                            <div className="flex items-center gap-[0.5vw]">
                              <span className="text-[0.75vw] font-semibold text-gray-700">Angle</span>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={backgroundSettings.gradientAngle || 0}
                                onChange={(e) => {
                                  const a = parseInt(e.target.value);
                                  const gradient = generateGradientString(gType, gStops, a, backgroundSettings.gradientRadius || 100);
                                  onUpdateBackground({ ...backgroundSettings, gradientAngle: a, gradient });
                                }}
                                className="flex-1 h-[0.3vw] rounded-full  cursor-pointer"
                                style={{ accentColor: '#3b3c8aff' }}
                              />
                              <span className="text-[0.6vw] font-semibold text-gray-600 w-[2vw] text-right">{backgroundSettings.gradientAngle || 0}°</span>
                            </div>
                          )}
                          {(gType === 'Radial' || gType === 'Diamond') && (
                            <div className="flex items-center gap-[0.5vw]">
                              <span className="text-[0.75vw] font-semibold text-gray-700">Radius</span>
                              <input
                                type="range"
                                min="10"
                                max="200"
                                value={backgroundSettings.gradientRadius || 100}
                                onChange={(e) => {
                                  const r = parseInt(e.target.value);
                                  const gradient = generateGradientString(gType, gStops, gAngle, r);
                                  onUpdateBackground({ ...backgroundSettings, gradientRadius: r, gradient });
                                }}
                                className="flex-1 h-[0.3vw] rounded-full cursor-pointer"
                                style={{ accentColor: '#3b3c8aff' }}
                              />
                              <span className="text-[0.6vw] font-semibold text-gray-600 w-[2vw] text-right">{backgroundSettings.gradientRadius || 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="relative pt-[1.5vw] pb-[0.5vw] px-[0.25vw]">
                    <div className="absolute top-0 left-0 w-full h-[2vw] flex items-center pointer-events-none px-[0.25vw]">
                      {(backgroundSettings.gradientStops || []).map((stop, idx) => (
                        <div
                          key={idx}
                          className="absolute -translate-x-1/2 flex flex-col items-center group pointer-events-auto cursor-grab active:cursor-grabbing color-picker-trigger"
                          style={{ left: `${stop.offset}%`, bottom: '0.5vw' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startOffset = stop.offset;
                            let hasDragged = false;
                            const rect = e.currentTarget.parentElement.parentElement.getBoundingClientRect();
                            const currentTargetElement = e.currentTarget;
                            
                            const handleMouseMove = (moveEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              if (Math.abs(deltaX) > 3) {
                                hasDragged = true;
                                const deltaPercent = (deltaX / rect.width) * 100;
                                const newOffset = Math.min(100, Math.max(0, startOffset + deltaPercent));
                                updateGradientStop(idx, { offset: Math.round(newOffset) });
                              }
                            };
                            const handleMouseUp = () => {
                              window.removeEventListener('mousemove', handleMouseMove);
                              window.removeEventListener('mouseup', handleMouseUp);
                              if (!hasDragged) {
                                const pickRect = currentTargetElement.getBoundingClientRect();
                                setPickerPos({ x: pickRect.left - 120, y: pickRect.top - 100 });
                                openGradientStopPicker(idx);
                              }
                            };
                            window.addEventListener('mousemove', handleMouseMove);
                            window.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div
                            className="border-2 border-white shadow-md relative hover:scale-110 transition-transform"
                            style={{
                              width: '1.5vw', height: '1.5vw',
                              backgroundColor: stop.color,
                              borderRadius: (backgroundSettings.gradientType === 'Diamond') ? '0.15vw' : '0.4vw'
                            }}
                          >
                             <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[0.3vw] border-l-transparent border-r-[0.3vw] border-r-transparent border-t-[0.4vw] border-t-white"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="w-full h-[1.5vw] rounded-[0.4vw] shadow-inner border border-gray-100 cursor-copy"
                      onClick={addGradientStop}
                      style={{
                        background: `linear-gradient(to right, ${(backgroundSettings.gradientStops || []).map(s => {
                          const rgb = hexToRgb(s.color);
                          const opacity = (s.opacity || 100) / 100;
                          return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
                        }).join(', ')})`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-[0.75vw]">
                  {(backgroundSettings.gradientStops || []).map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-[0.75vw] color-picker-trigger">
                      <div 
                        className="w-[2.25vw] h-[2.25vw] rounded-[0.5vw] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors" 
                        style={{ backgroundColor: stop.color }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPickerPos({ x: rect.right - 0, y: rect.top - 0 });
                          openGradientStopPicker(idx);
                        }}
                      />
                      <div 
                        className="flex-1 h-[2.25vw] border border-gray-600 rounded-[0.5vw] flex items-center px-[0.75vw] justify-start bg-white cursor-pointer hover:border-indigo-400 transition-colors"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPickerPos({ x: rect.left - 0, y: rect.top - 0 });
                          openGradientStopPicker(idx);
                        }}
                      >
                        <span className="text-[0.85vw] font-medium text-gray-700 font-mono">{stop.color.toUpperCase()}</span>
                      </div>
                      <button onClick={() => removeGradientStop(idx)} className="w-[2.25vw] h-[2.25vw] flex items-center justify-center border border-red-500 rounded-[0.5vw] text-red-500 hover:bg-red-50 transition-colors">
                        <Minus size="1.2vw" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-[1vw] mb-[1.5vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Gradient Colors</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                <div className="grid grid-cols-6 gap-[0.625vw] px-[0.25vw]">
                  {[
                    ['#FFE2BB', '#FFBBC1'], ['#4DBA55', '#A2D357'], ['#FF0581', '#FFB5DC'],
                    ['#7F073D', '#F967C8'], ['#ff3969', '#faccc5'], ['#FDBB2D', '#22C1C3'],
                    ['#FFB0DC', '#DFCBFF'], ['#82ABFF', '#43D3DA'], ['#A5B4FC', '#E0E7FF'],
                    ['#fa709a', '#D5A7FF'], ['#30cfd0', '#713EAE'], ['#a18cd1', '#fbc2eb'],
                    ['#6FF067', '#8131FF'], ['#FEA8BF', '#76F9FE'], ['#3873A7', '#208D6B'],
                    ['#FEF0A5', '#97006F'], ['#57047D', '#EEBEBE'], ['#7CC38F', '#FF76D9'],
                  ].map((colors, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        const newStops = colors.map((c, idx) => ({
                          color: c,
                          offset: Math.round((idx / (colors.length - 1)) * 100),
                          opacity: 100
                        }));
                        const gradient = generateGradientString(
                          backgroundSettings.gradientType || 'Linear', 
                          newStops,
                          backgroundSettings.gradientAngle || 0,
                          backgroundSettings.gradientRadius || 100
                        );
                        onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
                      }}
                      className="aspect-square rounded-[0.5vw] border border-gray-200 shadow-sm transition-all hover:scale-110"
                      style={{ background: `linear-gradient(to bottom right, ${colors.join(', ')})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {bgStyle === 'Image' && (
            <div className="flex flex-col gap-[1vw]">
              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[0.25vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Upload Image</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => onUpdateBackground({ ...backgroundSettings, style: 'Image', image: event.target.result });
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {backgroundSettings.image ? (
                  <div className="flex items-start gap-[0.75vw] pb-[1.25vw]">
                    {/* Current Image */}
                    <div className="flex flex-col items-center gap-[0.35vw]">
                      <div className="relative w-[5.5vw] h-[5vw] p-[0.2vw] rounded-[0.5vw] overflow-hidden bg-white flex items-center justify-center group" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}>
                        <img 
                          src={backgroundSettings.image} 
                          alt="Thumbnail" 
                          className={`w-full h-full rounded-[0.5vw] ${backgroundSettings?.cropData ? 'object-cover' : 'object-fill'}`} 
                          style={(() => {
                            const cd = backgroundSettings?.cropData;
                            return cd && cd.inset ? { 
                              clipPath: cd.inset, 
                              WebkitClipPath: cd.inset, 
                              transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`, 
                              transformOrigin: 'center center' 
                            } : {};
                          })()}
                        />
                        {/* Hover overlay */}
                        <div
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-[0.2vw] cursor-pointer"
                          onClick={() => onUpdateBackground({ ...backgroundSettings, image: null })}
                        >
                          <Icon icon="lucide:trash-2" className="w-[1.1vw] h-[1.1vw] text-white" />
                          <span className="text-[0.5vw] text-white font-semibold">Remove</span>
                        </div>
                      </div>
                      <span className="text-[0.6vw] font-semibold text-gray-400">Current</span>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center shrink-0 h-[5vw]">
                      <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]/100" />
                    </div>

                    {/* Replace Upload Box */}
                    <div className="flex flex-col items-center gap-[0.35vw] flex-1">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50/20'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20'); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20');
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (event) => onUpdateBackground({ ...backgroundSettings, style: 'Image', image: event.target.result });
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full h-[5vw] rounded-[0.5vw] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all bg-white"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                      >
                        <p className="text-[0.6vw] font-medium text-gray-600 text-center mb-[0.1vw]">
                          Drag & Drop or <span className="text-[#4F46E5] font-semibold">Upload</span>
                        </p>
                        <Icon icon="lucide:upload" className="w-[0.8vw] h-[0.8vw] text-gray-400 mb-[0.35vw]" />
                        <div className="flex flex-col items-center">
                          <span className="text-[0.5vw] font-semibold text-gray-500">Supported File</span>
                          <span className="text-[0.5vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
                        </div>
                      </div>
                      {/* Spacer to match the height of 'Current' text for vertical symmetry */}
                      <span className="text-[0.6vw] opacity-0 pointer-events-none select-none">Spacer</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[1vw] mb-[1vw]">
                    <div className="flex flex-col items-center">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[14vw] h-[7vw] rounded-[1vw] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50  transition-all group bg-white py-[0.75vw]"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                      >
                        <p className="text-[0.8vw] font-medium text-gray-600 text-center mb-[0.4vw]">
                          Drag & Drop or <span className="text-[#4F46E5] font-bold">Upload</span>
                        </p>
                        <Icon icon="lucide:upload" className="w-[1.5vw] h-[1.5vw] text-gray-400 mb-[0.5vw]" />
                        <div className="flex flex-col items-center">
                          <span className="text-[0.65vw] font-semibold text-gray-500">Supported File</span>
                          <span className="text-[0.65vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                              onClick={() => setShowGallery(true)}
                              className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg flex items-center justify-center border border-white/5"
                            >
                              {/* Background Images Overlay */}
                              <div className="absolute inset-0 flex gap-[0.5vw] opacity-20 group-hover:opacity-40 transition-opacity">
                                <div className="flex-1 bg-cover bg-center" 
                                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=300&auto=format&fit=crop')" }}>
                                </div>
                                <div className="flex-1 bg-cover bg-center" 
                                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=300&auto=format&fit=crop')" }}>
                                </div>
                                <div className="flex-1 bg-cover bg-center" 
                                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=300&auto=format&fit=crop')" }}>
                                </div>
                              </div>
                              {/* Dark Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-gray/10 via-gray/20 to-gray/40 group-hover:via-gray/20 transition-all"></div>
                              
                             {/* Content */}
                           <div className="relative z-10 flex items-center gap-[0.75vw]">
                               <Icon icon="clarity:image-gallery-solid" className="w-[1vw] h-[1.2vw] text-white" />
                             <span className="text-[0.95vw] font-semibold text-white ">Image Gallery</span>
                           </div>
                            </button>
              </div>
            </div>
          )}


          {/* Opacity Slider and Adjustments - Only show for Image and Video */}
          {bgStyle === 'Image' && backgroundSettings.image ? (
            <>
              <div className="">
                <SectionLabel 
                label="Opacity"
                />
                <AdjustmentSlider 
                  value={backgroundSettings.opacity} 
                  onChange={(val) => onUpdateBackground({ ...backgroundSettings, opacity: val })} 
                  onReset={() => onUpdateBackground({ ...backgroundSettings, opacity: 100 })}
                  min={0}
                  max={100}
                  unit="%"
                />
              </div>

              {/* Adjustment Section */}
              <div className=" space-y-[0.3vw] ">
                <SectionLabel label="Adjustments" />
                <div className="space-y-[0.1vw] mt-[0.5vw]">
                  <AdjustmentSlider 
                    label="Exposure" 
                    value={backgroundSettings?.adjustments?.exposure || 0} 
                    onChange={(val) => handleAdjustmentChange('exposure', val)} 
                    onReset={() => handleAdjustmentChange('exposure', 0)}
                  />
                  <AdjustmentSlider 
                    label="Contrast" 
                    value={backgroundSettings?.adjustments?.contrast || 0} 
                    onChange={(val) => handleAdjustmentChange('contrast', val)} 
                    onReset={() => handleAdjustmentChange('contrast', 0)}
                  />
                  <AdjustmentSlider 
                    label="Saturation" 
                    value={backgroundSettings?.adjustments?.saturation || 0} 
                    onChange={(val) => handleAdjustmentChange('saturation', val)} 
                    onReset={() => handleAdjustmentChange('saturation', 0)}
                  />
                  <AdjustmentSlider 
                    label="Temperature" 
                    value={backgroundSettings?.adjustments?.temperature || 0} 
                    onChange={(val) => handleAdjustmentChange('temperature', val)} 
                    onReset={() => handleAdjustmentChange('temperature', 0)}
                  />
                  <AdjustmentSlider 
                    label="Tint" 
                    value={backgroundSettings?.adjustments?.tint || 0} 
                    onChange={(val) => handleAdjustmentChange('tint', val)} 
                    onReset={() => handleAdjustmentChange('tint', 0)}
                  />
                  <AdjustmentSlider 
                    label="Highlights" 
                    value={backgroundSettings?.adjustments?.highlights || 0} 
                    onChange={(val) => handleAdjustmentChange('highlights', val)} 
                    onReset={() => handleAdjustmentChange('highlights', 0)}
                  />
                  <AdjustmentSlider 
                    label="Shadows" 
                    value={backgroundSettings?.adjustments?.shadows || 0} 
                    onChange={(val) => handleAdjustmentChange('shadows', val)} 
                    onReset={() => handleAdjustmentChange('shadows', 0)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'Themes' && (
        <div className={`flex flex-col gap-[1vw] relative ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}`}>
          {isTransitioning && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
               <div className="flex flex-col items-center gap-2">
                 <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-[#3B3C8A]" />
                 <span className="text-[0.7vw] font-semibold text-gray-500">Optimizing...</span>
               </div>
            </div>
          )}
        <div className="flex flex-col gap-[1vw]">
          <div className="sticky top-[6.7vh] z-[50] grid grid-cols-2 gap-[1vw] py-[0.5vw]  bg-[#ffffff] -mx-[1vw] -mt-[1vw] px-[0.5vw] pr-[1.9vw] pl-[1.5vw] border-b border-gray-50 ">
            {['Background Themes', 'Animated Themes'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setThemeType(tab)} 
                className={`w-full py-[0.5vw] text-[0.85vw] font-semibold transition-all active:scale-95 relative ${
                  themeType === tab 
                    ? 'text-black' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {themeType === tab ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-full gap-[0.45vw]">
                      <span>{tab.split(' ')[0]}</span>
                      <span>{tab.split(' ')[1]}</span>
                    </div>
                    <div className="absolute bottom-[-0vw] w-[7.5vw] h-[0.13vw] bg-[#3B3C8A] rounded-full"></div>
                  </div>
                ) : (
                  tab
                )}
              </button>
            ))}
          </div>

          <div className={`flex flex-col gap-[1vw] px-1 pb-2 ${themeType !== 'Animated Themes' ? 'hidden' : ''}`}>
              <div className="grid grid-cols-3 gap-2">
              <div 
                onClick={() => {
                  setSelectedTheme(null);
                  if (!backgroundSettings.savedNonThemeSettings) {
                    onUpdateBackground({ 
                      ...backgroundSettings, 
                      style: 'Solid', 
                      reactBitType: null, 
                      color: backgroundSettings.savedSolidColor || backgroundSettings.color || '#ffffff'
                    });
                  } else {
                    const updates = { ...backgroundSettings, reactBitType: null };
                    // Always restore the previous background settings if they were saved, 
                    // allowing it to show through behind the animation overlay.
                    if (backgroundSettings.savedNonThemeSettings) {
                      Object.assign(updates, backgroundSettings.savedNonThemeSettings);
                    }
                    onUpdateBackground(updates);
                  }
                }} 
                className="group cursor-pointer flex flex-col gap-[1vw]"
              >
                <div className={`aspect-video w-full h-20 rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all flex items-center justify-center ${!selectedTheme ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
                  <Icon icon="lucide:ban" className="w-6 h-6 text-gray-300" />
                  <div className={`absolute inset-x-0 transition-all duration-300 ${!selectedTheme ? 'top-1/2 -translate-y-1/2 py-2 bg-black/40 flex items-center justify-center scale-[1.02]' : 'bottom-0 py-1 bg-gray/40 backdrop-blur-md text-center'}`}>
                    <span className={`text-[0.75vw] font-semibold transition-colors duration-300 ${!selectedTheme ? 'text-white' : 'text-gray-800'}`}>None</span>
                  </div>
                </div>
              </div>

              {animatedThemesList}
              </div>

              <div className="flex flex-col gap-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[0.5vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Video Themes</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {videoThemesList}
                </div>
              </div>
            </div>

          <div className={`flex flex-col gap-[1vw] px-1 pb-2 ${themeType !== 'Background Themes' ? 'hidden' : ''}`}>
              
                
                <div className="grid grid-cols-3 gap-2">
                  {backgroundThemesList}
                </div>
            </div>
        </div>
        </div>
      )}

      {activeTab === 'Animations' && (
        <div className="grid grid-cols-3 gap-2 px-1 pb-2">
          {/* None Option */}
          <div 
            onClick={() => {
              const updates = { ...backgroundSettings, animation: 'None' };
              // Only restore background if we're not currently in a ReactBits theme
              if (backgroundSettings.style !== 'ReactBits' && backgroundSettings.savedNonThemeSettings) {
                Object.assign(updates, backgroundSettings.savedNonThemeSettings);
              }
              onUpdateBackground(updates);
            }} 
            className="group cursor-pointer flex flex-col gap-2"
          >
            <div className={`aspect-video w-full h-20 rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all flex items-center justify-center ${backgroundSettings.animation === 'None' || !backgroundSettings.animation ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
              <Icon icon="lucide:ban" className="w-6 h-6 text-gray-300" />
              <div className={`absolute inset-x-0 transition-all duration-300 ${
                (backgroundSettings.animation === 'None' || !backgroundSettings.animation) 
                  ? 'top-1/2 -translate-y-1/2 py-2 bg-black/40 flex items-center justify-center' 
                  : 'bottom-0 py-1 bg-gray/40 backdrop-blur-md text-center'
              }`}>
                <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${
                  (backgroundSettings.animation === 'None' || !backgroundSettings.animation) ? 'text-white' : 'text-gray-800'
                }`}>None</span>
              </div>
            </div>
          </div>

          {animationsList}
        </div>
      )}

      {/* Solid Color Picker */}
      {showColorPicker && (
        <CustomColorPicker
          color={backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor ? backgroundSettings.savedSolidColor : backgroundSettings.color}
          onChange={(color) => {
             handleColorSelect(color);
          }}
          onClose={() => setShowColorPicker(false)}
          position={pickerPos}
        />
      )}

      {/* Gradient Stop Color Picker */}
      {editingGradientStopIndex !== null && backgroundSettings.gradientStops && (
        <CustomColorPicker
          color={backgroundSettings.gradientStops[editingGradientStopIndex].color}
          opacity={backgroundSettings.gradientStops[editingGradientStopIndex].opacity || 100}
          onChange={(color) => {
             updateGradientStop(editingGradientStopIndex, { color });
          }}
          onOpacityChange={(opacity) => {
             updateGradientStop(editingGradientStopIndex, { opacity });
          }}
          onClose={() => setEditingGradientStopIndex(null)}
          position={pickerPos}
        />
      )}

      {/* Image Gallery Pop-up */}
      {showGallery && (
        <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[0.8vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
             style={{ width: '320px', height: '540px', top: '50%', left: '24vw', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-100">
            <h2 className="text-[1vw] font-semibold text-gray-900">Image Gallery</h2>
            <button onClick={() => setShowGallery(false)} className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-[1.2vw] h-[1.2vw] text-gray-400" />
            </button>
          </div>

          <div className="px-[1vw] py-[0.5vw]">
            <h3 className="text-[0.85vw] font-semibold text-gray-900 mb-[0.2vw]">Upload your Image</h3>
            <p className="text-[0.7vw] text-gray-400 mb-[1vw]">
              <span>You Can Reuse The File Which Is Uploaded In Gallery</span>
              <span className="text-red-500">*</span>
            </p>
            <div
              onClick={() => galleryInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  handleModalFileUpload({ target: { files: [file] } });
                }
              }}
             className="w-full h-[12vh] rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-indigo-50  transition-all cursor-pointer group "
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                         >
                           <p className="text-[0.9vw] text-gray-600 font-semibold mb-[0.5vw]">Drag & Drop or <span className="text-[#4F46E5] font-semibold">Upload</span></p>
                                         <Icon icon="lucide:upload" className="w-[1.2vw] h-[1.2vw] text-gray-400 mb-2" />
                                         <div className="flex flex-col items-center">
                                           <span className="text-[0.7vw] font-semibold text-gray-500">Supported File</span>
                                           <span className="text-[0.7vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
                                         </div>
                         </div>
            <input type="file" ref={galleryInputRef} onChange={handleModalFileUpload} accept="image/*" className="hidden" />
          </div>

          <div className="custom-scrollbar overflow-y-auto px-[1vw] py-[0.5vw] flex-1">
            <h3 className="text-[0.85vw] font-semibold text-gray-900 mb-[0.5vw]">Uploaded Images</h3>
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-[0.5vw]">
                {uploadedImages.map((img, index) => (
                  <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalGallerySelected(img)}>
                    <div className={`aspect-square w-full rounded-[0.5vw] overflow-hidden border-[0.15vw] transition-all ${localGallerySelected?.id === img.id ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}>
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-[2vw] text-gray-400">
                <p className="text-[0.8vw]">No uploaded images yet</p>
              </div>
            )}
          </div>

          <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white mt-auto">
            <button 
              onClick={() => { setShowGallery(false); setLocalGallerySelected(null); }} 
              className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.3vw] hover:bg-gray-50"
            >
              <X size="0.9vw" /> Close
            </button>
            <button
              onClick={() => {
                if (localGallerySelected) {
                  onUpdateBackground({ ...backgroundSettings, image: localGallerySelected.url });
                  setShowGallery(false);
                }
              }}
              disabled={!localGallerySelected}
              className={`flex-1 h-[2vw] rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.3vw] transition-all ${localGallerySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Check size="0.9vw" /> Place
            </button>
          </div>
        </div>
      )}
      {/* Background Crop Overlay */}
      {showBgCropOverlay && backgroundSettings.image && (
        <ImageCropOverlay
          imageSrc={backgroundSettings.image}
          element={null}
          onSave={(cropData) => {
            onUpdateBackground({ ...backgroundSettings, cropData });
            setShowBgCropOverlay(false);
          }}
          onCancel={() => setShowBgCropOverlay(false)}
        />
      )}
    </div>
  );
};

export default BackgroundSection;




