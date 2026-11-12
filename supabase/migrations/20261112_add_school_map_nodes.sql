-- User-created child nodes for the school information map.
-- Existing static nodes continue to live in content.js.

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
