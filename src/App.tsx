import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CreateQuizPage } from './pages/CreateQuizPage.tsx';
import { JoinQuizPage } from './pages/JoinQuizPage.tsx';
import { QuizPlayPage } from './pages/QuizPlayPage.tsx';
import { ResultPage } from './pages/ResultPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { MultiplayerGamePage } from './pages/MultiplayerGamePage.tsx';
import { Quiz, QuizSubmissionResult } from './types.ts';
import { Smartphone, Monitor, Trophy } from 'lucide-react';
import { sounds } from './utils/audio.ts';

function MainApp() {
  const { user, loading } = useAuth();
  
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSimulator, setMobileSimulator] = useState(false);

  // If loading auth state initially
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0720] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center animate-bounce shadow-2xl shadow-yellow-500/40">
          <Trophy className="w-9 h-9 text-slate-950 fill-amber-950" />
        </div>
        <p className="text-purple-300 font-bold tracking-wider text-sm">QUIZ BATTLE LOADING...</p>
      </div>
    );
  }

  // If user is not authenticated and on login page
  if (!user || currentPage === 'login') {
    return (
      <LoginPage 
        onSuccess={() => {
          setCurrentPage('home');
        }} 
      />
    );
  }

  const handleStartQuiz = (quizId: string, roomCode?: string) => {
    if (roomCode) {
      setActiveRoomCode(roomCode);
      setCurrentPage('multiplayer');
    } else {
      setActiveQuizId(quizId);
      setCurrentPage('play');
    }
  };

  const handleStartMultiplayer = (roomCode: string) => {
    setActiveRoomCode(roomCode);
    setCurrentPage('multiplayer');
  };

  const handleFinishQuiz = (result: QuizSubmissionResult, quiz: Quiz) => {
    setQuizResult(result);
    setActiveQuiz(quiz);
    setCurrentPage('result');
  };

  return (
    <div className="min-h-screen bg-[#0b0720] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Top Status Bar */}
      <div className="bg-[#12082b] border-b border-purple-900/60 px-4 py-1.5 flex items-center justify-between text-[11px] text-purple-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-white">Quiz Battle • Real-time Multiplayer Arena</span>
          <span className="hidden sm:inline text-purple-500">•</span>
          <span className="hidden sm:inline text-purple-300">Logged in as {user.username}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setMobileSimulator(!mobileSimulator);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              mobileSimulator 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-purple-950/80 text-purple-300 hover:text-white border border-purple-800/60'
            }`}
            title="Toggle Mobile View Simulation for Demo"
          >
            {mobileSimulator ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Mode</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulate Page 9 Mobile View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container (can be wrapped in phone frame if simulated) */}
      <div className={`flex-1 flex justify-center ${mobileSimulator ? 'p-4 sm:p-8 bg-slate-950' : ''}`}>
        
        <div className={`w-full flex ${
          mobileSimulator 
            ? 'max-w-[420px] rounded-[40px] border-8 border-purple-900/70 shadow-2xl overflow-hidden min-h-[820px] bg-[#0b0720] flex-col' 
            : 'max-w-7xl'
        }`}>

          {/* Sidebar (desktop sticky, mobile slide-over drawer) */}
          {!mobileSimulator && (
            <Sidebar
              currentPage={currentPage}
              onNavigate={(page) => {
                sounds.playClick();
                setCurrentPage(page);
              }}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile slide-over backdrop when sidebar is open */}
          {sidebarOpen && !mobileSimulator && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            
            <Navbar
              currentPage={currentPage}
              onNavigate={(page) => {
                sounds.playClick();
                setCurrentPage(page);
              }}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Mobile Navigation Pills when in Mobile Simulator mode */}
            {mobileSimulator && (
              <div className="flex items-center justify-around bg-[#140b33] p-2 border-b border-purple-900/50 text-[10px] font-bold">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'create', label: 'Create' },
                  { id: 'join', label: 'Join' },
                  { id: 'leaderboard', label: 'Ranks' },
                  { id: 'profile', label: 'Profile' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      sounds.playClick();
                      setCurrentPage(item.id);
                    }}
                    className={`px-2.5 py-1 rounded-full ${
                      currentPage === item.id 
                        ? 'bg-purple-600 text-white' 
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {currentPage === 'home' && (
                <HomePage
                  onStartQuiz={handleStartQuiz}
                  onNavigate={(page) => setCurrentPage(page)}
                />
              )}

              {currentPage === 'create' && (
                <CreateQuizPage
                  onSuccessNavigate={(roomCode) => handleStartMultiplayer(roomCode)}
                  onNavigateHome={() => setCurrentPage('home')}
                />
              )}

              {currentPage === 'join' && (
                <JoinQuizPage
                  onJoinSuccess={(roomCode) => handleStartMultiplayer(roomCode)}
                />
              )}

              {currentPage === 'multiplayer' && activeRoomCode && (
                <MultiplayerGamePage
                  roomCode={activeRoomCode}
                  currentUser={user}
                  onNavigateHome={() => setCurrentPage('home')}
                  onViewLeaderboard={() => setCurrentPage('leaderboard')}
                  onCreateQuiz={() => setCurrentPage('create')}
                />
              )}

              {currentPage === 'play' && activeQuizId && (
                <QuizPlayPage
                  quizId={activeQuizId}
                  onFinishQuiz={handleFinishQuiz}
                  onCancel={() => setCurrentPage('home')}
                />
              )}

              {currentPage === 'result' && quizResult && activeQuiz && (
                <ResultPage
                  result={quizResult}
                  quiz={activeQuiz}
                  onPlayAgain={() => handleStartQuiz(activeQuiz.id)}
                  onViewLeaderboard={() => setCurrentPage('leaderboard')}
                  onReturnHome={() => setCurrentPage('home')}
                />
              )}

              {currentPage === 'leaderboard' && (
                <LeaderboardPage />
              )}

              {currentPage === 'profile' && (
                <ProfilePage
                  onStartQuiz={handleStartQuiz}
                />
              )}
            </main>

            {/* Mobile Bottom Navigation Bar (matches Page 9 mobile overview) */}
            <div className="md:hidden sticky bottom-0 bg-[#0e0724]/95 backdrop-blur-md border-t border-purple-900/60 p-2 flex items-center justify-around z-20">
              {[
                { id: 'home', label: 'Home', icon: '🏠' },
                { id: 'create', label: 'Create', icon: '➕' },
                { id: 'join', label: 'Join', icon: '🎮' },
                { id: 'leaderboard', label: 'Ranks', icon: '🏆' },
                { id: 'profile', label: 'Profile', icon: '👤' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentPage(tab.id);
                  }}
                  className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all ${
                    currentPage === tab.id
                      ? 'text-white bg-purple-600/30 border border-purple-500/40'
                      : 'text-purple-300/70 hover:text-white'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
