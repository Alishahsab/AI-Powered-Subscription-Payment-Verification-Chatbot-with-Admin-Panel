drop policy if exists "customer resolves own tickets" on public.tickets;
create policy "customer resolves own tickets" on public.tickets
for update to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid() and status = 'resolved');
