-- Create map_leads table
CREATE TABLE IF NOT EXISTS map_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  community_link TEXT,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('beta_waitlist', 'data_extraction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected')),
  map_id UUID REFERENCES maps(id),
  feedback_id UUID REFERENCES map_feedback(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  next_followup_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS map_leads_email_idx ON map_leads(email);
CREATE INDEX IF NOT EXISTS map_leads_type_idx ON map_leads(lead_type);
CREATE INDEX IF NOT EXISTS map_leads_status_idx ON map_leads(status);
CREATE INDEX IF NOT EXISTS map_leads_next_followup_idx ON map_leads(next_followup_at);

-- Add RLS policies
ALTER TABLE map_leads ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read leads
CREATE POLICY "Allow public read leads"
  ON map_leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow everyone to insert leads
CREATE POLICY "Allow public lead creation"
  ON map_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow everyone to update leads
CREATE POLICY "Allow public lead updates"
  ON map_leads
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_map_leads_updated_at
  BEFORE UPDATE ON map_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
