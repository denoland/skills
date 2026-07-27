/**
 * Verifies the code in the skills against the installed Deno.
 *
 *   deno task verify
 *
 * Two checks:
 *
 * 1. Every fenced `ts` / `tsx` block type-checks, against an import map that
 *    mirrors what the skills tell people to write, so bare specifiers like
 *    `@std/path` resolve. Blocks that are deliberate fragments or illustrate
 *    another runtime opt out by adding `no-check` to the info string:
 *    ```ts no-check
 * 2. Every `deno <subcommand>` is a real subcommand of the installed Deno,
 *    whether it appears in a shell block or in an inline code span (tables and
 *    prose both matter — a stale command in a reference table is exactly the
 *    kind of rot this is meant to catch).
 *
 * @module
 */

import { walk } from "@std/fs/walk";
import { globToRegExp } from "@std/path/glob-to-regexp";

/**
 * Skills whose code blocks are verified. Skills not listed here still contain
 * fragments that assume a project context (a Fresh app, a sandbox project) and
 * cannot be checked standalone yet. Add each one here as it is rewritten —
 * the list only ever grows.
 */
const VERIFIED = ["deno", "migrate-to-deno"];

/**
 * Import map for snippets. Bare specifiers are the style the skills recommend,
 * so without this the examples that follow that advice are the ones that
 * cannot be checked.
 */
const SNIPPET_CONFIG = {
  imports: {
    "@std/assert": "jsr:@std/assert@^1",
    "@std/fs": "jsr:@std/fs@^1",
    "@std/http": "jsr:@std/http@^1",
    "@std/path": "jsr:@std/path@^1",
  },
};

/** Type-checks run concurrently; each is a process spawn. */
const CONCURRENCY = 8;

interface Block {
  file: string;
  line: number;
  lang: string;
  info: string;
  body: string;
}

/**
 * Extract fenced code blocks, tracking the line each one starts on.
 *
 * Fence length is tracked so a longer fence can contain shorter ones, and an
 * unterminated fence is reported rather than silently dropped — a verifier
 * quietly checking less than you think is its worst failure mode.
 */
