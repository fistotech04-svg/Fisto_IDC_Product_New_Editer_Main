import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PdfProcessingLoader = ({ progress, onCancel }) => {
    if (!progress) return null;

    const { current, total, message, fileName, stage } = progress;

    // Fluid progress value (starts moving immediately, never stays stuck at 0%)
    const [fluidPercent, setFluidPercent] = useState(15);

    // Reset when a new file begins
    useEffect(() => {
        setFluidPercent(15);
    }, [fileName]);

    useEffect(() => {
        // If explicit 100% or all pages processed
        if (total > 0 && current >= total && current > 0) {
            setFluidPercent(100);
            return;
        }

        if (stage === 'saving') {
            setFluidPercent(prev => Math.max(prev, 85));
        }

        const interval = setInterval(() => {
            setFluidPercent(prev => {
                if (prev < 35) return prev + Math.random() * 3 + 1.5;
                if (prev < 65) return prev + Math.random() * 2 + 0.8;
                if (prev < 85) return prev + Math.random() * 1.2 + 0.4;
                if (prev < 96) return prev + Math.random() * 0.3 + 0.1;
                return prev;
            });
        }, 250);

        return () => clearInterval(interval);
    }, [current, total, stage]);

    // Calculate effective percentage
    const backendPercent = (total > 0 && current > 0) ? Math.round((current / total) * 100) : 0;
    const displayPercent = Math.min(100, Math.round(Math.max(fluidPercent, backendPercent)));

    // Dynamic message based on progress stage
    const getDynamicMessage = () => {
        if (displayPercent >= 100) return 'Opening flipbook...';
        if (stage === 'saving') return message || 'Saving pages & binding flipbook...';
        if (displayPercent < 35) return message || `Extracting pages from ${fileName || 'document'}...`;
        if (displayPercent < 65) return 'Converting vector graphics & fonts...';
        if (displayPercent < 88) return 'Optimizing flipbook layout...';
        return 'Saving pages & binding flipbook...';
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed top-[8vh] left-0 right-0 bottom-0 z-[9999] flex flex-col items-center justify-center bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
                <div className="flex flex-col items-center max-w-[24vw] w-full text-center">
                    {/* Indigo Spinner */}
                    <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-[1vw]"></div>

                    {/* File Name Badge */}
                    {fileName && (
                        <span className="text-[0.7vw] font-semibold text-indigo-600 bg-indigo-50 px-[0.8vw] py-[0.2vw] rounded-full max-w-[18vw] truncate mb-[0.6vw]">
                            {fileName}
                        </span>
                    )}

                    {/* Dynamic Message */}
                    <p className="text-[0.95vw] font-semibold text-gray-700 mb-[0.4vw]">
                        {getDynamicMessage()}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full mt-[0.6vw]">
                        <div className="w-full h-[0.45vw] bg-gray-100 rounded-full overflow-hidden relative">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                initial={{ width: '15%' }}
                                animate={{ width: `${displayPercent}%` }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                        </div>

                        {/* Progress Info Row */}
                        <div className="flex items-center justify-between mt-[0.4vw]">
                            <span className="text-[0.7vw] font-medium text-gray-400">
                                {total > 1 ? (current > 0 ? `${current} of ${total} pages` : `${total} pages`) : 'Processing document...'}
                            </span>
                            <span className="text-[0.75vw] font-bold text-indigo-600">
                                {displayPercent}%
                            </span>
                        </div>
                    </div>

                    {/* Cancel Button */}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-[1.4vw] px-[1.2vw] py-[0.45vw] text-[0.75vw] font-semibold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-[0.5vw] transition-all cursor-pointer flex items-center gap-[0.35vw] active:scale-95 shadow-sm"
                        >
                            <X size="0.85vw" />
                            <span>Cancel Upload</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PdfProcessingLoader;
