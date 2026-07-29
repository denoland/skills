# Node APIs, CommonJS, and compatibility mode

## node: built-ins

Deno implements the Node standard library under the `node:` prefix. Import with
the prefix explicitly:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
```

Bare specifiers work too — `import fs from "fs"` resolves the same built-in, so
existing Node imports do not need rewriting. The `node:` prefix is clearer about
intent and is worth preferring in new code, but it is not required.

Coverage is broad but not total, and a few modules are partial. Check the
per-module status table before assuming a specific API is present:
<https://docs.deno.com/runtime/reference/node_apis/>

`node:sqlite` deserves a mention on its own — it removes the need for a native
addon dependency, which is often the single hardest thing to migrate.

## CommonJS vs ESM

Which parser applies is decided per file:

| File         | Treated as                                     |
| ------------ | ---------------------------------------------- |
| `.cjs`       | Always CommonJS                                |
| `.mjs`       | Always ESM                                     |
| `.js`, `.ts` | Follows `"type"` in the nearest `package.json` |

With no `package.json`, `.js` and `.ts` are ESM.

`ReferenceError: require is not defined` means a file containing CommonJS is
being parsed as ESM. Fix by setting `"type": "commonjs"` in `package.json`, or
by renaming the file to `.cjs`.

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

This is a migration aid, useful for getting a large legacy codebase running
before cleaning it up. It is not the recommended end state — extensioned imports
are clearer and work without the env var.

If extensionless imports are the only thing standing in the way,
`--sloppy-imports` is the narrower fix and leaves the rest of Deno's defaults
intact:

```bash
deno run --sloppy-imports -A main.js
```

## Globals

Node globals available in Deno: `process`, `Buffer`, `global`, `__dirname` and
`__filename` (in CommonJS context), `setImmediate`, `clearImmediate`.

Deno also provides the Web platform globals — `fetch`, `Request`, `Response`,
`URL`, `crypto`, `structuredClone`, `WebSocket`, `EventTarget` — which modern
Node also has, so code written against Web APIs is the most portable.

`process.env` works and requires `--allow-env`, the same as `Deno.env.get()`.

## Native addons

Packages with native addons need their lifecycle scripts approved before they
build:

```bash
deno approve-scripts
deno install --allow-scripts=npm:better-sqlite3
```

Node-API (N-API) addons are supported. Older `nan`-based addons and packages
compiling against V8 internals may not work; check whether the package offers a
prebuilt or WASM alternative, or whether `node:sqlite` and other built-ins
remove the need for it entirely.

## tsconfig.json

Deno reads `tsconfig.json`, so an existing one keeps working and is the right
place to leave compiler options — `tsc` and editors then see the same settings
Deno does.

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

`deno.json` also accepts a `compilerOptions` field, but prefer `tsconfig.json`
when the project has one. Either way, options controlling emit and module
resolution are fixed by the runtime and are not configurable.

Reference: <https://docs.deno.com/runtime/fundamentals/configuration/>
