import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from "react";
import type { Room, Player, ServerMessage, WebSocketMessage, GameMode, Message, GuessValidationMode, WordSourceMode, GameSettings } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

const SESSION_STORAGE_KEY = "spy_mastermind_session";

interface SessionData {
  sessionToken: string;
  roomCode: string;
  playerId: string;
}

function saveSession(data: SessionData): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
}

function getSession(): SessionData | null {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

interface GameContextType {
  room: Room | null;
  playerId: string | null;
  currentPlayer: Player | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  timerRemaining: number;
  sendMessage: (message: WebSocketMessage) => void;
  createRoom: (playerName: string, gameMode: GameMode) => void;
  joinRoom: (playerName: string, roomCode: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  voteCategory: (category: string) => void;
  voteSpy: (suspectId: string) => void;
  submitGuess: (guess: string) => void;
  validateGuess: (isCorrect: boolean) => void;
  endTurn: () => void;
  askQuestion: (targetId: string, question: string) => void;
  answerQuestion: (answer: string) => void;
  sendChatMessage: (text: string) => void;
  updateSpyCount: (count: number) => void;
  updateGuessValidationMode: (mode: GuessValidationMode) => void;
  updateWordSource: (mode: WordSourceMode) => void;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  nextRound: () => void;
  leaveRoom: () => void;
  clearError: () => void;
  doneWithQuestions: () => void;
  transferHost: (newHostId: string) => void;
  kickPlayer: (playerId: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const connectWebSocket = useCallback(() => {
    // Clean up any existing socket and timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`[WebSocket] Connecting to ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connected successfully");
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Try to reconnect with saved session
      const session = getSession();
      if (session) {
        console.log("[WebSocket] Attempting to restore session...");
        ws.send(JSON.stringify({
          type: "reconnect",
          data: { sessionToken: session.sessionToken, roomCode: session.roomCode }
        }));
      }
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Connection closed (code: ${event.code}, reason: ${event.reason})`);
      setIsConnected(false);
      
      // Only reconnect if this is still the current socket
      if (socketRef.current !== ws) {
        return;
      }
      
      // Don't reconnect for certain close codes (normal closure, going away)
      if (event.code === 1000 || event.code === 1001) {
        return;
      }
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      } else {
        setError("فقد الاتصال بالخادم. يرجى تحديث الصفحة.");
      }
    };

    ws.onerror = (event) => {
      console.error("[WebSocket] Error:", event);
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleServerMessage(message);
      } catch {
        console.error("[WebSocket] Failed to parse message");
      }
    };

    setSocket(ws);
    
    return ws;
  }, []);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Mark as intentional close to prevent reconnection
      socketRef.current = null;
      ws.close(1000, "Component unmounting");
    };
  }, [connectWebSocket]);

  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "room_created":
      case "room_joined":
        setRoom(message.data.room);
        setPlayerId(message.data.playerId);
        setError(null);
        // Save session for reconnection
        saveSession({
          sessionToken: message.data.sessionToken,
          roomCode: message.data.room.id,
          playerId: message.data.playerId,
        });
        break;
      case "reconnected":
        setRoom(message.data.room);
        setPlayerId(message.data.playerId);
        setError(null);
        break;
      case "room_updated":
      case "game_started":
      case "turn_changed":
        setRoom(message.data.room);
        break;
      case "phase_changed":
        setRoom(message.data.room);
        // Reset timer to 10 when entering pre_voting_transition phase
        if (message.data.phase === "pre_voting_transition") {
          console.log("Phase changed to pre_voting_transition, resetting timer to 10");
          setTimerRemaining(10);
        }
        break;
      case "spy_revealed":
        setRoom(message.data.room);
        break;
      case "player_left":
        setRoom(message.data.room);
        break;
      case "host_transferred":
        setRoom(message.data.room);
        break;
      case "player_kicked":
        // If current player was kicked
        if (message.data.isYou || message.data.playerId === playerId) {
          // Show toast notification
          toast({
            title: "⚠️ تم طردك من الغرفة",
            description: "تم طردك من الغرفة من قبل القائد",
            variant: "destructive",
          });
          
          // Clear session first to prevent reconnection attempts
          clearSession();
          
          // Mark socket as null to prevent reconnection
          socketRef.current = null;
          
          // Close the actual connection
          if (socket) {
            socket.close(1000, "Kicked from room");
          }
          
          // Clear all state
          setRoom(null);
          setPlayerId(null);
          setIsConnected(false);
          
          // Redirect to home page after showing toast
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          // Another player was kicked
          setRoom(message.data.room);
        }
        break;
      case "timer_update":
        console.log(`Timer update received: ${message.data.timeRemaining}s`);
        setTimerRemaining(message.data.timeRemaining);
        break;
      case "new_message":
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message.data.message],
          };
        });
        break;
      case "error":
        setError(message.data.message);
        break;
    }
  }, []);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    },
    [socket]
  );

  const createRoom = useCallback(
    (playerName: string, gameMode: GameMode) => {
      sendMessage({ type: "create_room", data: { playerName, gameMode } });
    },
    [sendMessage]
  );

  const joinRoom = useCallback(
    (playerName: string, roomCode: string) => {
      sendMessage({ type: "join_room", data: { playerName, roomCode } });
    },
    [sendMessage]
  );

  const toggleReady = useCallback(() => {
    sendMessage({ type: "toggle_ready" });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ type: "start_game" });
  }, [sendMessage]);

  const voteCategory = useCallback(
    (category: string) => {
      sendMessage({ type: "vote_category", data: { category } });
    },
    [sendMessage]
  );

  const voteSpy = useCallback(
    (suspectId: string) => {
      sendMessage({ type: "vote_spy", data: { suspectId } });
    },
    [sendMessage]
  );

  const submitGuess = useCallback(
    (guess: string) => {
      sendMessage({ type: "submit_guess", data: { guess } });
    },
    [sendMessage]
  );

  const validateGuess = useCallback(
    (isCorrect: boolean) => {
      sendMessage({ type: "validate_guess", data: { isCorrect } });
    },
    [sendMessage]
  );

  const endTurn = useCallback(() => {
    sendMessage({ type: "end_turn" });
  }, [sendMessage]);

  const askQuestion = useCallback(
    (targetId: string, question: string) => {
      sendMessage({ type: "ask_question", data: { targetId, question } });
    },
    [sendMessage]
  );

  const answerQuestion = useCallback(
    (answer: string) => {
      sendMessage({ type: "answer_question", data: { answer } });
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      sendMessage({ type: "send_message", data: { text } });
    },
    [sendMessage]
  );

  const updateSpyCount = useCallback(
    (count: number) => {
      sendMessage({ type: "update_spy_count", data: { count } });
    },
    [sendMessage]
  );

  const updateGuessValidationMode = useCallback(
    (mode: GuessValidationMode) => {
      sendMessage({ type: "update_guess_validation_mode", data: { mode } });
    },
    [sendMessage]
  );

  const updateWordSource = useCallback(
    (mode: WordSourceMode) => {
      sendMessage({ type: "update_word_source", data: { mode } });
    },
    [sendMessage]
  );

  const updateGameSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      sendMessage({ type: "update_game_settings", data: { settings } });
    },
    [sendMessage]
  );

  const nextRound = useCallback(() => {
    sendMessage({ type: "next_round" });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: "leave_room" });
    setRoom(null);
    setPlayerId(null);
    clearSession(); // Clear saved session on explicit leave
  }, [sendMessage]);

  const doneWithQuestions = useCallback(() => {
    sendMessage({ type: "done_with_questions" });
  }, [sendMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const transferHost = useCallback(
    (newHostId: string) => {
      sendMessage({ type: "transfer_host", data: { newHostId } });
    },
    [sendMessage]
  );

  const kickPlayer = useCallback(
    (playerIdToKick: string) => {
      sendMessage({ type: "kick_player", data: { playerId: playerIdToKick } });
    },
    [sendMessage]
  );

  const currentPlayer = room?.players.find((p) => p.id === playerId) || null;
  const isHost = currentPlayer?.isHost || false;

  return (
    <GameContext.Provider
      value={{
        room,
        playerId,
        currentPlayer,
        isHost,
        isConnected,
        error,
        timerRemaining,
        sendMessage,
        createRoom,
        joinRoom,
        toggleReady,
        startGame,
        voteCategory,
        voteSpy,
        submitGuess,
        validateGuess,
        endTurn,
        askQuestion,
        answerQuestion,
        sendChatMessage,
        updateSpyCount,
        updateGuessValidationMode,
        updateWordSource,
        updateGameSettings,
        nextRound,
        leaveRoom,
        clearError,
        doneWithQuestions,
        transferHost,
        kickPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}