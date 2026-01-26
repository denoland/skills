# Fresh App Template

Fresh projects should be created using the official initializer:

```bash
deno run -Ar jsr:@fresh/init {{PROJECT_NAME}}
cd {{PROJECT_NAME}}
```

This creates a complete Fresh project with all necessary files:
- `deno.json` - Configuration
- `main.ts` - Entry point
- `fresh.gen.ts` - Auto-generated manifest
- `routes/` - Pages and API routes
- `islands/` - Interactive components
- `components/` - Server-only components
- `static/` - Static assets

## Development

```bash
deno task dev
```

The dev server runs at http://localhost:5173 (not 8000).

## Production

```bash
deno task build
deno deploy --prod
```
