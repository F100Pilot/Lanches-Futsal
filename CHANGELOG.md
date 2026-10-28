# Histórico de versões — Lanches Futsal

Desenvolvido por **Paulo Morais**.

A versão da app está em `index.html` (`APP_VERSION`, `APP_RELEASE_DATE`) e aparece em **Opções → Sobre**.
Numeração `MAIOR.MENOR.CORREÇÃO`: funcionalidades novas sobem o MENOR, correções sobem a CORREÇÃO.

## 2.4.4 — 28/10/2026
- Resumo dos lanches por atleta: **Total** = nº de atletas ativos, **Entregues** = atletas que já entregaram na volta atual, **Pendentes** = os que faltam. Quando todos entregam, começa uma nova volta.
- Fechar a escala sem gravar mostra o aviso "A escala não foi gravada.".

## 2.4.3 — 28/10/2026
- Botões de partilha no WhatsApp só aparecem para os editores.

## 2.4.2 — 28/10/2026
- Mensagens do WhatsApp incluem o link do mapa (Google Maps) do pavilhão de cada jogo (abreviaturas da FPF como "Pav"/"Mun" são expandidas na pesquisa).

## 2.4.1 — 28/10/2026
- Faixa no topo de todos os ecrãs (incluindo folhas e janelas) com a versão e o developer: Paulo Morais.

## 2.4.0 — 28/10/2026
- Escala de lanches automática (Jogos → Gerar escala, ou Opções): distribui os próximos jogos sem lanche pelos atletas ativos, começando por quem levou menos. Antes de gravar dá para mudar o atleta de cada jogo, tirar jogos da escala e redistribuir. Os jogos às 11:00 ficam sem lanche por omissão (hora configurável).
- Partilhar no WhatsApp: próximo jogo, cada jogo e os jogos do mês, com o atleta do lanche e o aviso da hora.
- Atletas: número de lanches de cada um (e quantos entregues) e a data do próximo.

## 2.3.4 — 27/10/2026
- Folhas (Opções, Atletas, formulários): título e botão de fechar ficam fixos no topo ao deslizar.
- Link da competição só aceita páginas `https://resultados.fpf.pt/Competition/Details?…`; um link inválido já guardado é assinalado nas Opções.

## 2.3.3 — 27/10/2026
- Cabeçalho fixo no topo: entrar/opções, recarregar e FPF sempre à vista ao deslizar (telemóvel).

## 2.3.2 — 27/10/2026
- Instruções para mudança de série ou de fase na FPF (Opções → Site da FPF e README).
- Aviso a âmbar no separador Jogos: a hora dos jogos tem sempre de ser confirmada com o Delegado ou a Equipa Técnica.
- Lista de jogos no formulário do lanche e linha do jogo na lista de lanches também mostram "Carregado vs …" / "… vs Carregado".

## 2.3.1 — 27/10/2026
- Jogos mostram as duas equipas, com a da casa primeiro como na FPF (ex.: "Vilafranquense vs Carregado · Fora").
- Favorito da FPF: pausa maior entre jornadas e, se o site limitar pedidos, espera 10 s e tenta de novo (até 3 vezes).

## 2.3.0 — 27/10/2026
- Versão da app e créditos do developer em Opções → Sobre.
- Histórico de versões (este ficheiro).
- Correção: um favorito da FPF de versão anterior mostrava "Dados da FPF inválidos"; agora a app pede para o reinstalar.
- O código do favorito e o leitor da FPF são sempre carregados sem cache (evita instalar uma versão antiga).
- Importação da FPF: pedidos às jornadas espaçados (como ao clicar à mão) e mensagem clara quando o site limita os pedidos (HTTP 403/429).
- Importação da FPF funciona mesmo com a app já aberta noutro separador.
- Lanche: o atleta escolhe-se numa lista pendente (atletas ativos), com "Outro nome…" para lanches sem atleta registado.

## 2.2.2 — 27/10/2026
- Correção: a importação da FPF podia dizer "Nenhum jogo de """ quando a app abria com a sessão já iniciada.

## 2.2.1 — 27/10/2026
- Importação da FPF passa a incluir os jogos ainda por jogar (data e hora).
- Jogos identificados por jornada + equipas: não duplicam quando passam a ter resultado.

## 2.2.0 — 27/10/2026
- Importação dos jogos da FPF através de um botão de favoritos (corre no browser do editor).
- Novo símbolo da bola em 3D (logótipo e ícone do separador).

## 2.1.0 — 27/10/2026
- Base de dados de atletas (nome, número, ativo, contacto do encarregado só para editores).
- Separador Jogos com calendário mensal, casa/fora, local, competição e resultado.
- Lanches associados a jogos e a atletas; botão "Atribuir lanche".
- Botão FPF no cabeçalho com o link da competição.

## 2.0.0 — 27/10/2026
- Base de dados Supabase em vez de Google Sheets + Apps Script.
- Acesso de escrita só para os 2 editores, com email e password individuais; alterar password na app.
- Histórico de todas as alterações.
- Correções de segurança (injeção de código pelos nomes, chave partilhada exposta).
- Novo layout escuro "Estádio".

## 1.0.0 — 25/03/2026
- Versão original: lista de lanches numa Google Sheet, com Master Key partilhada.
