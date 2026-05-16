import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { LAYOUT_DEFAULT_COLORS } from '../components/CustomizedEditor/Layout';
import { Icon } from '@iconify/react';
import { Ghost, ArrowLeft, Home, BookOpen } from 'lucide-react';

const ShareViewBook = () => {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryAttempt, setRetryAttempt] = useState(0);

    // Prepare settings fallback
    const settings = bookData?.settings || {};

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

        const fetchBook = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                console.log(`Fetching public flipbook: ${shareId} (Attempt ${retryCount + 1}/${maxRetries + 1})`);
                
                const res = await axios.get(`${backendUrl}/api/flipbook/public/get/${shareId}`, {
                    timeout: 15000 // 15s timeout for slow connections
                });
                
                if (cancelled) return;

                let processedData = res.data;
                
                if (!processedData || !processedData.pages || processedData.pages.length === 0) {
                    throw new Error("Invalid or empty flipbook data received");
                }

                const bUrl = processedData.meta?.baseUrl
                    ? `${backendUrl}${processedData.meta.baseUrl}`
                    : '';
                
                if (processedData.pages && bUrl) {
                    processedData.pages = processedData.pages.map(p => {
                        let html = p.html || p.content || '';
                        // Fix nullassets paths
                        if (html.includes('nullassets/')) {
                            html = html.split('nullassets/').join(`${bUrl}assets/`);
                        }
                        // Fix any bare /uploads/ relative paths to be absolute
                        if (html.includes('src="/uploads/') || html.includes("src='/uploads/")) {
                            html = html
                                .replace(/src="\/uploads\//g, `src="${backendUrl}/uploads/`)
                                .replace(/src='\/uploads\//g, `src='${backendUrl}/uploads/`);
                        }
                        return { ...p, html };
                    });
                }

                // Only update state if the component is still mounted
                setBookData(processedData);
                setError(null);
                setLoading(false); // ✅ Only stop loading on SUCCESS
            } catch (err) {
                if (cancelled) return;
                console.error(`Error fetching public flipbook (attempt ${retryCount + 1}):`, err);

                // Retry on network errors or 5xx server errors — keep loading=true
                const isRetryable = !err.response || err.response.status >= 500;
                if (retryCount < maxRetries && isRetryable) {
                    retryCount++;
                    setRetryAttempt(retryCount); // Show retry progress in UI
                    // Exponential back-off: 1s, 2s, 4s
                    const delay = Math.pow(2, retryCount - 1) * 1000;
                    console.log(`Retrying in ${delay}ms...`);
                    setTimeout(fetchBook, delay);
                    return; // ⬅️ Keep loading=true while retry is pending
                }

                // All retries exhausted — now show the error
                if (err.response?.status === 403) {
                    setError("This flipbook is private.");
                } else if (err.response?.status === 404) {
                    setError("Flipbook not found.");
                } else {
                    setError("Flipbook not found or private.");
                }
                setLoading(false); // ✅ Stop loading only after all retries fail
            }
        };

        if (shareId) fetchBook();

        return () => { cancelled = true; }; // Cleanup to prevent state updates after unmount
    }, [shareId]);

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
                settings={settings}
                isMobile={isMobileDevice}
                onClose={null} 
                baseUrl={bookData.meta?.baseUrl ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${bookData.meta.baseUrl}` : null}
            />
        </div>
    );

};

export default ShareViewBook;
