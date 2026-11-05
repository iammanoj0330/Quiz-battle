# 🏆 QUIZ BATTLE – Circular Turn-Based Multiplayer Quiz Platform

A modern, real-time circular turn-based quiz battle platform with live WebSocket synchronization, custom room codes, waiting lobbies, Author spectator controls, anti-cheat backend scoring, and MongoDB Atlas cloud persistence.

---

## 🎮 NEW FEATURE: Circular Multiplayer Game Arena

The platform features a **3D-styled Circular Multiplayer Table** inspired by physical trivia game wheels:

1. **Circular Gaming Table**:
   - Seated player avatars arranged around a glowing circular/oval table with colorful segment wedges.
   - Active player turn is highlighted with a pulsing neon aura, "TURN" banner, and 25-second countdown timer.
   - Floating Question Card at the table center displaying questions and real-time response announcements ("CORRECT!", "WRONG!").
   - Player Console tablet at the bottom with 4 MCQ options, Submit Answer, and Pass buttons.

2. **Author Role (Game Director)**:
   - The quiz creator is strictly the **game controller & spectator**.
   - The creator **NEVER** participates as a player, receives questions, receives marks, or appears in player rankings.
   - Author controls: Start Game, Pause Match, Resume Match, End Match (with confirmation modal).

3. **Exact Turn-Based Game Rules**:
   - **Rule A (Correct Answer)**: Awards **+2 marks**, ends question immediately, and moves to next question starting with next player in circular order.
   - **Rule B (Wrong Answer)**: Deducts **-1 mark**, ends question immediately, and moves to next question starting with next player in circular order.
   - **Rule C (Pass)**: Awards **0 marks**, keeps the **SAME question**, and moves turn to next player in circular order.
   - **Rule D (Everyone Passes)**: If all active participants pass the same question, the question ends and the next question starts with the player immediately after the original starter.
   - **Rule E (Timer Expires)**: Answering timer (default 25s) expiring automatically triggers a Pass.
   - **Rule F (Completion)**: Once all questions are answered, final rankings are computed (ties handled cleanly) and saved to MongoDB.

4. **Enhanced Waiting Lobby**:
   - Select starting countdown duration: **5 min (default)**, **10 min**, **15 min**.
   - Select answering turn timer: **15s**, **20s**, **25s**, **30s**.
   - Max player capacity: **4**, **6**, **8**, **12** players.
   - Scrollable joined players list with the Author fixed at top with an **Author** badge.
   - Real-time updates via Socket.IO whenever new players join via room code.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Socket.IO Client, Lucide React icons, Canvas Confetti, Web Audio API sound synthesis.
- **Backend**: Node.js & Express REST API + Socket.IO Server running on port 3000.
- **Database**:
  - **MongoDB Atlas**: Real-time cloud database via Mongoose with full CRUD operations.
  - **Models**: `User`, `Quiz`, `Question`, `Attempt`, `Leaderboard`, `Session`, `RoomGame`.
  - **Deduplication Engine**: Automatic duplicate detection and removal for users, quizzes, questions, and leaderboard scores.
  - **Unique Indexes**: Database-enforced uniqueness on usernames, emails, room codes, and leaderboard user IDs.

1. **Page 1: Login / Sign Up Page**
   - Brand trophy logo with glowing aura & tagline: *"Play • Compete • Win"*.
   - Responsive tabbed card: **Login** & **Sign Up**.
   - One-Click Demo button for instant evaluator login as **Karthik**.
   - Input validation, remember me, forgot password helper, and password hashing.

2. **Page 2: Home Dashboard**
   - Professional sidebar with active gradient state and trophy branding.
   - Welcome banner: *"Welcome Back, Karthik! 👋 Ready to test your knowledge?"* with glowing brain graphic.
   - Quick **Play Now** and **Create Quiz** launch buttons.
   - **Available Quizzes** grid with live database quizzes:
     - 🌍 *General Knowledge* (10 Questions • 5 min)
     - 💻 *Tech Quiz* (10 Questions • 5 min)
     - 🏆 *Sports Quiz* (10 Questions • 5 min)
   - Real-time room codes displayed on cards (`QZ101`, `QZ102`, `QZ103`).

