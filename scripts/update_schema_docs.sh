#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/.."

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Ensure required commands are available
if ! command_exists supabase; then
  echo "❌ Supabase CLI is not installed. Please install it first."
  exit 1
fi

if ! command_exists node; then
  echo "❌ Node.js is not installed. Please install it first."
  exit 1
fi

# Update schema definitions
echo "🔄 Updating schema definitions..."
node "$DIR/update_schema_docs.js"

# Add git hooks if .git directory exists
if [ -d "$PROJECT_ROOT/.git" ]; then
  HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
  
  # Create post-merge hook to update schema after pulls
  echo "📝 Creating git hooks..."
  cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/bash

# Check if any migration files were changed
MIGRATION_CHANGES=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep "supabase/migrations/")

if [ -n "$MIGRATION_CHANGES" ]; then
  echo "🔄 Migration changes detected, updating schema definitions..."
  npm run update-schema
fi
EOF

  # Create pre-commit hook to ensure schema is up to date
  cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

# Store the schema file state before update
SCHEMA_BEFORE=$(cat schema_definitions.json)

# Update schema
npm run update-schema

# Compare schema states
SCHEMA_AFTER=$(cat schema_definitions.json)

if [ "$SCHEMA_BEFORE" != "$SCHEMA_AFTER" ]; then
  echo "❌ Schema definitions are out of date. Please commit the updated schema_definitions.json"
  exit 1
fi
EOF

  # Make hooks executable
  chmod +x "$HOOKS_DIR/post-merge"
  chmod +x "$HOOKS_DIR/pre-commit"
  
  echo "✅ Git hooks created successfully"
fi

echo "✅ Schema documentation update system setup complete"
