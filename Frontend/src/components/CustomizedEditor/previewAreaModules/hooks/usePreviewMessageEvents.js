import { useEffect } from 'react';

export const usePreviewMessageEvents = ({
  pages,
  onPageClick,
  setShowTOCMemo,
  setShowProfilePopup,
  setActivePopupInteraction,
  setActiveSlideshowInteraction,
  setActive3DModelUrl,
  setActive3DModelVId,
  setActive3DModelHotspots,
  setActive3DModelConfig,
  setInteractionZoom,
  setActiveTooltip,
  settings,
  singlePage
}) => {
  useEffect(() => {
    const handleMessage = (e) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'flipbook-page-jump') {
        const target = typeof data.page === 'number' ? data.page : parseInt(data.page, 10);
        if (!isNaN(target) && onPageClick) {
          onPageClick(target);
        }
      } else if (data.type === 'flipbook-open-popup') {
        setActivePopupInteraction(data.popup);
      } else if (data.type === 'flipbook-open-slideshow') {
        setActiveSlideshowInteraction(data.slideshow);
      } else if (data.type === 'flipbook-open-3d') {
        setActive3DModelUrl(data.modelUrl);
        setActive3DModelVId(data.vId || null);
        setActive3DModelHotspots(data.hotspots || []);
        setActive3DModelConfig(data.config || null);
      } else if (data.type === 'flipbook-zoom-interaction') {
        setInteractionZoom(data.zoomData);
      } else if (data.type === 'flipbook-show-tooltip') {
        setActiveTooltip(data.tooltip);
      } else if (data.type === 'flipbook-hide-tooltip') {
        setActiveTooltip(null);
      }
    };

    const handleOpenTOC = () => setShowTOCMemo && setShowTOCMemo(true);
    const handleOpenProfile = () => setShowProfilePopup && setShowProfilePopup(true);
    const handleCloseProfile = () => setShowProfilePopup && setShowProfilePopup(false);

    window.addEventListener('message', handleMessage);
    window.addEventListener('open-toc-preview', handleOpenTOC);
    window.addEventListener('open-profile-preview', handleOpenProfile);
    window.addEventListener('close-profile-preview', handleCloseProfile);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('open-toc-preview', handleOpenTOC);
      window.removeEventListener('open-profile-preview', handleOpenProfile);
      window.removeEventListener('close-profile-preview', handleCloseProfile);
    };
  }, [
    pages,
    onPageClick,
    setShowTOCMemo,
    setShowProfilePopup,
    setActivePopupInteraction,
    setActiveSlideshowInteraction,
    setActive3DModelUrl,
    setActive3DModelVId,
    setActive3DModelHotspots,
    setActive3DModelConfig,
    setInteractionZoom,
    setActiveTooltip
  ]);
};

export default usePreviewMessageEvents;
