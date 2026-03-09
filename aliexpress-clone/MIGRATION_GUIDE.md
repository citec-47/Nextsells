# Nextsells Configuration Migration Guide
## From Prisma to Neon + Auth0 + Cloudinary

**Date:** February 24, 2026

---

## Overview

This guide documents the transition from Prisma with SQLite to:
- **Neon Database** - PostgreSQL database
- **Auth0** - Authentication service
- **Cloudinary** - Image storage

---

## ✅ What Has Been Updated

### 1. **Environment Configuration** (`.env.example`)
- Updated with Neon database connection string format
- Added Auth0 configuration variables
- Cloudinary API keys configuration
- Removed JWT configuration (now handled by Auth0)

### 2. **Package Dependencies** (`package.json`)
Removed:
- `@prisma/client`
- `prisma`
- `@auth/prisma-adapter`
- `@prisma/adapter-pg`
- `@prisma/adapter-better-sqlite3`
- `better-sqlite3`
- `next-auth` (beta version)

Kept:
- `@auth0/nextjs-auth0` - Auth0 integration
- `pg` - PostgreSQL client for Neon
- `cloudinary` - Image uploads
- All other dependencies

### 3. **Database Module** (`lib/db.ts`)
New file created with:
- PostgreSQL connection pool configuration
- Database helper functions
- Schema initialization script (run once to create tables)
- Common query helpers

### 4. **Authentication** (`lib/auth/auth.ts`)
Updated to use Auth0 instead of NextAuth + Credentials

### 5. **Auth0 Callback Route** (`app/api/auth/[auth0]/route.ts`)
Created to handle Auth0 authentication flow

---

## 🚀 Setup Instructions

### Step 1: Update Environment Variables

Copy your configuration from the Auth0 management dashboard:

