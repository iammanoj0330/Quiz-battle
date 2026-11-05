import React, { useState } from 'react';
import { 
  Trophy, 
  User, 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { sounds } from '../utils/audio.ts';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  // Form states
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result.success) {
      sounds.playCorrect();
      setSuccessMsg('Login successful! Redirecting to dashboard...');
      setTimeout(() => onSuccess(), 500);
    } else {
      setErrorMsg(result.error || 'Failed to login. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all registration fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register(username.trim(), email.trim(), password);
    setLoading(false);

    if (result.success) {
      sounds.playCorrect();
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => onSuccess(), 600);
    } else {
      setErrorMsg(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0720] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        
        {/* Left Side: Brand & Trophy (matches reference image 1) */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-4 px-4">
          <div className="relative mb-2">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 flex items-center justify-center shadow-2xl shadow-yellow-500/40 transform hover:rotate-3 transition-transform">
              <Trophy className="w-14 h-14 text-slate-950 fill-amber-950" />
            </div>
            <Sparkles className="w-7 h-7 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Quiz <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300">Battle</span>
          </h1>

          <p className="text-lg font-medium text-purple-200/90 max-w-sm">
            Test Your Knowledge. Compete with Friends in Real-Time!
          </p>

          <div className="pt-2 flex flex-col space-y-2 w-full max-w-xs">
            <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-700/40 text-purple-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Live Multiplayer Platform</span>
              </div>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Log in or create your free account to compete on the live leaderboard and create multiplayer quiz arenas!
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: White Content Card (matches reference image 1) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 transition-all border border-purple-100">
          
          {/* Tabs: Login / Sign Up */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setTab('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-bold transition-colors relative ${
                tab === 'login' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Login
              {tab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-bold transition-colors relative ${
                tab === 'signup' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign Up
              {tab === 'signup' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <span>Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="font-semibold text-purple-600 hover:text-purple-800"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-500/25 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? 'Logging In...' : 'Login'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setTab('signup');
                  }}
                  className="font-bold text-purple-600 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Arjun"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-500/25 active:scale-98 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setTab('login');
                  }}
                  className="font-bold text-purple-600 hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}

        </div>

      </div>

      {/* Forgot password simple modal */}
      {forgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-900 shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Reset Password</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              To reset your password, please sign up for a new account or contact the platform administrator with your registered email address.
            </p>
            <button
              onClick={() => setForgotModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
