import { z } from "zod";

export type GameMode = "classic" | "blind";

export type GuessValidationMode = "system" | "players";

export type GamePhase = 
  | "lobby"
  | "category_voting"
  | "word_reveal"
  | "questioning"
  | "spy_voting"
  | "spy_guess"
  | "guess_validation"
  | "results";

export type PlayerRole = "player" | "spy";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  role?: PlayerRole;
  word?: string;
  hasVoted?: boolean;
  votedFor?: string;
  isEliminated?: boolean;
  questionsRemaining?: number;
  doneWithQuestions?: boolean;
  sessionToken?: string;
  disconnectedAt?: number;
}

export interface CategoryVote {
  playerId: string;
  category: string;
}

export interface SpyVote {
  voterId: string;
  suspectId: string;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface Question {
  askerId: string;
  targetId: string;
  question: string;
  answer?: string;
}

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  gameMode: GameMode;
  phase: GamePhase;
  currentWord?: string;
  spyWord?: string;
  selectedCategory?: string;
  categoryVotes: CategoryVote[];
  spyVotes: SpyVote[];
  currentPlayerIndex: number;
  questionsAsked: number;
  timerEndTime?: number;
  messages: Message[];
  questions: Question[];
  roundNumber: number;
  spyGuess?: string;
  spyGuessCorrect?: boolean;
  guessValidationVotes: { playerId: string; isCorrect: boolean }[];
  revealedSpyIds: string[];
  spyCount: number;
  questionsPerPlayer: number;
  turnQueue: string[];
  currentTurnPlayerId?: string;
  turnTimerEnd?: number;
  guessValidationMode: GuessValidationMode;
}

export const categories = [
  { id: "countries", name: "دول", icon: "globe" },
  { id: "fruits_vegetables", name: "خضروات وفواكه", icon: "apple" },
  { id: "animals", name: "حيوانات", icon: "dog" },
  { id: "cars", name: "سيارات", icon: "car" },
] as const;

export type CategoryId = typeof categories[number]["id"];

export const createRoomSchema = z.object({
  playerName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(20, "الاسم يجب أن لا يتجاوز 20 حرف"),
  gameMode: z.enum(["classic", "blind"]),
});

export const joinRoomSchema = z.object({
  playerName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(20, "الاسم يجب أن لا يتجاوز 20 حرف"),
  roomCode: z.string().length(6, "رمز الغرفة يجب أن يكون 6 أحرف"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export type WebSocketMessage =
  | { type: "create_room"; data: { playerName: string; gameMode: GameMode } }
  | { type: "join_room"; data: { playerName: string; roomCode: string } }
  | { type: "toggle_ready" }
  | { type: "start_game" }
  | { type: "vote_category"; data: { category: string } }
  | { type: "vote_spy"; data: { suspectId: string } }
  | { type: "submit_guess"; data: { guess: string } }
  | { type: "validate_guess"; data: { isCorrect: boolean } }
  | { type: "end_turn" }
  | { type: "ask_question"; data: { targetId: string; question: string } }
  | { type: "answer_question"; data: { answer: string } }
  | { type: "send_message"; data: { text: string } }
  | { type: "update_spy_count"; data: { count: number } }
  | { type: "update_guess_validation_mode"; data: { mode: GuessValidationMode } }
  | { type: "next_round" }
  | { type: "leave_room" }
  | { type: "done_with_questions" }
  | { type: "reconnect"; data: { sessionToken: string; roomCode: string } }
  | { type: "confirm_word_reveal" };

export type ServerMessage =
  | { type: "room_created"; data: { room: Room; playerId: string; sessionToken: string } }
  | { type: "room_joined"; data: { room: Room; playerId: string; sessionToken: string } }
  | { type: "room_updated"; data: { room: Room } }
  | { type: "game_started"; data: { room: Room } }
  | { type: "error"; data: { message: string } }
  | { type: "player_left"; data: { playerId: string; room: Room } }
  | { type: "timer_update"; data: { timeRemaining: number } }
  | { type: "phase_changed"; data: { phase: GamePhase; room: Room } }
  | { type: "new_message"; data: { message: Message } }
  | { type: "reconnected"; data: { room: Room; playerId: string } }
  | { type: "spy_revealed"; data: { spyIds: string[]; room: Room } }
  | { type: "turn_changed"; data: { currentPlayerId: string; room: Room } };

export function getSpyCountForPlayers(playerCount: number): number {
  if (playerCount <= 6) return 1;
  if (playerCount <= 8) return 2;
  return 3;
}

export function getMinPlayersForStart(): number {
  return 4;
}

export function getMaxPlayers(): number {
  return 10;
}
