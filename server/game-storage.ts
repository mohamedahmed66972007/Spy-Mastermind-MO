import type { Room, Player, GameMode, GamePhase, Message, Question, CategoryVote, SpyVote, GuessValidationMode } from "@shared/schema";
import { getSpyCountForPlayers, categories } from "@shared/schema";
import { getRandomWord, getSimilarWord } from "./words";
import { randomUUID } from "crypto";

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();
const sessionTokenToPlayer = new Map<string, { playerId: string; roomId: string }>();

const QUESTIONS_PER_PLAYER = 3;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function normalizeArabicWord(word: string): string {
  let normalized = word.trim();
  // Apply Unicode NFC normalization first
  normalized = normalized.normalize('NFC');
  // Remove zero-width characters
  normalized = normalized.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');
  // Remove tashkeel (diacritical marks)
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
  // Remove tatweel
  normalized = normalized.replace(/\u0640/g, '');
  // Normalize spaces
  normalized = normalized.replace(/\s+/g, ' ');
  // Remove common punctuation (including Arabic and various quote styles)
  normalized = normalized.replace(/[.,،؛:!?؟\-_'"«»()[\]{}""'']/g, '');
  // Remove ال prefix
  normalized = normalized.replace(/^ال/, '');
  // Normalize alef maksura to ya
  normalized = normalized.replace(/ى/g, 'ي');
  // Normalize hamza variations
  normalized = normalized.replace(/[أإآ]/g, 'ا');
  normalized = normalized.replace(/ؤ/g, 'و');
  normalized = normalized.replace(/ئ/g, 'ي');
  // Normalize teh marbuta to heh
  normalized = normalized.replace(/ة/g, 'ه');
  return normalized.trim().toLowerCase();
}

function isGuessCorrect(guess: string, actualWord: string): boolean {
  const normalizedGuess = normalizeArabicWord(guess);
  const normalizedActual = normalizeArabicWord(actualWord);
  console.log(`[Guess Validation] Guess: "${guess}" -> "${normalizedGuess}", Actual: "${actualWord}" -> "${normalizedActual}", Match: ${normalizedGuess === normalizedActual}`);
  return normalizedGuess === normalizedActual;
}

function processSystemGuessValidation(room: Room, guessIsCorrect: boolean): void {
  room.spyGuessCorrect = guessIsCorrect;

  // Points for voting correctly on the spy were already awarded in processSpyVotes
  // Here we only handle the spy's guess result

  // If spy guessed correctly, spy gets a point
  if (guessIsCorrect) {
    room.revealedSpyIds.forEach((spyId) => {
      const spy = room.players.find((p) => p.id === spyId);
      if (spy) {
        spy.score = (spy.score || 0) + 1;
      }
    });
  }

  room.phase = "results";
  room.phaseStartTime = Date.now(); // Start timer for results phase
}

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSessionToken(): string {
  return randomUUID();
}

export function createRoom(playerName: string, gameMode: GameMode): { room: Room; playerId: string; sessionToken: string } {
  const roomId = generateRoomId();
  const playerId = randomUUID();
  const sessionToken = generateSessionToken();

  const player: Player = {
    id: playerId,
    name: playerName,
    isHost: true,
    isReady: true,
    score: 0,
    sessionToken,
    questionsRemaining: QUESTIONS_PER_PLAYER,
    doneWithQuestions: false,
  };

  const room: Room = {
    id: roomId,
    hostId: playerId,
    players: [player],
    gameMode,
    phase: "lobby",
    categoryVotes: [],
    spyVotes: [],
    currentPlayerIndex: 0,
    questionsAsked: 0,
    messages: [],
    questions: [],
    roundNumber: 1,
    guessValidationVotes: [],
    revealedSpyIds: [],
    spyCount: 1,
    questionsPerPlayer: QUESTIONS_PER_PLAYER,
    turnQueue: [],
    guessValidationMode: "system",
  };

  rooms.set(roomId, room);
  playerToRoom.set(playerId, roomId);
  sessionTokenToPlayer.set(sessionToken, { playerId, roomId });

  return { room, playerId, sessionToken };
}

export function joinRoom(playerName: string, roomCode: string): { room: Room; playerId: string; sessionToken: string } | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.phase !== "lobby") return null;
  if (room.players.length >= 10) return null;

  const playerId = randomUUID();
  const sessionToken = generateSessionToken();
  const player: Player = {
    id: playerId,
    name: playerName,
    isHost: false,
    isReady: false,
    score: 0,
    sessionToken,
    questionsRemaining: QUESTIONS_PER_PLAYER,
    doneWithQuestions: false,
  };

  room.players.push(player);
  playerToRoom.set(playerId, roomCode);
  sessionTokenToPlayer.set(sessionToken, { playerId, roomId: roomCode });

  return { room, playerId, sessionToken };
}

