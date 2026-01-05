import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  last_login_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Section {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  order_index: number;
  approved_submission_id: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  section_id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithAuthor extends Submission {
  author_username?: string;
}

export interface Vote {
  id: string;
  submission_id: string;
  user_id: string;
  vote_type: number;
  created_at: string;
}

export interface PointsLog {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

// Auth helpers
export async function signUp(email: string, password: string, username: string) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { username }
    }
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Profile helpers
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

export async function getUserRole(userId: string): Promise<'user' | 'admin'> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data) {
    return 'user';
  }
  
  return data.role as 'user' | 'admin';
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

// Modules & Content helpers
export async function getModules(): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order_index');
  
  if (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
  
  return data || [];
}

export async function getLessons(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index');
  
  if (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
  
  return data || [];
}

export async function getSections(lessonId: string): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_index');
  
  if (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
  
  return data || [];
}

// Submission helpers
export async function createSubmission(sectionId: string, userId: string, content: string, isAnonymous: boolean = false) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      section_id: sectionId,
      user_id: userId,
      content,
      status: 'pending',
      is_anonymous: isAnonymous
    })
    .select()
    .single();
  
  return { data, error };
}

export async function getApprovedSubmission(sectionId: string): Promise<SubmissionWithAuthor | null> {
  // First get the section to find its approved_submission_id
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('approved_submission_id')
    .eq('id', sectionId)
    .maybeSingle();
  
  if (sectionError || !section?.approved_submission_id) {
    return null;
  }
  
  // Then fetch the specific approved submission
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', section.approved_submission_id)
    .maybeSingle();
  
  if (error || !data) {
    console.error('Error fetching approved submission:', error);
    return null;
  }
  
  // If not anonymous, fetch the author's username
  let author_username: string | undefined;
  if (!data.is_anonymous) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user_id)
      .maybeSingle();
    author_username = profile?.username;
  }
  
  return { ...data, author_username };
}

export async function getPendingSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pending submissions:', error);
    return [];
  }
  
  return data || [];
}

export async function getUserSubmissions(userId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user submissions:', error);
    return [];
  }
  
  return data || [];
}

export async function approveSubmission(submissionId: string, sectionId: string, adminId: string) {
  // Update submission status
  const { error: submitError } = await supabase
    .from('submissions')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', submissionId);
  
  if (submitError) {
    return { error: submitError };
  }
  
  // Update section's approved submission
  const { error: sectionError } = await supabase
    .from('sections')
    .update({ approved_submission_id: submissionId })
    .eq('id', sectionId);
  
  return { error: sectionError };
}

export async function rejectSubmission(submissionId: string, adminId: string, feedback?: string) {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'rejected',
      admin_feedback: feedback,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', submissionId);
  
  return { error };
}

// Vote helpers
export async function voteOnSubmission(submissionId: string, voterId: string, voteType: 1 | -1) {
  // Get the submission to find the author
  const { data: submission } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('id', submissionId)
    .maybeSingle();
  
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('user_id', voterId)
    .maybeSingle();
  
  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote if clicking same button
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id);
      return { action: 'removed', error };
    } else {
      // Update vote
      const { error } = await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id);
      
      // Award points to author if changing from downvote to upvote
      if (!error && voteType === 1 && submission?.user_id && submission.user_id !== voterId) {
        await addPoints(submission.user_id, 4, 'Vote changed to upvote', submissionId);
      }
      
      return { action: 'updated', error };
    }
  } else {
    // Create new vote
    const { error } = await supabase
      .from('votes')
      .insert({
        submission_id: submissionId,
        user_id: voterId,
        vote_type: voteType
      });
    
    if (!error) {
      // Award +1 point to voter for voting
      await addPoints(voterId, 1, 'Voted on content', submissionId);
      
      // Award +2 points to author if upvote (and voter isn't the author)
      if (voteType === 1 && submission?.user_id && submission.user_id !== voterId) {
        await addPoints(submission.user_id, 2, 'Upvote received', submissionId);
      }
    }
    
    return { action: 'created', error };
  }
}

export async function getVotes(submissionId: string, currentUserId?: string): Promise<{ upvotes: number; downvotes: number; userVote: number | null }> {
  const { data: votes } = await supabase
    .from('votes')
    .select('*')
    .eq('submission_id', submissionId);
  
  if (!votes) {
    return { upvotes: 0, downvotes: 0, userVote: null };
  }
  
  const upvotes = votes.filter(v => v.vote_type === 1).length;
  const downvotes = votes.filter(v => v.vote_type === -1).length;
  
  let userVote: number | null = null;
  if (currentUserId) {
    const userVoteRecord = votes.find(v => v.user_id === currentUserId);
    userVote = userVoteRecord?.vote_type ?? null;
  }
  
  return { upvotes, downvotes, userVote };
}

// Leaderboard helpers
export async function getLeaderboard(limit = 50): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  return data || [];
}

// Points helpers
export async function addPoints(userId: string, points: number, reason: string, referenceId?: string) {
  const { error } = await supabase.rpc('add_points', {
    _user_id: userId,
    _points: points,
    _reason: reason,
    _reference_id: referenceId || null
  });
  
  return { error };
}

// Daily login points helper
export async function checkAndAwardDailyLoginPoints(userId: string): Promise<boolean> {
  // Get user's profile to check last login date
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('last_login_date')
    .eq('id', userId)
    .maybeSingle();
  
  if (profileError || !profile) {
    return false;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const lastLogin = profile.last_login_date;
  
  // If last login is not today, award points
  if (lastLogin !== today) {
    // Update last login date first
    await supabase
      .from('profiles')
      .update({ last_login_date: today })
      .eq('id', userId);
    
    // Award daily login points
    await addPoints(userId, 2, 'Daily login bonus');
    return true;
  }
  
  return false;
}

// Get user's points history
export async function getPointsHistory(userId: string): Promise<PointsLog[]> {
  const { data, error } = await supabase
    .from('points_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching points history:', error);
    return [];
  }
  
  return (data || []) as PointsLog[];
}
