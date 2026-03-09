# Database Schema - Neon PostgreSQL

Your Neon database will have these tables after running `node scripts/init-db.js`:

---

## 📊 Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS TABLE                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)          │ VARCHAR(255) - UUID                       │
│ auth0_id         │ VARCHAR(255) - Auth0 User ID (UNIQUE)     │
│ email            │ VARCHAR(255) - Email (UNIQUE)             │
│ name             │ VARCHAR(255)                              │
│ role             │ VARCHAR(50) - BUYER/SELLER/ADMIN          │
│ avatar_url       │ VARCHAR(500) - Cloudinary URL             │
│ is_blocked       │ BOOLEAN - Account status                  │
│ created_at       │ TIMESTAMP - Creation time                 │
│ updated_at       │ TIMESTAMP - Last updated                  │
└─────────────────────────────────────────────────────────────┘
         │
         └──────────────────┬──────────────────────────┐
                            │                          │
                            ▼                          ▼
         ┌──────────────────────────────┐  ┌──────────────────────────┐
         │   SELLER_PROFILES TABLE      │  │   PRODUCTS TABLE         │
         ├──────────────────────────────┤  ├──────────────────────────┤
         │ id (PK)                      │  │ id (PK)                  │
         │ user_id (FK) - users(id)     │  │ seller_id (FK) - users   │
         │ company_name                 │  │ name                     │
         │ description TEXT             │  │ description TEXT         │
         │ phone                        │  │ price DECIMAL            │
         │ country                      │  │ quantity INTEGER         │
         │ logo_url (Cloudinary)        │  │ category                 │
         │ onboarding_status            │  │ image_urls (array)       │
         │ approval_date                │  │ rating DECIMAL           │
         │ rejection_reason             │  │ num_reviews INTEGER      │
         │ created_at / updated_at      │  │ created_at / updated_at  │
         └──────────────────────────────┘  └──────────────────────────┘
                                                      │
                                                      ▼
                                        ┌──────────────────────────┐
                                        │    ORDERS TABLE          │
                                        ├──────────────────────────┤
                                        │ id (PK)                  │
                                        │ buyer_id (FK) - users    │
                                        │ product_id (FK) - products
                                        │ quantity INTEGER         │
                                        │ total_price DECIMAL      │
                                        │ status VARCHAR(50)       │
                                        │ created_at / updated_at  │
                                        └──────────────────────────┘
```

---

## 📋 Detailed Table Definitions

### `users`
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  auth0_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'BUYER',  -- BUYER, SELLER, ADMIN
  avatar_url VARCHAR(500),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Stores:** Basic user information, linked to Auth0

---

### `seller_profiles`
```sql
CREATE TABLE seller_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  description TEXT,
  phone VARCHAR(20),
  country VARCHAR(100),
  logo_url VARCHAR(500),  -- Cloudinary URL
  onboarding_status VARCHAR(50) DEFAULT 'NOT_STARTED',
    -- NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Stores:** Seller-specific information and approval status

---

### `products`
```sql
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  category VARCHAR(100),
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Cloudinary URLs
  rating DECIMAL(3, 2) DEFAULT 0,
  num_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Stores:** Product listings by sellers

---

### `orders`
```sql
CREATE TABLE orders (
  id VARCHAR(255) PRIMARY KEY,
  buyer_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
    -- PENDING, CONFIRMED, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Stores:** Purchase orders

---

### `seller_documents`
```sql
CREATE TABLE seller_documents (
  id VARCHAR(255) PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,  -- NATIONAL_ID, PASSPORT, BUSINESS_LICENSE, TAX_ID
  document_url VARCHAR(500),  -- Cloudinary URL
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, EXPIRED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Stores:** Seller verification documents

---

### `approval_requests`
```sql
CREATE TABLE approval_requests (
  id VARCHAR(255) PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),  -- Admin user ID
  notes TEXT,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Stores:** Seller approval workflow

---

### `cart_items`
```sql
CREATE TABLE cart_items (
  id VARCHAR(255) PRIMARY KEY,
  buyer_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Stores:** Shopping cart items

---

### `wishlist_items`
```sql
CREATE TABLE wishlist_items (
  id VARCHAR(255) PRIMARY KEY,
  buyer_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Stores:** Wishlist/favorites

---

## 🔗 Relationships

| From Table | To Table | Key | Description |
|-----------|----------|-----|-------------|
| seller_profiles | users | user_id → id | Each seller has one profile |
| products | users | seller_id → id | Each product belongs to a seller |
| orders | users | buyer_id → id | Each order belongs to a buyer |
| orders | products | product_id → id | Each order references a product |
| seller_documents | users | seller_id → id | Documents belong to sellers |
| approval_requests | users | seller_id → id | Requests are for sellers |
| cart_items | users | buyer_id → id | Cart belongs to buyers |
| cart_items | products | product_id → id | Cart items reference products |
| wishlist_items | users | buyer_id → id | Wishlist belongs to buyers |
| wishlist_items | products | product_id → id | Wishlist items reference products |

---

## 🔑 Key Points

- **All IDs use UUID** format (VARCHAR(255))
- **Timestamps** automatically set and updated
- **Foreign Keys** with CASCADE delete to maintain data integrity
- **Image URLs** stored as references to Cloudinary (not binary data)
- **Arrays** used for multiple image URLs in products
- **Enums stored as VARCHAR** for flexibility and no ALTER TABLE needed

---

## 🚀 Using the Schema

After running `node scripts/init-db.js`, all tables are ready to use.

**Example query from code:**

```typescript
import { db, query } from '@/lib/db';

// Using helper function
const user = await db.getUserByEmail('user@example.com');

// Or raw SQL
const result = await query(
  'SELECT * FROM products WHERE seller_id = $1 AND category = $2',
  [sellerId, 'Electronics']
);
const products = result.rows;
```

---

## 📊 Data Types Reference

| Type | Max Length | Use For |
|------|-----------|---------|
| VARCHAR(255) | 255 chars | IDs, names, emails |
| VARCHAR(500) | 500 chars | URLs |
| TEXT | Unlimited | Long descriptions |
| DECIMAL(10,2) | $9,999,999.99 | Prices, ratings |
| INTEGER | Whole numbers | Quantities, counts |
| BOOLEAN | true/false | Flags, status |
| TIMESTAMP | Date + Time | Created/Updated dates |
| TEXT[] | Array | Multiple values (image URLs) |

---

**Schema Ready!** Run `node scripts/init-db.js` to create all tables.
