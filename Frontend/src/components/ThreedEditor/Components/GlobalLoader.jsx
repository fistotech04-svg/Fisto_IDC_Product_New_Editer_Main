import React from "react";
import { useProgress } from "@react-three/drei";

// Reusable Loading Spinner
export const LoadingSpinner = ({ text = "Loading...", dark = false }) => (
    <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 ${dark ? 'bg-gray-900/40' : 'bg-gray-50/70'}`}>
            <div className={`w-[2.1vw] h-[2.1vw] border-[0.3vw] rounded-full animate-spin ${dark ? 'border-white/20 border-t-white' : 'border-indigo-600/30 border-t-indigo-600'}`}></div>
            <span className={`mt-4 text-[0.85vw] font-medium tracking-wide ${dark ? 'text-white/90' : 'text-gray-500'}`}>{text}</span>
    </div>
);

// Global Loader Component
export const GlobalLoader = ({ manualLoading, text }) => {
  const { active, progress } = useProgress();
  const show = active || manualLoading;
  
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-auto">
        <LoadingSpinner 
            text={text || `Loading Model... ${Math.round(progress)}%`} 
            dark={false} 
        />
    </div>
  );
};
