import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PdfProcessingLoader = ({ progress, onCancel }) => {
    if (!progress) return null;

    const { current, total, message, fileName } = progress;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

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
                        {message || (current === 0 
                            ? `Extracting pages from ${fileName || 'PDF'}...` 
                            : `Uploading page ${current} of ${total}...`
                        )}
                    </p>

                    {/* Progress Bar */}
                    {total > 0 && (
                        <div className="w-full mt-[0.6vw]">
                            <div className="w-full h-[0.45vw] bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                />
                            </div>

                            {/* Progress Info Row */}
                            <div className="flex items-center justify-between mt-[0.4vw]">
                                <span className="text-[0.7vw] font-medium text-gray-400">
                                    {total > 1 ? `${current} of ${total} pages` : 'Processing...'}
                                </span>
                                <span className="text-[0.75vw] font-bold text-indigo-600">
                                    {percentage}%
                                </span>
                            </div>
                        </div>
                    )}

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
