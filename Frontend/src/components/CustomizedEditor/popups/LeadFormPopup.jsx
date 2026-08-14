import React from 'react';
import { Icon } from '@iconify/react';

const LeadFormPopup = ({
    leadFormSettings,
    isTablet,
    isMobile,
    onClose
}) => {
    if (!leadFormSettings) return null;

    /* ─── MOBILE PORTRAIT ─────────────────────────────────────────────────── */
    if (isMobile) {
        return (
            <div className="absolute inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="relative w-full" style={{ fontFamily: leadFormSettings.appearance.fontStyle || 'Inter' }}>
                    {/* Card */}
                    <div
                        className="w-full rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-300"
                        style={{
                            fontFamily: leadFormSettings.appearance.fontStyle || 'Inter',
                            backgroundColor: leadFormSettings.appearance.bgFill || '#ffffff',
                            borderColor: leadFormSettings.appearance.bgStroke && leadFormSettings.appearance.bgStroke !== '#'
                                ? leadFormSettings.appearance.bgStroke : '#F3F4F6'
                        }}
                    >
                        <div className="p-3 space-y-2">
                            {/* Header */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-3 relative">
                                    <h2
                                        className="text-[17px] font-semibold leading-none shrink-0"
                                        style={{
                                            color: leadFormSettings.appearance.textFill || '#111827',
                                            WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#'
                                                ? `0.5px ${leadFormSettings.appearance.textStroke}` : 'none'
                                        }}
                                    >
                                        {leadFormSettings.formTitle || 'Lead Form'}
                                    </h2>
                                    <div
                                        className="h-px flex-1"
                                        style={{ backgroundColor: leadFormSettings.appearance.bgStroke && leadFormSettings.appearance.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#E5E7EB' }}
                                    />
                                    {leadFormSettings.appearance.allowSkip ? (
                                        <button
                                            onClick={onClose}
                                            className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
                                        >
                                            Skip
                                        </button>
                                    ) : (
                                        <button
                                            onClick={onClose}
                                            className="w-7 h-7 flex items-center justify-center border-[1.5px] border-red-500 rounded-md hover:bg-red-50 transition-all flex-shrink-0"
                                        >
                                            <Icon icon="lucide:x" className="w-3.5 h-3.5 text-red-500 stroke-[3]" />
                                        </button>
                                    )}
                                </div>
                                <p
                                    className="text-[11px] font-semibold"
                                    style={{
                                        color: leadFormSettings.appearance.textFill || '#1F2937',
                                        WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#'
                                            ? `0.3px ${leadFormSettings.appearance.textStroke}` : 'none'
                                    }}
                                >
                                    {!leadFormSettings.appearance.allowSkip || leadFormSettings.appearance.timing === 'end'
                                        ? "Enter your details*"
                                        : <>Enter your details to continue <span className="text-red-500 font-semibold">*</span></>
                                    }
                                </p>
                            </div>

                            {/* Lead Message */}
                            <div className="py-1 text-center">
                                <p
                                    className="text-[0.9vw] font-semibold"
                                    style={{
                                        color: leadFormSettings.appearance.textFill || '#111827',
                                        WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#'
                                            ? `0.3px ${leadFormSettings.appearance.textStroke}` : 'none'
                                    }}
                                >
                                    {leadFormSettings.leadText !== undefined ? leadFormSettings.leadText : 'Tell us about your requirements and our team will reach out.'}
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="w-full max-h-[55vh] overflow-y-auto pr-1 pb-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                <div className="space-y-3 w-full pb-2">
                                {(leadFormSettings.fields || []).map(field => {
                                    if (field.type === 'feedback') {
                                        return (
                                            <div key={field.id} className="space-y-1.5">
                                                <textarea
                                                    placeholder={field.placeholder || 'Enter your Feedback'}
                                                    className="w-full bg-white border rounded-lg p-3 text-[12px] font-medium focus:outline-none transition-all resize-none shadow-sm h-20"
                                                    style={{
                                                        borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                                        color: leadFormSettings.appearance.textFill || '#111827',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                                    onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                                />
                                            </div>
                                        );
                                    }

                                    if (field.type === 'rating') {
                                        return (
                                            <div key={field.id} className="space-y-1.5 flex flex-col pt-1 pb-2">
                                                <label 
                                                    className="text-[12px] font-medium"
                                                    style={{ color: leadFormSettings.appearance.textFill || '#111827' }}
                                                >
                                                    {field.label || 'Provide Ratings'}
                                                </label>
                                                <div className="flex items-center gap-3 px-3 py-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Icon key={star} icon="lucide:star" className="w-8 h-8 text-yellow-400 stroke-[1.5] cursor-pointer hover:scale-110 transition-transform" />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (field.type === 'checkbox') {
                                        return (
                                            <div key={field.id} className="space-y-2 flex flex-col pt-1 pb-2">
                                                <label 
                                                    className="text-[12px] font-medium"
                                                    style={{ color: leadFormSettings.appearance.textFill || '#111827' }}
                                                >
                                                    {field.label || 'Interested Products'}
                                                </label>
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                                    {(field.options || []).map((opt, idx) => (
                                                        <label key={idx} className="flex items-center gap-2 cursor-pointer relative">
                                                            <input 
                                                                type="checkbox" 
                                                                className="peer shrink-0 w-4 h-4 border border-gray-400 rounded-sm checked:bg-[#3E4491] checked:border-[#3E4491] focus:ring-0 appearance-none transition-all"
                                                                defaultChecked={idx === 0} 
                                                            />
                                                            <Icon icon="lucide:check" className="absolute w-3 h-3 left-[2px] text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                                                            <span className="text-[12px] text-gray-700 leading-tight truncate">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (field.type === 'dropdown') {
                                        return (
                                            <div key={field.id} className="relative">
                                                <select
                                                    className="w-full bg-white border rounded-lg py-2.5 px-3 text-[12px] font-medium focus:outline-none transition-all shadow-sm appearance-none"
                                                    style={{
                                                        borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                                        color: leadFormSettings.appearance.textFill || '#111827',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                                    onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                                >
                                                    <option value="" disabled selected>{field.label || 'Select Option'}</option>
                                                    {(field.options || []).map((opt, idx) => (
                                                        <option key={idx} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Icon icon="fluent:chevron-down-12-regular" className="w-4 h-4 text-gray-500" />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={field.id} className="relative">
                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${field.type === 'phone' ? 'text-gray-400' : 'text-gray-900'}`}>
                                                {field.type === 'email' ? <Icon icon="logos:google-gmail" className="w-4 h-4" /> :
                                                 field.type === 'phone' ? <Icon icon="lucide:phone" className="w-4 h-4" /> :
                                                 field.type === 'company' ? <Icon icon="lucide:building-2" className="w-4 h-4" /> :
                                                 <Icon icon="lucide:user" className="w-4 h-4" />}
                                            </div>
                                            <input
                                                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                                placeholder={field.placeholder || `Enter your ${field.type}`}
                                                className="w-full bg-white border rounded-lg py-2.5 pl-9 pr-3 text-[12px] font-medium focus:outline-none transition-all shadow-sm"
                                                style={{
                                                    borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                                    color: leadFormSettings.appearance.textFill || '#111827',
                                                    fontFamily: 'inherit'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                                onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                            />
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                            {/* Submit Button */}
                            <div className="mt-4 w-full">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 rounded-lg text-[13px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] shadow-md tracking-wider"
                                    style={{
                                        backgroundColor: leadFormSettings.appearance.btnFill || '#3E4491',
                                        color: leadFormSettings.appearance.btnText || '#ffffff',
                                        border: leadFormSettings.appearance.btnStroke && leadFormSettings.appearance.btnStroke !== '#'
                                            ? `1.5px solid ${leadFormSettings.appearance.btnStroke}` : 'none',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {leadFormSettings.buttonText || 'SUBMIT'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── DESKTOP / TABLET ────────────────────────────────────────────────── */
    return (
        <div className="absolute inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-[0.25vw]">
            <div className="relative" style={{ fontFamily: leadFormSettings.appearance.fontStyle || 'Inter' }}>
                <div
                    className={`${isTablet ? 'w-[24vw] rounded-[1vw]' : 'w-[30vw] rounded-[1.3vw]'} shadow-[0_1vw_4vw_rgba(0,0,0,0.1)] overflow-hidden relative border animate-in zoom-in-95 duration-300`}
                    style={{
                        fontFamily: leadFormSettings.appearance.fontStyle || 'Inter',
                        backgroundColor: leadFormSettings.appearance.bgFill || '#ffffff',
                        borderColor: leadFormSettings.appearance.bgStroke && leadFormSettings.appearance.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#F3F4F6'
                    }}
                >
                    <div className={`${isTablet ? 'p-[1vw] space-y-[0.6vw]' : 'py-[1.2vw] px-[2vw] space-y-[0.6vw]'}`}>
                        {/* Header & Lead Message */}
                        <div className="relative text-center pb-[0.2vw]">
                            {leadFormSettings.appearance.allowSkip ? (
                                <button
                                    onClick={onClose}
                                    className={`absolute right-0 top-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold text-[#3E4491] hover:brightness-150 underline underline-offset-2 transition-colors cursor-pointer`}
                                >
                                    Skip
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className={`absolute right-0 top-0 ${isTablet ? 'w-[1.4vw] h-[1.4vw] rounded-[0.2vw]' : 'w-[1.7vw] h-[1.7vw] rounded-[0.35vw]'} flex items-center justify-center border-[1.5px] border-red-500 hover:bg-red-50 transition-all cursor-pointer`}
                                >
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1vw] h-[1vw]'} text-red-500 stroke-[3]`} />
                                </button>
                            )}
                            
                            <h2
                                className={`${isTablet ? 'text-[1.2vw]' : 'text-[1.5vw]'} font-semibold mb-[0.2vw] mt-[0.3vw]`}
                                style={{
                                    color: '#000000',
                                    WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#' ? `0.02vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                }}
                            >
                                {leadFormSettings.formTitle || 'Request More Information'}
                            </h2>
                            
                            <p
                                className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-normal text-gray-600`}
                                style={{
                                    color: '#000000',
                                    WebkitTextStroke: leadFormSettings.appearance.textStroke && leadFormSettings.appearance.textStroke !== '#' ? `0.01vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                }}
                            >
                                {leadFormSettings.leadText !== undefined ? leadFormSettings.leadText : 'Tell us about your requirements and our team will reach out.'}
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="w-full max-h-[55vh] overflow-y-auto pr-[0.4vw] pb-[0.4vw] [&::-webkit-scrollbar]:w-[0.4vw] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <div className={`${isTablet ? 'space-y-[0.8vw] w-full max-w-[14vw]' : 'space-y-[0.7vw] w-full max-w-[18vw]'} mx-auto`}>
                            {(leadFormSettings.fields || []).map(field => {
                                return (
                                    <div key={field.id} className="flex flex-col space-y-[0.2vw]">
                                        {/* Field Label */}
                                        <label 
                                            className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-normal`}
                                            style={{ color: '#000000' }}
                                        >
                                            {field.label}
                                        </label>

                                        {/* Field Input Area */}
                                        <div className="relative">
                                            {field.type === 'feedback' ? (
                                                <textarea
                                                    placeholder={field.placeholder || 'Enter your Feedback'}
                                                    className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] p-[0.8vw] text-[0.5vw] h-[6vw]' : 'rounded-[0.6vw] p-[1vw] text-[0.75vw] h-[8vw]'} font-medium focus:outline-none transition-all resize-none shadow-sm`}
                                                    style={{
                                                        borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                                        color: leadFormSettings.appearance.textFill || '#111827',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                                    onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                                />
                                            ) : field.type === 'rating' ? (
                                                <div className={`flex items-center ${isTablet ? 'gap-[1vw] py-[0.5vw] px-[1vw]' : 'gap-[1.2vw] py-[0.5vw] px-[1.5vw]'}`}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Icon key={star} icon="lucide:star" className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.2vw] h-[2.2vw]'} text-yellow-400 stroke-[1.5] cursor-pointer hover:scale-110 transition-transform`} />
                                                    ))}
                                                </div>
                                            ) : field.type === 'dropdown' ? (
                                                <>
                                                    <select
                                                        className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] py-[0.5vw] px-[0.8vw] text-[0.5vw]' : 'rounded-[0.6vw] py-[0.5vw] px-[0.9vw] text-[0.75vw]'} font-medium focus:outline-none transition-all shadow-sm appearance-none`}
                                                        style={{
                                                            borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                                            color: leadFormSettings.appearance.textFill || '#111827',
                                                            fontFamily: 'inherit'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                                        onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                                    >
                                                        <option value="" disabled selected>{field.placeholder || `Select Option`}</option>
                                                        {(field.options || []).map((opt, idx) => (
                                                            <option key={idx} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                    <div className={`${isTablet ? 'right-[0.6vw]' : 'right-[0.9vw]'} absolute top-1/2 -translate-y-1/2 pointer-events-none`}>
                                                        <Icon icon="fluent:chevron-down-12-regular" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.1vw] h-[1.1vw]'} text-gray-500`} />
                                                    </div>
                                                </>
                                            ) : field.type === 'checkbox' ? (
                                                <div className={`grid grid-cols-2 ${isTablet ? 'gap-y-[0.6vw] gap-x-[1vw] pt-[0.2vw]' : 'gap-y-[0.8vw] gap-x-[1.2vw] pt-[0.3vw]'}`}>
                                                    {(field.options || []).map((opt, idx) => (
                                                        <label key={idx} className="flex items-center gap-[0.4vw] cursor-pointer relative">
                                                            <input 
                                                                type="checkbox" 
                                                                className={`peer shrink-0 ${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'} border border-gray-500 rounded-sm checked:bg-[#3E4491] checked:border-[#3E4491] focus:ring-0 appearance-none transition-all`}
                                                                defaultChecked={idx === 0} 
                                                            />
                                                            <Icon icon="lucide:check" className={`absolute ${isTablet ? 'w-[0.6vw] h-[0.6vw] left-[0.1vw]' : 'w-[0.8vw] h-[0.8vw] left-[0.1vw]'} text-white pointer-events-none opacity-0 peer-checked:opacity-100`} />
                                                            <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} text-gray-700 leading-tight truncate`}>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`${isTablet ? 'left-[0.6vw] pr-[0.5vw]' : 'left-[0.8vw] pr-[0.7vw]'} absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-900`}>
                                                        {field.type === 'email' ? <Icon icon="logos:google-gmail" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                         field.type === 'phone' ? <Icon icon="material-symbols:call" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                         field.type === 'company' ? <Icon icon="lucide:building-2" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                         <Icon icon="lucide:user" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                                    </div>
                                                    <input
                                                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                                        placeholder={field.placeholder || `Enter your ${field.type}`}
                                                        className={`w-full bg-white border ${isTablet ? 'rounded-[0.4vw] py-[0.5vw] pl-[2.5vw] pr-[0.8vw] text-[0.5vw]' : 'rounded-[0.6vw] py-[0.5vw] pl-[3.5vw] pr-[0.9vw] text-[0.75vw]'} font-medium focus:outline-none transition-all shadow-sm`}
                                                        style={{
                                                            borderColor: leadFormSettings.appearance.bgStroke || '#D1D5DB',
                                                            color: leadFormSettings.appearance.textFill || '#111827',
                                                            fontFamily: 'inherit'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = leadFormSettings.appearance.btnFill || '#3E4491'}
                                                        onBlur={(e) => e.target.style.borderColor = leadFormSettings.appearance.bgStroke || '#D1D5DB'}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Submit Button */}
                            <div className={`w-full mt-[0.4vw]`}>
                                <button
                                    onClick={onClose}
                                    className={`w-full ${isTablet ? 'py-[0.5vw] rounded-[0.5vw] text-[0.7vw]' : 'py-[0.5vw] rounded-[0.6vw] text-[0.8vw]'} font-semibold transition-all hover:brightness-110 active:scale-[0.98] shadow-md `}
                                    style={{
                                        backgroundColor: leadFormSettings.appearance.btnFill || '#3E4491',
                                        color: leadFormSettings.appearance.btnText || '#ffffff',
                                        border: leadFormSettings.appearance.btnStroke && leadFormSettings.appearance.btnStroke !== '#' ? `1.5px solid ${leadFormSettings.appearance.btnStroke}` : 'none',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {leadFormSettings.buttonText || 'SUBMIT'}
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadFormPopup;
