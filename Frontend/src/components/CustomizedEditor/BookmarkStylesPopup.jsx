import React from 'react';
import { Icon } from '@iconify/react';

/**
 * Utility to get the clip-path for bookmark shapes.
 */
export const getBookmarkClipPath = (s) => {
    switch (s) {
        case 3: // V-cutout / Swallowtail
            return 'polygon(0% 0%, 100% 0%, 75% 50%, 100% 100%, 0% 100%)';
        case 5: // Pointed / Chevron
            return 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)';
        case 6: // Serrated / Jagged
            return 'polygon(0% 0%, 100% 0%, 96% 5%, 100% 10%, 96% 15%, 100% 20%, 96% 25%, 100% 30%, 96% 35%, 100% 40%, 96% 45%, 100% 50%, 96% 55%, 100% 60%, 96% 65%, 100% 70%, 96% 75%, 100% 80%, 96% 85%, 100% 90%, 96% 95%, 100% 100%, 0% 100%)';
        default:
            return 'none';
    }
};

/**
 * Utility to get the border-radius for bookmark shapes.
 */
export const getBookmarkBorderRadius = (s) => {
    switch (s) {
        case 2: // Rounded Right 
            return '0 1vw 1vw 0';
        case 4: // Rounded Right Rounded
            return '0 2vw 2vw 0';
        default:
            return '0';
    }
};

const BookmarkStyleOption = ({ style, selected, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`cursor-pointer transition-all duration-300 p-[0.4vw] rounded-[0.5vw] flex items-center justify-center ${
                selected 
                ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-[0.5px] border-[#D1E0FF] ' 
                : 'hover:bg-gray-50 border-[1.5px] border-transparent'
            }`}
        >
            <div 
                className="w-full h-[2.5vw] flex items-center justify-center relative shadow-sm transition-transform duration-300 transform active:scale-95"
                style={{
                    backgroundColor: '#C45A5A',
                    clipPath: getBookmarkClipPath(style),
                    borderRadius: getBookmarkBorderRadius(style)
                }}
            >
                <span className="text-white text-[0.6vw] font-semibold">Bookmark</span>
            </div>
        </div>
    );
};

const BookmarkStylesPopup = ({ onClose, onSelect, currentStyle }) => {
    const [selectedStyle, setSelectedStyle] = React.useState(currentStyle || 1);
    const styles = [1, 2, 3, 4, 5, 6];

    // Track original style for canceling
    const originalStyle = React.useRef(currentStyle || 1);

    const handleSelect = (s) => {
        setSelectedStyle(s);
        onSelect(s, true); // Pass 'true' to indicate temporary/preview update
    };

    const handleCancel = () => {
        onSelect(originalStyle.current);
        onClose();
    };

    const handleReplace = () => {
        onSelect(selectedStyle);
        onClose();
    };

    return (
        <div 
            className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
            style={{ width: '250px', top: '60%', left: '23vw', transform: 'translate(-50%, -50%)' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-[1.2vw] w-full p-6">
                {/* Header */}
                <div className="flex items-center gap-[0.1vw] mb-4">
                    <h3 className="text-[0.85vw] font-semibold text-gray-800">Bookmark Styles</h3>
                    <div className="flex-1 h-[0.1px] bg-[#E2E8F0]"></div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-[1vw] mb-5">
                    {styles.map((s) => (
                        <BookmarkStyleOption 
                            key={s} 
                            style={s} 
                            selected={selectedStyle === s} 
                            onClick={() => handleSelect(s)} 
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-[0.5vw] pt-[0.8vw] border-t border-[#F1F5F9]">
                    <button 
                        onClick={handleCancel}
                        className="flex-1 flex items-center justify-center gap-[0.3vw] px-[0.5vw] py-[0.4vw] rounded-sm border-[0.1vw] border-gray-500 text-gray-900 font-semibold text-[0.8vw] hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                        Cancel
                    </button>
                    <button 
                        onClick={handleReplace}
                        className="flex-1 flex items-center justify-center gap-[0.3vw] px-[0.5vw] py-[0.4vw] rounded-sm border-[0.1vw] border-gray-500 bg-black text-white font-semibold text-[0.8vw] hover:bg-gray-900 transition-all active:scale-95"
                    >
                        <Icon icon="qlementine-icons:replace-16" className="w-[0.9vw] h-[0.9vw]" />
                        Replace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookmarkStylesPopup;
