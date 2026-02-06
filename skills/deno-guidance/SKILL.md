---
name: deno-guidance
description: Use when starting any Deno project, choosing packages, configuring deno.json, or running CLI commands. Provides foundational knowledge for building modern Deno applications.
license: MIT
metadata:
  author: denoland
  version: "1.0"
---

# Deno Development Guidance

## Overview

This skill provides foundational knowledge for building modern Deno applications. Deno is a secure JavaScript/TypeScript runtime that runs TypeScript directly, has built-in tools (formatter, linter, test runner), and uses modern package management through JSR.

## When to Use This Skill

- Starting a new Deno project
- Adding dependencies to a project
- Configuring `deno.json` settings
- Running Deno CLI commands (fmt, lint, test)
- Setting up import maps
- Understanding Deno's permission system

Apply these practices whenever working in a Deno project (identified by the presence of `deno.json`).

## Package Management Priority

When adding dependencies, follow this priority order:

1. **JSR packages (`jsr:`)** - Preferred for Deno-native packages
   - Better TypeScript support (types are built-in)
   - Faster to resolve and install
   - Example: `jsr:@std/http`, `jsr:@fresh/core`

2. **npm packages (`npm:`)** - Fully supported, use when no JSR alternative exists
   - Deno has full npm compatibility
   - Example: `npm:express`, `npm:zod`

3. **AVOID: `https://deno.land/x/`** - Deprecated registry
   - This is the old package registry
   - Many LLMs incorrectly default to this
   - Always use `jsr:` instead

### Standard Library

The Deno standard library lives at `@std/` on JSR:

```jsonc
// deno.json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@1",
    "@std/http": "jsr:@std/http@1",
    "@std/path": "jsr:@std/path@1"
  }
}
```

```typescript
import { serve } from "@std/http";
import { join } from "@std/path";
import { assertEquals } from "@std/assert";
```

Never use `https://deno.land/std/` - always use `jsr:@std/*`.

## Understanding Deno

Reference: https://docs.deno.com/runtime/fundamentals/

Key concepts:
- **Native TypeScript** - No build step needed, Deno runs TypeScript directly
- **Explicit permissions** - Use flags like `--allow-net`, `--allow-read`, `--allow-env`
- **deno.json** - The config file (similar to package.json but simpler)
- **Import maps** - Define import aliases in deno.json's `imports` field

## Workflow Best Practices

### After Making Code Changes

Run these commands regularly, especially after significant changes:

```bash
deno fmt          # Format all files
deno lint         # Check for issues
deno test         # Run tests
```

### Package Management

```bash
deno add jsr:@std/http    # Add a package
deno install              # Install all dependencies
deno update               # Update all dependencies to latest compatible versions
deno update jsr:@std/http # Update a specific dependency
```

**`deno update` vs `deno upgrade`:**

- `deno update` - Updates **project dependencies** in `deno.json` (and `package.json`) to their latest compatible versions. Respects semver ranges. Use this to keep your dependencies current.
- `deno upgrade` - Updates the **Deno runtime itself** to the latest version. Has nothing to do with project dependencies.

After running `deno update`, always check for breaking API changes - especially for alpha/pre-release packages where semver ranges can pull in breaking updates.

### Configuration

In `deno.json`, you can exclude directories from formatting/linting:

```json
{
  "fmt": {
    "exclude": ["build/"]
  },
  "lint": {
    "exclude": ["build/"]
  }
}
```

A folder can also be excluded from everything at the top level:

```json
{
  "exclude": ["build/"]
}
```

## Deployment

For deploying to Deno Deploy, see the dedicated **deno-deploy** skill.

Quick command: `deno deploy --prod`

## Documentation Resources

When more information is needed:

- **`deno doc <package>`** - Generate docs for any JSR or npm package locally
- **https://docs.deno.com** - Official Deno documentation
- **https://jsr.io** - Package registry with built-in documentation
- **https://fresh.deno.dev/docs** - Fresh framework documentation

## Quick Reference: Deno CLI Commands

| Command | Purpose |
|---------|---------|
| `deno run file.ts` | Run a TypeScript/JavaScript file |
| `deno task <name>` | Run a task from deno.json |
| `deno fmt` | Format code |
| `deno lint` | Lint code |
| `deno test` | Run tests |
| `deno add <pkg>` | Add a package |
| `deno install` | Install dependencies |
| `deno update` | Update project dependencies |
| `deno upgrade` | Update Deno runtime itself |
| `deno doc <pkg>` | View package documentation |
| `deno deploy --prod` | Deploy to Deno Deploy |

## Common Mistakes

**Using `deno.land/x` instead of JSR**

```typescript
// ❌ Wrong - deprecated registry
import { serve } from "https://deno.land/x/http/mod.ts";
```

```ts
// ✅ Correct - use JSR and a bare specifier
import { serve } from "@std/http";
```

```jsonc
// deno.json
{
  "imports": {
    // ensure the specifier has a version requirement
    "@std/http": "jsr:@std/http@1"
  }
}
```

Inline specifiers are fine in single file scripts, but if a deno.json exists then it should go there. It's preferable to place npm dependencies in a package.json if a package.json exists.

**Forgetting to run fmt/lint before committing**
```bash
# ❌ Committing without checking
git add . && git commit -m "changes"

# ✅ Always format and lint first
deno fmt && deno lint && git add . && git commit -m "changes"
```

**Using `https://deno.land/std/` for standard library**

```typescript
// ❌ Wrong - old URL
import { join } from "https://deno.land/std/path/mod.ts";
```

Instead, install with:

```sh
deno add jsr:@std/path
```

Then use the bare import:

```ts
// suggest this
import { join } from "@std/path";
```

**Running code without permission flags**

```bash
# ❌ Confusing error - "Requires net access"
deno run server.ts

# ✅ Grant specific permissions
deno run --allow-net server.ts
```

**Not using `deno add` for dependencies**

```bash
# ❌ Manually editing imports without updating deno.json
# (works, but misses lockfile benefits)

# ✅ Use deno add to manage dependencies
deno add jsr:@std/http
```