export function reconnectPlayer(sessionToken: string, roomCode: string): { room: Room; playerId: string } | null {
  const sessionData = sessionTokenToPlayer.get(sessionToken);
  if (!sessionData) return null;
  if (sessionData.roomId !== roomCode) return null;

  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === sessionData.playerId);
  if (!player) return null;

  // Check if session has expired (30 minutes)
  if (player.disconnectedAt && Date.now() - player.disconnectedAt > SESSION_TIMEOUT_MS) {
    // Session expired, remove player
    room.players = room.players.filter(p => p.id !== player.id);
    playerToRoom.delete(player.id);
    sessionTokenToPlayer.delete(sessionToken);
    return null;
  }

  // Reconnect player
  player.disconnectedAt = undefined;
  playerToRoom.set(sessionData.playerId, roomCode);

  return { room, playerId: sessionData.playerId };
}

export function markPlayerDisconnected(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.disconnectedAt = Date.now();
  }

  return room;
}

export function isPlayerDisconnected(playerId: string): boolean {
  const room = getRoomByPlayerId(playerId);
  if (!room) return true;

  const player = room.players.find(p => p.id === playerId);
  return player?.disconnectedAt !== undefined;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByPlayerId(playerId: string): Room | undefined {
  const roomId = playerToRoom.get(playerId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function togglePlayerReady(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (player && !player.isHost) {
    player.isReady = !player.isReady;
  }

  return room;
}

export function updateSpyCount(playerId: string, count: number): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return undefined;

  room.spyCount = Math.max(1, Math.min(count, Math.floor(room.players.length / 2)));
  return room;
}

export function updateGuessValidationMode(playerId: string, mode: GuessValidationMode): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return undefined;
  if (room.phase !== "lobby") return undefined;

  room.guessValidationMode = mode;
  return room;
}

export function startGame(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return undefined;
  if (room.players.length < 4) return undefined;

  const allReady = room.players.every((p) => p.isReady || p.isHost);
  if (!allReady) return undefined;

  room.phase = "category_voting";
  room.phaseStartTime = Date.now(); // Start timer for category voting phase
  room.categoryVotes = [];

  return room;
}

export function voteCategory(playerId: string, category: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "category_voting") return undefined;

  const existingVote = room.categoryVotes.find((v) => v.playerId === playerId);
  if (existingVote) return undefined;

  room.categoryVotes.push({ playerId, category });

  if (room.categoryVotes.length === room.players.length) {
    selectCategoryAndStartWordReveal(room);
  }

  return room;
}

export function forceSelectCategoryAndStartWordReveal(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  if (room.phase !== "category_voting") return undefined;

  selectCategoryAndStartWordReveal(room);
  return room;
}

