revoke execute on function public.consume_quota(uuid, text, integer, text) from public;
revoke execute on function public.get_usage(uuid, text, text) from public;
revoke execute on function public.has_active_subscription(uuid, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;