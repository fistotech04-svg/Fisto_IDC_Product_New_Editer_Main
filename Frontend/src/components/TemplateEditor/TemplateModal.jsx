// TemplateModal.jsx - HTML Template Selection
import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

// Import SVG templates as URLs
import TemplateSVG1 from "../../assets/Templates/Template_1.svg?url";
import TemplateSVG2 from "../../assets/Templates/Template_2.svg?url"; 
import TemplateSVG3 from "../../assets/Templates/Template_3.svg?url"; 
import TemplateSVG4 from "../../assets/Templates/Template_4.svg?url"; 
import TemplateSVG5 from "../../assets/Templates/Template_5.svg?url"; 
import TemplateSVG6 from "../../assets/Templates/Template_6.svg?url";
import TemplateSVG7 from "../../assets/Templates/Template_7.svg?url";
import TemplateSVG8 from "../../assets/Templates/Template_8.svg?url";
import TemplateSVG9 from "../../assets/Templates/Template_9.svg?url";

// Global cache to store fetched template SVG strings so they load instantly on subsequent opens
const templateCache = {};

// Helper Component for Template Card
const TemplateCard = ({ template, onClick }) => {
  const [htmlContent, setHtmlContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    if (templateCache[template.id]) {
      setHtmlContent(templateCache[template.id]);
      setLoading(false);
      return;
    }
    fetch(template.src)
      .then(res => res.text())
      .then(text => {
        templateCache[template.id] = text;
        setHtmlContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load template preview:', err);
        setLoading(false);
      });
  }, [template.src, template.id]);

  const detectedFonts = React.useMemo(() => {
    if (!htmlContent) return [];
    const fonts = new Set();
    const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
    let match;
    while ((match = cssRegex.exec(htmlContent)) !== null) {
      let f = match[1] || match[2];
      f = f.split(',')[0].replace(/['"]/g, '').trim();
      if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fonts.add(f);
    }
    const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
    while ((match = attrRegex.exec(htmlContent)) !== null) {
      let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
      if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fonts.add(f);
    }
    return Array.from(fonts);
  }, [htmlContent]);

  const dynamicFontLinks = detectedFonts.map(f => 
    `<link href="https://fonts.googleapis.com/css?family=${f.replace(/\s+/g, '+')}:300,400,500,600,700,800,900&display=swap" rel="stylesheet">`
  ).join('\n          ');

  const iframeHtml = htmlContent ? `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;900&family=Roboto:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;900&family=Montserrat:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Nunito+Sans:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
        ${dynamicFontLinks}
        <style>
          body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: white; overflow: hidden; }
          svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  ` : '';

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[0.8vw] overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-[0_1.5vw_3vw_-1.2vw_rgba(0,0,0,0.1)] hover:-translate-y-[0.3vw] hover:border-black/50 relative"
    >
      {/* Aspect Ratio Container (A4) */}
      <div className="relative w-full pt-[141.4%] bg-gray-50 overflow-hidden">
        
        {/* SVG Preview Iframe */}
        {!loading && htmlContent ? (
          <div className="absolute inset-0 flex items-center justify-center p-[1vw] bg-gray-100">
             <iframe 
               srcDoc={iframeHtml}
               title={template.name}
               className="w-full h-full border-0 pointer-events-none shadow-sm bg-white"
               scrolling="no"
             />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-[0.15vw] border-black"></div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-[1vw]">
          <button className="w-full py-[0.5vw] cursor-pointer bg-black text-white rounded-[0.4vw] font-medium text-[0.75vw] shadow-lg transform translate-y-[1vw] group-hover:translate-y-0 transition-transform duration-300">
            Use Template
          </button>
        </div>


      </div>

      {/* Card Details */}
      <div className="p-[1vw] border-t border-gray-50 bg-white relative z-20">
        <h4 className="font-semibold text-gray-800 text-[0.75vw] truncate group-hover:text-black transition-colors">{template.name}</h4>
      </div>
    </div>
  );
};

const TemplateModal = ({ showTemplateModal, setShowTemplateModal, clearCanvas, loadTemplate }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplying, setIsApplying] = useState(false);


  // SVG Template data
  const templates = [
    { 
      id: 1, 
      name: 'Template 1', 
      category: 'Business', 
      src: TemplateSVG1, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 2, 
      name: 'Template 2', 
      category: 'Business', 
      src: TemplateSVG2, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 3, 
      name: 'Template 3', 
      category: 'Business', 
      src: TemplateSVG3, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 4, 
      name: 'Template 4', 
      category: 'Presentation', 
      src: TemplateSVG4, 
      type: 'svg',
      description: 'Professional A4 presentation template'
    },
    { 
      id: 5, 
      name: 'Template 5', 
      category: 'Business', 
      src: TemplateSVG5, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 6, 
      name: 'Template 6', 
      category: 'Marketing', 
      src: TemplateSVG6, 
      type: 'svg',
      description: 'Professional A4 marketing template'
    },
    { 
      id: 7, 
      name: 'Template 7', 
      category: 'Business', 
      src: TemplateSVG7, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    {
      id: 8,
      name: 'Template 8',
      category: 'Business',
      src: TemplateSVG8,
      type: 'svg',
      description: 'Professional A4 business template'
    },
    {
      id: 9,
      name: 'Template 9',
      category: 'Business',
      src: TemplateSVG9,
      type: 'svg',
      description: 'Professional A4 business template'
    }
  ];

  const categories = [
    'All', 'Business', 'Report', 'Presentation', 'Marketing', 'Portfolio'
  ];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const allTemplates = [...templates];
    return allTemplates.filter(t => 
      (activeTab === 'All' || t.category === activeTab) &&
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery]);

  // Load HTML template
  const handleLoadTemplate = async (template) => {
    setIsApplying(true);
    // Yield to browser paint thread so the loading overlay actually renders before heavy parsing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (template.type === 'svg') {
      // Clear existing page content before applying a full-page template to prevent bloat
      if (typeof clearCanvas === 'function') {
        clearCanvas();
      }
      // Pass cached content to avoid re-fetching
      await loadTemplate(template.src, templateCache[template.id]);
    }
    setIsApplying(false);
    setShowTemplateModal(false);
  };





  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-[1.5vw] backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={() => setShowTemplateModal(false)}
    >
      <div
        className="bg-white rounded-[1.2vw] shadow-2xl w-full max-w-[80vw] h-[85vh] flex flex-col overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay */}
        {isApplying && (
          <div className="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-[3vw] w-[3vw] border-b-[0.2vw] border-black mb-[1vw]"></div>
            <p className="text-black font-semibold text-[1.2vw]">Applying Template, please wait...</p>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-[2vw] py-[1.5vw] border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div>
            <h2 className="text-[1.5vw] font-bold text-gray-900 tracking-tight">Template Gallery</h2>
            <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">Select a professionally designed template to get started</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="flex items-center gap-[0.8vw]">
              <div className="relative group">
                <Search size="1.1vw" className="absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-[2.5vw] pr-[1vw] py-[0.6vw] bg-gray-50 border-gray-200 rounded-[0.8vw] text-[0.8vw] w-[15vw] focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 focus:border-black transition-all"
                />
              </div>


            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="p-[0.5vw] hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X size="1.5vw" className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-[2vw] py-[1vw] flex gap-[0.8vw] overflow-x-auto border-b border-gray-100 flex-shrink-0 bg-white/50 backdrop-blur-sm">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-[1.2vw] py-[0.5vw] rounded-[0.5vw] text-[0.75vw] font-medium whitespace-nowrap transition-all duration-200
                ${activeTab === cat
                  ? 'bg-black text-white shadow-md shadow-gray-400'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-[2vw] bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[2vw] pb-[2.5vw]">



            {/* Dynamic Template Cards */}
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onClick={() => handleLoadTemplate(template)} 
              />
            ))}

            {/* No Results */}
            {filteredTemplates.length === 0 && searchQuery && (
              <div className="col-span-full py-[5vw] text-center text-gray-400">
                <div className="w-[5vw] h-[5vw] bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-[1vw]">
                  <Search size="2vw" className="opacity-40" />
                </div>
                <p className="text-[1.2vw] font-semibold text-gray-600">No templates found</p>
                <p className="text-[0.8vw] mt-[0.5vw]">We couldn't find any templates matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
