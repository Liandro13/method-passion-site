# Guia de Configuração - Integração com Excel OneDrive

## 1. Configurar Microsoft Azure App

### Passo 1: Criar App Registration no Azure
1. Aceda a [Azure Portal](https://portal.azure.com)
2. Vá para **Azure Active Directory** > **App registrations** > **New registration**
3. Nome: `Method-Passion-Bookings`
4. Supported account types: **Accounts in this organizational directory only**
5. Clique em **Register**

### Passo 2: Anotar IDs
Após criar, anote:
- **Application (client) ID** - este é o `CLIENT_ID`
- **Directory (tenant) ID** - este é o `TENANT_ID`

### Passo 3: Criar Client Secret
1. No menu lateral, vá para **Certificates & secrets**
2. Clique em **New client secret**
3. Descrição: `Cloudflare Worker Access`
4. Validade: 24 meses (ou conforme preferir)
5. Clique em **Add**
6. **COPIE O VALUE IMEDIATAMENTE** - este é o `CLIENT_SECRET` (não consegue ver depois!)

### Passo 4: Configurar Permissões
1. No menu lateral, vá para **API permissions**
2. Clique em **Add a permission** > **Microsoft Graph** > **Application permissions**
3. Procure e adicione:
   - `Files.Read.All` - Para ler os ficheiros Excel
4. Clique em **Grant admin consent** (botão com shield ✓)

## 2. Configurar Cloudflare Pages

### Passo 1: Adicionar Environment Variables
1. Vá para [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Aceda ao seu projeto Pages
3. Vá para **Settings** > **Environment variables**
4. Adicione as seguintes variáveis (para Production e Preview):

```
TENANT_ID = [o seu Directory (tenant) ID]
CLIENT_ID = [o seu Application (client) ID]
CLIENT_SECRET = [o valor do secret que copiou]
```

## 3. Estrutura do Excel

Os Excel files já têm a estrutura correta na **Sheet1**:

| A (Mês) | B (Data Check-In) | C (Data check-out) | D (Noites) | E (Guest) | F (Lingua) |
|---------|-------------------|-------------------|------------|-----------|------------|
| JANEIRO 2026 | 03-Jan-26 | 06-Jan-26 | 3 | Ralph Horeth... | Inglês |
| | 09-Jan-26 | 12-Jan-26 | 3 | Matheus Lobo... | Português |

**O sistema lê automaticamente:**
- **Coluna B**: Data Check-In (formato: dd-mmm-yy, ex: 03-Jan-26)
- **Coluna C**: Data check-out (formato: dd-mmm-yy, ex: 06-Jan-26)
- **Todas as linhas com datas são consideradas reservas confirmadas**

## 4. Deploy

### Opção 1: Git Push (Recomendado)
```bash
git add .
git commit -m "Add availability checking with Excel integration"
git push
```

Cloudflare Pages fará deploy automaticamente.

### Opção 2: Wrangler CLI
```bash
npm install -g wrangler
wrangler pages publish
```

## 5. Testar

Após o deploy, teste a API diretamente:

```bash
curl -X POST https://seu-site.pages.dev/api/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "accommodation": "Esperança Terrace",
    "checkIn": "2026-02-01",
    "checkOut": "2026-02-05"
  }'
```

Resposta esperada:
```json
{
  "accommodation": "Esperança Terrace",
  "checkIn": "2026-02-01",
  "checkOut": "2026-02-05",
  "available": true,
  "bookedDates": [...]
}
```

## 6. Como Funciona

1. User escolhe datas no site
2. Antes de abrir WhatsApp, o site chama `/api/check-availability`
3. Cloudflare Function:
   - Autentica com Microsoft Graph API
   - Lê o Excel do OneDrive
   - Verifica se há conflito de datas
   - Retorna disponibilidade
4. Se indisponível, mostra aviso ao user
5. Se disponível, abre WhatsApp normalmente

## Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se as credenciais estão corretas no Cloudflare
- Confirme que deu "Grant admin consent" nas permissões

### Erro 403 (Forbidden)
- Certifique-se que adicionou permissão `Files.Read.All`
- Verifique se os IDs dos ficheiros Excel estão corretos

### Excel não é lido
- Confirme que o ficheiro está no OneDrive da mesma conta
- Verifique se a Sheet1 existe e tem dados
- Teste os IDs dos ficheiros na função

## Partilhar Excel com a App

Se os Excel estiverem numa conta pessoal, pode precisar:
1. Partilhar cada Excel com a app
2. Ou usar delegated permissions em vez de application permissions

## Suporte

Para mais ajuda, consulte:
- [Microsoft Graph API Docs](https://docs.microsoft.com/en-us/graph/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
