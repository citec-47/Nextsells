# 🛠️ Development Guide

## Essential Commands

### Database
```bash
# Create and run migrations
npx prisma migrate dev --name "description"

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (visual database explorer)
npx prisma studio

# View migration history
npx prisma migrate status
```

### Development Server
```bash
# Start dev server on default port (3000)
npm run dev

# Start on custom port
npm run dev -- -p 3001

# Build for production
npm run build

# Run production build locally
npm start

# Run linter
npm run lint
```

### TypeScript
```bash
# Check types
npx tsc --noEmit

# Watch mode
npx tsc --watch
```

## Common Tasks

### Adding a New Database Model

1. **Update Schema**
   ```prisma
   model YourModel {
     id  String @id @default(uuid())
     ...
   }
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name "add_your_model"
   ```

3. **Use in Code**
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   const result = await prisma.yourModel.create({ ... });
   ```

### Adding a New API Route

1. **Create file**: `app/api/feature/route.ts`
2. **Export handler**:
   ```typescript
   export async function GET(request: NextRequest) {
     try {
       // Your logic
       return successResponse(data);
     } catch (error) {
       return errorResponse('Error message', 500);
     }
   }
   ```

### Adding a New Page

1. **Create directory**: `app/feature/`
2. **Create file**: `app/feature/page.tsx`
3. **Add metadata**:
   ```typescript
   export const metadata = {
     title: 'Page Title',
     description: 'Page description',
   };
   ```

### Creating a New Component

```typescript
'use client';

import { useState } from 'react';

interface Props {
  prop1: string;
  prop2?: number;
}

export default function MyComponent({ prop1, prop2 }: Props) {
  const [state, setState] = useState<string>('initial');

  return (
    <div>
      {/* Your JSX */}
    </div>
  );
}
```

### Protected API Routes

```typescript
import { extractToken, verifyToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  // Get token
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return errorResponse('Unauthorized', 401);

  // Verify token
  const payload = verifyToken(token);
  if (!payload) return errorResponse('Invalid token', 401);

  // Check role
  if (payload.role !== 'SELLER') {
    return errorResponse('Seller access required', 403);
  }

  // Your logic here
}
```

## Frontend Patterns

### Using Toast Notifications
```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Operation successful!');

// Error
toast.error('Something went wrong');

// Loading
const id = toast.loading('Processing...');
toast.success('Done!', { id });
```

### API Calls with Authentication
```typescript
const token = localStorage.getItem('token');
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});

const result = await response.json();
if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

### Form Handling with Validation
```typescript
const [formData, setFormData] = useState({ ... });
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate
  if (!formData.field) {
    toast.error('Field is required');
    return;
  }

  setIsLoading(true);
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (data.success) {
      toast.success('Success!');
      setFormData({ ... }); // Reset
    } else {
      toast.error(data.error);
    }
  } catch (error) {
    toast.error('An error occurred');
  } finally {
    setIsLoading(false);
  }
};
```

## Debugging

### Enable Debug Logging

For Prisma:
```bash
export DEBUG="prisma:*"
npm run dev
```

For Next.js:
```bash
DEBUG=* npm run dev
```

### Console Debugging
```typescript
console.log('[DEBUG]', message, data);
console.error('[ERROR]', error);
console.warn('[WARN]', warning);
```

### Browser DevTools
- F12 to open DevTools
- Network tab to see API calls
- Console tab for JavaScript errors
- React DevTools extension for component debugging

## Troubleshooting

### Issue: Prisma Client Not Found
```bash
npx prisma generate
```

### Issue: Database Connection Failed
1. Check DATABASE_URL in .env.local
2. Ensure PostgreSQL is running
3. Verify credentials
4. Check database exists

### Issue: Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or run on different port
npm run dev -- -p 3001
```

### Issue: TypeScript Errors
```bash
# Check all types
npx tsc --noEmit
```

### Issue: Next.js Build Fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## Performance Tips

### Optimize Database Queries
```typescript
// ✅ Good - Use select to limit fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, name: true },
});

// ❌ Slow - Gets all fields
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

### Implement Pagination
```typescript
const pageSize = 10;
const page = 1;

const items = await prisma.item.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

### Use Indexes on Frequently Searched Fields
```prisma
model User {
  id String @id @default(uuid())
  email String @unique
  // Implicit index created

  @@index([email])  // Explicit index
}
```

## Code Quality

### Linting
```bash
npm run lint
```

### Format Code
```bash
npx prettier --write .
```

### Type Checking
```bash
npx tsc --noEmit
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "Add feature description"

# Push to remote
git push origin feature/feature-name

# Create pull request
# Merge after review
git checkout main
git pull origin main
```

## Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] .env.local configured
- [ ] Dependencies installed (npm install)
- [ ] Database created
- [ ] Prisma migrations run
- [ ] Development server runs without errors
- [ ] Can access http://localhost:3000

---

Happy coding! 🎉
