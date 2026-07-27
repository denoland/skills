# Migrating from Yarn

Yarn is a package manager, not a runtime, so most of the migration is
configuration rather than code. Deno reads the existing `package.json`, installs
the same dependencies, and runs the same scripts.

## Commands

| Yarn                      | Deno                              |
| ------------------------- | --------------------------------- |
| `yarn install`            | `deno install`                    |
| `yarn add <pkg>`          | `deno add <pkg>`                  |
| `yarn add -D <pkg>`       | `deno add -D <pkg>`               |
| `yarn remove <pkg>`       | `deno remove <pkg>`               |
| `yarn <script>`           | `deno task <script>`              |
| `yarn dlx <pkg>`          | `dx <pkg>`                        |
| `yarn outdated`           | `deno outdated`                   |
| `yarn why <pkg>`          | `deno why <pkg>`                  |
| `yarn workspaces foreach` | `deno task --filter '*' <script>` |
| `yarn --immutable` (CI)   | `deno ci`                         |

## Plug'n'Play — the main incompatibility

Deno does not implement PnP. It creates a conventional `node_modules` directory.
Consequences:

- `.pnp.cjs` and `.pnp.loader.mjs` become unused. Delete them once migrated.
- `.yarnrc.yml` resolver settings (`nodeLinker`, `pnpMode`, registry mirrors) do
  not transfer.
- `yarn patch` has no equivalent. Vendor the dependency or maintain a fork.

If the project relies on PnP's strictness to catch undeclared dependencies,
Deno's default isolated `node_modules` layout provides similar protection: real
files live in `node_modules/.deno/` and are exposed through symlinks, so a
package cannot import something it never declared.

## Lockfiles

- **Yarn Classic (v1)** — `yarn.lock` seeds `deno.lock`, preserving pins.
- **Yarn Berry (v2+)** — the lockfile format differs enough that Deno generates
  fresh resolutions. Diff the resulting versions before committing; this is the
  one step in a Yarn migration where dependency versions can move.

## Workspaces

`package.json` `"workspaces": ["packages/*"]` works unchanged. Members reference
each other through the workspace protocol with no conversion.

## resolutions

Yarn's `resolutions` field is not supported. Pin through an import map entry in
`deno.json` instead:

```json
{
  "imports": {
    "lodash": "npm:lodash@^4.17.21"
  }
}
```

## Lifecycle scripts

Deno does not run them by default. Approve per package with
`deno approve-scripts` or `deno install --allow-scripts=npm:<pkg>`.
