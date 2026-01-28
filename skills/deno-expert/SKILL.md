---
name: deno-expert
description: Expert-level Deno knowledge for code review, debugging, and best practice enforcement. Use when reviewing Deno code or answering advanced Deno questions.
license: MIT
metadata:
  author: denoland
  version: "1.0"
---

# Deno Expert Knowledge

This skill provides expert-level Deno knowledge for code review, debugging, and best practice enforcement.

## When to Use This Skill

- Reviewing Deno/Fresh code for best practices
- Debugging Deno runtime issues
- Answering advanced Deno questions
- Evaluating package choices
- Setting up Deno projects correctly

## Core Expertise Areas

Understanding these topics deeply:
- **Deno runtime** - Permissions, built-in tools, TypeScript support
- **Fresh framework** - Island architecture, routing, components
- **JSR packages** - The modern registry, @std/* library
- **Preact** - Components, hooks, signals
- **Deno Deploy** - Edge deployment, environment variables
- **Deno Sandboxes** - Safe code execution with @deno/sandbox

## Package Recommendation Principles

When recommending or reviewing package choices:

1. **First choice:** `jsr:` packages (e.g., `jsr:@std/http`)
2. **Second choice:** `npm:` packages when no JSR alternative exists
3. **Never recommend:** `https://deno.land/x/` - this is deprecated

The standard library is at `jsr:@std/*`, not `deno.land/std`.

## Built-in Tool Usage

Encourage using Deno's integrated tooling:
- `deno fmt` - Format code
- `deno lint` - Lint for issues
- `deno test` - Run tests
- `deno doc <package>` - View package documentation
- `deno add <package>` - Add dependencies
- `deno deploy` - Deploy to Deno Deploy

## Code Review Checklist

### Import Statements
- [ ] Uses `jsr:` for Deno-native packages
- [ ] Uses `npm:` only when no JSR alternative exists
- [ ] No `https://deno.land/x/` imports (deprecated)
- [ ] No `https://deno.land/std/` imports (use `jsr:@std/*`)
- [ ] Standard library uses `jsr:@std/*`

### Configuration
- [ ] Has a proper `deno.json` configuration
- [ ] Import maps defined in `deno.json` (not separate file)
- [ ] Correct permissions in run commands

### Fresh Applications
- [ ] Islands are small and focused (minimal JavaScript to client)
- [ ] Props passed to islands are JSON-serializable (no functions)
- [ ] Non-interactive components are in `components/`, not `islands/`
- [ ] Uses `class` instead of `className` (Preact supports both)
- [ ] Build step runs before deployment (`deno task build`)

### Code Quality
- [ ] Code is formatted (`deno fmt`)
- [ ] Code passes linting (`deno lint`)
- [ ] Tests exist and pass (`deno test`)
- [ ] Documentation exists for public APIs

## Common Anti-Patterns to Flag

### Wrong: deno.land/x imports

```ts
// Flag this
import * as oak from "https://deno.land/x/oak@v17.2.0/mod.ts";
```

Find the dependency on jsr.io, suggest running `deno add jsr:@oak/oak`, then use the bare specifier:

```ts
// Suggest this
import * as oak from "@oak/oak";
```

### Wrong: deno.land/std imports

```typescript
// Flag this
import { join } from "https://deno.land/std/path/mod.ts";
```

Install with:

```sh
deno add jsr:@std/path
```

Then use the bare import:

```ts
// suggest this
import { join } from "@std/path";
```

### Wrong: Inline absolute remote specifiers

```typescript
// Flag this
import chalk from "npm:chalk";
import * as oak from "jsr:@oak/oak";
```

Suggest using the bare specifier and an import with a version requirement.

Run:

```sh
deno install npm:chalk
deno install jsr:@oak/oak
```

```typescript
// Suggest this
import chalk from "chalk";
import * as oak from "@oak/oak";
```

Inline specifiers are fine in single file scripts, but if a deno.json exists then it should go there. It's preferable to place npm dependencies in a package.json if a package.json exists.

### Wrong: Entire page as island
```tsx
// Flag: Too much JavaScript shipped to client
// islands/HomePage.tsx
export default function HomePage() {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

// Suggest: Only interactive parts as islands
// routes/index.tsx
import Counter from "../islands/Counter.tsx";

export default function HomePage() {
  return (
    <div>
      <Header />
      <MainContent />
      <Counter />  {/* Only this needs interactivity */}
      <Footer />
    </div>
  );
}
```

### Wrong: Non-serializable island props
```tsx
// Flag this
<Counter onUpdate={(val) => console.log(val)} />

// Suggest this
<Counter initialValue={5} label="Click count" />
```

## Debugging Guidance

### Permission Errors
Check if permissions are correct (`--allow-net`, `--allow-read`, etc.):
```bash
deno run --allow-net server.ts
```

### TypeScript Errors
Check for TypeScript errors:
```bash
deno check main.ts
```

### Configuration Issues
Review deno.json for correct configuration. Ensure all `jsr:` and `npm:` specifiers have a version requirement:

```json
{
  "imports": {
    "@std/http": "jsr:@std/http@^1"
  }
}
```

## Documentation Resources

When more information is needed, consult:
- https://docs.deno.com - Deno docs
- https://docs.deno.com/runtime/fundamentals/ - Core concepts
- https://fresh.deno.dev/docs - Fresh framework
- https://jsr.io - Package registry
- https://docs.deno.com/deploy/ - Deno Deploy

Use `deno doc <package>` to get API documentation for any package locally.

## Quick Commands Reference

```bash
# Project setup
deno run -Ar jsr:@fresh/init    # New Fresh project

# Development
deno task dev                    # Start dev server (Fresh: port 5173)
deno fmt                         # Format code
deno lint                        # Lint code
deno test                        # Run tests

# Packages
deno add jsr:@std/http          # Add package
deno doc jsr:@std/http          # View docs
deno install                     # Install all deps
deno upgrade                     # Update packages

# Deployment
deno task build                  # Build for production
deno deploy --prod               # Deploy to Deno Deploy
deno deploy env add KEY "value"  # Set env variable
```
