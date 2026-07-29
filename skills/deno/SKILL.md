---
name: deno
description: Use when writing, running, configuring, reviewing, or debugging code in a Deno project, or when scaffolding a new one. Covers dependency management with deno install and deno add, package.json and node_modules support, npm and JSR packages, permissions, where configuration belongs across package.json, tsconfig.json and deno.json, workspaces, the built-in toolchain (fmt, lint, test, check, bench, compile), and publishing.
license: MIT
metadata:
  author: denoland
  version: "1.0"
---

# Deno

Deno is a JavaScript and TypeScript runtime with a package manager, formatter,
linter, test runner, type checker, and bundler in a single binary. It runs
TypeScript directly.

For a single-file script, that means no build step and no `tsconfig.json` — just
`deno main.ts`. For an application or a framework project, keep the regular
setup: a `tsconfig.json` for compiler options and whatever build step the
framework needs. Deno reads `tsconfig.json`, so an existing one keeps working.

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
  runs a `tasks.build` entry from `deno.json`. If both define the same name,
  `deno.json` wins.
- Node built-ins work, prefixed or not — `node:fs` and `fs` both resolve.
- `deno main.js` runs a file directly. `deno run` is optional.

A developer arriving from Node, npm, pnpm, yarn, or bun is already productive.
Do not tell them to rewrite imports, adopt JSR, or restructure a project as a
precondition for using Deno. The two genuine behavioral differences are
**permissions** (see below) and **npm lifecycle scripts not running by
default**.

For converting an existing project, see the `migrate-to-deno` skill.

## Dependency management

