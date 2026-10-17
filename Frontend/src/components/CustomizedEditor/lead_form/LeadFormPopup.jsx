import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const hexToRgba = (hex, opacity = 100) => {
    if (!hex || hex === '#' || hex === 'transparent') return 'transparent';
    if (!hex.startsWith('#')) return hex;
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length >= 6) {
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;
        const a = (opacity !== undefined && opacity !== null ? opacity : 100) / 100;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return hex;
};

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
    const [productDropdownOpen, setProductDropdownOpen] = useState({});
    const [productSearchTerm, setProductSearchTerm] = useState({});

    useEffect(() => {
        let isMounted = true;
        axios.get('https://api.ipify.org?format=json', { timeout: 2500 })
            .then(res => {
                if (isMounted && res.data?.ip) setViewerIp(res.data.ip);
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-product-dropdown]')) {
                setProductDropdownOpen({});
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const handleToggleProduct = (fieldKey, prod) => {
        const currentList = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : [];
        const exists = currentList.find(p => (p.id ? p.id === prod.id : (typeof p === 'string' ? p : p.name) === prod.name));
        if (exists) {
            handleInputChange(fieldKey, currentList.filter(p => (p.id ? p.id !== prod.id : (typeof p === 'string' ? p : p.name) !== prod.name)));
        } else {
            const newItem = {
                id: prod.id || Date.now().toString(),
                name: prod.name,
                category: prod.category || '',
                image: prod.image || '',
                quantity: 1
            };
            handleInputChange(fieldKey, [...currentList, newItem]);
        }
    };

    const handleProductQtyChange = (fieldKey, prodIdentifier, delta) => {
        const currentList = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : [];
        const nextList = currentList.map(p => {
            const isMatch = p.id ? p.id === prodIdentifier : (typeof p === 'string' ? p : p.name) === prodIdentifier;
            if (isMatch) {
                const currQty = typeof p === 'object' && p.quantity ? p.quantity : 1;
                return { ...p, quantity: Math.max(1, currQty + delta) };
            }
            return p;
        });
        handleInputChange(fieldKey, nextList);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isSubmitted) return;

        const newErrors = {};
        const fields = leadFormSettings.fields || [];

        fields.forEach(field => {
            const fieldKey = field.id || field.label || field.type;
            const rawVal = formValues[fieldKey];
            const value = typeof rawVal === 'string' ? rawVal.trim() : (Array.isArray(rawVal) ? (rawVal.length > 0 ? 'selected' : '') : (rawVal ? String(rawVal) : ''));

            // 1. Required check: only fields marked as required
            if (field.required) {
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

        // Prepare payload for leadData
        const leadPayload = {};
        fields.forEach((field, idx) => {
            const fieldKey = field.id || field.label || field.type;
            const displayLabel = field.label || `Field ${idx + 1}`;
            leadPayload[displayLabel] = formValues[fieldKey];
        });

        setIsSubmitting(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/flipbook/submit-lead`, {
                v_id: vId,
                shareId: shareId,
                flipbookName: flipbookName,
                userEmail: userEmail,
                leadData: leadPayload,
                rawLeadData: formValues,
                viewerIp: viewerIp || '',
                leadNotification: leadFormSettings?.leadNotification
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
        const bgFillColor = hexToRgba(leadFormSettings.appearance?.bgFill || '#ffffff', leadFormSettings.appearance?.bgFillOpacity ?? 100);
        const bgStrokeColor = hexToRgba(leadFormSettings.appearance?.bgStroke && leadFormSettings.appearance?.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#E5E7EB', leadFormSettings.appearance?.bgStrokeOpacity ?? 100);
        const textFillColor = hexToRgba(leadFormSettings.appearance?.textFill || '#111827', leadFormSettings.appearance?.textFillOpacity ?? 100);
        const textStrokeColor = hexToRgba(leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#' ? leadFormSettings.appearance.textStroke : '#', leadFormSettings.appearance?.textStrokeOpacity ?? 100);
        const btnFillColor = hexToRgba(leadFormSettings.appearance?.btnFill || '#3E4491', leadFormSettings.appearance?.btnFillOpacity ?? 100);
        const btnTextColor = hexToRgba(leadFormSettings.appearance?.btnText || '#ffffff', leadFormSettings.appearance?.btnTextOpacity ?? 100);
        const btnStrokeColor = hexToRgba(leadFormSettings.appearance?.btnStroke && leadFormSettings.appearance?.btnStroke !== '#' ? leadFormSettings.appearance.btnStroke : '#', leadFormSettings.appearance?.btnStrokeOpacity ?? 100);

        return (
            <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="relative w-full max-w-[440px] lead-form-mobile-scope" style={{ fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter' }}>
                    <style>{`
                        .lead-form-mobile-scope input::placeholder,
                        .lead-form-mobile-scope textarea::placeholder {
                            color: ${textFillColor} !important;
                            opacity: 0.65 !important;
                            -webkit-text-fill-color: ${textFillColor} !important;
                        }
                    `}</style>
                    <div
                        className="w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-300"
                        style={{
                            fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter',
                            backgroundColor: bgFillColor,
                            borderColor: bgStrokeColor
                        }}
                    >
                        <div className="flex flex-col overflow-hidden w-full h-full p-4">
                            {isSubmitted ? (
                                <div className="py-8 text-center space-y-3 my-auto">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                                        <Icon icon="lucide:check" className="w-6 h-6 stroke-[3]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Thank You!</h3>
                                    <p className="text-xs text-gray-600">Your details have been submitted successfully.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="space-y-1.5 shrink-0 mb-3">
                                        <div className="flex items-center gap-3 relative">
                                            <h2
                                                className="text-[17px] font-semibold leading-none shrink-0"
                                                style={{
                                                    color: textFillColor,
                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#'
                                                        ? `0.5px ${textStrokeColor}` : 'none'
                                                }}
                                            >
                                                {leadFormSettings.formTitle || 'Lead Form'}
                                            </h2>
                                            <div
                                                className="h-px flex-1"
                                                style={{ backgroundColor: bgStrokeColor }}
                                            />
                                            {leadFormSettings.appearance?.allowSkip && (() => {
                                                const skipType = leadFormSettings.appearance?.skipType || 'text';
                                                const skipText = leadFormSettings.appearance?.skipText || 'Skip';
                                                const skipColor = hexToRgba(leadFormSettings.appearance?.skipColor || '#3E4491', leadFormSettings.appearance?.skipOpacity ?? 100);
                                                const skipBgFill = hexToRgba(leadFormSettings.appearance?.skipBgFill || 'transparent', leadFormSettings.appearance?.skipBgFillOpacity ?? 100);
                                                const skipBgStroke = hexToRgba(leadFormSettings.appearance?.skipBgStroke || 'transparent', leadFormSettings.appearance?.skipBgStrokeOpacity ?? 100);

                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onClose();
                                                        }}
                                                        style={{
                                                            color: skipColor,
                                                            backgroundColor: skipBgFill,
                                                            borderColor: skipBgStroke !== 'transparent' && skipBgStroke !== '#' ? skipBgStroke : 'transparent'
                                                        }}
                                                        className={`transition-all flex-shrink-0 cursor-pointer flex items-center justify-center ${
                                                            skipType === 'icon'
                                                                ? 'p-1 rounded-full border hover:opacity-80 active:scale-95'
                                                                : 'text-[12px] font-semibold underline underline-offset-2 hover:opacity-80'
                                                        }`}
                                                        title={skipType === 'icon' ? 'Close' : skipText}
                                                    >
                                                        {skipType === 'icon' ? (
                                                            <Icon icon="lucide:x" className="w-4 h-4 stroke-[2.5]" />
                                                        ) : (
                                                            skipText
                                                        )}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                        <p
                                            className="text-[11px] font-semibold"
                                            style={{
                                                color: textFillColor,
                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#'
                                                    ? `0.3px ${textStrokeColor}` : 'none'
                                            }}
                                        >
                                            {!leadFormSettings.appearance?.allowSkip || leadFormSettings.appearance?.timing === 'end'
                                                ? "Enter your details*"
                                                : <>Enter your details to continue <span className="text-red-500 font-semibold">*</span></>
                                            }
                                        </p>
                                    </div>

                                    {/* Lead Message */}
                                    <div className="py-1 text-center shrink-0 mb-2">
                                        <p
                                            className="text-[12px] font-semibold"
                                            style={{
                                                color: textFillColor,
                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#'
                                                    ? `0.3px ${textStrokeColor}` : 'none'
                                            }}
                                        >
                                            {leadFormSettings.leadText !== undefined ? leadFormSettings.leadText : 'Tell us about your requirements and our team will reach out.'}
                                        </p>
                                    </div>

                                    {/* Form Fields */}
                                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden w-full mt-1.5">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pt-1 pb-1 pr-1">
                                            {(() => {
                                                const fieldsList = leadFormSettings.fields || [];
                                                const enableSections = Boolean(leadFormSettings.appearance?.enableSections);
                                                const contactSectionTitle = leadFormSettings.appearance?.contactSectionTitle || 'Contact Information';
                                                const productSectionTitle = leadFormSettings.appearance?.productSectionTitle || 'Product Selection';

                                                const isBasicField = (f) => ['name', 'phone', 'email', 'company', 'services', 'enquiry'].includes(f.type);
                                                const hasBasicFields = fieldsList.some(isBasicField);
                                                const hasProductOrOtherFields = fieldsList.some(f => !isBasicField(f));

                                                let contactSectionRendered = false;
                                                let otherSectionRendered = false;

                                                return fieldsList.map((field) => {
                                                    const fieldKey = field.id || field.label || field.type;
                                                    const hasError = Boolean(errors[fieldKey]);
                                                    const isBasic = isBasicField(field);

                                                    let sectionHeader = null;
                                                    if (enableSections) {
                                                        if (isBasic && !contactSectionRendered && hasProductOrOtherFields) {
                                                            contactSectionRendered = true;
                                                            sectionHeader = (
                                                                <div key={`section-contact`} className="pt-1 pb-0.5 border-b border-gray-100 mb-1">
                                                                    <span className="text-[12px] font-bold text-gray-900 tracking-tight" style={{ color: textFillColor }}>
                                                                        {contactSectionTitle}
                                                                    </span>
                                                                </div>
                                                            );
                                                        } else if (!isBasic && !otherSectionRendered && hasBasicFields) {
                                                            otherSectionRendered = true;
                                                            sectionHeader = (
                                                                <div key={`section-other`} className="pt-2 pb-0.5 border-b border-gray-100 mb-1">
                                                                    <span className="text-[12px] font-bold text-gray-900 tracking-tight" style={{ color: textFillColor }}>
                                                                        {field.type === 'products' ? productSectionTitle : (leadFormSettings.appearance?.productSectionTitle || 'Additional Information')}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                    }

                                                    return (
                                                        <React.Fragment key={field.id}>
                                                            {sectionHeader}
                                                            {(() => {

                                                // 1. Text Area (Feedback) - No icon! Clean textarea
                                                if (field.type === 'feedback') {
                                                    return (
                                                        <div key={field.id} className="space-y-1.5 py-1">
                                                            <label 
                                                                className="text-[12px] font-medium block" 
                                                                style={{ 
                                                                    color: textFillColor,
                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                }}
                                                            >
                                                                {field.label === 'feedback' ? 'Feedback' : field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                            </label>
                                                            <textarea
                                                                placeholder={field.placeholder || 'Enter your Feedback'}
                                                                value={formValues[fieldKey] || ''}
                                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} rounded-lg p-3 text-[12px] font-medium focus:outline-none transition-all resize-none shadow-sm h-20`}
                                                                style={{
                                                                    borderColor: hasError ? '#EF4444' : (bgStrokeColor !== 'transparent' && bgStrokeColor !== '#' ? bgStrokeColor : '#D1D5DB'),
                                                                    color: textFillColor,
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }

                                                // 2. Rating - Stars
                                                if (field.type === 'rating') {
                                                    const currentRating = Number(formValues[fieldKey]) || 0;
                                                    return (
                                                        <div key={field.id} className="space-y-1.5 py-1">
                                                            <label 
                                                                className="text-[12px] font-medium block" 
                                                                style={{ 
                                                                    color: textFillColor,
                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                }}
                                                            >
                                                                {field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                            </label>
                                                            <div className="flex items-center gap-1.5 py-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        aria-label={`Rate ${star} star`}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleInputChange(fieldKey, currentRating === star ? star - 1 : star);
                                                                        }}
                                                                        className="p-1 rounded-md hover:bg-yellow-50 focus:outline-none transition-transform active:scale-90 select-none cursor-pointer"
                                                                    >
                                                                        <Icon 
                                                                            icon={currentRating >= star ? "mdi:star" : "lucide:star"}
                                                                            className={`w-7 h-7 ${currentRating >= star ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'} transition-colors pointer-events-none`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 3. Dropdown - Select box
                                                if (field.type === 'dropdown') {
                                                    return (
                                                        <div key={field.id} className="space-y-1.5 py-1">
                                                            <label 
                                                                className="text-[12px] font-medium block" 
                                                                style={{ 
                                                                    color: textFillColor,
                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                }}
                                                            >
                                                                {field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    value={formValues[fieldKey] || ''}
                                                                    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                    className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} rounded-lg py-2.5 px-3 text-[12px] font-medium focus:outline-none transition-all shadow-sm appearance-none`}
                                                                    style={{
                                                                        borderColor: hasError ? '#EF4444' : (bgStrokeColor !== 'transparent' && bgStrokeColor !== '#' ? bgStrokeColor : '#D1D5DB'),
                                                                        color: formValues[fieldKey] ? textFillColor : 'inherit',
                                                                        fontFamily: 'inherit'
                                                                    }}
                                                                >
                                                                    <option value="" disabled>{field.placeholder || 'Select Option'}</option>
                                                                    {(field.options || []).map((opt, idx) => (
                                                                        <option key={idx} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                    <Icon icon="fluent:chevron-down-12-regular" className="w-4 h-4 text-gray-500" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 4. Checkbox - Multi select options
                                                if (field.type === 'checkbox') {
                                                    return (
                                                        <div key={field.id} className="space-y-1.5 py-1">
                                                            <label 
                                                                className="text-[12px] font-medium block" 
                                                                style={{ 
                                                                    color: textFillColor,
                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                }}
                                                            >
                                                                {field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                                                {(field.options || []).map((opt, idx) => {
                                                                    const isChecked = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey].includes(opt) : formValues[fieldKey] === opt;
                                                                    return (
                                                                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                name={fieldKey}
                                                                                value={opt}
                                                                                checked={isChecked}
                                                                                onChange={(e) => {
                                                                                    const currentValues = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : (formValues[fieldKey] ? [formValues[fieldKey]] : []);
                                                                                    let newValues;
                                                                                    if (e.target.checked) {
                                                                                        newValues = [...currentValues, opt];
                                                                                    } else {
                                                                                        newValues = currentValues.filter(v => v !== opt);
                                                                                    }
                                                                                    handleInputChange(fieldKey, newValues);
                                                                                }}
                                                                                className={`w-4 h-4 text-[#3E4491] bg-white border ${hasError ? '!border-red-500' : 'border-gray-300'} rounded focus:ring-[#3E4491]`}
                                                                            />
                                                                            <span 
                                                                                className="text-[12px] font-medium whitespace-nowrap" 
                                                                                style={{ 
                                                                                    color: textFillColor,
                                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                                }}
                                                                            >
                                                                                {opt}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 5. Radio Button - Single select option
                                                if (field.type === 'radio') {
                                                    return (
                                                        <div key={field.id} className="space-y-1.5 py-1">
                                                            <label 
                                                                className="text-[12px] font-medium block" 
                                                                style={{ 
                                                                    color: textFillColor,
                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                }}
                                                            >
                                                                {field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                            </label>
                                                            <div className="flex flex-col gap-2">
                                                                {(field.options || []).map((opt, idx) => (
                                                                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name={fieldKey}
                                                                            value={opt}
                                                                            checked={formValues[fieldKey] === opt}
                                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                            className={`w-4 h-4 text-blue-600 bg-white border ${hasError ? '!border-red-500' : 'border-gray-300'} focus:ring-blue-500`}
                                                                        />
                                                                        <span 
                                                                            className="text-[12px] font-medium" 
                                                                            style={{ 
                                                                                color: textFillColor,
                                                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                            }}
                                                                        >
                                                                            {opt}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 6. Products Selection
                                                if (field.type === 'products') {
                                                    const selectedProducts = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : [];
                                                    const showQty = field.showQuantity !== false;
                                                    const isOpen = Boolean(productDropdownOpen[fieldKey]);
                                                    const searchTerm = (productSearchTerm[fieldKey] || '').toLowerCase().trim();

                                                    // Group products by category
                                                    const allProducts = field.products || [];
                                                    const filteredProducts = searchTerm
                                                        ? allProducts.filter(p => (p.name || '').toLowerCase().includes(searchTerm) || (p.category || '').toLowerCase().includes(searchTerm))
                                                        : allProducts;

                                                    const categoriesMap = {};
                                                    filteredProducts.forEach(prod => {
                                                        const catName = (prod.category || 'Other Products').trim();
                                                        if (!categoriesMap[catName]) categoriesMap[catName] = [];
                                                        categoriesMap[catName].push(prod);
                                                    });
                                                    const categoryKeys = Object.keys(categoriesMap);

                                                    const selectedCount = selectedProducts.length;

                                                    return (
                                                        <div key={field.id} className="space-y-1.5 py-1" data-product-dropdown="true">
                                                            <label 
                                                                className="text-[12px] font-medium block" 
                                                                style={{ 
                                                                    color: textFillColor,
                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                                }}
                                                            >
                                                                {field.label || 'Select Products'} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                            </label>

                                                            {/* Dropdown Container */}
                                                            <div className="relative">
                                                                {/* Trigger / Header Box */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        const willOpen = !isOpen;
                                                                        setProductDropdownOpen(prev => ({ ...prev, [fieldKey]: willOpen }));
                                                                        if (willOpen) {
                                                                            const targetEl = e.currentTarget;
                                                                            setTimeout(() => {
                                                                                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                            }, 80);
                                                                        }
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left bg-white ${
                                                                        isOpen 
                                                                            ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm' 
                                                                            : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-5 h-5 rounded flex items-center justify-center text-gray-500 shrink-0">
                                                                            <Icon icon="lucide:package" className="w-5 h-5 text-gray-600" />
                                                                        </div>
                                                                        <span className="text-[13.5px] text-gray-700 truncate font-medium">
                                                                            {selectedCount > 0 
                                                                                ? `${selectedCount} product${selectedCount > 1 ? 's' : ''} selected` 
                                                                                : (field.placeholder || 'Select products')}
                                                                        </span>
                                                                    </div>
                                                                    <Icon 
                                                                        icon="lucide:chevron-down" 
                                                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} 
                                                                    />
                                                                </button>

                                                                {/* Dropdown Menu Overlay */}
                                                                {isOpen && (
                                                                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                                                        {/* Search Box */}
                                                                        <div className="p-2.5 border-b border-gray-100 bg-white">
                                                                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/60 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                                                                                <Icon icon="lucide:search" className="w-4 h-4 text-gray-400 shrink-0" />
                                                                                <input
                                                                                    type="text"
                                                                                    value={productSearchTerm[fieldKey] || ''}
                                                                                    onChange={(e) => setProductSearchTerm(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                                                                    placeholder="Search products..."
                                                                                    className="w-full bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                                {productSearchTerm[fieldKey] && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setProductSearchTerm(prev => ({ ...prev, [fieldKey]: '' }));
                                                                                        }}
                                                                                        className="text-gray-400 hover:text-gray-600 p-0.5"
                                                                                    >
                                                                                        <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Products Grouped by Categories List */}
                                                                        <div className="max-h-60 overflow-y-auto lead-scroll p-2.5 divide-y divide-gray-100">
                                                                            {categoryKeys.length === 0 ? (
                                                                                <div className="py-7 text-center text-[13px] text-gray-400">
                                                                                    No products found
                                                                                </div>
                                                                            ) : (
                                                                                categoryKeys.map((catName) => (
                                                                                    <div key={catName} className="py-2.5 first:pt-0 last:pb-0">
                                                                                        {/* Category Header */}
                                                                                        <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider px-2.5 py-1 mb-1">
                                                                                            {catName}
                                                                                        </div>

                                                                                        {/* Products under this Category */}
                                                                                        <div className="space-y-1.5">
                                                                                            {categoriesMap[catName].map((prod) => {
                                                                                                const prodItem = selectedProducts.find(p => (prod.id ? p.id === prod.id : (typeof p === 'string' ? p : p.name) === prod.name));
                                                                                                const isChecked = Boolean(prodItem);
                                                                                                const qty = typeof prodItem === 'object' && prodItem?.quantity ? prodItem.quantity : 1;
                                                                                                const prodKey = prod.id || prod.name;

                                                                                                return (
                                                                                                    <div
                                                                                                        key={prodKey}
                                                                                                        onClick={() => handleToggleProduct(fieldKey, prod)}
                                                                                                        className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer group/item ${
                                                                                                            isChecked 
                                                                                                                ? 'bg-indigo-50/70 text-indigo-950 font-medium' 
                                                                                                                : 'hover:bg-gray-50 text-gray-800'
                                                                                                        }`}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                                                            <input
                                                                                                                type="checkbox"
                                                                                                                checked={isChecked}
                                                                                                                onChange={() => {}}
                                                                                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 pointer-events-none shrink-0"
                                                                                                            />
                                                                                                            {/* Thumbnail Icon/Image */}
                                                                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                                                                                {prod.image ? (
                                                                                                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                                                                                                ) : (
                                                                                                                    <Icon icon="lucide:package" className="w-4 h-4 text-gray-500" />
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <span className="text-[13.5px] font-medium truncate">
                                                                                                                {prod.name}
                                                                                                            </span>
                                                                                                        </div>

                                                                                                        {/* Quantity Counter in Dropdown */}
                                                                                                        {showQty && isChecked && (
                                                                                                            <div
                                                                                                                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-0.5 ml-2 shadow-2xs"
                                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                            >
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() => handleProductQtyChange(fieldKey, prodKey, -1)}
                                                                                                                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-sm font-semibold leading-none transition-colors"
                                                                                                                >
                                                                                                                    -
                                                                                                                </button>
                                                                                                                <span className="text-[13px] font-semibold text-gray-800 min-w-4 text-center select-none">{qty}</span>
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() => handleProductQtyChange(fieldKey, prodKey, 1)}
                                                                                                                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-sm font-semibold leading-none transition-colors"
                                                                                                                >
                                                                                                                    +
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            )}
                                                                        </div>

                                                                        {/* Dropdown Footer summary & Done button */}
                                                                        <div className="px-3.5 py-2.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between">
                                                                            <span className="text-[12.5px] text-gray-600 font-medium">
                                                                                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setProductDropdownOpen(prev => ({ ...prev, [fieldKey]: false }));
                                                                                }}
                                                                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[12px] font-semibold shadow-2xs transition-colors"
                                                                            >
                                                                                Done
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Selected Products List Container matching 3rd Image */}
                                                            {selectedProducts.length > 0 && (
                                                                <div className="space-y-1.5 pt-2">
                                                                    <div className="text-[12px] text-gray-600 font-medium">
                                                                        Selected products ({selectedProducts.length})
                                                                    </div>
                                                                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden shadow-2xs">
                                                                        {selectedProducts.map((p) => {
                                                                            const pKey = p.id || p.name;
                                                                            const qty = p.quantity || 1;
                                                                            // Resolve live product info from field.products so image & name updates in editor reflect immediately
                                                                            const liveProd = (field.products || []).find(prod => (prod.id && p.id ? prod.id === p.id : prod.name === p.name));
                                                                            const prodImage = (liveProd && liveProd.image) || p.image || '';
                                                                            const prodName = (liveProd && liveProd.name) || p.name;
                                                                            const prodCategory = (liveProd && liveProd.category) || p.category || 'Product category 1';

                                                                            return (
                                                                                <div key={pKey} className="flex items-center justify-between p-3 transition-colors hover:bg-gray-50/60">
                                                                                    {/* Product Thumbnail & Details */}
                                                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                                                            {prodImage ? (
                                                                                                <img src={prodImage} alt={prodName} className="w-full h-full object-contain" />
                                                                                            ) : (
                                                                                                <Icon icon="lucide:package" className="w-5 h-5 text-gray-400" />
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex flex-col min-w-0">
                                                                                            <span className="text-[13.5px] font-semibold text-gray-900 truncate">
                                                                                                {prodName}
                                                                                            </span>
                                                                                            <span className="text-[11.5px] text-gray-400 truncate">
                                                                                                {prodCategory}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Quantity & Delete Controls */}
                                                                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                                                                        {showQty && (
                                                                                            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-white shadow-2xs">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleProductQtyChange(fieldKey, pKey, -1)}
                                                                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-base font-semibold leading-none transition-colors"
                                                                                                >
                                                                                                    -
                                                                                                </button>
                                                                                                <span className="text-[14px] font-semibold text-gray-800 min-w-5 text-center select-none">
                                                                                                    {qty}
                                                                                                </span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleProductQtyChange(fieldKey, pKey, 1)}
                                                                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-base font-semibold leading-none transition-colors"
                                                                                                >
                                                                                                    +
                                                                                                </button>
                                                                                            </div>
                                                                                        )}

                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleToggleProduct(fieldKey, p)}
                                                                                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                                            title="Remove item"
                                                                                        >
                                                                                            <Icon icon="lucide:x" className="w-4.5 h-4.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // 7. Standard Text Input Box (Name, Email, Phone, Company, Services, Enquiry, etc.)
                                                return (
                                                    <div key={field.id} className="space-y-1.5 py-1">
                                                        <label 
                                                            className="text-[12px] font-medium block" 
                                                            style={{ 
                                                                color: textFillColor,
                                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.3px ${textStrokeColor}` : 'none'
                                                            }}
                                                        >
                                                            {field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                        </label>
                                                        <div className="relative">
                                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${field.type === 'phone' ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                {field.type === 'email' ? <Icon icon="logos:google-gmail" className="w-4 h-4" /> :
                                                                 field.type === 'phone' ? <Icon icon="material-symbols:call" className="w-4 h-4 text-gray-500" /> :
                                                                 field.type === 'company' ? <Icon icon="lucide:building-2" className="w-4 h-4 text-gray-500" /> :
                                                                 field.type === 'services' ? <Icon icon="lucide:settings" className="w-4 h-4 text-gray-500" /> :
                                                                 field.type === 'enquiry' ? <Icon icon="lucide:message-square" className="w-4 h-4 text-gray-500" /> :
                                                                 <Icon icon="lucide:user" className="w-4 h-4 text-gray-500" />}
                                                            </div>
                                                            <input
                                                                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                                                placeholder={field.placeholder || `Enter your ${field.label || field.type}`}
                                                                value={formValues[fieldKey] || ''}
                                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} rounded-lg py-2.5 pl-9 pr-3 text-[12px] font-medium focus:outline-none transition-all shadow-sm`}
                                                                style={{
                                                                    borderColor: hasError ? '#EF4444' : (bgStrokeColor !== 'transparent' && bgStrokeColor !== '#' ? bgStrokeColor : '#D1D5DB'),
                                                                    color: textFillColor,
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </React.Fragment>
                                    );
                                });
                            })()}
                                        </div>

                                        <div className="shrink-0 mt-3 pt-3 border-t border-gray-100">
                                            {Object.values(errors).filter(Boolean).length > 0 && (
                                                <div className="w-full bg-red-50 border border-red-200 text-red-600 rounded-lg p-2 text-xs font-medium text-center flex items-center justify-center gap-1.5 mb-2">
                                                    <Icon icon="lucide:alert-circle" className="w-4 h-4 shrink-0" />
                                                    <span>{Object.values(errors).filter(Boolean).find(msg => msg && msg.includes('valid')) || 'Please fill in all required fields'}</span>
                                                </div>
                                            )}
                                            <div className="w-full">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full py-3 rounded-lg text-[13px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] shadow-md tracking-wider flex items-center justify-center gap-2"
                                                    style={{
                                                        backgroundColor: btnFillColor,
                                                        color: btnTextColor,
                                                        border: btnStrokeColor !== 'transparent' && btnStrokeColor !== '#'
                                                            ? `1.5px solid ${btnStrokeColor}` : 'none',
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
    const bgFillColor = hexToRgba(leadFormSettings.appearance?.bgFill || '#ffffff', leadFormSettings.appearance?.bgFillOpacity ?? 100);
    const bgStrokeColor = hexToRgba(leadFormSettings.appearance?.bgStroke && leadFormSettings.appearance?.bgStroke !== '#' ? leadFormSettings.appearance.bgStroke : '#F3F4F6', leadFormSettings.appearance?.bgStrokeOpacity ?? 100);
    const textFillColor = hexToRgba(leadFormSettings.appearance?.textFill || '#111827', leadFormSettings.appearance?.textFillOpacity ?? 100);
    const textStrokeColor = hexToRgba(leadFormSettings.appearance?.textStroke && leadFormSettings.appearance?.textStroke !== '#' ? leadFormSettings.appearance.textStroke : '#', leadFormSettings.appearance?.textStrokeOpacity ?? 100);
    const btnFillColor = hexToRgba(leadFormSettings.appearance?.btnFill || '#3E4491', leadFormSettings.appearance?.btnFillOpacity ?? 100);
    const btnTextColor = hexToRgba(leadFormSettings.appearance?.btnText || '#ffffff', leadFormSettings.appearance?.btnTextOpacity ?? 100);
    const btnStrokeColor = hexToRgba(leadFormSettings.appearance?.btnStroke && leadFormSettings.appearance?.btnStroke !== '#' ? leadFormSettings.appearance.btnStroke : '#', leadFormSettings.appearance?.btnStrokeOpacity ?? 100);

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-[0.25vw]">
            <div className="relative lead-form-desktop-scope" style={{ fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter' }}>
                <style>{`
                    .lead-form-desktop-scope input::placeholder,
                    .lead-form-desktop-scope textarea::placeholder {
                        color: ${textFillColor} !important;
                        opacity: 0.65 !important;
                        -webkit-text-fill-color: ${textFillColor} !important;
                    }
                    .lead-form-desktop-scope .lead-scroll::-webkit-scrollbar {
                        width: 8px !important;
                    }
                    .lead-form-desktop-scope .lead-scroll::-webkit-scrollbar-track {
                        background: #F1F5F9 !important;
                        border-radius: 9999px !important;
                    }
                    .lead-form-desktop-scope .lead-scroll::-webkit-scrollbar-thumb {
                        background: #94A3B8 !important;
                        border-radius: 9999px !important;
                        border: 1.5px solid #F1F5F9 !important;
                    }
                    .lead-form-desktop-scope .lead-scroll::-webkit-scrollbar-thumb:hover {
                        background: #64748B !important;
                    }
                `}</style>
                <div
                    className={`${
                        isTablet 
                            ? 'w-[28vw] rounded-[1vw]' 
                            : (leadFormSettings.appearance?.layoutColumns === '2' ? 'w-[42vw] max-w-[680px] rounded-[1.3vw]' : 'w-[28vw] max-w-[460px] rounded-[1.2vw]')
                    } max-h-[75vh] flex flex-col overflow-hidden shadow-[0_1vw_4vw_rgba(0,0,0,0.12)] relative border animate-in zoom-in-95 duration-300`}
                    style={{
                        fontFamily: leadFormSettings.appearance?.fontStyle || 'Inter',
                        backgroundColor: bgFillColor,
                        borderColor: bgStrokeColor
                    }}
                >
                        {/* Skip Button positioned at top-right corner of the modal card */}
                        {leadFormSettings.appearance?.allowSkip && (() => {
                            const skipType = leadFormSettings.appearance?.skipType || 'text';
                            const skipText = leadFormSettings.appearance?.skipText || 'Skip';
                            const skipColor = hexToRgba(leadFormSettings.appearance?.skipColor || '#3E4491', leadFormSettings.appearance?.skipOpacity ?? 100);
                            const skipBgFill = hexToRgba(leadFormSettings.appearance?.skipBgFill || 'transparent', leadFormSettings.appearance?.skipBgFillOpacity ?? 100);
                            const skipBgStroke = hexToRgba(leadFormSettings.appearance?.skipBgStroke || 'transparent', leadFormSettings.appearance?.skipBgStrokeOpacity ?? 100);

                            return (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                    style={{
                                        color: skipColor,
                                        backgroundColor: skipBgFill,
                                        borderColor: skipBgStroke !== 'transparent' && skipBgStroke !== '#' ? skipBgStroke : 'transparent'
                                    }}
                                    className={`absolute transition-all cursor-pointer z-30 flex items-center justify-center ${
                                        skipType === 'icon'
                                            ? `${isTablet ? 'w-[1.5vw] h-[1.5vw] top-[0.8vw] right-[0.8vw]' : 'w-[1.7vw] h-[1.7vw] top-[1vw] right-[1.2vw]'} rounded-full border hover:opacity-80 active:scale-95 shadow-sm`
                                            : `${isTablet ? 'text-[0.65vw] top-[0.8vw] right-[1vw]' : 'text-[0.8vw] top-[1vw] right-[1.2vw]'} font-semibold px-[0.6vw] py-[0.2vw] rounded-full hover:bg-black/5 active:scale-95 transition-all`
                                    }`}
                                    title={skipType === 'icon' ? 'Close' : skipText}
                                >
                                    {skipType === 'icon' ? (
                                        <Icon icon="lucide:x" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1vw] h-[1vw]'} stroke-[2.5]`} />
                                    ) : (
                                        skipText
                                    )}
                                </button>
                            );
                        })()}

                        <div className={`flex flex-col overflow-hidden w-full h-full ${isTablet ? 'p-[1.2vw]' : 'py-[1.4vw] px-[1.8vw]'}`}>
                            {isSubmitted ? (
                                <div className="py-[2vw] text-center space-y-[0.8vw] my-auto">
                                    <div className="w-[3vw] h-[3vw] rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                                        <Icon icon="lucide:check" className="w-[1.5vw] h-[1.5vw] stroke-[3]" />
                                    </div>
                                    <h3 className="text-[1.2vw] font-bold text-gray-900">Thank You!</h3>
                                    <p className="text-[0.75vw] text-gray-600">Your details have been submitted successfully.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Header & Lead Message */}
                                    <div className="relative text-center shrink-0 pt-[0.8vw]">
                                        <h2
                                            className={`${isTablet ? 'text-[1.2vw]' : 'text-[1.5vw]'} font-semibold mb-[0.2vw] mt-[0.3vw]`}
                                            style={{
                                                color: textFillColor,
                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.02vw ${textStrokeColor}` : 'none'
                                            }}
                                        >
                                            {leadFormSettings.formTitle || 'Request More Information'}
                                        </h2>
                                        
                                        <p
                                            className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-normal`}
                                            style={{
                                                color: textFillColor,
                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.01vw ${textStrokeColor}` : 'none'
                                            }}
                                        >
                                            {leadFormSettings.leadText !== undefined ? leadFormSettings.leadText : 'Tell us about your requirements and our team will reach out.'}
                                        </p>
                                    </div>

                                {/* Form Fields */}
                                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden w-full mt-[0.5vw]">
                                    <div className="flex-1 overflow-y-auto lead-scroll w-full pt-[0.4vw] pr-[0.3vw]">
                                        <div className="w-full space-y-[0.85vw] pr-[0.6vw]">
                                            {(() => {
                                                const fieldsList = leadFormSettings.fields || [];
                                                const enableSections = Boolean(leadFormSettings.appearance?.enableSections);
                                                const isTwoCol = !isTablet && leadFormSettings.appearance?.layoutColumns === '2';
                                                const contactSectionTitle = leadFormSettings.appearance?.contactSectionTitle || 'Contact Information';
                                                const productSectionTitle = leadFormSettings.appearance?.productSectionTitle || 'Product Selection';

                                                const isBasicField = (f) => ['name', 'phone', 'email', 'company', 'services', 'enquiry'].includes(f.type);
                                                const hasBasicFields = fieldsList.some(isBasicField);
                                                const hasProductOrOtherFields = fieldsList.some(f => !isBasicField(f));

                                                let contactSectionRendered = false;
                                                let otherSectionRendered = false;

                                                return (
                                                    <div className={`w-full ${isTwoCol ? 'grid grid-cols-2 gap-x-[1vw] gap-y-[0.85vw]' : 'space-y-[0.85vw]'}`}>
                                                        {fieldsList.map((field) => {
                                                            const fieldKey = field.id || field.label || field.type;
                                                            const hasError = Boolean(errors[fieldKey]);
                                                            const isBasic = isBasicField(field);

                                                            // In two-column layout, full-width fields like feedback (textarea), products, ratings, or checkbox span both columns
                                                            const isFullSpan = isTwoCol && (field.type === 'feedback' || field.type === 'products' || field.type === 'rating' || field.type === 'checkbox');

                                                            let sectionHeader = null;
                                                            if (enableSections) {
                                                                if (isBasic && !contactSectionRendered && hasProductOrOtherFields) {
                                                                    contactSectionRendered = true;
                                                                    sectionHeader = (
                                                                        <div key={`section-contact`} className={`${isTwoCol ? 'col-span-2' : ''} pt-[0.2vw] pb-[0.2vw] border-b border-gray-100 mb-[0.2vw]`}>
                                                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.82vw]'} font-bold tracking-tight text-gray-900`} style={{ color: textFillColor }}>
                                                                                {contactSectionTitle}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else if (!isBasic && !otherSectionRendered && hasBasicFields) {
                                                                    otherSectionRendered = true;
                                                                    sectionHeader = (
                                                                        <div key={`section-other`} className={`${isTwoCol ? 'col-span-2' : ''} pt-[0.6vw] pb-[0.2vw] border-b border-gray-100 mb-[0.2vw]`}>
                                                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.82vw]'} font-bold tracking-tight text-gray-900`} style={{ color: textFillColor }}>
                                                                                {field.type === 'products' ? productSectionTitle : (leadFormSettings.appearance?.productSectionTitle || 'Additional Information')}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            }

                                                            return (
                                                                <React.Fragment key={field.id}>
                                                                    {sectionHeader}
                                                                    <div className={`flex flex-col space-y-[0.2vw] ${isFullSpan ? 'col-span-2' : ''}`}>
                                                        <label 
                                                            className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-normal`}
                                                            style={{
                                                                color: textFillColor,
                                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.01vw ${textStrokeColor}` : 'none'
                                                            }}
                                                        >
                                                            {field.label === 'feedback' ? 'Feedback' : field.label} {field.required && <span className="text-red-500 font-semibold">*</span>}
                                                        </label>

                                                        {/* 1. Text Area (Feedback) - No icon! Clean textarea box */}
                                                        {field.type === 'feedback' ? (
                                                            <textarea
                                                                placeholder={field.placeholder || 'Enter your Feedback'}
                                                                value={formValues[fieldKey] || ''}
                                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} ${isTablet ? 'rounded-[0.4vw] p-[0.8vw] text-[0.5vw] h-[6vw]' : 'rounded-[0.6vw] p-[1vw] text-[0.75vw] h-[8vw]'} font-medium focus:outline-none transition-all resize-none shadow-sm`}
                                                                style={{
                                                                    borderColor: hasError ? '#EF4444' : (bgStrokeColor !== 'transparent' && bgStrokeColor !== '#' ? bgStrokeColor : '#D1D5DB'),
                                                                    color: textFillColor,
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            />
                                                        ) : field.type === 'dropdown' ? (
                                                            /* 2. Dropdown Select */
                                                            <div className="relative">
                                                                <select
                                                                    value={formValues[fieldKey] || ''}
                                                                    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                    className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} ${isTablet ? 'rounded-[0.4vw] py-[0.5vw] px-[0.8vw] text-[0.5vw]' : 'rounded-[0.6vw] py-[0.5vw] px-[0.9vw] text-[0.75vw]'} font-medium focus:outline-none transition-all shadow-sm appearance-none`}
                                                                    style={{
                                                                        borderColor: hasError ? '#EF4444' : (bgStrokeColor !== 'transparent' && bgStrokeColor !== '#' ? bgStrokeColor : '#D1D5DB'),
                                                                        color: formValues[fieldKey] ? textFillColor : 'inherit',
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
                                                            </div>
                                                        ) : field.type === 'rating' ? (
                                                            /* 3. Rating Stars */
                                                            (() => {
                                                                const currentRating = Number(formValues[fieldKey]) || 0;
                                                                return (
                                                                    <div className="flex items-center gap-[0.8vw] py-[0.2vw]">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                aria-label={`Rate ${star} star`}
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleInputChange(fieldKey, currentRating === star ? star - 1 : star);
                                                                                }}
                                                                                className="p-[0.2vw] rounded-[0.3vw] hover:bg-yellow-50 focus:outline-none transition-transform active:scale-90 select-none cursor-pointer flex items-center justify-center"
                                                                            >
                                                                                <Icon 
                                                                                    icon={currentRating >= star ? "mdi:star" : "lucide:star"}
                                                                                    className={`${isTablet ? 'w-[1.6vw] h-[1.6vw]' : 'w-[2vw] h-[2vw]'} ${currentRating >= star ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'} stroke-1 transition-colors pointer-events-none`} 
                                                                                />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()
                                                        ) : field.type === 'checkbox' ? (
                                                            /* 4. Checkbox Multi-selection */
                                                            <div className="grid grid-cols-2 gap-y-[0.4vw] gap-x-[1vw]">
                                                                {(field.options || []).map((opt, idx) => {
                                                                    const isChecked = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey].includes(opt) : formValues[fieldKey] === opt;
                                                                    return (
                                                                        <label key={idx} className="flex items-center gap-[0.4vw] cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                name={fieldKey}
                                                                                value={opt}
                                                                                checked={isChecked}
                                                                                onChange={(e) => {
                                                                                    const currentValues = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : (formValues[fieldKey] ? [formValues[fieldKey]] : []);
                                                                                    let newValues;
                                                                                    if (e.target.checked) {
                                                                                        newValues = [...currentValues, opt];
                                                                                    } else {
                                                                                        newValues = currentValues.filter(v => v !== opt);
                                                                                    }
                                                                                    handleInputChange(fieldKey, newValues);
                                                                                }}
                                                                                className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'} text-[#3E4491] bg-white border ${hasError ? '!border-red-500' : 'border-gray-300'} rounded focus:ring-[#3E4491]`}
                                                                            />
                                                                            <span
                                                                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium whitespace-nowrap`}
                                                                                style={{
                                                                                    color: textFillColor,
                                                                                    WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.01vw ${textStrokeColor}` : 'none'
                                                                                }}
                                                                            >
                                                                                {opt}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : field.type === 'radio' ? (
                                                            /* 5. Radio Single-selection */
                                                            <div className="flex flex-col gap-[0.4vw]">
                                                                {(field.options || []).map((opt, idx) => (
                                                                    <label key={idx} className="flex items-center gap-[0.4vw] cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name={fieldKey}
                                                                            value={opt}
                                                                            checked={formValues[fieldKey] === opt}
                                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                            className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'} text-[#3E4491] bg-white border ${hasError ? '!border-red-500' : 'border-gray-300'} focus:ring-[#3E4491]`}
                                                                        />
                                                                        <span
                                                                            className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium`}
                                                                            style={{
                                                                                color: textFillColor,
                                                                                WebkitTextStroke: textStrokeColor !== 'transparent' && textStrokeColor !== '#' ? `0.01vw ${textStrokeColor}` : 'none'
                                                                            }}
                                                                        >
                                                                            {opt}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : field.type === 'products' ? (
                                                            /* 6. Products Selection */
                                                            (() => {
                                                                const selectedProducts = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : [];
                                                                const showQty = field.showQuantity !== false;
                                                                const isOpen = Boolean(productDropdownOpen[fieldKey]);
                                                                const searchTerm = (productSearchTerm[fieldKey] || '').toLowerCase().trim();

                                                                const allProducts = field.products || [];
                                                                const filteredProducts = searchTerm
                                                                    ? allProducts.filter(p => (p.name || '').toLowerCase().includes(searchTerm) || (p.category || '').toLowerCase().includes(searchTerm))
                                                                    : allProducts;

                                                                const categoriesMap = {};
                                                                filteredProducts.forEach(prod => {
                                                                    const catName = (prod.category || 'Other Products').trim();
                                                                    if (!categoriesMap[catName]) categoriesMap[catName] = [];
                                                                    categoriesMap[catName].push(prod);
                                                                });
                                                                const categoryKeys = Object.keys(categoriesMap);
                                                                const selectedCount = selectedProducts.length;

                                                                return (
                                                                    <div className="flex flex-col gap-[0.4vw]" data-product-dropdown="true">
                                                                        <div className="relative">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    const willOpen = !isOpen;
                                                                                    setProductDropdownOpen(prev => ({ ...prev, [fieldKey]: willOpen }));
                                                                                    if (willOpen) {
                                                                                        const targetEl = e.currentTarget;
                                                                                        setTimeout(() => {
                                                                                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                                        }, 80);
                                                                                    }
                                                                                }}
                                                                                className={`w-full flex items-center justify-between px-[0.7vw] py-[0.5vw] rounded-[0.4vw] border transition-all text-left bg-white ${
                                                                                    isOpen ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-200'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-[0.4vw] min-w-0">
                                                                                    <Icon icon="lucide:package" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1vw] h-[1vw]'} text-gray-500 shrink-0`} />
                                                                                    <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.72vw]'} text-gray-700 truncate font-normal`}>
                                                                                        {selectedCount > 0
                                                                                            ? `${selectedCount} product${selectedCount > 1 ? 's' : ''} selected`
                                                                                            : (field.placeholder || 'Select products')}
                                                                                    </span>
                                                                                </div>
                                                                                <Icon
                                                                                    icon="lucide:chevron-down"
                                                                                    className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'} text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
                                                                                />
                                                                            </button>

                                                                            {isOpen && (
                                                                                <div className="absolute left-0 right-0 top-[calc(100%+0.3vw)] z-[60] bg-white rounded-[0.4vw] border border-gray-200 shadow-xl overflow-hidden">
                                                                                    <div className="p-[0.4vw] border-b border-gray-100 bg-white">
                                                                                        <div className="flex items-center gap-[0.3vw] px-[0.4vw] py-[0.25vw] rounded-[0.3vw] border border-gray-200 bg-gray-50/60">
                                                                                            <Icon icon="lucide:search" className="w-[0.7vw] h-[0.7vw] text-gray-400 shrink-0" />
                                                                                            <input
                                                                                                type="text"
                                                                                                value={productSearchTerm[fieldKey] || ''}
                                                                                                onChange={(e) => setProductSearchTerm(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                                                                                placeholder="Search products..."
                                                                                                className="w-full bg-transparent text-[0.65vw] text-gray-700 outline-none"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="max-h-[14vw] overflow-y-auto lead-scroll p-[0.4vw] divide-y divide-gray-100">
                                                                                        {categoryKeys.length === 0 ? (
                                                                                            <div className="py-[1vw] text-center text-[0.65vw] text-gray-400">
                                                                                                No products found
                                                                                            </div>
                                                                                        ) : (
                                                                                            categoryKeys.map((catName) => (
                                                                                                <div key={catName} className="py-[0.3vw]">
                                                                                                    <div className="text-[0.6vw] font-semibold text-gray-500 uppercase tracking-wider px-[0.3vw] mb-[0.2vw]">
                                                                                                        {catName}
                                                                                                    </div>
                                                                                                    <div className="space-y-[0.2vw]">
                                                                                                        {categoriesMap[catName].map((prod) => {
                                                                                                            const prodItem = selectedProducts.find(p => (prod.id ? p.id === prod.id : (typeof p === 'string' ? p : p.name) === prod.name));
                                                                                                            const isChecked = Boolean(prodItem);
                                                                                                            const qty = typeof prodItem === 'object' && prodItem?.quantity ? prodItem.quantity : 1;
                                                                                                            const prodKey = prod.id || prod.name;

                                                                                                            return (
                                                                                                                <div
                                                                                                                    key={prodKey}
                                                                                                                    onClick={() => handleToggleProduct(fieldKey, prod)}
                                                                                                                    className={`flex items-center justify-between px-[0.4vw] py-[0.25vw] rounded-[0.3vw] cursor-pointer ${
                                                                                                                        isChecked ? 'bg-indigo-50/60 text-indigo-900' : 'hover:bg-gray-50 text-gray-800'
                                                                                                                    }`}
                                                                                                                >
                                                                                                                    <div className="flex items-center gap-[0.4vw] min-w-0 flex-1">
                                                                                                                        <input
                                                                                                                            type="checkbox"
                                                                                                                            checked={isChecked}
                                                                                                                            onChange={() => {}}
                                                                                                                            className="w-[0.8vw] h-[0.8vw] text-indigo-600 rounded border-gray-300 pointer-events-none shrink-0"
                                                                                                                        />
                                                                                                                        <div className="w-[1.4vw] h-[1.4vw] rounded-[0.2vw] bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                                                                                            {prod.image ? (
                                                                                                                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                                                                                                            ) : (
                                                                                                                                <Icon icon="lucide:package" className="w-[0.8vw] h-[0.8vw] text-gray-500" />
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                        <span className="text-[0.65vw] font-medium truncate">
                                                                                                                            {prod.name}
                                                                                                                        </span>
                                                                                                                    </div>

                                                                                                                    {showQty && isChecked && (
                                                                                                                        <div
                                                                                                                            className="flex items-center gap-[0.2vw] bg-white border border-gray-200 rounded-[0.2vw] px-[0.25vw] py-[0.1vw] ml-[0.3vw]"
                                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                                        >
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                onClick={() => handleProductQtyChange(fieldKey, prodKey, -1)}
                                                                                                                                className="w-[1vw] h-[1vw] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-[0.75vw] font-bold leading-none transition-colors"
                                                                                                                            >
                                                                                                                                -
                                                                                                                            </button>
                                                                                                                            <span className="text-[0.68vw] font-semibold text-gray-800 min-w-[0.9vw] text-center select-none">{qty}</span>
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                onClick={() => handleProductQtyChange(fieldKey, prodKey, 1)}
                                                                                                                                className="w-[1vw] h-[1vw] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-[0.75vw] font-bold leading-none transition-colors"
                                                                                                                            >
                                                                                                                                +
                                                                                                                            </button>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="px-[0.5vw] py-[0.3vw] border-t border-gray-100 bg-gray-50/70 flex items-center justify-between">
                                                                                        <span className="text-[0.6vw] text-gray-500">
                                                                                            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setProductDropdownOpen(prev => ({ ...prev, [fieldKey]: false }));
                                                                                            }}
                                                                                            className="px-[0.5vw] py-[0.2vw] bg-indigo-600 text-white rounded-[0.2vw] text-[0.6vw] font-medium"
                                                                                        >
                                                                                            Done
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Selected Products List Container matching 3rd Image */}
                                                                        {selectedProducts.length > 0 && (
                                                                            <div className="space-y-[0.3vw] pt-[0.2vw]">
                                                                                <div className="text-[0.65vw] text-gray-600 font-medium">
                                                                                    Selected products ({selectedProducts.length})
                                                                                </div>
                                                                                <div className="bg-white border border-gray-200 rounded-[0.4vw] divide-y divide-gray-100 overflow-hidden shadow-2xs">
                                                                                    {selectedProducts.map((p) => {
                                                                                        const pKey = p.id || p.name;
                                                                                        const qty = p.quantity || 1;
                                                                                        // Resolve live product info from field.products so image & name updates in editor reflect immediately
                                                                                        const liveProd = (field.products || []).find(prod => (prod.id && p.id ? prod.id === p.id : prod.name === p.name));
                                                                                        const prodImage = (liveProd && liveProd.image) || p.image || '';
                                                                                        const prodName = (liveProd && liveProd.name) || p.name;
                                                                                        const prodCategory = (liveProd && liveProd.category) || p.category || 'Product category 1';

                                                                                        return (
                                                                                            <div key={pKey} className="flex items-center justify-between p-[0.4vw] transition-colors hover:bg-gray-50/60">
                                                                                                {/* Product Thumbnail & Details */}
                                                                                                <div className="flex items-center gap-[0.4vw] min-w-0 flex-1">
                                                                                                    <div className="w-[1.6vw] h-[1.6vw] rounded-[0.25vw] bg-gray-50 border border-gray-200 p-[0.1vw] flex items-center justify-center shrink-0 overflow-hidden">
                                                                                                        {prodImage ? (
                                                                                                            <img src={prodImage} alt={prodName} className="w-full h-full object-contain" />
                                                                                                        ) : (
                                                                                                            <Icon icon="lucide:package" className="w-[0.9vw] h-[0.9vw] text-gray-400" />
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="flex flex-col min-w-0">
                                                                                                        <span className="text-[0.68vw] font-semibold text-gray-900 truncate">
                                                                                                            {prodName}
                                                                                                        </span>
                                                                                                        <span className="text-[0.58vw] text-gray-400 truncate">
                                                                                                            {prodCategory}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Quantity & Delete Controls */}
                                                                                                 <div className="flex items-center gap-[0.4vw] shrink-0 ml-[0.3vw]">
                                                                                                     {showQty && (
                                                                                                         <div className="flex items-center gap-[0.2vw] border border-gray-200 rounded-[0.25vw] px-[0.35vw] py-[0.15vw] bg-white shadow-2xs">
                                                                                                             <button
                                                                                                                 type="button"
                                                                                                                 onClick={() => handleProductQtyChange(fieldKey, pKey, -1)}
                                                                                                                 className="w-[1vw] h-[1vw] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-[0.8vw] font-bold leading-none"
                                                                                                             >
                                                                                                                 -
                                                                                                             </button>
                                                                                                             <span className="text-[0.7vw] font-semibold text-gray-800 min-w-[1vw] text-center select-none">
                                                                                                                 {qty}
                                                                                                             </span>
                                                                                                             <button
                                                                                                                 type="button"
                                                                                                                 onClick={() => handleProductQtyChange(fieldKey, pKey, 1)}
                                                                                                                 className="w-[1vw] h-[1vw] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-[0.8vw] font-bold leading-none"
                                                                                                             >
                                                                                                                 +
                                                                                                             </button>
                                                                                                         </div>
                                                                                                     )}

                                                                                                     <button
                                                                                                         type="button"
                                                                                                         onClick={() => handleToggleProduct(fieldKey, p)}
                                                                                                         className="w-[1.2vw] h-[1.2vw] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                                         title="Remove item"
                                                                                                     >
                                                                                                         <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                                                                                                     </button>
                                                                                                 </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()
                                                        ) : (
                                                            /* 7. Standard Input Box (Email, Phone, Company, Services, Enquiry, Name, etc.) */
                                                            <div className="relative">
                                                                <div className={`${isTablet ? 'left-[0.6vw] pr-[0.5vw]' : 'left-[0.8vw] pr-[0.7vw]'} absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none ${field.type === 'phone' ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                    {field.type === 'email' ? <Icon icon="logos:google-gmail" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                                     field.type === 'phone' ? <Icon icon="material-symbols:call" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                                     field.type === 'company' ? <Icon icon="lucide:building-2" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                                     field.type === 'services' ? <Icon icon="lucide:settings" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                                     field.type === 'enquiry' ? <Icon icon="lucide:message-square" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} /> :
                                                                     <Icon icon="lucide:user" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                                                </div>
                                                                <input
                                                                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                                                    placeholder={field.placeholder || `Enter your ${field.label || field.type}`}
                                                                    value={formValues[fieldKey] || ''}
                                                                    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                                    className={`w-full bg-white border ${hasError ? '!border-red-500 ring-2 ring-red-100' : ''} ${isTablet ? 'rounded-[0.4vw] py-[0.5vw] pl-[2.5vw] pr-[0.8vw] text-[0.5vw]' : 'rounded-[0.6vw] py-[0.5vw] pl-[3.5vw] pr-[0.9vw] text-[0.75vw]'} font-medium focus:outline-none transition-all shadow-sm`}
                                                                    style={{
                                                                        borderColor: hasError ? '#EF4444' : (bgStrokeColor !== 'transparent' && bgStrokeColor !== '#' ? bgStrokeColor : '#D1D5DB'),
                                                                        color: textFillColor,
                                                                        fontFamily: 'inherit'
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                                    
                                    <div className="shrink-0 mt-[0.6vw] pt-[0.8vw] border-t border-gray-100 shadow-[0_-0.4vw_1vw_rgba(0,0,0,0.02)] w-full">
                                        <div className="w-full">
                                            {Object.values(errors).filter(Boolean).length > 0 && (
                                                <div className="w-full bg-red-50 border border-red-200 text-red-600 rounded-[0.4vw] py-[0.3vw] px-[0.6vw] text-[0.68vw] font-medium text-center flex items-center justify-center gap-[0.3vw] animate-in fade-in duration-200 mb-[0.6vw]">
                                                    <Icon icon="lucide:alert-circle" className="w-[0.9vw] h-[0.9vw] shrink-0" />
                                                    <span>{Object.values(errors).filter(Boolean).find(msg => msg && msg.includes('valid')) || 'Please fill in all required fields'}</span>
                                                </div>
                                            )}
                                            {/* Submit Button */}
                                            <div className="w-full">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className={`w-full ${isTablet ? 'py-[0.5vw] rounded-[0.5vw] text-[0.7vw]' : 'py-[0.5vw] rounded-[0.6vw] text-[0.8vw]'} font-semibold transition-all hover:brightness-110 active:scale-[0.98] shadow-md flex items-center justify-center gap-[0.4vw]`}
                                                    style={{
                                                        backgroundColor: btnFillColor,
                                                        color: btnTextColor,
                                                        border: btnStrokeColor !== 'transparent' && btnStrokeColor !== '#' ? `1.5px solid ${btnStrokeColor}` : 'none',
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
                                        </div>
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
