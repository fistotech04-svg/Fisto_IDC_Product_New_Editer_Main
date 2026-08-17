import React from 'react';
import { User, Building, MapPin, Globe, Check, X, Upload } from 'lucide-react';
import { Icon } from '@iconify/react';

const EditProfile = ({ user, setUser }) => {
  return (
    <div className="flex flex-col flex-1 w-full relative h-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-[1.5vw]">
        <div>
          <h2 className="text-[1.25vw] font-bold text-gray-900">Edit Profile</h2>
          <p className="text-[0.75vw] text-gray-500 mt-[0.2vw]">Only your actions and activities will appear here.</p>
        </div>
        <div className="flex gap-[0.5vw] mt-[-4.5vw]">
          <button className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] border border-gray-300 rounded-[0.4vw] text-[0.8vw] font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <X size="0.9vw" /> Cancel
          </button>
          <button className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] bg-green-600 rounded-[0.4vw] text-[0.8vw] font-medium text-white transition-colors">
            <Check size="0.9vw" /> Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[2vw]">
        {/* Personal Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <User size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-bold text-gray-900">Personal Details</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Full Name</label>
              <input type="text" value={user?.name || ''} onChange={(e) => setUser && setUser({ ...user, name: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Email ID</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2">
                  <Icon icon="logos:google-icon" className="w-[1vw] h-[1vw]" />
                </div>
                <input type="email" value={user?.email || ''} onChange={(e) => setUser && setUser({ ...user, email: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">About</label>
              <textarea rows={4} defaultValue="I'm going to be the King of the Pirates — that's my dream, and I'm never giving up on it. I love adventure, freedom, and good food (especially meat). I may not be the smartest, but I always trust my instincts and fight for what I believe in." className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 resize-none text-gray-500" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Mobile Number</label>
              <input type="text" defaultValue="6383319976" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Gender</label>
              <div className="relative">
                <select defaultValue="Male" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute right-[0.8vw] top-[50%] -translate-y-1/2 pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Date of Birth</label>
              <input type="date" defaultValue="1999-05-05" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
          </div>
        </section>

        {/* Professional Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <Building size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-bold text-gray-900">Professional Details</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.2vw]">Add Your Company Logo</label>
              <p className="text-[0.65vw] text-gray-400 mb-[0.5vw]">PNG format keeps your logo clean and background-free</p>
              <div className="w-[12vw] border border-dashed border-gray-300 rounded-[0.4vw] flex flex-col items-center justify-center py-[1vw] bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="text-gray-400 w-[1.2vw] h-[1.2vw] mb-[0.3vw]" />
                <p className="text-[0.65vw] text-gray-500">Drag & Drop or <span className="text-blue-500 font-medium">Upload</span></p>
                <p className="text-[0.5vw] text-gray-400 mt-[0.2vw]">Supported file: PNG, JPG, JPEG</p>
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Company / Organization Name</label>
              <input type="text" defaultValue="Fist-o Tech Private Limited" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Industry Type</label>
              <input type="text" defaultValue="Software Development" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Company Gmail</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2">
                  <Icon icon="logos:google-icon" className="w-[1vw] h-[1vw]" />
                </div>
                <input type="email" defaultValue="fistotech@gmail.com" className="w-full border border-gray-200 rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Website Link</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500">
                  <Globe className="w-[1vw] h-[1vw]" />
                </div>
                <input type="text" defaultValue="Fist-o.com" className="w-full border border-gray-200 rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] text-blue-500 underline focus:outline-none focus:border-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Services</label>
              <div className="w-full border border-gray-200 rounded-[0.4vw] p-[0.5vw] flex flex-wrap gap-[0.4vw]">
                {['Website', 'Mobile Application', 'IDC', '3D Models', 'Animated website', '3D Animation', 'Website', 'IDC'].map((service, idx) => (
                  <div key={idx} className="flex items-center gap-[0.3vw] bg-gray-100 text-gray-600 text-[0.7vw] px-[0.6vw] py-[0.3vw] rounded-[0.3vw]">
                    {service}
                    <button className="text-red-400 hover:text-red-500"><X size="0.6vw" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <MapPin size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-bold text-gray-900">Address</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 1</label>
              <input type="text" defaultValue="Fist-o Tech Private Limited" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 2</label>
              <input type="text" defaultValue="Software Development" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">City</label>
                <input type="text" defaultValue="Your City" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Pin Code</label>
                <input type="text" defaultValue="000 - 000" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">State</label>
                <select className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option>TAMIL NADU</option>
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Country</label>
                <select className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option>INDIA</option>
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <Icon icon="lucide:link" className="w-[1.2vw] h-[1.2vw] text-gray-900" />
            <h3 className="text-[1vw] font-bold text-gray-900">Social Media</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#1a1a1a] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Globe className="w-[1.2vw] h-[1.2vw] text-white" />
              </div>
              <input type="text" defaultValue="https://www.fistotech.com" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:instagram" className="w-[1.3vw] h-[1.3vw] text-white" />
              </div>
              <input type="text" defaultValue="https://www.instagram.com/fistotech" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#0077b5] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:linkedin" className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input type="text" defaultValue="https://www.linkedin.com/company/fistotech" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#1877f2] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:facebook" className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input type="text" defaultValue="https://www.facebook.com/fistotech" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#25d366] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:whatsapp" className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input type="text" defaultValue="https://wa.me/918876543210" className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default EditProfile;
