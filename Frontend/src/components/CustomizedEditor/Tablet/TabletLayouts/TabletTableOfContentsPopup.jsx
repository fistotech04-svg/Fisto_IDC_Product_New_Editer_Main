import React from 'react';
import { Icon } from '@iconify/react';
import { useTableOfContents } from '../../popups/useTableOfContents';
import { motion, AnimatePresence } from 'framer-motion';

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const TabletTableOfContentsPopup = ({ onClose, onNavigate, settings, variant = 'layout1', layoutColors }) => {
    const {
        searchQuery,
        setSearchQuery,
        addSearch,
        addPageNumber,
        addSerialNumberHeading,
        addSerialNumberSubheading,
        filteredContent
    } = useTableOfContents(settings?.tocSettings || settings?.toc || settings);

    const isLayout2 = variant === 'layout2';
    const isLayout3 = variant === 'layout3';
    const isLayout4 = variant === 'layout4';
    const isLayout5 = variant === 'layout5';
    const isLayout6 = variant === 'layout6';
    const isLayout7 = variant === 'layout7';
    const isLayout9 = variant === 'layout9';

    if (isLayout9) {
        const getLayout9Color = (id, defaultColor) => {
            if (layoutColors && Array.isArray(layoutColors)) {
                const c = layoutColors.find(x => x && x.id === id);
                if (c) {
                    const h = c.hex.replace('#', '');
                    const r = parseInt(h.substring(0, 2), 16);
                    const g = parseInt(h.substring(2, 4), 16);
                    const b = parseInt(h.substring(4, 6), 16);
                    const a = Math.max(0, Math.min(1, c.opacity !== undefined ? c.opacity / 100 : 1));
                    return `rgba(${r},${g},${b},${a})`;
                }
            }
            return `var(--${id}, ${defaultColor})`;
        };

        const bgColor = getLayout9Color('toc-bg', '#575C9C');
        const textColor = getLayout9Color('toc-text', '#FFFFFF');

        return (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-start justify-center">
                <div className="absolute inset-0 pointer-events-auto" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative mt-[8cqh] -translate-x-[32cqw] pointer-events-auto origin-top"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative w-[22cqw] min-h-[25cqw] h-fit max-h-[60cqh] flex flex-col group">
                        <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-xl">
                            <svg width="100%" height="100%" viewBox="0 0 250 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0 130C0 118.95 8.95 110 20 110H155C170 110 175 95 175 75V35C175 15 190 0 210 0C230 0 250 15 250 35V110V580C250 591.05 241.05 600 230 600H20C8.95 600 0 591.05 0 580V130Z" fill={bgColor} />
                            </svg>
                        </div>
                        <div className="relative z-10 flex flex-col h-full w-full pt-[8cqw] pb-[2cqw] px-[2cqw]">
                            {addSearch && (
                                <div className="relative mb-[1.5cqw] w-full flex-none">
                                    <Icon icon="lucide:search" className="absolute left-[1.2cqw] top-1/2 -translate-y-1/2 w-[1.2cqw] h-[1.2cqw]" style={{ color: textColor, opacity: 0.6 }} />
                                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-full pl-[3.2cqw] pr-[1cqw] py-[0.8cqw] text-[1.2cqw] outline-none transition-colors border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: textColor }} />
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto w-full" style={{ scrollbarWidth: 'none' }}>
                                {filteredContent.length > 0 ? (
                                    filteredContent.map((heading, hIdx) => (
                                        <React.Fragment key={heading.id || hIdx}>
                                            <div className="flex items-center justify-between px-[1cqw] py-[0.8cqw] hover:bg-white/10 rounded-[0.8cqw] transition-colors cursor-pointer group" onClick={() => { onNavigate(heading.page - 1); onClose(); }}>
                                                <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                                    <span className="text-[1.3cqw] font-bold truncate" style={{ color: textColor }}>
                                                        {addSerialNumberHeading && <span className="mr-[0.5cqw]">{hIdx + 1}.</span>}
                                                        {heading.title || heading.label}
                                                    </span>
                                                </div>
                                                {addPageNumber && <span className="text-[1.2cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-80" style={{ color: textColor }}>{heading.page < 10 ? `0${heading.page}` : heading.page}</span>}
                                            </div>
                                            {heading.subheadings?.map((sub, sIdx) => (
                                                <div key={sub.id || sIdx} className="flex items-center justify-between px-[1cqw] py-[0.6cqw] ml-[1.5cqw] hover:bg-white/10 rounded-[0.5cqw] transition-colors cursor-pointer group" onClick={(e) => { e.stopPropagation(); onNavigate(sub.page - 1); onClose(); }}>
                                                    <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                                        <span className="text-[1.1cqw] font-normal truncate opacity-90" style={{ color: textColor }}>
                                                            {addSerialNumberSubheading && <span className="mr-[0.5cqw]">{hIdx + 1}.{sIdx + 1}</span>}
                                                            {sub.title || sub.label}
                                                        </span>
                                                    </div>
                                                    {addPageNumber && <span className="text-[1cqw] font-medium flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" style={{ color: textColor }}>{sub.page < 10 ? `0${sub.page}` : sub.page}</span>}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-[4cqw] opacity-70 select-none font-bold">
                                        <span className="text-[1.2cqw]" style={{ color: textColor }}>No Table Of Content Found</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className={(isLayout2 || isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7)
                ? "absolute inset-0 pointer-events-none"
                : "absolute inset-0 z-50 pointer-events-auto flex items-end justify-start pb-[8cqw] pl-[2cqw]"}
            style={(isLayout2 || isLayout3 || isLayout4 || isLayout5 || isLayout6) ? { zIndex: 100 } : {}}
        >


            {/* Click outside to close */}
            <div
                className={`absolute inset-0 ${(isLayout2 || isLayout4 || isLayout5 || isLayout6 || isLayout7) ? 'pointer-events-auto' : ''}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            />

            <div
                className={isLayout7
                    ? "absolute right-[6.8cqw] bottom-[7.5%] top-[10cqw] w-[26cqw] bg-[#F5F6F8] rounded-t-[1.5cqw] shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10"
                    : isLayout5
                    ? "absolute bottom-[11cqh] left-[41cqw] w-[26cqw] min-h-[16cqw] max-h-[60cqw] bg-white rounded-[1.2cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto p-[2cqw] z-10"
                    : isLayout6 ? "absolute right-0 top-0 bottom-0 w-[25cqw] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10" : isLayout6 ? "absolute right-0 top-0 bottom-0 w-[26cqw] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10" : isLayout4 ? "absolute left-0 top-0 bottom-0 w-[25cqw] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10"
                        : isLayout3
                            ? "absolute top-[10%] left-[30cqw] w-[22cqw] min-h-[12cqw] max-h-[60cqw] rounded-[1cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] overflow-hidden flex flex-col pointer-events-auto p-[1.5cqw]"
                            : isLayout2
                                ? "absolute top-[9%] left-[30cqw] w-[25cqw] max-h-[60cqw] rounded-[1cqw] shadow-[0_2cqw_5cqw_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto p-[1.5cqw] border-[4px] border-white/80"
                                : "relative w-[26cqw] max-h-[70cqw] rounded-[1.5cqw] shadow-[0_1cqw_4cqw_rgba(0,0,0,0.2)] overflow-hidden flex flex-col z-10"
                }
                style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7)
                        ? { backgroundColor: getLayoutColor('toc-bg', isLayout7 ? '#F3F4F6' : '#FFFFFF') }
                    : isLayout2
                        ? { backgroundColor: 'rgba(var(--toc-bg-rgb, 98, 95, 162), 0.95)', backdropFilter: 'blur(12px)' }
                        : { backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), 0.9)`, backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.15)' }
                }
                onClick={(e) => e.stopPropagation()}
            >
                {isLayout5 && (
                    <div className="absolute -bottom-[1.8cqw] left-[3.5cqw] w-[2.5cqw] h-[2cqw]" style={{ backgroundColor: getLayoutColor('toc-bg', '#FFFFFF'), clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                )}
                <div className={isLayout5 ? "flex items-center justify-between mb-[1.5cqw]" : (isLayout4 || isLayout6 || isLayout7) ? "flex items-center justify-between p-[2cqw] pb-[1cqw]" : isLayout3 ? "mb-[1.5cqw]" : isLayout2 ? "flex items-center mb-[1.5cqw]" : "flex-none text-center mb-[1cqw] pt-[2cqw]"}>
                    <h2
                        className={isLayout5 ? "text-[1.5cqw] font-bold" : (isLayout4 || isLayout6 || isLayout7) ? "text-[1.8cqw] font-bold" : isLayout3 ? "text-[1.3cqw] font-bold" : isLayout2 ? "text-[1.4cqw] font-bold text-white mr-[1cqw]" : "text-[1.8cqw] font-bold mb-[1cqw] text-white px-[2cqw]"}
                        style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7) ? { color: getLayoutColor('toc-text', '#575C9C') } : {}}
                    >
                        Table of Contents
                    </h2>
                    {(isLayout4 || isLayout6 || isLayout7) && (
                        <button onClick={onClose} className="transition-colors hover:opacity-70" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                            <Icon icon="lucide:x" className="w-[2cqw] h-[2cqw]" />
                        </button>
                    )}
                    {(!isLayout3 && !isLayout4 && !isLayout5 && !isLayout6 && !isLayout7) && (
                        isLayout2 ? (
                            <div className="flex-1 h-[1px] bg-white/40"></div>
                        ) : (
                            <div className="h-[1px] w-[92%] mx-auto bg-white/20"></div>
                        )
                    )}
                </div>
                {(isLayout4 || isLayout6 || isLayout7) && <div className="h-[1px] w-full mb-[1.5cqw]" style={{ backgroundColor: getLayoutColorAlpha('toc-text', '87,92,156', 0.1) }}></div>}

                {addSearch && (
                    <div className={isLayout5 ? "relative mb-[2cqw] w-full flex-none" : (isLayout4 || isLayout6 || isLayout7) ? "relative mb-[2cqw] px-[2cqw] flex-none" : isLayout3 ? "flex items-center mb-[1.5cqw] w-full" : isLayout2 ? "relative mb-[2cqw]" : "relative mb-[2cqw] px-[2cqw] flex-none"}>
                        <Icon
                            icon="lucide:search"
                            className={isLayout5 ? "absolute left-[1.2cqw] top-1/2 -translate-y-1/2 w-[1.2cqw] h-[1.2cqw]" : (isLayout4 || isLayout6 || isLayout7) ? "absolute left-[2.8cqw] top-1/2 -translate-y-1/2 w-[1.4cqw] h-[1.4cqw]" : isLayout3 ? "flex-shrink-0 w-[1.1cqw] h-[1.1cqw] ml-[0.2cqw]" : isLayout2 ? "absolute left-[0.8cqw] top-1/2 -translate-y-1/2 w-[1.1cqw] h-[1.1cqw] text-white/70" : "absolute left-[3.2cqw] top-1/2 -translate-y-1/2 w-[1.5cqw] h-[1.5cqw] text-white/60"}
                            style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7) ? { color: getLayoutColor('toc-text', '#A3A6C4'), opacity: 0.6 } : {}}
                        />
                        {(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7) && (
                            <style>{`
                                .tablet-toc-search::placeholder {
                                    color: ${getLayoutColor('toc-text', '#A3A6C4')} !important;
                                    opacity: 0.6;
                                }
                            `}</style>
                        )}
                        <input
                            type="text"
                            placeholder="Search in TOC..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={isLayout5
                                ? "tablet-toc-search w-full rounded-[0.6cqw] pl-[3.2cqw] pr-[1cqw] py-[0.8cqw] text-[1.2cqw] outline-none transition-colors border"
                                : (isLayout4 || isLayout6 || isLayout7) ? "tablet-toc-search w-full rounded-[0.5cqw] pl-[3cqw] pr-[1cqw] py-[0.8cqw] text-[1.3cqw] outline-none border transition-colors bg-white/50"
                                    : isLayout3
                                        ? "tablet-toc-search flex-1 min-w-0 pl-[0.5cqw] pr-[0.8cqw] py-[0.5cqw] text-[0.9cqw] outline-none bg-transparent font-medium leading-tight"
                                        : isLayout2
                                            ? "w-full rounded-[0.8cqw] pl-[2.8cqw] pr-[0.8cqw] py-[0.6cqw] text-[1cqw] outline-none transition-colors placeholder:text-white/50 text-white"
                                            : "w-full rounded-full pl-[4cqw] pr-[1.5cqw] py-[0.8cqw] text-[1.4cqw] outline-none border transition-colors placeholder:text-white/50 text-white"}
                            style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7)
                                    ? { color: getLayoutColor('toc-text', '#575C9C'), backgroundColor: (isLayout5 || isLayout6 || isLayout7) ? getLayoutColorAlpha('toc-text', '87,92,156', 0.05) : undefined, borderColor: (isLayout4 || isLayout5 || isLayout6 || isLayout7) ? getLayoutColorAlpha('toc-text', '87,92,156', 0.2) : undefined }
                                : isLayout2
                                    ? { backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.1)' }
                                    : { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }
                            }
                        />
                    </div>
                )}
                

                <div className={isLayout5 ? "flex-1 overflow-y-auto pb-[1cqw]" : (isLayout4 || isLayout6 || isLayout7) ? "flex-1 overflow-y-auto px-[1.5cqw] pb-[2cqw]" : isLayout3 ? "flex-1 overflow-y-auto pb-[1cqw]" : isLayout2 ? "flex-1 overflow-y-auto pb-[1cqw]" : "flex-1 overflow-y-auto px-[1.5cqw] pb-[2cqw]"} style={{ scrollbarWidth: 'none' }}>
                    {filteredContent.length > 0 ? (
                        filteredContent.map((heading, hIdx) => (
                            <React.Fragment key={heading.id || hIdx}>
                                <div
                                    className={isLayout5 ? "flex items-center justify-between px-[1cqw] py-[0.8cqw] hover:bg-black/5 rounded-[0.6cqw] transition-colors cursor-pointer group" : (isLayout4 || isLayout6 || isLayout7) ? "flex items-center justify-between px-[1.5cqw] py-[1cqw] hover:bg-black/5 rounded-[0.5cqw] transition-colors cursor-pointer group" : isLayout3 ? "flex items-center justify-between px-[1cqw] py-[0.8cqw] rounded-[0.6cqw] transition-colors cursor-pointer group hover:opacity-80" : "flex items-center justify-between px-[1.5cqw] py-[0.8cqw] hover:bg-white/10 rounded-[0.8cqw] transition-colors cursor-pointer group text-white"}
                                    style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7) ? { color: getLayoutColor('toc-text', '#575C9C') } : {}}
                                    onClick={() => {
                                        onNavigate(heading.page - 1);
                                        onClose();
                                    }}
                                >
                                    <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                        <span className={isLayout5 ? "text-[1.2cqw] font-bold truncate" : (isLayout7 || isLayout6 || isLayout4) ? "text-[1.4cqw] font-bold truncate" : isLayout3 ? "text-[1cqw] font-bold truncate" : isLayout2 ? "text-[1.1cqw] font-bold truncate" : "text-[1.5cqw] font-bold truncate"}>
                                            {addSerialNumberHeading && <span className="mr-[0.5cqw]">{hIdx + 1}.</span>}
                                            {heading.title || heading.label}
                                        </span>
                                    </div>
                                    {addPageNumber && (
                                        <span className={isLayout5 ? "text-[1cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-80" : isLayout3 ? "text-[0.9cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-80" : isLayout2 ? "text-[1cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-80" : "text-[1.4cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-80"}>
                                            {heading.page < 10 ? `0${heading.page}` : heading.page}
                                        </span>
                                    )}
                                </div>

                                {heading.subheadings?.map((sub, sIdx) => (
                                    <div
                                        key={sub.id || sIdx}
                                        className={isLayout5 ? "flex items-center justify-between px-[1cqw] py-[0.6cqw] ml-[1.5cqw] hover:bg-black/5 rounded-[0.5cqw] transition-colors cursor-pointer group" : (isLayout4 || isLayout6 || isLayout7) ? "flex items-center justify-between px-[1.5cqw] py-[0.6cqw] ml-[2cqw] hover:bg-black/5 rounded-[0.5cqw] transition-colors cursor-pointer group" : isLayout3 ? "flex items-center justify-between px-[1cqw] py-[0.6cqw] ml-[1.5cqw] rounded-[0.5cqw] transition-colors cursor-pointer group hover:opacity-80" : "flex items-center justify-between px-[1.5cqw] py-[0.6cqw] ml-[2cqw] hover:bg-white/10 rounded-[0.5cqw] transition-colors cursor-pointer group text-white/90"}
                                        style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7) ? { color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.9 } : {}}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate(sub.page - 1);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                            <span className={isLayout5 ? "text-[1.1cqw] font-normal truncate" : (isLayout4 || isLayout6 || isLayout7) ? "text-[1.3cqw] font-normal truncate" : isLayout3 ? "text-[0.9cqw] font-normal truncate" : isLayout2 ? "text-[0.9cqw] font-normal truncate" : "text-[1.3cqw] font-normal truncate"}>
                                                {addSerialNumberSubheading && <span className="mr-[0.5cqw]">{hIdx + 1}.{sIdx + 1}</span>}
                                                {sub.title || sub.label}
                                            </span>
                                        </div>
                                        {addPageNumber && (
                                            <span className={isLayout5 ? "text-[0.9cqw] font-medium flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" : (isLayout4 || isLayout6 || isLayout7) ? "text-[1.2cqw] font-medium flex-shrink-0 ml-[1cqw] tabular-nums opacity-60" : isLayout3 ? "text-[0.8cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" : isLayout2 ? "text-[0.8cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" : "text-[1.2cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-70"}>
                                                {sub.page < 10 ? `0${sub.page}` : sub.page}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))
                    ) : (
                        <div className={isLayout7 ? "flex flex-col items-center justify-center py-[10cqw] select-none font-bold opacity-60" : isLayout6 ? "flex flex-col items-center justify-center py-[10cqw] select-none font-bold" : isLayout5 ? "flex flex-col items-center justify-center py-[4cqw] select-none font-medium" : isLayout4 ? "flex flex-col items-center justify-center py-[10cqw] select-none font-medium" : isLayout3 ? "flex flex-col items-center justify-center py-[2cqw] select-none font-medium" : isLayout2 ? "flex flex-col items-center justify-center py-[2cqw] opacity-70 select-none text-white font-bold tracking-wide" : "flex flex-col items-center justify-center py-[4cqw] opacity-60 select-none text-white font-semibold"} style={(isLayout3 || isLayout4 || isLayout5 || isLayout6 || isLayout7) ? { color: getLayoutColor('toc-text', '#575C9C'), opacity: (isLayout7 ? 0.6 : 0.7) } : {}}>
                            {isLayout7 && (
                                <Icon icon="fa6-solid:list" className="w-[4cqw] h-[4cqw] mb-[2cqw] opacity-40" />
                            )}
                            <span className={(isLayout6 || isLayout7) ? "text-[1.4cqw]" : isLayout5 ? "text-[1.2cqw]" : isLayout4 ? "text-[1.4cqw]" : isLayout3 ? "text-[1.1cqw]" : isLayout2 ? "text-[1cqw]" : "text-[1.4cqw]"} style={isLayout2 ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : {}}>
                                {isLayout5 ? 'No content' : 'No Table of Contents'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TabletTableOfContentsPopup;
