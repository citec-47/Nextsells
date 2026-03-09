# Auth0 Integration Guide

## Overview
Your AliExpress clone app is now integrated with Auth0 authentication. This guide explains the setup and how to use all Auth0 features in your application.

## ✅ What's Already Set Up

### 1. **Environment Variables** (`.env.local`)
✓ AUTH0_SECRET - Session signing key
✓ AUTH0_BASE_URL - http://localhost:3000
✓ AUTH0_ISSUER_BASE_URL - https://dev-8ha8nzx35jc1k4tq.us.auth0.com
✓ AUTH0_CLIENT_ID - odqviJLjpRqZu0qaVEnKCsaJPLiUIQhd
✓ AUTH0_CLIENT_SECRET - Your secret key

### 2. **API Routes** (`app/api/auth/[...auth0]/route.ts`)
✓ `/api/auth/login` - Start Auth0 login flow
✓ `/api/auth/logout` - Logout and clear session
✓ `/api/auth/callback` - Auth0 callback handler
✓ `/api/auth/me` - Get current user session

### 3. **Middleware** (`middleware.ts`)
✓ Protected routes: `/admin/*`, `/seller/*`, `/buyer/dashboard/*`
✓ Uses `withMiddlewareAuthRequired` from @auth0/nextjs-auth0/edge

---

## 📚 File Structure

### Core Auth0 Files
```
lib/auth/
├── auth.ts                 # Main Auth0 config (exported functions)
├── auth0Config.ts          # Typed config constants
├── auth0Client.ts          # Client-side hooks and utilities
├── auth0Server.ts          # Server-side utilities
├── jwt.ts                  # JWT verification
├── middleware.ts           # Route protection
└── password.ts             # Password utilities

app/api/auth/
├── [...auth0]/
│   └── route.ts            # Auth0 catch-all route handler
├── callback/               # Auth0 callback redirect
├── login/                  # Login routes
└── logout/                 # Logout routes
```

### Example Components (Ready to Use)
```
app/auth/login/page-auth0.tsx        # Login page example
app/components/auth/LogoutButton.tsx # Logout button component
app/components/common/Navbar-auth0.tsx # Navigation with Auth0
app/profile/page-auth0.tsx           # Protected profile page
app/api/profile/route-auth0.ts       # Protected API endpoint
```

---

## 🚀 Quick Start Guide

### Step 1: Use Login Button
```tsx
// In any component
import Link from 'next/link';

export function LoginLink() {
  return (
    <Link href="/api/auth/login">
      Sign In with Auth0
    </Link>
  );
}
```

### Step 2: Get Current User (Client-Side)
```tsx
'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';

export function UserProfile() {
  const { user, isLoading, isAuthenticated } = useAuth0User();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <h1>Hello, {user?.name}</h1>
          <p>Email: {user?.email}</p>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Step 3: Get Current User (Server-Side)
```tsx
// In an API route or Server Component
import { getAuth0Session, withApiAuthRequired } from '@/lib/auth/auth0Server';

export const GET = withApiAuthRequired(async (req) => {
  const session = await getAuth0Session();
  const userEmail = session?.user.email;
  
  // Your logic here
});
```

### Step 4: Add Logout Button
```tsx
import { LogoutButton } from '@/components/auth/LogoutButton';

export function Header() {
  return (
    <header>
      <LogoutButton>Sign Out</LogoutButton>
    </header>
  );
}
```

---

## 📋 Available Hooks & Utilities

### Client-Side (`@/lib/auth/auth0Client.ts`)

#### `useAuth0User()`
Get current user and authentication status
```tsx
const { user, isLoading, error, isAuthenticated } = useAuth0User();
```
- `user.sub` - Unique user ID
- `user.email` - User email
- `user.name` - User display name
- `user.picture` - Avatar URL
- `user.email_verified` - Email verification status

#### Helper Functions
```tsx
// Get login URL with optional redirect
const url = getLoginUrl('/dashboard');

// Get signup URL
const url = getSignupUrl('/dashboard');

// Get logout URL
const url = getLogoutUrl('/');
```

### Server-Side (`@/lib/auth/auth0Server.ts`)

#### `getAuth0Session()`
```tsx
const session = await getAuth0Session();
if (!session) return unauthorized();
```

#### `withApiAuthRequired()`
```tsx
export const GET = withApiAuthRequired(async (req) => {
  // Protected route - automatically redirects if not authenticated
});
```

#### Helper Functions
```tsx
const userId = await getAuth0UserId();      // Get user.sub
const email = await getAuth0UserEmail();    // Get user.email
const hasRole = await hasAuth0Role('admin'); // Check roles
```

---

## 🔐 Protected Routes

Routes automatically protected by middleware (in `middleware.ts`):
- `/admin/*` - Admin dashboard
- `/seller/*` - Seller routes
- `/seller/dashboard/*` - Seller dashboard
- `/seller/onboarding/*` - Seller onboarding
- `/seller/products/*` - Seller products

If a user tries to access these without Auth0 session, they're automatically redirected to login.

---

## 🛠️ Common Implementation Patterns

### Pattern 1: Conditional Rendering Based on Auth
```tsx
'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';

export function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth0User();
  
  if (isLoading) return <Loading />;
  
  if (!isAuthenticated) {
    return <div>Please sign in to access dashboard</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {/* Authenticated content */}
    </div>
  );
}
```

### Pattern 2: Protected API Endpoint
```tsx
// app/api/user/dashboard/route.ts
import { withApiAuthRequired } from '@/lib/auth/auth0Server';
import { NextResponse } from 'next/server';
import { getAuth0Session } from '@/lib/auth/auth0Server';

