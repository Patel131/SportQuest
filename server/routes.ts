import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
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
  return httpServer;
}
