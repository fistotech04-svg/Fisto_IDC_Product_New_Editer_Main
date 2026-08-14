import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import ColorPicker from './ColorPicker';
import { generateCompositeHotspotSvg } from './hotspotUtils';

import link1 from '../../assets/hotspot preset icon/link-box.svg';
import link2 from '../../assets/hotspot preset icon/link-box-variant.svg';
import link3 from '../../assets/hotspot preset icon/link-plus.svg';
import link4 from '../../assets/hotspot preset icon/link-variant-plus.svg';
import link5 from '../../assets/hotspot preset icon/link-variant.svg';
import link6 from '../../assets/hotspot preset icon/link.svg';
import whatsapp1 from '../../assets/hotspot preset icon/whatsapp-svgrepo-com.svg';
import whatsapp2 from '../../assets/hotspot preset icon/whatsapp-alt-svgrepo-com.svg';
import whatsapp3 from '../../assets/hotspot preset icon/whatsapp-128-svgrepo-com.svg';
import whatsapp4 from '../../assets/hotspot preset icon/social-whatsapp-svgrepo-com.svg';
import whatsapp5 from '../../assets/hotspot preset icon/whatsapp-social-media-svgrepo-com.svg';
import nav1 from '../../assets/hotspot preset icon/file-input.svg';
import nav2 from '../../assets/hotspot preset icon/file-output.svg';
import nav3 from '../../assets/hotspot preset icon/file-sliders.svg';
import nav4 from '../../assets/hotspot preset icon/file-symlink.svg';
import nav5 from '../../assets/hotspot preset icon/folder-symlink.svg';
import call1 from '../../assets/hotspot preset icon/phone-call-phone-svgrepo-com.svg';
import call2 from '../../assets/hotspot preset icon/phone-call-svgrepo-com (1).svg';
import call3 from '../../assets/hotspot preset icon/phone-call-svgrepo-com.svg';
import call4 from '../../assets/hotspot preset icon/phone-call-telephone-svgrepo-com.svg';
import call5 from '../../assets/hotspot preset icon/phone-call-thin-svgrepo-com.svg';
import email1 from '../../assets/hotspot preset icon/email-address-svgrepo-com.svg';
import email2 from '../../assets/hotspot preset icon/email-open-circle-fill-svgrepo-com.svg';
import email3 from '../../assets/hotspot preset icon/envelope-solid-full.svg';
import email4 from '../../assets/hotspot preset icon/mail-5709.svg';
import email5 from '../../assets/hotspot preset icon/mail-5712.svg';
import loc1 from '../../assets/hotspot preset icon/location-filled-svgrepo-com.svg';
import loc2 from '../../assets/hotspot preset icon/location-maps-svgrepo-com.svg';
import loc3 from '../../assets/hotspot preset icon/location-pin-map-svgrepo-com.svg';
import loc4 from '../../assets/hotspot preset icon/location-pointer-svgrepo-com.svg';
import loc5 from '../../assets/hotspot preset icon/location-svgrepo-com.svg';
import yt1 from '../../assets/hotspot preset icon/youtube-168-svgrepo-com.svg';
import yt2 from '../../assets/hotspot preset icon/youtube-app-icon.svg';
import yt3 from '../../assets/hotspot preset icon/youtube-brands-solid.svg';
import yt4 from '../../assets/hotspot preset icon/youtube-shorts-icon.svg';
import yt5 from '../../assets/hotspot preset icon/youtube-svgrepo-com.svg';
import ig1 from '../../assets/hotspot preset icon/instagram-1-logo-svgrepo-com.svg';
import ig2 from '../../assets/hotspot preset icon/instagram-2-1-logo-svgrepo-com.svg';
import ig3 from '../../assets/hotspot preset icon/instagram-2016-logo-svgrepo-com.svg';
import ig4 from '../../assets/hotspot preset icon/instagram-follow.svg';
import ig5 from '../../assets/hotspot preset icon/instagram-logo-facebook-svgrepo-com.svg';
import cube1 from '../../assets/hotspot preset icon/cube-stroke-rounded.svg';
import cube2 from '../../assets/hotspot preset icon/cube_cutout.svg';
import cube3 from '../../assets/hotspot preset icon/cube_double_edge.svg';
import cube4 from '../../assets/hotspot preset icon/cube_orbit.svg';
import cube5 from '../../assets/hotspot preset icon/cube_wireframe.svg';
import x1 from '../../assets/hotspot preset icon/Twitter-Logo--Streamline-Logos-Block.svg';
import x2 from '../../assets/hotspot preset icon/twitter-brands-solid.svg';
import x3 from '../../assets/hotspot preset icon/twitter-logo-black-outline-20871.svg';
import x4 from '../../assets/hotspot preset icon/twitter-x-logo-black-round-20851.svg';
import x5 from '../../assets/hotspot preset icon/twitter-x-logo-black-square-rounded-outline-20849.svg';
import fb1 from '../../assets/hotspot preset icon/facebook-color-svgrepo-com.svg';
import fb2 from '../../assets/hotspot preset icon/facebook-f-svgrepo-com.svg';
import fb3 from '../../assets/hotspot preset icon/facebook-f.svg';
import fb4 from '../../assets/hotspot preset icon/facebook-square-svgrepo-com.svg';
import fb5 from '../../assets/hotspot preset icon/facebook-svgrepo-com.svg';
import in1 from '../../assets/hotspot preset icon/linkedin-94.svg';
import in2 from '../../assets/hotspot preset icon/linkedin-blue-logo.svg';
import in3 from '../../assets/hotspot preset icon/linkedin-brands-solid.svg';
import in4 from '../../assets/hotspot preset icon/linkedin-logo-black-circle-15920.svg';
import in5 from '../../assets/hotspot preset icon/linkedin-square-blue-logo-15978.svg';
import vid1 from '../../assets/hotspot preset icon/video-818.svg';
import vid2 from '../../assets/hotspot preset icon/video-icon.svg';
import vid3 from '../../assets/hotspot preset icon/video1-solid.svg';
import vid4 from '../../assets/hotspot preset icon/video2-button-4205.svg';
import vid5 from '../../assets/hotspot preset icon/video3-button-4207.svg';
import pop1 from '../../assets/hotspot preset icon/popup_cursor.svg';
import pop2 from '../../assets/hotspot preset icon/popup_external.svg';
import pop3 from '../../assets/hotspot preset icon/popup_layers.svg';
import pop4 from '../../assets/hotspot preset icon/popup_modal.svg';
import pop5 from '../../assets/hotspot preset icon/popup_stack.svg';
import slide1 from '../../assets/hotspot preset icon/slideshow-slide-show-carousel-svgrepo-com.svg';
import slide2 from '../../assets/hotspot preset icon/slideshow-svgrepo-com.svg';
import slide3 from '../../assets/hotspot preset icon/slideshow_frames.svg';
import slide4 from '../../assets/hotspot preset icon/slideshow_indicator.svg';
import slide5 from '../../assets/hotspot preset icon/slideshowmajor-svgrepo-com.svg';

