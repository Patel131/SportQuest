import { type User, type InsertUser, type Quiz, type InsertQuiz, type Question, type InsertQuestion, type UserAnswer, type InsertUserAnswer, type Achievement, type InsertAchievement } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User | undefined>;
  getTopUsers(limit: number): Promise<User[]>;

  // Quiz methods
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  getUserQuizzes(userId: string): Promise<Quiz[]>;
  completeQuiz(quizId: string, score: number, correctAnswers: number, pointsEarned: number): Promise<Quiz | undefined>;

  // Question methods
  getQuestionsByCategory(category: string): Promise<Question[]>;
  getRandomQuestionsByCategory(category: string, limit: number): Promise<Question[]>;
  getAllCategories(): Promise<string[]>;

  // User Answer methods
  saveUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  getQuizAnswers(quizId: string): Promise<UserAnswer[]>;

  // Achievement methods
  getUserAchievements(userId: string): Promise<Achievement[]>;
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quizzes: Map<string, Quiz>;
  private questions: Map<string, Question>;
  private userAnswers: Map<string, UserAnswer>;
  private achievements: Map<string, Achievement>;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.userAnswers = new Map();
    this.achievements = new Map();
    this.initializeQuestions();
    this.initializeMockUsers();
  }

  private initializeMockUsers() {
    // Create some mock users for the leaderboard
    const mockUsers = [
      { username: "SportsMaster", totalPoints: 2450 },
      { username: "QuizKing", totalPoints: 2120 },
      { username: "TriviaPro", totalPoints: 1890 },
      { username: "ChampionPlayer", totalPoints: 1650 },
      { username: "GameGuru", totalPoints: 1420 }
    ];

    mockUsers.forEach(userData => {
      const user: User = {
        id: randomUUID(),
        username: userData.username,
        totalPoints: userData.totalPoints,
        createdAt: new Date()
      };
      this.users.set(user.id, user);
    });
  }

  private initializeQuestions() {
    const sampleQuestions: InsertQuestion[] = [
      // Football Questions
      {
        category: "Football",
        question: "Which team won the first Super Bowl?",
        options: ["Green Bay Packers", "Kansas City Chiefs", "New York Jets", "Oakland Raiders"],
        correctAnswer: 0,
        points: 10,
        explanation: "The Green Bay Packers defeated the Kansas City Chiefs 35-10 in Super Bowl I."
      },
      {
        category: "Football",
        question: "How many players are on the field for each team during a play?",
        options: ["10", "11", "12", "9"],
        correctAnswer: 1,
        points: 10,
        explanation: "Each team has 11 players on the field at any given time during a play."
      },
      {
        category: "Football",
        question: "What is the maximum number of downs a team gets to advance 10 yards?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
        points: 10,
        explanation: "A team gets 4 downs to advance the ball 10 yards and earn a first down."
      },

      // Basketball Questions
      {
        category: "Basketball",
        question: "Which NBA team holds the record for the most consecutive wins in a single season?",
        options: ["Los Angeles Lakers (33 wins)", "Miami Heat (27 wins)", "Golden State Warriors (28 wins)", "Milwaukee Bucks (20 wins)"],
        correctAnswer: 0,
        points: 10,
        explanation: "The Lakers set this record with 33 consecutive wins during the 1971-72 season."
      },
      {
        category: "Basketball",
        question: "How many points is a shot worth from beyond the three-point line?",
        options: ["2 points", "3 points", "4 points", "1 point"],
        correctAnswer: 1,
        points: 10,
        explanation: "Any shot made from beyond the three-point line is worth 3 points."
      },
      {
        category: "Basketball",
        question: "Who holds the record for most points scored in a single NBA game?",
        options: ["Michael Jordan", "Kobe Bryant", "Wilt Chamberlain", "LeBron James"],
        correctAnswer: 2,
        points: 10,
        explanation: "Wilt Chamberlain scored 100 points in a single game on March 2, 1962."
      },

      // Soccer Questions
      {
        category: "Soccer",
        question: "How many players are on the field for each team in soccer?",
        options: ["10", "11", "12", "9"],
        correctAnswer: 1,
        points: 10,
        explanation: "Each soccer team has 11 players on the field, including the goalkeeper."
      },
      {
        category: "Soccer",
        question: "Which country has won the most FIFA World Cups?",
        options: ["Germany", "Argentina", "Brazil", "Italy"],
        correctAnswer: 2,
        points: 10,
        explanation: "Brazil has won the FIFA World Cup 5 times (1958, 1962, 1970, 1994, 2002)."
      },
      {
        category: "Soccer",
        question: "What is the duration of a standard soccer match?",
        options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"],
        correctAnswer: 1,
        points: 10,
        explanation: "A standard soccer match consists of two 45-minute halves for a total of 90 minutes."
      },

      // Baseball Questions
      {
        category: "Baseball",
        question: "How many strikes result in a strikeout?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1,
        points: 10,
        explanation: "A batter is out after accumulating three strikes."
      },
      {
        category: "Baseball",
        question: "How many innings are in a standard baseball game?",
        options: ["7", "8", "9", "10"],
        correctAnswer: 2,
        points: 10,
        explanation: "A standard baseball game consists of 9 innings."
      },
      {
        category: "Baseball",
        question: "Which team has won the most World Series championships?",
        options: ["Boston Red Sox", "New York Yankees", "St. Louis Cardinals", "Los Angeles Dodgers"],
        correctAnswer: 1,
        points: 10,
        explanation: "The New York Yankees have won 27 World Series championships."
      }
    ];

    sampleQuestions.forEach(questionData => {
      const question: Question = {
        id: randomUUID(),
        ...questionData
      };
      this.questions.set(question.id, question);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      ...insertUser,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserPoints(userId: string, points: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.totalPoints += points;
      this.users.set(userId, user);
      return user;
    }
    return undefined;
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const quiz: Quiz = {
      id: randomUUID(),
      ...insertQuiz,
      createdAt: new Date()
    };
    this.quizzes.set(quiz.id, quiz);
    return quiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      const updatedQuiz = { ...quiz, ...updates };
      this.quizzes.set(id, updatedQuiz);
      return updatedQuiz;
    }
    return undefined;
  }

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values())
      .filter(quiz => quiz.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async completeQuiz(quizId: string, score: number, correctAnswers: number, pointsEarned: number): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(quizId);
    if (quiz) {
      quiz.score = score;
      quiz.correctAnswers = correctAnswers;
      quiz.pointsEarned = pointsEarned;
      quiz.completed = true;
      this.quizzes.set(quizId, quiz);
      
      // Update user points
      await this.updateUserPoints(quiz.userId, pointsEarned);
      
      return quiz;
    }
    return undefined;
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.category === category);
  }

  async getRandomQuestionsByCategory(category: string, limit: number): Promise<Question[]> {
    const categoryQuestions = await this.getQuestionsByCategory(category);
    const shuffled = categoryQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  async getAllCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const question of this.questions.values()) {
      categories.add(question.category);
    }
    return Array.from(categories);
  }

  async saveUserAnswer(insertAnswer: InsertUserAnswer): Promise<UserAnswer> {
    const answer: UserAnswer = {
      id: randomUUID(),
      ...insertAnswer
    };
    this.userAnswers.set(answer.id, answer);
    return answer;
  }

  async getQuizAnswers(quizId: string): Promise<UserAnswer[]> {
    return Array.from(this.userAnswers.values())
      .filter(answer => answer.quizId === quizId);
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }

  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const achievement: Achievement = {
      id: randomUUID(),
      ...insertAchievement,
      unlockedAt: new Date()
    };
    this.achievements.set(achievement.id, achievement);
    return achievement;
  }
}

export const storage = new MemStorage();
