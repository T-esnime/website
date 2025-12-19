import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getLeaderboard, Profile } from '@/lib/supabase-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal, Crown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getLeaderboard(50);
    setLeaders(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground">
            Top contributors in the community
          </p>
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12">
            {/* Second Place */}
            {top3[1] && (
              <div className="order-2 md:order-1 w-full md:w-48">
                <div className={cn(
                  "glass rounded-2xl p-6 text-center relative",
                  top3[1].id === user?.id && "border-primary/50"
                )}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 rounded-full bg-gray-400/20 flex items-center justify-center">
                      <Medal className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-gray-400/30">
                    <AvatarFallback className="bg-gray-400/20 text-gray-400 text-xl font-bold">
                      {top3[1].username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold truncate">{top3[1].username}</h3>
                  <p className="text-2xl font-bold text-gray-400">{top3[1].points}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                </div>
              </div>
            )}

            {/* First Place */}
            {top3[0] && (
              <div className="order-1 md:order-2 w-full md:w-56">
                <div className={cn(
                  "glass rounded-2xl p-8 text-center relative border-yellow-500/30",
                  top3[0].id === user?.id && "border-primary/50"
                )}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse-glow">
                      <Crown className="w-7 h-7 text-yellow-500" />
                    </div>
                  </div>
                  <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-yellow-500/30">
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-500 text-2xl font-bold">
                      {top3[0].username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold truncate">{top3[0].username}</h3>
                  <p className="text-3xl font-bold text-yellow-500">{top3[0].points}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                </div>
              </div>
            )}

            {/* Third Place */}
            {top3[2] && (
              <div className="order-3 w-full md:w-48">
                <div className={cn(
                  "glass rounded-2xl p-6 text-center relative",
                  top3[2].id === user?.id && "border-primary/50"
                )}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-amber-600/30">
                    <AvatarFallback className="bg-amber-600/20 text-amber-600 text-xl font-bold">
                      {top3[2].username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold truncate">{top3[2].username}</h3>
                  <p className="text-2xl font-bold text-amber-600">{top3[2].points}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rest of Leaderboard */}
        {rest.length > 0 && (
          <Card className="glass border-border/50 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rest.map((leader, index) => (
                  <div
                    key={leader.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors",
                      leader.id === user?.id 
                        ? "bg-primary/10 border border-primary/30" 
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                      {index + 4}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary text-foreground">
                        {leader.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {leader.username}
                        {leader.id === user?.id && (
                          <span className="text-primary ml-2 text-sm">(You)</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{leader.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {leaders.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground">
              Be the first to contribute and claim the top spot!
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
