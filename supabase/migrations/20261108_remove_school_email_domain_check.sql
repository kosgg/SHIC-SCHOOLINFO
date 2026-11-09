-- Remove the legacy Google email-domain requirement while preserving the
-- existing exact-email writer allowlist.

create or replace function public.is_authorized_writer()
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
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_authorized_writer() from public, anon;
grant execute on function public.is_authorized_writer() to authenticated;

drop policy if exists "Signed-in users can read published or authorized drafts" on public.school_articles;
create policy "Signed-in users can read published or authorized drafts"
  on public.school_articles for select to authenticated
  using (published or (select public.is_authorized_writer()));

drop policy if exists "Authorized school writers can create articles" on public.school_articles;
drop policy if exists "Authorized writers can create articles" on public.school_articles;
create policy "Authorized writers can create articles"
  on public.school_articles for insert to authenticated
  with check (
    (select public.is_authorized_writer())
    and author_id = (select auth.uid())
  );

drop policy if exists "Authorized school writers can update articles" on public.school_articles;
drop policy if exists "Authorized writers can update articles" on public.school_articles;
create policy "Authorized writers can update articles"
  on public.school_articles for update to authenticated
  using ((select public.is_authorized_writer()))
  with check ((select public.is_authorized_writer()));

drop policy if exists "Authorized school writers can delete articles" on public.school_articles;
drop policy if exists "Authorized writers can delete articles" on public.school_articles;
create policy "Authorized writers can delete articles"
  on public.school_articles for delete to authenticated
  using ((select public.is_authorized_writer()));

drop function if exists public.is_school_writer();
