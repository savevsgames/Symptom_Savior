/*
  # Conversation Sessions Schema

  1. New Tables
    - `conversation_sessions` - Stores ongoing conversation sessions with history and context
    
  2. Security
    - Enable RLS on conversation_sessions table
    - Add policies for users to manage their own conversation data
    - Ensure proper indexing for performance

  3. Features
    - Session management with status tracking
    - Medical profile context storage
    - Conversation history as JSONB array
    - Session metadata for additional context
*/

-- Create conversation_sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_profile jsonb DEFAULT '{}'::jsonb,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active'::text,
  session_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Add status check constraint
ALTER TABLE conversation_sessions
  ADD CONSTRAINT conversation_sessions_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text]));

-- Enable Row Level Security
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage all conversation sessions"
  ON conversation_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can create their own conversation sessions"
  ON conversation_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversation sessions"
  ON conversation_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation sessions"
  ON conversation_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation sessions"
  ON conversation_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX conversation_sessions_user_id_idx ON conversation_sessions(user_id);
CREATE INDEX conversation_sessions_status_idx ON conversation_sessions(status);
CREATE INDEX conversation_sessions_created_at_idx ON conversation_sessions(created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_conversation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_conversation_sessions_updated_at
  BEFORE UPDATE ON conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_sessions_updated_at();