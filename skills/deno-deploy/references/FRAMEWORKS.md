# Framework-Specific Deployment

Deno Deploy supports multiple frameworks. The CLI auto-detects your framework and configures the build appropriately.

## Framework Detection

| Framework | Detection Files | Build Command | Notes |
|-----------|-----------------|---------------|-------|
| **Fresh** | `islands/`, `fresh.config.ts` | `deno task build` | Deno-native, island architecture |
| **Astro** | `astro.config.mjs`, `astro.config.ts` | `npm run build` or `deno task build` | Static or SSR |
| **Next.js** | `next.config.js`, `next.config.mjs` | `npm run build` | Requires `nodeModulesDir: "auto"` |
| **Nuxt** | `nuxt.config.ts` | `npm run build` | Vue SSR framework |
| **Remix** | `remix.config.js` | `npm run build` | React SSR framework |
| **SolidStart** | `app.config.ts` with solid | `npm run build` | SolidJS SSR |
| **SvelteKit** | `svelte.config.js` | `npm run build` | Svelte SSR framework |
| **Lume** | `_config.ts` with lume import | `deno task build` | Deno-native static site |

## Framework Presets for `deno deploy create`

When creating an app with `deno deploy create` in non-interactive mode, you can specify `--framework-preset` to auto-configure build commands and runtime settings. The available presets are: `Fresh`, `Next`, `Remix`, `Astro`, `SvelteKit`, `Nuxt`, `Lume`, `SolidStart`.

When a preset is specified, you can omit `--install-command`, `--build-command`, `--pre-deploy-command`, and `--runtime-mode` — they are inferred from the preset.

If you don't specify a preset, the CLI still auto-detects your framework from the project files. Use `--do-not-use-detected-build-config` to skip auto-detection and specify everything manually.

## Detect Framework Script

```bash
if [ -d "islands" ] || [ -f "fresh.config.ts" ]; then echo "Framework: Fresh"; \
elif [ -f "astro.config.mjs" ] || [ -f "astro.config.ts" ]; then echo "Framework: Astro"; \
elif [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then echo "Framework: Next.js"; \
elif [ -f "nuxt.config.ts" ]; then echo "Framework: Nuxt"; \
elif [ -f "remix.config.js" ]; then echo "Framework: Remix"; \
elif [ -f "svelte.config.js" ]; then echo "Framework: SvelteKit"; \
elif [ -f "_config.ts" ]; then echo "Framework: Lume (check imports)"; \
else echo "Framework: Custom/Unknown"; fi
```

## Fresh (Deno-Native)

```bash
deno task build
deno deploy --prod
```

## Astro

```bash
# If using npm
npm run build
deno deploy --prod

# If using Deno tasks
deno task build
deno deploy --prod
```

## Next.js

Next.js requires Node.js compatibility mode:

1. Ensure `deno.json` has:
   ```json
   {
     "nodeModulesDir": "auto"
   }
   ```

2. Build and deploy:
   ```bash
   npm install
   npm run build
   deno deploy --prod --allow-node-modules
   ```

## Nuxt / Remix / SvelteKit / SolidStart

These npm-based frameworks follow a similar pattern:

```bash
npm install
npm run build
deno deploy --prod
```

If you encounter issues with node_modules:
```bash
deno deploy --prod --allow-node-modules
```

## Lume (Static Sites)

```bash
deno task build
deno deploy --prod
```

## Custom / No Framework

For custom servers or apps without a recognized framework:

1. Ensure you have an entrypoint (e.g., `main.ts`, `server.ts`)
2. Deploy directly:
   ```bash
   deno deploy --entrypoint main.ts --prod
   ```

## Static Site Deployment

For static sites (Lume, Vite builds, etc.), you have two options:

### Option 1: Direct Directory Deployment

Point Deno Deploy at your built directory. Configure in `deno.json`:

```json
{
  "deploy": {
    "entrypoint": "main.ts",
    "include": ["_site"]
  }
}
```

### Option 2: Custom Server Wrapper

Only needed if you want custom routing, headers, or logic:

```typescript
// serve.ts
import { serveDir } from "jsr:@std/http/file-server";

Deno.serve((req) =>
  serveDir(req, {
    fsRoot: "_site",
    quiet: true,
  })
);
```

Then deploy with:

```bash
deno deploy --entrypoint serve.ts --prod
```

## Cloud Integrations

### AWS Integration

```bash
deno deploy setup-aws --org my-org --app my-app
```

### GCP Integration

```bash
deno deploy setup-gcp --org my-org --app my-app
```
