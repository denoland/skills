# Databases on Deno Deploy

## Overview

Deno Deploy provides built-in database support with automatic environment isolation. You don't need to manage connection strings or worry about mixing production and development data.

## Available Database Engines

| Engine | Description |
|--------|-------------|
| **Deno KV** | Fast, globally distributed key-value store hosted by Deno |
| **PostgreSQL** | Connect your own PostgreSQL or provision managed Postgres via Prisma |

## Key Concept: Timelines

Deno Deploy automatically creates **isolated databases for each environment**:

- **Production:** `{app-id}-production`
- **Git branches:** `{app-id}--{branch-name}`
- **Preview deployments:** `{app-id}-preview`

This means your preview deployments won't accidentally modify production data.

## Provisioning a Database

1. Go to your organization dashboard
2. Click "Databases"
3. Click "Provision Database"
4. Choose your engine (Deno KV or PostgreSQL)
5. Name it and save

## Assigning to an App

1. From the database instances list, click "Assign"
2. Select the target app
3. Deno Deploy creates separate databases for each timeline automatically

## Connecting in Code

### Deno KV

No configuration needed - just call `Deno.openKv()`:

```typescript
const kv = await Deno.openKv();

// Deno Deploy automatically connects to the right database
// based on your current environment (production, preview, etc.)
```

### PostgreSQL

Deno Deploy injects standard environment variables that most PostgreSQL libraries detect automatically:

- `DATABASE_URL` - Full connection string
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - Individual components

```typescript
// Using npm:postgres
import postgres from "npm:postgres";
const sql = postgres(); // Reads from environment automatically

// Or with Deno's built-in PostgreSQL driver
const client = new Client(); // Also reads from environment
```

## Local Development

### With Tunnel

Use `--tunnel` to connect your local dev server to your hosted development database:

```bash
deno task --tunnel dev
```

This gives you access to the same database environment variables locally.

### Without Tunnel

- **Deno KV:** Data stays in memory during local development
- **PostgreSQL:** Point to a local PostgreSQL instance or use the tunnel

## Migrations

Deno Deploy supports pre-deploy commands that run before each deployment. Use these for database migrations:

```json
{
  "deploy": {
    "preDeploy": ["deno task db:migrate"]
  }
}
```

## Sharing Databases

Multiple apps can share the same database instance. Each app gets its own isolated databases per timeline, even when sharing.

## Documentation

- Databases overview: https://docs.deno.com/deploy/reference/databases/
- Deno KV reference: https://docs.deno.com/deploy/reference/deno_kv/
