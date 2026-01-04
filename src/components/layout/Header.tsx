import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase-helpers';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Code2, 
  LogOut, 
  User, 
  Trophy, 
  Shield, 
  Menu,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const Header = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-xl font-bold gradient-text hidden sm:block">CodeCommunity</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/modules" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Modules
          </Link>
          <Link to="/learn" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Learn
          </Link>
          <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Leaderboard
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8 border-2 border-primary/50">
                    <AvatarFallback className="bg-secondary text-foreground text-sm font-semibold">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium">{profile?.username || 'User'}</span>
                    <span className="text-xs text-primary">{profile?.points || 0} pts</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/leaderboard" className="flex items-center gap-2 cursor-pointer">
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem asChild>
                <Link to="/modules">Modules</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/learn">Learn</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/leaderboard">Leaderboard</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">Admin</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
