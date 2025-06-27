/*
  # Symptom Savior Consolidated Database Schema

  This migration file creates the complete database schema for the Symptom Savior application,
  including all tables, enums, relationships, RLS policies, and indexes.

  1. Core Tables
    - `user_symptoms` - Symptom tracking
    - `treatments` - Treatment tracking
    - `doctor_visits` - Medical appointment tracking
    - `user_medical_profiles` - User health profiles
    - `profile_conditions` - Medical conditions
    - `profile_medications` - Medication tracking
    - `profile_allergies` - Allergy tracking
    - `documents` - Medical document storage with vector embeddings
    - `medical_consultations` - AI consultation logs
    - `conversation_sessions` - Conversation management

  2. Bridge Tables
    - `symptom_treatments` - Links symptoms to treatments
    - `visit_symptoms` - Links visits to symptoms
    - `visit_treatments` - Links visits to treatments

  3. Testing Infrastructure
    - `test_runs` - Test execution tracking
    - `test_results` - Individual test results
    - `performance_metrics` - Performance monitoring
    - `test_suites` - Test suite configuration
    - `testing_admin_users` - Testing administration

  4. Security
    - Row Level Security (RLS) on all tables
    - User-specific data isolation
    - JWT-based authentication
*/

-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================

-- Create treatment_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_type') THEN
    CREATE TYPE treatment_type AS ENUM (
      'medication',
      'supplement', 
      'exercise',
      'therapy',
      'other'
    );
  END IF;
END$$;

-- Create gender_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
    CREATE TYPE gender_type AS ENUM (
      'female',
      'male', 
      'non_binary',
      'prefer_not_to_say',
      'other'
    );
  END IF;
END$$;

-- Create blood_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type') THEN
    CREATE TYPE blood_type AS ENUM (
      'A+', 'A-', 'B+', 'B-', 
      'AB+', 'AB-', 'O+', 'O-', 
      'unknown'
    );
  END IF;
END$$;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create agent last active trigger function
CREATE OR REPLACE FUNCTION update_agent_last_active_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create medical consultations updated_at trigger function
CREATE OR REPLACE FUNCTION update_medical_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create conversation sessions updated_at trigger function
CREATE OR REPLACE FUNCTION update_conversation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- CORE TABLES
-- ==========================================

-- 1. User Symptoms Table
CREATE TABLE IF NOT EXISTS user_symptoms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom_name text NOT NULL,
  severity int CHECK (severity BETWEEN 1 AND 10),
  description text,
  triggers text,
  duration_hours int,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_type treatment_type NOT NULL,
  name text NOT NULL,
  dosage text,
  duration text,
  description text,
  doctor_recommended boolean DEFAULT false,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Doctor Visits Table
CREATE TABLE IF NOT EXISTS doctor_visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_ts timestamptz NOT NULL,
  doctor_name text,
  location text,
  contact_phone text,
  contact_email text,
  visit_prep text,
  visit_summary text,
  follow_up_required boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. User Medical Profiles Table
CREATE TABLE IF NOT EXISTS user_medical_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  date_of_birth date,
  gender gender_type,
  blood_group blood_type DEFAULT 'unknown',
  height_cm numeric,
  weight_kg numeric,
  emergency_contact jsonb DEFAULT '{}'::jsonb,
  conditions_summary text,
  medications_summary text,
  allergies_summary text,
  family_history text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. Profile Conditions Table
CREATE TABLE IF NOT EXISTS profile_conditions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  condition_name text NOT NULL,
  diagnosed_at date,
  severity int CHECK (severity BETWEEN 1 AND 10),
  ongoing boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. Profile Medications Table
CREATE TABLE IF NOT EXISTS profile_medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  prescribed_by text,
  is_current boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. Profile Allergies Table
CREATE TABLE IF NOT EXISTS profile_allergies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  reaction text,
  severity int CHECK (severity BETWEEN 1 AND 10),
  discovered_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 8. Documents Table (for RAG system)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text,
  content text NOT NULL,
  embedding vector(768),
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 9. Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'initializing',
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  terminated_at timestamptz
);

-- 10. Embedding Jobs Table
CREATE TABLE IF NOT EXISTS embedding_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  chunk_count integer DEFAULT 0,
  error text,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Medical Consultations Table
