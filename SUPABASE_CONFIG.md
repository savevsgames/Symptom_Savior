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
  blood_group      blood_type,
  height_cm        numeric,
  weight_kg        numeric,
  emergency_contact jsonb DEFAULT '{}'::jsonb,
  medications      jsonb DEFAULT '[]'::jsonb,
  chronic_conditions jsonb DEFAULT '[]'::jsonb,
  allergies        jsonb DEFAULT '[]'::jsonb,
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
- `medications`: JSONB array of current medications (quick reference)
- `chronic_conditions`: JSONB array of ongoing health conditions
- `allergies`: JSONB array of known allergies

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
```

**Key Features**:
- Complete medication lifecycle tracking
- Dosage and frequency information
- Prescribing physician tracking
- Start/stop dates for medication history

### 7. `profile_allergies` - Detailed Allergy Tracking

**Purpose**: Track detailed allergy information with severity and reaction details.

```sql
CREATE TABLE profile_allergies (
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
```

**Key Features**:
- Specific allergen identification
- Reaction type and severity tracking
- Discovery date for allergy timeline
- Detailed notes for emergency situations

**RLS Policies for Satellite Tables**:
```sql
-- All satellite tables use the same owner-only policy
CREATE POLICY "profile_conditions_owner" ON profile_conditions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_medications_owner" ON profile_medications
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_allergies_owner" ON profile_allergies
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
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

## Existing Tables (From Original Schema)

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

## Performance Indexes

```sql
-- Core symptom tracking indexes
CREATE INDEX ON user_symptoms (user_id, created_at);
CREATE INDEX ON treatments (user_id, created_at);
CREATE INDEX ON doctor_visits (user_id, visit_ts);

-- Profile and satellite table indexes
CREATE INDEX ON user_medical_profiles (user_id);
CREATE INDEX ON profile_conditions (user_id, profile_id);
CREATE INDEX ON profile_medications (user_id, profile_id);
CREATE INDEX ON profile_allergies (user_id, profile_id);

-- Existing document indexes
CREATE INDEX documents_user_id_idx ON documents (user_id);
CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX documents_created_at_idx ON documents (created_at);
```

## Sample Queries for TxAgent Context

### Get Complete User Health Profile

```sql
-- Get user's basic profile information
SELECT 
  p.*,
  EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age
FROM user_medical_profiles p
WHERE p.user_id = auth.uid();
```

### Get Active Health Conditions and Medications

```sql
-- Get current active conditions and medications
SELECT 
  'condition' as type,
  pc.condition_name as name,
  pc.severity,
  pc.diagnosed_on as start_date,
  pc.notes
FROM profile_conditions pc
WHERE pc.user_id = auth.uid() 
  AND pc.resolved_on IS NULL

UNION ALL

SELECT 
  'medication' as type,
  pm.medication_name as name,
  NULL as severity,
  pm.started_on as start_date,
  CONCAT(pm.dose, ' - ', pm.frequency) as notes
FROM profile_medications pm
WHERE pm.user_id = auth.uid() 
  AND pm.stopped_on IS NULL

ORDER BY start_date DESC;
```

### Get Recent Health Context for AI Consultation

```sql
-- Comprehensive recent health context
SELECT 
  s.symptom_name,
  s.severity,
  s.triggers,
  s.location,
  s.created_at,
  array_agg(DISTINCT pc.condition_name) FILTER (WHERE pc.condition_name IS NOT NULL) as conditions,
  array_agg(DISTINCT pm.medication_name) FILTER (WHERE pm.medication_name IS NOT NULL) as medications,
  array_agg(DISTINCT pa.allergen) FILTER (WHERE pa.allergen IS NOT NULL) as allergies
FROM user_symptoms s
LEFT JOIN profile_conditions pc ON pc.user_id = s.user_id AND pc.resolved_on IS NULL
LEFT JOIN profile_medications pm ON pm.user_id = s.user_id AND pm.stopped_on IS NULL  
LEFT JOIN profile_allergies pa ON pa.user_id = s.user_id
WHERE s.user_id = auth.uid()
  AND s.created_at >= now() - interval '30 days'
GROUP BY s.id, s.symptom_name, s.severity, s.triggers, s.location, s.created_at
ORDER BY s.created_at DESC;
```

### Get Symptom-Treatment Effectiveness Analysis

```sql
-- Analyze treatment effectiveness for symptoms
SELECT 
  s.symptom_name,
  t.name as treatment_name,
  t.treatment_type,
  COUNT(*) as usage_count,
  AVG(s.severity) as avg_severity_when_used
FROM user_symptoms s
JOIN symptom_treatments st ON s.id = st.symptom_id
JOIN treatments t ON st.treatment_id = t.id
WHERE s.user_id = auth.uid()
  AND s.created_at >= now() - interval '90 days'
GROUP BY s.symptom_name, t.name, t.treatment_type
ORDER BY usage_count DESC, avg_severity_when_used ASC;
```

## Row Level Security (RLS) Summary

All tables implement comprehensive RLS policies:

1. **Owner-Only Access**: Users can only access their own data
2. **Bridge Table Security**: Relationship tables require ownership of both linked entities
3. **Service Role Bypass**: Service roles can access data for system operations
4. **JWT-Based Authentication**: All policies use `auth.uid()` for user identification

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