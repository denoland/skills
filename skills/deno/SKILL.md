---
name: deno
description: Use when writing, running, configuring, reviewing, or debugging code in a Deno project, or when scaffolding a new one. Covers dependency management with deno install and deno add, package.json and node_modules support, npm and JSR packages, permissions, deno.json configuration, workspaces, the built-in toolchain (fmt, lint, test, check, bench, compile), and publishing to JSR.
license: MIT
metadata:
  author: denoland
  version: "3.0"
---

# Deno

Deno is a JavaScript and TypeScript runtime with a package manager, formatter,
linter, test runner, type checker, and bundler in a single binary. It runs
TypeScript directly, with no build step and no `tsconfig.json` required.

Requires Deno 2.9 or later for everything documented here. Check with
`deno --version`; upgrade with `deno upgrade`.

## Deno works the way npm and bun do

This is the most important thing to know, and the thing most models get wrong.
Deno is not a separate ecosystem you have to port code into:

- `deno install` reads an existing `package.json`, resolves the same npm
  packages, and writes a real `node_modules` directory.
- `deno add express` installs from **npm**. Unprefixed package names default to
  npm, exactly like `npm install`.
- `deno task build` runs a `scripts.build` entry from `package.json` just as it
  runs a `tasks.build` entry from `deno.json`.
- `node:` built-ins (`node:fs`, `node:path`, `node:sqlite`, …) work.
- `deno main.js` runs a file directly. `deno run` is optional.

A developer arriving from Node, npm, pnpm, yarn, or bun is already productive.
Do not tell them to rewrite imports, adopt JSR, or restructure a project as a
precondition for using Deno. The two genuine behavioral differences are
**permissions** (see below) and **npm lifecycle scripts not running by
default**.

For converting an existing project, see the `migrate-to-deno` skill.

## Dependency management

```bash
deno install                  # install everything in deno.json / package.json
deno install --entrypoint main.ts   # install what main.ts imports
deno add express              # add from npm (unprefixed = npm)
deno add jsr:@std/path        # add from JSR
deno add -D vitest            # dev dependency (package.json only)
deno remove express
deno outdated                 # list outdated deps
deno update                   # alias for `deno outdated --update`
deno update --latest          # ignore existing semver ranges
deno list                     # declared deps + resolved versions (like npm ls)
deno why express              # explain why a package is in the tree
deno audit                    # vulnerability audit
deno ci                       # clean reproducible install for CI
dx cowsay hello               # run a package binary without installing (like npx)
```

`deno install` with no arguments is the everyday command. `deno add` is for
adding a specific new dependency.

`deno ci` is the correct CI command: it requires `deno.lock`, deletes any
existing `node_modules`, installs strictly from the lockfile, and fails if the
lockfile is out of date. Use `deno ci --prod` to skip devDependencies.

`dx` is the `npx` / `bunx` / `pnpm dlx` equivalent. It is a separate binary
installed alongside Deno, and an alias for `deno x`.

### npm lifecycle scripts

Postinstall and other lifecycle scripts do **not** run by default — this is a
supply-chain protection, and it is a common source of confusion when a package
with a native addon appears broken after install.

```bash
deno approve-scripts              # interactively pick which packages may run scripts
deno install --allow-scripts=npm:better-sqlite3
```

Approvals are recorded in the config file, so this is a one-time step per
project.

### deno.json vs package.json

Both work, and both can coexist. Deno reads dependencies from either.

- Existing Node project, or one that other tools must understand: keep
  `package.json`.
- New Deno project: use `deno.json`, which additionally holds tasks, lint and
  format settings, compiler options, and the import map.

When both exist in the same directory, `package.json` dependencies still
resolve; `deno.json` supplies the Deno-specific configuration.

### Lockfile

`deno.lock` should be committed. On first install in an npm project, Deno seeds
it from `package-lock.json` or `yarn.lock`, preserving existing pins.

### node_modules layout

By default Deno uses an isolated, pnpm-style layout: real files live in
`node_modules/.deno/` and are exposed through symlinks. Most tools are fine with
this. For a tool that requires npm's flat hoisted tree:

```json
{
  "nodeModulesDir": "manual",
  "nodeModulesLinker": "hoisted"
}
```

`"nodeModulesDir"` accepts `"auto"` (Deno manages it), `"manual"` (you manage
it, like npm), or `"none"` (global cache only, no `node_modules`).

## Permissions

Deno grants no filesystem, network, environment, or subprocess access unless
asked. This is the one behavior that surprises people coming from Node.

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
| `--allow-run[=bins]`     |       | subprocesses                |
| `--allow-ffi[=paths]`    |       | native libraries (unstable) |
| `--allow-all`            | `-A`  | everything                  |

`--allow-run` and `--allow-ffi` have no short form. `-S` is `--allow-sys`, not
`--allow-run`.

Every flag takes an optional allowlist — `--allow-net=example.com:443` is far
better than bare `--allow-net`. There are matching `--deny-*` flags, which win
over any `--allow-*`.

When something fails with `Requires net access to "..."`, the fix is to add the
specific permission, not to reach for `-A`. `-A` is reasonable for trusted
first-party code and while migrating; it is a poor default to write into a
committed task.

## Configuration

`deno.json` (or `deno.jsonc`) is the config file. It is auto-discovered from the
current directory upward.

