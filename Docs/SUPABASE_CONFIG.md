# Supabase Configuration Documentation

## Overview

This document provides a comprehensive overview of the Supabase database schema and Row Level Security (RLS) policies for the **Symptom Savior** application. This information is essential for the TxAgent Container to understand the data structure and security model when processing medical consultations and accessing user health data.

## Database Architecture

The Symptom Savior application uses a comprehensive health tracking schema with the following core principles:

- **User-Centric Design**: All health data is tied to authenticated users via `auth.users`
- **Row Level Security**: Every table implements RLS to ensure data privacy
- **Relational Integrity**: Bridge tables connect symptoms, treatments, and doctor visits
- **Audit Trail**: All tables include `created_at` and `updated_at` timestamps

## Core Tables

### 1. `user_symptoms` - Primary Symptom Tracking

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

**Key Fields for TxAgent Context**:
- `symptom_name`: Primary symptom description (e.g., "Headache", "Chest Pain")
- `severity`: 1-10 scale (1=minimal, 10=severe)
- `description`: Detailed symptom description
- `triggers`: Comma-separated potential triggers (e.g., "stress, weather, lack of sleep")
- `duration_hours`: How long the symptom lasted
- `location`: Body part/area affected (e.g., "head", "chest", "lower back")

**RLS Policy**: Users can only access their own symptoms
```sql
CREATE POLICY "symptoms_owner" ON user_symptoms
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. `treatments` - Treatment and Intervention Tracking

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
```

**Treatment Types Enum**:
```sql
CREATE TYPE treatment_type AS ENUM (
  'medication',
  'supplement', 
  'exercise',
  'therapy',
  'other'
);
```

**Key Fields for TxAgent Context**:
- `treatment_type`: Categorizes the intervention type
- `name`: Treatment name (e.g., "Ibuprofen", "Physical Therapy")
- `dosage`: Medication dosage or treatment frequency
- `doctor_recommended`: Whether prescribed by healthcare provider
- `completed`: Treatment completion status

**RLS Policy**: Users can only access their own treatments
```sql
CREATE POLICY "treatments_owner" ON treatments
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

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

**Key Fields for TxAgent Context**:
- `visit_ts`: Appointment date/time
- `doctor_name`: Healthcare provider name
- `visit_prep`: Pre-visit preparation notes
- `visit_summary`: Post-visit summary and outcomes
- `follow_up_required`: Whether follow-up is needed

**RLS Policy**: Users can only access their own visits
```sql
CREATE POLICY "visits_owner" ON doctor_visits
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 4. `user_medical_profiles` - Personal Health Information

**Purpose**: Store comprehensive personal health information and demographics for each user.

```sql
CREATE TABLE user_medical_profiles (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  date_of_birth    date,
  gender           gender_type,
  blood_group      blood_type DEFAULT 'unknown',
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
```

**Supporting Enums**:
```sql
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

**Key Fields for TxAgent Context**:
- `full_name`: Patient's full name
- `date_of_birth`: For age-specific medical guidance
- `gender`: For gender-specific health considerations
- `blood_group`: Important for emergency situations
- `height_cm`/`weight_kg`: For BMI and dosage calculations
- `emergency_contact`: JSONB containing emergency contact information
- `conditions_summary`: Summarized text of medical conditions
- `medications_summary`: Summarized text of current medications
- `allergies_summary`: Summarized text of known allergies
- `family_history`: Family medical history information

**RLS Policy**: Users can only access their own profile
```sql
CREATE POLICY "profiles_owner" ON user_medical_profiles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## Profile Satellite Tables

To maintain relational integrity while keeping the main profile table manageable, three satellite tables provide detailed tracking:

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
- Links to profile for data integrity
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
  discovered_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Key Features**:
- Specific allergen identification
- Reaction type and severity tracking
- Discovery date for allergy timeline
- Detailed notes for emergency situations

**RLS Policies for Satellite Tables**:
```sql
-- All satellite tables use profile-based access control
CREATE POLICY "conditions_owner" ON profile_conditions
  FOR ALL
  USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));

CREATE POLICY "medications_owner" ON profile_medications
  FOR ALL
  USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));

CREATE POLICY "allergies_owner" ON profile_allergies
  FOR ALL
  USING (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM user_medical_profiles WHERE id = profile_id));
```

## Relationship Tables (Bridge Tables)

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
```sql
CREATE POLICY "link_sympt_treat" ON symptom_treatments
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM user_symptoms WHERE id = symptom_id)
    AND auth.uid() = (SELECT user_id FROM treatments WHERE id = treatment_id)
  );
```

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
```sql
CREATE POLICY "link_visit_sympt" ON visit_symptoms
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM doctor_visits WHERE id = visit_id)
    AND auth.uid() = (SELECT user_id FROM user_symptoms WHERE id = symptom_id)
  );
```

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
```sql
CREATE POLICY "link_visit_treat" ON visit_treatments
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM doctor_visits WHERE id = visit_id)
    AND auth.uid() = (SELECT user_id FROM treatments WHERE id = treatment_id)
  );
```

