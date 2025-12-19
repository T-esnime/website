import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  Code2, 
  Users, 
  Trophy, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Star,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) => (
  <div className="group glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{value}</div>
    <div className="text-muted-foreground text-sm">{label}</div>
  </div>
);

const Index = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Community-Driven Learning</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up">
              Learn IT Skills{' '}
              <span className="gradient-text">Together</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              A collaborative platform where the community creates the curriculum. 
              Submit content, earn points, and climb the leaderboard while mastering tech skills.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {user ? (
                <>
                  <Button size="xl" variant="hero" asChild>
                    <Link to="/learn">
                      Start Learning <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <Link to="/dashboard">View Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="xl" variant="hero" asChild>
                    <Link to="/auth?mode=signup">
                      Get Started Free <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <Link to="/learn">Browse Content</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float opacity-20">
          <Code2 className="w-16 h-16 text-primary" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float opacity-20" style={{ animationDelay: '1s' }}>
          <Trophy className="w-12 h-12 text-accent" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCard value="3" label="Modules" />
            <StatCard value="9" label="Lessons" />
            <StatCard value="36" label="Sections" />
            <StatCard value="∞" label="Possibilities" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A revolutionary approach to learning where you're not just a student—you're a teacher too.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={BookOpen}
              title="Structured Learning"
              description="Navigate through modules, lessons, and sections organized by the community for optimal learning paths."
            />
            <FeatureCard
              icon={Users}
              title="Community Content"
              description="Anyone can submit content for any section. Your knowledge helps others learn and grows the platform."
            />
            <FeatureCard
              icon={Target}
              title="Quality Control"
              description="Admins review submissions to ensure accuracy and quality before content goes live."
            />
            <FeatureCard
              icon={Trophy}
              title="Gamification"
              description="Earn points for contributions, receive upvotes, and compete on the leaderboard."
            />
          </div>
        </div>
      </section>

      {/* Points System */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Earn <span className="gradient-text">Points</span>
              </h2>
              <p className="text-muted-foreground">
                Get rewarded for contributing to the community
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { action: 'Daily Login', points: '+2', icon: Zap },
                { action: 'Submit Content', points: '+10', icon: BookOpen },
                { action: 'Content Approved', points: '+20', icon: Star },
                { action: 'Receive Upvote', points: '+2', icon: Trophy },
                { action: 'Vote on Content', points: '+1', icon: Users },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 glass rounded-xl hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.action}</div>
                  </div>
                  <div className="text-primary font-bold">{item.points}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-8 md:p-12 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join the community, contribute your knowledge, and learn alongside thousands of developers.
            </p>
            <Button size="xl" variant="hero" asChild>
              <Link to={user ? '/learn' : '/auth?mode=signup'}>
                {user ? 'Continue Learning' : 'Join Now'} <ChevronRight className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">CodeCommunity</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Built with ❤️ by the community
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Index;
