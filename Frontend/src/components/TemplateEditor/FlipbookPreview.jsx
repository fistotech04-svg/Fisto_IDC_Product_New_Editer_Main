import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PreviewArea from '../CustomizedEditor/PreviewArea';
import { LAYOUT_DEFAULT_COLORS } from '../CustomizedEditor/Layout';
import { Icon } from '@iconify/react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getFromDB } from '../../utils/dbUtils';

const AttachedCurve = ({ position }) => {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');
  
  const containerStyle = {
    position: 'absolute',
    width: '1vw',
    height: '1.5vw',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 1998,
    ...(isTop ? { top: '-0.8vw' } : { bottom: '-0.8vw' }),
    ...(isLeft ? { left: '0' } : { right: '0' }),
  };

  const circleStyle = {
    position: 'absolute',
    width: '1.5vw',
    height: '1.6vw',
    borderRadius: '60%',
    boxShadow: '0 0 0 2vw black',
    ...(isTop ? { top: '-0.8vw' } : { bottom: '-0.8vw' }),
    ...(isLeft ? { right: '-0.8vw' } : { left: '-0.8vw' }),
  };

  return (
    <div style={containerStyle}>
      <div style={circleStyle} />
    </div>
  );
};

const FlipbookPreview = ({ pages, pageName, bookName, onClose, isMobile: isMobileProp, isDoublePage, settings, targetPage, v_id: propVId }) => {
  const params = useParams();
  const v_id = propVId || params.v_id;
  const [localSettings, setLocalSettings] = useState(settings || {});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        let finalSettings = { ...(settings || {}) };

        // Try getting local unsaved state from DB just like CustomizedEditor does
        try {
          const appearance = await getFromDB(`customized_editor_appearance_${v_id || 'default'}`);
          if (appearance) {
            finalSettings.background = appearance.background;
            finalSettings.appearance = appearance.appearance;
            finalSettings.layout = appearance.layout;
            finalSettings.layoutColors = appearance.layoutColors;
          }
          const branding = await getFromDB(`customized_editor_branding_${v_id || 'default'}`);
          if (branding) {
            finalSettings.logo = branding.logo;
            finalSettings.profile = branding.profile;
          }
          const setup = await getFromDB(`customized_editor_setup_${v_id || 'default'}`);
          if (setup) {
            finalSettings.menubar = setup.menuBar;
            finalSettings.othersetup = setup.otherSetup;
            finalSettings.leadform = setup.leadForm;
            finalSettings.visibility = setup.visibility;
          }
        } catch (e) {
          console.error("Failed to load local DB settings", e);
        }

        // If we didn't get them from local DB, fallback to backend if v_id exists
        if (!finalSettings.appearance && v_id) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            
            const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
              params: { emailId: user.emailId, v_id, metadataOnly: true }
            });

            if (res.data && res.data.settings) {
              finalSettings = { ...finalSettings, ...res.data.settings };
            }
          }
        }

        if (Object.keys(finalSettings).length > 0) {
          setLocalSettings(finalSettings);
        }
      } catch (err) {
        console.error('Failed to fetch settings for preview', err);
      }
    };

    fetchSettings();
  }, [settings, v_id]);

  const [activeDevice, setActiveDevice] = useState(localStorage.getItem('previewDevice') || (isMobileProp ? 'Mobile' : 'Desktop'));

  useEffect(() => {
    const handleGlobalDeviceChange = (e) => {
      setActiveDevice(e.detail);
    };
    window.addEventListener('previewDeviceChange', handleGlobalDeviceChange);
    return () => window.removeEventListener('previewDeviceChange', handleGlobalDeviceChange);
  }, []);

  const handleDeviceChange = (device) => {
    setActiveDevice(device);
    localStorage.setItem('previewDevice', device);
    window.dispatchEvent(new CustomEvent('previewDeviceChange', { detail: device }));
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();

  const [isDraggerExpanded, setIsDraggerExpanded] = useState(false);
  const [draggerTabTop, setDraggerTabTop] = useState(150);
  const [draggerTabLeft, setDraggerTabLeft] = useState(-1);
  const [isDraggerDragging, setIsDraggerDragging] = useState(false);
  const draggerHasMovedRef = useRef(false);
  const draggerOffsetRef = useRef({ x: 0, y: 0 });

  // Initialize position relative to container once available
  useEffect(() => {
    if (containerRef.current && draggerTabLeft === -1) {
      const rect = containerRef.current.getBoundingClientRect();
      const draggerWidth = (window.innerWidth * 3.2) / 100;
      setDraggerTabLeft(rect.width - draggerWidth);
    }
  }, [draggerTabLeft]);

  const handleDraggerMouseDown = (e) => {
    setIsDraggerDragging(true);
    draggerHasMovedRef.current = false;
    draggerOffsetRef.current = {
      x: e.clientX - draggerTabLeft,
      y: e.clientY - draggerTabTop
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggerDragging || !containerRef.current) return;
      draggerHasMovedRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const newTop = e.clientY - rect.top - draggerOffsetRef.current.y;
      const newLeft = e.clientX - rect.left - draggerOffsetRef.current.x;
      const draggerWidth = (window.innerWidth * 3.2) / 100;
      const draggerHeight = isDraggerExpanded ? (window.innerWidth * 14) / 100 : draggerWidth;
      setDraggerTabTop(Math.max(0, Math.min(newTop, rect.height - draggerHeight)));
      setDraggerTabLeft(Math.max(0, Math.min(newLeft, rect.width - draggerWidth)));
    };

    const handleMouseUp = () => {
      if (isDraggerDragging && containerRef.current) {
        setIsDraggerDragging(false);
        if (!draggerHasMovedRef.current) {
          setIsDraggerExpanded(prev => !prev);
        } else {
          const rect = containerRef.current.getBoundingClientRect();
          const draggerWidth = (window.innerWidth * 3.2) / 100;
          const midpoint = rect.width / 2;
          if (draggerTabLeft + draggerWidth / 2 < midpoint) {
            setDraggerTabLeft(0);
          } else {
            setDraggerTabLeft(rect.width - draggerWidth);
          }
        }
      }
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDraggerTabLeft(prev => {
        const draggerWidth = (window.innerWidth * 3.2) / 100;
        if (prev > rect.width / 2) return rect.width - draggerWidth;
        return 0;
      });
    };

    if (isDraggerDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDraggerDragging, isDraggerExpanded, draggerTabLeft]);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);



  // Build CSS variables for active layout colors to match CustomizedEditor exactly
  const layoutColorVars = React.useMemo(() => {
    const activeIdx = localSettings?.layout || 1;
    const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || [];
    const saved = localSettings?.layoutColors?.[activeIdx] || [];

    const mergedColors = defaults.map((c) => {
      const savedItem = saved.find(s => s && s.id === c.id);
      return {
        ...c,
        ...(savedItem ? savedItem : {})
      };
    });

    const vars = mergedColors.map((c, i) => {
      const hex = c.hex || '#ffffff';
      const op = (c.opacity ?? 100) / 100;
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;

      const varName = c.id || `layout-color-${i}`;
      return `--${varName}: ${hex}; --${varName}-opacity: ${op}; --${varName}-rgb: ${r},${g},${b};`;
    }).join(' ');

    const hasExplicitIcon = mergedColors.some(c => c.id === 'dropdown-icon');
    const textColor = mergedColors.find(c => c.id === 'dropdown-text');
    if (!hasExplicitIcon && textColor) {
      const hex = textColor.hex || '#ffffff';
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      return vars + ` --dropdown-icon: ${hex}; --dropdown-icon-opacity: 0.7; --dropdown-icon-rgb: ${r},${g},${b};`;
    }

    return vars;
  }, [localSettings?.layout, localSettings?.layoutColors]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[1000] flex flex-col overflow-hidden select-none"
      style={{ 
        backgroundColor: '#ffffff',
        ...(layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(Boolean).map(v => v.split(':').map(s => s.trim()))) : {}) 
      }}
    >
      <style>{`:root { ${layoutColorVars} }`}</style>
      {/* Draggable Device Settings - Desktop only: inside screen */}
      {(() => {
        if (!onClose || activeDevice !== 'Desktop') return null;
        const settingsContent = (
          <>
            {/* Persistent vertical line on the stuck edge */}
            {!isDraggerDragging && containerRef.current && (
              <div
                className="absolute top-0 w-[0.25vw] h-full bg-black z-[1999] pointer-events-none transition-all duration-300"
                style={{
                  left: draggerTabLeft < 5 ? '0' : 'auto',
                  right: draggerTabLeft > (containerRef.current.offsetWidth - (window.innerWidth * 3.2) / 100 - 5) ? '0' : 'auto',
                  opacity: (draggerTabLeft < 5 || draggerTabLeft > (containerRef.current.offsetWidth - (window.innerWidth * 3.2) / 100 - 5)) ? 1 : 0
                }}
              />
            )}

            <div
              className="absolute z-[2000] pointer-events-auto"
              style={{
                top: `${draggerTabTop}px`,
                left: isDraggerDragging ? `${draggerTabLeft}px` : (draggerTabLeft < 5 ? '0' : 'auto'),
                right: isDraggerDragging ? 'auto' : (draggerTabLeft < 5 ? 'auto' : '0')
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!isDraggerDragging && draggerTabLeft < 10 && (
                <>
                  <AttachedCurve position="top-left" />
                  <AttachedCurve position="bottom-left" />
                </>
              )}
              {!isDraggerDragging && draggerTabLeft >= 10 && (
                <>
                  <AttachedCurve position="top-right" />
                  <AttachedCurve position="bottom-right" />
                </>
              )}
              <div
                className={`bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col items-center justify-between transition-all duration-300 py-[0.5vw] overflow-hidden ${isDraggerDragging ? 'rounded-[0.8vw]' : (draggerTabLeft < 10 ? 'rounded-r-[0.8vw] rounded-l-none' : 'rounded-l-[0.8vw] rounded-r-none')}`}
                style={{ width: '4vw', height: isDraggerExpanded ? '10.5vw' : '5.5vw' }}
              >
                <div
                  className="w-full flex justify-center cursor-grab active:cursor-grabbing"
                  onMouseDown={handleDraggerMouseDown}
                >
                  <div className="flex items-start">
                    <div className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${isDraggerExpanded ? 'bg-[#2A2A2A] rounded-[0.4vw] py-[0.5vw] h-[7vw] w-[2.3vw]' : 'bg-transparent h-[1.8vw]'} w-[1.8vw]`}>
                      {!isDraggerExpanded ? (
                        <div className="w-full h-[1.5vw] flex items-center justify-center flex-shrink-0">
                          <Icon icon={activeDevice === 'Desktop' ? 'mynaui:desktop' : activeDevice === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className="w-[1.8vw] h-[1.8vw] text-white" />
                        </div>
                      ) : (
                        <div className="flex flex-col w-full h-full justify-between items-center">
                          {['Desktop', 'Tablet', 'Mobile'].map((device) => (
                            <div
                              key={device}
                              className="w-full flex items-center justify-center cursor-pointer py-[0.2vw]"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeviceChange(device);
                                setIsDraggerExpanded(false);
                              }}
                            >
                              <Icon icon={device === 'Desktop' ? 'mynaui:desktop' : device === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className={`w-[1.5vw] h-[1.5vw] ${activeDevice === device ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-[0.01vw] mt-[0.2vw]">
                      <Icon icon="lucide:chevron-down" className={`w-[0.9vw] h-[0.9vw] text-white transition-transform duration-300 ${isDraggerExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                <button
                  className="mt-auto mr-[0.9vw] flex items-start justify-start text-[#ff3333]"
                  title="Exit Preview"
                  onClick={onClose}
                >
                  <Icon
                    icon="famicons:exit-outline"
                    className={`w-[1.7vw] h-[1.7vw] transition-transform duration-300 ${draggerTabLeft < 10 ? 'rotate-0' : 'rotate-180'}`}
                  />
                </button>
              </div>
            </div>
          </>
        );
        if (isFullscreen && document.fullscreenElement) {
          return createPortal(settingsContent, document.fullscreenElement);
        }
        return settingsContent;
      })()}

      <PreviewArea 
        bookName={pageName || bookName} 
        pages={pages}
        targetPage={targetPage}
        logoSettings={localSettings?.logo}
        backgroundSettings={localSettings?.background}
        bookAppearanceSettings={localSettings?.appearance}
        menuBarSettings={localSettings?.menubar}
        leadFormSettings={localSettings?.leadform}
        profileSettings={localSettings?.profile}
        otherSetupSettings={localSettings?.othersetup}
        activeLayout={localSettings?.layout || 1}
        layoutColors={localSettings?.layoutColors}
        hideHeader={false}
        onClose={onClose}
        activeDevice={activeDevice}
        isDoublePage={isDoublePage}
        useNativeFullscreen={true}
        disableAutoGallery={true}
      />

      {/* Draggable Device Settings - Tablet/Mobile: outside device frame */}
      {(() => {
        if (!onClose || (activeDevice !== 'Tablet' && activeDevice !== 'Mobile')) return null;
        const settingsContent = (
          <>
            {!isDraggerDragging && containerRef.current && (
              <div
                className="absolute top-0 w-[0.25vw] h-full bg-black z-[1999] pointer-events-none transition-all duration-300"
                style={{
                  left: draggerTabLeft < 5 ? '0' : 'auto',
                  right: draggerTabLeft > (containerRef.current.offsetWidth - (window.innerWidth * 3.2) / 100 - 5) ? '0' : 'auto',
                  opacity: (draggerTabLeft < 5 || draggerTabLeft > (containerRef.current.offsetWidth - (window.innerWidth * 3.2) / 100 - 5)) ? 1 : 0
                }}
              />
            )}

            <div
              className="absolute z-[2000] pointer-events-auto"
              style={{
                top: `${draggerTabTop}px`,
                left: isDraggerDragging ? `${draggerTabLeft}px` : (draggerTabLeft < 5 ? '0' : 'auto'),
                right: isDraggerDragging ? 'auto' : (draggerTabLeft < 5 ? 'auto' : '0')
              }}
              onMouseDown={handleDraggerMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              {!isDraggerDragging && draggerTabLeft < 10 && (
                <>
                  <AttachedCurve position="top-left" />
                  <AttachedCurve position="bottom-left" />
                </>
              )}
              {!isDraggerDragging && draggerTabLeft >= 10 && (
                <>
                  <AttachedCurve position="top-right" />
                  <AttachedCurve position="bottom-right" />
                </>
              )}
              <div
                className={`bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col items-center justify-between transition-all duration-300 py-[0.5vw] overflow-hidden ${isDraggerDragging ? 'rounded-[0.8vw]' : (draggerTabLeft < 10 ? 'rounded-r-[0.8vw] rounded-l-none' : 'rounded-l-[0.8vw] rounded-r-none')}`}
                style={{ width: '4vw', height: isDraggerExpanded ? '10.5vw' : '5.5vw' }}
              >
                <div
                  className="w-full flex justify-center cursor-grab active:cursor-grabbing"
                  onMouseDown={handleDraggerMouseDown}
                >
                  <div className="flex items-start">
                    <div className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${isDraggerExpanded ? 'bg-[#2A2A2A] rounded-[0.4vw] py-[0.5vw] h-[7vw] w-[2.3vw]' : 'bg-transparent h-[1.8vw]'} w-[1.8vw]`}>
                      {!isDraggerExpanded ? (
                        <div className="w-full h-[1.5vw] flex items-center justify-center flex-shrink-0">
                          <Icon icon={activeDevice === 'Desktop' ? 'mynaui:desktop' : activeDevice === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className="w-[1.8vw] h-[1.8vw] text-white" />
                        </div>
                      ) : (
                        <div className="flex flex-col w-full h-full justify-between items-center">
                          {['Desktop', 'Tablet', 'Mobile'].map((device) => (
                            <div
                              key={device}
                              className="w-full flex items-center justify-center cursor-pointer py-[0.2vw]"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeviceChange(device);
                                setIsDraggerExpanded(false);
                              }}
                            >
                              <Icon icon={device === 'Desktop' ? 'mynaui:desktop' : device === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className={`w-[1.5vw] h-[1.5vw] ${activeDevice === device ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-[0.01vw] mt-[0.2vw]">
                      <Icon icon="lucide:chevron-down" className={`w-[0.9vw] h-[0.9vw] text-white transition-transform duration-300 ${isDraggerExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                <button
                  className="mt-auto mr-[0.9vw] flex items-start justify-start text-[#ff3333]"
                  title="Exit Preview"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                  <Icon
                    icon="famicons:exit-outline"
                    className={`w-[1.7vw] h-[1.7vw] transition-transform duration-300 ${draggerTabLeft < 10 ? 'rotate-0' : 'rotate-180'}`}
                  />
                </button>
              </div>
            </div>
          </>
        );
        if (isFullscreen && document.fullscreenElement) {
          return createPortal(settingsContent, document.fullscreenElement);
        }
        return settingsContent;
      })()}
    </div>
  );
};

export default FlipbookPreview;
