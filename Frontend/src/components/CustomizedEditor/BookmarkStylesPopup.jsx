import React from 'react';
import { Icon } from '@iconify/react';

/**
 * Utility to get the clip-path for bookmark shapes.
 */
export const getBookmarkClipPath = (s) => {
    switch (s) {
        case 3: // V-cutout / Swallowtail
            return 'polygon(0% 0%, 100% 0%, 85% 50%, 100% 100%, 0% 100%)';
        case 5: // Pointed / Chevron
            return 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)';
        case 6: // Serrated / Jagged
            return 'polygon(0% 0% , 100% 0%,95% 5%,100% 10%, 95% 15%, 100% 20%, 95% 25%, 100% 30%, 95% 35%, 100% 40%, 95% 45%, 100% 50%, 95% 55%, 100% 60%, 95% 65%, 100% 70%, 95% 75%, 100% 80%, 95% 85%,100% 90%, 95% 95%,100% 100%,0% 100%)';
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
            return '0 0.7vw 0.7vw 0';
        case 4: // Rounded Right Rounded
            return '0 1.2vw 1.2vw 0';
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
                className="w-[40vw] h-[3vw] flex items-center justify-center relative shadow-sm transition-transform duration-300 transform active:scale-95"
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

    return (
        <>
            <div className="fixed inset-0 z-[999]" onClick={onClose} />
            <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '250px', height: '250', top: '60%', left: '23vw', transform: 'translate(-50%, -50%)' }}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div 
                className="bg-white rounded-[1.2vw] w-full max-w-[60vw] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-[0.1vw]">
                    <h3 className="text-[0.85vw] font-semibold text-gray-800">Bookmark Styles</h3>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-2vw' }}></div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-[0.5vw] pt-[0.5vw] pb-[0.5vw]">
                    {styles.map((s) => (
                        <BookmarkStyleOption 
                            key={s} 
                            style={s} 
                            selected={selectedStyle === s} 
                            onClick={() => setSelectedStyle(s)} 
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-[0.9vw] pt-[0.8vw] pl-[3.5vw] border-t border-[#F1F5F9]">
                    <button 
                        onClick={onClose}
                        className="flex items-center justify-center gap-[0.4vw] px-[0.5vw] py-[0.3vw] rounded-[0.25vw] border-[0.1vw] border-gray-500 text-gray-900 font-semibold text-[0.75vw] hover:bg-gray-50 transition-all active:scale-105"
                    >
                        <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                        <span>Close</span>
                    </button>
                    <button 
                        onClick={() => {
                            onSelect(selectedStyle);
                            onClose();
                        }}
                        className="flex items-center justify-center gap-[0.5vw] px-[0.5vw] py-[0.3vw] rounded-[0.25vw] border-[0.1vw] border-black bg-black text-white font-semibold text-[0.75vw] hover:bg-gray-900 transition-all active:scale-105"
                    >
                        <Icon icon="qlementine-icons:replace-16" className="w-[0.7vw] h-[0.7vw]" />
                        <span>Replace</span>
                    </button>
                </div>
            </div>
        </div>
        </div>
        </>
    );
};

export default BookmarkStylesPopup;
