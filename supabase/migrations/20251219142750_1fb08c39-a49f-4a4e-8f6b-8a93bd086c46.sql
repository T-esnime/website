-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create submission_status enum
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  last_login_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  approved_submission_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status submission_status DEFAULT 'pending' NOT NULL,
  admin_feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add foreign key for approved_submission_id after submissions table exists
ALTER TABLE public.sections 
ADD CONSTRAINT sections_approved_submission_fkey 
FOREIGN KEY (approved_submission_id) REFERENCES public.submissions(id) ON DELETE SET NULL;

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(submission_id, user_id)
);

-- Create points_log table for tracking point changes
CREATE TABLE public.points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to add points
CREATE OR REPLACE FUNCTION public.add_points(_user_id UUID, _points INTEGER, _reason TEXT, _reference_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't give points to admins
  IF NOT public.has_role(_user_id, 'admin') THEN
    INSERT INTO public.points_log (user_id, points, reason, reference_id)
    VALUES (_user_id, _points, _reason, _reference_id);
    
    UPDATE public.profiles
    SET points = points + _points, updated_at = now()
    WHERE id = _user_id;
  END IF;
END;
$$;

-- RLS Policies

-- Profiles: viewable by everyone, editable by owner
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: viewable by everyone (for role checking)
CREATE POLICY "User roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);

-- Modules: viewable by everyone
CREATE POLICY "Modules are viewable by everyone" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Lessons: viewable by everyone
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sections: viewable by everyone
CREATE POLICY "Sections are viewable by everyone" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage sections" ON public.sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Submissions: users can see their own + approved, admins see all
CREATE POLICY "Users can view own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view approved submissions" ON public.submissions FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can view all submissions" ON public.submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update submissions" ON public.submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Votes: users can manage own votes on approved submissions
CREATE POLICY "Votes are viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vote" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vote" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Points log: users can view own, admins can view all
CREATE POLICY "Users can view own points log" ON public.points_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all points log" ON public.points_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Insert sample modules, lessons, and sections
INSERT INTO public.modules (title, description, icon, order_index) VALUES
('Web Development Fundamentals', 'Learn the basics of web development including HTML, CSS, and JavaScript', 'Globe', 1),
('Backend Development', 'Master server-side programming and database management', 'Server', 2),
('DevOps & Cloud', 'Deploy and manage applications in the cloud', 'Cloud', 3);

-- Insert lessons for Web Development module
INSERT INTO public.lessons (module_id, title, description, order_index)
SELECT m.id, l.title, l.description, l.order_index
FROM public.modules m,
(VALUES 
  ('HTML Basics', 'Understanding HTML structure and elements', 1),
  ('CSS Styling', 'Learn to style web pages with CSS', 2),
  ('JavaScript Fundamentals', 'Introduction to JavaScript programming', 3)
) AS l(title, description, order_index)
WHERE m.title = 'Web Development Fundamentals';

-- Insert lessons for Backend module
INSERT INTO public.lessons (module_id, title, description, order_index)
SELECT m.id, l.title, l.description, l.order_index
FROM public.modules m,
(VALUES 
  ('Node.js Basics', 'Getting started with Node.js', 1),
  ('Database Design', 'Relational database fundamentals', 2),
  ('REST APIs', 'Building RESTful web services', 3)
) AS l(title, description, order_index)
WHERE m.title = 'Backend Development';

-- Insert lessons for DevOps module
INSERT INTO public.lessons (module_id, title, description, order_index)
SELECT m.id, l.title, l.description, l.order_index
FROM public.modules m,
(VALUES 
  ('Docker Fundamentals', 'Containerization with Docker', 1),
  ('CI/CD Pipelines', 'Continuous integration and deployment', 2),
  ('Cloud Providers', 'AWS, GCP, and Azure overview', 3)
) AS l(title, description, order_index)
WHERE m.title = 'DevOps & Cloud';

-- Insert sections for each lesson
INSERT INTO public.sections (lesson_id, title, description, order_index)
SELECT l.id, s.title, s.description, s.order_index
FROM public.lessons l
CROSS JOIN LATERAL (
  VALUES 
    ('Introduction', 'Overview and objectives', 1),
    ('Core Concepts', 'Key principles and terminology', 2),
    ('Practical Examples', 'Hands-on examples and exercises', 3),
    ('Best Practices', 'Industry standards and tips', 4)
) AS s(title, description, order_index);