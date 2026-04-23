# git-sweep

> CLI tool to clean up merged branches and stale remotes across multiple repositories

## Installation

```bash
npm install -g git-sweep
```

## Usage

Run `git-sweep` from any directory containing one or more git repositories:

```bash
# Scan current directory for repos and preview cleanup
git-sweep scan

# Delete merged branches across all repos
git-sweep clean --merged

# Prune stale remote-tracking references
git-sweep clean --remotes

# Target a specific directory
git-sweep clean --dir ~/projects --merged --remotes
```

**Options**

| Flag | Description |
|------|-------------|
| `--merged` | Remove branches already merged into main/master |
| `--remotes` | Prune stale remote-tracking references |
| `--dir <path>` | Root directory to search for repositories |
| `--dry-run` | Preview changes without deleting anything |
| `--depth <n>` | How many levels deep to search (default: `2`) |

**Example output**

```
Found 6 repositories in ~/projects

  my-app        removed: feature/login, fix/typo  (2 branches)
  api-service   removed: chore/cleanup             (1 branch)
  ui-lib        nothing to clean

Done. Removed 3 branches across 2 repositories.
```

## Requirements

- Node.js 18+
- Git 2.20+

## License

[MIT](LICENSE)