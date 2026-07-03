# WhatsUP

AI-powered WhatsApp chatbot for small businesses (salons, tattoo
shops).
Clients book appointments, receive invoices, and leave ratings — all
inside WhatsApp.

## Stack

| Layer      | Tech                                        |
| ---------- | ------------------------------------------- |
| Monorepo   | Turborepo + pnpm workspaces                 |
| Backend    | NestJS 11                                   |
| Frontend   | Next.js 16                                  |
| Database   | PostgreSQL via Prisma 6                     |
| AI         | Ollama (local) → Claude API (later)         |
| WhatsApp   | Evolution API (dev) → Meta Cloud API (prod) |
| Containers | Docker + docker-compose                     |
| Infra      | Ansible (later)                             |

## Monorepo structure

apps/
api/ → NestJS backend (port 3001)
web/ → Next.js dashboard (port 3000)
packages/
shared/ → shared TypeScript types (no deps)
db/ → Prisma schema + generated client
whatsapp/ → WhatsApp adapter (Evolution / Meta)
infra/
ansible/ → deployment playbooks (later)

## Commands

````bash
# Install all dependencies
pnpm install

# Run a script in one specific package
pnpm --filter <package-name> <script>

# Generate Prisma client after schema changes
pnpm --filter @whatsup/db db:generate

# Run DB migrations
pnpm --filter @whatsup/db db:migrate:dev

# Open Prisma Studio (visual DB browser)
pnpm --filter @whatsup/db db:studio

# Start all apps in dev mode
pnpm dev

# Start one app
pnpm --filter @whatsup/api dev   # → http://localhost:3001
pnpm --filter @whatsup/web dev   # → http://localhost:3000

# Build everything
pnpm build

# Docker (start postgres + ollama)
docker-compose up -d postgres ollama

# Pull AI model (first time)
docker-compose exec ollama ollama pull qwen2.5:14b

Setup

cp .env.example .env   # fill in your values
pnpm install
     42 +  conversation Conversation?
     43 +  createdAt    DateTime      @defau
        +lt(now())
     44 +}
     45 +
     46 +model Booking {
     47 +  id          String        @id @de
        +fault(cuid())
     48 +  business    Business      @relati
        +on(fields: [businessId], references
        +: [id])
     49 +  businessId  String
     50 +  client      Client        @relati
        +on(fields: [clientId], references:
        +[id])
     51 +  clientId    String
     52 +  service     Service       @relati
        +on(fields: [serviceId], references:
        + [id])
     53 +  serviceId   String
     54 +  scheduledAt DateTime
     55 +  status      BookingStatus @defaul
        +t(PENDING)
     56 +  invoice     Invoice?
     57 +  rating      Rating?
     58 +  createdAt   DateTime      @defaul
        +t(now())
     59 +}
     60 +
     61 +enum BookingStatus {
     62 +  PENDING
     63 +  CONFIRMED
     64 +  COMPLETED
     65 +  CANCELLED
     66 +}
     67 +
     68 +model Invoice {
     69 +  id        String    @id @default(
        +cuid())
     70 +  booking   Booking   @relation(fie
        +lds: [bookingId], references: [id])
     71 +  bookingId String    @unique
     72 +  amount    Decimal   @db.Decimal(1
        +0, 2)
     73 +  pdfUrl    String?
     74 +  sentAt    DateTime?
     75 +  createdAt DateTime  @default(now(
        +))
     76 +}
     77 +
     78 +model Rating {
     79 +  id           String   @id @defaul
        +t(cuid())
     80 +  booking      Booking  @relation(f
        +ields: [bookingId], references: [id
        +])
     81 +  bookingId    String   @unique
     82 +  business     Business @relation(f
        +ields: [businessId], references: [i
        +d])
     83 +  businessId   String
     84 +  client       Client   @relation(f
        +ields: [clientId], references: [id]
        +)
     85 +  clientId     String
     86 +  score        Int
     87 +  comment      String?
     88 +  googleSynced Boolean  @default(fa
        +lse)
     89 +  createdAt    DateTime @default(no
        +w())
     90 +}
     91 +
     92 +model Conversation {
     93 +  id         String   @id @default(
        +cuid())
     94 +  client     Client   @relation(fie
        +lds: [clientId], references: [id])
     95 +  clientId   String   @unique
     96 +  businessId String
     97 +  state      String   @default("IDL
        +E")
     98 +  draft      Json?
     99 +  messages   Json     @default("[]"
        +)
    100 +  updatedAt  DateTime @updatedAt
    101 +  createdAt  DateTime @default(now(
        +))
    102 +}
⎿  Interrupted · What should Claude do instead?

❯ from here on guide me so that i implement the code
 piece by piece to understand it further

⏺ Perfect approach. Here's the current state so we're
 aligned:

Done:
- Root monorepo config (turbo, pnpm workspaces)
- packages/shared — all domain types
- packages/db — Prisma schema with all 7 models
- apps/api — NestJS scaffolded (fresh CLI)
- apps/web — Next.js scaffolded (fresh CLI)
- All deps installed

Left to build (in order):
1. packages/db/src/index.ts — Prisma client
singleton
2. packages/whatsapp/ — adapter interface +
Evolution + Meta stubs
3. apps/api/ — config, prisma module, then each
feature module
4. apps/web/ — layout, dashboard, components
5. Docker
6. Ansible stub

---
How we'll work:

I give you one file at a time. Before the code I
explain:
- What the file is
- Why it exists
- How it connects to the rest

You implement it, then say "done" or ask questions.
 Then we move to the next.

---
Ready to start?

Step 1 of ~20: packages/db/src/index.ts

What: The Prisma client export for the whole
monorepo.
Why: Every app that needs the database imports from
 @whatsup/db — one place, one client, no version
drift.
How it connects: apps/api will import PrismaClient
from here. The global trick prevents hot-reload
from creating hundreds of connections in dev.

Create the file at packages/db/src/index.ts:

import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new
 PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '../generated/prisma';

Once you've created that file, run this command to
generate the Prisma client (the generated/prisma
folder the index imports from):

pnpm --filter @whatsup/db db:generate

Tell me when done and I'll move to Step 2.

✻ Brewed for 21s

※ recap: Building a WhatsApp AI chatbot monorepo for
small businesses. We just scaffolded Next.js and
NestJS with proper CLI tools and installed all
dependencies.

Next: create `packages/db/src/index.ts` with the
Prisma singleton, then run `pnpm --filter
@whatsup/db db:generate`. (disable recaps in
/config)

❯ can we fix thus:
Prisma config detected, skipping environment
variable loading.
Prisma schema loaded from prisma/schema.prisma
Error: Prisma schema validation - (get-config
wasm)
Error code: P1012
error: Argument "url" is missing in data source
block "db".
  -->  prisma/schema.prisma:6
   |
 5 |
 6 | datasource db {
 7 |   provider = "postgresql"
 8 | }
   |

Validation Error Count: 1
[Context: getConfig]

Prisma CLI Version : 6.19.3
/Users/app/Desktop/projects/personal/whatsUP/packa
ges/db:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL]
@whatsup/db@0.0.1 db:generate: `prisma generate`
Exit status 1 what does the pnp --filter do,
actually on every step we should also update the
readme to understand

