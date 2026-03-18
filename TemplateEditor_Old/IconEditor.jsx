import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Upload, Replace, ChevronUp, ChevronDown, Edit3, X, Grid, ArrowLeft, ZoomIn, ZoomOut, Mail, Phone, Globe, Trash2, Save, Image, Folder, Move, Check, CheckCheck, Battery, Calendar, File, Settings, Search, Home, User, Users, Star, Heart, Share2, Download, Cloud, Clock, MapPin, Lock, Unlock, Menu, Play, Pause, AlertCircle, Info, HelpCircle, Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Pipette, RotateCcw, Minus } from 'lucide-react';
import InteractionPanel from './InteractionPanel';
import AnimationPanel from './AnimationPanel';
import { Icon } from '@iconify/react';
import ColorPicker from '../ThreedEditor/ColorPicker';


const IconEditor = ({
  selectedElement,
  onUpdate,
  onPopupPreviewUpdate,
  activePopupElement,
  onPopupUpdate,
  pages,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true
}) => {
  const [iconColor, setIconColor] = useState('#000000');
  const [iconFill, setIconFill] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [previewData, setPreviewData] = useState({ viewBox: '0 0 24 24', html: '' });
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [pickerTarget, setPickerTarget] = useState(null); // 'fill' or 'stroke'
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showDetailedControls, setShowDetailedControls] = useState(false);
  const [showDetailedStrokeControls, setShowDetailedStrokeControls] = useState(false);
  const [colorMode, setColorMode] = useState('fill'); // 'fill' or 'stroke'

  const fillPickerRef = useRef(null);
  const strokePickerRef = useRef(null);
  const fillTypeRef = useRef(null);
  const strokeFillTypeRef = useRef(null);
  
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'none' || rgb === 'transparent') return 'none';
    if (!rgb.startsWith('rgb')) return rgb;
    const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/);
    if (!parts) return rgb;
    const r = parseInt(parts[1]);
    const g = parseInt(parts[2]);
    const b = parseInt(parts[3]);
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    return hex === '#000000' && rgb.includes('0, 0, 0, 0') ? 'none' : hex;
  };  
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const isMainPanelOpen = activeSection === 'main';
  const [openSubSection, setOpenSubSection] = useState(null);

  const [showGallery, setShowGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [tempSelectedIcon, setTempSelectedIcon] = useState(null);
  const [iconifyIcons, setIconifyIcons] = useState([]);
  const [isSearchingIconify, setIsSearchingIconify] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  
  // Reset visible count when search or gallery availability changes
  useEffect(() => {
    setVisibleCount(50);
    if (activeTab === 'gallery' && searchQuery.trim()) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
          fetchIconifyIcons(searchQuery);
      }, 500);
    }
  }, [searchQuery, showGallery, activeTab]);

  const fetchIconifyIcons = async (query) => {
      if (!query.trim()) {
          setIconifyIcons([]);
          return;
      }
      setIsSearchingIconify(true);
      try {
          const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=100`);
          const data = await res.json();
          if (data && data.icons) {
              setIconifyIcons(data.icons.map(name => ({ name, isIconify: true })));
          } else {
              setIconifyIcons([]);
          }
      } catch (err) {
          console.error("Iconify search failed", err);
          setIconifyIcons([]);
      } finally {
          setIsSearchingIconify(false);
      }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCount(prev => prev + 50);
    }
  };

  const lucideList = useMemo(() => {
    return Object.keys(LucideIcons)
      .filter(key => key !== 'createLucideIcon' && key !== 'default' && key !== 'icons' && key !== 'Icon' && /^[A-Z]/.test(key))
      .map(key => ({ name: key, Component: LucideIcons[key] }));
  }, []);

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return lucideList;
    const lower = searchQuery.toLowerCase();
    return lucideList.filter(icon => icon.name.toLowerCase().includes(lower));
  }, [searchQuery, lucideList]);

  const [uploadedIcons, setUploadedIcons] = useState([
     { name: 'Mail', Component: Mail },
    { name: 'Call', Component: Phone },
    { name: 'Web', Component: Globe },
    { name: 'Twitter', Component: Twitter },
    { name: 'Instagram', Component: Instagram },
    { name: 'LinkedIn', Component: Linkedin },
    { name: 'GitHub', Component: Github }
  ]);

  // Helper to get colors used on the current page
  const colorsOnPage = useMemo(() => {
    if (!selectedElement || !selectedElement.ownerDocument) return [];
    // Search for elements with fill or stroke attributes in the whole document
    // This is similar to TextEditor's logic but adapted for SVG elements
    const elements = selectedElement.ownerDocument.querySelectorAll('[fill], [stroke], [data-fill-color], [data-stroke-color]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('fill') || el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('stroke') || el.getAttribute('data-stroke-color');
      
      if (fill && fill !== 'none' && fill.startsWith('#')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke.startsWith('#')) colors.add(stroke.toUpperCase());
    });
    // Add default white and black if not present
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [selectedElement, pages]);

  useEffect(() => {
    if (!selectedElement) return;

    const syncFromDOM = () => {
        const path = selectedElement.querySelector('path, circle, rect, polyline, polygon, line') || selectedElement;
        const computed = window.getComputedStyle(path);

        const stroke = rgbToHex(computed.stroke);
        const fill = rgbToHex(computed.fill);
        const width = parseFloat(computed.strokeWidth) || 2;

        setIconColor(stroke === 'none' ? '#000000' : stroke); 
        setIconFill(fill);
        setStrokeWidth(width);

        const currentOpacity = selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1';
        setOpacity(Math.round(parseFloat(currentOpacity) * 100));

        setPreviewData({
            viewBox: selectedElement.getAttribute('viewBox') || '0 0 24 24',
            html: selectedElement.innerHTML
        });
    };

    const observer = new MutationObserver(syncFromDOM);
    observer.observe(selectedElement, { attributes: true, subtree: true, attributeFilter: ['stroke', 'fill', 'stroke-width', 'style', 'd', 'points', 'opacity'] });

    syncFromDOM();

    return () => observer.disconnect();
  }, [selectedElement]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fillPickerRef.current && !fillPickerRef.current.contains(event.target) && !event.target.closest('.fill-picker-trigger') && !event.target.closest('.color-picker-container')) setShowFillPicker(false);
      if (strokePickerRef.current && !strokePickerRef.current.contains(event.target) && !event.target.closest('.stroke-picker-trigger') && !event.target.closest('.color-picker-container')) setShowStrokePicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateIconColor = (color) => {
    setIconColor(color);
    if (selectedElement) {
      // Validate hex for partial typing
      if (color !== 'none' && !/^#([A-Fa-f0-9]{0,6})$/.test(color)) return;

      selectedElement.setAttribute('stroke', color);
      selectedElement.style.setProperty('stroke', color, 'important');
      
      const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
      paths.forEach(p => {
        p.setAttribute('stroke', color);
        p.style.setProperty('stroke', color, 'important');
      });
      
      selectedElement.style.color = color; 
      
      // Sync sidebar preview SVG (instant, no iframe rewrite)
      setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
      // Removed immediate onUpdate() to prevent iframe rewrite during drag
    }
  };

  const updateIconFill = (color) => {
    setIconFill(color);
    if (selectedElement) {
      // Validate hex for partial typing
      if (color !== 'none' && !/^#([A-Fa-f0-9]{0,6})$/.test(color)) return;

      if (color === 'none') {
        selectedElement.removeAttribute('fill');
      } else {
        selectedElement.setAttribute('fill', color);
      }
      selectedElement.style.setProperty('fill', color, 'important');
      
      const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
      paths.forEach(p => {
        if (color === 'none') {
          p.removeAttribute('fill');
        } else {
          p.setAttribute('fill', color);
        }
        p.style.setProperty('fill', color, 'important');
      });

      // Sync sidebar preview SVG (instant, no iframe rewrite)
      setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
      // Removed immediate onUpdate() to prevent iframe rewrite during drag
    }
  };

  const commitChanges = () => {
    if (onUpdate) onUpdate();
  };

  const updateStrokeWidth = (newWidth) => {
    if (!selectedElement || isNaN(newWidth)) return;
    
    const widthVal = Math.max(0, newWidth);
    
    selectedElement.setAttribute('stroke-width', widthVal.toString());
    selectedElement.style.setProperty('stroke-width', widthVal.toString(), 'important');
    
    const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
    paths.forEach(p => {
      p.setAttribute('stroke-width', widthVal.toString());
      p.style.setProperty('stroke-width', widthVal.toString(), 'important');
    });
    
    setStrokeWidth(widthVal);
    setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
    onUpdate && onUpdate();
  };

  const updateOpacity = (newOpacity) => {
    if (!selectedElement) return;
    const val = newOpacity / 100;
    selectedElement.style.opacity = val;
    selectedElement.setAttribute('opacity', val);
    setOpacity(newOpacity);
    onUpdate && onUpdate();
  };

  const replaceIconContent = (newViewBox, newInnerHtml) => {
    if (!selectedElement) return;
    if (newViewBox) selectedElement.setAttribute('viewBox', newViewBox);
    selectedElement.innerHTML = newInnerHtml;
    
    // Use a small timeout to let the browser compute styles for the new content
    setTimeout(() => {
        const path = selectedElement.querySelector('path, circle, rect, polyline, polygon, line') || selectedElement;
        const computed = window.getComputedStyle(path);

        const stroke = rgbToHex(computed.stroke);
        const fill = rgbToHex(computed.fill);
        const width = parseFloat(computed.strokeWidth) || 2;

        setIconColor(stroke === 'none' ? '#000000' : stroke); 
        setIconFill(fill);
        setStrokeWidth(width);

        setPreviewData({
            viewBox: newViewBox || selectedElement.getAttribute('viewBox') || '0 0 24 24',
            html: newInnerHtml
        });
        
        onUpdate && onUpdate();
    }, 0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(event.target.result, 'image/svg+xml');
        const newSvg = doc.querySelector('svg');

        if (newSvg) {
          replaceIconContent(newSvg.getAttribute('viewBox'), newSvg.innerHTML);
          // Do NOT save to gallery or temp selection for main panel upload
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(event.target.result, 'image/svg+xml');
          const newSvg = doc.querySelector('svg');
          if (newSvg) {
             const newIcon = {
                 name: file.name.replace('.svg', ''),
                 viewBox: newSvg.getAttribute('viewBox') || '0 0 24 24',
                 d: newSvg.querySelector('path')?.getAttribute('d') || '',
                 html: newSvg.innerHTML
             };
             setUploadedIcons(prev => [newIcon, ...prev]);
             setTempSelectedIcon(newIcon);

             replaceIconContent(newSvg.getAttribute('viewBox'), newSvg.innerHTML);
          }
        };
        reader.readAsText(file);
    }
    e.target.value = '';
  }

  const handleReplaceFromGallery = async () => {
      if(!tempSelectedIcon) return;
      
      let newViewBox = '0 0 24 24';
      let innerHtml = '';

      if (tempSelectedIcon.isIconify) {
          try {
              const res = await fetch(`https://api.iconify.design/${tempSelectedIcon.name}.svg`);
              const svgText = await res.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(svgText, 'image/svg+xml');
              const svg = doc.querySelector('svg');
              if (svg) {
                  newViewBox = svg.getAttribute('viewBox') || '0 0 24 24';
                  innerHtml = svg.innerHTML;
              }
          } catch (err) {
              console.error("Failed to load Iconify SVG", err);
              return;
          }
      } else if (tempSelectedIcon.Component) {
          const svgString = renderToStaticMarkup(<tempSelectedIcon.Component strokeWidth={2} />);
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgString, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          if (svg) {
              newViewBox = svg.getAttribute('viewBox') || '0 0 24 24';
              innerHtml = svg.innerHTML;
          }
      } else if (tempSelectedIcon.html) {
          newViewBox = tempSelectedIcon.viewBox || '0 0 24 24';
          innerHtml = tempSelectedIcon.html;
      } else if (tempSelectedIcon.d) {
          newViewBox = tempSelectedIcon.viewBox || '0 0 24 24';
          innerHtml = `<path d="${tempSelectedIcon.d}" stroke="none"></path>`;
      }
      
      replaceIconContent(newViewBox, innerHtml);
      setShowGallery(false);
  }


  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-[1vw] w-full">
       <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
        input[type='range'] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type='range']::-webkit-slider-runnable-track {
          height: 0.25vw;
          border-radius: 0.125vw;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 0.8vw;
          width: 0.8vw;
          border-radius: 50%;
          background: #6366f1;
          border: 0.125vw solid #ffffff;
          box-shadow: 0 0.06vw 0.2vw rgba(0,0,0,0.2);
          margin-top: -0.3vw;
          cursor: pointer;
        }
      `}</style>

      <div className="bg-white border space-y-[1vw] border-gray-200 rounded-[0.9vw] shadow-sm overflow-hidden relative font-sans">
        
        <div 
          className="flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}
        >
          <div className="flex items-center gap-[0.5vw]">
            <Icon icon="uil:icons"  className="text-gray-600" width="1vw" height="1vw" />
            <span className="font-medium text-gray-700 text-[0.85vw]">Icon</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${isMainPanelOpen ? '' : 'rotate-180'}`} />
        </div>

        {isMainPanelOpen && (
          <div className="space-y-[1.25vw] px-[1.25vw] mb-[1.5vw] pt-[0.5vw]">
            
            <div className="space-y-[1vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap">Replace Icon</span>
                <div className="h-[0.125vw] w-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-[0.75vw]">
                <div className="w-[4.5vw] h-[4.5vw] rounded-[0.75vw] overflow-hidden border-2 border-dashed bg-gray-50 p-[0.5vw] flex items-center justify-center">
                    <svg 
                        viewBox={previewData.viewBox}
                        className="w-full h-full"
                        style={{ 
                            fill: iconFill, 
                            stroke: iconColor, 
                            strokeWidth: strokeWidth,
                            opacity: opacity / 100 
                        }}
                        dangerouslySetInnerHTML={{ __html: previewData.html }} 
                    />
                </div>
           
                
                <Replace size="1.1vw" className="text-gray-300 shrink-0" />
                
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-[4.5vw] border-2 border-dashed bg-gray-50 rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload size="1.1vw" className="text-500 mb-[0.25vw]" />
                  <p className="text-[0.6vw] text-gray-400 font-medium text-center">Drag & Drop or <span className="font-bold text-indigo-600">Upload SVG</span></p>
                </div>
                <input
                    type="file"
                    accept=".svg"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
              </div>

              <div 
                onClick={() => {
                    setShowGallery(true);
                    setSearchQuery('');
                    setIconifyIcons([]);
                    setTempSelectedIcon(null);
                    setActiveTab('gallery');
                }}
                className="relative h-[7vw] rounded-[0.5vw] overflow-hidden cursor-pointer group border border-gray-200 select-none bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Background with icon previews */}
                <div className="absolute inset-0 p-[0.5vw]">
                  <div className="grid grid-cols-6 gap-[0.5vw] opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-500">
                    {[...uploadedIcons, ...lucideList].slice(0, 12).map((icon, i) => (
                      <div key={i} className="aspect-square rounded-[0.25vw] bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                        {icon.Component ? (
                          <icon.Component className="w-[60%] h-[60%] text-gray-800" strokeWidth={1.5} />
                        ) : (
                          <svg viewBox={icon.viewBox} className="w-[60%] h-[60%] fill-gray-800">
                            {icon.html ? (
                              <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                            ) : (
                              <path d={icon.d} />
                            )}
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                 
                {/* Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-all duration-300 group-hover:bg-black/20">
                  <div className="flex items-center gap-[0.5vw] text-white bg-black/40 px-[1vw] py-[0.5vw] rounded-[0.5vw] backdrop-blur-sm border border-white/10 shadow-sm group-hover:bg-black/60 group-hover:scale-105 transition-all duration-300 transform">
                    <Grid size="0.9vw" className="text-white" />
                    <span className="text-[0.8vw] font-semibold tracking-wide">Icon Gallery</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-[1vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.85vw] font-bold text-gray-800">Opacity</span>
                <div className="h-[0.125vw] w-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-[1vw] px-[0.25vw]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => updateOpacity(Number(e.target.value))}
                  className="flex-1 h-[0.25vw] appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)`,
                  }}
                />
                <span className="text-[0.85vw] font-medium text-gray-600 w-[3.5vw] text-right whitespace-nowrap">
                  {opacity} %
                </span>
              </div>
            </div>



            <div className="border border-gray-200 rounded-[0.9vw] overflow-hidden bg-white shadow-sm font-sans mb-3">
              <div 
                className="w-full flex items-center justify-between px-[1vw] py-[1vw] cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50" 
                onClick={() => setOpenSubSection(openSubSection === 'color' ? null : 'color')}
              >
                <span className="text-[0.85vw] font-semibold text-gray-900">Color</span>
                <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openSubSection === 'color' ? '' : 'rotate-180'}`} />
              </div>

              {openSubSection === 'color' && (
                <div className="p-[1vw] space-y-[1vw] bg-white">
                   {/* Fill */}
                   <div className="flex items-center gap-[0.75vw]">
                     <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw]">Fill :</span>
                     <div 
                       onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); setColorMode('fill'); }} 
                       className="w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border border-gray-200 cursor-pointer flex-shrink-0 shadow-sm relative overflow-hidden fill-picker-trigger" 
                       style={{ background: (iconFill === 'none' || iconFill === '#' || !iconFill) ? 'transparent' : iconFill }}
                     >
                       <div className="w-full h-full" style={{ backgroundColor: iconFill === 'none' ? 'transparent' : iconFill }} />
                       {(iconFill === 'none' || iconFill === '#' || !iconFill) && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                         </div>
                       )}
                     </div>
                     
                     <div className="flex-grow flex items-center border-[0.1vw] border-gray-400 rounded-[0.75vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-400 transition-colors px-[0.75vw]">
                       <input
                         type="text"
                         value={iconFill === 'none' ? '#' : (iconFill.startsWith('#') ? iconFill.toUpperCase() : '#' + iconFill.toUpperCase())}
                         onChange={(e) => {
                             const val = e.target.value.trim();
                             if (val === '#' || val === '') updateIconFill('none');
                             else updateIconFill(val.startsWith('#') ? val : '#' + val);
                         }}
                         className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw]"
                         maxLength={7}
                         placeholder="#"
                       />
                       <div className="flex items-center gap-[0.1vw] ml-[0.5vw]">
                         <input
                             type="number"
                             min="0"
                             max="100"
                             value={opacity}
                             onChange={(e) => updateOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                             className="w-[1.5vw] text-right text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                         />
                         <span className="text-[0.75vw] font-medium text-gray-500">%</span>
                       </div>
                     </div>
                   </div>

                  {/* Stroke */}
                  <div className="flex items-center gap-[0.75vw]">
                    <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw]">Stroke :</span>
                    <div
                      onClick={() => {
                        setShowStrokePicker(!showStrokePicker);
                        setShowFillPicker(false);
                        setColorMode('stroke');
                      }}
                      className="w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border border-gray-200 cursor-pointer flex-shrink-0 shadow-sm relative overflow-hidden bg-white stroke-picker-trigger"
                      style={{ background: (iconColor === 'none' || iconColor === '#' || !iconColor) ? 'white' : iconColor }}
                    >
                      <div className="w-full h-full" style={{ backgroundColor: iconColor === 'none' ? 'transparent' : iconColor }} />
                      {(iconColor === 'none' || iconColor === '#' || !iconColor) && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                      )}
                    </div>
                    
                     <div className="flex-grow flex items-center border-[0.1vw] border-gray-400 rounded-[0.75vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-400 transition-colors px-[0.75vw]">
                       <input
                         type="text"
                         value={iconColor === 'none' ? '#' : (iconColor.startsWith('#') ? iconColor.toUpperCase() : '#' + iconColor.toUpperCase())}
                         onChange={(e) => {
                             const val = e.target.value.trim();
                             if (val === '#' || val === '') updateIconColor('none');
                             else updateIconColor(val.startsWith('#') ? val : '#' + val);
                         }}
                         className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw]"
                         maxLength={7}
                         placeholder="#"
                       />
                       <div className="flex items-center gap-[0.1vw] ml-[0.5vw]">
                         <input
                             type="number"
                             min="0"
                             max="100"
                             value={opacity}
                             onChange={(e) => updateOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                             className="w-[1.5vw] text-right text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                         />
                         <span className="text-[0.75vw] font-medium text-gray-500">%</span>
                       </div>
                     </div>
                  </div>

                  {/* Width Row */}
                  <div className="flex justify-end pt-[0.25vw]">
                    <div
                      className="h-[2vw] min-w-[4vw] border-[0.1vw] border-gray-400 rounded-[0.5vw] flex items-center px-[0.5vw] gap-[0.5vw] bg-white hover:border-indigo-400 transition-colors cursor-ew-resize select-none shadow-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX;
                        const startVal = strokeWidth || 0;
                        const handleMove = (moveEvent) => {
                          const diff = Math.round((moveEvent.clientX - startX) / 2);
                          const newVal = Math.max(0, Math.min(20, startVal + diff));
                          updateStrokeWidth(newVal);
                        };
                        const handleUp = () => {
                          window.removeEventListener('mousemove', handleMove);
                          window.removeEventListener('mouseup', handleUp);
                        };
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', handleUp);
                      }}
                    >
                       <Icon icon="material-symbols:line-weight" width="0.9vw" height="0.9vw" className="text-gray-500 flex-shrink-0" />
                        <input
                          type="number"
                          readOnly
                          value={strokeWidth}
                          className="w-[2.5vw] text-[0.75vw] font-medium outline-none text-right bg-transparent text-gray-700 pointer-events-none"
                        />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>



      {showGallery && (
        <div
          className="fixed z-[10000] bg-white border border-gray-100 rounded-[0.75vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            width: '22vw',
            height: '36vw',
            top: '50%',
            left: '80%',
            transform: 'translate(-50%, -50%)'
          }}
        >
           <div className="flex px-[1vw] pt-[0.75vw] border-b bg-white">
             <button
               onClick={() => setActiveTab("gallery")}
               className={`flex-1 pb-[0.5vw] text-[0.7vw] font-bold transition-all ${activeTab === "gallery" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"}`}
             >
               Icons
             </button>
             <button
               onClick={() => setActiveTab("uploaded")}
               className={`flex-1 pb-[0.5vw] text-[0.7vw] font-bold transition-all ${activeTab === "uploaded" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"}`}
             >
               Uploaded
             </button>
           </div>
           
           {activeTab === 'gallery' && (
             <div className="px-[1.5vw] py-[1vw] border-b bg-white">
                <div className="relative">
                  <Search size="1vw" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search icons (Lucide & Iconify)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[2.25vw] pl-[2.25vw] pr-[2vw] text-[0.75vw] bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-black  transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size="0.9vw" />
                    </button>
                  )}
                </div>
             </div>
           )}
           
           <div 
             className="flex-1 overflow-y-auto px-[1.5vw] py-[1.5vw] custom-scrollbar"
             onScroll={handleScroll}
           >
             {activeTab === 'gallery' && (
                 <div className="space-y-[1.5vw]">
                     <div className="grid grid-cols-5 gap-[0.75vw]">
                         {filteredIcons.slice(0, visibleCount).map((icon, index) => (
                            <div 
                                key={`lucide-${index}`} 
                                onClick={() => setTempSelectedIcon(icon)}
                                className={`aspect-square rounded-[0.4vw] flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 ${tempSelectedIcon === icon ? 'bg-gray-200 ring-2 ring-gray-300' : 'bg-transparent'}`}
                            >
                                {icon.Component ? (
                                    <icon.Component className="w-[2.25vw] h-[2.25vw] text-black" strokeWidth={1.5} />
                                ) : (
                                    <svg viewBox={icon.viewBox} className="w-[2.25vw] h-[2.25vw] fill-black">
                                        {icon.html ? (
                                            <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                                        ) : (
                                            <path d={icon.d} />
                                        )}
                                    </svg>
                                )}
                            </div>
                        ))}

                        {iconifyIcons.map((icon, index) => (
                            <div 
                                key={`iconify-${index}`} 
                                onClick={() => setTempSelectedIcon(icon)}
                                className={`aspect-square rounded-[0.4vw] flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 ${tempSelectedIcon?.name === icon.name ? 'bg-gray-200 ring-2 ring-gray-300' : 'bg-transparent'}`}
                            >
                                <Icon icon={icon.name} className="w-[2.25vw] h-[2.25vw] text-black" />
                            </div>
                        ))}

                        {isSearchingIconify && (
                            <div className="col-span-5 flex flex-col items-center justify-center py-[2vw] gap-[0.5vw]">
                                <Icon icon="line-md:loading-twotone-loop" className="text-gray-400" width="2.5vw" height="2.5vw" />
                            </div>
                        )}
                        
                        {!isSearchingIconify && searchQuery.trim() && filteredIcons.length === 0 && iconifyIcons.length === 0 && (
                             <div className="col-span-5 text-center py-[1vw]">
                                 <span className="text-[0.7vw] text-gray-400">No results found for "{searchQuery}"</span>
                             </div>
                        )}
                    </div>
                 </div>
             )}

             {activeTab === 'uploaded' && (
                 <>
                    <h3 className="text-[0.75vw] font-bold text-black mb-[1vw]">Upload your Icon</h3>
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full h-[7vw] border-[0.125vw] border-dashed border-gray-300 rounded-[1.125vw] flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-[1.5vw]"
                    >
                      <p className="text-[0.75vw] text-gray-400 font-medium mb-[0.5vw]">
                        Drag & Drop or <span className="text-[#5D38FF] font-bold">Upload</span>
                      </p>
                      <Upload size="1.5vw" className="text-gray-300 mb-[0.5vw]" strokeWidth={1.5} />
                      <p className="text-[0.6vw] text-gray-400">
                        Supported File : <span className="uppercase">SVG</span>
                      </p>
                    </div>
                    <input 
                        type="file" 
                        accept=".svg" 
                        ref={galleryInputRef} 
                        className="hidden" 
                        onChange={handleModalFileUpload}
                    />

                    <h3 className="text-[0.75vw] font-bold text-black mb-[1vw]">Uploaded Icons</h3>
                    <div className="grid grid-cols-5 gap-[0.75vw]">
                        {uploadedIcons.map((icon, index) => (
                            <div 
                                key={index} 
                                onClick={() => setTempSelectedIcon(icon)}
                                className={`aspect-square rounded-[0.4vw] flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 ${tempSelectedIcon === icon ? 'bg-gray-200 ring-2 ring-gray-300' : 'bg-transparent'}`}
                            >
                                {icon.Component ? (
                                    <icon.Component className="w-[1.5vw] h-[1.5vw] text-black" strokeWidth={1.5} />
                                ) : (
                                    <svg viewBox={icon.viewBox} className="w-[1.5vw] h-[1.5vw] fill-black">
                                        {icon.html ? (
                                            <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                                        ) : (
                                            <path d={icon.d} />
                                        )}
                                    </svg>
                                )}
                            </div>
                        ))}
                         {uploadedIcons.length === 0 && <span className="text-[0.6vw] text-gray-400 col-span-5 text-center py-[1vw]">No uploaded icons yet</span>}
                    </div>
                 </>
             )}
           </div>

           <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white">
             <button
               onClick={() => setShowGallery(false)}
               className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] hover:bg-gray-50"
             >
               <X size="0.75vw" /> Close
             </button>
             <button
               disabled={!tempSelectedIcon}
               onClick={handleReplaceFromGallery}
               className="flex-1 h-[2vw] bg-black text-white rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] hover:bg-zinc-800 disabled:opacity-50"
             >
               <Replace size="0.75vw" /> Replace
             </button>
           </div>
        </div>
      )}


      {showInteraction && (
        <InteractionPanel
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onPopupPreviewUpdate={onPopupPreviewUpdate}
          pages={pages}
          isOpen={activeSection === 'interaction'}
          onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
          activePopupElement={activePopupElement}
          onPopupUpdate={onPopupUpdate}
          TextEditorComponent={TextEditorComponent}
          ImageEditorComponent={ImageEditorComponent}
          VideoEditorComponent={VideoEditorComponent}
          GifEditorComponent={GifEditorComponent}
          IconEditorComponent={IconEditorComponent || IconEditor}
        />
      )}

      <AnimationPanel
        selectedElement={selectedElement}
        onUpdate={onUpdate}
        isOpen={activeSection === 'animation'}
        onToggle={() => setActiveSection(activeSection === 'animation' ? null : 'animation')}
      />

      {/* STROKE COLOR PICKER */}
      <div ref={strokePickerRef} className={`fixed top-1/2 -translate-y-1/2 right-[22.2vw] w-[19.4vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 z-[10000] overflow-hidden flex flex-col max-h-[90vh] ${showStrokePicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-50 bg-white">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.75vw] font-bold text-gray-700 uppercase">Stroke Color</span>
          </div>

          <div className="flex items-center gap-[0.5vw]">
            <button 
              onClick={() => updateIconColor('#000000')}
              className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
              title="Reset Color"
            >
              <RotateCcw size="1vw" />
            </button>
            <button 
              onClick={() => {
                setShowStrokePicker(false);
                setShowDetailedStrokeControls(false);
              }}
              className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
            >
              <X size="1.1vw" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <div className="flex flex-col h-full">
            {/* Popover for Customize Colors */}
            {showDetailedStrokeControls && createPortal(
              <>
                <div 
                  className="fixed inset-0 z-[10001] bg-transparent" 
                  onClick={() => setShowDetailedStrokeControls(false)}
                ></div>
                <ColorPicker 
                  className="fixed z-[10002] w-[18vw] color-picker-container"
                  style={{ 
                    top: '50%',
                    right: '6.5vw', 
                    transform: 'translateY(-50%)'
                  }}
                  color={iconColor}
                  onChange={(color) => updateIconColor(color)}
                  opacity={opacity}
                  onOpacityChange={updateOpacity}
                  onClose={() => setShowDetailedStrokeControls(false)}
                />
              </>,
              document.body
            )}

            <div className="p-[1vw] space-y-[1.5vw]">
              {/* Colors on this page */}
              <div className="space-y-[0.75vw]">
                <div className="flex items-center gap-[0.75vw]">
                  <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Colors on this page</span>
                  <div className="h-[1px] flex-grow bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-6 gap-[0.5vw]">
                  {colorsOnPage.map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c }}
                      onClick={() => updateIconColor(c)}
                      className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Solid Colors */}
              <div className="space-y-[0.75vw]">
                <div className="flex items-center gap-[0.75vw]">
                  <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Solid Colors</span>
                  <div className="h-[1px] flex-grow bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-6 gap-[0.5vw]">
                  <div 
                    onClick={() => updateIconColor('none')}
                    className="w-full aspect-square rounded-[0.5vw] border border-gray-200 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95 relative bg-white overflow-hidden"
                    title="None"
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                  </div>
                  {[
                    '#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00',
                    '#ADFF2F', '#228B22', '#008080', '#40E0D0', '#00CED1', '#008B8B',
                    '#ADD8E6', '#87CEEB', '#0000FF', '#000080', '#E6E6FA', '#FF00FF',
                    '#A9A9A9', '#D3D3D3', '#F5F5F5', '#333333'
                  ].map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        updateIconColor(c);
                        updateOpacity(100);
                      }}
                      className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Toggle */}
            <div className="mt-auto p-[0.75vw] border-t border-gray-100">
              <button
                onClick={() => setShowDetailedStrokeControls(!showDetailedStrokeControls)}
                className="flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] hover:bg-gray-50 transition-all rounded-[0.75vw] w-full group"
              >
                <div className="w-[2vw] h-[2vw] rounded-full shadow-md group-hover:scale-110 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                <span className="text-[0.85vw] font-bold text-gray-600">Customize Colors</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILL COLOR PICKER */}
      <div ref={fillPickerRef} className={`fixed top-1/2 -translate-y-1/2 right-[22.2vw] w-[19.4vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 z-[10000] overflow-hidden flex flex-col max-h-[90vh] ${showFillPicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-50 bg-white">
          <div className="flex items-center gap-[0.5vw]">
             <span className="text-[0.75vw] font-bold text-gray-700 uppercase">Fill Color</span>
          </div>

          <div className="flex items-center gap-[0.5vw]">
            <button 
              onClick={() => updateIconFill('none')}
              className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
              title="Reset Color"
            >
              <RotateCcw size="1vw" />
            </button>
            <button 
              onClick={() => {
                setShowFillPicker(false);
                setShowDetailedControls(false);
              }}
              className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
            >
              <X size="1.1vw" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <div className="flex flex-col h-full">
            {/* Popover for Customize Colors */}
            {showDetailedControls && createPortal(
              <>
                <div 
                  className="fixed inset-0 z-[10001] bg-transparent" 
                  onClick={() => setShowDetailedControls(false)}
                ></div>
                <ColorPicker 
                  className="fixed z-[10002] w-[18vw] color-picker-container"
                  style={{ 
                    top: '50%',
                    right: '6.5vw', 
                    transform: 'translateY(-50%)'
                  }}
                  color={iconFill === 'none' ? '#000000' : iconFill}
                  onChange={(color) => updateIconFill(color)}
                  opacity={opacity}
                  onOpacityChange={updateOpacity}
                  onClose={() => setShowDetailedControls(false)}
                />
              </>,
              document.body
            )}

            <div className="p-[1vw] space-y-[1.5vw]">
              {/* Colors on this page */}
              <div className="space-y-[0.75vw]">
                <div className="flex items-center gap-[0.75vw]">
                  <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Colors on this page</span>
                  <div className="h-[1px] flex-grow bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-6 gap-[0.5vw]">
                  {colorsOnPage.map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c }}
                      onClick={() => updateIconFill(c)}
                      className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Solid Colors */}
              <div className="space-y-[0.75vw]">
                <div className="flex items-center gap-[0.75vw]">
                  <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Solid Colors</span>
                  <div className="h-[1px] flex-grow bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-6 gap-[0.5vw]">
                  <div 
                    onClick={() => updateIconFill('none')}
                    className="w-full aspect-square rounded-[0.5vw] border border-gray-200 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95 relative bg-white overflow-hidden"
                    title="None"
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                  </div>
                  {[
                    '#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00',
                    '#ADFF2F', '#228B22', '#008080', '#40E0D0', '#00CED1', '#008B8B',
                    '#ADD8E6', '#87CEEB', '#0000FF', '#000080', '#E6E6FA', '#FF00FF',
                    '#A9A9A9', '#D3D3D3', '#F5F5F5', '#333333'
                  ].map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        updateIconFill(c);
                        updateOpacity(100);
                      }}
                      className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Toggle */}
            <div className="mt-auto p-[0.75vw] border-t border-gray-100">
              <button
                onClick={() => setShowDetailedControls(!showDetailedControls)}
                className="flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] hover:bg-gray-50 transition-all rounded-[0.75vw] w-full group"
              >
                <div className="w-[2vw] h-[2vw] rounded-full shadow-md group-hover:scale-110 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                <span className="text-[0.85vw] font-bold text-gray-600">Customize Colors</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconEditor;