# Role-Based Access Control & Protected Routes Guide

## Overview

This guide covers the implementation of Auth0-based role-based access control (RBAC) with protected routes, profile management, and avatar uploads in the Nextsells application.

## Architecture

### Role Structure

The application uses Auth0 roles with custom claims:
- **Role Claim**: `https://nextsells.example/roles`
- **Supported Roles**:
  - `admin` - Full platform access
  - `seller` - Can list and manage products
  - `buyer` - Can browse and purchase products

### Protected Route Types

#### 1. Server-Side Protected Routes (Recommended)

Protected at the server component level using `requireAuth()` and `requireRole()`:

```typescript
import { requireRole } from '@/lib/auth/protectedRoutes';

export default async function SellerDashboard() {
  await requireRole(['seller']);
  return <YourComponent />;
}
```

**Benefits**:
- Secure - checked before component renders
- No unauthorized content leakage
- Better performance
- Works with server components

#### 2. Client-Side Role Checking

Use `useUserRole()` hook for conditional rendering:

```typescript
'use client';
import { useUserRole } from '@/app/hooks/useUserRole';

export default function Navigation() {
  const { isSeller, isAdmin } = useUserRole();
  
  return (
    <>
      {isSeller && <SellerLinks />}
      {isAdmin && <AdminLinks />}
    </>
  );
}
```

**Use Cases**:
- Conditional navigation
- UI variations based on role
- Optional features

## Implementation Guide

### 1. Creating Protected Pages

**Pattern for single role:**

```typescript
// app/seller/dashboard/page.tsx
import { requireRole } from '@/lib/auth/protectedRoutes';

export default async function SellerDashboardPage() {
  await requireRole(['seller']);
  
  return <SellerDashboard />;
}
```

**Pattern for multiple roles:**

```typescript
// app/admin/page.tsx
import { requireRole } from '@/lib/auth/protectedRoutes';

export default async function AdminPage() {
  await requireRole(['admin', 'moderator']);
  
  return <AdminPanel />;
}
```

### 2. Protecting API Routes

```typescript
// app/api/seller/products.ts
import { getSession } from '@auth0/nextjs-auth0';

export async function GET() {
  const session = await getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user has seller role
  const roles = (session.user['https://nextsells.example/roles'] || [])
    .map(r => r.toLowerCase());
  
  if (!roles.includes('seller')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Your API logic
  return NextResponse.json(data);
}
```

### 3. Profile Management

#### File Structure

```
app/
  profile/
    page.tsx              # Server-side page wrapper
  components/profile/
    ProfileSettingsClient.tsx  # Client-side settings
  api/
    user/
      profile.ts          # Profile CRUD API
    upload/
      avatar/
        route.ts          # Avatar upload handler
```

#### Usage

Navigate to `/profile` to access the profile settings page. Features:

- **Profile Display**: Name, email, phone, address, bio
- **Avatar Upload**: Cloudinary integration with auto-optimization
- **Edit Mode**: Toggle edit mode to update profile fields
- **Validation**: File type and size validation

### 4. Avatar Upload Process

#### Client Side

```typescript
const handleAvatarUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'user_avatars');

  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  // data.secure_url contains the uploaded image URL
};
```

#### Server Side (Cloudinary Upload)

```typescript
// app/api/upload/avatar/route.ts
- Validates file type (JPG, PNG, WebP)
- Validates file size (max 10MB)
- Uploads to Cloudinary with auto-optimization
- Returns secure URL
- Supports overwrite with same user ID
```

#### Environment Variables Required

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Dashboard Implementation

#### Seller Dashboard

Path: `/seller/dashboard`

Features:
- Total products count
- Total and pending orders
- Total revenue calculation
- Quick action links

API: `/api/seller/stats`

#### Admin Dashboard

Path: `/admin/dashboard`

Features:
- Total users count
- Total sellers count
- Pending seller approvals
- Total products count

API: `/api/admin/stats`

## API Reference

### Profile Endpoints

#### GET /api/user/profile
Fetch current user's profile

```typescript
Response: {
  id: string;
  name: string;
  email: string;
  picture: string;
  bio: string;
  phone: string;
  address: string;
  role: string;
}
```

#### PUT /api/user/profile
Update user profile

```typescript
Body: {
  name?: string;
  bio?: string;
  phone?: string;
  address?: string;
  picture?: string;
}
```

