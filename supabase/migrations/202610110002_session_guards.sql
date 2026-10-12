-- Supabase revokes refresh sessions on logout. Require the matching live session
-- as well as the JWT so old access tokens cannot retain studio data access.
create function sk_private.has_active_session() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id::text = (select auth.jwt()->>'session_id') and s.user_id=(select auth.uid())
      and (u.banned_until is null or u.banned_until < now())
  );
$$;
revoke all on function sk_private.has_active_session() from public, anon;
grant execute on function sk_private.has_active_session() to authenticated;
create policy sk_profile_session on public.sk_profiles as restrictive for all to authenticated
  using ((select sk_private.has_active_session())) with check ((select sk_private.has_active_session()));
create policy sk_project_session on public.sk_projects as restrictive for all to authenticated
  using ((select sk_private.has_active_session())) with check ((select sk_private.has_active_session()));
create policy sk_update_session on public.sk_updates as restrictive for all to authenticated
  using ((select sk_private.has_active_session())) with check ((select sk_private.has_active_session()));
create policy sk_document_session on public.sk_documents as restrictive for all to authenticated
  using ((select sk_private.has_active_session())) with check ((select sk_private.has_active_session()));
create policy sk_enquiry_session on public.sk_enquiries as restrictive for all to authenticated
  using ((select sk_private.has_active_session())) with check ((select sk_private.has_active_session()));
create policy sk_notification_session on public.sk_email_notifications as restrictive for all to authenticated
  using ((select sk_private.has_active_session())) with check ((select sk_private.has_active_session()));
