// server.ts
import "dotenv/config";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path2 from "path";
import { fileURLToPath } from "url";

// data/mongo.ts
import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import dns from "dns";
var UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: "" },
  title: { type: String, default: "Challenger" },
  is_staff: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
var QuizSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  created_by: { type: String, required: true, index: true },
  created_by_username: { type: String, required: true },
  room_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  time_limit_minutes: { type: Number, default: 5 },
  created_at: { type: Date, default: Date.now }
});
var QuestionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  quiz_id: { type: String, required: true, index: true },
  question_text: { type: String, required: true, trim: true },
  option_a: { type: String, required: true, trim: true },
  option_b: { type: String, required: true, trim: true },
  option_c: { type: String, required: true, trim: true },
  option_d: { type: String, required: true, trim: true },
  correct_option: { type: String, required: true, enum: ["A", "B", "C", "D"] }
});
var AttemptSchema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  username: { type: String, required: true },
  quiz_id: { type: String, required: true, index: true },
  quiz_title: { type: String, required: true },
  room_code: { type: String, default: "", index: true },
  score: { type: Number, required: true },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, required: true },
  wrong_answers: { type: Number, required: true },
  passed_questions: { type: Number, default: 0 },
  percentage: { type: Number, required: true },
  rank: { type: Number, default: 1 },
  attempted_at: { type: Date, default: Date.now }
});
var RoomGameSchema = new Schema({
  id: { type: String, required: true, unique: true },
  room_code: { type: String, required: true, unique: true, uppercase: true, index: true },
  quiz_id: { type: String, required: true, index: true },
  author_id: { type: String, required: true },
  author_username: { type: String, required: true },
  status: { type: String, enum: ["waiting", "starting", "in_progress", "paused", "completed"], default: "waiting" },
  starting_duration_minutes: { type: Number, default: 5 },
  answering_duration_seconds: { type: Number, default: 25 },
  max_players: { type: Number, default: 8 },
  participants: [
    {
      user_id: { type: String, required: true },
      username: { type: String, required: true },
      avatar: { type: String, default: "" },
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
var LeaderboardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  avatar: { type: String, default: "" },
  score: { type: Number, default: 0 },
  quizzes_played: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});
var SessionSchema = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now, expires: "7d" }
});
var UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
var QuizModel = mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
var QuestionModel = mongoose.models.Question || mongoose.model("Question", QuestionSchema);
var AttemptModel = mongoose.models.Attempt || mongoose.model("Attempt", AttemptSchema);
var LeaderboardModel = mongoose.models.Leaderboard || mongoose.model("Leaderboard", LeaderboardSchema);
var SessionModel = mongoose.models.Session || mongoose.model("Session", SessionSchema);
var RoomGameModel = mongoose.models.RoomGame || mongoose.model("RoomGame", RoomGameSchema);
function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "_quizbattle_salt").digest("hex");
}
function generateRoomCode() {
  const numbers = "23456789";
  let code = "QZ";
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
}
async function cleanDuplicateData() {
  let usersRemoved = 0;
  let quizzesRemoved = 0;
  let questionsRemoved = 0;
  let leaderboardRemoved = 0;
  try {
    console.log("\u{1F9F9} [MongoDB] Scanning for default duplicate information...");
    const DUMMY_USERNAMES = ["Karthik", "Sai Teja", "Nani", "Charan", "Roja"];
    const DUMMY_EMAILS = [
      "karthik@quizbattle.com",
      "saiteja@quizbattle.com",
      "nani@quizbattle.com",
      "charan@quizbattle.com",
      "roja@quizbattle.com"
    ];
    const dummyUserDocs = await UserModel.find({
      $or: [
        { username: { $in: DUMMY_USERNAMES } },
        { email: { $in: DUMMY_EMAILS } }
      ]
    }).lean();
    const dummyUserIds = dummyUserDocs.map((u) => u.id);
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
          { token: "demo_token_karthik" },
          { user_id: { $in: dummyUserIds } }
        ]
      });
      console.log(`\u{1F5D1}\uFE0F [MongoDB Purge] Successfully removed ${dummyUserDocs.length} dummy users (${DUMMY_USERNAMES.join(", ")}) and cleaned all their associated leaderboard & attempt entries.`);
    }
    const users = await UserModel.find().sort({ createdAt: 1 }).lean();
    const seenUsernames = /* @__PURE__ */ new Set();
    const seenEmails = /* @__PURE__ */ new Set();
    for (const u of users) {
      const lowerUser = (u.username || "").toLowerCase();
      const lowerEmail = (u.email || "").toLowerCase();
      if (seenUsernames.has(lowerUser) || seenEmails.has(lowerEmail)) {
        await UserModel.deleteOne({ _id: u._id });
        usersRemoved++;
      } else {
        seenUsernames.add(lowerUser);
        seenEmails.add(lowerEmail);
      }
    }
    const quizzes = await QuizModel.find().sort({ created_at: 1 }).lean();
    const seenCodes = /* @__PURE__ */ new Set();
    const validQuizIds = /* @__PURE__ */ new Set();
    for (const q of quizzes) {
      const code = (q.room_code || "").toUpperCase();
      if (seenCodes.has(code)) {
        await QuizModel.deleteOne({ _id: q._id });
        await QuestionModel.deleteMany({ quiz_id: q.id });
        quizzesRemoved++;
      } else {
        seenCodes.add(code);
        validQuizIds.add(q.id);
      }
    }
    const orphanedQuestions = await QuestionModel.deleteMany({
      quiz_id: { $nin: Array.from(validQuizIds) }
    });
    questionsRemoved += orphanedQuestions.deletedCount || 0;
    const questions = await QuestionModel.find().sort({ _id: 1 }).lean();
    const seenQuizQuestionPairs = /* @__PURE__ */ new Set();
    for (const q of questions) {
      const pairKey = `${q.quiz_id}::${(q.question_text || "").toLowerCase().trim()}`;
      if (seenQuizQuestionPairs.has(pairKey)) {
        await QuestionModel.deleteOne({ _id: q._id });
        questionsRemoved++;
      } else {
        seenQuizQuestionPairs.add(pairKey);
      }
    }
    const lbEntries = await LeaderboardModel.find().sort({ score: -1, updated_at: -1 }).lean();
    const seenLbUsers = /* @__PURE__ */ new Set();
    for (const lb of lbEntries) {
      if (seenLbUsers.has(lb.user_id)) {
        await LeaderboardModel.deleteOne({ _id: lb._id });
        leaderboardRemoved++;
      } else {
        seenLbUsers.add(lb.user_id);
      }
    }
    try {
      await UserModel.collection.createIndex({ username: 1 }, { unique: true });
      await UserModel.collection.createIndex({ email: 1 }, { unique: true });
      await QuizModel.collection.createIndex({ room_code: 1 }, { unique: true });
      await LeaderboardModel.collection.createIndex({ user_id: 1 }, { unique: true });
    } catch (idxErr) {
    }
    console.log(`\u2705 [MongoDB Clean Complete] Removed: ${usersRemoved} dup users, ${quizzesRemoved} dup quizzes, ${questionsRemoved} dup/orphaned questions, ${leaderboardRemoved} dup leaderboard entries.`);
  } catch (err) {
    console.warn("\u26A0\uFE0F [MongoDB Clean Warning]", err);
  }
  return { usersRemoved, quizzesRemoved, questionsRemoved, leaderboardRemoved };
}
async function seedInitialDataIfNeeded() {
  try {
    const quizCount = await QuizModel.countDocuments();
    if (quizCount === 0) {
      console.log("\u{1F331} [MongoDB] Loading initial challenge quizzes to MongoDB...");
      const jsonPath = path.resolve(process.cwd(), "data", "quiz_battle.json");
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = fs.readFileSync(jsonPath, "utf-8");
          const seedData = JSON.parse(raw);
          if (Array.isArray(seedData.quizzes) && seedData.quizzes.length > 0) {
            await QuizModel.insertMany(seedData.quizzes);
          }
          if (Array.isArray(seedData.questions) && seedData.questions.length > 0) {
            await QuestionModel.insertMany(seedData.questions);
          }
          console.log("\u{1F389} [MongoDB] Starter quizzes loaded successfully!");
        } catch (e) {
          console.warn("Could not load starter quizzes:", e);
        }
      }
    }
  } catch (err) {
    console.error("\u274C [MongoDB Seed Error]", err);
  }
}
var MongoDatabaseManager = class {
  constructor() {
    this.isConnected = false;
  }
  async connect() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes("MY_MONGODB_URI") || uri.includes("<username>")) {
      console.warn("\u26A0\uFE0F [MongoDB Atlas] MONGODB_URI is not configured in .env.");
      console.warn("\u{1F449} Please set MONGODB_URI in your .env file with your MongoDB Atlas connection string:");
      console.warn('   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/quiz_battle?retryWrites=true&w=majority"');
    }
    const connectionString = uri || "mongodb://127.0.0.1:27017/quiz_battle";
    const connectionOptions = {
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 2e4,
      connectTimeoutMS: 2e4
    };
    console.log(`\u{1F50C} [MongoDB] Connecting to database: ${connectionString.split("@")[1] ? "MongoDB Atlas Cluster (" + connectionString.split("@")[1].split("/")[0] + ")" : connectionString}...`);
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
    }
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await mongoose.connect(connectionString, connectionOptions);
        this.isConnected = true;
        console.log("\u26A1 [MongoDB Atlas] Real-time Database Connected Successfully!");
        await cleanDuplicateData();
        await seedInitialDataIfNeeded();
        return true;
      } catch (err) {
        if (attempt < 4) {
          console.warn(`\u23F3 [MongoDB Connection] Attempt ${attempt} failed (${err.message}). Retrying in 1.5s...`);
          await new Promise((r) => setTimeout(r, 1500));
        } else {
          console.error("\u274C [MongoDB Connection Error]:", err.message);
          console.warn("\u2139\uFE0F Running in resilient mode. To connect to your MongoDB Atlas cloud database, paste your connection string in .env as MONGODB_URI.");
          return false;
        }
      }
    }
    return false;
  }
  // ----------------- AUTH & USER CRUD -----------------
  async findUserById(id) {
    return await UserModel.findOne({ id }).lean();
  }
  async findUserByUsernameOrEmail(identifier) {
    const clean = identifier.trim();
    return await UserModel.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${clean}$`, "i") } },
        { email: { $regex: new RegExp(`^${clean}$`, "i") } }
      ]
    }).lean();
  }
  async createUser(username, email, passwordPlain) {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const existing = await this.findUserByUsernameOrEmail(cleanUsername);
    if (existing) {
      throw new Error("Username or email already exists");
    }
    const newUser = await UserModel.create({
      id: "user_" + crypto.randomUUID().slice(0, 8),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: hashPassword(passwordPlain),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
      title: "Challenger",
      is_staff: false,
      createdAt: /* @__PURE__ */ new Date()
    });
    await LeaderboardModel.findOneAndUpdate(
      { user_id: newUser.id },
      {
        id: "lb_" + crypto.randomUUID().slice(0, 8),
        user_id: newUser.id,
        username: newUser.username,
        avatar: newUser.avatar,
        score: 0,
        quizzes_played: 0,
        wins: 0,
        accuracy: 0,
        updated_at: /* @__PURE__ */ new Date()
      },
      { upsert: true }
    );
    return newUser.toObject();
  }
  async updateUserProfile(userId, data) {
    const updateFields = {};
    if (data.username) updateFields.username = data.username.trim();
    if (data.title) updateFields.title = data.title.trim();
    if (data.avatar) updateFields.avatar = data.avatar.trim();
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { $set: updateFields },
      { new: true }
    ).lean();
    if (!updatedUser) return null;
    const lbUpdate = { updated_at: /* @__PURE__ */ new Date() };
    if (data.username) lbUpdate.username = data.username.trim();
    if (data.avatar) lbUpdate.avatar = data.avatar.trim();
    await LeaderboardModel.updateOne({ user_id: userId }, { $set: lbUpdate });
    return updatedUser;
  }
  // ----------------- SESSION CRUD -----------------
  async createSession(token, userId) {
    await SessionModel.findOneAndUpdate(
      { token },
      { token, user_id: userId, created_at: /* @__PURE__ */ new Date() },
      { upsert: true }
    );
  }
  async findUserIdBySessionToken(token) {
    const session = await SessionModel.findOne({ token }).lean();
    return session ? session.user_id : null;
  }
  async deleteSession(token) {
    await SessionModel.deleteOne({ token });
  }
  // ----------------- QUIZ CRUD -----------------
  async getAllQuizzes() {
    const quizzes = await QuizModel.find().sort({ created_at: -1 }).lean();
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
  async getQuizById(id) {
    const quiz = await QuizModel.findOne({ id }).lean();
    if (!quiz) return null;
    const count = await QuestionModel.countDocuments({ quiz_id: quiz.id });
    return { ...quiz, question_count: count };
  }
  async getQuizByRoomCode(code) {
    const clean = code.trim().toUpperCase();
    const quiz = await QuizModel.findOne({ room_code: clean }).lean();
    if (!quiz) return null;
    const count = await QuestionModel.countDocuments({ quiz_id: quiz.id });
    return { ...quiz, question_count: count };
  }
  async getQuestionsForQuiz(quizId, maskCorrect = true) {
    const questions = await QuestionModel.find({ quiz_id: quizId }).lean();
    if (!maskCorrect) {
      return questions;
    }
    return questions.map(({ correct_option, ...rest }) => rest);
  }
  async createQuiz(userId, username, title, description, timeLimitMinutes, questionsData) {
    let roomCode = generateRoomCode();
    while (await QuizModel.findOne({ room_code: roomCode })) {
      roomCode = generateRoomCode();
    }
    const quizId = "quiz_" + crypto.randomUUID().slice(0, 8);
    const newQuiz = await QuizModel.create({
      id: quizId,
      title: title.trim(),
      description: description.trim() || "Custom created challenge quiz.",
      created_by: userId,
      created_by_username: username,
      room_code: roomCode,
      time_limit_minutes: timeLimitMinutes || 5,
      created_at: /* @__PURE__ */ new Date()
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
      questions: questionsToInsert
    };
  }
  async deleteQuiz(quizId, userId) {
    const deleted = await QuizModel.findOneAndDelete({ id: quizId, created_by: userId });
    if (!deleted) return false;
    await QuestionModel.deleteMany({ quiz_id: quizId });
    return true;
  }
  // ----------------- SUBMISSION & LEADERBOARD CRUD -----------------
  async submitQuizAttempt(userId, username, quizId, answers) {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) throw new Error("Quiz not found");
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
    const percentage = total > 0 ? Math.round(correctCount / total * 100) : 0;
    const attempt = await AttemptModel.create({
      id: "att_" + crypto.randomUUID().slice(0, 8),
      user_id: userId,
      username,
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      score,
      total_questions: total,
      correct_answers: correctCount,
      wrong_answers: wrongCount,
      percentage,
      attempted_at: /* @__PURE__ */ new Date()
    });
    const user = await this.findUserById(userId);
    let lb = await LeaderboardModel.findOne({ user_id: userId });
    if (!lb) {
      lb = await LeaderboardModel.create({
        id: "lb_" + crypto.randomUUID().slice(0, 8),
        user_id: userId,
        username,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        score: 0,
        quizzes_played: 0,
        wins: 0,
        accuracy: 0,
        updated_at: /* @__PURE__ */ new Date()
      });
    }
    const pointsGained = correctCount * 10;
    lb.score += pointsGained;
    lb.quizzes_played += 1;
    if (percentage >= 80) {
      lb.wins += 1;
    }
    const allAttempts = await AttemptModel.find({ user_id: userId }).lean();
    const totalCorrect = allAttempts.reduce((sum, a) => sum + a.correct_answers, 0);
    const totalQ = allAttempts.reduce((sum, a) => sum + a.total_questions, 0);
    lb.accuracy = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : percentage;
    lb.updated_at = /* @__PURE__ */ new Date();
    await lb.save();
    return { attempt: attempt.toObject(), breakdown };
  }
  async getLeaderboard() {
    return await LeaderboardModel.find().sort({ score: -1, accuracy: -1 }).lean();
  }
  // ----------------- PROFILE DATA CRUD -----------------
  async getUserProfileData(userId) {
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
};
var mongoDbManager = new MongoDatabaseManager();

// data/gameRoomManager.ts
import crypto2 from "crypto";
var ActiveGameRoom = class {
  constructor(io2, roomCode, quizId, quizTitle, authorId, authorUsername, authorAvatar, startingDurationMinutes = 5, answeringDurationSeconds = 25, maxPlayers = 8) {
    this.status = "waiting";
    this.startingDurationMinutes = 5;
    this.answeringDurationSeconds = 25;
    this.maxPlayers = 8;
    this.lobbyEndTime = Date.now() + 5 * 60 * 1e3;
    this.participants = [];
    // Normal players only, author excluded
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.originalStartingPlayerIndex = 0;
    this.currentPlayerIndex = 0;
    this.turnTimeLeft = 25;
    this.turnTimer = null;
    this.lobbyTimer = null;
    this.isPaused = false;
    this.passedPlayerIds = /* @__PURE__ */ new Set();
    this.lastActionEvent = null;
    this.finalRankings = [];
    this.io = io2;
    this.roomCode = roomCode.toUpperCase();
    this.quizId = quizId;
    this.quizTitle = quizTitle;
    this.authorId = authorId;
    this.authorUsername = authorUsername;
    this.authorAvatar = authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${authorUsername}`;
    this.startingDurationMinutes = startingDurationMinutes;
    this.answeringDurationSeconds = answeringDurationSeconds;
    this.maxPlayers = maxPlayers;
    this.turnTimeLeft = answeringDurationSeconds;
    this.lobbyEndTime = Date.now() + startingDurationMinutes * 60 * 1e3;
    this.startLobbyTimer();
  }
  // ----------------- LOBBY COUNTDOWN -----------------
  startLobbyTimer() {
    if (this.lobbyTimer) clearInterval(this.lobbyTimer);
    this.lobbyTimer = setInterval(() => {
      if (this.status !== "waiting") {
        if (this.lobbyTimer) clearInterval(this.lobbyTimer);
        return;
      }
      const timeLeftSec = Math.max(0, Math.floor((this.lobbyEndTime - Date.now()) / 1e3));
      this.io.to(this.roomCode).emit("countdown_updated", {
        timeLeftSeconds: timeLeftSec,
        isReady: timeLeftSec === 0
      });
      if (timeLeftSec === 0) {
        if (this.lobbyTimer) clearInterval(this.lobbyTimer);
        this.status = "starting";
        this.io.to(this.roomCode).emit("lobby_ready", {
          message: "Lobby countdown complete! Waiting for Author to start the game."
        });
        this.broadcastState();
      }
    }, 1e3);
  }
  // ----------------- PLAYER MANAGEMENT -----------------
  join(user, socketId) {
    const isAuthor = user.id === this.authorId || user.username.toLowerCase() === this.authorUsername.toLowerCase();
    if (isAuthor) {
      this.broadcastState();
      return { success: true };
    }
    if (this.status === "in_progress" || this.status === "completed") {
      const existing2 = this.participants.find((p) => p.userId === user.id || p.username.toLowerCase() === user.username.toLowerCase());
      if (existing2) {
        existing2.isConnected = true;
        existing2.socketId = socketId;
        this.broadcastState();
        return { success: true };
      }
      return { success: false, error: "Cannot join: Game has already started or completed!" };
    }
    const existing = this.participants.find((p) => p.userId === user.id || p.username.toLowerCase() === user.username.toLowerCase());
    if (existing) {
      existing.isConnected = true;
      existing.socketId = socketId;
      this.broadcastState();
      return { success: true };
    }
    if (this.participants.length >= this.maxPlayers) {
      return { success: false, error: `Room is at maximum player capacity (${this.maxPlayers} players).` };
    }
    const newPlayer = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      passedCount: 0,
      status: "waiting",
      isConnected: true,
      socketId
    };
    this.participants.push(newPlayer);
    this.broadcastState();
    return { success: true };
  }
  leave(userId, socketId) {
    const player = this.participants.find((p) => p.userId === userId || p.socketId === socketId);
    if (player) {
      player.isConnected = false;
      if (this.status === "in_progress") {
        const activePlayer = this.participants[this.currentPlayerIndex];
        if (activePlayer && activePlayer.userId === player.userId) {
          setTimeout(() => {
            if (!player.isConnected && this.status === "in_progress") {
              this.passTurn(player.userId, true);
            }
          }, 4e3);
        }
      }
      this.broadcastState();
    }
  }
  // ----------------- GAME CONTROLS (AUTHOR ONLY) -----------------
  async startGame(authorId) {
    if (authorId !== this.authorId) {
      return { success: false, error: "Unauthorized: Only the Author can start the game." };
    }
    if (this.participants.length === 0) {
      return { success: false, error: "Cannot start game without players! Share the room code for players to join." };
    }
    try {
      const qList = await QuestionModel.find({ quiz_id: this.quizId }).lean();
      if (!qList || qList.length === 0) {
        return { success: false, error: "No questions found for this quiz!" };
      }
      this.questions = qList;
    } catch (e) {
      return { success: false, error: "Database error fetching questions: " + e.message };
    }
    if (this.lobbyTimer) clearInterval(this.lobbyTimer);
    this.status = "in_progress";
    this.currentQuestionIndex = 0;
    this.originalStartingPlayerIndex = 0;
    this.currentPlayerIndex = 0;
    this.passedPlayerIds.clear();
    this.isPaused = false;
    this.lastActionEvent = {
      type: "start",
      message: `Game started by Author ${this.authorUsername}!`,
      player_name: this.authorUsername
    };
    try {
      await QuizModel.updateOne({ room_code: this.roomCode }, { status: "in_progress" });
    } catch (e) {
    }
    this.startQuestionTurn();
    this.io.to(this.roomCode).emit("game_started", this.getSanitizedState());
    return { success: true };
  }
  pauseGame(authorId) {
    if (authorId !== this.authorId) {
      return { success: false, error: "Unauthorized: Only the Author can pause the game." };
    }
    if (this.status !== "in_progress") {
      return { success: false, error: "Game is not currently in progress." };
    }
    this.isPaused = true;
    if (this.turnTimer) clearInterval(this.turnTimer);
    this.lastActionEvent = {
      type: "paused",
      message: "Game paused by Author.",
      player_name: this.authorUsername
    };
    this.io.to(this.roomCode).emit("game_paused", { message: "Game has been paused by the Author." });
    this.broadcastState();
    return { success: true };
  }
  resumeGame(authorId) {
    if (authorId !== this.authorId) {
      return { success: false, error: "Unauthorized: Only the Author can resume the game." };
    }
    if (!this.isPaused) {
      return { success: false, error: "Game is not paused." };
    }
    this.isPaused = false;
    this.lastActionEvent = {
      type: "resumed",
      message: "Game resumed by Author.",
      player_name: this.authorUsername
    };
    this.io.to(this.roomCode).emit("game_resumed", { message: "Game resumed by the Author." });
    this.startTurnTimer();
    this.broadcastState();
    return { success: true };
  }
  async endGame(authorId) {
    if (authorId !== this.authorId) {
      return { success: false, error: "Unauthorized: Only the Author can end the game." };
    }
    await this.finalizeGame();
    return { success: true };
  }
  // ----------------- TURN & QUESTION ROTATION (RULES A, B, C, D, E, F) -----------------
  startQuestionTurn() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.finalizeGame();
      return;
    }
    if (this.participants.length === 0) return;
    this.passedPlayerIds.clear();
    this.currentPlayerIndex = this.originalStartingPlayerIndex % this.participants.length;
    this.turnTimeLeft = this.answeringDurationSeconds;
    this.participants.forEach((p, idx) => {
      p.status = idx === this.currentPlayerIndex ? "thinking" : "waiting";
    });
    this.startTurnTimer();
    this.broadcastState();
    this.io.to(this.roomCode).emit("question_updated", this.getSanitizedState());
  }
  startTurnTimer() {
    if (this.turnTimer) clearInterval(this.turnTimer);
    this.turnTimer = setInterval(() => {
      if (this.isPaused || this.status !== "in_progress") return;
      this.turnTimeLeft--;
      const activePlayer = this.participants[this.currentPlayerIndex];
      this.io.to(this.roomCode).emit("turn_timer_tick", {
        timeLeft: this.turnTimeLeft,
        activeUserId: activePlayer?.userId
      });
      if (this.turnTimeLeft <= 0) {
        if (this.turnTimer) clearInterval(this.turnTimer);
        if (activePlayer) {
          this.passTurn(activePlayer.userId, true);
        }
      }
    }, 1e3);
  }
  // ----------------- SUBMIT ANSWER (RULES A & B) -----------------
  async submitAnswer(userId, questionId, selectedOption) {
    if (this.status !== "in_progress" || this.isPaused) {
      return { success: false, error: "Game is not actively running." };
    }
    const activePlayer = this.participants[this.currentPlayerIndex];
    if (!activePlayer || activePlayer.userId !== userId) {
      return { success: false, error: "Out of turn! It is not your turn to answer." };
    }
    const currentQ = this.questions[this.currentQuestionIndex];
    if (!currentQ || currentQ.id !== questionId) {
      return { success: false, error: "Invalid or expired question." };
    }
    if (this.turnTimer) clearInterval(this.turnTimer);
    const isCorrect = selectedOption === currentQ.correct_option;
    if (isCorrect) {
      activePlayer.score += 2;
      activePlayer.correctAnswers += 1;
      activePlayer.status = "answered";
      this.lastActionEvent = {
        type: "correct",
        message: `\u{1F389} Correct! ${activePlayer.username} answered correctly (+2 marks)!`,
        player_name: activePlayer.username,
        points_change: 2
      };
      this.io.to(this.roomCode).emit("answer_result", {
        player: activePlayer.username,
        isCorrect: true,
        pointsChange: 2,
        correctOption: currentQ.correct_option,
        selectedOption
      });
      this.originalStartingPlayerIndex = (this.originalStartingPlayerIndex + 1) % this.participants.length;
      this.currentQuestionIndex++;
      this.broadcastState();
      setTimeout(() => {
        if (this.status === "in_progress") {
          this.startQuestionTurn();
        }
      }, 2e3);
      return { success: true, isCorrect: true, awarded: 2 };
    } else {
      activePlayer.score -= 1;
      activePlayer.wrongAnswers += 1;
      activePlayer.status = "answered";
      this.lastActionEvent = {
        type: "wrong",
        message: `\u274C Wrong! ${activePlayer.username} chose incorrect option (-1 mark).`,
        player_name: activePlayer.username,
        points_change: -1
      };
      this.io.to(this.roomCode).emit("answer_result", {
        player: activePlayer.username,
        isCorrect: false,
        pointsChange: -1,
        correctOption: currentQ.correct_option,
        selectedOption
      });
      this.originalStartingPlayerIndex = (this.originalStartingPlayerIndex + 1) % this.participants.length;
      this.currentQuestionIndex++;
      this.broadcastState();
      setTimeout(() => {
        if (this.status === "in_progress") {
          this.startQuestionTurn();
        }
      }, 2e3);
      return { success: true, isCorrect: false, awarded: -1 };
    }
  }
  // ----------------- PASS TURN (RULES C, D, E) -----------------
  passTurn(userId, isTimeout = false) {
    if (this.status !== "in_progress" || this.isPaused) {
      return { success: false, error: "Game is not actively running." };
    }
    const activePlayer = this.participants[this.currentPlayerIndex];
    if (!activePlayer || activePlayer.userId !== userId) {
      return { success: false, error: "Out of turn! It is not your turn to pass." };
    }
    if (this.turnTimer) clearInterval(this.turnTimer);
    activePlayer.passedCount += 1;
    activePlayer.status = "passed";
    this.passedPlayerIds.add(userId);
    this.lastActionEvent = {
      type: isTimeout ? "timeout" : "pass",
      message: isTimeout ? `\u23F1\uFE0F Time expired! ${activePlayer.username} passed (0 marks).` : `\u{1F44B} ${activePlayer.username} passed the question (0 marks).`,
      player_name: activePlayer.username,
      points_change: 0
    };
    this.io.to(this.roomCode).emit("player_passed", {
      player: activePlayer.username,
      isTimeout
    });
    const activeParticipants = this.participants.filter((p) => p.isConnected);
    const allPassed = activeParticipants.length > 0 && activeParticipants.every((p) => this.passedPlayerIds.has(p.userId));
    if (allPassed || this.passedPlayerIds.size >= this.participants.length) {
      this.originalStartingPlayerIndex = (this.originalStartingPlayerIndex + 1) % this.participants.length;
      this.currentQuestionIndex++;
      this.lastActionEvent = {
        type: "all_passed",
        message: "\u{1F504} Everyone passed this question! Moving to next question.",
        player_name: "System"
      };
      this.broadcastState();
      setTimeout(() => {
        if (this.status === "in_progress") {
          this.startQuestionTurn();
        }
      }, 2200);
      return { success: true };
    }
    let nextIndex = (this.currentPlayerIndex + 1) % this.participants.length;
    let attempts = 0;
    while (this.passedPlayerIds.has(this.participants[nextIndex].userId) && attempts < this.participants.length) {
      nextIndex = (nextIndex + 1) % this.participants.length;
      attempts++;
    }
    this.currentPlayerIndex = nextIndex;
    this.turnTimeLeft = this.answeringDurationSeconds;
    this.participants.forEach((p, idx) => {
      p.status = idx === this.currentPlayerIndex ? "thinking" : this.passedPlayerIds.has(p.userId) ? "passed" : "waiting";
    });
    this.startTurnTimer();
    this.broadcastState();
    this.io.to(this.roomCode).emit("turn_changed", {
      activeUserId: this.participants[this.currentPlayerIndex].userId,
      activeUsername: this.participants[this.currentPlayerIndex].username
    });
    return { success: true };
  }
  // ----------------- FINALIZE GAME (RESULTS & PERSISTENCE) -----------------
  async finalizeGame() {
    if (this.turnTimer) clearInterval(this.turnTimer);
    if (this.lobbyTimer) clearInterval(this.lobbyTimer);
    this.status = "completed";
    this.completedAt = /* @__PURE__ */ new Date();
    const sorted = [...this.participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.correctAnswers - a.correctAnswers;
    });
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score === sorted[i - 1].score) {
        sorted[i].rank = sorted[i - 1].rank;
      } else {
        sorted[i].rank = currentRank;
      }
      currentRank++;
    }
    this.finalRankings = sorted.map((p) => ({
      user_id: p.userId,
      username: p.username,
      avatar: p.avatar,
      score: p.score,
      correct_answers: p.correctAnswers,
      wrong_answers: p.wrongAnswers,
      passed_count: p.passedCount,
      rank: p.rank
    }));
    this.broadcastState();
    this.io.to(this.roomCode).emit("game_completed", {
      room_code: this.roomCode,
      rankings: this.finalRankings,
      total_questions: this.questions.length
    });
    try {
      for (const p of sorted) {
        const totalAnswers = p.correctAnswers + p.wrongAnswers;
        const accuracy = totalAnswers > 0 ? Math.round(p.correctAnswers / totalAnswers * 100) : 0;
        await AttemptModel.create({
          id: "att_mp_" + crypto2.randomUUID().slice(0, 8),
          user_id: p.userId,
          username: p.username,
          quiz_id: this.quizId,
          quiz_title: this.quizTitle,
          room_code: this.roomCode,
          score: p.score,
          total_questions: this.questions.length,
          correct_answers: p.correctAnswers,
          wrong_answers: p.wrongAnswers,
          passed_questions: p.passedCount,
          percentage: accuracy,
          rank: p.rank,
          attempted_at: /* @__PURE__ */ new Date()
        });
      }
      await RoomGameModel.findOneAndUpdate(
        { room_code: this.roomCode },
        {
          id: "room_" + crypto2.randomUUID().slice(0, 8),
          room_code: this.roomCode,
          quiz_id: this.quizId,
          author_id: this.authorId,
          author_username: this.authorUsername,
          status: "completed",
          starting_duration_minutes: this.startingDurationMinutes,
          answering_duration_seconds: this.answeringDurationSeconds,
          max_players: this.maxPlayers,
          participants: this.finalRankings,
          completed_at: /* @__PURE__ */ new Date()
        },
        { upsert: true }
      );
      await QuizModel.updateOne({ room_code: this.roomCode }, { status: "completed" });
    } catch (dbErr) {
      console.error("Error saving multiplayer results to MongoDB:", dbErr);
    }
  }
  // ----------------- STATE BROADCAST -----------------
  getSanitizedState() {
    const currentQ = this.questions[this.currentQuestionIndex];
    const activePlayer = this.participants[this.currentPlayerIndex];
    const originalStartingPlayer = this.participants[this.originalStartingPlayerIndex];
    return {
      room_code: this.roomCode,
      quiz_id: this.quizId,
      quiz_title: this.quizTitle,
      author_id: this.authorId,
      author_username: this.authorUsername,
      status: this.status,
      starting_duration_minutes: this.startingDurationMinutes,
      answering_duration_seconds: this.answeringDurationSeconds,
      lobby_end_time: this.lobbyEndTime,
      max_players: this.maxPlayers,
      participants: this.participants.map((p) => ({
        user_id: p.userId,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        status: p.status,
        is_connected: p.isConnected,
        correct_answers: p.correctAnswers,
        wrong_answers: p.wrongAnswers,
        passed_count: p.passedCount,
        rank: p.rank
      })),
      current_question_index: this.currentQuestionIndex,
      total_questions: this.questions.length,
      current_question: currentQ ? {
        id: currentQ.id,
        question_text: currentQ.question_text,
        option_a: currentQ.option_a,
        option_b: currentQ.option_b,
        option_c: currentQ.option_c,
        option_d: currentQ.option_d
        // correct_option strictly excluded for anti-cheat
      } : null,
      current_player_user_id: activePlayer?.userId,
      current_player_username: activePlayer?.username,
      original_starting_player_user_id: originalStartingPlayer?.userId,
      turn_time_left: this.turnTimeLeft,
      is_paused: this.isPaused,
      passed_user_ids: Array.from(this.passedPlayerIds),
      last_action_event: this.lastActionEvent,
      final_rankings: this.finalRankings
    };
  }
  broadcastState() {
    this.io.to(this.roomCode).emit("game_state_update", this.getSanitizedState());
  }
};
var GameRoomManager = class {
  constructor() {
    this.rooms = /* @__PURE__ */ new Map();
    this.io = null;
  }
  init(io2) {
    this.io = io2;
    this.setupSocketEvents();
  }
  createOrGetRoom(roomCode, quizId, quizTitle, authorId, authorUsername, authorAvatar, startingDurationMinutes = 5, answeringDurationSeconds = 25, maxPlayers = 8) {
    const code = roomCode.toUpperCase();
    let room = this.rooms.get(code);
    if (!room && this.io) {
      room = new ActiveGameRoom(
        this.io,
        code,
        quizId,
        quizTitle,
        authorId,
        authorUsername,
        authorAvatar,
        startingDurationMinutes,
        answeringDurationSeconds,
        maxPlayers
      );
      this.rooms.set(code, room);
    }
    return room;
  }
  getRoom(roomCode) {
    return this.rooms.get(roomCode.toUpperCase());
  }
  setupSocketEvents() {
    if (!this.io) return;
    this.io.on("connection", (socket) => {
      let currentRoomCode = null;
      let currentUserId = null;
      socket.on("join_room", async (data) => {
        if (!data || !data.roomCode || !data.user) return;
        const code = data.roomCode.toUpperCase();
        currentRoomCode = code;
        currentUserId = data.user.id;
        socket.join(code);
        let room = this.rooms.get(code);
        if (!room) {
          try {
            const quiz = await QuizModel.findOne({ room_code: code }).lean();
            if (quiz) {
              room = this.createOrGetRoom(
                code,
                quiz.id,
                quiz.title,
                quiz.created_by,
                quiz.created_by_username,
                `https://api.dicebear.com/7.x/bottts/svg?seed=${quiz.created_by_username}`,
                5,
                25,
                8
              );
            }
          } catch (e) {
          }
        }
        if (room) {
          const result = room.join(data.user, socket.id);
          if (!result.success) {
            socket.emit("error_message", { message: result.error });
          } else {
            socket.emit("game_state_update", room.getSanitizedState());
          }
        } else {
          socket.emit("error_message", { message: `Room "${code}" not found.` });
        }
      });
      socket.on("start_game", async (data) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = await room.startGame(data.authorId);
          if (!res.success) {
            socket.emit("error_message", { message: res.error });
          }
        }
      });
      socket.on("pause_game", (data) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = room.pauseGame(data.authorId);
          if (!res.success) socket.emit("error_message", { message: res.error });
        }
      });
      socket.on("resume_game", (data) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = room.resumeGame(data.authorId);
          if (!res.success) socket.emit("error_message", { message: res.error });
        }
      });
      socket.on("end_game", async (data) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = await room.endGame(data.authorId);
          if (!res.success) socket.emit("error_message", { message: res.error });
        }
      });
      socket.on("submit_answer", async (data) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = await room.submitAnswer(data.userId, data.questionId, data.selectedOption);
          if (!res.success) socket.emit("error_message", { message: res.error });
        }
      });
      socket.on("pass_turn", (data) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = room.passTurn(data.userId, false);
          if (!res.success) socket.emit("error_message", { message: res.error });
        }
      });
      socket.on("disconnect", () => {
        if (currentRoomCode && currentUserId) {
          const room = this.rooms.get(currentRoomCode);
          if (room) {
            room.leave(currentUserId, socket.id);
          }
        }
      });
    });
  }
};
var gameRoomManager = new GameRoomManager();

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var httpServer = http.createServer(app);
var io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});
gameRoomManager.init(io);
var PORT = parseInt(process.env.PORT || "3000", 10);
app.use(express.json());
var localSessionCache = /* @__PURE__ */ new Map();
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];
    let userId = localSessionCache.get(token);
    if (!userId) {
      userId = await mongoDbManager.findUserIdBySessionToken(token) || void 0;
      if (userId) {
        localSessionCache.set(token, userId);
      }
    }
    if (!userId) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }
    const user = await mongoDbManager.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Authentication verification failed: " + err.message });
  }
}
app.get("/api/health", async (_req, res) => {
  res.json({
    status: "ok",
    database: "MongoDB Atlas",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existingUser = await mongoDbManager.findUserByUsernameOrEmail(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }
    const existingEmail = await mongoDbManager.findUserByUsernameOrEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    const newUser = await mongoDbManager.createUser(username, email, password);
    const token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localSessionCache.set(token, newUser.id);
    await mongoDbManager.createSession(token, newUser.id);
    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        title: newUser.title,
        is_staff: newUser.is_staff
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error during registration" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Username/email and password are required" });
    }
    const user = await mongoDbManager.findUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }
    const hashedInput = hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }
    const token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localSessionCache.set(token, user.id);
    await mongoDbManager.createSession(token, user.id);
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        is_staff: user.is_staff
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error during login" });
  }
});
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      title: user.title,
      is_staff: user.is_staff
    }
  });
});
app.post("/api/auth/logout", authMiddleware, async (req, res) => {
  const token = req.token;
  localSessionCache.delete(token);
  await mongoDbManager.deleteSession(token);
  res.json({ message: "Logged out successfully" });
});
app.get("/api/quizzes", async (_req, res) => {
  try {
    const quizzes = await mongoDbManager.getAllQuizzes();
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve quizzes: " + err.message });
  }
});
app.get("/api/quizzes/code/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    const quiz = await mongoDbManager.getQuizByRoomCode(roomCode);
    if (!quiz) {
      return res.status(404).json({
        error: `No quiz found with room code "${roomCode.toUpperCase()}". Please verify the code and try again!`
      });
    }
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: "Failed to search quiz room: " + err.message });
  }
});
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await mongoDbManager.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    const questions = await mongoDbManager.getQuestionsForQuiz(id, true);
    res.json({ quiz, questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to load quiz details: " + err.message });
  }
});
app.post("/api/quizzes", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      description,
      time_limit_minutes,
      questions,
      starting_duration_minutes,
      answering_duration_seconds,
      max_players
    } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Quiz title is required" });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Quiz must contain at least 1 question" });
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option) {
        return res.status(400).json({
          error: `Question ${i + 1} is missing required fields (question text, all 4 options, and correct answer)`
        });
      }
    }
    const result = await mongoDbManager.createQuiz(
      user.id,
      user.username,
      title,
      description || "",
      Number(time_limit_minutes) || 5,
      questions
    );
    const room = gameRoomManager.createOrGetRoom(
      result.quiz.room_code,
      result.quiz.id,
      result.quiz.title,
      user.id,
      user.username,
      user.avatar,
      Number(starting_duration_minutes) || 5,
      Number(answering_duration_seconds) || 25,
      Number(max_players) || 8
    );
    res.status(201).json({
      message: "Quiz created successfully!",
      quiz: result.quiz,
      room_code: result.quiz.room_code,
      room: room.getSanitizedState()
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error creating quiz" });
  }
});
app.get("/api/rooms/:roomCode", async (req, res) => {
  try {
    const code = req.params.roomCode.toUpperCase();
    let room = gameRoomManager.getRoom(code);
    if (!room) {
      const quiz = await mongoDbManager.getQuizByRoomCode(code);
      if (quiz) {
        room = gameRoomManager.createOrGetRoom(
          code,
          quiz.id,
          quiz.title,
          quiz.created_by,
          quiz.created_by_username,
          `https://api.dicebear.com/7.x/bottts/svg?seed=${quiz.created_by_username}`,
          5,
          25,
          8
        );
      }
    }
    if (!room) {
      return res.status(404).json({ error: `Room "${code}" not found.` });
    }
    res.json({ room: room.getSanitizedState() });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve room: " + err.message });
  }
});
app.delete("/api/quizzes/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const success = await mongoDbManager.deleteQuiz(id, user.id);
    if (!success) {
      return res.status(403).json({ error: "Could not delete quiz. Only the creator can delete it." });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting quiz: " + err.message });
  }
});
app.post("/api/quizzes/:id/submit", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers array is required" });
    }
    const { attempt, breakdown } = await mongoDbManager.submitQuizAttempt(user.id, user.username, id, answers);
    res.json({
      message: "Quiz evaluated successfully",
      attempt,
      breakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error evaluating quiz" });
  }
});
app.get("/api/leaderboard", async (_req, res) => {
  try {
    const leaderboard = await mongoDbManager.getLeaderboard();
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve leaderboard: " + err.message });
  }
});
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const profileData = await mongoDbManager.getUserProfileData(user.id);
    if (!profileData) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json(profileData);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving profile: " + err.message });
  }
});
app.put("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { username, title, avatar } = req.body;
    const updatedUser = await mongoDbManager.updateUserProfile(user.id, { username, title, avatar });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        title: updatedUser.title,
        is_staff: updatedUser.is_staff
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Error updating profile: " + err.message });
  }
});
async function startServer() {
  console.log("\u{1F504} Initializing MongoDB connection...");
  await mongoDbManager.connect();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path2.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(__dirname, "dist", "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Quiz Battle JavaScript & MongoDB server running on http://0.0.0.0:${PORT} (Socket.IO Ready)`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
