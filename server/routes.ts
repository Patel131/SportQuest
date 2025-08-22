import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSchema, insertUserAnswerSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
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
  app.post("/api/quizzes", async (req, res) => {
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

  app.patch("/api/quizzes/:id/complete", async (req, res) => {
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

  app.get("/api/users/:userId/quizzes", async (req, res) => {
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
  app.post("/api/answers", async (req, res) => {
    try {
      const answerData = insertUserAnswerSchema.parse(req.body);
      const answer = await storage.saveUserAnswer(answerData);
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Invalid answer data" });
    }
  });

  app.post("/api/answers/check", async (req, res) => {
    try {
      const { questionId, selectedAnswer } = req.body;
      
      // Find the question to check the answer
      const questions = Array.from((storage as any).questions.values());
      const question = questions.find(q => q.id === questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const isCorrect = question.correctAnswer === selectedAnswer;
      const pointsEarned = isCorrect ? question.points : 0;
      
      res.json({
        isCorrect,
        pointsEarned,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    } catch (error) {
      res.status(500).json({ message: "Error checking answer" });
    }
  });

  app.get("/api/quizzes/:quizId/answers", async (req, res) => {
    try {
      const answers = await storage.getQuizAnswers(req.params.quizId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching quiz answers" });
    }
  });

  // Achievement routes
  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.params.userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
