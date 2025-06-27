# Supabase Configuration Documentation

## Overview

This document provides a comprehensive overview of the Supabase database schema and Row Level Security (RLS) policies for the **Symptom Savior** application. This information is essential for understanding the data structure and security model when processing medical consultations and accessing user health data.

## Database Architecture

The Symptom Savior application uses a comprehensive health tracking schema with the following core principles:

- **User-Centric Design**: All health data is tied to authenticated users via `auth.users`
- **Row Level Security**: Every table implements RLS to ensure data privacy
- **Relational Integrity**: Bridge tables connect symptoms, treatments, and doctor visits
- **Audit Trail**: All tables include `created_at` and `updated_at` timestamps

## Core Health Tracking Tables

### 1. `user_symptoms` - Symptom Tracking

**Purpose**: Central table for logging patient symptoms with comprehensive details.

```sql
CREATE TABLE user_symptoms (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom_name    text NOT NULL,
  severity        int CHECK (severity BETWEEN 1 AND 10),
  description     text,
  triggers        text,
  duration_hours  int,
  location        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Key Fields**:
- `symptom_name`: Primary symptom description (e.g., "Headache", "Chest Pain")
- `severity`: 1-10 scale (1=minimal, 10=severe)
- `description`: Detailed symptom description
- `triggers`: Comma-separated potential triggers (e.g., "stress, weather, lack of sleep")
- `duration_hours`: How long the symptom lasted
- `location`: Body part/area affected (e.g., "head", "chest", "lower back")

**RLS Policy**: Users can only access their own symptoms

### 2. `treatments` - Treatment Tracking

**Purpose**: Track medications, supplements, exercises, therapy, and other treatments.

```sql
CREATE TABLE treatments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_type    treatment_type NOT NULL,
  name              text NOT NULL,
  dosage            text,
  duration          text,
  description       text,
  doctor_recommended boolean DEFAULT false,
  completed          boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE treatment_type AS ENUM (
  'medication',
  'supplement', 
  'exercise',
  'therapy',
  'other'
);
```

**Key Fields**:
- `treatment_type`: Categorizes the intervention type
- `name`: Treatment name (e.g., "Ibuprofen", "Physical Therapy")
- `dosage`: Medication dosage or treatment frequency
- `doctor_recommended`: Whether prescribed by healthcare provider
- `completed`: Treatment completion status

**RLS Policy**: Users can only access their own treatments

### 3. `doctor_visits` - Healthcare Appointment Tracking

**Purpose**: Track medical appointments, consultations, and healthcare interactions.

```sql
CREATE TABLE doctor_visits (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_ts              timestamptz NOT NULL,
  doctor_name           text,
  location              text,
  contact_phone         text,
  contact_email         text,
  visit_prep            text,
  visit_summary         text,
  follow_up_required    boolean DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

**Key Fields**:
- `visit_ts`: Appointment date/time
- `doctor_name`: Healthcare provider name
- `visit_prep`: Pre-visit preparation notes
- `visit_summary`: Post-visit summary and outcomes
- `follow_up_required`: Whether follow-up is needed

**RLS Policy**: Users can only access their own visits

## Medical Profile Tables

### 4. `user_medical_profiles` - Core Profile Information

**Purpose**: Store comprehensive personal health information and demographics for each user.

```sql
CREATE TABLE user_medical_profiles (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  date_of_birth    date,
  gender           gender_type,
  blood_type       blood_type,
  height_cm        numeric,
  weight_kg        numeric,
  emergency_contact jsonb DEFAULT '{}'::jsonb,
  conditions_summary text,
  medications_summary text,
  allergies_summary text,
  family_history    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE gender_type AS ENUM (
  'female',
  'male', 
  'non_binary',
  'prefer_not_to_say',
  'other'
);

CREATE TYPE blood_type AS ENUM (
  'A+', 'A‑', 'B+', 'B‑', 
  'AB+', 'AB‑', 'O+', 'O‑', 
  'unknown'
);
```

**Key Fields**:
- `full_name`: Patient's full name
- `date_of_birth`: For age-specific medical guidance
- `gender`: For gender-specific health considerations
- `blood_type`: Important for emergency situations
- `height_cm`/`weight_kg`: For BMI and dosage calculations
- `emergency_contact`: JSONB containing emergency contact information
- `conditions_summary`, `medications_summary`, `allergies_summary`: AI-generated summaries
- `family_history`: Medical history of family members

**RLS Policy**: Users can only access their own profile

### 5. `profile_conditions` - Detailed Condition Tracking

**Purpose**: Track detailed information about chronic conditions and medical history.

```sql
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
```

**Key Features**:
- Links to both user and profile for data integrity
- Tracks condition lifecycle (diagnosis to resolution)
- Severity scoring for condition impact assessment
- Detailed notes for additional context

### 6. `profile_medications` - Detailed Medication Tracking

**Purpose**: Track detailed medication history and current prescriptions.

```sql
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
```

**Key Features**:
- Complete medication lifecycle tracking
- Dosage and frequency information
- Prescribing physician tracking
- Start/end dates for medication history

### 7. `profile_allergies` - Detailed Allergy Tracking

**Purpose**: Track detailed allergy information with severity and reaction details.

```sql
CREATE TABLE profile_allergies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES user_medical_profiles(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  reaction text,
  severity int CHECK (severity BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Key Features**:
- Specific allergen identification
- Reaction type and severity tracking
- Detailed notes for emergency situations

## Relationship (Bridge) Tables

### 8. `symptom_treatments` - Symptom-Treatment Relationships

**Purpose**: Links symptoms to their corresponding treatments.

```sql
CREATE TABLE symptom_treatments (
  symptom_id   uuid REFERENCES user_symptoms(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, treatment_id)
);
```

**RLS Policy**: User must own both the symptom and treatment

### 9. `visit_symptoms` - Visit-Symptom Relationships

**Purpose**: Links doctor visits to symptoms discussed during the visit.

```sql
CREATE TABLE visit_symptoms (
  visit_id   uuid REFERENCES doctor_visits(id) ON DELETE CASCADE,
  symptom_id uuid REFERENCES user_symptoms(id) ON DELETE CASCADE,
  PRIMARY KEY (visit_id, symptom_id)
);
```

**RLS Policy**: User must own both the visit and symptom

### 10. `visit_treatments` - Visit-Treatment Relationships

**Purpose**: Links doctor visits to treatments prescribed or discussed.

```sql
CREATE TABLE visit_treatments (
  visit_id     uuid REFERENCES doctor_visits(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id) ON DELETE CASCADE,
  PRIMARY KEY (visit_id, treatment_id)
);
```

**RLS Policy**: User must own both the visit and treatment

## AI and Document Management Tables

### 11. `documents` - Medical Document Storage

**Purpose**: Store medical documents with vector embeddings for RAG system.

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text,
  content text NOT NULL,
  embedding vector(768),
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Key Features**:
- Vector embeddings for semantic search
- JSONB metadata for flexible document properties
- User-specific document storage

### 12. `agents` - AI Session Management

**Purpose**: Track AI agent sessions and conversation context.

```sql
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'initializing',
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  terminated_at timestamptz
);
```

**Key Features**:
- Tracks AI agent sessions for each user
- Stores session state and context
- Manages agent lifecycle (initialization to termination)

### 13. `embedding_jobs` - Document Processing Queue

**Purpose**: Track document embedding processing jobs.

```sql
CREATE TABLE embedding_jobs (
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
```

**Key Features**:
- Tracks document processing status
- Stores metadata about processing jobs
- Records errors for troubleshooting

### 14. `medical_consultations` - AI Consultation Logs

**Purpose**: Record all AI medical consultations for history and analysis.

```sql
CREATE TABLE medical_consultations (
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
```

**Key Features**:
- Comprehensive logging of all AI interactions
- Stores both query and response text
- Tracks emergency detection for safety monitoring
- Records sources used in RAG responses
- Stores URLs for voice and video responses

### 15. `conversation_sessions` - Real-time Conversation Management

**Purpose**: Manage ongoing conversation sessions with history and context.

```sql
CREATE TABLE conversation_sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_profile jsonb DEFAULT '{}'::jsonb,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])),
  session_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
