-- ============================================================
-- LANCHES FUTSAL — schema Supabase (Postgres)
--
-- Modelo de acesso:
--   • Leitura pública (anon) apenas das colunas visíveis na app.
--   • Escrita apenas para utilizadores autenticados cuja conta está
--     confirmada e cujo email consta em public.editors (máx. 2).
--   • Todas as alterações ficam registadas em public.lanches_log.
-- ============================================================

-- ── EDITORES ─────────────────────────────────────────────────
create table public.editors (
  email text primary key check (email = lower(email))
);
alter table public.editors enable row level security;  -- sem policies: inacessível via API

create function public.editors_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.editors) >= 2 then
    raise exception 'Máximo de 2 editores.';
  end if;
  return new;
end $$;

create trigger editors_limit before insert on public.editors
  for each row execute function public.editors_limit();

create function public.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.editors e
    join auth.users u on lower(u.email) = e.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
  )
$$;
revoke execute on function public.is_editor() from public, anon;
grant execute on function public.is_editor() to authenticated;

-- ── LANCHES ──────────────────────────────────────────────────
create table public.lanches (
  id          bigint generated always as identity primary key,
  nome        text not null check (char_length(btrim(nome)) between 1 and 100),
  data        date not null,
  entregue    boolean not null default false,
  observacoes text not null default '' check (char_length(observacoes) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text
);
create index lanches_data_idx on public.lanches (data desc);

create function public.lanches_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.nome       := btrim(new.nome);
  new.updated_at := now();
  new.updated_by := auth.jwt() ->> 'email';
  return new;
end $$;

create trigger lanches_touch before insert or update on public.lanches
  for each row execute function public.lanches_touch();

alter table public.lanches enable row level security;

create policy "leitura publica" on public.lanches
  for select to anon, authenticated using (true);
create policy "editores inserem" on public.lanches
  for insert to authenticated with check ((select public.is_editor()));
create policy "editores atualizam" on public.lanches
  for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()));
create policy "editores eliminam" on public.lanches
  for delete to authenticated using ((select public.is_editor()));

-- Anónimos: só leitura, e sem ver quem alterou (emails dos editores).
revoke all on public.lanches from anon;
grant select (id, nome, data, entregue, observacoes) on public.lanches to anon;
revoke all on public.lanches from authenticated;
grant select on public.lanches to authenticated;
grant insert (nome, data, entregue, observacoes), update (nome, data, entregue, observacoes), delete
  on public.lanches to authenticated;

-- ── REGISTO DE ALTERAÇÕES ────────────────────────────────────
create table public.lanches_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  by_email   text,
  action     text not null,
  lanche_id  bigint,
  old_row    jsonb,
  new_row    jsonb
);
alter table public.lanches_log enable row level security;
create policy "editores leem log" on public.lanches_log
  for select to authenticated using ((select public.is_editor()));
revoke all on public.lanches_log from anon, authenticated;
grant select on public.lanches_log to authenticated;

create function public.lanches_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.lanches_log (by_email, action, lanche_id, old_row, new_row)
  values (
    auth.jwt() ->> 'email',
    lower(tg_op),
    coalesce(new.id, old.id),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end $$;
revoke execute on function public.lanches_audit() from public, anon, authenticated;

create trigger lanches_audit after insert or update or delete on public.lanches
  for each row execute function public.lanches_audit();

-- ── DEPOIS DE CRIAR AS 2 CONTAS (Authentication → Users → Add user) ──
-- insert into public.editors (email) values ('admin@exemplo.pt'), ('colega@exemplo.pt');
