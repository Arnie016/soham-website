-- Only sk_* resources belong to this application. Never resets another app's schema.
create schema if not exists sk_private;
revoke all on schema sk_private from public, anon, authenticated;
grant usage on schema sk_private to authenticated, service_role;

create table public.sk_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 180),
  email text not null unique,
  role text not null default 'client' check (role in ('architect','client')),
  created_at timestamptz not null default now()
);
create table public.sk_projects (
  id uuid primary key, client_id uuid not null references public.sk_profiles(id),
  title text not null check (char_length(title) between 1 and 180),
  service text not null check (service in ('Architecture','Interiors & renovation','3D visualisation','Concept development')),
  location text not null check (char_length(location) between 1 and 180),
  summary text not null check (char_length(summary) between 10 and 3000),
  stage text not null default 'Brief' check (stage in ('Brief','Concept','Design development','Technical drawings','Complete')),
  next_step text not null check (char_length(next_step) between 3 and 500),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now()
);
create index sk_projects_client on public.sk_projects(client_id);
create table public.sk_updates (
  id uuid primary key, project_id uuid not null references public.sk_projects(id) on delete cascade,
  author_id uuid not null references public.sk_profiles(id),
  author_name text not null default '', role text not null default '', kind text not null default '',
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index sk_updates_project on public.sk_updates(project_id,created_at desc);
create table public.sk_documents (
  id uuid primary key, project_id uuid not null references public.sk_projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  filename text not null, mime text not null check (mime in ('application/pdf','image/jpeg','image/png')),
  size integer not null check (size > 0 and size <= 3145728),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  constraint sk_document_path check (storage_path = project_id::text || '/' || id::text || '/' || filename)
);
create index sk_documents_project on public.sk_documents(project_id,created_at desc);
create table public.sk_enquiries (
  id uuid primary key default gen_random_uuid(), request_key uuid not null unique,
  name text not null, email text not null, phone text not null default '', service text not null,
  client_type text not null, location text not null, budget text not null default '',
  message text not null check (char_length(message) between 20 and 4000),
  consent_at timestamptz not null default now(),
  status text not null default 'New' check (status in ('New','Contacted','In discussion','Closed')),
  created_at timestamptz not null default now()
);
create table public.sk_email_notifications (
  inquiry_id uuid primary key references public.sk_enquiries(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','sending','submitted','activation_required','failed','uncertain','disabled')),
  attempts integer not null default 0,
  updated_at timestamptz not null default now()
);
create table public.sk_rate_limits (
  key text primary key, count integer not null, reset_at bigint not null
);

-- No role or membership decision is based on editable user_metadata.
create function sk_private.is_architect() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.sk_profiles where id = (select auth.uid()) and role = 'architect');
$$;
revoke all on function sk_private.is_architect() from public, anon;
grant execute on function sk_private.is_architect() to authenticated;

create function sk_private.prepare_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select name, role into strict new.author_name, new.role from public.sk_profiles where id = new.author_id;
  new.kind := case when new.role = 'architect' then 'Studio update' else 'Client message' end;
  return new;
end;
$$;
revoke all on function sk_private.prepare_update() from public, anon, authenticated;
create trigger sk_update_author before insert on public.sk_updates for each row execute function sk_private.prepare_update();

create function sk_private.prepare_project() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.sk_profiles where id = new.client_id and role = 'client') then
    raise exception 'A project must belong to a client';
  end if;
  if tg_op = 'UPDATE' then new.version := old.version + 1; end if;
  return new;
end;
$$;
revoke all on function sk_private.prepare_project() from public, anon, authenticated;
create trigger sk_project_version before insert or update on public.sk_projects for each row execute function sk_private.prepare_project();

alter table public.sk_profiles enable row level security;
alter table public.sk_projects enable row level security;
alter table public.sk_updates enable row level security;
alter table public.sk_documents enable row level security;
alter table public.sk_enquiries enable row level security;
alter table public.sk_email_notifications enable row level security;
alter table public.sk_rate_limits enable row level security;

revoke all on public.sk_profiles, public.sk_projects, public.sk_updates, public.sk_documents,
  public.sk_enquiries, public.sk_email_notifications, public.sk_rate_limits from anon, authenticated;
grant all on public.sk_profiles, public.sk_projects, public.sk_updates, public.sk_documents,
  public.sk_enquiries, public.sk_email_notifications, public.sk_rate_limits to service_role;
grant select on public.sk_profiles, public.sk_projects, public.sk_updates, public.sk_documents,
  public.sk_enquiries, public.sk_email_notifications to authenticated;
