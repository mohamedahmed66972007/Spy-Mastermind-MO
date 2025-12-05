import type { Room, Player, GameMode, GamePhase, Message, Question, CategoryVote, SpyVote } from "@shared/schema";
import { getSpyCountForPlayers, categories } from "@shared/schema";
import { getRandomWord, getDifferentWord } from "./words";
import { randomUUID } from "crypto";

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createRoom(playerName: string, gameMode: GameMode): { room: Room; playerId: string } {
  const roomId = generateRoomId();
  const playerId = randomUUID();
  
  const player: Player = {
    id: playerId,
    name: playerName,
    isHost: true,
    isReady: true,
    score: 0,
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
  };

  rooms.set(roomId, room);
  playerToRoom.set(playerId, roomId);

  return { room, playerId };
}

export function joinRoom(playerName: string, roomCode: string): { room: Room; playerId: string } | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.phase !== "lobby") return null;
  if (room.players.length >= 10) return null;

  const playerId = randomUUID();
  const player: Player = {
    id: playerId,
    name: playerName,
    isHost: false,
    isReady: false,
    score: 0,
  };

  room.players.push(player);
  playerToRoom.set(playerId, roomCode);

  return { room, playerId };
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
  });

  room.phase = "word_reveal";
  room.revealedSpyIds = [];
  room.spyVotes = [];
  room.questions = [];
  room.questionsAsked = 0;
  room.currentPlayerIndex = 0;
  room.spyGuess = undefined;
  room.guessValidationVotes = [];
}

export function askQuestion(playerId: string, targetId: string, question: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return undefined;

  room.questions.push({
    askerId: playerId,
    targetId,
    question,
  });

  room.questionsAsked++;

  return room;
}

export function answerQuestion(playerId: string, answer: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  const lastQuestion = room.questions[room.questions.length - 1];
  if (!lastQuestion || lastQuestion.targetId !== playerId || lastQuestion.answer) return undefined;

  lastQuestion.answer = answer;
  return room;
}

export function endTurn(playerId: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "questioning") return undefined;

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return undefined;

  room.currentPlayerIndex++;
  room.questionsAsked = 0;

  if (room.currentPlayerIndex >= room.players.length) {
    room.phase = "spy_voting";
    room.spyVotes = [];
  }

  return room;
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
  room.revealedSpyIds = [revealedId];

  const revealedPlayer = room.players.find((p) => p.id === revealedId);
  const isSpy = revealedPlayer?.role === "spy";

  if (isSpy) {
    room.players.forEach((p) => {
      if (room.spyVotes.some((v) => v.voterId === p.id && v.suspectId === revealedId)) {
        p.score += 1;
      }
    });
    room.phase = "spy_guess";
  } else {
    room.players.forEach((p) => {
      if (p.role === "spy") {
        p.score += 1;
      }
    });
    room.phase = "results";
  }
}

export function submitGuess(playerId: string, guess: string): Room | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;
  if (room.phase !== "spy_guess") return undefined;
  if (!room.revealedSpyIds.includes(playerId)) return undefined;

  room.spyGuess = guess;
  room.phase = "guess_validation";
  room.guessValidationVotes = [];

  return room;
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

  room.players.forEach((p) => {
    p.role = undefined;
    p.word = undefined;
    p.hasVoted = false;
    p.votedFor = undefined;
    p.isEliminated = false;
  });

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
