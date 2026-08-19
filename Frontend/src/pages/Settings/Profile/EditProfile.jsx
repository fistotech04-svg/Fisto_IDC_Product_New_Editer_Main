import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Building, MapPin, Globe, Check, X, Upload } from 'lucide-react';
import { Icon } from '@iconify/react';

const EditProfile = ({ user, setUser }) => {
  const [editedUser, setEditedUser] = useState(user);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const isEdited = JSON.stringify(user) !== JSON.stringify(editedUser);

  const handleSave = () => {
    if (setUser) setUser(editedUser);
  };

  const handleCancel = () => {
    setEditedUser(user);
  };

  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('save-buttons-portal-target'));
  }, []);

  const saveActions = isEdited && (
    <div className="flex gap-[0.5vw]">
      <button onClick={handleCancel} className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] border border-gray-300 rounded-[0.4vw] text-[0.8vw] font-medium text-gray-600 hover:text-gray-900 transition-colors">
        <X size="0.9vw" /> Cancel
      </button>
      <button onClick={handleSave} className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] bg-green-600 rounded-[0.4vw] text-[0.8vw] font-medium text-white transition-colors">
        <Check size="0.9vw" /> Save Changes
      </button>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 w-full relative h-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-[1.5vw]">
        <div>
          <h2 className="text-[1.25vw] font-semibold text-gray-900">Edit Profile</h2>
          <p className="text-[0.75vw] text-gray-500 mt-[0.2vw]">Only your actions and activities will appear here.</p>
        </div>
        {portalTarget ? createPortal(saveActions, portalTarget) : saveActions}
      </div>

      <div className="flex flex-col gap-[2vw]">
        {/* Personal Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <User size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Personal Details</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Full Name</label>
              <input type="text" value={editedUser?.name || ''} onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Email ID</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2">
                  <Icon icon="logos:google-icon" className="w-[1vw] h-[1vw]" />
                </div>
                <input type="email" value={editedUser?.email || ''} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">About</label>
              <textarea rows={4} value={editedUser?.about || ''} onChange={(e) => setEditedUser({ ...editedUser, about: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 resize-none text-gray-500" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Mobile Number</label>
              <input type="text" value={editedUser?.mobile || ''} onChange={(e) => setEditedUser({ ...editedUser, mobile: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>

          </div>
        </section>

        {/* Professional Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <Building size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Professional Details</h3>
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
              <input type="text" value={editedUser?.companyName || ''} onChange={(e) => setEditedUser({ ...editedUser, companyName: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Industry Type</label>
              <input type="text" value={editedUser?.industryType || ''} onChange={(e) => setEditedUser({ ...editedUser, industryType: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Company Gmail</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2">
                  <Icon icon="logos:google-icon" className="w-[1vw] h-[1vw]" />
                </div>
                <input type="email" value={editedUser?.companyEmail || ''} onChange={(e) => setEditedUser({ ...editedUser, companyEmail: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Website Link</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500">
                  <Globe className="w-[1vw] h-[1vw]" />
                </div>
                <input type="text" value={editedUser?.website || ''} onChange={(e) => setEditedUser({ ...editedUser, website: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] text-blue-500 underline focus:outline-none focus:border-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Services</label>
              <input 
                type="text" 
                value={Array.isArray(editedUser?.services) ? editedUser.services.join(', ') : editedUser?.services || ''} 
                onChange={(e) => setEditedUser({ ...editedUser, services: e.target.value })} 
                className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" 
                placeholder="e.g. Website Development, 3D Animations, IDC"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <MapPin size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Address</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 1</label>
              <input type="text" value={editedUser?.address1 || ''} onChange={(e) => setEditedUser({ ...editedUser, address1: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 2</label>
              <input type="text" value={editedUser?.address2 || ''} onChange={(e) => setEditedUser({ ...editedUser, address2: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">City</label>
                <input type="text" value={editedUser?.city || ''} onChange={(e) => setEditedUser({ ...editedUser, city: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Pin Code</label>
                <input type="text" value={editedUser?.pincode || ''} onChange={(e) => setEditedUser({ ...editedUser, pincode: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">State</label>
                <select value={editedUser?.state || ''} onChange={(e) => setEditedUser({ ...editedUser, state: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Country</label>
                <select value={editedUser?.country || ''} onChange={(e) => setEditedUser({ ...editedUser, country: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option value="INDIA">INDIA</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
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
            <h3 className="text-[1vw] font-semibold text-gray-900">Social Media</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#1a1a1a] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Globe className="w-[1.2vw] h-[1.2vw] text-white" />
              </div>
              <input type="text" value={editedUser?.socials?.website || ''} onChange={(e) => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, website: e.target.value } })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:instagram" className="w-[1.3vw] h-[1.3vw] text-white" />
              </div>
              <input type="text" value={editedUser?.socials?.instagram || ''} onChange={(e) => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, instagram: e.target.value } })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#0077b5] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:linkedin" className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input type="text" value={editedUser?.socials?.linkedin || ''} onChange={(e) => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, linkedin: e.target.value } })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#1877f2] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:facebook" className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input type="text" value={editedUser?.socials?.facebook || ''} onChange={(e) => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, facebook: e.target.value } })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

            <div className="flex items-center gap-[1vw]">
              <div className="w-[2vw] h-[2vw] bg-[#25d366] rounded-[0.4vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:whatsapp" className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input type="text" value={editedUser?.socials?.whatsapp || ''} onChange={(e) => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, whatsapp: e.target.value } })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500" />
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default EditProfile;
