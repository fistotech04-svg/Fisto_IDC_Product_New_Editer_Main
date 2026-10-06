import React from 'react';
import { Link } from 'react-router-dom';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg';
import { Icon } from '@iconify/react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#222222] text-white font-sans relative overflow-hidden flex flex-col justify-between min-h-[500px]">
      
      {/* Main Content Area */}
      <div className="w-full max-w-[100vw] mx-auto   pl-[2vw] relative z-10 flex flex-col justify-between">
        
        {/* Top Header Row with Social Icons & Let's Talk CTA */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-[3vw] relative">
          
          {/* Left Column: Brand Logo & Headline */}
          <div className="max-w-[32vw] md:max-w-[28vw] lg:max-w-[24vw] pt-[5vw] md:pt-[3.5vw] space-y-[1.8vw] md:space-y-[1.2vw]">
            {/* Logo Image */}
            <div className="flex items-center">
              <img src={FlipibookLogo} alt="Flipibook Logo" className="h-[2.8vw] min-h-[32px] md:min-h-[40px] w-auto object-contain" />
            </div>

            {/* Tagline Headline */}
            <h2 className="text-[1.8vw] sm:text-[1.6vw] md:text-[1.4vw] font-bold text-white tracking-tight uppercase leading-[1.25]">
              LET&apos;S BUILD YOUR NEXT <br className="hidden sm:inline" />
              DIGITAL EXPERIENCE
            </h2>

            {/* Sub-paragraph */}
            <p className="text-[1vw] sm:text-[0.9vw] md:text-[0.78vw] text-[#a0a0a0] font-normal leading-[1.6]">
              Turn your ideas into stunning interactive flipbooks <br className="hidden md:inline" />
              and create a lasting impression.
            </p>
          </div>

          {/* Center Column: Social Links Bar + 3 Info Link Columns */}
          <div className="flex-1 w-full lg:w-auto flex flex-col justify-between pl-0 lg:pl-[2vw] pr-0 lg:pr-[12vw] space-y-[3vw] lg:space-y-[2.5vw]">
            
            {/* Horizontal Social Links Bar */}
            <div className="flex flex-wrap  items-center pt-[5vw] md:pt-[3.5vw] ml-[3vw]  gap-[1.5vw] sm:gap-[2vw] md:gap-[2.5vw] text-[1.1vw] sm:text-[1vw] md:text-[0.88vw] font-medium text-white">
              {/* Facebook */}
              <a href="#" className="flex items-center gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="ic:baseline-facebook" className="text-[1.3vw] sm:text-[1.1vw] md:text-[1.3vw] mt-[0.3vw]" />
                <span  className='text-[1.3vw] sm:text-[1.1vw] md:text-[1.2vw]'>Facebook</span>
                 <Icon icon="akar-icons:arrow-up-right" className="text-[0.9vw] sm:text-[0.8vw] md:text-[1.2vw] mt-[0.3vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>

              <span className="text-[#ffffff] font-light text-[2vw]">|</span>

              {/* Instagram */}
              <a href="#" className="flex items-center gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="ri:instagram-line" className="text-[1.3vw] sm:text-[1.1vw] md:text-[1.3vw] mt-[0.3vw]" />
                <span  className='text-[1.3vw] sm:text-[1.1vw] md:text-[1.2vw]'>Instagram</span>
                 <Icon icon="akar-icons:arrow-up-right" className="text-[0.9vw] sm:text-[0.8vw] md:text-[1.2vw] mt-[0.3vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>

              <span className="text-[#ffffff] font-light text-[2vw]">|</span>

              {/* LinkedIn */}
              <a href="#" className="flex items-center gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="mdi:linkedin" className="text-[1.3vw] sm:text-[1.1vw] md:text-[1.3vw] mt-[0.3vw]" />
                <span  className='text-[1.3vw] sm:text-[1.1vw] md:text-[1.2vw]'>Linked in</span>
                 <Icon icon="akar-icons:arrow-up-right" className="text-[0.9vw] sm:text-[0.8vw] md:text-[1.2vw] mt-[0.3vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>

              <span className="text-[#ffffff] font-light text-[2vw]">|</span>

              {/* YouTube */}
              <a href="#" className="flex items-center gap-[0.5vw] hover:text-[#f15a24] transition-colors group">
                <Icon icon="mdi:youtube" className="text-[1.3vw] sm:text-[1.1vw] md:text-[1.3vw] mt-[0.3vw]" />
                <span className='text-[1.3vw] sm:text-[1.1vw] md:text-[1.2vw]'>YouTube</span>
                <Icon icon="akar-icons:arrow-up-right" className="text-[0.9vw] sm:text-[0.8vw] md:text-[1.2vw] mt-[0.3vw] text-[#989898] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </a>
            </div>

            {/* 3 Link Columns Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 w-[54vw] ml-[4vw] gap-[2vw] text-[1vw] sm:text-[0.9vw] md:text-[0.78vw]">
              
              {/* Column 1: Main Pages */}
              <div className="flex flex-col space-y-[0.7vw]">
                <Link to="/" className="text-[#b0b0b0] hover:text-white underline transition-colors">Home</Link>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Features</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Templates</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Explore</a>
                <a href="#" className="text-[#b0b0b0] hover:text-white underline transition-colors">Pricing</a>
              </div>

              {/* Column 2: Contact Info */}
              <div className="flex flex-col space-y-[0.7vw]">
                <a href="mailto:info@flipibook-o.com" className="text-[#b0b0b0] hover:text-white underline transition-colors">
                  info@flipibook-o.com
                </a>
                <a href="tel:+917530025147" className="text-[#b0b0b0] hover:text-white underline transition-colors">
                  +91 75300 25147
                </a>
              </div>

              {/* Column 3: Resource Links */}
              <div className="flex flex-col space-y-[0.7vw]">
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
            className="absolute top-0 right-0 w-[9vw] sm:w-[7vw] md:w-[9vw] h-[13vw] sm:h-[12.5vw] md:h-[15vw] bg-[#EA7233] hover:bg-[#e04d19] text-white flex flex-col justify-between p-[1.2vw] transition-all duration-300 group shadow-lg z-20 cursor-pointer"
          >
            {/* Arrow Top Right */}
            <div className="flex justify-center ">
             
                <Icon icon="bi:arrow-up-right" className="text-[7vw] sm:text-[3vw] md:text-[5vw] "  />
              
            </div>

            {/* Text Bottom Left */}
            <div className="text-[1.2vw] sm:text-[1.05vw] md:text-[1.5vw] font-medium text-center  uppercase ">
              LET’S <br />
              TALK
            </div>
          </a>

        </div>

      </div>

      {/* Giant Watermark Background Text "FLIPIBOOK" */}
      <div className="w-full relative overflow-hidden select-none pointer-events-none ">
        <h1 className="text-[15vw] md:text-[14vw] font-black text-white/[0.04] text-center tracking-[0.02em] leading-none uppercase  whitespace-nowrap">
          FLIPIBOOK
        </h1>
      </div>

      {/* Bottom Copyright & Legal Policy Bar */}
      <div className="w-full  py-[1.2vw] px-[3vw] relative z-10 bg-[#222222]">
        <div className="max-w-[94vw] mx-auto flex flex-col sm:flex-row items-center justify-between gap-[1vw] text-[0.95vw] sm:text-[0.85vw] md:text-[0.72vw] text-[#fafafa]">
          
          {/* Copyright Left */}
          <div>
            Copyright © 2025 <a href="#" className="underline text-gray-200 hover:text-white">Fisto Tech Private Limited</a>. All Rights Reserved.
          </div>

          {/* Legal Links Right */}
          <div className="flex items-center gap-[1vw]">
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
