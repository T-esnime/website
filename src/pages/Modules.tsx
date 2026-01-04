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
  FileText,
  User,
  BookOpen
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

const Modules = () => {
  const [modulesWithContent, setModulesWithContent] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    setLoading(true);
    
    const modules = await getModules();
    
    const modulesData = await Promise.all(
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
    
    setModulesWithContent(modulesData);
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

  if (modulesWithContent.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Modules Available</h1>
          <p className="text-muted-foreground">Check back later for learning content.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">All Lessons</h1>
          <p className="text-muted-foreground text-lg">Browse all available learning content</p>
        </div>

        {/* Modules */}
        <div className="space-y-12">
          {modulesWithContent.map((module) => (
            <div key={module.id}>
              {/* Module Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {module.icon && <span className="text-2xl">{module.icon}</span>}
                  <h2 className="text-2xl font-bold">{module.title}</h2>
                </div>
                {module.description && (
                  <p className="text-muted-foreground">{module.description}</p>
                )}
              </div>

              {/* Lessons */}
              <div className="space-y-8">
                {module.lessons.map((lesson) => (
                  <Card key={lesson.id} className="glass border-border/50">
                    <CardHeader className="border-b border-border/50 bg-muted/30">
                      <CardTitle className="text-xl">{lesson.title}</CardTitle>
                      {lesson.description && (
                        <p className="text-muted-foreground text-sm">{lesson.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Sections */}
                      <div className="space-y-6">
                        {lesson.sections.map((section, index) => (
                          <div key={section.id} className="border-l-2 border-primary/30 pl-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {index + 1}
                              </div>
                              <h3 className="font-semibold">{section.title}</h3>
                            </div>
                            
                            {section.description && (
                              <p className="text-muted-foreground text-sm mb-3">{section.description}</p>
                            )}

                            {section.content ? (
                              <div>
                                {/* Author attribution */}
                                {section.content.author_username && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                    <User className="w-4 h-4" />
                                    <span>Contributed by <span className="font-medium text-foreground">{section.content.author_username}</span></span>
                                  </div>
                                )}
                                
                                {/* Rendered content */}
                                <div className="bg-background/50 rounded-lg p-4">
                                  <BlockRenderer content={section.content.content} />
                                </div>
                              </div>
                            ) : (
                              <div className="bg-muted/30 rounded-lg p-6 text-center">
                                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">
                                  Lesson not ready yet
                                </p>
                              </div>
                            )}
                          </div>
                        ))}

                        {lesson.sections.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2" />
                            <p>This lesson has no sections yet.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {module.lessons.length === 0 && (
                  <Card className="glass border-border/50">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2" />
                      <p>No lessons in this module yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Modules;
