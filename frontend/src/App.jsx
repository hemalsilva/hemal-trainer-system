import React, { useState } from 'react';  
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Schedule from './pages/Schedule';
import OJT from './pages/OJT';
import OCRScan from './pages/OCRScan';
import Certificates from './pages/Certificates';
import Reports from './pages/Reports';
import AttendancePortal from './pages/AttendancePortal';
import Settings from './pages/Settings';
import Audits from './pages/Audits';
import Login from './pages/Login';
import { LayoutDashboard, Users, BookOpen, Settings as SettingsIcon, LogOut, Award, Calendar, ClipboardCheck, ScanLine, FormInput, PieChart, CheckCircle } from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  
  // Hide sidebar on the mobile attendance portal
  if (location.pathname.startsWith('/attendance/')) {
    return null;
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/ojt', label: 'OJT Assessment', icon: ClipboardCheck },
    { path: '/audits', label: 'Room Audits', icon: CheckCircle },
    { path: '/reports', label: 'Reports & Analytics', icon: PieChart },
    ];

  return (
    <aside className="w-64 bg-brand-card border-r border-gray-800 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-gray-800 flex items-center justify-center">
        <h1 className="text-xl font-bold text-brand-gold flex items-center gap-2 tracking-wide">
          <Award className="w-6 h-6" />
          HK Training Portal
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-goldLight text-brand-gold border border-brand-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors ${location.pathname === '/settings' ? 'bg-brand-goldLight text-brand-gold border border-brand-gold/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
          <SettingsIcon className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <button 
          onClick={() => {
            localStorage.removeItem('hk_token');
            window.location.reload();
          }}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('hk_token'));

  return (
    <HashRouter>
      <div className="flex w-full h-screen bg-brand-dark text-white font-sans selection:bg-brand-gold selection:text-black">
        <Routes>
          {/* Public Route - Employee Attendance Scanning */}
          <Route path="/attendance/:id" element={<AttendancePortal />} />
          
          {/* Main App Container */}
          <Route path="/*" element={
            !isAuthenticated ? (
              <Login onLogin={setIsAuthenticated} />
            ) : (
              <>
                <Sidebar />
                <main className="flex-1 overflow-auto relative w-full">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="relative z-10">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/schedule" element={<Schedule />} />
                      <Route path="/ojt" element={<OJT />} />
                      <Route path="/audits" element={<Audits />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/ocr" element={<OCRScan />} />
                      <Route path="/certificates" element={<Certificates />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<div className="p-8 text-center text-gray-500">Module under construction</div>} />
                    </Routes>
                  </div>
                </main>
              </>
            )
          } />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
