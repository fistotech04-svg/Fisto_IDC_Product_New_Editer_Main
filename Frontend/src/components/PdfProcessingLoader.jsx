import React from 'react';
import { motion } from 'framer-motion';

const PdfProcessingLoader = ({ progress }) => {
    if (!progress) return null;

    const { current, total, message, fileName } = progress;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-[1vw] max-w-[30vw] w-full text-center">
                {/* Spinning Indicator */}
                <div className="w-[3.5vw] h-[3.5vw] border-[0.3vw] border-white/30 border-t-white rounded-full animate-spin mb-[0.5vw]"></div>
                
                <div className="w-full">
                    {/* Dynamic Message */}
                    <p className="text-white font-bold text-[1.15vw] mb-[0.5vw] drop-shadow-sm">
                        {message || (current === 0 
                            ? `Extracting pages from ${fileName || 'PDF'}...` 
                            : `Uploading page ${current} of ${total}...`
                        )}
                    </p>
                    
                    {/* Progress Bar */}
                    {total > 0 && (
                        <div className="w-full h-[0.4vw] bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-white transition-all duration-300 ease-out"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                            ></motion.div>
                        </div>
                    )}
                    
                    {/* Counter Text */}
                    {total > 1 && (
                        <p className="text-white/70 text-[0.75vw] mt-[0.4vw] font-medium">
                            {current} of {total} pages
                        </p>
                    )}

                    <p className="mt-[1.5vw] text-white/50 text-[0.7vw] font-medium tracking-wide uppercase">
                        Please wait while we prepare your workspace
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PdfProcessingLoader;
