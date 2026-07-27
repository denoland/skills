# Migrating from npm

Deno reads `package.json` directly. In most cases you point Deno at an existing
npm project and it works.

## Lockfile

The first `deno install` seeds `deno.lock` from `package-lock.json`, carrying
over pinned versions and integrity hashes. Dependencies are not silently
upgraded during the switch.

`deno.lock` coexists with `package-lock.json`. Teammates still on npm are
unaffected until they choose to switch, so this can land as a normal PR rather
than a flag day. Commit `deno.lock` once verified.

To back out: delete `deno.lock` and `node_modules`, run `npm install`.

## node_modules

Deno's default layout is isolated, like pnpm's: real files live in
`node_modules/.deno/`, exposed through symlinks. This prevents packages from
importing dependencies they never declared.

Tools that assume npm's flat hoisted tree need:

```json
{
  "nodeModulesDir": "manual",
  "nodeModulesLinker": "hoisted"
}
```

`nodeModulesDir` values:

| Value      | Behavior                                                                |
| ---------- | ----------------------------------------------------------------------- |
| `"auto"`   | Deno creates and manages `node_modules`                                 |
| `"manual"` | You manage it, as npm does — the default when `package.json` is present |
| `"none"`   | Global cache only, no `node_modules` directory                          |

## Scripts

`package.json` `scripts` run with `deno task <name>`. No conversion needed.

Deno does not run lifecycle scripts (`postinstall` and friends) automatically.
Approve per package:

```bash
deno approve-scripts
deno install --allow-scripts=npm:better-sqlite3
```

## overrides

`package.json` `overrides` is not supported. Pin the version through an import
map entry in `deno.json` instead:

```json
{
  "imports": {
    "semver": "npm:semver@^7.6.0"
  }
}
```

## Workspaces

`package.json` `"workspaces"` is honored as-is. Deno also accepts its own
`"workspace"` array in `deno.json`. Members are listed explicitly or by
single-level glob; recursive `**` globs and negation are not supported.

## CI

Replace `npm ci` with `deno ci`. It requires `deno.lock`, removes any existing
`node_modules`, installs strictly from the lockfile, and fails if the lockfile
is out of date with the config file.

```bash
deno ci --prod    # skip devDependencies
```

Do not use `deno install` in CI — it will happily update the lockfile.
