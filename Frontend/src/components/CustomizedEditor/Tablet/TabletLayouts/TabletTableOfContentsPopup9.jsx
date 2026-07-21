import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTableOfContents } from '../../popups/useTableOfContents';
import { motion, AnimatePresence } from 'framer-motion';

const hexToRgba = (hex, opacity = 1) => {
    if (!hex || !hex.startsWith('#')) return hex;
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const a = Math.max(0, Math.min(1, opacity));
    return `rgba(${r},${g},${b},${a})`;
};

const TabletTableOfContentsPopup9 = ({ onClose, onNavigate, settings = {}, layoutColors }) => {
    const {
        searchQuery,
        setSearchQuery,
        addSearch,
        addPageNumber,
        addSerialNumberHeading,
        addSerialNumberSubheading,
        filteredContent
    } = useTableOfContents(settings?.tocSettings || settings?.toc || settings);

    const getLayoutColor = (id, defaultColor) => {
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x && x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity !== undefined ? c.opacity / 100 : 1);
        }
        return `var(--${id}, ${defaultColor})`;
    };

    const bgColor = getLayoutColor('toc-bg', '#575C9C');
    const textColor = getLayoutColor('toc-text', '#FFFFFF');

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-start justify-center">
            
            {/* Overlay for clicking outside */}
            <div 
                className="absolute inset-0 pointer-events-auto" 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
            />

            {/* Popup Container */}
            {/* Note: In TabletLayout9, we moved icons to center. We position this popup just below the icons in the center. */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative mt-[8cqh] -translate-x-[32cqw] pointer-events-auto origin-top"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-[22cqw] min-h-[25cqw] h-fit max-h-[60cqh] flex flex-col group">
                    
                    {/* Background SVG Shape (matching Layout 9 Desktop) */}
                    <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-xl">
                        <svg width="100%" height="100%" viewBox="0 0 250 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path 
                                d="M0 130C0 118.95 8.95 110 20 110H155C170 110 175 95 175 75V35C175 15 190 0 210 0C230 0 250 15 250 35V110V580C250 591.05 241.05 600 230 600H20C8.95 600 0 591.05 0 580V130Z" 
                                fill={bgColor} 
                            />
                        </svg>
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 flex flex-col h-full w-full pt-[8cqw] pb-[2cqw] px-[2cqw]">
                        
                        {/* Search Input */}
                        {addSearch && (
                            <div className="relative mb-[1.5cqw] w-full flex-none">
                                <Icon 
                                    icon="lucide:search" 
                                    className="absolute left-[1.2cqw] top-1/2 -translate-y-1/2 w-[1.2cqw] h-[1.2cqw]"
                                    style={{ color: textColor, opacity: 0.6 }} 
                                />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-full pl-[3.2cqw] pr-[1cqw] py-[0.8cqw] text-[1.2cqw] outline-none transition-colors border"
                                    style={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: textColor 
                                    }}
                                />
                            </div>
                        )}

                        {/* Heading / TOC List */}
                        <div className="flex-1 overflow-y-auto w-full" style={{ scrollbarWidth: 'none' }}>
                            {filteredContent.length > 0 ? (
                                filteredContent.map((heading, hIdx) => (
                                    <React.Fragment key={heading.id || hIdx}>
                                        <div 
                                            className="flex items-center justify-between px-[1cqw] py-[0.8cqw] hover:bg-white/10 rounded-[0.8cqw] transition-colors cursor-pointer group"
                                            onClick={() => {
                                                onNavigate(heading.page - 1);
                                                onClose();
                                            }}
                                        >
                                            <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                                <span className="text-[1.3cqw] font-bold truncate" style={{ color: textColor }}>
                                                    {addSerialNumberHeading && <span className="mr-[0.5cqw]">{hIdx + 1}.</span>}
                                                    {heading.title || heading.label}
                                                </span>
                                            </div>
                                            {addPageNumber && (
                                                <span className="text-[1.2cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-80" style={{ color: textColor }}>
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>

                                        {heading.subheadings?.map((sub, sIdx) => (
                                            <div 
                                                key={sub.id || sIdx}
                                                className="flex items-center justify-between px-[1cqw] py-[0.6cqw] ml-[1.5cqw] hover:bg-white/10 rounded-[0.5cqw] transition-colors cursor-pointer group"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigate(sub.page - 1);
                                                    onClose();
                                                }}
                                            >
                                                <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                                    <span className="text-[1.1cqw] font-normal truncate opacity-90" style={{ color: textColor }}>
                                                        {addSerialNumberSubheading && <span className="mr-[0.5cqw]">{hIdx + 1}.{sIdx + 1}</span>}
                                                        {sub.title || sub.label}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className="text-[1cqw] font-medium flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" style={{ color: textColor }}>
                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-[4cqw] opacity-70 select-none font-bold">
                                    <span className="text-[1.2cqw]" style={{ color: textColor }}>
                                        No Table Of Content Found
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TabletTableOfContentsPopup9;
