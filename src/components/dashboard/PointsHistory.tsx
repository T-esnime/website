import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PointsLog } from '@/lib/supabase-helpers';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { 
  LogIn, 
  FileText, 
  CheckCircle2, 
  ThumbsUp, 
  Vote,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsHistoryProps {
  pointsLog: PointsLog[];
}

const reasonIcons: Record<string, React.ElementType> = {
  'Daily login bonus': LogIn,
  'Content submission': FileText,
  'Submission approved': CheckCircle2,
  'Received upvote': ThumbsUp,
  'Voted on submission': Vote,
};

const reasonColors: Record<string, string> = {
  'Daily login bonus': 'bg-primary/20 text-primary',
  'Content submission': 'bg-accent/20 text-accent',
  'Submission approved': 'bg-success/20 text-success',
  'Received upvote': 'bg-warning/20 text-warning',
  'Voted on submission': 'bg-muted text-muted-foreground',
};

export function PointsHistory({ pointsLog }: PointsHistoryProps) {
  // Calculate cumulative points over time for the chart
  const chartData = useMemo(() => {
    if (pointsLog.length === 0) return [];
    
    // Sort by date ascending for the chart
    const sorted = [...pointsLog].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    let cumulative = 0;
    const data = sorted.map((log) => {
      cumulative += log.points;
      return {
        date: format(parseISO(log.created_at), 'MMM d'),
        fullDate: format(parseISO(log.created_at), 'MMM d, yyyy'),
        points: log.points,
        total: cumulative,
      };
    });
    
    return data;
  }, [pointsLog]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-border/50">
          <p className="text-sm font-medium">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-primary font-semibold">
            Total: {payload[0].value} pts
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Points Evolution Chart */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Points Evolution</CardTitle>
          </div>
          <CardDescription>Your points growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(25 95% 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(25 95% 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(0 0% 55%)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(0 0% 55%)', fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(25 95% 53%)"
                    strokeWidth={2}
                    fill="url(#pointsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <p>No points data yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points History Timeline */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg">Points History</CardTitle>
          </div>
          <CardDescription>How you earned your points</CardDescription>
        </CardHeader>
        <CardContent>
          {pointsLog.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {pointsLog.map((log) => {
                const Icon = reasonIcons[log.reason] || Zap;
                const colorClass = reasonColors[log.reason] || 'bg-muted text-muted-foreground';
                
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(log.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-primary">
                        +{log.points}
                      </span>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No points earned yet. Start contributing!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
