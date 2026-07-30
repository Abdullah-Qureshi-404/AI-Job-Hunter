-- =========================================================
-- ApplyAI - Supabase schema
-- =========================================================
--
-- The application previously had no committed schema: the resumes table
-- existed only in the Supabase dashboard, and resume_service.py guessed at
-- whether the extracted_text column was present by catching insert failures.
-- Run this against a fresh project to recreate the expected structure.

create extension if not exists "pgcrypto";

create table if not exists public.resumes (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users (id) on delete cascade,
    file_name      text not null,
    resume_type    text not null default 'general',
    storage_path   text not null unique,
    extracted_text text not null default '',
    is_embedded    boolean not null default false,
    uploaded_at    timestamptz not null default now()
);

create index if not exists resumes_user_id_idx
    on public.resumes (user_id);

create index if not exists resumes_uploaded_at_idx
    on public.resumes (user_id, uploaded_at desc);

-- Row level security. The backend uses the service_role key and bypasses
-- these, but they protect anything reaching Supabase with a user token.
alter table public.resumes enable row level security;

drop policy if exists "resumes_owner_select" on public.resumes;
create policy "resumes_owner_select"
    on public.resumes for select
    using (auth.uid() = user_id);

drop policy if exists "resumes_owner_insert" on public.resumes;
create policy "resumes_owner_insert"
    on public.resumes for insert
    with check (auth.uid() = user_id);

drop policy if exists "resumes_owner_update" on public.resumes;
create policy "resumes_owner_update"
    on public.resumes for update
    using (auth.uid() = user_id);

drop policy if exists "resumes_owner_delete" on public.resumes;
create policy "resumes_owner_delete"
    on public.resumes for delete
    using (auth.uid() = user_id);
