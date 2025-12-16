#!/usr/bin/env bash
# Script to add .js extensions to all relative imports in TypeScript files
# Required for ESM compatibility in Node.js

echo "Adding .js extensions to imports in src directory..."

# Find all .ts files in src directory
find apps/api/src -name "*.ts" -type f | while read file; do
    echo "Processing: $file"
    
    # Add .js to relative imports that don't already have an extension
    # Matches: from './something' or from '../something'
    # Adds: .js extension
    sed -i '' -E "s|from '(\.\./[^']+)'|from '\1.js'|g" "$file"
    sed -i '' -E "s|from '(\./[^']+)'|from '\1.js'|g" "$file"
    
    # Fix double .js.js if it was already there
    sed -i '' "s|\.js\.js|.js|g" "$file"
done

echo "Done! All .js extensions added."
