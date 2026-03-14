//App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Home from './pages/Home';
import MyFlipbooks from './pages/MyFlipbooks';
import Settings from './pages/Settings';
import Editor from './Modules/Editer';
import { MainEditor } from './components/TemplateEditor'; // Import MainEditor
import ThreedEditor from './components/ThreedEditor/ThreedEditor';
import CustomizedEditor from './components/CustomizedEditor/CustomizedEditor';
import { ToastProvider } from './components/CustomToast';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Routes WITHOUT navbar */}
          <Route path="/" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Editor Layout */}
          <Route path="/editor" element={<Editor />}>
            <Route index element={<MainEditor />} />
            <Route path="threed_editor" element={<ThreedEditor />} />
            <Route path="customized_editor" element={<CustomizedEditor />} />
            <Route path="customized_editor/:folder/:v_id" element={<CustomizedEditor />} />
            <Route path=":folder/:v_id" element={<MainEditor />} />
            <Route path=":id" element={<MainEditor />} />
          </Route>

          {/* Routes WITH navbar */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/my-flipbooks" element={<MyFlipbooks />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;