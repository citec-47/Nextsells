# NextSells - E-Commerce Platform

A comprehensive, production-ready e-commerce platform built with Next.js 16, inspired by AliExpress. Features multi-role authentication (Buyers, Sellers, Admins), advanced seller onboarding, product management with profit margins, and secure payment handling with fund holding until delivery.

## 🎯 Key Features

### For Sellers
- **Multi-step Onboarding**: Personal info → Logo upload → Identity verification
- **Document Verification**: Admin approval workflow for identity and business documents
- **Product Listing**: Create products with dynamic profit margin calculations
- **Revenue Tracking**: Monitor total revenue and order metrics
- **Seller Dashboard**: View stats, manage products, and track withdrawals

### For Buyers
- **Product Browsing**: Search and filter by category
- **Secure Checkout**: Shipping information and order confirmation
- **Fund Protection**: Payments held securely until delivery confirmation
- **Order Management**: Track orders and view order history
- **Seller Ratings**: Rate and review sellers

### For Admins
- **Seller Approvals**: Review and approve/reject seller applications
- **Document Verification**: View identity and business documents
- **Platform Management**: Manage users, products, and orders
- **Admin Dashboard**: Overview of platform metrics

## 📁 Project Structure

```
.
├── app/
│   ├── api/                       # API routes
│   │   ├── auth/
│   │   │   ├── register.ts       # User registration
│   │   │   └── login.ts          # User login
│   │   ├── seller/
│   │   │   ├── onboarding.ts     # Seller onboarding submission
│   │   │   └── products.ts       # Product creation
│   │   ├── admin/
│   │   │   └── sellers/
│   │   │       ├── pending.ts    # Get pending approvals
│   │   │       ├── [id]/approve.ts   # Approve seller
│   │   │       └── [id]/reject.ts    # Reject seller
│   │   └── buyer/
│   │       ├── products.ts       # Browse products
│   │       └── orders.ts         # Create & list orders
│   │
│   ├── components/               # Reusable React components
│   │   ├── seller/
│   │   │   ├── OnboardingForm.tsx     # Multi-step onboarding
│   │   │   └── ProductListingForm.tsx # Product creation form
│   │   ├── admin/
│   │   │   └── ApprovalDashboard.tsx  # Seller approval interface
│   │   ├── buyer/
│   │   │   ├── ProductBrowser.tsx     # Product browsing
│   │   │   └── CheckoutPage.tsx       # Order checkout
│   │   └── common/                    # Shared components
│   │
│   ├── seller/                   # Seller pages
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   └── products/
│   │       └── page.tsx
│   │
│   ├── admin/                    # Admin pages
│   │   └── dashboard/
│   │       └── page.tsx
│   │
│   ├── buyer/                    # Buyer pages
│   │   ├── products/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   └── orders/
│   │
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
│
├── lib/                         # Utility functions
│   ├── auth/
│   │   ├── jwt.ts              # JWT token management
│   │   ├── password.ts         # Password hashing & validation
│   │   └── middleware.ts       # Auth middleware
│   └── utils/
│       ├── api.ts              # API response helpers
│       └── validators.ts       # Data validators
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── public/
│   └── uploads/                # File storage
│       ├── logos/
│       ├── documents/
│       └── products/
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── prisma.config.ts
    └── tailwind.config.js
```

## 🗄️ Database Schema

### Core Models
- **User**: Base user model with role-based access (BUYER, SELLER, ADMIN)
- **SellerProfile**: Extended profile for sellers with onboarding status
- **SellerDocument**: Identity and business documents (document verification)
- **ApprovalRequest**: Tracks seller approval workflow
- **Product**: Product listings with profit margin tracking
- **Order**: Complete order management with fund holding
- **OrderItem**: Individual items in an order
- **Review**: Product reviews and ratings
- **Withdrawal**: Seller payment withdrawals
- **Message**: Messaging between users

### Enums
- **Role**: BUYER, SELLER, ADMIN
- **OnboardingStatus**: NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
- **DocumentType**: NATIONAL_ID, PASSPORT, BUSINESS_LICENSE, TAX_ID
- **DocumentStatus**: PENDING, APPROVED, REJECTED, EXPIRED
- **OrderStatus**: PENDING, CONFIRMED, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aliexpress-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Create a `.env.local` file:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/nextsells
   JWT_SECRET=your-secret-key-change-in-production
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Setup Prisma**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Seller Endpoints
- `POST /api/seller/onboarding` - Submit seller onboarding
- `POST /api/seller/products` - Create product listing
- `GET /api/seller/products` - List seller's products
- `PUT /api/seller/products/[id]` - Update product
- `DELETE /api/seller/products/[id]` - Delete product

### Admin Endpoints
- `GET /api/admin/sellers/pending` - Get pending seller approvals
- `POST /api/admin/sellers/[id]/approve` - Approve seller
- `POST /api/admin/sellers/[id]/reject` - Reject seller
- `GET /api/admin/dashboard/stats` - Platform statistics

### Buyer Endpoints
- `GET /api/buyer/products` - Browse products
- `POST /api/buyer/orders` - Create order
- `GET /api/buyer/orders` - Get buyer's orders
- `GET /api/buyer/orders/[id]` - Get order details

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Three-tier permission system
- **Input Validation**: Server-side validation for all requests
- **Fund Protection**: Payments held until delivery confirmation
- **Document Verification**: Multi-document approval workflow

## 🎨 UI/UX

- **Tailwind CSS**: Modern, responsive design system
- **React Hot Toast**: User-friendly notifications
- **Multi-step Forms**: Progressive disclosure for complex flows
- **Responsive Design**: Mobile-first approach

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# File Storage (optional for cloud uploads)
NEXT_PUBLIC_UPLOAD_URL=your_upload_endpoint

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🛠️ Development

### Running Migrations
```bash
npx prisma migrate dev --name add_column
```

### Generating Prisma Client
```bash
npx prisma generate
```

### Prisma Studio
```bash
npx prisma studio
```

### Linting
```bash
npm run lint
```

## 📦 Built With

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma ORM** - Database management
- **PostgreSQL** - Relational database
- **Tailwind CSS** - CSS framework
- **React Hot Toast** - Toast notifications
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Axios** - HTTP client (for future integrations)

## 🔄 Feature Roadmap

- [ ] Payment gateway integration (Stripe)
- [ ] Email notifications
- [ ] Seller analytics dashboard
- [ ] Advanced search and filtering
- [ ] Product recommendations
- [ ] Seller reviews and ratings system
- [ ] Dispute resolution
- [ ] Bulk import products
- [ ] Inventory management
- [ ] Seller inventory sync
- [ ] Automated order status updates
- [ ] Refund management
- [ ] Chat messaging system
- [ ] Mobile app

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Prisma client not generated
```bash
npx prisma generate
```

### Database connection issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database credentials

## 📄 License

MIT License - feel free to use this project for commercial and personal use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💼 Support

For support, email support@nextsells.com or open an issue on GitHub.
