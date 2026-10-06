import React from 'react';
import { motion } from 'framer-motion';
import { getBookmarkSVGPath } from '../../BookmarkStylesPopup';

const BookmarkTab = ({ label, color, pageIndex, currentPage, index, onClick, styleIdx = 1, font = 'Poppins', flipTime = 500, singlePage, spacing = 5 }) => {
    // Determine leaf and flip state physically bound to the leaf structure
    const leafIndex = Math.floor(pageIndex / 2);
    const isFlipped = currentPage >= 2 * leafIndex + 1;

    // Fixed vertical position ensures the tab stays anchored relative to the page
    const topOffsetVW = index * spacing;
    const displayLabel = label.length > 12 ? label.substring(0, 11) + '...' : label;

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                top: 0,
                left: singlePage ? '0%' : '50%',
                width: singlePage ? '100%' : '50%',
                height: '100%',
                transformOrigin: 'left center',
                transform: `rotateY(${isFlipped ? -180 : 0}deg)`,
                zIndex: isFlipped ? 50 - index : 50 + index,
            }}
        >
            <motion.div
                whileHover={{ scale: 1.1, filter: 'brightness(1.1)' }}
                className="absolute flex items-center justify-center cursor-pointer pointer-events-auto origin-center"
                style={{
                    top: `calc(10% + ${topOffsetVW}vw)`,
                    right: '-2vw', // Sticking out of the right edge of the leaf
                    width: '2vw',
                    height: '4.5vw',
                    fontFamily: font,
                    backfaceVisibility: 'visible',
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onClick) onClick(e);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <svg
                    viewBox="0 0 40 98"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                >
                    {color === 'multi-color' && (
                        <defs>
                            <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#FF0000" />
                                <stop offset="20%" stopColor="#FFFF00" />
                                <stop offset="40%" stopColor="#00FF00" />
                                <stop offset="60%" stopColor="#00FFFF" />
                                <stop offset="80%" stopColor="#0000FF" />
                                <stop offset="100%" stopColor="#FF00FF" />
                            </linearGradient>
                        </defs>
                    )}
                    <path d={getBookmarkSVGPath(styleIdx)} fill={color === 'multi-color' ? `url(#grad-${index})` : (color || '#C45A5A')} />
                </svg>
                <span
                    className="relative z-10 text-white font-semibold whitespace-nowrap leading-tight drop-shadow-sm text-center"
                    style={{
                        transform: `rotate(-90deg) scaleX(${isFlipped ? -1 : 1})`,
                        fontSize: '0.65vw',
                        display: 'block'
                    }}
                >
                    {displayLabel}
                </span>
            </motion.div>
        </div>
    );
};


export default BookmarkTab;
