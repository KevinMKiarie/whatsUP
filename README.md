# WhatsUP

AI-powered WhatsApp booking assistant for small businesses — salons, tattoo shops, spas, and similar.  
Clients text your WhatsApp number to book appointments, receive PDF invoices, and leave star ratings, all without leaving WhatsApp.  
Owners manage everything from a clean web dashboard.

---

## How it works

```
Client texts WhatsApp
       ↓
Evolution API receives message → POST /api/whatsapp/webhook
       ↓
NestJS routes to WhatsappService → ConversationService tracks state
       ↓
AiService (Ollama / qwen2.5) reads business context + available slots
       ↓
AI replies: ask questions, draft booking, confirm, or cancel
       ↓
BookingsService creates booking in PostgreSQL
       ↓
InvoicingService generates PDF → sent back via WhatsApp
       ↓
RatingsService prompts review 24 h after service
```

---

## Stack

| Layer | Tech |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| API | NestJS 11 (TypeScript) |
| Dashboard | Next.js 16 App Router (TypeScript) |
| Database | PostgreSQL 16 via Prisma 6 |
| AI | Ollama local (qwen2.5:14b) — swap to Claude API in prod |
| WhatsApp | Evolution API (dev/staging) → Meta Cloud API (production) |
| Auth | Better Auth (Prisma-backed, email + password) |
| PDF | pdfkit |
| Charts | Recharts |
| Containers | Docker + docker compose |

---

## Monorepo structure

```
apps/
  api/          NestJS backend                  :3001
  web/          Next.js dashboard               :3000

packages/
  shared/       Domain TypeScript types (no runtime deps)
  db/           Prisma schema + generated client
  whatsapp/     WhatsApp adapter (Evolution + Meta stubs)

infra/
  ansible/      Deployment playbooks (placeholder)
```

### API modules (`apps/api/src/modules/`)

| Module | Responsibility |
|---|---|
| `whatsapp` | Webhook receiver, QR/status endpoints, message dispatch |
| `ai` | Ollama chat, conversation state machine, prompt builder |
| `bookings` | CRUD, analytics, available-slot calculation |
| `businesses` | Business + service listing |
| `invoicing` | PDF generation, WhatsApp delivery |
| `broadcast` | Scheduled / one-off bulk messages |
| `ratings` | Post-service review prompts |
| `adapter` | Injects the active WhatsApp adapter (Evolution or Meta) |

---

## Prerequisites

