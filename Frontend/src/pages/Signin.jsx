import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/CustomToast';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import FistoLogo from '../assets/logo/Fisto_logo.png'; 
import SigninBg from '../assets/logo/signin.png';

export default function Signin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailId: '',
    password: ''
  });
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    if (!formData.emailId) {
      toast.error("Please enter your Email ID first");
      return;
    }
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailId)) {
      toast.error("Please enter a valid Email ID");
      return;
    }
    setIsForgotModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${backendUrl}/api/auth/login`, {
        emailId: formData.emailId,
        password: formData.password
      });
      console.log('Login success:', res.data);
      
      // Store user data in localStorage
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify({
          ...res.data.user,
          isLoggedIn: true
        }));
      }

      toast.success('Login successful!');
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-white"> 
      
      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
        email={formData.emailId}
      />

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={SigninBg} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Container */}
      <div className="flex w-full h-full z-10 relative">
        
        {/* Left Section: Logo & Image Placeholder */}
        <div className="hidden lg:flex w-[50%] flex-col p-[3vw] relative">
          {/* Logo */}
          <div className="mb-auto">
             <img src={FistoLogo} alt="FIST_O" className="w-[9vw] object-contain" />
          </div>
          
          {/* Main Image Placeholder (User will place image here) */}
          <div className="flex-1 flex items-center justify-center">
             <div className="w-[25vw] h-[32.5vw] relative flex items-center justify-center">
                
             </div>
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="w-full lg:w-[50%] flex items-center justify-center p-[4vw] lg:p-[4vw]">
          <div className="w-full max-w-[28vw] space-y-[2vw] text-white">
            
            <div className="text-center">
               {/* Mobile Logo */}
               <div className="lg:hidden flex justify-center mb-[1.5vw]">
                 <img src={FistoLogo} alt="FIST-O" className="h-[2.5vw] w-auto brightness-0 invert" />
               </div>
               <h2 className="text-[2.25vw] font-normal tracking-wide mb-[2.5vw]">Sign-in</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-[1.5vw]">
              
              {/* Email ID */}
              <div className="space-y-[0.5vw]">
                <label className="text-[1vw] font-medium ml-[0.25vw]" htmlFor="emailId">Email Id</label>
                <input
                  type="email"
                  id="emailId"
                  name="emailId"
                  className="block w-full px-[1.25vw] py-[0.75vw] rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-[1vw]"
                  placeholder="Enter your Email ID"
                  value={formData.emailId}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-[0.5vw]">
                <label className="text-[1vw] font-medium ml-[0.25vw]" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="block w-full px-[1.25vw] py-[0.75vw] pr-[3vw] rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-[1vw]"
                    placeholder="Enter your Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-[1vw] flex items-center"
                  >
                     {showPassword ? (
                       <EyeOff className="w-[1.25vw] h-[1.25vw] text-gray-500 hover:text-gray-700" />
                     ) : (
                       <Eye className="w-[1.25vw] h-[1.25vw] text-gray-500 hover:text-gray-700" />
                     )}
                  </button>
                </div>
                <div className="flex justify-end pt-[0.25vw]">
                   <button 
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className={`text-[0.875vw] underline decoration-1 underline-offset-[0.25vw] transition-colors font-semibold ${!formData.emailId ? 'text-gray-500 cursor-not-allowed opacity-60' : 'text-gray-300 hover:text-white cursor-pointer'}`}
                    disabled={!formData.emailId}
                   >
                      Forget Password ?
                   </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="block w-full text-center py-[0.875vw] px-[1vw] rounded-full bg-[#4c5add] cursor-pointer hover:bg-[#3f4bc0] text-white font-semibold text-[1.125vw] shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-2 border-indigo-400/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-[0.5vw]">
                    <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
              
              {/* Create Account Link */}
              <div className="text-center mt-[1vw]">
                 <p className="text-[0.875vw] text-gray-300">
                    Create Account ?{' '}
                    <Link to="/signup" className="font-semibold text-white hover:underline decoration-1 underline-offset-[0.25vw]">
                       Sign up
                    </Link>
                 </p>
              </div>

              {/* Divider */}
              <div className="flex items-center my-[2vw]">
                <div className="flex-1 border-t border-1 border-white"></div>
                <span className="px-[0.75vw] text-gray-300 text-[0.875vw] font-semibold">or</span>
                <div className="flex-1 border-t border-1 border-white"></div>
              </div>

              {/* Google Login */}
              <button 
                type="button"
                className="w-full flex cursor-pointer items-center justify-center px-[1vw] py-[0.875vw] rounded-full bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all transform hover:scale-[1.02] text-[1vw]"
              >
                 <svg className="w-[1.25vw] h-[1.25vw] mr-[0.75vw]" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 Sign-In with Google
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}