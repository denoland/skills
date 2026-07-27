/**
 * Verifies the code in the skills against the installed Deno.
 *
 *   deno task verify
 *
 * Two checks:
 *
 * 1. Every fenced `ts` / `tsx` block type-checks. Blocks that are deliberate
 *    fragments or illustrate another runtime are opted out by adding `no-check`
 *    to the info string: ```ts no-check
 * 2. Every `deno <subcommand>` appearing in a fenced `bash`/`sh` block is a real
 *    subcommand of the installed Deno.
 *
 * @module
 */

import { walk } from "@std/fs/walk";
import { globToRegExp } from "@std/path/glob-to-regexp";

interface Block {
  file: string;
  line: number;
  lang: string;
  info: string;
  body: string;
}

/** Extract fenced code blocks, tracking the line each one starts on. */
function extractBlocks(file: string, text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let open:
    | { line: number; lang: string; info: string; body: string[] }
    | null = null;

  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^```(\S*)(.*)$/);
    if (fence && !open) {
      open = { line: i + 1, lang: fence[1], info: fence[2].trim(), body: [] };
    } else if (lines[i].startsWith("```") && open) {
      blocks.push({ file, ...open, body: open.body.join("\n") });
      open = null;
    } else if (open) {
      open.body.push(lines[i]);
    }
  }
  return blocks;
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

async function typeCheck(block: Block): Promise<string | null> {
  const dir = await Deno.makeTempDir();
  try {
    const ext = block.lang === "tsx" ? "tsx" : "ts";
    const file = `${dir}/snippet.${ext}`;
    await Deno.writeTextFile(file, block.body);
    const { success, stderr } = await new Deno.Command(Deno.execPath(), {
      args: ["check", "--no-lock", file],
      stderr: "piped",
      stdout: "null",
    }).output();
    if (success) return null;
    return new TextDecoder().decode(stderr).trim().split("\n").slice(0, 4).join(
      "\n",
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/**
 * Skills whose code blocks are verified. Skills not listed here still contain
 * fragments that assume a project context (a Fresh app, a sandbox project) and
 * cannot be checked standalone yet. Add each one here as it is rewritten —
 * the list only ever grows.
 */
const VERIFIED = ["deno", "migrate-to-deno"];

const failures: string[] = [];
let checkedTs = 0;
let checkedCmds = 0;
let skipped = 0;

const skipDirs = globToRegExp("**/{.git,node_modules}/**");
const verified = new RegExp(`^skills[/\\\\](${VERIFIED.join("|")})[/\\\\]`);

for await (
  const entry of walk("skills", { exts: [".md"], includeDirs: false })
) {
  if (skipDirs.test(entry.path)) continue;
  if (!verified.test(entry.path)) {
    skipped++;
    continue;
  }
  const text = await Deno.readTextFile(entry.path);

  for (const block of extractBlocks(entry.path, text)) {
    const where = `${block.file}:${block.line}`;

    if (["ts", "tsx", "typescript"].includes(block.lang)) {
      if (block.info.includes("no-check")) continue;
      checkedTs++;
      const err = await typeCheck(block);
      if (err) failures.push(`${where}  type check failed\n${err}`);
    }

    if (["bash", "sh", "shell"].includes(block.lang)) {
      // `(?![.\w/-])` rejects `deno main.ts` and `deno ./x` — running a file,
      // not invoking a subcommand.
      for (
        const m of block.body.matchAll(/^\s*deno\s+([a-z][a-z-]*)(?![.\w/-])/gm)
      ) {
        checkedCmds++;
        if (!await isSubcommand(m[1])) {
          failures.push(`${where}  not a deno subcommand: \`deno ${m[1]}\``);
        }
      }
    }
  }
}

console.log(
  `checked ${checkedTs} TypeScript blocks, ${checkedCmds} deno invocations ` +
    `across ${VERIFIED.length} skill(s); skipped ${skipped} file(s) in ` +
    `not-yet-verified skills`,
);

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  Deno.exit(1);
}
console.log("all good");
