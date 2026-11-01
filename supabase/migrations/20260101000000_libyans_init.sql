-- Libyans in North America — initial schema
-- Run this in the Supabase SQL editor (or with `supabase db push`).
-- The application reads and writes through the service role on the server;
-- the policies below protect direct API access from browsers.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Members (one account per family)
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  verification_code text,
  verification_sent_at timestamptz,
  status text not null default 'pending_verification'
    check (status in ('pending_verification', 'onboarding', 'active', 'suspended')),
  step text not null default 'verify'
    check (step in ('verify', 'personal', 'family', 'children', 'professional', 'general', 'volunteering', 'done')),
  locale text not null default 'en' check (locale in ('en', 'ar')),

  country text check (country in ('US', 'CA')),
  state_code text,
  city text,
  postal_code text,

  first_name text,
  father_name text,
  last_name text,
  address text,
  birth_date date,
  phone text,

  marital_status text check (marital_status in ('married', 'widowed', 'divorced', 'single')),
  spouse_name text,
  household_size int,
  has_dependents boolean,
  sons_count int not null default 0,
  daughters_count int not null default 0,

  education_level text,
  current_job text,

  has_car boolean,
  income_sufficient boolean,
  hardship_notes text,

  volunteer_answers jsonb not null default '{}'::jsonb,

  terms_accepted_at timestamptz,
  verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_status_idx on public.members (status);
create index if not exists members_state_idx on public.members (country, state_code);
create index if not exists members_created_idx on public.members (created_at desc);

-- ---------------------------------------------------------------------------
-- Children
-- ---------------------------------------------------------------------------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  name text not null,
  gender text not null check (gender in ('male', 'female')),
  birth_date date,
  education text,
  activities text,
  position int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists children_member_idx on public.children (member_id);

-- ---------------------------------------------------------------------------
-- Administrators (separate console session)
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'viewer'
    check (role in ('super_admin', 'admin', 'content_manager', 'events_manager', 'donations_manager', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- ---------------------------------------------------------------------------
-- News & content
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null default 'news' check (kind in ('news', 'guide', 'jobs', 'success', 'idea')),
  title_en text not null,
  title_ar text not null,
  excerpt_en text not null default '',
  excerpt_ar text not null default '',
  body_en text not null default '',
  body_ar text not null default '',
  cover_image text,
  country text check (country in ('US', 'CA')),
  state_code text,
  city text,
  author_name text not null default 'Community Desk',
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_idx on public.posts (status, published_at desc);
create index if not exists posts_geo_idx on public.posts (country, state_code, city);

-- ---------------------------------------------------------------------------
-- Community events (featured card, then scrolling notice)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ar text not null,
  body_en text not null default '',
  body_ar text not null default '',
  image_url text,
  announce_until timestamptz not null,
  ticker_enabled boolean not null default true,
  ticker_text_en text not null default '',
  ticker_text_ar text not null default '',
  ticker_bg_color text not null default '#0b4f6c',
  ticker_text_color text not null default '#ffffff',
  ticker_until timestamptz not null,
  created_at timestamptz not null default now(),
  created_by text not null default 'Events Desk',
  deleted_at timestamptz,
  deleted_by text
);

create index if not exists events_announce_idx on public.events (announce_until desc);
create index if not exists events_ticker_idx on public.events (ticker_until desc);

-- ---------------------------------------------------------------------------
-- Suggestion box (members only)
-- ---------------------------------------------------------------------------
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  author_name text not null,
  author_email text not null,
  title text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'hidden')),
  created_at timestamptz not null default now()
);

create index if not exists proposals_status_idx on public.proposals (status, created_at desc);

create table if not exists public.proposal_comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  author_name text not null,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists proposal_comments_proposal_idx on public.proposal_comments (proposal_id);

-- ---------------------------------------------------------------------------
-- Donations & state funds
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members (id) on delete set null,
  donor_name text not null,
  donor_email text not null,
  country text not null check (country in ('US', 'CA')),
  state_code text not null,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  stripe_session_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists donations_state_idx on public.donations (country, state_code, status);
create index if not exists donations_session_idx on public.donations (stripe_session_id);

create table if not exists public.fund_reports (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country in ('US', 'CA')),
  state_code text not null,
  title_en text not null,
  title_ar text not null,
  body_en text not null default '',
  body_ar text not null default '',
  amount_cents int not null default 0,
  period_label text not null,
  published_at timestamptz not null default now(),
  created_by text not null default ''
);

create index if not exists fund_reports_state_idx on public.fund_reports (country, state_code, published_at desc);

create table if not exists public.committee (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country in ('US', 'CA')),
  state_code text not null,
  name text not null,
  role_en text not null default 'Committee member',
  role_ar text not null default 'عضو لجنة',
  bio text,
  sort_order int not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists committee_state_idx on public.committee (country, state_code);

