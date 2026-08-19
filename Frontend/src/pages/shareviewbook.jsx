import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { LAYOUT_DEFAULT_COLORS } from '../components/CustomizedEditor/Layout';
import { Icon } from '@iconify/react';
import { Ghost, ArrowLeft, Home, BookOpen, Clock } from 'lucide-react';
import { resolveUploadsPath, rewriteHtmlUploadsToSupabase } from '../utils/supabaseUtils';

const checkInviteAutoExpired = (autoExpire, fallbackDate) => {
  if (!autoExpire || !autoExpire.enabled) return false;

  const rawGranted = autoExpire.grantedAt || autoExpire.createdAt || fallbackDate;
  if (!rawGranted) return false;
  const grantedAt = new Date(rawGranted).getTime();

  const daysStr = String(autoExpire.days || '0');
  const daysMatch = daysStr.match(/(\d+)/);
  const daysNum = daysMatch ? parseInt(daysMatch[1], 10) : 0;

  const timeStr = String(autoExpire.time || '0');
  const timeMatch = timeStr.match(/(\d+)/);
  const timeNum = timeMatch ? parseInt(timeMatch[1], 10) : 0;

  let timeInMs = 0;
  if (timeStr.toLowerCase().includes('hour')) {
    timeInMs = timeNum * 60 * 60 * 1000;
  } else {
    timeInMs = timeNum * 60 * 1000;
  }

  const daysInMs = daysNum * 24 * 60 * 60 * 1000;
  const totalAllowedMs = daysInMs + timeInMs;

  if (totalAllowedMs <= 0) return false;

  const now = Date.now();
  const elapsed = now - grantedAt;

  return elapsed > totalAllowedMs;
};

