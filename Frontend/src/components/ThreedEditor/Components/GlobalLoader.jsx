import React from "react";
import { useProgress } from "@react-three/drei";

// Reusable Loading Spinner
export const LoadingSpinner = ({ text = "Loading...", dark = false }) => (
    <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-6 backdrop-blur-sm ${dark ? 'bg-black' : 'bg-white'}`}>
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${dark ? 'border-white border-t-transparent' : 'border-[#5d5efc] border-t-transparent'}`}></div>
            <span className={`text-lg font-medium tracking-wide animate-pulse ${dark ? 'text-white' : 'text-gray-700'}`}>{text}</span>
    </div>
);

// Global Loader Component
export const GlobalLoader = ({ manualLoading }) => {
  const { active, progress } = useProgress();
  const show = active || manualLoading;
  
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black pointer-events-auto">
        <LoadingSpinner text={`Loading Model... ${Math.round(progress)}%`} dark={true} />
    </div>
  );
};
