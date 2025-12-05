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
  forceSelectCategoryAndStartWordReveal,
  forceProcessSpyVotes,
  forceEndAskingPhase,
  forceEndAnsweringPhase,
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
const answerTimers = new Map<string, NodeJS.Timeout>();
const votingTimers = new Map<string, NodeJS.Timeout>();

function clearTurnTimer(roomId: string): void {
  const timer = turnTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomId);
  }
}

function clearAnswerTimer(roomId: string): void {
  const timer = answerTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    answerTimers.delete(roomId);
  }
}

function clearVotingTimer(roomId: string): void {
  const timer = votingTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    votingTimers.delete(roomId);
  }
}

function startAnswerTimer(roomId: string): void {
  clearAnswerTimer(roomId);
  clearTurnTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "questioning") return;
  
  const ANSWER_DURATION = 30000; // 30 seconds
  
  broadcastToRoom(roomId, {
    type: "timer_update",
    data: { timeRemaining: Math.ceil(ANSWER_DURATION / 1000) },
  });
  
  const timer = setTimeout(() => {
    const currentRoom = getRoom(roomId);
    if (currentRoom && currentRoom.phase === "questioning") {
      // Time expired for answering, use forceEndAnsweringPhase to properly advance turn
      const updatedRoom = forceEndAnsweringPhase(roomId);
      if (updatedRoom) {
        if (updatedRoom.phase === "spy_voting") {
          broadcastToRoom(roomId, {
            type: "phase_changed",
            data: { phase: "spy_voting", room: updatedRoom },
          });
          startSpyVotingTimer(roomId);
        } else {
          broadcastToRoom(roomId, {
            type: "turn_changed",
            data: { currentPlayerId: updatedRoom.currentTurnPlayerId || "", room: updatedRoom },
          });
          startTurnTimer(roomId, true);
        }
      }
    }
    answerTimers.delete(roomId);
  }, ANSWER_DURATION);
  
  answerTimers.set(roomId, timer);
}

function startTurnTimer(roomId: string, forceReset: boolean = true): void {
  clearTurnTimer(roomId);
  clearAnswerTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "questioning") return;
  
  const TURN_DURATION = 60000; // 60 seconds for asking
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
      // Use forceEndAskingPhase which deducts a question from the player
      const updatedRoom = forceEndAskingPhase(roomId);
      if (updatedRoom) {
        if (updatedRoom.phase === "spy_voting") {
          broadcastToRoom(roomId, {
            type: "phase_changed",
            data: { phase: "spy_voting", room: updatedRoom },
          });
          startSpyVotingTimer(roomId);
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

function startCategoryVotingTimer(roomId: string): void {
  clearVotingTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "category_voting") return;
  
  const CATEGORY_VOTING_DURATION = 30000; // 30 seconds
  
  broadcastToRoom(roomId, {
    type: "timer_update",
    data: { timeRemaining: Math.ceil(CATEGORY_VOTING_DURATION / 1000) },
  });
  
  const timer = setTimeout(() => {
    const currentRoom = getRoom(roomId);
    if (currentRoom && currentRoom.phase === "category_voting") {
      // Force move to word reveal phase even if not all voted
      forceEndCategoryVoting(roomId);
    }
    votingTimers.delete(roomId);
  }, CATEGORY_VOTING_DURATION);
  
  votingTimers.set(roomId, timer);
}

function startSpyVotingTimer(roomId: string): void {
  clearVotingTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "spy_voting") return;
  
  const SPY_VOTING_DURATION = 60000; // 60 seconds
  
  broadcastToRoom(roomId, {
    type: "timer_update",
    data: { timeRemaining: Math.ceil(SPY_VOTING_DURATION / 1000) },
  });
  
  const timer = setTimeout(() => {
    const currentRoom = getRoom(roomId);
    if (currentRoom && currentRoom.phase === "spy_voting") {
      // Force move to next phase even if not all voted
      forceEndSpyVoting(roomId);
    }
    votingTimers.delete(roomId);
  }, SPY_VOTING_DURATION);
  
  votingTimers.set(roomId, timer);
}

function forceEndCategoryVoting(roomId: string): void {
  const room = forceSelectCategoryAndStartWordReveal(roomId);
  if (room) {
    broadcastToRoom(roomId, {
      type: "phase_changed",
      data: { phase: "word_reveal", room },
    });
    startWordRevealTimer(roomId);
  }
}

function forceEndSpyVoting(roomId: string): void {
  const room = forceProcessSpyVotes(roomId);
  if (room) {
    broadcastToRoom(roomId, {
      type: "phase_changed",
      data: { phase: room.phase, room },
    });
    // Start spy guess timer if we're in spy_guess phase
    if (room.phase === "spy_guess") {
      startSpyGuessTimer(roomId);
    }
  }
}

const spyGuessTimers = new Map<string, NodeJS.Timeout>();

function clearSpyGuessTimer(roomId: string): void {
  const timer = spyGuessTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    spyGuessTimers.delete(roomId);
  }
}

