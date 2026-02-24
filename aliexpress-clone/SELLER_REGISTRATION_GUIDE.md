# Multi-Step Seller Registration & Admin Approval Flow

## Overview

This document describes the complete seller registration flow with multi-step form submission, image uploads via Cloudinary, and admin verification before account activation.

## Registration Flow

### Step 1: Basic Registration
**URL:** `/seller/register`

Sellers enter their basic information:
- Full Name
- Email Address
- Phone Number
- Password (with strength validation)
- Confirm Password

**API Endpoint:** `POST /api/seller/register/step-1`

**Request Body:**
```json
{
  "email": "seller@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1 (555) 123-4567"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Step 1 complete. Please proceed to logo upload.",
    "user": {
      "id": "user-123",
      "email": "seller@example.com",
      "name": "John Doe",
      "role": "SELLER"
    },
    "token": "jwt-token-here",
    "currentStep": 1,
    "nextStep": 2
  }
}
```

**What happens:**
- User account is created with SELLER role
- Password is hashed and stored securely
- SellerProfile is created with status: `IN_PROGRESS`
- JWT token is returned for subsequent steps

---

### Step 2: Logo Upload & Business Details
**API Endpoint:** `POST /api/seller/register/step-2`

Sellers upload their company logo and provide business information:
- Company Name (required)
- Business Type (Sole Proprietor, Partnership, LLC, Corporation, Other)
- Website (optional)
- Business Bio (optional)
- Company Logo (uploaded via Cloudinary)

**Request Headers:**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "companyName": "Acme Goods",
  "businessType": "LLC",
  "website": "https://acmegoods.com",
  "bio": "Premium electronics and accessories",
  "logoUrl": "https://res.cloudinary.com/...",
  "logoPublicId": "aliexpress-clone/logos/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logo uploaded successfully. Please proceed to document verification.",
    "sellerProfile": {
      "id": "seller-profile-123",
      "companyName": "Acme Goods",
      "logo": "https://res.cloudinary.com/..."
    },
    "currentStep": 2,
    "nextStep": 3
  }
}
```

**What happens:**
- Logo is uploaded to Cloudinary
- Company information is saved to SellerProfile
- Status remains `IN_PROGRESS`

---

### Step 3: Government ID Verification
**API Endpoint:** `POST /api/seller/register/step-3`

Sellers upload government-issued ID for verification:
- Document Type (PASSPORT or NATIONAL_ID)
- Document Number
- Expiration Date (optional)
- Document File (uploaded via Cloudinary)

**Request Headers:**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "documentType": "PASSPORT",
  "documentNumber": "AB123456",
  "expiryDate": "2028-06-15",
  "documentUrl": "https://res.cloudinary.com/...",
  "documentPublicId": "aliexpress-clone/documents/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Document uploaded successfully. Your account is now pending admin verification.",
    "details": {
      "sellerId": "seller-profile-123",
      "documentId": "document-123",
      "status": "PENDING_REVIEW",
      "documentType": "PASSPORT"
    },
    "currentStep": 3,
    "nextStep": 4,
    "approvalPending": true,
    "adminNotified": true
  }
}
```

**What happens:**
- Document is uploaded to Cloudinary
- SellerDocument record is created with status: `PENDING`
- ApprovalRequest is created automatically
- SellerProfile status changes to: `PENDING_REVIEW`
- Admin users are notified

---

### Step 4: Verification Success
After submitting Step 3, the seller sees a success page with:
- Confirmation that account is pending admin review
- Timeline (24-48 hours for admin review)
- What happens next:
  1. Admin reviews documents
  2. Seller receives approval/rejection email
  3. Once approved, can start selling

---

## Admin Approval Flow

### View Pending Approvals
**URL:** `/admin/seller-approvals`

**API Endpoint:** `GET /api/admin/seller-approvals/pending`