const BgStyleThumb = ({ styleIdx, color, iconSrc }) => {
  const [thumb, setThumb] = useState(null);
  useEffect(() => {
    let isMounted = true;
    generateCompositeHotspotSvg(null, iconSrc, color, '#fff', styleIdx).then(res => {
      if (isMounted && res) setThumb(res.innerSvg);
    });
    return () => { isMounted = false; };
  }, [styleIdx, color, iconSrc]);
  return thumb ? (
    <svg key={thumb} className="w-[1.8vw] h-[1.8vw] pointer-events-none" viewBox="0 0 52 52" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: thumb }} />
  ) : null;
};
const HotspotCustomizationPopup = ({ 
  onClose, 
  onSave, 
  initialHotspotIconSrc,
  initialHotspotHtml,
  initialIconColor = '#FFFFFF',
  initialBgColor,
  initialIconStyle = 0,
  initialBgStyle = 0,
  interactionType = 'open-link'
}) => {
  const defaultColors = {
    'open-link': '#359CFD',
    'whatsapp': '#34A853',
    'navigate-to': '#7A63FC',
    'navigate': '#7A63FC',
    '3d-viewer': '#359CFD',
    'call': '#32D3C2',
    'email': '#FD8F2F',
    'location': '#FD8F2F',
    'youtube': '#FF0000',
    'instagram': 'linear-gradient(45deg, rgb(240, 148, 51) 0%, rgb(230, 104, 60) 25%, rgb(220, 39, 67) 50%, rgb(204, 35, 102) 75%, rgb(188, 24, 136) 100%)',
    'x': '#000000',
    'facebook': '#3D5A98',
    'linkedin': '#0A66C2',
    'video': '#359CFD',
    'popup': '#32D3C2',
    'slideshow': '#19C025',
    'zoom': '#359CFD',
    'download': '#FD6994',
    'info-box': '#000000',
    'info': '#000000'
  };

  const resolvedInitialBgColor = initialBgColor || defaultColors[interactionType] || '#2F91FD';

  const [iconColor, setIconColor] = useState(initialIconColor);
  const [bgColor, setBgColor] = useState(resolvedInitialBgColor);
  const [iconStyle, setIconStyle] = useState(initialIconStyle);
  const [bgStyle, setBgStyle] = useState(initialBgStyle);
  const [isModified, setIsModified] = useState(false);
  
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const popupRef = useRef(null);

  const defaultLinkStyles = [
    link5, 
    link3, 
    link4, 
    link6, 
    link2, 
    link1
  ];
  
  const pureIcons = {
    'whatsapp': [whatsapp1, whatsapp2, whatsapp3, whatsapp4, whatsapp5],
    'call': [
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m21 15.46l-5.27-.61l-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97z"/></svg>`,
      call1, call2, call3, call4, call5
    ],
    'email': [
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m3 7l9 6l9-6"/></g></svg>`,
      email1, email2, email3, email4, email5
    ],
    'location': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M11.262 22.134S4 16.018 4 10a8 8 0 1 1 16 0c0 6.018-7.262 12.134-7.262 12.134c-.404.372-1.069.368-1.476 0M12 13.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7"/></svg>`,
      loc1, loc2, loc3, loc4, loc5
    ],
    'youtube': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" fill-rule="evenodd" d="M501.3 132.8c-5.9-22-23.2-39.4-45.3-45.3c-39.9-10.7-200-10.7-200-10.7s-160.1 0-200 10.7c-22 5.9-39.4 23.2-45.3 45.3C0 172.7 0 256 0 256s0 83.3 10.7 123.2c5.9 22 23.2 39.4 45.3 45.3c39.9 10.7 200 10.7 200 10.7s160.1 0 200-10.7c22-5.9 39.4-23.2 45.3-45.3C512 339.3 512 256 512 256s0-83.3-10.7-123.2 M204.8 332.8 l133-76.8 l-133-76.8 z"/></svg>`,
      yt1, yt2, yt3, yt4, yt5
    ],
    'instagram': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>`,
      ig1, ig2, ig3, ig4, ig5
    ],
    '3d-viewer': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.55 2.876L4.595 6.182a2.98 2.98 0 0 0-1.529 2.611v6.414a2.98 2.98 0 0 0 1.529 2.61l5.957 3.307a2.98 2.98 0 0 0 2.898 0l5.957-3.306a2.98 2.98 0 0 0 1.529-2.611V8.793a2.98 2.98 0 0 0-1.529-2.61L13.45 2.876a2.98 2.98 0 0 0-2.898 0Z"/><path d="M20.33 6.996L12 12L3.67 6.996M12 21.49V12"/></g></svg>`,
      cube1, cube2, cube3, cube4, cube5
    ],
    'x': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m17.687 3.063l-4.996 5.711l-4.32-5.711H2.112l7.477 9.776l-7.086 8.099h3.034l5.469-6.25l4.78 6.25h6.102l-7.794-10.304l6.625-7.571zm-1.064 16.06L5.654 4.782h1.803l10.846 14.34z"/></svg>`,
      x1, x2, x3, x4, x5
    ],
    'facebook': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/></svg>`,
      fb1, fb2, fb3, fb4, fb5
    ],
    'linkedin': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></svg>`,
      in1, in2, in3, in4, in5
    ],
    'video': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M5.669 4.76a1.47 1.47 0 0 1 2.04-1.177c1.062.453 3.442 1.532 6.462 3.276c3.021 1.744 5.146 3.266 6.069 3.958c.788.59.79 1.763.001 2.355c-.914.687-3.013 2.191-6.07 3.956c-3.06 1.766-5.412 2.832-6.464 3.28a1.467 1.467 0 0 1-2.038-1.177c-.138-1.141-.396-3.734-.396-7.236c0-3.5.257-6.092.396-7.235" clip-rule="evenodd"/></svg>`,
      vid1, vid2, vid3, vid4, vid5
    ],
    'popup': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="currentColor" d="M28 4H10a2.006 2.006 0 0 0-2 2v14a2.006 2.006 0 0 0 2 2h18a2.006 2.006 0 0 0 2-2V6a2.006 2.006 0 0 0-2-2m0 16H10V6h18Z"/><path fill="currentColor" d="M18 26H4V16h2v-2H4a2.006 2.006 0 0 0-2 2v10a2.006 2.006 0 0 0 2 2h14a2.006 2.006 0 0 0 2-2v-2h-2Z"/></svg>`,
      pop1, pop2, pop3, pop4, pop5
    ],
    'slideshow': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.5 6h-17v13h17zM12 19v3M2 2h20v4H2zM1 19h22"/><path d="M10.651 15.5v-6l4.072 3z"/></g></svg>`,
      slide1, slide2, slide3, slide4, slide5
    ],
    'navigate-to': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M20 12V5.749a.6.6 0 0 0-.176-.425l-3.148-3.148A.6.6 0 0 0 16.252 2H4.6a.6.6 0 0 0-.6.6v18.8a.6.6 0 0 0 .6.6H11M8 10h8M8 6h4m-4 8h3m9.5 6.5L22 22"/><path d="M15 18a3 3 0 1 0 6 0a3 3 0 0 0-6 0m1-16v3.4a.6.6 0 0 0 .6.6H20"/></g></svg>`,
      nav1, nav2, nav3, nav4, nav5
    ],
    'navigate': [
      initialHotspotIconSrc || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M20 12V5.749a.6.6 0 0 0-.176-.425l-3.148-3.148A.6.6 0 0 0 16.252 2H4.6a.6.6 0 0 0-.6.6v18.8a.6.6 0 0 0 .6.6H11M8 10h8M8 6h4m-4 8h3m9.5 6.5L22 22"/><path d="M15 18a3 3 0 1 0 6 0a3 3 0 0 0-6 0m1-16v3.4a.6.6 0 0 0 .6.6H20"/></g></svg>`,
      nav1, nav2, nav3, nav4, nav5
    ],
    'zoom': [`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="currentColor" d="M13.5 7a1 1 0 0 1 1 1v4.5H19a1 1 0 1 1 0 2h-4.5V19a1 1 0 1 1-2 0v-4.5H8a1 1 0 1 1 0-2h4.5V8a1 1 0 0 1 1-1m0-5C19.851 2 25 7.149 25 13.5c0 2.828-1.021 5.418-2.715 7.42l.024-.026l6.398 6.399a1 1 0 1 1-1.414 1.414l-6.398-6.398c-2 1.68-4.58 2.691-7.395 2.691C7.149 25 2 19.851 2 13.5S7.149 2 13.5 2m0 2a9.5 9.5 0 1 0 0 19a9.5 9.5 0 0 0 0-19"/></svg>`],
    'download': [`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10l5 5l5-5"/></g></svg>`]
  };

  const isLinkType = !interactionType || interactionType === 'open-link';
  const iconStyles = isLinkType ? defaultLinkStyles : (pureIcons[interactionType] || [initialHotspotIconSrc]);

  const bgStyles = [];

  const [livePreviewSvg, setLivePreviewSvg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const updatePreview = async () => {
      // Pass null for bgSrc, and pass bgStyle as the 5th parameter to generate the correct background
      const svgStr = await generateCompositeHotspotSvg(null, iconStyles[iconStyle], bgColor, iconColor, bgStyle);
      if (isMounted && svgStr) {
        setLivePreviewSvg(svgStr.innerSvg);
      }
    };
    updatePreview();
    return () => { isMounted = false; };
  }, [bgColor, iconColor, iconStyle, bgStyle, interactionType, initialHotspotIconSrc]);

  // Click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeColorPicker && !e.target.closest('[data-color-picker="true"]')) {
        setActiveColorPicker(null);
      }
    };
    if (activeColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeColorPicker]);

  const toggleColorPicker = (e, type) => {
    e.stopPropagation();
    if (activeColorPicker === type) {
      setActiveColorPicker(null);
    } else {
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      // Position to the right of the button at a fixed height relative to the popup
      setPickerPosition({ top: popupRect.top + 10, left: buttonRect.right + 10 });
      setActiveColorPicker(type);
    }
  };

  const handleSave = () => {
    onSave({
      iconColor,
      bgColor,
      iconStyle,
      bgStyle
    });
    onClose();
  };

  const getOpacityPercent = (colorStr) => {
    if (!colorStr || typeof colorStr !== 'string') return '100%';
    if (colorStr.startsWith('#') && colorStr.length === 9) {
      const alphaHex = colorStr.substring(7, 9);
      return Math.round((parseInt(alphaHex, 16) / 255) * 100) + '%';
    }
    return '100%';
  };

  const handleOpacityScrub = (color, setColor) => (e) => {
    if (!color || !color.startsWith('#')) return; // Only scrub hex colors for now
    
    e.preventDefault();
    const startX = e.clientX;
    const initialPercent = parseInt(getOpacityPercent(color));
    
    const baseColor = color.substring(0, 7); // #RRGGBB
    
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newPercent = Math.round(initialPercent + deltaX / 1.5);
      newPercent = Math.max(0, Math.min(100, newPercent));
      
      let newColor = baseColor;
      if (newPercent < 100) {
        const alphaHex = Math.round((newPercent / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
        newColor = `${baseColor}${alphaHex}`;
      }
      setColor(newColor);
      setIsModified(true);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const popupContent = (
    <div className="fixed inset-0 bg-black/40 z-[99999] flex items-center justify-center font-sans" onClick={onClose}>
      <div 
        ref={popupRef}
        className="bg-white rounded-[0.6vw] w-[40vw] h-auto pb-[1vh] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-[1.5vw] pt-[1.5vh] pb-[1vh] flex items-center border-b border-gray-100">
          <h2 className="text-[1vw] font-semibold text-black">Hotspot Customization</h2>
          <div className="flex-1 border-t border-gray-200 ml-[1vw]"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex px-[1.5vw] pt-[1vh] pb-[2vh] gap-[1.5vw]">
          {/* Left Preview */}
          <div className="flex flex-col w-[48%] h-full">
            <span className="text-[0.6vw] text-gray-400 font-medium uppercase tracking-wider mb-[1vh]">Preview</span>
            
            <div className="flex-1 border border-gray-100 rounded-[0.5vw] flex flex-col">
              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center bg-white p-[2vw]">
                {(!isModified && initialHotspotHtml) ? (
                  <div className="relative w-[10vw] h-[10vw] flex items-center justify-center">
                    <svg key={livePreviewSvg} className="w-[10vw] h-[10vw] pointer-events-none" viewBox="0 0 52 52" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: initialHotspotHtml }} />
                  </div>
                ) : livePreviewSvg ? (
                  <div className="relative w-[10vw] h-[10vw] flex items-center justify-center">
                    <svg key={livePreviewSvg} className="w-[10vw] h-[10vw] pointer-events-none" viewBox="0 0 52 52" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: livePreviewSvg }} />
                  </div>
                ) : (
                  <div className="relative w-[10vw] h-[10vw] flex items-center justify-center">
                    <div className="w-[2vw] h-[2vw] rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Presets Row */}
              <div className="border-t border-gray-100 p-[1vw] flex flex-col gap-[0.5vh]">
                <span className="text-[0.6vw] text-gray-400 font-medium uppercase tracking-wider">Preset</span>
                <div className="flex items-center gap-[0.5vw] justify-between">
                  {[0, 1, 2, 3, 4, 5].map((styleIdx) => (
                    <button
                      key={styleIdx}
                      onClick={() => { setBgStyle(styleIdx); setIsModified(true); }}
                      className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.4vw] border transition-all ${bgStyle === styleIdx ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                    >
                      <BgStyleThumb styleIdx={styleIdx} color={bgColor ? (bgColor.startsWith('#') ? bgColor.substring(0, 7) : bgColor) : bgColor} iconSrc={iconStyles[iconStyle]} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex-1 flex flex-col justify-between">
            
            <div className="flex flex-col gap-[3.5vh] mt-[4vh]">
              {/* Icon Style */}
              <div className="flex items-center">
                <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Style :</span>
                <div className="flex items-center gap-[0.4vw] ml-[0.5vw]">
                {iconStyles.map((style, idx) => (
                    <button
                      key={idx}
                      className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] border transition-colors ${(!isModified && initialHotspotHtml) ? 'border-transparent hover:bg-gray-50' : (iconStyle === idx ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50')}`}
                      onClick={() => { setIconStyle(idx); setIsModified(true); }}
                    >
                      <img src={style} alt={`Icon Style ${idx + 1}`} className="w-[100%] h-[100%] object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Color */}
              <div className="flex items-center relative">
                <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Color :</span>
                <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                  <div 
                    className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                    style={{ background: iconColor }}
                    onClick={(e) => toggleColorPicker(e, 'iconColor')}
                  ></div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                    <input type="text" readOnly value={iconColor} className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0" />
                    <span 
                      className={`text-[0.6vw] flex-shrink-0 ml-[0.5vw] transition-colors ${(iconColor && iconColor.startsWith('#')) ? 'text-gray-800 font-medium cursor-ew-resize hover:text-blue-500' : 'text-gray-400'}`}
                      onMouseDown={handleOpacityScrub(iconColor, setIconColor)}
                      title={(iconColor && iconColor.startsWith('#')) ? "Drag to adjust opacity" : ""}
                    >
                      {getOpacityPercent(iconColor)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bg Color */}
              <div className="flex items-center relative">
                <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Bg Color :</span>
                <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                  <div 
                    className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                    style={{ background: bgColor }}
                    onClick={(e) => toggleColorPicker(e, 'bgColor')}
                  ></div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                    <input type="text" readOnly value={bgColor} className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0" />
                    <span 
                      className={`text-[0.6vw] flex-shrink-0 ml-[0.5vw] transition-colors ${(bgColor && bgColor.startsWith('#')) ? 'text-gray-800 font-medium cursor-ew-resize hover:text-blue-500' : 'text-gray-400'}`}
                      onMouseDown={handleOpacityScrub(bgColor, setBgColor)}
                      title={(bgColor && bgColor.startsWith('#')) ? "Drag to adjust opacity" : ""}
                    >
                      {getOpacityPercent(bgColor)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons inside Right Controls aligned with Presets */}
            <div className="flex justify-end gap-[0.6vw] mt-auto mb-[2.5vh]">
              <button 
                className="px-[1vw] py-[0.5vh] text-[0.7vw] font-medium text-gray-700 bg-white border border-gray-200 rounded-[0.3vw] hover:bg-gray-50 flex items-center gap-[0.3vw] transition-colors"
                onClick={onClose}
              >
                <Icon icon="lucide:x" className="text-[0.8vw]" /> Cancel
              </button>
              <button
                onClick={async () => {
                  const svgStr = await generateCompositeHotspotSvg(null, iconStyles[iconStyle], bgColor, iconColor, bgStyle);
                  if (onSave) onSave({ 
                    iconColor, 
                    bgColor, 
                    iconStyle, 
                    bgStyle,
                    generatedSvgString: svgStr
                  });
                  onClose();
                }}
                className="px-[1.5vw] py-[0.8vh] bg-black text-white text-[0.8vw] font-medium rounded-[0.3vw] hover:bg-gray-800 transition-colors flex items-center gap-[0.4vw]"
              >
                <Icon icon="lucide:check" className="text-[0.8vw]" /> Save Changes
              </button>
            </div>

          </div>
        </div>
      </div>
      
      {/* Color Picker Render */}
      {activeColorPicker && (
        <div
          data-color-picker="true"
          className="fixed z-[999999] animate-in fade-in zoom-in-95 duration-200"
          style={{ top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px` }}
        >
          <ColorPicker
            color={activeColorPicker === 'iconColor' ? iconColor : bgColor}
            onChange={(c) => {
              const hex = c.hex || c;
              if (activeColorPicker === 'iconColor') setIconColor(hex);
              else setBgColor(hex);
              setIsModified(true);
            }}
            opacity={parseInt(getOpacityPercent(activeColorPicker === 'iconColor' ? iconColor : bgColor))}
            onOpacityChange={(newOpacity) => {
              const currentColor = activeColorPicker === 'iconColor' ? iconColor : bgColor;
              const baseHex = currentColor.substring(0, 7);
              const alphaHex = Math.round((newOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
              const newColor = newOpacity === 100 ? baseHex : `${baseHex}${alphaHex}`;
              
              if (activeColorPicker === 'iconColor') setIconColor(newColor);
              else setBgColor(newColor);
              setIsModified(true);
            }}
            disableAlpha={false}
          />
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(popupContent, document.body) : null;
};

export default HotspotCustomizationPopup;
