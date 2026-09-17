import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Eye, ArrowRight, ChevronDown, Check, X, 
  Filter, ArrowUpDown, Heart, Loader2
} from 'lucide-react';
import CreateFlipbookModal from '../components/CreateFlipbookModal';
import { formatTemplateSvgToPageSvg } from '../utils/editorUtils';

// Template Preview SVGs from assets
import t1 from '../assets/Templates/Template_1.svg';
import t2 from '../assets/Templates/Template_2.svg';
import t3 from '../assets/Templates/Template_3.svg';
import t4 from '../assets/Templates/Template_4.svg';
import t5 from '../assets/Templates/Template_5.svg';
import t6 from '../assets/Templates/Template_6.svg';
import t7 from '../assets/Templates/Template_7.svg';
import t8 from '../assets/Templates/Template_8.svg';
import t9 from '../assets/Templates/Template_9.svg';
import carT1 from '../assets/Templates/Template_Car_1.svg';
import carT2 from '../assets/Templates/Template_Car_2.svg';
import carT3 from '../assets/Templates/Template_Car_3.svg';
import carT4 from '../assets/Templates/Template_Car_4.svg';
import newT1 from '../assets/Templates/New_Template_1.svg';
import newT2 from '../assets/Templates/New_Template_2.svg';
import newT3 from '../assets/Templates/New_Template_3.svg';
import newT4 from '../assets/Templates/New_Template_4.svg';
import newT5 from '../assets/Templates/New_Template_5.svg';
import newT6 from '../assets/Templates/New_Template_6.svg';

const CATEGORIES = [
  'All',
  'Business',
  'Education',
  'Healthcare',
  'Industrial',
  'Product Catalog',
  'Real Estate',
  'Food & Hospitality',
  'Automotive',
  'More'
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'az', label: 'Alphabetical (A-Z)' },
  { id: 'pages_desc', label: 'Page Count: High to Low' },
  { id: 'pages_asc', label: 'Page Count: Low to High' },
];

