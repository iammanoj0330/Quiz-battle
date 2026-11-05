import { Server, Socket } from 'socket.io';
import { QuizModel, QuestionModel, AttemptModel, RoomGameModel, UserModel } from './mongo.ts';
import crypto from 'crypto';

export interface ActiveRoomPlayer {
  userId: string;
  username: string;
  avatar: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  passedCount: number;
  status: 'waiting' | 'thinking' | 'answered' | 'passed';
  isConnected: boolean;
  socketId?: string;
  rank?: number;
}

export class ActiveGameRoom {
  public roomCode: string;
  public quizId: string;
  public quizTitle: string;
  public authorId: string;
  public authorUsername: string;
  public authorAvatar: string;
  public status: 'waiting' | 'starting' | 'in_progress' | 'paused' | 'completed' = 'waiting';
  public startingDurationMinutes: number = 5;
  public answeringDurationSeconds: number = 25;
  public maxPlayers: number = 8;
  public lobbyEndTime: number = Date.now() + 5 * 60 * 1000;
  public participants: ActiveRoomPlayer[] = []; // Normal players only, author excluded
  public questions: any[] = [];
  public currentQuestionIndex: number = 0;
  public originalStartingPlayerIndex: number = 0;
  public currentPlayerIndex: number = 0;
  public turnTimeLeft: number = 25;
  public turnTimer: NodeJS.Timeout | null = null;
  public lobbyTimer: NodeJS.Timeout | null = null;
  public isPaused: boolean = false;
  public passedPlayerIds: Set<string> = new Set();
  public lastActionEvent: any = null;
  public completedAt?: Date;
  public finalRankings: any[] = [];

  private io: Server;

  constructor(
    io: Server,
    roomCode: string,
    quizId: string,
    quizTitle: string,
    authorId: string,
    authorUsername: string,
    authorAvatar: string,
    startingDurationMinutes: number = 5,
    answeringDurationSeconds: number = 25,
    maxPlayers: number = 8
  ) {
    this.io = io;
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
    this.lobbyEndTime = Date.now() + startingDurationMinutes * 60 * 1000;

    this.startLobbyTimer();
  }

  // ----------------- LOBBY COUNTDOWN -----------------

  public startLobbyTimer() {
    if (this.lobbyTimer) clearInterval(this.lobbyTimer);

    this.lobbyTimer = setInterval(() => {
      if (this.status !== 'waiting') {
        if (this.lobbyTimer) clearInterval(this.lobbyTimer);
        return;
      }

      const timeLeftSec = Math.max(0, Math.floor((this.lobbyEndTime - Date.now()) / 1000));
      this.io.to(this.roomCode).emit('countdown_updated', {
        timeLeftSeconds: timeLeftSec,
        isReady: timeLeftSec === 0
      });

      if (timeLeftSec === 0) {
        if (this.lobbyTimer) clearInterval(this.lobbyTimer);
        this.status = 'starting';
        this.io.to(this.roomCode).emit('lobby_ready', {
          message: 'Lobby countdown complete! Waiting for Author to start the game.'
        });
        this.broadcastState();
      }
    }, 1000);
  }

  // ----------------- PLAYER MANAGEMENT -----------------

  public join(user: { id: string; username: string; avatar?: string }, socketId: string): { success: boolean; error?: string } {
    const isAuthor = user.id === this.authorId || user.username.toLowerCase() === this.authorUsername.toLowerCase();

    if (isAuthor) {
      // Author rejoins or connects
      this.broadcastState();
      return { success: true };
    }

    if (this.status === 'in_progress' || this.status === 'completed') {
      // Allow reconnecting if already a registered participant
      const existing = this.participants.find(p => p.userId === user.id || p.username.toLowerCase() === user.username.toLowerCase());
      if (existing) {
        existing.isConnected = true;
        existing.socketId = socketId;
        this.broadcastState();
        return { success: true };
      }
      return { success: false, error: 'Cannot join: Game has already started or completed!' };
    }

    // Check duplicate
    const existing = this.participants.find(p => p.userId === user.id || p.username.toLowerCase() === user.username.toLowerCase());
    if (existing) {
      existing.isConnected = true;
      existing.socketId = socketId;
      this.broadcastState();
      return { success: true };
    }

    // Check capacity
    if (this.participants.length >= this.maxPlayers) {
      return { success: false, error: `Room is at maximum player capacity (${this.maxPlayers} players).` };
    }

    const newPlayer: ActiveRoomPlayer = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      passedCount: 0,
      status: 'waiting',
      isConnected: true,
      socketId
    };

