import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/CustomToast';
import FistoLogo from '../assets/logo/Fisto_logo.png'; 
import SignupBg from '../assets/logo/signup.png';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  const validatePassword = (password) => {
    const criteria = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };
    setPasswordCriteria(criteria);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'password') {
       validatePassword(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      // Backend expects emailId, frontend has email
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${backendUrl}/api/auth/signup`, {
        emailId: formData.email,
        password: formData.password
      });
      console.log('Signup success:', res.data);
      
      // Store user data in localStorage
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify({
          emailId: res.data.user.emailId,
          userFolder: res.data.user.userFolder,
          createdAt: res.data.user.createdAt,
          isLoggedIn: true
        }));
        console.log('User data stored in localStorage');
      }
      
      toast.success('Signup successful!');
      navigate('/home');
    } catch (err) {
      console.error('Signup error:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex relative overflow-hidden bg-white">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={SignupBg} 
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
             <img src={FistoLogo} alt="FIST_O" className="w-[9vw] object-contain brightness-0 invert" />
          </div>
        </div>

        {/* Right Section: Signup Form */}
        <div className="w-full lg:w-[50%] flex items-center justify-center p-[1.5vw] lg:p-[3vw]">
          <div className="w-full max-w-[28vw] space-y-[1vw] bg-transparent">
            
            <div className="text-center">
               {/* Mobile Logo */}
               <div className="lg:hidden flex justify-center mb-[1vw]">
                 <img src={FistoLogo} alt="FIST-O" className="h-[2.5vw] w-auto" />
               </div>
               <h2 className="text-[2vw] font-semibold tracking-tight mb-[1vw] text-black drop-shadow-md">Sign-Up</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-[1.25vw]">
              
              {/* Email */}
              <div className="space-y-[0.5vw]">
                <label className="text-[0.875vw] font-bold ml-[0.25vw] text-black" htmlFor="email">Email Id</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="block w-full px-[1.25vw] py-[0.75vw] rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-indigo-200 shadow-lg shadow-indigo-100 text-[1vw]"
                  placeholder="Enter your Email ID"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-[0.5vw]">
                <label className="text-[0.875vw] font-bold ml-[0.25vw] text-black" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="block w-full px-[1.25vw] py-[0.75vw] pr-[3vw] rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-indigo-200 shadow-lg shadow-indigo-100 text-[1vw]"
                    placeholder="Create your Password"
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
                       <EyeOff className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                     ) : (
                       <Eye className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                     )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-[0.5vw]">
                <label className="text-[0.875vw] font-bold ml-[0.25vw] text-black" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="block w-full px-[1.25vw] py-[0.75vw] pr-[3vw] rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-indigo-200 shadow-lg shadow-indigo-100 text-[1vw]"
                    placeholder="Re - Enter your Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-[1vw] flex items-center"
                  >
                     {showConfirmPassword ? (
                       <EyeOff className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                     ) : (
                       <Eye className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                     )}
                  </button>
                </div>
                {formData.confirmPassword && (
                    <div className={`text-[0.625vw] ml-[0.25vw] font-medium mt-[0.25vw] flex items-center gap-[0.25vw] ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                        {formData.password === formData.confirmPassword ? <Check size="0.625vw" /> : <X size="0.625vw" />}
                        <span>{formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"}</span>
                    </div>
                )}
              </div>

              {/* Password Requirements Checklist */}
              <div className="text-[0.625vw] space-y-[0.125vw] ml-[0.25vw] font-medium mt-[0.5vw]">
                 <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.length ? 'text-green-600' : 'text-red-500')}`}>
                    {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.length ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                    <span>Minimum 8 characters</span>
                 </div>
                 <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.upper ? 'text-green-600' : 'text-red-500')}`}>
                    {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.upper ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                    <span>At least 1 uppercase letter (A-Z)</span>
                 </div>
                 <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.lower ? 'text-green-600' : 'text-red-500')}`}>
                    {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.lower ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                    <span>At least 1 lowercase letter (a-z)</span>
                 </div>
                 <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.number ? 'text-green-600' : 'text-red-500')}`}>
                    {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.number ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                    <span>At least 1 number (0-9)</span>
                 </div>
                 <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.special ? 'text-green-600' : 'text-red-500')}`}>
                    {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.special ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                    <span>At least 1 special char (! @ # $ % ^ & *)</span>
                 </div>
              </div>

              {/* Submit Button */}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-[0.875vw] px-[1vw] cursor-pointer rounded-full bg-[#4c5add] hover:bg-[#3f4bc0] text-white font-semibold text-[1.125vw] shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] focus:outline-none text-center block disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-[0.5vw]">
                    <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                    <span>Signing Up...</span>
                  </div>
                ) : (
                  "Sign Up"
                )}
              </button>

              {/* Footer Link */}
              <div className="text-center mt-[0.5vw]">
                 <p className="text-[0.875vw] text-black">
                    Already have an account ?{' '}
                    <Link to="/" className="font-semibold text-[#4c5add] hover:underline decoration-1 underline-offset-[0.25vw]">
                      Sign in
                    </Link>
                 </p>
              </div>

              {/* Divider */}
              <div className="flex items-center my-[1vw]">
                <div className="flex-1 border-t border-1 border-[#373d8b]"></div>
                <span className="px-[0.75vw] text-[#373d8b] text-[0.875vw] font-medium">or</span>
                <div className="flex-1 border-t border-1 border-[#373d8b]"></div>
              </div>


              {/* Google Login */}
              <button 
                type="button"
                className="w-full flex cursor-pointer items-center justify-center px-[1vw] py-[0.875vw] rounded-full bg-white text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all shadow-lg shadow-gray-200 border border-gray-100 text-[1vw]"
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