# SpendSense — Multi-Contributor Git Workflow (Equally Divided)

This guide divides the project into 5 equal parts so each team member gets an even contribution in the commit history. 
**Note:** `README.md` is already committed to `main`.

---

## 1. Neel Asheshbhai Shah (`feature/database-models`)
**Scope:** Core backend configuration, database connection, and SQLAlchemy models.

```bash
git checkout main
git checkout -b feature/database-models

git config user.name "Neel Asheshbhai Shah"
git config user.email "neelasheshbhai.shah@sjsu.edu"

git add .gitignore GIT_COMMIT_GUIDE.md \
        backend/main.py \
        backend/database.py \
        backend/config.py \
        backend/models.py \
        backend/schemas.py \
        backend/requirements.txt \
        remove_emojis.py

git commit -m "feat(backend): initialize project, database connection, and ORM models"
git push -u origin feature/database-models
```

---

## 2. Jahnavi Vemagal (`feature/api-routes`)
**Scope:** Backend authentication, API routes (transactions, goals, AI), and migrations.

```bash
git checkout main
git checkout -b feature/api-routes

git config user.name "Jahnavi Vemagal"
git config user.email "jahnavivs25@gmail.com"

git add backend/auth.py \
        backend/routes/ \
        backend/migrate.py

git commit -m "feat(backend): implement authentication, API routes, and migrations"
git push -u origin feature/api-routes
```

---

## 3. Sreya atluri (`feature/frontend-core`)
**Scope:** Frontend configuration (package.json, tailwind), global styles, and state management (Zustand).

```bash
git checkout main
git checkout -b feature/frontend-core

git config user.name "Sreya atluri"
git config user.email "sreya.atluri@sjsu.edu"

# Adds root configuration files + base app files + lib/store
git add frontend/*.* \
        frontend/src/app/globals.css \
        frontend/src/app/layout.tsx \
        frontend/src/app/page.tsx \
        frontend/src/lib/ \
        frontend/src/store/

git commit -m "feat(frontend): setup Next.js config, design system, and state management"
git push -u origin feature/frontend-core
```

---

## 4. Venkat Bhaskara (`feature/auth-and-layout`)
**Scope:** Authentication UI (Login/Register), Shared UI Components, and the Dashboard Shell.

```bash
git checkout main
git checkout -b feature/auth-and-layout

git config user.name "Venkat Bhaskara"
git config user.email "sreya.atluri@sjsu.edu"

git add frontend/src/app/login/ \
        frontend/src/app/register/ \
        frontend/src/app/dashboard/layout.tsx \
        frontend/src/app/dashboard/page.tsx \
        frontend/src/components/

git commit -m "feat(frontend): authentication UI, shared components, and dashboard layout"
git push -u origin feature/auth-and-layout
```

---

## 5. Chanakya vejandala (`feature/dashboard-modules`)
**Scope:** All individual dashboard feature pages (Analytics, AI, Transactions, etc.).

```bash
git checkout main
git checkout -b feature/dashboard-modules

git config user.name "Chanakya vejandala"
git config user.email "chanukya246@gmail.com"

git add frontend/src/app/dashboard/transactions/ \
        frontend/src/app/dashboard/analytics/ \
        frontend/src/app/dashboard/budgets/ \
        frontend/src/app/dashboard/goals/ \
        frontend/src/app/dashboard/ai/ \
        frontend/src/app/dashboard/chat/ \
        frontend/src/app/dashboard/import/ \
        frontend/src/app/dashboard/settings/

git commit -m "feat(frontend): implement dashboard sub-modules for AI, transactions, and analytics"
git push -u origin feature/dashboard-modules
```

---

## Merging to Main

Once all branches are pushed to GitHub, you should merge them into `main`. You can either do this via Pull Requests on GitHub, or locally using the commands below:

```bash
# Ensure you are on main and up to date
git checkout main

# Merge all branches (use --no-ff to preserve branch commit history)
git merge origin/feature/database-models --no-ff -m "merge: core database models"
git merge origin/feature/api-routes --no-ff -m "merge: API routes"
git merge origin/feature/frontend-core --no-ff -m "merge: frontend core"
git merge origin/feature/auth-and-layout --no-ff -m "merge: auth and layout"
git merge origin/feature/dashboard-modules --no-ff -m "merge: dashboard modules"

# Push the merged main branch to GitHub
git push origin main
```

*(Optional) Cleanup leftover untracked files:*
If there are any straggler files left when you run `git status`, you can simply add them in a final cleanup commit.
