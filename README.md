# Deno Development Skills

Modern Deno development knowledge for AI coding assistants. These skills teach
your AI assistant how to build Deno applications using current best practices.

## Skills

| Skill               | Description                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| **deno**            | Core skill: dependency management, permissions, `deno.json`, the built-in toolchain, publishing |
| **migrate-to-deno** | Moving a Node, npm, Yarn, pnpm, or Bun project to Deno                                          |
| **deno-deploy**     | Deployment workflows for Deno Deploy                                                            |
| **deno-frontend**   | Fresh framework, Preact components, Tailwind CSS                                                |
| **deno-sandbox**    | Safe code execution with @deno/sandbox                                                          |

Targets Deno 2.9+.

### Changed in 2.0

`deno-guidance`, `deno-expert`, and `deno-project-templates` have been merged
into the single **deno** skill. Their content overlapped heavily, and project
scaffolding is now handled by `deno init` rather than by pasted templates. If
you installed any of the three individually, install `deno` instead.

## Key Principles

1. **Deno works like npm and bun** - `deno install` reads `package.json`,
   `deno add express` installs from npm, `node_modules` and `node:` built-ins
   work. Migration is not a rewrite.
2. **npm and JSR both work** - use whichever has the package you need; JSR is a
   good default for new Deno-first code and the standard library (`@std/*`).
3. **Built-in tools** - `deno fmt`, `deno lint`, `deno test`, `deno check`
   replace prettier, eslint, jest, and tsc with no dependencies.
4. **Permissions are the real difference** - prefer scoped grants like
   `--allow-net=example.com` over `-A`.

## Versioning

This project uses [Semantic Versioning](https://semver.org/). When contributing
changes:

### When to Bump Versions

| Change Type                       | Version Bump          | Example                                     |
| --------------------------------- | --------------------- | ------------------------------------------- |
| Breaking changes                  | MAJOR (1.0 → 2.0)     | Fundamentally altering how a skill works    |
| New features, significant updates | MINOR (1.1 → 1.2)     | Adding new guidance, updating documentation |
| Typo fixes, small clarifications  | PATCH (1.1.0 → 1.1.1) | Fixing formatting, correcting typos         |

### Files to Update

When making changes, update the appropriate version numbers:

1. **Skill-specific changes** - Update the skill's `version` in its `SKILL.md`
   frontmatter
2. **Plugin releases** - Update `version` in both:
   - `.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`

### For Contributors

- Include version bumps in your PRs when changing skill content
- Use [conventional commits](https://www.conventionalcommits.org/) (e.g.,
  `feat:`, `fix:`, `docs:`) to indicate change type
- When in doubt, bump the MINOR version for content changes

## Installation

These skills follow the
[Agent Skills Specification](https://agentskills.io/specification).

### Claude Code

**Option 1: Install as a plugin**

```bash
# Step 1: Add the marketplace
/plugin marketplace add denoland/skills

# Step 2: Install the plugin
/plugin install deno-skills@denoland-skills
```

**Option 2: `npx skills`**

Works across Claude Code, Cursor, Copilot, and other skills-compatible agents:

```bash
# All skills
npx skills add denoland/skills

# Or just one
npx skills add denoland/skills --skill deno
```

**Option 3: Manual installation**

Copy the skills you want to use:

```bash
# Clone the repository
git clone https://github.com/denoland/skills.git /tmp/deno-skills

# Copy individual skills to your personal skills directory
cp -r /tmp/deno-skills/skills/deno ~/.claude/skills/
cp -r /tmp/deno-skills/skills/deno-deploy ~/.claude/skills/
# ... or copy all skills
cp -r /tmp/deno-skills/skills/* ~/.claude/skills/

# Or for project-specific installation
cp -r /tmp/deno-skills/skills/* .claude/skills/
```

### Cursor

> Note: Agent Skills in Cursor are currently only available in v2.4+.

```bash
# Clone the repository
git clone https://github.com/denoland/skills.git /tmp/deno-skills

# Copy skills to your Cursor skills directory
cp -r /tmp/deno-skills/skills/* ~/.cursor/skills/

# Or for project-specific installation
cp -r /tmp/deno-skills/skills/* .cursor/skills/
```

### VS Code with GitHub Copilot

> Note: Agent Skills require the `chat.useAgentSkills` setting to be enabled
> (currently in preview).

```bash
# Clone the repository
git clone https://github.com/denoland/skills.git /tmp/deno-skills

# Copy skills to your project's skills directory
mkdir -p .github/skills
cp -r /tmp/deno-skills/skills/* .github/skills/

# Or for personal installation
cp -r /tmp/deno-skills/skills/* ~/.copilot/skills/
```

To enable Agent Skills in VS Code:

1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for `chat.useAgentSkills`
3. Enable the setting

### Other Platforms

For other AI coding assistants that support the Agent Skills specification, copy
the skill directories from `skills/` to your platform's skills directory. Check
your platform's documentation for the correct location.

## Usage

Once installed, your AI assistant will automatically apply Deno best practices
when:

- Working in projects with a `deno.json` file
- Creating new Deno applications
- Adding dependencies
- Deploying to Deno Deploy
- Building Fresh web applications
- Running user code in sandboxes

## Documentation Resources

- [Deno Documentation](https://docs.deno.com)
- [Fresh Framework](https://fresh.deno.dev/docs)
- [JSR Package Registry](https://jsr.io)
- [Deno Deploy](https://docs.deno.com/deploy/)
- [Agent Skills Specification](https://agentskills.io/specification)

## License

MIT License - see [LICENSE](LICENSE)
