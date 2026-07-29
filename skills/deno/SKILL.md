---
name: deno
description: Use when writing, running, configuring, reviewing, or debugging code in a Deno project, or when scaffolding a new one. Covers dependency management with deno install and deno add, package.json and node_modules support, npm and JSR packages, permissions, where configuration belongs across package.json, tsconfig.json and deno.json, workspaces, the built-in toolchain (fmt, lint, test, check, bench, compile), and publishing.
license: MIT
metadata:
  author: denoland
  version: "1.0"
---

# Deno

A JavaScript and TypeScript runtime with a package manager, formatter, linter,
test runner, type checker, and bundler in one binary. Runs TypeScript directly.

Needs Deno 2.9+. Check with `deno --version`, update with `deno upgrade`.

## Deno works the way npm and bun do

Deno is not a separate ecosystem to port code into:

- `deno install` reads an existing `package.json` and writes a real
  `node_modules`.
- `deno add express` installs from **npm**. Unprefixed names default to npm.
- `deno task build` runs `scripts.build` from `package.json` or `tasks.build`
  from `deno.json`. If both define it, `deno.json` wins.
- Node built-ins work prefixed or not: `node:fs` and `fs` both resolve.
- `deno main.js` runs a file. `deno run` is optional.
- Deno reads `tsconfig.json`.

Don't tell users to rewrite imports, adopt JSR, or restructure as a
precondition. The two real differences are **permissions** and **npm lifecycle
scripts not running by default**.

Single-file scripts need no build step and no `tsconfig.json`. Applications and
framework projects keep their normal setup.

To convert an existing project, see the `migrate-to-deno` skill.

## Dependency management

```bash
deno install                  # install everything declared
deno add express              # from npm (unprefixed = npm)
deno add jsr:@std/path        # from JSR
deno add -D vitest            # dev dependency (package.json only)
deno remove express
deno outdated                 # list outdated deps
deno update                   # alias for `deno outdated --update`
deno update --latest          # ignore existing semver ranges
deno list                     # declared deps + resolved versions (npm ls)
deno why express              # why a package is in the tree
deno audit                    # vulnerability audit
deno ci                       # clean reproducible install for CI
dx cowsay hello               # run a package binary without installing (npx)
```

`deno ci` is the CI command, not `deno install`: it requires `deno.lock`,
deletes `node_modules`, installs strictly from the lockfile, and fails if the
lockfile is stale. `--prod` skips devDependencies.

`dx` is `npx` / `bunx` / `pnpm dlx`, and an alias for `deno x`. It runs **with
the sandbox disabled**, so treat it with the same care as `npx`.

Deno won't install a version published less than a day ago, limiting the window
for a compromised release. Override with `--min-dep-age`, which takes minutes
(`120`), an ISO-8601 duration (`P7D`), a cutoff date, or `0` to disable:

```bash
deno add --min-dep-age=0 npm:some-package
```

Lifecycle scripts (`postinstall`) don't run by default — a common surprise when
a native addon looks broken after install. Approve once per project:

```bash
deno approve-scripts                              # interactive picker
deno install --allow-scripts=npm:better-sqlite3
```

### Where configuration goes

| File            | Holds                                         |
| --------------- | --------------------------------------------- |
| `package.json`  | dependencies, scripts                         |
| `tsconfig.json` | TypeScript compiler options                   |
| `deno.json`     | Deno config: `fmt`, `lint`, tasks, workspaces |

**Put dependencies in `package.json`** — every other tool reads it, and Deno
resolves it natively. Use `deno.json` for dependencies only when there is no
`package.json`: a standalone script, or a JSR package. Likewise prefer
`tsconfig.json` over `compilerOptions` in `deno.json`, so `tsc` and editors see
the same settings.

Commit `deno.lock`. Deno seeds it from an existing `package-lock.json`,
`yarn.lock`, `bun.lock`, or pnpm lockfile, preserving pins.

### node_modules layout

Deno uses pnpm's isolated layout: real files in `node_modules/.deno/`, exposed
by symlinks, so a package can't import what it never declared. For a tool that
needs npm's flat hoisted tree:

```json
{ "nodeModulesLinker": "hoisted" }
```

`nodeModulesDir` applies only to projects without a `package.json`, so it is
rarely the right knob.

## Permissions

Deno grants no filesystem, network, environment, or subprocess access unless
asked.

```bash
deno run --allow-net=api.example.com --allow-read=./data main.ts
deno run -A main.ts          # allow everything
```

| Flag                     | Short | Grants                      |
| ------------------------ | ----- | --------------------------- |
| `--allow-read[=paths]`   | `-R`  | filesystem read             |
| `--allow-write[=paths]`  | `-W`  | filesystem write            |
| `--allow-net[=hosts]`    | `-N`  | network                     |
| `--allow-env[=names]`    | `-E`  | environment variables       |
| `--allow-sys[=apis]`     | `-S`  | OS information              |
| `--allow-import[=hosts]` | `-I`  | imports from remote hosts   |
| `--allow-run[=bins]`     | —     | subprocesses                |
| `--allow-ffi[=paths]`    | —     | native libraries (unstable) |
| `--allow-all`            | `-A`  | everything                  |

