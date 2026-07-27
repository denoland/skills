# Migrating from pnpm

pnpm is a package manager, not a runtime, so most of what moves is
configuration. A single-package pnpm project usually needs no changes at all —
Deno reads the existing `package.json`, installs the same dependencies, and runs
the same scripts.

Deno's default `node_modules` layout is isolated and symlink-based, the same
design pnpm uses, so the strictness guarantees pnpm users rely on carry over.

## Commands

| pnpm                            | Deno                              |
| ------------------------------- | --------------------------------- |
| `pnpm install`                  | `deno install`                    |
| `pnpm add <pkg>`                | `deno add <pkg>`                  |
| `pnpm add -D <pkg>`             | `deno add -D <pkg>`               |
| `pnpm remove <pkg>`             | `deno remove <pkg>`               |
| `pnpm <script>`                 | `deno task <script>`              |
| `pnpm dlx <pkg>`                | `dx <pkg>`                        |
| `pnpm outdated`                 | `deno outdated`                   |
| `pnpm audit`                    | `deno audit`                      |
| `pnpm why <pkg>`                | `deno why <pkg>`                  |
| `pnpm -r <script>`              | `deno task --filter '*' <script>` |
| `pnpm i --frozen-lockfile` (CI) | `deno ci`                         |

## Workspaces

pnpm keeps workspace globs in a separate `pnpm-workspace.yaml`; Deno reads them
from `deno.json`. Deno migrates the globs automatically on first use.

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
```

becomes

```json
{ "workspace": ["packages/*", "apps/*"] }
```

Two limitations to check before assuming a clean conversion:

- **No recursive globs.** Depth is explicit — `packages/*` works, `packages/**`
  does not.
- **No exclusions.** pnpm's `!packages/legacy` negation has no equivalent; list
  the members explicitly instead.

## Catalogs

Deno supports pnpm's `catalog:` protocol. Catalog definitions move into the root
configuration under the same field names, and dependencies keep referring to
them as `"catalog:"` / `"catalog:<name>"`.

## No equivalent

- **`overrides`** — pin through an import map entry in `deno.json` instead.
- **`patchedDependencies`** — vendor the dependency or maintain a fork.
- **Registry and resolver tuning** in `.npmrc` — store, side-effects cache, and
  hoisting-pattern settings do not transfer.

## Lifecycle scripts

pnpm also blocks these by default, so the concept is familiar. The Deno
equivalent of `pnpm approve-builds` is:

```bash
deno approve-scripts
deno install --allow-scripts=npm:<pkg>
```
