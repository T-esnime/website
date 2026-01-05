-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create drafts table for submission drafts (max 2 per user)
CREATE TABLE public.drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure unique draft per section per user
  UNIQUE(user_id, section_id)
);

-- Enable Row Level Security
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own drafts
CREATE POLICY "Users can view own drafts" 
ON public.drafts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own drafts
CREATE POLICY "Users can create own drafts" 
ON public.drafts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts" 
ON public.drafts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts" 
ON public.drafts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_drafts_updated_at
BEFORE UPDATE ON public.drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();