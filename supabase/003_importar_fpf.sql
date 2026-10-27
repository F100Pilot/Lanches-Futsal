-- ============================================================
-- LANCHES FUTSAL — 003: importação automática de jogos da FPF
-- Aplicar depois de 002_atletas_jogos.sql.
--
--   • definicoes.fpf_equipa_nome: nome da equipa tal como aparece na FPF
--   • editores podem gravar jogos.fpf_id (usado pela Edge Function importar-fpf,
--     que corre com a sessão do editor)
-- ============================================================

begin;

alter table public.definicoes
  add column fpf_equipa_nome text not null default 'Carregado'
  check (char_length(btrim(fpf_equipa_nome)) between 1 and 100);

grant update (fpf_equipa_nome) on public.definicoes to authenticated;
grant insert (fpf_id), update (fpf_id) on public.jogos to authenticated;

commit;
