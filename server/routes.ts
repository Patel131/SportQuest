import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertQuizSchema, insertUserAnswerSchema, insertUserSchema, insertQuestionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = userData.email ? await storage.getUserByEmail(userData.email) : null;
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopUsers(limit);
      res.json(topUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });

  // Quiz routes
  app.post("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      res.status(400).json({ message: "Invalid quiz data" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Error fetching quiz" });
    }
  });

  app.patch("/api/quizzes/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const { score, correctAnswers, pointsEarned } = req.body;
      const quiz = await storage.completeQuiz(req.params.id, score, correctAnswers, pointsEarned);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Error completing quiz" });
    }
  });

  app.get("/api/users/:userId/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const quizzes = await storage.getUserQuizzes(req.params.userId);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user quizzes" });
    }
  });

  // Question routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.get("/api/questions/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const questions = await storage.getRandomQuestionsByCategory(category, limit);
      
      // Remove correct answers from response for security
      const safeQuestions = questions.map(q => ({
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        points: q.points,
        imageUrl: q.imageUrl
      }));
      
      res.json(safeQuestions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions" });
    }
  });

  // Answer routes
  app.post("/api/answers", isAuthenticated, async (req: any, res) => {
    try {
      const answerData = insertUserAnswerSchema.parse(req.body);
      const answer = await storage.saveUserAnswer(answerData);
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Invalid answer data" });
    }
  });

  app.post("/api/answers/check", isAuthenticated, async (req: any, res) => {
    try {
      const { questionId, selectedAnswer } = req.body;
      
      // Find the question to check the answer
      const questions = Array.from((storage as any).questions.values());
      const question = questions.find((q: any) => q.id === questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const isCorrect = (question as any).correctAnswer === selectedAnswer;
      const pointsEarned = isCorrect ? (question as any).points : 0;
      
      res.json({
        isCorrect,
        pointsEarned,
        correctAnswer: (question as any).correctAnswer,
        explanation: (question as any).explanation
      });
    } catch (error) {
      res.status(500).json({ message: "Error checking answer" });
    }
  });

  app.get("/api/quizzes/:quizId/answers", isAuthenticated, async (req: any, res) => {
    try {
      const answers = await storage.getQuizAnswers(req.params.quizId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching quiz answers" });
    }
  });

  // Achievement routes
  app.get("/api/users/:userId/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.params.userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching achievements" });
    }
  });

  // Admin middleware to check if user is admin
  const isAdmin: RequestHandler = async (req: any, res, next) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking admin status" });
    }
  };

  // Admin routes for managing questions
  app.post("/api/admin/questions", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      // Since we're using in-memory storage, we'll add to the storage directly
      const question = {
        id: require('crypto').randomUUID(),
        ...questionData
      };
      (storage as any).questions.set(question.id, question);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.get("/api/admin/questions", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const questions = Array.from((storage as any).questions.values());
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions" });
    }
  });

  app.put("/api/admin/questions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const questionId = req.params.id;
      
      const updatedQuestion = {
        id: questionId,
        ...questionData
      };
      
      (storage as any).questions.set(questionId, updatedQuestion);
      res.json(updatedQuestion);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.delete("/api/admin/questions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const questionId = req.params.id;
      const deleted = (storage as any).questions.delete(questionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting question" });
    }
  });

  // Admin route to get all users
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = Array.from((storage as any).users.values());
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Admin route to toggle user admin status
  app.patch("/api/admin/users/:id/admin", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { isAdmin: newAdminStatus } = req.body;
      
      const user = (storage as any).users.get(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      user.isAdmin = newAdminStatus;
      user.updatedAt = new Date();
      (storage as any).users.set(userId, user);
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error updating user admin status" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for multiplayer functionality
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Simple multiplayer game state management
  const multiplayerRooms = new Map();
  const playerConnections = new Map();

  wss.on('connection', (ws) => {
    let playerId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_lobby':
            playerId = message.userId;
            playerConnections.set(playerId, ws);
            // Send available rooms
            ws.send(JSON.stringify({
              type: 'rooms_list',
              rooms: Array.from(multiplayerRooms.values())
            }));
            break;

          case 'create_room':
            if (!playerId) break;
            
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newRoom = {
              id: roomId,
              name: message.roomName,
              category: message.category,
              maxPlayers: message.maxPlayers || 4,
              players: [{
                id: playerId,
                username: message.username || 'Player',
                score: 0,
                isReady: true,
                isHost: true
              }],
              status: 'waiting',
              currentQuestionIndex: 0,
              timeRemaining: 30
            };
            
            multiplayerRooms.set(roomId, newRoom);
            currentRoomId = roomId;
            
            ws.send(JSON.stringify({
              type: 'room_joined',
              room: newRoom
            }));
            
            // Notify lobby of new room
            broadcastToLobby();
            break;

          case 'join_room':
            if (!playerId || !message.roomId) break;
            
            const room = multiplayerRooms.get(message.roomId);
            if (!room || room.players.length >= room.maxPlayers || room.status !== 'waiting') {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Cannot join room'
              }));
              break;
            }
            
            room.players.push({
              id: playerId,
              username: message.username || 'Player',
              score: 0,
              isReady: false,
              isHost: false
            });
            
            currentRoomId = message.roomId;
            
            // Notify all players in room
            broadcastToRoom(room.id, {
              type: 'room_updated',
              room
            });
            break;

          case 'leave_room':
            if (!currentRoomId) break;
            
            const currentRoom = multiplayerRooms.get(currentRoomId);
            if (currentRoom) {
              currentRoom.players = currentRoom.players.filter(p => p.id !== playerId);
              
              if (currentRoom.players.length === 0) {
                multiplayerRooms.delete(currentRoomId);
              } else {
                // If host left, make someone else host
                if (!currentRoom.players.find(p => p.isHost)) {
                  currentRoom.players[0].isHost = true;
                }
                
                broadcastToRoom(currentRoom.id, {
                  type: 'room_updated',
                  room: currentRoom
                });
              }
              
              broadcastToLobby();
            }
            
            currentRoomId = null;
            break;

          case 'start_game':
            if (!currentRoomId) break;
            
            const gameRoom = multiplayerRooms.get(currentRoomId);
            if (gameRoom && gameRoom.players.find(p => p.id === playerId)?.isHost) {
              gameRoom.status = 'playing';
              gameRoom.currentQuestionIndex = 0;
              
              broadcastToRoom(gameRoom.id, {
                type: 'game_started',
                room: gameRoom
              });
              
              // Start sending questions (simplified)
              setTimeout(() => {
                sendQuestionToRoom(gameRoom);
              }, 1000);
            }
            break;

          case 'submit_answer':
            if (!currentRoomId) break;
            
            const answerRoom = multiplayerRooms.get(currentRoomId);
            if (answerRoom) {
              const player = answerRoom.players.find(p => p.id === playerId);
              if (player) {
                // Award points based on correctness and time (simplified)
                const points = message.answerIndex === 0 ? 100 : 0; // Simplified scoring
                player.score += points;
                
                broadcastToRoom(answerRoom.id, {
                  type: 'room_updated',
                  room: answerRoom
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (playerId) {
        playerConnections.delete(playerId);
        
        // Handle room cleanup
        if (currentRoomId) {
          const room = multiplayerRooms.get(currentRoomId);
          if (room) {
            room.players = room.players.filter(p => p.id !== playerId);
            
            if (room.players.length === 0) {
              multiplayerRooms.delete(currentRoomId);
            } else {
              if (!room.players.find(p => p.isHost)) {
                room.players[0].isHost = true;
              }
              
              broadcastToRoom(room.id, {
                type: 'room_updated',
                room
              });
            }
            
            broadcastToLobby();
          }
        }
      }
    });
  });

  function broadcastToLobby() {
    const lobbyMessage = JSON.stringify({
      type: 'rooms_list',
      rooms: Array.from(multiplayerRooms.values())
    });
    
    playerConnections.forEach((ws, playerId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(lobbyMessage);
      }
    });
  }

  function broadcastToRoom(roomId: string, message: any) {
    const room = multiplayerRooms.get(roomId);
    if (!room) return;
    
    const messageStr = JSON.stringify(message);
    
    room.players.forEach((player: any) => {
      const ws = playerConnections.get(player.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  function sendQuestionToRoom(room: any) {
    // Simplified question sending
    const question = {
      id: `q_${room.currentQuestionIndex}`,
      question: `Sample question ${room.currentQuestionIndex + 1} for ${room.category}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      points: 100
    };
    
    broadcastToRoom(room.id, {
      type: 'question',
      question
    });
    
    // Auto-advance after 30 seconds
    setTimeout(() => {
      room.currentQuestionIndex++;
      
      if (room.currentQuestionIndex < 10) {
        sendQuestionToRoom(room);
      } else {
        room.status = 'finished';
        broadcastToRoom(room.id, {
          type: 'game_finished',
          room
        });
      }
    }, 30000);
  }

  return httpServer;
}
