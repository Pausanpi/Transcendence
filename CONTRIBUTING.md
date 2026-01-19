# Contributing Guide
.
## Branch Structure

```
main        → Stable, production-ready code (DO NOT push directly)
  └── dev   → Integration branch (DO NOT push directly)
        └── feature/* / fix/* → Your working branches
```

## Workflow

The idea is to have a "main" safe version, a "dev" working version and create branches to work everytime and -
merge them into "dev" once we are done.

### 1. Start new work

Always branch from `dev`:
At the moment main is the default branch so change to dev before starting the new branch.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

There are more ways but this is a simpple way of ensuring the pull and that the new branch is "under" dev -
(technically there is no under but you know)

### 2. Make your changes

Work on your branch, commit often:

```bash
git add .
git commit -m "descriptive message"
```

Remember that not every commit needs a push, you can keep working with commit to stablis points and then push when you are done


### 3. Push your branch

```bash
git push -u origin feature/your-feature-name
```

### 4. Create a Pull Request

Once you have pushed you will have to get into github and request review.
This request will be put by default in "main", change it to "dev"

1. Go to GitHub → Pull Requests → New Pull Request
2. Set **base:** `dev` ← **compare:** `your-branch`
3. Add a clear title and description
4. Request a reviewer

You will have to actively request a reviewe in the side menu. You can select as many as you want,
you will need 1 review for dev and 2 for main.

### 5. After approval

Once approved, click "Merge pull request" on GitHub.

### 6. Cleaning

Once done you can continue using your branch to work.
You can also delete it and create a new one if you are using a more strict naming convention.
Try to delete branches that are not being used anymore.

**Important:** Local and remote branches are separate. You need to delete both if the branch exists in both places.

Delete your local branch:

```bash
git branch -d feature/your-feature-name
```

If the branch hasn't been merged and you want to force delete:

```bash
git branch -D feature/your-feature-name
```

Delete the remote branch (on GitHub):

```bash
git push origin --delete feature/your-feature-name
```

To delete both local and remote in one go:

```bash
git branch -d feature/your-feature-name && git push origin --delete feature/your-feature-name
```

Clean up references to deleted remote branches:

```bash
git fetch --prune
```



### 7. Syncing with `dev` and Resolving Conflicts

Before pushing or opening a Pull Request, always update your branch with the latest changes from `dev`. This keeps the codebase clean and avoids merge issues later.

**Steps:**

1. **Update your local `dev` branch:**
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. **Switch back to your working branch:**
   ```bash
   git checkout feature/your-feature
   ```
3. **Integrate changes from `dev`:**
   - To **merge**:
     ```bash
     git merge dev
     ```
   - To **rebase** (recommended for a cleaner history):
     ```bash
     git rebase dev
     ```
4. **Resolve any conflicts:**
   - Git will mark files with conflicts. Open each conflicted file and decide which changes to keep.
   - To keep your version of a file:
     ```bash
     git checkout --ours path/to/file
     ```
   - To keep the version from `dev`:
     ```bash
     git checkout --theirs path/to/file
     ```
   - After resolving, add the files:
     ```bash
     git add path/to/file
     ```
   - For **merge**: commit the resolution:
     ```bash
     git commit
     ```
   - For **rebase**: continue the rebase:
     ```bash
     git rebase --continue
     ```
5. **Push your updated branch:**
   ```bash
   git push origin feature/your-feature
   ```

> **Tip:** Use `git status` to see which files need attention during a conflict. Repeat the conflict resolution steps for each file as needed.

This process is required by our workflow to keep the codebase healthy and avoid merge issues in Pull Requests.



---

## Branch Naming Convention

We have been using "feature/your-feature" but branches can be called however we want.

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

If `dev` has new commits while you're working
You will have to update your branch before pushing to ensure that no work is lost
There are more than one ways to do this:

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


EN GENERAL
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
# ... work, commit ...
git push -u origin feature/my-feature
# → Create PR on GitHub → Get review → Merge → Delete branch
