import React from "react";
import { Icon } from "@iconify/react";

export function AnimationPanel({
  hasAnimations,
  isAnimationPlaying,
  onToggleAnimation
}) {
  return (
    <div className="flex flex-col gap-[1vw]">
      <div className="flex items-center justify-between pb-[0.8vw] border-b border-gray-100">
        <div className="flex flex-col">
          <span className="text-[0.78vw] font-bold text-gray-800">Model Animation</span>
          <span className="text-[0.62vw] text-gray-500">
            {hasAnimations ? "Animation tracks detected" : "No animations in this model"}
          </span>
        </div>
        <button
          disabled={!hasAnimations}
          onClick={() => onToggleAnimation && onToggleAnimation(!isAnimationPlaying)}
          className={`px-[0.8vw] py-[0.4vw] rounded-[0.4vw] text-[0.75vw] font-bold text-white transition-colors flex items-center gap-[0.3vw] ${
            !hasAnimations
              ? "bg-gray-300 cursor-not-allowed"
              : isAnimationPlaying
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-[#ea543a] hover:bg-[#d9442a]"
          }`}
        >
          <Icon icon={isAnimationPlaying ? "solar:pause-bold" : "solar:play-bold"} className="w-[0.9vw] h-[0.9vw]" />
          <span>{isAnimationPlaying ? "Pause" : "Play"}</span>
        </button>
      </div>
    </div>
  );
}

export default AnimationPanel;
