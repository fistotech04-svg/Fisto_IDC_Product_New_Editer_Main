import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LAYOUT_DEFAULT_COLORS } from './Layout';
import { useParams, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import PreviewArea from './PreviewArea';
import Branding from './Branding';
import Appearance from './Appearance';
import MenuBar from './MenuBar';
import OtherSetup from './OtherSetup';
import LeadForm from './LeadForm';
import Visibility from './Visibility';
import Statistic from './Statistic';
import FlipbookPreview from '../TemplateEditor/FlipbookPreview.jsx';
import { getFromDB, saveToDB } from '../../utils/dbUtils';
import { getDominantColors, REACT_BITS_THEMES_COLORS } from '../../utils/colorExtractor';

// Helper functions for color synchronization (matching Layout.jsx logic)
const getTint = (hex, weight = 0.8) => {
  let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r + (255 - r) * weight); g = Math.round(g + (255 - g) * weight); b = Math.round(b + (255 - b) * weight);
  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const getShade = (hex, weight = 0.6) => {
  if (!hex || hex === 'transparent') return hex;
  let c = hex.substring(1).toUpperCase();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return hex;
  let r = parseInt(c.slice(0, 2), 16); let g = parseInt(c.slice(2, 4), 16); let b = parseInt(c.slice(4, 6), 16);
  r = Math.round(r * (1 - weight)); g = Math.round(g * (1 - weight)); b = Math.round(b * (1 - weight));
  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const isLightColor = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  let c = hex.substring(1).toUpperCase();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
};

const ensureDarkText = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  let c = hex.substring(1).toUpperCase();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return hex;
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.45) return getShade(hex, 0.5);
  return hex;
};
// Navbar removed