```

**Key Features**:
- Maintains conversation context across interactions
- Stores medical profile information for personalized responses
- Tracks conversation history for multi-turn context
- Manages session lifecycle (active, paused, ended)

## Testing Application Tables

These tables support the automated testing infrastructure for the Symptom Savior application.

### 16. `test_runs` - Test Execution Tracking

**Purpose**: Track automated test runs and their results.

```sql
CREATE TABLE test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type character varying(50) NOT NULL,
  environment character varying(50) NOT NULL,
  target_url text NOT NULL,
  commit_sha character varying(40),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status character varying(20) DEFAULT 'running',
  total_tests integer DEFAULT 0,
  passed_tests integer DEFAULT 0,
  failed_tests integer DEFAULT 0,
  skipped_tests integer DEFAULT 0
);
```

**Key Features**:
- Tracks test execution metadata
- Records test run results and statistics
- Links to specific code commits and environments

### 17. `test_results` - Individual Test Outcomes

**Purpose**: Store detailed results for individual test cases.

```sql
CREATE TABLE test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid REFERENCES test_runs(id) ON DELETE CASCADE,
  test_suite character varying(100) NOT NULL,
  test_name character varying(200) NOT NULL,
  status character varying(20) NOT NULL,
  duration_ms integer,
  error_message text,
  screenshot_url text,
  created_at timestamptz DEFAULT now()
);
```

**Key Features**:
- Detailed test case results
- Error messages for failed tests
- Screenshots for visual verification
- Performance metrics for each test

### 18. `test_suites` - Test Suite Configuration

**Purpose**: Define and manage test suites for the application.

```sql
CREATE TABLE test_suites (
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
```

**Key Features**:
- Defines test suites and their configuration
- Tracks test suite performance metrics
- Enables/disables test suites as needed

### 19. `performance_metrics` - Application Performance Data

**Purpose**: Store performance metrics collected during testing.

```sql
CREATE TABLE performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid REFERENCES test_runs(id) ON DELETE CASCADE,
  metric_name character varying(100) NOT NULL,
  metric_value numeric,
  metric_unit character varying(20),
  page_url text,
  created_at timestamptz DEFAULT now()
);
```

**Key Features**:
- Tracks application performance metrics
- Links metrics to specific test runs
- Supports trend analysis over time

### 20. `testing_admin_users` - Testing Administration

**Purpose**: Manage users with testing administration privileges.

```sql
CREATE TABLE testing_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  added_at timestamptz DEFAULT now()
);
```

**Key Features**:
- Defines users with testing administration privileges
- Controls access to testing infrastructure

## Row Level Security (RLS) Policies

All tables implement comprehensive RLS policies to ensure data privacy and security:

### Core Health Data Policies

```sql
-- User Symptoms
CREATE POLICY "symptoms_owner" ON user_symptoms
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Treatments
CREATE POLICY "treatments_owner" ON treatments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Doctor Visits
CREATE POLICY "visits_owner" ON doctor_visits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Medical Profiles
CREATE POLICY "profiles_owner" ON user_medical_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Profile Satellite Tables Policies

