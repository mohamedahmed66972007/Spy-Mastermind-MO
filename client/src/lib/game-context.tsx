import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Room, Player, ServerMessage, WebSocketMessage, GameMode, Message } from "@shared/schema";

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
  nextRound: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setError("حدث خطأ في الاتصال");
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleServerMessage(message);
      } catch {
        console.error("Failed to parse message");
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "room_created":
      case "room_joined":
        setRoom(message.data.room);
        setPlayerId(message.data.playerId);
        setError(null);
        break;
      case "room_updated":
      case "game_started":
      case "phase_changed":
        setRoom(message.data.room);
        break;
      case "player_left":
        setRoom(message.data.room);
        break;
      case "timer_update":
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

  const nextRound = useCallback(() => {
    sendMessage({ type: "next_round" });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: "leave_room" });
    setRoom(null);
    setPlayerId(null);
  }, [sendMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
        nextRound,
        leaveRoom,
        clearError,
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
