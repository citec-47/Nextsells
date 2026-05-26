# Auth0 Quick Reference

## 🔑 Credentials (Already Configured)
```
Organization: aliexpress
Domain: dev-8ha8nzx35jc1k4tq.us.auth0.com
Client ID: odqviJLjpRqZu0qaVEnKCsaJPLiUIQhd
Client Secret: WVVbVL1Umac7WPrDwPl-uHpBfkjI78X0owafcHP7DG6ioK0VHOdUro4tlxTQvPCF
```

---

## 🎯 Most Used Code Snippets

### 1️⃣ Get User in Component
```tsx
'use client';
import { useAuth0User } from '@/lib/auth/auth0Client';

const { user, isAuthenticated, isLoading } = useAuth0User();
// user.email, user.name, user.picture, user.sub
```

### 2️⃣ Login Link
```tsx
<a href="/api/auth/login">Sign In</a>
```

### 3️⃣ Logout Button
```tsx
<a href="/api/auth/logout">Sign Out</a>
```

### 4️⃣ Protected API Route
```tsx
import { withApiAuthRequired } from '@/lib/auth/auth0Server';

export const GET = withApiAuthRequired(async (req) => {
  // Your code here - automatic 401 if not authenticated
});
```

### 5️⃣ Get User in API (Server-Side)
```tsx
import { getAuth0Session } from '@/lib/auth/auth0Server';

const session = await getAuth0Session();
const userId = session.user.sub;
const email = session.user.email;
```

---

## 🔗 URL Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/login` | Start login flow |
| `/api/auth/logout` | Logout & clear session |
| `/api/auth/callback` | Auth0 callback (automatic) |

---

## 🛡️ Protected Routes (Automatic)

Routes that require authentication (redirects to login if unauthenticated):
- `/admin/*`
- `/seller/*`
- `/seller/dashboard/*`
- `/seller/onboarding/*`
- `/seller/products/*`

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `.env.local` | Auth0 credentials |
| `lib/auth/auth0Client.ts` | Client-side hooks |
| `lib/auth/auth0Server.ts` | Server-side utilities |
| `app/api/auth/[...auth0]/route.ts` | Auth handler |
| `middleware.ts` | Route protection |

---

## 💾 User Data Available

```typescript
// All available user fields from Auth0
user.sub                 // Unique ID (e.g., "auth0|...")
user.email              // Email address
user.email_verified     // boolean
user.name               // Display name
user.picture            // Avatar URL (if set)
user.nickname           // Nickname (if set)
user.updated_at         // Last update timestamp
```

---

## ✅ Common Tasks

### Show Different UI for Logged-In Users
```tsx
const { isAuthenticated } = useAuth0User();

return isAuthenticated ? <Dashboard /> : <LandingPage />;
```

### Redirect Unauthenticated Users
```tsx
'use client';
import { useRouter } from 'next/navigation';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { useEffect } from 'react';

export function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth0User();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/api/auth/login');
    }
  }, [isAuthenticated, isLoading]);
}
```

### Make Authenticated API Calls
```tsx
// Client side
const response = await fetch('/api/user/profile');
const user = await response.json();
```

### Store Auth0 User in Database
```tsx
// On first login (in API route)
const session = await getAuth0Session();
const existingUser = await db.user.findUnique({
  where: { auth0Id: session.user.sub }
});

if (!existingUser) {
  await db.user.create({
    data: {
      auth0Id: session.user.sub,
      email: session.user.email,
      name: session.user.name,
    }
  });
}
```

---

## 🔐 Role-Based Access (Advanced)

### Check Role in API
```tsx
const hasAdminRole = await hasAuth0Role('admin');
if (!hasAdminRole) return new Response('Forbidden', { status: 403 });
```

### Set Up Roles in Auth0 Dashboard
1. Go to Auth0 → Rules
2. Create rule to add roles claim
3. Access via `hasAuth0Role()` function

---

## 🧪 Test Commands

```bash
# Test if Auth0 is working
curl http://localhost:3000/api/auth/me

# Test login redirect
curl -L http://localhost:3000/api/auth/login

# Test protected route
curl -b "appSession=YOUR_SESSION_COOKIE" http://localhost:3000/api/profile
```

---

## 🐛 Debug Mode

Enable logging in components:
```tsx
const { user, isLoading, error } = useAuth0User();

useEffect(() => {
  console.log('Auth State:', { user, isLoading, error });
}, [user, isLoading, error]);
```

---

## ⚙️ When to Use What

| Scenario | Use This |
|----------|----------|
| Show "Sign In" button | `<a href="/api/auth/login">` |
| Show user name in navbar | `useAuth0User().user?.name` |
| Protect page content | `withApiAuthRequired()` |
| Check if logged in | `useAuth0User().isAuthenticated` |
| Get user ID for database | `getAuth0UserId()` (server) |
| Show logout button | `<a href="/api/auth/logout">` |

---

## 📱 Example: Complete Login/Logout Component

```tsx
'use client';
import { useAuth0User, getLoginUrl, getLogoutUrl } from '@/lib/auth/auth0Client';

export function AuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuth0User();
  
  if (isLoading) return <span>Loading...</span>;
  
  if (isAuthenticated) {
    return (
      <div>
        <span>Hi, {user?.name}</span>
        <a href="/api/auth/logout">Log out</a>
      </div>
    );
  }
  
  return (
    <div>
      <a href="/api/auth/login">Sign In</a>
      <a href="/api/auth/login?screen_hint=signup">Sign Up</a>
    </div>
  );
}
```

---

## 🔗 Useful Links

- Auth0 Dashboard: https://manage.auth0.com
- App Settings: https://manage.auth0.com/dashboard/us/dev-8ha8nzx35jc1k4tq/applications/odqviJLjpRqZu0qaVEnKCsaJPLiUIQhd/settings
- SDK Docs: https://auth0.com/docs/quickstart/webapp/nextjs

---

**Last Updated**: 2026-02-25
**Status**: ✅ Ready to Use
