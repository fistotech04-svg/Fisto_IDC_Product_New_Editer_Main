import React, { useState, useEffect } from 'react';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { getFromDB } from '../utils/dbUtils';

const PreviewPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const saved = await getFromDB('editor_autosave');
      if (saved && saved.pages) {
        // Deep Pre-caching: Wait for all background images to load before hiding the main spinner
        const imageUrls = [];
        const pBaseUrl = saved.projectBaseUrl || '';
        saved.pages.forEach(p => {
          const htmlStr = p.html || p.content || '';
          if (!htmlStr) return;
          const imgRegex = /<(?:image|img)[^>]+(?:href|src)=["']([^"']+)["']/g;
          let match;
          while ((match = imgRegex.exec(htmlStr)) !== null) {
            let url = match[1];
            if (url && !url.startsWith('data:')) {
              if (url.includes('nullassets/') && pBaseUrl) {
                url = url.split('nullassets/').join(`${pBaseUrl}assets/`);
              } else if (url.includes('./assets/') && pBaseUrl) {
                url = url.split('./assets/').join(`${pBaseUrl}assets/`);
              }
              imageUrls.push(url);
            }
          }
        });

        const uniqueUrls = Array.from(new Set(imageUrls));
        if (uniqueUrls.length > 0) {
          console.log(`[Preview] Loading ${uniqueUrls.length} unique assets before initialization...`);
          await Promise.all(uniqueUrls.map(url => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = resolve;
              img.src = url;
            });
          }));
        }

        // Extra 3s loading time as requested
        await new Promise(resolve => setTimeout(resolve, 5000));

        setData(saved);
      } else {
        setData({ error: true });
      }
    };
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (data.error) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <div className="text-xl text-gray-600">No preview data found. Please return to the editor.</div>
      </div>
    );
  }

  const pagesWithContent = data.pages.map(p => ({ ...p, content: p.html || '' }));

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <FlipbookPreview
        pages={pagesWithContent}
        pageName={data.pageName}
        onClose={() => window.close()}
        isMobile={false}
        isDoublePage={data.isDoublePage || false}
        targetPage={0}
        settings={data.settings || {}}
        baseUrl={data.projectBaseUrl || ''}
        v_id={data.v_id}
      />
    </div>
  );
};

export default PreviewPage;
