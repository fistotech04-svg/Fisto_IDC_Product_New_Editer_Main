import axios from 'axios';

// Request Interceptor: Attach Token
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized
axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Token invalid/expired - Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('user_profile');
        localStorage.removeItem('token');
        localStorage.removeItem('last_active_folder');
        
        // Force redirect to login page
        window.location.href = '/';
    }
    return Promise.reject(error);
});

export default axios;
