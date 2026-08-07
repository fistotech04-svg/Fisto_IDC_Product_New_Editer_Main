import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { LAYOUT_DEFAULT_COLORS } from '../components/CustomizedEditor/Layout';
import { Icon } from '@iconify/react';
import { Ghost, ArrowLeft, Home, BookOpen } from 'lucide-react';
import { resolveUploadsPath, rewriteHtmlUploadsToSupabase } from '../utils/supabaseUtils';

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

    // Get current logged-in user email
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserEmail = user?.emailId || user?.email || '';

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

    // Prepare settings fallback
    const settings = React.useMemo(() => {
        const baseSettings = bookData?.settings || {};
        const searchParams = new URLSearchParams(location.search);
        const queryLayout = searchParams.get('layout');
        if (queryLayout && !isNaN(Number(queryLayout))) {
            return {
                ...baseSettings,
                layout: Number(queryLayout)
            };
        }
        return baseSettings;
    }, [bookData?.settings, location.search]);

    const layoutColorVars = React.useMemo(() => {
        if (!bookData) return '';
        const activeIdx = Number(settings?.layout) || 1;
        const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || [];
        const saved = settings?.layoutColors?.[activeIdx] || [];

        const mergedColors = defaults.map((c) => {
            const savedItem = saved.find(s => s && s.id === c.id);
            return {
                ...c,
                ...(savedItem ? savedItem : {})
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
    }, [bookData, settings?.layout, settings?.layoutColors]);

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

                // Handle access control statuses
                if (status === 401 || errData.isPasswordProtected) {
                    setAccessMode('password');
                    setError(null);
                    setLoading(false);
                    return;
                }

                if (status === 403) {
                    if (errData.isInviteOnly) {
                        if (!currentUserEmail) {
                            setAccessMode('login');
                            setError(null);
                            setLoading(false);
                            return;
                        } else {
                            setError("This flipbook is private. Your email is not authorized to access this book.");
                            setLoading(false);
                            return;
                        }
                    }
                    setError("This flipbook is private.");
                } else if (status === 404) {
                    setError("Flipbook not found.");
                } else {
                    setError("Flipbook not found or private.");
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
            setPasswordError("Please enter your password or access key.");
            return;
        }
        setPasswordError('');
        setIsSubmittingPassword(true);
        try {
            const backendUrl = getBackendUrl();
            const params = {
                password: passwordInput.trim(),
                accessKey: passwordInput.trim()
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
            setPasswordError(err.response?.data?.message || "Invalid Password or Access Key.");
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen flex-col gap-4 items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A3AFF]"></div>
            {retryAttempt > 0 && (
                <p className="text-sm text-slate-400 animate-pulse">
                    Connecting… (attempt {retryAttempt + 1} of 4)
                </p>
            )}
        </div>
    );

    if (accessMode === 'password') return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 font-sans p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-[#eaebf7] flex items-center justify-center mx-auto mb-4 border border-[#5551FF]/20">
                    <Icon icon="lucide:lock" className="w-7 h-7 text-[#5551FF]" />
                </div>
                
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Protected Flipbook</h1>
                    <p className="text-sm text-slate-500 font-normal">
                        Enter the password or access key to view this flipbook.
                    </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 block">Password or Access Key</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    if (passwordError) setPasswordError('');
                                }}
                                placeholder="Enter key..."
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-10 shadow-xs"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <Icon icon={showPassword ? "lucide:eye" : "lucide:eye-off"} className="w-4 h-4" />
                            </button>
                        </div>
                        {passwordError && (
                            <p className="text-xs text-red-500 font-medium pt-0.5">{passwordError}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmittingPassword}
                        className="w-full bg-[#5551FF] hover:bg-[#4338ca] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                        {isSubmittingPassword ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <Icon icon="lucide:key-round" className="w-4 h-4" />
                                <span>Unlock Flipbook</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );

    if (accessMode === 'login') return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 font-sans p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-[#eaebf7] flex items-center justify-center mx-auto mb-4 border border-[#5551FF]/20">
                    <Icon icon="lucide:user-check" className="w-7 h-7 text-[#5551FF]" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invited Access Only</h1>
                <p className="text-sm text-slate-500 font-normal mt-2 leading-relaxed">
                    This flipbook is restricted to invited readers. Please log in with your invited email address to view this book.
                </p>

                <div className="mt-7 space-y-3">
                    <button
                        onClick={() => navigate(`/?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                        className="w-full bg-[#5551FF] hover:bg-[#4338ca] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Icon icon="lucide:log-in" className="w-4 h-4" />
                        <span>Log In to Access</span>
                    </button>

                    <button
                        onClick={() => navigate(`/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                        className="w-full bg-white border border-[#5551FF] text-[#5551FF] hover:bg-[#eaebf7] py-3 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Icon icon="lucide:user-plus" className="w-4 h-4" />
                        <span>Sign Up to Access</span>
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );

    if (error || !bookData) return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <div className="relative z-10 w-full max-w-[40vw] px-[2vw] text-center">
                <div className="inline-flex items-center justify-center p-[0.75vw] mb-[2.5vw] rounded-[1vw] bg-slate-50 border border-slate-100 shadow-sm">
                    <Ghost className="w-[2.5vw] h-[2.5vw] text-slate-900" strokeWidth={1.5} />
                </div>

                <div className="space-y-[1.5vw]">
                    <div className="space-y-[0.5vw]">
                        <p className="text-[0.875vw] font-bold tracking-[0.2em] uppercase text-slate-400">
                            {error === "This flipbook is private." ? "Access Denied" : "Error 404"}
                        </p>
                        <h1 className="text-[3.5vw] font-extrabold tracking-tight text-slate-900 leading-tight">
                            {error || "Flipbook not found."}
                        </h1>
                    </div>

                    <p className="text-[1.125vw] text-slate-500 leading-relaxed max-w-[30vw] mx-auto">
                        Sorry, we couldn't find the flipbook you're looking for. It might have been moved, deleted, or set to private.
                    </p>
                </div>

                <div className="mt-[3vw] flex flex-col sm:flex-row items-center justify-center gap-[1vw]">
                    {/* Try Again — only for non-403/404 errors (i.e., network/server issues) */}
                    {error !== "This flipbook is private." && error !== "Flipbook not found." && (
                        <button
                            onClick={() => window.location.reload()}
                            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-[#4A3AFF] text-white font-semibold rounded-full hover:bg-[#3a2aef] transition-all duration-300 shadow-xl shadow-indigo-200 active:scale-95 overflow-hidden text-[1vw]"
                        >
                            <span>Try Again</span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/')}
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
                            onClick={() => navigate('/')}
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

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
                isPublishedPreview={true}
            />
        </div>
    );

};

export default ShareViewBook;
