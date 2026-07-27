// TemplateModal.jsx - HTML Template Selection
import React, { useState, useMemo, useRef } from 'react';
import { Search, X, Upload, AlertCircle } from 'lucide-react';

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
import TemplateSVG10 from "../../assets/Templates/Template_Car_1.svg?url";
import TemplateSVG11 from "../../assets/Templates/Template_Car_2.svg?url";
import TemplateSVG12 from "../../assets/Templates/Template_Car_3.svg?url";
import TemplateSVG13 from "../../assets/Templates/Template_Car_4.svg?url";

// Global cache to store fetched template SVG strings so they load instantly on subsequent opens
const templateCache = {};

// Helper Component for Template Card
const TemplateCard = ({ template, onClick }) => {
  const [htmlContent, setHtmlContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (template.rawSvg) {
      templateCache[template.id] = template.rawSvg;
      setHtmlContent(template.rawSvg);
      setLoading(false);
      return;
    }
    if (templateCache[template.id]) {
      setHtmlContent(templateCache[template.id]);
      setLoading(false);
      return;
    }
    if (!template.src) {
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
  }, [template.src, template.id, template.rawSvg]);

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
      <div className="p-[1vw] border-t border-gray-50 bg-white relative z-20 flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-[0.75vw] truncate group-hover:text-black transition-colors">{template.name}</h4>
        {template.category === 'Uploaded' && (
          <span className="px-[0.4vw] py-[0.15vw] bg-blue-50 text-blue-600 text-[0.6vw] font-semibold rounded-[0.3vw] uppercase tracking-wider">
            Custom
          </span>
        )}
      </div>
    </div>
  );
};

