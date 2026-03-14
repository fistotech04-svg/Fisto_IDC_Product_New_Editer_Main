import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, Video, BookOpen, ChevronDown } from 'lucide-react';
import HomeBg from '../assets/images/home_bg.png';
import BookSelf from '../assets/images/book_self1.png';

import CreateFlipbookModal from '../components/CreateFlipbookModal';

const categories = [
  { name: 'Most Popular Books', active: true },
  { name: 'Advancers', active: false },
  { name: 'Catalogs', active: false },
  { name: 'Broachers', active: false },
  { name: 'Education', active: false },
  { name: 'Story', active: false },
  { name: 'Motivation', active: false },
  { name: 'Advancers', active: false },
];

const books = [
  { id: 1, title: 'Letting Go of Affirmations', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+1' },
  { id: 2, title: 'Introduction to Krav Maga', rating: 1.5, pages: 28, color: 'red', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+2' },
  { id: 3, title: 'Think & Grow Rich', rating: 2.8, pages: 28, color: 'yellow', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+3' },
  { id: 4, title: 'High Performance Habits', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+4' },
  { id: 5, title: 'The 7 Habits of Highly Effective People', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+5' },
  { id: 6, title: 'Rich Dad Poor Dad', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+6' },
    { id: 7, title: 'Letting Go of Affirmations', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+1' },
  { id: 8, title: 'Introduction to Krav Maga', rating: 1.5, pages: 28, color: 'red', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+2' },
  { id: 9, title: 'Think & Grow Rich', rating: 2.8, pages: 28, color: 'yellow', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+3' },
  { id: 10, title: 'High Performance Habits', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+4' },
  { id: 11, title: 'The 7 Habits of Highly Effective People', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+5' },
  { id: 12, title: 'Rich Dad Poor Dad', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+6' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Most Popular Books');
  const [offsetY, setOffsetY] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateFlipbook = () => {
    setIsCreateModalOpen(true);
  };

  const handleUploadPDF = (files) => {
    console.log("Upload PDF Clicked", files);
    setIsCreateModalOpen(false);
  };

  const handleUseTemplate = (templateData) => {
    console.log("Use Template Clicked", templateData);
    setIsCreateModalOpen(false);
    if (templateData) {
        navigate('/editor', { state: templateData });
    }
  };

  // Parallax / Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
 <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden pt-[8vh]">
      
      {/* Hero Section */}
      <div className="relative w-full overflow-visible bg-black bg-cover bg-center" >

        {/* Curved Background Shape with Parallax Image */}
        <div 
          className="absolute top-0 left-0 w-full h-[40vw] z-10 overflow-hidden"
        >
             {/* The Shape Container (Mask) */}
             <div className="w-[120%] h-[100%] absolute top-0 -left-[10%] rounded-b-[0%] overflow-hidden transform origin-top scale-x-120">
                  {/* The Moving Image */}
                  <img 
                    src={HomeBg} 
                    alt="Hero Background"
                    className="absolute inset-0 w-full h-[140%] object-contain"
                  />
             </div>
        </div>

        <div className="max-w-[85vw] mx-auto py-[4vw] flex items-center relative z-10">
            {/* Left Content */}
            <div className="w-full md:w-2/3 lg:w-2/3 text-white z-20">
                <h1 className="text-[2.5vw] font-semibold leading-tight mb-[1vw]">
                    Create Interactive Flipbooks In Seconds
                </h1>
                <p className="text-[1.125vw] text-gray-300 mb-[2vw] max-w-[32vw] leading-relaxed font-light">
                    Upload any PDF and instantly convert it into a smooth, interactive flipbook. Zoom, search, full screen, and share everything your viewers need in one place.
                </p>
                <div className="flex flex-wrap gap-[1vw]">
                    <button 
                        onClick={handleCreateFlipbook}
                        className="px-[1.5vw] py-[0.75vw] bg-white text-[#4c5add] cursor-pointer rounded-[0.5vw] font-semibold shadow hover:bg-gray-50 transition-all flex items-center gap-[0.5vw] text-[1vw]"
                    >
                        <BookOpen size="1.25vw" />
                        Create Flipbook
                    </button>
                    <button className="px-[1.5vw] py-[0.75vw] bg-[#4c5add] text-white cursor-pointer rounded-[0.5vw] font-semibold shadow hover:bg-[#3f4bc0] transition-all flex items-center gap-[0.5vw] text-[1vw]">
                        <Video size="1.25vw" />
                        Demo video
                    </button>
                </div>
            </div>

            {/* Right Content - Bookshelf */}
            {/* Using absolute positioning to hang off the right side as per design */}
            <div className="hidden lg:block absolute -right-[5vw] top-[2.5vw] w-[22vw] z-20">
                 {/* Pointer Text */}
                 <div className="absolute -top-[1.25vw] -left-[2.5vw] text-right animate-pulse">
                     <p className="text-white font-medium mb-[0.25vw] text-[0.875vw]">Use Demo Book <br/> For Reference</p>
                     <div className="flex justify-end">
                        <svg width="3.75vw" height="1.875vw" viewBox="0 0 100 50" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 4">
                            <path d="M10 40 Q 60 10 90 20" />
                            <path d="M85 15 L 90 20 L 80 25" fill="none" strokeDasharray="0"/>
                        </svg>
                     </div>
                 </div>

                 {/* Bookshelf Image Placeholder */}
                 <div className="relative w-full h-[31.25vw] transition-transform duration-200 ease-out">
                     <div className="w-full h-full bg-contain bg-no-repeat bg-top drop-shadow-2xl"
                          style={{ backgroundImage: `url(${BookSelf})` }}
                     >
                        {/* Click to Edit Button on shelf */}
                        <div className="absolute top-[55%] -left-[2.5vw] bg-transparent text-white font-medium flex items-center gap-[0.5vw] cursor-pointer text-[1vw]">
                             <div className="w-[2vw] h-[2vw] rounded-full border border-white/50 flex items-center justify-center">
                                 <div className="w-[0.375vw] h-[0.375vw] bg-white rounded-full"></div>
                             </div>
                             Click to Edit
                        </div>
                     </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="max-w-[85vw] mx-auto px-[2vw] mt-[1vw] relative z-10">
          <div className="flex flex-col md:flex-row gap-[1vw] mb-[2vw]">
                {/* Search Bar */}
                <div className="relative w-full md:w-[20vw] group">
                    <Search className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-400" size="1.125vw" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-[2.5vw] pr-[1vw] py-[0.625vw] rounded-full border border-gray-300 text-[0.875vw] focus:outline-none focus:border-[#4c5add] transition-all bg-white"
                    />
                </div>
                {/* Filter Button */}
                <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.625vw] rounded-full border border-gray-300 text-[#4c5add] text-[0.875vw] font-semibold bg-white hover:bg-gray-50 transition-all">
                    <SlidersHorizontal size="1.125vw" />
                    Filter
                </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-[0.75vw] overflow-x-auto scrollbar-hide mb-[2vw] pb-[0.5vw]">
                <span className="font-semibold text-black text-[0.9vw] whitespace-nowrap mr-[0.5vw]">Categories :</span>
                <button className="px-[1.5vw] py-[0.7vw] rounded-full bg-black text-white text-[0.7vw] font-semibold shadow-md whitespace-nowrap">
                    Most Popular Books
                </button>
                {categories.slice(1).map((cat, idx) => (
                    <button 
                        key={idx}
                        className="px-[1.5vw] py-[0.7vw] rounded-full bg-white border border-gray-100 text-gray-600 text-[0.7vw] font-medium hover:bg-gray-50 shadow-sm whitespace-nowrap transition-colors"
                    >
                        {cat.name}
                    </button>
                ))}
          </div>

          {/* Section Title */}
          <h2 className="text-[1.5vw] font-bold text-black mb-[1.5vw]">Most Popular Books</h2>
      </div>

      {/* Light Blue Card Container area for Grid - REFACTORED DESIGN */}
      <div className="mx-[4vw] bg-gray-50/50 py-[2vw] rounded-[2vw] px-[1.5vw] my-[1vw] min-h-screen relative z-10 overflow-hidden border border-gray-100">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-[30vw] h-[30vw] bg-purple-100/30 rounded-full blur-3xl -z-10"></div>
         <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-blue-100/30 rounded-full blur-3xl -z-10"></div>

         <div className="max-w-[85vw] mx-auto relative z-10">
             {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-[1.25vw] mb-[2vw]">
                {books.map((book) => (
                    <div key={book.id} className="relative group perspective-1000">
                        <div className="relative bg-white rounded-[1vw] p-[0.75vw] shadow-md hover:shadow-xl transition-all duration-500 ease-out transform group-hover:-translate-y-[0.35vw] border border-gray-100">
                            
                            {/* Image Container */}
                            <div className="relative w-full aspect-[4/5] mb-[0.75vw] rounded-[0.75vw] overflow-hidden bg-gray-50">
                                 {/* Book Cover */}
                                 <img 
                                    src={book.image} 
                                    alt={book.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                 
                                 {/* Overlay on hover */}
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>

                                 {/* Rating Badge - Absolute Top Right */}
                                 <div className="absolute top-[0.5vw] right-[0.5vw] bg-white/90 backdrop-blur-sm px-[0.45vw] py-[0.15vw] rounded-full text-[0.6vw] font-bold text-gray-800 flex items-center gap-[0.2vw] shadow-sm">
                                     {book.rating} <Star size="0.6vw" className="text-yellow-400 fill-yellow-400" />
                                 </div>
                            </div>
                            
                            {/* Content */}
                            <div className="space-y-[0.35vw]">
                                <h3 className="text-[0.85vw] font-semibold text-gray-900 line-clamp-1 group-hover:text-[#4c5add] transition-colors" title={book.title}>
                                    {book.title || 'Untitled Flipbook'}
                                </h3>
                                
                                <div className="flex items-center justify-between text-[0.65vw] text-gray-500 font-medium">
                                    <span className="flex items-center gap-[0.2vw]">
                                        <BookOpen size="0.75vw" />
                                        {book.pages} Pages
                                    </span>
                                    <span className={`px-[0.4vw] py-[0.1vw] rounded-full text-[0.55vw] font-bold bg-green-100 text-green-700`}>
                                        FREE
                                    </span>
                                </div>
                            </div>

                            {/* Hover Action Button */}
                            <div className="absolute bottom-[1vw] right-[1vw] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[0.35vw] group-hover:translate-y-0">
                                <button className="w-[1.85vw] h-[1.85vw] bg-[#4c5add] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#3f4bc0] transition-colors">
                                    <BookOpen size="0.9vw" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View More Button - Centered and Modern */}
            <div className="flex justify-center mt-[1.5vw] relative">
                 <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200"></div>
                 </div>
                 <div className="relative">
                     <button className="flex items-center gap-[0.5vw] pl-[1.5vw] pr-[0.5vw] py-[0.5vw] bg-white text-[#4c5add] border border-[#4c5add]/20 rounded-full font-bold shadow-sm hover:shadow-md hover:border-[#4c5add] transition-all group text-[0.85vw]">
                         View All Books
                         <div className="w-[1.85vw] h-[1.85vw] bg-[#4c5add]/10 rounded-full flex items-center justify-center group-hover:bg-[#4c5add] group-hover:text-white transition-all duration-300">
                            <ChevronDown size="1vw" />
                         </div>
                     </button>
                 </div>
            </div>
         </div>
      </div>

    </div>
     <CreateFlipbookModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUpload={handleUploadPDF}
        onTemplate={handleUseTemplate}
     />
    </>  
  );
}