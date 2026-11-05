import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Flame, 
  Sparkles, 
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react';
import { LeaderboardEntry } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { sounds } from '../utils/audio.ts';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/40 ring-2 ring-yellow-200">
          🥇 1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 font-black text-xs flex items-center justify-center shadow-md ring-2 ring-slate-200">
          🥈 2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-amber-500">
          🥉 3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-purple-900/60 text-purple-200 font-bold text-xs flex items-center justify-center border border-purple-700/50">
        {rank}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header (matches reference image 1: Trophy + Leaderboard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-7 h-7 text-slate-950 fill-amber-950" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Leaderboard
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Top trivia gladiators ranked by total battle score & accuracy.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/50 border border-purple-700/50 text-xs text-purple-200 self-start sm:self-auto">
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Live Rankings</span>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-xs text-purple-300 font-semibold">Tallying scores...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-[#170e38] rounded-3xl p-10 border border-purple-800/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center mx-auto text-amber-300">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-black text-white">No Battle Rankings Yet</h3>
          <p className="text-xs sm:text-sm text-purple-300/80 max-w-md mx-auto">
            Be the first registered contender to participate in a quiz battle and claim the #1 Champion spot on the leaderboard!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Rank 2 (Silver) */}
              <div className="order-2 md:order-1 bg-[#170e38] rounded-3xl p-6 border border-slate-400/30 shadow-xl text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-slate-300/10 text-slate-200 px-3 py-1 rounded-bl-xl text-[10px] font-bold">
                  Rank #2
                </div>
                <div>
                  <div className="relative inline-block mx-auto mb-2">
                    <img
                      src={leaderboard[1].avatar}
                      alt={leaderboard[1].username}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-300 shadow-md mx-auto"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]">
                      2
                    </div>
                  </div>
                  <h4 className="font-extrabold text-white text-base truncate">{leaderboard[1].username}</h4>
                  <p className="text-xs text-slate-300">{leaderboard[1].quizzes_played} battles</p>
                </div>
                <div className="pt-3 border-t border-purple-900/50">
                  <span className="text-2xl font-black text-slate-200">{leaderboard[1].score}</span>
                  <span className="text-xs text-slate-400 ml-1">pts</span>
                </div>
              </div>

              {/* Rank 1 (Gold - Elevated) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-[#2a1352] to-[#170e38] rounded-3xl p-6 border-2 border-amber-400/60 shadow-2xl text-center space-y-3 relative overflow-hidden md:-translate-y-3 flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  <span>Champion</span>
                </div>
                <div>
                  <div className="relative inline-block mx-auto mb-2">
                    <img
                      src={leaderboard[0].avatar}
                      alt={leaderboard[0].username}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-400 shadow-xl shadow-amber-500/30 mx-auto"
                    />
                    <Crown className="w-6 h-6 text-yellow-300 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-md" />
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                      1
                    </div>
                  </div>
                  <h4 className="font-black text-white text-lg truncate">{leaderboard[0].username}</h4>
                  <p className="text-xs text-amber-200/90 font-medium">{leaderboard[0].quizzes_played} battles • {leaderboard[0].wins} wins</p>
                </div>
                <div className="pt-3 border-t border-purple-900/50">
                  <span className="text-3xl font-black text-amber-300">{leaderboard[0].score}</span>
                  <span className="text-xs text-amber-200/70 ml-1">pts</span>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="order-3 bg-[#170e38] rounded-3xl p-6 border border-amber-800/40 shadow-xl text-center space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-amber-700/20 text-amber-400 px-3 py-1 rounded-bl-xl text-[10px] font-bold">
                  Rank #3
                </div>
                <div>
                  <div className="relative inline-block mx-auto mb-2">
                    <img
                      src={leaderboard[2].avatar}
                      alt={leaderboard[2].username}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-600 shadow-md mx-auto"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]">
                      3
                    </div>
                  </div>
                  <h4 className="font-extrabold text-white text-base truncate">{leaderboard[2].username}</h4>
                  <p className="text-xs text-amber-400/80">{leaderboard[2].quizzes_played} battles</p>
                </div>
                <div className="pt-3 border-t border-purple-900/50">
                  <span className="text-2xl font-black text-amber-400">{leaderboard[2].score}</span>
                  <span className="text-xs text-amber-400/60 ml-1">pts</span>
                </div>
              </div>
            </div>
          )}

          {/* Full List (matches reference image 1: Rank, Avatar, Username, Score) */}
          <div className="bg-[#140b33] rounded-3xl border border-purple-800/40 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#1b0e45] border-b border-purple-800/40 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-300">
              <span className="w-16">Rank</span>
              <span className="flex-1 pl-4">Player</span>
              <span className="text-right">Score</span>
            </div>

            <div className="divide-y divide-purple-900/30">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                const isMe = user?.username.toLowerCase() === player.username.toLowerCase();

                return (
                  <div
                    key={player.id}
                    className={`p-4 sm:p-5 flex items-center justify-between transition-colors ${
                      isMe 
                        ? 'bg-purple-900/40 border-l-4 border-l-purple-500' 
                        : 'hover:bg-purple-900/20'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="w-16 flex items-center">
                      {getRankBadge(rank)}
                    </div>

                    {/* Avatar & Username */}
                    <div className="flex-1 flex items-center gap-3 pl-4">
                      <img
                        src={player.avatar}
                        alt={player.username}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-purple-600/50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm sm:text-base">
                            {player.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-purple-300/80">
                          {player.quizzes_played} played • {player.accuracy ?? 0}% acc
                        </span>
                      </div>
                    </div>

                    {/* Score (matches reference image 1: 100, 90, 80, 70, 60) */}
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                        {player.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
