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
  created_at: string;
  updated_at: string;
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
export async function createSubmission(sectionId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      section_id: sectionId,
      user_id: userId,
      content,
      status: 'pending'
    })
    .select()
    .single();
  
  return { data, error };
}

export async function getApprovedSubmission(sectionId: string): Promise<Submission | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('section_id', sectionId)
    .eq('status', 'approved')
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching approved submission:', error);
    return null;
  }
  
  return data;
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
export async function voteOnSubmission(submissionId: string, userId: string, voteType: 1 | -1) {
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('user_id', userId)
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
      return { action: 'updated', error };
    }
  } else {
    // Create new vote
    const { error } = await supabase
      .from('votes')
      .insert({
        submission_id: submissionId,
        user_id: userId,
        vote_type: voteType
      });
    return { action: 'created', error };
  }
}

export async function getVotes(submissionId: string): Promise<{ upvotes: number; downvotes: number; userVote: number | null }> {
  const { data: votes } = await supabase
    .from('votes')
    .select('*')
    .eq('submission_id', submissionId);
  
  if (!votes) {
    return { upvotes: 0, downvotes: 0, userVote: null };
  }
  
  const upvotes = votes.filter(v => v.vote_type === 1).length;
  const downvotes = votes.filter(v => v.vote_type === -1).length;
  
  return { upvotes, downvotes, userVote: null };
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
