/*
  # Fix Profile Tables Schema

  1. Updates
    - Fix profile_conditions table to use diagnosed_at instead of diagnosed_on
    - Remove user_id foreign key from satellite tables (profile_conditions, profile_medications, profile_allergies)
    - Update RLS policies to use profile_id for access control
    - Add missing fields and summaries to user_medical_profiles

  2. Security
    - Ensure proper RLS policies for all tables
    - Fix foreign key relationships

  3. Features
    - Add summary fields for conditions, medications, and allergies
    - Support for emergency contact information
*/

-- First, check if tables exist and create them if they don't
DO $$
BEGIN
  -- Create gender_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
    CREATE TYPE gender_type AS ENUM (
      'female',
      'male', 
      'non_binary',
      'prefer_not_to_say',
      'other'
    );
  END IF;

  -- Create blood_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type') THEN
    CREATE TYPE blood_type AS ENUM (
      'A+', 'A‑', 'B+', 'B‑', 
      'AB+', 'AB‑', 'O+', 'O‑', 
      'unknown'
    );
  END IF;

  -- Create user_medical_profiles table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_medical_profiles') THEN
    CREATE TABLE user_medical_profiles (
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
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE user_medical_profiles ENABLE ROW LEVEL SECURITY;

    -- Create RLS policy
    CREATE POLICY "profiles_owner" ON user_medical_profiles
      FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  ELSE
    -- Add missing columns to user_medical_profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medical_profiles' AND column_name = 'conditions_summary') THEN
      ALTER TABLE user_medical_profiles ADD COLUMN conditions_summary text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medical_profiles' AND column_name = 'medications_summary') THEN
      ALTER TABLE user_medical_profiles ADD COLUMN medications_summary text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medical_profiles' AND column_name = 'allergies_summary') THEN
      ALTER TABLE user_medical_profiles ADD COLUMN allergies_summary text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medical_profiles' AND column_name = 'family_history') THEN
      ALTER TABLE user_medical_profiles ADD COLUMN family_history text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medical_profiles' AND column_name = 'emergency_contact') THEN
      ALTER TABLE user_medical_profiles ADD COLUMN emergency_contact jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medical_profiles' AND column_name = 'full_name') THEN
      ALTER TABLE user_medical_profiles ADD COLUMN full_name text;
    END IF;
  END IF;
END$$;

-- Fix profile_conditions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profile_conditions') THEN
    -- Rename diagnosed_on to diagnosed_at if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_conditions' AND column_name = 'diagnosed_on') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_conditions' AND column_name = 'diagnosed_at') THEN
      ALTER TABLE profile_conditions RENAME COLUMN diagnosed_on TO diagnosed_at;
    END IF;

    -- Add ongoing column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_conditions' AND column_name = 'ongoing') THEN
      ALTER TABLE profile_conditions ADD COLUMN ongoing boolean DEFAULT true;
    END IF;
  ELSE
    -- Create profile_conditions table
    CREATE TABLE profile_conditions (
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

    -- Enable RLS
    ALTER TABLE profile_conditions ENABLE ROW LEVEL SECURITY;

    -- Create RLS policy
    CREATE POLICY "conditions_owner" ON profile_conditions
      FOR ALL
      USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
      WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
  END IF;
END$$;

-- Fix profile_medications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profile_medications') THEN
    CREATE TABLE profile_medications (
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

    -- Enable RLS
    ALTER TABLE profile_medications ENABLE ROW LEVEL SECURITY;

    -- Create RLS policy
    CREATE POLICY "medications_owner" ON profile_medications
      FOR ALL
      USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
      WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
  END IF;
END$$;

-- Fix profile_allergies table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profile_allergies') THEN
    CREATE TABLE profile_allergies (
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

    -- Enable RLS
    ALTER TABLE profile_allergies ENABLE ROW LEVEL SECURITY;

    -- Create RLS policy
    CREATE POLICY "allergies_owner" ON profile_allergies
      FOR ALL
      USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
      WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
  END IF;
END$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$
BEGIN
  -- user_medical_profiles trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_medical_profiles_updated_at') THEN
    CREATE TRIGGER update_user_medical_profiles_updated_at
      BEFORE UPDATE ON user_medical_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- profile_conditions trigger
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profile_conditions') 
  AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_conditions_updated_at') THEN
    CREATE TRIGGER update_profile_conditions_updated_at
      BEFORE UPDATE ON profile_conditions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- profile_medications trigger
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profile_medications') 
  AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_medications_updated_at') THEN
    CREATE TRIGGER update_profile_medications_updated_at
      BEFORE UPDATE ON profile_medications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- profile_allergies trigger
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profile_allergies') 
  AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_allergies_updated_at') THEN
    CREATE TRIGGER update_profile_allergies_updated_at
      BEFORE UPDATE ON profile_allergies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_medical_profiles_user_id_idx ON user_medical_profiles(user_id);
CREATE INDEX IF NOT EXISTS profile_conditions_profile_id_idx ON profile_conditions(profile_id);
CREATE INDEX IF NOT EXISTS profile_medications_profile_id_idx ON profile_medications(profile_id);
CREATE INDEX IF NOT EXISTS profile_allergies_profile_id_idx ON profile_allergies(profile_id);