function selectCategoryAndStartWordReveal(room: Room): void {
  const voteCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = room.categoryVotes.filter((v) => v.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  const maxVotes = Math.max(...Object.values(voteCounts));
  const topCategories = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([cat]) => cat);

  room.selectedCategory = topCategories[Math.floor(Math.random() * topCategories.length)];
  room.currentWord = getRandomWord(room.selectedCategory);

  const spyCount = room.spyCount || getSpyCountForPlayers(room.players.length);
  // Fisher-Yates shuffle for better randomization
  const shuffledPlayers = [...room.players];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
  }
  const spyIds = shuffledPlayers.slice(0, spyCount).map((p) => p.id);

  if (room.gameMode === "blind") {
    room.spyWord = getSimilarWord(room.selectedCategory, room.currentWord);
  }

  room.players.forEach((player) => {
    if (spyIds.includes(player.id)) {
      player.role = "spy";
      if (room.gameMode === "classic") {
        player.word = "أنت الجاسوس";
      } else {
        player.word = room.spyWord;
      }
    } else {
      player.role = "player";
      player.word = room.currentWord;
    }
    // Reset question state for new round
    player.questionsRemaining = QUESTIONS_PER_PLAYER;
    player.doneWithQuestions = false;
  });

  room.phase = "word_reveal";
  room.phaseStartTime = Date.now(); // Start timer for word reveal phase
  room.revealedSpyIds = [];
  room.spyVotes = [];
  room.questions = [];
  room.questionsAsked = 0;
  room.currentPlayerIndex = 0;
  room.spyGuess = undefined;
  room.spyGuessCorrect = undefined;
  room.guessValidationVotes = [];
  // Initialize turn queue with all players in random order
  room.turnQueue = [...room.players].sort(() => Math.random() - 0.5).map(p => p.id);
  room.currentTurnPlayerId = room.turnQueue[0];
  room.turnTimerEnd = undefined; // Timer will be set when questioning starts
}

export function askQuestion(playerId: string, targetId: string, question: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  // Check if it's this player's turn
  if (room.currentTurnPlayerId !== playerId) return undefined;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return undefined;
  if (player.questionsRemaining === undefined || player.questionsRemaining <= 0) return undefined;
  if (player.doneWithQuestions) return undefined;

  room.questions.push({
    askerId: playerId,
    targetId,
    question,
  });

  // Decrease player's remaining questions
  player.questionsRemaining = (player.questionsRemaining || QUESTIONS_PER_PLAYER) - 1;
  room.questionsAsked++;

  // Ensure the timer is set for the current turn
  if (room.turnTimerEnd === undefined) {
    room.turnTimerEnd = Date.now() + 60000; // 1 minute timer
  }

  return room;
}

export function answerQuestion(playerId: string, answer: string): { room: Room; turnAdvanced: boolean } | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  const lastQuestion = room.questions[room.questions.length - 1];
  if (!lastQuestion || lastQuestion.targetId !== playerId || lastQuestion.answer) return undefined;

  lastQuestion.answer = answer;

  // After answering, automatically advance to next player's turn
  const previousTurnPlayerId = room.currentTurnPlayerId;
  const previousPhase = room.phase;
  advanceToNextTurn(room);
  const turnAdvanced = room.currentTurnPlayerId !== previousTurnPlayerId || room.phase !== previousPhase;

  // If the phase has changed to spy_voting, reset the timer
  if ((room.phase as string) === "spy_voting") {
    room.turnTimerEnd = undefined; // Reset timer for spy voting
    room.phaseStartTime = Date.now(); // Start timer for spy voting phase
  }

  return { room, turnAdvanced };
}

export function endTurn(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  // Check if it's this player's turn
  if (room.currentTurnPlayerId !== playerId) return undefined;

  // Move to next player in turn queue
  advanceToNextTurn(room);

  return room;
}

// Called when the 60-second asking timer expires without a question being asked
export function forceEndAskingPhase(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;
  if (!room.currentTurnPlayerId) return undefined;

  // Deduct a question from the current player since they didn't ask
  const currentPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
  if (currentPlayer && currentPlayer.questionsRemaining !== undefined && currentPlayer.questionsRemaining > 0) {
    currentPlayer.questionsRemaining--;
  }

  // Mark the last question as unanswered if it exists and wasn't answered
  const lastQuestion = room.questions[room.questions.length - 1];
  if (lastQuestion && !lastQuestion.answer) {
    lastQuestion.answer = "(لم يتم الإجابة)";
  }

  // Move to next player in turn queue
  advanceToNextTurn(room);

  // If the phase has changed to spy_voting, reset the timer
  if ((room.phase as string) === "spy_voting") {
    room.turnTimerEnd = undefined; // Reset timer for spy voting
    room.phaseStartTime = Date.now(); // Start timer for spy voting phase
  }

  return room;
}

