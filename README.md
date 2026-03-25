# 🍔 Lanches Futsal — Gestão de Lanches da Equipa

Aplicação web para gestão de lanches de uma equipa de Futsal, desenvolvida para ser partilhada via WhatsApp com os pais dos atletas.

---

## ✅ Status: CONFIGURADO E PRONTO PARA USAR

A aplicação já está **totalmente configurada** e funcionando!

**Link para usar:** 👇
```
https://f100pilot.github.io/Lanches-Futsal/
```

---

## 🎯 Como usar

### 👥 Para os Pais (Visualização)
1. Abre o link acima no telemóvel
2. Vê a lista de lanches e quem já trouxe
3. Consegues filtrar por estado (Todos, Pendentes, Entregues)
4. Procura por nome do atleta na barra de pesquisa

### ⚙️ Para o Proprietário (Edição)
1. Abre o link
2. Clica em ⚙️ (roda dentada) no cabeçalho
3. Insere a **password** (definida durante a configuração)
4. Insere a **Chave de Acesso** (definida durante a configuração)
5. Agora consegues:
   - ➕ **Adicionar** novos lanches
   - ✅ **Marcar como entregue** (checkbox)
   - 🗑️ **Eliminar** registos
   - 🔄 **Atualizar** dados automaticamente

---

## 🔐 Segurança

- **Pessoas com o link** → conseguem **VER** os dados
- **Apenas o proprietário** → consegue **EDITAR** (com password + chave)
- Password do admin protege as configurações
- Chave de Acesso protege as operações de escrita (add/edit/delete)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│    GitHub Pages (Frontend - estático)       │
│    https://f100pilot.github.io/...          │
│    ├── index.html (HTML + CSS + JS)         │
│    └── Code.gs (cópia da documentação)      │
└─────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────┐
│  Google Apps Script (Backend - serverless)  │
│  API JSON pública (deploy Web App)          │
└─────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────┐
│     Google Sheets (Database)                │
│     ├── Sheet1 (dados dos lanches)          │
│     └── Config (configuração)               │
└─────────────────────────────────────────────┘
```

---

## 📱 Funcionalidades

- ✅ Listagem de lanches com filtros
- ✅ Adicionar novo lanche (apenas proprietário)
- ✅ Marcar como entregue/pendente
- ✅ Eliminar registos
- ✅ Pesquisar por nome do atleta
- ✅ Estatísticas em tempo real (Total, Entregues, Pendentes)
- ✅ Barra de progresso de entrega
- ✅ Auto-refresh a cada 60 segundos
- ✅ Design responsivo para telemóvel
- ✅ Indicador de conexão com a API
- ✅ Notificações (toasts) para ações

---

## 🔧 Informações Técnicas

### Para modificar ou fazer deploy novamente:

1. **Ficheiros do projeto:**
   - `index.html` - Aplicação web (HTML + CSS + JavaScript)
   - `Code.gs` - Código do Google Apps Script (referência)
   - `README.md` - Este ficheiro

2. **Dados armazenados em:**
   - Google Sheets: `Lanches Futsal` (ou qualquer nome definido)
   - Folha `Sheet1`: dados dos lanches
   - Folha `Config`: configuração (Master Key)

3. **Para atualizar o site:**
   - Modifica `index.html` ou `Code.gs`
   - Faz push para GitHub
   - GitHub Pages atualiza automaticamente em ~1 minuto

---

## 🚀 Stack Tecnológico

| Componente | Tecnologia | Razão |
|-----------|-----------|-------|
| **Frontend** | HTML5 + CSS3 + JavaScript Vanilla | Zero dependências, rápido, leve |
| **Hosting** | GitHub Pages | Gratuito, estático, confiável |
| **Backend** | Google Apps Script | Gratuito, serverless, integrado com Sheets |
| **Database** | Google Sheets | Gratuito, acessível, tempo real |

**Custo total:** 💰 **ZERO** (totalmente gratuito!)

---

## 📊 Dados de Exemplo

Na folha **Sheet1**, os dados aparecem assim:

| ID | Nome do Atleta | Data | Entregue | Observações |
|----|----------------|------|----------|------------|
| 1 | João Silva | 2025-01-15 | Sim | Lanche para o jogo de sábado |
| 2 | Maria Santos | 2025-01-16 | Não | - |
| 3 | Pedro Oliveira | 2025-01-17 | Sim | Lanche para o treino |

---

## 🆘 Resolução de Problemas

### "Não consegue carregar os dados"
- Verifica se a URL da API está correta (⚙️)
- Testa a URL diretamente no browser
- Verifica se o Google Apps Script está deployado como "Anyone"

### "Erro ao adicionar lanche"
- Verifica se a Chave de Acesso está correta
- Confirma que a folha "Config" tem a Master Key na Google Sheet

### "O site abre mas não consegue editar"
- Clica em ⚙️
- Insere a password e a Chave de Acesso
- Se não as recordas, pede ao proprietário

---

## 📞 Suporte

Se tiveres problemas:
1. Verifica a consola do browser (F12) para ver mensagens de erro
2. Testa a API manualmente: `URL_DA_API?action=read`
3. Confirma que a Google Sheet tem as folhas "Sheet1" e "Config"

---

**Desenvolvido com ❤️ para a equipa de Futsal** ⚽

*Última atualização: 25 de Março de 2026*
