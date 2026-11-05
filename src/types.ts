export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  title: string;
  is_staff?: boolean;
}

export interface Question {
  id: string;
  quiz_id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: 'A' | 'B' | 'C' | 'D';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_by_username: string;
  room_code: string;
  time_limit_minutes: number;
  question_count?: number;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  username: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percentage: number;
  attempted_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  quizzes_played: number;
  wins: number;
  accuracy: number;
  updated_at: string;
}

export interface QuizSubmissionResult {
  attempt: Attempt;
  breakdown: Array<{
    question_id: string;
    question_text: string;
    user_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  }>;
}

export interface ProfileData {
  user: User;
  stats: {
    total_quizzes_played: number;
    total_wins: number;
    accuracy_percentage: number;
    total_score: number;
  };
  my_quizzes: Quiz[];
  history: Attempt[];
}

export interface MultiplayerParticipant {
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  status: 'waiting' | 'thinking' | 'answered' | 'passed';
  is_author?: boolean;
  is_connected?: boolean;
  correct_answers?: number;
  wrong_answers?: number;
  passed_count?: number;
  rank?: number;
}

export interface MultiplayerGameState {
  room_code: string;
  quiz_id: string;
  quiz_title: string;
  author_id: string;
  author_username: string;
  author_avatar?: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'paused' | 'completed';
  starting_duration_minutes: number;
  answering_duration_seconds: number;
  lobby_end_time?: number;
  max_players: number;
  participants: MultiplayerParticipant[];
  current_question_index: number;
  total_questions: number;
  current_question?: {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  } | null;
  current_player_user_id?: string;
  current_player_username?: string;
  original_starting_player_user_id?: string;
  turn_time_left: number;
  is_paused: boolean;
  passed_user_ids: string[];
  last_action_event?: {
    type: 'correct' | 'wrong' | 'pass' | 'all_passed' | 'timeout';
    message: string;
    player_name: string;
    points_change?: number;
  } | null;
  final_rankings?: Array<{
    user_id: string;
    username: string;
    avatar: string;
    score: number;
    correct_answers: number;
    wrong_answers: number;
    passed_count: number;
    rank: number;
  }>;
}