`-S` is `--allow-sys`, not `--allow-run`. Every flag takes an allowlist —
`--allow-net=example.com:443` beats bare `--allow-net`. Matching `--deny-*`
flags always win.

On `Requires net access to "..."`, add that specific permission. `-A` is fine
for trusted first-party code and during migration, but a poor default to commit
in a task.

## Configuration

`deno.json` (or `.jsonc`) is auto-discovered from the current directory upward.

```json
{
  "tasks": {
    "dev": "deno watch -A main.ts",
    "start": "deno run -A main.ts"
  },
  "fmt": { "exclude": ["build/"] },
  "lint": { "rules": { "exclude": ["no-explicit-any"] } },
  "exclude": ["build/", "dist/"]
}
```

Top-level `exclude` applies to every subcommand; per-tool `exclude` narrows it.

`deno.json` also accepts `imports`, an import map pointing bare specifiers at
real ones. That is how a project without `package.json` declares dependencies,
and how a JSR package declares its own alongside `name`, `version`, `exports`.

### Workspaces

npm, Yarn, and Bun workspaces work out of the box — Deno reads `package.json`
`"workspaces"` directly. pnpm is the exception: `pnpm-workspace.yaml` is
migrated into `deno.json` on first run, which must then be re-run.

```json
{ "workspace": ["./packages/core", "./packages/cli"] }
```

Members are explicit or single-level globs (`"packages/*"`); `**` and negation
are unsupported. Run a task across members with `deno task --filter '*' build`.

## Packages: npm and JSR

**Prefer npm** — it is where the ecosystem is, and `deno add express` is the
normal case. Reach for JSR for the standard library (`@std/*`), or to publish
TypeScript that consumers get types for without a build step. Mixing is fine.

```bash
deno add jsr:@std/path npm:express
deno doc jsr:@std/path        # read a package's API from the terminal
```

Deno once used full URL imports (`https://deno.land/x/...`). They still run but
aren't recommended; to modernize, `deno add` the package and import the bare
specifier.

## Built-in tooling

```bash
deno fmt              # format (--check for CI)
deno lint             # lint (--fix, --rules)
deno test             # tests (--watch, --parallel, --coverage=dir)
deno check main.ts    # type-check without running
deno bench            # benchmarks
deno coverage         # coverage report from --coverage output
deno compile main.ts  # single-file executable (--target cross-compiles)
deno doc mod.ts       # docs (--html for a site)
deno info main.ts     # module graph and cache info
```

These cover prettier, eslint, jest/vitest, tsc, and pkg/nexe with no config or
dependencies — but they are **not** drop-in replacements. Parity is incomplete,
so moving an established project is real work. **There is no need to migrate:**
keep prettier, eslint, and vitest, and use Deno as runtime and package manager.
Prefer the built-in tools for new projects.

Suppress with `// deno-lint-ignore <rule>`, `// deno-lint-ignore-file`,
`// deno-fmt-ignore`, `// deno-fmt-ignore-file`. In Markdown,
`<!-- deno-fmt-ignore -->` before a code block protects illustrative snippets
that aren't valid standalone code.

## Running code

```bash
deno main.ts                 # deno run is optional
deno watch main.ts           # reload on change (replaces nodemon)
deno task dev                # task from package.json or deno.json
deno repl
deno eval "console.log(1)"
```

`deno watch` hot-replaces modules, restarting if that fails; it aliases
`deno run --watch-hmr`.

An HTTP server needs no dependencies:

```ts
Deno.serve((_req) => new Response("Hello"));
```

## Starting a new project

Scaffold rather than hand-writing the files:

```bash
deno init my-project          # script + test + deno.json
deno init --empty my-project  # just main.ts and deno.json
deno init --lib my-lib        # library laid out for JSR
deno create vite my-app       # scaffold from a package initializer
```

`deno create` is `npm create` / `yarn create` and covers that ecosystem
(`deno create astro`, etc). Unprefixed names are npm; `--jsr` selects JSR.

## Publishing

**To npm the regular flow still works** — `npm publish`, or `deno pack` to build
the tarball first. `deno publish` targets JSR only, from a `deno.json` with
`name`, `version`, and `exports`:

```bash
deno publish --dry-run
deno publish
```

Provenance attestation is automatic on GitHub Actions. `deno bump-version patch`
bumps the version, across every member at a workspace root.

Guide: <https://docs.deno.com/runtime/reference/cli/publish/>

## Reviewing Deno code

- `-A` committed in a task where a scoped grant would work.
- `deno.lock` uncommitted, or CI running `deno install` instead of `deno ci`.
- Inline `jsr:`/`npm:` specifiers in a project with a `package.json` — use
  `deno add` so the version lives in one place. Fine in standalone scripts.
- A specifier with no version constraint.
- Dependencies or compiler options in `deno.json` when `package.json` or
  `tsconfig.json` exists.
- Missing `deno fmt --check`, `deno lint`, `deno check` in CI.

## Further reading

- <https://docs.deno.com> — runtime documentation
- <https://docs.deno.com/api/> — `Deno.*` API reference
- `references/CLI.md` — fuller subcommand and flag reference
- `deno <subcommand> --help` — authoritative and version-accurate; check it
  before guessing at a flag.