```sql
-- Profile Conditions
CREATE POLICY "profile_conditions_owner" ON profile_conditions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profile Medications
CREATE POLICY "profile_medications_owner" ON profile_medications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profile Allergies
CREATE POLICY "profile_allergies_owner" ON profile_allergies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Bridge Table Policies

```sql
-- Symptom-Treatment Relationships
CREATE POLICY "link_sympt_treat" ON symptom_treatments
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM user_symptoms WHERE id = symptom_id)
    AND auth.uid() = (SELECT user_id FROM treatments WHERE id = treatment_id)
  );

-- Visit-Symptom Relationships
CREATE POLICY "link_visit_sympt" ON visit_symptoms
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM doctor_visits WHERE id = visit_id)
    AND auth.uid() = (SELECT user_id FROM user_symptoms WHERE id = symptom_id)
  );

-- Visit-Treatment Relationships
CREATE POLICY "link_visit_treat" ON visit_treatments
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM doctor_visits WHERE id = visit_id)
    AND auth.uid() = (SELECT user_id FROM treatments WHERE id = treatment_id)
  );
```

### AI and Document Policies

```sql
-- Documents
CREATE POLICY "Users can view their own documents" 
  ON documents FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own documents" 
  ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medical Consultations
CREATE POLICY "Users can view their own consultations" 
  ON medical_consultations FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own consultations" 
  ON medical_consultations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversation Sessions
CREATE POLICY "Users can view their own conversation sessions" 
  ON conversation_sessions FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own conversation sessions" 
  ON conversation_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Testing Application Policies

```sql
-- Test Runs
CREATE POLICY "Admins can view all test runs" 
  ON test_runs FOR SELECT USING (auth.uid() IN (SELECT user_id FROM testing_admin_users));

-- Test Results
CREATE POLICY "Admins can view all test results" 
  ON test_results FOR SELECT USING (auth.uid() IN (SELECT user_id FROM testing_admin_users));

-- Service Role Bypass
CREATE POLICY "Service role can manage all test data" 
  ON test_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
```

## Performance Indexes

