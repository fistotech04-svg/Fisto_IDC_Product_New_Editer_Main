import React from 'react';
import { Icon } from '@iconify/react';

const LeadFormPopup = ({ 
    leadFormSettings, 
    isTablet, 
    onClose 
}) => {
    if (!leadFormSettings) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-[2vw]">
            <div className="relative" style={{ fontFamily: leadFormSettings.appearance.fontStyle || 'Inter' }}>
                <div
                    className={`${isTablet ? 'w-[28vw] rounded-[1vw]' : 'w-[40vw] rounded-[1.5vw]'} shadow-[0_1vw_4vw_rgba(0,0,0,0.1)] overflow-hidden relative border animate-in zoom-in-95 duration-300`}
                    style={{
                        fontFamily: leadFormSettings.appearance.fontStyle || 'Inter',
                        backgroundColor: leadFormSettings.appearance.bgFill || '#ffffff',
                        borderColor: leadFormSettings.appearance.bgStroke && leadFormSettings.appearance.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#F3F4F6'
                    }}
                >
                    <div className={`${isTablet ? 'p-[1.5vw] space-y-[1.2vw]' : 'p-[3.5vw] space-y-[2.5vw]'}`}>
                        {/* Header */}
                        <div className="space-y-[0.5vw]">
                            <div className={`flex items-center ${isTablet ? 'gap-[1vw]' : 'gap-[1.25vw]'} relative`}>
                                <h2
                                    className={`${isTablet ? 'text-[1.1vw]' : 'text-[1.8vw]'} font-semibold leading-none `}
                                    style={{
                                        color: leadFormSettings.appearance.textFill || '#111827',
                                        WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#' ? `0.02vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                    }}
                                >
                                    Lead Form
                                </h2>
                                <div
                                    className="h-[0.1vw] bg-gray-200 flex-1" 
                                    style={{ backgroundColor: leadFormSettings.appearance.bgStroke && leadFormSettings.appearance.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#E5E7EB' }}
                                />
                                {/* Close Button (X) - Always show Close button */}
                                <button
                                    onClick={onClose}
                                    className={`${isTablet ? 'w-[1.4vw] h-[1.4vw] rounded-[0.2vw]' : 'w-[2vw] h-[2vw] rounded-[0.4vw]'} flex items-center justify-center border-[1.5px] border-red-500 hover:bg-red-50 transition-all flex-shrink-0`}
                                >
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'} text-red-500 stroke-[3]`} />
                                </button>
                            </div>
                            <p
                                className={`${isTablet ? 'text-[0.55vw]' : 'text-[0.85vw]'} font-semibold`}
                                style={{
                                    color: leadFormSettings.appearance.textFill || '#1F2937',
                                    WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#' ? `0.01vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                }}
                            >
                                {!leadFormSettings.appearance.allowSkip || leadFormSettings.appearance.timing === 'end'
                                    ? "Enter your details*"
                                    : <>Enter your details to continue <span className="text-red-500 font-semibold">*</span></>
                                }
                            </p>
                        </div>

                        {/* Lead Message */}
                        <div className={`${isTablet ? 'py-[0.1vw]' : 'py-[0.5vw]'} text-center`}>
                            <p
                                className={`${isTablet ? 'text-[0.7vw]' : 'text-[1.1vw]'} font-semibold`}
                                style={{
                                    color: leadFormSettings.appearance.textFill || '#111827',
                                    WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#' ? `0.02vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                }}
                            >
                                &ldquo;{leadFormSettings.leadText || 'Share your information to get personalized updates.'}&rdquo;
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className={`${isTablet ? 'space-y-[0.8vw] max-w-[16vw]' : 'space-y-[1.25vw] max-w-[22vw]'} mx-auto`}>
                            {leadFormSettings.fields.name && (
                                <div className="relative">
                                    <div className={`${isTablet ? 'left-[0.6vw]' : 'left-[1vw]'} absolute top-1/2 -translate-y-1/2 text-gray-900`}>
                                        <Icon icon="lucide:user" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter your Name as Lead"
                                        className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] py-[0.4vw] pl-[2.2vw] pr-[0.8vw] text-[0.6vw]' : 'rounded-[0.7vw] py-[0.7vw] pl-[3.5vw] pr-[1vw] text-[0.85vw]'} font-medium focus:outline-none transition-all shadow-sm`}
                                        style={{
                                            borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                            color: leadFormSettings.appearance.textFill || '#111827',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                        onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                    />
                                </div>
                            )}
                            {leadFormSettings.fields.email && (
                                <div className="relative">
                                    <div className={`${isTablet ? 'left-[0.6vw]' : 'left-[1vw]'} absolute top-1/2 -translate-y-1/2`}>
                                        <Icon icon="logos:google-gmail" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Enter your Gmail as Lead"
                                        className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] py-[0.4vw] pl-[2.2vw] pr-[0.8vw] text-[0.6vw]' : 'rounded-[0.7vw] py-[0.7vw] pl-[3.5vw] pr-[1vw] text-[0.85vw]'} font-medium focus:outline-none transition-all shadow-sm`}
                                        style={{
                                            borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                            color: leadFormSettings.appearance.textFill || '#111827',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                        onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                    />
                                </div>
                            )}
                            {leadFormSettings.fields.phone && (
                                <div className="relative">
                                    <div className={`${isTablet ? 'left-[0.6vw]' : 'left-[1vw]'} absolute top-1/2 -translate-y-1/2 text-gray-400`}>
                                        <Icon icon="lucide:phone" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Enter your Phone Number"
                                        className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] py-[0.4vw] pl-[2.2vw] pr-[0.8vw] text-[0.6vw]' : 'rounded-[0.7vw] py-[0.7vw] pl-[3.5vw] pr-[1vw] text-[0.85vw]'} font-medium focus:outline-none transition-all shadow-sm`}
                                        style={{
                                            borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                            color: leadFormSettings.appearance.textFill || '#111827',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                        onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                    />
                                </div>
                            )}
                            {leadFormSettings.fields.feedback && (
                                <div className="space-y-[0.75vw]">
                                    <label
                                        className={`${isTablet ? 'text-[0.7vw]' : 'text-[1vw]'} font-semibold block`}
                                        style={{
                                            color: leadFormSettings.appearance.textFill || '#111827',
                                            WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#' ? `0.02vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                        }}
                                    >
                                        Enter your Feedback
                                    </label>
                                    <textarea
                                        placeholder="Enter your Feedback"
                                        className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] p-[0.8vw] text-[0.6vw] h-[6vw]' : 'rounded-[0.7vw] p-[1.2vw] text-[0.85vw] h-[9vw]'} font-medium focus:outline-none transition-all resize-none shadow-sm`}
                                        style={{
                                            borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                            color: leadFormSettings.appearance.textFill || '#111827',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                        onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* External Actions - Positioned below card */}
                <div className="flex items-center justify-end gap-[1vw] mt-[1.2vw] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 pr-[1vw]">
                    {leadFormSettings.appearance.allowSkip && (
                        <button
                            onClick={onClose}
                            className={`${isTablet ? 'px-[2.5vw] py-[0.55vw] rounded-[0.5vw] text-[0.65vw]' : 'px-[3.5vw] py-[0.9vw] rounded-[0.7vw] text-[0.9vw]'} font-semibold transition-all hover:brightness-110 active:scale-95 shadow-xl uppercase tracking-wider`}
                            style={{
                                backgroundColor: leadFormSettings.appearance.btnFill || '#3E4491',
                                color: leadFormSettings.appearance.btnText || '#ffffff',
                                border: leadFormSettings.appearance.btnStroke && leadFormSettings.appearance.btnStroke !== '#' ? `1.5px solid ${leadFormSettings.appearance.btnStroke}` : 'none',
                                fontFamily: 'inherit'
                            }}
                        >
                            SKIP
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${isTablet ? 'px-[2.5vw] py-[0.55vw] rounded-[0.5vw] text-[0.65vw]' : 'px-[3.5vw] py-[0.9vw] rounded-[0.7vw] text-[0.9vw]'} font-semibold transition-all hover:brightness-110 active:scale-95 shadow-xl uppercase tracking-wider`}
                        style={{
                            backgroundColor: leadFormSettings.appearance.btnFill || '#3E4491',
                            color: leadFormSettings.appearance.btnText || '#ffffff',
                            border: leadFormSettings.appearance.btnStroke && leadFormSettings.appearance.btnStroke !== '#' ? `1.5px solid ${leadFormSettings.appearance.btnStroke}` : 'none',
                            fontFamily: 'inherit'
                        }}
                    >
                        SUBMIT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadFormPopup;
