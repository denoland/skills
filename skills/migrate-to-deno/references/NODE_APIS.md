# Node APIs, CommonJS, and compatibility mode

## node: built-ins

Deno implements the Node standard library under the `node:` prefix:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
```

Bare specifiers work too — `import fs from "fs"` resolves the same built-in, so
existing Node imports do not need rewriting. The `node:` prefix is clearer about
intent and is worth preferring in new code, but it is not required.

Coverage is broad but not total, and some modules are partial. Check the
per-module status table before assuming an API is present:
<https://docs.deno.com/runtime/reference/node_apis/>

`node:sqlite` is worth singling out: it removes a native addon dependency, often
the hardest thing to migrate.

## CommonJS vs ESM

Which parser applies is decided per file:

| File         | Treated as                                     |
| ------------ | ---------------------------------------------- |
| `.cjs`       | Always CommonJS                                |
| `.mjs`       | Always ESM                                     |
| `.js`, `.ts` | Follows `"type"` in the nearest `package.json` |

With no `package.json`, `.js` and `.ts` are ESM.

`ReferenceError: require is not defined` means CommonJS is being parsed as ESM.
Set `"type": "commonjs"` in `package.json`, or rename the file to `.cjs`.

To use `require` from within an ES module:

```ts
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
```

## DENO_COMPAT

Setting `DENO_COMPAT=1` turns on Node compatibility mode: extensionless imports,
CommonJS detection, and related loosening of Deno's stricter defaults. Bare Node
built-in specifiers do not need it — those resolve either way.

```bash
DENO_COMPAT=1 deno run -A main.js
```

A migration aid for getting a large legacy codebase running before cleaning it
up, not a recommended end state — extensioned imports work without the env var.

If extensionless imports are the only blocker, `--sloppy-imports` is the
narrower fix and leaves the rest of Deno's defaults intact:

```bash
deno run --sloppy-imports -A main.js
```

## Globals

Node globals available in Deno: `process`, `Buffer`, `global`, `__dirname` and
`__filename` (in CommonJS context), `setImmediate`, `clearImmediate`.

Web platform globals — `fetch`, `Request`, `Response`, `URL`, `crypto`,
`structuredClone`, `WebSocket`, `EventTarget` — are present too, and modern Node
has them, so Web-API code is the most portable.

`process.env` works and needs `--allow-env`, same as `Deno.env.get()`.

## Native addons

Native addons need their lifecycle scripts approved before they build:

```bash
deno approve-scripts
deno install --allow-scripts=npm:better-sqlite3
```

Node-API (N-API) addons are supported. Older `nan`-based addons and anything
compiling against V8 internals may not work; look for a prebuilt or WASM
alternative, or check whether a built-in like `node:sqlite` removes the need.

## tsconfig.json

Deno reads `tsconfig.json`, so an existing one keeps working and is the right
place for compiler options — `tsc` and editors then see what Deno sees.

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

`deno.json` also accepts `compilerOptions`, but prefer `tsconfig.json` when the
project has one. Either way, emit and module-resolution options are fixed by the
runtime.

Reference: <https://docs.deno.com/runtime/fundamentals/configuration/>
