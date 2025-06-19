/*
  # Create user_symptoms table for dedicated symptom tracking

  1. New Tables
    - `user_symptoms`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `symptom_name` (text, the main symptom)
      - `severity` (integer, 1-10 scale)
      - `description` (text, additional details)
      - `triggers` (text array, potential triggers)
      - `duration_hours` (integer, how long symptom lasted)
      - `location` (text, body part/location)
      - `recorded_at` (timestamptz, when symptom occurred)
      - `created_at` (timestamptz, when record was created)
      - `updated_at` (timestamptz, when record was last updated)

  2. Security
    - Enable RLS on `user_symptoms` table
    - Add policies for users to manage their own symptom data
    - Ensure proper indexing for performance

  3. Indexes
    - Index on user_id for fast user-specific queries
    - Index on recorded_at for chronological sorting
    - Index on severity for filtering
*/

-- Create the user_symptoms table
CREATE TABLE IF NOT EXISTS user_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom_name text NOT NULL,
  severity integer NOT NULL CHECK (severity >= 1 AND severity <= 10),
  description text,
  triggers text[] DEFAULT '{}',
  duration_hours integer,
  location text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_symptoms ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own symptoms"
  ON user_symptoms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptoms"
  ON user_symptoms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptoms"
  ON user_symptoms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptoms"
  ON user_symptoms
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_symptoms_user_id_idx ON user_symptoms(user_id);
CREATE INDEX IF NOT EXISTS user_symptoms_recorded_at_idx ON user_symptoms(recorded_at DESC);
CREATE INDEX IF NOT EXISTS user_symptoms_severity_idx ON user_symptoms(severity);
CREATE INDEX IF NOT EXISTS user_symptoms_symptom_name_idx ON user_symptoms(symptom_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_symptoms_updated_at
  BEFORE UPDATE ON user_symptoms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();