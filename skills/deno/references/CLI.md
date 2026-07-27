# Deno CLI reference

Verified against Deno 2.9. `deno <subcommand> --help` is authoritative and
version-accurate — check it before guessing at a flag. `--help=full` shows every
flag including runtime and permission flags; `--help=unstable` shows unstable
feature flags.

## Execution

| Command                       | Purpose                                                     |
| ----------------------------- | ----------------------------------------------------------- |
| `deno run <file>`             | Run a module. `deno <file>` is equivalent.                  |
| `deno run --watch <file>`     | Restart on file change (replaces nodemon)                   |
| `deno run --watch-hmr <file>` | Hot-replace modules, restarting only if HMR fails           |
| `deno serve <file>`           | Run a server from the module's default export               |
| `deno task <name>`            | Run a task from `deno.json` or a script from `package.json` |
| `deno repl`                   | Interactive REPL                                            |
| `deno eval "<code>"`          | Evaluate a string                                           |

`deno task` with no argument lists available tasks. Useful flags: `--cwd <dir>`,
`--filter <name>` (workspace members), `--if-present` (exit 0 when the task is
missing), `--eval` (treat the argument as an inline task), `-j/--jobs`
(concurrency).

`deno serve` accepts `--port`, `--host`, `--watch`, and `--parallel`.

## Dependency management

| Command                             | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `deno install`                      | Install everything declared in the config file            |
| `deno install <pkg>`                | Add and install one package                               |
| `deno install --entrypoint <files>` | Install what those files import                           |
| `deno install -g <spec>`            | Install a global executable into `$DENO_INSTALL_ROOT/bin` |
| `deno add <pkg>`                    | Add a dependency to the config file                       |
| `deno remove <pkg>`                 | Remove a dependency                                       |
| `deno ci`                           | Clean, reproducible install from the lockfile             |
| `deno outdated`                     | Show outdated dependencies                                |
| `deno update`                       | Alias for `deno outdated --update`                        |
| `deno list`                         | List declared dependencies (like `npm ls`)                |
| `deno why <pkg>`                    | Explain why a package is in the tree                      |
| `deno audit`                        | Audit installed dependencies for vulnerabilities          |
| `deno approve-scripts`              | Approve npm lifecycle scripts                             |
| `deno link <path>`                  | Link a local JSR package for development                  |
| `deno unlink <path>`                | Undo `deno link`                                          |
| `deno uninstall`                    | Remove a dependency or global executable                  |

### deno add / deno install

**Unprefixed package names default to npm.** `deno add express` installs
`npm:express`. Use a `jsr:` prefix or `--jsr` for JSR packages.

- `-D, --dev` — add under `devDependencies` (`package.json` only)
- `--no-save` — install without writing to the config file
- `--lockfile-only` — update only the lockfile
- `--allow-scripts[=<pkg>]` — permit npm lifecycle scripts
- `--minimum-dependency-age <age>` — refuse packages published more recently
  than the given age, as a supply-chain attack mitigation. Accepts minutes
  (`120`), an ISO-8601 duration (`P2D`), or a cutoff date. Unstable.

### deno ci

Requires `deno.lock`, removes any existing `node_modules`, installs strictly
from the lockfile, and errors if the lockfile is out of date with the config
file. This is the command CI should run, not `deno install`.

- `--prod` — exclude devDependencies
- `--skip-types` — exclude `@types/*` packages (name-based heuristic; may skip
  packages that ship runtime code)

### deno outdated / deno update

- `--update` — apply updates rather than only listing them
- `--latest` — ignore existing semver ranges
- `--lockfile-only` — update within existing ranges without editing the config
  file (this is what `npm update` does)
- `--compatible` — only semver-compatible updates
- `--recursive` — across all workspace members

Filters select packages by their **alias in the config file**, not by the real
package name, and accept wildcards and `!` negation:

```bash
deno update --latest "@std/*" "!@std/fmt*"
deno outdated --update @std/fmt@^1.0.2
```

### deno list

- `--depth <n>` — tree depth (`0` = direct dependencies only)
- `--prod` / `--dev` — restrict to one dependency set
- `--recursive` — include all workspace members

Unlike `deno info`, which walks the module graph from an entrypoint, `deno list`
reports what the project _declares_.

### dx

`dx <pkg>` runs a package binary without installing it — the `npx` / `bunx` /
`pnpm dlx` / `yarn dlx` equivalent. It is a separate binary shipped alongside
Deno and an alias for `deno x`. Note that it does not appear in the top-level
`deno --help` output.

## Toolchain

| Command             | Replaces            | Notes                                                         |
| ------------------- | ------------------- | ------------------------------------------------------------- |
| `deno fmt`          | prettier            | `--check` for CI, `--unstable-component` for Vue/Svelte/Astro |
| `deno lint`         | eslint              | `--fix`, `--rules` to list, `--json`                          |
| `deno test`         | jest, vitest, mocha | `--watch`, `--parallel`, `--coverage[=dir]`                   |
| `deno check <file>` | tsc --noEmit        | `--all` includes remote and npm code                          |
| `deno bench`        | tinybench et al     | discovers `*_bench.ts` / `*.bench.ts`                         |
| `deno coverage`     | nyc, c8             | reads `--coverage` output; `--lcov`, `--html`                 |
| `deno compile`      | pkg, nexe           | `--target` cross-compiles                                     |
| `deno doc`          | typedoc             | `--html` for a site, `--json` for data                        |
| `deno info`         | —                   | module graph, cache locations                                 |
| `deno clean`        | —                   | clear the module cache                                        |

