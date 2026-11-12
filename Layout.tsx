import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from '../firebase';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldAlert,
  QrCode,
  FolderKanban,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import AppDownloadModal from './AppDownloadModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Live Metrics Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin'] },
    { label: 'Admin Projects Hub', icon: ShieldAlert, path: '/admin', roles: ['admin'] },
    { label: 'B1 Task Portal Form', icon: Layers, path: '/b1-task', roles: ['admin'] },
    { label: 'Facilitator Questions Form', icon: ClipboardList, path: '/facilitator', roles: ['admin'] },
    { label: 'Supervisor Visits Form', icon: MapPin, path: '/supervisor', roles: ['admin'] },
    { label: 'Class Reports & History', icon: ClipboardList, path: '/facilitator', roles: ['facilitator'] },
    { label: 'Visit Reports & History', icon: MapPin, path: '/supervisor', roles: ['supervisor'] },
    { label: 'B1 Task & Questions', icon: Layers, path: '/b1-task', roles: ['b1_task'] },
  ];

  const filteredNavItems = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#161b22] border-r border-[#30363d]">
        <div className="p-5 border-b border-[#21262d] flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.jpeg" 
              alt="Base Metrics Logo" 
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-[#30363d] shadow-sm group-hover:scale-105 transition-transform shrink-0" 
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[#f0f6fc] tracking-tight leading-tight truncate">Base Metrics</h1>
              <p className="text-[10px] text-[#8b949e] font-medium leading-tight">Consulting &amp; Data Engine</p>
            </div>
          </Link>
          <button
            onClick={() => setIsDownloadOpen(true)}
            title="Download App Barcode"
            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#2ea043] transition-colors cursor-pointer border border-[#30363d]"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all",
                location.pathname === item.path
                  ? "bg-[#238636] text-white shadow-xs"
                  : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Barcode Trigger Banner */}
        <div className="px-3 py-2">
          <div 
            onClick={() => setIsDownloadOpen(true)}
            className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-[#58a6ff] transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-[#2ea043] group-hover:scale-110 transition-transform" />
              <p className="text-xs font-semibold text-[#f0f6fc]">Get Mobile App</p>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-1">Scan barcode to install on phone</p>
          </div>
        </div>

        <div className="p-4 border-t border-[#30363d] bg-[#161b22]">
          <div className="flex items-center px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center mr-3 text-[#58a6ff]">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#f0f6fc] truncate">{profile?.name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] font-mono uppercase text-[#8b949e]">{profile?.role}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#238636]/20 text-[#2ea043] border border-[#238636]/30">
                  Active
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-[#161b22] border-b border-[#30363d] p-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <img 
              src="/logo.jpeg" 
              alt="Base Metrics Logo" 
              className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-[#30363d] shrink-0" 
            />
            <div>
              <h1 className="text-sm font-bold text-[#f0f6fc] leading-tight">Base Metrics</h1>
              <p className="text-[10px] text-[#8b949e] leading-tight">Field Data Platform</p>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDownloadOpen(true)}
              className="p-2 rounded-lg bg-[#21262d] text-[#2ea043] border border-[#30363d]"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-[#21262d] text-[#c9d1d9]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#161b22] border-b border-[#30363d] px-4 py-3 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl",
                  location.pathname === item.path
                    ? "bg-[#238636] text-white"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                )}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-xs font-semibold text-red-400 rounded-xl hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      <AppDownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
};

export default Layout;
