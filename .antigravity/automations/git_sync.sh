#!/bin/bash
# .antigravity/automations/git_sync.sh
# Level 9: The Sleepless Employee (Auto-Backup Agent)

# Resolve Project Root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../../"

cd "$PROJECT_ROOT" || { echo "Critical Error: Cannot find project root"; exit 1; }

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    # Stage all changes
    git add .
    
    # Generate timestamp and count files
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
    FILE_COUNT=$(git diff --cached --numstat | wc -l)
    
    # Commit and Push
    git commit -m "🤖 Auto-Backup: $TIMESTAMP | Modified $FILE_COUNT files"
    git push origin main
    
    echo "Sync successful at $TIMESTAMP"
else
    echo "Working directory clean. No sync needed."
fi
