import React from "react";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";

// Patch Three.js DefaultLoadingManager so that errored items count as
// "done" instead of leaving the manager permanently active.
// This fixes the stuck-at-99% issue when external textures fail to load.
if (typeof THREE !== "undefined" && THREE.DefaultLoadingManager) {
    const mgr = THREE.DefaultLoadingManager;
    if (!mgr._errorPatchApplied) {
        mgr._errorPatchApplied = true;
        const origOnError = mgr.onError;
        mgr.onError = function (url) {
            // Complete the item so the manager's loaded count increments
            try { mgr.itemEnd(url); } catch (_) {}
            if (typeof origOnError === "function") origOnError.call(this, url);
        };
    }
}

// Reusable Loading Spinner
export const LoadingSpinner = ({ text = "Loading...", dark = false }) => (
    <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 z-[9999] ${dark ? 'bg-gray-900/40' : 'bg-gray-50/70'}`}>
        <div className={`w-[2.1vw] h-[2.1vw] border-[0.3vw] rounded-full animate-spin ${dark ? 'border-white/20 border-t-white' : 'border-indigo-600/30 border-t-indigo-600'}`}></div>
        <span className={`mt-4 text-[0.85vw] font-medium tracking-wide ${dark ? 'text-white/90' : 'text-gray-500'}`}>{text}</span>
    </div>
);

// Global Loader Component
export const GlobalLoader = ({ manualLoading, text }) => {
  const { active, progress } = useProgress();
  const [shouldShow, setShouldShow] = React.useState(false);
  const stuckTimerRef = React.useRef(null);
  const lastProgressRef = React.useRef(0);

  const show = Boolean(manualLoading || active);

  // Main show/hide logic
  React.useEffect(() => {
    let timer;
    if (manualLoading) {
        setShouldShow(true);
    } else if (active) {
        timer = setTimeout(() => setShouldShow(true), 150);
    } else {
        setShouldShow(false);
        // Clear stuck timer when loading ends normally
        if (stuckTimerRef.current) {
            clearTimeout(stuckTimerRef.current);
            stuckTimerRef.current = null;
        }
    }
    return () => clearTimeout(timer);
  }, [show, manualLoading, active]);

  // Stuck-at-high-progress guard: if progress ≥ 90% and hasn't changed for
  // 8 seconds, force-dismiss (failed texture loads keep `active` true forever)
  React.useEffect(() => {
    if (!active) return;

    if (progress !== lastProgressRef.current) {
        lastProgressRef.current = progress;
        // Progress moved — reset the stuck timer
        if (stuckTimerRef.current) {
            clearTimeout(stuckTimerRef.current);
            stuckTimerRef.current = null;
        }
    }

    // If we are at or above 90% and haven't moved, start a 8s countdown
    if (progress >= 90 && !stuckTimerRef.current) {
        stuckTimerRef.current = setTimeout(() => {
            console.warn("[GlobalLoader] Loading stuck near 100% (likely failed texture fetches) — forcing dismiss.");
            setShouldShow(false);
            stuckTimerRef.current = null;
        }, 8000);
    }

    return () => {
        if (stuckTimerRef.current) {
            clearTimeout(stuckTimerRef.current);
            stuckTimerRef.current = null;
        }
    };
  }, [active, progress]);

  if (!shouldShow) return null;

  return (
    <div className="absolute inset-0 z-[9999] pointer-events-auto">
        <LoadingSpinner 
            text={text || `Loading Model... ${Math.round(progress)}%`} 
            dark={false} 
        />
    </div>
  );
};

