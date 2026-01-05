import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSubmissions, getLeaderboard, getPointsHistory, Submission, Profile, PointsLog } from '@/lib/supabase-helpers';
import { BlockRenderer } from '@/components/block-editor/BlockRenderer';
import { PointsHistory } from '@/components/dashboard/PointsHistory';
import { 
  Trophy, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'primary' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color?: 'primary' | 'success' | 'warning' | 'accent';
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <Card className="glass border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [pointsLog, setPointsLog] = useState<PointsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    const [userSubmissions, leaders, history] = await Promise.all([
      getUserSubmissions(user.id),
      getLeaderboard(100),
      getPointsHistory(user.id)
    ]);
    
    setSubmissions(userSubmissions);
    setLeaderboard(leaders);
    setPointsLog(history);
    
    // Find user rank
    const rank = leaders.findIndex(p => p.id === user.id);
    setUserRank(rank >= 0 ? rank + 1 : null);
    
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const statusIcon = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
  };

  const statusColor = {
    pending: 'bg-warning/20 text-warning',
    approved: 'bg-success/20 text-success',
    rejected: 'bg-destructive/20 text-destructive',
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{profile.username}</span>
          </h1>
          <p className="text-muted-foreground">
            Track your progress and contributions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Trophy} 
            label="Total Points" 
            value={profile.points} 
            color="primary" 
          />
          <StatCard 
            icon={Award} 
            label="Your Rank" 
            value={userRank ? `#${userRank}` : '-'} 
            color="accent" 
          />
          <StatCard 
            icon={FileText} 
            label="Submissions" 
            value={submissions.length} 
            color="success" 
          />
          <StatCard 
            icon={CheckCircle2} 
            label="Approved" 
            value={approvedCount} 
            color="success" 
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Submissions */}
          <div className="lg:col-span-2">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Submissions</CardTitle>
                  <CardDescription>Track the status of your contributions</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/learn">
                    Submit Content <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">No Submissions Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Start contributing to earn points and help the community!
                    </p>
                    <Button variant="hero" asChild>
                      <Link to="/learn">Browse Sections</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map((submission) => {
                      const StatusIcon = statusIcon[submission.status];
                      return (
                        <div
                          key={submission.id}
                          className="p-4 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-4 mb-3">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", statusColor[submission.status])}>
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground">
                                {new Date(submission.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant="secondary"
                              className={cn("capitalize shrink-0", statusColor[submission.status])}
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          <div className="max-h-32 overflow-hidden relative">
                            <BlockRenderer content={submission.content} className="text-sm" />
                            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-secondary/50 to-transparent" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Preview */}
          <div className="space-y-6">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Leaderboard</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/leaderboard">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((leader, index) => (
                    <div
                      key={leader.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg",
                        leader.id === user.id && "bg-primary/10"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        index === 0 && "bg-yellow-500/20 text-yellow-500",
                        index === 1 && "bg-gray-400/20 text-gray-400",
                        index === 2 && "bg-amber-600/20 text-amber-600",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <span className="flex-1 truncate text-sm font-medium">
                        {leader.username}
                        {leader.id === user.id && (
                          <span className="text-primary ml-1">(You)</span>
                        )}
                      </span>
                      <span className="text-sm text-primary font-semibold">
                        {leader.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Points History Section */}
        <div className="mt-8">
          <PointsHistory pointsLog={pointsLog} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
