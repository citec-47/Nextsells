#!/bin/bash

# Nextsells Configuration Setup Script
# This script helps configure your environment variables

echo "🚀 Nextsells Configuration Setup"
echo "=================================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env.local creation"
        exit 1
    fi
fi

# Create .env.local with prompts
echo "📝 Enter your configuration details:"
echo ""

read -p "Neon Database URL (postgresql://...): " DATABASE_URL
read -p "Auth0 Client ID: " AUTH0_CLIENT_ID
read -p "Auth0 Client Secret: " AUTH0_CLIENT_SECRET
read -p "Auth0 Issuer Base URL (https://your-domain.auth0.com): " AUTH0_ISSUER_BASE_URL
read -p "Auth0 Base URL (http://localhost:3000): " AUTH0_BASE_URL
read -p "Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
read -p "Cloudinary API Key: " CLOUDINARY_API_KEY
read -p "Cloudinary API Secret: " CLOUDINARY_API_SECRET

# Generate secrets
AUTH0_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# Create .env.local
cat > .env.local << EOF
# DATABASE - NEON
DATABASE_URL=$DATABASE_URL

# AUTHENTICATION - AUTH0
AUTH0_SECRET=$AUTH0_SECRET
AUTH0_BASE_URL=$AUTH0_BASE_URL
AUTH0_ISSUER_BASE_URL=$AUTH0_ISSUER_BASE_URL
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# CLOUDINARY - IMAGE STORAGE
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET

# APPLICATION
APP_URL=http://localhost:3000
NODE_ENV=development

# ADMIN CONFIGURATION
ADMIN_EMAIL=admin@nextsells.com
EOF

echo ""
echo "✅ .env.local created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm install"
echo "2. Run: node scripts/init-db.js (to initialize database)"
echo "3. Run: npm run dev (to start development server)"
echo ""
echo "⚠️  IMPORTANT: Never commit .env.local to version control!"
echo "   Make sure it's in .gitignore"
echo ""
