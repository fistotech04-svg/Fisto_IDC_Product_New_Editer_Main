import sanitizeHtmlForPreview from './sanitizeHtml';
import getSlideshowScript from './slideshowScript';
import getAnimationScript from './animationScript';
import getInteractionScript from './interactionScript';
import getVideoControlsScript from './videoControlsScript';

export const getIframeContent = (html, pageNumber, watermarkSettings = null, pagesCount = 0, singlePage = false) => {
    const cleanHtml = sanitizeHtmlForPreview(html);
    // Extract and dynamically load Google Fonts found in the SVG
    const fontsToLoad = new Set();
    if (cleanHtml) {
        const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
        const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = cssRegex.exec(cleanHtml)) !== null) {
            let f = match[1] || match[2];
            if (f) f = f.split(',')[0].replace(/['"]/g, '').trim();
            if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
        }
        while ((match = attrRegex.exec(cleanHtml)) !== null) {
            let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
            if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
        }
    }

    let fontImports = '';
    if (fontsToLoad.size > 0) {
        const fontList = Array.from(fontsToLoad).map(f => f.replace(/\s+/g, '+')).join('|');
        fontImports = `<link href="https://fonts.googleapis.com/css?family=${fontList}:300,400,500,600,700,800,900&display=swap" rel="stylesheet">`;
    }

    // Inject scripts
    const content = `
        <!DOCTYPE html>
        <html>
            <head>
                ${fontImports}
                <style>
                    html, body { cursor: default !important; -webkit-user-select: none; user-select: none; }
                    body { margin: 0; padding: 0; overflow: hidden; background: transparent; width: 100%; height: 100%; }
                    * { box-sizing: border-box; -webkit-user-select: none; user-select: none; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    [data-interaction="open-link"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="link"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="navigate-to"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="download"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="zoom"],
                    [data-interaction="tooltip"],
                    [data-interaction="info-box"],
                    [data-interaction="popup"],
                    [data-interaction="slideshow"],
                    [data-interaction="whatsapp"],
                    [data-interaction="call"],
                    [data-interaction="email"],
                    [data-interaction="audio"],
                    [data-interaction="3d-viewer"] {
                        cursor: pointer !important;
                    }

                    /* Children pointer events */
                    [data-interaction="open-link"] *,
                    [data-interaction="link"] *,
                    [data-interaction="navigate-to"] *,
                    [data-interaction="download"] *,
                    [data-interaction="zoom"] *,
                    [data-interaction="tooltip"] *,
                    [data-interaction="info-box"] *,
                    [data-interaction="popup"] *,
                    [data-interaction="slideshow"] *,
                    [data-interaction="whatsapp"] *,
                    [data-interaction="call"] *,
                    [data-interaction="email"] *,
                    [data-interaction="audio"] *,
                    [data-interaction="3d-viewer"] * {
                        cursor: pointer !important;
                    }

                    /* Hide Free Frame dashed border in preview */
                    [data-name="Free Frame"] {
                        stroke: transparent !important;
                    }

                    /* Ensure text inside contentEditable boxes and scrollable features wrap correctly */
                    .text-edit-box,
                    [contenteditable="true"],
                    [data-scrollable="true"],
                    foreignObject div {
                        white-space: pre-wrap !important;
                        word-wrap: break-word !important;
                        word-break: normal !important;
                        overflow-wrap: anywhere !important;
                    }

                    foreignObject {
                        overflow: visible !important;
                        clip-path: none !important;
                    }

                    foreignObject * {
                        clip-path: none !important;
                    }

                    foreignObject video {
                        width: 100% !important;
                        height: 100% !important;
                        display: block !important;
                        border: none !important;
                        outline: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                        pointer-events: auto !important;
                    }

                    foreignObject iframe {
                        display: block !important;
                        border: none !important;
                        outline: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                        pointer-events: auto !important;
                        transform-origin: 0 0 !important;
                    }

                    foreignObject[data-type="video"] {
                        overflow: hidden !important;
                        pointer-events: auto !important;
                    }

                    foreignObject[data-type="video"] * {
                        pointer-events: auto !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar,
                    [data-scrollable="true"]::-webkit-scrollbar,
                    [data-scrollable="true"] *::-webkit-scrollbar {
                        width: 6px !important;
                        height: 6px !important;
                        background: transparent !important;
                        display: block !important;
                        -webkit-appearance: none !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-track,
                    [data-scrollable="true"]::-webkit-scrollbar-track,
                    [data-scrollable="true"] *::-webkit-scrollbar-track {
                        background: #E5E7EB !important;
                        border-radius: 10px !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-thumb,
                    [data-scrollable="true"]::-webkit-scrollbar-thumb,
                    [data-scrollable="true"] *::-webkit-scrollbar-thumb {
                        background: #4B5563 !important;
                        border-radius: 10px !important;
                        border: none !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-thumb:hover,
                    [data-scrollable="true"]::-webkit-scrollbar-thumb:hover,
                    [data-scrollable="true"] *::-webkit-scrollbar-thumb:hover {
                        background: #374151 !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-thumb:active,
                    [data-scrollable="true"]::-webkit-scrollbar-thumb:active,
                    [data-scrollable="true"] *::-webkit-scrollbar-thumb:active {
                        background: #1F2937 !important;
                    }

                    foreignObject:not([data-scrollable="true"]):not([data-editing="true"])>div {
                        width: 100% !important;
                        height: auto !important;
                    }

                    foreignObject[data-sizing-mode="fixed"]>div {
                        display: block !important;
                    }

                    foreignObject[data-scrollable="true"]>div {
                        width: 100% !important;
                        height: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        box-sizing: border-box !important;
                        pointer-events: auto !important;
                        -webkit-user-select: text !important;
                        user-select: text !important;
                    }

                    .flipbook-text-outer,
                    foreignObject[data-scrollable="true"]>div.flipbook-text-outer {
                        width: 100% !important;
                        height: 100% !important;
                        display: block !important;
                        box-sizing: border-box !important;
                        padding: 24px 6px 24px 16px !important;
                        background-color: var(--bg-fill, transparent) !important;
                        border: calc(var(--bg-stroke-width, 0) * 1px) solid var(--bg-stroke, transparent) !important;
                        border-radius: var(--bg-rx, 0px) !important;
                        position: relative;
                        overflow: hidden !important;
                    }
                    
                    .flipbook-text-viewport {
                        width: 100% !important;
                        height: 100% !important;
                        overflow: hidden !important;
                        position: relative;
                    }
                    
                    .flipbook-text-viewport::after {
                        content: "";
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 14px;
                        height: 24px;
                        background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
                        pointer-events: none;
                        z-index: 10;
                        border-bottom-left-radius: var(--bg-rx, 16px);
                        border-bottom-right-radius: var(--bg-rx, 16px);
                    }
                    
                    .flipbook-text-scrollbar {
                        width: 100% !important;
                        height: 100% !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        display: block !important;
                        box-sizing: border-box !important;
                    }

                    foreignObject[data-scrollable="true"] * {
                        -webkit-user-select: text !important;
                        user-select: text !important;
                        pointer-events: auto !important;
                    }

                    svg * {
                        vector-effect: non-scaling-stroke !important;
                    }
                </style>
                <base href="/">
                ${getSlideshowScript()}
                ${getAnimationScript(pageNumber)}
                ${getInteractionScript(pageNumber)}
                ${getVideoControlsScript()}
                <script>
                    (function() {
                        const isRightPage = ${pageNumber} % 2 !== 0;
                        const handleMove = (e) => {
                            if (!document.hasFocus()) window.focus();
                            try {
                                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                                window.parent.postMessage({
                                    type: 'IFRAME_MOUSEMOVE',
                                    originalClientX: clientX,
                                    originalClientY: clientY,
                                    pageNumber: window._pageNumber
                                }, '*');

                                // Dynamic cursor for drag corners inside iframe
                                const nearCornerX = isRightPage 
                                    ? (window.innerWidth - clientX < 50) 
                                    : (clientX < 50);
                                const nearCornerY = (clientY < 50) || (window.innerHeight - clientY < 50);
                                if (nearCornerX && nearCornerY) {
                                    document.documentElement.style.setProperty('cursor', 'grab', 'important');
                                    document.body.style.setProperty('cursor', 'grab', 'important');
                                } else {
                                    document.documentElement.style.removeProperty('cursor');
                                    document.body.style.removeProperty('cursor');
                                }
                            } catch (err) {}
                        };
                        document.addEventListener('mousemove', handleMove);
                        document.addEventListener('touchmove', handleMove, { passive: true });

                        const handleEnd = (e) => {
                            try {
                                const clientX = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX;
                                const clientY = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientY : e.clientY;
                                window.parent.postMessage({
                                    type: 'IFRAME_MOUSEUP',
                                    originalClientX: clientX,
                                    originalClientY: clientY,
                                    pageNumber: window._pageNumber
                                }, '*');
                            } catch (err) {}
                        };
                        document.addEventListener('mouseup', handleEnd);
                        document.addEventListener('touchend', handleEnd, { passive: true });
                        
                        document.addEventListener('wheel', (e) => {
                            try {
                                const isScrollable = e.target.closest('[data-scrollable="true"], .flipbook-text-scrollbar, .flipbook-text-outer, .flipbook-text-viewport');
                                if (isScrollable) return;
                                window.parent.postMessage({
                                    type: 'IFRAME_WHEEL',
                                    deltaY: e.deltaY,
                                    ctrlKey: e.ctrlKey,
                                    deltaMode: e.deltaMode
                                }, '*');
                            } catch (err) {}
                        }, { passive: true });
                    })();
                </script>
            </head>
            <body>
                ${cleanHtml || ''}
                ${(function () {
            if (!watermarkSettings?.src) return '';
            const f = watermarkSettings.adjustments || { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 };
            const exposure = f.exposure || 0;
            const contrast = f.contrast || 0;
            const saturation = f.saturation || 0;
            const temperature = f.temperature || 0;
            const tint = f.tint || 0;
            const hl = f.highlights || 0;
            const sd = f.shadows || 0;
            let filterStr = "";
            filterStr += `brightness(${100 + exposure + (hl / 5)}%) `;
            filterStr += `contrast(${100 + contrast + (sd / 5)}%) `;
            filterStr += `saturate(${100 + saturation}%) `;
            if (tint !== 0) filterStr += `hue-rotate(${tint}deg) `;
            if (temperature > 0) filterStr += `sepia(${temperature / 2}%) `;
            else if (temperature < 0) filterStr += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

            const opacity = (watermarkSettings.opacity ?? 100) / 100;
            let positionStyle = "";
            const offset = '4%';
            const posX = watermarkSettings.positionX ?? 0;
            const posY = watermarkSettings.positionY ?? 0;

            switch (watermarkSettings.position) {
                case 'Top Left': positionStyle = `top: ${offset}; left: ${offset};`; break;
                case 'Top Right': positionStyle = `top: ${offset}; right: ${offset};`; break;
                case 'Bottom Left': positionStyle = `bottom: ${offset}; left: ${offset};`; break;
                case 'Center': positionStyle = `top: 50%; left: 50%;`; break;
                case 'Bottom Right':
                default: positionStyle = `bottom: ${offset}; right: ${offset};`; break;
            }

            if (watermarkSettings.position === 'Center') {
                positionStyle += ` transform: translate(calc(-50% + ${posX}%), calc(-50% + ${posY}%));`;
            } else {
                positionStyle += ` transform: translate(${posX}%, ${posY}%);`;
            }

            const objectFit = watermarkSettings.type === 'Fill' ? 'cover' : watermarkSettings.type === 'Stretch' ? 'fill' : 'contain';

            const scale = (watermarkSettings.scale ?? 100) / 100;
            const rotate = watermarkSettings.rotate ?? 0;

            return `
                        <div id="flipbook-watermark-container" style="position: absolute; z-index: 9999; pointer-events: none; opacity: ${opacity}; width: 15%; height: auto; ${positionStyle}">
                            <img id="flipbook-watermark-img" src="${watermarkSettings.src}" style="width: 100%; height: auto; object-fit: ${objectFit}; filter: ${filterStr}; transform: scale(${scale}) rotate(${rotate}deg); transform-origin: center center;" />
                        </div>
                    `;
        })()}
            </body>
        </html>
    `;
    return content;
};


export default getIframeContent;
