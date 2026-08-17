import React from 'react';
import { Pencil, Info, Phone, User, Building, MapPin, BarChart2 } from 'lucide-react';

const Profile = () => {
  const mockFlipbooks = [
    { id: 1, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 4, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 5, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 6, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 7, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 8, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
  ];

  return (
    <div className="flex flex-col gap-[2vw] max-w-[80vw] mx-auto h-full">
      
      {/* Top Banner and Profile Info Area */}
      <div className="relative w-full rounded-[1.5vw] bg-white shadow-sm pb-[2vw]">
        
        {/* Banner Image */}
        <div className="h-[15vw] w-full rounded-t-[1.5vw] overflow-hidden bg-gradient-to-r from-teal-200 via-emerald-200 to-teal-100 relative">
          <div className="absolute top-[1vw] right-[1vw]">
            <button className="bg-black/20 hover:bg-black/40 text-white p-[0.5vw] rounded-full backdrop-blur-sm transition-colors">
              <Pencil size="1.2vw" />
            </button>
          </div>
          {/* Decorative wave graphic can be added here as SVG or background pattern */}
        </div>

        {/* Profile Details (Overlapping Banner) */}
        <div className="px-[3vw] flex flex-col md:flex-row gap-[2vw]">
          
          {/* Avatar column */}
          <div className="flex flex-col items-center -mt-[6vw] relative z-10 w-[20vw] flex-shrink-0">
            <div className="relative w-[12vw] h-[12vw] rounded-full border-4 border-white shadow-lg bg-teal-100 overflow-hidden">
               <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
               />
               <button className="absolute bottom-[1vw] right-[1vw] bg-white p-[0.4vw] rounded-full shadow-md hover:bg-gray-50 text-gray-700">
                 <Pencil size="1vw" />
               </button>
            </div>
            
            <h1 className="text-[1.8vw] font-bold text-gray-900 mt-[1vw]">Luffy</h1>
            <div className="flex items-center gap-[0.5vw] text-[0.9vw] text-gray-500 mt-[0.2vw]">
              <span className="w-[1vw] h-[1vw] bg-green-500 rounded-full inline-block flex items-center justify-center">
                 <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              luffyonepiece@gmail.com
            </div>
          </div>

          {/* Action Buttons Column */}
          <div className="flex-1 flex justify-start items-end pb-[1vw] gap-[1vw]">
            <button className="px-[1.5vw] py-[0.5vw] border border-gray-300 rounded-full text-[0.9vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Your IDC
            </button>
            <button className="px-[1.5vw] py-[0.5vw] border border-gray-200 rounded-full text-[0.9vw] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              Edit Profile
            </button>
            <button className="px-[1.5vw] py-[0.5vw] border border-gray-200 rounded-full text-[0.9vw] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              Activity
            </button>
          </div>

        </div>
      </div>

      {/* Two Column Layout for the rest */}
      <div className="flex gap-[2vw] h-full">
        
        {/* Left Column - Personal Info Details */}
        <div className="w-[22vw] flex-shrink-0 flex flex-col gap-[1.5vw]">
          
          <div className="bg-white rounded-[1.5vw] p-[1.5vw] shadow-sm">
             <h3 className="flex items-center gap-[0.5vw] text-[1vw] font-semibold text-gray-700 mb-[0.8vw]">
               <Info size="1.2vw" /> About
             </h3>
             <p className="text-[0.85vw] text-gray-500 leading-relaxed">
               I'm going to be the King of the Pirates — that's my dream, and I'm never giving up on it. I love adventure, freedom, and good food (especially meat). I may not be the smartest, but I always trust my instincts and fight for what I believe in.
             </p>
          </div>

          <div className="bg-white rounded-[1.5vw] p-[1.5vw] shadow-sm flex flex-col gap-[1.5vw]">
             
             <div>
               <h3 className="flex items-center gap-[0.5vw] text-[1vw] font-semibold text-gray-700 mb-[0.3vw]">
                 <Phone size="1vw" /> Contact Number
               </h3>
               <p className="text-[0.85vw] text-gray-500">6383319976</p>
             </div>

             <div className="h-[1px] bg-gray-100 w-full"></div>

             <div>
               <h3 className="flex items-center gap-[0.5vw] text-[1vw] font-semibold text-gray-700 mb-[0.3vw]">
                 <User size="1vw" /> Gender
               </h3>
               <p className="text-[0.85vw] text-gray-500">Male</p>
             </div>

             <div className="h-[1px] bg-gray-100 w-full"></div>

             <div>
               <h3 className="flex items-center gap-[0.5vw] text-[1vw] font-semibold text-gray-700 mb-[0.3vw]">
                 <Building size="1vw" /> Company Name
               </h3>
               <p className="text-[0.85vw] text-gray-500">6383319976</p>
             </div>

             <div className="h-[1px] bg-gray-100 w-full"></div>

             <div>
               <h3 className="flex items-center gap-[0.5vw] text-[1vw] font-semibold text-gray-700 mb-[0.3vw]">
                 <MapPin size="1vw" /> Address
               </h3>
               <p className="text-[0.85vw] text-gray-500">Not provided</p>
             </div>

          </div>

        </div>

        {/* Right Column - Your Interactive Digital catalog */}
        <div className="flex-1 bg-white rounded-[1.5vw] p-[2vw] shadow-sm">
          
          <h2 className="text-[1.4vw] font-bold text-gray-900 mb-[1.5vw]">
            Your Interactive Digital catalog
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1.5vw]">
            {mockFlipbooks.map((book) => (
              <div key={book.id} className="border border-gray-200 rounded-[1vw] overflow-hidden group hover:shadow-md transition-shadow">
                
                {/* Book Image */}
                <div className="relative h-[14vw] bg-[#E8D4C8] overflow-hidden flex items-center justify-center p-[1vw]">
                  <img 
                    src={book.image} 
                    alt={book.name}
                    className="w-full h-full object-cover rounded shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-[0.5vw] right-[0.5vw] bg-black/40 backdrop-blur-sm text-white text-[0.6vw] px-[0.4vw] py-[0.1vw] rounded">
                    {book.pages} Pages
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-[1vw]">
                  <h4 className="text-[0.9vw] font-bold text-gray-900 truncate">
                    {book.name}
                  </h4>
                  <p className="text-[0.7vw] text-gray-500 mt-[0.2vw] mb-[0.8vw] line-clamp-2">
                    Bring your content to life with a real interactive experience.
                  </p>
                  <div className="flex justify-end">
                    <button className="bg-gray-900 text-white p-[0.4vw] rounded-full hover:bg-gray-700 transition-colors">
                      <BarChart2 size="1vw" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
