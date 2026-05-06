// TemplateModal.jsx - HTML Template Selection
import React, { useState, useMemo } from 'react';
import { Search, X, Upload } from 'lucide-react';

// Import SVG templates as URLs
import TemplateSVG1 from "../../assets/Templates/Template_1.svg?url";
import TemplateSVG2 from "../../assets/Templates/Template_2.svg?url"; 
import TemplateSVG3 from "../../assets/Templates/Template_3.svg?url"; 
import TemplateSVG4 from "../../assets/Templates/Template_4.svg?url"; 
import TemplateSVG5 from "../../assets/Templates/Template_5.svg?url"; 
import TemplateSVG6 from "../../assets/Templates/Template_6.svg?url";

const TemplateModal = ({ showTemplateModal, setShowTemplateModal, clearCanvas, loadTemplate }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTemplates, setCustomTemplates] = useState([]);
  const fileInputRef = React.useRef(null);

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
    }
  ];

  const categories = [
    'All', 'Business', 'Report', 'Presentation', 'Marketing', 'Portfolio', 'Custom'
  ];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const allTemplates = [...templates, ...customTemplates];
    return allTemplates.filter(t => 
      (activeTab === 'All' || t.category === activeTab) &&
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, customTemplates]);

  // Load HTML template
  const handleLoadTemplate = async (template) => {
    if (template.type === 'svg') {
      // Clear existing page content before applying a full-page template to prevent bloat
      if (typeof clearCanvas === 'function') {
        clearCanvas();
      }
      await loadTemplate(template.src);
    }
    setShowTemplateModal(false);
  };

  // Handle Custom SVG Upload (Instant use, not stored)
  const handleCustomUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg'))) {
      // Warn user about very large SVGs that might cause save issues
      if (file.size > 30 * 1024 * 1024) {
        alert("This SVG is exceptionally large (over 30MB). It may cause performance issues or fail to save due to network limits. Please optimize it if possible.");
      }
      
      const url = URL.createObjectURL(file);
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: 'Custom',
        src: url,
        type: 'svg',
        description: 'User uploaded custom template'
      };
      
      setCustomTemplates(prev => [newTemplate, ...prev]);
      setActiveTab('Custom');
      
      // Reset input
      e.target.value = '';
    } else if (file) {
      alert("Please upload a valid SVG file.");
    }
  };

  // Helper Component for Template Card
  const TemplateCard = ({ template, onClick }) => {
    const [htmlContent, setHtmlContent] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const iframeRef = React.useRef(null);

    React.useEffect(() => {
      fetch(template.src)
        .then(res => res.text())
        .then(text => {
          setHtmlContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load template preview:', err);
          setLoading(false);
        });
    }, [template.src]);

    return (
      <div
        onClick={onClick}
        className="group bg-white rounded-[0.8vw] overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-[0_1.5vw_3vw_-1.2vw_rgba(0,0,0,0.1)] hover:-translate-y-[0.3vw] hover:border-black/50 relative"
      >
        {/* Aspect Ratio Container (A4) */}
        <div className="relative w-full pt-[141.4%] bg-gray-50 overflow-hidden">
          
          {/* SVG Preview Image */}
          {!loading ? (
            <div className="absolute inset-0 flex items-center justify-center p-[1vw] bg-gray-100">
               <img 
                 src={template.src} 
                 alt={template.name}
                 className="w-full h-full object-contain shadow-sm bg-white"
                 onLoad={() => setLoading(false)}
               />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-[0.15vw] border-black"></div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-[1vw]">
            <button className="w-full py-[0.5vw] bg-black text-white rounded-[0.4vw] font-medium text-[0.75vw] shadow-lg transform translate-y-[1vw] group-hover:translate-y-0 transition-transform duration-300">
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

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-[1.5vw] backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={() => setShowTemplateModal(false)}
    >
      <div
        className="bg-white rounded-[1.2vw] shadow-2xl w-full max-w-[80vw] h-[85vh] flex flex-col overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
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

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-[0.5vw] px-[1.2vw] py-[0.6vw] bg-black text-white rounded-[0.8vw] text-[0.8vw] font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-gray-200"
              >
                <Upload size="1.1vw" />
                <span>Upload SVG</span>
              </button>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleCustomUpload}
                accept=".svg"
                className="hidden"
              />
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

            {/* Upload Custom Template Card (Always visible in Custom tab or when searching in All) */}
            {(activeTab === 'Custom' || (activeTab === 'All' && !searchQuery)) && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group bg-white/50 rounded-[0.8vw] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-black/30 hover:bg-white hover:shadow-lg aspect-[1/1.414]"
              >
                <div className="flex flex-col items-center gap-[1.2vw] p-[2vw]">
                  <div className="w-[3.5vw] h-[3.5vw] bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:scale-110 transition-all duration-300">
                    <Upload size="1.5vw" className="text-gray-400 group-hover:text-white" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-gray-900 text-[0.85vw]">Upload Custom</h4>
                    <p className="text-[0.7vw] text-gray-500 mt-[0.4vw] leading-relaxed">Import your own SVG<br/>as a template</p>
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
