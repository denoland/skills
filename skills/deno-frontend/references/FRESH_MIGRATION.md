# Fresh 1.x and alpha migration

## Check the version first

Read `deno.json` imports before changing anything. Three situations look similar
and need different handling:

| `deno.json` says                | Situation                          |
| ------------------------------- | ---------------------------------- |
| `jsr:@fresh/core@^2`            | Stable 2.x — see `FRESH.md`        |
| `jsr:@fresh/core@2.0.0-alpha.*` | Alpha 2.x — **not** 1.x, see below |
| `$fresh/` import paths          | Fresh 1.x — migrate                |

Grep for `$fresh/` to find 1.x imports; every one of them becomes `fresh` or
`fresh/runtime`.

## Migrating 1.x to 2.x

Run the migration tool:

```bash
deno run -Ar jsr:@fresh/update
```

It converts import paths to the `fresh` package, updates handler signatures to
the single `(ctx)` parameter, removes the generated manifest and legacy config
and dev entry points, creates `vite.config.ts` and `client.ts`, switches
`deno.json` tasks to Vite, merges the separate error pages into a unified
`_error.tsx`, and updates deprecated context methods.

If it misses anything, check by hand:

1. **Imports** — everything from `fresh` or `fresh/runtime`.
2. **Handlers** — single `(ctx)` parameter, request via `ctx.req`.
3. **Files** — no generated manifest, dev entry point, or old config file.
4. **Tasks** — `vite`, `vite build`, `deno serve -A _fresh/server.js`.
5. **Error pages** — one `_error.tsx` replaces the separate `_404.tsx` and
   `_500.tsx`.
6. **Tailwind** — `@tailwindcss/vite`, not the old Fresh Tailwind plugin.

### Deprecated context APIs

| 1.x                                | 2.x                               |
| ---------------------------------- | --------------------------------- |
| `renderNotFound()`                 | `throw new HttpError(404)`        |
| bare `render()` with no JSX        | `ctx.render(<MyComponent />)`     |
| `basePath`                         | `ctx.config.basePath`             |
| data passed through `ctx.render()` | handler returns `{ data: {...} }` |

The last one is the most common error. `ctx.render()` takes JSX, never a data
object — a handler passes data by returning `{ data: {...} }`, and the page
picks it up with `define.page<typeof handler>`. See `FRESH.md`.

## Alpha releases (2.0.0-alpha.\*)

Alpha projects are 2.x, but predate the Vite setup. A `dev.ts` in an alpha
project is **correct**, not a 1.x leftover — do not "fix" it.

| Alpha                        | Stable 2.x           |
| ---------------------------- | -------------------- |
| `dev.ts` entry point         | `vite.config.ts`     |
| `deno run -A --watch dev.ts` | `vite`               |
| `deno run -A dev.ts build`   | `vite build`         |
| `@fresh/plugin-tailwind`     | `@tailwindcss/vite`  |
| dev server on port 8000      | port 5173            |
| no `client.ts`               | `client.ts` required |

The handler pattern is already the same as stable:
`define.handlers({ GET(ctx)
{ ... } })` returning `{ data: {...} }`.