`deno fmt` handles JS, TS, JSON(C), Markdown, and Jupyter notebooks by default;
HTML, CSS, SCSS, LESS, YAML, Svelte, Vue, Astro, and Angular are behind unstable
formatting options.

`deno test` discovers `{*_,*.,}test.{js,mjs,ts,mts,jsx,tsx}` and anything under
`**/__tests__/**`. `--coverage-threshold=<pct>` fails the run below a coverage
percentage.

Inline suppression: `// deno-lint-ignore <rule>`, `// deno-lint-ignore-file`,
`// deno-fmt-ignore`, `// deno-fmt-ignore-file`.

`deno check --doc` also type-checks code blocks in JSDoc comments; `--doc-only`
checks only JSDoc and Markdown code blocks. This is a good way to keep
documentation examples honest.

## Project setup

| Command                        | Result                              |
| ------------------------------ | ----------------------------------- |
| `deno init <dir>`              | Script, test, and `deno.json`       |
| `deno init --empty <dir>`      | Just `main.ts` and `deno.json`      |
| `deno init --lib <dir>`        | Library laid out for JSR publishing |
| `deno init --serve <dir>`      | `deno serve` entry point            |
| `deno init --npm <name> <dir>` | Run an npm `create-*` initializer   |
| `deno init --jsr <pkg> <dir>`  | Scaffold from a JSR package         |

`--npm` covers the entire `npm create` ecosystem: `deno init --npm vite`,
`deno init --npm astro`, and so on.

## Publishing

| Command                         | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `deno publish`                  | Publish to JSR                      |
| `deno pack`                     | Build an npm-compatible tarball     |
| `deno bump-version <increment>` | Bump the version in the config file |

`deno publish` requires `name`, `version`, and `exports` in `deno.json`. Useful
flags: `--dry-run`, `--allow-dirty` (uncommitted changes), `--allow-slow-types`,
`--set-version`, `--token`. Provenance attestation is enabled by default on
GitHub Actions and publicly links the package to the build that produced it;
`--no-provenance` disables it.

`deno bump-version` accepts `major`, `minor`, `patch`, `premajor`, `preminor`,
`prepatch`, `prerelease`. At a workspace root it applies the increment to every
member and rewrites `jsr:` references in the root import map. With no increment
it derives per-package bumps from conventional commit messages since the last
tag and prepends a release note to `Releases.md`.

`deno pack` flags: `--dry-run`, `--output`, `--set-version`, `--ignore`,
`--no-source-maps`, `--allow-dirty`.

## Permissions

Applies to `run`, `serve`, `test`, `bench`, `compile`, and `eval`.

| Flag                         | Short | Grants                      |
| ---------------------------- | ----- | --------------------------- |
| `--allow-read[=<path>...]`   | `-R`  | filesystem read             |
| `--allow-write[=<path>...]`  | `-W`  | filesystem write            |
| `--allow-net[=<host>...]`    | `-N`  | network                     |
| `--allow-env[=<var>...]`     | `-E`  | environment variables       |
| `--allow-sys[=<api>...]`     | `-S`  | OS information              |
| `--allow-import[=<host>...]` | `-I`  | imports from remote hosts   |
| `--allow-run[=<bin>...]`     | —     | subprocesses                |
| `--allow-ffi[=<path>...]`    | —     | native libraries (unstable) |
| `--allow-all`                | `-A`  | everything                  |

Every `--allow-*` has a matching `--deny-*`, and a deny always wins.

`--allow-net` scopes accept ports (`example.com:443`) and Unix sockets
(`unix:/var/run/docker.sock`). `--allow-import` defaults to a fixed allowlist of
`jsr.io`, `esm.sh`, `cdn.jsdelivr.net`, and a few others rather than to nothing.

## Environment variables

| Variable             | Effect                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `DENO_DIR`           | Cache directory                                                               |
| `DENO_INSTALL_ROOT`  | Where `deno install -g` writes (default `$HOME/.deno`)                        |
| `DENO_COMPAT`        | Node compatibility mode: extensionless imports, CJS detection, Node built-ins |
| `DENO_CONDITIONS`    | Extra export conditions for npm resolution                                    |
| `DENO_JOBS`          | Worker count for `--parallel`                                                 |
| `DENO_AUTH_TOKENS`   | Bearer tokens for private module hosts                                        |
| `DENO_CERT`          | Additional CA certificates                                                    |
| `DENO_KV_DB_MODE`    | Whether `Deno.openKv()` uses disk or memory                                   |
| `DENO_CACHE_DB_MODE` | Whether the Web Cache uses disk or memory                                     |

`deno --help` lists the full set with descriptions.