**Request Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPending": 5,
    "approvals": [
      {
        "approvalId": "approval-123",
        "sellerId": "seller-profile-123",
        "user": {
          "id": "user-123",
          "email": "seller@example.com",
          "name": "John Doe",
          "phone": "+1 (555) 123-4567"
        },
        "companyName": "Acme Goods",
        "businessType": "LLC",
        "logo": "https://res.cloudinary.com/...",
        "documents": [
          {
            "id": "doc-123",
            "documentType": "PASSPORT",
            "documentNumber": "AB123456",
            "documentUrl": "https://res.cloudinary.com/...",
            "expiryDate": "2028-06-15"
          }
        ],
        "submittedAt": "2026-02-22T10:30:00Z"
      }
    ]
  }
}
```

---

### Approve Seller
**API Endpoint:** `POST /api/admin/seller-approvals/[id]/approve`

**Request Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Seller account approved successfully",
    "approval": {
      "id": "approval-123",
      "status": "APPROVED",
      "seller": {
        "id": "seller-profile-123",
        "companyName": "Acme Goods",
        "user": {
          "id": "user-123",
          "email": "seller@example.com",
          "name": "John Doe"
        }
      },
      "approvedAt": "2026-02-22T11:00:00Z",
      "approvedBy": "admin@example.com"
    }
  }
}
```

**What happens:**
- ApprovalRequest status → `APPROVED`
- All SellerDocuments status → `APPROVED`
- SellerProfile status → `APPROVED`
- User.isVerified → `true`
- Seller can now list products

---

### Reject Seller
**API Endpoint:** `POST /api/admin/seller-approvals/[id]/reject`

**Request Headers:**
```
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Document number does not match with photo. Please resubmit with valid ID."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Seller account rejected successfully",
    "approval": {
      "id": "approval-123",
      "status": "REJECTED",
      "seller": {
        "id": "seller-profile-123",
        "companyName": "Acme Goods",
        "user": {
          "id": "user-123",
          "email": "seller@example.com",
          "name": "John Doe"
        }
      },
      "rejectionReason": "Document number does not match with photo. Please resubmit with valid ID.",
      "rejectedAt": "2026-02-22T11:15:00Z",
      "rejectedBy": "admin@example.com"
    }
  }
}
```

**What happens:**
- ApprovalRequest status → `REJECTED`
- All SellerDocuments status → `REJECTED`
- SellerProfile status → `REJECTED`
- Seller receives rejection email with reason
- Seller can reapply after addressing issues

---

## Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  name          String
  phone         String?
  role          Role     @default(BUYER)  // BUYER, SELLER, ADMIN
  isVerified    Boolean  @default(false)  // Set to true when seller is approved
  isBlocked     Boolean  @default(false)
  
  sellerProfile SellerProfile?
  // ... other relations
}
```

### SellerProfile Model
```prisma
model SellerProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  companyName     String
  businessType    String
  businessAddress String
  city            String
  state           String
  zipCode         String
  country         String
  
  logo            String?  // Cloudinary URL
  bio             String?
  website         String?
  
  status          OnboardingStatus @default(NOT_STARTED)
  // NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
  
  rejectionReason String?
  
  documents       SellerDocument[]
  approvalRequest ApprovalRequest?
  // ... other relations
}
```

### SellerDocument Model
```prisma
model SellerDocument {
  id              String   @id @default(uuid())
  sellerId        String
  seller          SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  
  documentType    DocumentType  // NATIONAL_ID, PASSPORT
  documentNumber  String
  documentUrl     String  // Cloudinary URL
  expiryDate      DateTime?
  status          DocumentStatus @default(PENDING)
  // PENDING, APPROVED, REJECTED, EXPIRED
  
  rejectionReason String?
  uploadedAt      DateTime @default(now())
  verifiedAt      DateTime?
}
```

### ApprovalRequest Model
```prisma
model ApprovalRequest {
  id              String   @id @default(uuid())
  sellerId        String   @unique
  seller          SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  
  status          DocumentStatus @default(PENDING)
  // PENDING, APPROVED, REJECTED
  
  notes           String?
  approvedBy      String?  // Admin user ID
  approvedAt      DateTime?
  rejectedAt      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Enums

```prisma
enum OnboardingStatus {
  NOT_STARTED
  IN_PROGRESS
  PENDING_REVIEW
  APPROVED
  REJECTED
}

enum DocumentType {
  NATIONAL_ID
  PASSPORT
  BUSINESS_LICENSE
  TAX_ID
}

enum DocumentStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

---

## File Structure

```
app/
├── api/
│   ├── seller/
│   │   └── register/
│   │       ├── step-1.ts         # Basic registration
│   │       ├── step-2.ts         # Logo upload
│   │       └── step-3.ts         # Document upload
│   └── admin/
│       └── seller-approvals/
│           ├── pending.ts        # List pending approvals
│           └── [id]/
│               ├── approve.ts    # Approve seller
│               └── reject.ts     # Reject seller
├── seller/
│   └── register/
│       └── page.tsx             # Registration page
├── admin/
│   └── seller-approvals/
│       └── page.tsx             # Admin approval dashboard
└── components/
    ├── seller/
    │   └── SellerRegistrationFlow.tsx    # Multi-step form
    └── admin/
        └── SellerApprovalDashboard.tsx   # Admin dashboard
```

---

## Frontend Integration

### Using the Registration Flow

1. Navigate to `/seller/register`
2. Complete Step 1: Enter email, password, name, phone
3. Complete Step 2: Upload logo and enter business details
4. Complete Step 3: Upload government ID document
5. View success page and wait for admin approval

### Admin Dashboard

1. Navigate to `/admin/seller-approvals`
2. View list of pending seller applications
3. Click on a seller to view full details (logo, documents)
4. Click "Approve" or "Reject"
5. If rejecting, provide a detailed reason

---

## Error Handling

### Common Errors

**400 Bad Request**
- Missing required fields
- Invalid email format
- Password too weak
- File size exceeds 5MB
- Invalid document type

**401 Unauthorized**
- Missing or invalid JWT token
- Token expired

**403 Forbidden**
- Non-admin trying to access admin endpoints
- Seller trying to access admin features

**404 Not Found**
- User/SellerProfile/Document not found
- ApprovalRequest not found

**500 Server Error**
- Cloudinary upload failed
- Database operation failed

---

## Security Considerations

### Password Security
- Passwords are hashed using bcryptjs
- Password strength validation enforced
- Minimum 8 characters with uppercase, lowercase, numbers, special characters

### Document Security
- Documents uploaded to Cloudinary (secure cloud storage)
- Only image and PDF files allowed
- File size limited to 5MB
- Public IDs stored for future deletion

### Access Control
- Admin endpoints verify JWT token and Admin role
- SellerProfile records only accessible by owner or admin
- Documents not publicly accessible (Cloudinary private security option recommended)

---

## Email Notifications (Recommended Implementation)

Send emails at these stages:
1. **Step 1 Complete** - Email verification link
2. **Step 3 Complete** - Confirmation of submission
3. **Approval** - Account approved, can start selling
4. **Rejection** - Account rejected with reason

---

## Testing Checklist

- [ ] Step 1: Validate email format, password strength
- [ ] Step 1: Check user doesn't exist
- [ ] Step 2: Logo upload and save to Cloudinary
- [ ] Step 2: Verify company data saved
- [ ] Step 3: Document upload and validation
- [ ] Step 3: SellerProfile status → PENDING_REVIEW
- [ ] Step 3: ApprovalRequest created
- [ ] Admin: Fetch pending approvals
- [ ] Admin: Approve seller flow
- [ ] Admin: Reject seller flow
- [ ] User.isVerified set to true after approval
- [ ] SellerProfile.status updated correctly
- [ ] Error handling for all edge cases

---

## Next Steps

1. **Email Integration** - Add email notifications
2. **Seller Dashboard** - Show approval status
3. **Seller Reapplication** - Allow resubmitting rejected applications
4. **Document Expiry** - Check and alert when documents expire
5. **Analytics** - Track approval rates and times
