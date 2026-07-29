# Migrating from npm

Deno reads `package.json` directly; in most cases pointing it at an existing npm
project just works.

## Lockfile

The first `deno install` seeds `deno.lock` from `package-lock.json`, carrying
over pins and integrity hashes — nothing is silently upgraded.

`deno.lock` coexists with `package-lock.json`, so teammates on npm are
unaffected and this lands as a normal PR, not a flag day. Commit `deno.lock`
once verified. To back out: delete it and `node_modules`, run `npm install`.

## node_modules

Deno's layout is isolated like pnpm's: real files in `node_modules/.deno/`,
exposed through symlinks, so packages can't import undeclared dependencies.
Tools assuming npm's flat hoisted tree need:

```json
{
  "nodeModulesLinker": "hoisted"
}
```

There is also a `nodeModulesDir` setting, but it only applies to projects with
no `package.json`. Coming from npm you will have one, so `node_modules` is
created and managed as npm would and this setting is not one to reach for.

## Scripts

`package.json` `scripts` run with `deno task <name>`, no conversion needed.
Lifecycle scripts (`postinstall`) don't run automatically; approve per package:

```bash
deno approve-scripts
deno install --allow-scripts=npm:better-sqlite3
```

## overrides

`overrides` is not supported. Pin through an import map entry in `deno.json`:

```json
{
  "imports": {
    "semver": "npm:semver@^7.6.0"
  }
}
```

## Workspaces

`"workspaces"` is honored as-is. Deno also accepts its own `"workspace"` array
in `deno.json`; members are explicit or single-level globs, with no `**` or
negation.

## CI

Replace `npm ci` with `deno ci`: it requires `deno.lock`, removes any existing
`node_modules`, installs strictly from the lockfile, and fails if it is stale.

```bash
deno ci --prod    # skip devDependencies
```

Don't use `deno install` in CI — it will happily update the lockfile.
