-- Add is_anonymous column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;