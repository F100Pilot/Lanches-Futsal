-- ============================================================
-- LANCHES FUTSAL — 002: atletas, jogos, definições
-- Aplicar depois de schema.sql.
--
--   • atletas            leitura pública (nome, número, ativo)
--   • atletas_contactos  só editores (dados pessoais do encarregado)
--   • jogos              leitura pública; escrita só editores
--   • definicoes         leitura pública (link FPF da equipa); escrita só editores
--   • lanches ganha atleta_id e jogo_id (opcionais)
--   • lanches_log passa a registar todas as tabelas (coluna tabela)
-- ============================================================

begin;

-- ── FUNÇÕES GENÉRICAS ────────────────────────────────────────
create function public.touch_row() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.jwt() ->> 'email';
  return new;
end $$;

alter table public.lanches_log rename column lanche_id to registo_id;
alter table public.lanches_log add column tabela text not null default 'lanches';

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.lanches_log (by_email, tabela, action, registo_id, old_row, new_row)
  values (
    auth.jwt() ->> 'email',
    tg_table_name,
    lower(tg_op),
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> tg_argv[0])::bigint
         else (to_jsonb(new) ->> tg_argv[0])::bigint end,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end $$;
revoke execute on function public.audit_row() from public, anon, authenticated;

drop trigger lanches_audit on public.lanches;
drop function public.lanches_audit();
create trigger lanches_audit after insert or update or delete on public.lanches
  for each row execute function public.audit_row('id');

-- ── ATLETAS ──────────────────────────────────────────────────
create table public.atletas (
  id         bigint generated always as identity primary key,
  nome       text not null check (char_length(btrim(nome)) between 1 and 100),
  numero     smallint check (numero between 0 and 99),
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);
create unique index atletas_nome_key on public.atletas (lower(btrim(nome)));

create table public.atletas_contactos (
  atleta_id        bigint primary key references public.atletas (id) on delete cascade,
  encarregado_nome text not null default '' check (char_length(encarregado_nome) <= 100),
  telefone         text not null default '' check (telefone ~ '^[0-9 +()-]{0,20}$'),
  updated_at       timestamptz not null default now(),
  updated_by       text
);

-- ── JOGOS ────────────────────────────────────────────────────
create table public.jogos (
  id          bigint generated always as identity primary key,
  data        date not null,
  hora        time,
  adversario  text not null check (char_length(btrim(adversario)) between 1 and 100),
  casa        boolean not null default true,
  local       text not null default '' check (char_length(local) <= 150),
  competicao  text not null default '' check (char_length(competicao) <= 100),
  resultado   text not null default '' check (char_length(resultado) <= 20),
  fpf_url     text check (fpf_url is null or (fpf_url ~ '^https://' and char_length(fpf_url) <= 500)),
  fpf_id      text unique,  -- identificador do jogo na FPF (importação automática)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text
);
create index jogos_data_idx on public.jogos (data);

-- ── DEFINIÇÕES (linha única) ─────────────────────────────────
create table public.definicoes (
  id             smallint primary key default 1 check (id = 1),
  fpf_equipa_url text check (fpf_equipa_url is null or (fpf_equipa_url ~ '^https://' and char_length(fpf_equipa_url) <= 500)),
  updated_at     timestamptz not null default now(),
  updated_by     text
);
insert into public.definicoes (id, fpf_equipa_url)
  values (1, 'https://resultados.fpf.pt/Competition/Details?competitionId=30606&seasonId=106');

-- ── LANCHES: ligação a atleta e jogo ─────────────────────────
alter table public.lanches
  add column atleta_id bigint references public.atletas (id) on delete set null,
  add column jogo_id   bigint references public.jogos (id) on delete set null;
create index lanches_jogo_idx on public.lanches (jogo_id);
create index lanches_atleta_idx on public.lanches (atleta_id);

-- ── TRIGGERS ─────────────────────────────────────────────────
create trigger atletas_touch before insert or update on public.atletas
  for each row execute function public.touch_row();
create trigger atletas_contactos_touch before insert or update on public.atletas_contactos
  for each row execute function public.touch_row();
create trigger jogos_touch before insert or update on public.jogos
  for each row execute function public.touch_row();
create trigger definicoes_touch before update on public.definicoes
  for each row execute function public.touch_row();

create trigger atletas_audit after insert or update or delete on public.atletas
  for each row execute function public.audit_row('id');
create trigger atletas_contactos_audit after insert or update or delete on public.atletas_contactos
  for each row execute function public.audit_row('atleta_id');
create trigger jogos_audit after insert or update or delete on public.jogos
  for each row execute function public.audit_row('id');
create trigger definicoes_audit after update on public.definicoes
  for each row execute function public.audit_row('id');

-- ── RLS ──────────────────────────────────────────────────────
alter table public.atletas enable row level security;
alter table public.atletas_contactos enable row level security;
alter table public.jogos enable row level security;
alter table public.definicoes enable row level security;

create policy "leitura publica" on public.atletas for select to anon, authenticated using (true);
create policy "editores inserem" on public.atletas for insert to authenticated with check ((select public.is_editor()));
create policy "editores atualizam" on public.atletas for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()));
create policy "editores eliminam" on public.atletas for delete to authenticated using ((select public.is_editor()));

create policy "editores tudo" on public.atletas_contactos for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "leitura publica" on public.jogos for select to anon, authenticated using (true);
create policy "editores inserem" on public.jogos for insert to authenticated with check ((select public.is_editor()));
create policy "editores atualizam" on public.jogos for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()));
create policy "editores eliminam" on public.jogos for delete to authenticated using ((select public.is_editor()));

create policy "leitura publica" on public.definicoes for select to anon, authenticated using (true);
create policy "editores atualizam" on public.definicoes for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()));

-- ── PERMISSÕES ───────────────────────────────────────────────
revoke all on public.atletas, public.atletas_contactos, public.jogos, public.definicoes from anon, authenticated;

grant select (id, nome, numero, ativo) on public.atletas to anon;
grant select on public.atletas to authenticated;
grant insert (nome, numero, ativo), update (nome, numero, ativo), delete on public.atletas to authenticated;

-- atleta_id no update: necessário para upsert via PostgREST (ON CONFLICT ... DO UPDATE)
grant select, delete on public.atletas_contactos to authenticated;
grant insert (atleta_id, encarregado_nome, telefone), update (atleta_id, encarregado_nome, telefone)
  on public.atletas_contactos to authenticated;

grant select (id, data, hora, adversario, casa, local, competicao, resultado, fpf_url) on public.jogos to anon;
grant select on public.jogos to authenticated;
grant insert (data, hora, adversario, casa, local, competicao, resultado, fpf_url),
      update (data, hora, adversario, casa, local, competicao, resultado, fpf_url), delete
  on public.jogos to authenticated;

grant select (id, fpf_equipa_url) on public.definicoes to anon;
grant select on public.definicoes to authenticated;
grant update (fpf_equipa_url) on public.definicoes to authenticated;

grant select (atleta_id, jogo_id) on public.lanches to anon;
grant insert (atleta_id, jogo_id), update (atleta_id, jogo_id) on public.lanches to authenticated;

commit;
