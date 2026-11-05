import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Forward, 
  ArrowRight, 
  RotateCcw, 
  Home, 
  Award,
  Sparkles
} from 'lucide-react';
import { MultiplayerGameState, User } from '../types.ts';
import { sounds } from '../utils/audio.ts';

interface MultiplayerResultsModalProps {
  gameState: MultiplayerGameState;
  currentUser: User;
  onGoHome: () => void;
  onViewLeaderboard: () => void;
  onCreateAnother: () => void;
}

export const MultiplayerResultsModal: React.FC<MultiplayerResultsModalProps> = ({
  gameState,
  currentUser,
  onGoHome,
  onViewLeaderboard,
  onCreateAnother,
}) => {
  const rankings = gameState.final_rankings || [];
  const winner = rankings[0];

  useEffect(() => {
    sounds.playFanfare();

    // Trigger celebratory confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#9333ea', '#06b6d4', '#eab308', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#140a33] border-2 border-purple-500/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-6 animate-in zoom-in-95 my-auto">
        
        {/* Header Celebration */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/40 border-2 border-yellow-200">
              <Trophy className="w-12 h-12 text-slate-950 fill-amber-950" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Battle Completed!
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80">
            {winner 
              ? <>🏆 Congratulations to <strong className="text-amber-300 font-extrabold">{winner.username}</strong> for winning the Circular Quiz Battle!</>
              : 'Match finalized with live scores recorded.'}
          </p>
        </div>

        {/* Podium Top 3 (if at least 2 players) */}
        {rankings.length >= 2 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2 pb-4">
            
            {/* Rank 2 (Silver) */}
            {rankings[1] && (
              <div className="bg-gradient-to-t from-slate-800 to-slate-900 border border-slate-600/60 rounded-2xl p-3 text-center space-y-1.5 shadow-lg">
                <span className="text-lg">🥈</span>
                <img 
                  src={rankings[1].avatar} 
                  alt={rankings[1].username}
                  className="w-10 h-10 rounded-full mx-auto border-2 border-slate-400"
                />
                <span className="text-xs font-bold text-white block truncate">
                  {rankings[1].username}
                </span>
                <span className="text-sm font-black text-slate-300 font-mono">
                  {rankings[1].score} pts
                </span>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {rankings[0] && (
              <div className="bg-gradient-to-t from-amber-600/30 to-yellow-500/20 border-2 border-yellow-400 rounded-3xl p-4 text-center space-y-2 shadow-xl shadow-yellow-500/20 -translate-y-2">
                <Crown className="w-6 h-6 text-yellow-300 fill-yellow-400 mx-auto" />
                <img 
                  src={rankings[0].avatar} 
                  alt={rankings[0].username}
                  className="w-12 h-12 rounded-full mx-auto ring-4 ring-yellow-400"
                />
                <span className="text-xs sm:text-sm font-black text-white block truncate">
                  {rankings[0].username}
                </span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                  {rankings[0].score} pts
                </span>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {rankings[2] && (
              <div className="bg-gradient-to-t from-amber-950 to-[#221008] border border-amber-800/60 rounded-2xl p-3 text-center space-y-1.5 shadow-lg">
                <span className="text-lg">🥉</span>
                <img 
                  src={rankings[2].avatar} 
                  alt={rankings[2].username}
                  className="w-10 h-10 rounded-full mx-auto border-2 border-amber-700"
                />
                <span className="text-xs font-bold text-white block truncate">
                  {rankings[2].username}
                </span>
                <span className="text-sm font-black text-amber-500 font-mono">
                  {rankings[2].score} pts
                </span>
              </div>
            )}

          </div>
        )}

        {/* Detailed Player Rankings Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 px-1 flex items-center justify-between">
            <span>Official Rankings</span>
            <span className="text-[10px] text-purple-400">Host excluded from player scores</span>
          </h4>

          <div className="bg-[#0b051e] border border-purple-800/60 rounded-2xl overflow-hidden divide-y divide-purple-900/40 max-h-56 overflow-y-auto">
            {rankings.map((player) => {
              const isCurrentUser = player.user_id === currentUser.id;

              return (
                <div 
                  key={player.user_id}
                  className={`p-3 flex items-center justify-between gap-3 ${
                    isCurrentUser ? 'bg-purple-900/40 border-l-4 border-cyan-400' : 'hover:bg-purple-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      player.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : player.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : player.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-purple-900/60 text-purple-300'
                    }`}>
                      #{player.rank}
                    </span>

                    <img 
                      src={player.avatar} 
                      alt={player.username} 
                      className="w-8 h-8 rounded-full border border-purple-600 shrink-0"
                    />

                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                        {player.username}
                        {isCurrentUser && <span className="text-[10px] text-cyan-300 font-normal">(You)</span>}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-purple-400 mt-0.5">
                        <span className="text-emerald-400 font-bold">{player.correct_answers} Correct (+2)</span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">{player.wrong_answers} Wrong (-1)</span>
                        <span>•</span>
                        <span>{player.passed_count} Passed</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black font-mono text-amber-300">
                      {player.score > 0 ? `+${player.score}` : player.score}
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold block">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={onGoHome}
            className="py-3 px-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-4 h-4 text-purple-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={onViewLeaderboard}
            className="py-3 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={onCreateAnother}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
          >
            <span>Create Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

