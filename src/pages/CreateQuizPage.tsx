import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  Clock, 
  Layers,
  Users,
  Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { WaitingLobbyModal } from '../components/WaitingLobbyModal.tsx';
import { sounds } from '../utils/audio.ts';

interface QuestionDraft {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

interface CreateQuizPageProps {
  onSuccessNavigate: (roomCode: string) => void;
  onNavigateHome: () => void;
}

export const CreateQuizPage: React.FC<CreateQuizPageProps> = ({ onSuccessNavigate, onNavigateHome }) => {
  const { user, token } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [startingDurationMinutes, setStartingDurationMinutes] = useState(5);
  const [answeringDurationSeconds, setAnsweringDurationSeconds] = useState(25);
  const [maxPlayers, setMaxPlayers] = useState(8);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddQuestion = () => {
    sounds.playClick();
    setQuestions([
      ...questions,
      {
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A'
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    sounds.playClick();
    if (questions.length <= 1) {
      setErrorMsg('A quiz must have at least one question.');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== index);
    setQuestions(updated);
  };

  const handleQuestionChange = (index: number, field: keyof QuestionDraft, value: string) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a Quiz Title.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setErrorMsg(`Question ${i + 1} has an empty question statement.`);
        return;
      }
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        setErrorMsg(`Question ${i + 1} must have all 4 options filled in.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          time_limit_minutes: timeLimit,
          starting_duration_minutes: startingDurationMinutes,
          answering_duration_seconds: answeringDurationSeconds,
          max_players: maxPlayers,
          questions
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create quiz');
      }

      sounds.playFanfare();
      setCreatedRoomCode(data.room_code);
      setCreatedQuizId(data.quiz.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while saving your quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    sounds.playClick();
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header (matches reference image 1: + Create Your Quiz) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-purple-400">+</span>
            <span>Create Your Quiz</span>
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Build your personalized challenge questions and share the room code with peers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-300">Logged in as:</span>
          <span className="text-xs font-bold text-white bg-purple-900/60 px-3 py-1 rounded-full border border-purple-700/50">
            {user?.username || 'Host'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Quiz Meta Card */}
        <div className="bg-[#170e38] rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. General Knowledge Challenge"
              className="w-full px-4 py-3 bg-[#0f0928] border border-purple-800/60 rounded-2xl text-white placeholder-purple-400/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Waiting Lobby Time</span>
              </label>
              <select
                value={startingDurationMinutes}
                onChange={(e) => setStartingDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f0928] border border-purple-800/60 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value={5}>5 Minutes (Default)</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Turn Answering Time</span>
              </label>
              <select
                value={answeringDurationSeconds}
                onChange={(e) => setAnsweringDurationSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f0928] border border-purple-800/60 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds</option>
                <option value={25}>25 Seconds (Default)</option>
                <option value={30}>30 Seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Max Player Capacity</span>
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f0928] border border-purple-800/60 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value={4}>4 Players</option>
                <option value={6}>6 Players</option>
                <option value={8}>8 Players (Default)</option>
                <option value={12}>12 Players</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Quiz Time Limit</span>
              </label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f0928] border border-purple-800/60 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value={3}>3 Minutes</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Add Questions</h3>
            <span className="text-xs bg-purple-900/60 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
              {questions.length} Total
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Questions List (matches reference image 1) */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xl border border-purple-100 transition-all space-y-4"
            >
              {/* Question Statement + Delete Action */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Question {qIndex + 1}
                  </label>
                  <input
                    type="text"
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                    placeholder="Enter question statement (e.g. What is the capital of India?)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors mt-5 shrink-0"
                    title="Remove question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 4 MCQ Options */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-bold text-slate-600">
                  Options & Correct Answer (Select the radio of the correct answer):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const fieldKey = `option_${opt.toLowerCase()}` as keyof QuestionDraft;
                    const isSelected = q.correct_option === opt;

                    return (
                      <div
                        key={opt}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/30'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={isSelected}
                          onChange={() => handleQuestionChange(qIndex, 'correct_option', opt)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer ml-1"
                        />
                        <span className="font-bold text-xs text-purple-900 w-4">{opt}.</span>
                        <input
                          type="text"
                          value={q[fieldKey] as string}
                          onChange={(e) => handleQuestionChange(qIndex, fieldKey, e.target.value)}
                          placeholder={`Option ${opt}`}
                          className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                          required
                        />
                        {isSelected && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md shrink-0">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/60 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Question</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>{loading ? 'Creating Quiz...' : 'Create Quiz'}</span>
          </button>
        </div>

      </form>

      {/* Waiting Lobby Modal & Success Popup */}
      {createdRoomCode && user && (
        <WaitingLobbyModal
          roomCode={createdRoomCode}
          quizTitle={title}
          currentUser={user}
          onEnterGame={(code) => onSuccessNavigate(code)}
          onGoHome={onNavigateHome}
        />
      )}

    </div>
  );
};
