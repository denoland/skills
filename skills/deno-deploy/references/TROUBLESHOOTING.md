# Deno Deploy Troubleshooting

## Common Errors

### "No organization was selected"

This error occurs because the CLI needs an organization context. Unfortunately, commands like `deno deploy orgs` also fail without this context.

**Solution:**

1. **Find your org name manually:** Visit https://console.deno.com - your org is in the URL path (e.g., `console.deno.com/donjo` means org is `donjo`)

2. **Specify org explicitly:**
   ```bash
   deno deploy --org your-org-name --prod
   ```

3. **Or create an app with org:**
   ```bash
   deno deploy create --org your-org-name
   # Complete the browser flow when prompted
   ```

If you see this error, the user needs to provide their organization name from the console URL.

### "No entrypoint found"

Specify your entry file:

```bash
deno deploy --entrypoint main.ts --prod
```

Or add to `deno.json`:

```json
{
  "deploy": {
    "entrypoint": "main.ts"
  }
}
```

### "authorization required"

Token expired or missing. Options:
- Re-authenticate interactively (browser flow)
- Set up a CI/CD token via `DENO_DEPLOY_TOKEN` environment variable
- Create a new token at https://console.deno.com/account/access-tokens

### "Minimum Deno version required"

User needs to upgrade Deno:
```bash
deno upgrade
```

The `deno deploy` command requires Deno >= 2.4.2.

### Fresh "Build required" Error

Fresh 2.0 requires building before deployment:

```bash
deno task build
deno deploy --prod
```

### Environment Variable Errors

Check what's currently set:

```bash
deno deploy env list
```

Add missing variables:

```bash
deno deploy env add MISSING_VAR "value"
```

## Error Response Table

| Error | Cause | Solution |
|-------|-------|----------|
| "No organization was selected" | No org in config | Get org name from console URL, use `--org` flag |
| "No entrypoint found" | Can't find main file | Use `--entrypoint` flag or set in deno.json |
| "authorization required" | Token expired/missing | Re-authenticate or set `DENO_DEPLOY_TOKEN` |
| "Minimum Deno version required" | Deno too old | Run `deno upgrade` |

## Verifying Deployment Success

The CLI output can be verbose. Look for these indicators of success:
- A URL containing `.deno.dev` or `.deno.net` - this is your live deployment
- A console URL like `https://console.deno.com/<org>/<app>/builds/<id>`
- The command exits with code 0 (no error)

After deployment, confirm success by extracting the production URL from the output. The format is typically:
`https://<app-name>.<org>.deno.net` or `https://<app-name>.deno.dev`

## Commands That Require Org Context

These commands will error if no org is configured - do not try them to "discover" orgs:
- `deno deploy` (without --org flag)
- `deno deploy orgs`
- `deno deploy switch`
- `deno deploy env list`
- `deno deploy logs`

## Environment Variable Contexts

Variables can apply to different environments:

```bash
# Set which contexts a variable applies to
deno deploy env update-contexts API_KEY Production Preview
```

Available contexts: `Production`, `Preview`, `Local`, `Build`
