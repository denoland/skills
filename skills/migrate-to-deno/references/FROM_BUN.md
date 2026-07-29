# Migrating from Bun

Most Bun projects are ordinary `package.json` + TypeScript projects, which Deno
runs directly: same npm dependencies, TypeScript with no build step, comparable
built-in toolchain.

Bun is the one migration here involving real **code** changes, because `Bun.*`
API calls have to be translated. Anything on Web and Node APIs moves unchanged.

## Commands

| Bun                   | Deno                 |
| --------------------- | -------------------- |
| `bun install`         | `deno install`       |
| `bun add <pkg>`       | `deno add <pkg>`     |
| `bun add -d <pkg>`    | `deno add -D <pkg>`  |
| `bun remove <pkg>`    | `deno remove <pkg>`  |
| `bun run <script>`    | `deno task <script>` |
| `bun <file>`          | `deno <file>`        |
| `bunx <pkg>`          | `dx <pkg>`           |
| `bun test`            | `deno test`          |
| `bun build --compile` | `deno compile`       |
| `bun outdated`        | `deno outdated`      |
| `bun audit`           | `deno audit`         |
| `bun why <pkg>`       | `deno why <pkg>`     |
| `bun ci`              | `deno ci`            |
| `bun --watch <file>`  | `deno watch <file>`  |

## API translation

### Bun.serve → Deno.serve

Both take a fetch-style handler receiving a `Request` and returning a
`Response`, but the shapes differ: `Bun.serve` takes one options object with a
`fetch` property; `Deno.serve` takes the handler as a separate argument. Passing
`fetch` in the options object to `Deno.serve` throws.

```ts no-check
// Bun
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("hi");
  },
});

// Deno
Deno.serve({ port: 3000 }, (req) => new Response("hi"));
```

`Deno.serve(handler)` with no options is also valid and defaults to port 8000.

### bun:sqlite → node:sqlite

Deno ships the synchronous `node:sqlite` built-in — same prepare/run/get/all
workflow, different class names.

```ts
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE t (a TEXT)");
const stmt = db.prepare("INSERT INTO t VALUES (?)");
stmt.run("x");
```

### Bun.file → Deno file APIs

`Bun.file()` returns a lazy reference; Deno reads eagerly or opens a handle:

```ts
const text = await Deno.readTextFile("./data.json"); // whole file
const bytes = await Deno.readFile("./image.png");
using file = await Deno.open("./big.log"); // streaming
```

`Deno.open` returns a handle with a `.readable` stream, the closest analogue to
`Bun.file().stream()`.

### bun:test → deno test or node:test

`deno test` uses `Deno.test()` but also understands `node:test`. For a suite
already using `describe`/`it`, `node:test` plus `node:assert` is the smaller
diff:

```ts
import { describe, it } from "node:test";
import assert from "node:assert";

describe("math", () => {
  it("adds", () => assert.equal(1 + 1, 2));
});
```

For new tests, `Deno.test()` with `jsr:@std/assert` is the idiomatic form.

### Bun.$ → dax or Deno.Command

For template-literal shell syntax add `jsr:@david/dax`; for subprocess control
without a dependency use `Deno.Command`:

```ts
const { stdout } = await new Deno.Command("git", {
  args: ["rev-parse", "HEAD"],
}).output();
```

Note that subprocesses need `--allow-run`.

### Other

| Bun            | Deno                                        |
| -------------- | ------------------------------------------- |
| `Bun.env`      | `Deno.env.get()` (needs `--allow-env`)      |
| `Bun.password` | `node:crypto`, or a JSR/npm hashing package |
| `Bun.hash`     | `node:crypto`                               |
| `Bun.write`    | `Deno.writeTextFile` / `Deno.writeFile`     |
| `Bun.spawn`    | `Deno.Command`                              |

## Configuration

`bunfig.toml` has no counterpart; its contents move into `deno.json` (tasks,
formatter and linter settings) or `tsconfig.json` (compiler options). See the
`deno` skill.

## No equivalent

- **Macros** (`with { type: "macro" }`) — no counterpart.
- **HTMLRewriter** — use a JSR or npm HTML parser.
- **HTML entrypoints and bundler-specific features** — use Vite, or
  `deno compile` for a standalone binary.

## Permissions

The difference that surfaces first: Bun grants unrestricted access, Deno
nothing. Use `-A` while confirming the program works, then narrow.
