import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const LeadFormPopup = ({
    leadFormSettings,
    isTablet,
    isMobile,
    vId,
    shareId,
    flipbookName,
    userEmail,
    onClose
}) => {
    const [formValues, setFormValues] = useState({});
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [viewerIp, setViewerIp] = useState('');

    useEffect(() => {
        let isMounted = true;
        axios.get('https://api.ipify.org?format=json', { timeout: 2500 })
            .then(res => {
                if (isMounted && res.data?.ip) setViewerIp(res.data.ip);
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const isEnabled = leadFormSettings?.enabled === true || leadFormSettings?.enabled === 'true';
    if (!leadFormSettings || !isEnabled) return null;

    const handleInputChange = (fieldKey, value) => {
        setFormValues(prev => ({
            ...prev,
            [fieldKey]: value
        }));
        if (errors[fieldKey]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[fieldKey];
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isSubmitted) return;

        const newErrors = {};
        const fields = leadFormSettings.fields || [];

        fields.forEach(field => {
            const fieldKey = field.label || field.type;
            const value = (formValues[fieldKey] || '').trim();

            // 1. Required check: Mandatory mode (!allowSkip) or field.required
            if (field.required || !leadFormSettings.appearance?.allowSkip) {
                if (!value) {
                    newErrors[fieldKey] = `${field.label || 'This field'} is required`;
                    return;
                }
            }

            // 2. Email validation
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    newErrors[fieldKey] = 'Please enter a valid email address';
                }
            }

            // 3. Phone validation
            if (field.type === 'phone' && value) {
                const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
                if (!phoneRegex.test(value)) {
                    newErrors[fieldKey] = 'Please enter a valid phone number';
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        setIsSubmitting(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/flipbook/submit-lead`, {
                v_id: vId,
                shareId: shareId,
                flipbookName: flipbookName,
                userEmail: userEmail,
                leadData: formValues,
                viewerIp: viewerIp || ''
            });
            setIsSubmitted(true);
            try {
                if (vId && vId !== 'preview') localStorage.setItem(`lead_form_submitted_${vId}`, 'true');
            } catch (e) {}
            setTimeout(() => {
                if (onClose) onClose();
            }, 1800);
        } catch (err) {
            console.error("Lead submission error:", err);
            setIsSubmitted(true);
            setTimeout(() => {
                if (onClose) onClose();
            }, 1800);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── MOBILE PORTRAIT ─────────────────────────────────────────────────── */
    if (isMobile) {
        return (
            <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="relative w-full" style={{ fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter' }}>
                    <div
                        className="w-full rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-300"
                        style={{
                            fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter',
                            backgroundColor: leadFormSettings.appearance?.bgFill || '#ffffff',
                            borderColor: leadFormSettings.appearance?.bgStroke && leadFormSettings.appearance?.bgStroke !== '#'
                                ? leadFormSettings.appearance.bgStroke : '#F3F4F6'
                        }}
                    >
                        <div className="p-4 space-y-3">
                            {isSubmitted ? (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                                        <Icon icon="lucide:check" className="w-6 h-6 stroke-[3]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Thank You!</h3>
                                    <p className="text-xs text-gray-600">Your details have been submitted successfully.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3 relative">
                                            <h2
                                                className="text-[17px] font-semibold leading-none shrink-0"
                                                style={{
                                                    color: leadFormSettings.appearance?.textFill || '#111827',
                                                    WebkitTextStroke: leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#'
                                                        ? `0.5px ${leadFormSettings.appearance.textStroke}` : 'none'
                                                }}
                                            >
                                                {leadFormSettings.formTitle || 'Lead Form'}
                                            </h2>
                                            <div
                                                className="h-px flex-1"
                                                style={{ backgroundColor: leadFormSettings.appearance?.bgStroke && leadFormSettings.appearance?.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#E5E7EB' }}
                                            />
                                            {leadFormSettings.appearance?.allowSkip && (
                                                <button
                                                    onClick={onClose}
                                                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
                                                >
                                                    Skip
                                                </button>
                                            )}
                                        </div>
                                        <p
                                            className="text-[11px] font-semibold"
                                            style={{
                                                color: leadFormSettings.appearance?.textFill || '#1F2937',
                                                WebkitTextStroke: leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#'
                                                    ? `0.3px ${leadFormSettings.appearance.textStroke}` : 'none'
                                            }}
                                        >
                                            {!leadFormSettings.appearance?.allowSkip || leadFormSettings.appearance?.timing === 'end'
                                                ? "Enter your details*"
                                                : <>Enter your details to continue <span className="text-red-500 font-semibold">*</span></>
                                            }
                                        </p>
                                    </div>

                                    {/* Lead Message */}
                                    <div className="py-1 text-center">
                                        <p
                                            className="text-[12px] font-semibold"
                                            style={{
                                                color: leadFormSettings.appearance?.textFill || '#111827',
                                                WebkitTextStroke: leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#'
                                                    ? `0.3px ${leadFormSettings.appearance.textStroke}` : 'none'
                                            }}
                                        >
                                            {leadFormSettings.leadText !== undefined ? leadFormSettings.leadText : 'Tell us about your requirements and our team will reach out.'}
                                        </p>
                                    </div>

                                    {/* Form Fields */}
                                    <form onSubmit={handleSubmit} className="space-y-3 w-full">
                                        {(leadFormSettings.fields || []).map(field => {
                                            const fieldKey = field.label || field.type;
                                            const hasError = Boolean(errors[fieldKey]);
                                            if (field.type === 'feedback') {
                                                return (
                                                    <div key={field.id} className="space-y-1">
                                                        <textarea
                                                            placeholder={field.placeholder || 'Enter your Feedback'}
                                                            value={formValues[fieldKey] || ''}
                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                            className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} rounded-lg p-3 text-[12px] font-medium focus:outline-none transition-all resize-none shadow-sm h-20`}
                                                            style={{
                                                                borderColor: hasError ? '#EF4444' : '#D1D5DB',
                                                                color: leadFormSettings.appearance?.textFill || '#111827',
                                                                fontFamily: 'inherit'
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            }

                                            if (field.type === 'dropdown') {
                                                return (
                                                    <div key={field.id} className="relative">
                                                        <select
                                                            value={formValues[fieldKey] || ''}
                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                            className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} rounded-lg py-2.5 px-3 text-[12px] font-medium focus:outline-none transition-all shadow-sm appearance-none`}
                                                            style={{
                                                                borderColor: hasError ? '#EF4444' : '#D1D5DB',
                                                                color: leadFormSettings.appearance?.textFill || '#111827',
                                                                fontFamily: 'inherit'
                                                            }}
                                                        >
                                                            <option value="" disabled>{field.label || 'Select Option'}</option>
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
                                                        value={formValues[fieldKey] || ''}
                                                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                        className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} rounded-lg py-2.5 pl-9 pr-3 text-[12px] font-medium focus:outline-none transition-all shadow-sm`}
                                                        style={{
                                                            borderColor: hasError ? '#EF4444' : '#D1D5DB',
                                                            color: leadFormSettings.appearance?.textFill || '#111827',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {Object.values(errors).filter(Boolean).length > 0 && (
                                            <div className="w-full bg-red-50 border border-red-200 text-red-600 rounded-lg p-2 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                                                <Icon icon="lucide:alert-circle" className="w-4 h-4 shrink-0" />
                                                <span>{Object.values(errors).filter(Boolean).find(msg => msg && msg.includes('valid')) || 'Please fill in all required fields'}</span>
                                            </div>
                                        )}
                                        <div className="mt-3 w-full">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-3 rounded-lg text-[13px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] shadow-md tracking-wider flex items-center justify-center gap-2"
                                                style={{
                                                    backgroundColor: leadFormSettings.appearance?.btnFill || '#3E4491',
                                                    color: leadFormSettings.appearance?.btnText || '#ffffff',
                                                    border: leadFormSettings.appearance?.btnStroke && leadFormSettings.appearance?.btnStroke !== '#'
                                                        ? `1.5px solid ${leadFormSettings.appearance.btnStroke}` : 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    leadFormSettings.buttonText || 'SUBMIT'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── DESKTOP / TABLET ────────────────────────────────────────────────── */
    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-[0.25vw]">
            <div className="relative" style={{ fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter' }}>
                <div
                    className={`${isTablet ? 'w-[24vw] rounded-[1vw]' : 'w-[30vw] rounded-[1.3vw]'} max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_1vw_4vw_rgba(0,0,0,0.1)] relative border animate-in zoom-in-95 duration-300`}
                    style={{
                        fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter',
                        backgroundColor: leadFormSettings.appearance?.bgFill || '#ffffff',
                        borderColor: leadFormSettings.appearance?.bgStroke && leadFormSettings.appearance?.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#F3F4F6'
                    }}
                >
                    <div className={`${isTablet ? 'p-[1vw] space-y-[0.6vw]' : 'py-[1.2vw] px-[2vw] space-y-[0.6vw]'}`}>
                        {isSubmitted ? (
                            <div className="py-[2vw] text-center space-y-[0.8vw]">
                                <div className="w-[3vw] h-[3vw] rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                                    <Icon icon="lucide:check" className="w-[1.5vw] h-[1.5vw] stroke-[3]" />
                                </div>
                                <h3 className="text-[1.2vw] font-bold text-gray-900">Thank You!</h3>
                                <p className="text-[0.75vw] text-gray-600">Your details have been submitted successfully.</p>
                            </div>
                        ) : (
                            <>
                                {/* Header & Lead Message */}
                                <div className="relative text-center pb-[0.2vw]">
                                    {leadFormSettings.appearance?.allowSkip && (
                                        <button
                                            onClick={onClose}
                                            className={`absolute right-0 top-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold text-[#3E4491] hover:brightness-150 underline underline-offset-2 transition-colors cursor-pointer`}
                                        >
                                            Skip
                                        </button>
                                    )}
                                    
                                    <h2
                                        className={`${isTablet ? 'text-[1.2vw]' : 'text-[1.5vw]'} font-semibold mb-[0.2vw] mt-[0.3vw]`}
                                        style={{
                                            color: '#000000',
                                            WebkitTextStroke: leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#' ? `0.02vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                        }}
                                    >
                                        {leadFormSettings.formTitle || 'Request More Information'}
                                    </h2>
                                    
                                    <p
                                        className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-normal text-gray-600`}
                                        style={{
                                            color: '#000000',
                                            WebkitTextStroke: leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#' ? `0.01vw ${leadFormSettings.appearance.textStroke}` : 'none'
                                        }}
                                    >
                                        {leadFormSettings.leadText !== undefined ? leadFormSettings.leadText : 'Tell us about your requirements and our team will reach out.'}
                                    </p>
                                </div>

                                {/* Form Fields */}
                                <form onSubmit={handleSubmit} className={`${isTablet ? 'space-y-[0.8vw] w-full max-w-[14vw]' : 'space-y-[0.7vw] w-full max-w-[18vw]'} mx-auto`}>
                                    {(leadFormSettings.fields || []).map(field => {
                                        const fieldKey = field.label || field.type;
                                        const hasError = Boolean(errors[fieldKey]);
                                        return (
                                            <div key={field.id} className="flex flex-col space-y-[0.2vw]">
                                                <label 
                                                    className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-normal`}
                                                    style={{ color: '#000000' }}
                                                >
                                                    {field.label} {(!leadFormSettings.appearance?.allowSkip || field.required) && <span className="text-red-500">*</span>}
                                                </label>

                                                <div className="relative">
                                                    {field.type === 'feedback' ? (
                                                        <textarea
                                                            placeholder={field.placeholder || 'Enter your Feedback'}
                                                            value={formValues[fieldKey] || ''}
                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                            className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} ${isTablet ? 'rounded-[0.4vw] p-[0.8vw] text-[0.5vw] h-[6vw]' : 'rounded-[0.6vw] p-[1vw] text-[0.75vw] h-[8vw]'} font-medium focus:outline-none transition-all resize-none shadow-sm`}
                                                            style={{
                                                                borderColor: hasError ? '#EF4444' : '#D1D5DB',
                                                                color: leadFormSettings.appearance?.textFill || '#111827',
                                                                fontFamily: 'inherit'
                                                            }}
                                                        />
                                                    ) : field.type === 'dropdown' ? (
                                                        <>
                                                            <select
                                                                value={formValues[fieldKey] || ''}
                                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} ${isTablet ? 'rounded-[0.4vw] py-[0.5vw] px-[0.8vw] text-[0.5vw]' : 'rounded-[0.6vw] py-[0.5vw] px-[0.9vw] text-[0.75vw]'} font-medium focus:outline-none transition-all shadow-sm appearance-none`}
                                                                style={{
                                                                    borderColor: hasError ? '#EF4444' : '#D1D5DB',
                                                                    color: leadFormSettings.appearance?.textFill || '#111827',
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            >
                                                                <option value="" disabled>{field.placeholder || `Select Option`}</option>
                                                                {(field.options || []).map((opt, idx) => (
                                                                    <option key={idx} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                            <div className={`${isTablet ? 'right-[0.6vw]' : 'right-[0.9vw]'} absolute top-1/2 -translate-y-1/2 pointer-events-none`}>
                                                                <Icon icon="fluent:chevron-down-12-regular" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.1vw] h-[1.1vw]'} text-gray-500`} />
                                                            </div>
                                                        </>
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
                                                                value={formValues[fieldKey] || ''}
                                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} ${isTablet ? 'rounded-[0.4vw] py-[0.5vw] pl-[2.5vw] pr-[0.8vw] text-[0.5vw]' : 'rounded-[0.6vw] py-[0.5vw] pl-[3.5vw] pr-[0.9vw] text-[0.75vw]'} font-medium focus:outline-none transition-all shadow-sm`}
                                                                style={{
                                                                    borderColor: hasError ? '#EF4444' : '#D1D5DB',
                                                                    color: leadFormSettings.appearance?.textFill || '#111827',
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.values(errors).filter(Boolean).length > 0 && (
                                        <div className="w-full bg-red-50 border border-red-200 text-red-600 rounded-[0.4vw] py-[0.3vw] px-[0.6vw] text-[0.68vw] font-medium text-center flex items-center justify-center gap-[0.3vw] animate-in fade-in duration-200">
                                            <Icon icon="lucide:alert-circle" className="w-[0.9vw] h-[0.9vw] shrink-0" />
                                            <span>{Object.values(errors).filter(Boolean).find(msg => msg && msg.includes('valid')) || 'Please fill in all required fields'}</span>
                                        </div>
                                    )}
                                    {/* Submit Button */}
                                    <div className="w-full mt-[0.4vw]">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full ${isTablet ? 'py-[0.5vw] rounded-[0.5vw] text-[0.7vw]' : 'py-[0.5vw] rounded-[0.6vw] text-[0.8vw]'} font-semibold transition-all hover:brightness-110 active:scale-[0.98] shadow-md flex items-center justify-center gap-[0.4vw]`}
                                            style={{
                                                backgroundColor: leadFormSettings.appearance?.btnFill || '#3E4491',
                                                color: leadFormSettings.appearance?.btnText || '#ffffff',
                                                border: leadFormSettings.appearance?.btnStroke && leadFormSettings.appearance?.btnStroke !== '#' ? `1.5px solid ${leadFormSettings.appearance.btnStroke}` : 'none',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            {isSubmitting ? (
                                                <Icon icon="lucide:loader-2" className="w-[1vw] h-[1vw] animate-spin" />
                                            ) : (
                                                leadFormSettings.buttonText || 'SUBMIT'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadFormPopup;
