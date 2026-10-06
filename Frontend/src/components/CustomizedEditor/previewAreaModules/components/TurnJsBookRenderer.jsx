import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import FlipBookEngine from '../../FlipBookEngine';
import BookmarkTab from './BookmarkTab';
import TooltipOverlay from './TooltipOverlay';

const TurnJsBookRenderer = React.memo(({
    augmentedPages,
    WIDTH,
    HEIGHT,
    flipTime,
    flipStyle, // Added flipStyle prop
    useHardCover,
    makeFirstLastPageHard,
    selectCustomHardPages,
    customHardPages,
    targetPage,
    bookRef,
    onFlip,
    cornerRadius,
    pageOpacity,
    textureStyle,
    shadowActive,
    shadowStyle,
    shadowFilter,
    currentPage,
    pagesCount,
    bookmarks,
    bookmarkSpacing = 5,
    onPageClick,
    settings,
    setShowViewBookmarkPopup,
    buildPageDoc, // Accept custom builder
    activeLayout,
    singlePage = false,
    onTurning,
    interactionZoom,
    activeTooltip,
    isTurnJs,
    physicalZoom,
    watermarkSettings,
}) => {
    const turnOnFlip = useCallback((evt) => {
        const logicalIndex = typeof evt === 'object' && evt !== null ? evt.data : evt;
        if (onFlip) onFlip({ data: logicalIndex });
    }, [onFlip]);

    const turnOnTurning = useCallback((evt) => {
        const logicalIndex = typeof evt === 'object' && evt !== null ? evt.data : evt;
        if (onTurning) onTurning({ data: logicalIndex });
    }, [onTurning]);

    const zoomStyle = useMemo(() => {
        if (!interactionZoom) {
            return { transition: 'transform 0.3s ease' };
        }

        const { rect, pageNumber, scale } = interactionZoom;
        const pageRatioX = WIDTH / rect.windowWidth;
        const pageRatioY = HEIGHT / rect.windowHeight;
        const centerXInPage = (rect.left + rect.width / 2) * pageRatioX;
        const centerYInPage = (rect.top + rect.height / 2) * pageRatioY;
        const bookX = (pageNumber % 2 === 0 || singlePage ? 0 : WIDTH) + centerXInPage;
        const bookY = centerYInPage;
        return {
            transformOrigin: `${bookX}px ${bookY}px`,
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease'
        };
    }, [interactionZoom, WIDTH, HEIGHT, singlePage, isTurnJs, physicalZoom]);

    const isZoomedIn = interactionZoom && interactionZoom.scale > 1;

    return (
        <div
            className="relative"
            style={{
                width: singlePage ? WIDTH : WIDTH * 2,
                height: HEIGHT,
                opacity: pageOpacity ?? 1,
                ...zoomStyle,
                zIndex: isZoomedIn ? 50 : 1,
                filter: shadowActive && shadowFilter ? shadowFilter : 'none',
                transition: 'filter 0.5s ease, transform 0.3s ease'
            }}
        >
            <FlipBookEngine
                ref={bookRef}
                pages={augmentedPages}
                width={WIDTH}
                height={HEIGHT}
                flipTime={flipTime}
                flipStyle={flipStyle} // Pass flipStyle to FlipBookEngine
                hardCovers={useHardCover}
                makeFirstLastPageHard={makeFirstLastPageHard}
                selectCustomHardPages={selectCustomHardPages}
                customHardPages={customHardPages}
                onFlip={turnOnFlip}
                onTurning={turnOnTurning}
                startPage={targetPage}
                buildPageDoc={buildPageDoc}
                cornerRadius={cornerRadius}
                activeLayout={activeLayout}
                textureStyle={textureStyle}
                singlePage={singlePage}
                pageOpacity={pageOpacity}
                useMouseEvents={settings?.navigation?.dragToTurn ?? true}
            />

            {/* Bookmarks rendering */}<div
                className="absolute top-0 pointer-events-none"
                style={{ width: '100%', height: '100%', left: '0%', zIndex: 200, perspective: '2000px' }}
            >
                {(() => {
                    if (settings?.navigation?.bookmark === false) return null;
                    const bmItems = settings?.navigation?.bookmarkSettings?.items;
                    if (!bmItems || bmItems.length === 0) return null;
                    return bmItems.map((bm, idx) => {
                        // parse 'Pg X' into pageIndex (0-indexed)
                        const pageNumMatch = bm.page ? bm.page.match(/\d+/) : null;
                        const pageIndex = pageNumMatch ? parseInt(pageNumMatch[0], 10) - 1 : 0;
                        const label = bm.title || '';
                        const color = settings?.navigation?.bookmarkSettings?.color || '#C45A5A';

                        return (
                            <BookmarkTab
                                key={`bm-${idx}`}
                                label={label}
                                color={color}
                                pageIndex={pageIndex}
                                currentPage={currentPage}
                                index={idx}
                                spacing={bookmarkSpacing}
                                styleIdx={settings?.navigation?.bookmarkSettings?.style || 1}
                                font={settings?.navigation?.bookmarkSettings?.font || 'Poppins'}
                                flipTime={flipTime}
                                singlePage={singlePage}
                                onClick={() => {
                                    onPageClick && onPageClick(pageIndex);
                                }}
                            />
                        );
                    });
                })()}
            </div>

            {/* Cursor hint when zoomed in - pointer-events:none so clicks pass through to iframes */}
            {isZoomedIn && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        zIndex: 200,
                        cursor: 'zoom-out',
                        background: 'transparent',
                        pointerEvents: 'none'
                    }}
                />
            )}
            {createPortal(
                <AnimatePresence>
                    {activeTooltip && (
                        <TooltipOverlay key={activeTooltip.elementId || 'tooltip'} tooltip={activeTooltip} />
                    )}
                </AnimatePresence>,
                document.fullscreenElement || document.body
            )}
        </div>
    );
});


export default TurnJsBookRenderer;
