import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import heroBg from '../assets/About/Hero.png';
import heroOne from '../assets/About/Hero_1.png';
import secondOne from '../assets/About/second_1.png';
import secondTwo from '../assets/About/second_2.png';
import secondThree from '../assets/About/second_3.png';
import thirdOne from '../assets/About/third_1.png';
import fourthOne from '../assets/About/fourth_1.png';
import fourthTwo from '../assets/About/fourth_2.png';
import fourthThree from '../assets/About/fourth_3.png';
import fourthFour from '../assets/About/fourth_4.png';

const About = () => {
    const controls = useAnimation();
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const sequence = async () => {
            // Wait for 0.8 seconds
            await new Promise(resolve => setTimeout(resolve, 800));
            // Animate to top
            await controls.start("scrolled");
            setHasAnimated(true);
        };
        sequence();
    }, [controls]);

    const variants = {
        initial: { 
            y: "0%", 
            scale: 1
        },
        scrolled: { 
            y: "-30%", 
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.8 } 
        }
    };

    const textVariants = {
        initial: { 
            y: "0%", 
            fontSize: "8vw",
            opacity: 1 
        },
        scrolled: { 
            y: "-115%", 
            fontSize: "8vw",
            opacity: 1,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.8 } 
        }
    };

    const cardVariants = {
        initial: { y: "100%" },
        scrolled: { 
            y: "10%", 
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.85 } 
        }
    };

    // Scroll container ref for the whole page
    const containerRef = useRef(null);

    // Scroll animation for "Our Values" section
    const valuesRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: valuesRef,
        container: containerRef,
        offset: ["start end", "end start"]
    });

    const [activeIndex, setActiveIndex] = useState(0);

    // Update active index based on scroll progress
    useEffect(() => {
        return scrollYProgress.onChange(latest => {
            if (latest < 0.25) setActiveIndex(0);
            else if (latest < 0.5) setActiveIndex(1);
            else if (latest < 0.75) setActiveIndex(2);
            else setActiveIndex(3);
        });
    }, [scrollYProgress]);

    // Dynamic Text Content based on scroll
    const messages = [
        "Powerful tools made simple. So anyone can create, edit, and publish without complexity.",
        "Fast, smooth, and responsive experiences that work seamlessly across all devices.",
        "Flexible design options that help you build unique, engaging, and visually rich content.",
        "Secure, reliable, and built to protect your data every step of the way."
    ];

    return (
        <div 
            ref={containerRef}
            className="w-full h-[92vh] overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[#e5e5e5] font-sans"
        >
            {/* Hero Section */}
            <motion.div 
                initial="initial"
                whileInView="scrolled"
                viewport={{ once: false, amount: 0.3 }}
                className="snap-start relative w-full h-[92vh] bg-black overflow-hidden flex items-center justify-center"
            >
                {/* Background Image with Black Overlay */}
                <motion.div 
                    variants={variants}
                    className="absolute inset-0 z-0"
                >
                    <img 
                        src={heroBg} 
                        alt="Hero Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                </motion.div>

                {/* Animated About Us Text */}
                <div className="relative z-30 text-center w-full pointer-events-none">
                    <motion.h1
                        variants={textVariants}
                        className="text-[8vw] font-bold text-white tracking-tight"
                    >
                        About Us
                    </motion.h1>
                </div>

                {/* Interactive Card Section - Slides In */}
                <motion.div 
                    variants={cardVariants}
                    className="absolute bottom-0 left-0 w-full z-20"
                >
                    <div className="w-full mx-auto bg-white rounded-t-[1.5vw] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] p-[5vw] px-[8vw] pb-[10vh]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[5vw] items-center">
                            <div className="space-y-[2.5vw]">
                                <div className="">
                                    <h3 className="text-[2vw] font-bold text-black leading-tight">
                                        We Transform Your Content Into
                                    </h3>
                                    <h2 className="text-[5vw] font-bold leading-tight tracking-tight">
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Interactive</span> <br />
                                        <span className="text-indigo-600">Experiences</span>
                                    </h2>
                                </div>

                                <p className="text-[1.1vw] text-black leading-relaxed font-medium max-w-[40vw]">
                                    IDC makes digital publishing simpler, smarter, and more visually engaging. 
                                    Whether it's a catalogue, brochure, or portfolio, we help brands present their 
                                    content beautifully and interactively.
                                </p>
                            </div>

                            {/* Visual Asset Area */}
                            <div className="relative flex justify-center lg:justify-end">
                                <motion.div 
                                    variants={{
                                        initial: { opacity: 0, x: 20 },
                                        scrolled: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 1.2 } }
                                    }}
                                    className="w-full"
                                >
                                    <img 
                                        src={heroOne} 
                                        alt="Interactive Experience" 
                                        className="w-full h-auto"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            {/* What We Do Section */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                className="snap-start w-full h-[92vh] bg-[#e5e5e5] flex flex-col justify-center px-[8vw] py-[5vh]"
            >
                <motion.div 
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
                    }}
                    className="flex justify-between items-center mb-[5vh]"
                >
                    <h2 className="text-[4vw] font-bold text-black tracking-tight">What We Do</h2>
                    <p className="text-[1.1vw] text-gray-600 max-w-[30vw] text-right font-medium leading-relaxed">
                        We create powerful digital experiences that go beyond standard tools, fully customized For your business needs
                    </p>
                </motion.div>

                <motion.div 
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { 
                            opacity: 1, 
                            transition: { staggerChildren: 0.2 } 
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-[2vw]"
                >
                    {/* Card 1 */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 40 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                        }}
                        className="bg-white p-[3vw] rounded-[0.5vw] shadow-sm flex flex-col items-start space-y-[1.5vw] h-full"
                    >
                        <div className="w-full flex justify-center">
                            <div className="w-[8vw] h-[8vw] flex items-center justify-center">
                                <img src={secondOne} alt="Catalogue" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="space-y-[1vw]">
                            <h3 className="text-[1.8vw] font-bold text-black leading-tight">
                                Custom Interactive <br /> Digital Catalogues
                            </h3>
                            <p className="text-[0.9vw] text-gray-500 leading-relaxed font-normal text-left">
                                We design and develop fully customized IDC solutions tailored to your business. <br /><br />
                                Beyond basic tools, we build advanced catalogues with rich features, smooth performance, and a premium user experience.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 40 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                        }}
                        className="bg-white p-[3vw] rounded-[0.5vw] shadow-sm flex flex-col items-start space-y-[1.5vw] h-full"
                    >
                        <div className="w-full flex justify-center">
                            <div className="w-[8vw] h-[8vw] flex items-center justify-center">
                                <img src={secondTwo} alt="3D Experience" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="space-y-[1vw]">
                            <h3 className="text-[1.8vw] font-bold text-black leading-tight">
                                3D & Interactive <br /> Experiences
                            </h3>
                            <p className="text-[0.9vw] text-gray-500 leading-relaxed font-normal text-left">
                                We create immersive 3D models, animations, and interactive visuals that bring your content to life. <br /><br />
                                From product showcases to real-time interactions, everything is crafted for a modern digital experience.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 40 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                        }}
                        className="bg-white p-[3vw] rounded-[0.5vw] shadow-sm flex flex-col items-start space-y-[1.5vw] h-full"
                    >
                        <div className="w-full flex justify-center">
                            <div className="w-[8vw] h-[8vw] flex items-center justify-center">
                                <img src={secondThree} alt="Web Solutions" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="space-y-[1vw]">
                            <h3 className="text-[1.8vw] font-bold text-black leading-tight">
                                Web, App & Creative <br /> Solutions
                            </h3>
                            <p className="text-[0.9vw] text-gray-500 leading-relaxed font-normal text-left">
                                We build high-quality websites, mobile apps, and animated experiences. <br /><br />
                                From 3D-based websites to explainer videos, we deliver complete digital solutions that elevate your brand.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
            {/* Why We Built IDC Section */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                className="snap-start w-full h-[92vh] bg-white flex flex-col justify-center px-[4vw] py-[5vh] relative"
            >
                <div className="grid grid-cols-[4fr_6fr] gap-[5vw] items-start">
                    {/* Left Column - 40% */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, x: -50 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                        }}
                        className="space-y-[3vw] text-justify"
                    >
                        <div className="space-y-[1vw]">
                            <h2 className="text-[5vw] font-[600] text-black leading-[1.2]">Why We <br /> Built IDC</h2>
                        </div>
                        
                        <div className="space-y-[1.5vw]">
                            <p className="text-[1.3vw] text-gray-500 leading-relaxed font-normal max-w-[30vw]">
                                Our goal is to blend <span className="font-bold text-gray-500">Simplicity</span> and <span className="font-bold text-gray-500">Innovation</span>. 
                                So anyone can create beautiful digital catalogues without technical skills.
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Column - 60% - Visual & Context */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, x: 50 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.2 } }
                        }}
                        className="relative"
                    >
                        {/* Top Context Text */}
                        <div className="absolute top-[4.5vw] -left-[0.5vw] z-10">
                            <p className="text-[1.3vw] text-gray-800 leading-relaxed font-medium max-w-[20vw]">
                                Traditional <span className="text-red-500 font-bold">PDF</span>'s feel outdated and hard to engage with.
                            </p>
                        </div>

                        {/* Large Visual Image */}
                        <div className="relative z-0">
                            <img 
                                src={thirdOne} 
                                alt="Why IDC" 
                                className="w-full h-auto"
                            />
                        </div>

                        {/* Bottom Context Text */}
                        <div className="absolute bottom-[2vw] right-0 z-10 text-right">
                            <p className="text-[1.3vw] text-gray-800 leading-relaxed font-medium max-w-[25vw]">
                                We created <span className="text-blue-600 font-bold">IDC</span> to give businesses a better way to present products, services, and ideas.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Signature Quote - Out of Left/Right Grid */}
                <motion.div 
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }
                    }}
                    className="mt-[5vw]"
                >
                    <p className="text-[1.1vw] font-semibold text-blue-900 leading-relaxed">
                        "Better Way to Present. Smarter Way to Engage."
                    </p>
                </motion.div>
            </motion.div>
            {/* Our Values Section - Balanced for Scrollytelling Sequence */}
            <div 
                ref={valuesRef}
                className="w-full h-[450vh] relative bg-white"
            >
                {/* Internal Snap Points for Stepped Scrolling */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="snap-start h-[112.5vh]"></div>
                    <div className="snap-start h-[112.5vh]"></div>
                    <div className="snap-start h-[112.5vh]"></div>
                    <div className="snap-start h-[112.5vh]"></div>
                </div>

                {/* Sticky Content Wrapper */}
                <div className="sticky top-0 w-full h-[92vh] flex flex-col justify-center px-[4vw] py-[5vh] overflow-hidden bg-white">
                    {/* Header Area */}
                    <div className="flex justify-between items-start mb-[8vh]">
                        {/* Left Decorative Bar & Text */}
                        <div className="flex items-center space-x-[2vw]">
                            <motion.div 
                                initial={{ scaleY: 0 }}
                                whileInView={{ scaleY: 1 }}
                                transition={{ duration: 0.8 }}
                                className="w-[0.8vw] h-[12vh] bg-red-600 origin-top flex-shrink-0"
                            ></motion.div>
                                <AnimatePresence mode="wait">
                                    <motion.h3 
                                    key={activeIndex}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-[1.1vw] font-medium text-black max-w-[35vw] leading-tight"
                                >
                                    {messages[activeIndex]}
                                </motion.h3>
                            </AnimatePresence>
                            
                        </div>

                        {/* Right Aligned Title */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-right space-y-[1.5vw]"
                        >
                            <h2 className="text-[6vw] font-[600] text-black leading-none tracking-tight">Our Values</h2>
                            <p className="text-[1.2vw] text-gray-500 font-medium">
                                The principles that shape how we <span className="font-semibold text-gray-700">Design</span>, <span className="font-semibold text-gray-700">Build</span>, 
                                <br /> and <span className="font-semibold text-gray-700">Deliver</span> every experience.
                            </p>
                        </motion.div>
                    </div>

                    {/* Values sequence Grid */}
                    <div className="grid grid-cols-4 max-w-[85vw] mx-auto gap-0 items-center relative">
                        {/* Value 1 - Simplicity */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 0 ? 1.2 : 1,
                                zIndex: activeIndex === 0 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative aspect-square flex flex-col text-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-[#544eff]"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 0 ? 1 : 0 }}
                                src={fourthOne} 
                                alt="Simplicity" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-75" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 0 ? 0.3 : 0 }}
                                className="absolute inset-0 bg-indigo-900 z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 0 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 0 ? "flex-end" : "center",
                                    textAlign: activeIndex === 0 ? "left" : "center",
                                    padding: activeIndex === 0 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 0 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600] leading-tight">Simplicity</h3>
                                <p className="text-[0.9vw] font-medium opacity-90 leading-relaxed max-w-[15vw]">Easy tools designed for everyone.</p>
                            </motion.div>
                        </motion.div>

                        {/* Value 2 - Performance */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 1 ? 1.2 : 1,
                                zIndex: activeIndex === 1 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative bg-[#d00000] aspect-square flex flex-col text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 1 ? 1 : 0 }}
                                src={fourthTwo} 
                                alt="Performance" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-90" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 1 ? 0.2 : 0 }}
                                className="absolute inset-0 bg-red-900 z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 1 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 1 ? "flex-end" : "center",
                                    textAlign: activeIndex === 1 ? "left" : "center",
                                    padding: activeIndex === 1 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 1 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600]">Performance</h3>
                                <p className="text-[0.9vw] font-medium opacity-90">Smooth, fast, and responsive on <br /> every device</p>
                            </motion.div>
                        </motion.div>

                        {/* Value 3 - Creativity */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 2 ? 1.2 : 1,
                                zIndex: activeIndex === 2 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative bg-[#3a418b] aspect-square flex flex-col text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 2 ? 1 : 0 }}
                                src={fourthThree} 
                                alt="Creativity" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-90" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 2 ? 0.4 : 0 }}
                                className="absolute inset-0 bg-[#313886] z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 2 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 2 ? "flex-end" : "center",
                                    textAlign: activeIndex === 2 ? "left" : "center",
                                    padding: activeIndex === 2 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 2 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600]">Creativity</h3>
                                <p className="text-[0.9vw] font-medium opacity-90">Endless customization <br /> for unique visuals</p>
                            </motion.div>
                        </motion.div>

                        {/* Value 4 - Trust */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 3 ? 1.2 : 1,
                                zIndex: activeIndex === 3 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative bg-[#5a9199] aspect-square flex flex-col text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 3 ? 1 : 0 }}
                                src={fourthFour} 
                                alt="Trust" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-90" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 3 ? 0.4 : 0 }}
                                className="absolute inset-0 bg-[#60919a] z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 3 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 3 ? "flex-end" : "center",
                                    textAlign: activeIndex === 3 ? "left" : "center",
                                    padding: activeIndex === 3 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 3 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600]">Trust</h3>
                                <p className="text-[1vw] font-medium opacity-90">Your data is safe and <br /> protected</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