export const GET = withApiAuthRequired(async (req) => {
  const session = await getAuth0Session();
  
  // Fetch user-specific data
  const dashboardData = await fetchUserDashboard(session.user.sub);
  
  return NextResponse.json(dashboardData);
});
```

### Pattern 3: Combine Auth with Database User
```tsx
// Store Auth0 user in your database on first login
import { getAuth0Session } from '@/lib/auth/auth0Server';

export const GET = withApiAuthRequired(async (req) => {
  const session = await getAuth0Session();
  const auth0Id = session.user.sub;
  const email = session.user.email;
  
  // Check if user exists in database
  let user = await db.user.findUnique({ where: { auth0Id } });
  
  if (!user) {
    // Create new user
    user = await db.user.create({
      data: {
        auth0Id,
        email,
        name: session.user.name,
        avatar: session.user.picture,
      },
    });
  }
  
  return NextResponse.json(user);
});
```

---

## 🔧 Custom Configuration

### Update Session Duration
Edit `lib/auth/auth0Config.ts`:
```typescript
session: {
  rollingDuration: 7 * 24 * 60 * 60, // 7 days
  absoluteDuration: 30 * 24 * 60 * 60, // 30 days
}
```

### Add Custom Claims/Roles
1. Go to Auth0 Dashboard
2. Auth Pipeline → Rules → Create new rule
3. Add custom claims to the token

Then access in your code:
```tsx
const roles = (session.user as any)['https://aliexpress-clone/roles'] || [];
```

---

## 📝 Implementation Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Auth0 SDK installed (`@auth0/nextjs-auth0`)
- [ ] API routes configured at `/api/auth/[...auth0]`
- [ ] Middleware configured for protected routes
- [ ] Tested login flow (/api/auth/login)
- [ ] Tested logout flow (/api/auth/logout)
- [ ] User hook working in components (`useAuth0User()`)
- [ ] Protected API routes working (`withApiAuthRequired()`)
- [ ] Database integration for storing Auth0 users
- [ ] Role-based access control (optional)

---

## 🧪 Testing Auth0 Integration

### Test Login
1. Click any "Sign In" link
2. Should redirect to Auth0 login page
3. After login, redirects back to your app
4. User session is now active

### Test Logout
1. Click logout button
2. Should clear Auth0 session
3. Redirects to home page
4. Accessing protected routes shows login page

### Test User Data
```tsx
// In browser console
const response = await fetch('/api/profile');
const data = await response.json();
console.log(data.user); // Should show user info
```

---

## 🚨 Troubleshooting

### "Unauthorized" on protected routes
- Ensure AUTH0_SECRET is set
- Verify AUTH0_CLIENT_ID and CLIENT_SECRET match Auth0 dashboard
- Check AUTH0_ISSUER_BASE_URL configuration

### User session not persisting
- Clear browser cookies
- Check browser DevTools → Application → Cookies
- Verify session cookie is being set

### Redirect loop on login
- Check AUTH0_BASE_URL matches your app URL
- Verify callback URL in Auth0 dashboard settings
- Ensure middleware matcher is correct

### API routes returning 401
- User might not be logged in
- Check if using `withApiAuthRequired()`
- Verify session is being retrieved with `getAuth0Session()`

---

## 📚 Additional Resources

- [Auth0 Next.js SDK Docs](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Auth0 Dashboard](https://manage.auth0.com)
- [@auth0/nextjs-auth0 Repo](https://github.com/auth0/nextjs-auth0)

---

## Next Steps

1. **Replace example files** with your existing pages
   - Copy logic from `page-auth0.tsx` files
   - Use `LogoutButton` component in your navbar
   - Adapt `Navbar-auth0.tsx` to your design

2. **Database Integration**
   - Create `User` table with `auth0Id` field
   - Sync Auth0 users to database on first login

3. **Role-Based Access**
   - Set up roles in Auth0
   - Use middleware to protect routes by role

4. **API Protection**
   - Wrap all private API routes with `withApiAuthRequired()`
   - Integrate with your existing database queries

---

**Status**: ✅ Auth0 Setup Complete
**Environment**: `.env.local` configuration complete
**Ready to use**: All hooks, utilities, and examples provided
