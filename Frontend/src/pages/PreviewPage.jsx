import React, { useState, useEffect } from 'react';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { getFromDB } from '../utils/dbUtils';

const PreviewPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const saved = await getFromDB('editor_autosave');
      if (saved) {
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
        settings={{}}
        baseUrl={data.projectBaseUrl || ''}
      />
    </div>
  );
};

export default PreviewPage;
