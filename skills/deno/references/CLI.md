# Deno CLI reference

Verified against Deno 2.9. `deno <subcommand> --help` is authoritative — check
it before guessing at a flag. `--help=full` adds runtime and permission flags;
`--help=unstable` shows unstable ones.

## Execution

| Command                   | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `deno run <file>`         | Run a module. `deno <file>` is equivalent.                  |
| `deno watch <file>`       | Reload on change; alias for `deno run --watch-hmr`          |
| `deno run --watch <file>` | Restart on file change, without hot replacement             |
| `deno task <name>`        | Run a task from `deno.json` or a script from `package.json` |
| `deno repl`               | Interactive REPL                                            |
| `deno eval "<code>"`      | Evaluate a string                                           |

`deno task` with no argument lists tasks. Flags: `--cwd`, `--filter` (workspace
members), `--if-present` (exit 0 if missing), `--eval` (inline task),
`-j/--jobs`.

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
| `deno link <path>`                  | Link a local JSR or npm package for development           |
| `deno unlink <path>`                | Undo `deno link`                                          |
| `deno uninstall`                    | Remove a dependency or global executable                  |

### deno add / deno install

**Unprefixed package names default to npm.** `deno add express` installs
`npm:express`. Use a `jsr:` prefix or `--jsr` for JSR packages.

- `-D, --dev` — add under `devDependencies` (`package.json` only)
- `--no-save` — install without writing to the config file
- `--lockfile-only` — update only the lockfile
- `--allow-scripts[=<pkg>]` — permit npm lifecycle scripts
- `--min-dep-age <age>` — refuse packages published more recently than the given
  age, as a supply-chain attack mitigation. **Defaults to one day**, so
  installing a just-published version needs `--min-dep-age=0`. Accepts minutes
  (`120`), an ISO-8601 duration (`P2D`), or a cutoff date. Also spelled
  `--minimum-dependency-age`.

### deno ci

Requires `deno.lock`, removes any existing `node_modules`, installs strictly
from the lockfile, and errors if it is out of date. CI should run this, not
`deno install`.

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

Filters select by **alias in the config file**, not real package name, and take
wildcards and `!` negation:

```bash
deno update --latest "@std/*" "!@std/fmt*"
deno outdated --update @std/fmt@^1.0.2
```

### deno list

- `--depth <n>` — tree depth (`0` = direct dependencies only)
- `--prod` / `--dev` — restrict to one dependency set
- `--recursive` — include all workspace members

`deno info` walks the module graph from an entrypoint; `deno list` reports what
the project _declares_.

### dx

`dx <pkg>` runs a package binary without installing it — `npx` / `bunx` /
`pnpm dlx` / `yarn dlx`. A separate binary shipped alongside Deno, aliasing
`deno x`, and absent from the top-level `deno --help`. Runs with the sandbox
disabled.

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

`deno fmt` handles JS, TS, JSON(C), Markdown, and Jupyter notebooks; HTML, CSS,
SCSS, LESS, YAML, Svelte, Vue, Astro, and Angular sit behind unstable options.

`deno test` discovers `{*_,*.,}test.{js,mjs,ts,mts,jsx,tsx}` and
`**/__tests__/**`. `--coverage-threshold=<pct>` fails below a coverage
percentage.

Suppress with `// deno-lint-ignore <rule>`, `// deno-lint-ignore-file`,
`// deno-fmt-ignore`, `// deno-fmt-ignore-file`.

`deno check --doc` also checks JSDoc code blocks; `--doc-only` checks only JSDoc
and Markdown blocks — a good way to keep documentation examples honest.

## Project setup

| Command                   | Result                              |
| ------------------------- | ----------------------------------- |
| `deno init <dir>`         | Script, test, and `deno.json`       |
| `deno init --empty <dir>` | Just `main.ts` and `deno.json`      |
| `deno init --lib <dir>`   | Library laid out for JSR publishing |
| `deno create <pkg> <dir>` | Scaffold from a package initializer |

`deno create` is the `npm create` / `yarn create` equivalent and covers that
whole ecosystem: `deno create vite`, `deno create astro`, and so on. Unprefixed
names are treated as npm packages; `--jsr` selects JSR, and `-y` bypasses the
prompt and runs with full permissions.

## Publishing

| Command                         | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `deno publish`                  | Publish to JSR                      |
| `deno pack`                     | Build an npm-compatible tarball     |
| `deno bump-version <increment>` | Bump the version in the config file |

`deno publish` requires `name`, `version`, `exports` in `deno.json`. Flags:
`--dry-run`, `--allow-dirty`, `--allow-slow-types`, `--set-version`, `--token`.
Provenance is on by default in GitHub Actions, publicly linking the package to
the build that produced it; `--no-provenance` disables it.

`deno bump-version` takes `major`, `minor`, `patch`, `premajor`, `preminor`,
`prepatch`, `prerelease`. At a workspace root it applies to every member and
rewrites `jsr:` references in the root import map. With no increment it derives
per-package bumps from conventional commits since the last tag and prepends a
release note to `Releases.md`.

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

Every `--allow-*` has a matching `--deny-*`, and deny always wins.

`--allow-net` scopes take ports (`example.com:443`) and Unix sockets
(`unix:/var/run/docker.sock`). `--allow-import` defaults to a fixed allowlist —
`jsr.io`, `esm.sh`, `cdn.jsdelivr.net`, and a few others — not to nothing.

## Environment variables

| Variable            | Effect                                                 |
| ------------------- | ------------------------------------------------------ |
| `DENO_DIR`          | Cache directory                                        |
| `DENO_INSTALL_ROOT` | Where `deno install -g` writes (default `$HOME/.deno`) |
| `DENO_CONDITIONS`   | Extra export conditions for npm resolution             |
| `DENO_JOBS`         | Worker count for `--parallel`                          |
| `DENO_CERT`         | Additional CA certificates                             |

`deno --help` lists the full set with descriptions.
