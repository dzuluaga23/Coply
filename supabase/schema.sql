-- ============================================================
-- PlataClara · Esquema de base de datos (Supabase / PostgreSQL)
-- Multi-tenant: cada familia es una "isla" aislada con RLS.
-- Ejecutar completo en el SQL Editor de Supabase.
-- ============================================================

-- ---------- Extensiones ----------
create extension if not exists "pgcrypto";

-- ---------- Perfiles de usuario ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- Familias (el "tenant") ----------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- Miembros de la familia ----------
create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'miembro' check (role in ('dueño', 'miembro')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- ---------- Categorías ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('gasto', 'ingreso')),
  color text not null default '#64748b',
  created_at timestamptz not null default now()
);

-- ---------- Movimientos (gastos e ingresos) ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  kind text not null check (kind in ('gasto', 'ingreso')),
  amount numeric(14, 2) not null check (amount > 0),
  description text not null default '',
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index transactions_family_date_idx on public.transactions (family_id, occurred_at desc);

-- ============================================================
-- Seguridad: Row Level Security (RLS)
-- Nadie ve ni toca nada de una familia a la que no pertenece.
-- ============================================================

-- Función auxiliar: ¿el usuario actual pertenece a esta familia?
-- security definer para evitar recursión entre políticas.
create or replace function public.is_family_member(f_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = f_id and m.user_id = auth.uid()
  );
$$;

-- Función para unirse con código de invitación (valida el código en el servidor)
create or replace function public.join_family(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  f public.families%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select * into f from public.families where invite_code = upper(trim(p_code));
  if not found then
    raise exception 'Ese código no corresponde a ninguna familia';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (f.id, auth.uid(), 'miembro')
  on conflict (family_id, user_id) do nothing;

  return f.id;
end $$;

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- profiles: cada uno ve y edita el suyo; los de su familia puede verlos
create policy "ver propio perfil" on public.profiles
  for select using (id = auth.uid() or public.is_family_member(
    (select family_id from public.family_members m where m.user_id = auth.uid() limit 1)
  ));

create policy "editar propio perfil" on public.profiles
  for update using (id = auth.uid());

-- families: solo los miembros ven su familia; solo quien la creó la edita
create policy "miembros ven su familia" on public.families
  for select using (public.is_family_member(id));

create policy "crear propia familia" on public.families
  for insert with check (created_by = auth.uid());

create policy "dueño edita su familia" on public.families
  for update using (created_by = auth.uid());

-- family_members: ves a los de tu familia y tu propia fila
create policy "ver miembros de mi familia" on public.family_members
  for select using (user_id = auth.uid() or public.is_family_member(family_id));

create policy "insertar propia membresia" on public.family_members
  for insert with check (user_id = auth.uid());

-- categories
create policy "miembros leen categorias" on public.categories
  for select using (public.is_family_member(family_id));

create policy "miembros crean categorias" on public.categories
  for insert with check (public.is_family_member(family_id));

create policy "miembros editan categorias" on public.categories
  for update using (public.is_family_member(family_id));

create policy "miembros borran categorias" on public.categories
  for delete using (public.is_family_member(family_id));

-- transactions
create policy "miembros leen movimientos" on public.transactions
  for select using (public.is_family_member(family_id));

create policy "miembros crean movimientos" on public.transactions
  for insert with check (public.is_family_member(family_id) and created_by = auth.uid());

create policy "autor edita su movimiento" on public.transactions
  for update using (public.is_family_member(family_id) and created_by = auth.uid());

create policy "autor borra su movimiento" on public.transactions
  for delete using (public.is_family_member(family_id) and created_by = auth.uid());

-- ============================================================
-- Triggers
-- ============================================================

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Categorías por defecto al crear una familia
create or replace function public.create_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (family_id, name, kind, color) values
    (new.id, 'Mercado',        'gasto',   '#22c55e'),
    (new.id, 'Arriendo',       'gasto',   '#ef4444'),
    (new.id, 'Servicios',      'gasto',   '#f59e0b'),
    (new.id, 'Transporte',     'gasto',   '#3b82f6'),
    (new.id, 'Salud',          'gasto',   '#ec4899'),
    (new.id, 'Educación',      'gasto',   '#8b5cf6'),
    (new.id, 'Hogar',          'gasto',   '#14b8a6'),
    (new.id, 'Entretenimiento','gasto',   '#f97316'),
    (new.id, 'Otros gastos',   'gasto',   '#64748b'),
    (new.id, 'Salario',        'ingreso', '#10b981'),
    (new.id, 'Ventas / negocio','ingreso','#0ea5e9'),
    (new.id, 'Otros ingresos', 'ingreso', '#84cc16');
  return new;
end $$;

create trigger on_family_created
  after insert on public.families
  for each row execute function public.create_default_categories();

-- ============================================================
-- Tiempo real: los movimientos se sincronizan al instante
-- (si esta línea falla porque ya existe, puedes ignorarla)
-- ============================================================
alter table public.transactions replica identity full;
alter publication supabase_realtime add table public.transactions;