function startSpyGuessTimer(roomId: string): void {
  clearSpyGuessTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "spy_guess") return;
  
  const SPY_GUESS_DURATION = 30000; // 30 seconds for spy to guess
  
  broadcastToRoom(roomId, {
    type: "timer_update",
    data: { timeRemaining: Math.ceil(SPY_GUESS_DURATION / 1000) },
  });
  
  const timer = setTimeout(() => {
    const currentRoom = getRoom(roomId);
    if (currentRoom && currentRoom.phase === "spy_guess") {
      // Time expired, spy didn't guess - move to results
      currentRoom.phase = "results";
      broadcastToRoom(roomId, {
        type: "phase_changed",
        data: { phase: "results", room: currentRoom },
      });
    }
    spyGuessTimers.delete(roomId);
  }, SPY_GUESS_DURATION);
  
  spyGuessTimers.set(roomId, timer);
}

const guessValidationTimers = new Map<string, NodeJS.Timeout>();

function clearGuessValidationTimer(roomId: string): void {
  const timer = guessValidationTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    guessValidationTimers.delete(roomId);
  }
}

function startGuessValidationTimer(roomId: string): void {
  clearGuessValidationTimer(roomId);
  
  const room = getRoom(roomId);
  if (!room || room.phase !== "guess_validation") return;
  
  const VALIDATION_DURATION = 30000; // 30 seconds to validate
  
  broadcastToRoom(roomId, {
    type: "timer_update",
    data: { timeRemaining: Math.ceil(VALIDATION_DURATION / 1000) },
  });
  
  const timer = setTimeout(() => {
    const currentRoom = getRoom(roomId);
    if (currentRoom && currentRoom.phase === "guess_validation") {
      // Time expired, force process validation votes
      forceProcessGuessValidation(roomId);
    }
    guessValidationTimers.delete(roomId);
  }, VALIDATION_DURATION);
  
  guessValidationTimers.set(roomId, timer);
}

function forceProcessGuessValidation(roomId: string): void {
  const room = getRoom(roomId);
  if (!room || room.phase !== "guess_validation") return;
  
  // Count votes - if more "correct" votes or tie, spy wins the point
  const correctVotes = room.guessValidationVotes.filter(v => v.isCorrect).length;
  const incorrectVotes = room.guessValidationVotes.filter(v => !v.isCorrect).length;
  
  if (correctVotes >= incorrectVotes && room.guessValidationVotes.length > 0) {
    // Spy guessed correctly - award point
    room.players.forEach(p => {
      if (room.revealedSpyIds.includes(p.id)) {
        p.score = (p.score || 0) + 1;
      }
    });
  }
  
  room.phase = "results";
  broadcastToRoom(roomId, {
    type: "phase_changed",
    data: { phase: "results", room },
  });
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
        // Start category voting timer
        startCategoryVotingTimer(room.id);
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
          clearVotingTimer(room.id);
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
        // Start answer timer (30 seconds)
        startAnswerTimer(room.id);
      }
      break;
    }

    case "answer_question": {
      if (!playerId) return;
      const result = answerQuestion(playerId, message.data.answer);
      if (result) {
        const { room, turnAdvanced } = result;
        // Clear answer timer since answer was given
        clearAnswerTimer(room.id);
        
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        
        // If turn advanced after answering, handle timer and turn change
        if (turnAdvanced) {
          if (room.phase === "spy_voting") {
            clearTurnTimer(room.id);
            broadcastToRoom(room.id, {
              type: "phase_changed",
              data: { phase: "spy_voting", room },
            });
            startSpyVotingTimer(room.id);
          } else if (room.phase === "questioning" && room.currentTurnPlayerId) {
            // Turn changed, restart timer for next player (60 seconds for asking)
            startTurnTimer(room.id, true);
            broadcastToRoom(room.id, {
              type: "turn_changed",
              data: { currentPlayerId: room.currentTurnPlayerId, room },
            });
          }
        }
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
          clearVotingTimer(room.id);
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: room.phase, room },
          });
          // Start spy guess timer if we're in spy_guess phase
          if (room.phase === "spy_guess") {
            startSpyGuessTimer(room.id);
          }
        }
      }
      break;
    }

    case "submit_guess": {
      if (!playerId) return;
      const prevPhase = getRoomByPlayerId(playerId)?.phase;
      const room = submitGuess(playerId, message.data.guess);
      if (room) {
        // Clear the spy guess timer since the spy submitted their guess
        clearSpyGuessTimer(room.id);
        broadcastToRoom(room.id, {
          type: "room_updated",
          data: { room },
        });
        if (prevPhase === "spy_guess" && room.phase === "guess_validation") {
          broadcastToRoom(room.id, {
            type: "phase_changed",
            data: { phase: "guess_validation", room },
          });
          // Start guess validation timer
          startGuessValidationTimer(room.id);
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
          clearGuessValidationTimer(room.id);
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
        // Start category voting timer for new round
        startCategoryVotingTimer(room.id);
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
