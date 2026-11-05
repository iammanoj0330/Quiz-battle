import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Award, 
  Home, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Percent,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizSubmissionResult, Quiz } from '../types.ts';
import { sounds } from '../utils/audio.ts';

interface ResultPageProps {
  result: QuizSubmissionResult;
  quiz: Quiz;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onReturnHome: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  quiz,
  onPlayAgain,
  onViewLeaderboard,
  onReturnHome
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { attempt, breakdown } = result;

  useEffect(() => {
    // Launch celebratory confetti
    sounds.playFanfare();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  }, []);

  const percentage = attempt.percentage;
  const isHighScorer = percentage >= 70;

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-center animate-in zoom-in-95 duration-400">
      
      {/* 1. Header Trophy & Starburst Glow (matches reference image 1) */}
      <div className="relative pt-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative inline-block mb-3">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 flex items-center justify-center shadow-2xl shadow-yellow-500/50 mx-auto transform hover:rotate-3 transition-transform">
            <Trophy className="w-16 h-16 text-slate-950 fill-amber-950" />
          </div>
          <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-3 -right-3 animate-bounce" />
          <Sparkles className="w-6 h-6 text-amber-200 absolute -bottom-1 -left-3 animate-pulse" />
        </div>

        {/* Congratulations & Username */}
        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-tight">
          Congratulations!
        </h2>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1 font-medium">
          Well played, <span className="font-bold text-white">{attempt.username}</span>! You completed {quiz.title}.
        </p>
      </div>

      {/* 2. Score Badge (matches reference image 1: You scored 8 / 10) */}
      <div className="bg-[#170e38] rounded-3xl p-6 sm:p-8 border border-purple-800/60 shadow-2xl space-y-4">
        <span className="text-xs uppercase font-extrabold text-purple-300 tracking-widest">
          You Scored
        </span>

        <div className="text-5xl sm:text-6xl font-black text-white tracking-tight flex items-baseline justify-center gap-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {attempt.score}
          </span>
          <span className="text-2xl text-purple-400/60 font-semibold">/</span>
          <span className="text-3xl text-purple-200">{attempt.total_questions}</span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-900/40 text-center">
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-3">
            <span className="block text-[10px] font-bold text-emerald-400 uppercase">Correct</span>
            <span className="text-xl font-black text-emerald-300">{attempt.correct_answers}</span>
          </div>

          <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-3">
            <span className="block text-[10px] font-bold text-rose-400 uppercase">Wrong</span>
            <span className="text-xl font-black text-rose-300">{attempt.wrong_answers}</span>
          </div>

          <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3">
            <span className="block text-[10px] font-bold text-purple-400 uppercase">Accuracy</span>
            <span className="text-xl font-black text-purple-200">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons (matches reference image 1: View Leaderboard & Play Again) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => {
            sounds.playClick();
            onViewLeaderboard();
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Award className="w-4 h-4 text-amber-300" />
          <span>View Leaderboard</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onPlayAgain();
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 hover:text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-purple-400" />
          <span>Play Again</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onReturnHome();
          }}
          className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-transparent hover:bg-purple-950/40 text-purple-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* 4. Question Breakdown Accordion */}
      {breakdown && breakdown.length > 0 && (
        <div className="bg-[#140b33] rounded-3xl p-6 border border-purple-900/40 text-left">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-sm font-bold text-white"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Review All Questions & Answers</span>
            </div>
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBreakdown && (
            <div className="space-y-4 mt-5 pt-4 border-t border-purple-900/50">
              {breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    item.is_correct
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-rose-950/20 border-rose-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {item.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs font-bold text-white">
                      Q{idx + 1}. {item.question_text}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-purple-200 mt-2 pl-6">
                    <div>
                      <span className="text-slate-400">Your choice: </span>
                      <span className={`font-bold ${item.is_correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {item.user_answer ? `Option ${item.user_answer}` : 'No answer'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Correct choice: </span>
                      <span className="font-bold text-amber-300">Option {item.correct_answer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