3. **Page 3: Create Quiz Page**
   - Full quiz builder with custom Title, Description, and Time Limit.
   - Dynamic multiple-choice question editor (add/remove questions).
   - 4 MCQ options per question with radio-button correct answer selection.
   - Unique **Room Code generator** (e.g. `QZ...`) upon creation with one-click copy.

4. **Page 4: Join Quiz Page**
   - Header with friendly gaming illustration: *"Let's Play Together!"*.
   - Room Code input with auto-capitalization and quick join chips.
   - Instant validation: routes to quiz arena or displays helpful error.

5. **Page 5: Quiz Play Page (Arena)**
   - Top status bar: Quiz Battle logo, Question counter pill (`Q1 / 10`), and real-time countdown timer (`Time Left: 00:45`).
   - Clean white question card with smooth selection states and purple checkmark.
   - Sound effects via Web Audio API (subtle clicks, urgency ticks, correct chimes).
   - Anti-cheat backend score evaluation (correct answers never exposed in client payload).

6. **Page 6: Result Page**
   - Celebratory golden trophy with confetti particle explosion (`canvas-confetti`).
   - Final score display (e.g., `8 / 10`), accuracy percentage, correct/wrong stats.
   - Question review accordion showing user choice vs. correct answer.
   - Action buttons: *"🏆 View Leaderboard"*, *"🔄 Play Again"*, and *"Return to Dashboard"*.

7. **Page 7: Leaderboard Page**
   - Elevated top-3 podium: **Gold 🥇 (Rank 1)**, **Silver 🥈 (Rank 2)**, **Bronze 🥉 (Rank 3)**.
   - Ranked player list matching reference design: Karthik, Sai Teja, Nani, Charan, Roja.
   - Highlights the active user's standing with live score recalculation.

8. **Page 8: Profile Page**
   - User profile card with avatar, username, and badge: *"Quiz Enthusiast"*.
   - Key stats: **12 Quizzes**, **8 Wins**, **85% Accuracy**.
   - Tab 1: **My Quizzes** (list of quizzes created by current user with direct launch and delete).
   - Tab 2: **Quiz History** (chronological list of attempts with dates, scores, and retake actions).
   - In-app profile modal to update username, player title, and avatar.

9. **Page 9: Responsive Mobile View**
   - Dedicated mobile drawer navigation, hamburger menu, and sticky mobile bottom tabs.
   - Built-in **Simulate Page 9 Mobile View** toggle button in the top bar to preview mobile viewport directly on any screen.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Canvas Confetti, Web Audio API synthesis.
- **Backend**: Pure JavaScript & TypeScript with Node.js & Express REST API (Django removed as requested).
- **Database**:
  - **MongoDB Atlas**: Real-time cloud database via Mongoose with full CRUD operations.
  - **Deduplication Engine**: Automatic duplicate detection and removal for users, quizzes, questions, and leaderboard scores.
  - **Unique Indexes**: Database-enforced uniqueness on usernames, emails, room codes, and leaderboard user IDs.

---

## 🍃 MongoDB Atlas Setup

1. Open `.env` in the project root.
2. Paste your MongoDB Atlas connection string into `MONGODB_URI`:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/quiz_battle?retryWrites=true&w=majority"
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. (Optional) Run the duplicate cleanup script at any time:
   ```bash
   npm run db:clean
   ```

---

## 🔑 Demo Account Credentials

- **Username / Email**: `Karthik` or `karthik@quizbattle.com`
- **Password**: `karthik123`
- *Or click the "One-Click Demo as Karthik" button on the Login page.*

---

## 📋 Available Demo Room Codes

- `QZ101` – General Knowledge Quiz
- `QZ102` – Tech Quiz
- `QZ103` – Sports Quiz
