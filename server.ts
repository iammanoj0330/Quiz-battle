import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { mongoDbManager, hashPassword } from './data/mongo.ts';
import { gameRoomManager } from './data/gameRoomManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

// Initialize real-time multiplayer socket game manager
gameRoomManager.init(io);

const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// In-memory fallback token cache alongside MongoDB session store
const localSessionCache = new Map<string, string>();

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];

    let userId = localSessionCache.get(token);
    if (!userId) {
      userId = (await mongoDbManager.findUserIdBySessionToken(token)) || undefined;
      if (userId) {
        localSessionCache.set(token, userId);
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const user = await mongoDbManager.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    (req as any).user = user;
    (req as any).token = token;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Authentication verification failed: ' + err.message });
  }
}

// ----------------- HEALTH & DB STATUS API -----------------

app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// ----------------- AUTH APIS (CRUD) -----------------

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await mongoDbManager.findUserByUsernameOrEmail(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const existingEmail = await mongoDbManager.findUserByUsernameOrEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const newUser = await mongoDbManager.createUser(username, email, password);
    const token = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    localSessionCache.set(token, newUser.id);
    await mongoDbManager.createSession(token, newUser.id);

    return res.status(201).json({
      message: 'Registration successful',
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const user = await mongoDbManager.findUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const hashedInput = hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const token = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localSessionCache.set(token, user.id);
    await mongoDbManager.createSession(token, user.id);

    return res.json({
      message: 'Login successful',
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
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

app.post('/api/auth/logout', authMiddleware, async (req: Request, res: Response) => {
  const token = (req as any).token;
  localSessionCache.delete(token);
  await mongoDbManager.deleteSession(token);
  res.json({ message: 'Logged out successfully' });
});

// ----------------- QUIZ APIS (CRUD) -----------------

// READ: Get all quizzes with live question counts
app.get('/api/quizzes', async (_req: Request, res: Response) => {
  try {
    const quizzes = await mongoDbManager.getAllQuizzes();
    res.json({ quizzes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve quizzes: ' + err.message });
  }
});

// READ: Join quiz by room code
app.get('/api/quizzes/code/:roomCode', async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const quiz = await mongoDbManager.getQuizByRoomCode(roomCode);
    if (!quiz) {
      return res.status(404).json({
        error: `No quiz found with room code "${roomCode.toUpperCase()}". Please verify the code and try again!`
      });
    }
    res.json({ quiz });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to search quiz room: ' + err.message });
  }
});

// READ: Get quiz details + questions for playing
app.get('/api/quizzes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quiz = await mongoDbManager.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    const questions = await mongoDbManager.getQuestionsForQuiz(id, true);
    res.json({ quiz, questions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load quiz details: ' + err.message });
  }
});

// CREATE: Create quiz with questions
app.post('/api/quizzes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
      return res.status(400).json({ error: 'Quiz title is required' });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must contain at least 1 question' });
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
      description || '',
      Number(time_limit_minutes) || 5,
      questions
    );

    // Initialize multiplayer game room with author configuration
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
      message: 'Quiz created successfully!',
      quiz: result.quiz,
      room_code: result.quiz.room_code,
      room: room.getSanitizedState()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating quiz' });
  }
});

// READ: Get multiplayer room state by room code
app.get('/api/rooms/:roomCode', async (req: Request, res: Response) => {
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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve room: ' + err.message });
  }
});

// DELETE: Delete own quiz
app.delete('/api/quizzes/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const success = await mongoDbManager.deleteQuiz(id, user.id);
    if (!success) {
      return res.status(403).json({ error: 'Could not delete quiz. Only the creator can delete it.' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error deleting quiz: ' + err.message });
  }
});

// ----------------- SUBMISSION & SCORING APIS (CRUD) -----------------

app.post('/api/quizzes/:id/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const { attempt, breakdown } = await mongoDbManager.submitQuizAttempt(user.id, user.username, id, answers);

    res.json({
      message: 'Quiz evaluated successfully',
      attempt,
      breakdown
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error evaluating quiz' });
  }
});

// ----------------- LEADERBOARD API (CRUD) -----------------

app.get('/api/leaderboard', async (_req: Request, res: Response) => {
  try {
    const leaderboard = await mongoDbManager.getLeaderboard();
    res.json({ leaderboard });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve leaderboard: ' + err.message });
  }
});

// ----------------- PROFILE APIS (CRUD) -----------------

// READ: User Profile + History + My Quizzes
app.get('/api/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profileData = await mongoDbManager.getUserProfileData(user.id);
    if (!profileData) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(profileData);
  } catch (err: any) {
    res.status(500).json({ error: 'Error retrieving profile: ' + err.message });
  }
});

// UPDATE: User Profile
app.put('/api/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { username, title, avatar } = req.body;
    const updatedUser = await mongoDbManager.updateUserProfile(user.id, { username, title, avatar });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        title: updatedUser.title,
        is_staff: updatedUser.is_staff
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error updating profile: ' + err.message });
  }
});

// ----------------- VITE / STATIC SERVING -----------------

async function startServer() {
  // Connect to MongoDB Atlas
  console.log('🔄 Initializing MongoDB connection...');
  await mongoDbManager.connect();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Quiz Battle JavaScript & MongoDB server running on http://0.0.0.0:${PORT} (Socket.IO Ready)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
