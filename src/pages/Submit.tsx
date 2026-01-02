import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { createSubmission, addPoints, Section } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, FileText, Info, EyeOff, Eye } from 'lucide-react';
import { BlockEditor, ContentBlock, blocksToJson, getPlainTextContent, getDefaultBlocks } from '@/components/block-editor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Submit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [section, setSection] = useState<Section | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>(getDefaultBlocks());
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sectionId = searchParams.get('section');
  const charCount = getPlainTextContent(blocks).length;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (sectionId) {
      loadSection();
    } else {
      navigate('/learn');
    }
  }, [sectionId]);

  const loadSection = async () => {
    if (!sectionId) return;
    
    setLoading(true);
    
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .maybeSingle();
    
    if (sectionError || !sectionData) {
      toast.error('Section not found');
      navigate('/learn');
      return;
    }
    
    setSection(sectionData);
    
    // Get lesson title
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', sectionData.lesson_id)
      .maybeSingle();
    
    if (lessonData) {
      setLessonTitle(lessonData.title);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !section) return;
    
    if (charCount < 50) {
      toast.error('Content must be at least 50 characters');
      return;
    }
    
    setSubmitting(true);
    
    // Convert blocks to JSON for storage
    const content = blocksToJson(blocks);
    const { data, error } = await createSubmission(section.id, user.id, content, isAnonymous);
    
    if (error) {
      toast.error('Failed to submit content');
      setSubmitting(false);
      return;
    }
    
    // Award points for submission
    await addPoints(user.id, 10, 'Content submission', data?.id);
    
    toast.success('Content submitted successfully! +10 points');
    navigate('/dashboard');
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

  if (!section) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/learn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Link>
        </Button>

        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Submit Content</CardTitle>
                <CardDescription className="mt-1">
                  Contributing to: <span className="text-foreground font-medium">{lessonTitle}</span> → {section.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Info Box */}
            <div className="flex gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Submission Guidelines</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Write clear, accurate, and helpful content</li>
                  <li>• Include examples where appropriate</li>
                  <li>• Your submission will be reviewed by admins before publishing</li>
                  <li>• You'll earn +10 points for submitting and +20 if approved!</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-3">
                  {isAnonymous ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                      Submit anonymously
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isAnonymous 
                        ? "Your name won't be shown if approved" 
                        : "Your name will be shown if approved"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Use the 3-dot menu to add different blocks • Drag blocks to reorder
                </p>
                <div className="min-h-[300px] bg-secondary/30 border border-border rounded-lg p-4">
                  <BlockEditor
                    initialBlocks={blocks}
                    onChange={setBlocks}
                    minCharacters={50}
                    autoSaveKey={sectionId || undefined}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  disabled={submitting || charCount < 50}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Submit;