### Upload Endpoints

#### POST /api/upload/avatar
Upload profile avatar

```typescript
Body: FormData with 'file' field
Response: {
  secure_url: string;
  public_id: string;
  // ... other Cloudinary fields
}
```

### Stats Endpoints

#### GET /api/seller/stats
Get seller dashboard statistics (requires seller role)

```typescript
Response: {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}
```

#### GET /api/admin/stats
Get admin dashboard statistics (requires admin role)

```typescript
Response: {
  totalUsers: number;
  totalSellers: number;
  pendingApprovals: number;
  totalProducts: number;
}
```

## Security Considerations

### 1. Authentication Check
All protected endpoints verify session existence:
```typescript
const session = await getSession();
if (!session?.user) return 401;
```

### 2. Role Verification
All APIs verify user has required role:
```typescript
const roles = (session.user['https://nextsells.example/roles'] || [])
  .map(r => r.toLowerCase());
if (!roles.includes(requiredRole)) return 403;
```

### 3. File Upload Security
- File type validation
- File size limits
- User-specific folder paths in Cloudinary
- Auto-optimization to prevent abuse

### 4. Error Handling
- Never expose sensitive information in errors
- Return generic error messages to clients
- Log detailed errors server-side

## Testing Protected Routes

### Test 1: Verify Unauthorized Access Denied

```bash
# Try accessing seller route without seller role
curl -H "Cookie: appSession=YOUR_SESSION" \
  https://yourdomain.com/seller/dashboard
# Should redirect to /unauthorized
```

### Test 2: Verify Role-Based Redirect

```typescript
// In browser dev tools
// As admin user, navigate to /seller/dashboard
// Should see unauthorized page
// As seller user, should access normally
```

### Test 3: Verify Avatar Upload

```typescript
const formData = new FormData();
formData.append('file', imageFile);
const response = await fetch('/api/upload/avatar', {
  method: 'POST',
  body: formData,
});
// Should return secure_url
```

## Common Patterns

### Conditional Navigation Based on Role

```typescript
'use client';
import { useUserRole } from '@/app/hooks/useUserRole';
import Link from 'next/link';

export function Navigation() {
  const { isSeller, isAdmin, isLoading } = useUserRole();

  if (isLoading) return <div>Loading...</div>;

  return (
    <nav>
      <Link href="/">Home</Link>
      {isSeller && <Link href="/seller/dashboard">Dashboard</Link>}
      {isAdmin && <Link href="/admin/dashboard">Admin</Link>}
    </nav>
  );
}
```

### Protected Component HOC

```typescript
import { requireRole } from '@/lib/auth/protectedRoutes';

export function withRole(Component: React.ComponentType, roles: string[]) {
  return async function Protected(props: any) {
    await requireRole(roles);
    return <Component {...props} />;
  };
}

// Usage
export default withRole(MyComponent, ['seller']);
```

## Troubleshooting

### Issue: "Unauthorized" redirect on valid user

**Solution**: Check that Auth0 rules are assigning roles correctly. Verify role claim URL matches `https://nextsells.example/roles`.

### Issue: Avatar upload returns 401

**Solution**: Ensure session is valid and check CLOUDINARY environment variables are set correctly.

### Issue: Stats API returns 403

**Solution**: Verify user has correct role in Auth0 dashboard and role claim is properly configured.

## Next Steps

1. **Configure Auth0**: Add custom rules to assign roles to users
2. **Update Users**: Manually assign existing users to appropriate roles
3. **Test All Routes**: Verify role-based redirects work
4. **Monitor**: Use server logs to track unauthorized access attempts
5. **Extend**: Add additional roles (moderator, support, etc.) as needed

## Related Files

- `lib/auth/protectedRoutes.ts` - Core protection utilities
- `app/hooks/useUserRole.ts` - Client-side role checking
- `app/profile/page.tsx` - Profile page wrapper
- `app/components/profile/ProfileSettingsClient.tsx` - Profile UI
- `app/components/common/RoleBasedNav.tsx` - Role-aware navigation
- `app/api/upload/avatar/route.ts` - Avatar upload handler
- `app/api/user/profile.ts` - Profile API
- `app/api/admin/stats.ts` - Admin stats API
- `app/api/seller/stats.ts` - Seller stats API
