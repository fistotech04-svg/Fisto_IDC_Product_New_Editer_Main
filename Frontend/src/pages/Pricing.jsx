import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import BannerImage from '../assets/pricing/Banner-image.png';
import { Icon } from '@iconify/react';
import { 
  CreditCard, 
  RotateCw, 
  ChevronDown,
  ArrowRight,
  Minus
} from 'lucide-react';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const isAnnual = billingCycle === 'annual';

  // State for exclusive FAQ accordion
  const [openFaqIndex, setOpenFaqIndex] = useState(0); // default first item open

  const toggleFaqCard = (idx) => {
    setOpenFaqIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#ea7233] selection:text-white w-full overflow-x-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION (Compact Height, Responsive & vw Sizing) */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-6 sm:pt-8 lg:pt-[2.5vw] pb-4 sm:pb-6 lg:pb-[1.8vw] px-4 sm:px-6 lg:px-[6vw] text-center max-w-full mx-auto">
        <div className="max-w-4xl lg:max-w-[75vw] mx-auto space-y-3 sm:space-y-4 lg:space-y-[1vw]">
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5vw] font-bold tracking-tight text-[#232733] leading-tight sm:leading-tight lg:leading-[1.15]">
            Plans built for the way <span className="text-[#ea7233]">your work</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-[1.4vw] font-normal max-w-2xl lg:max-w-[40vw] mx-auto leading-relaxed lg:leading-[1.5]">
            Choose the right plan for your needs and create stunning interactive digital catalogues with ease.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="pt-2 sm:pt-3 lg:pt-[0.8vw] pb-1 flex justify-center items-center">
            <div className="bg-slate-100 p-1 sm:p-1.5 lg:p-[0.35vw] rounded-lg inline-flex items-center gap-1 lg:gap-[0.4vw] shadow-inner border border-slate-200 shadow-lg">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 sm:px-6 lg:px-[1.6vw] py-1.5 sm:py-2.5 lg:py-[0.6vw] rounded-lg text-xs sm:text-sm lg:text-[1vw] font-regular transition-all duration-300 ${
                  !isAnnual
                    ? 'bg-[#181e29] text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 bg-transparent'
                }`}
              >
                Monthly billing
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 sm:px-6 lg:px-[1.6vw] py-1.5 sm:py-2.5 lg:py-[0.6vw] rounded-lg text-xs sm:text-sm lg:text-[1vw] font-regular transition-all duration-300 flex items-center gap-1.5 lg:gap-[0.5vw] ${
                  isAnnual
                    ? 'bg-[#181e29] text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 bg-[#fff]'
                }`}
              >
                <span>Annual billing</span>
                <span className="bg-[#ff3b30] text-white text-[9px] sm:text-[10px] lg:text-[0.68vw] font-bold px-2 lg:px-[0.5vw] py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="pt-2 sm:pt-3 lg:pt-[0.8vw] flex flex-wrap items-center justify-center gap-4 sm:gap-8 lg:gap-[2.2vw] text-xs sm:text-sm lg:text-[0.88vw] font-medium text-slate-600">
            <div className="flex items-center gap-2 lg:gap-[0.5vw]">
              <div className="w-6 sm:w-7 lg:w-[1.8vw] h-6 sm:h-7 lg:h-[1.8vw] rounded-full bg-[#ea7233] text-white flex items-center justify-center shadow-sm shrink-0">
                <CreditCard className="w-3.5 sm:w-4 lg:w-[1vw] h-3.5 sm:h-4 lg:h-[1vw]" />
              </div>
              <span>No credit card required</span>
            </div>

            <div className="flex items-center gap-2 lg:gap-[0.5vw]">
              <div className="w-6 sm:w-7 lg:w-[1.8vw] h-6 sm:h-7 lg:h-[1.8vw] rounded-full bg-[#ea7233] text-white flex items-center justify-center shadow-sm shrink-0">
                <RotateCw className="w-3.5 sm:w-4 lg:w-[1vw] h-3.5 sm:h-4 lg:h-[1vw]" />
              </div>
              <span>Easy upgrade anytime</span>
            </div>

            <div className="flex items-center gap-2 lg:gap-[0.5vw]">
              <div className="w-6 sm:w-7 lg:w-[1.8vw] h-6 sm:h-7 lg:h-[1.8vw] rounded-full bg-[#ea7233] text-white flex items-center justify-center shadow-sm shrink-0">
                <Icon icon="hugeicons:tick-01" className="w-3.5 sm:w-4 lg:w-[1vw] h-3.5 sm:h-4 lg:h-[1vw]" />
              </div>
              <span>Secure &amp; reliable</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRICING CARDS SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-6 sm:py-10 lg:py-[3vw] px-4 sm:px-6 lg:px-[6vw] max-w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-[2vw] items-stretch max-w-7xl lg:max-w-[85vw] mx-auto">
          
          {/* CARD 1: FREE */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl lg:rounded-[1.5vw] p-6 sm:p-8 lg:p-[2vw] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              {/* Top Icon */}
              <div className="w-12 sm:w-16 lg:w-[3.6vw] h-12 sm:h-16 lg:h-[3.6vw] rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Icon icon="carbon:cube" className="w-6 sm:w-8 lg:w-[1.8vw] h-6 sm:h-8 lg:h-[1.8vw] text-slate-700" />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl sm:text-3xl lg:text-[1.8vw] font-bold text-slate-900 mb-1.5 sm:mb-2 lg:mb-[0.5vw]">Free</h3>
              <p className="text-gray-700 text-sm sm:text-sm lg:text-[1.2vw] mb-4 sm:mb-6 lg:mb-[0.5vw] ">
                Perfect for individuals and small business getting started.
              </p>

              {/* Price */}
              <div className="mb-4 sm:mb-6 lg:mb-[1.5vw] flex items-baseline gap-1 lg:gap-[0.3vw]">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.8vw] font-bold text-slate-900 tracking-tight">
                  {isAnnual ? '$15.99' : '$19.99'}
                </span>
                <span className="text-slate-500 font-medium text-xs sm:text-sm lg:text-[0.88vw]">/month</span>
              </div>

              {/* Action Button */}
              <Link
                to="/signup"
                className="w-full py-2.5 sm:py-3 lg:py-[0.7vw] px-4 sm:px-6 lg:px-[1.5vw] rounded-xl lg:rounded-[0.8vw] border-2 border-[#ea7233] text-[#ea7233] font-bold text-xs sm:text-sm lg:text-[0.9vw] text-center block hover:bg-orange-50 transition-colors mb-6 sm:mb-8 lg:mb-[1.8vw]"
              >
                Get Started
              </Link>

              {/* Features List */}
              <div className="space-y-3 lg:space-y-[0.8vw]">
                <p className="text-xs sm:text-sm lg:text-[1vw] font-semibold text-slate-900">What&apos;s include :</p>
                <ul className="space-y-2.5 sm:space-y-3.5 lg:space-y-[0.75vw] text-xs sm:text-sm lg:text-[0.85vw] text-slate-600">
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Create up to 5 flipbooks/month</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Basic templates</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Add images, videos &amp; links</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Share via link or embed</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 2: STANDARD (MOST POPULAR) */}
          <div className="relative bg-[#fff7f2] border-2 border-[#f7a072] rounded-2xl sm:rounded-3xl lg:rounded-[1.5vw] p-6 sm:p-8 lg:p-[2vw] shadow-md flex flex-col justify-between">
            {/* Most Popular Badge */}
            <div className="absolute top-4 sm:top-6 lg:top-[1.2vw] right-4 sm:right-6 lg:right-[1.2vw] bg-white border border-orange-200 shadow-xs px-2.5 sm:px-3 lg:px-[0.7vw] py-0.5 sm:py-1 lg:py-[0.25vw] rounded-full flex items-center gap-1 lg:gap-[0.3vw]">
              <Icon icon="fa6-solid:crown" className="w-3 sm:w-3.5 lg:w-[0.8vw] h-3 sm:h-3.5 lg:h-[0.8vw] text-[#ea7233]" />
              <span className="text-[10px] sm:text-xs lg:text-[0.72vw] font-bold text-[#ea7233]">Most Popular</span>
            </div>

            <div>
              {/* Top Icon */}
              <div className="w-12 sm:w-16 lg:w-[3.6vw] h-12 sm:h-16 lg:h-[3.6vw] rounded-full bg-orange-100/80 flex items-center justify-center mb-2">
                <Icon icon="bi:people" className="w-6 sm:w-8 lg:w-[1.8vw] h-6 sm:h-8 lg:h-[1.8vw] text-[#ea7233]" />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl sm:text-3xl lg:text-[1.8vw] font-bold text-slate-900 mb-1.5 sm:mb-2 lg:mb-[0.5vw]">Standard</h3>
              <p className="text-gray-700 text-sm sm:text-sm lg:text-[1.2vw] mb-4 sm:mb-6 lg:mb-[0.5vw]   ">
                Ideal for growing teams and businesses with advanced needs.
              </p>

              {/* Price */}
              <div className="mb-4 sm:mb-6 lg:mb-[1.5vw] flex items-baseline gap-1 lg:gap-[0.3vw]">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.8vw] font-bold text-slate-900 tracking-tight">
                  {isAnnual ? '$31.99' : '$39.99'}
                </span>
                <span className="text-slate-600 font-medium text-xs sm:text-sm lg:text-[0.88vw]">/month</span>
              </div>

              {/* Action Button */}
              <Link
                to="/signup"
                className="w-full py-2.5 sm:py-3 lg:py-[0.7vw] px-4 sm:px-6 lg:px-[1.5vw] rounded-xl lg:rounded-[0.8vw] bg-[#ea7233] hover:bg-[#d65a1c] text-white font-bold text-xs sm:text-sm lg:text-[0.9vw] text-center block shadow-md shadow-orange-500/20 transition-all mb-6 sm:mb-8 lg:mb-[1.8vw]"
              >
                Upgrade Now
              </Link>

              {/* Features List */}
              <div className="space-y-3 lg:space-y-[0.8vw]">
                <p className="text-xs sm:text-sm lg:text-[1vw] font-semibold text-slate-900">What&apos;s include :</p>
                <ul className="space-y-2.5 sm:space-y-3.5 lg:space-y-[0.75vw] text-xs sm:text-sm lg:text-[0.85vw] text-slate-700">
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Create up to 5 flipbooks/month</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Premium templates</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Custom branding (logo, colors)</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Team collaboration (up to 5 users)</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Custom domain</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 3: PREMIUM */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl lg:rounded-[1.5vw] p-6 sm:p-8 lg:p-[2vw] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              {/* Top Icon */}
              <div className="w-12 sm:w-16 lg:w-[3.6vw] h-12 sm:h-16 lg:h-[3.6vw] rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Icon icon="bi:building" className="w-6 sm:w-8 lg:w-[1.8vw] h-6 sm:h-8 lg:h-[1.8vw] text-slate-700" />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl sm:text-3xl lg:text-[1.8vw] font-bold text-slate-900 mb-1.5 sm:mb-2 lg:mb-[0.5vw]">Premium</h3>
              <p className="text-gray-700 text-sm sm:text-sm lg:text-[1.2vw] mb-4 sm:mb-6 lg:mb-[0.5vw] ">
                For large organizations with custom requirements.
              </p>

              {/* Price */}
              <div className="mb-4 sm:mb-6 lg:mb-[1.5vw] flex items-baseline gap-1 lg:gap-[0.3vw]">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.8vw] font-bold text-slate-900 tracking-tight">
                  {isAnnual ? '$79.99' : '$99.99'}
                </span>
                <span className="text-slate-500 font-medium text-xs sm:text-sm lg:text-[0.88vw]">/month</span>
              </div>

              {/* Action Button */}
              <Link
                to="/signup"
                className="w-full py-2.5 sm:py-3 lg:py-[0.7vw] px-4 sm:px-6 lg:px-[1.5vw] rounded-xl lg:rounded-[0.8vw] border-2 border-[#ea7233] text-[#ea7233] font-bold text-xs sm:text-sm lg:text-[0.9vw] text-center block hover:bg-orange-50 transition-colors mb-6 sm:mb-8 lg:mb-[1.8vw]"
              >
                Go Premium
              </Link>

              {/* Features List */}
              <div className="space-y-3 lg:space-y-[0.8vw]">
                <p className="text-xs sm:text-sm lg:text-[1vw] font-semibold text-slate-900">What&apos;s include :</p>
                <ul className="space-y-2.5 sm:space-y-3.5 lg:space-y-[0.75vw] text-xs sm:text-sm lg:text-[0.85vw] text-slate-600">
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Unlimited flipbooks</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>All premium features</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Team collaboration (unlimited users)</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Advanced analytics &amp; reports</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>API access &amp; integrations</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2.5 lg:gap-[0.6vw]">
                    <Icon icon="teenyicons:tick-circle-solid" className="w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] text-[#ea7233] shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FEATURE COMPARISON TABLE */}
      {/* ------------------------------------------------------------- */}
      <section className="py-8 sm:py-16 lg:py-[2vw] px-4 sm:px-6 lg:px-[6vw] max-w-full mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-[2.5vw]">
          <p className="text-[10px] sm:text-xs lg:text-[0.75vw] font-bold uppercase  text-slate-700 mb-1 sm:mb-2 lg:mb-[0.1vw]">
            FEATURE COMPARISON
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-[2.2vw] font-bold text-slate-900 tracking-tight">
            Compare Plans &amp; <span className="text-[#ea7233]">Features</span>
          </h2>
          <p className="text-slate-700 mt-2 sm:mt-3 lg:mt-[0.6vw] text-xs sm:text-sm lg:text-[1vw] max-w-2xl lg:max-w-[50vw] mx-auto">
            Explore what each plan includes and find the one that fits flipbook creation publishing needs.
          </p>
        </div>

        {/* Comparison Table Container */}
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl lg:rounded-[1.2vw] border border-slate-200 shadow-sm bg-white max-w-7xl lg:max-w-[85vw] mx-auto [scrollbar-width:thin] [scrollbar-color:#ea7233_#f1f5f9] md:[scrollbar-width:none] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-b-xl [&::-webkit-scrollbar-thumb]:bg-[#ea7233] [&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar]:h-0">
          <table className="w-full text-left border-collapse min-w-[650px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-200 divide-x divide-slate-200">
                <th className="w-1/4 bg-[#111827] text-white font-bold text-center py-2 sm:py-3 lg:py-[0.45vw] px-4 sm:px-6 lg:px-[1.5vw] text-base sm:text-lg lg:text-[1.1vw] rounded-tl-xl lg:rounded-tl-[1.2vw]">
                  Features
                </th>
                <th className="w-1/4 bg-[#edf4ff] text-[#1e293b] font-bold text-center py-2 sm:py-3 lg:py-[0.45vw] px-4 sm:px-6 lg:px-[1.5vw] text-base sm:text-lg lg:text-[1.1vw]">
                  Free
                </th>
                <th className="w-1/4 bg-[#fff0e6] text-center py-2 sm:py-3 lg:py-[0.45vw] px-4 sm:px-6 lg:px-[1.5vw]">
                  <div className="font-bold text-[#ea7233] text-base sm:text-lg lg:text-[1.1vw]">Standard</div>
                  <div className="text-[11px] sm:text-xs lg:text-[0.78vw] text-[#ea7233]/80 font-semibold mt-0.5">
                    {isAnnual ? '$31.99 /month' : '$39.99 /month'}
                  </div>
                </th>
                <th className="w-1/4 bg-[#fff8eb] text-center py-2 sm:py-3 lg:py-[0.45vw] px-4 sm:px-6 lg:px-[1.5vw] rounded-tr-xl lg:rounded-tr-[1.2vw]">
                  <div className="font-bold text-[#854d0e] text-base sm:text-lg lg:text-[1.1vw]">Premium</div>
                  <div className="text-[11px] sm:text-xs lg:text-[0.78vw] text-[#854d0e]/80 font-semibold mt-0.5">
                    {isAnnual ? '$79.99 /month' : '$99.99 /month'}
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 text-sm sm:text-base lg:text-[1.1vw] text-slate-700 font-medium">
              
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">Number of Flipbooks</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-600">Up to 5</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">Page view (Monthly)</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-600">1,000</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center font-semibold text-slate-800">10,000</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center font-semibold text-slate-800">Unlimited</td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">3D page Flip effect</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1 sm:py-1.5 lg:py-[0.2vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">
                  Interactive Elements <br/> <span className="text-xs sm:text-sm lg:text-[0.88vw] text-slate-400 font-normal block sm:inline">(Links, Video, Audio, etc.)</span>
                </td>
                <td className="py-1 sm:py-1.5 lg:py-[0.2vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-600">Basic</td>
                <td className="py-1 sm:py-1.5 lg:py-[0.2vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1 sm:py-1.5 lg:py-[0.2vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

              {/* Row 5 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">Product Catalogue Templates</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-600">Basic</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

              {/* Row 6 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">Analytics &amp; Insights</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-600">Basic</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

              {/* Row 7 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">Remove Flipbook Branding</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-400">
                  <Minus className="w-4 sm:w-4 lg:w-[0.9vw] h-4 sm:h-4 lg:h-[0.9vw] mx-auto text-slate-300" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

              {/* Row 8 */}
              <tr className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] font-semibold text-slate-800 bg-[#F3F3F3]">Custom Domain</td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-400">
                  <Minus className="w-4 sm:w-4 lg:w-[0.9vw] h-4 sm:h-4 lg:h-[0.9vw] mx-auto text-slate-300" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center text-slate-400">
                  <Minus className="w-4 sm:w-4 lg:w-[0.9vw] h-4 sm:h-4 lg:h-[0.9vw] mx-auto text-slate-300" />
                </td>
                <td className="py-1.5 sm:py-2 lg:py-[0.3vw] px-4 sm:px-6 lg:px-[1.5vw] text-center">
                  <Icon icon="hugeicons:tick-01" className="w-7 sm:w-8 lg:w-[2.8vw] h-7 sm:h-8 lg:h-[2.8vw] text-[#16a34a] mx-auto stroke-[2.5]" />
                </td>
              </tr>

            </tbody>

            {/* Table Footer Buttons */}
            <tfoot className="border-t border-slate-200">
              <tr className="divide-x divide-slate-200">
                <td className="py-4 sm:py-6 lg:py-[1.2vw] px-4 sm:px-6 lg:px-[1.5vw] bg-[#F3F3F3] rounded-bl-xl lg:rounded-bl-[1.2vw]"></td>
                <td className="py-4 sm:py-6 lg:py-[1.2vw] px-3 sm:px-4 lg:px-[1vw] text-center bg-slate-50/50">
                  <Link
                    to="/signup"
                    className="inline-block py-2 sm:py-2.5 lg:py-[0.6vw] px-4 sm:px-6 lg:px-[1.4vw] rounded-xl lg:rounded-[0.7vw] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm lg:text-[0.88vw] transition-all shadow-xs"
                  >
                    Get Started
                  </Link>
                </td>
                <td className="py-4 sm:py-6 lg:py-[1.2vw] px-3 sm:px-4 lg:px-[1vw] text-center bg-slate-50/50">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-[0.4vw] py-2 sm:py-2.5 lg:py-[0.6vw] px-4 sm:px-6 lg:px-[1.4vw] rounded-xl lg:rounded-[0.7vw] bg-[#ea7233] hover:bg-[#d65a1c] text-white font-semibold text-xs sm:text-sm lg:text-[0.88vw] transition-all shadow-sm"
                  >
                    <span>Upgrade Now</span>
                    <ArrowRight className="w-3.5 sm:w-4 lg:w-[0.9vw] h-3.5 sm:h-4 lg:h-[0.9vw]" />
                  </Link>
                </td>
                <td className="py-4 sm:py-6 lg:py-[1.2vw] px-3 sm:px-4 lg:px-[1vw] text-center bg-slate-50/50 rounded-br-xl lg:rounded-br-[1.2vw]">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-[0.4vw] py-2 sm:py-2.5 lg:py-[0.6vw] px-4 sm:px-6 lg:px-[1.4vw] rounded-xl lg:rounded-[0.7vw] bg-[#111827] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm lg:text-[0.88vw] transition-all shadow-sm"
                  >
                    <span>Go Premium</span>
                    <ArrowRight className="w-3.5 sm:w-4 lg:w-[0.9vw] h-3.5 sm:h-4 lg:h-[0.9vw]" />
                  </Link>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. FREQUENTLY ASKED QUESTIONS SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 sm:py-20 lg:py-[4.5vw] px-4 sm:px-6 lg:px-[6vw] bg-[#f7ddd0] w-full">
        <div className="max-w-6xl lg:max-w-[75vw] mx-auto">
          {/* FAQ Title Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-[2.5vw]">
            <h2 className="text-2xl sm:text-3xl lg:text-[2.2vw] font-bold text-slate-900 tracking-tight">
              Frequently Asked <span className="text-[#ea7233]">Questions</span>
            </h2>
            <p className="text-slate-600 mt-2 lg:mt-[0.5vw] text-xs sm:text-base lg:text-[1.2vw]">
              Everything you need to know about our pricing, features and support.
            </p>
          </div>

          {/* 2-Column FAQ Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-[1.5vw]">
            
            {/* FAQ Item 1 */}
            <div 
              onClick={() => toggleFaqCard(0)}
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-[1.2vw] p-5 sm:p-7 lg:p-[1.6vw] shadow-xs hover:shadow-md transition-all border cursor-pointer select-none ${openFaqIndex === 0 ? 'border-[#ea7233]/40 shadow-sm' : 'border-orange-100/60'} flex flex-col justify-between`}
            >
              <div>
                <div
                  className={`w-full text-left font-bold text-sm sm:text-lg lg:text-[1.1vw] flex items-center justify-between gap-3 lg:gap-[1vw] transition-colors ${
                    openFaqIndex === 0 ? 'text-[#ea7233]' : 'text-slate-900 hover:text-[#ea7233]'
                  }`}
                >
                  <span>Can I try Flipbook for free?</span>
                  <ChevronDown className={`w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] shrink-0 transition-transform ${openFaqIndex === 0 ? 'rotate-180 text-[#ea7233]' : 'text-slate-400'}`} />
                </div>
                {openFaqIndex === 0 && (
                  <p className="mt-2.5 sm:mt-3 lg:mt-[0.8vw] text-slate-600 text-xs sm:text-sm lg:text-[0.88vw] leading-relaxed lg:leading-[1.5]">
                    Yes. You can start with our free plan and explore the basic features before upgrading to a paid plan.
                  </p>
                )}
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div 
              onClick={() => toggleFaqCard(1)}
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-[1.2vw] p-5 sm:p-7 lg:p-[1.6vw] shadow-xs hover:shadow-md transition-all border cursor-pointer select-none ${openFaqIndex === 1 ? 'border-[#ea7233]/40 shadow-sm' : 'border-orange-100/60'} flex flex-col justify-between`}
            >
              <div>
                <div
                  className={`w-full text-left font-bold text-sm sm:text-lg lg:text-[1.1vw] flex items-center justify-between gap-3 lg:gap-[1vw] transition-colors ${
                    openFaqIndex === 1 ? 'text-[#ea7233]' : 'text-slate-900 hover:text-[#ea7233]'
                  }`}
                >
                  <span>Can I add videos and links to my catalogue?</span>
                  <ChevronDown className={`w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] shrink-0 transition-transform ${openFaqIndex === 1 ? 'rotate-180 text-[#ea7233]' : 'text-slate-400'}`} />
                </div>
                {openFaqIndex === 1 && (
                  <p className="mt-2.5 sm:mt-3 lg:mt-[0.8vw] text-slate-600 text-xs sm:text-sm lg:text-[0.88vw] leading-relaxed lg:leading-[1.5]">
                    Yes. You can add videos, product links, buttons, images, and other interactive elements to make your catalogue more engaging.
                  </p>
                )}
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div 
              onClick={() => toggleFaqCard(2)}
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-[1.2vw] p-5 sm:p-7 lg:p-[1.6vw] shadow-xs hover:shadow-md transition-all border cursor-pointer select-none ${openFaqIndex === 2 ? 'border-[#ea7233]/40 shadow-sm' : 'border-orange-100/60'} flex flex-col justify-between`}
            >
              <div>
                <div
                  className={`w-full text-left font-bold text-sm sm:text-lg lg:text-[1.1vw] flex items-center justify-between gap-3 lg:gap-[1vw] transition-colors ${
                    openFaqIndex === 2 ? 'text-[#ea7233]' : 'text-slate-900 hover:text-[#ea7233]'
                  }`}
                >
                  <span>Can I change my plan later?</span>
                  <ChevronDown className={`w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] shrink-0 transition-transform ${openFaqIndex === 2 ? 'rotate-180 text-[#ea7233]' : 'text-slate-400'}`} />
                </div>
                {openFaqIndex === 2 && (
                  <p className="mt-2.5 sm:mt-3 lg:mt-[0.8vw] text-slate-600 text-xs sm:text-sm lg:text-[0.88vw] leading-relaxed lg:leading-[1.5]">
                    Yes. You can upgrade or change your plan whenever your business needs change. Your account and existing catalogues remain available.
                  </p>
                )}
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div 
              onClick={() => toggleFaqCard(3)}
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-[1.2vw] p-5 sm:p-7 lg:p-[1.6vw] shadow-xs hover:shadow-md transition-all border cursor-pointer select-none ${openFaqIndex === 3 ? 'border-[#ea7233]/40 shadow-sm' : 'border-orange-100/60'} flex flex-col justify-between`}
            >
              <div>
                <div
                  className={`w-full text-left font-bold text-sm sm:text-lg lg:text-[1.1vw] flex items-center justify-between gap-3 lg:gap-[1vw] transition-colors ${
                    openFaqIndex === 3 ? 'text-[#ea7233]' : 'text-slate-900 hover:text-[#ea7233]'
                  }`}
                >
                  <span>Do you provide support for Enterprise plans?</span>
                  <ChevronDown className={`w-4 sm:w-5 lg:w-[1.2vw] h-4 sm:h-5 lg:h-[1.2vw] shrink-0 transition-transform ${openFaqIndex === 3 ? 'rotate-180 text-[#ea7233]' : 'text-slate-400'}`} />
                </div>
                {openFaqIndex === 3 && (
                  <p className="mt-2.5 sm:mt-3 lg:mt-[0.8vw] text-slate-600 text-xs sm:text-sm lg:text-[0.88vw] leading-relaxed lg:leading-[1.5]">
                    Yes. Enterprise customers receive priority support and dedicated assistance based on their business requirements.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. READY TO GET STARTED CTA BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="py-6 sm:py-10 lg:py-[2vw] px-4 sm:px-6 lg:px-[6vw] max-w-full mx-auto">
        <div className="relative rounded-2xl sm:rounded-3xl lg:rounded-[1.5vw] overflow-hidden shadow-lg min-h-[180px] sm:min-h-[240px] lg:min-h-[16vw] flex items-center justify-center p-4 sm:p-8 lg:p-[1.8vw] border border-slate-200/60 max-w-7xl lg:max-w-[85vw] mx-auto group">
          
          {/* Banner Image Background */}
          <img 
            src={BannerImage} 
            alt="Ready to get started banner" 
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 group-hover:scale-105"
          />

          {/* Center Banner Content */}
          <div className="relative z-10 text-center max-w-2xl lg:max-w-[45vw] mx-auto space-y-2 sm:space-y-3 lg:space-y-[0.5vw]">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6vw] font-bold tracking-tight text-[#2D3139] leading-tight">
              Ready to <br />
              <span className="text-[#F55316]">get started?</span>
            </h2>

            <p className="text-[#4A5568] text-xs sm:text-sm lg:text-[0.95vw] max-w-xs sm:max-w-md lg:max-w-[28vw] mx-auto font-semibold leading-snug">
              Create engaging, interactive catalogue and <br className="hidden sm:block" />
              bring your products to life.
            </p>

            <div className="pt-1 sm:pt-2 lg:pt-[0.3vw] flex justify-center">
              <Link
                to="/contact"
                className="bg-[#F55316] hover:bg-[#e04509] text-white font-semibold text-xs sm:text-sm lg:text-[0.95vw] px-5 sm:px-7 lg:px-[1.8vw] py-2 sm:py-2.5 lg:py-[0.55vw] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 hover:scale-105"
              >
                <span>Contact Us</span>
                <ArrowRight className="w-3.5 sm:w-4 lg:w-[0.9vw] h-3.5 sm:h-4 lg:h-[0.9vw]" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. FOOTER */}
      {/* ------------------------------------------------------------- */}
      <Footer />

    </div>
  );
};

export default Pricing;
