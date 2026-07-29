---
name: deno-sandbox
description: Use when building features that execute untrusted user code, AI-generated code, or need isolated code execution environments. Covers the @deno/sandbox SDK.
license: MIT
metadata:
  author: denoland
  version: "2.0"
---

# Deno Sandboxes

Each sandbox is a Linux microVM (Firecracker, as used by AWS Lambda) with its
own kernel, filesystem, network, and process space, so code inside cannot reach
the host. Defaults are 2 vCPUs, 512MB memory, 10GB disk, and startup under
200ms.

Reference: <https://deno.com/deploy/sandboxes>

```bash
deno add jsr:@deno/sandbox
```

```typescript
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create();

const child = await sandbox.spawn("echo", { args: ["Hello from sandbox!"] });
const output = await child.output();
console.log(new TextDecoder().decode(output.stdout));
```

Always create with `await using`, which disposes the sandbox when the scope
ends. A sandbox created without it leaks until the process exits.

## Running processes

```typescript
const child = await sandbox.spawn("deno", {
  args: ["run", "script.ts"],
  stdin: "piped",
  stdout: "piped",
  stderr: "piped",
});

const output = await child.output();
output.code; // exit code
new TextDecoder().decode(output.stdout);
```

Streams are only captured if piped — an unpiped `stdout` comes back empty.

For interactive or long-running processes, read and write the streams directly:

```typescript
const writer = child.stdin!.getWriter();
await writer.write(new TextEncoder().encode("console.log('Hello')\n"));
await writer.close();

const reader = child.stdout!.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

`await child.kill()` sends SIGTERM, `child.kill("SIGKILL")` a specific signal,
and `await child.status` resolves with the exit status.

## Running untrusted code

The sandbox is the isolation boundary, but still run the code with the
permissions it needs and no more. Deno grants nothing by default, so a bare
`deno run` is the locked-down case — there is no `--allow-none` flag.

```typescript
async function runUserCode(code: string): Promise<string> {
  await using sandbox = await Sandbox.create();
  await sandbox.fs.writeFile("/tmp/user_code.ts", code);

  const child = await sandbox.spawn("deno", {
    args: ["run", "/tmp/user_code.ts"], // no flags = no permissions
    stdout: "piped",
    stderr: "piped",
  });

  // Untrusted code can loop forever; always bound it.
  const timeout = setTimeout(() => child.kill(), 5000);
  try {
    const output = await child.output();
    if (output.code !== 0) {
      throw new Error(new TextDecoder().decode(output.stderr));
    }
    return new TextDecoder().decode(output.stdout);
  } finally {
    clearTimeout(timeout);
  }
}
```

Grant narrowly when the code genuinely needs more — `--allow-net` for a
playground that fetches, not `-A`.

Treat whatever comes back as data, never as code: parse it, validate it, and
reject anything unexpected. `JSON.parse` on untrusted output is fine; `eval` or
interpolating it into a template is not.

## API

`deno doc jsr:@deno/sandbox` has the full surface. The main pieces are `Sandbox`
(create and manage), `ChildProcess` (a running process), and `Client` (Deploy
apps and volumes). Filesystem access is `sandbox.fs.readFile` and
`sandbox.fs.writeFile`.

Sandboxes run on Deno Deploy unchanged — `deno deploy --prod`.
