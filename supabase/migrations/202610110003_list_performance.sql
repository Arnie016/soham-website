-- Additive indexes for the existing bounded list queries. RLS stays unchanged.
create index if not exists sk_projects_created_id on public.sk_projects(created_at desc, id desc);
create index if not exists sk_projects_client_created_id on public.sk_projects(client_id, created_at desc, id desc);
create index if not exists sk_enquiries_created_id on public.sk_enquiries(created_at desc, id desc);
create index if not exists sk_profiles_client_name on public.sk_profiles(name, id) where role = 'client';
