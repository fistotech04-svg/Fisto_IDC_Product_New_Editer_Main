import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

const InteractionSlideshowModal = ({ activeSlideshowInteraction, setActiveSlideshowInteraction }) => {
  if (!activeSlideshowInteraction) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-[2vw]"
      onClick={() => setActiveSlideshowInteraction(null)}
    >
      <button
        onClick={() => setActiveSlideshowInteraction(null)}
        className="absolute top-[2vw] right-[2vw] z-[100001] bg-white rounded-full p-[0.6vw] md:p-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-100 transition-colors border border-gray-200"
      >
        <Icon icon="lucide:x" className="w-[1.5vw] h-[1.5vw] text-gray-700" />
      </button>

      <div
        className="relative max-w-[80vw] max-h-[80vh] w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlideshowInteraction.currentIndex}
            src={activeSlideshowInteraction.images[activeSlideshowInteraction.currentIndex]}
            initial={(() => {
              const effect = activeSlideshowInteraction.effect || 'Play Cards';
              if (effect === 'Spring Bounce') return { scale: 0.5, opacity: 0 };
              if (effect === 'Cover Flow') return { x: 300, rotateY: -60, scale: 0.7, opacity: 0 };
              if (effect === 'Slide') return { x: 300, opacity: 0 };
              if (effect === 'Zoom') return { scale: 0.5, opacity: 0 };
              if (effect === 'Drop') return { y: -300, opacity: 0 };
              if (effect === '3D Flip') return { rotateY: 90, opacity: 0 };
              if (effect === 'Play Cards') return { scale: 0.8, y: 100, opacity: 0, rotateZ: -8 };
              return { opacity: 0 };
            })()}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotateY: 0, rotateZ: 0 }}
            exit={(() => {
              const effect = activeSlideshowInteraction.effect || 'Play Cards';
              if (effect === 'Spring Bounce') return { scale: 1.5, opacity: 0 };
              if (effect === 'Cover Flow') return { x: -300, rotateY: 60, scale: 0.7, opacity: 0 };
              if (effect === 'Slide') return { x: -300, opacity: 0 };
              if (effect === 'Zoom') return { scale: 1.2, opacity: 0 };
              if (effect === 'Drop') return { y: 300, opacity: 0 };
              if (effect === '3D Flip') return { rotateY: -90, opacity: 0 };
              if (effect === 'Play Cards') return { scale: 0.8, y: -100, opacity: 0, rotateZ: 8 };
              return { opacity: 0 };
            })()}
            transition={(() => {
              const s = activeSlideshowInteraction.speed || 'Medium';
              let dur = 0.5;
              if (s === 'Slow') dur = 0.8;
              if (s === 'Fast') dur = 0.3;

              if (activeSlideshowInteraction.effect === 'Spring Bounce') {
                return { type: 'spring', bounce: 0.6, duration: dur * 1.5 };
              }
              return { duration: dur, ease: "easeInOut" };
            })()}
            className="absolute max-w-[95%] max-h-[95%] object-contain rounded-[0.5vw]"
          />
        </AnimatePresence>

        {activeSlideshowInteraction.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlideshowInteraction(prev => ({
                  ...prev,
                  currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
                }));
              }}
              className="absolute left-[0.5vw] bg-white/90 hover:bg-white rounded-full p-[0.6vw] shadow-lg z-[100001] backdrop-blur-sm transition-transform hover:scale-110"
            >
              <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlideshowInteraction(prev => ({
                  ...prev,
                  currentIndex: (prev.currentIndex + 1) % prev.images.length
                }));
              }}
              className="absolute right-[0.5vw] bg-white/90 hover:bg-white rounded-full p-[0.6vw] shadow-lg z-[100001] backdrop-blur-sm transition-transform hover:scale-110"
            >
              <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default InteractionSlideshowModal;
