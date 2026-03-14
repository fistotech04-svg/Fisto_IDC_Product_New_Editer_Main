import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Edit2, Briefcase, Info, RefreshCw, Check, Upload, Trash2, User, Calendar, MapPin, ChevronDown, ChevronLeft, ChevronRight, Home, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Icon } from '@iconify/react';

const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [placement, setPlacement] = useState('bottom');
  const triggerRef = useRef(null);

  useEffect(() => {
     const handleScroll = () => { if(isOpen) setIsOpen(false); };
     window.addEventListener('scroll', handleScroll, true);
     window.addEventListener('resize', handleScroll);
     return () => {
         window.removeEventListener('scroll', handleScroll, true);
         window.removeEventListener('resize', handleScroll);
     };
  }, [isOpen]);

  const toggleDropdown = () => {
      if (!isOpen && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - rect.bottom;
          const dropdownApproxHeight = window.innerWidth * 0.15; 

          let topPos = rect.bottom + 4;
          let place = 'bottom';

          if (spaceBelow < dropdownApproxHeight && rect.top > dropdownApproxHeight) {
              topPos = rect.top - 4;
              place = 'top';
          }

          setCoords({
              top: topPos,
              left: rect.left,
              width: rect.width
          });
          setPlacement(place);
      }
      setIsOpen(!isOpen);
  };

  return (
    <>
      <div 
        ref={triggerRef}
        onClick={toggleDropdown}
        className={`bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] border ${isOpen ? 'border-[#6366f1] ring-2 ring-indigo-100' : 'border-transparent'} shadow-sm flex items-center justify-between cursor-pointer focus-within:border-indigo-300 transition-all group hover:border-indigo-300 relative`}
      >
        <span className={`text-[0.9vw] font-medium truncate ${value ? 'text-gray-700' : 'text-gray-400'}`}>
           {value || placeholder}
        </span>
        <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#6366f1]' : 'group-hover:text-[#6366f1]'}`} />
      </div>
      
      {isOpen && ReactDOM.createPortal(
        <>
           <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)}></div>
           <div 
             className="fixed bg-white rounded-[0.6vw] shadow-xl border border-gray-100 overflow-hidden z-[9999]"
             style={{ 
                 top: `${coords.top}px`, 
                 left: `${coords.left}px`, 
                 width: `${coords.width}px`,
                 transform: placement === 'top' ? 'translateY(-100%)' : 'none'
             }}
           >
             <div className="max-h-[12vw] overflow-y-auto custom-scrollbar p-[0.3vw]">
               {options.map((opt) => (
                  <div 
                    key={opt}
                    onClick={() => { onChange(opt); setIsOpen(false); }}
                    className={`px-[0.8vw] py-[0.4vw] rounded-[0.4vw] text-[0.9vw] cursor-pointer transition-colors mb-[0.1vw] ${value === opt ? 'bg-[#2563eb] text-white' : 'text-gray-700 hover:bg-[#eff6ff] hover:text-[#2563eb]'}`}
                  >
                    {opt}
                  </div>
               ))}
             </div>
           </div>
        </>,
        document.body
      )}
    </>
  );
};