const CustomizedEditor = () => {
  const { folder, v_id } = useParams();
  const { setExportHandler, setSaveHandler, setPreviewHandler, setHasUnsavedChanges, triggerSaveSuccess, isAutoSaveEnabled, currentBook, setCurrentBook, activeDevice, setActiveDevice } = useOutletContext() || {};
  const [bookName, setBookName] = useState(() => currentBook?.flipbookName || 'Name of the Book');
  const [activeSubView, setActiveSubView] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [pages, setPages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [targetPage, setTargetPage] = useState(0);

  // Reset collapsed state whenever a new sub-view is selected
  useEffect(() => {
    setIsPanelCollapsed(false);
  }, [activeSubView]);

  // Sync with global flipbook name from context (Template Editor sync)
  useEffect(() => {
    if (currentBook?.flipbookName && currentBook.flipbookName !== bookName) {
      setBookName(currentBook.flipbookName || 'Name of the Book');
    }
  }, [currentBook?.flipbookName]);

  // Navbar States handled by context
  const [saveSuccessInfo, setSaveSuccessInfo] = useState(null);

  // Customization States
  const [logoSettings, setLogoSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.logo) return parsed.logo;
      } catch (e) {
        console.error("Failed to parse logo settings from local storage", e);
      }
    }
    return {
      src: '',
      url: '',
      type: 'Fit',
      opacity: 100,
      adjustments: {
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0
      }
    };
  });

  const [profileSettings, setProfileSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.profile) return parsed.profile;
      } catch (e) {
        console.error("Failed to parse profile settings from local storage", e);
      }
    }
    return {
      name: '',
      about: '',
      contacts: [
        { id: '1', type: 'email', value: '' },
        { id: '2', type: 'phone', value: '' }
      ]
    };
  });

  const [backgroundSettings, setBackgroundSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_appearance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.background) return parsed.background;
      } catch (e) {
        console.error("Failed to parse background settings from local storage", e);
      }
    }
    return {
      color: '#DADBE8',
      style: 'Solid', // Solid, Gradient, Image, ReactBits
      gradient: 'linear-gradient(to bottom, #b363f1ff, #a855f7)',
      image: '',
      fit: 'Cover',
      opacity: 100,
      animation: 'None',
      reactBitType: null
    };
  });

  const [bookAppearanceSettings, setBookAppearanceSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_appearance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.appearance) return parsed.appearance;
      } catch (e) {
        console.error("Failed to parse appearance settings from local storage", e);
      }
    }
    return {
      texture: 'Plain White',
      hardCover: false,
      grainIntensity: 20,
      warmth: 0,
      textureScale: 0,
      opacity: 100,
      flipStyle: 'Classic Flip',
      flipSpeed: 'medium',
      corner: 'Sharp',
      dropShadow: {
        active: true,
        color: '#4f4f4fff',
        opacity: 50,
        xAxis: 0,
        yAxis: 0,
        blur: 0,
        spread: 0
      },
      instructions: 'first'
    };
  });

  const [layoutSettings, setLayoutSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_appearance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.layout) return parsed.layout;
      } catch (e) {
        console.error("Failed to parse layout settings from local storage", e);
      }
    }
    return 1;
  });

  const [layoutColors, setLayoutColors] = useState(() => {
    const saved = localStorage.getItem('customized_editor_appearance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.layoutColors) return parsed.layoutColors;
      } catch (e) { }
    }
    return {};
  });

  // Track background changes to trigger color extraction
  const prevBackgroundRef = useRef({
    style: backgroundSettings.style,
    image: backgroundSettings.image,
    reactBitType: backgroundSettings.reactBitType
  });

  useEffect(() => {
    const { style, image, reactBitType } = backgroundSettings;
    const prev = prevBackgroundRef.current;

    // Only trigger if the background source actually changed
    const sourceChanged = (style !== prev.style) || (image !== prev.image) || (reactBitType !== prev.reactBitType);

    if (sourceChanged) {
      prevBackgroundRef.current = { style, image, reactBitType };

      const applyExtractedColors = async () => {
        let extracted = null;
        if (style === 'ReactBits' && reactBitType) {
          extracted = REACT_BITS_THEMES_COLORS[reactBitType];
        } else if (style === 'Image' && image) {
          extracted = await getDominantColors(image, false);
        } else if (style === 'Video' && image) {
          extracted = await getDominantColors(image, true);
        }

        if (extracted) {
          const { dark, light } = extracted;
          
          setLayoutColors(prevColors => {
            const updated = { ...prevColors };
            
            // Apply to all 9 layouts
            for (let i = 1; i <= 9; i++) {
              const defaults = LAYOUT_DEFAULT_COLORS[i] || [];
              const current = updated[i] || [];
              
              // Ensure we have a complete list of colors based on defaults
              let layoutColorsList = defaults.map(d => {
                const s = current.find(c => c.id === d.id);
                return s ? { ...s } : { ...d };
              });

              const primaryIds = ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg', 'toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
              const secondaryIds = ['toolbar-text-main', 'toolbar-icon', 'toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon', 'page-number-text'];
              const shadeIds = ['search-bg-v1', 'search-bg-v2', 'reset-bg'];

              layoutColorsList = layoutColorsList.map(c => {
                if (primaryIds.includes(c.id)) return { ...c, hex: dark };
                if (secondaryIds.includes(c.id)) {
                  let targetHex = light;
                  let targetOpacity = c.opacity;
                  // Handle specific icons/text based on background brightness if needed
                  // For now keep it simple: Color 2 is light
                  return { ...c, hex: targetHex, opacity: targetOpacity };
                }
                if (shadeIds.includes(c.id)) return { ...c, hex: getTint(dark, 0.75) };
                
                // For search text, we might need contrast
                if (c.id === 'search-text-v1') {
                    const isLightBar = isLightColor(dark);
                    return { ...c, hex: ensureDarkText(isLightBar ? light : dark), opacity: 100 };
                }

                return c;
              });

              updated[i] = layoutColorsList;
            }
            return updated;
          });
        }
      };

      applyExtractedColors();
    }
  }, [backgroundSettings.style, backgroundSettings.image, backgroundSettings.reactBitType]);

  const [menuBarSettings, setMenuBarSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_setup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.menuBar) return parsed.menuBar;
      } catch (e) {
        console.error("Failed to parse menu bar settings from local storage", e);
      }
    }
    return {
      navigation: {
        nextPrevButtons: true,
        mouseWheel: true,
        dragToTurn: false,
        pageQuickAccess: true,
        tableOfContents: true,
        pageThumbnails: true,
        bookmark: true,
        bookmarkSettings: {
          icon: 'default',
          font: 'Arial'
        },
        startEndNav: false,
      },
      viewing: {
        zoom: true,
        fullScreen: true,
      },
      interaction: {
        search: true,
        notes: true,
        gallery: true,
      },
      media: {
        autoFlip: true,
        autoFlipSettings: {
          duration: 8,
          forwardBackwardButtons: true,
          countdown: true
        },
        backgroundAudio: true,
      },
      shareExport: {
        share: true,
        download: true,
        contact: true,
      },
      brandingProfile: {
        logo: true,
        profile: true,
      },
      tocSettings: {
        addSearch: true,
        addPageNumber: true,
        addSerialNumberHeading: true,
        addSerialNumberSubheading: true,
        content: [
          { id: 1, title: 'Heading 1', page: 1, subheadings: [{ id: 1, title: 'Subheading 1', page: 1 }] }
        ]
      }
    };
  });

  const [otherSetupSettings, setOtherSetupSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_setup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.otherSetup) {
          // Migration: remove old hardcoded Unsplash placeholder images
          const UNSPLASH_DEFAULTS = [
            'photo-1581450234418-ad4c9954d68b',
            'photo-1486406146926-c627a92ad1ab',
            'photo-1497215728101-856f4ea42174',
            'photo-1497366216548-37526070297c',
          ];
          if (parsed.otherSetup.gallery?.images) {
            parsed.otherSetup.gallery.images = parsed.otherSetup.gallery.images.filter(
              img => !UNSPLASH_DEFAULTS.some(id => img.url?.includes(id))
            );
          }
          return parsed.otherSetup;
        }
      } catch (e) {
        console.error("Failed to parse other setup settings from local storage", e);
      }
    }
    return {
      toolbar: {
        displayMode: 'icon',
        addTextBelowIcons: false,
        addSearchOnTop: true,
        textProperties: { font: 'Arial', fill: '#ffffffff', stroke: '#' },
        toolbarColor: { fill: '#3E4491', stroke: '#' },
        iconsColor: { fill: '#ffffff', stroke: '#' },
        processBar: { fill: '#ffffffff', stroke: '#' },
        autoFlipEnabled: false,
        autoFlipDuration: 2,
        addForwardFlipCountdownLine: true,
        nextFlipCountdown: true,
        maximumZoom: 1,
        twoClickToZoom: true,
      },

      sound: {
        flipSound: 'Soft Paper Flip',
        flipSoundEnabled: true,
        pageSpecificSound: false,
        bgSound: 'BG Sound 1',
        customBgSounds: [], // To store list of uploaded background sounds
        bgSoundFile: null
      },
      gallery: {
        autoPlay: true,
        speed: 2,
        infiniteLoop: true,
        showDots: true,
        dotColor: '#4F46E5',
        imageFitType: 'Fill All',
        transitionEffect: 'Linear',
        dragToSlide: false,
        images: [],
      },
    };
  });

  const [leadFormSettings, setLeadFormSettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_setup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.leadForm) return parsed.leadForm;
      } catch (e) {
        console.error("Failed to parse lead form settings from local storage", e);
      }
    }
    return {
      enabled: true,
      leadText: 'Share your Information to get personalized updates.',
      fields: {
        name: true,
        phone: false,
        email: true,
        feedback: true
      },
      appearance: {
        timing: 'after-pages', // before, after-pages, end
        afterPages: 4,
        allowSkip: true,
        fontStyle: 'Arial',
        textFill: '#3E4491',
        textStroke: '',
        bgFill: '#ffffffff',
        bgStroke: '',
        btnFill: '#3E4491',
        btnStroke: '',
        btnText: 'white'
      }
    };
  });

  const [visibilitySettings, setVisibilitySettings] = useState(() => {
    const saved = localStorage.getItem('customized_editor_setup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.visibility) return parsed.visibility;
      } catch (e) {
        console.error("Failed to parse visibility settings from local storage", e);
      }
    }
    return {
      type: 'Public', // Public, Private, Password Protect, Invite only Access
      password: '',
      inviteOnly: {
        allowReAccess: true,
        notifyOnView: true,
        autoExpire: {
          enabled: true,
          duration: '5 Days'
        },
        emails: [
          { email: 'naveen1234@gmail.com', status: 'valid' }
        ],
        domains: [
          { domain: 'fist-o.com', status: 'valid' }
        ]
      }
    };
  });

  // Save Appearance Logic
  useEffect(() => {
    const settings = {
      background: backgroundSettings,
      appearance: bookAppearanceSettings,
      layout: layoutSettings,
      layoutColors: layoutColors
    };
    localStorage.setItem('customized_editor_appearance', JSON.stringify(settings));
    saveToDB('customized_editor_appearance', settings);
  }, [backgroundSettings, bookAppearanceSettings, layoutSettings, layoutColors]);

  // Save Setup Logic
  useEffect(() => {
    const settings = {
      menuBar: menuBarSettings,
      otherSetup: otherSetupSettings,
      visibility: visibilitySettings,
      leadForm: leadFormSettings
    };
    localStorage.setItem('customized_editor_setup', JSON.stringify(settings));
    saveToDB('customized_editor_setup', settings);
  }, [menuBarSettings, otherSetupSettings, visibilitySettings, leadFormSettings]);

  // Save Branding Logic
  useEffect(() => {
    const settings = {
      logo: logoSettings,
      profile: profileSettings
    };
    localStorage.setItem('customized_editor_branding', JSON.stringify(settings));
    saveToDB('customized_editor_branding', settings);
  }, [logoSettings, profileSettings]);

  // Logic for saving and exporting
  const handleExport = useCallback(() => {
    console.log("Exporting...");
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const payload = {
        emailId: user.emailId,
        folderName: folder,
        bookName: v_id,
        newName: bookName,
        settings: {
          logo: logoSettings,
          profile: profileSettings,
          background: backgroundSettings,
          appearance: bookAppearanceSettings,
          layout: layoutSettings,
          menubar: menuBarSettings,
          othersetup: otherSetupSettings,
          leadform: leadFormSettings,
          visibility: visibilitySettings
        }
      };

      await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);

      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
        notifiedUnsavedRef.current = false; // Reset the notification flag after save
      }
      if (triggerSaveSuccess) triggerSaveSuccess({ name: bookName, folder: 'Customized' });
      setSaveSuccessInfo({ name: bookName, folder: 'Customized' });
      setTimeout(() => setSaveSuccessInfo(null), 3000);
    } catch (error) {
      console.error("Save failed", error);
    }
  }, [folder, v_id, bookName, logoSettings, profileSettings, backgroundSettings, bookAppearanceSettings, layoutSettings, menuBarSettings, otherSetupSettings, leadFormSettings, visibilitySettings, setHasUnsavedChanges, triggerSaveSuccess]);

  // Use refs to keep context handlers up-to-date without triggering useEffect re-registrations
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const handleExportRef = useRef(handleExport);
  handleExportRef.current = handleExport;

  // Stable wrappers that call the latest version of the handlers
  const stableSaveHandler = useCallback((...args) => handleSaveRef.current?.(...args), []);
  const stableExportHandler = useCallback((...args) => handleExportRef.current?.(...args), []);
  const stablePreviewHandler = useCallback(() => setShowPreview(true), []);

  // Export/Save Handlers for Context (Registration)
  useEffect(() => {
    if (setExportHandler) setExportHandler(() => stableExportHandler);
    if (setSaveHandler) setSaveHandler(() => stableSaveHandler);
    if (setPreviewHandler) setPreviewHandler(() => stablePreviewHandler);
    
    return () => {
      if (setExportHandler) setExportHandler(null);
      if (setSaveHandler) setSaveHandler(null);
      if (setPreviewHandler) setPreviewHandler(null);
    };
  }, [setExportHandler, setSaveHandler, setPreviewHandler, stableSaveHandler, stableExportHandler, stablePreviewHandler]);

  // Sync Current Book to Navbar
  useEffect(() => {
    if (setCurrentBook) {
      // Use flipbookName to match TemplateEditor's expected key
      // Merge with previous state to avoid losing other metadata
      setCurrentBook(prev => ({ 
        ...(prev || {}),
        folder: folder, 
        flipbookName: bookName,
        v_id: v_id 
      }));
    }
  }, [setCurrentBook, folder, v_id, bookName]);

  const initialLoadRef = useRef(true);
  const notifiedUnsavedRef = useRef(false);

  // Track changes for unsaved status
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    if (setHasUnsavedChanges && !notifiedUnsavedRef.current) {
      setHasUnsavedChanges(true);
      notifiedUnsavedRef.current = true;
    }
  }, [
    bookName, logoSettings, profileSettings, backgroundSettings, 
    bookAppearanceSettings, layoutSettings, menuBarSettings, 
    otherSetupSettings, leadFormSettings, visibilitySettings, 
    setHasUnsavedChanges
  ]);

  const [isLoading, setIsLoading] = useState(true);

  // Initial load management
  useEffect(() => {
    // Only release the initial load lock AFTER loading has fully completed
    if (!isLoading && initialLoadRef.current) {
      // Small timeout to allow React to batch and apply all the fetched state updates
      const timer = setTimeout(() => {
        initialLoadRef.current = false;
        if (setHasUnsavedChanges) setHasUnsavedChanges(false);
        notifiedUnsavedRef.current = false;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, setHasUnsavedChanges]);

  // Load Flipbook Data
  useEffect(() => {
    const fetchBook = async () => {
      // Check for recent autosave first (sync from TemplateEditor)
      const autosave = await getFromDB('editor_autosave');
      if (autosave) {
        console.log('CustomizedEditor: Loading from autosave');
        try {
          const data = autosave;
          if (data.pages && Array.isArray(data.pages)) {
            setPages(data.pages.map((p, i) => ({
              id: p.id || i,
              name: p.name || `Page ${i + 1}`,
              html: p.html || p.content || '',
              content: p.html || p.content || ''
            })));
            if (data.pageName && !currentBook?.flipbookName) setBookName(data.pageName);
            // Always start from the first page on initial load
            setTargetPage(0);
          }
        } catch (e) {
          console.error("CustomizedEditor: Failed to load autosave", e);
        }
      }

      // Check for synced settings from TemplateEditor or other sessions
      const appearance = await getFromDB('customized_editor_appearance');
      if (appearance) {
        if (appearance.background) setBackgroundSettings(appearance.background);
        if (appearance.appearance) setBookAppearanceSettings(appearance.appearance);
        if (appearance.layout) setLayoutSettings(appearance.layout);
        if (appearance.layoutColors) setLayoutColors(appearance.layoutColors);
      }

      const branding = await getFromDB('customized_editor_branding');
      if (branding) {
        if (branding.logo) setLogoSettings(branding.logo);
        if (branding.profile) setProfileSettings(branding.profile);
      }

      const setup = await getFromDB('customized_editor_setup');
      if (setup) {
        if (setup.menuBar) setMenuBarSettings(setup.menuBar);
        if (setup.otherSetup) setOtherSetupSettings(setup.otherSetup);
        if (setup.leadForm) setLeadFormSettings(setup.leadForm);
        if (setup.visibility) setVisibilitySettings(setup.visibility);
      }

      if (v_id && folder) {
        console.log('CustomizedEditor: Fetching flipbook with folder:', folder, 'v_id:', v_id);
        try {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return;
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          
          const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
            params: { emailId: user.emailId, v_id },
            timeout: 2000
          });

          if (res.data) {
            // ONLY overwrite pages if we DON'T have an autosave
            if (!autosave) {
              // Only set book name from backend if session doesn't have an unsaved change
              if (!currentBook?.flipbookName) setBookName(res.data.name || 'Name of the Book');
              if (res.data.pages) {
                setPages(res.data.pages.map((p, i) => {
                  const rawHTML = p.html || p.content || '';
                  return {
                    id: p.id || i,
                    content: rawHTML,
                    name: p.name || `Page ${i + 1}`,
                    html: rawHTML
                  };
                }));
              }
            }
            
            // ALWAYS load settings from backend
            if (res.data.settings) {
              if (res.data.settings.logo) setLogoSettings(res.data.settings.logo);
              if (res.data.settings.profile) setProfileSettings(res.data.settings.profile);
              if (res.data.settings.background) setBackgroundSettings(res.data.settings.background);
              if (res.data.settings.appearance) setBookAppearanceSettings(res.data.settings.appearance);
              if (res.data.settings.layout) setLayoutSettings(res.data.settings.layout);
              if (res.data.settings.menubar) setMenuBarSettings(res.data.settings.menubar);
              if (res.data.settings.othersetup) {
                const setup = res.data.settings.othersetup;
                if (setup.sound && !setup.sound.customBgSounds) setup.sound.customBgSounds = [];
                setOtherSetupSettings(setup);
              }
              if (res.data.settings.leadform) setLeadFormSettings(res.data.settings.leadform);
              if (res.data.settings.visibility) setVisibilitySettings(res.data.settings.visibility);
            }
          }
        } catch (err) {
          console.error("CustomizedEditor: Failed to fetch flipbook", err);
        }
      }
      setIsLoading(false);
    };
    fetchBook();
  }, [v_id, folder]);





  const renderDetailContent = () => {
    const handleBack = () => setIsPanelCollapsed(true);
    switch (activeSubView) {
      case 'logo':
      case 'profile':
        return (
          <Branding
            type={activeSubView}
            onBack={handleBack}
            logoSettings={logoSettings}
            onUpdateLogo={setLogoSettings}
            profileSettings={profileSettings}
            onUpdateProfile={setProfileSettings}
          />
        );
      case 'background':
      case 'layout':
      case 'bookappearance':
        return (
          <Appearance
            activeSub={activeSubView}
            onBack={handleBack}
            backgroundSettings={backgroundSettings}
            onUpdateBackground={setBackgroundSettings}
            bookAppearanceSettings={bookAppearanceSettings}
            onUpdateBookAppearance={setBookAppearanceSettings}
            layoutSettings={layoutSettings}
            onUpdateLayout={setLayoutSettings}
            layoutColors={layoutColors}
            onUpdateLayoutColors={setLayoutColors}
            pages={pages}
          />
        );
      case 'menubar':
        return (
          <MenuBar
            onBack={handleBack}
            settings={menuBarSettings}
            onUpdate={setMenuBarSettings}
            activeLayout={layoutSettings}
          />
        );
      case 'othersetup':
        return (
          <OtherSetup
            onBack={handleBack}
            settings={otherSetupSettings}
            onUpdate={setOtherSetupSettings}
            folderName={folder}
            bookName={v_id || bookName}
          />
        );
      case 'leadform':
        return (
          <LeadForm
            onBack={handleBack}
            settings={leadFormSettings}
            onUpdate={setLeadFormSettings}
            pages={pages}
          />
        );
      case 'visibility':
        return (
          <Visibility
            onBack={handleBack}
            settings={visibilitySettings}
            onUpdate={setVisibilitySettings}
          />
        );
      case 'statistic':
        return <Statistic onBack={handleBack} />;
      default:
        return null;
    }
  };

  // Build CSS variables for active layout colors
  const layoutColorVars = useMemo(() => {
    const activeIdx = layoutSettings || 1;
    const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || [];
    const saved = layoutColors[activeIdx] || [];

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

    // Derive --dropdown-icon from --dropdown-text at 70% opacity IF not already present
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
  }, [layoutSettings, layoutColors]);

  return (
    <div
      className="flex flex-col h-full w-full bg-[#DADBE8] overflow-hidden font-sans"
      style={layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(v => v.trim()).map(v => {
        const i = v.indexOf(':');
        return [v.slice(0, i).trim(), v.slice(i + 1).trim()];
      })) : {}}
    >
      <style>{`:root { ${layoutColorVars} }`}</style>
      {/* Navbar handled by parent layout */}


      <div className="flex flex-1 overflow-hidden">
        {/* Main Sidebar - Always Visible */}
        <div className="w-[16.25vw] h-full flex-shrink-0 bg-white shadow-xl z-20 relative border-r border-gray-100 overflow-visible">
          <Sidebar
            bookName={bookName}
            setBookName={setBookName}
            activeSubView={activeSubView}
            setActiveSubView={setActiveSubView}
            isPanelCollapsed={isPanelCollapsed}
            setIsPanelCollapsed={setIsPanelCollapsed}
            pageCount={pages.length}
            visibilitySettings={visibilitySettings}
            onUpdateVisibility={setVisibilitySettings}
            onPreview={() => setShowPreview(true)}
          />
        </div>

        {/* Sub-side Panel (Detail View) - Opens next to Main Sidebar */}
        <div
          className={`h-full bg-white shadow-lg z-10 border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0 ${activeSubView && !isPanelCollapsed
            ? 'w-[21.25vw] opacity-100 translate-x-0 overflow-visible'
            : 'w-0 opacity-0 -translate-x-full pointer-events-none overflow-hidden'
            }`}
        >
          <div className="w-[21vw] h-full flex flex-col overflow-visible">
            {activeSubView && renderDetailContent()}
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 min-w-0 flex flex-col relative z-0 overflow-hidden">
          {/* Loading Overlay Covers the Preview Area Fully */}
          {isLoading && (
            <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-[2vw] h-[2vw] border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700 font-medium">Loading Flipbook...</p>
              </div>
            </div>
          )}
          <PreviewArea
            bookName={bookName}
            pages={pages}
            targetPage={targetPage}
            logoSettings={logoSettings}
            profileSettings={profileSettings}
            backgroundSettings={backgroundSettings}
            bookAppearanceSettings={bookAppearanceSettings}
            activeLayout={layoutSettings || 1}
            layoutColors={layoutColors}
            menuBarSettings={menuBarSettings}
            leadFormSettings={leadFormSettings}
            otherSetupSettings={otherSetupSettings}
            onUpdateOtherSetup={setOtherSetupSettings}
            activeSubView={activeSubView}
            isSidebarOpen={activeSubView && !isPanelCollapsed}
            activeDevice={activeDevice || 'Desktop'}
            onFlip={(idx) => setTargetPage(idx)}
          />
        </div>
      </div>

      {showPreview && (
        <FlipbookPreview
          pages={pages.map(p => ({ ...p, content: p.content || p.html || '' }))}
          pageName={bookName}
          onClose={() => setShowPreview(false)}
          isMobile={false}
          isDoublePage={false}
          settings={{
            logo: logoSettings,
            profile: profileSettings,
            background: backgroundSettings,
            appearance: bookAppearanceSettings,
            layout: layoutSettings,
            layoutColors: layoutColors,
            menubar: menuBarSettings,
            othersetup: otherSetupSettings,
            leadform: leadFormSettings,
            visibility: visibilitySettings
          }}
          targetPage={targetPage}
        />
      )}
    </div>
  );
};

export default CustomizedEditor;