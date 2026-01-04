import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
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
  Brain
} from 'lucide-react';

interface SectionWithContent extends Section {
  content: SubmissionWithAuthor | null;
}

interface LessonWithSections extends Lesson {
  sections: SectionWithContent[];
}

interface ModuleWithLessons extends Module {
  lessons: LessonWithSections[];
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

const Modules = () => {
  const [modulesData, setModulesData] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    
    const modules = await getModules();
    
    // Load all data in parallel
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await getLessons(module.id);
        
        const lessonsWithSections = await Promise.all(
          lessons.map(async (lesson) => {
            const sections = await getSections(lesson.id);
            
            const sectionsWithContent = await Promise.all(
              sections.map(async (section) => {
                const content = await getApprovedSubmission(section.id);
                return { ...section, content };
              })
            );
            
            return { ...lesson, sections: sectionsWithContent };
          })
        );
        
        return { ...module, lessons: lessonsWithSections };
      })
    );
    
    setModulesData(modulesWithLessons);
    setLoading(false);
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Learning Modules</h1>
          <p className="text-muted-foreground text-lg">
            Explore all available modules and lessons
          </p>
        </div>

        {/* Modules */}
        <div className="space-y-12">
          {modulesData.map((module) => {
            const Icon = getIcon(module.icon);
            
            return (
              <div key={module.id}>
                {/* Module Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{module.title}</h2>
                    {module.description && (
                      <p className="text-muted-foreground">{module.description}</p>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                <div className="space-y-6 ml-6 border-l-2 border-border pl-6">
                  {module.lessons.length === 0 ? (
                    <p className="text-muted-foreground italic">No lessons available</p>
                  ) : (
                    module.lessons.map((lesson) => (
                      <Card key={lesson.id} className="glass border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            {lesson.title}
                          </CardTitle>
                          {lesson.description && (
                            <p className="text-muted-foreground text-sm">{lesson.description}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          {lesson.sections.length === 0 ? (
                            <div className="text-center py-6">
                              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">Lesson not ready yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
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
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {modulesData.length === 0 && (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Modules Available</h3>
              <p className="text-muted-foreground">
                Check back later for new learning content.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Modules;
