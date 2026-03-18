// TemplateModal.jsx - HTML Template Selection
import React, { useState, useMemo } from 'react';
import { Search, X, Plus, FileText } from 'lucide-react';

// Import HTML templates as URLs
import TemplateHTML1 from "../../assets/Templates/template_1.html?url";
import TemplateHTML2 from "../../assets/Templates/template_2.html?url"; 
import TemplateHTML3 from "../../assets/Templates/template_3.html?url"; 
import TemplateHTML4 from "../../assets/Templates/template_4.html?url"; 
import TemplateHTML5 from "../../assets/Templates/template_5.html?url"; 
import TemplateHTML6 from "../../assets/Templates/template_6.html?url";   
import TemplateHTML7 from "../../assets/Templates/template_7.html?url"; 
import TemplateHTML8 from "../../assets/Templates/template_8.html?url"; 
import TemplateHTML9 from "../../assets/Templates/template_9.html?url"; 

const TemplateModal = ({ showTemplateModal, setShowTemplateModal, clearCanvas, loadHTMLTemplate }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // HTML Template data - only HTML templates now
  const templates = [
    { 
      id: 1, 
      name: 'Template 1', 
      category: 'Business', 
      src: TemplateHTML1, 
      type: 'html',
      description: 'Professional A4 business report template'
    },
    { 
      id: 2, 
      name: 'Template 2', 
      category: 'Business', 
      src: TemplateHTML2, 
      type: 'html',
      description: 'Professional A4 business report template'
    },
    { 
      id: 3, 
      name: 'Template 3', 
      category: 'Business', 
      src: TemplateHTML3, 
      type: 'html',
      description: 'Professional A4 business report template'
    },
    { 
      id: 4, 
      name: 'Template 4', 
      category: 'Presentation', 
      src: TemplateHTML4, 
      type: 'html',
      description: 'Professional A4 presentation template'
    },
    { 
      id: 5, 
      name: 'Template 5', 
      category: 'Business', 
      src: TemplateHTML5, 
      type: 'html',
      description: 'Professional A4 business report template'
    },
    { 
      id: 6, 
      name: 'Template 6', 
      category: 'Business', 
      src: TemplateHTML6, 
      type: 'html',
      description: 'Professional A4 business report template'
    },
    {
      id: 7,
      name: 'Template 7',
      category: 'Business',
      src: TemplateHTML7,
      type: 'html',
      description: 'Professional A4 business report template'
    },
    {
      id: 8,
      name: 'Template 8',
      category: 'Business',
      src: TemplateHTML8,
      type: 'html',
      description: 'Professional A4 business report template'
    },
    {
      id: 9,
      name: 'Template 9',
      category: 'Business',
      src: TemplateHTML9,
      type: 'html',
      description: 'Professional A4 business report template'
    }
  ];

  const categories = [
    'All', 'Business', 'Report', 'Presentation', 'Marketing', 'Portfolio',
  ];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      (activeTab === 'All' || t.category === activeTab) &&
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery]);

  // Load HTML template
  const handleLoadTemplate = async (template) => {
    if (template.type === 'html') {
      await loadHTMLTemplate(template.src);
    }
    setShowTemplateModal(false);
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
          
          {/* Iframe Scaled Preview */}
          {!loading && htmlContent ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden bg-gray-100">
              <div className="transform scale-[0.35] origin-center shadow-md">
                <iframe
                  srcDoc={htmlContent}
                  title={template.name}
                  className="w-[595px] h-[842px] border-none bg-white"
                  tabIndex="-1"
                  scrolling="no"
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
               {loading ? (
                 <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-[0.15vw] border-black"></div>
               ) : (
                 <FileText size="3vw" className="opacity-20" />
               )}
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
            {/* Blank Template */}
            <div
              onClick={() => {
                clearCanvas();
                setShowTemplateModal(false);
              }}
              className="group bg-white rounded-[0.8vw] overflow-hidden border-[0.15vw] border-dashed border-gray-300 cursor-pointer hover:border-black hover:bg-gray-50 transition-all duration-300 hover:-translate-y-[0.3vw] flex flex-col"
            >
              <div className="aspect-[1/1.414] flex items-center justify-center bg-gray-50/50 m-[0.5vw] rounded-[0.8vw] group-hover:bg-white transition-colors">
                <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                  <div className="w-[4vw] h-[4vw] rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto shadow-sm group-hover:shadow-md group-hover:border-gray-300 mb-[0.8vw]">
                    <Plus size="2vw" className="text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                  <p className="text-[0.8vw] font-semibold text-gray-500 group-hover:text-black px-[1vw]">Start from Blank</p>
                </div>
              </div>
            </div>

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