const FORMAT_OPTIONS = [
  { id: 'all', label: 'All Formats' },
  { id: 'corporate', label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  { id: 'large_catalogue', label: 'A3 (297 × 420 mm)', width: 297, height: 420 },
  { id: 'mini', label: 'A5 (148 × 210 mm)', width: 148, height: 210 },
  { id: 'letter', label: 'Letter (216 × 279 mm)', width: 216, height: 279 },
  { id: 'square', label: 'Square (210 × 210 mm)', width: 210, height: 210 },
  { id: 'dl', label: 'DL Flyer (99 × 210 mm)', width: 99, height: 210 }
];

const TEMPLATE_LIST = [
  {
    id: 'porsche_911_gt3',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Porsche 911 GT3 RS',
    category: 'Automotive',
    badge: 'Automotive',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 24,
    preview: carT1,
    desc: 'High-octane automotive racing brochure with track telemetry and aerodynamic details.',
    popular: true,
    popularity: 99,
    date: '2026-03-01'
  },
  {
    id: 'automotive_performance',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Vehicle Performance Specs',
    category: 'Automotive',
    badge: 'Automotive',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 20,
    preview: carT2,
    desc: 'Heavy machinery and fleet vehicle profile layout with structured specification charts.',
    popular: true,
    popularity: 95,
    date: '2026-02-28'
  },
  {
    id: 'alloy_wheels_catalog',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Premium Alloy Wheels',
    category: 'Automotive',
    badge: 'Automotive',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 16,
    preview: carT3,
    desc: 'Automotive custom wheel tuning catalog with fitment guides and manufacturing standards.',
    popular: true,
    popularity: 92,
    date: '2026-02-25'
  },
  {
    id: 'automotive_dealership_hub',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Auto Dealership & Support',
    category: 'Automotive',
    badge: 'Automotive',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 8,
    preview: carT4,
    desc: 'Automotive showroom contact, dealership locations, and client assistance pamphlet.',
    popular: false,
    popularity: 82,
    date: '2026-02-22'
  },
  {
    id: 'creative_product_design',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Creative Product Design',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 12,
    preview: t1,
    desc: 'Design your product brochure with modern typography, geometric shapes, and branding spaces.',
    popular: true,
    popularity: 90,
    date: '2026-02-20'
  },
  {
    id: 'packaging_solutions',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Modern Packaging Line',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 18,
    preview: t2,
    desc: 'Card-based product container breakdown with material specifications and volume dimensions.',
    popular: true,
    popularity: 88,
    date: '2026-02-18'
  },
  {
    id: 'industrial_booster_pump',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'HBP-800 Booster Pump',
    category: 'Industrial',
    badge: 'Industrial',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 24,
    preview: t3,
    desc: 'Heavy-duty water booster pump catalog with engineering diagrams and pressure stats.',
    popular: true,
    popularity: 87,
    date: '2026-02-15'
  },
  {
    id: 'corporate_profile_vision',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Corporate Profile & Vision',
    category: 'Business',
    badge: 'Business',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 16,
    preview: t4,
    desc: 'Executive leadership, team capability, and corporate roadmap booklet.',
    popular: true,
    popularity: 86,
    date: '2026-02-12'
  },
  {
    id: 'medico_healthcare',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Medico Hospital Supplies',
    category: 'Healthcare',
    badge: 'Healthcare',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 20,
    preview: t5,
    desc: 'Diagnostic tools, patient care equipment, and emergency medical supply directory.',
    popular: true,
    popularity: 85,
    date: '2026-02-10'
  },
  {
    id: 'diesel_generator_specs',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Diesel Power Generators',
    category: 'Industrial',
    badge: 'Industrial',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 28,
    preview: t6,
    desc: 'Industrial acoustic enclosures, voltage specifications, and generator capacity manual.',
    popular: false,
    popularity: 80,
    date: '2026-02-05'
  },
  {
    id: 'eid_delicacy_menu',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Festive Delicacies Menu',
    category: 'Food & Hospitality',
    badge: 'Food & Hospitality',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 14,
    preview: t7,
    desc: 'Luxury traditional confectionery, dessert catering, and artisanal pastry catalog.',
    popular: false,
    popularity: 79,
    date: '2026-02-01'
  },
  {
    id: 'kerala_escape_tour',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Kerala Scenic Getaway',
    category: 'Real Estate',
    badge: 'Real Estate',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 22,
    preview: t8,
    desc: 'Hill station retreats, luxury backwater houseboat holidays, and travel itinerary.',
    popular: false,
    popularity: 78,
    date: '2026-01-28'
  },
  {
    id: 'luxury_holiday_packages',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Luxury Travel & Tours',
    category: 'Real Estate',
    badge: 'Real Estate',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 12,
    preview: t9,
    desc: 'Curated premium destination guide with sightseeing schedules and resort bookings.',
    popular: false,
    popularity: 76,
    date: '2026-01-25'
  },
  {
    id: 'contemporary_architecture',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Modern Architecture Lookbook',
    category: 'Real Estate',
    badge: 'Real Estate',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 32,
    preview: newT2,
    desc: 'Architectural portfolio featuring interior design concepts, floorplans, and elevations.',
    popular: false,
    popularity: 74,
    date: '2026-01-18'
  },
  {
    id: 'educational_program_guide',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Academic Program Guide',
    category: 'Education',
    badge: 'Education',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 16,
    preview: newT3,
    desc: 'University prospectus with department coursework, admission pathways, and campus life.',
    popular: false,
    popularity: 73,
    date: '2026-01-15'
  },
  {
    id: 'business_annual_report',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Executive Annual Report',
    category: 'Business',
    badge: 'Business',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 24,
    preview: newT4,
    desc: 'Quarterly financial statements, company performance charts, and shareholder briefings.',
    popular: false,
    popularity: 71,
    date: '2026-01-10'
  },
  {
    id: 'weekly_superstore_specials',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Weekly Retail Superstore',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 10,
    preview: newT5,
    desc: 'Retail discounts, grocery promotions, and department store seasonal flyers.',
    popular: false,
    popularity: 69,
    date: '2026-01-05'
  },
  {
    id: 'studio_edition_portfolio',
    templateId: 'corporate',
    formatId: 'corporate',
    title: 'Studio Edition Creative',
    category: 'Business',
    badge: 'Business',
    formatLabel: 'A4',
    dim: '210 × 297 mm',
    width: 210,
    height: 297,
    pages: 18,
    preview: newT6,
    desc: 'Creative agency portfolio with branding case studies, art direction, and typography showcase.',
    popular: false,
    popularity: 68,
    date: '2026-01-01'
  }
];

export default function Template() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('porsche_911_gt3');
  const [favorites, setFavorites] = useState(() => new Set(['porsche_911_gt3']));

  // Modal States
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateIdForModal, setSelectedTemplateIdForModal] = useState('corporate');
  const [existingFlipbooks, setExistingFlipbooks] = useState([]);

  // User Email & Backend URL
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);
  const emailId = user?.emailId || user?.email || 'naveen@fistotech.com';
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch existing flipbooks for duplicate name validation
  useEffect(() => {
    const fetchExistingFlipbooks = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/flipbook/list`, {
          params: { emailId }
        });
        const rawBooks = res.data?.books || [];
        const names = rawBooks.map(b => b.realName || b.title).filter(Boolean);
        setExistingFlipbooks(names);
      } catch (err) {
        console.error('Failed to load existing flipbooks:', err);
      }
    };
    fetchExistingFlipbooks();
  }, [backendUrl, emailId]);

  // Toggle favorite heart
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = TEMPLATE_LIST.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      
      const matchesCategory = 
        selectedCategory === 'All' || 
        selectedCategory === 'More' ||
        t.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesFormat = selectedFormat === 'all' || t.formatId === selectedFormat;

      return matchesSearch && matchesCategory && matchesFormat;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'newest') return new Date(b.date || 0) - new Date(a.date || 0);
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      if (sortBy === 'pages_desc') return (b.pages || 0) - (a.pages || 0);
      if (sortBy === 'pages_asc') return (a.pages || 0) - (b.pages || 0);
      return 0;
    });

    return result;
  }, [searchQuery, selectedCategory, selectedFormat, sortBy]);

  // Open "Built From Scratch" creation modal with selected template
  const handleOpenCreateModal = (tpl) => {
    setSelectedCardId(tpl?.id);
    setSelectedTemplateItem(tpl);
    setSelectedTemplateIdForModal(tpl?.templateId || tpl?.formatId || 'corporate');
    setIsCreateModalOpen(true);
  };

  // Submit template creation and navigate to Editor
  const handleUseTemplate = async (templateData) => {
    setIsCreateModalOpen(false);
    if (!templateData) return;
    setIsCreating(true);

    const chosenTpl = selectedTemplateItem;
    const targetW = templateData.width || chosenTpl?.width || 210;
    const targetH = templateData.height || chosenTpl?.height || 297;

    let initialTemplateSvg = '';
    if (chosenTpl?.preview) {
      try {
        const svgRes = await fetch(chosenTpl.preview);
        if (svgRes.ok) {
          const rawSvgText = await svgRes.text();
          initialTemplateSvg = formatTemplateSvgToPageSvg(
            rawSvgText,
            targetW,
            targetH,
            'Page 1'
          );
        }
      } catch (err) {
        console.error('Failed to fetch/format template SVG:', err);
      }
    }

    const pageCount = templateData.pageCount || chosenTpl?.pages || 12;
    const pages = Array.from({ length: pageCount }, (_, i) => ({
      pageName: `Page ${i + 1}`,
      content: i === 0 && initialTemplateSvg ? initialTemplateSvg : ''
    }));

    const finalFlipbookName = templateData.flipbookName || `Flipbook_${Date.now()}`;
    const targetFolder = 'My_Flipbooks';

    const payload = {
      emailId,
      flipbookName: finalFlipbookName,
      pages,
      overwrite: true,
      folderName: targetFolder,
      meta: {
        width: targetW,
        height: targetH,
        templateId: templateData.templateId || chosenTpl?.templateId || 'corporate',
        orientation: templateData.orientation || 'portrait',
        templateName: chosenTpl?.title || ''
      }
    };

    const navState = {
      ...templateData,
      initialTemplateSvg,
      folderName: targetFolder,
      flipbookName: finalFlipbookName,
      templateName: chosenTpl?.title || '',
      width: targetW,
      height: targetH
    };

    try {
      const res = await axios.post(`${backendUrl}/api/flipbook/save`, payload);
      setIsCreating(false);
      if (res.data && res.data.v_id) {
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`, {
          state: navState
        });
      } else {
        navigate('/editor', {
          state: navState
        });
      }
    } catch (err) {
      console.error('Failed to create flipbook from template:', err);
      setIsCreating(false);
      navigate('/editor', {
        state: navState
      });
    }
  };

  return (
    <div className="min-h-[92vh] bg-[#fafafa] text-gray-800 flex flex-col select-none relative overflow-x-hidden">
      {/* Soft warm background aura matching screenshot */}
      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-red-100/30 via-orange-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-[96vw] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Templates
            </h1>
            <p className="text-xs text-gray-400 font-normal mt-1">
              Choose a template and create stunning flipbooks in seconds.
            </p>
          </div>

          {/* Right Controls: Search, Filter, Sort by */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#EF4444] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Flipbook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 sm:w-64 pl-9 pr-7 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#EF4444] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Button & Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSortOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-medium hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer transition-colors"
              >
                <Filter className="w-4 h-4 text-[#EF4444]" />
                <span>Filter</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-3 min-w-[200px]">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Page Formats
                    </span>
                    <div className="flex flex-col gap-1">
                      {FORMAT_OPTIONS.map(fmt => (
                        <button
                          key={fmt.id}
                          onClick={() => {
                            setSelectedFormat(fmt.id);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            selectedFormat === fmt.id
                              ? 'bg-red-50 text-[#EF4444] font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{fmt.label}</span>
                          {selectedFormat === fmt.id && <Check className="w-3.5 h-3.5 text-[#EF4444]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sort by Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 text-[#EF4444]" />
                <span className="font-semibold text-gray-800">Sort by :</span>
                <span className="text-gray-600 font-normal">
                  {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Most Popular'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-40 py-1.5 min-w-[200px]">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          sortBy === opt.id
                            ? 'bg-red-50 text-[#EF4444] font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#EF4444]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar mt-5 pb-1">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EF4444] text-white shadow-sm'
                    : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Templates Grid (7 Columns on large screens matching screenshot) */}
        {filteredTemplates.length === 0 ? (
          <div className="w-full bg-white rounded-2xl border border-gray-200 p-12 mt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Templates Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
              No templates matched your search for "{searchQuery}" in category "{selectedCategory}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedFormat('all');
              }}
              className="px-4 py-2 bg-[#EF4444] text-white rounded-lg text-xs font-semibold hover:bg-[#DC2626] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5 sm:gap-4 mt-6">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedCardId === tpl.id;
              const isLiked = favorites.has(tpl.id);

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedCardId(tpl.id)}
                  className={`bg-white rounded-2xl border p-2.5 flex flex-col transition-all duration-200 hover:shadow-lg relative group cursor-pointer ${
                    isSelected
                      ? 'border-[#EF4444] ring-1 ring-[#EF4444]/30 shadow-md'
                      : 'border-gray-200/90 hover:border-gray-300 shadow-sm'
                  }`}
                >
                  {/* Card Visual / Thumbnail Cover */}
                  <div className="relative w-full aspect-[4/3.8] rounded-xl overflow-hidden bg-gray-950 flex items-center justify-center">
                    <img
                      src={tpl.preview}
                      alt={tpl.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Favorite Heart Icon Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(tpl.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm z-10 transition-colors cursor-pointer"
                      title={isLiked ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLiked
                            ? 'fill-[#EF4444] text-[#EF4444]'
                            : 'text-gray-700 hover:text-[#EF4444]'
                        }`}
                      />
                    </button>

                    {/* Hover Overlay Buttons */}
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreateModal(tpl);
                        }}
                        className="w-full max-w-[120px] py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        Use Template <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl);
                        }}
                        className="w-full max-w-[120px] py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  </div>

                  {/* Card Details: Title, Page Count, Badge */}
                  <div className="pt-2 px-1 flex flex-col flex-1 justify-between">
                    <h3 
                      className="text-[13px] font-semibold text-gray-900 truncate leading-snug"
                      title={tpl.title}
                    >
                      {tpl.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                      <span className="text-gray-400 font-normal">
                        {tpl.pages} Pages
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="bg-[#FEF2F2] text-[#EF4444] px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                        {tpl.badge || tpl.category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{previewTemplate.title}</h3>
                  <span className="text-xs font-medium text-gray-400">
                    {previewTemplate.category} • {previewTemplate.dim}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Preview */}
              <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-[#f8fafc]">
                <img
                  src={previewTemplate.preview}
                  alt={previewTemplate.title}
                  className="max-h-[50vh] object-contain rounded-xl shadow-lg border border-gray-200"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div><strong>Format:</strong> {previewTemplate.formatLabel}</div>
                  <div><strong>Pages:</strong> {previewTemplate.pages} Pages</div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const tpl = previewTemplate;
                      setPreviewTemplate(null);
                      handleOpenCreateModal(tpl);
                    }}
                    className="px-5 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Use This Template <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Built From Scratch Creation Modal */}
      <CreateFlipbookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialView="template"
        initialTemplateId={selectedTemplateIdForModal}
        onTemplate={handleUseTemplate}
        existingFlipbooks={existingFlipbooks}
      />

      {/* Loading Overlay when generating template */}
      {isCreating && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white select-none">
          <Loader2 className="animate-spin mb-3 text-[#EF4444]" size={36} />
          <p className="text-base font-bold">Creating Flipbook from Template...</p>
          <p className="text-xs text-gray-300 mt-1">Preparing canvas pages and vector artwork</p>
        </div>
      )}
    </div>
  );
}
