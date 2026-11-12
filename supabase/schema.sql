-- Public articles with private, database-enforced writer authorization.

create schema if not exists private;

-- Legacy allowlist data is retained for compatibility; active write policies
-- no longer consult this table.
create table if not exists private.writer_allowlist (
  email text primary key check (email = lower(email))
);

create table if not exists private.article_writing_settings (
  id boolean primary key default true check (id),
  starts_at timestamptz,
  ends_at timestamptz,
  enabled boolean not null default false,
  check ((starts_at is null) = (ends_at is null)),
  check (starts_at is null or starts_at < ends_at),
  check (not enabled or (starts_at is not null and ends_at is not null))
);

insert into private.article_writing_settings (id, starts_at, ends_at, enabled)
values (true, null, null, false)
on conflict (id) do nothing;

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

create or replace function public.is_google_authenticated_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and exists (
        select 1
        from auth.identities as i
        where i.user_id = u.id
          and i.provider = 'google'
      )
  );
$$;

create or replace function public.is_article_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_google_authenticated_user()
    and exists (
      select 1
      from auth.users as u
      where u.id = (select auth.uid())
        and lower(u.email) = 'hongsg821@gmail.com'
    );
$$;

create or replace function public.is_article_writing_open()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.article_writing_settings as s
    where s.id = true
      and s.enabled
      and s.starts_at is not null
      and s.ends_at is not null
      and now() >= s.starts_at
      and now() < s.ends_at
  );
$$;

create or replace function public.get_article_writing_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_settings private.article_writing_settings%rowtype;
begin
  if not public.is_article_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select * into v_settings
  from private.article_writing_settings as s
  where s.id = true;

  return jsonb_build_object(
    'starts_at', v_settings.starts_at,
    'ends_at', v_settings.ends_at,
    'enabled', coalesce(v_settings.enabled, false),
    'is_open', public.is_article_writing_open(),
    'time_zone', 'Asia/Seoul'
  );
end;
$$;

create or replace function public.set_article_writing_settings(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_article_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if (p_starts_at is null) is distinct from (p_ends_at is null) then
    raise exception 'Start and end times must both be set or both be empty' using errcode = '22007';
  end if;

  if p_starts_at is not null and p_starts_at >= p_ends_at then
    raise exception 'End time must be later than start time' using errcode = '22007';
  end if;

  if coalesce(p_enabled, false) and (p_starts_at is null or p_ends_at is null) then
    raise exception 'Set a start and end time before opening writing' using errcode = '22007';
  end if;

  insert into private.article_writing_settings (id, starts_at, ends_at, enabled)
  values (true, p_starts_at, p_ends_at, coalesce(p_enabled, false))
  on conflict (id) do update
    set starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        enabled = excluded.enabled;

  return public.get_article_writing_settings();
end;
$$;

revoke all on function public.is_google_authenticated_user() from public, anon, authenticated;
revoke all on function public.is_article_admin() from public, anon, authenticated;
revoke all on function public.is_article_writing_open() from public, anon, authenticated;
revoke all on function public.get_article_writing_settings() from public, anon, authenticated;
revoke all on function public.set_article_writing_settings(timestamptz, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.is_google_authenticated_user() to authenticated;
grant execute on function public.is_article_admin() to authenticated;
grant execute on function public.is_article_writing_open() to authenticated;
grant execute on function public.get_article_writing_settings() to authenticated;
grant execute on function public.set_article_writing_settings(timestamptz, timestamptz, boolean) to authenticated;

create table if not exists public.school_articles (
  id uuid primary key default gen_random_uuid(),
  node_id text not null,
  title text not null check (length(title) between 1 and 160),
  body text not null check (length(body) between 1 and 20000),
  source_url text,
  published boolean not null default true,
  author_id uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_articles_node_created_idx
  on public.school_articles (node_id, created_at desc);

create or replace function public.touch_school_article_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists school_articles_touch_updated_at on public.school_articles;
create trigger school_articles_touch_updated_at
  before update on public.school_articles
  for each row execute function public.touch_school_article_updated_at();

alter table public.school_articles enable row level security;
alter table public.school_articles force row level security;

revoke all on public.school_articles from public, anon, authenticated;
grant select on public.school_articles to anon, authenticated;
grant insert, update, delete on public.school_articles to authenticated;

drop policy if exists "Public can read published school articles" on public.school_articles;
create policy "Public can read published school articles"
  on public.school_articles for select to anon
  using (published);

drop policy if exists "Signed-in users can read published or authorized drafts" on public.school_articles;
drop policy if exists "Signed-in users can read published articles and own drafts" on public.school_articles;
create policy "Signed-in users can read published articles and own drafts"
  on public.school_articles for select to authenticated
  using (
    published
    or author_id = (select auth.uid())
    or (select public.is_article_admin())
  );

drop policy if exists "Authorized school writers can create articles" on public.school_articles;
drop policy if exists "Authorized writers can create articles" on public.school_articles;
drop policy if exists "Signed-in users can create articles during writing periods" on public.school_articles;
create policy "Signed-in users can create articles during writing periods"
  on public.school_articles for insert to authenticated
  with check (
    (select public.is_google_authenticated_user())
    and
    (select public.is_article_writing_open())
    and author_id = (select auth.uid())
  );

drop policy if exists "Authorized school writers can update articles" on public.school_articles;
drop policy if exists "Authorized writers can update articles" on public.school_articles;
drop policy if exists "Authors can update articles during writing periods" on public.school_articles;
create policy "Authors can update articles during writing periods"
  on public.school_articles for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.is_google_authenticated_user())
    and (select public.is_article_writing_open())
  )
  with check (
    author_id = (select auth.uid())
    and (select public.is_google_authenticated_user())
    and (select public.is_article_writing_open())
  );

drop policy if exists "Authorized school writers can delete articles" on public.school_articles;
drop policy if exists "Authorized writers can delete articles" on public.school_articles;
drop policy if exists "Authors can delete articles during writing periods" on public.school_articles;
create policy "Authors can delete articles during writing periods"
  on public.school_articles for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.is_google_authenticated_user())
    and (select public.is_article_writing_open())
  );

