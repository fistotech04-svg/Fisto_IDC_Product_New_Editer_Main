import React from 'react';
import { Link } from 'react-router-dom';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg';
import { Icon } from '@iconify/react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#222222] text-white font-sans relative overflow-hidden flex flex-col justify-between min-h-auto lg:min-h-[500px]">
      
      {/* Main Content Area */}
      <div className="w-full max-w-[100vw] mx-auto px-4 sm:px-6 lg:pl-[2vw] lg:pr-0 relative z-10 flex flex-col justify-between">
        
        {/* Top Header Row with Social Icons & Let's Talk CTA */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-[3vw] relative pb-6 lg:pb-0">
          
          {/* Left Column: Brand Logo & Headline */}
          <div className="w-full lg:w-auto max-w-full sm:max-w-[80%] lg:max-w-[24vw] pt-6 sm:pt-8 lg:pt-[3.5vw] space-y-3 sm:space-y-4 lg:space-y-[1.2vw] pr-24 sm:pr-28 lg:pr-0">
            {/* Logo Image */}
            <div className="flex items-center">
              <img src={FlipibookLogo} alt="Flipibook Logo" className="h-8 sm:h-10 lg:h-[2.8vw] w-auto object-contain" />
            </div>

            {/* Tagline Headline */}
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-[1.4vw] font-bold text-white tracking-tight uppercase leading-snug lg:leading-[1.25]">
              LET&apos;S BUILD YOUR NEXT <br className="hidden sm:inline" />
              DIGITAL EXPERIENCE
            </h2>

            {/* Sub-paragraph */}
            <p className="text-xs sm:text-sm md:text-base lg:text-[0.78vw] text-[#a0a0a0] font-normal leading-relaxed lg:leading-[1.6]">
              Turn your ideas into stunning interactive flipbooks <br className="hidden md:inline" />
              and create a lasting impression.
            </p>
          </div>

          {/* Center Column: Social Links Bar + 3 Info Link Columns */}
          <div className="flex-1 w-full lg:w-auto flex flex-col justify-between pl-0 lg:pl-[2vw] pr-0 lg:pr-[12vw] space-y-6 sm:space-y-8 lg:space-y-[2.5vw]">
            
            {/* Horizontal Social Links Bar */}
            <div className="flex flex-wrap items-center pt-2 sm:pt-4 lg:pt-[3.5vw] ml-0 lg:ml-[3vw] gap-2.5 sm:gap-4 lg:gap-[2.5vw] text-xs sm:text-sm md:text-base lg:text-[0.88vw] font-medium text-white">
              {/* Facebook */}
              <a href="#" className="flex items-center gap-1 lg:gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="ic:baseline-facebook" className="text-sm sm:text-lg lg:text-[1.3vw]" />
                <span className="text-xs sm:text-sm lg:text-[1.2vw]">Facebook</span>
                <Icon icon="akar-icons:arrow-up-right" className="text-[10px] sm:text-sm lg:text-[1.2vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>

              <span className="text-[#666666] lg:text-[#ffffff] font-light text-xs sm:text-base lg:text-[2vw]">|</span>

              {/* Instagram */}
              <a href="#" className="flex items-center gap-1 lg:gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="ri:instagram-line" className="text-sm sm:text-lg lg:text-[1.3vw]" />
                <span className="text-xs sm:text-sm lg:text-[1.2vw]">Instagram</span>
                <Icon icon="akar-icons:arrow-up-right" className="text-[10px] sm:text-sm lg:text-[1.2vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>

              <span className="text-[#666666] lg:text-[#ffffff] font-light text-xs sm:text-base lg:text-[2vw]">|</span>

              {/* LinkedIn */}
              <a href="#" className="flex items-center gap-1 lg:gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="mdi:linkedin" className="text-sm sm:text-lg lg:text-[1.3vw]" />
                <span className="text-xs sm:text-sm lg:text-[1.2vw]">Linked in</span>
                <Icon icon="akar-icons:arrow-up-right" className="text-[10px] sm:text-sm lg:text-[1.2vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>

              <span className="text-[#666666] lg:text-[#ffffff] font-light text-xs sm:text-base lg:text-[2vw]">|</span>

              {/* YouTube */}
              <a href="#" className="flex items-center gap-1 lg:gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="mdi:youtube" className="text-sm sm:text-lg lg:text-[1.3vw]" />
                <span className="text-xs sm:text-sm lg:text-[1.2vw]">YouTube</span>
                <Icon icon="akar-icons:arrow-up-right" className="text-[10px] sm:text-sm lg:text-[1.2vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>
            </div>

            {/* 3 Link Columns Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 w-full lg:w-[54vw] ml-0 lg:ml-[4vw] gap-4 sm:gap-8 lg:gap-[2vw] text-xs sm:text-sm lg:text-[0.78vw]">
              
              {/* Column 1: Main Pages */}
              <div className="flex flex-col space-y-2 lg:space-y-[0.7vw]">
                <Link to="/" className="text-[#b0b0b0] hover:text-white underline transition-colors">Home</Link>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Features</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Templates</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Explore</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Pricing</a>
              </div>

              {/* Column 2: Contact Info */}
              <div className="flex flex-col space-y-2 lg:space-y-[0.7vw]">
                <a href="mailto:info@flipibook-o.com" className="text-[#b0b0b0] hover:text-white underline transition-colors break-words">
                  info@flipibook-o.com
                </a>
                <a href="tel:+917530025147" className="text-[#b0b0b0] hover:text-white underline transition-colors">
                  +91 75300 25147
                </a>
              </div>

              {/* Column 3: Resource Links */}
              <div className="flex flex-col space-y-2 lg:space-y-[0.7vw]">
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Documentation</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Tutorials</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Help Center</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">FAQs</a>
              </div>

            </div>

          </div>

          {/* Right Floating Orange "LET'S TALK" Box */}
          <a 
            href="mailto:info@flipibook-o.com"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-0 lg:right-0 w-20 sm:w-24 md:w-28 lg:w-[9vw] h-28 sm:h-36 md:h-40 lg:h-[15vw] bg-[#EA7233] hover:bg-[#e04d19] text-white flex flex-col justify-between p-3 sm:p-4 lg:p-[1.2vw] transition-all duration-300 group shadow-lg z-20 cursor-pointer"
          >
            {/* Arrow Top Right */}
            <div className="flex justify-center">
              <Icon icon="bi:arrow-up-right" className="text-3xl sm:text-4xl md:text-5xl lg:text-[5vw]" />
            </div>

            {/* Text Bottom Left */}
            <div className="text-xs sm:text-sm md:text-base lg:text-[1.5vw] font-medium text-center uppercase leading-tight">
              LET’S <br />
              TALK
            </div>
          </a>

        </div>

      </div>

      {/* Giant Watermark Background Text "FLIPIBOOK" */}
      <div className="w-full relative overflow-hidden select-none pointer-events-none my-4 lg:my-0">
        <h1 className="text-[18vw] sm:text-[16vw] lg:text-[14vw] font-black text-white/[0.04] text-center tracking-[0.02em] leading-none uppercase whitespace-nowrap">
          FLIPIBOOK
        </h1>
      </div>

      {/* Bottom Copyright & Legal Policy Bar */}
      <div className="w-full py-4 lg:py-[1.2vw] px-4 sm:px-6 lg:px-[3vw] relative z-10 bg-[#222222]">
        <div className="max-w-[94vw] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-[1vw] text-xs sm:text-sm lg:text-[0.72vw] text-[#fafafa] text-center sm:text-left">
          
          {/* Copyright Left */}
          <div>
            Copyright © 2025 <a href="#" className="underline text-gray-200 hover:text-white">Fisto Tech Private Limited</a>. All Rights Reserved.
          </div>

          {/* Legal Links Right */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-[1vw]">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-[#FFFFFF]">|</span>
            <a href="#" className="hover:text-white transition-colors">Teams of Use</a>
            <span className="text-[#FFFFFF]">|</span>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>

        </div>
      </div>

    </footer>
  );
}
