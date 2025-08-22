import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Trophy, Clock, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QuizCard from "@/components/quiz-card";
import QuizResultModal from "@/components/quiz-result-modal";
import Leaderboard from "@/components/leaderboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  points: number;
  imageUrl?: string;
}

interface QuizState {
  currentQuestionIndex: number;
  score: number;
  correctAnswers: number;
  userAnswers: Array<{ questionId: string; selectedAnswer: number; isCorrect: boolean; pointsEarned: number }>;
  timeRemaining: number;
  isCompleted: boolean;
  quizId?: string;
}

export default function Quiz() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const category = params.category || "football";
  const [currentUser] = useState({ id: "demo-user", username: "You", totalPoints: 1250 });

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    userAnswers: [],
    timeRemaining: 300, // 5 minutes
    isCompleted: false,
  });

  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    explanation: string;
    pointsEarned: number;
  } | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["/api/questions", category],
    queryFn: async () => {
      const response = await fetch(`/api/questions/${category}?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  const createQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quizzes", {
        userId: currentUser.id,
        category: category,
        totalQuestions: questions?.length || 10,
        score: 0,
        correctAnswers: 0,
        pointsEarned: 0,
        timeSpent: 0,
        completed: false,
      });
      return response.json();
    },
  });

  const checkAnswerMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: number }) => {
      const response = await apiRequest("POST", "/api/answers/check", {
        questionId,
        selectedAnswer,
      });
      return response.json();
    },
  });

  const completeQuizMutation = useMutation({
    mutationFn: async ({ quizId, score, correctAnswers, pointsEarned }: { 
      quizId: string; 
      score: number; 
      correctAnswers: number; 
      pointsEarned: number; 
    }) => {
      const response = await apiRequest("PATCH", `/api/quizzes/${quizId}/complete`, {
        score,
        correctAnswers,
        pointsEarned,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (quizState.timeRemaining > 0 && !quizState.isCompleted) {
      const timer = setTimeout(() => {
        setQuizState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (quizState.timeRemaining === 0 && !quizState.isCompleted) {
      handleCompleteQuiz();
    }
  }, [quizState.timeRemaining, quizState.isCompleted]);

  // Create quiz when component mounts
  useEffect(() => {
    if (questions && !quizState.quizId) {
      createQuizMutation.mutate(undefined, {
        onSuccess: (quiz) => {
          setQuizState(prev => ({ ...prev, quizId: quiz.id }));
        },
      });
    }
  }, [questions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null || !questions) return;

    setSelectedAnswer(answerIndex);
    const currentQuestion = questions[quizState.currentQuestionIndex];

    try {
      const result = await checkAnswerMutation.mutateAsync({
        questionId: currentQuestion.id,
        selectedAnswer: answerIndex,
      });

      setAnswerFeedback({
        show: true,
        isCorrect: result.isCorrect,
        explanation: result.explanation,
        pointsEarned: result.pointsEarned,
      });

      setQuizState(prev => ({
        ...prev,
        score: prev.score + result.pointsEarned,
        correctAnswers: prev.correctAnswers + (result.isCorrect ? 1 : 0),
        userAnswers: [...prev.userAnswers, {
          questionId: currentQuestion.id,
          selectedAnswer: answerIndex,
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned,
        }],
      }));

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive",
      });
    }
  };

  const handleNextQuestion = () => {
    if (!questions) return;

    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleSkipQuestion = () => {
    if (!questions) return;

    const currentQuestion = questions[quizState.currentQuestionIndex];
    setQuizState(prev => ({
      ...prev,
      userAnswers: [...prev.userAnswers, {
        questionId: currentQuestion.id,
        selectedAnswer: -1,
        isCorrect: false,
        pointsEarned: 0,
      }],
    }));
    
    handleNextQuestion();
  };

  const handleCompleteQuiz = () => {
    if (!quizState.quizId) return;

    setQuizState(prev => ({ ...prev, isCompleted: true }));
    
    completeQuizMutation.mutate({
      quizId: quizState.quizId,
      score: quizState.score,
      correctAnswers: quizState.correctAnswers,
      pointsEarned: quizState.score,
    }, {
      onSuccess: () => {
        setShowResult(true);
      },
    });
  };

  const handlePlayAgain = () => {
    navigate(`/quiz/${category}`);
    window.location.reload();
  };

  const handleViewLeaderboard = () => {
    setShowResult(false);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sports-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-6">Sorry, no questions are available for this category.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const progressPercentage = ((quizState.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <nav className="flex items-center justify-between bg-white rounded-2xl shadow-lg px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-r from-sports-blue to-sports-purple rounded-xl flex items-center justify-center">
              <Trophy className="text-white text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">SportIQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <Clock className="text-sports-blue w-5 h-5" />
              <span className="font-semibold text-gray-700" data-testid="text-time-remaining">
                {formatTime(quizState.timeRemaining)}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <Star className="text-yellow-500 w-5 h-5" />
              <span className="font-semibold text-gray-700" data-testid="text-current-score">
                {quizState.score}
              </span>
            </div>
          </div>
        </nav>
      </header>

      <main className="grid lg:grid-cols-3 gap-8">
        {/* Quiz Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quiz Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {category.charAt(0).toUpperCase() + category.slice(1)} Quiz
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span data-testid="text-quiz-timer">{formatTime(quizState.timeRemaining)}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span data-testid="text-question-progress">
                  Question {quizState.currentQuestionIndex + 1} of {questions.length}
                </span>
                <span data-testid="text-current-points">{quizState.score} points</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            <QuizCard
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              answerFeedback={answerFeedback}
              onAnswerSelect={handleAnswerSelect}
              onNextQuestion={handleNextQuestion}
              onSkipQuestion={handleSkipQuestion}
              isLastQuestion={quizState.currentQuestionIndex === questions.length - 1}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Score */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Score</h3>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-sports-blue to-sports-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white" data-testid="text-score-display">
                  {quizState.score}
                </span>
              </div>
              <p className="text-sm text-gray-600">Points this quiz</p>
              <div className="mt-4 p-3 bg-green-50 rounded-xl">
                <p className="text-sm font-semibold text-sports-green" data-testid="text-correct-streak">
                  {quizState.correctAnswers} correct!
                </p>
              </div>
            </div>
          </div>

          <Leaderboard users={leaderboard || []} currentUser={currentUser} />
        </div>
      </main>

      <QuizResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        score={quizState.correctAnswers}
        totalQuestions={questions.length}
        pointsEarned={quizState.score}
        onPlayAgain={handlePlayAgain}
        onViewLeaderboard={handleViewLeaderboard}
      />
    </div>
  );
}
