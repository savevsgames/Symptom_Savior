/*
  # Medical Consultations Schema

  1. New Tables
    - `medical_consultations` - Logs all AI medical consultations with context and responses
    
  2. Security
    - Enable RLS on medical_consultations table
    - Add policies for users to manage their own consultation data
    - Ensure proper indexing for performance

  3. Features
    - Complete consultation logging
    - Source document tracking
    - Emergency detection flags
    - Voice and video URL storage
    - Recommendations storage
*/

-- Create medical_consultations table
CREATE TABLE IF NOT EXISTS medical_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  query text NOT NULL,
  response text NOT NULL,
  sources jsonb DEFAULT NULL,
  voice_audio_url text,
  video_url text,
  consultation_type text NOT NULL,
  processing_time integer,
  emergency_detected boolean,
  context_used jsonb DEFAULT NULL,
  confidence_score numeric,
  recommendations jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE medical_consultations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own consultations"
  ON medical_consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own consultations"
  ON medical_consultations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX medical_consultations_user_id_idx ON medical_consultations(user_id);
CREATE INDEX medical_consultations_created_at_idx ON medical_consultations(created_at DESC);
CREATE INDEX medical_consultations_session_id_idx ON medical_consultations(session_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_medical_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_medical_consultations_updated_at
  BEFORE UPDATE ON medical_consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_consultations_updated_at();