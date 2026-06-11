import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ARView = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const modelUrl = searchParams.get('url');

  useEffect(() => {
    // Dynamically inject the model-viewer script if it doesn't exist
    if (!document.querySelector('script[src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  if (!modelUrl) return <div className="flex items-center justify-center h-screen w-full text-gray-500">No Model Provided</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, backgroundColor: '#f0f0f0' }}>
      <model-viewer
        src={modelUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        style={{ width: '100%', height: '100%' }}
      >
        <button 
            slot="ar-button" 
            style={{ 
                position: 'absolute', 
                bottom: '30px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                padding: '12px 24px', 
                borderRadius: '24px', 
                border: 'none', 
                background: '#ffffff', 
                boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                cursor: 'pointer'
            }}
        >
          View in your space
        </button>
      </model-viewer>
    </div>
  );
};

export default ARView;