⏺ Two things to fix, one to explain. Let me handle
them all.

---
Fix: Prisma schema missing url

The datasource block needs url even in Prisma 6 —
the prisma.config.ts overrides it at runtime but
the schema validator still requires it to be
declared.

Open packages/db/prisma/schema.prisma and change
the datasource block from:

datasource db {
  provider = "postgresql"
}

to:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

Then run again:

pnpm --filter @whatsup/db db:generate

---
What pnpm --filter does

pnpm --filter <package-name> <script> runs a script
 in one specific workspace package instead of all
of them.

pnpm --filter @whatsup/db db:generate
# Means: go into packages/db and run the
"db:generate" script
# Same as: cd packages/db && pnpm db:generate

Without --filter, pnpm dev runs dev in every
package that has it (all apps at once — that's what
 turbo uses). With --filter you target exactly one.

You'll use it constantly:
pnpm --filter @whatsup/api dev       # run only the
 API
pnpm --filter @whatsup/web dev       # run only the
 web app
pnpm --filter @whatsup/db db:studio  # open Prisma
Studio

---
README update

Open README.md at the root and replace it with this
 — we'll keep adding to it as we go:

# WhatsUP

AI-powered WhatsApp chatbot for small businesses
(salons, tattoo shops).
Clients book appointments, receive invoices, and
leave ratings — all inside WhatsApp.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | NestJS 11 |
| Frontend | Next.js 16 |
| Database | PostgreSQL via Prisma 6 |
| AI | Ollama (local) → Claude API (later) |
| WhatsApp | Evolution API (dev) → Meta Cloud API
(prod) |
| Containers | Docker + docker-compose |
| Infra | Ansible (later) |

## Monorepo structure

apps/
  api/   → NestJS backend (port 3001)
  web/   → Next.js dashboard (port 3000)
packages/
  shared/    → shared TypeScript types (no deps)
  db/        → Prisma schema + generated client
  whatsapp/  → WhatsApp adapter (Evolution / Meta)
infra/
  ansible/   → deployment playbooks (later)

## Commands

```bash
# Install all dependencies
pnpm install

# Run a script in one specific package
pnpm --filter <package-name> <script>

# Generate Prisma client after schema changes
pnpm --filter @whatsup/db db:generate

# Run DB migrations
pnpm --filter @whatsup/db db:migrate:dev

# Open Prisma Studio (visual DB browser)
pnpm --filter @whatsup/db db:studio

# Start all apps in dev mode
pnpm dev

# Start one app
pnpm --filter @whatsup/api dev   # →
http://localhost:3001
pnpm --filter @whatsup/web dev   # →
http://localhost:3000

# Build everything
pnpm build

# Docker (start postgres + ollama)
docker-compose up -d postgres ollama

# Pull AI model (first time)
docker-compose exec ollama ollama pull qwen2.5:14b

Setup

cp .env.example .env   # fill in your values
pnpm install
docker-compose up -d postgres ollama
pnpm --filter @whatsup/db db:generate
pnpm --filter @whatsup/db db:migrate:dev
pnpm dev
````
