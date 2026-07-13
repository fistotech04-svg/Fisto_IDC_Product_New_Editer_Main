import React from 'react';
import { ChevronUp, RotateCcw } from 'lucide-react';

export const AdjustmentSlider = ({ label, value, onChange, onReset, min = -100, max = 100 }) => {
  const num = parseFloat(value) || 0;
  const percentage = ((num - min) / (max - min)) * 100;

  const isNegative = num < 0;
  const activeLeft = isNegative ? percentage : 50;
  const activeWidth = Math.abs(percentage - 50);

  return (
    <div className="flex flex-col gap-[0.2vw] mb-[0.2vw]">
      <style>{`
        .invisible-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: transparent;
        }
        .invisible-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0;
          height: 0;
        }
      `}</style>
      <div className="flex items-center justify-between gap-[0.1vw]">
        <div className="flex items-center gap-[0.3vw]">
          <span className="text-[0.75vw] text-gray-600 font-medium">{label}</span>
          <button
            onClick={onReset}
            className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
            title="Reset"
          >
            <RotateCcw size="0.65vw" strokeWidth={2.5} />
          </button>
        </div>
        <span className="text-[0.7vw] font-normal text-gray-500">{num}</span>
      </div>

      <div className="relative flex items-center h-[1vw] w-full">
        {/* Inactive thin gray track */}
        <div className="absolute w-full h-[0.2vw] bg-gray-200 rounded-full" />

        {/* Active thick blue track */}
        {num !== 0 && (
          <div
            className="absolute h-[0.25vw] bg-[#6366f1] pointer-events-none"
            style={{
              left: `${activeLeft}%`,
              width: `${activeWidth}%`,
              borderTopLeftRadius: isNegative ? '999px' : '0',
              borderBottomLeftRadius: isNegative ? '999px' : '0',
              borderTopRightRadius: isNegative ? '0' : '999px',
              borderBottomRightRadius: isNegative ? '0' : '999px',
            }}
          />
        )}

        {/* Thumb */}
        <div
          className="absolute w-[0.7vw] h-[0.7vw] bg-[#6366f1] rounded-full pointer-events-none shadow-sm"
          style={{ left: `calc(${percentage}% - 0.35vw)` }}
        />

        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={num}
          onChange={(e) => onChange(e.target.value)}
          className="invisible-range absolute w-full h-full opacity-0 cursor-pointer m-0"
        />
      </div>
    </div>
  );
};

const Adjustment = ({
  openSubSection, setOpenSubSection,
  filters, setFilters,
  tagName = 'rect',
  ...props
}) => {
  const pseudoProps = {
    'data-filter-exposure': filters?.exposure || 0,
    'data-filter-contrast': filters?.contrast || 0,
    'data-filter-saturation': filters?.saturation || 0,
    'data-filter-temperature': filters?.temperature || 0,
    'data-filter-tint': filters?.tint || 0,
    'data-filter-highlights': filters?.highlights || 0,
    'data-filter-shadows': filters?.shadows || 0,
    tagName: tagName
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (attr.startsWith('data-filter-') && setFilters) {
      const filterName = attr.replace('data-filter-', '');
      setFilters(p => ({ ...p, [filterName]: parseFloat(value) }));
    }
  };

  const updateElementAttribute = (page, layer, attr, val) => {
    handleUpdate(page, layer, attr, val);
  };



  return (
    <div className="flex flex-col space-y-[0.60vw] font-sans mt-[0.6vw]">
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <div
          onClick={() => setOpenSubSection(openSubSection === 'adjustment' ? null : 'adjustment')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSubSection === 'adjustment' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-semibold text-gray-900 text-[0.85vw]">Adjustments</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openSubSection === 'adjustment' ? '' : 'rotate-180'}`} />
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${openSubSection === 'adjustment' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1.5vw] space-y-[0.8vw]">
              {['exposure', 'contrast', 'saturation', 'temperature', 'tint', 'highlights', 'shadows'].map((filter) => (
                <AdjustmentSlider
                  key={filter}
                  label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                  value={pseudoProps[`data-filter-${filter}`] || 0}
                  onChange={(val) => updateElementAttribute(undefined, undefined, `data-filter-${filter}`, val)}
                  onReset={() => updateElementAttribute(undefined, undefined, `data-filter-${filter}`, 0)}
                  min={-100}
                  max={100}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Adjustment;
