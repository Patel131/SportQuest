import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star } from "lucide-react";

interface QuizResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
  pointsEarned: number;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export default function QuizResultModal({
  isOpen,
  onClose,
  score,
  totalQuestions,
  pointsEarned,
  onPlayAgain,
  onViewLeaderboard
}: QuizResultModalProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { message: "Outstanding Performance!", color: "text-sports-green" };
    if (percentage >= 80) return { message: "Excellent Work!", color: "text-sports-blue" };
    if (percentage >= 70) return { message: "Good Job!", color: "text-sports-orange" };
    if (percentage >= 60) return { message: "Nice Try!", color: "text-sports-purple" };
    return { message: "Keep Practicing!", color: "text-gray-600" };
  };

  const performance = getPerformanceMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 rounded-3xl p-8">
        <div className="text-center">
          {/* Celebration image placeholder */}
          <img 
            src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
            alt="Celebration scene with confetti and trophy" 
            className="w-full h-40 object-cover rounded-xl mb-6" 
          />
          
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-white text-2xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2" data-testid="text-quiz-complete">
            Quiz Complete!
          </h2>
          <p className={`text-lg font-semibold mb-2 ${performance.color}`} data-testid="text-performance">
            {performance.message}
          </p>
          <p className="text-gray-600 mb-6">Great job on your sports knowledge!</p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-sports-blue" data-testid="text-final-score">
                  {score}/{totalQuestions}
                </p>
                <p className="text-sm text-gray-600">Correct</p>
                <p className="text-lg font-semibold text-sports-blue" data-testid="text-percentage">
                  {percentage}%
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sports-green" data-testid="text-points-earned">
                  +{pointsEarned}
                </p>
                <p className="text-sm text-gray-600">Points</p>
                <div className="flex items-center justify-center mt-2">
                  <Star className="text-yellow-500 w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Points Added!</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-sports-blue to-sports-purple hover:from-blue-600 hover:to-purple-600"
              data-testid="button-play-again"
            >
              Play Again
            </Button>
            <Button 
              variant="secondary"
              onClick={onViewLeaderboard}
              className="w-full"
              data-testid="button-view-leaderboard"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
