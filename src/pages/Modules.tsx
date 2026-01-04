import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockRenderer } from '@/components/block-editor';
import { 
  getModules, 
  getLessons, 
  getSections, 
  getApprovedSubmission,
  Module, 
  Lesson, 
  Section,
  SubmissionWithAuthor
} from '@/lib/supabase-helpers';
import { 
  Loader2,
  BookOpen,
  FileText,
  User,
  Layers,
  GraduationCap,
  Code,
  Lightbulb,
  Rocket,
  Target,
  Zap,
  Brain,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

interface SectionWithContent extends Section {
  content: SubmissionWithAuthor | null;
}

interface LessonWithSections extends Lesson {
  sections: SectionWithContent[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Layers,
  GraduationCap,
  Code,
  Lightbulb,
  Rocket,
  Target,
  Zap,
  Brain,
};

type ViewState = 
  | { type: 'modules' }
  | { type: 'lessons'; module: Module; lessons: Lesson[] }
  | { type: 'lesson'; module: Module; lesson: LessonWithSections };

const Modules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ type: 'modules' });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    const data = await getModules();
    setModules(data);
    setLoading(false);
  };

  const openModule = async (module: Module) => {
    setLoading(true);
    const lessons = await getLessons(module.id);
    setViewState({ type: 'lessons', module, lessons });
    setLoading(false);
  };

  const openLesson = async (module: Module, lesson: Lesson) => {
    setLoading(true);
    const sections = await getSections(lesson.id);
    
    const sectionsWithContent = await Promise.all(
      sections.map(async (section) => {
        const content = await getApprovedSubmission(section.id);
        return { ...section, content };
      })
    );
    
    setViewState({ 
      type: 'lesson', 
      module, 
      lesson: { ...lesson, sections: sectionsWithContent } 
    });
    setLoading(false);
  };

  const goBack = () => {
    if (viewState.type === 'lesson') {
      openModule(viewState.module);
    } else if (viewState.type === 'lessons') {
      setViewState({ type: 'modules' });
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return BookOpen;
    return iconMap[iconName] || BookOpen;
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

  // Lesson View - show all sections with content
  if (viewState.type === 'lesson') {
    const { module, lesson } = viewState;
    const Icon = getIcon(module.icon);

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {module.title}
          </Button>

          {/* Lesson Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{module.title}</p>
              <h1 className="text-2xl md:text-3xl font-bold">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-muted-foreground mt-1">{lesson.description}</p>
              )}
            </div>
          </div>

          {/* Sections */}
          {lesson.sections.length === 0 ? (
            <Card className="glass border-border/50">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Lesson not ready yet</h3>
                <p className="text-muted-foreground">
                  Check back later for content.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lesson.sections.map((section, index) => (
                <div 
                  key={section.id} 
                  className="border border-border/50 rounded-lg p-4 bg-background/50"
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold">{section.title}</h4>
                  </div>
                  
                  {section.description && (
                    <p className="text-muted-foreground text-sm mb-3">{section.description}</p>
                  )}

                  {section.content ? (
                    <div>
                      {/* Author attribution */}
                      {section.content.author_username && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <User className="w-3 h-3" />
                          <span>
                            Contributed by{' '}
                            <span className="font-medium text-foreground">
                              {section.content.author_username}
                            </span>
                          </span>
                        </div>
                      )}
                      
                      {/* Rendered content */}
                      <BlockRenderer content={section.content.content} />
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-muted/30 rounded-md">
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-muted-foreground text-sm">
                        Lesson not ready yet
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Lessons View - show lessons in a module
  if (viewState.type === 'lessons') {
    const { module, lessons } = viewState;
    const Icon = getIcon(module.icon);

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>

          {/* Module Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{module.title}</h1>
              {module.description && (
                <p className="text-muted-foreground">{module.description}</p>
              )}
            </div>
          </div>

          {/* Lessons List */}
          {lessons.length === 0 ? (
            <Card className="glass border-border/50">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Lessons Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new lessons.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <Card 
                  key={lesson.id} 
                  className="glass border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openLesson(module, lesson)}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-muted-foreground text-sm">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Modules View - show all modules
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Learning Modules</h1>
          <p className="text-muted-foreground text-lg">
            Explore all available modules and lessons
          </p>
        </div>

        {modules.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Modules Available</h3>
              <p className="text-muted-foreground">
                Check back later for new learning content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module) => {
              const Icon = getIcon(module.icon);
              
              return (
                <Card 
                  key={module.id} 
                  className="glass border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openModule(module)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{module.title}</CardTitle>
                        {module.description && (
                          <p className="text-muted-foreground text-sm mt-1">{module.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Modules;
