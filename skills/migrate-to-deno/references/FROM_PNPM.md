# Migrating from pnpm

pnpm is a package manager, not a runtime, so what moves is configuration. A
single-package pnpm project usually needs no changes — Deno reads the existing
`package.json`, installs the same dependencies, and runs the same scripts.

Deno's `node_modules` layout is isolated and symlink-based, the same design pnpm
uses, so the strictness guarantees pnpm users rely on carry over.

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

Two limitations before assuming a clean conversion: depth is explicit
(`packages/*` works, `packages/**` does not), and there are no exclusions —
pnpm's `!packages/legacy` negation has no equivalent, so list members
explicitly.

## Catalogs

Deno supports pnpm's `catalog:` protocol. Definitions move into the root config
under the same field names; dependencies keep referring to them as `"catalog:"`
/ `"catalog:<name>"`.

## No equivalent

- **`overrides`** — pin through an import map entry instead.
- **`patchedDependencies`** — vendor or fork.
- **Registry and resolver tuning** in `.npmrc` — store, side-effects cache, and
  hoisting settings don't transfer.

## Lifecycle scripts

pnpm blocks these too, so the concept is familiar. The equivalent of
`pnpm approve-builds`:

```bash
deno approve-scripts
deno install --allow-scripts=npm:<pkg>
```