CREATE TABLE IF NOT EXISTS medical_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  query text NOT NULL,
  response text NOT NULL,
  sources jsonb,
  voice_audio_url text,
  video_url text,
  consultation_type text NOT NULL,
  processing_time integer,
  emergency_detected boolean,
  context_used jsonb,
  confidence_score numeric,
  recommendations jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Conversation Sessions Table
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

-- Add status check constraint to conversation_sessions
ALTER TABLE conversation_sessions
  DROP CONSTRAINT IF EXISTS conversation_sessions_status_check;

ALTER TABLE conversation_sessions
  ADD CONSTRAINT conversation_sessions_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text]));

-- ==========================================
-- BRIDGE TABLES
-- ==========================================

-- 13. Symptom Treatments Bridge Table
CREATE TABLE IF NOT EXISTS symptom_treatments (
  symptom_id uuid REFERENCES user_symptoms(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, treatment_id)
);

-- 14. Visit Symptoms Bridge Table
CREATE TABLE IF NOT EXISTS visit_symptoms (
  visit_id uuid REFERENCES doctor_visits(id) ON DELETE CASCADE,
  symptom_id uuid REFERENCES user_symptoms(id) ON DELETE CASCADE,
  PRIMARY KEY (visit_id, symptom_id)
);

-- 15. Visit Treatments Bridge Table
CREATE TABLE IF NOT EXISTS visit_treatments (
  visit_id uuid REFERENCES doctor_visits(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id) ON DELETE CASCADE,
  PRIMARY KEY (visit_id, treatment_id)
);

-- ==========================================
-- TESTING INFRASTRUCTURE TABLES
-- ==========================================

-- 16. Testing Admin Users Table
CREATE TABLE IF NOT EXISTS testing_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  added_at timestamptz DEFAULT now()
);

-- 17. Test Runs Table
CREATE TABLE IF NOT EXISTS test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type varchar(50) NOT NULL,
  environment varchar(50) NOT NULL,
  target_url text NOT NULL,
  commit_sha varchar(40),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status varchar(20) DEFAULT 'running',
  total_tests integer DEFAULT 0,
  passed_tests integer DEFAULT 0,
  failed_tests integer DEFAULT 0,
  skipped_tests integer DEFAULT 0
);

-- 18. Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid REFERENCES test_runs(id) ON DELETE CASCADE,
  test_suite varchar(100) NOT NULL,
  test_name varchar(200) NOT NULL,
  status varchar(20) NOT NULL,
  duration_ms integer,
  error_message text,
  screenshot_url text,
  created_at timestamptz DEFAULT now()
);

-- 19. Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid REFERENCES test_runs(id) ON DELETE CASCADE,
  metric_name varchar(100) NOT NULL,
  metric_value numeric,
  metric_unit varchar(20),
  page_url text,
  created_at timestamptz DEFAULT now()
);

-- 20. Test Suites Table
CREATE TABLE IF NOT EXISTS test_suites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  test_count integer DEFAULT 0,
  last_run_at timestamptz,
  average_duration_ms integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE user_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- User Symptoms Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_symptoms' AND policyname = 'symptoms_owner') THEN
    CREATE POLICY "symptoms_owner" ON user_symptoms
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Treatments Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'treatments' AND policyname = 'treatments_owner') THEN
    CREATE POLICY "treatments_owner" ON treatments
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Doctor Visits Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doctor_visits' AND policyname = 'visits_owner') THEN
    CREATE POLICY "visits_owner" ON doctor_visits
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- User Medical Profiles Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_medical_profiles' AND policyname = 'profiles_owner') THEN
    CREATE POLICY "profiles_owner" ON user_medical_profiles
      FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Profile Conditions Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profile_conditions' AND policyname = 'conditions_owner') THEN
    CREATE POLICY "conditions_owner" ON profile_conditions
      FOR ALL
      USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
      WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
  END IF;
END$$;

-- Profile Medications Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profile_medications' AND policyname = 'medications_owner') THEN
    CREATE POLICY "medications_owner" ON profile_medications
      FOR ALL
      USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
      WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
  END IF;
END$$;

-- Profile Allergies Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profile_allergies' AND policyname = 'allergies_owner') THEN
    CREATE POLICY "allergies_owner" ON profile_allergies
      FOR ALL
      USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
      WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
  END IF;
