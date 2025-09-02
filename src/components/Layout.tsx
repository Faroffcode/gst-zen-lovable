import { useState } from "react";
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Close sidebar on mobile by default
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        <Sidebar open={sidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        } pt-16`}>
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};