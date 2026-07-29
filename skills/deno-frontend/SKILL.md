---
name: deno-frontend
description: Use when building a web frontend with Deno — running React, Vite, Astro, SvelteKit, Next.js, Nuxt or other npm frameworks under Deno, or working with Fresh, Deno's own island-architecture framework. Covers which path to pick, Fresh 2.x routes, handlers, islands, Preact signals, Tailwind, and Fresh 1.x to 2.x migration.
license: MIT
metadata:
  author: denoland
  version: "3.0"
---

# Frontend development with Deno

Two paths. Pick by what the project already uses.

## Regular npm frameworks — the usual choice

Deno runs the normal frontend ecosystem: React, Vue, Svelte, Solid, Vite, Astro,
Next.js, Nuxt, SvelteKit, Remix, SolidStart. Nothing needs to be ported, and
there is no Deno-specific way to write them.

```bash
deno create vite my-app     # or astro, next, nuxt, svelte…
cd my-app
deno install
deno task dev
```

`deno create` is `npm create`. `deno install` reads `package.json`.
`deno task <script>` runs `package.json` scripts. That is the whole difference.

**Follow the framework's own documentation for everything else** — routing,
components, data loading, and config are the framework's concern, not Deno's.
Don't invent Deno-flavoured variants of their APIs, and don't reach for Fresh
patterns in a React or Svelte project.

The only things worth knowing:

- Some frameworks need `"nodeModulesDir": "auto"` in `deno.json`; Next.js does.
- Permissions apply to the dev server too — framework tasks generally want `-A`.
- Deploying: see the `deno-deploy` skill, which lists per-framework build
  commands and presets.

## Fresh — Deno's own framework

Fresh suits a new Deno-first project that wants server rendering with minimal
client JavaScript. It uses **island architecture**: pages render on the server,
and only components in `islands/` ship JavaScript.

```bash
deno run -Ar jsr:@fresh/init
cd my-project
deno task dev                # http://localhost:5173
```

A Fresh project is Vite-based: `vite.config.ts` for the build, `main.ts` for the
server, file-based routes in `routes/`, islands in `islands/`, server-only
components in `components/`. Preact supplies the component model, with signals
for state.

```tsx
// islands/Counter.tsx — interactive, ships JS
import { useSignal } from "@preact/signals";

export default function Counter() {
  const count = useSignal(0);
  return <button onClick={() => count.value++}>Count: {count.value}</button>;
}
```

Three rules carry most of the weight:

1. Islands ship JavaScript — keep them small, leave everything else in
   `components/`.
2. Island props must be serializable. Functions cannot be passed.
3. Handlers take a single `(ctx)` parameter.

Load `references/FRESH.md` for routes, handlers, `define` helpers, middleware,
islands, signals, and Tailwind.

Use **Fresh 2.x**, imported from `"fresh"`. For an existing 1.x project, or one
pinned to a `2.0.0-alpha.*` release, see `references/FRESH_MIGRATION.md`.

## Further reading

- <https://fresh.deno.dev/docs> — Fresh documentation
- `references/FRESH.md` — Fresh 2.x patterns in depth
- `references/FRESH_MIGRATION.md` — Fresh 1.x and alpha migration
