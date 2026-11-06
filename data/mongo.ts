import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// ----------------- INTERFACES -----------------

export interface IUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  title: string;
  is_staff: boolean;
  createdAt: Date;
}

export interface IQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

export interface IQuiz {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_by_username: string;
  room_code: string;
  time_limit_minutes: number;
  question_count?: number;
  created_at: Date;
}

export interface IAttempt {
  id: string;
  user_id: string;
  username: string;
  quiz_id: string;
  quiz_title: string;
  room_code?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  passed_questions?: number;
  percentage: number;
  rank?: number;
  attempted_at: Date;
}

export interface IRoomGame {
  id: string;
  room_code: string;
  quiz_id: string;
  author_id: string;
  author_username: string;
  status: 'waiting' | 'in_progress' | 'paused' | 'completed';
  starting_duration_minutes: number;
  answering_duration_seconds: number;
  max_players: number;
  participants: Array<{
    user_id: string;
    username: string;
    avatar: string;
    score: number;
    correct_answers: number;
    wrong_answers: number;
    passed_count: number;
    rank?: number;
  }>;
  created_at: Date;
  completed_at?: Date;
}

export interface ILeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  quizzes_played: number;
  wins: number;
  accuracy: number;
  updated_at: Date;
}

export interface ISession {
  token: string;
  user_id: string;
  created_at: Date;
}

// ----------------- MONGOOSE SCHEMAS -----------------

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' },
  title: { type: String, default: 'Challenger' },
  is_staff: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const QuizSchema = new Schema<IQuiz>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  created_by: { type: String, required: true, index: true },
  created_by_username: { type: String, required: true },
  room_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  time_limit_minutes: { type: Number, default: 5 },
  created_at: { type: Date, default: Date.now }
});

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true, unique: true },
  quiz_id: { type: String, required: true, index: true },
  question_text: { type: String, required: true, trim: true },
  option_a: { type: String, required: true, trim: true },
  option_b: { type: String, required: true, trim: true },
  option_c: { type: String, required: true, trim: true },
  option_d: { type: String, required: true, trim: true },
  correct_option: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] }
});

const AttemptSchema = new Schema<IAttempt>({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  username: { type: String, required: true },
  quiz_id: { type: String, required: true, index: true },
  quiz_title: { type: String, required: true },
  room_code: { type: String, default: '', index: true },
  score: { type: Number, required: true },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, required: true },
  wrong_answers: { type: Number, required: true },
  passed_questions: { type: Number, default: 0 },
  percentage: { type: Number, required: true },
  rank: { type: Number, default: 1 },
  attempted_at: { type: Date, default: Date.now }
});

const RoomGameSchema = new Schema<IRoomGame>({
  id: { type: String, required: true, unique: true },
  room_code: { type: String, required: true, unique: true, uppercase: true, index: true },
  quiz_id: { type: String, required: true, index: true },
  author_id: { type: String, required: true },
  author_username: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'starting', 'in_progress', 'paused', 'completed'], default: 'waiting' },
  starting_duration_minutes: { type: Number, default: 5 },
  answering_duration_seconds: { type: Number, default: 25 },
  max_players: { type: Number, default: 8 },
  participants: [
    {
      user_id: { type: String, required: true },
      username: { type: String, required: true },
      avatar: { type: String, default: '' },
      score: { type: Number, default: 0 },
      correct_answers: { type: Number, default: 0 },
      wrong_answers: { type: Number, default: 0 },
      passed_count: { type: Number, default: 0 },
      rank: { type: Number }
    }
  ],
  created_at: { type: Date, default: Date.now },
  completed_at: { type: Date }
});

const LeaderboardSchema = new Schema<ILeaderboardEntry>({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  score: { type: Number, default: 0 },
  quizzes_played: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

const SessionSchema = new Schema<ISession>({
  token: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now, expires: '7d' }
});

// ----------------- MONGOOSE MODELS -----------------

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const QuizModel = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export const QuestionModel = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export const AttemptModel = mongoose.models.Attempt || mongoose.model<IAttempt>('Attempt', AttemptSchema);
export const LeaderboardModel = mongoose.models.Leaderboard || mongoose.model<ILeaderboardEntry>('Leaderboard', LeaderboardSchema);
export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export const RoomGameModel = mongoose.models.RoomGame || mongoose.model<IRoomGame>('RoomGame', RoomGameSchema);

// ----------------- HELPERS -----------------

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_quizbattle_salt').digest('hex');
}

