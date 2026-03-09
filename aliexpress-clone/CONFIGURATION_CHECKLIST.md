# Configuration Checklist - Neon + Auth0 + Cloudinary

Complete the following steps to fully configure your application:

## 1. Environment Variables Setup

### Step 1.1: Get Your Credentials

**From Neon Dashboard:**
- Go to https://console.neon.tech
- Select your project
- Click "Connection string" → Copy the full PostgreSQL URL
- Paste into `DATABASE_URL` in your `.env.local`

**From Auth0 Dashboard:**
- Go to https://manage.auth0.com
- Navigate to Applications > Your App > Settings
- Copy these values to `.env.local`:
  - `AUTH0_CLIENT_ID` → Client ID
  - `AUTH0_CLIENT_SECRET` → Client Secret
  - `AUTH0_ISSUER_BASE_URL` → Domain (format: `https://your-domain.auth0.com`)
  - `AUTH0_BASE_URL` → `http://localhost:3000` (dev) or your production URL

**From Cloudinary Dashboard:**
- Go to https://cloudinary.com/console/settings
- Copy to `.env.local`:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` → Cloud name
  - `CLOUDINARY_API_KEY` → API Key
  - `CLOUDINARY_API_SECRET` → API Secret

### Step 1.2: Create `.env.local` File

```bash
# .env.local (do NOT commit this file)

# DATABASE - NEON
DATABASE_URL=postgresql://user:password@region.neon.tech:5432/nextsells

# AUTHENTICATION - AUTH0
AUTH0_SECRET=your-generated-secret-key
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# NEXTAUTH_SECRET if still using NextAuth (optional)
NEXTAUTH_SECRET=your-nextauth-secret

# CLOUDINARY - IMAGE STORAGE
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# APPLICATION
APP_URL=http://localhost:3000
NODE_ENV=development

# ADMIN
ADMIN_EMAIL=admin@nextsells.com
```

## 2. Dependency Installation

- [ ] Run `npm install` to install dependencies
- [ ] Verify no Prisma packages are installed: `npm list | grep prisma` (should show nothing)

## 3. Database Setup

- [ ] Create initialization script: Copy code below to `scripts/init-db.js`
- [ ] Run: `node scripts/init-db.js`
- [ ] Verify success message

### `scripts/init-db.js`:
```javascript
require('dotenv').config();
const { initializeDatabase } = require('./lib/db');

initializeDatabase()
  .then(() => {
    console.log('✅ Database initialized successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
```

## 4. Auth0 Configuration

### Step 4.1: Configure Callback URLs

In Auth0 Dashboard > Applications > Settings:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback, 
https://yourdomain.com/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000, 
https://yourdomain.com
```

**Allowed Web Origins:**
```
http://localhost:3000, 
https://yourdomain.com
```

- [ ] Add all callback URLs
- [ ] Save changes

### Step 4.2: Test Auth0 Login

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/api/auth/login
3. You should be redirected to Auth0 login
4. After login, you should return to your app
5. Check user session is working

## 5. Cloudinary Verification

- [ ] Try uploading an image through your app
- [ ] Verify image appears in Cloudinary dashboard
- [ ] Check `CLOUDINARY_API_SECRET` is used only on server side

## 6. API Route Migration

For each API route file listed in MIGRATION_GUIDE.md:

### Replace Prisma Imports
```typescript
// Remove
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Add
import { db, query } from '@/lib/db';
```

### Replace Prisma Calls
See EXAMPLE_MIGRATION_ROUTE.ts for examples

- [ ] Update seller registration routes (5 step files)
- [ ] Update buyer endpoints
- [ ] Update admin endpoints
- [ ] Update user profile endpoints

## 7. Testing

### Test Database Connection
```bash
curl -X GET http://localhost:3000/api/test/db
```

### Test Auth0
- [ ] Login works
- [ ] Session persists
- [ ] Logout works
- [ ] Protected routes work

### Test Cloudinary
- [ ] Upload logo works
- [ ] Upload document works
- [ ] Upload product image works

## 8. Cleanup (Optional)

Once everything is working:

- [ ] Delete `prisma/` directory
- [ ] Delete `prisma.config.ts`
- [ ] Delete old `lib/prisma.ts` (backup first)
- [ ] Delete old auth files (if using Auth0 only)
- [ ] Verify app still works

## 9. Production Deployment

- [ ] Set environment variables in production dashboard/hosting
- [ ] Update Auth0 callback URLs to production domain
- [ ] Test on staging environment first
- [ ] Run database initialization on production (if needed)

## 10. Monitoring

- [ ] Check Neon connection logs
- [ ] Monitor Auth0 usage dashboard
- [ ] Track Cloudinary usage
- [ ] Set up error logging/monitoring

---

## Quick Commands

```bash
# Install dependencies
npm install

# Initialize database
node scripts/init-db.js

# Start dev server
npm run dev

# Test database connection
npm run test:db

# Check Prisma packages (should return empty)
npm list | grep prisma
```

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/lib/prisma'"
**Solution:** Update import to `import { db } from '@/lib/db'`

### Issue: "Database connection timeout"
**Solution:** Verify DATABASE_URL is correct in .env.local

### Issue: "Auth0 login redirects to error page"
**Solution:** Check callback URLs in Auth0 dashboard match your app URL

### Issue: "Cloudinary upload fails"
**Solution:** Verify all three keys are correct in .env.local

---

## Need Help?

1. Check MIGRATION_GUIDE.md for detailed migration instructions
2. Review EXAMPLE_MIGRATION_ROUTE.ts for code examples
3. Check console logs for specific error messages
4. Verify all environment variables are set correctly

---

**Status:** Configuration Started ✏️
**Last Updated:** February 24, 2026
