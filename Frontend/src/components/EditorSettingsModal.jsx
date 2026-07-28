import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function EditorSettingsModal({
  isOpen,
  onClose,
  isAutoSaveEnabled,
  onToggleAutoSave,
  isDoublePage: initialDoublePage = false,
  onToggleDoublePage,
  isTrimView: initialTrimView = false,
  onToggleTrimView,
  isRulerEnabled: initialRuler = true,
  onToggleRuler
}) {
  const [isDoublePage, setIsDoublePage] = useState(initialDoublePage);
  const [isTrimView, setIsTrimView] = useState(initialTrimView);
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('isAutoSaveEnabled');
    return saved !== null ? JSON.parse(saved) : (isAutoSaveEnabled !== undefined ? isAutoSaveEnabled : true);
  });
  const [isRulerEnabled, setIsRulerEnabled] = useState(initialRuler);

  useEffect(() => {
    if (isAutoSaveEnabled !== undefined) {
      setAutoSave(isAutoSaveEnabled);
    }
  }, [isAutoSaveEnabled]);

  useEffect(() => {
    setIsDoublePage(initialDoublePage);
  }, [initialDoublePage]);

  useEffect(() => {
    setIsTrimView(initialTrimView);
  }, [initialTrimView]);

  useEffect(() => {
    setIsRulerEnabled(initialRuler);
  }, [initialRuler]);

  // Listen to global editor settings changes
  useEffect(() => {
    const handleSettingsChanged = (e) => {
      if (e.detail) {
        if (e.detail.isDoublePage !== undefined) setIsDoublePage(e.detail.isDoublePage);
        if (e.detail.isRulerEnabled !== undefined) setIsRulerEnabled(e.detail.isRulerEnabled);
        if (e.detail.isTrimView !== undefined) setIsTrimView(e.detail.isTrimView);
      }
    };
    window.addEventListener('editor_settings_changed', handleSettingsChanged);
    return () => window.removeEventListener('editor_settings_changed', handleSettingsChanged);
  }, []);

  const handleDoublePageToggle = () => {
    const next = !isDoublePage;
    setIsDoublePage(next);
    if (onToggleDoublePage) onToggleDoublePage(next);
    window.dispatchEvent(new CustomEvent('editor_toggleDoublePage', { detail: next }));
  };

  const handleTrimViewToggle = () => {
    const next = !isTrimView;
    setIsTrimView(next);
    if (onToggleTrimView) onToggleTrimView(next);
    window.dispatchEvent(new CustomEvent('editor_toggleTrimView', { detail: next }));
  };

  const handleAutoSaveToggle = () => {
    const next = !autoSave;
    setAutoSave(next);
    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(next));
    if (onToggleAutoSave) onToggleAutoSave(next);
  };

  const handleRulerToggle = () => {
    const next = !isRulerEnabled;
    setIsRulerEnabled(next);
    if (onToggleRuler) onToggleRuler(next);
    window.dispatchEvent(new CustomEvent('editor_toggleRuler', { detail: next }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Light Dark Shade Backdrop without blur */}
      <div className="fixed inset-0 z-[150] cursor-default bg-black/15" onClick={onClose}></div>

      {/* Popup Card */}
      <div className="fixed top-[4.5vw] right-[7.5vw] z-[160] w-[20vw] min-w-[280px] max-w-[340px] bg-white rounded-[1.25vw] shadow-2xl border border-gray-100 p-[1.25vw] animate-in fade-in zoom-in-95 duration-150 select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-[1.25vw]">
          <div className="flex items-center flex-1 mr-[0.75vw]">
            <h2 className="text-[1.1vw] font-bold text-gray-900 tracking-tight pr-[0.5vw] whitespace-nowrap">Editor Settings</h2>
            <div className="flex-1 h-[1px] bg-gray-200 mt-[0.1vw]"></div>
          </div>
          {/* Red Close Button */}
          <button
            onClick={onClose}
            className="text-red-500 border border-red-200 hover:bg-red-50 transition-colors p-[0.2vw] rounded-[0.4vw] cursor-pointer flex items-center justify-center"
          >
            <X size="1.0vw" strokeWidth={2} />
          </button>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-[1vw]">
          {/* Double page mode */}
          <div className="flex items-center justify-between">
            <span className="text-[0.82vw] font-normal text-gray-600">Double page mode</span>
            <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.6vw]"></div>
            <button
              type="button"
              onClick={handleDoublePageToggle}
              className={`w-[2.5vw] h-[1.3vw] flex items-center rounded-full p-[0.15vw] cursor-pointer transition-colors duration-200 ease-in-out border shadow-sm ${
                isDoublePage ? 'bg-[#4A3AFF] border-indigo-300' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <div
                className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isDoublePage ? 'translate-x-[1.2vw]' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Trim View */}
          <div className="flex items-center justify-between">
            <span className="text-[0.82vw] font-normal text-gray-600">Trim View</span>
            <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.6vw]"></div>
            <button
              type="button"
              onClick={handleTrimViewToggle}
              className={`w-[2.5vw] h-[1.3vw] flex items-center rounded-full p-[0.15vw] cursor-pointer transition-colors duration-200 ease-in-out border shadow-sm ${
                isTrimView ? 'bg-[#4A3AFF] border-indigo-300' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <div
                className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isTrimView ? 'translate-x-[1.2vw]' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <span className="text-[0.82vw] font-normal text-gray-600">Auto Save</span>
            <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.6vw]"></div>
            <button
              type="button"
              onClick={handleAutoSaveToggle}
              className={`w-[2.5vw] h-[1.3vw] flex items-center rounded-full p-[0.15vw] cursor-pointer transition-colors duration-200 ease-in-out border shadow-sm ${
                autoSave ? 'bg-[#4A3AFF] border-indigo-300' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <div
                className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  autoSave ? 'translate-x-[1.2vw]' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Rules (Ruler) */}
          <div className="flex items-center justify-between">
            <span className="text-[0.82vw] font-normal text-gray-600">Rules</span>
            <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.6vw]"></div>
            <button
              type="button"
              onClick={handleRulerToggle}
              className={`w-[2.5vw] h-[1.3vw] flex items-center rounded-full p-[0.15vw] cursor-pointer transition-colors duration-200 ease-in-out border shadow-sm ${
                isRulerEnabled ? 'bg-[#4A3AFF] border-indigo-300' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <div
                className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isRulerEnabled ? 'translate-x-[1.2vw]' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