grant insert(id,client_id,title,service,location,summary,next_step) on public.sk_projects to authenticated;
grant update(stage,next_step) on public.sk_projects to authenticated;
grant insert(id,project_id,author_id,body) on public.sk_updates to authenticated;
grant insert(id,project_id,title,filename,mime,size,storage_path) on public.sk_documents to authenticated;
grant update(status) on public.sk_enquiries to authenticated;

create policy sk_profile_read on public.sk_profiles for select to authenticated
  using (id = (select auth.uid()) or (select sk_private.is_architect()));
create policy sk_project_read on public.sk_projects for select to authenticated
  using (client_id = (select auth.uid()) or (select sk_private.is_architect()));
create policy sk_project_create on public.sk_projects for insert to authenticated
  with check ((select sk_private.is_architect()));
create policy sk_project_change on public.sk_projects for update to authenticated
  using ((select sk_private.is_architect())) with check ((select sk_private.is_architect()));
create policy sk_update_read on public.sk_updates for select to authenticated
  using (exists(select 1 from public.sk_projects p where p.id = project_id));
create policy sk_update_create on public.sk_updates for insert to authenticated
  with check (author_id = (select auth.uid()) and exists(select 1 from public.sk_projects p where p.id = project_id));
create policy sk_document_read on public.sk_documents for select to authenticated
  using (exists(select 1 from public.sk_projects p where p.id = project_id));
create policy sk_document_create on public.sk_documents for insert to authenticated
  with check ((select sk_private.is_architect()) and exists(select 1 from public.sk_projects p where p.id = project_id));
create policy sk_enquiry_read on public.sk_enquiries for select to authenticated using ((select sk_private.is_architect()));
create policy sk_enquiry_change on public.sk_enquiries for update to authenticated
  using ((select sk_private.is_architect())) with check ((select sk_private.is_architect()));
create policy sk_notification_read on public.sk_email_notifications for select to authenticated using ((select sk_private.is_architect()));
-- Rate counters and public enquiry inserts intentionally have no anonymous/client grants.

create function public.sk_consume_rate_limit(p_key text, p_now bigint, p_window bigint)
returns table(count integer, reset_at bigint)
language sql security definer set search_path = '' as $$
  insert into public.sk_rate_limits as r(key,count,reset_at) values(p_key,1,p_now+p_window)
  on conflict(key) do update set count=case when r.reset_at<p_now then 1 else r.count+1 end,
    reset_at=case when r.reset_at<p_now then p_now+p_window else r.reset_at end
  returning r.count,r.reset_at;
$$;
revoke all on function public.sk_consume_rate_limit(text,bigint,bigint) from public, anon, authenticated;
grant execute on function public.sk_consume_rate_limit(text,bigint,bigint) to service_role;

create function public.sk_claim_notification(p_id uuid, p_retry boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare claimed uuid;
begin
  insert into public.sk_email_notifications(inquiry_id) values(p_id) on conflict do nothing;
  update public.sk_email_notifications set status='sending',attempts=attempts+1,updated_at=now()
  where inquiry_id=p_id and (status='queued' or (p_retry and status in ('failed','disabled','activation_required') and updated_at<now()-interval '1 minute'))
  returning inquiry_id into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.sk_claim_notification(uuid,boolean) from public, anon, authenticated;
grant execute on function public.sk_claim_notification(uuid,boolean) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sk-project-files','sk-project-files',false,3145728,array['application/pdf','image/jpeg','image/png']);

create policy sk_files_read on storage.objects for select to authenticated
  using (bucket_id='sk-project-files' and exists(select 1 from public.sk_projects p where p.id::text=(storage.foldername(name))[1]));
create policy sk_files_create on storage.objects for insert to authenticated
  with check (bucket_id='sk-project-files' and (select sk_private.is_architect()) and exists(select 1 from public.sk_projects p where p.id::text=(storage.foldername(name))[1]));
-- Restrictive guards prevent a broad policy belonging to another app from exposing this bucket.
create policy sk_files_anon_guard on storage.objects as restrictive for all to anon
  using (bucket_id<>'sk-project-files') with check (bucket_id<>'sk-project-files');
create policy sk_files_read_guard on storage.objects as restrictive for select to authenticated
  using (bucket_id<>'sk-project-files' or exists(select 1 from public.sk_projects p where p.id::text=(storage.foldername(name))[1]));
create policy sk_files_insert_guard on storage.objects as restrictive for insert to authenticated
  with check (bucket_id<>'sk-project-files' or ((select sk_private.is_architect()) and exists(select 1 from public.sk_projects p where p.id::text=(storage.foldername(name))[1])));
create policy sk_files_update_guard on storage.objects as restrictive for update to authenticated
  using (bucket_id<>'sk-project-files') with check (bucket_id<>'sk-project-files');
create policy sk_files_delete_guard on storage.objects as restrictive for delete to authenticated
  using (bucket_id<>'sk-project-files');
