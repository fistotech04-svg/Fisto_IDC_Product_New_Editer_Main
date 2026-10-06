import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const InteractionPopupModal = ({ activePopupInteraction, onClose }) => {
  if (!activePopupInteraction) return null;

  const animRaw = (activePopupInteraction?.animation || 'Fade In /Out').toLowerCase();
  const isSlideUp = animRaw.includes('slide') && animRaw.includes('up');
  const isSlideDown = animRaw.includes('slide') && animRaw.includes('down');
  const isZoomIn = animRaw.includes('zoom');

  const speedRaw = (activePopupInteraction?.speed || 'Medium').toLowerCase();
  let duration = 0.35;
  if (speedRaw === 'slow') duration = 0.75;
  else if (speedRaw === 'fast') duration = 0.18;

  const getInitial = () => {
    if (isSlideUp) return { y: 60, opacity: 0, scale: 1 };
    if (isSlideDown) return { y: -60, opacity: 0, scale: 1 };
    if (isZoomIn) return { scale: 0.6, opacity: 0, y: 0 };
    return { opacity: 0, scale: 1, y: 0 };
  };

  const getExit = () => {
    if (isSlideUp) return { y: 60, opacity: 0, scale: 1 };
    if (isSlideDown) return { y: -60, opacity: 0, scale: 1 };
    if (isZoomIn) return { scale: 0.6, opacity: 0, y: 0 };
    return { opacity: 0, scale: 1, y: 0 };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: Math.min(duration, 0.35) }}
      className="absolute inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-[2vw]"
      onClick={onClose}
    >
      <motion.div
        initial={getInitial()}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={getExit()}
        transition={{
          duration,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="relative pointer-events-auto flex items-center justify-center"
        style={{
          width: (() => {
            if (!activePopupInteraction?.html) return '800px';
            const match = activePopupInteraction.html.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
            if (match) {
              const w = parseFloat(match[3]);
              return w ? `${w}px` : '800px';
            }
            return '800px';
          })(),
          maxWidth: '90%',
          maxHeight: '90%',
          aspectRatio: (() => {
            if (!activePopupInteraction?.html) return '4/3';
            const match = activePopupInteraction.html.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
            if (match) {
              const w = parseFloat(match[3]);
              const h = parseFloat(match[4]);
              if (w && h) return `${w}/${h}`;
            }
            return '4/3';
          })(),
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[0.5vw] right-[4vw] md:top-1.5 md:right-[5.5vw] z-[100001] bg-white rounded-full p-[0.6vw] md:p-2 shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <Icon icon="lucide:x" className="w-[1.5vw] h-[1.5vw] md:w-5 md:h-5 text-gray-700" />
        </button>
        <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: activePopupInteraction.html }} />
      </motion.div>
    </motion.div>
  );
};

export default InteractionPopupModal;
