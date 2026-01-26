# Deno Development Skills

Modern Deno development knowledge for AI coding assistants. These skills teach your AI assistant how to build Deno applications using current best practices.

## Skills

| Skill | Description |
|-------|-------------|
| **deno-guidance** | Core Deno best practices, JSR packages, CLI commands |
| **deno-deploy** | Deployment workflows for Deno Deploy |
| **deno-frontend** | Fresh framework, Preact components, Tailwind CSS |
| **deno-sandbox** | Safe code execution with @deno/sandbox |
| **deno-project-templates** | Project scaffolding templates |
| **deno-expert** | Code review and debugging principles |

## Key Principles

These skills enforce modern Deno practices:

1. **JSR over deno.land/x** - Always use `jsr:` imports; `deno.land/x` is deprecated
2. **npm: as fallback** - Use `npm:` packages when no JSR alternative exists
3. **Built-in tools** - Encourage `deno fmt`, `deno lint`, `deno test`, `deno doc`
4. **Fresh patterns** - Island architecture with small, serializable-prop islands

## Installation

These skills follow the [Agent Skills Specification](https://agentskills.io/specification).

### Claude Code

**Option 1: Install as a plugin**

```bash
/plugin install https://github.com/denoland/skills
```

**Option 2: Manual installation**

Copy the skills you want to use:

```bash
# Clone the repository
git clone https://github.com/denoland/skills.git /tmp/deno-skills

# Copy individual skills to your personal skills directory
cp -r /tmp/deno-skills/skills/deno-guidance ~/.claude/skills/
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

> Note: Agent Skills require the `chat.useAgentSkills` setting to be enabled (currently in preview).

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

For other AI coding assistants that support the Agent Skills specification, copy the skill directories from `skills/` to your platform's skills directory. Check your platform's documentation for the correct location.

## Usage

Once installed, your AI assistant will automatically apply Deno best practices when:

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
