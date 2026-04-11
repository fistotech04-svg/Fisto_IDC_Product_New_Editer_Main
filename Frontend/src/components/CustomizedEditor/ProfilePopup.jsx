import React from 'react';
import { Icon } from '@iconify/react';

const ProfilePopup = ({ onClose, profileSettings, activeLayout, isTablet, isMobile, isLandscape }) => {
    // Select the correct profile data based on activeLayout if profileSettings is keyed by layout ID
    const currentProfile = (profileSettings && profileSettings[activeLayout]) ? profileSettings[activeLayout] : profileSettings;

    const name = currentProfile?.name || '';
    const about = currentProfile?.about || '';
    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

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
    const fallbackText = isLayout1 ? '#FFFFFF' : '#3E4491';
    const hasData = name.trim() || about.trim() || contacts.some(c => c.value?.trim());

    const getSocialIcon = (type) => {
        switch (type) {
            case 'x': return { icon: 'ri:twitter-x-fill', bg: 'bg-black', color: 'text-white' };
            case 'facebook': return { icon: 'ri:facebook-fill', bg: 'bg-[#3B5998]', color: 'text-white' };
            case 'email': return { icon: 'logos:google-gmail', bg: 'bg-white', color: '' };
            case 'instagram': return { icon: 'lucide:instagram', bg: 'bg-gradient-to-tr from-[#FFD600] via-[#FF0144] to-[#0401E5]', color: 'text-white' };
            case 'phone': return { icon: 'lucide:phone', bg: 'bg-white', color: 'text-[#575C9C]' };
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

    if (isMobile && !isLandscape && !isLayout3) {
        return (
            <div
                className="absolute inset-0 z-[3000] flex justify-end items-start pt-[150px] pr-[16px] pointer-events-auto"
                onClick={onClose}
            >
                <div
                    className="w-[70%] max-w-[240px] rounded-xl shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden outline-none border border-white/10"
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(12px)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Section */}
                    <div className="flex flex-col items-center px-4 pt-3 pb-2">
                        <h2 className="text-[16px] font-bold text-white tracking-wide">Profile</h2>
                        <div className="h-[1px] w-full bg-white/10 mt-2" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto max-h-[50vh] px-3 py-1 custom-scrollbar">
                        {!hasData ? (
                            <div className="text-center py-8 text-white/40 text-[12px] font-medium italic">
                                No profile found
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 pb-3">
                                {/* Name Section */}
                                {name && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-white text-[13px] font-bold whitespace-nowrap">Name :</span>
                                        <span className="text-white text-[13px] font-medium opacity-90">{name}</span>
                                    </div>
                                )}

                                {/* About Section */}
                                {about && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-white text-[13px] font-bold">About :</span>
                                        <p className="text-white text-[12px] font-medium leading-relaxed opacity-90 text-justify">
                                            {about}
                                        </p>
                                    </div>
                                )}

                                {/* Contacts Section */}
                                {contacts.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-white text-[13px] font-bold">Contact :</span>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {contacts.map((contact) => {
                                                if (!contact.value) return null;
                                                const style = getSocialIcon(contact.type);

                                                return (
                                                    <button
                                                        key={contact.id}
                                                        onClick={(e) => handleContactClick(e, contact)}
                                                        className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-sm border border-gray-100 p-1.5`}
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
                            </div>
                        )}
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
                    className="absolute top-[8vh] left-[calc(50%+12.3vw)] -translate-x-[85%] z-[45] animate-in fade-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative flex flex-col">
                        {/* Connector Tab for Profile Icon */}
                        <div className="absolute top-[-3.3vw] right-[0.5vw] w-[5.5vw] h-[3.5vw] z-0">
                            <svg width="100%" height="100%" viewBox="0 0 91 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                    fill={getLayoutColor('toolbar-bg', '#575C9C')}
                                    fillOpacity="0.6"
                                />
                            </svg>
                        </div>

                        {/* Popup Container */}
                        <div className="backdrop-blur-md rounded-[1vw] p-[0.6vw] shadow-lg border border-white/10 w-[18vw] min-h-[5vw] relative z-10 flex flex-col justify-center"
                             style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.6') }}
                        >
                            <div className="bg-white rounded-[0.6vw] flex flex-col w-full p-[1.2vw]">
                                {!hasData ? (
                                    <div className="text-[0.85vw] text-center py-[2vw] text-[#575C9C] font-medium italic opacity-70">
                                        No profile found
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-[1.2vw]">
                                        {/* Name Row */}
                                        {name && (
                                            <div className="flex items-start gap-[0.5vw]">
                                                <span className="text-[#575C9C] text-[0.85vw] font-bold whitespace-nowrap">
                                                    Name :
                                                </span>
                                                <span className="text-[#575C9C] text-[0.85vw] font-medium opacity-90">
                                                    {name}
                                                </span>
                                            </div>
                                        )}

                                        {/* About Row */}
                                        {about && (
                                            <div className="flex items-start gap-[0.5vw]">
                                                <span className="text-[#575C9C] text-[0.85vw] font-bold whitespace-nowrap">
                                                    About :
                                                </span>
                                                <p className="text-[#575C9C] text-[0.8vw] font-medium leading-[1.6] text-justify opacity-90 tracking-tight">
                                                    {about}
                                                </p>
                                            </div>
                                        )}

                                        {/* Contact Section */}
                                        {contacts.length > 0 && (
                                            <div className="flex flex-col gap-[0.8vw] mt-[0.5vw]">
                                                <span className="text-[#575C9C] text-[0.85vw] font-bold">
                                                    Contact :
                                                </span>
                                                <div className="flex items-center flex-wrap gap-[0.6vw]">
                                                    {contacts.map((contact) => {
                                                        if (!contact.value) return null;
                                                        const style = getSocialIcon(contact.type);

                                                        return (
                                                            <button
                                                                key={contact.id}
                                                                onClick={(e) => handleContactClick(e, contact)}
                                                                className={`w-[2.4vw] h-[2.4vw] ${style.bg} rounded-[0.5vw] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-sm border border-gray-200`}
                                                                title={contact.value}
                                                            >
                                                                {contact.type === 'phone' || contact.type === 'email' || contact.type === 'link' ? (
                                                                    <Icon
                                                                        icon={style.icon}
                                                                        className={`w-[1.4vw] h-[1.4vw]`}
                                                                        style={contact.type === 'phone' ? { color: '#5454F2' } : contact.type === 'email' ? {} : { color: '#575C9C' }}
                                                                        strokeWidth={2}
                                                                    />
                                                                ) : contact.type === 'x' ? (
                                                                    <span className="text-white font-bold text-[1.4vw] leading-none" style={{ fontFamily: 'serif' }}>𝕏</span>
                                                                ) : (
                                                                    <Icon
                                                                        icon={style.icon}
                                                                        className={`${style.color} w-[1.6vw] h-[1.6vw]`}
                                                                    />
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

    if (isLayout8) {
        return (
            <>
                <div className="absolute inset-0 z-[159] bg-transparent pointer-events-auto" onClick={onClose} />
                <div className={`absolute ${isTablet ? 'bottom-[8.5vh]' : 'bottom-[10.5vh]'} left-[calc(50%+10.5vw)] -translate-x-1/2 z-[160] pointer-events-auto`}>
                    <div
                        className={`bg-white rounded-[0.4vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[10vw]' : 'w-[16vw]'} overflow-hidden border border-gray-100 flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className={`w-full ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1vw] py-[0.6vw]'}`}
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                        >
                            <h2 className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-bold tracking-wide`} style={{ color: getLayoutColor('toolbar-text', '#FFFFFF') }}>Profile</h2>
                        </div>

                        {/* Body */}
                        <div className={`${isTablet ? 'p-[0.8vw]' : 'p-[1vw]'} w-full`}>
                            {!hasData ? (
                                <div className={`${isTablet ? 'text-[0.7vw] py-[1.2vw]' : 'text-[0.8vw] py-[1.5vw]'} text-center opacity-80 font-medium whitespace-nowrap`} style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                                    No profile found
                                </div>
                            ) : (
                                <>
                                    {/* Personal Info */}
                                    {(name || about) && (
                                        <div className={`space-y-[0.8vw] ${isTablet ? 'mb-[1.2vw]' : 'mb-[1.5vw]'}`}>
                                            {name && (
                                                <div className="flex items-start gap-[0.4vw]">
                                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold whitespace-nowrap mt-[0.1vw]`} style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                                                        Name :
                                                    </span>
                                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-medium`} style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.8 }}>
                                                        {name}
                                                    </span>
                                                </div>
                                            )}
                                            {about && (
                                                <div className="flex items-start gap-[0.4vw]">
                                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold whitespace-nowrap mt-[0.1vw]`} style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                                                        About :
                                                    </span>
                                                    <p className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-medium leading-[1.4] text-justify tracking-tight`} style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.8 }}>
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
                                                <h3 className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-bold`} style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                                                    Contact
                                                </h3>
                                            </div>
                                            <div className={`flex items-center flex-wrap ${isTablet ? 'gap-[0.6vw]' : 'gap-[0.5vw]'} justify-start`}>
                                                {contacts.map((contact) => {
                                                    if (!contact.value) return null;
                                                    const style = getSocialIcon(contact.type);

                                                    return (
                                                        <button
                                                            key={contact.id}
                                                            onClick={(e) => handleContactClick(e, contact)}
                                                            className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2vw] h-[2vw]'} ${style.bg} rounded-[0.4vw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border ${style.bg === 'bg-white' ? 'border-gray-200' : 'border-white/5'}`}
                                                            title={contact.value}
                                                        >
                                                            <Icon
                                                                icon={style.icon}
                                                                className={`${style.color} ${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`}
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
                            : isTablet ? "right-[3vw] top-[6vh] bottom-[5vh] w-[11vw] bg-white border-[#575C9C]/10" : "right-[3.5vw] top-[7vh] bottom-[6vh] w-[17.5vw] bg-white border-[#575C9C]/10"
                        }`}
                    style={isLayout7 ? { backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), var(--dropdown-bg-opacity, 0.8))" } : {}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full">
                        {/* Header Section */}
                        <div
                            className={`flex items-center justify-between px-[1.2vw] border-b shrink-0 ${isLayout7 ? 'h-[6vh]' : 'h-[7vh]'}`}
                            style={{ borderColor: "var(--dropdown-text, rgba(255,255,255,0.2))" }}
                        >
                            <h2 className="text-[1.2vw] font-bold" style={{ color: "var(--dropdown-text, #575C9C)" }}>Profile</h2>
                            <button
                                onClick={onClose}
                                className="transition-all p-[0.4vw]"
                                style={{ color: "var(--dropdown-text, #575C9C)", opacity: 0.6 }}
                            >
                                <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw]" />
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
                                                <span className="font-bold text-[0.9vw] whitespace-nowrap" style={{ color: "var(--dropdown-text, #575C9C)" }}>Name :</span>
                                                <span className="text-[0.85vw] font-medium leading-relaxed opacity-80" style={{ color: "var(--dropdown-text, #575C9C)" }}>{name}</span>
                                            </div>
                                        )}
                                        {about && (
                                            <div className="flex flex-col gap-[0.6vh]">
                                                <span className="font-bold text-[0.9vw]" style={{ color: "var(--dropdown-text, #575C9C)" }}>About :</span>
                                                <p className="text-[0.8vw] leading-[1.6] text-justify font-medium opacity-80" style={{ color: "var(--dropdown-text, #575C9C)" }}>
                                                    {about}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Section */}
                                    {contacts.length > 0 && (
                                        <div className="flex flex-col gap-[1.5vh] mt-[1vh]">
                                            <h3 className="font-bold text-[0.9vw]" style={{ color: "var(--dropdown-text, #575C9C)" }}>Contact</h3>
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
        if (layoutId === 2) return `top-[6vh] left-[calc(50%+6vw)] -translate-x-1/2 rounded-[0.2vw]`;
        if (layoutId === 3) return 'top-[6vh] left-[calc(50%+3vw)] -translate-x-1/2';
        if (layoutId === 5) return 'bottom-[9vh] left-[calc(50%+12vw)] -translate-x-1/2';
        if (layoutId === 4) return 'top-[44vh] left-[6vw]';
        if (layoutId === 6) return 'top-[48vh] right-[4vw]';
        if (layoutId === 1) return isTablet ? 'bottom-[2.8vw] right-[21.2vw]' : 'bottom-[4.5vw] right-[21.2vw]';
        return 'bottom-[4.5vw] right-[21.2vw]';
    };

    return (
        <>
            <div className="absolute inset-0 z-[159] bg-black/5 pointer-events-auto" onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[160] pointer-events-auto`}>
                <div
                    className={`
                        ${isLayout3
                            ? `bg-white rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] ${isMobile ? 'p-[2vw] w-[60vw]' : isTablet ? 'p-[0.6vw] w-[8.5vw]' : 'p-[0.8vw] w-[14vw]'} border border-gray-100`
                            : isLayout2
                                ? `backdrop-blur-xl border border-white/50 ${isMobile ? 'p-[2vw]' : 'p-[0.4vw]'} rounded-[1.4vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.2)]`
                                : isLayout1
                                    ? `${isMobile ? 'rounded-[4vw] p-[3vw] w-[60vw]' : isTablet ? 'rounded-[0.8vw] w-[11vw] p-[0.6vw]' : 'rounded-[1vw] shadow-2xl p-[1vw] w-[14vw]'} border border-white/10 backdrop-blur-md`
                                    : `rounded-[1vw] shadow-2xl ${isMobile ? 'p-[3vw] w-[60vw]' : 'p-[0.8vw] w-[13vw]'} border border-white/10 backdrop-blur-md`
                        }
                        animate-in fade-in slide-in-from-top-4 duration-300
                    `}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: (isLayout1 || isLayout4 || isLayout6 || isLayout7) ? getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8') : (isLayout2) ? undefined : (isLayout3) ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8')
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
