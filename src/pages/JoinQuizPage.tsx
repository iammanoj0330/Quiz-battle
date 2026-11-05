import React, { useState } from 'react';
import { 
  Users, 
  Gamepad2, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { sounds } from '../utils/audio.ts';

interface JoinQuizPageProps {
  onJoinSuccess: (roomCode: string, quizId: string) => void;
}

export const JoinQuizPage: React.FC<JoinQuizPageProps> = ({ onJoinSuccess }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeQuizzes, setActiveQuizzes] = useState<Array<{ id: string; title: string; room_code: string }>>([]);

  React.useEffect(() => {
    fetch('/api/quizzes')
      .then((res) => (res.ok ? res.json() : { quizzes: [] }))
      .then((data) => {
        if (Array.isArray(data.quizzes)) {
          setActiveQuizzes(data.quizzes);
        }
      })
      .catch(() => {});
  }, []);

  const handleJoin = async (e?: React.FormEvent, codeToUse?: string) => {
    if (e) e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const code = (codeToUse || roomCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter a Room Code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/quizzes/code/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Quiz room not found.');
      }

      sounds.playCorrect();
      onJoinSuccess(data.quiz.room_code || code, data.quiz.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid room code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header (matches reference image 1: Join a Quiz) */}
      <div className="text-center sm:text-left border-b border-purple-900/40 pb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
          <div className="p-2 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-700/50">
            <Users className="w-6 h-6" />
          </div>
          <span>Join a Quiz</span>
        </h2>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
          Enter the unique Room Code provided by your friend or teacher to participate.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Join Box (matches reference image 1) */}
      <div className="bg-[#170e38] rounded-3xl p-6 sm:p-10 border border-purple-800/50 shadow-2xl space-y-6">
        <form onSubmit={(e) => handleJoin(e)} className="space-y-4">
          <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
            Enter Room Code
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Hash className="w-5 h-5 absolute left-4 top-3.5 text-purple-400" />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. QZ101 or QZ123"
                maxLength={8}
                className="w-full pl-12 pr-4 py-3 bg-[#0d0725] border border-purple-700/60 rounded-2xl text-xl font-mono font-black text-amber-300 placeholder-purple-500/40 tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              <span>{loading ? 'Joining...' : 'Join'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Live Available Quiz Rooms */}
        {activeQuizzes.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-purple-300/70 mb-2 font-medium">
              Active Quiz Battle Rooms:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeQuizzes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRoomCode(item.room_code);
                    handleJoin(undefined, item.room_code);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-xs text-purple-200 font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span className="font-bold text-amber-300">{item.room_code}</span>
                  <span className="text-purple-400">({item.title})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Friendly Gaming Illustration: "Let's Play Together!" (matches reference image 1) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24104d] via-[#1a0c3b] to-[#0f0724] p-8 border border-purple-700/30 shadow-xl text-center space-y-4">
        <div className="flex justify-center items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shadow-lg transform -rotate-6">
            <Gamepad2 className="w-9 h-9" />
          </div>
          <div className="w-20 h-20 rounded-3xl bg-purple-600 text-white flex items-center justify-center shadow-2xl transform rotate-3">
            <Users className="w-10 h-10" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 flex items-center justify-center shadow-lg transform rotate-6">
            <Sparkles className="w-9 h-9" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            Let's Play Together!
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto mt-1">
            Challenge your classmates, test your knowledge in timed rounds, and see who climbs to the top of the podium!
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-time Anti-Cheat Backend Scoring</span>
        </div>
      </div>

    </div>
  );
};
