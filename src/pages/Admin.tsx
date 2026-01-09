import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getPendingSubmissions, approveSubmission, rejectSubmission, addPoints, Submission } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  User,
  UserX,
  Calendar,
  Eye,
  LayoutGrid
} from 'lucide-react';
import { BlockRenderer } from '@/components/block-editor/BlockRenderer';
import SectionSubmissionOverview from '@/components/admin/SectionSubmissionOverview';

interface SubmissionWithDetails extends Submission {
  section_title?: string;
  lesson_title?: string;
  username?: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadSubmissions();
    }
  }, [isAdmin]);

  const loadSubmissions = async () => {
    setLoading(true);
    
    const pendingSubmissions = await getPendingSubmissions();
    
    // Fetch additional details for each submission
    const submissionsWithDetails = await Promise.all(
      pendingSubmissions.map(async (sub) => {
        const [sectionRes, userRes] = await Promise.all([
          supabase
            .from('sections')
            .select('title, lesson_id')
            .eq('id', sub.section_id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('username')
            .eq('id', sub.user_id)
            .maybeSingle()
        ]);
        
        let lessonTitle = '';
        if (sectionRes.data?.lesson_id) {
          const lessonRes = await supabase
            .from('lessons')
            .select('title')
            .eq('id', sectionRes.data.lesson_id)
            .maybeSingle();
          lessonTitle = lessonRes.data?.title || '';
        }
        
        return {
          ...sub,
          section_title: sectionRes.data?.title,
          lesson_title: lessonTitle,
          username: userRes.data?.username
        };
      })
    );
    
    setSubmissions(submissionsWithDetails);
    setLoading(false);
  };

  const handleApprove = async (submission: SubmissionWithDetails) => {
    if (!user) return;
    
    setProcessing(true);
    
    const { error } = await approveSubmission(submission.id, submission.section_id, user.id);
    
    if (error) {
      toast.error('Failed to approve submission');
      setProcessing(false);
      return;
    }
    
    // Award points to the author
    await addPoints(submission.user_id, 20, 'Submission approved', submission.id);
    
    toast.success('Submission approved! Author received +20 points.');
    setSelectedSubmission(null);
    loadSubmissions();
    setProcessing(false);
  };

  const handleReject = async (submission: SubmissionWithDetails) => {
    if (!user) return;
    
    setProcessing(true);
    
    const { error } = await rejectSubmission(submission.id, user.id, feedback);
    
    if (error) {
      toast.error('Failed to reject submission');
      setProcessing(false);
      return;
    }
    
    toast.success('Submission rejected.');
    setSelectedSubmission(null);
    setFeedback('');
    loadSubmissions();
    setProcessing(false);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center">
            <Shield className="w-7 h-7 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Review and manage user submissions</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Section Overview
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({submissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Section Overview Tab */}
          <TabsContent value="overview">
            <SectionSubmissionOverview />
          </TabsContent>

          {/* Pending Submissions Tab */}
          <TabsContent value="pending">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="glass border-border/50">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{submissions.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions List */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
                <CardDescription>Review user contributions before publishing</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                      No pending submissions to review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-secondary/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-warning/20 text-warning">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {submission.lesson_title} → {submission.section_title}
                            </span>
                          </div>
                          <div className="text-foreground line-clamp-2 mb-2">
                            <BlockRenderer content={submission.content} className="text-sm" />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {submission.is_anonymous ? (
                                <>
                                  <UserX className="w-4 h-4" />
                                  Anonymous ({submission.username})
                                </>
                              ) : (
                                <>
                                  <User className="w-4 h-4" />
                                  {submission.username}
                                </>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(submission.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass">
                              <DialogHeader>
                                <DialogTitle>Review Submission</DialogTitle>
                                <DialogDescription>
                                  {submission.lesson_title} → {submission.section_title}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {submission.is_anonymous ? (
                                    <>
                                      <UserX className="w-4 h-4" />
                                      Submitted anonymously by {submission.username}
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-4 h-4" />
                                      Submitted by {submission.username}
                                    </>
                                  )}
                                </div>
                                
                                <div className="p-4 rounded-xl bg-secondary/50 max-h-[400px] overflow-y-auto">
                                  <BlockRenderer content={submission.content} />
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Feedback (optional, shown if rejected)
                                  </label>
                                  <Textarea
                                    placeholder="Provide feedback for the author..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="bg-secondary border-border"
                                  />
                                </div>
                              </div>
                              
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(submission)}
                                  disabled={processing}
                                >
                                  {processing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4 mr-2" />
                                  )}
                                  Reject
                                </Button>
                                <Button
                                  variant="success"
                                  onClick={() => handleApprove(submission)}
                                  disabled={processing}
                                >
                                  {processing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  )}
                                  Approve & Publish
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