END$$;

-- Documents Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Shared read access to document embeddings') THEN
    CREATE POLICY "Shared read access to document embeddings" ON documents
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

-- Agents Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can select own agents') THEN
    CREATE POLICY "Users can select own agents" ON agents
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Embedding Jobs Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'embedding_jobs' AND policyname = 'Users can select own embedding jobs') THEN
    CREATE POLICY "Users can select own embedding jobs" ON embedding_jobs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Medical Consultations Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_consultations' AND policyname = 'Users can insert their own consultations') THEN
    CREATE POLICY "Users can insert their own consultations" ON medical_consultations
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_consultations' AND policyname = 'Users can view their own consultations') THEN
    CREATE POLICY "Users can view their own consultations" ON medical_consultations
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Conversation Sessions Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_sessions' AND policyname = 'Users can view their own conversation sessions') THEN
    CREATE POLICY "Users can view their own conversation sessions" ON conversation_sessions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_sessions' AND policyname = 'Users can update their own conversation sessions') THEN
    CREATE POLICY "Users can update their own conversation sessions" ON conversation_sessions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Bridge Table Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'symptom_treatments' AND policyname = 'link_sympt_treat') THEN
    CREATE POLICY "link_sympt_treat" ON symptom_treatments
      FOR ALL
      USING (
        auth.uid() = (SELECT user_id FROM user_symptoms WHERE id = symptom_id)
        AND auth.uid() = (SELECT user_id FROM treatments WHERE id = treatment_id)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visit_symptoms' AND policyname = 'link_visit_sympt') THEN
    CREATE POLICY "link_visit_sympt" ON visit_symptoms
      FOR ALL
      USING (
        auth.uid() = (SELECT user_id FROM doctor_visits WHERE id = visit_id)
        AND auth.uid() = (SELECT user_id FROM user_symptoms WHERE id = symptom_id)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visit_treatments' AND policyname = 'link_visit_treat') THEN
    CREATE POLICY "link_visit_treat" ON visit_treatments
      FOR ALL
      USING (
        auth.uid() = (SELECT user_id FROM doctor_visits WHERE id = visit_id)
        AND auth.uid() = (SELECT user_id FROM treatments WHERE id = treatment_id)
      );
  END IF;
END$$;

-- Testing Infrastructure Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testing_admin_users' AND policyname = 'Service role can manage testing_admin_users') THEN
    CREATE POLICY "Service role can manage testing_admin_users" ON testing_admin_users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_runs' AND policyname = 'Service role can manage all test runs') THEN
    CREATE POLICY "Service role can manage all test runs" ON test_runs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Create triggers for updated_at columns
DO $$
BEGIN
  -- user_symptoms trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_symptoms_updated_at') THEN
    CREATE TRIGGER update_user_symptoms_updated_at
      BEFORE UPDATE ON user_symptoms
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- treatments trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_treatments_updated_at') THEN
    CREATE TRIGGER update_treatments_updated_at
      BEFORE UPDATE ON treatments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- doctor_visits trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctor_visits_updated_at') THEN
    CREATE TRIGGER update_doctor_visits_updated_at
      BEFORE UPDATE ON doctor_visits
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- user_medical_profiles trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_medical_profiles_updated_at') THEN
    CREATE TRIGGER update_user_medical_profiles_updated_at
      BEFORE UPDATE ON user_medical_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- profile_conditions trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_conditions_updated_at') THEN
    CREATE TRIGGER update_profile_conditions_updated_at
      BEFORE UPDATE ON profile_conditions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- profile_medications trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_medications_updated_at') THEN
    CREATE TRIGGER update_profile_medications_updated_at
      BEFORE UPDATE ON profile_medications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- profile_allergies trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_allergies_updated_at') THEN
    CREATE TRIGGER update_profile_allergies_updated_at
      BEFORE UPDATE ON profile_allergies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- embedding_jobs trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_embedding_jobs_updated_at') THEN
    CREATE TRIGGER update_embedding_jobs_updated_at
      BEFORE UPDATE ON embedding_jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- medical_consultations trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_medical_consultations_updated_at') THEN
    CREATE TRIGGER update_medical_consultations_updated_at
      BEFORE UPDATE ON medical_consultations
      FOR EACH ROW
      EXECUTE FUNCTION update_medical_consultations_updated_at();
  END IF;

  -- conversation_sessions trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversation_sessions_updated_at') THEN
    CREATE TRIGGER update_conversation_sessions_updated_at
      BEFORE UPDATE ON conversation_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_conversation_sessions_updated_at();
  END IF;

  -- agents trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_last_active') THEN
    CREATE TRIGGER update_agent_last_active
      BEFORE UPDATE ON agents
      FOR EACH ROW
      EXECUTE FUNCTION update_agent_last_active_trigger();
  END IF;

  -- test_suites trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_test_suites_updated_at') THEN
    CREATE TRIGGER update_test_suites_updated_at
      BEFORE UPDATE ON test_suites
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ==========================================
-- CREATE INDEXES
-- ==========================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS user_symptoms_user_id_idx ON user_symptoms(user_id);
CREATE INDEX IF NOT EXISTS user_symptoms_created_at_idx ON user_symptoms(created_at);
CREATE INDEX IF NOT EXISTS user_symptoms_severity_idx ON user_symptoms(severity);

CREATE INDEX IF NOT EXISTS treatments_user_id_idx ON treatments(user_id);
CREATE INDEX IF NOT EXISTS treatments_created_at_idx ON treatments(created_at);

CREATE INDEX IF NOT EXISTS doctor_visits_user_id_idx ON doctor_visits(user_id);
CREATE INDEX IF NOT EXISTS doctor_visits_visit_ts_idx ON doctor_visits(visit_ts);

-- Profile table indexes
CREATE INDEX IF NOT EXISTS user_medical_profiles_user_id_idx ON user_medical_profiles(user_id);

CREATE INDEX IF NOT EXISTS profile_conditions_profile_id_idx ON profile_conditions(profile_id);
CREATE INDEX IF NOT EXISTS profile_medications_profile_id_idx ON profile_medications(profile_id);
CREATE INDEX IF NOT EXISTS profile_allergies_profile_id_idx ON profile_allergies(profile_id);

-- AI integration indexes
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at);
CREATE INDEX IF NOT EXISTS documents_filename_idx ON documents(filename);

CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_status_idx ON agents(status);
CREATE INDEX IF NOT EXISTS agents_last_active_idx ON agents(last_active);

CREATE INDEX IF NOT EXISTS embedding_jobs_user_id_idx ON embedding_jobs(user_id);
CREATE INDEX IF NOT EXISTS embedding_jobs_status_idx ON embedding_jobs(status);

CREATE INDEX IF NOT EXISTS medical_consultations_user_id_idx ON medical_consultations(user_id);
CREATE INDEX IF NOT EXISTS medical_consultations_created_at_idx ON medical_consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS medical_consultations_session_id_idx ON medical_consultations(session_id);

CREATE INDEX IF NOT EXISTS conversation_sessions_user_id_idx ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS conversation_sessions_status_idx ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS conversation_sessions_created_at_idx ON conversation_sessions(created_at DESC);

-- Testing infrastructure indexes
CREATE INDEX IF NOT EXISTS test_runs_user_id_idx ON test_runs(user_id);
CREATE INDEX IF NOT EXISTS test_runs_status_idx ON test_runs(status);
CREATE INDEX IF NOT EXISTS test_runs_started_at_idx ON test_runs(started_at);

CREATE INDEX IF NOT EXISTS test_results_test_run_id_idx ON test_results(test_run_id);
CREATE INDEX IF NOT EXISTS test_results_status_idx ON test_results(status);

CREATE INDEX IF NOT EXISTS performance_metrics_test_run_id_idx ON performance_metrics(test_run_id);
CREATE INDEX IF NOT EXISTS performance_metrics_metric_name_idx ON performance_metrics(metric_name);

CREATE INDEX IF NOT EXISTS test_suites_enabled_idx ON test_suites(enabled);
CREATE INDEX IF NOT EXISTS test_suites_last_run_at_idx ON test_suites(last_run_at);

-- Vector search index for documents (if vector extension is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'documents_embedding_idx') THEN
      CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If vector extension is not available, skip this index
    RAISE NOTICE 'Vector extension not available, skipping vector index creation';
END$$;