// Called when the 30-second answering timer expires without an answer
export function forceEndAnsweringPhase(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  // Mark the last question as unanswered
  const lastQuestion = room.questions[room.questions.length - 1];
  if (lastQuestion && !lastQuestion.answer) {
    lastQuestion.answer = "(لم يتم الإجابة)";
  }

  // Move to next player in turn queue
  advanceToNextTurn(room);

  // If the phase has changed to spy_voting, reset the timer
  if ((room.phase as string) === "spy_voting") {
    room.turnTimerEnd = undefined; // Reset timer for spy voting
    room.phaseStartTime = Date.now(); // Start timer for spy voting phase
  }

  return room;
}

export function markDoneWithQuestions(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return undefined;

  player.doneWithQuestions = true;

  // If it's this player's turn, advance to next
  if (room.currentTurnPlayerId === playerId) {
    advanceToNextTurn(room);
  }

  // If all players are done, transition to spy voting
  if (checkAllPlayersDoneWithQuestions(room) && room.phase === "questioning") {
    room.phase = "spy_voting";
    room.phaseStartTime = Date.now(); // Start timer for spy voting phase
    room.currentTurnPlayerId = undefined;
    room.turnTimerEnd = undefined;
  }

  return room;
}

function advanceToNextTurn(room: Room): void {
  // Find the current player's position in the queue
  const currentIndex = room.turnQueue.indexOf(room.currentTurnPlayerId || "");

  // Look for next eligible player (starting from next position)
  let attempts = 0;
  let nextIndex = (currentIndex + 1) % room.turnQueue.length;

  while (attempts < room.turnQueue.length) {
    const nextPlayerId = room.turnQueue[nextIndex];
    const nextPlayer = room.players.find(p => p.id === nextPlayerId);

    // Check if player is eligible (has questions and not done)
    if (nextPlayer &&
        !nextPlayer.doneWithQuestions &&
        (nextPlayer.questionsRemaining === undefined || nextPlayer.questionsRemaining > 0)) {
      room.currentTurnPlayerId = nextPlayerId;
      room.currentPlayerIndex = room.players.findIndex(p => p.id === nextPlayerId);
      room.turnTimerEnd = Date.now() + 60000; // 1 minute timer for next turn
      return;
    }

    nextIndex = (nextIndex + 1) % room.turnQueue.length;
    attempts++;
  }

  // No more eligible players, move to spy voting
  room.phase = "spy_voting";
  room.phaseStartTime = Date.now(); // Start timer for spy voting phase
  room.spyVotes = [];
  room.currentTurnPlayerId = undefined;
  room.turnTimerEnd = undefined;
}

export function checkAllPlayersDoneWithQuestions(room: Room): boolean {
  return room.players.every(p =>
    p.doneWithQuestions ||
    (p.questionsRemaining !== undefined && p.questionsRemaining <= 0)
  );
}

const SPY_VOTING_DURATION_MS = 30000; // 30 seconds

export function voteSpy(playerId: string, suspectId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room || room.phase !== "spy_voting") return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return undefined;

  // Check if voting time has expired
  if (room.phaseStartTime) {
    const elapsed = Date.now() - room.phaseStartTime;
    if (elapsed >= SPY_VOTING_DURATION_MS) {
      console.log(`voteSpy: Voting time expired for player ${player.name}, elapsed=${elapsed}ms`);
      return undefined; // Return undefined to indicate vote rejected - time expired
    }
  }

  // Remove any existing vote from this player
  room.spyVotes = room.spyVotes.filter((v) => v.voterId !== playerId);

  // Add new vote
  room.spyVotes.push({ voterId: playerId, suspectId });

  // Don't auto-process when all voted - let the timer expire naturally
  // This ensures consistent behavior and timer display
  console.log(`voteSpy: Vote recorded. Waiting for timer to expire or all players to vote.`);

  // Check if all active players have voted - only for early completion
  const activePlayers = room.players.filter(p => !p.disconnectedAt);
  const allVoted = activePlayers.length > 0 && activePlayers.every((p) =>
    room.spyVotes.some((v) => v.voterId === p.id)
  );

  console.log(`voteSpy: allVoted=${allVoted}, activePlayers=${activePlayers.length}, votes=${room.spyVotes.length}`);

  if (allVoted) {
    console.log(`voteSpy: All players voted, processing immediately`);
    processSpyVotes(room);
  }

  return room;
}

