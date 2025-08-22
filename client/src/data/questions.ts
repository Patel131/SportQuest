// This file contains sample questions data for development
// In production, questions would be fetched from the API

export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  imageUrl?: string;
  explanation: string;
}

export const sampleQuestions: Question[] = [
  // Football Questions
  {
    id: "1",
    category: "Football",
    question: "Which team won the first Super Bowl?",
    options: ["Green Bay Packers", "Kansas City Chiefs", "New York Jets", "Oakland Raiders"],
    correctAnswer: 0,
    points: 10,
    imageUrl: "https://images.unsplash.com/photo-1508149813-14c5f6b01a8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    explanation: "The Green Bay Packers defeated the Kansas City Chiefs 35-10 in Super Bowl I."
  },
  {
    id: "2",
    category: "Football", 
    question: "How many players are on the field for each team during a play?",
    options: ["10", "11", "12", "9"],
    correctAnswer: 1,
    points: 10,
    explanation: "Each team has 11 players on the field at any given time during a play."
  },

  // Basketball Questions
  {
    id: "3",
    category: "Basketball",
    question: "Which NBA team holds the record for the most consecutive wins in a single season?",
    options: ["Los Angeles Lakers (33 wins)", "Miami Heat (27 wins)", "Golden State Warriors (28 wins)", "Milwaukee Bucks (20 wins)"],
    correctAnswer: 0,
    points: 10,
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    explanation: "The Lakers set this record with 33 consecutive wins during the 1971-72 season."
  },
  {
    id: "4",
    category: "Basketball",
    question: "How many points is a shot worth from beyond the three-point line?",
    options: ["2 points", "3 points", "4 points", "1 point"],
    correctAnswer: 1,
    points: 10,
    explanation: "Any shot made from beyond the three-point line is worth 3 points."
  },

  // Soccer Questions
  {
    id: "5",
    category: "Soccer",
    question: "How many players are on the field for each team in soccer?",
    options: ["10", "11", "12", "9"],
    correctAnswer: 1,
    points: 10,
    explanation: "Each soccer team has 11 players on the field, including the goalkeeper."
  },
  {
    id: "6",
    category: "Soccer",
    question: "Which country has won the most FIFA World Cups?",
    options: ["Germany", "Argentina", "Brazil", "Italy"],
    correctAnswer: 2,
    points: 10,
    explanation: "Brazil has won the FIFA World Cup 5 times (1958, 1962, 1970, 1994, 2002)."
  },

  // Baseball Questions
  {
    id: "7",
    category: "Baseball",
    question: "How many strikes result in a strikeout?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    points: 10,
    explanation: "A batter is out after accumulating three strikes."
  },
  {
    id: "8",
    category: "Baseball",
    question: "How many innings are in a standard baseball game?",
    options: ["7", "8", "9", "10"],
    correctAnswer: 2,
    points: 10,
    explanation: "A standard baseball game consists of 9 innings."
  }
];

export const getQuestionsByCategory = (category: string): Question[] => {
  return sampleQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase());
};

export const getRandomQuestions = (category: string, count: number): Question[] => {
  const categoryQuestions = getQuestionsByCategory(category);
  const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
