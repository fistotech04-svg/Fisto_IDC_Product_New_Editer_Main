import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Layer from './Layer';
import MainEditor from './MainEditor';
import RightSidebar from './RightSidebar';
import TemplateModal from './TemplateModal';

/**
 * TemplateEditor Layout Component
 * Integrates the various sub-components into a single editor interface.
 */
const TemplateEditor = () => {
  const { folder, v_id } = useParams();
  const location = useLocation();
  const { setCurrentBook } = useOutletContext();
  
  const [isDoublePage, setIsDoublePage] = useState(true);
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTargetIndex, setTemplateTargetIndex] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());

  const updatePageHtml = (pageIndex, html) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];

      if (!page) return prev;

      updated[pageIndex] = {
        ...page,
        html
      };

      return updated;
    });
  };

  const clearPage = (index) => {
    setPages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], html: '', layers: [] };
      }
      return updated;
    });
    setSelectedLayerId(null);
    setMultiSelectedIds(new Set());
  };

  const insertPageAfter = (index) => {
    setPages(prev => {
      const newPage = {
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: `Page ${prev.length + 1}`,
        html: ''
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
  };

  const duplicatePage = (index) => {
    setPages(prev => {
      const pageToDuplicate = prev[index];
      const newPage = {
        ...pageToDuplicate,
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: `${pageToDuplicate.name} (Copy)`
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
  };

  const renamePage = (id, newName) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const deletePage = (index) => {
    if (pages.length <= 1) return;
    setPages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
    if (activePageIndex >= pages.length - 1) {
      setActivePageIndex(Math.max(0, pages.length - 2));
    }
  };

  const movePageUp = (index) => {
    if (index === 0) return;
    setPages(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
    setActivePageIndex(index - 1);
  };

  const movePageDown = (index) => {
    if (index === pages.length - 1) return;
    setPages(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
    setActivePageIndex(index + 1);
  };

  const movePageToFirst = (index) => {
    if (index === 0) return;
    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(index, 1)[0];
      updated.unshift(page);
      return updated;
    });
    setActivePageIndex(0);
  };

  const movePageToLast = (index) => {
    if (index === pages.length - 1) return;
    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(index, 1)[0];
      updated.push(page);
      return updated;
    });
    setActivePageIndex(pages.length - 1);
  };


  const movePage = (fromIndex, toIndex) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, page);
      return updated;
    });
    setActivePageIndex(toIndex);
  };

  const toggleLayerVisibility = (pageIndex, layerId) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let newVisibility = true;
      const toggleInLayers = (layersList) => {
        return layersList.map(layer => {
          if (layer.id === layerId) {
            newVisibility = !layer.visible;
            return { ...layer, visible: newVisibility };
          }
          if (layer.children) {
            return { ...layer, children: toggleInLayers(layer.children) };
          }
          return layer;
        });
      };

      const newLayers = toggleInLayers(page.layers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        if (!newVisibility) {
          element.setAttribute('data-hidden', 'true');
          element.style.display = 'none';
        } else {
          element.removeAttribute('data-hidden');
          element.style.display = '';
        }
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = {
        ...page,
        layers: newLayers,
        html: newHtml
      };
      return updated;
    });
  };

  const toggleLayerLock = (pageIndex, layerId) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let newLocked = false;
      const toggleInLayers = (layersList) => {
        return layersList.map(layer => {
          if (layer.id === layerId) {
            newLocked = !layer.locked;
            return { ...layer, locked: newLocked };
          }
          if (layer.children) {
            return { ...layer, children: toggleInLayers(layer.children) };
          }
          return layer;
        });
      };

      const newLayers = toggleInLayers(page.layers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        if (newLocked) {
          element.setAttribute('data-locked', 'true');
          element.style.pointerEvents = 'none';
        } else {
          element.removeAttribute('data-locked');
          element.style.pointerEvents = '';
        }
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = {
        ...page,
        layers: newLayers,
        html: newHtml
      };
      return updated;
    });
  };

  const loadTemplate = async (templateUrl) => {
    try {
      const response = await fetch(templateUrl);
      const content = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'image/svg+xml');
      let svgRoot = doc.querySelector('svg');
      
      let layers = [];
      let updatedHtml = content;

      if (svgRoot) {
        const parseLayers = (element) => {
          return Array.from(element.children)
            .filter(child => !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()))
            .map((child, idx) => {
              const id = child.id || `${child.tagName}-${Math.random().toString(36).substr(2, 5)}`;
              if (!child.id) child.setAttribute('id', id);

              const name = child.getAttribute('data-name') || child.id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
              
              const layer = {
                id: id,
                name: name,
                type: child.tagName.toLowerCase(),
                visible: true,
                locked: false
              };

              if (child.tagName.toLowerCase() === 'g' && child.children.length > 0) {
                layer.children = parseLayers(child);
              }

              return layer;
            });
        };

        layers = parseLayers(svgRoot);
        const serializer = new XMLSerializer();
        updatedHtml = serializer.serializeToString(svgRoot);
      }

      const targetIndex = templateTargetIndex !== null ? templateTargetIndex : activePageIndex;

      setPages(prev => {
        const updated = [...prev];
        if (updated[targetIndex]) {
          updated[targetIndex] = { 
            ...updated[targetIndex], 
            html: updatedHtml,
            layers: layers
          };
        }
        return updated;
      });
      
      setTemplateTargetIndex(null);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleOpenTemplateModal = (index) => {
    setTemplateTargetIndex(index !== undefined ? index : activePageIndex);
    setShowTemplateModal(true);
  };

  useEffect(() => {
    const initializeEditor = async () => {
      setIsLoading(true);
      
      if (v_id) {
          try {
              const storedUser = localStorage.getItem('user');
              const user = storedUser ? JSON.parse(storedUser) : null;
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              
              const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
                  params: { emailId: user?.emailId, v_id }
              });
              
              if (res.data && res.data.pages) {
                  setPages(res.data.pages.map((p, i) => ({
                      id: p.v_id || i + 1,
                      name: p.name,
                      html: p.html
                  })));
                  setCurrentBook(res.data.meta);
              }
          } catch (err) {
              console.error("Failed to fetch flipbook:", err);
          }
      } 
      else if (location.state && location.state.pageCount) {
          const count = location.state.pageCount;
          const newPages = Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              name: `Page ${i + 1}`,
              html: '' 
          }));
          setPages(newPages);
      }
      else {
          setPages(Array.from({ length: 12 }, (_, i) => ({
              id: i + 1,
              name: `Page ${i + 1}`,
              html: ''
          })));
      }
      
      setIsLoading(false);
    };

    initializeEditor();
  }, [v_id, location.state]);

  if (isLoading) {
      return (
          <div className="flex-1 flex items-center justify-center bg-white h-[92vh]">
              <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="flex h-[92vh] w-full bg-white overflow-hidden">
      <Layer 
        pages={pages} 
        activePageIndex={activePageIndex} 
        setActivePageIndex={setActivePageIndex} 
        isDoublePage={isDoublePage} 
        insertPageAfter={insertPageAfter}
        duplicatePage={duplicatePage}
        renamePage={renamePage}
        deletePage={deletePage}
        movePageUp={movePageUp}
        movePageDown={movePageDown}
        movePageToFirst={movePageToFirst}
        movePageToLast={movePageToLast}
        movePage={movePage}
        clearPage={clearPage}
        onOpenTemplateModal={handleOpenTemplateModal}
        toggleLayerVisibility={toggleLayerVisibility}
        toggleLayerLock={toggleLayerLock}
        selectedLayerId={selectedLayerId}
        setSelectedLayerId={setSelectedLayerId}
        multiSelectedIds={multiSelectedIds}
        setMultiSelectedIds={setMultiSelectedIds}
      />

      <MainEditor 
        isDoublePage={isDoublePage} 
        pages={pages} 
        activePageIndex={activePageIndex} 
        setActivePageIndex={setActivePageIndex} 
        insertPageAfter={insertPageAfter}
        duplicatePage={duplicatePage}
        clearPage={clearPage}
        deletePage={deletePage}
        onOpenTemplateModal={handleOpenTemplateModal}
        selectedLayerId={selectedLayerId}
        setSelectedLayerId={setSelectedLayerId}
        updatePageHtml={updatePageHtml}
        multiSelectedIds={multiSelectedIds}
        setMultiSelectedIds={setMultiSelectedIds}
      />
      <RightSidebar isDoublePage={isDoublePage} setIsDoublePage={setIsDoublePage} />
      
      {showTemplateModal && (
        <TemplateModal 
          showTemplateModal={showTemplateModal} 
          setShowTemplateModal={setShowTemplateModal} 
          clearCanvas={() => clearPage(templateTargetIndex !== null ? templateTargetIndex : activePageIndex)} 
          loadTemplate={loadTemplate} 
        />
      )}
    </div>
  );
};

export default TemplateEditor;