```bash
# From Auth0 dashboard - Applications > My App > Settings
AUTH0_SECRET=<your-auth0-secret>
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
AUTH0_ISSUER_BASE_URL=https://<your-domain>.auth0.com
AUTH0_BASE_URL=http://localhost:3000

# From Neon dashboard - Connection string
DATABASE_URL=postgresql://user:password@neon.tech:5432/nextsells

# From Cloudinary dashboard - API Keys
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

**File:** `.env.local` (for development) or set in production environment

### Step 2: Install Dependencies

```bash
npm install
```

Since Prisma dependencies have been removed, you may need to:

```bash
npm uninstall @prisma/client prisma
npm install pg
```

### Step 3: Initialize Neon Database

Run the database initialization script to create all tables:

```bash
# Create a Node script to initialize the database
node -e "
const { initializeDatabase } = require('./lib/db');
initializeDatabase().then(() => {
  console.log('Database initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});"
```

Or create a script file `scripts/init-db.js`:

```javascript
const { initializeDatabase } = require('../lib/db');

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

Then run:
```bash
node scripts/init-db.js
```

### Step 4: Update API Routes

All API routes that use `prisma` need to be updated to use the new `db` module from `lib/db.ts`:

**Before (Prisma):**
```typescript
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});
```

**After (Neon):**
```typescript
import { db, query } from '@/lib/db';

// Using helper functions
const user = await db.getUserByEmail('user@example.com');

// Or raw queries
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
const user = result.rows[0];
```

### Step 5: Update Authentication Flow

#### Old (NextAuth + Credentials):
- Login endpoint at `/api/auth/login`
- Session via JWT tokens
- Custom password management

#### New (Auth0):
- Login via `/api/auth/login` (Auth0 redirects)
- Universal login page at Auth0 domain
- Session via Auth0

**Update Login Links:**
```typescript
// Before
<Link href="/api/auth/signin">Login</Link>

// After (Auth0)
<Link href="/api/auth/login">Login with Auth0</Link>
```

**Getting User Session:**
```typescript
import { getSession } from '@auth0/nextjs-auth0';

export async function GET() {
  const session = await getSession();
  
  if (session) {
    const user = session.user;
    // user.sub = Auth0 user ID (use this as reference)
    // user.email = user email
    // user.name = user name
    // user.picture = avatar (if provided)
  }
}
```

### Step 6: Update Cloudinary Configuration

The cloudinary setup is already in place (`lib/cloudinary.ts`). Ensure your `.env.local` has:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📝 Migration Checklist

- [ ] Copy `.env.example` to `.env.local` and update with your actual values
- [ ] Run `npm install` to install new dependencies
- [ ] Run database initialization script to create tables in Neon
- [ ] Update all API routes that import from `@/lib/prisma` to use `@/lib/db`
- [ ] Test Auth0 login flow
- [ ] Test Neon database queries
- [ ] Test Cloudinary image uploads
- [ ] Remove Prisma files (if no longer needed):
  - `prisma/` directory
  - `prisma.config.ts`
  - `next-env.d.ts` updates

---

## 🔄 API Routes to Update

The following files use Prisma and need updating:

### Authentication
- `app/api/auth/login.ts` - Update to work with Auth0
- `app/api/auth/register.ts` - New user registration
- `app/api/auth/verify/identity.ts` - User verification

### Seller Management
- `app/api/seller/register/step-1/route.ts`
- `app/api/seller/register/step-2/route.ts`
- `app/api/seller/register/step-3/route.ts`
- `app/api/seller/register/step-4.ts`
- `app/api/seller/register/step-5.ts`
- `app/api/seller/products.ts`
- `app/api/seller/onboarding.ts`
- `app/api/seller/stats.ts`

### Buyer Management
- `app/api/buyer/products.ts`
- `app/api/buyer/orders.ts`

### Admin Management
- `app/api/admin/sellers/[id]/approve.ts`
- `app/api/admin/sellers/[id]/reject.ts`
- `app/api/admin/seller-approvals/[id]/approve.ts`
- `app/api/admin/stats.ts`

### User Management
- `app/api/user/profile.ts`

---

## 📊 Database Schema

The new schema includes these tables:

### Users
```sql
users (
  id, auth0_id, email, name, role, avatar_url, 
  is_blocked, created_at, updated_at
)
```

### Seller Profiles
```sql
seller_profiles (
  id, user_id, company_name, description, phone, 
  country, logo_url, onboarding_status, approval_date, 
  rejection_reason, created_at, updated_at
)
```

### Products
```sql
products (
  id, seller_id, name, description, price, quantity, 
  category, image_urls, rating, num_reviews, 
  created_at, updated_at
)
```

### Orders
```sql
orders (
  id, buyer_id, product_id, quantity, total_price, 
  status, created_at, updated_at
)
```

### Seller Documents
```sql
seller_documents (
  id, seller_id, document_type, document_url, status, 
  created_at, updated_at
)
```

### Approval Requests
```sql
approval_requests (
  id, seller_id, status, submitted_at, reviewed_at, 
  reviewed_by, notes
)
```

---

## 🐛 Troubleshooting

### Connection Timeout
**Error:** `Error: Client request timeout`

**Solution:** 
- Check Neon connection string is correct
- Verify firewall/network allows connections
- Ensure DATABASE_URL is set in `.env.local`

### Auth0 Login Not Working
**Solution:**
- Verify AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET in Auth0 dashboard
- Confirm allowed callback URLs include `http://localhost:3000/api/auth/callback`
- Check Allowed Logout URLs

### Cloudinary Upload Fails
**Solution:**
- Verify API keys in dashboard
- Check `CLOUDINARY_API_SECRET` is correct (not public key)
- Ensure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly

---

## 🔐 Security Notes

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Auth0 Secrets** - Use strong, unique secrets in production
3. **Neon Connection String** - Contains password, keep private
4. **Cloudinary Secret** - Only use on server-side routes

---

## 📚 Resources

- [Neon Documentation](https://neon.tech/docs)
- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0)
- [Cloudinary Node SDK](https://cloudinary.com/documentation/node_integration)
- [PostgreSQL Node.js Client](https://node-postgres.com/)

---

## Next Steps

1. Complete the setup instructions above
2. Update API routes one by one
3. Test each feature thoroughly
4. Deploy to production with proper environment variables

---

**Questions?** Refer to the integrated documentation in the codebase or the external resources above.
