import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  totalPoints: integer("total_points").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  category: text("category").notNull(),
  score: integer("score").notNull().default(0),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  timeSpent: integer("time_spent").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  question: text("question").notNull(),
  options: json("options").notNull().$type<string[]>(),
  correctAnswer: integer("correct_answer").notNull(),
  points: integer("points").notNull().default(10),
  imageUrl: text("image_url"),
  explanation: text("explanation"),
});

export const userAnswers = pgTable("user_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  questionId: varchar("question_id").notNull(),
  selectedAnswer: integer("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  timeSpent: integer("time_spent").notNull().default(0),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({
  id: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export type User = typeof users.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserAnswer = typeof userAnswers.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
