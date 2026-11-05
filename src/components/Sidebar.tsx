import React from 'react';
import { 
  Home, 
  FileEdit, 
  Users, 
  Trophy, 
  User as UserIcon, 
  LogOut,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create', label: 'Create Quiz', icon: FileEdit },
    { id: 'join', label: 'Join Quiz', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    onNavigate('login');
    if (onClose) onClose();
  };

  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#140b33] border-r border-purple-900/40 flex flex-col justify-between p-4 z-40 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div>
        {/* Brand Logo & Trophy Header */}
        <div 
          onClick={() => handleNav('home')} 
          className="cursor-pointer flex items-center space-x-3 px-2 py-4 mb-6 group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6 text-slate-950 fill-amber-950" />
            </div>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>Quiz</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Battle</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-purple-300/70 uppercase">
              Play • Compete • Win
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User status & Logout */}
      <div className="pt-4 border-t border-purple-900/50 space-y-2">
        {user && (
          <div 
            onClick={() => handleNav('profile')}
            className="flex items-center space-x-3 p-2 rounded-xl bg-purple-950/40 border border-purple-800/30 cursor-pointer hover:bg-purple-900/40 transition-colors"
          >
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-purple-300 truncate">{user.title || 'Player'}</p>
            </div>
            <Zap className="w-3.5 h-3.5 text-yellow-400 ml-auto shrink-0" />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
