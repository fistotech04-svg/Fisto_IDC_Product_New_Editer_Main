import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Icon } from '@iconify/react';

export const SVG_ELEMENTS_LIST = [
  // --- Mask Ready Shapes ---
  {
    id: 'heart',
    name: 'Heart Mask',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M33.0256 8.52306L29.5195 5.03659C22.732 -1.71332 11.7669 -1.67362 5.02823 5.12515C-1.71046 11.9239 -1.67086 22.9072 5.11664 29.6569L26.7378 51.1581C27.1957 51.6955 27.6771 52.2196 28.1822 52.7292L32.4153 57L59.9899 29.5786C66.6361 22.9693 66.6749 12.2147 60.0765 5.55748C53.4781 -1.09978 42.7412 -1.13851 36.095 5.47072L33.0256 8.52306Z',
    viewBox: '0 0 65 57',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    fill: '#FF5252',
    width: 130,
    height: 114
  },
  {
    id: 'ring',
    name: 'Ring Mask',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M46 92C71.4051 92 92 71.4051 92 46C92 20.5949 71.4051 0 46 0C20.5949 0 0 20.5949 0 46C0 71.4051 20.5949 92 46 92ZM70.2545 46C70.2545 59.3954 59.3954 70.2545 46 70.2545C32.6046 70.2545 21.7455 59.3954 21.7455 46C21.7455 32.6046 32.6046 21.7455 46 21.7455C59.3954 21.7455 70.2545 32.6046 70.2545 46Z',
    viewBox: '0 0 92 92',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    fill: '#FF7043',
    width: 120,
    height: 120
  },
  {
    id: 'semi-circle',
    name: 'Semi Circle',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M72 36C72 26.4522 68.2072 17.2955 61.4558 10.5442C54.7045 3.79285 45.5478 7.20838e-07 36 0C26.4522 -7.20838e-07 17.2955 3.79284 10.5442 10.5442C3.79285 17.2955 1.44168e-06 26.4522 0 36L36 36H72Z',
    viewBox: '0 0 72 36',
    fill: '#42A5F5',
    width: 140,
    height: 70
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M24 0H96L114.5 72H0L24 0Z',
    viewBox: '0 0 115 72',
    fill: '#26A69A',
    width: 140,
    height: 88
  },
  {
    id: 'arch',
    name: 'Arch Frame',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M0 50 C0 22.3858 22.3858 0 50 0 C77.6142 0 100 22.3858 100 50 L100 100 L0 100 Z',
    viewBox: '0 0 100 100',
    fill: '#7E57C2',
    width: 120,
    height: 120
  },
  {
    id: 'shield',
    name: 'Shield',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M50 0 L100 15 L100 55 C100 80 50 100 50 100 C50 100 0 80 0 55 L0 15 Z',
    viewBox: '0 0 100 100',
    fill: '#5C6BC0',
    width: 120,
    height: 120
  },
  {
    id: 'star-badge',
    name: 'Star Frame',
    category: 'Shapes',
    subCategory: 'Mask Frames',
    isMaskReady: true,
    d: 'M50 0 L61.8 36.3 H100 L69.1 58.8 L80.9 95.1 L50 72.6 L19.1 95.1 L30.9 58.8 L0 36.3 H38.2 Z',
    viewBox: '0 0 100 100',
    fill: '#FFA000',
    width: 120,
    height: 120
  },
  {
    id: 'diamond',
    name: 'Diamond Frame',
    category: 'Shapes',
    subCategory: 'Geometric',
    isMaskReady: true,
    d: 'M50 0 L100 50 L50 100 L0 50 Z',
    viewBox: '0 0 100 100',
    fill: '#EC407A',
    width: 120,
    height: 120
  },
  {
    id: 'hexagon',
    name: 'Hexagon Frame',
    category: 'Shapes',
    subCategory: 'Geometric',
    isMaskReady: true,
    d: 'M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z',
    viewBox: '0 0 100 100',
    fill: '#29B6F6',
    width: 120,
    height: 120
  },
  {
    id: 'cloud',
    name: 'Cloud Mask',
    category: 'Shapes',
    subCategory: 'Badges & Special',
    isMaskReady: true,
    d: 'M25 60 C12 60 0 48 0 35 C0 22 10 12 22 10 C28 3 40 0 50 5 C60 0 74 3 80 12 C90 14 98 22 98 33 C98 48 85 60 70 60 Z',
    viewBox: '0 0 100 65',
    fill: '#66BB6A',
    width: 140,
    height: 90
  },
  {
    id: 'organic-blob',
    name: 'Blob Frame',
    category: 'Shapes',
    subCategory: 'Badges & Special',
    isMaskReady: true,
    d: 'M44.5 12.3 C56.2 16.1 66.8 24.6 70.3 35.8 C73.8 47 70.2 61 61.1 69.4 C52 77.8 37.3 80.7 26.5 75.3 C15.7 69.9 8.7 56.3 7.8 43.6 C6.8 30.9 11.9 19.1 21.6 13.7 C31.3 8.3 32.8 8.5 44.5 12.3 Z',
    viewBox: '0 0 80 85',
    fill: '#AB47BC',
    width: 120,
    height: 128
  },

  // --- Vector Graphics as shown in screenshot ---
  {
    id: 'square-red',
    name: 'Rounded Square',
    category: 'Shapes',
    subCategory: 'Basic',
    isMaskReady: true,
    d: 'M10 0 H90 A10 10 0 0 1 100 10 V90 A10 10 0 0 1 90 100 H10 A10 10 0 0 1 0 90 V10 A10 10 0 0 1 10 0 Z',
    viewBox: '0 0 100 100',
    fill: '#EF5350',
    width: 120,
    height: 120
  },
  {
    id: 'circle-orange',
    name: 'Circle',
    category: 'Shapes',
    subCategory: 'Basic',
    isMaskReady: true,
    d: 'M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z',
    viewBox: '0 0 100 100',
    fill: '#FFA726',
    width: 120,
    height: 120
  },
  {
    id: 'triangle-blue',
    name: 'Triangle',
    category: 'Shapes',
    subCategory: 'Basic',
    isMaskReady: true,
    d: 'M50 5 L95 95 L5 95 Z',
    viewBox: '0 0 100 100',
    fill: '#42A5F5',
    width: 120,
    height: 120
  },
  {
    id: 'potted-plant',
    name: 'Potted Plant',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M30 60 L36 90 H64 L70 60 Z" fill="#78909C" />
        <ellipse cx="50" cy="60" rx="20" ry="4" fill="#546E7A" />
        <path d="M50 60 V35" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 48 Q30 35 26 48 Q35 55 50 48 Z" fill="#66BB6A" />
        <path d="M50 42 Q70 28 74 42 Q65 49 50 42 Z" fill="#43A047" />
        <path d="M50 35 Q40 15 50 10 Q60 15 50 35 Z" fill="#81C784" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><path d="M30 60 L36 90 H64 L70 60 Z" fill="#78909C"/><ellipse cx="50" cy="60" rx="20" ry="4" fill="#546E7A"/><path d="M50 60 V35" stroke="#4CAF50" stroke-width="4" stroke-linecap="round"/><path d="M50 48 Q30 35 26 48 Q35 55 50 48 Z" fill="#66BB6A"/><path d="M50 42 Q70 28 74 42 Q65 49 50 42 Z" fill="#43A047"/><path d="M50 35 Q40 15 50 10 Q60 15 50 35 Z" fill="#81C784"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'laptop-vector',
    name: 'Laptop',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="20" y="24" width="60" height="42" rx="4" fill="#2C3E50" />
        <rect x="25" y="28" width="50" height="34" rx="2" fill="#E0F7FA" />
        <path d="M12 70 H88 L80 76 H20 Z" fill="#78909C" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="130" height="130"><rect x="20" y="24" width="60" height="42" rx="4" fill="#2C3E50"/><rect x="25" y="28" width="50" height="34" rx="2" fill="#E0F7FA"/><path d="M12 70 H88 L80 76 H20 Z" fill="#78909C"/></svg>`,
    width: 130,
    height: 130
  },
  {
    id: 'lightbulb-vector',
    name: 'Lightbulb',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M50 15 C33 15 25 28 25 42 C25 52 35 60 38 68 H62 C65 60 75 52 75 42 C75 28 67 15 50 15 Z" fill="#FFE082" />
        <path d="M40 70 H60 V76 H40 Z" fill="#90A4AE" />
        <path d="M44 78 H56 V82 H44 Z" fill="#78909C" />
        <path d="M50 5 V0 M15 35 H5 M85 35 H95 M22 18 L14 10 M78 18 L86 10" stroke="#FFB300" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><path d="M50 15 C33 15 25 28 25 42 C25 52 35 60 38 68 H62 C65 60 75 52 75 42 C75 28 67 15 50 15 Z" fill="#FFE082"/><path d="M40 70 H60 V76 H40 Z" fill="#90A4AE"/><path d="M44 78 H56 V82 H44 Z" fill="#78909C"/><path d="M50 5 V0 M15 35 H5 M85 35 H95 M22 18 L14 10 M78 18 L86 10" stroke="#FFB300" stroke-width="4" stroke-linecap="round"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'ribbon-banner',
    name: 'Ribbon Banner',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path d="M10 20 L25 10 L25 35 L10 45 L18 32.5 Z" fill="#C62828" />
        <path d="M90 20 L75 10 L75 35 L90 45 L82 32.5 Z" fill="#C62828" />
        <rect x="20" y="15" width="60" height="24" rx="2" fill="#E53935" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="150" height="75"><path d="M10 20 L25 10 L25 35 L10 45 L18 32.5 Z" fill="#C62828"/><path d="M90 20 L75 10 L75 35 L90 45 L82 32.5 Z" fill="#C62828"/><rect x="20" y="15" width="60" height="24" rx="2" fill="#E53935"/></svg>`,
    width: 150,
    height: 75
  },
  {
    id: 'target-vector',
    name: 'Target',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="#EF5350" />
        <circle cx="50" cy="50" r="33" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="21" fill="#EF5350" />
        <circle cx="50" cy="50" r="9" fill="#FFFFFF" />
        <path d="M70 15 L50 45 L55 50 L85 30 Z" fill="#FFB300" opacity="0.9" />
        <path d="M85 10 L75 25 L88 28 Z" fill="#E53935" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="50" r="45" fill="#EF5350"/><circle cx="50" cy="50" r="33" fill="#FFFFFF"/><circle cx="50" cy="50" r="21" fill="#EF5350"/><circle cx="50" cy="50" r="9" fill="#FFFFFF"/><path d="M70 15 L50 45 L55 50 L85 30 Z" fill="#FFB300" opacity="0.9"/><path d="M85 10 L75 25 L88 28 Z" fill="#E53935"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'gear-settings',
    name: 'Gear Cog',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    d: 'M40 0 H60 V15 H40 Z M40 85 H60 V100 H40 Z M0 40 H15 V60 H0 Z M85 40 H100 V60 H85 Z M12 20 L23 9 L33 20 L22 31 Z M67 74 L78 63 L88 74 L77 85 Z M20 77 L9 66 L20 56 L31 67 Z M74 23 L63 12 L74 2 L85 13 Z M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20 Z M50 35 A15 15 0 1 1 50 65 A15 15 0 1 1 50 35 Z',
    viewBox: '0 0 100 100',
    fill: '#78909C',
    width: 120,
    height: 120
  },
  {
    id: 'arrow-straight',
    name: 'Arrow Right',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    d: 'M10 40 H60 V20 L95 50 L60 80 V60 H10 Z',
    viewBox: '0 0 100 100',
    fill: '#263238',
    width: 130,
    height: 90
  },
  {
    id: 'arrow-curved',
    name: 'Curved Arrow',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M15 85 C20 40 45 25 70 25 V10 L95 35 L70 60 V42 C50 42 32 55 28 85 Z" fill="#FF3D00" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><path d="M15 85 C20 40 45 25 70 25 V10 L95 35 L70 60 V42 C50 42 32 55 28 85 Z" fill="#FF3D00"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'trend-arrow',
    name: 'Trend Arrow',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M10 80 Q50 80 80 25" fill="none" stroke="#263238" strokeWidth="6" strokeDasharray="6 6" strokeLinecap="round" />
        <path d="M70 15 L95 20 L88 45 Z" fill="#263238" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><path d="M10 80 Q50 80 80 25" fill="none" stroke="#263238" stroke-width="6" stroke-dasharray="6 6" stroke-linecap="round"/><path d="M70 15 L95 20 L88 45 Z" fill="#263238"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'avatar-user',
    name: 'User Avatar',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="32" r="18" fill="#FFCC80" />
        <path d="M32 24 C32 12 68 12 68 24 C68 28 60 22 50 22 C40 22 32 28 32 24 Z" fill="#3E2723" />
        <path d="M20 90 C20 65 35 60 50 60 C65 60 80 65 80 90 Z" fill="#1565C0" />
        <path d="M44 60 L50 75 L56 60 Z" fill="#FFFFFF" />
        <path d="M48 65 L52 65 L50 82 Z" fill="#E53935" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="32" r="18" fill="#FFCC80"/><path d="M32 24 C32 12 68 12 68 24 C68 28 60 22 50 22 C40 22 32 28 32 24 Z" fill="#3E2723"/><path d="M20 90 C20 65 35 60 50 60 C65 60 80 65 80 90 Z" fill="#1565C0"/><path d="M44 60 L50 75 L56 60 Z" fill="#FFFFFF"/><path d="M48 65 L52 65 L50 82 Z" fill="#E53935"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'bar-chart-growth',
    name: 'Growth Chart',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="65" width="14" height="25" rx="2" fill="#29B6F6" />
        <rect x="35" y="45" width="14" height="45" rx="2" fill="#0288D1" />
        <rect x="55" y="25" width="14" height="65" rx="2" fill="#FF7043" />
        <rect x="75" y="10" width="14" height="80" rx="2" fill="#E64A19" />
        <path d="M10 70 L40 50 L60 30 L85 8" fill="none" stroke="#FF5722" strokeWidth="4" strokeLinecap="round" />
        <path d="M75 5 H90 V20 Z" fill="#FF5722" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="130" height="130"><rect x="15" y="65" width="14" height="25" rx="2" fill="#29B6F6"/><rect x="35" y="45" width="14" height="45" rx="2" fill="#0288D1"/><rect x="55" y="25" width="14" height="65" rx="2" fill="#FF7043"/><rect x="75" y="10" width="14" height="80" rx="2" fill="#E64A19"/><path d="M10 70 L40 50 L60 30 L85 8" fill="none" stroke="#FF5722" stroke-width="4" stroke-linecap="round"/><path d="M75 5 H90 V20 Z" fill="#FF5722"/></svg>`,
    width: 130,
    height: 130
  },
  {
    id: 'presentation-board',
    name: 'Whiteboard',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="15" width="70" height="50" rx="4" fill="#ECEFF1" stroke="#78909C" strokeWidth="4" />
        <line x1="50" y1="65" x2="30" y2="92" stroke="#546E7A" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="65" x2="70" y2="92" stroke="#546E7A" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="65" x2="50" y2="92" stroke="#546E7A" strokeWidth="4" strokeLinecap="round" />
        <path d="M25 35 L40 25 L55 40 L75 22" fill="none" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><rect x="15" y="15" width="70" height="50" rx="4" fill="#ECEFF1" stroke="#78909C" stroke-width="4"/><line x1="50" y1="65" x2="30" y2="92" stroke="#546E7A" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="65" x2="70" y2="92" stroke="#546E7A" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="65" x2="50" y2="92" stroke="#546E7A" stroke-width="4" stroke-linecap="round"/><path d="M25 35 L40 25 L55 40 L75 22" fill="none" stroke="#42A5F5" stroke-width="3" stroke-linecap="round"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'document-check',
    name: 'Document Check',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="25" y="10" width="50" height="70" rx="4" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="2" />
        <line x1="35" y1="25" x2="65" y2="25" stroke="#90A4AE" strokeWidth="4" strokeLinecap="round" />
        <line x1="35" y1="38" x2="65" y2="38" stroke="#90A4AE" strokeWidth="4" strokeLinecap="round" />
        <line x1="35" y1="51" x2="55" y2="51" stroke="#90A4AE" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="72" r="16" fill="#E53935" />
        <path d="M63 72 L68 77 L78 67" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><rect x="25" y="10" width="50" height="70" rx="4" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="2"/><line x1="35" y1="25" x2="65" y2="25" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><line x1="35" y1="38" x2="65" y2="38" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><line x1="35" y1="51" x2="55" y2="51" stroke="#90A4AE" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="72" r="16" fill="#E53935"/><path d="M63 72 L68 77 L78 67" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'handshake-icon',
    name: 'Handshake',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M15 35 L30 50 L45 35 L30 20 Z" fill="#1E88E5" />
        <path d="M85 35 L70 50 L55 35 L70 20 Z" fill="#0D47A1" />
        <path d="M30 50 L45 65 L60 50 L45 35 Z" fill="#42A5F5" />
        <path d="M50 55 L65 70 L80 55 L65 40 Z" fill="#2196F3" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><path d="M15 35 L30 50 L45 35 L30 20 Z" fill="#1E88E5"/><path d="M85 35 L70 50 L55 35 L70 20 Z" fill="#0D47A1"/><path d="M30 50 L45 65 L60 50 L45 35 Z" fill="#42A5F5"/><path d="M50 55 L65 70 L80 55 L65 40 Z" fill="#2196F3"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'badge-award',
    name: 'Gold Award',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="40" r="28" fill="#FFD54F" stroke="#FFA000" strokeWidth="4" />
        <circle cx="50" cy="40" r="20" fill="#FFE082" />
        <path d="M38 65 L28 92 L45 82 L50 92 L55 82 L72 92 L62 65" fill="#42A5F5" />
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="40" r="28" fill="#FFD54F" stroke="#FFA000" stroke-width="4"/><circle cx="50" cy="40" r="20" fill="#FFE082"/><path d="M38 65 L28 92 L45 82 L50 92 L55 82 L72 92 L62 65" fill="#42A5F5"/></svg>`,
    width: 120,
    height: 120
  },
  {
    id: 'badge-new',
    name: 'NEW Badge',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <rect x="5" y="8" width="90" height="44" rx="12" fill="#E53935" />
        <text x="50" y="38" fill="#FFFFFF" fontSize="22" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">NEW</text>
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="130" height="78"><rect x="5" y="8" width="90" height="44" rx="12" fill="#E53935"/><text x="50" y="38" fill="#FFFFFF" font-size="22" font-weight="bold" text-anchor="middle" font-family="sans-serif">NEW</text></svg>`,
    width: 130,
    height: 78
  },
  {
    id: 'badge-sale',
    name: 'SALE Badge',
    category: 'Shapes',
    subCategory: 'Vector Graphic',
    customSvg: (
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <rect x="5" y="8" width="90" height="44" rx="6" fill="#43A047" />
        <text x="50" y="38" fill="#FFFFFF" fontSize="22" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SALE</text>
      </svg>
    ),
    rawSvgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="130" height="78"><rect x="5" y="8" width="90" height="44" rx="6" fill="#43A047"/><text x="50" y="38" fill="#FFFFFF" font-size="22" font-weight="bold" text-anchor="middle" font-family="sans-serif">SALE</text></svg>`,
    width: 130,
    height: 78
  }
];

