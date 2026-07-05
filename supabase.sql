-- Ejecuta este script en Supabase > SQL Editor.
-- Crea la lista de productos, reservas y permisos de administración.

create extension if not exists pgcrypto;

create table if not exists public.baby_products (
  id uuid primary key default gen_random_uuid(),
  list_id text not null default 'familia-bebe-2026',
  name text not null,
  description text default '',
  category text default 'General',
  priority text default 'recomendado',
  purchase_url text default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.baby_reservations (
  list_id text not null,
  item_id text not null,
  reserved_by text not null,
  updated_at timestamptz not null default now(),
  primary key (list_id, item_id)
);

create table if not exists public.baby_admins (
  email text primary key
);

-- Añade aquí el email del administrador.
-- Cambia este ejemplo por el correo de tu cuñado y ejecuta la línea.
-- insert into public.baby_admins(email) values ('correo-de-tu-cunado@email.com') on conflict do nothing;

create or replace function public.is_baby_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.baby_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_baby_admin() to authenticated;

alter table public.baby_products enable row level security;
alter table public.baby_reservations enable row level security;
alter table public.baby_admins enable row level security;

drop policy if exists "Leer productos" on public.baby_products;
drop policy if exists "Crear productos" on public.baby_products;
drop policy if exists "Actualizar productos" on public.baby_products;
drop policy if exists "Eliminar productos" on public.baby_products;

create policy "Leer productos"
on public.baby_products
for select
to anon, authenticated
using (is_active = true or public.is_baby_admin());

create policy "Crear productos"
on public.baby_products
for insert
to authenticated
with check (public.is_baby_admin());

create policy "Actualizar productos"
on public.baby_products
for update
to authenticated
using (public.is_baby_admin())
with check (public.is_baby_admin());

create policy "Eliminar productos"
on public.baby_products
for delete
to authenticated
using (public.is_baby_admin());

drop policy if exists "Leer reservas de la lista" on public.baby_reservations;
drop policy if exists "Crear reservas de la lista" on public.baby_reservations;
drop policy if exists "Actualizar reservas de la lista" on public.baby_reservations;
drop policy if exists "Eliminar reservas de la lista" on public.baby_reservations;

create policy "Leer reservas de la lista"
on public.baby_reservations
for select
to anon, authenticated
using (true);

create policy "Crear reservas de la lista"
on public.baby_reservations
for insert
to anon, authenticated
with check (true);

create policy "Actualizar reservas de la lista"
on public.baby_reservations
for update
to anon, authenticated
using (true)
with check (true);

create policy "Eliminar reservas de la lista"
on public.baby_reservations
for delete
to anon, authenticated
using (true);

-- Productos base opcionales. Puedes borrarlos luego desde /admin.html.
insert into public.baby_products (list_id, name, description, category, priority, sort_order)
values
('familia-bebe-2026', 'Pañales talla 1', 'Para los primeros días.', 'Higiene', 'imprescindible', 10),
('familia-bebe-2026', 'Toallitas al agua', 'Suaves y prácticas para casa o paseo.', 'Higiene', 'imprescindible', 20),
('familia-bebe-2026', 'Crema para el pañal', 'Para proteger la piel del bebé.', 'Higiene', 'imprescindible', 30),
('familia-bebe-2026', 'Bodys de algodón', 'Pack de bodys cómodos para recién nacido.', 'Ropa', 'imprescindible', 40),
('familia-bebe-2026', 'Pijamas enteros', 'Mejor con apertura fácil para cambiarlo.', 'Ropa', 'imprescindible', 50),
('familia-bebe-2026', 'Muselinas', 'Sirven para casi todo y siempre hacen falta.', 'Textil', 'imprescindible', 60)
on conflict do nothing;
