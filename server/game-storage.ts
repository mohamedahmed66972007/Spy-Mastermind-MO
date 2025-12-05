import type { Room, Player, GameMode, GamePhase, Message, Question, CategoryVote, SpyVote } from "@shared/schema";
import { getSpyCountForPlayers, categories } from "@shared/schema";
import { getRandomWord, getDifferentWord } from "./words";
import { randomUUID } from "crypto";

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();
const sessionTokenToPlayer = new Map<string, { playerId: string; roomId: string }>();

const QUESTIONS_PER_PLAYER = 3;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

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

export function startGame(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return undefined;
  if (room.players.length < 4) return undefined;

  const allReady = room.players.every((p) => p.isReady || p.isHost);
  if (!allReady) return undefined;

  room.phase = "category_voting";
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
  const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
  const spyIds = shuffledPlayers.slice(0, spyCount).map((p) => p.id);

  if (room.gameMode === "blind") {
    room.spyWord = getDifferentWord(room.selectedCategory, room.currentWord);
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
  room.revealedSpyIds = [];
  room.spyVotes = [];
  room.questions = [];
  room.questionsAsked = 0;
  room.currentPlayerIndex = 0;
  room.spyGuess = undefined;
  room.guessValidationVotes = [];
  // Initialize turn queue with all players in random order
  room.turnQueue = [...room.players].sort(() => Math.random() - 0.5).map(p => p.id);
  room.currentTurnPlayerId = room.turnQueue[0];
  room.turnTimerEnd = undefined;
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
  // Check if turn changed or phase changed to spy_voting
  const turnAdvanced = room.currentTurnPlayerId !== previousTurnPlayerId || room.phase !== previousPhase;
  
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
      room.turnTimerEnd = Date.now() + 60000; // 1 minute timer
      return;
    }
    
    nextIndex = (nextIndex + 1) % room.turnQueue.length;
    attempts++;
  }
  
  // No more eligible players, move to spy voting
  room.phase = "spy_voting";
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

export function voteSpy(playerId: string, suspectId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "spy_voting") return undefined;

  const existingVote = room.spyVotes.find((v) => v.voterId === playerId);
  if (existingVote) return undefined;

  room.spyVotes.push({ voterId: playerId, suspectId });

  if (room.spyVotes.length === room.players.length) {
    processSpyVotes(room);
  }

  return room;
}

function processSpyVotes(room: Room): void {
  const voteCounts = room.players.reduce((acc, player) => {
    acc[player.id] = room.spyVotes.filter((v) => v.suspectId === player.id).length;
    return acc;
  }, {} as Record<string, number>);

  const maxVotes = Math.max(...Object.values(voteCounts));
  const topSuspects = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([id]) => id);

  const revealedId = topSuspects[Math.floor(Math.random() * topSuspects.length)];
  
  // Add to revealed spies list instead of replacing
  if (!room.revealedSpyIds.includes(revealedId)) {
    room.revealedSpyIds.push(revealedId);
  }

  const revealedPlayer = room.players.find((p) => p.id === revealedId);
  const isSpy = revealedPlayer?.role === "spy";

  if (isSpy) {
    // Award points to players who voted for the spy
    room.players.forEach((p) => {
      if (p.role !== "spy" && room.spyVotes.some((v) => v.voterId === p.id && v.suspectId === revealedId)) {
        p.score += 1;
      }
    });
    // Move to spy guess phase
    room.phase = "spy_guess";
  } else {
    // If wrong person was voted, move to results
    room.phase = "results";
  }
}

export function submitGuess(playerId: string, guess: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "spy_guess") return undefined;
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) return undefined;
  
  // Check if player is a revealed spy
  if (!room.revealedSpyIds.includes(playerId) || player.role !== "spy") return undefined;

  room.spyGuess = guess;
  room.phase = "guess_validation";
  room.guessValidationVotes = [];

  return room;
}rn room;
}

export function validateGuess(playerId: string, isCorrect: boolean): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "guess_validation") return undefined;
  if (room.revealedSpyIds.includes(playerId)) return undefined;

  const existingVote = room.guessValidationVotes.find((v) => v.playerId === playerId);
  if (existingVote) return undefined;

  room.guessValidationVotes.push({ playerId, isCorrect });

  const nonSpyPlayers = room.players.filter((p) => !room.revealedSpyIds.includes(p.id));
  if (room.guessValidationVotes.length === nonSpyPlayers.length) {
    processGuessValidation(room);
  }

  return room;
}

function processGuessValidation(room: Room): void {
  const correctVotes = room.guessValidationVotes.filter((v) => v.isCorrect).length;
  const totalVotes = room.guessValidationVotes.length;

  if (correctVotes > totalVotes / 2) {
    room.revealedSpyIds.forEach((spyId) => {
      const spy = room.players.find((p) => p.id === spyId);
      if (spy) {
        spy.score += 1;
      }
    });
  }

  room.phase = "results";
}

export function nextRound(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "results") return undefined;

  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return undefined;

  room.roundNumber++;
  room.phase = "category_voting";
  room.categoryVotes = [];
  room.spyVotes = [];
  room.questions = [];
  room.currentPlayerIndex = 0;
  room.questionsAsked = 0;
  room.currentWord = undefined;
  room.spyWord = undefined;
  room.selectedCategory = undefined;
  room.spyGuess = undefined;
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