export function forceProcessSpyVotes(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) {
    console.log(`forceProcessSpyVotes: Room not found - ${roomId}`);
    return undefined;
  }

  if (room.phase !== "spy_voting") {
    console.log(`forceProcessSpyVotes: Invalid phase - ${room.phase}`);
    return undefined;
  }

  console.log(`forceProcessSpyVotes: Processing votes for room ${roomId}, current votes: ${room.spyVotes.length}`);

  // Set phase start time before processing
  room.phaseStartTime = Date.now();

  processSpyVotes(room);
  console.log(`forceProcessSpyVotes: After processing, phase is ${room.phase}`);

  return room;
}

function processSpyVotes(room: Room): void {
  console.log(`processSpyVotes: Starting with ${room.spyVotes.length} votes`);

  // Filter out votes from disconnected players
  const activePlayers = room.players.filter(p => !p.disconnectedAt);
  const activeVotes = room.spyVotes.filter(v => {
    const voter = room.players.find(p => p.id === v.voterId);
    return voter && !voter.disconnectedAt;
  });

  console.log(`processSpyVotes: Active votes: ${activeVotes.length} from ${activePlayers.length} players`);

  // Get all spy IDs for this round
  const allSpyIds = room.players.filter(p => p.role === "spy").map(p => p.id);
  console.log(`processSpyVotes: All spies in room:`, allSpyIds);

  // Count votes for each player
  const voteCounts = activePlayers.reduce((acc, player) => {
    acc[player.id] = activeVotes.filter((v) => v.suspectId === player.id).length;
    return acc;
  }, {} as Record<string, number>);

  console.log(`processSpyVotes: Vote counts:`, voteCounts);

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  console.log(`processSpyVotes: Max votes: ${maxVotes}`);

  const topSuspects = maxVotes > 0 
    ? Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([id]) => id)
    : [];

  console.log(`processSpyVotes: Top suspects:`, topSuspects);

  // Check if any top suspect is actually a spy (spy was caught)
  const spyCaught = topSuspects.some((suspectId) => {
    const suspect = room.players.find((p) => p.id === suspectId);
    return suspect?.role === "spy";
  });

  console.log(`processSpyVotes: Spy caught by voting: ${spyCaught}`);

  // Award points to non-spy players who voted correctly for a spy
  if (spyCaught) {
    const caughtSpyIds = topSuspects.filter((id) => {
      const suspect = room.players.find((p) => p.id === id);
      return suspect?.role === "spy";
    });
    
    room.players.forEach((p) => {
      if (p.role !== "spy") {
        const votedForSpy = activeVotes.some(v => 
          v.voterId === p.id && 
          caughtSpyIds.includes(v.suspectId)
        );
        if (votedForSpy) {
          p.score = (p.score || 0) + 1;
          console.log(`processSpyVotes: Awarded point to ${p.name} (voted correctly for spy)`);
        }
      }
    });
  }

  // ALWAYS move to spy_guess phase - spy gets a chance to guess the word
  // Spy ONLY gets a point if they correctly guess the word
  // Set revealedSpyIds to all spies so they can guess
  room.revealedSpyIds = allSpyIds;
  room.phase = "spy_guess";
  room.phaseStartTime = Date.now();
  
  console.log(`processSpyVotes: Moving to spy_guess phase. Spies can now guess the word.`);
  console.log(`processSpyVotes: Final phase is ${room.phase}`);
}