export function generateRoomCode(): string {
  const numbers = '23456789';
  let code = 'QZ';
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
}

// ----------------- DEDUPLICATION & CLEANUP -----------------

/**
 * Scans MongoDB collections and deletes default duplicate information:
 * - Duplicate users (keeps earliest, removes duplicates by username/email)
 * - Duplicate quizzes (keeps earliest, removes duplicate room codes/titles)
 * - Orphaned questions (questions that point to non-existent quizzes)
 * - Duplicate leaderboard entries (keeps entry with highest score per user)
 * - Ensures unique indexes on collections
 */
export async function cleanDuplicateData(): Promise<{
  usersRemoved: number;
  quizzesRemoved: number;
  questionsRemoved: number;
  leaderboardRemoved: number;
}> {
  let usersRemoved = 0;
  let quizzesRemoved = 0;
  let questionsRemoved = 0;
  let leaderboardRemoved = 0;

  try {
    console.log('🧹 [MongoDB] Scanning for default duplicate information...');

    // 0. Remove all default dummy / seed users and their dummy leaderboard/attempts
    const DUMMY_USERNAMES = ['Karthik', 'Sai Teja', 'Nani', 'Charan', 'Roja'];
    const DUMMY_EMAILS = [
      'karthik@quizbattle.com',
      'saiteja@quizbattle.com',
      'nani@quizbattle.com',
      'charan@quizbattle.com',
      'roja@quizbattle.com'
    ];

    const dummyUserDocs = await UserModel.find({
      $or: [
        { username: { $in: DUMMY_USERNAMES } },
        { email: { $in: DUMMY_EMAILS } }
      ]
    }).lean();

    const dummyUserIds = dummyUserDocs.map(u => u.id);

    if (dummyUserIds.length > 0) {
      await UserModel.deleteMany({ id: { $in: dummyUserIds } });
      await LeaderboardModel.deleteMany({
        $or: [
          { user_id: { $in: dummyUserIds } },
          { username: { $in: DUMMY_USERNAMES } }
        ]
      });
      await AttemptModel.deleteMany({
        $or: [
          { user_id: { $in: dummyUserIds } },
          { username: { $in: DUMMY_USERNAMES } }
        ]
      });
      await SessionModel.deleteMany({
        $or: [
          { token: 'demo_token_karthik' },
          { user_id: { $in: dummyUserIds } }
        ]
      });
      console.log(`🗑️ [MongoDB Purge] Successfully removed ${dummyUserDocs.length} dummy users (${DUMMY_USERNAMES.join(', ')}) and cleaned all their associated leaderboard & attempt entries.`);
    }

    // 1. Deduplicate Users by username & email
    const users = await UserModel.find().sort({ createdAt: 1 }).lean();
    const seenUsernames = new Set<string>();
    const seenEmails = new Set<string>();

    for (const u of users) {
      const lowerUser = (u.username || '').toLowerCase();
      const lowerEmail = (u.email || '').toLowerCase();

      if (seenUsernames.has(lowerUser) || seenEmails.has(lowerEmail)) {
        await UserModel.deleteOne({ _id: u._id });
        usersRemoved++;
      } else {
        seenUsernames.add(lowerUser);
        seenEmails.add(lowerEmail);
      }
    }

    // 2. Deduplicate Quizzes by room_code & title
    const quizzes = await QuizModel.find().sort({ created_at: 1 }).lean();
    const seenCodes = new Set<string>();
    const validQuizIds = new Set<string>();

    for (const q of quizzes) {
      const code = (q.room_code || '').toUpperCase();
      if (seenCodes.has(code)) {
        await QuizModel.deleteOne({ _id: q._id });
        await QuestionModel.deleteMany({ quiz_id: q.id });
        quizzesRemoved++;
      } else {
        seenCodes.add(code);
        validQuizIds.add(q.id);
      }
    }

    // 3. Remove orphaned questions
    const orphanedQuestions = await QuestionModel.deleteMany({
      quiz_id: { $nin: Array.from(validQuizIds) }
    });
    questionsRemoved += orphanedQuestions.deletedCount || 0;

    // Deduplicate identical questions within the same quiz
    const questions = await QuestionModel.find().sort({ _id: 1 }).lean();
    const seenQuizQuestionPairs = new Set<string>();
    for (const q of questions) {
      const pairKey = `${q.quiz_id}::${(q.question_text || '').toLowerCase().trim()}`;
      if (seenQuizQuestionPairs.has(pairKey)) {
        await QuestionModel.deleteOne({ _id: q._id });
        questionsRemoved++;
      } else {
        seenQuizQuestionPairs.add(pairKey);
      }
    }

    // 4. Deduplicate Leaderboard by user_id (keep highest score)
    const lbEntries = await LeaderboardModel.find().sort({ score: -1, updated_at: -1 }).lean();
    const seenLbUsers = new Set<string>();

    for (const lb of lbEntries) {
      if (seenLbUsers.has(lb.user_id)) {
        await LeaderboardModel.deleteOne({ _id: lb._id });
        leaderboardRemoved++;
      } else {
        seenLbUsers.add(lb.user_id);
      }
    }

    // Ensure database-level unique indexes
    try {
      await UserModel.collection.createIndex({ username: 1 }, { unique: true });
      await UserModel.collection.createIndex({ email: 1 }, { unique: true });
      await QuizModel.collection.createIndex({ room_code: 1 }, { unique: true });
      await LeaderboardModel.collection.createIndex({ user_id: 1 }, { unique: true });
    } catch (idxErr) {
      // Indexes already exist or warning
    }

    console.log(`✅ [MongoDB Clean Complete] Removed: ${usersRemoved} dup users, ${quizzesRemoved} dup quizzes, ${questionsRemoved} dup/orphaned questions, ${leaderboardRemoved} dup leaderboard entries.`);
  } catch (err) {
    console.warn('⚠️ [MongoDB Clean Warning]', err);
  }

  return { usersRemoved, quizzesRemoved, questionsRemoved, leaderboardRemoved };
}

