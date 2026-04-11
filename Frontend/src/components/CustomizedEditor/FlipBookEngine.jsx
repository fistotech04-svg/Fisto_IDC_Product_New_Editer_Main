/**
 * FlipBookEngine.jsx
 * ─────────────────────────────────────────────────────────────
External dependencies (served from /public/lib/ — no CDN needed):
 *   /lib/jquery.min.js
 *   /lib/turn.min.js
 */

import React, {
    useRef,
    useEffect,
    useCallback,
    useState,
    forwardRef,
    useImperativeHandle,
    useMemo,
} from 'react';
import HTMLFlipBook from 'react-pageflip';

/* ─────────────────────────────── helpers ─────────────────────────────── */

const buildPageDoc = (rawHtml) => `<!DOCTYPE html>
<html>
<head>
<style>
  html, body {
    margin:0; padding:0; overflow:hidden; background:transparent; width:100%; height:100%;
    backface-visibility: hidden !important;
    -webkit-backface-visibility: hidden !important;
  }
  * { box-sizing: border-box; }
  svg { width: 100% !important; height: 100% !important; display: block !important; }
</style>
</head>
<body>${rawHtml || ''}</body>
</html>`;

const loadScript = (src) =>
    new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });

/* ─────────────────────────────── component ─────────────────────────────── */

const getSvgBackground = (html) => {
    if (!html) return 'transparent';
    const match = html.match(/data-name="Overlay"[^>]*fill="([^"]+)"/);
    if (match && match[1]) return match[1];
    return '#ffffff';
};

