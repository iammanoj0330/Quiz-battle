import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Users, 
  Crown, 
  Trophy, 
  Clock, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Gamepad2,
  ShieldCheck
} from 'lucide-react';
import { MultiplayerGameState, User } from '../types.ts';
import { CircularGameTable } from '../components/CircularGameTable.tsx';
import { AuthorControlPanel } from '../components/AuthorControlPanel.tsx';
import { MultiplayerResultsModal } from '../components/MultiplayerResultsModal.tsx';
import { getSocket } from '../utils/socket.ts';
import { sounds } from '../utils/audio.ts';

interface MultiplayerGamePageProps {
  roomCode: string;
  currentUser: User;
  onNavigateHome: () => void;
  onViewLeaderboard: () => void;
  onCreateQuiz: () => void;
}

export const MultiplayerGamePage: React.FC<MultiplayerGamePageProps> = ({
  roomCode,
  currentUser,
  onNavigateHome,
  onViewLeaderboard,
  onCreateQuiz,
}) => {
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.emit('join_room', {
      roomCode,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar
      }
    });

    const handleStateUpdate = (state: MultiplayerGameState) => {
      setGameState(state);
      setLoading(false);
    };

    const handleTimerTick = (data: { timeLeft: number; activeUserId: string }) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          turn_time_left: data.timeLeft,
          current_player_user_id: data.activeUserId
        };
      });
      if (data.timeLeft <= 5 && data.timeLeft > 0) {
        sounds.playTick();
      }
    };

    const handleAnswerResult = (data: { player: string; isCorrect: boolean; pointsChange: number }) => {
      if (data.isCorrect) {
        sounds.playCorrect();
      } else {
        sounds.playWrong();
      }
    };

    const handlePlayerPassed = () => {
      sounds.playClick();
    };

    const handleError = (data: { message: string }) => {
      setErrorMsg(data.message);
      setLoading(false);
    };

    socket.on('game_state_update', handleStateUpdate);
    socket.on('turn_timer_tick', handleTimerTick);
    socket.on('answer_result', handleAnswerResult);
    socket.on('player_passed', handlePlayerPassed);
    socket.on('error_message', handleError);

    // Initial fetch via REST
    fetch(`/api/rooms/${roomCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.room) {
          setGameState(data.room);
          setLoading(false);
        }
      })
      .catch(err => {
        setErrorMsg('Failed to fetch room state: ' + err.message);
        setLoading(false);
      });

    return () => {
      socket.off('game_state_update', handleStateUpdate);
      socket.off('turn_timer_tick', handleTimerTick);
      socket.off('answer_result', handleAnswerResult);
      socket.off('player_passed', handlePlayerPassed);
      socket.off('error_message', handleError);
    };
  }, [roomCode, currentUser]);

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnswer = (questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    const socket = getSocket();
    socket.emit('submit_answer', {
      roomCode,
      userId: currentUser.id,
      questionId,
      selectedOption: option
    });
  };

  const handlePass = (questionId: string) => {
    const socket = getSocket();
    socket.emit('pass_turn', {
      roomCode,
      userId: currentUser.id
    });
  };

  const handleAuthorPause = () => {
    const socket = getSocket();
    socket.emit('pause_game', { roomCode, authorId: currentUser.id });
  };

  const handleAuthorResume = () => {
    const socket = getSocket();
    socket.emit('resume_game', { roomCode, authorId: currentUser.id });
  };

  const handleAuthorEndGame = () => {
    const socket = getSocket();
    socket.emit('end_game', { roomCode, authorId: currentUser.id });
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 text-purple-300">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center animate-spin">
          <Gamepad2 className="w-7 h-7 text-purple-300" />
        </div>
        <p className="text-sm font-bold tracking-wide">CONNECTING TO MULTIPLAYER ARENA...</p>
      </div>
    );
  }

  if (errorMsg && !gameState) {
    return (
      <div className="max-w-md mx-auto my-12 bg-[#170c38] border border-rose-500/60 rounded-3xl p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-black text-white">Room Error</h3>
        <p className="text-xs text-rose-200">{errorMsg}</p>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!gameState) return null;

  const isAuthor = gameState.author_id === currentUser.id || gameState.author_username.toLowerCase() === currentUser.username.toLowerCase();
  const sortedParticipants = [...gameState.participants].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      
      {/* ----------------- TOP SECTION ----------------- */}
      <div className="bg-[#12082b]/95 border border-purple-800/60 rounded-3xl p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
        
        {/* Back to Dashboard + Quiz Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateHome();
            }}
            className="p-2.5 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 transition-colors shadow-md"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {gameState.quiz_title || 'Circular Quiz Battle'}
              </h2>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                gameState.status === 'in_progress'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : gameState.status === 'paused'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {gameState.status === 'in_progress' ? 'LIVE' : gameState.status}
              </span>
            </div>
            
            {/* Author Badge & Label */}
            <div className="flex items-center gap-1.5 text-xs text-purple-300/80 mt-0.5">
              <span>Host:</span>
              <strong className="text-amber-300 flex items-center gap-1">
                {gameState.author_username}
                <Crown className="w-3.5 h-3.5 fill-amber-300" />
              </strong>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Author
              </span>
            </div>
          </div>
        </div>

        {/* Room Code + Player Counter Pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Room Code Chip */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#09041a] border border-purple-700/70 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Code:
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-amber-300 tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:text-white text-purple-400 transition-colors"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Joined Players Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-950/80 border border-purple-700/60 text-xs font-bold text-purple-200">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{gameState.participants.length} Players</span>
          </div>
        </div>

      </div>

      {/* Author Control Toolbar (Only rendered for Quiz Author) */}
      {isAuthor && (
        <AuthorControlPanel
          gameState={gameState}
          onPause={handleAuthorPause}
          onResume={handleAuthorResume}
          onEndGame={handleAuthorEndGame}
        />
      )}

      {/* ----------------- 3-COLUMN MAIN ARENA ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ----------------- LEFT SECTION: PLAYERS JOINED PANEL ----------------- */}
        <div className="lg:col-span-3 bg-[#110729]/95 border border-purple-800/60 rounded-3xl p-4 shadow-xl space-y-3 order-2 lg:order-1">
          <div className="flex items-center justify-between border-b border-purple-800/50 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Participants ({gameState.participants.length})</span>
            </h3>
            <span className="text-[10px] text-purple-400 font-bold">Turn Order</span>
          </div>

          {/* Scrollable Player List with Turn Highlight */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 divide-y divide-purple-900/30">
            
            {/* Author Card at Top (Non-player) */}
            <div className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-2xl bg-amber-950/20 border border-amber-600/30">
              <div className="flex items-center gap-2">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${gameState.author_username}`}
                  alt={gameState.author_username}
                  className="w-7 h-7 rounded-full border border-amber-400"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {gameState.author_username}
                  </span>
                  <span className="text-[9px] text-amber-400 font-medium">
                    Host / Director
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Author
              </span>
            </div>

            {/* Normal Players */}
            {gameState.participants.map((player, idx) => {
              const isCurrent = player.user_id === gameState.current_player_user_id;
              const hasPassed = gameState.passed_user_ids.includes(player.user_id);
              const isMe = player.user_id === currentUser.id;

              return (
                <div
                  key={player.user_id}
                  className={`pt-2 flex items-center justify-between p-2 rounded-2xl transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-2 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'hover:bg-purple-950/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 w-3.5">
                      {idx + 1}.
                    </span>
                    <div className="relative">
                      <img 
                        src={player.avatar} 
                        alt={player.username}
                        className={`w-7 h-7 rounded-full ${isCurrent ? 'ring-2 ring-cyan-400' : 'border border-purple-700'}`}
                      />
                      {player.is_connected === false && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-black" title="Disconnected" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-white block truncate max-w-[100px]">
                        {player.username} {isMe && <span className="text-[9px] text-cyan-300">(You)</span>}
                      </span>
                      <span className={`text-[9px] font-bold block ${
                        isCurrent 
                          ? 'text-cyan-300 animate-pulse' 
                          : hasPassed 
                          ? 'text-purple-400' 
                          : 'text-purple-400/80'
                      }`}>
                        {isCurrent ? '👉 Answering...' : hasPassed ? 'Passed' : 'Waiting turn'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-black font-mono ${
                      player.score >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {player.score > 0 ? `+${player.score}` : player.score}
                    </span>
                    <span className="text-[9px] text-purple-400 block">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ----------------- CENTER SECTION: CIRCULAR GAME TABLE ----------------- */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
          <CircularGameTable
            gameState={gameState}
            currentUser={currentUser}
            onAnswer={handleAnswer}
            onPass={handlePass}
          />
        </div>

        {/* ----------------- RIGHT SECTION: LIVE SCORES & RANKS PANEL ----------------- */}
        <div className="lg:col-span-3 bg-[#110729]/95 border border-purple-800/60 rounded-3xl p-4 shadow-xl space-y-3 order-3">
          <div className="flex items-center justify-between border-b border-purple-800/50 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Live Scores</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold">+2 / -1 / 0</span>
          </div>

          {/* Ranked Live Standings */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {sortedParticipants.map((player, rankIdx) => {
              const rank = rankIdx + 1;
              const isCurrentUser = player.user_id === currentUser.id;

              return (
                <div
                  key={player.user_id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isCurrentUser
                      ? 'bg-purple-900/40 border-purple-500/80 shadow-md'
                      : 'bg-[#09041a]/80 border-purple-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-950 font-bold'
                        : rank === 3
                        ? 'bg-amber-700 text-white font-bold'
                        : 'bg-purple-950 text-purple-400 font-mono'
                    }`}>
                      #{rank}
                    </span>

                    <img 
                      src={player.avatar} 
                      alt={player.username}
                      className="w-7 h-7 rounded-full border border-purple-700"
                    />

                    <div>
                      <span className="text-xs font-bold text-white block truncate max-w-[90px]">
                        {player.username}
                      </span>
                      <span className="text-[9px] text-purple-400 block">
                        {player.correct_answers || 0}W / {player.wrong_answers || 0}L
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-amber-300">
                      {player.score > 0 ? `+${player.score}` : player.score}
                    </span>
                    <span className="text-[9px] text-purple-400 font-bold block">pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rules Legend Pill */}
          <div className="pt-2 border-t border-purple-900/40 text-[10px] text-purple-400/80 space-y-1">
            <div className="flex justify-between">
              <span>Correct Answer:</span>
              <strong className="text-emerald-400">+2 Marks</strong>
            </div>
            <div className="flex justify-between">
              <span>Wrong Answer:</span>
              <strong className="text-rose-400">-1 Mark</strong>
            </div>
            <div className="flex justify-between">
              <span>Pass / Timeout:</span>
              <strong className="text-purple-300">0 Marks (Next Player)</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ----------------- FINAL RESULTS MODAL (COMPLETED MATCH) ----------------- */}
      {gameState.status === 'completed' && (
        <MultiplayerResultsModal
          gameState={gameState}
          currentUser={currentUser}
          onGoHome={onNavigateHome}
          onViewLeaderboard={onViewLeaderboard}
          onCreateAnother={onCreateQuiz}
        />
      )}

    </div>
  );
};

