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

## Relationship Tables (Bridge Tables)

### 4. `symptom_treatments` - Symptom-Treatment Relationships

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

### 5. `visit_symptoms` - Visit-Symptom Relationships

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

### 6. `visit_treatments` - Visit-Treatment Relationships

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

### 7. `documents` - Medical Document Storage

**Purpose**: Store medical documents with vector embeddings for RAG system.

```sql
-- Existing table structure
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

### 8. `agents` - AI Session Management

**Purpose**: Track AI agent sessions and conversation context.

```sql
-- Existing table structure  
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

### 9. `embedding_jobs` - Document Processing Queue

**Purpose**: Track document embedding processing jobs.

```sql
-- Existing table structure
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
-- Symptom tracking indexes
CREATE INDEX ON user_symptoms (user_id, created_at);
CREATE INDEX ON treatments (user_id, created_at);
CREATE INDEX ON doctor_visits (user_id, visit_ts);

-- Existing document indexes
CREATE INDEX documents_user_id_idx ON documents (user_id);
CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX documents_created_at_idx ON documents (created_at);
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
4. **Consider Temporal Patterns**: Use timestamps to identify trends and patterns

### Recommended Query Patterns

**Get User's Recent Health Context**:
```sql
-- Recent symptoms (last 30 days)
SELECT * FROM user_symptoms 
WHERE user_id = auth.uid() 
AND created_at >= now() - interval '30 days'
ORDER BY created_at DESC;

-- Active treatments
SELECT * FROM treatments 
WHERE user_id = auth.uid() 
AND completed = false
ORDER BY created_at DESC;

-- Recent doctor visits
SELECT * FROM doctor_visits 
WHERE user_id = auth.uid() 
AND visit_ts >= now() - interval '90 days'
ORDER BY visit_ts DESC;
```

**Get Symptom-Treatment Relationships**:
```sql
SELECT s.symptom_name, s.severity, t.name as treatment_name, t.treatment_type
FROM user_symptoms s
JOIN symptom_treatments st ON s.id = st.symptom_id
JOIN treatments t ON st.treatment_id = t.id
WHERE s.user_id = auth.uid()
ORDER BY s.created_at DESC;
```

### Data Privacy Considerations

1. **User Isolation**: RLS ensures complete data isolation between users
2. **Audit Trail**: All access is logged through Supabase's built-in audit system
3. **Minimal Data Exposure**: Only query necessary fields for context
4. **Secure Processing**: Process data within the secure container environment

## Schema Evolution

The schema supports future enhancements:

- **Extensible Metadata**: JSONB fields allow flexible data storage
- **Relationship Flexibility**: Bridge tables support many-to-many relationships
- **Temporal Analysis**: Timestamp fields enable trend analysis
- **Treatment Tracking**: Comprehensive treatment lifecycle management

This schema provides a robust foundation for AI-powered health insights while maintaining strict data privacy and security standards.