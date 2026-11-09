-- Add administrator-controlled writing windows without deleting legacy data.
-- Existing private.writer_allowlist rows are kept, but no active policy reads them.

create schema if not exists private;

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

do $$
begin
  if to_regprocedure('public.is_authorized_writer()') is not null then
    execute 'revoke all on function public.is_authorized_writer() from public, anon, authenticated';
  end if;
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
