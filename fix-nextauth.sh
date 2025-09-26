#!/bin/bash

# Fix NextAuth v5 compatibility by updating getServerSession to auth()

echo "Updating NextAuth v5 compatibility..."

# Find all files with getServerSession and update them
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    if grep -q "getServerSession" "$file"; then
        echo "Updating $file..."
        
        # Replace getServerSession import with auth import
        sed -i '' 's/import { getServerSession } from '\''next-auth'\''/import { auth } from '\''@\/lib\/auth'\''/g' "$file"
        
        # Replace authOptions import (remove the line)
        sed -i '' '/import.*authOptions.*from.*@\/lib\/auth/d' "$file"
        
        # Replace usage of getServerSession(authOptions) with auth()
        sed -i '' 's/getServerSession(authOptions)/auth()/g' "$file"
        
        echo "Updated $file"
    fi
done

echo "NextAuth v5 compatibility update complete!"