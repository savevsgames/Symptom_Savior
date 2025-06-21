/*
  # Comprehensive Health Tracking Schema

  1. New Tables
    - `user_symptoms` (enhanced with proper structure)
    - `treatments` (medications, supplements, therapies)
    - `symptom_treatments` (bridge table linking symptoms to treatments)
    - `doctor_visits` (visit tracking with preparation and summaries)
    - `visit_symptoms` (bridge table linking visits to symptoms)
    - `visit_treatments` (bridge table linking visits to treatments)

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user data isolation
    - Bridge table policies ensure users own both sides of relationships

  3. Features
    - Treatment type enum for categorization
    - Comprehensive visit tracking with follow-up flags
    - Rich symptom tracking with location and triggers
    - Proper indexing for performance
*/

-- 🔄 0. Essentials
create extension if not exists "uuid-ossp";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'treatment_type') then
     create type treatment_type as enum
       ('medication','supplement','exercise','therapy','other');
  end if;
end$$;

-- ⚠️ 1. START OVER with user_symptoms
drop table if exists visit_treatments  cascade;
drop table if exists visit_symptoms    cascade;
drop table if exists doctor_visits     cascade;
drop table if exists symptom_treatments cascade;
drop table if exists treatments        cascade;
drop table if exists user_symptoms     cascade;

-- 🩺 2. user_symptoms (re-created)
create table user_symptoms (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  symptom_name    text not null,
  severity        int  check (severity between 1 and 10),
  description     text,
  triggers        text,
  duration_hours  int,
  location        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 💊 3. treatments
create table treatments (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  treatment_type    treatment_type not null,
  name              text not null,
  dosage            text,
  duration          text,
  description       text,
  doctor_recommended boolean default false,
  completed          boolean default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 🔗 4. symptom_treatments (bridge)
create table symptom_treatments (
  symptom_id   uuid references user_symptoms(id) on delete cascade,
  treatment_id uuid references treatments(id)    on delete cascade,
  primary key (symptom_id, treatment_id)
);

-- 🩺 5. doctor_visits
create table doctor_visits (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  visit_ts              timestamptz not null,
  doctor_name           text,
  location              text,
  contact_phone         text,
  contact_email         text,
  visit_prep            text,
  visit_summary         text,
  follow_up_required    boolean default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 🔗 6. visit_symptoms & visit_treatments (bridges)
create table visit_symptoms (
  visit_id   uuid references doctor_visits(id) on delete cascade,
  symptom_id uuid references user_symptoms(id) on delete cascade,
  primary key (visit_id, symptom_id)
);

create table visit_treatments (
  visit_id     uuid references doctor_visits(id) on delete cascade,
  treatment_id uuid references treatments(id)    on delete cascade,
  primary key (visit_id, treatment_id)
);

-- ⚡ 7. Helpful indices
create index on user_symptoms (user_id, created_at);
create index on treatments    (user_id, created_at);
create index on doctor_visits (user_id, visit_ts);

-- 🔐 8. Row-Level Security & Policies
-- Enable RLS
alter table user_symptoms      enable row level security;
alter table treatments         enable row level security;
alter table doctor_visits      enable row level security;
alter table symptom_treatments enable row level security;
alter table visit_symptoms     enable row level security;
alter table visit_treatments   enable row level security;

-- Plain owner-only rules (users & service-role bypass automatic)
create policy "symptoms_owner"   on user_symptoms
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "treatments_owner" on treatments
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "visits_owner"     on doctor_visits
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bridge tables: user must own BOTH sides
create policy "link_sympt_treat" on symptom_treatments
  for all
  using (
        auth.uid() = (select user_id from user_symptoms where id = symptom_id)
    and auth.uid() = (select user_id from treatments      where id = treatment_id)
  );

create policy "link_visit_sympt" on visit_symptoms
  for all
  using (
        auth.uid() = (select user_id from doctor_visits   where id = visit_id)
    and auth.uid() = (select user_id from user_symptoms   where id = symptom_id)
  );

create policy "link_visit_treat" on visit_treatments
  for all
  using (
        auth.uid() = (select user_id from doctor_visits   where id = visit_id)
    and auth.uid() = (select user_id from treatments      where id = treatment_id)
  );

-- ✅ Done!
-- Everything now has:
--   • PK uuid keys
--   • FK back to auth.users for RLS
--   • ENUM treatment_type
--   • Indices for the heavy queries
--   • RLS policies enforcing "row belongs to current user"