- Node.js ≥ 20 and pnpm ≥ 9
- Docker + Docker Compose
- [Ollama](https://ollama.com) installed locally (`ollama serve`)

---

## Local development setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USER/whatsUP.git
cd whatsUP
pnpm install

# 2. Environment
cp .env.example .env
# Edit .env — at minimum set BETTER_AUTH_SECRET:
openssl rand -hex 32   # paste output as BETTER_AUTH_SECRET

# 3. Start PostgreSQL
docker compose up postgres -d

# 4. Push schema and generate Prisma client
pnpm --filter @whatsup/db db:push
pnpm --filter @whatsup/db db:generate

# 5. Pull AI model (once)
ollama pull qwen2.5:14b

# 6. Create the first dashboard admin
pnpm --filter @whatsup/web create-admin

# 7. Run everything
pnpm dev
#   API  → http://localhost:3001
#   Web  → http://localhost:3000
```

---

## Docker (all services)

```bash
# Build and start everything
docker compose up -d

# Tear down
docker compose down
```

Services started:

| Service | Port | Notes |
|---|---|---|
| `postgres` | 5433 | Mapped from container 5432 |
| `evolution` | 8080 | Evolution API — needs `docker login ghcr.io` |
| `api` | 3001 | NestJS |
| `web` | 3000 | Next.js |

> **Ollama** is not containerised — run `ollama serve` on the host. The api container reaches it via `host.docker.internal:11434`.

### First-time Docker pull for Evolution API

```bash
# Log in with a GitHub token (read:packages scope)
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
docker compose pull evolution
docker compose up -d
```

---

## WhatsApp setup (Evolution API)

The dashboard has a guided setup page at `/dashboard/whatsapp`.

Manual steps via API:

```bash
BASE=http://localhost:8080
INSTANCE=my-salon
KEY=your-evolution-api-key

# 1. Create instance
curl -X POST $BASE/instance/create \
  -H "apikey: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"'$INSTANCE'","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'

# 2. Set webhook
curl -X PUT $BASE/webhook/set/$INSTANCE \
  -H "apikey: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"url":"http://YOUR_SERVER:3001/api/whatsapp/webhook","events":["MESSAGES_UPSERT"]}'

# 3. Get QR code
curl $BASE/instance/connect/$INSTANCE -H "apikey: $KEY"
# Returns base64 PNG — open in browser or display on dashboard
```

Scan the QR code in WhatsApp → **Linked Devices → Link a Device**.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | 32-byte hex secret (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | ✅ | Next.js base URL (`http://localhost:3000`) |
| `OLLAMA_URL` | ✅ | Ollama API base (`http://localhost:11434/v1`) |
| `OLLAMA_MODEL` | — | Model name, default `qwen2.5:14b` |
| `EVOLUTION_API_URL` | ✅ | Evolution API base URL |
| `EVOLUTION_INSTANCE` | ✅ | Instance name (e.g. `my-salon`) |
| `EVOLUTION_API_KEY` | ✅ | Evolution API key |
| `API_URL` | Docker only | Next.js server-to-API URL (`http://api:3001/api`) |
| `ADMIN_EMAIL` | — | Used by `create-admin` script |
| `ADMIN_PASSWORD` | — | Used by `create-admin` script |
| `ADMIN_NAME` | — | Used by `create-admin` script |

---

## Key commands

```bash
# Install all workspace dependencies
pnpm install

# Dev servers (both apps + file watching)
pnpm dev

# Build everything
pnpm build

# Run a script in a specific package
pnpm --filter <package-name> <script>

# Database
pnpm --filter @whatsup/db db:generate     # regenerate Prisma client
pnpm --filter @whatsup/db db:push         # push schema without migrations
pnpm --filter @whatsup/db db:migrate:dev  # create a migration
pnpm --filter @whatsup/db db:studio       # visual DB browser

# Create first admin user
pnpm --filter @whatsup/web create-admin

# Commit and push all changes
./commit.bash "feat: your message here"
```

---

## API endpoints

### Bookings
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bookings?businessId=` | List bookings for a business |
| `GET` | `/api/bookings/analytics?businessId=&range=week\|month\|quarter` | KPI + chart data |
| `PATCH` | `/api/bookings/:id/status` | Update booking status |

### Businesses
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/businesses` | List all businesses with services |

### WhatsApp
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/whatsapp/webhook` | Incoming message from Evolution API |
| `GET` | `/api/whatsapp/status` | Connection state + phone number |
| `GET` | `/api/whatsapp/qr` | Base64 QR code image |
| `POST` | `/api/whatsapp/instance` | Create Evolution instance + set webhook |
| `POST` | `/api/whatsapp/webhook/configure` | Update webhook URL |

### Broadcast
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/broadcast?businessId=` | List broadcasts |
| `POST` | `/api/broadcast` | Create broadcast |
| `DELETE` | `/api/broadcast/:id` | Delete broadcast |

### Invoicing
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/invoicing/send` | Generate + send PDF invoice |

---

## Roadmap

- [x] Monorepo scaffold (Turborepo + pnpm)
- [x] Prisma schema — Business, Service, Client, Booking, Invoice, Rating, Conversation
- [x] NestJS API — all core modules
- [x] AI conversation engine (Ollama / OpenAI-compatible)
- [x] Evolution API WhatsApp adapter
- [x] PDF invoice generation
- [x] Broadcast scheduler
- [x] Next.js dashboard — Overview, Bookings, Invoices, Broadcast
- [x] Better Auth — email + password, Prisma-backed
- [x] Docker multi-stage builds
- [x] WhatsApp setup page with live QR code
- [ ] Seed script with realistic demo data
- [ ] Status update buttons in booking detail
- [ ] New booking form
- [ ] Ansible deployment playbooks
- [ ] Meta Cloud API adapter (production WhatsApp)
- [ ] Claude API as AI backend option
