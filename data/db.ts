import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  title: string;
  is_staff: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
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

export interface DatabaseSchema {
  users: User[];
  quizzes: Quiz[];
  questions: Question[];
  attempts: Attempt[];
  leaderboard: LeaderboardEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'quiz_battle.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_quizbattle_salt').digest('hex');
}

export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  let code = 'QZ';
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
}

// Initial Seed Data with real questions and reference users
function getInitialSeedData(): DatabaseSchema {
  const karthikId = 'user_karthik_1';
  const saitejaId = 'user_saiteja_2';
  const naniId = 'user_nani_3';
  const charanId = 'user_charan_4';
  const rojaId = 'user_roja_5';

  const users: User[] = [
    {
      id: karthikId,
      username: 'Karthik',
      email: 'karthik@quizbattle.com',
      passwordHash: hashPassword('karthik123'),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      title: 'Quiz Enthusiast',
      is_staff: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: saitejaId,
      username: 'Sai Teja',
      email: 'saiteja@quizbattle.com',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      title: 'Grand Master',
      is_staff: false,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: naniId,
      username: 'Nani',
      email: 'nani@quizbattle.com',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
      title: 'Trivia King',
      is_staff: false,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: charanId,
      username: 'Charan',
      email: 'charan@quizbattle.com',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      title: 'Tech Wizard',
      is_staff: false,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: rojaId,
      username: 'Roja',
      email: 'roja@quizbattle.com',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      title: 'Quiz Star',
      is_staff: false,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    }
  ];

  const quiz1Id = 'quiz_gk_101';
  const quiz2Id = 'quiz_tech_102';
  const quiz3Id = 'quiz_sports_103';

  const quizzes: Quiz[] = [
    {
      id: quiz1Id,
      title: 'General Knowledge',
      description: 'Test your world awareness, geography, history, and science trivia.',
      created_by: karthikId,
      created_by_username: 'Karthik',
      room_code: 'QZ101',
      time_limit_minutes: 5,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: quiz2Id,
      title: 'Tech Quiz',
      description: 'Explore programming languages, computer systems, web tech, and AI.',
      created_by: karthikId,
      created_by_username: 'Karthik',
      room_code: 'QZ102',
      time_limit_minutes: 5,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: quiz3Id,
      title: 'Sports Quiz',
      description: 'Challenge your knowledge in football, cricket, tennis, and Olympics.',
      created_by: saitejaId,
      created_by_username: 'Sai Teja',
      room_code: 'QZ103',
      time_limit_minutes: 5,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  ];

  const questions: Question[] = [
    // General Knowledge (Matches reference screenshot: "Which is the largest planet in our Solar System?" and "What is the capital of India?")
    {
      id: 'q_gk_1',
      quiz_id: quiz1Id,
      question_text: 'Which is the largest planet in our Solar System?',
      option_a: 'Earth',
      option_b: 'Jupiter',
      option_c: 'Mars',
      option_d: 'Venus',
      correct_option: 'B'
    },
    {
      id: 'q_gk_2',
      quiz_id: quiz1Id,
      question_text: 'What is the capital of India?',
      option_a: 'Mumbai',
      option_b: 'New Delhi',
      option_c: 'Kolkata',
      option_d: 'Chennai',
      correct_option: 'B'
    },
    {
      id: 'q_gk_3',
      quiz_id: quiz1Id,
      question_text: 'Which ocean is the largest and deepest on Earth?',
      option_a: 'Atlantic Ocean',
      option_b: 'Indian Ocean',
      option_c: 'Pacific Ocean',
      option_d: 'Arctic Ocean',
      correct_option: 'C'
    },
    {
      id: 'q_gk_4',
      quiz_id: quiz1Id,
      question_text: 'Who painted the famous masterpiece Mona Lisa?',
      option_a: 'Vincent van Gogh',
      option_b: 'Pablo Picasso',
      option_c: 'Leonardo da Vinci',
      option_d: 'Michelangelo',
      correct_option: 'C'
    },
    {
      id: 'q_gk_5',
      quiz_id: quiz1Id,
      question_text: 'What chemical element has the symbol "Au"?',
      option_a: 'Silver',
      option_b: 'Gold',
      option_c: 'Copper',
      option_d: 'Platinum',
      correct_option: 'B'
    },
    {
      id: 'q_gk_6',
      quiz_id: quiz1Id,
      question_text: 'Which country is known as the Land of the Rising Sun?',
      option_a: 'China',
      option_b: 'South Korea',
      option_c: 'Japan',
      option_d: 'Thailand',
      correct_option: 'C'
    },
    {
      id: 'q_gk_7',
      quiz_id: quiz1Id,
      question_text: 'How many bones are in the adult human body?',
      option_a: '186',
      option_b: '206',
      option_c: '226',
      option_d: '256',
      correct_option: 'B'
    },
    {
      id: 'q_gk_8',
      quiz_id: quiz1Id,
      question_text: 'What is the fastest land animal in the world?',
      option_a: 'Lion',
      option_b: 'Cheetah',
      option_c: 'Gazelle',
      option_d: 'Peregrine Falcon',
      correct_option: 'B'
    },
    {
      id: 'q_gk_9',
      quiz_id: quiz1Id,
      question_text: 'In which year did the Apollo 11 mission land humans on the Moon?',
      option_a: '1965',
      option_b: '1969',
      option_c: '1971',
      option_d: '1975',
      correct_option: 'B'
    },
    {
      id: 'q_gk_10',
      quiz_id: quiz1Id,
      question_text: 'What is the hardest natural substance on Earth?',
      option_a: 'Graphene',
      option_b: 'Titanium',
      option_c: 'Diamond',
      option_d: 'Quartz',
      correct_option: 'C'
    },

    // Tech Quiz
    {
      id: 'q_tech_1',
      quiz_id: quiz2Id,
      question_text: 'What does HTML stand for in web development?',
      option_a: 'HighText Machine Language',
      option_b: 'HyperText Markup Language',
      option_c: 'Hyperlink and Text Model Language',
      option_d: 'Home Tool Markup Language',
      correct_option: 'B'
    },
    {
      id: 'q_tech_2',
      quiz_id: quiz2Id,
      question_text: 'Which programming language is predominantly used for styling web pages?',
      option_a: 'CSS',
      option_b: 'Python',
      option_c: 'Java',
      option_d: 'PHP',
      correct_option: 'A'
    },
    {
      id: 'q_tech_3',
      quiz_id: quiz2Id,
      question_text: 'Which company created the React.js frontend library?',
      option_a: 'Google',
      option_b: 'Microsoft',
      option_c: 'Meta (Facebook)',
      option_d: 'Apple',
      correct_option: 'C'
    },
    {
      id: 'q_tech_4',
      quiz_id: quiz2Id,
      question_text: 'What does SQL stand for in database architecture?',
      option_a: 'Structured Query Language',
      option_b: 'Simple Quick Language',
      option_c: 'Standard Question Loop',
      option_d: 'Sequential Query Logic',
      correct_option: 'A'
    },
    {
      id: 'q_tech_5',
      quiz_id: quiz2Id,
      question_text: 'Which protocol is used to secure web traffic with SSL/TLS encryption?',
      option_a: 'HTTP',
      option_b: 'HTTPS',
      option_c: 'FTP',
      option_d: 'SMTP',
      correct_option: 'B'
    },
    {
      id: 'q_tech_6',
      quiz_id: quiz2Id,
      question_text: 'What is the runtime environment that allows JavaScript to run on the server side?',
      option_a: 'Node.js',
      option_b: 'Docker',
      option_c: 'Babel',
      option_d: 'Webpack',
      correct_option: 'A'
    },
    {
      id: 'q_tech_7',
      quiz_id: quiz2Id,
      question_text: 'In Git, which command creates a new local branch and switches to it?',
      option_a: 'git push',
      option_b: 'git switch -c (or checkout -b)',
      option_c: 'git commit -m',
      option_d: 'git merge',
      correct_option: 'B'
    },
    {
      id: 'q_tech_8',
      quiz_id: quiz2Id,
      question_text: 'What is the time complexity of searching an element in a balanced Binary Search Tree?',
      option_a: 'O(1)',
      option_b: 'O(log n)',
      option_c: 'O(n)',
      option_d: 'O(n^2)',
      correct_option: 'B'
    },
    {
      id: 'q_tech_9',
      quiz_id: quiz2Id,
      question_text: 'Which Python web framework is known for "The web framework for perfectionists with deadlines"?',
      option_a: 'Flask',
      option_b: 'Django',
      option_c: 'FastAPI',
      option_d: 'Tornado',
      correct_option: 'B'
    },
    {
      id: 'q_tech_10',
      quiz_id: quiz2Id,
      question_text: 'What does API stand for in software systems?',
      option_a: 'Application Programming Interface',
      option_b: 'Advanced Processing Instruction',
      option_c: 'Automated Program Integration',
      option_d: 'App Protocol Interface',
      correct_option: 'A'
    },

    // Sports Quiz
    {
      id: 'q_sp_1',
      quiz_id: quiz3Id,
      question_text: 'Which country won the FIFA Men\'s World Cup in 2022 in Qatar?',
      option_a: 'France',
      option_b: 'Argentina',
      option_c: 'Brazil',
      option_d: 'Germany',
      correct_option: 'B'
    },
    {
      id: 'q_sp_2',
      quiz_id: quiz3Id,
      question_text: 'How many players are on the field for one team in a standard soccer match?',
      option_a: '9',
      option_b: '10',
      option_c: '11',
      option_d: '12',
      correct_option: 'C'
    },
    {
      id: 'q_sp_3',
      quiz_id: quiz3Id,
      question_text: 'In which sport is the prestigious "Davis Cup" contested?',
      option_a: 'Golf',
      option_b: 'Tennis',
      option_c: 'Badminton',
      option_d: 'Cricket',
      correct_option: 'B'
    },
    {
      id: 'q_sp_4',
      quiz_id: quiz3Id,
      question_text: 'Who holds the world record for the 100-meter sprint at 9.58 seconds?',
      option_a: 'Tyson Gay',
      option_b: 'Usain Bolt',
      option_c: 'Yohan Blake',
      option_d: 'Carl Lewis',
      correct_option: 'B'
    },
    {
      id: 'q_sp_5',
      quiz_id: quiz3Id,
      question_text: 'How many overs does each team bowl in a standard T20 cricket match?',
      option_a: '15',
      option_b: '20',
      option_c: '25',
      option_d: '50',
      correct_option: 'B'
    },
    {
      id: 'q_sp_6',
      quiz_id: quiz3Id,
      question_text: 'Which city hosted the Summer Olympic Games in 2024?',
      option_a: 'Tokyo',
      option_b: 'Paris',
      option_c: 'Los Angeles',
      option_d: 'London',
      correct_option: 'B'
    },
    {
      id: 'q_sp_7',
      quiz_id: quiz3Id,
      question_text: 'In basketball, how many points is a shot made from beyond the arc worth?',
      option_a: '1 point',
      option_b: '2 points',
      option_c: '3 points',
      option_d: '4 points',
      correct_option: 'C'
    },
    {
      id: 'q_sp_8',
      quiz_id: quiz3Id,
      question_text: 'Which grand slam tennis tournament is played on traditional grass courts?',
      option_a: 'Australian Open',
      option_b: 'French Open',
      option_c: 'Wimbledon',
      option_d: 'US Open',
      correct_option: 'C'
    },
    {
      id: 'q_sp_9',
      quiz_id: quiz3Id,
      question_text: 'What is the highest possible break in a standard game of snooker?',
      option_a: '147',
      option_b: '150',
      option_c: '155',
      option_d: '180',
      correct_option: 'A'
    },
    {
      id: 'q_sp_10',
      quiz_id: quiz3Id,
      question_text: 'Which country invented the modern sport of curling?',
      option_a: 'Canada',
      option_b: 'Scotland',
      option_c: 'Norway',
      option_d: 'Sweden',
      correct_option: 'B'
    }
  ];

  const attempts: Attempt[] = [
    {
      id: 'att_1',
      user_id: karthikId,
      username: 'Karthik',
      quiz_id: quiz1Id,
      quiz_title: 'General Knowledge',
      score: 10,
      total_questions: 10,
      correct_answers: 10,
      wrong_answers: 0,
      percentage: 100,
      attempted_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'att_2',
      user_id: saitejaId,
      username: 'Sai Teja',
      quiz_id: quiz1Id,
      quiz_title: 'General Knowledge',
      score: 9,
      total_questions: 10,
      correct_answers: 9,
      wrong_answers: 1,
      percentage: 90,
      attempted_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'att_3',
      user_id: naniId,
      username: 'Nani',
      quiz_id: quiz2Id,
      quiz_title: 'Tech Quiz',
      score: 8,
      total_questions: 10,
      correct_answers: 8,
      wrong_answers: 2,
      percentage: 80,
      attempted_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'att_4',
      user_id: charanId,
      username: 'Charan',
      quiz_id: quiz2Id,
      quiz_title: 'Tech Quiz',
      score: 7,
      total_questions: 10,
      correct_answers: 7,
      wrong_answers: 3,
      percentage: 70,
      attempted_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'att_5',
      user_id: rojaId,
      username: 'Roja',
      quiz_id: quiz3Id,
      quiz_title: 'Sports Quiz',
      score: 6,
      total_questions: 10,
      correct_answers: 6,
      wrong_answers: 4,
      percentage: 60,
      attempted_at: new Date(Date.now() - 6 * 86400000).toISOString()
    }
  ];

  // Leaderboard entries matching the exact reference screenshot
  // Rank 1: Karthik - 100
  // Rank 2: Sai Teja - 90
  // Rank 3: Nani - 80
  // Rank 4: Charan - 70
  // Rank 5: Roja - 60
  const leaderboard: LeaderboardEntry[] = [
    {
      id: 'lb_1',
      user_id: karthikId,
      username: 'Karthik',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      score: 100,
      quizzes_played: 12,
      wins: 8,
      accuracy: 85,
      updated_at: new Date().toISOString()
    },
    {
      id: 'lb_2',
      user_id: saitejaId,
      username: 'Sai Teja',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      score: 90,
      quizzes_played: 10,
      wins: 6,
      accuracy: 82,
      updated_at: new Date().toISOString()
    },
    {
      id: 'lb_3',
      user_id: naniId,
      username: 'Nani',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
      score: 80,
      quizzes_played: 9,
      wins: 5,
      accuracy: 78,
      updated_at: new Date().toISOString()
    },
    {
      id: 'lb_4',
      user_id: charanId,
      username: 'Charan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      score: 70,
      quizzes_played: 8,
      wins: 3,
      accuracy: 74,
      updated_at: new Date().toISOString()
    },
    {
      id: 'lb_5',
      user_id: rojaId,
      username: 'Roja',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      score: 60,
      quizzes_played: 7,
      wins: 2,
      accuracy: 70,
      updated_at: new Date().toISOString()
    }
  ];

  return { users, quizzes, questions, attempts, leaderboard };
}

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.quizzes && parsed.questions) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load database file, resetting to initial seed', e);
    }
    const initial = getInitialSeedData();
    this.save(initial);
    return initial;
  }

  public save(data?: DatabaseSchema) {
    if (data) {
      this.db = data;
    }
    this.ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
  }

  public getDb(): DatabaseSchema {
    return this.db;
  }

  // User methods
  public findUserByUsernameOrEmail(identifier: string): User | undefined {
    const lower = identifier.toLowerCase();
    return this.db.users.find(u => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower);
  }

  public findUserById(id: string): User | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public createUser(username: string, email: string, passwordPlain: string): User {
    const newUser: User = {
      id: 'user_' + crypto.randomUUID().slice(0, 8),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(passwordPlain),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      title: 'Challenger',
      is_staff: false,
      createdAt: new Date().toISOString()
    };
    this.db.users.push(newUser);

    // Also init leaderboard entry
    this.db.leaderboard.push({
      id: 'lb_' + crypto.randomUUID().slice(0, 8),
      user_id: newUser.id,
      username: newUser.username,
      avatar: newUser.avatar,
      score: 0,
      quizzes_played: 0,
      wins: 0,
      accuracy: 0,
      updated_at: new Date().toISOString()
    });

    this.save();
    return newUser;
  }

  public updateUserProfile(userId: string, data: { username?: string; title?: string; avatar?: string }): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    if (data.username) user.username = data.username;
    if (data.title) user.title = data.title;
    if (data.avatar) user.avatar = data.avatar;

    const lb = this.db.leaderboard.find(l => l.user_id === userId);
    if (lb) {
      if (data.username) lb.username = data.username;
      if (data.avatar) lb.avatar = data.avatar;
    }
    this.save();
    return user;
  }

  // Quizzes
  public getAllQuizzes(): Quiz[] {
    return this.db.quizzes.map(q => {
      const qCount = this.db.questions.filter(item => item.quiz_id === q.id).length;
      return { ...q, question_count: qCount };
    });
  }

  public getQuizById(id: string): Quiz | undefined {
    const q = this.db.quizzes.find(item => item.id === id);
    if (!q) return undefined;
    const qCount = this.db.questions.filter(item => item.quiz_id === q.id).length;
    return { ...q, question_count: qCount };
  }

  public getQuizByRoomCode(code: string): Quiz | undefined {
    const clean = code.trim().toUpperCase();
    const q = this.db.quizzes.find(item => item.room_code.toUpperCase() === clean);
    if (!q) return undefined;
    const qCount = this.db.questions.filter(item => item.quiz_id === q.id).length;
    return { ...q, question_count: qCount };
  }

  public getQuestionsForQuiz(quizId: string, maskCorrect = true): Partial<Question>[] {
    const questions = this.db.questions.filter(q => q.quiz_id === quizId);
    if (!maskCorrect) {
      return questions;
    }
    // Mask correct_option so frontend cannot cheat before submitting!
    return questions.map(({ correct_option, ...rest }) => rest);
  }

  public createQuiz(
    userId: string,
    username: string,
    title: string,
    description: string,
    timeLimitMinutes: number,
    questionsData: Array<{
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_option: 'A' | 'B' | 'C' | 'D';
    }>
  ): { quiz: Quiz; questions: Question[] } {
    let roomCode = generateRoomCode();
    while (this.db.quizzes.some(q => q.room_code === roomCode)) {
      roomCode = generateRoomCode();
    }

    const quizId = 'quiz_' + crypto.randomUUID().slice(0, 8);
    const newQuiz: Quiz = {
      id: quizId,
      title: title.trim(),
      description: description.trim() || 'Custom created challenge quiz.',
      created_by: userId,
      created_by_username: username,
      room_code: roomCode,
      time_limit_minutes: timeLimitMinutes || 5,
      question_count: questionsData.length,
      created_at: new Date().toISOString()
    };
    this.db.quizzes.push(newQuiz);

    const createdQuestions: Question[] = questionsData.map((q, idx) => ({
      id: `q_${quizId}_${idx + 1}`,
      quiz_id: quizId,
      question_text: q.question_text.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      option_d: q.option_d.trim(),
      correct_option: q.correct_option
    }));

    this.db.questions.push(...createdQuestions);
    this.save();

    return { quiz: newQuiz, questions: createdQuestions };
  }

  public deleteQuiz(quizId: string, userId: string): boolean {
    const quizIdx = this.db.quizzes.findIndex(q => q.id === quizId && q.created_by === userId);
    if (quizIdx === -1) return false;
    this.db.quizzes.splice(quizIdx, 1);
    this.db.questions = this.db.questions.filter(q => q.quiz_id !== quizId);
    this.save();
    return true;
  }

  // Attempt & Scoring
  public submitQuizAttempt(
    userId: string,
    username: string,
    quizId: string,
    answers: Array<{ questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' | null }>
  ): {
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
  } {
    const quiz = this.getQuizById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const realQuestions = this.db.questions.filter(q => q.quiz_id === quizId);
    let correctCount = 0;
    const breakdown = realQuestions.map(q => {
      const userAns = answers.find(a => a.questionId === q.id);
      const isCorrect = userAns ? userAns.selectedOption === q.correct_option : false;
      if (isCorrect) correctCount++;
      return {
        question_id: q.id,
        question_text: q.question_text,
        user_answer: userAns?.selectedOption || null,
        correct_answer: q.correct_option,
        is_correct: isCorrect,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d
      };
    });

    const total = realQuestions.length;
    const score = correctCount; // 1 point per correct answer or standard 10 scale
    const wrongCount = total - correctCount;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const attempt: Attempt = {
      id: 'att_' + crypto.randomUUID().slice(0, 8),
      user_id: userId,
      username: username,
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      score: score,
      total_questions: total,
      correct_answers: correctCount,
      wrong_answers: wrongCount,
      percentage: percentage,
      attempted_at: new Date().toISOString()
    };

    this.db.attempts.unshift(attempt);

    // Update Leaderboard
    let lbEntry = this.db.leaderboard.find(l => l.user_id === userId);
    const user = this.findUserById(userId);
    if (!lbEntry) {
      lbEntry = {
        id: 'lb_' + crypto.randomUUID().slice(0, 8),
        user_id: userId,
        username: username,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        score: 0,
        quizzes_played: 0,
        wins: 0,
        accuracy: 0,
        updated_at: new Date().toISOString()
      };
      this.db.leaderboard.push(lbEntry);
    }

    // Accumulate score (e.g. 10 points per correct answer)
    const pointsGained = correctCount * 10;
    lbEntry.score += pointsGained;
    lbEntry.quizzes_played += 1;
    if (percentage >= 80) {
      lbEntry.wins += 1;
    }

    // Recalculate overall accuracy across all user attempts
    const userAttempts = this.db.attempts.filter(a => a.user_id === userId);
    const totalCorrect = userAttempts.reduce((sum, a) => sum + a.correct_answers, 0);
    const totalQuestions = userAttempts.reduce((sum, a) => sum + a.total_questions, 0);
    lbEntry.accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : percentage;
    lbEntry.updated_at = new Date().toISOString();

    this.save();

    return { attempt, breakdown };
  }

  // Leaderboard
  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.db.leaderboard].sort((a, b) => b.score - a.score);
  }

  // Profile data
  public getUserProfileData(userId: string) {
    const user = this.findUserById(userId);
    if (!user) return null;

    const lb = this.db.leaderboard.find(l => l.user_id === userId);
    const userQuizzes = this.getAllQuizzes().filter(q => q.created_by === userId);
    const userAttempts = this.db.attempts.filter(a => a.user_id === userId);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        createdAt: user.createdAt
      },
      stats: {
        total_quizzes_played: lb?.quizzes_played || userAttempts.length,
        total_wins: lb?.wins || 0,
        accuracy_percentage: lb?.accuracy || 0,
        total_score: lb?.score || 0
      },
      my_quizzes: userQuizzes,
      history: userAttempts
    };
  }
}

export const dbManager = new DatabaseManager();