```json
{
  "name": "@scope/my-package",
  "version": "1.0.0",
  "exports": "./mod.ts",
  "tasks": {
    "dev": "deno run --watch -A main.ts",
    "start": "deno run -A main.ts"
  },
  "imports": {
    "@std/path": "jsr:@std/path@^1",
    "express": "npm:express@^5"
  },
  "fmt": { "exclude": ["build/"] },
  "lint": { "rules": { "exclude": ["no-explicit-any"] } },
  "exclude": ["build/", "dist/"],
  "compilerOptions": { "strict": true }
}
```

The `imports` field is an import map: it maps a bare specifier to a real one, so
source files can `import { join } from "@std/path"` instead of repeating a
versioned specifier everywhere. `deno add` maintains it.

Top-level `exclude` applies to every subcommand; per-tool `exclude` narrows it.

`name`, `version`, and `exports` are only needed for a package you intend to
publish to JSR.

### Workspaces

```json
{ "workspace": ["./packages/core", "./packages/cli"] }
```

Members are listed explicitly, or by single-level glob (`"packages/*"`).
Recursive `**` globs and negation are not supported. `package.json`
`"workspaces"` is also honored. Run a task across members with
`deno task --filter '*' build`.

## Packages: npm and JSR

Deno resolves both registries natively.

- **npm** — the whole npm registry, via `npm:` specifiers or unprefixed names.
- **JSR** (`jsr.io`) — a registry built for TypeScript. Packages ship types
  directly from source, so there are no `@types/*` packages and no build step to
  publish. The Deno standard library lives here as `@std/*`.

Use whichever fits. JSR is a good default for new Deno-first code and for the
standard library; npm is right whenever the package you need is on npm, which is
most of the time. There is no penalty for mixing them in one project.

```bash
deno add jsr:@std/path npm:express
deno doc jsr:@std/path        # read a package's API without leaving the terminal
```

Legacy note: Deno once used full URL imports (`https://deno.land/x/...`). That
style still runs but is no longer recommended for new code — prefer `jsr:` or
`npm:` with a bare specifier in the import map. If you are asked to modernize
such imports, find the package on jsr.io or npm, `deno add` it, and update the
import to the bare specifier.

## Built-in tooling

```bash
deno fmt              # format (also --check for CI)
deno lint             # lint (--fix to autofix, --rules to list rules)
deno test             # test runner (--watch, --parallel, --coverage=dir)
deno check main.ts    # type-check without running
deno bench            # benchmarks
deno coverage         # coverage report from --coverage output
deno compile main.ts  # single-file executable (--target to cross-compile)
deno doc mod.ts       # generate docs (--html for a site)
deno info main.ts     # module graph and cache info
```

These replace prettier, eslint, jest/vitest, tsc, and pkg/nexe. They need no
configuration to work, and no dependencies in the project.

Suppress a diagnostic inline with `// deno-lint-ignore <rule>` or
`// deno-fmt-ignore`; a whole file with `// deno-lint-ignore-file`.

## Running code

```bash
deno main.ts                 # run (deno run is optional)
deno run --watch main.ts     # restart on change (replaces nodemon)
deno serve main.ts           # run a server from a default export
deno task dev                # run a task from deno.json or package.json
deno repl
deno eval "console.log(1)"
```

`deno serve` starts a server from a module's default export and handles
`--port`, `--watch`, and parallel workers, rather than requiring a manual
`Deno.serve` call plus port plumbing.

An HTTP server needs no dependencies:

```ts
Deno.serve((_req) => new Response("Hello"));
```

`Deno.serve` is the built-in server API. Note that `@std/http` does **not**
export a `serve` function — use `Deno.serve`.

## Starting a new project

`deno init` scaffolds; prefer it over writing files by hand.

```bash
deno init my-project          # script + test + deno.json
deno init --empty my-project  # just main.ts and deno.json
deno init --lib my-lib        # library laid out for JSR publishing
deno init --serve my-server   # deno serve entry point
deno init --npm vite my-app   # run any npm create-* initializer
```

`deno init --npm <name>` covers the whole `npm create` ecosystem —
`deno init --npm vite`, `deno init --npm astro`, and so on.

## Publishing

To JSR, from a `deno.json` with `name`, `version`, and `exports`:

```bash
deno publish --dry-run
deno publish
```

Provenance attestation is automatic on GitHub Actions. `deno bump-version patch`
increments the version, and across every member at a workspace root.

To npm, `deno pack` produces an npm-compatible tarball from a Deno project.

## Reviewing Deno code

Things worth flagging, roughly in order of how often they matter:

- Broad permissions (`-A`) committed in a task where a scoped grant would work.
- `deno.lock` not committed, or CI running `deno install` instead of `deno ci`.
- A dependency imported with an inline `jsr:`/`npm:` specifier when the project
  has a config file — move it to the import map with `deno add` so the version
  is declared in one place. Inline specifiers are fine in standalone scripts.
- A specifier with no version constraint.
- Missing `deno fmt --check`, `deno lint`, and `deno check` in CI.
- `any` where a real type is available; Deno projects are type-checked by
  default, so this is cheap to fix.

## Further reading

- <https://docs.deno.com> — runtime documentation
- <https://docs.deno.com/runtime/fundamentals/> — core concepts
- <https://docs.deno.com/api/> — `Deno.*` API reference
- <https://jsr.io> — JSR registry
- `references/CLI.md` — fuller subcommand and flag reference
- `deno <subcommand> --help` — authoritative, and version-accurate. Check this
  before guessing at a flag.
