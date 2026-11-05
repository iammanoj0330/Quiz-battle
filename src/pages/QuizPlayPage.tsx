import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Star, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Quiz, Question, QuizSubmissionResult } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { sounds } from '../utils/audio.ts';

interface QuizPlayPageProps {
  quizId: string;
  onFinishQuiz: (result: QuizSubmissionResult, quiz: Quiz) => void;
  onCancel: () => void;
}

export const QuizPlayPage: React.FC<QuizPlayPageProps> = ({ quizId, onFinishQuiz, onCancel }) => {
  const { token } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Per-question countdown timer (45 seconds per question as shown in reference: "Time Left: 00:45")
  const QUESTION_TIME = 45;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch quiz & questions
  useEffect(() => {
    async function fetchQuizData() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load quiz');
        }
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching quiz');
      } finally {
        setLoading(false);
      }
    }

    fetchQuizData();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (loading || submitting || questions.length === 0) return;

    setTimeLeft(QUESTION_TIME);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this question
          handleAutoAdvance();
          return QUESTION_TIME;
        }
        if (prev <= 6) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading, questions.length]);

  const handleAutoAdvance = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Auto submit
      submitQuiz();
    }
  };

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    sounds.playClick();
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option
    }));
  };

  const handleNext = () => {
    sounds.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Prepare payload
    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] || null
    }));

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersPayload })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      sounds.playFanfare();
      onFinishQuiz(data, quiz);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting quiz');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        <p className="text-purple-200 text-sm font-semibold">Preparing Quiz Arena...</p>
      </div>
    );
  }

  if (errorMsg || !quiz || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#170e38] border border-rose-600/40 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Unable to Load Quiz</h3>
        <p className="text-xs text-rose-200">{errorMsg || 'No questions found for this quiz.'}</p>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentSelected = selectedAnswers[currentQ.id];
  const answeredCount = Object.keys(selectedAnswers).length;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Top Bar (matches reference image 1: Quiz Battle logo, Q1/10 pill, Time Left: 00:45) */}
      <div className="flex items-center justify-between bg-[#150a36] px-5 py-3.5 rounded-2xl border border-purple-800/40 shadow-xl">
        
        {/* Left: Quiz Battle brand / cancel button */}
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-md">
            <Trophy className="w-4 h-4 text-slate-950 fill-amber-950" />
          </div>
          <span className="font-extrabold text-sm sm:text-base hidden sm:inline">Quiz Battle</span>
        </button>

        {/* Center: Question Counter Pill (matches reference image 1: Q1/10) */}
        <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-extrabold text-xs sm:text-sm tracking-wider shadow-inner border border-purple-400/30">
          Q{currentIndex + 1} / {questions.length}
        </div>

        {/* Right: Countdown Timer (matches reference image 1: Time Left: 00:45) */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-colors border ${
          timeLeft <= 10 
            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse' 
            : 'bg-purple-950/80 text-purple-200 border-purple-700/50'
        }`}>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Time Left: {formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#1b0e45] h-2 rounded-full overflow-hidden border border-purple-900/50">
        <div 
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* 2. Main Question Card (matches reference image 1: clean white card with purple highlighted option) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 text-slate-900 shadow-2xl border border-purple-100 min-h-[380px] flex flex-col justify-between">
        
        {/* Question Text */}
        <div className="mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-600 block mb-2">
            {quiz.title} • Question #{currentIndex + 1}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {currentQ.question_text}
          </h3>
        </div>

        {/* 4 Multiple Choice Options (matches reference image 1: A. Earth, B. Jupiter with checkmark) */}
        <div className="space-y-3.5">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const fieldKey = `option_${opt.toLowerCase()}` as keyof Question;
            const optText = currentQ[fieldKey] as string;
            const isSelected = currentSelected === opt;

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`w-full text-left p-4 rounded-2xl text-sm sm:text-base font-semibold flex items-center justify-between transition-all duration-200 ${
                  isSelected
                    ? 'bg-purple-50 text-purple-950 border-2 border-purple-600 ring-4 ring-purple-100 shadow-md transform scale-[1.01]'
                    : 'bg-slate-50 text-slate-800 border-2 border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {opt}
                  </span>
                  <span>{optText}</span>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Bottom Bar (matches reference image 1: Score: 0 & Next Question button) */}
      <div className="flex items-center justify-between pt-2">
        
        {/* Current score badge indicator */}
        <div className="flex items-center gap-2 bg-[#170e38] px-4 py-2.5 rounded-2xl border border-purple-800/40 text-xs sm:text-sm font-bold text-amber-300 shadow-lg">
          <Star className="w-4 h-4 fill-amber-300" />
          <span>Answered: {answeredCount}/{questions.length}</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={submitting}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : isLastQuestion ? (
              <>
                <span>Submit Quiz</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
