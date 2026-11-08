-- Public articles with private, database-enforced writer authorization.
-- Configure the school domain and writer addresses in the private tables below.

create schema if not exists private;

create table if not exists private.school_settings (
  id boolean primary key default true check (id),
  email_domain text not null check (email_domain = lower(email_domain))
);

create table if not exists private.writer_allowlist (
  email text primary key check (email = lower(email))
);

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

create or replace function public.is_school_writer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as u
    join private.writer_allowlist as w
      on lower(w.email) = lower(u.email)
    cross join private.school_settings as s
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and lower(u.email) like '%@' || lower(s.email_domain)
  );
$$;

revoke all on function public.is_school_writer() from public, anon;
grant execute on function public.is_school_writer() to authenticated;

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
create policy "Signed-in users can read published or authorized drafts"
  on public.school_articles for select to authenticated
  using (published or (select public.is_school_writer()));

drop policy if exists "Authorized school writers can create articles" on public.school_articles;
create policy "Authorized school writers can create articles"
  on public.school_articles for insert to authenticated
  with check (
    (select public.is_school_writer())
    and author_id = (select auth.uid())
  );

drop policy if exists "Authorized school writers can update articles" on public.school_articles;
create policy "Authorized school writers can update articles"
  on public.school_articles for update to authenticated
  using ((select public.is_school_writer()))
  with check ((select public.is_school_writer()));

drop policy if exists "Authorized school writers can delete articles" on public.school_articles;
create policy "Authorized school writers can delete articles"
  on public.school_articles for delete to authenticated
  using ((select public.is_school_writer()));

-- Set the real school domain and add approved writers in the Supabase SQL Editor.
-- Example:
-- insert into private.school_settings (id, email_domain)
-- values (true, 'school.example')
-- on conflict (id) do update set email_domain = excluded.email_domain;
--
-- insert into private.writer_allowlist (email)
-- values ('writer@school.example')
-- on conflict (email) do nothing;
