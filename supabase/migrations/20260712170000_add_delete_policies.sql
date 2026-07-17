-- D-1: public.invoices (and public.quotations) have RLS enabled but no DELETE
-- policy, so deleteInvoiceAction / deleteQuotationAction always match 0 rows.
-- Add owner-scoped DELETE policies to match the existing select/insert/update
-- policies defined in 202604060130_phase2_documents.sql.

drop policy if exists "invoices are deletable by owner" on public.invoices;
create policy "invoices are deletable by owner"
on public.invoices for delete
using (auth.uid() = user_id);

drop policy if exists "quotations are deletable by owner" on public.quotations;
create policy "quotations are deletable by owner"
on public.quotations for delete
using (auth.uid() = user_id);
