import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import ColorPallet from '../ColorPallet';

const AddNotesPopupLandscape = ({
    onClose, noteContent = '', setNoteContent, noteAlignment = 'left', setNoteAlignment,
    noteStyles = [], toggleNoteStyle, noteCase = 'none', setNoteCase, noteList = 'none', handleListClick,
    noteBackground = '#D9DC54', setNoteBackground, noteTextColor = '#FFFFFF', setNoteTextColor,
    noteFontFamily = 'Poppins', setNoteFontFamily, noteFontSize = 18, setNoteFontSize,
    noteTextOpacity = 100, setNoteTextOpacity, noteBgOpacity = 100, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights = ['Regular', 'Medium', 'Bold'], sizes = [12, 14, 16, 18, 20, 24, 28], fonts = ['Poppins', 'Inter', 'Roboto', 'Arial'], 
    isSidebarOpen, totalPages, targetPageIndex = 0, setTargetPageIndex,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen,
    activeLayout, currentPageIndex
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('background');
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
    const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
    const [isWeightMenuOpen, setIsWeightMenuOpen] = useState(false);
    const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
    const [noteWeight, setNoteWeight] = useState('Regular');

    const layoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;

    if (Number(layoutId) === 1) {
        return (
            <div
                className="absolute inset-0 z-[1000] pointer-events-auto flex items-center justify-center bg-transparent"
                onClick={onClose}
            >
                <div
                    className="pointer-events-auto rounded-[1.2rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 flex flex-col gap-0 scale-[0.7] origin-center"
                    style={{
                        width: 'calc(100% - 10px)',
                        maxWidth: '500px',
                        maxHeight: '100vh',
                        backgroundColor: 'rgba(87, 92, 156, 0.8)',
                        backdropFilter: 'blur(16px)',
                        padding: '0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header bar */}
                    <div className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-[14px] font-bold text-white">Add Notes</span>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-all"
                        >
                            <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex px-5 pb-5 gap-5 overflow-hidden">
                        {/* Left Side: Notes & Colors (Wider) */}
                        <div className="flex-[1.6] flex gap-3 min-w-0">
                            {/* Color swatches (Rounded Squares) */}
                            <div className="flex flex-col gap-1.5 pt-0.5">
                                {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54'].map((color, i) => (
                                    <div key={i} onClick={() => setNoteBackground(color)}
                                        className={`w-[20px] h-[20px] rounded-[5px] cursor-pointer hover:scale-110 transition-transform border-[1px] ${noteBackground === color ? 'border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }} />
                                ))}
                                <div onClick={() => { setPickerTarget('background'); setShowColorPicker(true); }}
                                    className="w-[20px] h-[20px] rounded-[5px] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center relative overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] shadow-lg"
                                >
                                    <Icon icon="lucide:pipette" className="w-3 h-3 text-white drop-shadow-md z-10" />
                                </div>
                            </div>

                            {/* Note Sticky Area (Bigger) */}
                            <div className="flex-1 flex flex-col h-full min-h-[260px]">
                                <div
                                    className="relative w-full h-full rounded-[12px] p-3 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden"
                                    style={{ backgroundColor: noteBackground || '#D9DC54', opacity: noteBgOpacity / 100 }}
                                >
                                    {/* Page Label + Pencil Icon */}
                                    <div className="absolute top-2.5 right-3 flex items-center gap-1 z-10">
                                        <span className="text-[9px] font-extrabold text-black/40">
                                            Page {((targetPageIndex ?? currentPageIndex) + 1).toString().padStart(2, '0')}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                                            className="text-black/40 hover:text-black/60 transition-colors"
                                        >
                                            <Icon icon="lucide:pencil" className="w-2.5 h-2.5" />
                                        </button>

                                        {/* Page Dropdown Portal */}
                                        {isPageDropdownOpen && (
                                            <div className="absolute top-full right-0 mt-1 w-[80px] bg-white border border-gray-200 rounded-lg shadow-xl z-[1500] py-1 max-h-[80px] overflow-y-auto no-scrollbar">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => { setTargetPageIndex(i); setIsPageDropdownOpen(false); }}
                                                        className={`px-2.5 py-1.5 text-[9px] hover:bg-gray-50 cursor-pointer transition-colors ${(targetPageIndex ?? currentPageIndex) === i ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'}`}
                                                    >
                                                        Page {(i + 1).toString().padStart(2, '0')}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <textarea
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter Your Notes"
                                        className="w-full h-full bg-transparent border-none outline-none resize-none placeholder:text-black/20 text-[13px] font-bold overflow-y-auto no-scrollbar pt-5"
                                        style={{
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: `${Math.max(12, Number(noteFontSize) - 2)}px`,
                                            fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                            opacity: noteTextOpacity / 100,
                                            textAlign: noteAlignment,
                                            fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                            textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                            textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Properties & Buttons (Smaller) */}
                        <div className="flex-1 flex flex-col gap-2.5 min-w-0" onClick={() => setActiveFormattingTab(null)}>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-white/90 whitespace-nowrap">Text Property</span>
                                <div className="h-px flex-1 bg-white/10"></div>
                            </div>

                            {/* Property Controls */}
                            <div className="flex flex-col gap-2">
                                {/* Font Dropdown */}
                                <div className="relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                        className="h-8 w-full flex items-center justify-between border border-white/20 rounded-xl px-2.5 bg-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                                    >
                                        <span className="text-[11px] font-medium text-white truncate" style={{ fontFamily: noteFontFamily }}>{noteFontFamily}</span>
                                        <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 text-white/60 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    {isFontMenuOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[1100] py-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                                            {fonts.map(font => (
                                                <div key={font} onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }} className={`px-2.5 py-1.5 text-[10px] hover:bg-gray-50 cursor-pointer transition-colors ${noteFontFamily === font ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'}`} style={{ fontFamily: font }}>{font}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Weight & Size */}
                                <div className="flex gap-1.5">
                                    <div className="flex-1 relative">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                            className="h-8 flex items-center justify-between border border-white/20 rounded-xl px-2.5 bg-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                                        >
                                            <span className="text-[11px] font-medium text-white truncate">{noteWeight}</span>
                                            <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-white/60" />
                                        </div>
                                        {isWeightMenuOpen && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[1100] py-1">
                                                {weights.map(w => (
                                                    <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className={`px-2.5 py-1.5 text-[10px] hover:bg-gray-50 cursor-pointer transition-colors ${noteWeight === w ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'}`}>{w}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-[75px] relative">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                            className="h-8 flex items-center justify-between border border-white/20 rounded-xl px-2.5 bg-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                                        >
                                            <span className="text-[11px] font-medium text-white">{noteFontSize}</span>
                                            <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-white/60" />
                                        </div>
                                        {isSizeMenuOpen && (
                                            <div className="absolute top-full right-0 w-[60px] mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[1100] py-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                                                {sizes.map(s => (
                                                    <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className={`px-2.5 py-1.5 text-[10px] hover:bg-gray-50 cursor-pointer transition-colors text-center ${noteFontSize === s ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'}`}>{s}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Formatting Tool Options Bars */}
                                <div className="relative">
                                    <AnimatePresence mode="wait">
                                        {activeFormattingTab && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute bottom-full right-0 mb-2 z-[1100]"
                                            >
                                                <div className="bg-[#1E1E1E] rounded-xl p-1 flex gap-1 shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                                                    {activeFormattingTab === 'align' && (
                                                        ['left', 'center', 'right', 'justify'].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => setNoteAlignment(opt)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteAlignment === opt ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={`lucide:align-${opt}`} className="w-3.5 h-3.5" />
                                                            </button>
                                                        ))
                                                    )}
                                                    {activeFormattingTab === 'style' && (
                                                        [
                                                            { id: 'bold', label: 'B' },
                                                            { id: 'italic', label: 'I' },
                                                            { id: 'underline', label: 'U' },
                                                            { id: 'strike', label: 'S' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => toggleNoteStyle(opt.id)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteStyles.includes(opt.id) ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className={`text-[11px] font-bold ${opt.id === 'italic' ? 'italic' : opt.id === 'underline' ? 'underline' : opt.id === 'strike' ? 'line-through' : ''}`}>{opt.label}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                    {activeFormattingTab === 'case' && (
                                                        [
                                                            { id: 'none', label: '—' },
                                                            { id: 'sentence', label: 'Aa' },
                                                            { id: 'upper', label: 'AB' },
                                                            { id: 'lower', label: 'ab' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setNoteCase(opt.id)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteCase === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className="text-[10px] font-bold">{opt.label}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                    {activeFormattingTab === 'list' && (
                                                        ['bullet', 'bullet2', 'ordered'].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => handleListClick(opt)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteList === opt ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={opt === 'ordered' ? 'lucide:list-ordered' : opt === 'bullet2' ? 'material-symbols:list' : 'lucide:list'} className="w-3.5 h-3.5" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Icon Row: Alignment, Bold, Case, List */}
                                    <div className="flex gap-1.5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'align' ? null : 'align'); }} 
                                            className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${activeFormattingTab === 'align' ? 'bg-white text-[#575C9C]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                                        >
                                            <Icon icon={`lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`} className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'style' ? null : 'style'); }} 
                                            className={`w-8 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] transition-all ${activeFormattingTab === 'style' || noteStyles.includes('bold') ? 'bg-white text-[#575C9C]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                                        >
                                            B
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'case' ? null : 'case'); }} 
                                            className={`w-8 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] transition-all ${activeFormattingTab === 'case' || noteCase !== 'none' ? 'bg-white text-[#575C9C]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                                        >
                                            Aa
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'list' ? null : 'list'); }} 
                                            className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${activeFormattingTab === 'list' || noteList !== 'none' ? 'bg-white text-[#575C9C]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                                        >
                                            <Icon icon="lucide:list" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Color Color Picker Row */}
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-8 h-8 rounded-xl border border-white/20 cursor-pointer shadow-xl flex-shrink-0"
                                        style={{ backgroundColor: noteTextColor }}
                                        onClick={() => { setPickerTarget('text'); setShowColorPicker(true); }}
                                    />
                                    <div className="flex-1 h-8 flex items-center justify-between border border-white/20 rounded-xl px-3 bg-white/10">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-tight">{noteTextColor}</span>
                                        <span className="text-white/60 text-[10px] font-bold">{noteTextOpacity}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Action Buttons */}
                            <div className="mt-auto pt-3 flex gap-2">
                                <button
                                    onClick={resetNote}
                                    className="flex-1 h-8 rounded-xl border border-white/40 text-white text-[11px] font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Icon icon="lucide:x" className="w-3.5 h-3.5" /> Clear
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${((targetPageIndex ?? currentPageIndex) + 1).toString().padStart(2, '0')}`,
                                            pageIndex: targetPageIndex ?? currentPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.5] h-8 rounded-xl bg-white text-[#575C9C] text-[11px] font-bold hover:bg-gray-100 transition-all shadow-xl"
                                >
                                    Add To Notes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Color Picker */}
                    {showColorPicker && (
                        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-transparent rounded-[1.2rem]" onClick={() => setShowColorPicker(false)}>
                            <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in zoom-in-95 duration-200">
                                <ColorPallet
                                    smallMode={true}
                                    color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                    position={{ x: 0, y: 0 }}
                                    opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                    onOpacityChange={(val) => { if (pickerTarget === 'text') setNoteTextOpacity(val); else setNoteBgOpacity(val); }}
                                    onChange={(color) => { if (pickerTarget === 'text') setNoteTextColor(color); else setNoteBackground(color); }}
                                    onClose={() => setShowColorPicker(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 z-[3000] flex items-center justify-center pointer-events-auto bg-transparent p-2"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[460px] rounded-[24px] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-[3px] relative border-[2.5px] border-white/80"
                style={{ 
                    backgroundColor: 'rgba(87, 92, 156, 0.95)',
                    transform: 'scale(0.68)',
                    transformOrigin: 'center center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-full p-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-base font-bold text-white">Add Notes</span>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <Icon icon="lucide:x" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        {/* Left - Colors */}
                        <div className="flex flex-col gap-1.5 pt-0.5">
                            {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54', '#23D295'].map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => setNoteBackground(color)}
                                    className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 ${noteBackground === color ? 'border-white shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 10, y: rect.top - 50 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] flex items-center justify-center"
                            >
                                <Icon icon="lucide:pipette" className="text-white/50 w-3 h-3" />
                            </div>
                        </div>

                        {/* Middle - Sticky Note Area */}
                        <div
                            className="relative flex-[1.6] h-[170px] rounded-2xl p-3 shadow-xl flex flex-col transition-all duration-300 min-w-0 overflow-hidden"
                            style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                        >
                            <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 hover:bg-white/10 rounded px-2 py-0.5 transition-colors cursor-pointer"
                                onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                            >
                                <span className="text-[11px] font-bold text-white/90">Page {(targetPageIndex + 1).toString().padStart(2, '0')}</span>
                                <Icon icon="lucide:pencil" className="text-white/80 w-3.5 h-3.5" />
                                
                                {isPageDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-24 max-h-32 bg-white rounded-lg shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        {Array.from({ length: totalPages || 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => { setTargetPageIndex(i); setIsPageDropdownOpen(false); }}
                                                className={`px-3 py-2 text-[10px] cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter Your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontFamily: noteFontFamily,
                                    fontSize: `${Math.max(12, Number(noteFontSize) - 4)}px`,
                                    fontWeight: noteStyles?.includes('bold') ? 'bold' : (getFontWeight ? getFontWeight(noteWeight) : 'normal'),
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    fontStyle: noteStyles?.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: noteStyles?.includes('underline') ? 'underline' : (noteStyles?.includes('strike') ? 'line-through' : 'none'),
                                    textTransform: noteCase === 'upper' ? 'uppercase' : (noteCase === 'lower' ? 'lowercase' : 'none'),
                                    lineHeight: '1.4'
                                }}
                                className="w-full flex-1 bg-transparent border-none outline-none resize-none placeholder:text-black/20 pt-6 no-scrollbar"
                            />
                        </div>

                        {/* Right - Properties Panel */}
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 px-0.5">
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">Text Property</span>
                                <div className="h-px flex-1 bg-white/20"></div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                {/* Font Dropdown */}
                                <div className="relative">
                                    <div
                                        onClick={() => { setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                        className="w-full h-8 flex items-center justify-between bg-white/10 border border-white/10 rounded-xl px-3 cursor-pointer text-white"
                                    >
                                        <span className="text-[10px] font-bold truncate">{noteFontFamily}</span>
                                        <Icon icon="lucide:chevron-down" className="w-3 h-3 text-white/50" />
                                    </div>
                                    {isFontMenuOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-50">
                                            <div className="max-h-32 overflow-y-auto py-1">
                                                {fonts.map(font => (
                                                    <div key={font} onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }} className="px-3 py-1.5 text-[10px] cursor-pointer hover:bg-gray-100 text-gray-700" style={{ fontFamily: font }}>{font}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-1.5">
                                    {/* Weight Dropdown */}
                                    <div className="flex-1 relative">
                                        <div
                                            onClick={() => { setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                            className="w-full h-8 flex items-center justify-between bg-white/10 border border-white/10 rounded-xl px-3 cursor-pointer text-white"
                                        >
                                            <span className="text-[10px] font-bold">{noteWeight}</span>
                                            <Icon icon="lucide:chevron-down" className="w-3 h-3 text-white/50" />
                                        </div>
                                        {isWeightMenuOpen && (
                                            <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-50">
                                                <div className="py-1">
                                                    {weights.map(w => (
                                                        <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className="px-2 py-1.5 text-[10px] cursor-pointer hover:bg-gray-100 text-gray-700">{w}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Size Dropdown */}
                                    <div className="w-[50px] relative">
                                        <div
                                            onClick={() => { setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                            className="w-full h-8 flex items-center justify-between bg-white/10 border border-white/10 rounded-xl px-3 cursor-pointer text-white"
                                        >
                                            <span className="text-[10px] font-bold">{noteFontSize}</span>
                                            <Icon icon="lucide:chevron-down" className="w-3 h-3 text-white/50" />
                                        </div>
                                        {isSizeMenuOpen && (
                                            <div className="absolute top-full right-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-50">
                                                <div className="max-h-32 overflow-y-auto py-1">
                                                    {sizes.map(s => (
                                                        <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className="px-2 py-2 text-[10px] text-center cursor-pointer hover:bg-gray-100 text-gray-700">{s}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Format Buttons */}
                                {/* Formatting Tool Options Bars */}
                                <div className="relative">
                                    <AnimatePresence mode="wait">
                                        {activeFormattingTab && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute bottom-full right-0 mb-2 z-[1100]"
                                            >
                                                <div className="bg-[#1E1E1E] rounded-xl p-1 flex gap-1 shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                                                    {activeFormattingTab === 'align' && (
                                                        ['left', 'center', 'right', 'justify'].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => setNoteAlignment(opt)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteAlignment === opt ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={`lucide:align-${opt}`} className="w-3.5 h-3.5" />
                                                            </button>
                                                        ))
                                                    )}
                                                    {activeFormattingTab === 'style' && (
                                                        [
                                                            { id: 'bold', label: 'B' },
                                                            { id: 'italic', label: 'I' },
                                                            { id: 'underline', label: 'U' },
                                                            { id: 'strike', label: 'S' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => toggleNoteStyle(opt.id)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteStyles?.includes(opt.id) ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className={`text-[11px] font-bold ${opt.id === 'italic' ? 'italic' : opt.id === 'underline' ? 'underline' : opt.id === 'strike' ? 'line-through' : ''}`}>{opt.label}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                    {activeFormattingTab === 'case' && (
                                                        [
                                                            { id: 'none', label: '—' },
                                                            { id: 'sentence', label: 'Aa' },
                                                            { id: 'upper', label: 'AB' },
                                                            { id: 'lower', label: 'ab' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setNoteCase(opt.id)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteCase === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className="text-[10px] font-bold">{opt.label}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                    {activeFormattingTab === 'list' && (
                                                        ['bullet', 'bullet2', 'ordered'].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => handleListClick(opt)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${noteList === opt ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={opt === 'ordered' ? 'lucide:list-ordered' : opt === 'bullet2' ? 'material-symbols:list' : 'lucide:list'} className="w-3.5 h-3.5" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Icon Row: Alignment, Bold, Case, List */}
                                    <div className="flex gap-1 justify-between">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'align' ? null : 'align'); }} 
                                            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${activeFormattingTab === 'align' ? 'bg-white text-[#575C9C] border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                                        >
                                            <Icon icon={`lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`} className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'style' ? null : 'style'); }} 
                                            className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-[10px] transition-all ${activeFormattingTab === 'style' || noteStyles?.includes('bold') ? 'bg-white text-[#575C9C] border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                                        >
                                            B
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'case' ? null : 'case'); }} 
                                            className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-[10px] transition-all ${activeFormattingTab === 'case' || noteCase !== 'none' ? 'bg-white text-[#575C9C] border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                                        >
                                            Aa
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(activeFormattingTab === 'list' ? null : 'list'); }} 
                                            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${activeFormattingTab === 'list' || noteList !== 'none' ? 'bg-white text-[#575C9C] border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                                        >
                                            <Icon icon="lucide:list" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Color Display */}
                                <div className="flex items-center gap-2">
                                    <div
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.left - 180, y: rect.top - 50 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                        className="w-7 h-7 rounded-lg border-2 border-white/10 cursor-pointer shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: noteTextColor }}
                                    />
                                    <div className="flex-1 h-7 bg-white/10 border border-white/10 rounded-xl px-2 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-white uppercase">{noteTextColor}</span>
                                        <span className="text-[9px] font-bold text-white/40">{noteTextOpacity}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-auto flex gap-1.5">
                                <button
                                    onClick={resetNote}
                                    className="flex-1 h-8 rounded-xl border border-white flex items-center justify-center gap-1 text-white font-bold text-[9px] hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <Icon icon="lucide:x" className="w-3 h-3" />
                                    <span>Clear</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${(targetPageIndex + 1).toString().padStart(2, '0')}`,
                                            pageIndex: targetPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.5] h-8 bg-white text-[#575C9C] rounded-xl font-extrabold text-[9px] shadow-lg hover:bg-white/90 active:scale-95 transition-all"
                                >
                                    Add To Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showColorPicker && (
                    <div className="absolute z-[4000] animate-in fade-in zoom-in-95 duration-200" style={{ top: pickerPos.y, left: pickerPos.x }}>
                        <ColorPallet
                            smallMode={true}
                            color={pickerTarget === 'background' ? noteBackground : noteTextColor}
                            opacity={pickerTarget === 'background' ? noteBgOpacity : noteTextOpacity}
                            onChange={(color) => {
                                if (pickerTarget === 'background') setNoteBackground(color);
                                else setNoteTextColor(color);
                            }}
                            onOpacityChange={(val) => {
                                if (pickerTarget === 'background') setNoteBgOpacity(val);
                                else setNoteTextOpacity(val);
                            }}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddNotesPopupLandscape;