    this.participants.push(newPlayer);
    this.broadcastState();
    return { success: true };
  }

  public leave(userId: string, socketId: string) {
    const player = this.participants.find(p => p.userId === userId || p.socketId === socketId);
    if (player) {
      player.isConnected = false;

      // If in progress and it's their turn, pass automatically after 4s grace period
      if (this.status === 'in_progress') {
        const activePlayer = this.participants[this.currentPlayerIndex];
        if (activePlayer && activePlayer.userId === player.userId) {
          setTimeout(() => {
            if (!player.isConnected && this.status === 'in_progress') {
              this.passTurn(player.userId, true);
            }
          }, 4000);
        }
      }
      this.broadcastState();
    }
  }

  // ----------------- GAME CONTROLS (AUTHOR ONLY) -----------------

  public async startGame(authorId: string): Promise<{ success: boolean; error?: string }> {
    if (authorId !== this.authorId) {
      return { success: false, error: 'Unauthorized: Only the Author can start the game.' };
    }

    if (this.participants.length === 0) {
      return { success: false, error: 'Cannot start game without players! Share the room code for players to join.' };
    }

    // Fetch questions from DB
    try {
      const qList = await QuestionModel.find({ quiz_id: this.quizId }).lean();
      if (!qList || qList.length === 0) {
        return { success: false, error: 'No questions found for this quiz!' };
      }
      this.questions = qList;
    } catch (e: any) {
      return { success: false, error: 'Database error fetching questions: ' + e.message };
    }

    if (this.lobbyTimer) clearInterval(this.lobbyTimer);

    this.status = 'in_progress';
    this.currentQuestionIndex = 0;
    this.originalStartingPlayerIndex = 0;
    this.currentPlayerIndex = 0;
    this.passedPlayerIds.clear();
    this.isPaused = false;
    this.lastActionEvent = {
      type: 'start',
      message: `Game started by Author ${this.authorUsername}!`,
      player_name: this.authorUsername
    };

    // Update Quiz status in DB
    try {
      await QuizModel.updateOne({ room_code: this.roomCode }, { status: 'in_progress' });
    } catch (e) {}

    this.startQuestionTurn();
    this.io.to(this.roomCode).emit('game_started', this.getSanitizedState());
    return { success: true };
  }

  public pauseGame(authorId: string): { success: boolean; error?: string } {
    if (authorId !== this.authorId) {
      return { success: false, error: 'Unauthorized: Only the Author can pause the game.' };
    }
    if (this.status !== 'in_progress') {
      return { success: false, error: 'Game is not currently in progress.' };
    }

    this.isPaused = true;
    if (this.turnTimer) clearInterval(this.turnTimer);

    this.lastActionEvent = {
      type: 'paused',
      message: 'Game paused by Author.',
      player_name: this.authorUsername
    };

    this.io.to(this.roomCode).emit('game_paused', { message: 'Game has been paused by the Author.' });
    this.broadcastState();
    return { success: true };
  }

  public resumeGame(authorId: string): { success: boolean; error?: string } {
    if (authorId !== this.authorId) {
      return { success: false, error: 'Unauthorized: Only the Author can resume the game.' };
    }
    if (!this.isPaused) {
      return { success: false, error: 'Game is not paused.' };
    }

    this.isPaused = false;
    this.lastActionEvent = {
      type: 'resumed',
      message: 'Game resumed by Author.',
      player_name: this.authorUsername
    };

    this.io.to(this.roomCode).emit('game_resumed', { message: 'Game resumed by the Author.' });
    this.startTurnTimer();
    this.broadcastState();
    return { success: true };
  }

  public async endGame(authorId: string): Promise<{ success: boolean; error?: string }> {
    if (authorId !== this.authorId) {
      return { success: false, error: 'Unauthorized: Only the Author can end the game.' };
    }

    await this.finalizeGame();
    return { success: true };
  }

  // ----------------- TURN & QUESTION ROTATION (RULES A, B, C, D, E, F) -----------------

  public startQuestionTurn() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.finalizeGame();
      return;
    }

    if (this.participants.length === 0) return;

    this.passedPlayerIds.clear();
    this.currentPlayerIndex = this.originalStartingPlayerIndex % this.participants.length;
    this.turnTimeLeft = this.answeringDurationSeconds;

    // Reset status for all players: active player is thinking, others waiting
    this.participants.forEach((p, idx) => {
      p.status = idx === this.currentPlayerIndex ? 'thinking' : 'waiting';
    });

    this.startTurnTimer();
    this.broadcastState();
    this.io.to(this.roomCode).emit('question_updated', this.getSanitizedState());
  }

  private startTurnTimer() {
    if (this.turnTimer) clearInterval(this.turnTimer);

    this.turnTimer = setInterval(() => {
      if (this.isPaused || this.status !== 'in_progress') return;

      this.turnTimeLeft--;

      const activePlayer = this.participants[this.currentPlayerIndex];
      this.io.to(this.roomCode).emit('turn_timer_tick', {
        timeLeft: this.turnTimeLeft,
        activeUserId: activePlayer?.userId
      });

      if (this.turnTimeLeft <= 0) {
        if (this.turnTimer) clearInterval(this.turnTimer);
        // RULE E: Timer expires -> Treat as PASS!
        if (activePlayer) {
          this.passTurn(activePlayer.userId, true);
        }
      }
    }, 1000);
  }

  // ----------------- SUBMIT ANSWER (RULES A & B) -----------------

  public async submitAnswer(
    userId: string,
    questionId: string,
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ): Promise<{ success: boolean; error?: string; isCorrect?: boolean; awarded?: number }> {
    if (this.status !== 'in_progress' || this.isPaused) {
      return { success: false, error: 'Game is not actively running.' };
    }

    const activePlayer = this.participants[this.currentPlayerIndex];
    if (!activePlayer || activePlayer.userId !== userId) {
      return { success: false, error: "Out of turn! It is not your turn to answer." };
    }

    const currentQ = this.questions[this.currentQuestionIndex];
    if (!currentQ || currentQ.id !== questionId) {
      return { success: false, error: 'Invalid or expired question.' };
    }

    if (this.turnTimer) clearInterval(this.turnTimer);

    const isCorrect = selectedOption === currentQ.correct_option;

    if (isCorrect) {
      // RULE A: Correct answer
      // Award +2 marks
      activePlayer.score += 2;
      activePlayer.correctAnswers += 1;
      activePlayer.status = 'answered';

      this.lastActionEvent = {
        type: 'correct',
        message: `🎉 Correct! ${activePlayer.username} answered correctly (+2 marks)!`,
        player_name: activePlayer.username,
        points_change: 2
      };

      this.io.to(this.roomCode).emit('answer_result', {
        player: activePlayer.username,
        isCorrect: true,
        pointsChange: 2,
        correctOption: currentQ.correct_option,
        selectedOption
      });

      // RULE A: Move to next question!
      // Give next question to the next participant in circular order from original starter:
      this.originalStartingPlayerIndex = (this.originalStartingPlayerIndex + 1) % this.participants.length;
      this.currentQuestionIndex++;

      this.broadcastState();

      setTimeout(() => {
        if (this.status === 'in_progress') {
          this.startQuestionTurn();
        }
      }, 2000);

      return { success: true, isCorrect: true, awarded: 2 };
    } else {
      // RULE B: Wrong answer
      // Deduct 1 mark (-1)
      activePlayer.score -= 1;
      activePlayer.wrongAnswers += 1;
      activePlayer.status = 'answered';

      this.lastActionEvent = {
        type: 'wrong',
        message: `❌ Wrong! ${activePlayer.username} chose incorrect option (-1 mark).`,
        player_name: activePlayer.username,
        points_change: -1
      };

      this.io.to(this.roomCode).emit('answer_result', {
        player: activePlayer.username,
        isCorrect: false,
        pointsChange: -1,
        correctOption: currentQ.correct_option,
        selectedOption
      });

      // RULE B: End current question immediately! Do NOT give same question to next.
      // Move to next question, start next question with next participant in circular order:
      this.originalStartingPlayerIndex = (this.originalStartingPlayerIndex + 1) % this.participants.length;
      this.currentQuestionIndex++;

      this.broadcastState();

      setTimeout(() => {
        if (this.status === 'in_progress') {
          this.startQuestionTurn();
        }
      }, 2000);

      return { success: true, isCorrect: false, awarded: -1 };
    }
  }

  // ----------------- PASS TURN (RULES C, D, E) -----------------

  public passTurn(userId: string, isTimeout = false): { success: boolean; error?: string } {
    if (this.status !== 'in_progress' || this.isPaused) {
      return { success: false, error: 'Game is not actively running.' };
    }

    const activePlayer = this.participants[this.currentPlayerIndex];
    if (!activePlayer || activePlayer.userId !== userId) {
      return { success: false, error: "Out of turn! It is not your turn to pass." };
    }

    if (this.turnTimer) clearInterval(this.turnTimer);

    // RULE C: Pass awards zero marks, does not deduct
    activePlayer.passedCount += 1;
    activePlayer.status = 'passed';
    this.passedPlayerIds.add(userId);

    this.lastActionEvent = {
      type: isTimeout ? 'timeout' : 'pass',
      message: isTimeout
        ? `⏱️ Time expired! ${activePlayer.username} passed (0 marks).`
        : `👋 ${activePlayer.username} passed the question (0 marks).`,
      player_name: activePlayer.username,
      points_change: 0
    };

    this.io.to(this.roomCode).emit('player_passed', {
      player: activePlayer.username,
      isTimeout
    });

    // RULE D: Check if ALL participants have passed on this question
    const activeParticipants = this.participants.filter(p => p.isConnected);
    const allPassed = activeParticipants.length > 0 && activeParticipants.every(p => this.passedPlayerIds.has(p.userId));

    if (allPassed || this.passedPlayerIds.size >= this.participants.length) {
      // RULE D: Everyone passed!
      // End this question! Move to next question!
      // Start next question from participant immediately after person who originally received previous question:
      this.originalStartingPlayerIndex = (this.originalStartingPlayerIndex + 1) % this.participants.length;
      this.currentQuestionIndex++;

      this.lastActionEvent = {
        type: 'all_passed',
        message: '🔄 Everyone passed this question! Moving to next question.',
        player_name: 'System'
      };

      this.broadcastState();

      setTimeout(() => {
        if (this.status === 'in_progress') {
          this.startQuestionTurn();
        }
      }, 2200);

      return { success: true };
    }

    // RULE C: Keep the SAME question!
    // Move turn to the next participant in circular order
    let nextIndex = (this.currentPlayerIndex + 1) % this.participants.length;
    // Skip players that already passed on this question if any
    let attempts = 0;
    while (this.passedPlayerIds.has(this.participants[nextIndex].userId) && attempts < this.participants.length) {
      nextIndex = (nextIndex + 1) % this.participants.length;
      attempts++;
    }

    this.currentPlayerIndex = nextIndex;
    this.turnTimeLeft = this.answeringDurationSeconds;

    this.participants.forEach((p, idx) => {
      p.status = idx === this.currentPlayerIndex ? 'thinking' : this.passedPlayerIds.has(p.userId) ? 'passed' : 'waiting';
    });

    this.startTurnTimer();
    this.broadcastState();
    this.io.to(this.roomCode).emit('turn_changed', {
      activeUserId: this.participants[this.currentPlayerIndex].userId,
      activeUsername: this.participants[this.currentPlayerIndex].username
    });

    return { success: true };
  }

  // ----------------- FINALIZE GAME (RESULTS & PERSISTENCE) -----------------

  public async finalizeGame() {
    if (this.turnTimer) clearInterval(this.turnTimer);
    if (this.lobbyTimer) clearInterval(this.lobbyTimer);

    this.status = 'completed';
    this.completedAt = new Date();

    // Calculate final rankings (sorted by score descending, ties share rank)
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

    this.finalRankings = sorted.map(p => ({
      user_id: p.userId,
      username: p.username,
      avatar: p.avatar,
      score: p.score,
      correct_answers: p.correctAnswers,
      wrong_answers: p.wrongAnswers,
      passed_count: p.passedCount,
      rank: p.rank
    }));

    // Broadcast completion to all players immediately
    this.broadcastState();
    this.io.to(this.roomCode).emit('game_completed', {
      room_code: this.roomCode,
      rankings: this.finalRankings,
      total_questions: this.questions.length
    });

    // Save Attempts and Game Record in MongoDB
    try {
      for (const p of sorted) {
        const totalAnswers = p.correctAnswers + p.wrongAnswers;
        const accuracy = totalAnswers > 0 ? Math.round((p.correctAnswers / totalAnswers) * 100) : 0;

        await AttemptModel.create({
          id: 'att_mp_' + crypto.randomUUID().slice(0, 8),
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
          attempted_at: new Date()
        });
      }

      // Persist RoomGame in MongoDB
      await RoomGameModel.findOneAndUpdate(
        { room_code: this.roomCode },
        {
          id: 'room_' + crypto.randomUUID().slice(0, 8),
          room_code: this.roomCode,
          quiz_id: this.quizId,
          author_id: this.authorId,
          author_username: this.authorUsername,
          status: 'completed',
          starting_duration_minutes: this.startingDurationMinutes,
          answering_duration_seconds: this.answeringDurationSeconds,
          max_players: this.maxPlayers,
          participants: this.finalRankings,
          completed_at: new Date()
        },
        { upsert: true }
      );

      // Update Quiz status
      await QuizModel.updateOne({ room_code: this.roomCode }, { status: 'completed' });
    } catch (dbErr) {
      console.error('Error saving multiplayer results to MongoDB:', dbErr);
    }
  }

  // ----------------- STATE BROADCAST -----------------

  public getSanitizedState() {
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
      participants: this.participants.map(p => ({
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
      current_question: currentQ
        ? {
            id: currentQ.id,
            question_text: currentQ.question_text,
            option_a: currentQ.option_a,
            option_b: currentQ.option_b,
            option_c: currentQ.option_c,
            option_d: currentQ.option_d
            // correct_option strictly excluded for anti-cheat
          }
        : null,
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

  public broadcastState() {
    this.io.to(this.roomCode).emit('game_state_update', this.getSanitizedState());
  }
}

// ----------------- GLOBAL ROOM MANAGER -----------------

export class GameRoomManager {
  private rooms: Map<string, ActiveGameRoom> = new Map();
  private io: Server | null = null;

  public init(io: Server) {
    this.io = io;
    this.setupSocketEvents();
  }

  public createOrGetRoom(
    roomCode: string,
    quizId: string,
    quizTitle: string,
    authorId: string,
    authorUsername: string,
    authorAvatar: string,
    startingDurationMinutes = 5,
    answeringDurationSeconds = 25,
    maxPlayers = 8
  ): ActiveGameRoom {
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
    return room!;
  }

  public getRoom(roomCode: string): ActiveGameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  private setupSocketEvents() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      let currentRoomCode: string | null = null;
      let currentUserId: string | null = null;

      // Join room
      socket.on('join_room', async (data: { roomCode: string; user: { id: string; username: string; avatar?: string } }) => {
        if (!data || !data.roomCode || !data.user) return;

        const code = data.roomCode.toUpperCase();
        currentRoomCode = code;
        currentUserId = data.user.id;

        socket.join(code);

        let room = this.rooms.get(code);
        if (!room) {
          // If room not yet in memory, load quiz from DB
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
          } catch (e) {}
        }

        if (room) {
          const result = room.join(data.user, socket.id);
          if (!result.success) {
            socket.emit('error_message', { message: result.error });
          } else {
            socket.emit('game_state_update', room.getSanitizedState());
          }
        } else {
          socket.emit('error_message', { message: `Room "${code}" not found.` });
        }
      });

      // Start game (Author only)
      socket.on('start_game', async (data: { roomCode: string; authorId: string }) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = await room.startGame(data.authorId);
          if (!res.success) {
            socket.emit('error_message', { message: res.error });
          }
        }
      });

      // Pause game (Author only)
      socket.on('pause_game', (data: { roomCode: string; authorId: string }) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = room.pauseGame(data.authorId);
          if (!res.success) socket.emit('error_message', { message: res.error });
        }
      });

      // Resume game (Author only)
      socket.on('resume_game', (data: { roomCode: string; authorId: string }) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = room.resumeGame(data.authorId);
          if (!res.success) socket.emit('error_message', { message: res.error });
        }
      });

      // End game (Author only)
      socket.on('end_game', async (data: { roomCode: string; authorId: string }) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = await room.endGame(data.authorId);
          if (!res.success) socket.emit('error_message', { message: res.error });
        }
      });

      // Submit answer (Active Player only)
      socket.on('submit_answer', async (data: {
        roomCode: string;
        userId: string;
        questionId: string;
        selectedOption: 'A' | 'B' | 'C' | 'D';
      }) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = await room.submitAnswer(data.userId, data.questionId, data.selectedOption);
          if (!res.success) socket.emit('error_message', { message: res.error });
        }
      });

      // Pass turn (Active Player only)
      socket.on('pass_turn', (data: { roomCode: string; userId: string }) => {
        const room = this.rooms.get(data.roomCode?.toUpperCase());
        if (room) {
          const res = room.passTurn(data.userId, false);
          if (!res.success) socket.emit('error_message', { message: res.error });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        if (currentRoomCode && currentUserId) {
          const room = this.rooms.get(currentRoomCode);
          if (room) {
            room.leave(currentUserId, socket.id);
          }
        }
      });
    });
  }
}

export const gameRoomManager = new GameRoomManager();