// ----------------- SEEDING INITIAL DATA -----------------

export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    const quizCount = await QuizModel.countDocuments();

    // If no quizzes exist at all, load starter challenge quizzes without any fake users or leaderboard
    if (quizCount === 0) {
      console.log('🌱 [MongoDB] Loading initial challenge quizzes to MongoDB...');
      const jsonPath = path.resolve(process.cwd(), 'data', 'quiz_battle.json');
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = fs.readFileSync(jsonPath, 'utf-8');
          const seedData = JSON.parse(raw);
          if (Array.isArray(seedData.quizzes) && seedData.quizzes.length > 0) {
            await QuizModel.insertMany(seedData.quizzes);
          }
          if (Array.isArray(seedData.questions) && seedData.questions.length > 0) {
            await QuestionModel.insertMany(seedData.questions);
          }
          console.log('🎉 [MongoDB] Starter quizzes loaded successfully!');
        } catch (e) {
          console.warn('Could not load starter quizzes:', e);
        }
      }
    }
  } catch (err) {
    console.error('❌ [MongoDB Seed Error]', err);
  }
}

// ----------------- MONGO DATABASE MANAGER CLASS -----------------

export class MongoDatabaseManager {
  private isConnected = false;

  public async connect(): Promise<boolean> {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.includes('MY_MONGODB_URI') || uri.includes('<username>')) {
      console.warn('⚠️ [MongoDB Atlas] MONGODB_URI is not configured in .env.');
      console.warn('👉 Please set MONGODB_URI in your .env file with your MongoDB Atlas connection string:');
      console.warn('   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/quiz_battle?retryWrites=true&w=majority"');
    }

    const connectionString = uri || 'mongodb://127.0.0.1:27017/quiz_battle';

    const connectionOptions = {
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    };

    console.log(`🔌 [MongoDB] Connecting to database: ${connectionString.split('@')[1] ? 'MongoDB Atlas Cluster (' + connectionString.split('@')[1].split('/')[0] + ')' : connectionString}...`);

    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {
      // ignore
    }

    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await mongoose.connect(connectionString, connectionOptions);
        this.isConnected = true;
        console.log('⚡ [MongoDB Atlas] Real-time Database Connected Successfully!');

        // Run deduplication and clean up default duplicate information
        await cleanDuplicateData();

        // Seed if fresh
        await seedInitialDataIfNeeded();

