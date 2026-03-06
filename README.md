# Method & Passion - Sistema de Gestão de Reservas

Sistema de gestão de reservas para alojamentos turísticos com calendário, aprovação de reservas e portal para equipas.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Configuração Inicial](#configuração-inicial)
4. [Gestão de Utilizadores (Clerk)](#gestão-de-utilizadores-clerk)
5. [Base de Dados](#base-de-dados)
6. [Funcionalidades](#funcionalidades)
7. [Deployment](#deployment)
8. [Manutenção](#manutenção)

---

## 🎯 Visão Geral

### Alojamentos Geridos

| ID | Nome | Cor no Calendário |
|----|------|-------------------|
| 1 | Esperança Terrace | 🔵 Azul |
| 2 | Nattura Gerês Village | 🟢 Verde |
| 3 | Douro & Sabor Escape | 🟣 Roxo |

### URLs da Aplicação

| Ambiente | URL |
|----------|-----|
| Produção | https://method-passion.com |
| Admin Dashboard | https://method-passion.com/admin |
| Portal Equipas | https://method-passion.com/teams |

### Fluxo de Reservas

```
Reserva Criada → Pendente (Amarelo) → Aprovada (Verde) → Confirmada
                       ↓
                 Cancelada (Cinza)
```

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Calendário | FullCalendar |
| Autenticação | Clerk SSO |
| Backend | Cloudflare Pages Functions |
| Base de Dados | Cloudflare D1 (SQLite) |
| Hosting | Cloudflare Pages |
| Domínio | Cloudflare DNS |

### Estrutura de Pastas

```
Method-Passion-Site/
├── apps/
│   ├── home/                # Website público (reservas)
│   │   └── src/
│   │       ├── components/   # BookingForm, AccommodationCard, etc.
│   │       ├── pages/        # Home
│   │       └── lib/          # i18n
│   ├── admin/               # Dashboard admin
│   │   └── src/
│   │       ├── components/   # AccommodationPanel, BookingModal, etc.
│   │       ├── pages/        # Dashboard
│   │       ├── hooks/        # useBookings, useAuth
│   │       └── lib/          # api.ts
│   └── teams/               # Portal equipas (só leitura)
│       └── src/
│           ├── components/   # TeamAccommodationPanel, etc.
│           ├── pages/        # TeamsDashboard
│           └── hooks/        # useBookings, useAuth
├── packages/
│   └── shared/              # Código partilhado
│       └── src/
│           ├── types/        # Booking, BlockedDate, Accommodation, etc.
│           ├── constants/    # ACCOMMODATIONS, STATUS_COLORS, etc.
│           ├── api/          # getAccommodations, checkAvailability
│           └── utils/        # formatDate, formatCurrency
├── functions/
│   └── api/
│       └── [[route]].ts     # Hono API (Cloudflare Workers)
├── migrations/               # Migrações SQL
├── scripts/
│   └── build.sh             # Build script (home + admin + teams)
└── schema.sql               # Schema da base de dados
```

---

## ⚙️ Configuração Inicial

### 1. Clonar e Instalar

```bash
git clone <repo>
cd Method-Passion-Site
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar ficheiro `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3. Configurar Cloudflare

No **Cloudflare Dashboard** → **Workers & Pages** → **method-passion-site** → **Settings** → **Variables and Secrets**:

| Variável | Valor |
|----------|-------|
| `CLERK_DOMAIN` | `powerful-mite-94.clerk.accounts.dev` |

### 4. Configurar Clerk JWT Template

1. **Clerk Dashboard** → **Sessions** → **Customize session token**
2. Adicionar:

```json
{
  "public_metadata": "{{user.public_metadata}}"
}
```

3. **Save**

---

## 👥 Gestão de Utilizadores (Clerk)

A gestão de utilizadores é feita **inteiramente no Clerk Dashboard**. Não é necessário alterar código.

### Tipos de Utilizadores

| Role | Metadata | Permissões |
|------|----------|------------|
| **Admin** | `{"role": "admin"}` | Acesso total a todos os alojamentos |
| **Team** | `{"role": "team", "accommodations": [1,2]}` | Ver reservas dos alojamentos especificados |
| **Guest** | Sem metadata | Sem acesso |

### Criar um Admin

1. **Clerk Dashboard** → **Users**
2. Clica no utilizador (ou cria novo com **+ Add User**)
3. **Public metadata** → **Edit**
4. Adicionar:

```json
{
  "role": "admin"
}
```

5. **Save**

### Criar um Utilizador de Equipa

1. **Clerk Dashboard** → **Users**
2. Clica no utilizador
3. **Public metadata** → **Edit**
4. Adicionar (exemplo com acesso aos alojamentos 1 e 2):

```json
{
  "role": "team",
  "accommodations": [1, 2]
}
```

5. **Save**

### IDs dos Alojamentos

| ID | Alojamento |
|----|------------|
| 1 | Esperança Terrace |
| 2 | Nattura Gerês Village |
| 3 | Douro & Sabor Escape |

### Remover Acesso

1. **Clerk Dashboard** → **Users** → Clica no utilizador
2. **Public metadata** → **Edit**
3. Remover o conteúdo ou colocar `{}`
4. **Save**

---

## 🗄️ Base de Dados

### Cloudflare D1

| Propriedade | Valor |
|-------------|-------|
| Database ID | `e82eee17-893b-462e-9586-8a87c7c52f0f` |
| Nome | `method-passion-db` |

### Schema Principal

#### Tabela: `accommodations`

```sql
CREATE TABLE accommodations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_guests INTEGER DEFAULT 4
);
```

#### Tabela: `bookings`

```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accommodation_id INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER DEFAULT 1,
  nationality TEXT,
  primary_name TEXT NOT NULL,
  additional_names TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',  -- pending, confirmed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Campos financeiros
  valor DECIMAL(10,2),
  imposto_municipal DECIMAL(10,2),
  comissao DECIMAL(10,2),
  taxa_bancaria DECIMAL(10,2),
  valor_sem_comissoes DECIMAL(10,2),  -- Calculado automaticamente
  valor_sem_iva DECIMAL(10,2),        -- Calculado automaticamente
  iva DECIMAL(10,2),
  plataforma TEXT,                    -- Booking.com, Airbnb, Direto, etc.
  
  FOREIGN KEY (accommodation_id) REFERENCES accommodations(id)
);
```

#### Tabela: `blocked_dates`

```sql
CREATE TABLE blocked_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accommodation_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  FOREIGN KEY (accommodation_id) REFERENCES accommodations(id)
);
```

### Executar Migrações

```bash
# Ver estado da base de dados
npx wrangler d1 execute method-passion-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"

# Executar migração
npx wrangler d1 execute method-passion-db --remote --file migrations/001_initial.sql
```

### Backup da Base de Dados

```bash
# Exportar dados
npx wrangler d1 export method-passion-db --remote --output backup.sql
```

---

## 🎨 Funcionalidades

### Dashboard Admin (`/admin/dashboard`)

#### Tab: Alojamentos
- Calendário por alojamento (FullCalendar)
- Cores por status:
  - 🟡 Amarelo = Pendente
  - 🟢 Verde = Confirmado
  - ⚫ Cinza = Cancelado
  - 🔴 Vermelho = Data Bloqueada
- Criar/Editar/Apagar reservas
- Bloquear datas

#### Tab: Aprovações
- Lista de reservas pendentes
- Aprovar ou Cancelar
- Badge com contagem de pendentes

### Portal Equipas (`/teams/dashboard`)

- Vista só de leitura
- Calendário unificado de todos os alojamentos permitidos
- Ver detalhes de reservas confirmadas
- Sem capacidade de editar

### Campos Financeiros (obrigatórios ao confirmar)

| Campo | Descrição |
|-------|-----------|
| Valor | Valor total da reserva |
| Imposto Municipal | Taxa turística |
| Comissão | Comissão da plataforma |
| Taxa Bancária | Taxas de processamento |
| Valor s/ Comissões | Calculado: Valor - Comissão - Taxa |
| IVA | Imposto sobre valor acrescentado |
| Valor s/ IVA | Calculado: (Valor - Comissões) / 1.06 |
| Plataforma | Booking.com, Airbnb, Direto, etc. |

---

## 🚀 Deployment

### Deploy Manual

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=method-passion-site
```

### Deploy Automático (Git)

O projeto está configurado para deploy automático via GitHub:
- Push para `main` → Deploy automático

### Verificar Deployment

1. **Cloudflare Dashboard** → **Workers & Pages** → **method-passion-site**
2. Ver **Deployments** para histórico

---

## 🔧 Manutenção

### Logs

```bash
# Ver logs em tempo real
npx wrangler pages deployment tail --project-name=method-passion-site
```

### Problemas Comuns

#### "Unauthorized" ao aceder ao dashboard

1. Verificar se o utilizador tem `{"role": "admin"}` no Clerk
2. Verificar se o JWT Template está configurado com `public_metadata`
3. Fazer logout e login novamente

#### Reservas não aparecem

1. Verificar consola do browser (F12) para erros
2. Verificar se `CLERK_DOMAIN` está configurado no Cloudflare

#### Erro 500 nos endpoints

1. Ver logs: `npx wrangler pages deployment tail`
2. Verificar se D1 está bound corretamente

### Limpar Cache do Clerk

Se as roles não estiverem a funcionar após alteração:
1. Utilizador deve fazer logout
2. Limpar cookies do browser
3. Login novamente

---

## 📞 Suporte

### Dashboards Externos

| Serviço | URL |
|---------|-----|
| Clerk Dashboard | https://dashboard.clerk.com |
| Cloudflare Dashboard | https://dash.cloudflare.com |

### Documentação

- Clerk: https://clerk.com/docs
- Cloudflare D1: https://developers.cloudflare.com/d1
- Cloudflare Pages: https://developers.cloudflare.com/pages

---

## 📝 Changelog

### v2.1.0 (Março 2026)
- ✅ Reestruturação monorepo (apps/home, apps/admin, apps/teams)
- ✅ Shared package para types, constants e utils
- ✅ Remoção de código duplicado/morto
- ✅ Simplificação TypeScript config (sem project references)
- ✅ Correção visual do calendário (checkout day visível)

### v2.0.0 (Janeiro 2026)
- ✅ Migração para Clerk SSO
- ✅ Campos financeiros nas reservas
- ✅ Importação de 215 reservas históricas
- ✅ Workflow de aprovação (pendente → confirmado)

### v1.0.0 (Dezembro 2025)
- ✅ Sistema inicial com autenticação básica
- ✅ Calendário FullCalendar
- ✅ CRUD de reservas
- ✅ Portal para equipas
