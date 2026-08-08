import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LAYOUT_DEFAULT_COLORS } from './Layout';
import { useParams, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
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
import { getSupabaseBaseUrl } from '../../utils/supabaseUtils';
import PasswordProtectModal from '../PasswordProtectModal';


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

const createDefaultPageData = (name, w = 210, h = 297) => {
  const baseWidth = w;
  const baseHeight = h;
  const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
  const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${baseWidth} ${baseHeight}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${name}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="${baseWidth}" height="${baseHeight}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
  </g>
</svg>`;
};

const CustomizedEditor = () => {
  const { folder, v_id, page } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setExportHandler, setSaveHandler, setPreviewHandler, setClearHandler, setHasUnsavedChanges, hasUnsavedChanges, triggerSaveSuccess, isAutoSaveEnabled, currentBook, setCurrentBook, activeDevice, setActiveDevice } = useOutletContext() || {};
  const [bookName, setBookName] = useState(() => currentBook?.flipbookName || 'Name of the Book');
  const [activeSubView, setActiveSubView] = useState(null);
  const [otherSetupTarget, setOtherSetupTarget] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [pages, setPages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [targetPage, setTargetPage] = useState(0);
  const [projectBaseUrl, setProjectBaseUrl] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Reset collapsed state whenever a new sub-view is selected
  useEffect(() => {
    setIsPanelCollapsed(false);
  }, [activeSubView]);

  const profilePreviewForcedRef = useRef(false);

  useEffect(() => {
    const shouldBeOpen = activeSubView === 'profile' && !isPanelCollapsed;
    
    if (shouldBeOpen && !profilePreviewForcedRef.current) {
      window.dispatchEvent(new Event('open-profile-preview'));
      profilePreviewForcedRef.current = true;
    } else if (!shouldBeOpen && profilePreviewForcedRef.current) {
      window.dispatchEvent(new Event('close-profile-preview'));
      profilePreviewForcedRef.current = false;
    }
  }, [activeSubView, isPanelCollapsed]);

  // Handle initial page from URL
  useEffect(() => {
    if (page) {
      const pageNum = parseInt(page);
      if (!isNaN(pageNum)) {
        setTargetPage(pageNum);
      }
    }
  }, [page]);

  // Update URL when page changes to maintain state on refresh
  useEffect(() => {
    if (folder && v_id) {
      // Use replace: true to avoid cluttering history with every page turn
      navigate(`/editor/customized_editor/${encodeURIComponent(folder)}/${v_id}/${targetPage}`, { replace: true });
    }
  }, [targetPage, folder, v_id, navigate]);

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
    const saved = localStorage.getItem(`customized_editor_branding_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_branding_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_appearance_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_appearance_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_appearance_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_appearance_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_setup_${v_id || 'default'}`);
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
        dragToTurn: true,
        pageQuickAccess: true,
        tableOfContents: true,
        pageThumbnails: true,
        bookmark: true,
        bookmarkSettings: {
          icon: 'default',
          font: 'Arial'
        },
        startEndNav: true,
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
          duration: 4,
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
        content: []
      }
    };
  });

  const [tocOpenTrigger, setTocOpenTrigger] = useState(0); 

  const [otherSetupSettings, setOtherSetupSettings] = useState(() => {
    const saved = localStorage.getItem(`customized_editor_setup_${v_id || 'default'}`);
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
    const saved = localStorage.getItem(`customized_editor_setup_${v_id || 'default'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.leadForm) {
          let lf = parsed.leadForm;
          if (lf.fields && !Array.isArray(lf.fields)) {
            const newFields = [];
            if (lf.fields.name) newFields.push({ id: '1', type: 'name', placeholder: 'Enter your Name' });
            if (lf.fields.email) newFields.push({ id: '2', type: 'email', placeholder: 'Enter your Gmail' });
            if (lf.fields.phone) newFields.push({ id: '3', type: 'phone', placeholder: 'Enter your Phone Number' });
            if (lf.fields.feedback) newFields.push({ id: '4', type: 'feedback', placeholder: 'Enter your Feedback' });
            lf.fields = newFields;
          }
          return lf;
        }
      } catch (e) {
        console.error("Failed to parse lead form settings from local storage", e);
      }
    }
    return {
      enabled: false,
      leadText: 'Share your information to get personalized updates.',
      fields: [
        { id: '1', type: 'name', placeholder: 'Enter your Name' },
        { id: '2', type: 'email', placeholder: 'Enter your Gmail' },
        { id: '3', type: 'feedback', placeholder: 'Enter your Feedback' }
      ],
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
    const saved = localStorage.getItem(`customized_editor_setup_${v_id || 'default'}`);
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
          days: '0 Days',
          time: '5 Mins',
          duration: '5 Mins'
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

  const [shareSettings, setShareSettings] = useState({
    shareId: '',
    access: 'public'
  });

  // Save Appearance Logic
  useEffect(() => {
    const settings = {
      background: backgroundSettings,
      appearance: bookAppearanceSettings,
      layout: layoutSettings,
      layoutColors: layoutColors
    };
    const key = `customized_editor_appearance_${v_id || 'default'}`;
    localStorage.setItem(key, JSON.stringify(settings));
    saveToDB(key, settings);
  }, [backgroundSettings, bookAppearanceSettings, layoutSettings, layoutColors]);

  // Save Setup Logic
  useEffect(() => {
    const settings = {
      menuBar: menuBarSettings,
      otherSetup: otherSetupSettings,
      visibility: visibilitySettings,
      leadForm: leadFormSettings
    };
    const key = `customized_editor_setup_${v_id || 'default'}`;
    localStorage.setItem(key, JSON.stringify(settings));

    if (v_id && isDataLoaded) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const updatedShare = {
            ...(shareSettings || {}),
            access: visibilitySettings?.type || 'Public',
            password: visibilitySettings?.password || '',
            accessKey: visibilitySettings?.accessKey || '',
            isPasswordSaved: Boolean(visibilitySettings?.isPasswordSaved),
            inviteOnly: visibilitySettings?.inviteOnly || {}
          };
          axios.post(`${backendUrl}/api/flipbook/update-settings`, {
            emailId: user.emailId,
            v_id: v_id,
            folderName: folder || 'Recent Book',
            bookName: v_id,
            newName: bookName,
            share: updatedShare,
            settings: settings
          }).then((res) => {
            if (res.data?.share) {
              setShareSettings(res.data.share);
            }
          }).catch(err => console.error("Visibility auto-save failed:", err));
        } catch (e) {
          console.error("User parse error in visibility auto-save", e);
        }
      }
    }
  }, [menuBarSettings, otherSetupSettings, leadFormSettings, isDataLoaded, v_id, folder, bookName]);

  // Save Branding Logic
  useEffect(() => {
    const settings = {
      logo: logoSettings,
      profile: profileSettings
    };
    const key = `customized_editor_branding_${v_id || 'default'}`;
    localStorage.setItem(key, JSON.stringify(settings));
    saveToDB(key, settings);
  }, [logoSettings, profileSettings]);

  // Save Bookmarks and Notes Logic
  useEffect(() => {
    if (isDataLoaded) {
      saveToDB(`customized_editor_bookmarks_${v_id || 'default'}`, bookmarks);
      saveToDB(`customized_editor_notes_${v_id || 'default'}`, notes);
    }
  }, [bookmarks, notes, isDataLoaded]);

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
        share: {
          ...(shareSettings || {}),
          access: visibilitySettings?.type || 'Public',
          password: visibilitySettings?.password || '',
          accessKey: visibilitySettings?.accessKey || '',
          isPasswordSaved: Boolean(visibilitySettings?.isPasswordSaved),
          inviteOnly: visibilitySettings?.inviteOnly || {}
        },
        settings: {
          logo: logoSettings,
          profile: profileSettings,
          background: backgroundSettings,
          appearance: bookAppearanceSettings,
          layout: layoutSettings,
          menubar: menuBarSettings,
          othersetup: otherSetupSettings,
          leadform: leadFormSettings,
          visibility: visibilitySettings,
          bookmarks: bookmarks,
          notes: notes
        }
      };

      await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);
      setShareSettings(payload.share);

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

  const handlePreview = useCallback(async () => {
    // Save to backend first so the shareId link has the latest data
    if (handleSaveRef.current) {
        await handleSaveRef.current();
    }
    
    await saveToDB('editor_autosave', {
      v_id: v_id,
      pages: pages,
      activePageIndex: targetPage || 0,
      pageName: bookName,
      timestamp: Date.now(),
      isDoublePage: false,
      projectBaseUrl: projectBaseUrl,
      settings: {
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
      }
    });
    const shareId = shareSettings?.shareId;
    if (shareId) {
      window.open(`/preview?shareId=${shareId}`, '_blank');
    } else {
      window.open('/preview', '_blank');
    }
  }, [v_id, pages, bookName, projectBaseUrl, targetPage, logoSettings, profileSettings, backgroundSettings, bookAppearanceSettings, layoutSettings, layoutColors, menuBarSettings, otherSetupSettings, leadFormSettings, visibilitySettings, shareSettings]);

  const handlePreviewRef = useRef(handlePreview);
  handlePreviewRef.current = handlePreview;
  const stablePreviewHandler = useCallback(() => handlePreviewRef.current?.(), []);
  const handleClearAllPages = useCallback(() => {
    const defaultW = currentBook?.width || 210;
    const defaultH = currentBook?.height || 297;
    setPages(prevPages => 
      prevPages.map((p, i) => {
        const blankSvg = createDefaultPageData(p.name || `Page ${i + 1}`, defaultW, defaultH);
        return {
          ...p,
          content: blankSvg,
          html: blankSvg
        };
      })
    );
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [currentBook, setHasUnsavedChanges]);

  // Export/Save Handlers for Context (Registration)
  useEffect(() => {
    if (setExportHandler) setExportHandler(() => stableExportHandler);
    if (setSaveHandler) setSaveHandler(() => stableSaveHandler);
    if (setPreviewHandler) setPreviewHandler(() => stablePreviewHandler);
    if (setClearHandler) setClearHandler(() => handleClearAllPages);

    window.addEventListener('trigger-clear-flipbook', handleClearAllPages);

    return () => {
      if (setExportHandler) setExportHandler(null);
      if (setSaveHandler) setSaveHandler(null);
      if (setPreviewHandler) setPreviewHandler(null);
      if (setClearHandler) setClearHandler(null);
      window.removeEventListener('trigger-clear-flipbook', handleClearAllPages);
    };
  }, [setExportHandler, setSaveHandler, setPreviewHandler, setClearHandler, stableSaveHandler, stableExportHandler, stablePreviewHandler, handleClearAllPages]);

  // Sync Current Book to Navbar and ShareModal in real-time
  useEffect(() => {
    if (setCurrentBook) {
      const currentAccess = visibilitySettings?.type || visibilitySettings?.access || 'Public';
      const effectiveShareId = 
        shareSettings?.shareId || 
        visibilitySettings?.shareId || 
        visibilitySettings?.Visibility?.shareId || 
        '';

      setCurrentBook(prev => {
        const sId = effectiveShareId || prev?.shareId || prev?.share?.shareId || prev?.Customized_Settings?.Visibility?.shareId || v_id;
        return {
          ...(prev || {}),
          folder: folder,
          flipbookName: bookName,
          v_id: v_id,
          shareId: sId,
          type: currentAccess,
          access: currentAccess,
          shareAccess: currentAccess,
          share: {
            ...(prev?.share || {}),
            ...shareSettings,
            ...visibilitySettings,
            shareId: sId,
            access: currentAccess
          },
          Visibility: {
            ...(prev?.Visibility || {}),
            ...visibilitySettings,
            shareId: sId,
            access: currentAccess
          },
          Customized_Settings: {
            ...(prev?.Customized_Settings || {}),
            Visibility: {
              ...(prev?.Customized_Settings?.Visibility || {}),
              ...visibilitySettings,
              shareId: sId,
              access: currentAccess
            }
          },
          pages: pages,
          settings: {
            ...(prev?.settings || {}),
            visibility: visibilitySettings
          }
        };
      });
    }
  }, [setCurrentBook, folder, v_id, bookName, shareSettings, pages, visibilitySettings]);

  const [isLoading, setIsLoading] = useState(true);
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

  const autoSaveTimerRef = useRef(null);

  // Auto-Save Mechanism for Customized Editor (Only runs when user makes changes)
  useEffect(() => {
    if (isAutoSaveEnabled && hasUnsavedChanges && !initialLoadRef.current && !isLoading) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        if (handleSaveRef.current) {
          handleSaveRef.current();
        }
      }, 2500);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    isAutoSaveEnabled, hasUnsavedChanges, isLoading,
    bookName, logoSettings, profileSettings, backgroundSettings,
    bookAppearanceSettings, layoutSettings, menuBarSettings,
    otherSetupSettings, leadFormSettings, visibilitySettings
  ]);

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
      let isAutosaveLoaded = false;
      // Check for recent autosave first (sync from TemplateEditor)
      const autosave = await getFromDB('editor_autosave');
      if (autosave && autosave.v_id === v_id && autosave.pages && autosave.pages.length > 0) {
        // Check if pages are corrupted from previous bug (e.g., html is an object, undefined, or empty string)
        const isCorrupted = autosave.pages.some(p => 
          typeof p.html === 'object' || 
          typeof p.content === 'object' || 
          !p.html || p.html.trim() === ''
        );

        if (!isCorrupted) {
          console.log('CustomizedEditor: Loading from autosave');
          isAutosaveLoaded = true;
          try {
            const data = autosave;
            setPages(data.pages.map((p, i) => ({
              id: p.id || i,
              name: p.name || `Page ${i + 1}`,
              html: p.html || p.content || '',
              content: p.html || p.content || ''
            })));
            if (data.pageName && (!currentBook?.flipbookName || currentBook?.flipbookName === 'Name of the Book')) {
              setBookName(data.pageName);
            }
            // Start from the first page on initial load if no page specified in URL
            if (!page) setTargetPage(0);
          } catch (e) {
            console.error("CustomizedEditor: Failed to load autosave", e);
            isAutosaveLoaded = false;
          }
        } else {
          console.warn('CustomizedEditor: Autosave is corrupted. Ignoring and clearing it.');
          // We don't await this to avoid blocking the fetch
          saveToDB('editor_autosave', null);
        }
      }

      // Check for synced settings from TemplateEditor or other sessions
      const appearance = await getFromDB(`customized_editor_appearance_${v_id || 'default'}`);
      if (appearance) {
        if (appearance.background) setBackgroundSettings(appearance.background);
        if (appearance.appearance) setBookAppearanceSettings(appearance.appearance);
        if (appearance.layout) setLayoutSettings(appearance.layout);
        if (appearance.layoutColors) setLayoutColors(appearance.layoutColors);
      }

      const branding = await getFromDB(`customized_editor_branding_${v_id || 'default'}`);
      if (branding) {
        if (branding.logo) setLogoSettings(branding.logo);
        if (branding.profile) setProfileSettings(branding.profile);
      }

      const setup = await getFromDB(`customized_editor_setup_${v_id || 'default'}`);
      if (setup) {
        if (setup.menuBar) setMenuBarSettings(setup.menuBar);
        if (setup.otherSetup) setOtherSetupSettings(setup.otherSetup);
        if (setup.leadForm) {
          let lf = setup.leadForm;
          if (lf.fields && !Array.isArray(lf.fields)) {
            const newFields = [];
            if (lf.fields.name) newFields.push({ id: '1', type: 'name', placeholder: 'Enter your Name' });
            if (lf.fields.email) newFields.push({ id: '2', type: 'email', placeholder: 'Enter your Gmail' });
            if (lf.fields.phone) newFields.push({ id: '3', type: 'phone', placeholder: 'Enter your Phone Number' });
            if (lf.fields.feedback) newFields.push({ id: '4', type: 'feedback', placeholder: 'Enter your Feedback' });
            lf.fields = newFields;
          }
          setLeadFormSettings(lf);
        }
        if (setup.visibility) setVisibilitySettings(setup.visibility);
      }

      if (v_id) {
        console.log('CustomizedEditor: Fetching flipbook with folder:', folder, 'v_id:', v_id);
        try {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return;
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

          const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
            params: { emailId: user.emailId, v_id, folderName: folder, bookName: decodeURIComponent(v_id) }
          });

          if (res.data) {
            let pBaseUrl = null;
            if (res.data.meta) {
              const sanitizedEmail = user?.emailId?.replace(/[@.]/g, "_");
              pBaseUrl = getSupabaseBaseUrl(sanitizedEmail, res.data.meta.folderName, res.data.meta.flipbookName);
              setProjectBaseUrl(pBaseUrl);
            }



            // ONLY overwrite pages if we DON'T have an autosave
            if (!isAutosaveLoaded) {
              // Only set book name from backend if session doesn't have an unsaved change
              if (!currentBook?.flipbookName || currentBook?.flipbookName === 'Name of the Book') {
                setBookName(res.data.meta?.flipbookName || res.data.name || location.state?.flipbookName || decodeURIComponent(v_id) || 'Name of the Book');
              }
              if (res.data.pages) {
                const mappedPages = await Promise.all(res.data.pages.map(async (p, i) => {
                  let rawHTML = p.html || p.content || '';

                  if (!rawHTML || typeof rawHTML !== 'string' || rawHTML.trim() === '') {
                    const metaW = res.data.meta?.width || res.data.settings?.width || location.state?.width || currentBook?.width || 210;
                    const metaH = res.data.meta?.height || res.data.settings?.height || location.state?.height || currentBook?.height || 297;
                    const defaultData = createDefaultPageData(p.name || `Page ${i + 1}`, metaW, metaH);
                    rawHTML = defaultData;
                  }

                  // Heal broken paths from previous sessions if needed
                  if (rawHTML.includes('nullassets/') && pBaseUrl) {
                    rawHTML = rawHTML.split('nullassets/').join(`${pBaseUrl}assets/`);
                  }

                  // Fix relative image paths generated by PDF uploads
                  if (rawHTML.includes('./assets/') && pBaseUrl) {
                    rawHTML = rawHTML.split('./assets/').join(`${pBaseUrl}assets/`);
                  }

                  return {
                    id: p.id || i,
                    content: rawHTML,
                    name: p.name || `Page ${i + 1}`,
                    html: rawHTML
                  };
                }));
                setPages(mappedPages);
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
              if (res.data.settings.leadform) {
                let lf = res.data.settings.leadform;
                if (lf.fields && !Array.isArray(lf.fields)) {
                  const newFields = [];
                  if (lf.fields.name) newFields.push({ id: '1', type: 'name', placeholder: 'Enter your Name' });
                  if (lf.fields.email) newFields.push({ id: '2', type: 'email', placeholder: 'Enter your Gmail' });
                  if (lf.fields.phone) newFields.push({ id: '3', type: 'phone', placeholder: 'Enter your Phone Number' });
                  if (lf.fields.feedback) newFields.push({ id: '4', type: 'feedback', placeholder: 'Enter your Feedback' });
                  lf.fields = newFields;
                }
                setLeadFormSettings(lf);
              }
              if (res.data.settings.visibility) setVisibilitySettings(res.data.settings.visibility);
              if (res.data.settings.bookmarks) setBookmarks(res.data.settings.bookmarks);
              if (res.data.settings.notes) setNotes(res.data.settings.notes);
            }
            let shareData = res.data.share;
            if (!shareData || !shareData.shareId) {
              const newShareId = Math.random().toString(36).substring(2, 14);
              shareData = { shareId: newShareId, access: 'public' };
              // Try to save the newly generated shareId to the backend
              axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                emailId: user.emailId,
                v_id: v_id,
                share: shareData
              }).catch(err => console.error('Frontend shareId auto-heal save failed:', err));
            }
            setShareSettings(shareData);

            if (shareData) {
              setVisibilitySettings(prev => ({
                ...prev,
                type: shareData.access || prev.type || 'Public',
                password: shareData.password || prev.password || '',
                accessKey: shareData.accessKey || prev.accessKey || '',
                isPasswordSaved: shareData.isPasswordSaved !== undefined ? shareData.isPasswordSaved : prev.isPasswordSaved,
                inviteOnly: shareData.inviteOnly || prev.inviteOnly || {}
              }));
            }

            if (setCurrentBook) {
              setCurrentBook(prev => ({
                ...(prev || {}),
                isPublished: res.data.isPublished !== undefined ? Boolean(res.data.isPublished) : Boolean(res.data.meta?.isPublished),
                flipbookName: res.data.meta?.flipbookName || res.data.name || prev?.flipbookName,
                quotes: res.data.quotes || res.data.meta?.quotes || prev?.quotes || '',
                about: res.data.about || res.data.meta?.about || prev?.about || '',
                category: res.data.category || res.data.meta?.category || prev?.category || 'Product Based',
                language: res.data.language || res.data.meta?.language || prev?.language || 'English',
                tags: res.data.tags || res.data.meta?.tags || prev?.tags || [],
                meta: {
                  ...(prev?.meta || {}),
                  ...(res.data.meta || {})
                }
              }));
            }
          }
        } catch (err) {
          console.error("CustomizedEditor: Failed to fetch flipbook", err);
          if (!currentBook?.flipbookName || currentBook?.flipbookName === 'Name of the Book') {
            setBookName(location.state?.flipbookName || decodeURIComponent(v_id) || 'Name of the Book');
          }
        } finally {
          setIsLoading(false);
          setIsDataLoaded(true);
          // Fallback: If we still have 0 pages, initialize empty ones to prevent UI from breaking
          setPages(prevPages => {
            if (!prevPages || prevPages.length === 0) {
              const count = location.state?.pageCount || 12;
              const w = location.state?.width || currentBook?.width || 210;
              const h = location.state?.height || currentBook?.height || 297;
              console.log(`CustomizedEditor: No pages loaded. Initializing ${count} default pages (${w}x${h}mm).`);
              return Array.from({ length: count }, (_, i) => {
                const name = `Page ${i + 1}`;
                const defaultData = createDefaultPageData(name, w, h);
                return {
                  id: i + 1,
                  name: name,
                  html: defaultData,
                  content: defaultData
                };
              });
            }
            return prevPages;
          });
        }
      } else {
        setIsLoading(false);
        setIsDataLoaded(true);
      }
    };
    fetchBook();
  }, [v_id, folder]);





  const renderDetailContent = () => {
    const handleBack = () => setIsPanelCollapsed(true);
    switch (activeSubView) {
      case 'logo':
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
            otherSettings={otherSetupSettings}
            onUpdateOther={setOtherSetupSettings}
            folderName={folder}
            bookName={bookName}
            activeLayout={layoutSettings}
            onNavigateToOtherSetup={(target) => {
              setActiveSubView('othersetup');
              setOtherSetupTarget(target);
            }}
            onTocSettingsClick={() => setTocOpenTrigger(prev => prev + 1)}
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
            pages={pages}
            targetAccordion={otherSetupTarget}
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
            bookName={bookName}
            v_id={v_id}
            folder={folder}
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

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return v_id ? sessionStorage.getItem(`unlocked_${v_id}`) === 'true' : false;
  });

  const accessMode = (
    visibilitySettings?.type || 
    visibilitySettings?.access || 
    currentBook?.share?.access || 
    currentBook?.share?.type || 
    ''
  ).toLowerCase().trim();

  const isPasswordProtected = accessMode.includes('password');

  useEffect(() => {
    if (!isPasswordProtected && v_id) {
      sessionStorage.removeItem(`unlocked_${v_id}`);
      const currentShareId = currentBook?.share?.shareId || visibilitySettings?.shareId;
      if (currentShareId) sessionStorage.removeItem(`unlocked_${currentShareId}`);
      setIsUnlocked(false);
    }
  }, [isPasswordProtected, v_id, currentBook?.share?.shareId, visibilitySettings?.shareId]);

  return (
    <div
      className="flex flex-col h-full w-full bg-[#DADBE8] overflow-hidden font-sans select-none relative"
      style={layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(v => v.trim()).map(v => {
        const i = v.indexOf(':');
        return [v.slice(0, i).trim(), v.slice(i + 1).trim()];
      })) : {}}
    >
      <style>{`:root { ${layoutColorVars} }`}</style>
      {!isLoading && isPasswordProtected && !isUnlocked && (
        <PasswordProtectModal
          v_id={v_id}
          shareId={currentBook?.share?.shareId || visibilitySettings?.shareId}
          onUnlock={() => setIsUnlocked(true)}
        />
      )}
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
            onPreview={stablePreviewHandler}
            currentBook={currentBook}
            setCurrentBook={setCurrentBook}
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
            backgroundSettings={backgroundSettings}
            bookAppearanceSettings={bookAppearanceSettings}
            menuBarSettings={menuBarSettings}
            leadFormSettings={leadFormSettings}
            profileSettings={profileSettings}
            otherSetupSettings={otherSetupSettings}
            onUpdateOtherSetup={setOtherSetupSettings}
            activeLayout={layoutSettings}
            layoutColors={layoutColors}
            isSidebarOpen={activeSubView && !isPanelCollapsed}
            activeDevice={activeDevice || 'Desktop'}
            activeSubView={activeSubView}
            bookmarks={bookmarks}
            notes={notes}
            setBookmarks={setBookmarks}
            setNotes={setNotes}
            onFlip={(idx) => setTargetPage(idx)}
            isEditor={true}
            useNativeFullscreen={true}
            baseUrl={projectBaseUrl}
            isLoading={isLoading}
            externalShowTOC={tocOpenTrigger}
            currentBook={currentBook}
          />
        </div>
      </div>

    </div>
  );
};

export default CustomizedEditor;