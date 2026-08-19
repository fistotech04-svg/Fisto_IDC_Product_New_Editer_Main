import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ARView = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialUrl = searchParams.get('url');
  const modelId = searchParams.get('id');
  const [modelUrl, setModelUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(!initialUrl && !!modelId);

  useEffect(() => {
    // Dynamically inject the model-viewer script if it doesn't exist
    if (!document.querySelector('script[src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (modelId && !modelUrl) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      axios.get(`${backendUrl}/api/3d-models/get-model/${modelId}`)
        .then(res => {
          if (res.data && (res.data.fileUrl || res.data.url)) {
            setModelUrl(res.data.fileUrl || res.data.url);
          }
        })
        .catch(err => console.error("Failed to load model for AR:", err))
        .finally(() => setLoading(false));
    }
  }, [modelId, modelUrl]);

  if (loading) return <div className="flex items-center justify-center h-[100dvh] w-[100dvw] text-gray-500 font-medium bg-[#f0f0f0]">Loading AR View...</div>;
  if (!modelUrl) return <div className="flex items-center justify-center h-[100dvh] w-[100dvw] text-gray-500 font-medium bg-[#f0f0f0]">No Model Provided</div>;

  return (
    <div style={{ width: '100dvw', height: '100dvh', margin: 0, padding: 0, backgroundColor: '#f0f0f0' }} className="relative overflow-hidden w-[100dvw] h-[100dvh]">
      <model-viewer
        src={modelUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        camera-orbit="0deg 75deg 180%"
        field-of-view="35deg"
        min-camera-orbit="auto auto 30%"
        max-camera-orbit="auto auto 500%"
        shadow-intensity="1"
        shadow-softness="0.8"
        style={{ width: '100dvw', height: '100dvh' }}
      >
        <button 
          slot="ar-button" 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 border border-gray-200/80 px-5 py-3 rounded-full font-semibold text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 z-50 cursor-pointer whitespace-nowrap pointer-events-auto"
        >
          <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 004 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.27 6.96L12 12.01l8.73-5.05" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22.08V12" />
          </svg>
          <span className="whitespace-nowrap leading-none">View in your space</span>
        </button>
      </model-viewer>
    </div>
  );
};

export default ARView;
