import { parseArgs } from "@std/cli/parse-args";
import { bold, green } from "@std/fmt/colors";

const args = parseArgs(Deno.args, {
  boolean: ["help", "version"],
  alias: { h: "help", v: "version" },
});

if (args.help) {
  console.log(`
${bold("{{PROJECT_NAME}}")} - A Deno CLI tool

${bold("USAGE:")}
  {{PROJECT_NAME}} [OPTIONS]

${bold("OPTIONS:")}
  -h, --help     Show this help message
  -v, --version  Show version
`);
  Deno.exit(0);
}

if (args.version) {
  console.log("{{PROJECT_NAME}} v0.1.0");
  Deno.exit(0);
}

console.log(green("Hello from {{PROJECT_NAME}}"));
