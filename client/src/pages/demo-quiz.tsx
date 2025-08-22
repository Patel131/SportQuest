import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Trophy, Clock, ArrowLeft, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QuizCard from "@/components/quiz-card";
import QuizResultModal from "@/components/quiz-result-modal";
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
}

export default function DemoQuiz() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const category = params.category || "football";

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

  // Timer countdown
  useEffect(() => {
    if (quizState.timeRemaining > 0 && !quizState.isCompleted) {
      const timer = setTimeout(() => {
        setQuizState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (quizState.timeRemaining === 0 && !quizState.isCompleted) {
      completeQuiz();
    }
  }, [quizState.timeRemaining, quizState.isCompleted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null || !questions) return;
    
    setSelectedAnswer(answerIndex);
    const currentQuestion = questions[quizState.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;

    const userAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      isCorrect,
      pointsEarned
    };

    setQuizState(prev => ({
      ...prev,
      score: prev.score + pointsEarned,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      userAnswers: [...prev.userAnswers, userAnswer]
    }));

    setAnswerFeedback({
      show: true,
      isCorrect,
      explanation: currentQuestion.explanation || "",
      pointsEarned
    });

    // Auto-advance after showing feedback
    setTimeout(() => {
      nextQuestion();
    }, 2500);
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setAnswerFeedback(null);

    if (quizState.currentQuestionIndex < (questions?.length || 0) - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setQuizState(prev => ({ ...prev, isCompleted: true }));
    setShowResult(true);
    
    toast({
      title: "Demo Quiz Complete!",
      description: "Sign up to save your progress and compete with others!",
    });
  };

  const restartQuiz = () => {
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      correctAnswers: 0,
      userAnswers: [],
      timeRemaining: 300,
      isCompleted: false,
    });
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sports-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo quiz...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions available for this category.</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl shadow-lg px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Demo Quiz</span> • {category}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-sports-orange" />
              <span className={`font-mono ${quizState.timeRemaining < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatTime(quizState.timeRemaining)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold" data-testid="text-current-score">{quizState.score}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {quizState.currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-quiz" />
        </div>

        {/* Quiz Card */}
        <QuizCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
          showResult={answerFeedback?.show || false}
          answerFeedback={answerFeedback}
          questionNumber={quizState.currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />

        {/* Demo Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-blue-700 mb-2">
            <Play className="w-5 h-5" />
            <span className="font-semibold">Demo Mode</span>
          </div>
          <p className="text-sm text-blue-600">
            You're playing in demo mode! Sign up to save your progress, compete with others, and unlock all features.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="mt-3 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            Sign Up Now
          </Button>
        </div>
      </div>

      {/* Results Modal */}
      {showResult && (
        <QuizResultModal
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          score={quizState.score}
          correctAnswers={quizState.correctAnswers}
          totalQuestions={questions.length}
          category={category}
          onPlayAgain={restartQuiz}
          onBackToHome={() => navigate("/")}
          isDemo={true}
        />
      )}
    </div>
  );
}