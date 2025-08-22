import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  points: number;
  imageUrl?: string;
}

interface AnswerFeedback {
  show: boolean;
  isCorrect: boolean;
  explanation: string;
  pointsEarned: number;
}

interface QuizCardProps {
  question: Question;
  selectedAnswer: number | null;
  answerFeedback: AnswerFeedback | null;
  onAnswerSelect: (answerIndex: number) => void;
  onNextQuestion: () => void;
  onSkipQuestion: () => void;
  isLastQuestion: boolean;
}

const optionLabels = ['A', 'B', 'C', 'D'];

export default function QuizCard({
  question,
  selectedAnswer,
  answerFeedback,
  onAnswerSelect,
  onNextQuestion,
  onSkipQuestion,
  isLastQuestion
}: QuizCardProps) {
  
  const getButtonClasses = (index: number) => {
    let baseClasses = "w-full text-left p-4 bg-white rounded-xl border-2 transition-all duration-200 group";
    
    if (selectedAnswer === null) {
      return `${baseClasses} border-gray-200 hover:border-sports-blue hover:bg-blue-50`;
    }
    
    if (selectedAnswer === index) {
      if (answerFeedback?.isCorrect) {
        return `${baseClasses} border-sports-green bg-green-50`;
      } else {
        return `${baseClasses} border-sports-red bg-red-50`;
      }
    }
    
    return `${baseClasses} border-gray-200 opacity-60`;
  };

  const getOptionLabelClasses = (index: number) => {
    let baseClasses = "w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors";
    
    if (selectedAnswer === null) {
      return `${baseClasses} bg-gray-100 group-hover:bg-sports-blue group-hover:text-white`;
    }
    
    if (selectedAnswer === index) {
      if (answerFeedback?.isCorrect) {
        return `${baseClasses} bg-sports-green text-white`;
      } else {
        return `${baseClasses} bg-sports-red text-white`;
      }
    }
    
    return `${baseClasses} bg-gray-100 text-gray-600`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-100">
      {/* Question Image */}
      {question.imageUrl && (
        <div className="mb-6">
          <img 
            src={question.imageUrl} 
            alt="Question illustration" 
            className="w-full h-48 object-cover rounded-lg shadow-md" 
          />
        </div>
      )}
      
      <h3 className="text-xl font-bold text-gray-800 mb-6" data-testid="text-question">
        {question.question}
      </h3>
      
      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(index)}
            disabled={selectedAnswer !== null}
            className={getButtonClasses(index)}
            data-testid={`button-answer-${index}`}
          >
            <div className="flex items-center space-x-3">
              <span className={getOptionLabelClasses(index)}>
                {optionLabels[index]}
              </span>
              <span className="font-medium text-gray-700 group-hover:text-gray-800">
                {option}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Answer Feedback */}
      {answerFeedback?.show && (
        <div className={`p-4 rounded-xl border-2 mb-6 ${
          answerFeedback.isCorrect 
            ? 'bg-green-50 border-sports-green' 
            : 'bg-red-50 border-sports-red'
        }`}>
          <div className="flex items-center space-x-3">
            {answerFeedback.isCorrect ? (
              <CheckCircle className="text-sports-green text-xl flex-shrink-0" />
            ) : (
              <XCircle className="text-sports-red text-xl flex-shrink-0" />
            )}
            <div>
              <p className={`font-semibold ${
                answerFeedback.isCorrect ? 'text-sports-green' : 'text-sports-red'
              }`} data-testid="text-answer-result">
                {answerFeedback.isCorrect 
                  ? `Correct! +${answerFeedback.pointsEarned} points` 
                  : 'Incorrect! +0 points'
                }
              </p>
              {answerFeedback.explanation && (
                <p className="text-sm text-gray-600 mt-1" data-testid="text-explanation">
                  {answerFeedback.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="secondary"
          onClick={onSkipQuestion}
          disabled={selectedAnswer !== null}
          data-testid="button-skip-question"
        >
          Skip Question
        </Button>
        <Button 
          onClick={onNextQuestion}
          disabled={selectedAnswer === null}
          className="bg-gradient-to-r from-sports-blue to-sports-purple hover:from-blue-600 hover:to-purple-600"
          data-testid="button-next-question"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