const TemplateModal = ({ showTemplateModal, setShowTemplateModal, clearCanvas, loadTemplate }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [uploadedTemplates, setUploadedTemplates] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

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
    },
    { 
      id: 10, 
      name: 'Template 10', 
      category: 'Car', 
      src: TemplateSVG10, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 11, 
      name: 'Template 11', 
      category: 'Car', 
      src: TemplateSVG11, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 12, 
      name: 'Template 12', 
      category: 'Car', 
      src: TemplateSVG12, 
      type: 'svg',
      description: 'Professional A4 business template'
    },
    { 
      id: 13, 
      name: 'Template 13', 
      category: 'Car', 
      src: TemplateSVG13, 
      type: 'svg',
      description: 'Professional A4 business template'
    }
  ];

  const categories = useMemo(() => {
    const baseCategories = ['All'];
    if (uploadedTemplates.length > 0) {
      baseCategories.push('Uploaded');
    }
    return [...baseCategories, 'Business', 'Report', 'Presentation', 'Marketing', 'Portfolio', 'Car'];
  }, [uploadedTemplates.length]);

  // Filter templates (including user-uploaded ones)
  const filteredTemplates = useMemo(() => {
    const allTemplates = [...uploadedTemplates, ...templates];
    return allTemplates.filter(t => 
      (activeTab === 'All' || t.category === activeTab) &&
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, uploadedTemplates, templates]);

  // Handle uploading a custom SVG file
  const handleSvgFileUpload = async (file) => {
    if (!file) return;
    setUploadError(null);

    const isSvgExt = file.name.toLowerCase().endsWith('.svg');
    const isSvgMime = file.type === 'image/svg+xml' || file.type.includes('svg');

    if (!isSvgExt && !isSvgMime) {
      setUploadError('Invalid file format. Please select an SVG file (.svg).');
      return;
    }

    try {
      const text = await file.text();
      if (!text || !text.toLowerCase().includes('<svg')) {
        setUploadError('The selected file does not contain valid SVG content.');
        return;
      }

      setIsApplying(true);
      await new Promise(resolve => setTimeout(resolve, 50));

      if (typeof clearCanvas === 'function') {
        clearCanvas();
      }

      const newTemplate = {
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.svg$/i, '') || 'Uploaded SVG',
        category: 'Uploaded',
        src: null,
        rawSvg: text,
        type: 'svg',
        description: 'Uploaded SVG template'
      };

      templateCache[newTemplate.id] = text;
      setUploadedTemplates(prev => [newTemplate, ...prev]);

      await loadTemplate(null, text);

      setIsApplying(false);
      setShowTemplateModal(false);
    } catch (err) {
      console.error('Error uploading SVG template:', err);
      setUploadError('Failed to read or parse the SVG file.');
      setIsApplying(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleSvgFileUpload(file);
    }
    e.target.value = '';
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleSvgFileUpload(file);
    }
  };

  // Load HTML/SVG template
  const handleLoadTemplate = async (template) => {
    setIsApplying(true);
    // Yield to browser paint thread so the loading overlay actually renders before heavy parsing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (template.type === 'svg') {
      // Clear existing page content before applying a full-page template to prevent bloat
      if (typeof clearCanvas === 'function') {
        clearCanvas();
      }
      const prefetched = template.rawSvg || templateCache[template.id];
      await loadTemplate(template.src, prefetched);
    }
    setIsApplying(false);
    setShowTemplateModal(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-[1.5vw] backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={() => setShowTemplateModal(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="bg-white rounded-[1.2vw] shadow-2xl w-full max-w-[80vw] h-[85vh] flex flex-col overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-[350] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-white/80 rounded-[1.2vw] transition-all animate-in fade-in duration-200">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-white/20 flex items-center justify-center mb-[1vw] text-white animate-bounce">
              <Upload size="2.2vw" />
            </div>
            <p className="text-white text-[1.4vw] font-bold">Drop your SVG template here</p>
            <p className="text-white/80 text-[0.85vw] mt-[0.3vw]">It will be automatically parsed and loaded onto the canvas</p>
          </div>
        )}

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
            <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">Select a template or upload your own SVG template</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-[0.5vw] px-[1vw] py-[0.6vw] bg-black text-white hover:bg-gray-800 active:scale-95 rounded-[0.8vw] text-[0.8vw] font-medium transition-all shadow-sm cursor-pointer whitespace-nowrap"
              title="Upload SVG File"
            >
              <Upload size="1.1vw" />
              <span>Upload SVG</span>
            </button>

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

        {/* Error Notification */}
        {uploadError && (
          <div className="mx-[2vw] mt-[1vw] p-[0.8vw] bg-red-50 border border-red-200 text-red-700 rounded-[0.6vw] flex items-center justify-between text-[0.8vw] animate-in fade-in slide-in-from-top-2 flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <AlertCircle size="1.1vw" className="text-red-500 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="p-[0.2vw] hover:bg-red-100 rounded-full transition-colors"
            >
              <X size="1vw" />
            </button>
          </div>
        )}

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
              {cat} {cat === 'Uploaded' && `(${uploadedTemplates.length})`}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-[2vw] bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[2vw] pb-[2.5vw]">
            {/* Upload SVG Card (Shown when search is empty and tab is All or Uploaded) */}
            {(activeTab === 'All' || activeTab === 'Uploaded') && !searchQuery && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group bg-gray-50 border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-100/80 rounded-[0.8vw] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-[0.3vw] relative flex flex-col items-center justify-center"
              >
                <div className="relative w-full pt-[141.4%] flex flex-col items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-[1.5vw] text-center">
                    <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 group-hover:text-black group-hover:scale-110 group-hover:border-black transition-all duration-300 mb-[1vw]">
                      <Upload size="1.6vw" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-[0.85vw] group-hover:text-black transition-colors">
                      Upload Custom SVG
                    </h4>
                    <p className="text-[0.7vw] text-gray-500 mt-[0.3vw] leading-relaxed max-w-[85%]">
                      Click to browse or drop your SVG file here
                    </p>
                    <span className="mt-[1vw] px-[0.8vw] py-[0.3vw] bg-black text-white text-[0.65vw] font-medium rounded-[0.4vw] shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                      Browse Files
                    </span>
                  </div>
                </div>
              </div>
            )}

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