## AI Integration Tables

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

### 14. `medical_consultations` - AI Interaction Logging

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

### 15. `conversation_sessions` - Conversation Management

**Purpose**: Manage ongoing AI conversation sessions with history and context.

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

## Testing Infrastructure Tables

These tables support the automated testing infrastructure for the application:

### 16. `test_runs` - Test Execution Tracking

**Purpose**: Track automated test runs against the application.

```sql
CREATE TABLE test_runs (
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
```

### 17. `test_results` - Individual Test Results

**Purpose**: Store detailed results for each test case.

```sql
CREATE TABLE test_results (
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
```

### 18. `performance_metrics` - Performance Monitoring

**Purpose**: Track application performance metrics over time.

```sql
CREATE TABLE performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid REFERENCES test_runs(id) ON DELETE CASCADE,
  metric_name varchar(100) NOT NULL,
  metric_value numeric,
  metric_unit varchar(20),
  page_url text,
  created_at timestamptz DEFAULT now()
);
```

### 19. `test_suites` - Test Suite Configuration

**Purpose**: Define test suites and their configuration.

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

### 20. `testing_admin_users` - Testing Administration

**Purpose**: Define users with testing administration privileges.

```sql
CREATE TABLE testing_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  added_at timestamptz DEFAULT now()
);
```

## Performance Indexes

```sql
-- Core symptom tracking indexes
CREATE INDEX ON user_symptoms (user_id, created_at);
CREATE INDEX ON treatments (user_id, created_at);
CREATE INDEX ON doctor_visits (user_id, visit_ts);

-- Profile and satellite table indexes
CREATE INDEX ON user_medical_profiles (user_id);
CREATE INDEX ON profile_conditions (profile_id);
CREATE INDEX ON profile_medications (profile_id);
CREATE INDEX ON profile_allergies (profile_id);

-- AI integration indexes
CREATE INDEX documents_user_id_idx ON documents (user_id);
CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX documents_created_at_idx ON documents (created_at);
CREATE INDEX medical_consultations_user_id_idx ON medical_consultations (user_id);
CREATE INDEX medical_consultations_created_at_idx ON medical_consultations (created_at DESC);
CREATE INDEX conversation_sessions_user_id_idx ON conversation_sessions (user_id);
CREATE INDEX conversation_sessions_status_idx ON conversation_sessions (status);

-- Testing infrastructure indexes
CREATE INDEX test_runs_user_id_idx ON test_runs (user_id);
CREATE INDEX test_runs_status_idx ON test_runs (status);
CREATE INDEX test_results_test_run_id_idx ON test_results (test_run_id);
```

## TxAgent Integration Guidelines

### Data Access Patterns

When the TxAgent Container processes medical consultations, it should:

1. **Use JWT Authentication**: Include the user's JWT token to respect RLS policies
2. **Query Recent Context**: Focus on recent symptoms, treatments, and visits for relevant context
3. **Respect Data Relationships**: Use bridge tables to understand symptom-treatment connections
4. **Consider Personal Health Profile**: Include age, gender, conditions, medications, and allergies in context
5. **Consider Temporal Patterns**: Use timestamps to identify trends and patterns

### Recommended Context Building

**Priority 1 - Essential Context**:
- User's age and gender from `user_medical_profiles`
- Active chronic conditions from `profile_conditions`
- Current medications from `profile_medications`
- Known allergies from `profile_allergies`
- Recent symptoms (last 30 days) from `user_symptoms`

**Priority 2 - Enhanced Context**:
- Recent doctor visits and summaries
- Treatment history and effectiveness
- Symptom patterns and triggers
- Emergency contact information (for urgent situations)

### Data Privacy Considerations

1. **User Isolation**: RLS ensures complete data isolation between users
2. **Audit Trail**: All access is logged through Supabase's built-in audit system
3. **Minimal Data Exposure**: Only query necessary fields for context
4. **Secure Processing**: Process data within the secure container environment
5. **Emergency Override**: Service role can access data for emergency situations

## Schema Evolution

The schema supports future enhancements:

- **Extensible Metadata**: JSONB fields allow flexible data storage
- **Relationship Flexibility**: Bridge tables support many-to-many relationships
- **Temporal Analysis**: Timestamp fields enable trend analysis
- **Treatment Tracking**: Comprehensive treatment lifecycle management
- **Profile Extensibility**: Satellite tables allow detailed health record expansion

This schema provides a robust foundation for AI-powered health insights while maintaining strict data privacy and security standards.



