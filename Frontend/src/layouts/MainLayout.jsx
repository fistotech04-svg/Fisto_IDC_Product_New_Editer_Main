// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}