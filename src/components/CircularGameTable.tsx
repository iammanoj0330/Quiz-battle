import React, { useState } from 'react';
import { 
  Trophy, 
  Crown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Forward, 
  Check, 
  ShieldAlert,
  Zap,
  Flame,
  Volume2
} from 'lucide-react';
import { MultiplayerGameState, MultiplayerParticipant, User } from '../types.ts';
import { sounds } from '../utils/audio.ts';

interface CircularGameTableProps {
  gameState: MultiplayerGameState;
  currentUser: User;
  onAnswer: (questionId: string, option: 'A' | 'B' | 'C' | 'D') => void;
  onPass: (questionId: string) => void;
}

export const CircularGameTable: React.FC<CircularGameTableProps> = ({
  gameState,
  currentUser,
  onAnswer,
  onPass,
}) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const {
    participants,
    current_question,
    current_question_index,
    total_questions,
    current_player_user_id,
    current_player_username,
    turn_time_left,
    is_paused,
    last_action_event,
    passed_user_ids,
  } = gameState;

  const isAuthor = gameState.author_id === currentUser.id || gameState.author_username.toLowerCase() === currentUser.username.toLowerCase();
  const isMyTurn = current_player_user_id === currentUser.id;

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (!isMyTurn || is_paused) return;
    sounds.playClick();
    setSelectedOption(opt);
  };

  const handleSubmit = () => {
    if (!isMyTurn || !selectedOption || !current_question || is_paused) return;
    onAnswer(current_question.id, selectedOption);
    setSelectedOption(null);
  };

  const handlePassClick = () => {
    if (!isMyTurn || !current_question || is_paused) return;
    sounds.playClick();
    onPass(current_question.id);
    setSelectedOption(null);
  };

  // Wedge colors matching the game wheel in reference photo
  const wedgeGradients = [
    'from-emerald-600/40 via-emerald-500/20 to-transparent',
    'from-cyan-600/40 via-cyan-500/20 to-transparent',
    'from-indigo-600/40 via-indigo-500/20 to-transparent',
    'from-purple-600/40 via-purple-500/20 to-transparent',
    'from-pink-600/40 via-pink-500/20 to-transparent',
    'from-amber-600/40 via-amber-500/20 to-transparent',
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      
      {/* Action Notification Banner (e.g. Correct! / Wrong! / Passed!) */}
      {last_action_event && (
        <div className={`mb-3 px-5 py-2 rounded-2xl border text-xs sm:text-sm font-black tracking-wide flex items-center gap-2 shadow-2xl animate-in slide-in-from-top duration-300 z-30 ${
          last_action_event.type === 'correct' 
            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-emerald-500/30'
            : last_action_event.type === 'wrong'
            ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-rose-500/30'
            : last_action_event.type === 'all_passed'
            ? 'bg-indigo-950/90 border-indigo-400 text-indigo-200 shadow-indigo-500/30'
            : 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-purple-500/30'
        }`}>
          {last_action_event.type === 'correct' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {last_action_event.type === 'wrong' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {last_action_event.type === 'pass' && <Forward className="w-5 h-5 text-purple-400 shrink-0" />}
          {last_action_event.type === 'timeout' && <Clock className="w-5 h-5 text-amber-400 shrink-0" />}
          <span>{last_action_event.message}</span>
        </div>
      )}

      {/* ----------------- CIRCULAR GAMING TABLE CONTAINER ----------------- */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[520px] flex items-center justify-center">
        
        {/* Glow Halo behind circular table */}
        <div className="absolute inset-4 rounded-[50%] bg-gradient-to-tr from-purple-600/20 via-indigo-500/15 to-cyan-500/20 blur-2xl pointer-events-none" />

        {/* 3D Oval / Circular Table Body */}
        <div className="relative w-[88%] h-[84%] rounded-[50%] bg-gradient-to-b from-[#1b0d42] via-[#10072b] to-[#070316] border-[6px] border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.25),inset_0_0_40px_rgba(147,51,234,0.3)] flex items-center justify-center overflow-hidden">
          
          {/* Neon inner border ring */}
          <div className="absolute inset-2.5 rounded-[50%] border-2 border-purple-500/40 pointer-events-none" />

          {/* Segmented Colorful Table Wedges (Like Trivia Table in Reference Image) */}
          <div className="absolute inset-0 rounded-[50%] overflow-hidden opacity-35 pointer-events-none">
            {wedgeGradients.map((grad, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-gradient-to-tr ${grad}`}
                style={{
                  transformOrigin: '50% 50%',
                  transform: `rotate(${i * (360 / wedgeGradients.length)}deg)`
                }}
              />
            ))}
          </div>

          {/* Table Center Graphic Pattern */}
          <div className="absolute w-44 h-44 rounded-full border border-purple-500/30 bg-purple-950/20 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 rounded-full border border-cyan-400/20" />
          </div>

          {/* ----------------- CENTER FLOATING QUESTION CARD ----------------- */}
          <div className="relative z-20 max-w-[340px] sm:max-w-md w-[90%] bg-[#12082b]/95 backdrop-blur-md border border-purple-500/60 rounded-3xl p-4 sm:p-5 text-center shadow-2xl space-y-3">
            
            {/* Top Question Tag & Timer */}
            <div className="flex items-center justify-between gap-2 border-b border-purple-800/50 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-900/70 text-purple-200 border border-purple-700/50">
                Q {current_question_index + 1} / {total_questions}
              </span>

              {/* Countdown Bar / Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono border ${
                turn_time_left <= 5
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-amber-500/20 border-amber-500 text-amber-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{turn_time_left}s</span>
              </div>
            </div>

            {/* Question Text */}
            <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-3">
              {current_question?.question_text || 'Waiting for next question...'}
            </h4>

            {/* Current Turn Status Pill */}
            <div className="pt-1">
              {isMyTurn ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/30 animate-pulse">
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>IT'S YOUR TURN TO ANSWER!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Waiting for <strong className="text-white font-extrabold">{current_player_username || 'Player'}</strong>...</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ----------------- SEATED PLAYERS AROUND CIRCULAR TABLE ----------------- */}
        {participants.map((player, idx) => {
          const totalPlayers = participants.length;
          // Distribute players uniformly along the ellipse perimeter
          const angle = (2 * Math.PI * idx) / totalPlayers - Math.PI / 2;
          const radiusX = 43; // horizontal radius in %
          const radiusY = 41; // vertical radius in %
          const leftPercent = 50 + radiusX * Math.cos(angle);
          const topPercent = 50 + radiusY * Math.sin(angle);

          const isCurrentTurn = player.user_id === current_player_user_id;
          const hasPassed = passed_user_ids.includes(player.user_id);
          const isMe = player.user_id === currentUser.id;

          return (
            <div
              key={player.user_id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 z-20 ${
                isCurrentTurn ? 'scale-115 z-30' : 'scale-100 opacity-90'
              }`}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`
              }}
            >
              {/* Active Player Crown / Turn Tag */}
              {isCurrentTurn ? (
                <div className="mb-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-lg shadow-yellow-500/40 animate-bounce">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  <span>TURN</span>
                </div>
              ) : hasPassed ? (
                <div className="mb-1 px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-700 text-[9px] font-bold">
                  PASSED
                </div>
              ) : (
                <div className="h-4" />
              )}

              {/* Avatar with Glow Aura */}
              <div className="relative">
                <img
                  src={player.avatar}
                  alt={player.username}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-950 object-cover shadow-2xl transition-all ${
                    isCurrentTurn
                      ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#070417] shadow-cyan-500/50'
                      : 'border-2 border-purple-600/80'
                  }`}
                />

                {/* Score badge at corner of avatar */}
                <div className={`absolute -bottom-1.5 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border shadow-md ${
                  player.score >= 0 
                    ? 'bg-emerald-600 text-white border-emerald-400' 
                    : 'bg-rose-600 text-white border-rose-400'
                }`}>
                  {player.score > 0 ? `+${player.score}` : player.score}
                </div>
              </div>

              {/* Player Name Tag */}
              <div className="mt-1 px-2 py-0.5 rounded-lg bg-[#0c0620]/90 border border-purple-800/80 text-[11px] font-extrabold text-white flex items-center gap-1 shadow-md">
                <span>{player.username}</span>
                {isMe && <span className="text-[9px] text-cyan-300">(You)</span>}
              </div>

            </div>
          );
        })}

      </div>

      {/* ----------------- BOTTOM CONSOLE TABLET (ANSWER & PASS CONTROLS) ----------------- */}
      {/* (Inspired directly by the player console at the bottom of the table in reference photo) */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1c0f44] via-[#150a35] to-[#0c0520] border-2 border-purple-600/50 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-purple-900/40 mt-2 space-y-4">
        
        {/* Tablet Header / Controls Status */}
        <div className="flex items-center justify-between text-xs font-bold text-purple-300 pb-1 border-b border-purple-800/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
            <span className="tracking-wide text-white uppercase text-[11px]">Player Console</span>
          </div>

          <div>
            {isAuthor ? (
              <span className="text-amber-300 bg-amber-950/60 border border-amber-600/50 px-2.5 py-0.5 rounded-full text-[10px]">
                Author Spectator Mode
              </span>
            ) : isMyTurn ? (
              <span className="text-emerald-300 bg-emerald-950/60 border border-emerald-600/50 px-2.5 py-0.5 rounded-full text-[10px] animate-pulse">
                Your Turn (+2 Correct / -1 Wrong / 0 Pass)
              </span>
            ) : (
              <span className="text-purple-400 text-[10px]">
                Waiting for active turn
              </span>
            )}
          </div>
        </div>

        {/* 4 MCQ Option Buttons (like Tennis, Horseshoes, Badminton, Volleyball in reference) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { key: 'A' as const, label: current_question?.option_a },
            { key: 'B' as const, label: current_question?.option_b },
            { key: 'C' as const, label: current_question?.option_c },
            { key: 'D' as const, label: current_question?.option_d },
          ].map(({ key, label }) => {
            const isSelected = selectedOption === key;

            return (
              <button
                key={key}
                type="button"
                disabled={!isMyTurn || is_paused}
                onClick={() => handleSelectOption(key)}
                className={`py-3 px-4 rounded-2xl text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all duration-150 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02] border-2 border-cyan-300'
                    : isMyTurn
                    ? 'bg-[#0e0724] hover:bg-[#1a0e42] text-purple-100 border border-purple-700/60 active:scale-98 cursor-pointer'
                    : 'bg-[#09041a] text-purple-400/50 border border-purple-900/40 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-white text-slate-950' : 'bg-purple-900/60 text-purple-300'
                  }`}>
                    {key}
                  </span>
                  <span className="truncate">{label || `Option ${key}`}</span>
                </div>

                {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Action Controls: Submit Answer & Pass Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          
          {/* Rules Reminder Pill */}
          <div className="text-[11px] text-purple-300/70 hidden sm:flex items-center gap-2">
            <span>Rules:</span>
            <span className="text-emerald-400 font-bold">+2 Correct</span>
            <span>•</span>
            <span className="text-rose-400 font-bold">-1 Wrong</span>
            <span>•</span>
            <span className="text-purple-300 font-bold">Pass = 0</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* PASS BUTTON (RULE C, D) */}
            <button
              type="button"
              disabled={!isMyTurn || is_paused}
              onClick={handlePassClick}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              title="Pass question to next player (0 marks)"
            >
              <Forward className="w-4 h-4 text-purple-400" />
              <span>Pass Turn</span>
            </button>

            {/* SUBMIT ANSWER BUTTON */}
            <button
              type="button"
              disabled={!isMyTurn || !selectedOption || is_paused}
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Submit Answer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

