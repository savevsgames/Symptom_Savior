/*
  # Profile Data Management System

  1. New Tables
    - `user_medical_profiles` - Core personal health information
    - `profile_conditions` - Detailed chronic conditions tracking
    - `profile_medications` - Detailed medication history
    - `profile_allergies` - Detailed allergy information

  2. Supporting Types
    - `gender_type` - Gender options enum
    - `blood_type` - Blood type options enum

  3. Security
    - Enable RLS on all profile tables
    - Add policies for users to manage their own profile data
    - Ensure proper indexing for performance

  4. Features
    - Comprehensive personal health information
    - Detailed condition, medication, and allergy tracking
    - Emergency contact information
    - Profile completion tracking
*/

-- Create supporting enums
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type') THEN
    CREATE TYPE blood_type AS ENUM (
      'A+', 'A‑', 'B+', 'B‑', 
      'AB+', 'AB‑', 'O+', 'O‑', 
      'unknown'
    );
  END IF;
END$$;

-- 1. Core user medical profiles table
CREATE TABLE IF NOT EXISTS user_medical_profiles (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  date_of_birth    date,
  gender           gender_type,
  blood_group      blood_type DEFAULT 'unknown',
  height_cm        numeric,
  weight_kg        numeric,
  emergency_contact jsonb DEFAULT '{}'::jsonb,
  medications      jsonb DEFAULT '[]'::jsonb,
  chronic_conditions jsonb DEFAULT '[]'::jsonb,
  allergies        jsonb DEFAULT '[]'::jsonb,
  preferred_language text DEFAULT 'en',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Detailed conditions tracking
CREATE TABLE IF NOT EXISTS profile_conditions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  condition_name text NOT NULL,
  diagnosed_on date,
  resolved_on date,
  severity int CHECK (severity BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Detailed medications tracking
CREATE TABLE IF NOT EXISTS profile_medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dose text,
  frequency text,
  started_on date,
  stopped_on date,
  prescribing_doctor text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Detailed allergies tracking
CREATE TABLE IF NOT EXISTS profile_allergies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  reaction text,
  severity int CHECK (severity BETWEEN 1 AND 10),
  discovered_on date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_allergies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_medical_profiles
CREATE POLICY "profiles_owner" ON user_medical_profiles
  FOR ALL
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for profile_conditions
CREATE POLICY "profile_conditions_owner" ON profile_conditions
  FOR ALL
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for profile_medications
CREATE POLICY "profile_medications_owner" ON profile_medications
  FOR ALL
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for profile_allergies
CREATE POLICY "profile_allergies_owner" ON profile_allergies
  FOR ALL
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_medical_profiles_user_id_idx ON user_medical_profiles(user_id);
CREATE INDEX IF NOT EXISTS profile_conditions_user_id_profile_id_idx ON profile_conditions(user_id, profile_id);
CREATE INDEX IF NOT EXISTS profile_medications_user_id_profile_id_idx ON profile_medications(user_id, profile_id);
CREATE INDEX IF NOT EXISTS profile_allergies_user_id_profile_id_idx ON profile_allergies(user_id, profile_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_medical_profiles_updated_at
  BEFORE UPDATE ON user_medical_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_conditions_updated_at
  BEFORE UPDATE ON profile_conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_medications_updated_at
  BEFORE UPDATE ON profile_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_allergies_updated_at
  BEFORE UPDATE ON profile_allergies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();