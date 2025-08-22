import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Trophy, Users, Clock, ArrowLeft, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import QuizCard from "@/components/quiz-card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Player {
  id: string;
  username: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
}

interface MultiplayerRoom {
  id: string;
  name: string;
  category: string;
  maxPlayers: number;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  timeRemaining: number;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
}

export default function Multiplayer() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  
  const [gameState, setGameState] = useState<'lobby' | 'room' | 'playing' | 'results'>('lobby');
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<MultiplayerRoom[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("football");

  // Auth check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access multiplayer features.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isAuthLoading, toast]);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to multiplayer server");
      ws.send(JSON.stringify({ type: 'join_lobby', userId: user.id, username: user.firstName || user.email }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      console.log("Disconnected from multiplayer server");
      toast({
        title: "Connection Lost",
        description: "Reconnecting to multiplayer server...",
        variant: "destructive",
      });
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated, user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'rooms_list':
        setAvailableRooms(data.rooms);
        break;
      case 'room_joined':
        setCurrentRoom(data.room);
        setGameState('room');
        break;
      case 'room_updated':
        setCurrentRoom(data.room);
        break;
      case 'game_started':
        setCurrentRoom(data.room);
        setGameState('playing');
        break;
      case 'question':
        setCurrentQuestion(data.question);
        setSelectedAnswer(null);
        break;
      case 'round_results':
        // Show round results if needed
        break;
      case 'game_finished':
        setCurrentRoom(data.room);
        setGameState('results');
        break;
      case 'error':
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
        break;
    }
  };

  const createRoom = () => {
    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter a name for your room.",
        variant: "destructive",
      });
      return;
    }

    wsRef.current?.send(JSON.stringify({
      type: 'create_room',
      roomName: roomName.trim(),
      category: selectedCategory,
      maxPlayers: 4
    }));
  };

  const joinRoom = (roomId: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'join_room',
      roomId
    }));
  };

  const leaveRoom = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'leave_room'
    }));
    setCurrentRoom(null);
    setGameState('lobby');
  };

  const startGame = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'start_game'
    }));
  };

  const submitAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    wsRef.current?.send(JSON.stringify({
      type: 'submit_answer',
      answerIndex,
      timeRemaining: currentRoom?.timeRemaining || 0
    }));
  };

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sports-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading multiplayer...</p>
        </div>
      </div>
    );
  }

  const renderLobby = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          <Zap className="inline-block w-8 h-8 mr-2 text-yellow-500" />
          Professional Multiplayer
        </h1>
        <p className="text-gray-600">Compete with other players in real-time quiz battles!</p>
      </div>

      {/* Create Room */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Room</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            data-testid="input-room-name"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sports-blue focus:border-transparent"
            data-testid="select-category"
          >
            {categories?.map((category: string) => (
              <option key={category} value={category.toLowerCase()}>
                {category}
              </option>
            ))}
          </select>
          <Button 
            onClick={createRoom}
            className="bg-sports-blue hover:bg-blue-700"
            data-testid="button-create-room"
          >
            Create Room
          </Button>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Available Rooms</h2>
        {availableRooms.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No rooms available. Create one to get started!</p>
        ) : (
          <div className="grid gap-4">
            {availableRooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-sports-blue transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-sports-blue to-sports-purple rounded-xl flex items-center justify-center">
                    <Users className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <p className="text-sm text-gray-600">
                      {room.category} • {room.players.length}/{room.maxPlayers} players
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={room.status === 'waiting' ? 'secondary' : 'destructive'}>
                    {room.status}
                  </Badge>
                  <Button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.players.length >= room.maxPlayers || room.status !== 'waiting'}
                    size="sm"
                    data-testid={`button-join-room-${room.id}`}
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRoom = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{currentRoom?.name}</h1>
          <Button onClick={leaveRoom} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Players ({currentRoom?.players.length}/{currentRoom?.maxPlayers})
            </h2>
            <div className="space-y-3">
              {currentRoom?.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {player.isHost && <Crown className="w-5 h-5 text-yellow-500" />}
                    <span className="font-medium">{player.username}</span>
                  </div>
                  <Badge variant={player.isReady ? 'secondary' : 'outline'}>
                    {player.isReady ? 'Ready' : 'Not Ready'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Game Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Game Settings</h2>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span>Category:</span>
                <span className="font-medium capitalize">{currentRoom?.category}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span>Questions:</span>
                <span className="font-medium">10</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span>Time per question:</span>
                <span className="font-medium">30 seconds</span>
              </div>
            </div>

            {currentRoom?.players.find(p => p.id === user.id)?.isHost && (
              <Button 
                onClick={startGame}
                className="w-full mt-6 bg-sports-green hover:bg-green-700"
                disabled={currentRoom.players.length < 2 || !currentRoom.players.every(p => p.isReady)}
                data-testid="button-start-game"
              >
                Start Game
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaying = () => (
    <div className="max-w-4xl mx-auto">
      {/* Game Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Question {(currentRoom?.currentQuestionIndex || 0) + 1} of 10
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sports-orange" />
              <span className="font-mono text-lg">{currentRoom?.timeRemaining || 0}s</span>
            </div>
          </div>
        </div>
        <Progress 
          value={((currentRoom?.currentQuestionIndex || 0) + 1) / 10 * 100} 
          className="mt-2" 
        />
      </div>

      {/* Live Leaderboard */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Live Scores</h2>
        <div className="flex justify-between">
          {currentRoom?.players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-1 ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div className="text-sm font-medium">{player.username}</div>
                <div className="text-sm text-gray-600">{player.score} pts</div>
              </div>
            ))}
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <QuizCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={submitAnswer}
          showResult={false}
          questionNumber={(currentRoom?.currentQuestionIndex || 0) + 1}
          totalQuestions={10}
        />
      )}
    </div>
  );

  const renderResults = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Game Complete!</h1>
        
        <div className="space-y-4 mb-8">
          {currentRoom?.players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className={`flex items-center justify-between p-4 rounded-xl ${
                index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold">{player.username}</span>
                  {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                </div>
                <span className="text-xl font-bold">{player.score}</span>
              </div>
            ))}
        </div>

        <div className="flex justify-center space-x-4">
          <Button onClick={() => {
            setGameState('lobby');
            setCurrentRoom(null);
          }}>
            Back to Lobby
          </Button>
          <Button onClick={() => navigate("/")} variant="outline">
            Home
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{user?.totalPoints || 0} points</span>
          </div>
        </div>

        {gameState === 'lobby' && renderLobby()}
        {gameState === 'room' && renderRoom()}
        {gameState === 'playing' && renderPlaying()}
        {gameState === 'results' && renderResults()}
      </div>
    </div>
  );
}