create table if not exists public.inbox (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  kind text not null default 'system' check (kind in ('fund_report', 'announcement', 'system')),
  subject_en text not null,
  subject_ar text not null,
  body_en text not null default '',
  body_ar text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inbox_member_idx on public.inbox (member_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Audit log (super admin only)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_name text not null,
  actor_role text not null,
  action text not null check (action in ('create', 'update', 'delete', 'publish', 'login', 'payout')),
  entity text not null,
  entity_id text not null,
  summary text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_entity_idx on public.audit_logs (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Site settings (singleton row) — controlled by the admin console
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id text primary key default 'site',
  title_en text not null default 'Libyans in North America',
  title_ar text not null default 'ليبيون في أمريكا الشمالية',
  tagline_en text not null default 'One community across two countries — a home away from home.',
  tagline_ar text not null default 'مجتمع واحد في بلدين — بيت بعيد عن الديار.',

  accent_color text not null default '#0067b8',
  accent_dark_color text not null default '#004f8c',
  ink_color text not null default '#11161b',
  canvas_color text not null default '#ffffff',
  muted_color text not null default '#f3f5f7',

  heading_font_en text not null default 'Tahoma',
  heading_font_ar text not null default 'Cairo',
  body_font_en text not null default 'Tahoma',
  body_font_ar text not null default 'Cairo',
  heading_size int not null default 46,
  body_size int not null default 16,

  card_radius int not null default 4,
  button_radius int not null default 3,
  input_radius int not null default 3,

  hero_image text not null default '/images/hero.jpg',
  hero_badge_en text not null default 'United States · Canada',
  hero_badge_ar text not null default 'الولايات المتحدة · كندا',
  hero_title_en text not null default 'Libyans in North America',
  hero_title_ar text not null default 'ليبيون في أمريكا الشمالية',
  hero_subtitle_en text not null default '',
  hero_subtitle_ar text not null default '',

  footer_about_en text not null default '',
  footer_about_ar text not null default '',
  contact_email text not null default 'hello@libyansna.org',
  admin_email text not null default 'admin@libyansna.org',
  phones text[] not null default '{}',

  facebook_url text not null default '',
  x_url text not null default '',
  tiktok_url text not null default '',
  instagram_url text not null default '',
  youtube_url text not null default '',

  membership_cta_en text not null default 'Become a member of the Libyan family',
  membership_cta_ar text not null default 'كن عضواً من العائلة الليبية',

  monthly_cap_cents int not null default 1000,
  stripe_account_holder text not null default '',
  stripe_account_number text not null default '',
  stripe_routing_number text not null default '',

  ticker_enabled boolean not null default true,

  updated_at timestamptz not null default now(),
  updated_by text
);

-- ---------------------------------------------------------------------------
-- Volunteer questions (admin-extensible)
-- ---------------------------------------------------------------------------
create table if not exists public.volunteer_questions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  prompt_en text not null,
  prompt_ar text not null,
  type text not null default 'single_select' check (type in ('boolean', 'single_select')),
  options jsonb not null default '[]'::jsonb,
  sort_order int not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.members enable row level security;
alter table public.children enable row level security;
alter table public.admins enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_comments enable row level security;
alter table public.donations enable row level security;
alter table public.fund_reports enable row level security;
alter table public.committee enable row level security;
alter table public.inbox enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;
alter table public.volunteer_questions enable row level security;

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1
$$;

revoke execute on function public.current_member_id() from anon, public;
grant execute on function public.current_member_id() to authenticated;

-- Members: read and update only their own family record.
drop policy if exists members_select_self on public.members;
create policy members_select_self on public.members for select to authenticated
  using (id = public.current_member_id());

drop policy if exists members_update_self on public.members;
create policy members_update_self on public.members for update to authenticated
  using (id = public.current_member_id())
  with check (id = public.current_member_id());

drop policy if exists children_select_own on public.children;
create policy children_select_own on public.children for select to authenticated
  using (member_id = public.current_member_id());

-- Public content.
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select to anon, authenticated
  using (status = 'published');

drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists volunteer_questions_public_read on public.volunteer_questions;
create policy volunteer_questions_public_read on public.volunteer_questions for select to anon, authenticated
  using (active = true);

-- Members-only surfaces.
drop policy if exists proposals_members_read on public.proposals;
create policy proposals_members_read on public.proposals for select to authenticated
  using (public.current_member_id() is not null and status = 'open');

drop policy if exists proposals_members_insert on public.proposals;
create policy proposals_members_insert on public.proposals for insert to authenticated
  with check (member_id = public.current_member_id());

drop policy if exists comments_members_read on public.proposal_comments;
create policy comments_members_read on public.proposal_comments for select to authenticated
  using (public.current_member_id() is not null);

drop policy if exists comments_members_insert on public.proposal_comments;
create policy comments_members_insert on public.proposal_comments for insert to authenticated
  with check (member_id = public.current_member_id());

drop policy if exists donations_own_read on public.donations;
create policy donations_own_read on public.donations for select to authenticated
  using (member_id = public.current_member_id());

drop policy if exists fund_reports_members_read on public.fund_reports;
create policy fund_reports_members_read on public.fund_reports for select to authenticated
  using (public.current_member_id() is not null);

drop policy if exists committee_members_read on public.committee;
create policy committee_members_read on public.committee for select to authenticated
  using (public.current_member_id() is not null);

drop policy if exists inbox_own_read on public.inbox;
create policy inbox_own_read on public.inbox for select to authenticated
  using (member_id = public.current_member_id());

drop policy if exists inbox_own_update on public.inbox;
create policy inbox_own_update on public.inbox for update to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- Explicit deny for anything else (administrators and the server use the service role).
drop policy if exists admins_no_access on public.admins;
create policy admins_no_access on public.admins for all to anon, authenticated using (false) with check (false);

drop policy if exists audit_no_access on public.audit_logs;
create policy audit_no_access on public.audit_logs for all to anon, authenticated using (false) with check (false);

drop policy if exists settings_no_access on public.settings;
create policy settings_no_access on public.settings for all to anon, authenticated using (false) with check (false);

-- Useful grants for the public content policies.
grant select on public.posts, public.events, public.volunteer_questions to anon, authenticated;
grant select, update on public.members to authenticated;
grant select on public.children to authenticated;
grant select, insert on public.proposals to authenticated;
grant select, insert on public.proposal_comments to authenticated;
grant select on public.donations to authenticated;
grant select on public.fund_reports to authenticated;
grant select on public.committee to authenticated;
grant select, update on public.inbox to authenticated;