const CATEGORIES = [
  { id: 'All', label: 'All', icon: 'mynaui:grid' },
  { id: 'Text', label: 'Text', icon: 'tabler:letter-t' },
  { id: 'Shapes', label: 'Shapes', icon: 'tabler:shapes' },
  { id: 'Buttons', label: 'Buttons', icon: 'tabler:square-rounded' },
  { id: 'Tables', label: 'Tables', icon: 'tabler:table' },
  { id: 'Image', label: 'Image', icon: 'tabler:photo' },
  { id: 'Masking', label: 'Masking', icon: 'tabler:sparkles' },
  { id: 'Slideshow', label: 'Slideshow', icon: 'tabler:presentation' },
  { id: 'QR Code', label: 'QR Code', icon: 'tabler:qrcode' },
  { id: 'Google Maps', label: 'Google Maps', icon: 'tabler:map-pin' },
  { id: 'Decorators', label: 'Decorators', icon: 'tabler:wand' },
  { id: '3rd-Party Embeds', label: '3rd-Party Embeds', icon: 'tabler:code' },
];

const ElementsGallery = ({
  isOpen,
  onClose,
  onSelect,
  className = "absolute z-[9999] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150",
  style = {
    width: '26vw',
    height: '38vw',
    left: 'calc(100% + 0.6vw)',
    top: '0'
  }
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Shapes');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredElements = SVG_ELEMENTS_LIST.filter(item => {
    const matchesCategory = 
      selectedCategory === 'All' ? true :
      selectedCategory === 'Shapes' ? (item.category === 'Shapes') :
      selectedCategory === 'Masking' ? item.isMaskReady :
      item.category === selectedCategory;

    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleItemSelect = (shape) => {
    if (typeof onSelect === 'function') {
      onSelect(shape);
    } else {
      window.dispatchEvent(new CustomEvent('add-shape-to-editor', {
        detail: {
          shape: shape,
          x: 200,
          y: 200
        }
      }));
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div
      className={className}
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header matching design */}
      <div className="px-[1.2vw] pt-[1.2vw] pb-[0.8vw] bg-white border-b border-gray-100 flex flex-col gap-[0.7vw]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[1.1vw] font-bold text-gray-900 leading-tight">Add Elements</h2>
            <p className="text-[0.68vw] text-gray-400 mt-[0.2vh]">Drag and Drop elements to your page</p>
          </div>
          <button
            onClick={onClose}
            className="w-[1.6vw] h-[1.6vw] rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X size="1vw" />
          </button>
        </div>

        {/* Search Elements input */}
        <div className="relative">
          <Search size="0.9vw" className="absolute left-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[2.2vw] pl-[2.2vw] pr-[1.8vw] text-[0.75vw] bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-[0.5vw] outline-none focus:border-red-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size="0.8vw" />
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Category Sidebar */}
        <div className="w-[7.5vw] border-r border-gray-100 bg-[#FAFAFA] flex flex-col py-[0.5vw] overflow-y-auto custom-scrollbar select-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-[0.45vw] px-[0.8vw] py-[0.55vw] text-left text-[0.72vw] transition-all relative ${
                  isSelected
                    ? 'font-semibold text-[#FF4D4F] bg-[#FFF1F0] border-l-[0.25vw] border-[#FF4D4F]'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 border-l-[0.25vw] border-transparent font-normal'
                }`}
              >
                <Icon
                  icon={cat.icon}
                  className={`w-[0.95vw] h-[0.95vw] shrink-0 ${isSelected ? 'text-[#FF4D4F]' : 'text-gray-500'}`}
                />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area: Elements Grid */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto p-[1vw] custom-scrollbar">
          <div className="text-[0.78vw] font-semibold text-gray-700 mb-[0.6vw] flex items-center justify-between">
            <span>{selectedCategory === 'Shapes' ? 'Vector Graphic' : `${selectedCategory} Elements`}</span>
            <span className="text-[0.65vw] text-gray-400 font-normal">{filteredElements.length} items</span>
          </div>

          <div className="grid grid-cols-3 gap-[0.6vw]">
            {filteredElements.map((shape) => (
              <div
                key={shape.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'svg-element',
                    shape: shape
                  }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onDragEnd={() => {
                  if (typeof onClose === 'function') {
                    onClose();
                  }
                }}
                onClick={() => handleItemSelect(shape)}
                onDoubleClick={() => handleItemSelect(shape)}
                className="group relative aspect-square rounded-[0.6vw] border border-gray-100 bg-white hover:border-red-300 hover:shadow-md p-[0.5vw] flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.03]"
              >
                {/* SVG Shape Preview */}
                <div className="w-[3.4vw] h-[3.4vw] flex items-center justify-center my-auto pointer-events-none">
                  {shape.customSvg ? (
                    shape.customSvg
                  ) : (
                    <svg viewBox={shape.viewBox} className="w-full h-full drop-shadow-2xs">
                      <path
                        d={shape.d}
                        fillRule={shape.fillRule || 'nonzero'}
                        clipRule={shape.clipRule || 'nonzero'}
                        fill={shape.fill || '#4B5563'}
                      />
                    </svg>
                  )}
                </div>

                {/* Name Label */}
                <div className="text-[0.62vw] font-medium text-gray-600 group-hover:text-red-600 truncate max-w-full text-center mt-[0.2vw]">
                  {shape.name}
                </div>
              </div>
            ))}
          </div>

          {filteredElements.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 py-[4vw] text-gray-400">
              <Icon icon="tabler:shapes" className="w-[2.2vw] h-[2.2vw] mb-[0.4vw] opacity-40" />
              <span className="text-[0.75vw]">No items found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElementsGallery;
