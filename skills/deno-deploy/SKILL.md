---
name: deno-deploy
description: Deno Deploy deployment workflows - use when deploying Deno apps to Deno Deploy, managing environment variables, or setting up CI/CD pipelines.
license: MIT
metadata:
  author: denoland
  version: "1.0"
---

# Deno Deploy

This skill provides guidance for deploying applications to Deno Deploy.

## Important: Use `deno deploy`, NOT `deployctl`

**Always use the `deno deploy` command.** Do NOT use `deployctl`.

- `deployctl` is for Deno Deploy Classic (deprecated)
- `deno deploy` is the modern, integrated command built into the Deno CLI
- **Requires Deno >= 2.4.2** - the `deno deploy` subcommand was introduced in Deno 2.4

## Deployment Workflow

### Step 1: Locate the App Directory

Before running any deploy commands, find where the Deno app is located:

```bash
# Check if deno.json exists in current directory
if [ -f "deno.json" ] || [ -f "deno.jsonc" ]; then
  echo "APP_DIR: $(pwd)"
else
  # Look for deno.json in immediate subdirectories
  find . -maxdepth 2 -name "deno.json" -o -name "deno.jsonc" 2>/dev/null | head -5
fi
```

All deploy commands must run from the app directory.

### Step 2: Pre-Flight Checks

Check Deno version and existing configuration:

```bash
# Check Deno version (must be >= 2.4.2)
deno --version | head -1

# Check for existing deploy config
grep -E '"org"|"app"' deno.json deno.jsonc 2>/dev/null || echo "NO_DEPLOY_CONFIG"
```

### Step 3: Deploy Based on Configuration

**If `deploy.org` AND `deploy.app` exist in deno.json:**
```bash
# Build if needed (Fresh, Astro, etc.)
deno task build

# Deploy to production
deno deploy --prod
```

**If NO deploy config exists:**

The CLI needs an organization name. Find it at https://console.deno.com - the org is in the URL path (e.g., `console.deno.com/your-org-name`).

Then create the app:
```bash
deno deploy create --org <ORG_NAME>
# A browser window opens - complete the app creation there
```

After completion, verify:
```bash
grep -E '"org"|"app"' deno.json
```

## Core Commands

### Production Deployment

```bash
deno deploy --prod
```

### Preview Deployment

```bash
deno deploy
```

Preview deployments create a unique URL for testing without affecting production.

### Targeting Specific Apps

```bash
deno deploy --org my-org --app my-app --prod
```

### Specifying an Entrypoint

```bash
deno deploy --entrypoint main.ts --prod
```

Or configure in `deno.json`:
```json
{
  "deploy": {
    "entrypoint": "main.ts"
  }
}
```

## Environment Variables

```bash
# Add a variable
deno deploy env add DATABASE_URL "postgres://..."

# List variables
deno deploy env list

# Delete a variable
deno deploy env delete DATABASE_URL

# Load from .env file
deno deploy env load .env.production
```

## Viewing Logs

```bash
# Stream live logs
deno deploy logs

# Filter by date range
deno deploy logs --start 2026-01-15 --end 2026-01-16
```

## Command Reference

| Command | Purpose |
|---------|---------|
| `deno deploy --prod` | Production deployment |
| `deno deploy` | Preview deployment |
| `deno deploy create --org <name>` | Create new app |
| `deno deploy env add <var> <value>` | Add environment variable |
| `deno deploy env list` | List environment variables |
| `deno deploy env delete <var>` | Delete environment variable |
| `deno deploy logs` | View deployment logs |

## Edge Runtime Notes

Deno Deploy runs on the edge (globally distributed). Keep in mind:

- **No persistent filesystem** - Use Deno KV for storage
- **Environment variables** - Must be set via `deno deploy env`, not .env files at runtime
- **Global distribution** - Code runs at the edge closest to users
- **Cold starts** - First request after idle may be slightly slower

## Additional References

- [Authentication](references/AUTHENTICATION.md) - Interactive and CI/CD authentication
- [Frameworks](references/FRAMEWORKS.md) - Framework-specific deployment guides
- [Troubleshooting](references/TROUBLESHOOTING.md) - Common issues and solutions

## Documentation

- Official docs: https://docs.deno.com/deploy/
- CLI reference: https://docs.deno.com/runtime/reference/cli/deploy/
