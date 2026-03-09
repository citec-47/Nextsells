# Quick Start - Neon + Auth0 + Cloudinary Setup

**Updated:** February 24, 2026

---

## ✅ What's Already Done

Your project has been configured to use:
- ✅ **Neon Database** - PostgreSQL cloud database
- ✅ **Auth0** - Enterprise-grade authentication
- ✅ **Cloudinary** - Cloud image storage

All Prisma-related code has been removed.

---

## 🚀 Get Started in 5 Steps

### Step 1: Set Environment Variables

**Choose one:**

**Option A - Interactive Setup (Recommended)**

Windows:
```bash
setup.bat
```

macOS/Linux:
```bash
bash setup.sh
```

**Option B - Manual Setup**

Create `.env.local` file with your credentials from:
- Neon Dashboard (DATABASE_URL)
- Auth0 Dashboard (CLIENT_ID, CLIENT_SECRET, etc.)
- Cloudinary Dashboard (API Keys)

Example:
```
DATABASE_URL=postgresql://user:pass@neon.tech:5432/nextsells
AUTH0_CLIENT_ID=your_id
AUTH0_CLIENT_SECRET=your_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Initialize Database

```bash
node scripts/init-db.js
```

Expected output:
```
✅ Database initialized successfully
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 5: Test the Setup

- [ ] Navigate to login page
- [ ] Click "Login with Auth0"
- [ ] Complete Auth0 login
- [ ] You should be logged in to your app

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `lib/db.ts` | Database connection & helpers |
| `lib/auth/auth.ts` | Auth0 configuration |
| `app/api/auth/[auth0]/route.ts` | Auth0 callback handler |
| `lib/cloudinary.ts` | Image upload configuration |
| `.env.example` | Template for environment variables |
| `MIGRATION_GUIDE.md` | Detailed migration instructions |
| `CONFIGURATION_CHECKLIST.md` | Full setup checklist |

---

## 🔍 Verify Installation

Run these commands to verify everything is set up:

```bash
# Check dependencies
npm list pg cloudinary @auth0/nextjs-auth0

# Verify no Prisma packages
npm list | grep prisma  # Should show nothing

# Test database connection
node -e "require('dotenv').config(); const { query } = require('./lib/db'); query('SELECT NOW()').then(r => console.log('✅ DB Connected:', r.rows[0].now))"

# Check Auth0 configuration
node -e "require('dotenv').config(); console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID ? '✅ Set' : '❌ Missing')"
```

---

## 🎯 Next: Update Your API Routes

All your existing API routes need to be updated. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed instructions.

Example files to update:
- `app/api/seller/register/step-1/route.ts`
- `app/api/seller/register/step-2/route.ts`
- `app/api/buyer/products.ts`
- `app/api/admin/sellers/[id]/approve.ts`
- And others (see MIGRATION_GUIDE.md for full list)

---

## 🐛 Troubleshooting

### "Cannot find module '@/lib/prisma'"
→ Update import to `import { db } from '@/lib/db'`

### "Database connection failed"
→ Check DATABASE_URL is correct in .env.local

### "Auth0 login not working"
→ Verify CLIENT_ID and CLIENT_SECRET in .env.local

---

## 📚 Documentation

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Complete migration instructions
- [CONFIGURATION_CHECKLIST.md](CONFIGURATION_CHECKLIST.md) - Detailed checklist
- [EXAMPLE_MIGRATION_ROUTE.ts](EXAMPLE_MIGRATION_ROUTE.ts) - Code example
- [.env.example](.env.example) - Environment template

---

## 💡 Tips

1. **Always backup** before making changes
2. **Test authentication** first
3. **Migrate API routes** one by one
4. **Never commit** .env.local
5. **Use the same email** for Auth0 that you use in your database

---

**Ready? Start with Step 1 above! 👆**