const FlipBookEngine = forwardRef(function FlipBookEngine(
    {
        pages = [],
        width = 400,
        height = 566,
        flipTime = 5,
        hardCovers = false,
        startPage = 0,
        onFlip,
        autoplay = false,
        autoplayDuration = 3000,
        useMouseEvents = true,
        cornerEnable = true,
        makeFirstLastPageHard = false,
        selectCustomHardPages = false,
        customHardPages = [],
        cornerRadius = '0px',
        style = {},
        className = '',
        buildPageDoc: externalBuildPageDoc = (html, pageNum) => buildPageDoc(html, pageNum),
        activeLayout,
        flipStyle,
        textureStyle,
    },
    ref
) {
    const bookEl           = useRef(null);   // DOM node for turn.js
    const reactFlipRef     = useRef(null);   // ref for react-pageflip
    const onFlipRef        = useRef(onFlip); // always-current onFlip — avoids stale closure in turn.js
    const [ready, setReady]           = useState(false);
    const [currentPage, setCurrentPage] = useState(startPage);

    // Keep the ref in sync every render so turn.js always calls the latest onFlip
    useEffect(() => { onFlipRef.current = onFlip; }, [onFlip]);

    /* ── Engine-selection logic ── */
    // useFullTurnJs = true → soft-cover mode (turn.js handles every page)
    // useFullTurnJs = false → hard-cover mode (react-pageflip handles every page)
    const useFullTurnJs = !hardCovers;

    const showingTurnJs    = ready && useFullTurnJs;
    const showingReactFlip = ready && !useFullTurnJs;

    /* ── Memoize pages for react-pageflip to prevent iframe reloads ── */
    const memoizedReactPages = useMemo(() => pages.map((page, i) => {
        let isHardPage = false;
        
        if (makeFirstLastPageHard) {
            if (i === 0) isHardPage = true;
            if (i === pages.length - 1) isHardPage = true;
            if (i === pages.length - 2 && pages[i+1]?.isPad) isHardPage = true;
        }
        
        if (selectCustomHardPages) {
            if ((customHardPages || []).includes(i)) isHardPage = true;
            // Pad after a custom hard page
            if (page.isPad && i > 0 && (customHardPages || []).includes(i - 1)) isHardPage = true;
        }

        if (!makeFirstLastPageHard && !selectCustomHardPages && hardCovers) {
            if (i === 0 || i === pages.length - 1) isHardPage = true;
            if (i === pages.length - 2 && pages[i+1]?.isPad) isHardPage = true;
        }

        let startX = 0;
        let startY = 0;

        return (
            <div
                key={i}
                data-density={isHardPage ? 'hard' : 'soft'}
                className={`fbe-react-page fbe-react-page--${i % 2 === 0 ? 'right' : 'left'}`}
                style={{ 
                    backgroundColor: page.isPad ? 'transparent' : getSvgBackground(page.html || page.content),
                }}
            >
                {!page.isPad && (
                    <>
                        <iframe
                            title={`Page ${i + 1}`}
                            srcDoc={(externalBuildPageDoc || buildPageDoc)(page.html || page.content || '', i + 1)}
                            style={{ border: 'none', width: 'calc(100% / 0.67)', height: 'calc(100% / 0.67)', transform: 'scale(0.67)', transformOrigin: 'top left', pointerEvents: 'none', borderRadius: 'inherit' }}
                        />
                        {textureStyle && (textureStyle.backgroundImage !== 'none' || textureStyle.backgroundColor) && (
                            <div 
                                className="absolute inset-0 z-10 pointer-events-none" 
                                style={{
                                    ...textureStyle,
                                    borderRadius: 'inherit'
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }), [pages, makeFirstLastPageHard, selectCustomHardPages, customHardPages, hardCovers, externalBuildPageDoc, cornerRadius, textureStyle]);

    /* ── Load Scripts from local /public/lib/ (no CDN) ── */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!window.jQuery) {
                    await loadScript('/lib/jquery.min.js');
                    // Force global availability for legacy plugins
                    window.jQuery = window.jQuery || window.$;
                    if (window.jQuery) window.$ = window.jQuery;
                }
                
                if (!window.jQuery?.fn?.turn) {
                    await loadScript('/lib/turn.min.js');
                }
                
                if (alive) setReady(true);
            } catch (err) {
                console.error('[FlipBookEngine] Script load failed:', err);
            }
        })();
        return () => { alive = false; };
    }, []);

    /* ── Turn.js — "sheet" paper-curl for COVER PAGES only ── */
    useEffect(() => {
        if (!ready || !bookEl.current || !pages.length || !window.jQuery?.fn?.turn || !useFullTurnJs) return;

        const $ = window.jQuery;
        const $book = $(bookEl.current);

        // ── Teardown: destroy old instance AND flush jQuery data ──────────
        // Without removeData(), stale $.data('turn.turn') causes widgetInterface
        // to treat the options object as a method name → TypeError on .apply().
        try { $book.turn('destroy'); } catch (_) { /* noop */ }
        $book.removeData();   // wipe 'turn.turn' key so next init is always fresh
        $book.empty();

        // turn.js requires an even page count in double-display mode
        const augmented = [...pages];
        if (augmented.length % 2 !== 0) augmented.push({ isPad: true });

        // Build page DOM elements
        augmented.forEach((page, i) => {
            const pageDiv = document.createElement('div');

            // Determine if this specific page should be hard
            let isPageHard = false;
            
            // 1. First & Last (Covers)
            if (makeFirstLastPageHard) {
                if (i === 0) isPageHard = true;
                if (i === augmented.length - 1) isPageHard = true;
                if (i === augmented.length - 2 && augmented[i+1]?.isPad) isPageHard = true;
            }
            
            // 2. Custom selected pages
            if (selectCustomHardPages) {
                if ((customHardPages || []).some(hp => Number(hp) === i)) isPageHard = true;
                if (page.isPad && i > 0 && (customHardPages || []).some(hp => Number(hp) === i - 1)) {
                    isPageHard = true;
                }
            }

            // 3. Fallback for master toggle
            if (!makeFirstLastPageHard && !selectCustomHardPages && hardCovers) {
                if (i === 0) isPageHard = true;
                if (i === augmented.length - 1) isPageHard = true;
                if (i === augmented.length - 2 && augmented[i+1]?.isPad) isPageHard = true;
            }

            // [LOG] Debug hard page detection
            if (isPageHard) console.log(`[FlipBookEngine] Page ${i + 1} is HARD`);

            // In turn.js, the "hard" class creates a rigid, non-curling fold. 
            // We use both 'hard' and 'cover' for maximum compatibility with custom patches.
            const bgColor = getSvgBackground(page.html || page.content);

            if (isPageHard) {
                pageDiv.className = 'hard cover fbe-page';
                pageDiv.setAttribute('data-density', 'hard');
                pageDiv.style.backgroundColor = bgColor !== 'transparent' ? bgColor : '#ffffff';
                pageDiv.style.borderRadius = i % 2 === 0 ? `0 ${cornerRadius} ${cornerRadius} 0` : `${cornerRadius} 0 0 ${cornerRadius}`;
                pageDiv.style.transition = 'border-radius 0.5s ease';
            } else {
                pageDiv.className = 'fbe-page fbe-page--soft';
                pageDiv.style.backgroundColor = bgColor !== 'transparent' ? bgColor : '#ffffff';
                pageDiv.style.borderRadius = i % 2 === 0 ? `0 ${cornerRadius} ${cornerRadius} 0` : `${cornerRadius} 0 0 ${cornerRadius}`;
                pageDiv.style.transition = 'border-radius 0.5s ease';
            }

            if (!page.isPad) {
                const inner = document.createElement('div');
                inner.className = 'fbe-inner';
                // Add backface visibility hidden to inner to prevent shearing during 3D flip
                inner.style.webkitBackfaceVisibility = 'hidden';
                inner.style.backfaceVisibility = 'hidden';
                inner.style.position = 'relative';

                const svgContent = page.html || page.content || '';
                
                // For turn.js we use a pure DOM wrapper to prevent iframe clone restarting and ghosting
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = svgContent;
                contentDiv.style.cssText = 'position:absolute;top:0;left:0;border:none;width:calc(100% / 0.67);height:calc(100% / 0.67);transform:scale(0.67);transform-origin:top left;pointer-events:none;z-index:1;background:transparent;';
                
                // Ensure SVG fits perfectly
                const svgNode = contentDiv.querySelector('svg');
                if (svgNode) {
                    svgNode.style.cssText = 'width: 100% !important; height: 100% !important; display: block !important;';
                }
                
                inner.appendChild(contentDiv);

                // Add texture overlay
                if (textureStyle && (textureStyle.backgroundImage !== 'none' || textureStyle.backgroundColor)) {
                    const textureOverlay = document.createElement('div');
                    textureOverlay.className = 'fbe-texture-overlay';
                    Object.assign(textureOverlay.style, {
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        borderRadius: 'inherit',
                        ...textureStyle
                    });
                    inner.appendChild(textureOverlay);
                }

                pageDiv.appendChild(inner);
            } else {
                // Invisible pad page
                pageDiv.style.cssText = 'opacity:0;pointer-events:none;background:transparent;';
            }

            $book.append(pageDiv);
        });

        // ── Initialize turn.js ──────────────────────────────────────────
        const totalPages = augmented.length;

        const initPage = Math.max(1, currentPage + 1);

        $book.turn({
            width        : width * 2,
            height,
            display      : 'double',
            duration     : flipTime,
            acceleration : flipStyle === 'Smooth Flip' || flipStyle === '3D Flip',
            gradients    : true,
            elevation    : flipStyle === '3D Flip' ? 80 : 10,
            // Generous corner hot-zone so the peel starts easily
            hoverAreaSize  : flipStyle === 'Page Curl' ? 250 : 150,
            cornerPosition : '60px 30px',
            turnCorners    : 'l,r',     // peel allowed on both sides
            pages          : totalPages,
            page           : initPage,
            autoCenter     : false,
            when: {
                turned: (_e, turnPage) => {
                    const logical = turnPage - 1;
                    setCurrentPage(logical);
                    // Use the ref so we always call the latest onFlip from PreviewArea
                    if (onFlipRef.current) onFlipRef.current({ data: logical });
                },
            },
        });

        if (!useMouseEvents) $book.turn('disable', true);

        return () => {
            try { $book.turn('destroy'); } catch (_) { /* noop */ }
        };
    // onFlip intentionally excluded — it's captured in the closure correctly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, pages, width, height, flipTime, flipStyle, useFullTurnJs, useMouseEvents, externalBuildPageDoc, makeFirstLastPageHard, selectCustomHardPages, customHardPages, cornerRadius, textureStyle, startPage]);

    /* ── Imperative API (exposed via ref) ── */
    const flipNextFn = useCallback(() => {
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('next');
        } else if (showingReactFlip && reactFlipRef.current) {
            reactFlipRef.current.pageFlip().flipNext();
        }
    }, [showingTurnJs, showingReactFlip]);

    const flipPrevFn = useCallback(() => {
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('previous');
        } else if (showingReactFlip && reactFlipRef.current) {
            reactFlipRef.current.pageFlip().flipPrev();
        }
    }, [showingTurnJs, showingReactFlip]);

    const flipToPageFn = useCallback((idx) => {
        if (showingTurnJs && bookEl.current && window.jQuery) {
            const $book = window.jQuery(bookEl.current);
            if ($book.data('turn')) {
                $book.turn('page', idx + 1);
            }
        } else if (reactFlipRef.current) {
            reactFlipRef.current.pageFlip().turnToPage(idx);
        }
    }, [showingTurnJs]);

    useImperativeHandle(ref, () => ({
        flipNext : flipNextFn,
        flipPrev : flipPrevFn,
        flipToPage: flipToPageFn,
        getCurrentPageIndex: () => currentPage,
        pageFlip: () => ({
            flipNext  : flipNextFn,
            flipPrev  : flipPrevFn,
            turnToPage: flipToPageFn,
            getCurrentPageIndex: () => currentPage + 1,
        }),
    }), [flipNextFn, flipPrevFn, flipToPageFn, currentPage]);

    /* ── Sync turn.js when currentPage changes externally ── */
    useEffect(() => {
        if (!showingTurnJs || !bookEl.current || !window.jQuery) return;
        const $book = window.jQuery(bookEl.current);
        if ($book.data('turn')) {
            const wantedPage = currentPage + 1;
            if ($book.turn('page') !== wantedPage) {
                $book.turn('page', wantedPage);
            }
        }
    }, [currentPage, showingTurnJs]);

    /* ── Autoplay ── */
    useEffect(() => {
        if (!autoplay || !ready) return;
        const timer = setInterval(flipNextFn, autoplayDuration);
        return () => clearInterval(timer);
    }, [autoplay, autoplayDuration, ready, flipNextFn]);

    /* ── Sync current page when startPage changes externally ── */
    useEffect(() => {
        if (pages.length > 0 && currentPage !== startPage) {
            setCurrentPage(startPage);
            if (showingTurnJs && bookEl.current && window.jQuery) {
                const $book = window.jQuery(bookEl.current);
                if ($book.data('turn')) {
                    $book.turn('page', startPage + 1);
                }
            }
        }
    }, [startPage, pages.length, showingTurnJs]);

    const bookTransition = `transform ${flipTime}ms ease`;

    /* ── Render ── */
    return (
        <div
            className={`fbe-wrapper ${className}`}
            style={{
                width: width * 2, height, position: 'relative',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...style,
            }}
        >
            {/* Loading indicator */}
            {!ready && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7', color: '#999', fontSize: '13px', zIndex: 10 }}>
                    Loading FlipBook…
                </div>
            )}

            {/* ── TURN.JS ENGINE — centering wrapper ── */}
            <div
                style={{
                    width     : width * 2,
                    height,
                    position  : 'relative',
                    transition: bookTransition,
                    visibility   : showingTurnJs ? 'visible' : 'hidden',
                    pointerEvents: showingTurnJs ? 'auto'    : 'none',
                    zIndex       : showingTurnJs ? 5         : 1,
                }}
            >
                {/* turn.js mounts pages directly inside this div — keep styles minimal */}
                <div
                    ref={bookEl}
                    className="fbe-book"
                    style={{
                        width     : width * 2,
                        height,
                        position  : 'relative',
                        background: 'transparent',
                    }}
                />
            </div>

            {/* ── REACT-PAGEFLIP ENGINE — handles hard-cover mode ── */}
            {showingReactFlip && (
                <div style={{
                    position  : 'absolute',
                    inset     : 0,
                    zIndex    : 100,
                    background: 'transparent',
                    transition: bookTransition,
                }}>
                    <HTMLFlipBook
                        key={Number(activeLayout) === 1 ? `react-flip-${width}-${height}` : 'react-flip'}
                        ref={reactFlipRef}
                        width={width} height={height} size={Number(activeLayout) === 1 ? 'fixed' : 'stretch'}
                        minWidth={width} maxWidth={width * 2}
                        minHeight={height} maxHeight={height}
                        drawShadow={flipStyle !== 'Fast Flip'}
                        useMouseEvents={useMouseEvents}
                        flippingTime={flipTime}
                        startPage={Number(activeLayout) === 1 ? currentPage : startPage}
                        showCover={true}
                        autoCenter={false}
                        clickEventForward={true}
                        style={{ background: 'transparent' }}
                        onFlip={(e) => {
                            const logical = e.data;
                            setCurrentPage(logical);
                            if (onFlipRef.current) onFlipRef.current({ data: logical });
                        }}
                    >
                        {memoizedReactPages}
                    </HTMLFlipBook>
                </div>
            )}

            {/* Page styles */}
            {cornerEnable && (
                <style>{`
                    .fbe-page { background: transparent; overflow: hidden; margin: 0; padding: 0; -webkit-transform: translate3d(0,0,0); box-shadow: none !important; border: none !important; outline: none !important; }
                    .fbe-inner { width: 100%; height: 100%; overflow: hidden; background: transparent; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
                    .turn-page { box-shadow: none !important; border: none !important; outline: none !important; }
                    
                    /* React-pageflip specific classes */
                    .fbe-react-page {
                        width: 100%;
                        height: 100%;
                        overflow: hidden !important;
                        transition: border-radius 0.5s ease;
                        -webkit-transform: translateZ(0);
                    }
                    .fbe-react-page--left {
                        border-radius: ${cornerRadius} 0 0 ${cornerRadius} !important;
                    }
                    .fbe-react-page--right {
                        border-radius: 0 ${cornerRadius} ${cornerRadius} 0 !important;
                    }
                    
                    /* Force turn.js hard pages to remain rigid and hide internal peel gradients */
                    .hard, .turn-page.hard, .cover { 
                        background-color: #fff !important; 
                        box-shadow: none !important;
                        -webkit-transform-style: preserve-3d !important;
                        transform-style: preserve-3d !important;
                    }
                    .hard .fbe-inner, .cover .fbe-inner {
                        backface-visibility: hidden !important;
                        -webkit-backface-visibility: hidden !important;
                    }
                    /* Remove any shadow/peel effects globally */
                    .p-shadow, .p-gradient, .p-shadow-left, .p-shadow-right, .hard .p-shadow, .hard .p-gradient, .cover .p-shadow, .cover .p-gradient {
                        display: none !important;
                    }
                `}</style>
            )}
        </div>
    );
});

const MemoizedFlipBookEngine = React.memo(FlipBookEngine);

export default MemoizedFlipBookEngine;
