-- Not used by the app (it calls ensure_default_split) and not meant for signed-out callers.
revoke execute on function public.get_or_create_default_split() from public, anon;
;
