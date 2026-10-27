# 🍔 Lanches Futsal — Gestão de Lanches da Equipa

Desenvolvido por **Paulo Morais** · versão atual e novidades em [`CHANGELOG.md`](CHANGELOG.md) (também em Opções → Sobre).

Aplicação web para gestão de lanches de uma equipa de Futsal, partilhada via WhatsApp com os pais dos atletas.

**Link:** https://f100pilot.github.io/Lanches-Futsal/

---

## 🎯 Como usar

### 👥 Pais (só leitura)
- Abrem o link e veem a lista, filtros (Todos / Pendentes / Entregues) e pesquisa por nome.
- Não veem formulários nem botões de edição.

Separadores **Lanches** (lista por mês) e **Jogos** (calendário mensal + lista de jogos, com quem leva o lanche). O botão **FPF** no cabeçalho abre a página da competição no site da FPF.

### ✏️ Editores (máx. 2: administrador + colega)
1. Clicar no cadeado no cabeçalho e entrar com **email + password** pessoais.
2. **+** adiciona um lanche (separador Lanches) ou um jogo (separador Jogos).
3. Tocar num lanche/jogo para editar ou eliminar; tocar no estado para marcar entregue/pendente; "Atribuir lanche" num jogo sem lanche.
4. O círculo com a inicial abre as **Opções**: atletas (nome, nº, ativo, contacto do encarregado), novo jogo, site da FPF, alterar password, terminar sessão.
5. **Importar jogos da FPF** (Opções → Site da FPF). O site da FPF só responde a browsers, por isso a leitura é feita no computador do editor com um botão de favoritos:
   1. Arrastar o botão **📌 Importar para Lanches Futsal** para a barra de favoritos (uma vez; repetir se o nome da equipa mudar).
   2. Abrir o link da competição na FPF e clicar no favorito: lê as séries onde a equipa aparece (nome exato na FPF), todas as jornadas, e abre a app com os jogos da equipa.
   3. Na app, confirmar a lista: cria/atualiza os jogos (data, hora, adversário, casa/fora, pavilhão, fase/série, resultado, link). A hora definida à mão mantém-se quando a FPF não a publica; lanches ligados acompanham a data do jogo.
   Se a equipa mudar de série dentro da mesma competição, a importação acompanha; se a FPF criar uma competição nova, basta trocar o link.

---

## 🔐 Segurança

| Regra | Onde é imposta |
|------|----------------|
| Qualquer pessoa com o link pode **ler** nome, data, estado e observações | RLS (`leitura publica`) |
| Só contas em `public.editors` (máx. 2), com email confirmado, podem **escrever** | RLS + `is_editor()` |
| Emails dos editores não são visíveis a anónimos | Permissões por coluna |
| Contactos dos encarregados só visíveis para editores | Tabela `atletas_contactos` (RLS) |
| Todas as alterações ficam registadas (quem, quando, tabela, antes/depois) | Tabela `lanches_log` |
| Passwords com hash, limite de tentativas de login | Supabase Auth |

A `supabaseKey` em `config.json` é a chave **publishable** (pública por desenho); a segurança está nas regras da base de dados, não no browser.

---

## 🏗️ Arquitetura

```
GitHub Pages (index.html + config.json)
        │  supabase-js (HTTPS)
        ▼
Supabase: Auth (2 editores) + Postgres (RLS) → lanches, lanches_log, editors
```

- Schema: [`supabase/schema.sql`](supabase/schema.sql), [`supabase/002_atletas_jogos.sql`](supabase/002_atletas_jogos.sql) e [`supabase/003_importar_fpf.sql`](supabase/003_importar_fpf.sql) e [`supabase/004_nome_equipa_publico.sql`](supabase/004_nome_equipa_publico.sql) (aplicar por esta ordem)
- Importação da FPF: [`fpf/bookmarklet.js`](fpf/bookmarklet.js) (corre no browser do editor, na página da FPF) e [`fpf/parse.js`](fpf/parse.js) (conversão para `jogos`, usada pela app; testes: `node --test fpf/parse.test.mjs`)
- `.github/workflows/keepalive.yml`: leitura a cada 3 dias para o projeto gratuito não ser pausado.

---

## 🔧 Administração (Supabase Dashboard)

Projeto: `lanches-futsal`

### Configuração inicial (uma vez)
1. **Authentication → Sign In / Providers → User Signups**: desativar *Allow new users to sign up*.
2. **Authentication → Sign In / Providers → Email**: *Minimum password length* = 10.
3. **Authentication → Users → Add user → Create new user**: criar as 2 contas (marcar *Auto Confirm User*) com uma password temporária; cada editor muda-a na app (tocar no círculo com a inicial → *Alterar password*).
4. **SQL Editor**:
   ```sql
   insert into public.editors (email) values ('admin@exemplo.pt'), ('colega@exemplo.pt');
   ```

### Trocar um editor
```sql
delete from public.editors where email = 'antigo@exemplo.pt';
insert into public.editors (email) values ('novo@exemplo.pt');
```

### Ver histórico de alterações
**Table Editor → `lanches_log`**, ou:
```sql
select at, by_email, action, lanche_id, old_row, new_row from public.lanches_log order by at desc;
```

### Exportar dados
**Table Editor → `lanches` → Export → CSV**.

---

## 🚀 Stack

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | HTML + CSS + JavaScript (sem build) |
| Hosting | GitHub Pages |
| Base de dados / Auth | Supabase (plano gratuito) |

---

## 🆘 Resolução de Problemas

- **"Falha na ligação à base de dados"** — verificar se o projeto Supabase está ativo (Dashboard); se estiver pausado, clicar em *Restore*.
- **"Esta conta não tem permissão para editar"** — o email não está em `public.editors` ou não está confirmado.
- **"Demasiadas tentativas"** — limite do Supabase Auth; aguardar alguns minutos.
