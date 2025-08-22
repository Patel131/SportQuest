import { Crown, User } from "lucide-react";

interface User {
  id: string;
  username: string;
  totalPoints: number;
}

interface LeaderboardProps {
  users: User[];
  currentUser: User;
}

export default function Leaderboard({ users, currentUser }: LeaderboardProps) {
  const sortedUsers = [...users].sort((a, b) => b.totalPoints - a.totalPoints);
  const currentUserRank = sortedUsers.findIndex(user => user.id === currentUser.id) + 1;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Leaderboard</h3>
        <button className="text-sm text-sports-blue hover:text-blue-600 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {sortedUsers.slice(0, 3).map((user, index) => (
          <div 
            key={user.id}
            className={`flex items-center space-x-3 p-3 rounded-xl ${
              index === 0 
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                : 'bg-gray-50'
            }`}
            data-testid={`leaderboard-rank-${index + 1}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index === 0 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                : 'bg-gray-300'
            }`}>
              <span className={`text-sm font-bold ${
                index === 0 ? 'text-white' : 'text-gray-600'
              }`}>
                {index + 1}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800" data-testid={`text-username-${index + 1}`}>
                {user.username}
              </p>
              <p className="text-sm text-gray-600" data-testid={`text-points-${index + 1}`}>
                {user.totalPoints.toLocaleString()} pts
              </p>
            </div>
            {index === 0 && <Crown className="text-yellow-500 w-5 h-5" />}
          </div>
        ))}
        
        {/* Current User Position (if not in top 3) */}
        {currentUserRank > 3 && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border-2 border-sports-blue">
              <div className="w-8 h-8 bg-sports-blue rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{currentUserRank}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800" data-testid="text-current-user">
                  {currentUser.username}
                </p>
                <p className="text-sm text-gray-600" data-testid="text-current-user-points">
                  {currentUser.totalPoints.toLocaleString()} pts
                </p>
              </div>
              <User className="text-sports-blue w-5 h-5" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
