-- Lista de regalos: esquema completo (ya aplicado vía MCP el 2026-07-05)
-- Si algún día apuntas a otro proyecto de Supabase, ejecuta este script tal cual.

create table if not exists public.gift_admins (
  email text primary key,
  created_at timestamptz default now()
);
insert into public.gift_admins(email) values ('franklingrafic@gmail.com')
on conflict do nothing;

create table if not exists public.gift_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  product_url text,
  price_estimate numeric,
  category text,
  is_group boolean not null default false,
  slots_total int not null default 1 check (slots_total >= 1),
  slots_taken int not null default 0 check (slots_taken >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (slots_taken <= slots_total)
);

create table if not exists public.gift_reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.gift_items(id) on delete cascade,
  reserver_name text not null,
  reserver_contact text,
  note text,
  slots int not null default 1 check (slots >= 1),
  created_at timestamptz default now()
);

create table if not exists public.gift_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gift_admins enable row level security;
alter table public.gift_items enable row level security;
alter table public.gift_reservations enable row level security;
alter table public.gift_posts enable row level security;

create or replace function public.gift_is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.gift_admins
    where lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  );
$$;
grant execute on function public.gift_is_admin() to anon, authenticated;

create policy "gift_items_public_read" on public.gift_items
  for select using (is_active or public.gift_is_admin());
create policy "gift_items_admin_insert" on public.gift_items
  for insert with check (public.gift_is_admin());
create policy "gift_items_admin_update" on public.gift_items
  for update using (public.gift_is_admin());
create policy "gift_items_admin_delete" on public.gift_items
  for delete using (public.gift_is_admin());

create policy "gift_reservations_admin_read" on public.gift_reservations
  for select using (public.gift_is_admin());
create policy "gift_reservations_admin_delete" on public.gift_reservations
  for delete using (public.gift_is_admin());

create policy "gift_posts_public_read" on public.gift_posts
  for select using (is_published or public.gift_is_admin());
create policy "gift_posts_admin_insert" on public.gift_posts
  for insert with check (public.gift_is_admin());
create policy "gift_posts_admin_update" on public.gift_posts
  for update using (public.gift_is_admin());
create policy "gift_posts_admin_delete" on public.gift_posts
  for delete using (public.gift_is_admin());

create policy "gift_admins_admin_all" on public.gift_admins
  for all using (public.gift_is_admin()) with check (public.gift_is_admin());

create or replace function public.gift_reserve(
  p_item_id uuid, p_name text, p_contact text default null,
  p_note text default null, p_slots int default 1
) returns json language plpgsql security definer
set search_path = public as $$
declare
  v_item public.gift_items%rowtype;
  v_slots int := greatest(coalesce(p_slots,1), 1);
begin
  if p_name is null or length(trim(p_name)) < 2 then
    return json_build_object('ok', false, 'error', 'Indica tu nombre, por favor.');
  end if;
  select * into v_item from public.gift_items
  where id = p_item_id and is_active for update;
  if not found then
    return json_build_object('ok', false, 'error', 'Regalo no encontrado.');
  end if;
  if not v_item.is_group then v_slots := 1; end if;
  if v_item.slots_taken + v_slots > v_item.slots_total then
    return json_build_object('ok', false, 'error', 'Ya no quedan participaciones disponibles para este regalo.');
  end if;
  insert into public.gift_reservations(item_id, reserver_name, reserver_contact, note, slots)
  values (p_item_id, trim(p_name), nullif(trim(coalesce(p_contact,'')),''), nullif(trim(coalesce(p_note,'')),''), v_slots);
  update public.gift_items
  set slots_taken = slots_taken + v_slots, updated_at = now()
  where id = p_item_id;
  return json_build_object('ok', true, 'slots_taken', v_item.slots_taken + v_slots, 'slots_total', v_item.slots_total);
end; $$;
grant execute on function public.gift_reserve(uuid, text, text, text, int) to anon, authenticated;

create or replace function public.gift_release_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.gift_items
  set slots_taken = greatest(slots_taken - old.slots, 0), updated_at = now()
  where id = old.item_id;
  return old;
end; $$;

create trigger gift_reservations_release
after delete on public.gift_reservations
for each row execute function public.gift_release_on_delete();
