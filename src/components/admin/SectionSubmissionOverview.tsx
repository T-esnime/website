import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockRenderer } from '@/components/block-editor/BlockRenderer';
import { 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  FileText, 
  Users, 
  CheckCircle2, 
  Circle,
  Clock,
  ExternalLink,
  Award
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  order_index: number | null;
}

interface Lesson {
  id: string;
  title: string;
  module_id: string;
  order_index: number | null;
}

interface Section {
  id: string;
  title: string;
  lesson_id: string;
  order_index: number | null;
  approved_submission_id: string | null;
}

interface Submission {
  id: string;
  section_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  content: string;
}

interface Profile {
  id: string;
  username: string;
}

interface SectionStatus {
  section: Section;
  status: 'empty' | 'pending' | 'approved';
  submission?: Submission;
  username?: string;
}

interface LessonWithSections {
  lesson: Lesson;
  sections: SectionStatus[];
}

interface ModuleData {
  module: Module;
  lessons: LessonWithSections[];
}

interface TopContributor {
  username: string;
  count: number;
}

const SectionSubmissionOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedSection, setSelectedSection] = useState<SectionStatus | null>(null);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  // Stats
  const [totalSections, setTotalSections] = useState(0);
  const [submittedSections, setSubmittedSections] = useState(0);
  const [pendingSections, setPendingSections] = useState(0);
  const [emptySections, setEmptySections] = useState(0);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Fetch all data in parallel
    const [modulesRes, lessonsRes, sectionsRes, submissionsRes, profilesRes] = await Promise.all([
      supabase.from('modules').select('*').order('order_index'),
      supabase.from('lessons').select('*').order('order_index'),
      supabase.from('sections').select('*').order('order_index'),
      supabase.from('submissions').select('*'),
      supabase.from('profiles').select('id, username')
    ]);

    if (modulesRes.error || lessonsRes.error || sectionsRes.error || submissionsRes.error || profilesRes.error) {
      console.error('Error fetching data');
      setLoading(false);
      return;
    }

    const modules = (modulesRes.data || []) as Module[];
    const lessons = (lessonsRes.data || []) as Lesson[];
    const sections = (sectionsRes.data || []) as Section[];
    const submissions = (submissionsRes.data || []) as Submission[];
    const profilesList = (profilesRes.data || []) as Profile[];

    // Create profiles map
    const profilesMap = new Map<string, string>();
    profilesList.forEach(p => profilesMap.set(p.id, p.username));
    setProfiles(profilesMap);

    // Create submission maps
    const approvedSubmissionsMap = new Map<string, Submission>();
    const pendingSubmissionsMap = new Map<string, Submission>();
    const contributorCounts = new Map<string, number>();

    submissions.forEach(sub => {
      if (sub.status === 'approved') {
        approvedSubmissionsMap.set(sub.section_id, sub);
        const username = profilesMap.get(sub.user_id) || 'Unknown';
        contributorCounts.set(username, (contributorCounts.get(username) || 0) + 1);
      } else if (sub.status === 'pending') {
        pendingSubmissionsMap.set(sub.section_id, sub);
      }
    });

    // Build structured data
    const structuredData: ModuleData[] = modules.map(module => {
      const moduleLessons = lessons.filter(l => l.module_id === module.id);
      
      return {
        module,
        lessons: moduleLessons.map(lesson => {
          const lessonSections = sections.filter(s => s.lesson_id === lesson.id);
          
          return {
            lesson,
            sections: lessonSections.map(section => {
              const approvedSub = approvedSubmissionsMap.get(section.id);
              const pendingSub = pendingSubmissionsMap.get(section.id);
              
              if (approvedSub) {
                return {
                  section,
                  status: 'approved' as const,
                  submission: approvedSub,
                  username: profilesMap.get(approvedSub.user_id)
                };
              } else if (pendingSub) {
                return {
                  section,
                  status: 'pending' as const,
                  submission: pendingSub,
                  username: profilesMap.get(pendingSub.user_id)
                };
              }
              return { section, status: 'empty' as const };
            })
          };
        })
      };
    });

    setData(structuredData);

    // Calculate stats
    const allSectionStatuses = structuredData.flatMap(m => m.lessons.flatMap(l => l.sections));
    const total = allSectionStatuses.length;
    const approved = allSectionStatuses.filter(s => s.status === 'approved').length;
    const pending = allSectionStatuses.filter(s => s.status === 'pending').length;
    const empty = allSectionStatuses.filter(s => s.status === 'empty').length;

    setTotalSections(total);
    setSubmittedSections(approved);
    setPendingSections(pending);
    setEmptySections(empty);

    // Top contributors
    const contributors = Array.from(contributorCounts.entries())
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopContributors(contributors);

    // Expand all modules by default
    setExpandedModules(new Set(modules.map(m => m.id)));
    setLoading(false);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleCellClick = (sectionStatus: SectionStatus) => {
    if (sectionStatus.status === 'empty') {
      navigate(`/submit?section=${sectionStatus.section.id}`);
    } else {
      setSelectedSection(sectionStatus);
    }
  };

  const getStatusColor = (status: 'empty' | 'pending' | 'approved') => {
    switch (status) {
      case 'approved':
        return 'bg-success/20 border-success/50 hover:bg-success/30';
      case 'pending':
        return 'bg-warning/20 border-warning/50 hover:bg-warning/30';
      case 'empty':
        return 'bg-muted/30 border-dashed border-border hover:bg-muted/50';
    }
  };

  const getStatusIcon = (status: 'empty' | 'pending' | 'approved') => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'empty':
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Stats Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSections}</p>
                <p className="text-xs text-muted-foreground">Total Sections</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submittedSections}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingSections}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Circle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emptySections}</p>
                <p className="text-xs text-muted-foreground">Empty</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card className="glass border-border/50 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-accent" />
                <p className="text-xs font-medium text-muted-foreground">Top Contributors</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {topContributors.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No contributors yet</span>
                ) : (
                  topContributors.map((c, i) => (
                    <Badge key={c.username} variant="secondary" className="text-xs">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'} {c.username} ({c.count})
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/20 border border-success/50" />
            <span className="text-muted-foreground">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning/20 border border-warning/50" />
            <span className="text-muted-foreground">Pending Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/30 border border-dashed border-border" />
            <span className="text-muted-foreground">Not Submitted</span>
          </div>
        </div>

        {/* Matrix Grid */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Section Submission Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No modules found. Create some modules and lessons to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {data.map(({ module, lessons }) => (
                  <Collapsible
                    key={module.id}
                    open={expandedModules.has(module.id)}
                    onOpenChange={() => toggleModule(module.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 p-3 h-auto text-left hover:bg-secondary/50"
                      >
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span className="font-semibold">{module.title}</span>
                        <Badge variant="outline" className="ml-auto">
                          {lessons.reduce((acc, l) => acc + l.sections.length, 0)} sections
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-6 space-y-3">
                      {lessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No lessons in this module</p>
                      ) : (
                        lessons.map(({ lesson, sections }) => (
                          <div key={lesson.id} className="bg-secondary/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-medium">{lesson.title}</span>
                              <span className="text-xs text-muted-foreground">
                                ({sections.filter(s => s.status === 'approved').length}/{sections.length} complete)
                              </span>
                            </div>
                            <ScrollArea className="w-full pb-2">
                              <div className="flex gap-2">
                                {sections.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">No sections</span>
                                ) : (
                                  sections.map((sectionStatus, idx) => (
                                    <Tooltip key={sectionStatus.section.id}>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => handleCellClick(sectionStatus)}
                                          className={`
                                            flex-shrink-0 min-w-[120px] p-3 rounded-lg border-2 transition-all
                                            cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring
                                            ${getStatusColor(sectionStatus.status)}
                                          `}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            {getStatusIcon(sectionStatus.status)}
                                            <span className="text-xs font-medium truncate">
                                              Section {idx + 1}
                                            </span>
                                          </div>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {sectionStatus.section.title}
                                          </p>
                                          {sectionStatus.status !== 'empty' && sectionStatus.username && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                              by {sectionStatus.username}
                                            </p>
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[250px]">
                                        <div className="space-y-1">
                                          <p className="font-medium">{sectionStatus.section.title}</p>
                                          <p className="text-xs">
                                            Status: {sectionStatus.status === 'approved' ? '✅ Approved' : 
                                                     sectionStatus.status === 'pending' ? '⏳ Pending Review' : 
                                                     '⚪ Not Submitted'}
                                          </p>
                                          {sectionStatus.username && (
                                            <p className="text-xs">Submitted by: {sectionStatus.username}</p>
                                          )}
                                          {sectionStatus.submission && (
                                            <p className="text-xs">
                                              Date: {new Date(sectionStatus.submission.created_at).toLocaleDateString()}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground mt-2">
                                            Click to {sectionStatus.status === 'empty' ? 'submit content' : 'view details'}
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        ))
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Detail Dialog */}
        <Dialog open={!!selectedSection} onOpenChange={() => setSelectedSection(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedSection && getStatusIcon(selectedSection.status)}
                {selectedSection?.section.title}
              </DialogTitle>
            </DialogHeader>
            {selectedSection && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant={selectedSection.status === 'approved' ? 'default' : 'secondary'}>
                    {selectedSection.status === 'approved' ? 'Approved' : 'Pending Review'}
                  </Badge>
                  {selectedSection.username && (
                    <span className="text-muted-foreground">
                      Submitted by: <span className="text-foreground">{selectedSection.username}</span>
                    </span>
                  )}
                  {selectedSection.submission && (
                    <span className="text-muted-foreground">
                      {new Date(selectedSection.submission.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {selectedSection.submission && (
                  <div className="p-4 rounded-xl bg-secondary/50 max-h-[400px] overflow-y-auto">
                    <BlockRenderer content={selectedSection.submission.content} />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {selectedSection.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSection(null);
                        navigate('/admin');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Review in Admin Panel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSection(null);
                      navigate(`/submit?section=${selectedSection.section.id}`);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Go to Submission Page
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default SectionSubmissionOverview;
