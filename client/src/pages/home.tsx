import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Leaderboard from "@/components/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const categoryIcons = {
  "Football": "🏈",
  "Basketball": "🏀", 
  "Soccer": "⚽",
  "Baseball": "⚾"
};

const categoryColors = {
  "Football": "from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-sports-blue",
  "Basketball": "from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-sports-orange",
  "Soccer": "from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-sports-green",
  "Baseball": "from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-sports-red"
};

export default function Home() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast({
        title: "Please log in",
        description: "Redirecting to login page...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isAuthLoading, toast]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  if (categoriesLoading || leaderboardLoading || isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sports-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SportIQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <nav className="flex items-center justify-between bg-white rounded-2xl shadow-lg px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-sports-blue to-sports-purple rounded-xl flex items-center justify-center">
              <Trophy className="text-white text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">SportIQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <Star className="text-yellow-500 w-5 h-5" />
              <span className="font-semibold text-gray-700" data-testid="text-user-points">
                {user?.totalPoints?.toLocaleString() || '0'}
              </span>
            </div>
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              <User className="text-gray-600 w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      <main className="grid lg:grid-cols-3 gap-8">
        {/* Quiz Categories Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SportIQ!</h2>
              <p className="text-gray-600">Test your sports knowledge and climb the leaderboard</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-100">
              <img 
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
                alt="Sports equipment and gear" 
                className="w-full h-48 object-cover rounded-lg shadow-md mb-4"
              />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Play?</h3>
              <p className="text-gray-600 mb-4">Choose your favorite sport category and start your quiz journey!</p>
              
              <div className="flex gap-3">
                <Link href="/multiplayer" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" data-testid="button-multiplayer">
                    <Users className="w-4 h-4 mr-2" />
                    Join Multiplayer
                  </Button>
                </Link>
                <Link href="/quiz/football" className="flex-1">
                  <Button variant="outline" className="w-full border-sports-blue text-sports-blue hover:bg-sports-blue hover:text-white" data-testid="button-solo-quiz">
                    <Trophy className="w-4 h-4 mr-2" />
                    Solo Quiz
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quiz Categories */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Choose Your Challenge</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories?.map((category: string) => (
                <Link key={category} href={`/quiz/${category.toLowerCase()}`}>
                  <button 
                    className={`p-4 bg-gradient-to-br rounded-xl transition-all group w-full ${
                      categoryColors[category as keyof typeof categoryColors] || 
                      "from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700"
                    }`}
                    data-testid={`button-category-${category.toLowerCase()}`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                        {categoryIcons[category as keyof typeof categoryIcons] || "🏆"}
                      </div>
                      <p className="font-semibold text-sm">{category}</p>
                      <p className="text-xs opacity-75">Start Quiz</p>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-sports-blue">0</div>
                <div className="text-sm text-gray-600">Quizzes Taken</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-sports-green">0%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-sports-purple">0</div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Score */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Score</h3>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-sports-blue to-sports-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white" data-testid="text-total-score">
                  {user!.totalPoints}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Points</p>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm font-semibold text-sports-blue">Ready to start!</p>
              </div>
            </div>
          </div>

          <Leaderboard users={leaderboard || []} currentUser={user!} />

          {/* How to Play */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">How to Play</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-sports-blue rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                <span>Choose a sports category</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-sports-blue rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                <span>Answer multiple choice questions</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-sports-blue rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
                <span>Earn points for correct answers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-sports-blue rounded-full flex items-center justify-center text-white font-bold text-xs">4</div>
                <span>Climb the leaderboard!</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <Link href="/quiz/football">
        <button 
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-sports-blue to-sports-purple text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          data-testid="button-start-quiz"
        >
          <span className="text-2xl">+</span>
        </button>
      </Link>
    </div>
  );
}