```sql
-- Core symptom tracking indexes
CREATE INDEX user_symptoms_user_id_created_at_idx ON user_symptoms (user_id, created_at);
CREATE INDEX treatments_user_id_created_at_idx ON treatments (user_id, created_at);
CREATE INDEX doctor_visits_user_id_visit_ts_idx ON doctor_visits (user_id, visit_ts);

-- Profile and satellite table indexes
CREATE INDEX user_med_profiles_user_idx ON user_medical_profiles (user_id);
CREATE INDEX profile_cond_profile_idx ON profile_conditions (profile_id);
CREATE INDEX profile_med_profile_idx ON profile_medications (profile_id);
CREATE INDEX profile_allergy_profile_idx ON profile_allergies (profile_id);

-- AI and document indexes
CREATE INDEX documents_user_id_idx ON documents (user_id);
CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX medical_consultations_user_id_idx ON medical_consultations (user_id);
CREATE INDEX medical_consultations_created_at_idx ON medical_consultations (created_at DESC);
CREATE INDEX conversation_sessions_user_id_idx ON conversation_sessions (user_id);
CREATE INDEX conversation_sessions_status_idx ON conversation_sessions (status);

-- Testing application indexes
CREATE INDEX test_runs_user_id_idx ON test_runs (user_id);
CREATE INDEX test_runs_status_idx ON test_runs (status);
CREATE INDEX test_results_test_run_id_idx ON test_results (test_run_id);
```

## Common Query Patterns

### Get User's Recent Symptoms

```sql
SELECT * FROM user_symptoms
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

### Get User's Medical Profile with Conditions, Medications, and Allergies

```sql
-- Get profile
SELECT * FROM user_medical_profiles
WHERE user_id = auth.uid();

-- Get conditions
SELECT * FROM profile_conditions
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Get medications
SELECT * FROM profile_medications
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Get allergies
SELECT * FROM profile_allergies
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Get Comprehensive Health Context for AI

```sql
WITH recent_symptoms AS (
  SELECT symptom_name, severity, created_at
  FROM user_symptoms
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 5
),
active_conditions AS (
  SELECT condition_name, severity
  FROM profile_conditions
  WHERE user_id = auth.uid() AND ongoing = true
),
current_medications AS (
  SELECT medication_name, dosage, frequency
  FROM profile_medications
  WHERE user_id = auth.uid() AND is_current = true
),
user_allergies AS (
  SELECT allergen, severity
  FROM profile_allergies
  WHERE user_id = auth.uid()
)
SELECT 
  p.full_name,
  p.date_of_birth,
  p.gender,
  p.height_cm,
  p.weight_kg,
  p.blood_type,
  json_agg(DISTINCT rs.*) AS recent_symptoms,
  json_agg(DISTINCT ac.*) AS active_conditions,
  json_agg(DISTINCT cm.*) AS current_medications,
  json_agg(DISTINCT ua.*) AS allergies
FROM user_medical_profiles p
LEFT JOIN recent_symptoms rs ON true
LEFT JOIN active_conditions ac ON true
LEFT JOIN current_medications cm ON true
LEFT JOIN user_allergies ua ON true
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.full_name, p.date_of_birth, p.gender, p.height_cm, p.weight_kg, p.blood_type;
```

## Migration Considerations

When creating new migrations, consider the following:

1. **Always use IF NOT EXISTS**: Prevent errors when tables already exist
2. **Add RLS policies**: Ensure all tables have proper RLS policies
3. **Create indexes**: Add appropriate indexes for performance
4. **Add foreign keys**: Maintain referential integrity
5. **Set default values**: Use sensible defaults for required fields
6. **Add constraints**: Ensure data integrity with appropriate constraints
7. **Include comments**: Document the purpose of tables and columns

Example migration pattern:

```sql
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- other fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" 
  ON new_table FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own data" 
  ON new_table FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX new_table_user_id_idx ON new_table (user_id);
CREATE INDEX new_table_created_at_idx ON new_table (created_at);

-- Create updated_at trigger
CREATE TRIGGER update_new_table_updated_at
  BEFORE UPDATE ON new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Schema Evolution Guidelines

When evolving the schema, follow these guidelines:

1. **Backward Compatibility**: Ensure changes don't break existing functionality
2. **Add, Don't Remove**: Add new columns rather than removing existing ones
3. **Default Values**: Provide sensible defaults for new columns
4. **Update RLS**: Update RLS policies when adding new tables or columns
5. **Test Migrations**: Test migrations in development before applying to production
6. **Document Changes**: Update this document when making schema changes

## Conclusion

This schema provides a robust foundation for the Symptom Savior application, supporting comprehensive health tracking, AI-powered consultations, and automated testing. The design prioritizes data privacy through RLS policies while enabling rich functionality through well-structured relationships between tables.