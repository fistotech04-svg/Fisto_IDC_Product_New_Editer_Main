//App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Home from './pages/Home';
import MyFlipbooks from './pages/MyFlipbooks';
import Settings from './pages/Settings';
import About from './pages/About';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Editor from './Modules/Editer';
import { MainEditor } from './components/TemplateEditor'; // Import MainEditor
import ThreedEditor from './components/ThreedEditor/ThreedEditor';
import CustomizedEditor from './components/CustomizedEditor/CustomizedEditor';
import { ToastProvider } from './components/CustomToast';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Editor Layout */}
          <Route path="/editor" element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }>
            <Route index element={<MainEditor />} />
            <Route path="threed_editor" element={<ThreedEditor />} />
            <Route path="threed_editor/:modelId" element={<ThreedEditor />} />
            <Route path="customized_editor" element={<CustomizedEditor />} />
            <Route path="customized_editor/:folder/:v_id" element={<CustomizedEditor />} />
            <Route path="customized_editor/:folder/:v_id/:page" element={<CustomizedEditor />} />
            <Route path=":folder/:v_id" element={<MainEditor />} />
            <Route path=":id" element={<MainEditor />} />
          </Route>

          {/* Protected Routes WITH navbar */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/home" element={<Home />} />
            <Route path="/my-flipbooks" element={<MyFlipbooks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* Catch-all route for wrong URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;