export function submitGuess(playerId: string, guess: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "spy_guess") return undefined;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return undefined;

  // Only the spy can submit a guess
  if (!room.revealedSpyIds.includes(playerId) || player.role !== "spy") return undefined;

  room.spyGuess = guess;
  room.guessValidationVotes = [];

  if (room.guessValidationMode === "system") {
    const actualWord = room.currentWord;
    const guessIsCorrect = actualWord ? isGuessCorrect(guess, actualWord) : false;
    processSystemGuessValidation(room, guessIsCorrect);
  } else {
    room.phase = "guess_validation";
    room.phaseStartTime = Date.now(); // Start timer for guess validation phase
    // Timer will be managed by the client for validation votes
  }

  return room;
}

export function validateGuess(playerId: string, isCorrect: boolean): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "guess_validation") return undefined;
  // Only non-spy players can validate
  if (room.revealedSpyIds.includes(playerId)) return undefined;

  const existingVote = room.guessValidationVotes.find((v) => v.playerId === playerId);
  if (existingVote) return undefined;

  room.guessValidationVotes.push({ playerId, isCorrect });

  const nonSpyPlayers = room.players.filter((p) => !room.revealedSpyIds.includes(p.id));
  // Check if all non-spy players have voted
  if (room.guessValidationVotes.length === nonSpyPlayers.length) {
    processGuessValidation(room);
  }

  return room;
}

function processGuessValidation(room: Room): void {
  const correctVotes = room.guessValidationVotes.filter((v) => v.isCorrect).length;
  const totalVotes = room.guessValidationVotes.length;

  // Points for voting correctly on the spy were already awarded in processSpyVotes
  // Here we only handle the spy's guess validation

  // If spy guessed correctly (more than half voted correct), spy also gets a point
  if (correctVotes > totalVotes / 2) {
    room.revealedSpyIds.forEach((spyId) => {
      const spy = room.players.find((p) => p.id === spyId);
      if (spy) {
        spy.score = (spy.score || 0) + 1;
      }
    });
  }

  room.phase = "results";
  room.phaseStartTime = Date.now(); // Start timer for results phase
}

export function nextRound(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "results") return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return undefined;

  room.roundNumber++;
  room.phase = "category_voting";
  room.phaseStartTime = Date.now(); // Start timer for category voting phase
  room.categoryVotes = [];
  room.spyVotes = [];
  room.questions = [];
  room.currentPlayerIndex = 0;
  room.questionsAsked = 0;
  room.currentWord = undefined;
  room.spyWord = undefined;
  room.selectedCategory = undefined;
  room.spyGuess = undefined;
  room.spyGuessCorrect = undefined;
  room.guessValidationVotes = [];
  room.revealedSpyIds = [];
  room.turnQueue = [];
  room.currentTurnPlayerId = undefined;
  room.turnTimerEnd = undefined;

  room.players.forEach((p) => {
    p.role = undefined;
    p.word = undefined;
    p.hasVoted = false;
    p.votedFor = undefined;
    p.isEliminated = false;
    p.questionsRemaining = QUESTIONS_PER_PLAYER;
    p.doneWithQuestions = false;
  });

  return room;
}

export function startQuestioningPhase(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  if (room.phase !== "word_reveal") return undefined;

  room.phase = "questioning";
  room.phaseStartTime = Date.now(); // Start timer for questioning phase

  // Use the already randomized turn queue from word reveal phase
  // If turnQueue is empty (shouldn't happen), create a new randomized one
  if (room.turnQueue.length === 0) {
    room.turnQueue = [...room.players].sort(() => Math.random() - 0.5).map(p => p.id);
  }
  room.currentTurnPlayerId = room.turnQueue[0];
  room.currentPlayerIndex = room.players.findIndex(p => p.id === room.turnQueue[0]);
  room.turnTimerEnd = Date.now() + 60000; // 1 minute timer for first turn

  return room;
}

export function sendMessage(playerId: string, text: string): { room: Room; message: Message } | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return undefined;

  const message: Message = {
    id: randomUUID(),
    playerId,
    playerName: player.name,
    text,
    timestamp: Date.now(),
  };

  room.messages.push(message);
  return { room, message };
}

export function leaveRoom(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  room.players = room.players.filter((p) => p.id !== playerId);
  playerToRoom.delete(playerId);

  if (room.players.length === 0) {
    rooms.delete(room.id);
    return undefined;
  }

  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
    room.players[0].isReady = true;
  }

  return room;
}