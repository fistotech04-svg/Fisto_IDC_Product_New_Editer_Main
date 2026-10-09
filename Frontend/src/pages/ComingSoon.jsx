import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, Home, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoon = ({ title: propTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine section name from path
  const path = location.pathname.toLowerCase();
  let title = propTitle;
  if (!title) {
    if (path.includes('features')) title = 'Features';
    else if (path.includes('converter')) title = 'Converter';
    else if (path.includes('pricing')) title = 'Pricing';
    else if (path.includes('help')) title = 'Help & Support';
    else title = 'Exciting Feature';
  }

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center bg-white text-slate-900 font-sans relative overflow-hidden py-12 px-4 sm:px-6">
      {/* Background radial orange glow & subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ea72330a_1px,transparent_1px),linear-gradient(to_bottom,#ea72330a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#ea7233]/15 to-amber-300/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-xl mx-auto text-center flex flex-col items-center">
        {/* Animated Badge Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-orange-50 border border-orange-200/60 shadow-lg shadow-orange-500/10"
        >
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#ea7233] animate-pulse" />
        </motion.div>

        {/* Header Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold uppercase tracking-widest text-[#ea7233]">
            <Clock className="w-3.5 h-3.5" />
            <span>Coming Soon</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {title} <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ea7233] to-amber-500">
              Is Under Construction
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto pt-2">
            We are working hard to bring you an incredible experience for <span className="font-semibold text-slate-800">{title}</span>. Stay tuned!
          </p>
        </motion.div>

        {/* Navigation CTAs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => navigate('/home')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#192231] hover:bg-black text-white font-semibold rounded-xl shadow-lg transition-all duration-300 active:scale-95 text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-300 active:scale-95 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
