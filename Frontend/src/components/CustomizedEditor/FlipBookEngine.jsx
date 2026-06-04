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
    margin:0; padding:0; overflow:hidden; background:#fff; width:100%; height:100%;
    backface-visibility: hidden !important;
    -webkit-backface-visibility: hidden !important;
  }
  * { box-sizing: border-box; }
</style>
</head>
<body>${rawHtml || ''}</body>
</html>`;

const scriptPromises = {};

const loadScript = (src) => {
    if (scriptPromises[src]) {
        return scriptPromises[src];
    }

    scriptPromises[src] = new Promise((resolve, reject) => {
        // If another script tag exists somehow, we might need to wait for it, 
        // but since we manage it here, we'll just create it.
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => {
            delete scriptPromises[src];
            reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(s);
    });

    return scriptPromises[src];
};

/* ─────────────────────────────── component ─────────────────────────────── */

const FlipBookEngine = forwardRef(function FlipBookEngine(
    {
        pages = [],
        width = 400,
        height = 500,
        flipTime = 5,
        hardCovers = false,
        startPage = 0,
        onFlip,
        onTurning,
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
        pageOpacity,
        singlePage = false,
        hardCoverZoom,
    },
    ref
) {
    const bookEl = useRef(null);   // DOM node for turn.js
    const reactFlipRef = useRef(null);   // ref for react-pageflip
    const onFlipRef = useRef(onFlip); // always-current onFlip — avoids stale closure in turn.js
    const onTurningRef = useRef(onTurning);
    const [ready, setReady] = useState(false);
    const [currentPage, setCurrentPage] = useState(startPage);

    // Keep the ref in sync every render so turn.js always calls the latest onFlip
    useEffect(() => { onFlipRef.current = onFlip; }, [onFlip]);
    useEffect(() => { onTurningRef.current = onTurning; }, [onTurning]);

    // The broken IFRAME_MOUSEMOVE listener was removed because it was blasting turn.js with invalid coordinates.

    /* ── Engine-selection logic ── */
    // useFullTurnJs = true → soft-cover mode (turn.js handles every page)
    // useFullTurnJs = false → hard-cover mode (react-pageflip handles every page)
    const useFullTurnJs = !hardCovers;

    const showingTurnJs = ready && useFullTurnJs;
    const showingReactFlip = ready && !useFullTurnJs;

    const augmentedPages = useMemo(() => {
        const arr = [...pages];
        if (!singlePage && arr.length % 2 !== 0) arr.push({ isPad: true });
        return arr;
    }, [pages, singlePage]);

    /* ── Memoize pages for react-pageflip to prevent iframe reloads ── */
    const memoizedReactPages = useMemo(() => augmentedPages.map((page, i) => {
        let isHardPage = false;

        if (makeFirstLastPageHard) {
            if (i === 0) isHardPage = true;
            if (!singlePage && i === 1) isHardPage = true;
            if (i === augmentedPages.length - 1) isHardPage = true;
            if (!singlePage && i === augmentedPages.length - 2) isHardPage = true;
        }

        if (selectCustomHardPages) {
            if ((customHardPages || []).includes(i)) isHardPage = true;
            // Pad after a custom hard page
            if (page.isPad && i > 0 && (customHardPages || []).includes(i - 1)) isHardPage = true;
        }

        if (!makeFirstLastPageHard && !selectCustomHardPages && hardCovers) {
            if (i === 0) isHardPage = true;
            if (!singlePage && i === 1) isHardPage = true;
            if (i === augmentedPages.length - 1) isHardPage = true;
            if (!singlePage && i === augmentedPages.length - 2) isHardPage = true;
        }

        let startX = 0;
        let startY = 0;

        return (
            <div
                key={i}
                data-density={isHardPage ? 'hard' : 'soft'}
                className={`fbe-react-page fbe-react-page--${i % 2 === 0 ? 'right' : 'left'} ${i === 0 ? 'fbe-page--first' : ''} ${(i === augmentedPages.length - 1 || (i === augmentedPages.length - 2 && augmentedPages[i + 1]?.isPad)) ? 'fbe-page--last' : ''}`}
                style={{
                    backgroundColor: page.isPad ? 'transparent' : '#fff',
                    opacity: pageOpacity
                }}
                onMouseDown={(e) => {
                    startX = e.clientX;
                    startY = e.clientY;
                }}
                onMouseUp={(e) => {
                    if (e.target.closest('.fbe-drag-overlay')) return;
                    const diffX = Math.abs(e.clientX - startX);
                    const diffY = Math.abs(e.clientY - startY);
                    if (diffX < 10 && diffY < 10) {
                        e.stopPropagation();
                    }
                }}
                onClick={(e) => {
                    if (e.target.closest('.fbe-drag-overlay')) return;
                    e.stopPropagation();
                }}
            >
                {!page.isPad && (
                    <>
                        <iframe
                            title={`Page ${i + 1}`}
                            srcDoc={(externalBuildPageDoc || buildPageDoc)(page.html || page.content || '', i + 1)}
                            style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'auto', borderRadius: 'inherit' }}
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
                        <div
                            className="fbe-drag-overlay"
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                [i % 2 === 0 ? 'right' : 'left']: 0,
                                width: '10px',
                                zIndex: 20,
                                cursor: 'grab',
                                pointerEvents: 'auto'
                            }}
                        />
                    </>
                )}
            </div>
        );
    }), [augmentedPages, makeFirstLastPageHard, selectCustomHardPages, customHardPages, hardCovers, externalBuildPageDoc, cornerRadius, textureStyle]);

    /* ── Load Scripts from local /public/lib/ (no CDN) ── */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!window.jQuery) await loadScript('/lib/jquery.min.js');
                if (!window.jQuery?.fn?.turn) await loadScript('/lib/turn.min.js?v=3');
                if (alive) setReady(true);
            } catch (err) {
                console.error('[FlipBookEngine] Script load failed:', err);
            }
        })();

        // Global mouseup to cancel drag state
        const handleGlobalMouseUp = () => {
            document.querySelectorAll('.fbe-is-dragging').forEach(el => el.classList.remove('fbe-is-dragging'));
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);

        return () => {
            alive = false;
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, []);

    /* ── Turn.js — "sheet" paper-curl for COVER PAGES only ── */
    const pagesHash = React.useMemo(() => pages.map(p => p.html || p.content || '').join('|'), [pages]);

    useEffect(() => {
        if (!ready || !bookEl.current || !pages.length || !window.jQuery?.fn?.turn || !useFullTurnJs) return;

        const $ = window.jQuery;
        const $book = $(bookEl.current);

        // ── Teardown: destroy old instance AND flush jQuery data ──────────
        // Without removeData(), stale $.data('turn.turn') causes widgetInterface
        // to treat the options object as a method name → TypeError on .apply().
        try { 
            const oldData = $book.data();
            if (oldData && oldData.pages) {
                // Wipe the pages from the old instance to neutralize leaked document closures in turn.js v3
                for (let k in oldData.pages) delete oldData.pages[k];
            }
            $book.turn('destroy'); 
        } catch (_) { /* noop */ }
        $book.off();          // unbind leaked $book listeners
        $book.removeData();   // wipe 'turn.turn' key so next init is always fresh
        $book.empty();

        // turn.js requires an even page count in double-display mode
        const augmented = augmentedPages;

        // Build page DOM elements
        augmented.forEach((page, i) => {
            const pageDiv = document.createElement('div');

            // Determine if this specific page should be hard
            let isPageHard = false;

            // 1. First & Last (Covers)
            if (makeFirstLastPageHard) {
                if (i === 0) isPageHard = true;
                if (!singlePage && i === 1) isPageHard = true;
                if (i === augmented.length - 1) isPageHard = true;
                if (!singlePage && i === augmented.length - 2) isPageHard = true;
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
                if (!singlePage && i === 1) isPageHard = true;
                if (i === augmented.length - 1) isPageHard = true;
                if (!singlePage && i === augmented.length - 2) isPageHard = true;
            }

            // [LOG] Debug hard page detection
            if (isPageHard) console.log(`[FlipBookEngine] Page ${i + 1} is HARD`);

            // In turn.js, the "hard" class creates a rigid, non-curling fold. 
            // We use both 'hard' and 'cover' for maximum compatibility with custom patches.
            const isFirst = i === 0;
            const isLast = i === augmented.length - 1 || (i === augmented.length - 2 && augmented[i + 1]?.isPad);
            const positionClass = `${isFirst ? 'fbe-page--first' : ''} ${isLast ? 'fbe-page--last' : ''}`.trim();

            if (isPageHard) {
                pageDiv.className = `hard cover fbe-page ${i % 2 === 0 ? 'fbe-page--right' : 'fbe-page--left'} ${positionClass}`;
                pageDiv.setAttribute('data-density', 'hard');
                pageDiv.style.backgroundColor = '#ffffff';
                pageDiv.style.borderRadius = i % 2 === 0 ? `0 ${cornerRadius} ${cornerRadius} 0` : `${cornerRadius} 0 0 ${cornerRadius}`;
                pageDiv.style.transition = 'border-radius 0.5s ease';
            } else {
                pageDiv.className = `fbe-page fbe-page--soft ${i % 2 === 0 ? 'fbe-page--right' : 'fbe-page--left'} ${positionClass}`;
                pageDiv.style.borderRadius = i % 2 === 0 ? `0 ${cornerRadius} ${cornerRadius} 0` : `${cornerRadius} 0 0 ${cornerRadius}`;
                pageDiv.style.transition = 'border-radius 0.5s ease';
            }

            if (!page.isPad) {
                const inner = document.createElement('div');
                inner.className = 'fbe-inner';

                const iframe = document.createElement('iframe');
                iframe.srcdoc = (externalBuildPageDoc || buildPageDoc)(page.html || page.content || '', i + 1);
                // Render scaled to fill exactly
                iframe.style.cssText = 'border:none;width:100%;height:100%;pointer-events:auto;';
                inner.appendChild(iframe);

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

                // Removed custom click-blocking logic to allow native turn.js behavior
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
            width: singlePage ? width : width * 2,
            height,
            display: singlePage ? 'single' : 'double',
            duration: flipTime,
            acceleration: flipStyle === 'Smooth Flip' || flipStyle === '3D Flip',
            gradients: true,
            cornerSize: Math.max(100, width / 2),
            elevation: flipStyle === '3D Flip' ? 80 : 10,
            pages: totalPages,
            page: initPage,
            autoCenter: false,
            when: {
                start: (e, pageObject, corner) => {
                    if (bookEl.current) bookEl.current.classList.add('fbe-is-dragging');
                    // Block the peel animation before it even starts if going to a pad page
                    if (corner === 'r' || corner === 'tr' || corner === 'br') {
                        const nextLogical = pageObject.page; // 1-based next page logical index
                        if (augmented[nextLogical] && augmented[nextLogical].isPad) {
                            e.preventDefault();
                        }
                    }
                },
                end: (e, pageObject, turned) => {
                    if (bookEl.current) bookEl.current.classList.remove('fbe-is-dragging');
                },
                turning: (e, turnPage) => {
                    const logical = turnPage - 1;

                    // Prevent turning to the pad page if the flipbook has an odd number of real pages
                    if (augmented[logical] && augmented[logical].isPad) {
                        e.preventDefault();
                        return false;
                    }

                    if (onTurningRef.current) onTurningRef.current({ data: logical });
                },
                turned: (_e, turnPage) => {
                    const logical = turnPage - 1;

                    // Safe-guard: if turn.js reaches the pad page despite our blocks,
                    // do NOT update the React state to this page, and force turn.js back.
                    if (augmented[logical] && augmented[logical].isPad) {
                        setTimeout(() => {
                            if (bookEl.current && window.jQuery) {
                                try { window.jQuery(bookEl.current).turn('page', turnPage - 2); } catch (e) { }
                            }
                        }, 0);
                        return;
                    }

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
    }, [ready, pagesHash, flipTime, flipStyle, useFullTurnJs, useMouseEvents, externalBuildPageDoc, makeFirstLastPageHard, selectCustomHardPages, customHardPages, cornerRadius, textureStyle]);

    /* ── Handle Window / Container Resize dynamically ── */
    useEffect(() => {
        if (ready && bookEl.current && window.jQuery?.fn?.turn && useFullTurnJs) {
            try {
                window.jQuery(bookEl.current).turn('size', singlePage ? width : width * 2, height);
            } catch (e) { /* ignore */ }
        }
    }, [width, height, singlePage, ready, useFullTurnJs]);

    /* ── Imperative API (exposed via ref) ── */
    const flipNextFn = useCallback(() => {
        // Block turning to the pad page if the original pages count is odd
        if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
            return;
        }

        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('next');
        } else if (showingReactFlip && reactFlipRef.current) {
            reactFlipRef.current.pageFlip().flipNext();
        }
    }, [showingTurnJs, showingReactFlip, pages.length, singlePage, currentPage]);

    const flipPrevFn = useCallback(() => {
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('previous');
        } else if (showingReactFlip && reactFlipRef.current) {
            reactFlipRef.current.pageFlip().flipPrev();
        }
    }, [showingTurnJs, showingReactFlip]);

    const flipToPageFn = useCallback((idx) => {
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('page', idx + 1);
        } else if (reactFlipRef.current) {
            reactFlipRef.current.pageFlip().turnToPage(idx);
        }
    }, [showingTurnJs]);

    useImperativeHandle(ref, () => ({
        flipNext: flipNextFn,
        flipPrev: flipPrevFn,
        flipToPage: flipToPageFn,
        getCurrentPageIndex: () => currentPage,
        pageFlip: () => ({
            flipNext: flipNextFn,
            flipPrev: flipPrevFn,
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

    /* ── Sync turn.js size when width/height change dynamically ── */
    useEffect(() => {
        if (!showingTurnJs || !bookEl.current || !window.jQuery) return;
        const $book = window.jQuery(bookEl.current);
        if ($book.data('turn')) {
            $book.turn('size', singlePage ? width : width * 2, height);
        }
    }, [width, height, singlePage, showingTurnJs]);

    /* ── Sync react-pageflip size when width/height change dynamically ── */
    useEffect(() => {
        if (!showingReactFlip || !reactFlipRef.current) return;
        const pageFlip = reactFlipRef.current.pageFlip();
        if (pageFlip && typeof pageFlip.update === 'function') {
            // In 'stretch' mode, calling update() forces it to read the new container size
            pageFlip.update();
        }
    }, [width, height, showingReactFlip]);

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

    /* ── Pass-through IFRAME Dragging ── */
    useEffect(() => {
        const handleMessage = (e) => {
            if (!e.data || !showingTurnJs || !window.jQuery) return;
            
            const $ = window.jQuery;
            
            const createJqEvent = (type, data) => {
                let clientX = data.originalClientX || 0;
                let clientY = data.originalClientY || 0;

                // Lookup the specific iframe using pageNumber to get its exact position in the parent window
                if (data.pageNumber && bookEl.current) {
                    const iframe = bookEl.current.querySelector(`.p${data.pageNumber} iframe`);
                    if (iframe) {
                        const rect = iframe.getBoundingClientRect();
                        clientX += rect.left;
                        clientY += rect.top;
                    }
                }

                const ev = $.Event(type);
                ev.clientX = clientX;
                ev.clientY = clientY;
                ev.pageX = clientX + window.scrollX;
                ev.pageY = clientY + window.scrollY;
                ev.originalEvent = {
                    touches: [{ pageX: ev.pageX, pageY: ev.pageY, clientX: ev.clientX, clientY: ev.clientY }],
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                return ev;
            };

            if (e.data.type === 'IFRAME_MOUSEDOWN') {
                if (bookEl.current) {
                    bookEl.current.classList.add('fbe-is-dragging');
                    $(bookEl.current).trigger(createJqEvent('mousedown', e.data));
                    $(bookEl.current).trigger(createJqEvent('touchstart', e.data));
                }
            } else if (e.data.type === 'IFRAME_MOUSEMOVE') {
                if (bookEl.current && bookEl.current.classList.contains('fbe-is-dragging')) {
                    $(document).trigger(createJqEvent('mousemove', e.data));
                    $(document).trigger(createJqEvent('touchmove', e.data));
                }
            } else if (e.data.type === 'IFRAME_MOUSEUP') {
                if (bookEl.current && bookEl.current.classList.contains('fbe-is-dragging')) {
                    bookEl.current.classList.remove('fbe-is-dragging');
                    $(document).trigger(createJqEvent('mouseup', e.data));
                    $(document).trigger(createJqEvent('touchend', e.data));
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [showingTurnJs]);

    const bookTransition = `transform ${flipTime}ms ease`;

    /* ── Render ── */
    return (
        <div
            className={`fbe-wrapper ${className}`}
            style={{
                width: singlePage ? width : width * 2, height, position: 'relative',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...style,
                opacity: pageOpacity ?? 1,
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
                    width: singlePage ? width : width * 2,
                    height,
                    position: 'relative',
                    transition: bookTransition,
                    visibility: showingTurnJs ? 'visible' : 'hidden',
                    pointerEvents: showingTurnJs ? 'auto' : 'none',
                    zIndex: showingTurnJs ? 5 : 1,
                }}
                onPointerDownCapture={(e) => {
                    if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        if (clickX > rect.width / 2) {
                            e.stopPropagation();
                        }
                    }
                }}
                onMouseDownCapture={(e) => {
                    if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        if (clickX > rect.width / 2) {
                            e.stopPropagation();
                        }
                    }
                }}
                onTouchStartCapture={(e) => {
                    if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2 && e.touches.length > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.touches[0].clientX - rect.left;
                        if (clickX > rect.width / 2) {
                            e.stopPropagation();
                        }
                    }
                }}
            >
                {/* turn.js mounts pages directly inside this div — keep styles minimal */}
                <div
                    ref={bookEl}
                    className="fbe-book"
                    style={{
                        width: singlePage ? width : width * 2,
                        height,
                        position: 'relative',
                        background: 'transparent',
                    }}
                />
            </div>

            {/* ── REACT-PAGEFLIP ENGINE — handles hard-cover mode ── */}
            {showingReactFlip && ( // wrapper for possible hard cover zoom
                <div style={hardCoverZoom ? { transform: `scale(${hardCoverZoom.scale})`, transformOrigin: '0 0' } : {}} className="fbe-react-wrapper">
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 100,
                        background: 'transparent',
                        transition: bookTransition,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <HTMLFlipBook
                            key={'react-flip'}
                            ref={reactFlipRef}
                            width={width} height={height} size={'stretch'}
                            minWidth={100} maxWidth={4000}
                            minHeight={100} maxHeight={4000}
                            drawShadow={flipStyle !== 'Fast Flip'}
                            useMouseEvents={useMouseEvents}
                            flippingTime={flipTime}
                            startPage={Number(activeLayout) === 1 ? currentPage : startPage}
                            showCover={true}
                            usePortrait={singlePage}
                            autoCenter={false}
                            clickEventForward={false} // Disable flipping on single click
                            onChangeState={(e) => {
                                const wrapper = document.querySelector('.fbe-react-wrapper');
                                if (wrapper) {
                                    if (e.data !== 'read') wrapper.classList.add('fbe-is-dragging');
                                    else wrapper.classList.remove('fbe-is-dragging');
                                }
                            }}
                            style={{ background: 'transparent', width: '100%', height: '100%' }}
                            onFlip={(e) => {
                                const logical = e.data;
                                setCurrentPage(logical);
                                if (onFlipRef.current) onFlipRef.current({ data: logical });
                            }}
                        >
                            {memoizedReactPages}
                        </HTMLFlipBook>
                    </div>
                </div>
            )}


            {/* Page styles */}
            <style>{`
                .fbe-page {
                    background: #fff;
                    overflow: hidden;
                    margin: 0;
                    padding: 0;
                    -webkit-transform: translate3d(0,0,0);
                    box-shadow: none !important;
                    border: none !important;
                    outline: none !important;
                }

                .fbe-inner {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: #fff;
                    margin: 0;
                    padding: 0;
                    box-shadow: none !important;
                    border: none !important;
                }

                .turn-page {
                    box-shadow: none !important;
                    border: none !important;
                    outline: none !important;
                }

                /* React-pageflip specific classes */
                .fbe-react-page {
                    width: 100%;
                    height: 100%;
                    overflow: hidden !important;
                    transition: border-radius 0.5s ease;
                    -webkit-transform: translateZ(0);
                }

                .fbe-react-page--left, .fbe-page--left {
                    border-radius: ${cornerRadius} 0 0 ${cornerRadius} !important;
                }

                .fbe-react-page--right, .fbe-page--right {
                    border-radius: 0 ${cornerRadius} ${cornerRadius} 0 !important;
                }

                .fbe-react-page--left::after, .fbe-page--left::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 80px;
                    background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%);
                    pointer-events: none;
                    z-index: 20;
                }

                .fbe-react-page--right::after, .fbe-page--right::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    width: 40px;
                    background: linear-gradient(to left, transparent 0%, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%);
                    pointer-events: none;
                    z-index: 20;
                }

                .fbe-page--first::after, .fbe-page--last::after {
                    width: 40px !important;
                }

                /* Force turn.js hard pages to remain rigid and hide internal peel gradients */
                .hard,
                .turn-page.hard,
                .cover {
                    background-color: #fff !important;
                    box-shadow: none !important;
                    -webkit-transform-style: preserve-3d !important;
                    transform-style: preserve-3d !important;
                }

                .hard .fbe-inner,
                .cover .fbe-inner {
                    backface-visibility: hidden !important;
                    -webkit-backface-visibility: hidden !important;
                }

                /* Remove any shadow/peel effects for hard pages only */
                .hard .p-shadow,
                .hard .p-gradient,
                .cover .p-shadow,
                .cover .p-gradient {
                    display: none !important;
                }
                
                /* Reset global cursor pointer applied by flipbook engines and their descendants */
                .stf__wrapper, .stf__wrapper *, 
                .stf__block, .stf__block *, 
                .turn-page-wrapper, .turn-page-wrapper *, 
                .turn-page, .turn-page *, 
                .fbe-wrapper, .fbe-wrapper *, 
                .fbe-react-page, .fbe-react-page *,
                .fbe-book, .fbe-book * {
                    cursor: default;
                }
                
                /* Hand cursor for turn.js pages and drag overlays */
                .fbe-drag-overlay {
                    cursor: grab !important;
                    pointer-events: auto !important;
                }
                .fbe-drag-overlay:active {
                    cursor: grabbing !important;
                }
                .turn-page-wrapper, .turn-page {
                    cursor: grab;
                }
                .turn-page-wrapper:active, .turn-page:active {
                    cursor: grabbing;
                }
                
                /* When dragging, disable iframe pointer events so they don't swallow mouse movements */
                .fbe-is-dragging iframe,
                .fbe-wrapper.fbe-is-dragging iframe {
                    pointer-events: none !important;
                }

                /* Add a global invisible shield over the entire wrapper during a drag to guarantee mousemove tracking */
                .fbe-wrapper.fbe-is-dragging::after {
                    content: '';
                    position: absolute;
                    top: -100px;
                    left: -100px;
                    right: -100px;
                    bottom: -100px;
                    z-index: 9999;
                    cursor: grabbing !important;
                }
            `}</style>
        </div>
    );
});

const MemoizedFlipBookEngine = React.memo(FlipBookEngine);

export default MemoizedFlipBookEngine;