const CustomDatePicker = ({ value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('days'); 
    const [displayDate, setDisplayDate] = useState(new Date()); 
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [placement, setPlacement] = useState('bottom');
    const triggerRef = useRef(null);

    const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
        const handleScroll = () => { if(isOpen) setIsOpen(false); };
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
     }, [isOpen]);

    const toggleOpen = () => {
         if (!isOpen && triggerRef.current) {
             const rect = triggerRef.current.getBoundingClientRect();
             const viewportHeight = window.innerHeight;
             const spaceBelow = viewportHeight - rect.bottom;
             const calendarHeight = window.innerWidth * 0.22;

             let topPos = rect.bottom + 4;
             let place = 'bottom';

             if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
                 topPos = rect.top - 4;
                 place = 'top';
             }

             setCoords({
                 top: topPos,
                 left: rect.left
             });
             setPlacement(place);
             setView('days');
             
             if (value) {
                 const [d, m, y] = value.split(' / ').map(Number);
                 if (d && m && y) {
                     setDisplayDate(new Date(y, m - 1, d));
                 }
             }
         }
         setIsOpen(!isOpen);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (view === 'days') setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
        else if (view === 'months') setDisplayDate(new Date(displayDate.getFullYear() - 1, displayDate.getMonth(), 1));
        else if (view === 'years') setDisplayDate(new Date(displayDate.getFullYear() - 12, displayDate.getMonth(), 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (view === 'days') setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
        else if (view === 'months') setDisplayDate(new Date(displayDate.getFullYear() + 1, displayDate.getMonth(), 1));
        else if (view === 'years') setDisplayDate(new Date(displayDate.getFullYear() + 12, displayDate.getMonth(), 1));
    };

    const handleHeaderClick = (e) => {
        e.stopPropagation();
        if (view === 'days') setView('months');
        else if (view === 'months') setView('years');
    };

    const selectDate = (day) => {
        const dStr = String(day).padStart(2, '0');
        const mStr = String(displayDate.getMonth() + 1).padStart(2, '0');
        const yStr = displayDate.getFullYear();
        onChange(`${dStr} / ${mStr} / ${yStr}`);
        setIsOpen(false);
    };

    const selectMonth = (monthIndex) => {
        setDisplayDate(new Date(displayDate.getFullYear(), monthIndex, 1));
        setView('days');
    };

    const selectYear = (year) => {
        setDisplayDate(new Date(year, displayDate.getMonth(), 1));
        setView('months');
    };

    const renderHeader = () => {
        let title = "";
        if (view === 'days') title = `${fullMonths[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
        else if (view === 'months') title = `${displayDate.getFullYear()}`;
        else if (view === 'years') {
            const startYear = Math.floor(displayDate.getFullYear() / 12) * 12;
            const endYear = startYear + 11;
            title = `${startYear} - ${endYear}`;
        }

        return (
            <div className="flex items-center justify-between mb-[1vw] px-[0.5vw]">
                <span 
                    onClick={handleHeaderClick}
                    className="text-[1vw] font-bold text-[#2563eb] cursor-pointer hover:bg-blue-50 px-[0.5vw] py-[0.2vw] rounded-[0.3vw] transition-colors"
                >
                    {title}
                </span>
                <div className="flex items-center gap-[0.5vw]">
                    <button onClick={handlePrev} className="p-[0.2vw] hover:bg-gray-100 rounded-full text-[#2563eb] transition-colors">
                        <ChevronLeft size="1vw" />
                    </button>
                    <button onClick={handleNext} className="p-[0.2vw] hover:bg-gray-100 rounded-full text-[#2563eb] transition-colors">
                        <ChevronRight size="1vw" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
        const startDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        
        return (
            <>
                <div className="grid grid-cols-7 mb-[0.5vw]">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-[0.7vw] font-medium text-gray-400">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-[0.4vw] gap-x-[0.2vw] place-items-center">
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-[1.8vw] h-[1.8vw]"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dStr = String(day).padStart(2, '0');
                        const mStr = String(displayDate.getMonth() + 1).padStart(2, '0');
                        const yStr = displayDate.getFullYear();
                        const fullDateStr = `${dStr} / ${mStr} / ${yStr}`;
                        const isSelected = value === fullDateStr;

                        return (
                            <button
                                key={day}
                                onClick={(e) => { e.stopPropagation(); selectDate(day); }}
                                className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full text-[0.8vw] font-medium transition-all
                                    ${isSelected ? 'bg-[#2563eb] text-white shadow-md' : 'text-gray-700 hover:bg-[#eff6ff] hover:text-[#2563eb]'}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    const renderMonths = () => {
        return (
            <div className="grid grid-cols-3 gap-[1vw] py-[0.5vw]">
                {monthsShort.map((m, i) => {
                    const isSelected = i === displayDate.getMonth();
                    return (
                        <button
                            key={m}
                            onClick={(e) => { e.stopPropagation(); selectMonth(i); }}
                            className={`py-[0.5vw] rounded-[1vw] text-[0.9vw] font-medium transition-all
                                ${isSelected ? 'bg-[#2563eb] text-white shadow-md' : 'text-gray-700 hover:bg-[#eff6ff] hover:text-[#2563eb]'}
                            `}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderYears = () => {
        const startYear = Math.floor(displayDate.getFullYear() / 12) * 12;
        const years = Array.from({ length: 12 }, (_, i) => startYear + i);

        return (
            <div className="grid grid-cols-3 gap-[1vw] py-[0.5vw]">
                {years.map((y) => {
                    const isSelected = y === displayDate.getFullYear();
                    return (
                        <button
                            key={y}
                            onClick={(e) => { e.stopPropagation(); selectYear(y); }}
                            className={`py-[0.5vw] rounded-[1vw] text-[0.9vw] font-medium transition-all
                                ${isSelected ? 'bg-[#2563eb] text-white shadow-md' : 'text-gray-700 hover:bg-[#eff6ff] hover:text-[#2563eb]'}
                            `}
                        >
                            {y}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <div 
                ref={triggerRef}
                onClick={toggleOpen}
                className={`bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] border ${isOpen ? 'border-[#6366f1] ring-2 ring-indigo-100' : 'border-transparent'} shadow-sm flex items-center justify-between cursor-pointer focus-within:border-indigo-300 transition-all group hover:border-indigo-300`}
            >
                <span className={`text-[0.9vw] font-medium truncate ${value ? 'text-gray-700' : 'text-gray-400'}`}>
                    {value || placeholder}
                </span>
                <Calendar size="0.8vw" className={`text-gray-400 transition-colors ${isOpen ? 'text-[#6366f1]' : 'group-hover:text-[#6366f1]'}`} />
            </div>

            {isOpen && ReactDOM.createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)}></div>
                    <div 
                        className="fixed bg-white rounded-[1.2vw] shadow-2xl border border-gray-100 p-[1.5vw] z-[9999] min-w-[20vw] flex flex-col"
                        style={{ 
                            top: `${coords.top}px`, 
                            left: `${coords.left}px`,
                            transform: placement === 'top' ? 'translateY(-100%)' : 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderHeader()}
                        <div className="flex-1">
                            {view === 'days' && renderDays()}
                            {view === 'months' && renderMonths()}
                            {view === 'years' && renderYears()}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};

const Profile = ({ activeSubTab = 'edit-profile' }) => {
  const [formData, setFormData] = useState({
     // Edit Profile
     gender: 'Male',
     dob: '',
     address1: '',
     address2: '',
     city: '',
     state: 'TAMIL NADU',
     country: 'INDIA',
     pincode: '',
     // Professional Details
     companyName: '',
     industry: 'Machinery Industry',
     website: 'www.website.com',
     companyPhone: '1234567890',
     workAddress1: '',
     workAddress2: '',
     workCity: '',
     workState: 'TAMIL NADU',
     workCountry: 'INDIA',
     workPincode: '',
     // Account Info
     oldPassword: '',
     newPassword: '',
     confirmPassword: ''
  });

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (activeSubTab === 'professional-details') {
      return (
        <div className="flex flex-col w-full h-full gap-[1.5vw]">
            {/* Header / Actions - Top Section */}
             <div className="flex justify-between items-end flex-shrink-0 mb-[0.5vw]">
                  <div className="flex flex-col">
                      <h3 className="text-[1.3vw] font-bold text-[#343868]">Professional Details</h3>
                      <p className="text-[0.7vw] text-gray-500">"This information helps personalize your flipbook experience and tailor features based on your role and industry."</p>
                  </div>
                  <div className="flex items-center gap-[0.8vw]">
                       <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] bg-[#6366f1] text-white rounded-[0.5vw] text-[0.8vw] font-bold hover:bg-[#4f46e5] transition-colors shadow-lg shadow-indigo-500/30">
                           <RefreshCw size="0.9vw" />
                           Reset
                       </button>
                       <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] bg-[#4CAF50] text-white rounded-[0.5vw] text-[0.8vw] font-bold hover:bg-[#45a049] transition-colors shadow-lg shadow-green-500/30">
                           <Check size="0.9vw" />
                           Save
                       </button>
                  </div>
             </div>

             {/* Grid */}
             <div className="grid grid-cols-2 gap-[1.5vw] flex-1 overflow-hidden min-h-0">
                  {/* Left: Company Details */}
                  <div className="bg-white/40 rounded-[1.5vw] p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar h-full">
                       <div className="flex items-center gap-[0.8vw] mb-[0.8vw]">
                           <Home className="text-gray-900" size="1.1vw" />
                           <h3 className="text-[1.1vw] font-bold text-gray-900">Company Details</h3>
                           <div className="flex-1 h-[0.1vh] bg-gray-400 opacity-50"></div>
                       </div>
                       
                       <div className="space-y-[1.5vw]">
                          <div className="space-y-[0.25vw]">
                              <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Company / Organization Name</label>
                              <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                 <input 
                                    type="text" 
                                    placeholder="Enter your Company / Organization Name" 
                                    className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                 />
                              </div>
                          </div>
                          <div className="space-y-[0.25vw]">
                              <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Industry Type</label>
                              <CustomDropdown 
                                 options={['Machinery Industry', 'Technology', 'Healthcare', 'Education', 'Finance']}
                                 value={formData.industry}
                                 onChange={(val) => handleChange('industry', val)}
                                 placeholder="Select Industry"
                              />
                          </div>
                          <div className="space-y-[0.25vw]">
                              <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Website Link</label>
                              <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                 <input 
                                    type="text" 
                                    placeholder="www.website.com" 
                                    className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                 />
                              </div>
                          </div>
                          <div className="space-y-[0.25vw]">
                              <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Company Contact Number</label>
                              <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                 <input 
                                    type="tel" 
                                    placeholder="1234567890" 
                                    className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                    value={formData.companyPhone}
                                    onChange={(e) => handleChange('companyPhone', e.target.value)}
                                 />
                              </div>
                          </div>
                       </div>
                  </div>

                  {/* Right: Address */}
                  <div className="bg-white/40 rounded-[1.5vw] p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar h-full">
                       <div className="flex items-center gap-[0.8vw] mb-[0.8vw]">
                           <MapPin className="text-gray-900" size="1.1vw" />
                           <h3 className="text-[1.1vw] font-bold text-gray-900">Address</h3>
                           <div className="flex-1 h-[0.1vh] bg-gray-400 opacity-50"></div>
                       </div>

                       <div className="space-y-[1.5vw]">
                           <div className="space-y-[0.25vw]">
                               <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Address Line 1</label>
                               <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                  <input 
                                    type="text" 
                                    placeholder="Enter your Full name" 
                                    className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" 
                                    value={formData.workAddress1}
                                    onChange={(e) => handleChange('workAddress1', e.target.value)}
                                  />
                               </div>
                           </div>
                           <div className="space-y-[0.25vw]">
                               <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Address Line 2</label>
                               <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                  <input 
                                    type="text" 
                                    placeholder="Enter your Full name" 
                                    className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                    value={formData.workAddress2}
                                    onChange={(e) => handleChange('workAddress2', e.target.value)}
                                  />
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-[1vw]">
                              <div className="space-y-[0.25vw]">
                                   <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">City</label>
                                   <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                      <input 
                                        type="text" 
                                        placeholder="Your City" 
                                        className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                        value={formData.workCity}
                                        onChange={(e) => handleChange('workCity', e.target.value)}
                                      />
                                   </div>
                               </div>
                               <div className="space-y-[0.25vw]">
                                   <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">State</label>
                                   <CustomDropdown 
                                     options={['TAMIL NADU', 'KERALA', 'KARNATAKA', 'MAHARASHTRA', 'DELHI']}
                                     value={formData.workState}
                                     onChange={(val) => handleChange('workState', val)}
                                     placeholder="Select State"
                                  />
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-[1vw]">
                              <div className="space-y-[0.25vw]">
                                   <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Country</label>
                                   <CustomDropdown 
                                     options={['INDIA', 'USA', 'UK', 'CANADA', 'AUSTRALIA']}
                                     value={formData.workCountry}
                                     onChange={(val) => handleChange('workCountry', val)}
                                     placeholder="Select Country"
                                  />
                               </div>
                               <div className="space-y-[0.25vw]">
                                   <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Pin Code</label>
                                   <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                                      <input 
                                        type="text" 
                                        placeholder="000 - 000" 
                                        className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                        value={formData.workPincode}
                                        onChange={(e) => handleChange('workPincode', e.target.value)}
                                      />
                                   </div>
                               </div>
                           </div>
                       </div>
                  </div>
             </div>
        </div>
      );
  }

  if (activeSubTab === 'account-info') {
      return (
         <div className="flex flex-col w-full h-full gap-[1.5vw]">
             {/* Header / Actions - Top Section */}
             <div className="flex justify-between items-end flex-shrink-0 mb-[0.5vw]">
                  <div className="flex flex-col">
                      <h3 className="text-[1.3vw] font-bold text-[#343868]">Account Info</h3>
                      <p className="text-[0.7vw] text-gray-500">"Manage your login details and keep your account secure."</p>
                  </div>
                  <div className="flex items-center gap-[0.8vw]">
                       <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] bg-[#6366f1] text-white rounded-[0.5vw] text-[0.8vw] font-bold hover:bg-[#4f46e5] transition-colors shadow-lg shadow-indigo-500/30">
                           <RefreshCw size="0.9vw" />
                           Reset
                       </button>
                       <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] bg-[#4CAF50] text-white rounded-[0.5vw] text-[0.8vw] font-bold hover:bg-[#45a049] transition-colors shadow-lg shadow-green-500/30">
                           <Check size="0.9vw" />
                           Change
                       </button>
                  </div>
             </div>

             {/* Grid */}
             <div className="grid grid-cols-2 gap-[1.5vw] flex-1 overflow-hidden min-h-0">
                  {/* Left: Account Details */}
                  <div className="bg-white/40 rounded-[1.5vw] p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar h-full">
                       <div className="flex items-center gap-[0.8vw] mb-[0.8vw]">
                           <Mail className="text-gray-900" size="1.1vw" />
                           <h3 className="text-[1.1vw] font-bold text-gray-900">Account Details</h3>
                           <div className="flex-1 h-[0.1vh] bg-gray-400 opacity-50"></div>
                       </div>
                       
                       <div className="flex flex-col gap-[1vw]">
                            <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Linked Email Address</label>
                            <div className="flex items-center gap-[1vw] bg-white p-[0.8vw] rounded-[0.8vw] shadow-sm w-full">
                                 <div className="flex items-center gap-[0.5vw] px-[0.6vw] py-[0.3vw] bg-gray-50 rounded-[0.4vw] shadow-inner border border-gray-100">
                                     <Icon icon="logos:google-gmail" width="1.2vw" height="1.2vw" />
                                     <span className="text-[0.8vw] font-bold text-gray-700">Gmail</span>
                                 </div>
                                 <span className="text-[0.9vw] font-medium text-gray-700">praveen1234@gmail.com</span>
                            </div>
                       </div>
                  </div>

                  {/* Right: Change Password */}
                  <div className="bg-white/40 rounded-[1.5vw] p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar h-full">
                       <div className="flex items-center gap-[0.8vw] mb-[0.8vw]">
                           <Lock className="text-gray-900" size="1.1vw" />
                           <h3 className="text-[1.1vw] font-bold text-gray-900">Change Password</h3>
                           <div className="flex-1 h-[0.1vh] bg-gray-400 opacity-50"></div>
                       </div>

                       <div className="space-y-[1.5vw]">
                            {/* Old Password */}
                            <div className="space-y-[0.25vw]">
                                <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Old Password</label>
                                <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm flex items-center justify-between border border-transparent focus-within:border-indigo-300 transition-all">
                                    <input 
                                       type={showOldPass ? "text" : "password"} 
                                       placeholder="Enter Password" 
                                       className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                       value={formData.oldPassword}
                                       onChange={(e) => handleChange('oldPassword', e.target.value)}
                                    />
                                    <button onClick={() => setShowOldPass(!showOldPass)} className="text-gray-400 hover:text-[#3b4190]">
                                        {showOldPass ? <EyeOff size="0.9vw" /> : <Eye size="0.9vw" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-[0.25vw]">
                                <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">New Password</label>
                                <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm flex items-center justify-between border border-transparent focus-within:border-indigo-300 transition-all">
                                    <input 
                                       type={showNewPass ? "text" : "password"} 
                                       placeholder="Enter new password" 
                                       className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                       value={formData.newPassword}
                                       onChange={(e) => handleChange('newPassword', e.target.value)}
                                    />
                                    <button onClick={() => setShowNewPass(!showNewPass)} className="text-gray-400 hover:text-[#3b4190]">
                                        {showNewPass ? <EyeOff size="0.9vw" /> : <Eye size="0.9vw" />}
                                    </button>
                                </div>
                            </div>

                            {/* Re-enter Password */}
                            <div className="space-y-[0.25vw]">
                                <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Re-Enter Password</label>
                                <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm flex items-center justify-between border border-transparent focus-within:border-indigo-300 transition-all">
                                    <input 
                                       type={showConfirmPass ? "text" : "password"} 
                                       placeholder="Re-Enter password" 
                                       className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400"
                                       value={formData.confirmPassword}
                                       onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                    />
                                    <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-gray-400 hover:text-[#3b4190]">
                                        {showConfirmPass ? <EyeOff size="0.9vw" /> : <Eye size="0.9vw" />}
                                    </button>
                                </div>
                            </div>
                       </div>
                  </div>
             </div>
        </div>
      );
  }

  // Default: Edit Profile
  return (
    <div className="flex flex-col w-full h-full gap-[1.5vw]">
      
      {/* Top Section: Profile Picture & Main Actions */}
      <div className="flex justify-between items-start flex-shrink-0">
          
          {/* Profile Picture Area */}
          <div className="flex items-center gap-[1.5vw]">
              <div className="w-[5.5vw] h-[5.5vw] rounded-[1vw] overflow-hidden shadow-lg border-[0.2vw] border-white flex-shrink-0">
                   <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" 
                      alt="Profile Large" 
                      className="w-full h-full object-cover"
                  />
              </div>
              <div className="flex flex-col">
                  <h3 className="text-[1.2vw] font-bold text-[#343868]">Profile Picture</h3>
                  <p className="text-[0.7vw] text-gray-600 mb-[0.5vw]">"Upload a profile photo to personalize your account."</p>
                  
                  <div className="flex gap-[0.8vw]">
                      <button className="flex items-center gap-[0.5vw] px-[1.2vw] py-[0.5vw] bg-[#6366f1] text-white rounded-[0.5vw] text-[0.8vw] font-bold shadow-md hover:bg-[#4f46e5] transition-colors">
                          <Upload size="0.8vw" />
                          Change
                      </button>
                      <button className="flex items-center gap-[0.5vw] px-[1.2vw] py-[0.5vw] bg-white text-[#FF4444] rounded-[0.5vw] text-[0.8vw] font-bold border border-red-100 hover:bg-red-50 transition-colors">
                          <Trash2 size="0.8vw" />
                          Remove
                      </button>
                  </div>
              </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-[0.8vw]">
               <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] bg-[#6366f1] text-white rounded-[0.5vw] text-[0.8vw] font-bold hover:bg-[#4f46e5] transition-colors shadow-lg shadow-indigo-500/30">
                   <RefreshCw size="0.9vw" />
                   Reset
               </button>
               <button className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.6vw] bg-[#4CAF50] text-white rounded-[0.5vw] text-[0.8vw] font-bold hover:bg-[#45a049] transition-colors shadow-lg shadow-green-500/30">
                   <Check size="0.9vw" />
                   Save
               </button>
          </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-2 gap-[1.5vw] flex-1 overflow-hidden min-h-0">
          
          {/* Left Column: Personal Details */}
          <div className="bg-white/40 rounded-[1.5vw] p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar h-full">
               
               {/* Personal Details Header */}
               <div className="flex items-center gap-[0.8vw] mb-[0.8vw]">
                   <User className="text-gray-900" size="1.1vw" />
                   <h3 className="text-[1.1vw] font-bold text-gray-900">Personal Details</h3>
                   <div className="flex-1 h-[0.1vh] bg-gray-400 opacity-50"></div>
               </div>
               
               {/* Inputs */}
               <div className="space-y-[0.65vw]">
                  <div className="space-y-[0.25vw]">
                      <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Full Name</label>
                      <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm border border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                         <input type="text" defaultValue="Praveen Kumar" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" />
                      </div>
                  </div>
                  <div className="space-y-[0.25vw]">
                      <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Email ID</label>
                      <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm border border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                         <input type="email" defaultValue="praveen1234@gmail.com" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" />
                      </div>
                  </div>
                  <div className="space-y-[0.25vw]">
                      <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Mobile Number</label>
                      <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm border border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                         <input type="tel" defaultValue="1234567890" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-[1vw]">
                      <div className="space-y-[0.25vw]">
                          <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Gender</label>
                          <CustomDropdown 
                             options={['Male', 'Female', 'Other']}
                             value={formData.gender}
                             onChange={(val) => handleChange('gender', val)}
                             placeholder="Select Gender"
                          />
                      </div>
                      <div className="space-y-[0.25vw]">
                          <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Date of Birth</label>
                          <CustomDatePicker 
                             value={formData.dob}
                             onChange={(val) => handleChange('dob', val)}
                             placeholder="DD / MM / YYYY"
                          />
                      </div>
                  </div>
               </div>
          </div>

          {/* Right Column: Address */}
          <div className="bg-white/40 rounded-[1.5vw] p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar h-full">
               
               {/* Address Header */}
               <div className="flex items-center gap-[0.8vw] mb-[0.8vw]">
                   <MapPin className="text-gray-900" size="1.1vw" />
                   <h3 className="text-[1.1vw] font-bold text-gray-900">Address</h3>
                   <div className="flex-1 h-[0.1vh] bg-gray-400 opacity-50"></div>
               </div>

               <div className="space-y-[0.65vw]">
                   <div className="space-y-[0.25vw]">
                       <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Address Line 1</label>
                       <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                          <input type="text" placeholder="Enter your Full name" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" 
                             value={formData.address1}
                             onChange={(e) => handleChange('address1', e.target.value)}
                          />
                       </div>
                   </div>
                   <div className="space-y-[0.25vw]">
                       <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Address Line 2</label>
                       <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                          <input type="text" placeholder="Enter your Full name" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" 
                             value={formData.address2}
                             onChange={(e) => handleChange('address2', e.target.value)}
                          />
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-[1vw]">
                      <div className="space-y-[0.25vw]">
                           <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">City</label>
                           <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                              <input type="text" placeholder="Your City" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" 
                                 value={formData.city}
                                 onChange={(e) => handleChange('city', e.target.value)}
                              />
                           </div>
                       </div>
                       <div className="space-y-[0.25vw]">
                           <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">State</label>
                           <CustomDropdown 
                             options={['TAMIL NADU', 'KERALA', 'KARNATAKA', 'MAHARASHTRA', 'DELHI']}
                             value={formData.state}
                             onChange={(val) => handleChange('state', val)}
                             placeholder="Select State"
                          />
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-[1vw]">
                      <div className="space-y-[0.25vw]">
                           <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Country</label>
                           <CustomDropdown 
                             options={['INDIA', 'USA', 'UK', 'CANADA', 'AUSTRALIA']}
                             value={formData.country}
                             onChange={(val) => handleChange('country', val)}
                             placeholder="Select Country"
                          />
                       </div>
                       <div className="space-y-[0.25vw]">
                           <label className="text-[0.75vw] font-bold text-gray-700 ml-[0.2vw]">Pin Code</label>
                           <div className="bg-white rounded-[0.6vw] px-[0.9vw] py-[0.35vw] shadow-sm">
                              <input type="text" placeholder="000 - 000" className="w-full bg-transparent outline-none text-[0.9vw] text-gray-700 font-medium placeholder-gray-400" 
                                 value={formData.pincode}
                                 onChange={(e) => handleChange('pincode', e.target.value)}
                              />
                           </div>
                       </div>
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default Profile;