SCHEMA UPDATE:

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'initializing'::text,
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  terminated_at timestamp with time zone,
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.conversation_sessions (
  id text NOT NULL,
  user_id uuid NOT NULL,
  medical_profile jsonb DEFAULT '{}'::jsonb,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])),
  session_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  CONSTRAINT conversation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.doctor_visits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  visit_ts timestamp with time zone NOT NULL,
  doctor_name text,
  location text,
  contact_phone text,
  contact_email text,
  visit_prep text,
  visit_summary text,
  follow_up_required boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT doctor_visits_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text,
  content text NOT NULL,
  embedding USER-DEFINED,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.embedding_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  chunk_count integer DEFAULT 0,
  error text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT embedding_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT embedding_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.medical_consultations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medical_consultations_pkey PRIMARY KEY (id),
  CONSTRAINT medical_consultations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_run_id uuid,
  metric_name character varying NOT NULL,
  metric_value numeric,
  metric_unit character varying,
  page_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT performance_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT performance_metrics_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id)
);
CREATE TABLE public.profile_allergies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  allergen text NOT NULL,
  reaction text,
  severity integer CHECK (severity >= 1 AND severity <= 10),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT profile_allergies_pkey PRIMARY KEY (id),
  CONSTRAINT profile_allergies_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_medical_profiles(id),
  CONSTRAINT profile_allergies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profile_conditions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  condition_name text NOT NULL,
  diagnosed_at date,
  severity integer CHECK (severity >= 1 AND severity <= 10),
  ongoing boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT profile_conditions_pkey PRIMARY KEY (id),
  CONSTRAINT profile_conditions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_medical_profiles(id),
  CONSTRAINT profile_conditions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profile_medications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  prescribed_by text,
  is_current boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT profile_medications_pkey PRIMARY KEY (id),
  CONSTRAINT profile_medications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_medical_profiles(id),
  CONSTRAINT profile_medications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.symptom_treatments (
  symptom_id uuid NOT NULL,
  treatment_id uuid NOT NULL,
  CONSTRAINT symptom_treatments_pkey PRIMARY KEY (symptom_id, treatment_id),
  CONSTRAINT symptom_treatments_symptom_id_fkey FOREIGN KEY (symptom_id) REFERENCES public.user_symptoms(id),
  CONSTRAINT symptom_treatments_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id)
);
CREATE TABLE public.test_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_run_id uuid,
  test_suite character varying NOT NULL,
  test_name character varying NOT NULL,
  status character varying NOT NULL,
  duration_ms integer,
  error_message text,
  screenshot_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT test_results_pkey PRIMARY KEY (id),
  CONSTRAINT test_results_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id)
);
CREATE TABLE public.test_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trigger_type character varying NOT NULL,
  environment character varying NOT NULL,
  target_url text NOT NULL,
  commit_sha character varying,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status character varying DEFAULT 'running'::character varying,
  total_tests integer DEFAULT 0,
  passed_tests integer DEFAULT 0,
  failed_tests integer DEFAULT 0,
  skipped_tests integer DEFAULT 0,
  CONSTRAINT test_runs_pkey PRIMARY KEY (id),
  CONSTRAINT test_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.test_suites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  test_count integer DEFAULT 0,
  last_run_at timestamp with time zone,
  average_duration_ms integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT test_suites_pkey PRIMARY KEY (id)
);
CREATE TABLE public.testing_admin_users (
  user_id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT testing_admin_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT testing_admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.treatments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  treatment_type USER-DEFINED NOT NULL,
  name text NOT NULL,
  dosage text,
  duration text,
  description text,
  doctor_recommended boolean DEFAULT false,
  completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT treatments_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_medical_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  gender USER-DEFINED,
  height_cm numeric,
  weight_kg numeric,
  blood_type USER-DEFINED,
  conditions_summary text,
  medications_summary text,
  allergies_summary text,
  family_history text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  date_of_birth date,
  emergency_contact jsonb DEFAULT '{}'::jsonb,
  full_name text,
  CONSTRAINT user_medical_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_medical_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_symptoms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  symptom_name text NOT NULL,
  severity integer CHECK (severity >= 1 AND severity <= 10),
  description text,
  triggers text,
  duration_hours integer,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_symptoms_pkey PRIMARY KEY (id),
  CONSTRAINT user_symptoms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.visit_symptoms (
  visit_id uuid NOT NULL,
  symptom_id uuid NOT NULL,
  CONSTRAINT visit_symptoms_pkey PRIMARY KEY (visit_id, symptom_id),
  CONSTRAINT visit_symptoms_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.doctor_visits(id),
  CONSTRAINT visit_symptoms_symptom_id_fkey FOREIGN KEY (symptom_id) REFERENCES public.user_symptoms(id)
);
CREATE TABLE public.visit_treatments (
  visit_id uuid NOT NULL,
  treatment_id uuid NOT NULL,
  CONSTRAINT visit_treatments_pkey PRIMARY KEY (visit_id, treatment_id),
  CONSTRAINT visit_treatments_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.doctor_visits(id),
  CONSTRAINT visit_treatments_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id)
);