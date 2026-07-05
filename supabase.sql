-- Ejecuta este script en Supabase > SQL Editor.
-- Crea la tabla donde se guardan las reservas compartidas de la lista.

create table if not exists public.baby_reservations (
  list_id text not null,
  item_id text not null,
  reserved_by text not null,
  updated_at timestamptz not null default now(),
  primary key (list_id, item_id)
);

alter table public.baby_reservations enable row level security;

-- Permite leer reservas desde la web pública.
create policy "Leer reservas de la lista"
on public.baby_reservations
for select
to anon
using (true);

-- Permite reservar productos desde la web pública.
create policy "Crear reservas de la lista"
on public.baby_reservations
for insert
to anon
with check (true);

-- Permite cambiar el nombre de quien ha reservado.
create policy "Actualizar reservas de la lista"
on public.baby_reservations
for update
to anon
using (true)
with check (true);

-- Permite liberar un producto reservado.
create policy "Eliminar reservas de la lista"
on public.baby_reservations
for delete
to anon
using (true);
