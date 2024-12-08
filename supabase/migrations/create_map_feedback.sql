-- Drop existing table if it exists
DROP TABLE IF EXISTS map_feedback;

-- Create the new table with improved schema
CREATE TABLE map_feedback (
    -- Core identification
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    map_id UUID REFERENCES maps(id) NOT NULL,
    
    -- Rating data
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    rating_submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Detailed feedback (optional)
    feedback_text TEXT,
    feedback_submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Contact information (optional)
    contact_email VARCHAR(255) CHECK (
        contact_email IS NULL OR 
        contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User context (optional)
    user_agent TEXT,
    ip_address INET,
    
    -- Additional fields
    is_willing_to_testimonial BOOLEAN DEFAULT FALSE,
    follow_up_status VARCHAR(50) DEFAULT 'pending' CHECK (
        follow_up_status IN ('pending', 'contacted', 'completed', 'no_action_needed')
    )
);

-- Create indexes
CREATE INDEX idx_map_feedback_map_id ON map_feedback(map_id);
CREATE INDEX idx_map_feedback_rating ON map_feedback(rating);
CREATE INDEX idx_map_feedback_created_at ON map_feedback(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_map_feedback_updated_at
    BEFORE UPDATE ON map_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 