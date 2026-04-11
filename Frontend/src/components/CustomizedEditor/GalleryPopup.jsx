import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
import { NavIconRenderer } from './NavIconStylesPopup';

const TRANSITION_DURATION = 450; // ms

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const GalleryPopup = ({ onClose, settings = {}, popupSettings = {} }) => {
  const images = settings.images || [];
  const effectiveAutoPlay = settings.autoPlay ?? true;
  const speed = settings.speed || 3;
  const infiniteLoop = settings.infiniteLoop ?? true;
  const showDots = settings.showDots ?? true;
  const imageFit = settings.imageFitType === 'Fit All' ? 'contain' : 'cover';
  const dragToSlide = true;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(effectiveAutoPlay);

  useEffect(() => {
    setIsPlaying(effectiveAutoPlay);
  }, [effectiveAutoPlay]);

  const intervalRef = useRef(null);
  const dragStartX = useRef(null);
  const containerRef = useRef(null);

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const goTo = useCallback((newIndex) => {
    if (isTransitioning || images.length <= 1) return;
    setDirection(newIndex > currentIndex ? 1 : -1);
    setCurrentIndex(newIndex);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION + 50);
  }, [isTransitioning, currentIndex, images.length]);

  const goNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= images.length) {
      if (infiniteLoop) goTo(0);
    } else {
      goTo(next);
    }
  }, [currentIndex, images.length, infiniteLoop, goTo]);

  const goPrev = useCallback(() => {
    const prev = currentIndex - 1;
    if (prev < 0) {
      if (infiniteLoop) goTo(images.length - 1);
    } else {
      goTo(prev);
    }
  }, [currentIndex, images.length, infiniteLoop, goTo]);

  /* ── Auto-play ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    intervalRef.current = setInterval(goNext, speed * 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, goNext, images.length]);

  /* ── Keyboard ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  /* ── Drag-to-slide (Manual mode) ─────────────────────────────────────── */
  const handleDragStart = (e) => {
    if (!dragToSlide) return;
    dragStartX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  };
  const handleDragEnd = (e) => {
    if (dragStartX.current === null || !dragToSlide) return;
    const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const diff = endX - dragStartX.current;
    if (Math.abs(diff) > 50) {
      diff < 0 ? goNext() : goPrev();
      setIsPlaying(false);
    }
    dragStartX.current = null;
  };

  if (!images || images.length === 0) return null;

  const bgColor = popupSettings?.backgroundColor?.fill
    ? `${popupSettings.backgroundColor.fill}50`
    : 'rgba(0,0,0,0.5)';

  return (
    <div
      className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-[2vw]"
      style={{ backgroundColor: bgColor, backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      {/* The White Box */}
      <div
        className="relative w-full max-w-[85vw] h-[75vh] rounded-[0.5vw] shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: popupSettings?.backgroundColor?.fill || '#f5f6f8',
          border: popupSettings?.backgroundColor?.stroke && popupSettings.backgroundColor.stroke !== '#' ? `1px solid ${popupSettings.backgroundColor.stroke}` : 'none',
          fontFamily: popupSettings?.textProperties?.font || 'Poppins'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button at top-right */}
        <button
          className="absolute top-[1vw] right-[1vw] w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] bg-white border border-red-500 text-red-500 hover:bg-red-50 transition-all z-[210] shadow-sm cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size="1vw" strokeWidth={2} />
        </button>

        {/* Carousel Area */}
        <div
          className="flex-1 w-full relative flex items-center justify-center mt-[1vw]"
          ref={containerRef}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          {images.length > 1 && (
            <button
              className="absolute left-[3vw] z-[210] p-[0.5vw] transition-all cursor-pointer"
              style={{ color: settings.navIconColor || '#000000' }}
              onClick={(e) => { e.stopPropagation(); goPrev(); setIsPlaying(false); }}
            >
              {NavIconRenderer({
                styleId: settings.navStyle || 1,
                size: "2.5vw",
                color: settings.navIconColor || '#000000'
              }).left}
            </button>
          )}

          {/* Slides container */}
          <div className="relative w-full h-full flex items-center justify-center perspective-[1200px]" style={{ cursor: dragToSlide ? 'grab' : 'default' }}>
            {images.map((img, index) => {
              const total = images.length;
              const isCurrent = index === currentIndex;
              const isPrev = index === (currentIndex - 1 + total) % total;
              const isNext = index === (currentIndex + 1) % total;
              const effect = settings.transitionEffect || 'Linear';

              let transform = 'translateX(0) scale(0) opacity-0';
              let zIndex = 0;
              let opacity = 0;

              if (effect === 'Fade') {
                transform = 'translateX(0) scale(1)';
                opacity = isCurrent ? 1 : 0;
                zIndex = isCurrent ? 10 : 1;
              } else if (effect === 'Flip') {
                transform = isCurrent ? 'rotateY(0deg) scale(1)' : isPrev ? 'rotateY(-180deg) scale(1)' : 'rotateY(180deg) scale(1)';
                opacity = isCurrent ? 1 : 0;
                zIndex = isCurrent ? 10 : 1;
              } else if (effect === 'Reveal') {
                transform = isCurrent ? 'scale(1)' : 'scale(0.85)';
                opacity = isCurrent ? 1 : 0;
                zIndex = isCurrent ? 10 : 1;
              } else if (effect === 'Slide' || effect === 'Push') {
                if (isCurrent) {
                  transform = 'translateX(0) scale(1)';
                  opacity = 1;
                  zIndex = 10;
                } else if (isPrev) {
                  transform = 'translateX(-100%) scale(1)';
                  opacity = 0;
                  zIndex = 5;
                } else if (isNext) {
                  transform = 'translateX(100%) scale(1)';
                  opacity = 0;
                  zIndex = 5;
                } else {
                  transform = `translateX(${direction > 0 ? '100%' : '-100%'}) scale(1)`;
                  opacity = 0;
                  zIndex = 1;
                }
              } else {
                // Linear (Coverflow) default for the ui structure
                if (isCurrent) {
                  transform = 'translateX(0) scale(1)';
                  zIndex = 10;
                  opacity = 1;
                } else if (isPrev) {
                  transform = 'translateX(-22vw) scale(0.65)';
                  zIndex = 5;
                  opacity = 0.8;
                } else if (isNext) {
                  transform = 'translateX(22vw) scale(0.65)';
                  zIndex = 5;
                  opacity = 0.8;
                } else {
                  transform = `translateX(${direction > 0 ? '22vw' : '-22vw'}) scale(0.65)`;
                  zIndex = 0;
                  opacity = 0;
                }
              }

              return (
                <div
                  key={index}
                  className="absolute transition-all ease-out"
                  style={{
                    transitionDuration: `${TRANSITION_DURATION}ms`,
                    transform,
                    zIndex,
                    opacity,
                    width: '30vw',
                    height: '40vh',
                    pointerEvents: isCurrent ? 'auto' : 'none'
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name || `Slide ${index + 1}`}
                    className="w-full h-full rounded-[1vw]"
                    style={{ objectFit: imageFit, display: 'block', userSelect: 'none' }}
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>

          {images.length > 1 && (
            <button
              className="absolute right-[3vw] z-[210] p-[0.5vw] transition-all cursor-pointer"
              style={{ color: settings.navIconColor || '#000000' }}
              onClick={(e) => { e.stopPropagation(); goNext(); setIsPlaying(false); }}
            >
              {NavIconRenderer({
                styleId: settings.navStyle || 1,
                size: "2.5vw",
                color: settings.navIconColor || '#000000'
              }).right}
            </button>
          )}
        </div>

        {/* Dots (Centered Below Image) */}
        {showDots && images.length > 1 && (
          <div className="flex justify-center items-center gap-[0.5vw] z-[210] mb-[2vw]">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); setIsPlaying(false); }}
                className="rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: '0.6vw',
                  height: '0.6vw',
                  backgroundColor: i === currentIndex ? (settings.dotColor || '#000000') : 'rgba(0,0,0,0.2)',
                  border: 'none'
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom Bar: Play, Progress, Counter */}
        <div className="w-full h-[3vw] px-[3vw] flex items-center justify-between pb-[1.5vw]">
          <div className="flex items-center gap-[1.5vw] flex-1">
            {images.length > 1 && (
              <button
                className="text-[#3b3b98] hover:text-[#272766] transition-colors cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause fill="currentColor" size="1.2vw" /> : <Play fill="currentColor" size="1.2vw" />}
              </button>
            )}

            {/* Progress Bar */}
            <div className="relative h-[0.3vw] flex-1 bg-gray-300 rounded-full mr-[3vw] overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[#3b3b98] transition-all duration-300 ease-linear rounded-full"
                style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-[0.9vw] font-medium text-gray-700 font-sans min-w-max">
            Image {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPopup;
