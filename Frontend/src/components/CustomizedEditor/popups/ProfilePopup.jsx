import React from 'react';
import { Icon } from '@iconify/react';

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
    return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.5;
};

const ProfilePopup = ({ onClose, profileSettings, activeLayout, isTablet, isMobile, isLandscape, isSidebarOpen, layoutColors }) => {
    // Select the correct profile data based on activeLayout if profileSettings is keyed by layout ID
    const currentProfile = (profileSettings && profileSettings[activeLayout]) ? profileSettings[activeLayout] : profileSettings;

    const name = currentProfile?.name || '';
    const about = currentProfile?.about || '';
    const hexToRgba = (hex, opacity = 100) => {
        if (!hex || !hex.startsWith('#')) return hex;
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = Math.max(0, Math.min(1, opacity / 100));
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };
    const getLayoutColor = (id, defaultColor) => {
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? 100);
        }
        return `var(--${id}, ${defaultColor})`;
    };
    const getLayoutOpacity = (id, defaultOpacity) => `var(--${id}-opacity, ${defaultOpacity})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const dropdownBgHex = layoutColors?.find(c => c.id === 'dropdown-bg')?.hex || '#2D2D2D';
    const dropdownTextHex = layoutColors?.find(c => c.id === 'dropdown-text')?.hex || '#FFFFFF';
    const toolbarBgHex = layoutColors?.find(c => c.id === 'toolbar-bg')?.hex || '#575C9C';
    const bodyTextColor = isLightColor(dropdownBgHex) ? dropdownTextHex : dropdownBgHex;

    const contacts = currentProfile?.contacts || [];

    const layout = Number(activeLayout);
    const isLayout1 = layout === 1;
    const isLayout2 = layout === 2;
    const isLayout3 = layout === 3;
    const isLayout4 = layout === 4;
    const isLayout6 = layout === 6;
    const isLayout7 = layout === 7;
    const isLayout8 = layout === 8;
    const isLayout9 = layout === 9;
    const fallbackText = isLayout1 ? '#FFFFFF' : toolbarBgHex;
    const hasData = name.trim() || about.trim() || contacts.some(c => c.value?.trim());
    const layout9AccentColor = isLightColor(dropdownBgHex) ? '#2D2D2D' : dropdownBgHex;

    const getSocialIcon = (type) => {
        switch (type) {
            case 'x': return { icon: 'ri:twitter-x-fill', bg: 'bg-black', color: 'text-white' };
            case 'facebook': return { icon: 'ri:facebook-fill', bg: 'bg-[#3B5998]', color: 'text-white' };
            case 'email': return { icon: 'logos:google-gmail', bg: 'bg-white', color: '' };
            case 'instagram': return { icon: 'lucide:instagram', bg: 'bg-gradient-to-tr from-[#FFD600] via-[#FF0144] to-[#0401E5]', color: 'text-white' };
            case 'phone': return { icon: 'lucide:phone', bg: 'bg-white', color: `text-[${dropdownBgHex}]` };
            case 'linkedin': return { icon: 'ri:linkedin-fill', bg: 'bg-[#0077B5]', color: 'text-white' };
            default: return { icon: 'ph:link-bold', bg: 'bg-white', color: 'text-gray-600' };
        }
    };

    const handleContactClick = (e, contact) => {
        e.preventDefault();
        e.stopPropagation();
        if (!contact?.value) return;

        const value = contact.value.trim();
        const type = contact.type;
        const lowerValue = value.toLowerCase();

        // 1. Detect Email
        const isEmail = type === 'email' || (value.includes('@') && !lowerValue.startsWith('http'));
        const isPhone = type === 'phone';

        if (isEmail) {
            // For Gmail: Redirect to Web Gmail Compose directly (much more reliable)
            if (lowerValue.endsWith('@gmail.com')) {
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${value}`, '_blank');
            }
            // For Outlook/Hotmail: Redirect to Web Outlook Compose
            else if (lowerValue.endsWith('@outlook.com') || lowerValue.endsWith('@hotmail.com')) {
                window.open(`https://outlook.office.com/mail/deeplink/compose?to=${value}`, '_blank');
            }
            // Fallback for others: Standard mailto
            else {
                window.location.href = `mailto:${value}`;
            }
        }
        else if (isPhone) {
            window.location.href = `tel:${value}`;
        }
        else {
            const url = value.startsWith('http') ? value : `https://${value}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    if (isMobile && isLandscape) {
        if (isLayout1) {
            return (
                <div className="fixed inset-0 z-[5000] pointer-events-auto bg-transparent" onClick={onClose}>
                    <div
                        className="absolute bottom-[42px] right-[210px] scale-[0.6] origin-bottom-right shadow-4xl shadow-black/30 border border-white/10 backdrop-blur-md rounded-[12px] p-[12px] w-[220px] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
                        style={{
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8')
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-[10px] relative">
                            <h2 className="text-[16px] font-bold leading-tight" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>Profile</h2>
                            <div className="h-[1px] w-full mt-[6px]" style={{ backgroundColor: `color-mix(in srgb, var(--dropdown-text, ${fallbackText}) 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                        </div>

                        {/* Personal Info */}
                        {(name || about) && (
                            <div className="space-y-[10px] mb-[15px]">
                                {name && (
                                    <div className="flex items-start gap-[6px]">
                                        <span
                                            className="text-[13px] font-bold whitespace-nowrap"
                                            style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                                        >
                                            Name:
                                        </span>
                                        <span
                                            className="text-[13px] font-medium truncate"
                                            style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                                        >
                                            {name}
                                        </span>
                                    </div>
                                )}
                                {about && (
                                    <div className="flex items-start gap-[6px]">
                                        <span
                                            className="text-[13px] font-bold whitespace-nowrap"
                                            style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                                        >
                                            About:
                                        </span>
                                        <p
                                            className="text-[12px] font-normal leading-tight text-left tracking-tight opacity-95"
                                            style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                                        >
                                            {about}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {contacts.length > 0 && (
                            <div className="relative">
                                <div className="flex items-center gap-[8px] mb-[10px]">
                                    <h3
                                        className="text-[11px] font-bold"
                                        style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}
                                    >
                                        Contact
                                    </h3>
                                    <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', fallbackText)} 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                                </div>

                                <div className="flex items-center flex-wrap gap-[8px] justify-start mt-[1px]">
                                    {contacts.map((contact) => {
                                        if (!contact.value) return null;
                                        const style = getSocialIcon(contact.type);

                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={(e) => handleContactClick(e, contact)}
                                                className="w-[32px] h-[32px] p-[6px] rounded-[4px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5"
                                                style={{ backgroundColor: style.bg.replace('bg-', '') }}
                                                title={contact.value}
                                            >
                                                <Icon
                                                    icon={style.icon}
                                                    className={`${style.color} w-full h-full`}
                                                    strokeWidth={contact.type === 'phone' ? 4 : 1}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        if (isLayout2) {
            return (
                <div
                    className="absolute inset-0 z-[5000] flex items-start justify-center pt-[6vh] pl-[65%] pointer-events-auto bg-transparent"
                    onClick={onClose}
                >
                    <div
                        className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                        style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`bg-white/60 backdrop-blur-xl border border-white/50 p-[0.4vw] rounded-[1.4vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.2)]`}
                        >
                            <div
                                className={`rounded-[1vw] p-[1vw] w-[11vw] relative`}
                                style={{ backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))` }}
                            >
                                <div className="w-full">
                                    {!hasData ? (
                                        <div className="text-[0.8vw] text-center py-[1.5vw] opacity-80 font-medium whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 0.8)" }}>
                                            No profile found
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                                                <h2 className="text-[0.8vw] font-bold whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>
                                                    Profile
                                                </h2>
                                                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: `color-mix(in srgb, var(--dropdown-text, ${fallbackText}) 30%, transparent)`, opacity: "var(--dropdown-text-opacity, 1)" }} />
                                            </div>

                                            {(name || about) && (
                                                <div className="space-y-[0.8vw] mb-[1.5vw]">
                                                    {name && (
                                                        <div className="flex items-start gap-[4px]">
                                                            <span
                                                                className="text-[0.8vw] font-bold whitespace-nowrap"
                                                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                                                            >
                                                                Name:
                                                            </span>
                                                            <span
                                                                className="text-[0.8vw] font-medium truncate"
                                                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                                                            >
                                                                {name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {about && (
                                                        <div className="flex items-start gap-[4px]">
                                                            <span
                                                                className="text-[0.8vw] font-bold whitespace-nowrap"
                                                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                                                            >
                                                                About:
                                                            </span>
                                                            <p
                                                                className="text-[0.75vw] font-normal leading-tight text-left tracking-tight opacity-95"
                                                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                                                            >
                                                                {about}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {contacts.length > 0 && (
                                                <div className="relative">
                                                    <div className="flex items-center gap-[0.6vw] mb-[0.8vw]">
                                                        <h3
                                                            className="text-[10px] font-bold"
                                                            style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}
                                                        >
                                                            Contact
                                                        </h3>
                                                        <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', fallbackText)} 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                                                    </div>

                                                    <div className="flex items-center flex-wrap gap-[5px] justify-start mt-[1px]">
                                                        {contacts.map((contact) => {
                                                            if (!contact.value) return null;
                                                            const style = getSocialIcon(contact.type);

                                                            return (
                                                                <button
                                                                    key={contact.id}
                                                                    onClick={(e) => handleContactClick(e, contact)}
                                                                    className={`w-[2.2vw] h-[2.1vw] p-[0.4vw] ${style.bg} rounded-[2px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5`}
                                                                    title={contact.value}
                                                                >
                                                                    <Icon
                                                                        icon={style.icon}
                                                                        className={`${style.color} w-full h-full`}
                                                                        strokeWidth={contact.type === 'phone' ? 4 : 1}
                                                                    />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        if (isLayout3) {
            return (
                <div
                    className="absolute inset-0 z-[5000] flex items-start justify-end pt-[7vh] pr-[8vw] pointer-events-auto bg-transparent"
                    onClick={onClose}
                >
                    <div
                        className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                        style={{ transform: 'scale(0.55)', transformOrigin: 'top right' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="bg-white rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] overflow-hidden w-[14vw] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300"
                        >
                            <div
                                className="p-[0.8vw] w-full"
                                style={{ backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))` }}
                            >
                                <div className="relative z-10 p-[0.8vw]">
                                    {!hasData ? (
                                        <div className="text-[0.8vw] text-center py-[1.5vw] opacity-80 font-medium whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})` }}>
                                            No profile found
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-[0.6vw]">
                                                <h2 className="font-bold text-[0.85vw]" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Profile</h2>
                                            </div>
                                            {(name || about) && (
                                                <div className="space-y-[0.8vw] mb-[1.5vw]">
                                                    {name && (
                                                        <div className="flex items-start gap-[4px]">
                                                            <span className="text-[0.8vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: 'var(--dropdown-text-opacity, 1)' }}>Name:</span>
                                                            <span className="text-[0.8vw] font-medium truncate" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: 'var(--dropdown-text-opacity, 0.8)' }}>{name}</span>
                                                        </div>
                                                    )}
                                                    {about && (
                                                        <div className="flex items-start gap-[4px]">
                                                            <span className="text-[0.8vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: 'var(--dropdown-text-opacity, 1)' }}>About:</span>
                                                            <p className="text-[0.75vw] font-normal leading-tight text-left tracking-tight" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: 'var(--dropdown-text-opacity, 0.8)' }}>{about}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {contacts.length > 0 && (
                                                <div className="relative">
                                                    <div className="flex items-center gap-[0.6vw] mb-[0.8vw]">
                                                        <h3 className="text-[10px] font-bold" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: 'var(--dropdown-text-opacity, 1)' }}>Contact</h3>
                                                        <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', fallbackText)} 40%, transparent)`, opacity: 'var(--dropdown-text-opacity, 0.4)' }} />
                                                    </div>
                                                    <div className="flex items-center flex-wrap gap-[5px] justify-start">
                                                        {contacts.map((contact) => {
                                                            if (!contact.value) return null;
                                                            const style = getSocialIcon(contact.type);
                                                            return (
                                                                <button
                                                                    key={contact.id}
                                                                    onClick={(e) => handleContactClick(e, contact)}
                                                                    className={`w-[2.2vw] h-[2.1vw] p-[0.4vw] ${style.bg} rounded-[2px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5`}
                                                                    title={contact.value}
                                                                >
                                                                    <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 4 : 1} />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div
                className="fixed inset-0 z-[160] flex items-center justify-center bg-black/20"
                onClick={onClose}
            >
                <div
                    className="w-[300px] rounded-xl shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden border border-white/10"
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(12px)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col items-center px-4 pt-3 pb-2">
                        <h2 className="text-[16px] font-bold text-white uppercase tracking-wider" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Profile</h2>
                        <div className="h-[1px] w-full bg-white/10 mt-2" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', '#FFFFFF')} 20%, transparent)` }} />
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                        {name && (
                            <div className="flex items-start gap-2">
                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Name :</span>
                                <span className="text-[13px] font-medium opacity-90" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{name}</span>
                            </div>
                        )}
                        {about && (
                            <div className="flex flex-col gap-1">
                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>About :</span>
                                <p className="text-[12px] font-medium leading-relaxed opacity-90 text-justify" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                    {about}
                                </p>
                            </div>
                        )}
                        {contacts.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Contact :</span>
                                <div className="flex items-center flex-wrap gap-2">
                                    {contacts.map((contact) => {
                                        if (!contact.value) return null;
                                        const style = getSocialIcon(contact.type);
                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={(e) => handleContactClick(e, contact)}
                                                className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm p-1.5 border border-white/10`}
                                                title={contact.value}
                                            >
                                                {contact.type === 'phone' ? (
                                                    <Icon icon={style.icon} className="w-full h-full" style={{ color: layout9AccentColor }} />
                                                ) : (
                                                    <Icon icon={style.icon} className={`${style.color} w-full h-full`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile && !isLandscape && isLayout1) {
        return (
            <div className="absolute inset-0 z-[5000] pointer-events-auto" onClick={onClose}>
                <div
                    className="absolute top-[150px] right-[16px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="rounded-[14px] shadow-2xl border border-white/20 backdrop-blur-md"
                        style={{ width: '160px', backgroundColor: 'rgba(87, 92, 156, 0.85)', padding: '12px' }}
                    >
                        <div className="text-center mb-2">
                            <h2 className="text-[13px] font-bold text-white leading-tight">Profile</h2>
                            <div className="h-[1px] w-full mt-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                        </div>
                        {!hasData ? (
                            <div className="text-[11px] text-center py-3 italic text-white/50">No profile found</div>
                        ) : (
                            <>
                                {(name || about) && (
                                    <div className="flex flex-col gap-1.5 mb-2">
                                        {name && (
                                            <div className="flex items-start gap-1">
                                                <span className="text-[11px] font-bold text-white whitespace-nowrap">Name:</span>
                                                <span className="text-[11px] font-medium text-white/80 truncate">{name}</span>
                                            </div>
                                        )}
                                        {about && (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-bold text-white">About:</span>
                                                <p className="text-[10px] font-normal leading-tight text-white/75 text-left">{about}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {contacts.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <h3 className="text-[10px] font-bold text-white">Contact</h3>
                                            <div className="flex-1 h-[0.5px]" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                                        </div>
                                        <div className="flex items-center flex-wrap gap-1.5">
                                            {contacts.map((contact) => {
                                                if (!contact.value) return null;
                                                const style = getSocialIcon(contact.type);
                                                const bgStyleMap = {
                                                    email: { backgroundColor: '#ffffff' },
                                                    facebook: { backgroundColor: '#3B5998' },
                                                    instagram: { background: 'linear-gradient(to top right, #FFD600, #FF0144, #0401E5)' },
                                                    x: { backgroundColor: '#000000' },
                                                    linkedin: { backgroundColor: '#0077B5' },
                                                    phone: { backgroundColor: '#ffffff' },
                                                };
                                                const bgStyle = bgStyleMap[contact.type] || { backgroundColor: '#ffffff' };
                                                return (
                                                    <button
                                                        key={contact.id}
                                                        onClick={(e) => handleContactClick(e, contact)}
                                                        className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/10 p-[3px]"
                                                        style={bgStyle}
                                                        title={contact.value}
                                                    >
                                                        <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 3 : 1} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile && !isLandscape && isLayout2) {
        return (
            <div className="absolute inset-0 z-[5000] pointer-events-auto" onClick={onClose}>
                <div
                    className="absolute top-[140px] right-[10%] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-[3px] rounded-[20px] shadow-2xl">
                        <div
                            className="rounded-[16px] p-3 w-[150px] relative"
                            style={{ backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))` }}
                        >
                            {!hasData ? (
                                <div className="text-[10px] text-center py-3 opacity-80 font-medium whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 0.8)" }}>
                                    No profile found
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <h2 className="text-[12px] font-bold whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>
                                            Profile
                                        </h2>
                                        <div className="h-[0.5px] flex-1 mt-0.5" style={{ backgroundColor: `color-mix(in srgb, var(--dropdown-text, ${fallbackText}) 30%, transparent)`, opacity: "var(--dropdown-text-opacity, 1)" }} />
                                    </div>

                                    {(name || about) && (
                                        <div className="space-y-2 mb-3">
                                            {name && (
                                                <div className="flex items-start gap-1">
                                                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}>
                                                        Name:
                                                    </span>
                                                    <span className="text-[10px] font-medium truncate" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}>
                                                        {name}
                                                    </span>
                                                </div>
                                            )}
                                            {about && (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}>
                                                        About:
                                                    </span>
                                                    <p className="text-[9px] font-normal leading-tight text-left tracking-tight opacity-95" style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}>
                                                        {about}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {contacts.length > 0 && (
                                        <div className="relative">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <h3 className="text-[9.5px] font-bold" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>
                                                    Contact
                                                </h3>
                                                <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', fallbackText)} 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                                            </div>

                                            <div className="flex items-center flex-wrap gap-1.5 justify-start">
                                                {contacts.map((contact) => {
                                                    if (!contact.value) return null;
                                                    const style = getSocialIcon(contact.type);

                                                    return (
                                                        <button
                                                            key={contact.id}
                                                            onClick={(e) => handleContactClick(e, contact)}
                                                            className={`w-7 h-7 p-1.5 ${style.bg} rounded-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5`}
                                                            title={contact.value}
                                                        >
                                                            <Icon
                                                                icon={style.icon}
                                                                className={`${style.color} w-full h-full`}
                                                                strokeWidth={contact.type === 'phone' ? 4 : 1}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile && !isLandscape && isLayout3) {
        return (
            <div className="absolute inset-0 z-[5000] pointer-events-auto" onClick={onClose}>
                <div
                    className="absolute top-[140px] right-5 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-100 bg-white"
                        style={{ width: '150px', padding: '12px' }}
                    >
                        <div className="mb-2.5">
                            <h2 className="text-[12px] font-bold text-[#3E4491] leading-tight">Profile</h2>
                        </div>
                        {!hasData ? (
                            <div className="text-[9px] text-center py-3 italic text-gray-400 font-medium">No profile found</div>
                        ) : (
                            <>
                                {(name || about) && (
                                    <div className="flex flex-col gap-2 mb-3">
                                        {name && (
                                            <div className="flex items-start gap-1">
                                                <span className="text-[9px] font-bold text-[#3E4491] whitespace-nowrap">Name :</span>
                                                <span className="text-[9px] font-medium text-gray-600 truncate flex-1">{name}</span>
                                            </div>
                                        )}
                                        {about && (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold text-[#3E4491]">About :</span>
                                                <p className="text-[8.5px] font-medium leading-relaxed text-gray-500 text-justify tracking-tight">{about}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {contacts.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <h3 className="text-[9px] font-bold text-[#3E4491]">Contact</h3>
                                            <div className="flex-1 h-[0.5px] bg-[#3E4491]/10" />
                                        </div>
                                        <div className="flex items-center flex-wrap gap-1.5 justify-start">
                                            {contacts.map((contact) => {
                                                if (!contact.value) return null;
                                                const style = getSocialIcon(contact.type);
                                                return (
                                                    <button
                                                        key={contact.id}
                                                        onClick={(e) => handleContactClick(e, contact)}
                                                        className={`w-6 h-6 rounded-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm border border-gray-100 p-1 ${style.bg}`}
                                                        title={contact.value}
                                                    >
                                                        <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 3 : 1} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile && !isLandscape && isLayout7) {
        return (
            <div className="absolute inset-0 z-[5000] pointer-events-auto" onClick={onClose}>
                <div
                    className="absolute top-[320px] left-[52px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden w-[220px] border border-white/50">
                        {/* Header */}
                        <div 
                            className="px-4 py-3 flex items-center justify-between border-b border-gray-100"
                            style={{ backgroundColor: "rgba(var(--toolbar-bg-rgb, 87, 92, 156), 0.05)" }}
                        >
                            <h2 className="text-[14px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>Profile</h2>
                            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                                <Icon icon="lucide:x" className="w-4 h-4" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }} />
                            </button>
                        </div>

                        <div className="p-4 flex flex-col gap-4">
                            {name && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>Name :</span>
                                        <span className="text-[11px] font-semibold text-gray-700">{name}</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-100 mt-1" />
                                </div>
                            )}
                            {about && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>About :</span>
                                    <p className="text-[10px] font-medium text-gray-600 leading-relaxed text-justify">
                                        {about}
                                    </p>
                                </div>
                            )}
                            {contacts.length > 0 && (
                                <div className="flex flex-col gap-2.5 mt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>Contact</span>
                                        <div className="flex-1 h-[0.5px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2.5">
                                        {contacts.map((contact) => {
                                            if (!contact.value) return null;
                                            const style = getSocialIcon(contact.type);
                                            return (
                                                <button
                                                    key={contact.id}
                                                    onClick={(e) => handleContactClick(e, contact)}
                                                    className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm p-1.5 border border-black/5`}
                                                    title={contact.value}
                                                >
                                                    {contact.type === 'x' ? (
                                                        <span className="text-white font-bold text-xs" style={{ fontFamily: 'serif' }}>𝕏</span>
                                                    ) : (
                                                        <Icon icon={style.icon} className={`${style.color} w-full h-full`} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLayout9) {
        return (
            <>
                {/* Global click-to-close overlay */}
                <div className="fixed inset-0 z-[40] cursor-default" onClick={onClose} />
                <div
                    className={`absolute top-[1.2vh] ${isSidebarOpen ? 'left-[calc(50%_+_10.9vw)]' : 'left-[calc(50%_+_13.5vw)]'} -translate-x-[90%] z-[45] animate-in fade-in slide-in-from-top-2 duration-300`}
                    style={{ filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`relative w-[16.5vw] min-h-[13.5vw] h-fit max-h-[80vh] flex flex-col group`}>
                        {/* TOC-style SVG Shape Background */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <svg width="100%" height="100%" viewBox="0 0 250 630" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <defs>
                                    <clipPath id="profile-shape-clip" clipPathUnits="objectBoundingBox">
                                        <path
                                            transform="scale(0.004, 0.0015873)"
                                            d="M0 130C0 118.95 8.95 110 20 110H180C195 110 200 90 200 60V35C200 15 212.5 0 225 0C237.5 0 250 15 250 35V110V610C250 621.05 241.05 630 230 630H20C8.95 630 0 621.05 0 610V130Z"
                                        />
                                    </clipPath>
                                </defs>
                                <path
                                    d="M0 130C0 118.95 8.95 110 20 110H180C195 110 200 90 200 60V35C200 15 212.5 0 225 0C237.5 0 250 15 250 35V110V610C250 621.05 241.05 630 230 630H20C8.95 630 0 621.05 0 610V130Z"
                                    fill={dropdownBgHex}
                                    fillOpacity={0.6}
                                />
                            </svg>
                        </div>

                        {/* Content Layer */}
                        <div
                            className="relative z-10 flex flex-col flex-1 pt-[3.8vw] px-[0.7vw] pb-[0.7vw] backdrop-blur-md"
                            style={{ clipPath: 'url(#profile-shape-clip)', WebkitClipPath: 'url(#profile-shape-clip)' }}
                        >
                            <div className="bg-white rounded-[0.8vw] flex flex-col w-full h-full p-[1vw] shadow-sm overflow-hidden min-h-[13.5vw]">
                                {!hasData ? (
                                    <div className="text-[0.9vw] text-center py-[2vw] italic font-medium" style={{ color: layout9AccentColor, opacity: 0.5 }}>
                                        No profile found
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-[1vw]">
                                        {/* Name Row */}
                                        {name && (
                                            <div className="flex items-start gap-[0.5vw] animate-in slide-in-from-left-2 duration-300">
                                                <span className="text-[0.9vw] font-medium tracking-tight" style={{ color: layout9AccentColor }}>Name :</span>
                                                <span className="text-[1vw] font-semibold" style={{ color: layout9AccentColor }}>{name}</span>
                                            </div>
                                        )}
                                        {/* About Row */}
                                        {about && (
                                            <div className="flex flex-col gap-[0.3vw] animate-in slide-in-from-left-2 duration-400">
                                                <span className="text-[0.9vw] font-medium tracking-tight" style={{ color: layout9AccentColor }}>About :</span>
                                                <p className="text-[0.88vw] leading-relaxed font-semibold opacity-90 text-justify tracking-tight" style={{ color: layout9AccentColor }}>{about}</p>
                                            </div>
                                        )}
                                        {/* Contact Section */}
                                        {contacts.length > 0 && (
                                            <div className="flex flex-col gap-[0.8vw] animate-in slide-in-from-bottom-2 duration-500 mt-[0.5vw]">
                                                <span className="text-[0.9vw] font-medium tracking-tight" style={{ color: layout9AccentColor }}>Contact :</span>
                                                <div className="flex items-center flex-wrap gap-[0.6vw]">
                                                    {contacts.map((contact) => {
                                                        if (!contact.value) return null;
                                                        const style = getSocialIcon(contact.type);
                                                        return (
                                                            <button
                                                                key={contact.id}
                                                                onClick={(e) => handleContactClick(e, contact)}
                                                                className={`w-[2.4vw] h-[2.4vw] ${style.bg} rounded-[0.5vw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border ${style.bg === 'bg-white' ? 'border-gray-200' : 'border-white/10'}`}
                                                                title={contact.value}
                                                            >
                                                                {contact.type === 'phone' ? (
                                                                    <Icon icon={style.icon} className="w-[1.4vw] h-[1.4vw]" style={{ color: layout9AccentColor }} strokeWidth={3} />
                                                                ) : contact.type === 'x' ? (
                                                                    <span className="text-white font-bold text-[1.4vw] leading-none" style={{ fontFamily: 'serif' }}>𝕏</span>
                                                                ) : (
                                                                    <Icon icon={style.icon} className={`${style.color} w-[1.6vw] h-[1.6vw]`} />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Layout 5 Needle Popup
    if (layout === 5) {
        return (
            <>
                {/* Global click-to-close overlay */}
                <div className="fixed inset-0 z-[150]" onClick={onClose} />
                <div
                    className="fixed bottom-[10.5vh] left-[77.1%] -translate-x-[20%] z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative">
                        <div
                            className="absolute -bottom-[1.3vw] left-[20%] -translate-x-1/2 z-10 pointer-events-none"
                            style={{ width: '0.9vw', height: '1.4vw' }}
                        >
                            <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                <path d="M0 0L5 20L10 0" fill={getLayoutColorRgba('toc-bg', '255, 255, 255', '1')} />
                                <path d="M0 0L5 20L10 0" stroke={getLayoutColorRgba('toc-bg', '87, 92, 156', '0.3')} strokeWidth="1" />
                            </svg>
                        </div>

                        {/* Popup Card */}
                        <div
                            className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[10.5vw]' : 'w-[16vw]'} flex flex-col border relative z-20 overflow-hidden`}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.2')
                            }}
                        >
                            <div
                                className="w-full flex flex-col p-[1.2vw] gap-[0.8vw]"
                                style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                            >
                                <h2
                                    className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-bold tracking-tight`}
                                    style={{ color: getLayoutColor('toc-text', '#000000') }}
                                >Profile</h2>

                                {!hasData ? (
                                    <div className="text-gray-400 text-[0.8vw] text-center py-[2vw] italic font-medium">
                                        No profile found
                                    </div>
                                ) : (
                                    <>
                                        {/* Name */}
                                        <div className="flex gap-[0.3vw]">
                                            <span
                                                className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold whitespace-nowrap`}
                                                style={{ color: getLayoutColor('toc-text', '#000000') }}
                                            >Name :</span>
                                            <span
                                                className="text-[0.8vw]"
                                                style={{ color: getLayoutColorRgba('toc-text', '55, 65, 81', '0.8') }}
                                            >{name}</span>
                                        </div>

                                        {/* About */}
                                        <div className="flex gap-[0.3vw]">
                                            <span
                                                className="text-[0.8vw] font-bold whitespace-nowrap"
                                                style={{ color: getLayoutColor('toc-text', '#000000') }}
                                            >About :</span>
                                            <span
                                                className="text-[0.78vw] leading-[1.5] text-justify"
                                                style={{ color: getLayoutColorRgba('toc-text', '75, 85, 99', '0.8') }}
                                            >{about}</span>
                                        </div>

                                        {/* Divider */}
                                        <div
                                            className="h-[1px] opacity-10"
                                            style={{ backgroundColor: getLayoutColor('toc-text', '#000000') }}
                                        />

                                        {/* Contact */}
                                        <div className="flex flex-col gap-[0.5vw]">
                                            <span
                                                className="text-[0.85vw] font-bold"
                                                style={{ color: getLayoutColor('toc-text', '#000000') }}
                                            >Contact</span>
                                            <div className="flex items-center gap-[0.5vw]">
                                                {contacts.map((contact) => {
                                                    if (!contact.value) return null;
                                                    const style = getSocialIcon(contact.type);

                                                    return (
                                                        <button
                                                            key={contact.id}
                                                            onClick={(e) => handleContactClick(e, contact)}
                                                            className={`w-[2vw] h-[2vw] ${style.bg} rounded-[0.4vw] flex items-center justify-center hover:opacity-80 transition-opacity`}
                                                            title={contact.value}
                                                        >
                                                            <Icon
                                                                icon={style.icon}
                                                                className={`${style.color} w-[1.1vw] h-[1.1vw]`}
                                                                strokeWidth={contact.type === 'phone' ? 3 : 1}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isMobile && !isLandscape && isLayout8) {
        return (
            <div className="absolute inset-0 z-[5000] pointer-events-auto" onClick={onClose}>
                <div
                    className="absolute bottom-[120px] left-1/2 -translate-x-1/2 pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden w-[240px] border border-white/50">
                        {/* Header */}
                        <div 
                            className="px-4 py-3 flex items-center justify-between border-b border-gray-100"
                            style={{ backgroundColor: "rgba(var(--toolbar-bg-rgb, 87, 92, 156), 0.05)" }}
                        >
                            <h2 className="text-[14px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>Profile</h2>
                            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                                <Icon icon="lucide:x" className="w-4 h-4" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }} />
                            </button>
                        </div>

                        <div className="p-4 flex flex-col gap-4">
                            {name && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>Name :</span>
                                        <span className="text-[11px] font-semibold text-gray-700">{name}</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-100 mt-1" />
                                </div>
                            )}
                            {about && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>About :</span>
                                    <p className="text-[10px] font-medium text-gray-600 leading-relaxed text-justify">
                                        {about}
                                    </p>
                                </div>
                            )}
                            {contacts.length > 0 && (
                                <div className="flex flex-col gap-2.5 mt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>Contact</span>
                                        <div className="flex-1 h-[0.5px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2.5">
                                        {contacts.map((contact) => {
                                            if (!contact.value) return null;
                                            const style = getSocialIcon(contact.type);
                                            return (
                                                <button
                                                    key={contact.id}
                                                    onClick={(e) => handleContactClick(e, contact)}
                                                    className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm p-1.5 border border-black/5`}
                                                    title={contact.value}
                                                >
                                                    {contact.type === 'x' ? (
                                                        <span className="text-white font-bold text-xs" style={{ fontFamily: 'serif' }}>𝕏</span>
                                                    ) : (
                                                        <Icon icon={style.icon} className={`${style.color} w-full h-full`} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLayout8) {
        return (
            <>
                <div className="absolute inset-0 z-[159] bg-transparent pointer-events-auto" onClick={onClose} />
                <div className={`absolute bottom-[13vh] left-[calc(50%_+_10.5vw)] -translate-x-1/2 z-[160] pointer-events-auto`}>
                    <div
                        className="bg-white rounded-[0.4vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] w-[16vw] overflow-hidden border border-gray-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="w-full px-[1vw] py-[0.6vw]"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                        >
                            <h2 className="text-[0.85vw] font-bold tracking-wide" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Profile</h2>
                        </div>

                        {/* Body */}
                        <div className="p-[1vw] w-full">
                            {!hasData ? (
                                <div className="text-[0.8vw] text-center py-[1.5vw] opacity-80 font-medium whitespace-nowrap" style={{ color: bodyTextColor }}>
                                    No profile found
                                </div>
                            ) : (
                                <>
                                    {/* Personal Info */}
                                    {(name || about) && (
                                        <div className="space-y-[0.8vw] mb-[1.5vw]">
                                            {name && (
                                                <div className="flex items-start gap-[0.4vw]">
                                                    <span className="text-[0.8vw] font-bold whitespace-nowrap mt-[0.1vw]" style={{ color: bodyTextColor }}>
                                                        Name :
                                                    </span>
                                                    <span className="text-[0.8vw] font-medium" style={{ color: bodyTextColor, opacity: 0.8 }}>
                                                        {name}
                                                    </span>
                                                </div>
                                            )}
                                            {about && (
                                                <div className="flex items-start gap-[0.4vw]">
                                                    <span className="text-[0.8vw] font-bold whitespace-nowrap mt-[0.1vw]" style={{ color: bodyTextColor }}>
                                                        About :
                                                    </span>
                                                    <p className="text-[0.75vw] font-medium leading-[1.4] text-justify tracking-tight" style={{ color: bodyTextColor, opacity: 0.8 }}>
                                                        {about}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Contact Section */}
                                    {contacts.length > 0 && (
                                        <div className="relative">
                                            <div className="mb-[0.6vw]">
                                                <h3 className="text-[0.85vw] font-bold" style={{ color: bodyTextColor }}>
                                                    Contact
                                                </h3>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-[0.5vw] justify-start">
                                                {contacts.map((contact) => {
                                                    if (!contact.value) return null;
                                                    const style = getSocialIcon(contact.type);

                                                    return (
                                                        <button
                                                            key={contact.id}
                                                            onClick={(e) => handleContactClick(e, contact)}
                                                            className={`w-[2vw] h-[2vw] ${style.bg} rounded-[0.4vw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border ${style.bg === 'bg-white' ? 'border-gray-200' : 'border-white/5'}`}
                                                            title={contact.value}
                                                        >
                                                            <Icon
                                                                icon={style.icon}
                                                                className={`${style.color} w-[1.1vw] h-[1.1vw]`}
                                                                strokeWidth={contact.type === 'phone' ? 3 : 1}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isLayout6 || isLayout7) {
        return (
            <>
                <div className="absolute inset-0 z-[110] bg-transparent pointer-events-auto" onClick={onClose} />
                <div
                    className={`absolute z-[120] pointer-events-auto shadow-2xl flex flex-col overflow-hidden border border-[#575C9C]
                        ${isLayout7
                            ? isTablet ? "right-[3.1vw] top-[1.5vh] bottom-0 w-[16vw] backdrop-blur-xl rounded-t-[1.2vw]" : "right-[4.5vw] bottom-0 w-[18vw] h-[75vh] backdrop-blur-xl rounded-t-[1.2vw]"
                            : isTablet ? "right-[4.5vw] top-[6vh] bottom-[5vh] w-[11vw] border-[#575C9C]/10" : "right-[5vw] top-[7vh] bottom-[7.5vh] w-[17.5vw] border-[#575C9C]/10"
                        }`}
                    style={isLayout7 ? { backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), var(--dropdown-bg-opacity, 0.8))" } : { backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full">
                        <div
                            className={`flex items-center justify-between px-[1.2vw] border-b shrink-0 ${isLayout7 ? 'h-[6vh]' : 'h-[7vh]'}`}
                            style={{ borderColor: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "var(--dropdown-text, rgba(255,255,255,0.2))" }}
                        >
                            <h2 className="text-[1.2vw] font-bold" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "var(--dropdown-text, #575C9C)" }}>Profile</h2>
                            <button
                                onClick={onClose}
                                className="transition-all p-[0.4vw]"
                                style={{ color: "var(--dropdown-text, #575C9C)", opacity: 0.6 }}
                            >
                                <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw]" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "inherit" }} />
                            </button>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 overflow-y-auto p-[1.2vw] custom-scrollbar space-y-[1.8vh]">
                            {!hasData ? (
                                <div
                                    className="text-[0.9vw] text-center py-[10vh] font-medium italic opacity-40"
                                    style={{ color: "var(--dropdown-text, #575C9C)" }}
                                >
                                    No profile found
                                </div>
                            ) : (
                                <>
                                    {/* Name & About */}
                                    <div className="space-y-[1.8vh]">
                                        {name && (
                                            <div className="flex items-start gap-[0.5vw]">
                                                <span className="font-bold text-[0.9vw] whitespace-nowrap" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "var(--dropdown-text, #575C9C)" }}>Name :</span>
                                                <span className="text-[0.85vw] font-medium leading-relaxed opacity-80" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "var(--dropdown-text, #575C9C)" }}>{name}</span>
                                            </div>
                                        )}
                                        {about && (
                                            <div className="flex flex-col gap-[0.6vh]">
                                                <span className="font-bold text-[0.9vw]" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "var(--dropdown-text, #575C9C)" }}>About :</span>
                                                <p className="text-[0.8vw] leading-[1.6] text-justify font-medium opacity-80" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#4B5563") : "var(--dropdown-text, #575C9C)" }}>
                                                    {about}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Section */}
                                    {contacts.length > 0 && (
                                        <div className="flex flex-col gap-[1.5vh] mt-[1vh]">
                                            <h3 className="font-bold text-[0.9vw]" style={{ color: isLayout6 ? getLayoutColor('dropdown-text', "#373d8b") : "var(--dropdown-text, #575C9C)" }}>Contact</h3>
                                            <div className="flex items-center flex-wrap gap-[0.8vw]">
                                                {contacts.map((contact) => {
                                                    if (!contact.value) return null;
                                                    const style = getSocialIcon(contact.type);

                                                    return (
                                                        <button
                                                            key={contact.id}
                                                            onClick={(e) => handleContactClick(e, contact)}
                                                            className={`w-[2.2vw] h-[2.2vw] ${style.bg} rounded-[0.4vw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm border border-gray-100 p-[0.4vw]`}
                                                            title={contact.value}
                                                        >
                                                            <Icon
                                                                icon={style.icon}
                                                                className={`${style.color} w-full h-full`}
                                                                strokeWidth={contact.type === 'phone' ? 3 : 1}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const getPosition = () => {
        const layoutId = Number(activeLayout);
        if (isMobile) {
            return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
        }
        if (layoutId === 2) return `top-[8.5vh] left-[calc(50%_+_6vw)] -translate-x-1/2 rounded-[0.2vw]`;
        if (layoutId === 3) return 'top-[9vh] left-[calc(50%_+_3vw)] -translate-x-1/2';
        if (layoutId === 5) return 'bottom-[9vh] left-[calc(50%_+_12vw)] -translate-x-1/2';
        if (layoutId === 4) return 'top-[44vh] left-[6vw]';
        if (layoutId === 6) return 'top-[48vh] right-[4vw]';
        if (layoutId === 1) return isTablet ? 'bottom-[2.8vw] right-[21.2vw]' : 'bottom-[4.5vw] right-[21.2vw]';
        return 'bottom-[4.5vw] right-[21.2vw]';
    };

    return (
        <>
            <div className={`absolute inset-0 z-[159] ${isLayout3 ? 'bg-transparent' : 'bg-black/5'} pointer-events-auto`} onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[160] pointer-events-auto`}>
                <div
                    className={`
                        ${isLayout3
                            ? `bg-white rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] overflow-hidden ${isMobile ? 'w-[60vw]' : isTablet ? 'w-[8.5vw]' : 'w-[14vw]'} border border-gray-100`
                            : isLayout2
                                ? `bg-white/60 backdrop-blur-xl border border-white/50 ${isMobile ? 'p-[2vw]' : 'p-[0.4vw]'} rounded-[1.4vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.2)]`
                                : isLayout1
                                    ? `${isMobile ? 'rounded-[4vw] p-[3vw] w-[60vw]' : isTablet ? 'rounded-[0.8vw] w-[11vw] p-[0.6vw]' : 'rounded-[1vw] shadow-2xl p-[1vw] w-[14vw]'} border border-white/10 backdrop-blur-md`
                                    : `rounded-[1vw] shadow-2xl ${isMobile ? 'p-[3vw] w-[60vw]' : 'p-[0.8vw] w-[13vw]'} border border-white/10 backdrop-blur-md`
                        }
                        animate-in fade-in slide-in-from-top-4 duration-300
                    `}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: isLayout1 ? getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8') : (isLayout2) ? undefined : (isLayout3) ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8')
                    }}
                >
                    <div
                        className={isLayout2 ? `rounded-[1vw] ${isTablet ? 'p-[0.8vw] w-[8vw]' : 'p-[1vw] w-[11vw]'} relative` : 'p-[0.8vw] w-full'}
                        style={{ backgroundColor: (isLayout2 || isLayout3) ? `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))` : (isLayout1 ? 'transparent' : getLayoutColor('dropdown-bg', '#FFFFFF')) }}
                    >
                        <div className={isLayout3 ? (isMobile ? 'relative z-10 p-[10px] flex-1 flex flex-col justify-between' : 'relative z-10 p-[0.8vw]') : 'w-full'}>
                            {!hasData ? (
                                <div className="text-[0.8vw] text-center py-[1.5vw] opacity-80 font-medium whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 0.8)" }}>
                                    No profile found
                                </div>
                            ) : (
                                <>
                                    {/* Header Section */}
                                    {isLayout3 ? (
                                        <div className="mb-[0.6vw]">
                                            <h2 className={`font-bold ${isMobile ? 'text-[9px]' : 'text-[0.85vw]'}`} style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}>Profile</h2>
                                        </div>
                                    ) : isLayout2 ? (
                                        <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                                            <h2 className="text-[0.8vw] font-bold whitespace-nowrap" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>
                                                Profile
                                            </h2>
                                            <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: `color-mix(in srgb, var(--dropdown-text, ${fallbackText}) 30%, transparent)`, opacity: "var(--dropdown-text-opacity, 1)" }} />
                                        </div>
                                    ) : (
                                        <div className="text-center mb-[0.8vw] relative">
                                            <h2 className="text-[1vw] font-bold leading-tight" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>Profile</h2>
                                            <div className="h-[1px] w-full mt-[0.4vw]" style={{ backgroundColor: `color-mix(in srgb, var(--dropdown-text, ${fallbackText}) 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                                        </div>
                                    )}

                                    {/* Personal Info */}
                                    {(name || about) && (
                                        <div className={`${isMobile ? 'space-y-[2px] mb-[4px]' : 'space-y-[0.8vw] mb-[1.5vw]'}`}>
                                            {name && (
                                                <div className="flex items-start gap-[4px]">
                                                    <span
                                                        className={`${isMobile ? 'text-[8px]' : 'text-[0.8vw]'} font-bold whitespace-nowrap`}
                                                        style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                                                    >
                                                        Name:
                                                    </span>
                                                    <span
                                                        className={`${isMobile ? 'text-[8px]' : 'text-[0.8vw]'} font-medium truncate`}
                                                        style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                                                    >
                                                        {name}
                                                    </span>
                                                </div>
                                            )}
                                            {about && (
                                                <div className="flex items-start gap-[4px]">
                                                    <span
                                                        className={`${isMobile ? 'text-[8px]' : 'text-[0.8vw]'} font-bold whitespace-nowrap`}
                                                        style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                                                    >
                                                        About:
                                                    </span>
                                                    <p
                                                        className={`${isMobile ? 'text-[7.5px]' : 'text-[0.75vw]'} font-normal leading-tight text-left tracking-tight opacity-95`}
                                                        style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                                                    >
                                                        {about}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {contacts.length > 0 && (
                                        <div className="relative">
                                            <div className="flex items-center gap-[0.6vw] mb-[0.8vw]">
                                                <h3
                                                    className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold`}
                                                    style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}
                                                >
                                                    Contact
                                                </h3>
                                                <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', fallbackText)} 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                                            </div>

                                            {/* Social Icons Stack */}
                                            <div className="flex items-center flex-wrap gap-[5px] justify-start mt-[1px]">
                                                {contacts.map((contact) => {
                                                    if (!contact.value) return null;
                                                    const style = getSocialIcon(contact.type);

                                                    return (
                                                        <button
                                                            key={contact.id}
                                                            onClick={(e) => handleContactClick(e, contact)}
                                                            className={`${isMobile ? 'w-4 h-4 p-0.5' : 'w-[2.2vw] h-[2.1vw] p-[0.4vw]'} ${style.bg} rounded-[2px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5`}
                                                            title={contact.value}
                                                        >
                                                            <Icon
                                                                icon={style.icon}
                                                                className={`${style.color} w-full h-full`}
                                                                strokeWidth={contact.type === 'phone' ? 4 : 1}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePopup;
