/**
 * previewArea/index.js
 * Central barrel exports for PreviewArea components, scripts, and hooks.
 */

// Scripts
export { default as getSlideshowScript } from './scripts/slideshowScript';
export { default as getAnimationScript } from './scripts/animationScript';
export { default as getInteractionScript } from './scripts/interactionScript';
export { default as getVideoControlsScript } from './scripts/videoControlsScript';
export { default as sanitizeHtmlForPreview } from './scripts/sanitizeHtml';
export { default as getIframeContent } from './scripts/iframeContentBuilder';

// Components
export { default as BookmarkTab } from './components/BookmarkTab';
export { default as TooltipOverlay } from './components/TooltipOverlay';
export { default as TurnJsBookRenderer } from './components/TurnJsBookRenderer';
export { default as SharedOverlays } from './components/SharedOverlays';
export { default as InteractionPopupModal } from './components/InteractionPopupModal';
export { default as InteractionSlideshowModal } from './components/InteractionSlideshowModal';
export { default as DeviceLayoutRenderer } from './components/DeviceLayoutRenderer';

// Hooks
export { default as usePreviewZoom } from './hooks/usePreviewZoom';
export { default as usePreviewAudio } from './hooks/usePreviewAudio';
export { default as usePreviewMessageEvents } from './hooks/usePreviewMessageEvents';
