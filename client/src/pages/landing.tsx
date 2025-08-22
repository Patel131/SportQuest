import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Brain, Target } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-sports-blue to-sports-purple rounded-2xl flex items-center justify-center">
              <Trophy className="text-white text-2xl" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Welcome to <span className="bg-gradient-to-r from-sports-blue to-sports-purple bg-clip-text text-transparent">SportIQ</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Test your sports knowledge across Football, Basketball, Soccer, and Baseball. 
            Compete with friends, earn points, and climb the leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-sports-blue to-sports-purple hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Get Started - Login with Replit
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-sports-blue text-sports-blue hover:bg-sports-blue hover:text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = "/demo/football"}
              data-testid="button-demo"
            >
              Try Demo Quiz
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="text-sports-blue w-6 h-6" />
              </div>
              <CardTitle>Test Your Knowledge</CardTitle>
              <CardDescription>
                Challenge yourself with questions across multiple sports categories
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-sports-green w-6 h-6" />
              </div>
              <CardTitle>Compete & Connect</CardTitle>
              <CardDescription>
                Join a community of sports fans and climb the global leaderboard
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="text-sports-orange w-6 h-6" />
              </div>
              <CardTitle>Earn Points & Achievements</CardTitle>
              <CardDescription>
                Score points for correct answers and unlock special achievements
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Sports Categories */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Quiz Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Football", emoji: "🏈", color: "from-blue-500 to-blue-600" },
              { name: "Basketball", emoji: "🏀", color: "from-orange-500 to-orange-600" },
              { name: "Soccer", emoji: "⚽", color: "from-green-500 to-green-600" },
              { name: "Baseball", emoji: "⚾", color: "from-red-500 to-red-600" }
            ].map((sport) => (
              <div key={sport.name} className={`bg-gradient-to-br ${sport.color} rounded-xl p-6 text-white shadow-lg`}>
                <div className="text-4xl mb-3">{sport.emoji}</div>
                <h3 className="font-semibold text-lg">{sport.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Test Your Sports IQ?</h3>
          <p className="text-gray-600 mb-6">
            Join thousands of sports fans already competing on SportIQ
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-sports-blue to-sports-purple hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-xl"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login-cta"
          >
            Start Your First Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}