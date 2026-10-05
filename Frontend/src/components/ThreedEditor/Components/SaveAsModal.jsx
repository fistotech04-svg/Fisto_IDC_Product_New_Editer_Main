import React from "react";
import { Icon } from "@iconify/react";

export default function SaveAsModal({
  isOpen,
  onClose,
  saveAsNameInput,
  setSaveAsNameInput,
  onConfirmSaveAs
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[1vw] shadow-2xl border border-gray-100 w-full max-w-[28vw] min-w-[320px] overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-[1.2vw] py-[1vw] border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-[0.6vw]">
            <div className="w-[2vw] h-[2vw] rounded-[0.5vw] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Icon icon="material-symbols:save-as-outline-rounded" className="w-[1.2vw] h-[1.2vw]" />
            </div>
            <div>
              <h3 className="text-[0.95vw] font-bold text-gray-900 leading-tight">Save As New Model</h3>
              <p className="text-[0.7vw] text-gray-500">Create an independent duplicate with all your edits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-[1.6vw] h-[1.6vw] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onConfirmSaveAs} className="p-[1.2vw] flex flex-col gap-[1vw]">
          <div>
            <label className="block text-[0.78vw] font-semibold text-gray-700 mb-[0.4vw]">
              Model Name
            </label>
            <input
              type="text"
              value={saveAsNameInput}
              onChange={(e) => setSaveAsNameInput(e.target.value)}
              placeholder="Enter model name..."
              autoFocus
              className="w-full px-[0.8vw] py-[0.5vw] text-[0.85vw] text-gray-900 bg-gray-50 border border-gray-200 rounded-[0.5vw] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="p-[0.8vw] rounded-[0.6vw] bg-indigo-50/50 border border-indigo-100/60 flex items-start gap-[0.5vw]">
            <Icon icon="lucide:info" className="w-[0.9vw] h-[0.9vw] text-indigo-500 mt-[0.1vw] flex-shrink-0" />
            <p className="text-[0.7vw] text-indigo-900 leading-relaxed">
              This will generate a brand new copy in your 3D Dashboard with its own unique model ID. All current textures, transforms, and hotspots will be preserved.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-[0.6vw] pt-[0.5vw]">
            <button
              type="button"
              onClick={onClose}
              className="px-[0.9vw] py-[0.45vw] text-[0.78vw] font-medium text-gray-600 hover:bg-gray-100 rounded-[0.5vw] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!saveAsNameInput.trim()}
              className="flex items-center gap-[0.4vw] px-[1.1vw] py-[0.45vw] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[0.78vw] rounded-[0.5vw] shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Icon icon="lucide:copy" className="w-[0.85vw] h-[0.85vw]" />
              <span>Save As Copy</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
