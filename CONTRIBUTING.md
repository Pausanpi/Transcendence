# Contributing Guide

## Branch Structure

```
main        → Stable, production-ready code (DO NOT push directly)
  └── dev   → Integration branch (DO NOT push directly)
        └── feature/* / fix/* → Your working branches
```

## Workflow

### 1. Start new work

Always branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 2. Make your changes

Work on your branch, commit often:

```bash
git add .
git commit -m "descriptive message"
```

### 3. Push your branch

```bash
git push -u origin feature/your-feature-name
```

### 4. Create a Pull Request

1. Go to GitHub → Pull Requests → New Pull Request
2. Set **base:** `dev` ← **compare:** `your-branch`
3. Add a clear title and description
4. Request a reviewer

### 5. After approval

Once approved, click "Merge pull request" on GitHub.

---

## Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| New feature | `feature/description` | `feature/user-login` |
| Bug fix | `fix/description` | `fix/login-error` |
| Refactor | `refactor/description` | `refactor/auth-service` |

---

## Rules

- ❌ Never push directly to `main` or `dev`
- ✅ Always create a Pull Request
- ✅ Always get at least 1 approval before merging
- ✅ Always pull latest `dev` before creating a new branch

---

## Syncing your branch with dev

If `dev` has new commits while you're working:

```bash
git checkout dev
git pull origin dev
git checkout feature/your-feature
git rebase dev
```

Or use merge:

```bash
git checkout feature/your-feature
git merge dev
```
