import React, { useEffect, useState } from 'react';
import { 
  Globe, 
  Monitor, 
  Trophy, 
  Play, 
  ArrowRight, 
  Clock, 
  HelpCircle, 
  PlusCircle, 
  Sparkles,
  Gamepad2,
  Brain,
  Hash
} from 'lucide-react';
import { Quiz } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { sounds } from '../utils/audio.ts';

interface HomePageProps {
  onStartQuiz: (quizId: string, roomCode?: string) => void;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartQuiz, onNavigate }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (e) {
      console.error('Failed to load quizzes:', e);
    } finally {
      setLoading(false);
    }
  };

  const getQuizIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('general') || t.includes('gk') || t.includes('world')) {
      return {
        icon: Globe,
        bg: 'bg-blue-100 text-blue-600 ring-4 ring-blue-50'
      };
    }
    if (t.includes('tech') || t.includes('code') || t.includes('dev')) {
      return {
        icon: Monitor,
        bg: 'bg-indigo-100 text-indigo-600 ring-4 ring-indigo-50'
      };
    }
    if (t.includes('sport') || t.includes('game') || t.includes('ball')) {
      return {
        icon: Trophy,
        bg: 'bg-amber-100 text-amber-600 ring-4 ring-amber-50'
      };
    }
    return {
      icon: Gamepad2,
      bg: 'bg-purple-100 text-purple-600 ring-4 ring-purple-50'
    };
  };

  const handleStart = (id: string, roomCode?: string) => {
    sounds.playClick();
    onStartQuiz(id, roomCode);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Welcome Banner (matches reference image 1: Welcome Back, Karthik! 👋 + Brain graphic) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#6d28d9] p-6 sm:p-10 border border-purple-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-400/20 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Multiplayer Quiz Arena</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome Back, {user?.username || 'Challenger'}! 👋
            </h2>

            <p className="text-sm sm:text-base text-purple-200/90 font-medium max-w-md">
              Ready to test your knowledge? Challenge your friends, rank on the global leaderboard, and win trophies!
            </p>

            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => {
                  sounds.playClick();
                  if (quizzes.length > 0) {
                    onStartQuiz(quizzes[0].id, quizzes[0].room_code);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-900/50 hover:shadow-purple-500/40 active:scale-95 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onNavigate('create');
                }}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-md active:scale-95 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-purple-300" />
                <span>Create Quiz</span>
              </button>
            </div>
          </div>

          {/* Right Glowing Brain & Stars Graphic (matches reference image 1) */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-purple-400/40 flex items-center justify-center shadow-inner relative animate-pulse">
              <Brain className="w-20 h-20 sm:w-24 sm:h-24 text-purple-200 stroke-[1.5]" />
              
              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-2 rounded-xl shadow-lg font-black text-xs flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>#1</span>
              </div>
              <div className="absolute -bottom-2 -left-2 bg-indigo-500 text-white p-2 rounded-xl shadow-lg font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>XP +100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Available Quizzes Section (matches reference image 1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Available Quizzes</h3>
            <span className="bg-purple-900/60 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-700/40">
              {quizzes.length}
            </span>
          </div>

          <button
            onClick={() => onNavigate('join')}
            className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <span>Enter Room Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-3xl p-6 h-56 animate-pulse border border-purple-900/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const iconConfig = getQuizIcon(quiz.title);
              const IconComponent = iconConfig.icon;

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl p-6 text-slate-900 shadow-xl border border-purple-100/50 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Icon & Room Code Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconConfig.bg}`}>
                        <IconComponent className="w-7 h-7" />
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-purple-200">
                          <Hash className="w-3 h-3 text-purple-500" />
                          {quiz.room_code}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          By {quiz.created_by_username || 'Host'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-lg font-extrabold text-slate-900 mb-1.5 leading-snug">
                      {quiz.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {quiz.description || 'Test your speed and accuracy in this exciting quiz showdown.'}
                    </p>
                  </div>

                  <div>
                    {/* Metadata: Questions & Duration */}
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mb-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-purple-500" />
                        <span>{quiz.question_count || 10} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>{quiz.time_limit_minutes || 5} min</span>
                      </div>
                    </div>

                    {/* Join Now Button (matches reference image 1) */}
                    <button
                      onClick={() => handleStart(quiz.id, quiz.room_code)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                      <span>Join Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Join Callout Banner */}
      <div className="rounded-3xl bg-[#170e38] border border-purple-800/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Have a friend's Room Code?</h4>
            <p className="text-xs text-purple-300">Join custom quiz battles created by classmates or professors!</p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onNavigate('join');
          }}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-lg shadow-purple-900/40"
        >
          Enter Code
        </button>
      </div>

    </div>
  );
};
