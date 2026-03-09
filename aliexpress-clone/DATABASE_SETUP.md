# Database Setup & Troubleshooting

## Quick Start: Initialize Database

After fixing the connection issues, you need to initialize the database schema. Choose one of these methods:

### Method 1: API Endpoint (Recommended for Development)

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Initialize the database** by making a POST request:
   ```bash
   curl -X POST http://localhost:3000/api/db/initialize \
     -H "Content-Type: application/json"
   ```

   Or from your browser:
   ```
   http://localhost:3000/api/db/initialize
   ```
   (Click the URL, or use a REST client like Postman)

3. **Check the response**:
   - ✅ Success: `{"success": true, "message": "Database initialized successfully", ...}`
   - ❌ Error: Check that `DATABASE_URL` is correct in `.env.local`

### Method 2: Manual Setup via SQL Client

If you have `psql` installed:

```bash
# Connect to your PostgreSQL database
psql -U your_username -h your_host -d your_database

# Run the initialization SQL manually (see schema below)
```

## Database Schema

The following tables are created automatically:

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  auth0_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'BUYER',
  avatar_url VARCHAR(500),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Seller Profiles Table
```sql
CREATE TABLE seller_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  description TEXT,
  phone VARCHAR(20),
  country VARCHAR(100),
  logo_url VARCHAR(500),
  onboarding_status VARCHAR(50) DEFAULT 'NOT_STARTED',
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Products Table
```sql
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  category VARCHAR(100),
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0,
  num_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Other Tables
- `orders` - Purchase orders
- `seller_documents` - Document uploads for seller verification
- `approval_requests` - Seller approval workflow
- `cart_items` - Shopping cart items
- `wishlist_items` - Wishlisted products

## Troubleshooting

### "Database connection failed"
```
Error: Connection terminated due to connection timeout
```

**Check**:
1. Database server is running
2. `DATABASE_URL` is correct in `.env.local`
3. Network connectivity to database host

**Test**:
```bash
curl http://localhost:3000/api/health
```

### "Table does not exist"
```
error: relation "users" does not exist
```

**Solution**: Initialize the database schema:
```bash
curl -X POST http://localhost:3000/api/db/initialize
```

### "SSL Error"
```
Error: self signed certificate
```

**Solution**: Already fixed in updated `lib/db.ts` - automatically adds `sslmode=require`

### "Connection Pool Error"
```
error: connect ECONNREFUSED
```

**Check**:
1. PostgreSQL service is running
2. Port 5432 (default) is accessible
3. Firewall rules allow connections

## Verify Setup

Once initialized, test the registration endpoint:

1. **Health check**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Response: `{"status": "healthy", "database": "connected"}`

2. **Create a test user**:
   ```bash
   curl -X POST http://localhost:3000/api/seller/register/step-1 \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123!",
       "name": "Test User",
       "phone": "+1234567890"
     }'
   ```

3. **Verify in database**:
   ```bash
   psql -U your_username -h your_host -d your_database
   SELECT * FROM users;
   ```

## Environment Variables Required

Ensure these are set in `.env.local`:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-key-min-32-chars

# Other variables as needed
NODE_ENV=development
```

## Production Notes

⚠️ **Important**: The `/api/db/initialize` endpoint should be **disabled in production**!
- It's currently limited to localhost only
- Remove or restrict it before deploying to production
- Use Prisma migrations or manual SQL scripts instead

## Next Steps

1. ✅ Fix database connection (DONE)
2. ✅ Add retry logic (DONE)
3. ⏳ Initialize database schema (run initialization)
4. ⏳ Test seller registration
5. ⏳ Test all API endpoints
