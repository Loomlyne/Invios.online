-- Expand client_status enum with pipeline stages
alter type public.client_status add value if not exists 'in_review';
alter type public.client_status add value if not exists 'approved';
alter type public.client_status add value if not exists 'rejected';
alter type public.client_status add value if not exists 'canceled';