const ShareViewBook = () => {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryAttempt, setRetryAttempt] = useState(0);

    const [accessMode, setAccessMode] = useState(null); // null | 'password' | 'login'
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [tempSettings, setTempSettings] = useState(null);

    // Get current logged-in user email
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserEmail = user?.emailId || user?.email || '';

    // Live auto-expire timer check while watching book
    useEffect(() => {
        if (!bookData || error) return;

        const vis = bookData.Customized_Settings?.Visibility || bookData.share || {};
        const accessMode = (vis.access || 'public').toLowerCase();

        const storedUser = localStorage.getItem('user');
        let email = '';
        try {
            const u = storedUser ? JSON.parse(storedUser) : null;
            email = (u?.emailId || u?.email || (typeof storedUser === 'string' && !storedUser.startsWith('{') ? storedUser : '')).toLowerCase();
        } catch (e) {}

        const isOwner = email && email.toLowerCase() === (bookData.userEmail || '').toLowerCase();

        if (accessMode.includes('invite') && !isOwner) {
            const autoExpire = vis.inviteOnly?.autoExpire;
            if (autoExpire && autoExpire.enabled) {
                if (checkInviteAutoExpired(autoExpire, bookData.updatedAt || bookData.createdAt)) {
                    setError("Time Expired! The access time granted for this flipbook has expired.");
                    return;
                }

                const interval = setInterval(() => {
                    if (checkInviteAutoExpired(autoExpire, bookData.updatedAt || bookData.createdAt)) {
                        setError("Time Expired! The access time granted for this flipbook has expired.");
                        clearInterval(interval);
                    }
                }, 2000);

                return () => clearInterval(interval);
            }
        }
    }, [bookData, error]);

    const getBackendUrl = () => {
        if (import.meta.env.VITE_BACKEND_URL) {
            return import.meta.env.VITE_BACKEND_URL;
        }
        const origin = window.location.origin;
        if (origin.includes('devtunnels.ms')) {
            return origin.replace('-5173', '-5000');
        }
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            const portMatch = origin.match(/:(\d+)/);
            if (portMatch) {
                return origin.replace(portMatch[0], ':5000');
            }
        }
        return 'http://localhost:5000';
    };

    // Prepare settings fallback & branding/appearance extraction
    const brandingObj = React.useMemo(() => {
        return bookData?.Customized_Settings?.Branding || {};
    }, [bookData]);

    const appearanceObj = React.useMemo(() => {
        const rawApp = bookData?.Customized_Settings?.BookAppearance || bookData?.Customized_Settings?.Appearance || bookData?.settings?.BookAppearance || bookData?.settings?.appearance || {};
        return {
            texture: 'Plain White',
            hardCover: false,
            flipStyle: 'Classic Flip',
            flipSpeed: 'medium',
            corner: 'Sharp',
            dropShadow: { active: true, color: '#4f4f4fff', opacity: 50, xAxis: 0, yAxis: 0, blur: 0, spread: 0 },
            ...rawApp
        };
    }, [bookData]);

    const backgroundObj = React.useMemo(() => {
        return bookData?.Customized_Settings?.Background || {};
    }, [bookData]);

    const menuBarObj = React.useMemo(() => {
        return bookData?.Customized_Settings?.MenuBar || {};
    }, [bookData]);

    const otherSetupObj = React.useMemo(() => {
        return bookData?.Customized_Settings?.otherSetup || bookData?.Customized_Settings?.othersetup || bookData?.settings?.otherSetup || bookData?.settings?.othersetup || {};
    }, [bookData]);

    const layoutsObj = React.useMemo(() => {
        return bookData?.Customized_Settings?.Layouts || {};
    }, [bookData]);

    const leadFormObj = React.useMemo(() => {
        return bookData?.Customized_Settings?.leadForm || bookData?.Customized_Settings?.leadform || bookData?.settings?.leadForm || bookData?.settings?.leadform || {};
    }, [bookData]);

    const settings = React.useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        const queryLayout = searchParams.get('layout');
        const activeLayout = queryLayout && !isNaN(Number(queryLayout)) ? Number(queryLayout) : (layoutsObj.layoutStyle !== undefined ? layoutsObj.layoutStyle : 1);
        return {
            ...(bookData?.meta || {}),
            FlipbookInfo: bookData?.Customized_Settings?.FlipbookInfo || {},
            Branding: brandingObj,
            Background: backgroundObj,
            MenuBar: menuBarObj,
            Layouts: {
                ...layoutsObj,
                layoutStyle: activeLayout
            },
            BookAppearance: appearanceObj,
            otherSetup: otherSetupObj,
            leadForm: leadFormObj
        };
    }, [bookData, brandingObj, backgroundObj, appearanceObj, menuBarObj, otherSetupObj, layoutsObj, leadFormObj, location.search]);

    const layoutColorVars = React.useMemo(() => {
        if (!bookData) return '';
        const activeIdx = Number(settings?.Layouts?.layoutStyle) || 1;
        const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || [];
        const layoutColorsObj = settings?.Layouts?.layoutColors;
        const saved = Array.isArray(layoutColorsObj?.[activeIdx]) ? layoutColorsObj[activeIdx] : [];
        const toolbarP = layoutColorsObj?.toolbarColor?.primary;
        const toolbarS = layoutColorsObj?.toolbarColor?.secondary;
        const popupP = layoutColorsObj?.popupColor?.primary;
        const popupS = layoutColorsObj?.popupColor?.secondary;

        const mergedColors = defaults.map((c) => {
            const savedItem = saved.find(s => s && s.id === c.id);
            let hexVal = c.hex;
            if (savedItem && savedItem.hex) {
                hexVal = savedItem.hex;
            } else if (toolbarP && ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'].includes(c.id)) {
                hexVal = toolbarP;
            } else if (toolbarS && ['toolbar-text-main', 'toolbar-icon', 'reset-text', 'page-number-text'].includes(c.id)) {
                hexVal = toolbarS;
            } else if (popupP && ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'].includes(c.id)) {
                hexVal = popupP;
            } else if (popupS && ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'].includes(c.id)) {
                hexVal = popupS;
            }

            return {
                ...c,
                ...(savedItem ? savedItem : {}),
                hex: hexVal
            };
        });

        return mergedColors.map((c, i) => {
            const hex = c.hex || '#ffffff';
            const op = (c.opacity ?? 100) / 100;
            const r = parseInt(hex.slice(1, 3), 16) || 0;
            const g = parseInt(hex.slice(3, 5), 16) || 0;
            const b = parseInt(hex.slice(5, 7), 16) || 0;

            const varName = c.id || `layout-color-${i}`;
            return `--${varName}: ${hex}; --${varName}-opacity: ${op}; --${varName}-rgb: ${r},${g},${b};`;
        }).join(' ');
    }, [bookData, settings?.Layouts]);

    const varsObject = React.useMemo(() => {
        if (!layoutColorVars) return {};
        const obj = {};
        layoutColorVars.split(';').forEach(v => {
            if (!v.trim()) return;
            const parts = v.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                obj[key] = value;
            }
        });
        return obj;
    }, [layoutColorVars]);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;
        let cancelled = false;

        const fetchBook = async (passVal = '') => {
            try {
                const backendUrl = getBackendUrl();
                console.log(`Fetching public flipbook: ${shareId} (Attempt ${retryCount + 1}/${maxRetries + 1})`);

                const params = {};
                if (currentUserEmail) params.emailId = currentUserEmail;
                if (passVal) {
                    params.password = passVal;
                    params.accessKey = passVal;
                }

                const res = await axios.get(`${backendUrl}/api/flipbook/public/get/${shareId}`, {
                    params,
                    timeout: 15000 // 15s timeout for slow connections
                });

                if (cancelled) return;

                let processedData = res.data;

                // Normalize settings keys and fix relative image URLs for the public view
                if (processedData?.settings) {
                    if (processedData.settings.otherSetup && !processedData.settings.othersetup) {
                        processedData.settings.othersetup = processedData.settings.otherSetup;
                    }
                    
                    // Fix gallery image URLs if they are relative
                    if (processedData.settings.othersetup?.gallery?.images) {
                        processedData.settings.othersetup.gallery.images = processedData.settings.othersetup.gallery.images.map(imgUrl => {
                            if (typeof imgUrl === 'string' && imgUrl.startsWith('/uploads/')) {
                                return resolveUploadsPath(imgUrl);
                            }
                            return imgUrl;
                        });
                    }
                }

                // Extract and set tempSettings immediately so the custom preloader works while image preloading happens
                const extractedSettings = {
                    ...(processedData?.meta || {}),
                    ...(processedData?.settings || {})
                };
                setTempSettings(extractedSettings);

                if (!processedData || !processedData.pages || processedData.pages.length === 0) {
                    throw new Error("Invalid or empty flipbook data received");
                }

                const bUrl = processedData.meta?.baseUrl
                    ? resolveUploadsPath(processedData.meta.baseUrl)
                    : '';

                if (processedData.pages) {
                    let imageUrls = [];
                    processedData.pages = processedData.pages.map(p => {
                        let html = p.html || p.content || '';

                        // Fix nullassets paths
                        if (html.includes('nullassets/') && bUrl) {
                            html = html.split('nullassets/').join(`${bUrl}assets/`);
                        }
                        
                        // Fix relative image paths generated by PDF uploads
                        if (html.includes('./assets/') && bUrl) {
                            html = html.split('./assets/').join(`${bUrl}assets/`);
                        }

                        // Rewrite all /uploads/ to Supabase CDN URLs if configured
                        html = rewriteHtmlUploadsToSupabase(html);

                        // Extract URLs for preloading
                        const matches = html.match(/(?:src|href|xlink:href)=["'](.*?)["']/g);
                        if (matches) {
                            matches.forEach(m => {
                                const urlMatch = m.match(/(?:src|href|xlink:href)=["'](.*?)["']/);
                                if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
                                    imageUrls.push(urlMatch[1]);
                                }
                            });
                        }

                        return { ...p, html };
                    });
                    
                    // Preload all extracted images before showing the book
                    if (imageUrls.length > 0) {
                        imageUrls = [...new Set(imageUrls)]; // unique urls
                        const loadPromises = imageUrls.map(url => {
                            return new Promise(resolve => {
                                const img = new Image();
                                img.onload = resolve;
                                img.onerror = resolve; // resolve on error to not block forever
                                img.src = url;
                            });
                        });
                        
                        // Wait for images up to 10 seconds (failsafe for slow network)
                        await Promise.race([
                            Promise.all(loadPromises),
                            new Promise(r => setTimeout(r, 10000))
                        ]);
                    }
                }

                // Sync URL path to match actual access mode (e.g. /share=public/ vs /share=private/)
                const rawAccMode = String(processedData?.Visibility?.access || processedData?.share?.access || 'public').toLowerCase();
                let targetPrefix = 'share=public';
                if (rawAccMode.includes('private')) targetPrefix = 'share=private';
                else if (rawAccMode.includes('password')) targetPrefix = 'share=password';
                else if (rawAccMode.includes('invite')) targetPrefix = 'share=invite';

                const expectedPath = `/${targetPrefix}/${shareId}`;
                if (location.pathname !== expectedPath) {
                    navigate(`${expectedPath}${location.search}`, { replace: true });
                }

                // Only update state if the component is still mounted
                setBookData(processedData);
                setError(null);
                setAccessMode(null);
                setLoading(false); // ✅ Only stop loading on SUCCESS
            } catch (err) {
                if (cancelled) return;
                console.error(`Error fetching public flipbook (attempt ${retryCount + 1}):`, err);

                const status = err.response?.status;
                const errData = err.response?.data || {};

                // Auto-sync URL path if visibility mode changed on backend
                const errAccMode = String(errData.accessMode || (errData.isPrivate ? 'private' : errData.isPasswordProtected ? 'password' : errData.isInviteOnly ? 'invite' : '')).toLowerCase();
                if (errAccMode) {
                    let targetPrefix = 'share=public';
                    if (errAccMode.includes('private')) targetPrefix = 'share=private';
                    else if (errAccMode.includes('password')) targetPrefix = 'share=password';
                    else if (errAccMode.includes('invite')) targetPrefix = 'share=invite';

                    const expectedPath = `/${targetPrefix}/${shareId}`;
                    if (location.pathname !== expectedPath) {
                        navigate(`${expectedPath}${location.search}`, { replace: true });
                    }
                }

                // Retry on network errors or 5xx server errors — keep loading=true
                const isRetryable = !err.response || status >= 500;
                if (retryCount < maxRetries && isRetryable) {
                    retryCount++;
                    setRetryAttempt(retryCount); // Show retry progress in UI
                    const delay = Math.pow(2, retryCount - 1) * 1000;
                    console.log(`Retrying in ${delay}ms...`);
                    setTimeout(() => fetchBook(passVal), delay);
                    return; // ⬅️ Keep loading=true while retry is pending
                }

                // Populate preview book data if returned by backend for background blur effect
                if (errData.pages || errData.bookName) {
                    setBookData({
                        flipbookName: errData.bookName || 'Protected Flipbook',
                        pages: errData.pages || [],
                        meta: errData.meta || {},
                        Customized_Settings: errData.Customized_Settings || {}
                    });
                }

                // Handle access control statuses
                if (status === 401 || errData.isPasswordProtected) {
                    setAccessMode('password');
                    setError(null);
                    setLoading(false);
                    return;
                }

                if (status === 403) {
                    if (errData.isPrivate) {
                        setError(errData.message || "This flipbook is private. Only the author can view this book.");
                        setLoading(false);
                        return;
                    }
                    if (errData.isInviteOnly) {
                        if (errData.isExpired) {
                            setError(errData.message || "Time Expired! The access time granted for this flipbook has expired.");
                            setLoading(false);
                            return;
                        }
                        if (!currentUserEmail) {
                            setAccessMode('login');
                            setError(null);
                            setLoading(false);
                            return;
                        } else {
                            setError(errData.message || "This flipbook has invite-only access. Your email is not authorized to access this book.");
                            setLoading(false);
                            return;
                        }
                    }
                    if (errData.isUnpublished) {
                        setError(errData.message || "This Flipbook not Yet Published");
                        setLoading(false);
                        return;
                    }
                    setError(errData.message || "This flipbook is private.");
                } else if (status === 404) {
                    setError("Flipbook not found.");
                } else {
                    setError(errData.message || "Flipbook not found or private.");
                }
                setLoading(false); // ✅ Stop loading only after all retries fail
            }
        };

        if (shareId) fetchBook();

        return () => { cancelled = true; }; // Cleanup to prevent state updates after unmount
    }, [shareId, currentUserEmail]);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!passwordInput.trim()) {
            setPasswordError("Please enter access key.");
            return;
        }
        setPasswordError('');
        setIsSubmittingPassword(true);
        try {
            const backendUrl = getBackendUrl();
            const params = {
                accessKey: passwordInput.trim(),
                password: passwordInput.trim()
            };
            if (currentUserEmail) params.emailId = currentUserEmail;

            const res = await axios.get(`${backendUrl}/api/flipbook/public/get/${shareId}`, { params });

            let processedData = res.data;
            if (processedData?.settings) {
                if (processedData.settings.otherSetup && !processedData.settings.othersetup) {
                    processedData.settings.othersetup = processedData.settings.otherSetup;
                }
            }
            if (processedData.pages) {
                const bUrl = processedData.meta?.baseUrl ? resolveUploadsPath(processedData.meta.baseUrl) : '';
                processedData.pages = processedData.pages.map(p => {
                    let html = p.html || p.content || '';
                    if (html.includes('nullassets/') && bUrl) html = html.split('nullassets/').join(`${bUrl}assets/`);
                    if (html.includes('./assets/') && bUrl) html = html.split('./assets/').join(`${bUrl}assets/`);
                    html = rewriteHtmlUploadsToSupabase(html);
                    return { ...p, html };
                });
            }

            setBookData(processedData);
            setAccessMode(null);
            setError(null);
        } catch (err) {
            setPasswordError(err.response?.data?.message || "Invalid Access Key.");
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (loading) return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, backgroundColor: '#ffffff' }} />
    );

    if (accessMode === 'password') return (
        <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950">
            {/* Background Flipbook with Blur */}
            {bookData && bookData.pages && bookData.pages.length > 0 ? (
                <div className="absolute inset-0 filter blur-[10px] opacity-40 scale-105 pointer-events-none overflow-hidden select-none" style={varsObject}>
                    <style>{`:root { ${layoutColorVars} }`}</style>
                    <FlipbookPreview
                        pages={bookData.pages}
                        pageName={bookData.meta?.flipbookName || bookData.flipbookName || 'Protected Flipbook'}
                        settings={{ ...(bookData.meta || {}), ...settings }}
                        isMobile={isMobileDevice}
                        onClose={null}
                        baseUrl={bookData.meta?.baseUrl ? `${getBackendUrl()}${bookData.meta.baseUrl}` : null}
                        isPublishedPreview={true}
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
            )}

            {/* Dark Overlay & Protected Flipbook Modal */}
            <div className="fixed inset-0 z-[99999] w-full min-h-screen flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-slate-900 font-sans p-[1vw] select-none animate-in fade-in duration-200">
                <div className="bg-white rounded-[1.2vw] p-[1.4vw] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] w-[25vw] min-w-[320px] max-w-[420px] border border-white/20 animate-in zoom-in-95 duration-200">
                    {/* Lock Badge */}
                    <div className="w-[3.2vw] h-[3.2vw] min-w-[44px] min-h-[44px] rounded-[0.8vw] bg-[#EEEDFF] border border-[#5551FF]/15 flex items-center justify-center mx-auto mb-[1vw]">
                        <Icon icon="lucide:lock" className="w-[1.6vw] h-[1.6vw] min-w-[22px] min-h-[22px] text-[#5551FF]" />
                    </div>
                    
                    {/* Title & Subtitle */}
                    <div className="text-center space-y-[0.2vw] mb-[1.2vw]">
                        <h1 className="text-[1.2vw] min-text-[18px] font-extrabold text-slate-900 tracking-tight">Protected Flipbook</h1>
                        <p className="text-[0.72vw] text-slate-500 font-normal leading-relaxed max-w-[90%] mx-auto">
                            Enter the access key to view this flipbook.
                        </p>
                    </div>

                    {/* Password / Key Form */}
                    <form onSubmit={handlePasswordSubmit} className="space-y-[0.8vw]">
                        <div className="space-y-[0.35vw]">
                            <label className="text-[0.78vw] font-semibold text-gray-900 block text-left">Access Key</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordInput}
                                    onChange={(e) => {
                                        setPasswordInput(e.target.value);
                                        if (passwordError) setPasswordError('');
                                    }}
                                    placeholder="Enter Access Key..."
                                    className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.55vw] text-[0.78vw] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <Icon icon={showPassword ? "lucide:eye" : "lucide:eye-off"} className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]" />
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{passwordError}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmittingPassword}
                            className="w-full bg-black hover:bg-gray-900 active:scale-[0.99] text-white py-[0.55vw] rounded-[0.5vw] text-[0.78vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-[0.4vw] mt-[0.6vw]"
                        >
                            {isSubmittingPassword ? (
                                <div className="animate-spin rounded-full h-[0.9vw] w-[0.9vw] min-h-[14px] min-w-[14px] border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <Icon icon="lucide:key-round" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px]" />
                                    <span>Unlock Flipbook</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    if (accessMode === 'login') return (
        <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950">
            {/* Background Flipbook with Blur */}
            {bookData && bookData.pages && bookData.pages.length > 0 ? (
                <div className="absolute inset-0 filter blur-[10px] opacity-40 scale-105 pointer-events-none overflow-hidden select-none" style={varsObject}>
                    <style>{`:root { ${layoutColorVars} }`}</style>
                    <FlipbookPreview
                        pages={bookData.pages}
                        pageName={bookData.meta?.flipbookName || bookData.flipbookName || 'Invited Access Only'}
                        settings={{ ...(bookData.meta || {}), ...settings }}
                        isMobile={isMobileDevice}
                        onClose={null}
                        baseUrl={bookData.meta?.baseUrl ? `${getBackendUrl()}${bookData.meta.baseUrl}` : null}
                        isPublishedPreview={true}
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
            )}

            {/* Dark Overlay & Invited Access Card */}
            <div className="fixed inset-0 z-[99999] w-full min-h-screen flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-slate-900 font-sans p-[1vw] select-none animate-in fade-in duration-200">
                <div className="bg-white rounded-[1.2vw] p-[1.4vw] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] w-[25vw] min-w-[320px] max-w-[420px] border border-white/20 animate-in zoom-in-95 duration-200 text-center">
                    {/* Badge */}
                    <div className="w-[3.2vw] h-[3.2vw] min-w-[44px] min-h-[44px] rounded-[0.8vw] bg-[#EEEDFF] border border-[#5551FF]/15 flex items-center justify-center mx-auto mb-[1vw]">
                        <Icon icon="lucide:user-check" className="w-[1.6vw] h-[1.6vw] min-w-[22px] min-h-[22px] text-[#5551FF]" />
                    </div>

                    {/* Title & Description */}
                    <h1 className="text-[1.2vw] min-text-[18px] font-extrabold text-slate-900 tracking-tight">Invited Access Only</h1>
                    <p className="text-[0.72vw] text-slate-500 font-normal mt-[0.3vw] leading-relaxed max-w-[90%] mx-auto">
                        This flipbook is restricted to invited readers. Please log in with your invited email address to view this book.
                    </p>

                    {/* Buttons */}
                    <div className="mt-[1.2vw] space-y-[0.6vw]">
                        <button
                            onClick={() => navigate(`/?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                            className="w-full bg-black hover:bg-gray-900 active:scale-[0.99] text-white py-[0.55vw] rounded-[0.5vw] text-[0.78vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-[0.4vw]"
                        >
                            <Icon icon="lucide:log-in" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px]" />
                            <span>Log In to Access</span>
                        </button>

                        <button
                            onClick={() => navigate(`/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                            className="w-full bg-white border border-gray-300 text-slate-800 hover:bg-gray-50 active:scale-[0.99] py-[0.55vw] rounded-[0.5vw] text-[0.78vw] font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-[0.4vw]"
                        >
                            <Icon icon="lucide:user-plus" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px]" />
                            <span>Sign Up to Access</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error || !bookData) return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <div className="relative z-10 w-full max-w-[40vw] px-[2vw] text-center">
                <div className="inline-flex items-center justify-center p-[0.75vw] mb-[2.5vw] rounded-[1vw] bg-slate-50 border border-slate-100 shadow-sm">
                    {error && error.toLowerCase().includes('time expired') ? (
                        <Clock className="w-[2.5vw] h-[2.5vw] text-red-500" strokeWidth={1.5} />
                    ) : error && (error === "This flipbook is private." || error.toLowerCase().includes('private')) ? (
                        <Icon icon="lucide:lock" className="w-[2.5vw] h-[2.5vw] text-slate-800" />
                    ) : error && error.toLowerCase().includes('published') ? (
                        <Icon icon="lucide:eye-off" className="w-[2.5vw] h-[2.5vw] text-slate-800" />
                    ) : (
                        <Ghost className="w-[2.5vw] h-[2.5vw] text-slate-900" strokeWidth={1.5} />
                    )}
                </div>

                <div className="space-y-[1.5vw]">
                    <div className="space-y-[0.5vw]">
                        <p className="text-[0.875vw] font-bold tracking-[0.2em] uppercase text-slate-400">
                            {error && error.toLowerCase().includes('time expired') 
                              ? "Access Expired" 
                              : error && (error === "This flipbook is private." || error.toLowerCase().includes('private'))
                              ? "Access Denied" 
                              : error && error.toLowerCase().includes('published')
                              ? "Unpublished"
                              : "Error 404"}
                        </p>
                        <h1 className="text-[3.5vw] font-extrabold tracking-tight text-slate-900 leading-tight">
                            {error && error.toLowerCase().includes('time expired')
                              ? "Access Expired" 
                              : error && (error === "This flipbook is private." || error.toLowerCase().includes('private'))
                              ? "This Flipbook is Private" 
                              : error && error.toLowerCase().includes('published')
                              ? "This Flipbook is Not Yet Published"
                              : error || "Flipbook Not Found"}
                        </h1>
                    </div>

                    <p className="text-[1.125vw] text-slate-500 leading-relaxed max-w-[30vw] mx-auto">
                        {error && error.toLowerCase().includes('time expired')
                          ? "The access time granted for this flipbook has expired. Please ask the owner to grant you a new invitation."
                          : error && (error === "This flipbook is private." || error.toLowerCase().includes('private'))
                          ? "This flipbook has been set to private by its owner and is not accessible to public readers."
                          : error && error.toLowerCase().includes('published')
                          ? "This flipbook has not been published by its creator yet. Please check back later."
                          : "Sorry, we couldn't find the flipbook you're looking for. It might have been deleted or the link is invalid."}
                    </p>
                </div>

                <div className="mt-[3vw] flex flex-col sm:flex-row items-center justify-center gap-[1vw]">
                    {/* Try Again — only for non-permanent errors (network/server issues) */}
                    {error && !error.toLowerCase().includes('private') && !error.toLowerCase().includes('expired') && !error.toLowerCase().includes('published') && !error.toLowerCase().includes('not found') && (
                        <button
                            onClick={() => window.location.reload()}
                            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-[#4A3AFF] text-white font-semibold rounded-full hover:bg-[#3a2aef] transition-all duration-300 shadow-xl shadow-indigo-200 active:scale-95 overflow-hidden text-[1vw]"
                        >
                            <span>Try Again</span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/home')}
                        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-slate-950 text-white font-semibold rounded-full hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 overflow-hidden text-[1vw]"
                    >
                        <Home className="w-[1.25vw] h-[1.25vw]" />
                        <span>Back to Home</span>
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-white text-slate-600 font-semibold rounded-full border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 active:scale-95 text-[1vw]"
                    >
                        <ArrowLeft className="w-[1.25vw] h-[1.25vw] transition-transform group-hover:-translate-x-[0.25vw]" />
                        <span>Go back</span>
                    </button>
                </div>

                <div className="mt-[6vw] pt-[3vw] border-t border-slate-100">
                    <div className="flex flex-col items-center gap-[1vw]">
                        <div className="flex items-center gap-[0.5vw] text-slate-400">
                            <span className="text-[0.75vw] font-semibold uppercase tracking-widest text-slate-300">Navigation Error</span>
                        </div>
                        <p className="text-[0.75vw] text-slate-400">
                            © 2026 Fisto IDC. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!bookData.pages || bookData.pages.length === 0) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                <div className="relative z-10 w-full max-w-[40vw] px-[2vw] text-center">
                    <div className="inline-flex items-center justify-center p-[0.75vw] mb-[2.5vw] rounded-[1vw] bg-amber-50 border border-amber-100 shadow-sm">
                        <BookOpen className="w-[2.5vw] h-[2.5vw] text-amber-600" strokeWidth={1.5} />
                    </div>

                    <div className="space-y-[1.5vw]">
                        <div className="space-y-[0.5vw]">
                            <p className="text-[0.875vw] font-bold tracking-[0.2em] uppercase text-amber-500">
                                Empty Book
                            </p>
                            <h1 className="text-[3.5vw] font-extrabold tracking-tight text-slate-900 leading-tight">
                                No pages found.
                            </h1>
                        </div>

                        <p className="text-[1.125vw] text-slate-500 leading-relaxed max-w-[30vw] mx-auto">
                            This flipbook doesn't have any pages yet. Please check back later.
                        </p>
                    </div>

                    <div className="mt-[3vw] flex justify-center">
                        <button
                            onClick={() => navigate('/home')}
                            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-slate-950 text-white font-semibold rounded-full hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 overflow-hidden text-[1vw]"
                        >
                            <Home className="w-[1.25vw] h-[1.25vw]" />
                            <span>Back to Home</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-screen w-screen overflow-hidden bg-white flex flex-col"
            style={varsObject}
        >
            <style>{`:root { ${layoutColorVars} }`}</style>
            <FlipbookPreview
                pages={bookData.pages}
                pageName={bookData.meta?.flipbookName || 'Untitled Flipbook'}
                settings={{ ...(bookData.meta || {}), ...settings }}
                isMobile={isMobileDevice}
                onClose={null}
                baseUrl={bookData.meta?.baseUrl ? `${getBackendUrl()}${bookData.meta.baseUrl}` : null}
                v_id={shareId || bookData?.v_id}
                isPublishedPreview={true}
                isLoadingParent={false}
            />
        </div>
    );

};

export default ShareViewBook;
