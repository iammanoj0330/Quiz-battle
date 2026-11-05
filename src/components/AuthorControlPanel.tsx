import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Crown, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Clock, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { MultiplayerGameState } from '../types.ts';
import { sounds } from '../utils/audio.ts';

interface AuthorControlPanelProps {
  gameState: MultiplayerGameState;
  onPause: () => void;
  onResume: () => void;
  onEndGame: () => void;
}

export const AuthorControlPanel: React.FC<AuthorControlPanelProps> = ({
  gameState,
  onPause,
  onResume,
  onEndGame,
}) => {
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const { status, is_paused, participants, current_player_username } = gameState;

  return (
    <div className="bg-[#13092e] border-2 border-amber-500/40 rounded-3xl p-4 shadow-2xl space-y-3">
      
      {/* Author Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Crown className="w-5 h-5 fill-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Author Control Console</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                HOST ONLY
              </span>
            </h4>
            <p className="text-[11px] text-purple-300/80">
              You are managing this circular match as game director. You do not participate in answering or scoring.
            </p>
          </div>
        </div>

        {/* Live Match Summary Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-purple-300">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{participants.length} Players</span>
          </div>
          <span className="text-purple-600">•</span>
          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <span>Turn: {current_player_username || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          {is_paused ? (
            <button
              onClick={() => {
                sounds.playClick();
                onResume();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume Match</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onPause();
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30 active:scale-95"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause Match</span>
            </button>
          )}

          <span className="text-[11px] text-purple-300/70 hidden sm:inline">
            {is_paused ? 'Match is currently paused' : 'Match running live'}
          </span>
        </div>

        {/* End Game Button */}
        <div>
          <button
            onClick={() => {
              sounds.playClick();
              setShowConfirmEnd(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-600/60 text-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>End Match Now</span>
          </button>
        </div>
      </div>

      {/* End Game Confirmation Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#180b38] border border-rose-500/60 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-black text-white">End Match Early?</h4>
            <p className="text-xs text-purple-200/80">
              Are you sure you want to end this quiz battle now? Final rankings and player scores will be calculated based on current standings.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="py-2.5 px-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmEnd(false);
                  onEndGame();
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Yes, End Game
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