-- Existing private.writer_allowlist rows are retained but do not affect these policies.

-- User-created child nodes for the school information map.
create table if not exists public.school_map_nodes (
  id uuid primary key default gen_random_uuid(),
  parent_node_id text not null,
  title text not null check (length(btrim(title)) between 1 and 100),
  summary text not null check (length(btrim(summary)) between 1 and 180),
  guidance text not null default '' check (length(guidance) <= 10000),
  source_url text,
  author_id uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists school_map_nodes_parent_created_idx
  on public.school_map_nodes (parent_node_id, created_at);

create or replace function public.validate_school_map_node_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_node_id = any (array[
    'home', 'school', 'facilities', 'calendar', 'activities',
    'school-intro', 'school-symbols', 'curriculum', 'contact',
    'library', 'shared-spaces', 'student-support', 'school-map',
    'year-calendar', 'events', 'assessment', 'clubs',
    'student-council', 'join-activities'
  ]) then
    return new;
  end if;

  if exists (
    select 1
    from public.school_map_nodes as parent_node
    where parent_node.id::text = new.parent_node_id
  ) then
    return new;
  end if;

  raise exception 'Parent node does not exist' using errcode = '23503';
end;
$$;

revoke all on function public.validate_school_map_node_parent() from public, anon, authenticated;

drop trigger if exists school_map_nodes_validate_parent on public.school_map_nodes;
create trigger school_map_nodes_validate_parent
  before insert on public.school_map_nodes
  for each row execute function public.validate_school_map_node_parent();

alter table public.school_map_nodes enable row level security;
alter table public.school_map_nodes force row level security;

revoke all on public.school_map_nodes from public, anon, authenticated;
grant select on public.school_map_nodes to anon, authenticated;
grant insert (parent_node_id, title, summary, guidance, source_url)
  on public.school_map_nodes to authenticated;

drop policy if exists "Anyone can read school map nodes" on public.school_map_nodes;
create policy "Anyone can read school map nodes"
  on public.school_map_nodes for select to anon, authenticated
  using (true);

drop policy if exists "Google users can add child nodes during writing periods" on public.school_map_nodes;
create policy "Google users can add child nodes during writing periods"
  on public.school_map_nodes for insert to authenticated
  with check (
    (select public.is_google_authenticated_user())
    and (select public.is_article_writing_open())
    and author_id = (select auth.uid())
  );
