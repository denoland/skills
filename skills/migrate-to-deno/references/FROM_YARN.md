# Migrating from Yarn

Yarn is a package manager, not a runtime, so the migration is configuration
rather than code. Deno reads the existing `package.json`, installs the same
dependencies, and runs the same scripts.

## Commands

| Yarn                      | Deno                              |
| ------------------------- | --------------------------------- |
| `yarn install`            | `deno install`                    |
| `yarn add <pkg>`          | `deno add <pkg>`                  |
| `yarn add -D <pkg>`       | `deno add -D <pkg>`               |
| `yarn remove <pkg>`       | `deno remove <pkg>`               |
| `yarn <script>`           | `deno task <script>`              |
| `yarn dlx <pkg>`          | `dx <pkg>`                        |
| `yarn why <pkg>`          | `deno why <pkg>`                  |
| `yarn workspaces foreach` | `deno task --filter '*' <script>` |

Classic (v1) and Berry (v2+) diverge on the rest, so the mapping is not uniform.
Deno has one spelling regardless of which the project came from:

| Task       | Yarn Classic (v1)                | Yarn Berry (v2+)           | Deno            |
| ---------- | -------------------------------- | -------------------------- | --------------- |
| CI install | `yarn install --frozen-lockfile` | `yarn install --immutable` | `deno ci`       |
| Outdated   | `yarn outdated`                  | removed                    | `deno outdated` |
| Audit      | `yarn audit`                     | `yarn npm audit`           | `deno audit`    |

## Plug'n'Play — the main incompatibility

Deno does not implement PnP; it creates a conventional `node_modules`.

- `.pnp.cjs` and `.pnp.loader.mjs` become unused. Delete them once migrated.
- `.yarnrc.yml` resolver settings (`nodeLinker`, `pnpMode`, registry mirrors) do
  not transfer.
- `yarn patch` has no equivalent. Vendor the dependency or maintain a fork.

If the project relied on PnP's strictness to catch undeclared dependencies,
Deno's isolated layout gives similar protection: real files in
`node_modules/.deno/`, exposed through symlinks.

## Lockfiles

- **Yarn Classic (v1)** — `yarn.lock` seeds `deno.lock`, preserving pins.
- **Yarn Berry (v2+)** — the lockfile format differs enough that Deno generates
  fresh resolutions. Diff the resulting versions before committing; this is the
  one step in a Yarn migration where dependency versions can move.

## Workspaces

`"workspaces": ["packages/*"]` works unchanged; members reference each other
through the workspace protocol with no conversion.

## resolutions

`resolutions` is not supported. Pin through an import map entry instead:

```json
{
  "imports": {
    "lodash": "npm:lodash@^4.17.21"
  }
}
```

## Lifecycle scripts

Don't run by default. Approve per package with `deno approve-scripts` or
`deno install --allow-scripts=npm:<pkg>`.
