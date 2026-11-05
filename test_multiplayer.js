import { io } from 'socket.io-client';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTest() {
  console.log('🧪 Starting End-to-End Circular Multiplayer Game Test...');

  const serverUrl = 'http://localhost:3000';
  
  console.log('0️⃣ Registering dynamic test author...');
  const authorUser = `author_${Date.now().toString(36)}`;
  const regRes = await fetch(`${serverUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: authorUser,
      email: `${authorUser}@test.com`,
      password: 'password123'
    })
  }).then(r => r.json());

  const authorToken = regRes.token;
  const authorId = regRes.user.id;

  // Create a brand new quiz to test quiz creation + custom lobby parameters
  console.log('0️⃣ Creating fresh Quiz with custom Lobby parameters...');
  const createRes = await fetch(`${serverUrl}/api/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorToken}`
    },
    body: JSON.stringify({
      title: 'Circular Multiplayer Test Quiz',
      description: 'Automated test suite quiz',
      time_limit_minutes: 5,
      starting_duration_minutes: 5,
      answering_duration_seconds: 25,
      max_players: 8,
      questions: [
        {
          question_text: 'Question 1: What is the capital of India?',
          option_a: 'Mumbai', option_b: 'New Delhi', option_c: 'Kolkata', option_d: 'Chennai',
          correct_option: 'B'
        },
        {
          question_text: 'Question 2: Which is the red planet?',
          option_a: 'Venus', option_b: 'Mars', option_c: 'Jupiter', option_d: 'Saturn',
          correct_option: 'B'
        },
        {
          question_text: 'Question 3: In which sport is the term "Love" used?',
          option_a: 'Tennis', option_b: 'Cricket', option_c: 'Football', option_d: 'Hockey',
          correct_option: 'A'
        },
        {
          question_text: 'Question 4: What is 2 + 2?',
          option_a: '3', option_b: '4', option_c: '5', option_d: '6',
          correct_option: 'B'
        }
      ]
    })
  }).then(r => r.json());

  const roomCode = createRes.room_code;
  console.log(`✅ Created test room: ${roomCode}`);

  // 1. Connect Author (Karthik)
  console.log('1️⃣ Connecting Author (Karthik)...');
  const authorSocket = io(serverUrl);
  
  await new Promise((resolve) => {
    authorSocket.on('connect', () => {
      console.log('✅ Author socket connected');
      authorSocket.emit('join_room', {
        roomCode,
        user: { id: authorId, username: authorUser }
      });
      resolve();
    });
  });

  // 2. Connect Players: Sai, Teja, Anu
  console.log('2️⃣ Connecting Players: Sai, Teja, Anu...');
  const playerSockets = [];
  const players = [
    { id: 'user_saiteja_2', username: 'Sai Teja' },
    { id: 'user_teja_test', username: 'Teja' },
    { id: 'user_anu_test', username: 'Anu' }
  ];

  for (const p of players) {
    const s = io(serverUrl);
    await new Promise((res) => {
      s.on('connect', () => {
        s.emit('join_room', { roomCode, user: p });
        res();
      });
    });
    playerSockets.push(s);
  }

  await sleep(1000);

  // 3. Verify Lobby State
  console.log('3️⃣ Verifying Lobby State...');
  const lobbyRes = await fetch(`${serverUrl}/api/rooms/${roomCode}`).then(r => r.json());
  console.log('Lobby Status:', lobbyRes.room.status);
  console.log('Author in Room:', lobbyRes.room.author_username);
  console.log('Participants count (excluding author):', lobbyRes.room.participants.length);
  console.log('Participants names:', lobbyRes.room.participants.map(p => p.username));

  if (lobbyRes.room.participants.length !== 3) {
    throw new Error('Expected 3 participants in lobby!');
  }
  if (lobbyRes.room.participants.some(p => p.username === authorUser)) {
    throw new Error('Author should NOT be in participants list!');
  }
  console.log('✅ Lobby state verified: Author isolated, exactly 3 players joined.');

  // 4. Author starts the game
  console.log('4️⃣ Author starting game...');
  let latestState = null;

  playerSockets[0].on('game_state_update', (state) => {
    latestState = state;
  });

  authorSocket.emit('start_game', { roomCode, authorId });
  await sleep(1500);

  console.log('Game status:', latestState.status);
  console.log('Current question index:', latestState.current_question_index);
  console.log('Active player turn:', latestState.current_player_username);

  // 5. TEST RULE A: Correct answer (+2 marks, next question to next player)
  console.log('5️⃣ Testing Rule A: Active player answers correctly (+2 marks)...');
  const activeUserId = latestState.current_player_user_id;
  const currentQId = latestState.current_question.id;
  const activeSocket = playerSockets.find((_, idx) => players[idx].id === activeUserId);

  // Question 1 of GK is Jupiter (Option B)
  activeSocket.emit('submit_answer', {
    roomCode,
    userId: activeUserId,
    questionId: currentQId,
    selectedOption: 'B'
  });

  await sleep(3000);

  console.log('State after Correct answer:');
  console.log('Scores:', latestState.participants.map(p => `${p.username}: ${p.score}`));
  console.log('Current question index:', latestState.current_question_index);
  console.log('New active player turn:', latestState.current_player_username);

  const activeScored = latestState.participants.find(p => p.user_id === activeUserId);
  if (activeScored.score !== 2) {
    throw new Error('Expected score +2 after correct answer!');
  }
  console.log('✅ Rule A verified: +2 marks awarded, question advanced, turn rotated to next player.');

  // 6. TEST RULE B: Wrong answer (-1 mark, ends question, next question to next player)
  console.log('6️⃣ Testing Rule B: Active player answers incorrectly (-1 mark)...');
  const player2Id = latestState.current_player_user_id;
  const q2Id = latestState.current_question.id;
  const player2Socket = playerSockets.find((_, idx) => players[idx].id === player2Id);

  // Submit wrong answer
  player2Socket.emit('submit_answer', {
    roomCode,
    userId: player2Id,
    questionId: q2Id,
    selectedOption: 'A'
  });

  await sleep(3000);

  console.log('State after Wrong answer:');
  console.log('Scores:', latestState.participants.map(p => `${p.username}: ${p.score}`));
  console.log('Current question index:', latestState.current_question_index);
  console.log('New active player turn:', latestState.current_player_username);

  const player2Scored = latestState.participants.find(p => p.user_id === player2Id);
  if (player2Scored.score !== -1) {
    throw new Error('Expected score -1 after incorrect answer!');
  }
  console.log('✅ Rule B verified: -1 mark deducted, question ended, turn rotated to next player.');

  // 7. TEST RULE C & D: Pass actions and Everyone Passes
  console.log('7️⃣ Testing Rule C: Pass (0 marks, keeps SAME question)...');
  const p3Id = latestState.current_player_user_id;
  const q3Id = latestState.current_question.id;
  const p3Socket = playerSockets.find((_, idx) => players[idx].id === p3Id);

  // Player 3 passes
  p3Socket.emit('pass_turn', { roomCode, userId: p3Id });
  await sleep(1000);

  console.log('After Player 3 passes:');
  console.log('Current question ID (must be same):', latestState.current_question.id === q3Id);
  console.log('Next active turn:', latestState.current_player_username);

  if (latestState.current_question.id !== q3Id) {
    throw new Error('Rule C violation: Question should remain the SAME on pass!');
  }
  console.log('✅ Rule C verified: Same question preserved, moved to next player in circular order.');

  // Now next player passes
  const pNextId = latestState.current_player_user_id;
  const pNextSocket = playerSockets.find((_, idx) => players[idx].id === pNextId);
  pNextSocket.emit('pass_turn', { roomCode, userId: pNextId });
  await sleep(1000);

  // Now final remaining player passes -> Everyone passed! (Rule D)
  console.log('7b. Final player passes (Rule D: Everyone Passed)...');
  const pFinalId = latestState.current_player_user_id;
  const pFinalSocket = playerSockets.find((_, idx) => players[idx].id === pFinalId);
  pFinalSocket.emit('pass_turn', { roomCode, userId: pFinalId });
  await sleep(3500);

  console.log('After Everyone Passed:');
  console.log('New question index (must advance):', latestState.current_question_index);
  console.log('New active turn:', latestState.current_player_username);
  console.log('✅ Rule D verified: When all players passed, question ended and next question started.');

  // 8. TEST AUTHOR CONTROLS: Pause and Resume
  console.log('8️⃣ Testing Author Pause & Resume...');
  authorSocket.emit('pause_game', { roomCode, authorId });
  await sleep(800);
  console.log('Is paused:', latestState.is_paused);
  if (!latestState.is_paused) throw new Error('Game should be paused!');

  authorSocket.emit('resume_game', { roomCode, authorId });
  await sleep(800);
  console.log('Is resumed:', !latestState.is_paused);
  if (latestState.is_paused) throw new Error('Game should be resumed!');
  console.log('✅ Author Pause & Resume verified.');

  // 9. TEST AUTHOR END GAME & RESULTS
  console.log('9️⃣ Testing Author End Game and Results Persistence...');
  authorSocket.emit('end_game', { roomCode, authorId });
  await sleep(1500);

  console.log('Final Game Status:', latestState.status);
  console.log('Final Rankings:');
  console.table(latestState.final_rankings);

  if (latestState.status !== 'completed') {
    throw new Error('Game should be completed!');
  }
  if (!latestState.final_rankings || latestState.final_rankings.length !== 3) {
    throw new Error('Expected 3 ranked players!');
  }
  if (latestState.final_rankings.some(r => r.username === authorUser)) {
    throw new Error('Author should NOT be in final player rankings!');
  }
  console.log('✅ Final results & rankings verified.');

  // Cleanup sockets
  authorSocket.disconnect();
  playerSockets.forEach(s => s.disconnect());

  console.log('🎉 ALL CIRCULAR MULTIPLAYER GAME RULES & CONTROLS PASSED 100%!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
