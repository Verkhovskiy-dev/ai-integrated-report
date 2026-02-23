#!/bin/bash
# Deploy script that preserves data/ directory on gh-pages
set -e

echo "=== Building project ==="
npx vite build --config vite.config.ghpages.ts

echo "=== Preparing deployment ==="
# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Stash any uncommitted changes
git stash 2>/dev/null || true

# Switch to gh-pages
git checkout gh-pages
git pull origin gh-pages

# Backup data directory (this is the critical part!)
echo "=== Backing up data/ ==="
cp -r data/ /tmp/gh-pages-data-backup/

# Copy new build files (this overwrites everything)
cp -r dist/public/* .

# Restore data directory
echo "=== Restoring data/ ==="
rm -rf data/
cp -r /tmp/gh-pages-data-backup/ data/

# Also ensure .nojekyll and CNAME exist
touch .nojekyll
echo "verkhovskiy.ai" > CNAME

# Commit and push
git add -A
git commit -m "deploy: update build (data preserved)" || echo "No changes to commit"
git push origin gh-pages

# Switch back
git checkout $CURRENT_BRANCH
git stash pop 2>/dev/null || true

echo "=== Deploy complete! Data preserved. ==="
rm -rf /tmp/gh-pages-data-backup/
