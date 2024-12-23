-- Drop existing table if it exists
DROP TABLE IF EXISTS public.map_feedback;

-- Create feedback_status type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.feedback_status AS ENUM ('pending', 'approved', 'featured', 'contacted', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create map_feedback table
CREATE TABLE public.map_feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    map_id uuid NOT NULL,
    rating integer NOT NULL,
    feedback_type text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
    session_id uuid NULL,
    user_id uuid NULL,
    status public.feedback_status NOT NULL DEFAULT 'pending'::feedback_status,
    CONSTRAINT map_feedback_pkey PRIMARY KEY (id),
    CONSTRAINT map_feedback_map_id_fkey FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
    CONSTRAINT map_feedback_session_id_fkey FOREIGN KEY (session_id) REFERENCES map_sessions(id) ON DELETE SET NULL,
    CONSTRAINT map_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT map_feedback_feedback_type_check CHECK (feedback_type = ANY (ARRAY['positive'::text, 'negative'::text, 'neutral'::text])),
    CONSTRAINT map_feedback_rating_check CHECK ((rating >= 1) AND (rating <= 5))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_map_feedback_map_id ON public.map_feedback USING btree (map_id);
CREATE INDEX IF NOT EXISTS idx_map_feedback_rating ON public.map_feedback USING btree (rating);
CREATE INDEX IF NOT EXISTS idx_map_feedback_type ON public.map_feedback USING btree (feedback_type);
CREATE INDEX IF NOT EXISTS idx_map_feedback_metadata ON public.map_feedback USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.map_feedback USING btree (status);

-- Create trigger for updating updated_at
CREATE TRIGGER update_map_feedback_updated_at 
    BEFORE UPDATE ON map_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.map_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.map_feedback
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.map_feedback
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.map_feedback
    FOR UPDATE USING (auth.role() = 'authenticated');
