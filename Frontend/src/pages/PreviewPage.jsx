import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { getFromDB } from '../utils/dbUtils';
import { rewriteHtmlUploadsToSupabase } from '../utils/supabaseUtils';

const PreviewPage = () => {

  const [data, setData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      const searchParams = new URLSearchParams(location.search);
      const shareId = searchParams.get('shareId');

      if (shareId) {
        try {
          const getBackendUrl = () => {
              if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
              const origin = window.location.origin;
              if (origin.includes('devtunnels.ms')) return origin.replace('-5173', '-5000');
              if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                  const portMatch = origin.match(/:(\d+)/);
                  if (portMatch) return origin.replace(portMatch[0], ':5000');
              }
              return 'http://localhost:5000';
          };
          const backendUrl = getBackendUrl();
          const res = await axios.get(`${backendUrl}/api/flipbook/public/get/${shareId}`);
          
          if (res.data && res.data.pages) {
            let processedData = res.data;
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const currentUserEmail = user?.emailId || user?.email;
            
            if (currentUserEmail) {
                try {
                    const checkRes = await axios.get(`${backendUrl}/api/flipbook/check-owner/${shareId}?emailId=${encodeURIComponent(currentUserEmail)}`);
                    if (!checkRes.data.isOwner) {
                        setData({ error: true, errorMessage: "You do not have permission to preview this book." });
                        return;
                    }
                } catch (err) {
                    setData({ error: true, errorMessage: "You do not have permission to preview this book." });
                    return;
                }
            } else {
                setData({ error: true, errorMessage: "Please login to preview this book." });
                return;
            }

            const bUrl = processedData.meta?.baseUrl ? `${backendUrl}${processedData.meta.baseUrl}` : '';
            
            processedData.pages = processedData.pages.map(p => {
                let html = p.html || p.content || '';
                if (html.includes('nullassets/') && bUrl) html = html.split('nullassets/').join(`${bUrl}assets/`);
                if (html.includes('./assets/') && bUrl) html = html.split('./assets/').join(`${bUrl}assets/`);
                html = rewriteHtmlUploadsToSupabase(html);
                return { ...p, html };
            });


            // Extra 3s loading time to match preview behavior
            await new Promise(resolve => setTimeout(resolve, 3000));

            setData({
                ...processedData,
                projectBaseUrl: bUrl,
                settings: processedData.settings || {},
                pageName: processedData.meta?.flipbookName || 'Preview'
            });
          } else {
            setData({ error: true });
          }
        } catch (err) {
          console.error(err);
          setData({ error: true });
        }
        return;
      }

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
        <div className="text-xl text-gray-600">{data.errorMessage || "No preview data found. Please return to the editor."}</div>
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
