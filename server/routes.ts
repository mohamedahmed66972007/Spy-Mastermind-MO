import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { WebSocketMessage, ServerMessage, Room } from "@shared/schema";
import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomByPlayerId,
  togglePlayerReady,
  updateSpyCount,
  startGame,
  voteCategory,
  askQuestion,
  answerQuestion,
  endTurn,
  voteSpy,
  submitGuess,
  validateGuess,
  nextRound,
  sendMessage,
  leaveRoom,
  markDoneWithQuestions,
  reconnectPlayer,
  markPlayerDisconnected,
  startQuestioningPhase,
} from "./game-storage";

const clients = new Map<string, WebSocket>();
const playerConnections = new Map<WebSocket, string>();
const roomTimers = new Map<string, NodeJS.Timeout>();

function broadcastToRoom(roomId: string, message: ServerMessage, excludePlayerId?: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  room.players.forEach((player) => {
    if (excludePlayerId && player.id === excludePlayerId) return;
    const client = clients.get(player.id);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function sendToPlayer(playerId: string, message: ServerMessage): void {
  const client = clients.get(playerId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

function clearRoomTimer(roomId: string): void {
  const timer = roomTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(roomId);
  }
}

function startWordRevealTimer(roomId: string): void {
  clearRoomTimer(roomId);
  
  const timer = setTimeout(() => {
    const room = startQuestioningPhase(roomId);
    if (room) {
      broadcastToRoom(roomId, {
        type: "phase_changed",
        data: { phase: "questioning", room },
      });
      // Start turn timer for first player
      startTurnTimer(roomId);
    }
    roomTimers.delete(roomId);
  }, 10000);
  
  roomTimers.set(roomId, timer);
}

const turnTimers = new Map<string, NodeJS.Timeout>();

function clearTurnTimer(roomId: string): void {
  const timer = turnTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomId);
  }
}

function startTurnTimer(roomId: string, forceReset: boolean = true): void {
  clearTurnTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "questioning") return;
  
  const TURN_DURATION = 60000;
  let timeRemaining: number;
  
  if (forceReset || !room.turnTimerEnd || room.turnTimerEnd <= Date.now()) {
    room.turnTimerEnd = Date.now() + TURN_DURATION;
    timeRemaining = TURN_DURATION;
  } else {
    timeRemaining = room.turnTimerEnd - Date.now();
  }
  
  broadcastToRoom(roomId, {
    type: "timer_update",
    data: { timeRemaining: Math.ceil(timeRemaining / 1000) },
  });
  
  const timer = setTimeout(() => {
    const currentRoom = getRoom(roomId);
    if (currentRoom && currentRoom.phase === "questioning" && currentRoom.currentTurnPlayerId) {
      const updatedRoom = require("./game-storage").endTurn(currentRoom.currentTurnPlayerId);
      if (updatedRoom) {
        if (updatedRoom.phase === "spy_voting") {
          broadcastToRoom(roomId, {
            type: "phase_changed",
            data: { phase: "spy_voting", room: updatedRoom },
          });
        } else {
          broadcastToRoom(roomId, {
            type: "turn_changed",
            data: { currentPlayerId: updatedRoom.currentTurnPlayerId || "", room: updatedRoom },
          });
          startTurnTimer(roomId, true);
        }
      }
    }
    turnTimers.delete(roomId);
  }, timeRemaining);
  
  turnTimers.set(roomId, timer);
}

function handleMessage(ws: WebSocket, data: string): void {
  let message: WebSocketMessage;
  try {
    message = JSON.parse(data);
  } catch {
    const playerId = playerConnections.get(ws);
    if (playerId) {
      sendToPlayer(playerId, {
        type: "error",
        data: { message: "رسالة غير صالحة" },
      });
    }
    return;
  }

  const playerId = playerConnections.get(ws);

  switch (message.type) {
    case "create_room": {
      const result = createRoom(message.data.playerName, message.data.gameMode);
      clients.set(result.playerId, ws);
      playerConnections.set(ws, result.playerId);
      sendToPlayer(result.playerId, {
        type: "room_created",
        data: { room: result.room, playerId: result.playerId, sessionToken: result.sessionToken },
      });
      break;
    }

    case "join_room": {
      const result = joinRoom(message.data.playerName, message.data.roomCode);
      if (!result) {
        const existingPlayerId = playerConnections.get(ws);
        if (existingPlayerId) {
          sendToPlayer(existingPlayerId, {
            type: "error",
            data: { message: "لم يتم العثور على الغرفة أو أنها ممتلئة" },
          });
        }
        return;
      }
      clients.set(result.playerId, ws);
      playerConnections.set(ws, result.playerId);
      sendToPlayer(result.playerId, {
        type: "room_joined",
        data: { room: result.room, playerId: result.playerId, sessionToken: result.sessionToken },
      });
      broadcastToRoom(result.room.id, {
        type: "room_updated",
        data: { room: result.room },
      }, result.playerId);
      break;
    }

    case "reconnect": {
      const result = reconnectPlayer(message.data.sessionToken, message.data.roomCode);
      if (!result) {
        ws.send(JSON.stringify({
          type: "error",
          data: { message: "تعذر إعادة الاتصال - الجلسة منتهية أو الغرفة غير موجودة" },
        }));
        return;
      }
      clients.set(result.playerId, ws);
      playerConnections.set(ws, result.playerId);
      sendToPlayer(result.playerId, {
        type: "reconnected",
        data: { room: result.room, playerId: result.playerId },
      });
      broadcastToRoom(result.room.id, {
        type: "room_updated",
        data: { room: result.room },
      }, result.playerId);
      break;
    }

    case "toggle_ready": {
      if (!playerId) return;
      const room = togglePlayerReady(playerId);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
      }
      break;
    }

    case "update_spy_count": {
      if (!playerId) return;
      const room = updateSpyCount(playerId, message.data.count);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
      }
      break;
    }

    case "start_game": {
      if (!playerId) return;
      const room = startGame(playerId);
      if (room) {
        broadcastToRoom(room.id, {
          type: "game_started",
          data: { room },
        });
        broadcastToRoom(room.id, {
          type: "phase_changed",
          data: { phase: "category_voting", room },
        });
      } else {
        sendToPlayer(playerId, {
          type: "error",
          data: { message: "لا يمكن بدء اللعبة. تأكد من وجود 4 لاعبين على الأقل واستعداد الجميع" },
        });
      }
      break;
    }

    case "vote_category": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = voteCategory(playerId, message.data.category);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "category_voting" && room.phase === "word_reveal") {
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: "word_reveal", room },
          });
          startWordRevealTimer(room.id);
        }
      }
      break;
    }

    case "confirm_word_reveal": {
      if (!playerId) return;
      // This is just an acknowledgement, the timer handles the transition
      break;
    }

    case "done_with_questions": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = markDoneWithQuestions(playerId);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "questioning" && room.phase === "spy_voting") {
          clearTurnTimer(room.id);
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: "spy_voting", room },
          });
        } else if (room.phase === "questioning" && room.currentTurnPlayerId) {
          // Turn changed, restart timer
          startTurnTimer(room.id);
          broadcastToRoom(room.id, {
            type: "turn_changed",
            data: { currentPlayerId: room.currentTurnPlayerId, room },
          });
        }
      }
      break;
    }

    case "ask_question": {
      if (!playerId) return;
      const room = askQuestion(playerId, message.data.targetId, message.data.question);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
      }
      break;
    }

    case "answer_question": {
      if (!playerId) return;
      const room = answerQuestion(playerId, message.data.answer);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
      }
      break;
    }

    case "end_turn": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = endTurn(playerId);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "questioning" && room.phase === "spy_voting") {
          clearTurnTimer(room.id);
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: "spy_voting", room },
          });
        } else if (room.phase === "questioning" && room.currentTurnPlayerId) {
          // Turn changed, restart timer
          startTurnTimer(room.id);
          broadcastToRoom(room.id, {
            type: "turn_changed",
            data: { currentPlayerId: room.currentTurnPlayerId, room },
          });
        }
      }
      break;
    }

    case "vote_spy": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = voteSpy(playerId, message.data.suspectId);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "spy_voting" && room.phase !== "spy_voting") {
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: room.phase, room },
          });
        }
      }
      break;
    }

    case "submit_guess": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = submitGuess(playerId, message.data.guess);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "spy_guess" && room.phase === "guess_validation") {
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: "guess_validation", room },
          });
        }
      }
      break;
    }

    case "validate_guess": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = validateGuess(playerId, message.data.isCorrect);
      if (room) {
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "guess_validation" && room.phase === "results") {
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: "results", room },
          });
        }
      }
      break;
    }

    case "next_round": {
      if (!playerId) return;
      const room = nextRound(playerId);
      if (room) {
        broadcastToRoom(room.id, {
          type: "phase_changed",
          data: { phase: "category_voting", room },
        });
      }
      break;
    }

    case "send_message": {
      if (!playerId) return;
      const result = sendMessage(playerId, message.data.text);
      if (result) {
        broadcastToRoom(result.room.id, {
          type: "new_message",
          data: { message: result.message },
        });
      }
      break;
    }

    case "leave_room": {
      if (!playerId) return;
      const room = getRoomByPlayerId(playerId);
      const roomId = room?.id;
      const updatedRoom = leaveRoom(playerId);
      clients.delete(playerId);
      playerConnections.delete(ws);
      if (roomId && updatedRoom) {
        broadcastToRoom(roomId, {
          type: "player_left",
          data: { playerId, room: updatedRoom },
        });
      }
      break;
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data: Buffer) => {
      handleMessage(ws, data.toString());
    });

    ws.on("close", () => {
      const playerId = playerConnections.get(ws);
      if (playerId) {
        const room = getRoomByPlayerId(playerId);
        const roomId = room?.id;
        // Mark as disconnected instead of removing (for session persistence)
        const updatedRoom = markPlayerDisconnected(playerId);
        clients.delete(playerId);
        playerConnections.delete(ws);
        if (roomId && updatedRoom) {
          broadcastToRoom(roomId, {
            type: "room_updated",
            data: { room: updatedRoom },
          });
        }
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