```bash
deno install                  # install everything in package.json / deno.json
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
installed alongside Deno, and an alias for `deno x`. Note that it runs the
package **with the sandbox disabled** — it is running someone else's binary with
full access, so treat it with the same care as `npx`.

### Dependency age

By default Deno will not install a package version published less than a day
ago, which blunts the window in which a compromised release does damage. To opt
out, or to choose a different threshold:

```bash
deno add --min-dep-age=0 npm:some-package     # disable the check
deno add --min-dep-age=P7D npm:some-package   # require a week instead
```

The value accepts minutes (`120`), an ISO-8601 duration (`P2D`), or an absolute
cutoff date.

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

### Where each kind of configuration goes

Each file has one job. Keeping to this split is what makes a Deno project
legible to the rest of the JavaScript ecosystem:

| File            | Holds                                                         |
| --------------- | ------------------------------------------------------------- |
| `package.json`  | dependencies, scripts — for every project                     |
| `tsconfig.json` | TypeScript compiler options                                   |
| `deno.json`     | Deno-specific configuration: `fmt`, `lint`, tasks, workspaces |

**Put dependencies in `package.json`.** It is what every other tool in the
ecosystem reads, and Deno resolves it natively. `deno.json` can also declare
dependencies, but reach for it only when a project has no `package.json` at all
— a standalone script, or a package published to JSR.

The same applies to compiler options: prefer `tsconfig.json` over
`compilerOptions` in `deno.json`, so `tsc` and editors see the same settings.

### Lockfile

`deno.lock` should be committed. On first install Deno seeds it from whatever
lockfile is already there — `package-lock.json`, `yarn.lock`, `bun.lock`, or
pnpm's — preserving existing pins rather than silently re-resolving.

### node_modules layout

Deno installs into `node_modules` using the same isolated layout as pnpm: real
files live in `node_modules/.deno/`, exposed through symlinks, so a package
cannot import something it never declared. Most tools are fine with this.

For a tool that insists on npm's flat, hoisted tree, switch the linker:

```json
{
  "nodeModulesLinker": "hoisted"
}
```

There is also a `nodeModulesDir` setting, but it only applies to projects with
no `package.json`. If the project has a `package.json` — which it normally
should — `node_modules` is created and managed as npm would, and this setting is
not something to reach for.

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

Dependencies belong in `package.json` and compiler options in `tsconfig.json`,
as above — this file is for configuring Deno itself.

`deno.json` also accepts an `imports` field, an import map that points a bare
specifier at a real one. It is how a project with no `package.json` declares
dependencies, and how a JSR package declares its own, alongside `name`,
`version`, and `exports`.

### Workspaces

```json
{ "workspace": ["./packages/core", "./packages/cli"] }
```

npm, Yarn, and Bun workspaces work out of the box — Deno reads `package.json`
`"workspaces"` directly, so those projects need no conversion. A pnpm workspace
is different: its `pnpm-workspace.yaml` is migrated into `deno.json` on the
first run, and that run has to be repeated afterwards to pick up the result.

For a Deno-native workspace, members are listed explicitly or by single-level
glob (`"packages/*"`); recursive `**` globs and negation are not supported. Run
a task across members with `deno task --filter '*' build`.

## Packages: npm and JSR

Deno resolves both registries natively.

- **npm** — the whole npm registry, via `npm:` specifiers or unprefixed names.
- **JSR** (`jsr.io`) — a registry built for TypeScript. Packages ship types
  directly from source, so there are no `@types/*` packages and no build step to
  publish. The Deno standard library lives here as `@std/*`.

**Prefer npm.** It is where the ecosystem is, and Deno resolves it natively, so
an unprefixed `deno add express` is the normal case. Reach for JSR when you want
the standard library (`@std/*`), or when publishing TypeScript that consumers
should get types for without a build step. Mixing both in one project is fine.

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

These cover the same ground as prettier, eslint, jest/vitest, tsc, and pkg/nexe,
and need no configuration or dependencies to work.

They are not drop-in replacements, though. Feature parity is not complete, so
swapping an established project over to them is a migration with real work in
it, not a config change. **There is no need to migrate** — an existing project
can keep prettier, eslint, and vitest and use Deno purely as the runtime and
package manager. Prefer the built-in tools for new projects, where there is no
existing setup to port.

Suppress a lint inline with `// deno-lint-ignore <rule>`, or a whole file with
`// deno-lint-ignore-file`. Formatting has the same pair: `// deno-fmt-ignore`
skips the next statement and `// deno-fmt-ignore-file` skips the file. In
Markdown, an HTML comment does it — `<!-- deno-fmt-ignore -->` before a code
block leaves that block alone, which matters for illustrative snippets that are
not valid standalone code.

## Running code

```bash
deno main.ts                 # run (deno run is optional)
deno watch main.ts           # reload on change (replaces nodemon)
deno task dev                # run a task from package.json or deno.json
deno repl
deno eval "console.log(1)"
```

`deno watch` hot-replaces modules on change, falling back to a full restart if
that fails. It is an alias for `deno run --watch-hmr`.

An HTTP server needs no dependencies:

```ts
Deno.serve((_req) => new Response("Hello"));
```

## Starting a new project

`deno init` scaffolds; prefer it over writing files by hand.

```bash
deno init my-project          # script + test + deno.json
deno init --empty my-project  # just main.ts and deno.json
deno init --lib my-lib        # library laid out for JSR publishing
deno create vite my-app       # scaffold from a package initializer
```

`deno create <package>` is the `npm create` / `yarn create` equivalent and
covers that whole ecosystem — `deno create vite`, `deno create astro`, and so
on. Unprefixed names are treated as npm packages; `--jsr` selects JSR.

## Publishing

**To npm, the regular flow still works** — `npm publish`, or `deno pack` to
build the npm-compatible tarball first. Deno does not replace it.

`deno publish` targets JSR only, from a `deno.json` with `name`, `version`, and
`exports`:

```bash
deno publish --dry-run
deno publish
```

Provenance attestation is automatic on GitHub Actions. `deno bump-version patch`
increments the version, and across every member at a workspace root.

Full guide: <https://docs.deno.com/runtime/reference/cli/publish/>

## Reviewing Deno code

Things worth flagging, roughly in order of how often they matter:

- Broad permissions (`-A`) committed in a task where a scoped grant would work.
- `deno.lock` not committed, or CI running `deno install` instead of `deno ci`.
- A dependency imported with an inline `jsr:`/`npm:` specifier when the project
  has a `package.json` — declare it with `deno add` so the version lives in one
  place. Inline specifiers are fine in standalone scripts.
- A specifier with no version constraint.
- Dependencies or compiler options declared in `deno.json` when the project has
  a `package.json` or `tsconfig.json` to put them in.
- Missing `deno fmt --check`, `deno lint`, and `deno check` in CI.
- `any` where a real type is available; Deno projects are type-checked by
  default, so this is cheap to fix.

## Further reading

- <https://docs.deno.com> — runtime documentation
- <https://docs.deno.com/runtime/fundamentals/> — core concepts
- <https://docs.deno.com/api/> — `Deno.*` API reference
- `references/CLI.md` — fuller subcommand and flag reference
- `deno <subcommand> --help` — authoritative, and version-accurate. Check this
  before guessing at a flag.
