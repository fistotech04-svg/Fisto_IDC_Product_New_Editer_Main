// src/layouts/MainLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

export default function MainLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DashboardNavbar />
      <div className={`flex-1 overflow-y-auto scroll-smooth ${isHomePage ? 'snap-y snap-mandatory' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}