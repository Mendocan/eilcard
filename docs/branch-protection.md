# Branch protection (`main`)

`main` is protected so changes land through pull requests, code review, and a green CI check.

## Rules on `main`

| Rule | Setting |
|------|---------|
| Pull request required | Yes |
| Approving reviews | 1 |
| Stale review dismissal | Yes |
| Conversation resolution | Required |
| Status check | `typecheck` (GitHub Actions job) |
| Force push | Blocked |
| Branch deletion | Blocked |
| Admin enforcement | Off (admins can bypass in emergencies) |

## Day-to-day workflow

```bash
git checkout -b feature/my-change
# ... edit, commit ...
git push -u origin feature/my-change
gh pr create --fill
# wait for CI typecheck + review
gh pr merge
```

Solo maintainer note: with one reviewer required, either add a second GitHub account as collaborator, or use admin bypass only when necessary.

## Apply or update rules (API)

After `gh auth login` or with a `repo` admin token:

```bash
# Git Bash / Linux / macOS
export GITHUB_TOKEN="$(gh auth token)"
node scripts/apply-branch-protection.mjs
```

PowerShell:

```powershell
$env:GITHUB_TOKEN = & "$env:TEMP\gh-cli\bin\gh.exe" auth token
node scripts/apply-branch-protection.mjs
```

## Manual setup (GitHub UI)

1. Repository → **Settings** → **Branches** → **Add branch ruleset** (or classic rule)
2. Branch name pattern: `main`
3. Enable: **Require a pull request before merging** (1 approval)
4. Enable: **Require status checks to pass** → select **typecheck**
5. Enable: **Require conversation resolution**
6. Disable force pushes; disable branch deletion

## CI

Workflow: `.github/workflows/ci.yml` — runs `pnpm typecheck` on every PR and push to `main`.
