-- M4: Revoke public execute on SECURITY DEFINER functions that have no business
--     being callable by anon/authenticated roles via the REST API (/rpc/).
--     handle_new_user is a trigger function; next_document_number is called
--     server-side via the service role only.
--     Revoke from PUBLIC to remove the default grant (anon/authenticated inherit PUBLIC).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_document_number(text, text) FROM PUBLIC, anon, authenticated;

-- L5: Pin search_path on update_updated_at_column to prevent search_path
--     injection attacks (currently proconfig = null on this function).
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