        return true;
      } catch (err: any) {
        if (attempt < 4) {
          console.warn(`⏳ [MongoDB Connection] Attempt ${attempt} failed (${err.message}). Retrying in 1.5s...`);
          await new Promise((r) => setTimeout(r, 1500));
        } else {
          console.error('❌ [MongoDB Connection Error]:', err.message);
          console.warn('ℹ️ Running in resilient mode. To connect to your MongoDB Atlas cloud database, paste your connection string in .env as MONGODB_URI.');
          return false;
        }
      }
    }
    return false;
  }

  // ----------------- AUTH & USER CRUD -----------------

  public async findUserById(id: string): Promise<IUser | null> {
    return await UserModel.findOne({ id }).lean();
  }

  public async findUserByUsernameOrEmail(identifier: string): Promise<IUser | null> {
    const clean = identifier.trim();
    return await UserModel.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${clean}$`, 'i') } },
        { email: { $regex: new RegExp(`^${clean}$`, 'i') } }
      ]
    }).lean();
  }

  public async createUser(username: string, email: string, passwordPlain: string): Promise<IUser> {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await this.findUserByUsernameOrEmail(cleanUsername);
    if (existing) {
      throw new Error('Username or email already exists');
    }

    const newUser = await UserModel.create({
      id: 'user_' + crypto.randomUUID().slice(0, 8),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: hashPassword(passwordPlain),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
      title: 'Challenger',
      is_staff: false,
      createdAt: new Date()
    });

    // Also init unique Leaderboard entry
    await LeaderboardModel.findOneAndUpdate(
      { user_id: newUser.id },
      {
        id: 'lb_' + crypto.randomUUID().slice(0, 8),
        user_id: newUser.id,
        username: newUser.username,
        avatar: newUser.avatar,
        score: 0,
        quizzes_played: 0,
        wins: 0,
        accuracy: 0,
        updated_at: new Date()
      },
      { upsert: true }
    );

    return newUser.toObject();
  }

  public async updateUserProfile(
    userId: string,
    data: { username?: string; title?: string; avatar?: string }
  ): Promise<IUser | null> {
    const updateFields: any = {};
    if (data.username) updateFields.username = data.username.trim();
    if (data.title) updateFields.title = data.title.trim();
    if (data.avatar) updateFields.avatar = data.avatar.trim();

    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedUser) return null;

    // Cascade update to Leaderboard
    const lbUpdate: any = { updated_at: new Date() };
    if (data.username) lbUpdate.username = data.username.trim();
    if (data.avatar) lbUpdate.avatar = data.avatar.trim();

    await LeaderboardModel.updateOne({ user_id: userId }, { $set: lbUpdate });

    return updatedUser;
  }

  // ----------------- SESSION CRUD -----------------

  public async createSession(token: string, userId: string): Promise<void> {
    await SessionModel.findOneAndUpdate(
      { token },
      { token, user_id: userId, created_at: new Date() },
      { upsert: true }
    );
  }

  public async findUserIdBySessionToken(token: string): Promise<string | null> {
    const session = await SessionModel.findOne({ token }).lean();
    return session ? session.user_id : null;
  }

  public async deleteSession(token: string): Promise<void> {
    await SessionModel.deleteOne({ token });
  }

  // ----------------- QUIZ CRUD -----------------

  public async getAllQuizzes(): Promise<IQuiz[]> {
    const quizzes = await QuizModel.find().sort({ created_at: -1 }).lean();

    // Attach real live question counts
    const populated = await Promise.all(
      quizzes.map(async (q) => {
        const count = await QuestionModel.countDocuments({ quiz_id: q.id });
        return {
          ...q,
          question_count: count
        };
      })
    );

    return populated;
  }

  public async getQuizById(id: string): Promise<IQuiz | null> {
    const quiz = await QuizModel.findOne({ id }).lean();
    if (!quiz) return null;
    const count = await QuestionModel.countDocuments({ quiz_id: quiz.id });
    return { ...quiz, question_count: count };
  }

  public async getQuizByRoomCode(code: string): Promise<IQuiz | null> {
    const clean = code.trim().toUpperCase();
    const quiz = await QuizModel.findOne({ room_code: clean }).lean();
    if (!quiz) return null;
    const count = await QuestionModel.countDocuments({ quiz_id: quiz.id });
    return { ...quiz, question_count: count };
  }

  public async getQuestionsForQuiz(quizId: string, maskCorrect = true): Promise<Partial<IQuestion>[]> {
    const questions = await QuestionModel.find({ quiz_id: quizId }).lean();
    if (!maskCorrect) {
      return questions;
    }
    return questions.map(({ correct_option, ...rest }: any) => rest);
  }

  public async createQuiz(
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
  ): Promise<{ quiz: IQuiz; questions: IQuestion[] }> {
    let roomCode = generateRoomCode();
    while (await QuizModel.findOne({ room_code: roomCode })) {
      roomCode = generateRoomCode();
    }

    const quizId = 'quiz_' + crypto.randomUUID().slice(0, 8);
    const newQuiz = await QuizModel.create({
      id: quizId,
      title: title.trim(),
      description: description.trim() || 'Custom created challenge quiz.',
      created_by: userId,
      created_by_username: username,
      room_code: roomCode,
      time_limit_minutes: timeLimitMinutes || 5,
      created_at: new Date()
    });

    const questionsToInsert = questionsData.map((q, idx) => ({
      id: `q_${quizId}_${idx + 1}`,
      quiz_id: quizId,
      question_text: q.question_text.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      option_d: q.option_d.trim(),
      correct_option: q.correct_option
    }));

    await QuestionModel.insertMany(questionsToInsert);

    return {
      quiz: { ...newQuiz.toObject(), question_count: questionsData.length },
      questions: questionsToInsert as IQuestion[]
    };
  }

  public async deleteQuiz(quizId: string, userId: string): Promise<boolean> {
    const deleted = await QuizModel.findOneAndDelete({ id: quizId, created_by: userId });
    if (!deleted) return false;
    await QuestionModel.deleteMany({ quiz_id: quizId });
    return true;
  }

  // ----------------- SUBMISSION & LEADERBOARD CRUD -----------------

  public async submitQuizAttempt(
    userId: string,
    username: string,
    quizId: string,
    answers: Array<{ questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' | null }>
  ): Promise<{
    attempt: IAttempt;
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
  }> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const realQuestions = await QuestionModel.find({ quiz_id: quizId }).lean();
    let correctCount = 0;

    const breakdown = realQuestions.map((q) => {
      const userAns = answers.find((a) => a.questionId === q.id);
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
    const score = correctCount;
    const wrongCount = total - correctCount;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const attempt = await AttemptModel.create({
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
      attempted_at: new Date()
    });

    // Real-time Leaderboard Update
    const user = await this.findUserById(userId);
    let lb = await LeaderboardModel.findOne({ user_id: userId });

    if (!lb) {
      lb = await LeaderboardModel.create({
        id: 'lb_' + crypto.randomUUID().slice(0, 8),
        user_id: userId,
        username: username,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        score: 0,
        quizzes_played: 0,
        wins: 0,
        accuracy: 0,
        updated_at: new Date()
      });
    }

    const pointsGained = correctCount * 10;
    lb.score += pointsGained;
    lb.quizzes_played += 1;
    if (percentage >= 80) {
      lb.wins += 1;
    }

    // Recalculate accuracy across all user attempts in MongoDB
    const allAttempts = await AttemptModel.find({ user_id: userId }).lean();
    const totalCorrect = allAttempts.reduce((sum, a) => sum + a.correct_answers, 0);
    const totalQ = allAttempts.reduce((sum, a) => sum + a.total_questions, 0);
    lb.accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : percentage;
    lb.updated_at = new Date();

    await lb.save();

    return { attempt: attempt.toObject(), breakdown };
  }

  public async getLeaderboard(): Promise<ILeaderboardEntry[]> {
    return await LeaderboardModel.find().sort({ score: -1, accuracy: -1 }).lean();
  }

  // ----------------- PROFILE DATA CRUD -----------------

  public async getUserProfileData(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const lb = await LeaderboardModel.findOne({ user_id: userId }).lean();
    const userQuizzes = await QuizModel.find({ created_by: userId }).sort({ created_at: -1 }).lean();
    const userAttempts = await AttemptModel.find({ user_id: userId }).sort({ attempted_at: -1 }).lean();

    const quizzesWithCounts = await Promise.all(
      userQuizzes.map(async (q) => {
        const count = await QuestionModel.countDocuments({ quiz_id: q.id });
        return { ...q, question_count: count };
      })
    );

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
      my_quizzes: quizzesWithCounts,
      history: userAttempts
    };
  }
}

export const mongoDbManager = new MongoDatabaseManager();

