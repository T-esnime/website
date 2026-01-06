import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { createSubmission, addPoints, Section, getDraft, saveDraft, deleteDraft } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, FileText, Info, EyeOff, Eye, Trash2, Check } from 'lucide-react';
import { BlockEditor, ContentBlock, blocksToJson, getPlainTextContent, getDefaultBlocks, jsonToBlocks } from '@/components/block-editor';
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const sectionId = searchParams.get('section');
  const charCount = getPlainTextContent(blocks).length;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (sectionId && user) {
      loadSection();
    } else if (!sectionId) {
      navigate('/learn');
    }
  }, [sectionId, user]);

  const loadSection = async () => {
    if (!sectionId || !user) return;
    
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
    
    // Load existing draft if any
    const draft = await getDraft(user.id, sectionId);
    if (draft) {
      setDraftId(draft.id);
      setHasDraft(true);
      try {
        const parsedBlocks = jsonToBlocks(draft.content);
        setBlocks(parsedBlocks);
      } catch (e) {
        console.error('Failed to parse draft content:', e);
      }
    }
    
    setLoading(false);
  };

  const handleAutoSaveDraft = useCallback(async (blocksToSave: ContentBlock[]) => {
    if (!user || !sectionId) return;
    
    const content = blocksToJson(blocksToSave);
    const textContent = getPlainTextContent(blocksToSave);
    
    // Only save if there's meaningful content
    if (textContent.length < 10) return;
    
    setSavingDraft(true);
    const result = await saveDraft(user.id, sectionId, content);
    
    if (result.success) {
      setHasDraft(true);
      setLastSaved(new Date());
      // Get the draft ID if we don't have it yet
      if (!draftId) {
        const draft = await getDraft(user.id, sectionId);
        if (draft) {
          setDraftId(draft.id);
        }
      }
    }
    setSavingDraft(false);
  }, [user, sectionId, draftId]);

  // Auto-save effect with 2 second debounce
  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSaveDraft(blocks);
    }, 2000);
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [blocks, handleAutoSaveDraft]);

  const handleDeleteDraft = async () => {
    if (!draftId) return;
    
    const result = await deleteDraft(draftId);
    if (result.success) {
      setDraftId(null);
      setHasDraft(false);
      setBlocks(getDefaultBlocks());
      toast.success('Draft deleted');
    } else {
      toast.error('Failed to delete draft');
    }
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
    
    // Delete draft after successful submission
    if (draftId) {
      await deleteDraft(draftId);
    }
    
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

              {/* Auto-save status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {savingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Draft saved</span>
                    </>
                  ) : hasDraft ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Draft loaded</span>
                    </>
                  ) : null}
                </div>
                
                {hasDraft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteDraft}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Draft
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
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
