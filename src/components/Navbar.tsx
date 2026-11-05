import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Trophy, User as UserIcon, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0e0828]/85 backdrop-blur-md border-b border-purple-900/30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile left brand & hamburger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-purple-200 hover:text-white hover:bg-purple-900/40 focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div 
          onClick={() => onNavigate('home')} 
          className="md:hidden flex items-center space-x-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">Quiz Battle</span>
        </div>
      </div>

      {/* Center status or quick indicator */}
      <div className="hidden lg:flex items-center space-x-2 bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-full text-xs text-purple-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Online Battle Arena: Active</span>
        <span className="text-purple-500">•</span>
        <span className="font-semibold text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" /> Real-time Cloud DB
        </span>
      </div>

      {/* Right User Avatar Dropdown (Matches reference image: "Karthik v") */}
      <div className="flex items-center space-x-3" ref={dropdownRef}>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 bg-[#1b103f] hover:bg-[#251554] border border-purple-800/60 rounded-full py-1.5 pl-2 pr-3.5 transition-all text-sm focus:outline-none shadow-md"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-400"
              />
              <span className="font-bold text-white text-xs sm:text-sm">{user.username}</span>
              <ChevronDown className="w-4 h-4 text-purple-300" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#170e38] border border-purple-700/50 shadow-2xl p-2 z-50 text-sm animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-purple-800/40 mb-1">
                  <p className="font-bold text-white truncate">{user.username}</p>
                  <p className="text-xs text-purple-300 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/40">
                    {user.title || 'Contender'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigate('profile');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-900/50 flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigate('leaderboard');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-900/50 flex items-center gap-2.5 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Leaderboard</span>
                </button>

                <div className="border-t border-purple-800/40 my-1"></div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    onNavigate('login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('login')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:brightness-110"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
