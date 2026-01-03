import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockRenderer } from '@/components/block-editor';
import { 
  getLessons, 
  getSections, 
  getApprovedSubmission,
  Lesson, 
  Section,
  SubmissionWithAuthor
} from '@/lib/supabase-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft,
  Loader2,
  FileText,
  PenLine,
  User
} from 'lucide-react';

interface SectionWithContent extends Section {
  content: SubmissionWithAuthor | null;
}

const LessonView = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sectionsWithContent, setSectionsWithContent] = useState<SectionWithContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      loadLessonData(lessonId);
    }
  }, [lessonId]);

  const loadLessonData = async (lesId: string) => {
    setLoading(true);
    
    // We need to find the lesson - fetch all modules/lessons or use a direct query
    // For now, let's fetch sections first, then get lesson info
    const sections = await getSections(lesId);
    
    // Load content for each section in parallel
    const sectionsWithContentData = await Promise.all(
      sections.map(async (section) => {
        const content = await getApprovedSubmission(section.id);
        return { ...section, content };
      })
    );
    
    setSectionsWithContent(sectionsWithContentData);
    
    // Try to get lesson title from the database
    // We'll need to fetch from a parent or use a helper
    // For now, use a simple approach - fetch lessons from any module
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lesId)
      .maybeSingle();
    
    if (lessonData) {
      setLesson(lessonData);
    }
    
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

  if (!lesson) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <Button variant="outline" onClick={() => navigate('/learn')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate('/learn')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learning
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground text-lg">{lesson.description}</p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sectionsWithContent.map((section, index) => (
            <Card key={section.id} className="glass border-border/50">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                </div>
                {section.description && (
                  <p className="text-muted-foreground text-sm mt-2">{section.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {section.content ? (
                  <div>
                    {/* Author attribution */}
                    {section.content.author_username && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
                        <User className="w-4 h-4" />
                        <span>Contributed by <span className="font-medium text-foreground">{section.content.author_username}</span></span>
                      </div>
                    )}
                    
                    {/* Rendered content */}
                    <BlockRenderer content={section.content.content} />
                    
                    {/* Contribute button for users */}
                    {user && (
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/submit?section=${section.id}`}>
                            <PenLine className="w-4 h-4 mr-2" />
                            Submit Alternative
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">No Content Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      This section has no content yet. Be the first to contribute!
                    </p>
                    {user ? (
                      <Button variant="hero" size="sm" asChild>
                        <Link to={`/submit?section=${section.id}`}>
                          <PenLine className="w-4 h-4 mr-2" />
                          Submit Content
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/auth?mode=signup">
                          Sign Up to Contribute
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {sectionsWithContent.length === 0 && (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sections</h3>
              <p className="text-muted-foreground">
                This lesson doesn't have any sections yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default LessonView;