function extractBlocks(
  file: string,
  text: string,
): { blocks: Block[]; errors: string[] } {
  const blocks: Block[] = [];
  const errors: string[] = [];
  const lines = text.split("\n");
  let open:
    | {
      line: number;
      lang: string;
      info: string;
      fence: string;
      body: string[];
    }
    | null = null;

  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^(`{3,}|~{3,})(\S*)(.*)$/);
    if (fence && !open) {
      open = {
        line: i + 1,
        lang: fence[2],
        info: fence[3].trim(),
        fence: fence[1],
        body: [],
      };
    } else if (
      open && fence && fence[1][0] === open.fence[0] &&
      fence[1].length >= open.fence.length && fence[2] === ""
    ) {
      blocks.push({ file, ...open, body: open.body.join("\n") });
      open = null;
    } else if (open) {
      open.body.push(lines[i]);
    }
  }
  if (open) {
    errors.push(`${file}:${open.line}  unterminated code fence`);
  }
  return { blocks, errors };
}

/**
 * Whether the installed Deno has this subcommand.
 *
 * Probing `deno help <name>` is authoritative, where scraping `deno --help`
 * is not: aliases (`update`) and hidden-but-real subcommands (`audit`, `x`)
 * never appear in the listing. `deno help <name>` is also preferable to
 * `deno <name> --help`, which fails for subcommands that require a positional
 * argument (`deno why`).
 */
const subcommandCache = new Map<string, boolean>();
async function isSubcommand(name: string): Promise<boolean> {
  const cached = subcommandCache.get(name);
  if (cached !== undefined) return cached;
  const { success } = await new Deno.Command(Deno.execPath(), {
    args: ["help", name],
    stdout: "null",
    stderr: "null",
  }).output();
  subcommandCache.set(name, success);
  return success;
}

/**
 * `deno <subcommand>`, allowing leading env assignments (`DENO_COMPAT=1 deno
 * run …`). The trailing guard rejects `deno main.ts` and `deno ./x` — running a
 * file, not invoking a subcommand.
 */
const DENO_INVOCATION =
  /(?:^|\s)(?:[A-Z_][A-Z0-9_]*=\S*\s+)*deno\s+([a-z][a-z-]*)(?![.\w/-])/g;

/** Inline code spans, which is where reference tables keep their commands. */
const INLINE_CODE = /`([^`\n]+)`/g;

async function typeCheck(
  block: Block,
  dir: string,
  index: number,
): Promise<string | null> {
  const ext = block.lang === "tsx" ? "tsx" : "ts";
  const file = `${dir}/snippet_${index}.${ext}`;
  await Deno.writeTextFile(file, block.body);
  const { success, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["check", "--no-lock", "--config", `${dir}/deno.json`, file],
    stderr: "piped",
    stdout: "null",
  }).output();
  if (success) return null;
  return new TextDecoder().decode(stderr).trim().split("\n").slice(0, 4)
    .join("\n");
}

/** Run tasks with bounded concurrency, preserving input order. */
async function pool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

const failures: string[] = [];
let checkedCmds = 0;
let skipped = 0;

const skipDirs = globToRegExp("**/{.git,node_modules}/**");
const verified = new RegExp(`^skills[/\\\\](${VERIFIED.join("|")})[/\\\\]`);
const toCheck: Block[] = [];

for await (
  const entry of walk("skills", { exts: [".md"], includeDirs: false })
) {
  if (skipDirs.test(entry.path)) continue;
  if (!verified.test(entry.path)) {
    skipped++;
    continue;
  }
  const text = await Deno.readTextFile(entry.path);
  const { blocks, errors } = extractBlocks(entry.path, text);
  failures.push(...errors);

  // Subcommands named in prose and tables. Lines inside fenced blocks are
  // excluded here so they are attributed to the block scan below instead.
  const inFence = new Set<number>();
  for (const b of blocks) {
    const span = b.body === "" ? 0 : b.body.split("\n").length;
    for (let n = b.line; n <= b.line + span + 1; n++) inFence.add(n);
  }
  const lines = text.split("\n");
  for (let no = 1; no <= lines.length; no++) {
    if (inFence.has(no)) continue;
    for (const span of lines[no - 1].matchAll(INLINE_CODE)) {
      for (const m of span[1].matchAll(DENO_INVOCATION)) {
        checkedCmds++;
        if (!await isSubcommand(m[1])) {
          failures.push(
            `${entry.path}:${no}  not a deno subcommand: \`deno ${m[1]}\``,
          );
        }
      }
    }
  }

  for (const block of blocks) {
    const where = `${block.file}:${block.line}`;

    if (["ts", "tsx", "typescript"].includes(block.lang)) {
      if (!block.info.includes("no-check")) toCheck.push(block);
      continue;
    }

    if (["bash", "sh", "shell"].includes(block.lang)) {
      for (const m of block.body.matchAll(DENO_INVOCATION)) {
        checkedCmds++;
        if (!await isSubcommand(m[1])) {
          failures.push(`${where}  not a deno subcommand: \`deno ${m[1]}\``);
        }
      }
    }
  }
}

const dir = await Deno.makeTempDir();
try {
  await Deno.writeTextFile(
    `${dir}/deno.json`,
    JSON.stringify(SNIPPET_CONFIG, null, 2),
  );
  const results = await pool(
    toCheck,
    CONCURRENCY,
    (block, i) => typeCheck(block, dir, i),
  );
  results.forEach((err, i) => {
    if (err) {
      failures.push(
        `${toCheck[i].file}:${toCheck[i].line}  type check failed\n${err}`,
      );
    }
  });
} finally {
  await Deno.remove(dir, { recursive: true });
}

console.log(
  `checked ${toCheck.length} TypeScript blocks, ${checkedCmds} deno ` +
    `invocations across ${VERIFIED.length} skill(s); skipped ${skipped} ` +
    `file(s) in not-yet-verified skills`,
);

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  Deno.exit(1);
}
console.log("all good");
