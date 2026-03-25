# 🍔 Lanches Futsal - Gestão de Lanches

Aplicação web para gestão de lanches de uma equipa de Futsal, desenvolvida para ser partilhada via WhatsApp com os pais dos atletas.

![GitHub](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![GitHub](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![GitHub](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GitHub](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)

## 📋 Funcionalidades

- ✅ **Listagem de Lanches** - Visualização com checkboxes e filtros
- ✅ **Adicionar Novo Lanche** - Formulário simples com validação
- ✅ **Alternar Status** - Checkbox para "Entregue/Pendente" com animação
- ✅ **Estatísticas em Tempo Real** - Total, Entregues, Pendentes
- ✅ **Indicador de Conexão** - Status online/offline visual
- ✅ **Persistência Local** - localStorage para URL da API
- ✅ **Design Responsivo** - Adaptado para telemóveis
- ✅ **Notificações Toast** - Feedback visual para ações

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Frontend)                  │
│              index.html (HTML + CSS + JS)                   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script (Backend/API)               │
│              Code.gs - API JSON Pública                     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Google Sheets (Base de Dados)                  │
│              ┌────────────────────────────────────────┐     │
│              │ ID | Nome | Data | Entregue | Notas │     │
│              └────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Guia de Instalação Completo

### Passo 1: Criar a Google Sheet

1. Acede ao [Google Drive](https://drive.google.com)
2. Clica em **+ Novo** → **Google Sheets** → **Em branco**
3. Nomeia a folha como `Lanches Futsal` (ou outro nome à tua escolha)
4. Na primeira linha, cria as seguintes colunas:

   | Coluna A | Coluna B | Coluna C | Coluna D | Coluna E |
   |----------|----------|----------|----------|----------|
   | ID | Nome do Atleta | Data | Entregue | Observações |

5. Formata a primeira linha como **cabeçalho** (negrito, cor de fundo)

### Passo 2: Configurar o Google Apps Script

1. Na Google Sheet, vai a **Extensions** → **Apps Script**
2. Apaga todo o código existente no editor
3. Copia todo o conteúdo do ficheiro `Code.gs` deste projeto
4. Cola o código no editor do Apps Script
5. Guarda o projeto (Ctrl+S ou Cmd+S)
6. Nomeia o projeto como `LanchesFutsalAPI`

### Passo 3: Fazer Deploy como Web App

1. No Apps Script, clica em **Deploy** → **New deployment**
2. Clica no ícone de engrenagem ⚙️ e seleciona **Web app**
3. Preenche os campos:
   - **Description**: `API Lanches Futsal`
   - **Execute as**: `Me` (a tua conta Google)
   - **Who has access**: `Anyone`
4. Clica em **Deploy**
5. **Autoriza o acesso** à tua conta Google quando solicitado:
   - Clica em "Advanced"
   - Clica em "Go to LanchesFutsalAPI (unsafe)"
   - Clica em "Allow"
6. **COPIA A URL GERADA** (será algo como: `https://script.google.com/macros/s/XXXXX/exec`)

### Passo 4: Publicar no GitHub Pages

#### Opção A: Criar novo repositório

1. Acede ao [GitHub](https://github.com)
2. Clica em **+** → **New repository**
3. Nomeia o repositório como `lanches-futsal`
4. Marca a opção **Add a README file**
5. Clica em **Create repository**
6. Faz upload do ficheiro `index.html`
7. Vai a **Settings** → **Pages**
8. Em **Source**, seleciona:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
9. Clica em **Save**
10. Aguarda alguns minutos e o site estará disponível em:
    `https://teu-usuario.github.io/lanches-futsal`

#### Opção B: Usar GitHub Desktop

1. Instala o [GitHub Desktop](https://desktop.github.com)
2. Clone o repositório para o teu computador
3. Copia o ficheiro `index.html` para a pasta do repositório
4. Faz commit e push das alterações
5. O site será atualizado automaticamente

### Passo 5: Configurar a Aplicação

1. Abre o site no browser: `https://teu-usuario.github.io/lanches-futsal`
2. Na primeira utilização, aparecerá um modal de configuração
3. Cola a URL do Google Apps Script (copiada no Passo 3)
4. Clica em **Guardar e Continuar**
5. A aplicação está pronta a usar! 🎉

## 📱 Como Usar

### Adicionar Novo Lanche

1. Preenche o campo **Nome do Atleta**
2. Seleciona a **Data** do lanche
3. Escolhe o **Estado** (Pendente ou Entregue)
4. Opcionalmente, adiciona **Observações**
5. Clica em **Adicionar Lanche**

### Marcar como Entregue

1. Na lista de lanches, encontra o registo desejado
2. Clica no **checkbox** à esquerda
3. O estado será atualizado automaticamente

### Filtrar Lanches

- **Todos**: Mostra todos os registos
- **Pendentes**: Mostra apenas lanches não entregues
- **Entregues**: Mostra apenas lanches já entregues

## 🔧 Estrutura do Projeto

```
lanches-futsal/
├── index.html          # Aplicação web completa (HTML + CSS + JS)
├── Code.gs             # Código do Google Apps Script
├── README.md           # Este ficheiro
└── plans/
    └── plano-projeto.md # Plano detalhado do projeto
```

## 📊 Estrutura da Base de Dados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID | Number | Identificador único (auto-incremento) |
| Nome do Atleta | String | Nome do atleta/pai responsável |
| Data | Date | Data do lanche |
| Entregue | String | Estado: "Sim" ou "Não" |
| Observações | String | Notas adicionais (opcional) |

## 🔌 API Endpoints

| Método | Endpoint | Parâmetros | Descrição |
|--------|----------|------------|-----------|
| GET | `?action=read` | - | Listar todos os lanches |
| POST | - | `action=create`, `nome`, `data`, `entregue`, `observacoes` | Adicionar novo lanche |
| POST | - | `action=update`, `id`, `entregue` | Atualizar status |
| POST | - | `action=delete`, `id` | Remover lanche |

## 🎨 Design System

### Cores

- **Primária**: Azul (`#1e3a8a`, `#3b82f6`)
- **Sucesso**: Verde (`#10b981`)
- **Aviso**: Amarelo (`#f59e0b`)
- **Erro**: Vermelho (`#ef4444`)

### Tipografia

- Fonte principal: Segoe UI, Roboto, Helvetica Neue, Arial
- Tamanhos: 0.8rem - 2rem

### Componentes

- Cards com sombras suaves
- Botões arredondados
- Checkboxes animados
- Toasts de notificação
- Modal de configuração

## 🔒 Segurança

- A API do Google Apps Script é pública (acesso `Anyone`)
- Os dados são armazenados na tua Google Sheet privada
- Apenas pessoas com o link da aplicação podem aceder
- Recomenda-se não armazenar dados sensíveis (ex: moradas, telefones)

## 🐛 Resolução de Problemas

### Erro: "Não foi possível carregar os dados"

1. Verifica se a URL da API está correta
2. Verifica se o Google Apps Script está deployado como `Anyone`
3. Verifica se a Google Sheet tem as colunas corretas
4. Tenta aceder à URL da API diretamente no browser

### Erro: "Erro ao adicionar lanche"

1. Verifica se a Google Sheet não está protegida
2. Verifica se tens permissões de edição
3. Verifica se o Apps Script tem autorização para aceder à Sheet

### Erro: "Configuração não guardada"

1. Verifica se o browser permite localStorage
2. Tenta usar um browser diferente
3. Limpa a cache do browser

## 📞 Suporte

Se encontrares algum problema ou tiveres sugestões:

1. Abre uma issue no GitHub
2. Inclui uma descrição detalhada do problema
3. Inclui screenshots se possível

## 📄 Licença

Este projeto é de uso livre para fins educacionais e não comerciais.

---

**Desenvolvido com ❤️ para a equipa de Futsal**