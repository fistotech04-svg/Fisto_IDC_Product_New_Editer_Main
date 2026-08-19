import React from 'react';
import { Icon } from '@iconify/react';
import { useTableOfContents } from '../../popups/useTableOfContents';

const TabletTableOfContentsPopup = ({ onClose, onNavigate, settings, variant = 'layout1' }) => {
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
    return (
        <div
            className={(isLayout2 || isLayout3 || isLayout4 || isLayout5 || isLayout6)
                ? "absolute inset-0 pointer-events-none"
                : "absolute inset-0 z-50 pointer-events-auto flex items-end justify-start pb-[8cqw] pl-[2cqw]"}
            style={(isLayout2 || isLayout3 || isLayout4 || isLayout5 || isLayout6) ? { zIndex: 100 } : {}}
        >


            {/* Click outside to close */}
            <div
                className={`absolute inset-0 ${(isLayout2 || isLayout4 || isLayout5 || isLayout6) ? 'pointer-events-auto' : ''}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            />

            <div
                className={isLayout5
                    ? "absolute bottom-[11cqh] left-[41cqw] w-[26cqw] min-h-[16cqw] max-h-[60cqw] bg-white rounded-[1.2cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto p-[2cqw] z-10"
                    : isLayout6 ? "absolute right-0 top-0 bottom-0 w-[25cqw] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10" : isLayout6 ? "absolute right-0 top-0 bottom-0 w-[26cqw] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10" : isLayout4 ? "absolute left-0 top-0 bottom-0 w-[25cqw] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-10"
                        : isLayout3
                            ? "absolute top-[10%] left-[30cqw] w-[22cqw] min-h-[12cqw] max-h-[60cqw] rounded-[1cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] overflow-hidden flex flex-col pointer-events-auto p-[1.5cqw] bg-white"
                            : isLayout2
                                ? "absolute top-[9%] left-[30cqw] w-[25cqw] max-h-[60cqw] rounded-[1cqw] shadow-[0_2cqw_5cqw_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto p-[1.5cqw] border-[4px] border-white/80"
                                : "relative w-[26cqw] max-h-[70cqw] rounded-[1.5cqw] shadow-[0_1cqw_4cqw_rgba(0,0,0,0.2)] overflow-hidden flex flex-col z-10"
                }
                style={isLayout6 || isLayout4 || isLayout3 || isLayout5
                    ? {}
                    : isLayout2
                        ? { backgroundColor: 'rgba(var(--toc-bg-rgb, 98, 95, 162), 0.95)', backdropFilter: 'blur(12px)' }
                        : { backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), 0.9)`, backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.15)' }
                }
                onClick={(e) => e.stopPropagation()}
            >
                {isLayout5 && (
                    <div className="absolute -bottom-[1.8cqw] left-[3.5cqw] w-[2.5cqw] h-[2cqw] bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                )}
                <div className={isLayout5 ? "flex items-center justify-between mb-[1.5cqw]" : (isLayout4 || isLayout6) ? "flex items-center justify-between p-[2cqw] pb-[1cqw]" : isLayout3 ? "mb-[1.5cqw]" : isLayout2 ? "flex items-center mb-[1.5cqw]" : "flex-none text-center mb-[1cqw] pt-[2cqw]"}>
                    <h2
                        className={isLayout5 ? "text-[1.5cqw] font-bold text-[#575C9C]" : (isLayout4 || isLayout6) ? "text-[1.8cqw] font-bold text-[#575C9C]" : isLayout3 ? "text-[1.3cqw] font-bold text-[#4F4A95]" : isLayout2 ? "text-[1.4cqw] font-bold text-white mr-[1cqw]" : "text-[1.8cqw] font-bold mb-[1cqw] text-white px-[2cqw]"}
                    >
                        Table of Contents
                    </h2>
                    {(isLayout4 || isLayout6) && (
                        <button onClick={onClose} className="text-[#575C9C] hover:text-[#575C9C]/70 transition-colors">
                            <Icon icon="lucide:x" className="w-[2cqw] h-[2cqw]" />
                        </button>
                    )}
                    {(!isLayout3 && !isLayout4 && !isLayout5 && !isLayout6) && (
                        isLayout2 ? (
                            <div className="flex-1 h-[1px] bg-white/40"></div>
                        ) : (
                            <div className="h-[1px] w-[92%] mx-auto bg-white/20"></div>
                        )
                    )}
                </div>
                {(isLayout4 || isLayout6) && <div className="h-[1px] w-full bg-black/10 mb-[1.5cqw]"></div>}

                {addSearch && (
                    <div className={isLayout5 ? "relative mb-[2cqw] w-full flex-none" : (isLayout4 || isLayout6) ? "relative mb-[2cqw] px-[2cqw] flex-none" : isLayout3 ? "flex items-center mb-[1.5cqw] w-full" : isLayout2 ? "relative mb-[2cqw]" : "relative mb-[2cqw] px-[2cqw] flex-none"}>
                        <Icon
                            icon="lucide:search"
                            className={isLayout5 ? "absolute left-[1.2cqw] top-1/2 -translate-y-1/2 w-[1.2cqw] h-[1.2cqw] text-[#A3A6C4]" : (isLayout4 || isLayout6) ? "absolute left-[2.8cqw] top-1/2 -translate-y-1/2 w-[1.4cqw] h-[1.4cqw] text-gray-400" : isLayout3 ? "flex-shrink-0 w-[1.1cqw] h-[1.1cqw] text-[#A3A6C4] ml-[0.2cqw]" : isLayout2 ? "absolute left-[0.8cqw] top-1/2 -translate-y-1/2 w-[1.1cqw] h-[1.1cqw] text-white/70" : "absolute left-[3.2cqw] top-1/2 -translate-y-1/2 w-[1.5cqw] h-[1.5cqw] text-white/60"}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={isLayout5
                                ? "w-full rounded-[0.6cqw] pl-[3.2cqw] pr-[1cqw] py-[0.8cqw] text-[1.2cqw] outline-none transition-colors placeholder:text-[#A3A6C4] text-[#575C9C] bg-[#F8F9FA] border border-gray-200"
                                : (isLayout4 || isLayout6) ? "w-full rounded-[0.5cqw] pl-[3cqw] pr-[1cqw] py-[0.6cqw] text-[1.4cqw] outline-none border border-gray-300 transition-colors placeholder:text-gray-400 text-gray-700 bg-white"
                                    : isLayout3
                                        ? "flex-1 min-w-0 pl-[0.5cqw] pr-[0.8cqw] py-[0.5cqw] text-[0.9cqw] outline-none bg-transparent placeholder:text-[#A3A6C4] text-[#4F4A95] font-medium leading-tight"
                                        : isLayout2
                                            ? "w-full rounded-[0.8cqw] pl-[2.8cqw] pr-[0.8cqw] py-[0.6cqw] text-[1cqw] outline-none transition-colors placeholder:text-white/50 text-white"
                                            : "w-full rounded-full pl-[4cqw] pr-[1.5cqw] py-[0.8cqw] text-[1.4cqw] outline-none border transition-colors placeholder:text-white/50 text-white"}
                            style={isLayout6 || isLayout4 || isLayout3
                                ? {}
                                : isLayout2
                                    ? { backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.1)' }
                                    : { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }
                            }
                        />
                    </div>
                )}
                

                <div className={isLayout5 ? "flex-1 overflow-y-auto pb-[1cqw]" : (isLayout4 || isLayout6) ? "flex-1 overflow-y-auto px-[1.5cqw] pb-[2cqw]" : isLayout3 ? "flex-1 overflow-y-auto pb-[1cqw]" : isLayout2 ? "flex-1 overflow-y-auto pb-[1cqw]" : "flex-1 overflow-y-auto px-[1.5cqw] pb-[2cqw]"} style={{ scrollbarWidth: 'none' }}>
                    {filteredContent.length > 0 ? (
                        filteredContent.map((heading, hIdx) => (
                            <React.Fragment key={heading.id || hIdx}>
                                <div
                                    className={isLayout5 ? "flex items-center justify-between px-[1cqw] py-[0.8cqw] hover:bg-[#F8F9FA] rounded-[0.6cqw] transition-colors cursor-pointer group text-[#575C9C]" : (isLayout4 || isLayout6) ? "flex items-center justify-between px-[1.5cqw] py-[1cqw] hover:bg-black/5 rounded-[0.5cqw] transition-colors cursor-pointer group text-gray-700" : isLayout3 ? "flex items-center justify-between px-[1cqw] py-[0.8cqw] hover:bg-[#E3E4EF] rounded-[0.6cqw] transition-colors cursor-pointer group text-[#4F4A95]" : "flex items-center justify-between px-[1.5cqw] py-[0.8cqw] hover:bg-white/10 rounded-[0.8cqw] transition-colors cursor-pointer group text-white"}
                                    onClick={() => {
                                        onNavigate(heading.page - 1);
                                        onClose();
                                    }}
                                >
                                    <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                        <span className={isLayout5 ? "text-[1.2cqw] font-bold truncate" : isLayout3 ? "text-[1cqw] font-bold truncate" : isLayout2 ? "text-[1.1cqw] font-bold truncate" : "text-[1.5cqw] font-bold truncate"}>
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
                                        className={isLayout5 ? "flex items-center justify-between px-[1cqw] py-[0.6cqw] ml-[1.5cqw] hover:bg-[#F8F9FA] rounded-[0.5cqw] transition-colors cursor-pointer group text-[#575C9C]/90" : isLayout3 ? "flex items-center justify-between px-[1cqw] py-[0.6cqw] ml-[1.5cqw] hover:bg-[#E3E4EF] rounded-[0.5cqw] transition-colors cursor-pointer group text-[#4F4A95]/90" : "flex items-center justify-between px-[1.5cqw] py-[0.6cqw] ml-[2cqw] hover:bg-white/10 rounded-[0.5cqw] transition-colors cursor-pointer group text-white/90"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate(sub.page - 1);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex items-center gap-[1cqw] truncate flex-1 min-w-0">
                                            <span className={isLayout5 ? "text-[1.1cqw] font-normal truncate" : (isLayout4 || isLayout6) ? "text-[1.3cqw] font-normal truncate" : isLayout3 ? "text-[0.9cqw] font-normal truncate" : isLayout2 ? "text-[0.9cqw] font-normal truncate" : "text-[1.3cqw] font-normal truncate"}>
                                                {addSerialNumberSubheading && <span className="mr-[0.5cqw]">{hIdx + 1}.{sIdx + 1}</span>}
                                                {sub.title || sub.label}
                                            </span>
                                        </div>
                                        {addPageNumber && (
                                            <span className={isLayout5 ? "text-[0.9cqw] font-medium flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" : (isLayout4 || isLayout6) ? "text-[1.2cqw] font-medium flex-shrink-0 ml-[1cqw] tabular-nums opacity-60" : isLayout3 ? "text-[0.8cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" : isLayout2 ? "text-[0.8cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-70" : "text-[1.2cqw] font-bold flex-shrink-0 ml-[1cqw] tabular-nums opacity-70"}>
                                                {sub.page < 10 ? `0${sub.page}` : sub.page}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))
                    ) : (
                        <div className={isLayout6 ? "flex flex-col items-center justify-center py-[10cqw] select-none text-[#A3A6C4] font-bold" : isLayout5 ? "flex flex-col items-center justify-center py-[4cqw] select-none text-[#A3A6C4] font-medium" : isLayout4 ? "flex flex-col items-center justify-center py-[10cqw] select-none text-[#A3A6C4] font-medium" : isLayout3 ? "flex flex-col items-center justify-center py-[2cqw] select-none text-[#A3A6C4] font-medium" : isLayout2 ? "flex flex-col items-center justify-center py-[2cqw] opacity-70 select-none text-white font-bold tracking-wide" : "flex flex-col items-center justify-center py-[4cqw] opacity-60 select-none text-white font-semibold"}>
                            <span className={isLayout6 ? "text-[1.4cqw]" : isLayout5 ? "text-[1.2cqw]" : isLayout4 ? "text-[1.4cqw]" : isLayout3 ? "text-[1.1cqw]" : isLayout2 ? "text-[1cqw]" : "text-[1.4cqw]"} style={isLayout2 ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : {}}>
                                {isLayout5 ? 'No content' : 'No Table Of Content Found'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TabletTableOfContentsPopup;
