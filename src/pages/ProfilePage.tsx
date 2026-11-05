import React, { useEffect, useState } from 'react';
import { 
  User, 
  Trophy, 
  Flame, 
  Percent, 
  HelpCircle, 
  Clock, 
  Play, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Sparkles,
  Loader2,
  Calendar
} from 'lucide-react';
import { ProfileData } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { sounds } from '../utils/audio.ts';

interface ProfilePageProps {
  onStartQuiz: (quizId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onStartQuiz }) => {
  const { user, token, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my_quizzes' | 'history'>('my_quizzes');

  // Edit profile modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        if (data.user) {
          setEditTitle(data.user.title || 'Contender');
          setEditAvatar(data.user.avatar || '');
          setEditUsername(data.user.username || '');
        }
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    sounds.playClick();
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (e) {
      console.error('Failed to delete quiz:', e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setSaving(true);
    const res = await updateProfile({
      title: editTitle.trim(),
      avatar: editAvatar.trim(),
      username: editUsername.trim()
    });
    setSaving(false);
    if (res.success) {
      setIsEditing(false);
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-xs text-purple-300 font-semibold">Loading profile data...</p>
      </div>
    );
  }

  const currentUser = profileData?.user || user;
  const stats = profileData?.stats || {
    total_quizzes_played: 0,
    total_wins: 0,
    accuracy_percentage: 0,
    total_score: 0
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Profile Card */}
      <div className="bg-[#170e38] rounded-3xl p-6 sm:p-10 border border-purple-800/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left relative z-10">
          
          {/* Avatar with Ring */}
          <div className="relative">
            <img
              src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.username || 'Player')}`}
              alt={currentUser?.username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-purple-500 shadow-xl shadow-purple-900/40"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md">
              <Trophy className="w-4 h-4 fill-slate-950" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentUser?.username || 'Player'}
              </h2>
              <span className="self-center sm:self-auto text-xs font-bold text-purple-300 bg-purple-900/70 border border-purple-700/60 px-3 py-1 rounded-full">
                {currentUser?.title || 'Contender'}
              </span>
            </div>
            <p className="text-xs text-purple-300/70">{currentUser?.email || ''}</p>

            <div className="pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center justify-center sm:justify-start gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Stats Badges (matches reference image 1: 12 Quizzes, 8 Wins, 85% Accuracy) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-[#0e0724] p-3.5 rounded-2xl border border-purple-800/40">
            <div className="text-center px-2">
              <span className="text-xl sm:text-2xl font-black text-white block">
                {stats.total_quizzes_played}
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Quizzes
              </span>
            </div>

            <div className="w-[1px] h-8 bg-purple-900/60" />

            <div className="text-center px-2">
              <span className="text-xl sm:text-2xl font-black text-amber-300 block">
                {stats.total_wins}
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                Wins
              </span>
            </div>

            <div className="w-[1px] h-8 bg-purple-900/60" />

            <div className="text-center px-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 block">
                {stats.accuracy_percentage}%
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">
                Accuracy
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Tabs: My Quizzes / Quiz History (matches reference image 1) */}
      <div className="space-y-6">
        <div className="flex border-b border-purple-900/40">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('my_quizzes');
            }}
            className={`py-3 px-6 text-sm font-bold transition-all relative ${
              activeTab === 'my_quizzes'
                ? 'text-white'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            My Quizzes ({profileData?.my_quizzes?.length || 0})
            {activeTab === 'my_quizzes' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('history');
            }}
            className={`py-3 px-6 text-sm font-bold transition-all relative ${
              activeTab === 'history'
                ? 'text-white'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            Quiz History ({profileData?.history?.length || 0})
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: My Quizzes (matches reference image 1: General Knowledge 8 Questions, Tech Quiz 10 Questions, with View button) */}
        {activeTab === 'my_quizzes' && (
          <div className="space-y-4">
            {profileData?.my_quizzes && profileData.my_quizzes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileData.my_quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-3xl p-6 text-slate-900 shadow-xl border border-purple-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 mb-1">
                        {quiz.title}
                      </h4>
                      <p className="text-xs text-purple-600 font-semibold flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{quiz.question_count || 10} Questions</span>
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        Code: {quiz.room_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onStartQuiz(quiz.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Delete quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#170e38] rounded-3xl border border-purple-900/40 p-6">
                <HelpCircle className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white">No Quizzes Created Yet</h4>
                <p className="text-xs text-purple-300 mt-1">
                  Create your own custom quiz and test your friends!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quiz History (matches reference image 1) */}
        {activeTab === 'history' && (
          <div className="bg-[#140b33] rounded-3xl border border-purple-800/40 shadow-xl overflow-hidden">
            {profileData?.history && profileData.history.length > 0 ? (
              <div className="divide-y divide-purple-900/30">
                {profileData.history.map((att) => (
                  <div key={att.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-purple-900/20 transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm sm:text-base">{att.quiz_title}</h4>
                      <div className="flex items-center gap-3 text-xs text-purple-300/70">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(att.attempted_at).toLocaleDateString()}</span>
                        </span>
                        <span>•</span>
                        <span>{att.correct_answers} correct / {att.total_questions} total</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-300 font-mono">
                          {att.score}/{att.total_questions}
                        </span>
                        <span className="block text-[11px] font-bold text-emerald-400">
                          {att.percentage}%
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          onStartQuiz(att.quiz_id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-xs text-purple-200 font-bold transition-colors"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 p-6">
                <Clock className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white">No Quiz History Yet</h4>
                <p className="text-xs text-purple-300 mt-1">Play your first quiz to record your achievements!</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#170e38] border border-purple-700/60 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold">Edit Profile Information</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-300 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e0724] border border-purple-700/60 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 uppercase mb-1">
                  Player Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Trivia Master"
                  className="w-full px-3 py-2 bg-[#0e0724] border border-purple-700/60 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 uppercase mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#0e0724] border border-purple-700/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-xs font-bold text-purple-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
