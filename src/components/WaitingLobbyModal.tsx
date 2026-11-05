import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Users, 
  Clock, 
  Crown, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Hourglass,
  Layers
} from 'lucide-react';
import { MultiplayerGameState, User } from '../types.ts';
import { getSocket } from '../utils/socket.ts';
import { sounds } from '../utils/audio.ts';

interface WaitingLobbyModalProps {
  roomCode: string;
  quizTitle: string;
  currentUser: User;
  onEnterGame: (roomCode: string) => void;
  onGoHome: () => void;
}

export const WaitingLobbyModal: React.FC<WaitingLobbyModalProps> = ({
  roomCode,
  quizTitle,
  currentUser,
  onEnterGame,
  onGoHome,
}) => {
  const [copied, setCopied] = useState(false);
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);
  const [isReadyNotification, setIsReadyNotification] = useState(false);
  const [startingDurationMinutes, setStartingDurationMinutes] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthor = gameState
    ? gameState.author_id === currentUser.id || gameState.author_username.toLowerCase() === currentUser.username.toLowerCase()
    : true;

  useEffect(() => {
    const socket = getSocket();

    // Join room
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
      if (state.lobby_end_time) {
        const remaining = Math.max(0, Math.floor((state.lobby_end_time - Date.now()) / 1000));
        setTimeLeftSeconds(remaining);
      }
    };

    const handleCountdownUpdate = (data: { timeLeftSeconds: number; isReady: boolean }) => {
      setTimeLeftSeconds(data.timeLeftSeconds);
      if (data.isReady) {
        setIsReadyNotification(true);
        sounds.playFanfare();
      }
    };

    const handleLobbyReady = () => {
      setIsReadyNotification(true);
      sounds.playFanfare();
    };

    const handleGameStarted = () => {
      sounds.playCorrect();
      onEnterGame(roomCode);
    };

    const handleError = (data: { message: string }) => {
      setErrorMessage(data.message);
    };

    socket.on('game_state_update', handleStateUpdate);
    socket.on('countdown_updated', handleCountdownUpdate);
    socket.on('lobby_ready', handleLobbyReady);
    socket.on('game_started', handleGameStarted);
    socket.on('error_message', handleError);

    // Initial fetch via REST fallback
    fetch(`/api/rooms/${roomCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.room) {
          setGameState(data.room);
          if (data.room.lobby_end_time) {
            const rem = Math.max(0, Math.floor((data.room.lobby_end_time - Date.now()) / 1000));
            setTimeLeftSeconds(rem);
          }
        }
      })
      .catch(() => {});

    return () => {
      socket.off('game_state_update', handleStateUpdate);
      socket.off('countdown_updated', handleCountdownUpdate);
      socket.off('lobby_ready', handleLobbyReady);
      socket.off('game_started', handleGameStarted);
      socket.off('error_message', handleError);
    };
  }, [roomCode, currentUser, onEnterGame]);

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    sounds.playClick();
    const socket = getSocket();
    socket.emit('start_game', {
      roomCode,
      authorId: currentUser.id
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const participants = gameState?.participants || [];
  const authorUsername = gameState?.author_username || currentUser.username;
  const status = gameState?.status || 'waiting';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#150c33] border border-purple-600/50 rounded-3xl max-w-xl w-full p-5 sm:p-7 text-white shadow-2xl space-y-5 animate-in zoom-in-95 my-auto">
        
        {/* Header Icon + Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quiz Created Successfully!
          </h3>
          <p className="text-xs text-purple-200/80 max-w-md mx-auto">
            Your quiz <span className="text-amber-300 font-bold">"{quizTitle}"</span> is live! Share this Room Code with friends to join the circular battle.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Room Code Card (matches reference style) */}
        <div className="bg-[#0b051e] border border-purple-700/60 rounded-2xl p-4 flex items-center justify-between shadow-inner">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
              Room Code
            </span>
            <p className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-widest">
              {roomCode}
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Countdown & Lobby Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1c1042] border border-purple-700/40 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Hourglass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80 block">
                Starts In
              </span>
              <span className="text-lg font-black font-mono text-amber-300">
                {formatTimer(timeLeftSeconds)}
              </span>
            </div>
          </div>

          <div className="bg-[#1c1042] border border-purple-700/40 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80 block">
                Status
              </span>
              <span className="text-xs font-bold capitalize text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                {status === 'waiting' ? 'Waiting for players' : status}
              </span>
            </div>
          </div>
        </div>

        {/* Ready Notification for Author */}
        {isReadyNotification && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-bold">
              Starting countdown complete! Room is ready. Author can start the battle now!
            </span>
          </div>
        )}

        {/* Joined Players Section (Scrollable list with Author at top) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-200">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Players Joined ({participants.length})</span>
            </div>
            <span className="text-[11px] text-purple-400 font-medium">
              Max Capacity: {gameState?.max_players || 8}
            </span>
          </div>

          <div className="bg-[#0b051e] border border-purple-800/60 rounded-2xl p-2.5 max-h-48 overflow-y-auto space-y-2 divide-y divide-purple-900/40">
            
            {/* 1. Author Entry (always fixed at top, not counted in participants) */}
            <div className="pt-1.5 first:pt-0 flex items-center justify-between px-2 py-1.5 bg-purple-950/40 rounded-xl border border-purple-700/30">
              <div className="flex items-center gap-2.5">
                <img 
                  src={gameState?.author_avatar || currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${authorUsername}`} 
                  alt={authorUsername} 
                  className="w-8 h-8 rounded-full bg-purple-900 border border-amber-400"
                />
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    {authorUsername}
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </span>
                  <span className="text-[10px] text-purple-400 font-medium block">
                    Game Host & Controller
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Author
              </span>
            </div>

            {/* 2. Normal Joined Players */}
            {participants.length === 0 ? (
              <div className="text-center py-6 text-purple-400/70 text-xs">
                <Hourglass className="w-6 h-6 mx-auto mb-1 opacity-50 animate-pulse" />
                <span>Waiting for participants to join with room code <strong className="text-amber-300 font-mono">{roomCode}</strong>...</span>
              </div>
            ) : (
              participants.map((player, idx) => (
                <div key={player.user_id} className="pt-2 flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-purple-400 w-4">
                      {idx + 1}.
                    </span>
                    <img 
                      src={player.avatar} 
                      alt={player.username} 
                      className="w-7 h-7 rounded-full bg-purple-900 border border-purple-600"
                    />
                    <span className="text-xs font-bold text-purple-100">
                      {player.username}
                      {player.user_id === currentUser.id && (
                        <span className="ml-1 text-[10px] text-purple-400 font-normal">(You)</span>
                      )}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Player
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onGoHome}
            className="py-3 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-300 font-bold text-xs transition-colors"
          >
            Go to Dashboard
          </button>

          {isAuthor ? (
            <button
              onClick={handleStartGame}
              disabled={participants.length === 0}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{participants.length === 0 ? 'Waiting for Players...' : 'Start Game (Author)'}</span>
            </button>
          ) : (
            <button
              onClick={() => onEnterGame(roomCode)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Enter Game Table</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

