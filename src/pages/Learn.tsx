import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlockRenderer } from '@/components/block-editor';
import { 
  getModules, 
  getLessons, 
  getSections, 
  getApprovedSubmission,
  getVotes,
  voteOnSubmission,
  Module, 
  Lesson, 
  Section,
  Submission
} from '@/lib/supabase-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Globe, 
  Server, 
  Cloud, 
  ChevronRight, 
  BookOpen,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Server,
  Cloud,
};

const Learn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionContent, setSectionContent] = useState<Submission | null>(null);
  const [votes, setVotes] = useState<{ upvotes: number; downvotes: number; userVote: number | null }>({ upvotes: 0, downvotes: 0, userVote: null });
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const moduleId = searchParams.get('module');
  const lessonId = searchParams.get('lesson');
  const sectionId = searchParams.get('section');

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (moduleId && modules.length > 0) {
      const mod = modules.find(m => m.id === moduleId);
      if (mod) {
        setSelectedModule(mod);
        loadLessons(moduleId);
      }
    } else {
      setSelectedModule(null);
      setLessons([]);
    }
  }, [moduleId, modules]);

  useEffect(() => {
    if (lessonId && lessons.length > 0) {
      const les = lessons.find(l => l.id === lessonId);
      if (les) {
        setSelectedLesson(les);
        loadSections(lessonId);
      }
    } else {
      setSelectedLesson(null);
      setSections([]);
    }
  }, [lessonId, lessons]);

  useEffect(() => {
    if (sectionId && sections.length > 0) {
      const sec = sections.find(s => s.id === sectionId);
      if (sec) {
        setSelectedSection(sec);
        loadSectionContent(sectionId);
      }
    } else {
      setSelectedSection(null);
      setSectionContent(null);
    }
  }, [sectionId, sections]);

  const loadModules = async () => {
    setLoading(true);
    const data = await getModules();
    setModules(data);
    setLoading(false);
  };

  const loadLessons = async (modId: string) => {
    const data = await getLessons(modId);
    setLessons(data);
  };

  const loadSections = async (lesId: string) => {
    const data = await getSections(lesId);
    setSections(data);
  };

  const loadSectionContent = async (secId: string) => {
    const data = await getApprovedSubmission(secId);
    setSectionContent(data);
    
    // Load votes if there's content
    if (data) {
      const votesData = await getVotes(data.id, user?.id);
      setVotes(votesData);
    } else {
      setVotes({ upvotes: 0, downvotes: 0, userVote: null });
    }
  };
  
  const handleVote = async (voteType: 1 | -1) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }
    
    if (!sectionContent) return;
    
    setVoting(true);
    const { action, error } = await voteOnSubmission(sectionContent.id, user.id, voteType);
    
    if (error) {
      toast.error('Failed to vote');
    } else {
      // Reload votes
      const votesData = await getVotes(sectionContent.id, user.id);
      setVotes(votesData);
      
      if (action === 'created') {
        toast.success('+1 point for voting!');
      } else if (action === 'removed') {
        toast.success('Vote removed');
      } else {
        toast.success('Vote updated');
      }
    }
    
    setVoting(false);
  };

  const navigateToModule = (modId: string) => {
    setSearchParams({ module: modId });
  };

  const navigateToLesson = (lesId: string) => {
    setSearchParams({ module: moduleId!, lesson: lesId });
  };

  const navigateToSection = (secId: string) => {
    setSearchParams({ module: moduleId!, lesson: lessonId!, section: secId });
  };

  const goBack = () => {
    if (sectionId) {
      setSearchParams({ module: moduleId!, lesson: lessonId! });
    } else if (lessonId) {
      setSearchParams({ module: moduleId! });
    } else {
      setSearchParams({});
    }
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

  // Section View
  if (selectedSection) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => setSearchParams({})} className="hover:text-foreground transition-colors">
              Modules
            </button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => setSearchParams({ module: moduleId! })} className="hover:text-foreground transition-colors">
              {selectedModule?.title}
            </button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => setSearchParams({ module: moduleId!, lesson: lessonId! })} className="hover:text-foreground transition-colors">
              {selectedLesson?.title}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{selectedSection.title}</span>
          </div>

          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {selectedLesson?.title}
          </Button>

          <Card className="glass border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedSection.title}</CardTitle>
                  {selectedSection.description && (
                    <CardDescription className="mt-2">{selectedSection.description}</CardDescription>
                  )}
                </div>
                {sectionContent && (
                  <Badge variant="secondary" className="bg-success/20 text-success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Has Content
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sectionContent ? (
                <div>
                  <BlockRenderer content={sectionContent.content} />
                  
                  {/* Voting UI */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Was this helpful?</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={votes.userVote === 1 ? "success" : "outline"}
                            size="sm"
                            onClick={() => handleVote(1)}
                            disabled={voting}
                            className="gap-1"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {votes.upvotes}
                          </Button>
                          <Button
                            variant={votes.userVote === -1 ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleVote(-1)}
                            disabled={voting}
                            className="gap-1"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            {votes.downvotes}
                          </Button>
                        </div>
                      </div>
                      {!user && (
                        <span className="text-xs text-muted-foreground">
                          <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to vote
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    This section is waiting for community contributions.
                  </p>
                  {user ? (
                    <Button variant="hero" asChild>
                      <Link to={`/submit?section=${selectedSection.id}`}>
                        Submit Content
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="hero" asChild>
                      <Link to="/auth?mode=signup">
                        Sign Up to Contribute
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {sectionContent && user && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">
                    Have a better explanation? Submit your own version!
                  </p>
                  <Button variant="outline" asChild>
                    <Link to={`/submit?section=${selectedSection.id}`}>
                      Submit Alternative
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Lesson View (Sections List)
  if (selectedLesson) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => setSearchParams({})} className="hover:text-foreground transition-colors">
              Modules
            </button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => setSearchParams({ module: moduleId! })} className="hover:text-foreground transition-colors">
              {selectedModule?.title}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{selectedLesson.title}</span>
          </div>

          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {selectedModule?.title}
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{selectedLesson.title}</h1>
            {selectedLesson.description && (
              <p className="text-muted-foreground">{selectedLesson.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => navigateToSection(section.id)}
                className="w-full glass rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all text-left group"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                  section.approved_submission_id ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                )}>
                  {section.approved_submission_id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Module View (Lessons List)
  if (selectedModule) {
    const IconComponent = iconMap[selectedModule.icon || 'BookOpen'] || BookOpen;
    
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => setSearchParams({})} className="hover:text-foreground transition-colors">
              Modules
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{selectedModule.title}</span>
          </div>

          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{selectedModule.title}</h1>
              {selectedModule.description && (
                <p className="text-muted-foreground mt-1">{selectedModule.description}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => navigateToLesson(lesson.id)}
                className="glass rounded-xl p-6 flex items-center gap-4 hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="text-muted-foreground text-sm mt-1">{lesson.description}</p>
                  )}
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Modules List View
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Learning <span className="gradient-text">Modules</span>
          </h1>
          <p className="text-muted-foreground">
            Choose a module to start learning. Content is created by the community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = iconMap[module.icon || 'BookOpen'] || BookOpen;
            
            return (
              <Card 
                key={module.id}
                className="glass border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigateToModule(module.id)}
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                  {module.description && (
                    <CardDescription>{module.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Explore module</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Learn;
