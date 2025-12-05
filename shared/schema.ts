import { z } from "zod";

export type GameMode = "classic" | "blind";

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
  guessValidationVotes: { playerId: string; isCorrect: boolean }[];
  revealedSpyIds: string[];
  spyCount: number;
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
  | { type: "next_round" }
  | { type: "leave_room" };

export type ServerMessage =
  | { type: "room_created"; data: { room: Room; playerId: string } }
  | { type: "room_joined"; data: { room: Room; playerId: string } }
  | { type: "room_updated"; data: { room: Room } }
  | { type: "game_started"; data: { room: Room } }
  | { type: "error"; data: { message: string } }
  | { type: "player_left"; data: { playerId: string; room: Room } }
  | { type: "timer_update"; data: { timeRemaining: number } }
  | { type: "phase_changed"; data: { phase: GamePhase; room: Room } }
  | { type: "new_message"; data: { message: Message } };

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
