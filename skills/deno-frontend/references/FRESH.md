# Fresh 2.x

Docs: <https://fresh.deno.dev/docs>. All imports come from `"fresh"` or
`"fresh/runtime"`.

## Project layout

```
my-project/
├── deno.json           # config, dependencies, tasks
├── main.ts             # server entry point
├── client.ts           # client entry point (CSS imports)
├── vite.config.ts      # Vite configuration
├── routes/             # pages and API routes
│   ├── _app.tsx        # outer HTML wrapper
│   ├── _layout.tsx     # optional nested layout
│   ├── _error.tsx      # unified error page (404 and 500)
│   ├── _middleware.ts
│   └── index.tsx       # /
├── islands/            # interactive, hydrated on the client
├── components/         # server-only, ships no JS
├── static/
└── utils/state.ts      # define helpers
```

There is no manifest file, no separate dev entry point, and no separate config
file.

### main.ts

```tsx
import { App, fsRoutes, staticFiles, trailingSlashes } from "fresh";

const app = new App()
  .use(staticFiles())
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  dir: "./",
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
```

### vite.config.ts

```tsx
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
});
```

### deno.json

```json
{
  "tasks": {
    "dev": "vite",
    "build": "vite build",
    "preview": "deno serve -A _fresh/server.js"
  },
  "imports": {
    "fresh": "jsr:@fresh/core@^2",
    "fresh/runtime": "jsr:@fresh/core@^2/runtime",
    "@fresh/plugin-vite": "jsr:@fresh/plugin-vite@^1",
    "@preact/signals": "npm:@preact/signals@^2",
    "preact": "npm:preact@^10",
    "preact/hooks": "npm:preact@^10/hooks",
    "@/": "./"
  }
}
```

### Imports

```tsx
import { App, fsRoutes, staticFiles } from "fresh";
import { cors, csp, trailingSlashes } from "fresh";
import { createDefine, HttpError } from "fresh";
import type { Middleware, PageProps, RouteConfig } from "fresh";
import { IS_BROWSER } from "fresh/runtime";
import { computed, signal, useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
```

## Routing

File-based, from `routes/`:

| File                   | Matches                       |
| ---------------------- | ----------------------------- |
| `about.tsx`            | `/about`                      |
| `blog/[slug].tsx`      | `/blog/my-post`               |
| `docs/[[version]].tsx` | `/docs` and `/docs/v2`        |
| `old/[...path].tsx`    | `/old/foo/bar`                |
| `(marketing)/`         | shared layout, no URL segment |

`_app.tsx` wraps every page:

```tsx
import type { PageProps } from "fresh";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My App</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
```

## Define helpers

One-time setup giving handlers and pages a shared typed state:

```tsx
// utils/state.ts
import { createDefine } from "fresh";

export interface State {
  user?: { id: string; name: string };
}

export const define = createDefine<State>();
```

Bare handler exports work but lose type safety — prefer `define.handlers()`.

## Data fetching

**Handler returning `{ data }`** — the default. Supports auth checks and
redirects before render:

```tsx
// routes/posts.tsx
import { define } from "@/utils/state.ts";

export const handler = define.handlers(async (ctx) => {
  const res = await fetch("https://example.com/posts");
  return { data: { posts: await res.json() } };
});

export default define.page<typeof handler>(({ data }) => (
  <ul>{data.posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
));
```

**Async page component** — fine when there is no auth or redirect logic:

```tsx
export default async function ServersPage() {
  const servers = await db.query("SELECT * FROM servers");
  return <ul>{servers.map((s) => <li key={s.id}>{s.name}</li>)}</ul>;
}
```

## Handlers

Single `(ctx)` parameter, one function or per-method:

```tsx
export const handler = define.handlers({
  GET(ctx) {
    return Response.json({ users: [] });
  },
  async POST(ctx) {
    const body = await ctx.req.json();
    return Response.json({ created: true }, { status: 201 });
  },
});
```

The context object:

| Property     | Is                                         |
| ------------ | ------------------------------------------ |
| `ctx.req`    | the `Request`                              |
| `ctx.url`    | `URL` with `pathname`, `searchParams`      |
| `ctx.params` | route parameters                           |
| `ctx.state`  | request-scoped data shared with middleware |
| `ctx.config` | Fresh configuration                        |
| `ctx.route`  | matched route pattern                      |
| `ctx.error`  | caught error, on error pages               |

Methods: `ctx.render(<JSX />, { status, headers })` (JSX only, not data
objects), `ctx.redirect("/other", 301)`, `ctx.next()`.

Throw `HttpError` to reach `_error.tsx`:

```tsx
import { HttpError } from "fresh";

if (!post) throw new HttpError(404);
if (!ctx.state.user) throw new HttpError(401);
```

## Middleware

```tsx
// routes/_middleware.ts
import { define } from "@/utils/state.ts";

export const handler = define.middleware(async (ctx) => {
  console.log(`${ctx.req.method} ${ctx.url.pathname}`);
  const response = await ctx.next();
  return response;
});
```

## Islands

Components in `islands/` (or `(_islands)/` inside routes) hydrate on the client.
Use them for interactions, client state, and browser APIs — nothing else.

Props must be serializable: primitives, `Infinity`/`NaN`/`-0`, Array, Map, Set,
plain objects, URL, Date, RegExp, Uint8Array, JSX elements, signals, and
circular references. **Functions cannot be passed.**

For code that must not run during SSR:

```tsx
import { IS_BROWSER } from "fresh/runtime";

export default function LocalStorageCounter() {
  if (!IS_BROWSER) return <div>Loading...</div>;
  const count = useSignal(Number(localStorage.getItem("count") ?? 0));
  return <button onClick={() => count.value++}>Count: {count.value}</button>;
}
```

## Preact

Preact is a 3KB React alternative. Hooks behave as in React; `class` and
`className` both work, `class` is the convention.

Signals are the preferred state primitive — granular updates, definable outside
a component:

```tsx
import { computed, signal } from "@preact/signals";

const count = signal(0);
const doubled = computed(() => count.value * 2);
```

Inside a component use `useSignal(0)`.

## Tailwind

Optional. Fresh builds with Vite, so Tailwind attaches as a Vite plugin. Install
**both** packages — the plugin and the core library:

```sh
deno add npm:@tailwindcss/vite npm:tailwindcss
```

Add `tailwindcss()` to `vite.config.ts` plugins, put `@import "tailwindcss";` in
a CSS file (`assets/styles.css` by convention), and import that file from
`client.ts`. Prefer utility classes over `@apply`; use the `class` strategy for
dark mode.

## Build and deploy

```bash
deno task dev        # dev server, port 5173
deno task build      # production build — required before deploying
deno task preview    # preview the build locally
deno deploy --prod
```

The build step is not optional; deploying without it ships no compiled output.
