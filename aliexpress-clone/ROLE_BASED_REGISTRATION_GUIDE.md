# Role-Based Registration Flow Guide

## Overview

This comprehensive registration system allows users to create either a **Buyer** or **Seller** account with role-specific fields and workflows.

### Flow Comparison

| Step | Buyer | Seller |
|------|-------|--------|
| **Step 1** | Email, Password, Phone | Email, Password, Phone + Company Name + Logo |
| **Step 2** | Government ID Upload | Government ID Upload |
| **Step 3** | Auto-approved (Done!) | Awaiting Admin Approval |
| **Verification** | Auto-verified on ID upload | Requires admin approval |
| **Access** | Immediate | After admin approval |

---

## Registration Workflows

### Buyer Registration Flow

```
1. User clicks "Sign Up / Register" in header
   ↓
2. Choose "I want to buy" on role selection modal
   ↓
3. Fill basic info (email, password, phone, name)
   ↓
4. Upload government ID (passport or driver's license)
   ↓
5. ✅ Account created and auto-verified!
   ↓
6. Access buyer dashboard immediately
```

**API Endpoints Used:**
- `POST /api/auth/register/buyer` - Create buyer account
- `POST /api/auth/verify/identity` - ID verification (auto-approved)

**Database Changes:**
- ✅ User created with role: BUYER, isVerified: true
- ✅ Document stored (auto-approved)

---

### Seller Registration Flow

```
1. User clicks "Sign Up / Register" in header
   ↓
2. Choose "I want to sell" on role selection modal
   ↓
3. Fill account info:
   - Email, password, phone, name
   - Company name, business type
   - Website (optional), bio (optional)
   - Upload company logo
   ↓
4. Upload government ID (passport or driver's license)
   ↓
5. Account submitted for admin verification
   ↓
6. Admin reviews documents and logo
   ↓
7a. ✅ Approved: Account activated, can start selling
   OR
7b. ❌ Rejected: Seller gets feedback, can reapply
```

**API Endpoints Used:**
- `POST /api/seller/register/step-1` - Create seller account
- `POST /api/seller/register/step-2` - Upload logo and business info
- `POST /api/seller/register/step-3` - Upload government ID, submit for approval
- `GET /api/admin/seller-approvals/pending` - Admin views pending
- `POST /api/admin/seller-approvals/[id]/approve` - Admin approves
- `POST /api/admin/seller-approvals/[id]/reject` - Admin rejects

**Database Changes:**
- ✅ User created with role: SELLER, isVerified: false initially
- ✅ SellerProfile created with status: IN_PROGRESS → PENDING_REVIEW → APPROVED/REJECTED
- ✅ SellerDocument records created for logo and ID
- ✅ ApprovalRequest created automatically
- ✅ User.isVerified = true only after admin approval

---

## File Structure

```
app/
├── auth/
│   ├── accounts/
│   │   └── page.tsx                          ← Role selection
│   └── register/
│       └── page.tsx                          ← Registration form (role-specific)
│
├── api/
│   ├── auth/
│   │   ├── register/
│   │   │   └── buyer.ts                     ← Buyer registration endpoint
│   │   └── verify/
│   │       └── identity.ts                  ← Buyer identity verification
│   ├── seller/
│   │   └── register/
│   │       ├── step-1.ts                    ← Seller registration
│   │       ├── step-2.ts                    ← Logo upload
│   │       └── step-3.ts                    ← ID upload & approval request
│   └── admin/
│       └── seller-approvals/
│           ├── pending.ts                   ← List pending
│           └── [id]/
│               ├── approve.ts               ← Approve seller
│               └── reject.ts                ← Reject seller
│
└── components/
    └── auth/
        ├── RoleSelectionModal.tsx           ← Choose Buyer/Seller
        └── RoleBasedRegistrationFlow.tsx    ← Multi-step form
```

---

## Component Details

### RoleSelectionModal Component

**Location:** `app/components/auth/RoleSelectionModal.tsx`

**Features:**
- Visual card layout for role selection
- Buyer option with features list
- Seller option with features list
- Selected state highlighting with checkmark
- Navigation to registration with role parameter

**Props:** None (uses router for navigation)

**Navigation:**
- Buyer selected: `/auth/register?role=buyer`
- Seller selected: `/auth/register?role=seller`

---

### RoleBasedRegistrationFlow Component

**Location:** `app/components/auth/RoleBasedRegistrationFlow.tsx`

**Features:**
- 3-step registration flow
- Progress bar showing current step
- Role-specific form fields
- Cloudinary image uploads
- Error handling and validation
- JWT token persistence between steps

**Props:** None (uses search params for role)

**Supported Roles:**
- `BUYER` - Simplified registration
- `SELLER` - Extended registration with business details

**Steps:**
1. **Step 1:** Basic Info (+ seller business details + logo upload)
2. **Step 2:** Government ID verification
3. **Step 3:** Success confirmation

---

## API Endpoints

### Buyer Registration

**Endpoint:** `POST /api/auth/register/buyer`

Request:
```json
{
  "email": "buyer@example.com",
  "password": "SecurePass123!",
  "name": "John Buyer",
  "phone": "+1 (555) 123-4567"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "message": "Buyer account created successfully!",
    "user": {
      "id": "user-123",
      "email": "buyer@example.com",
      "name": "John Buyer",
      "role": "BUYER"
    },
    "token": "jwt-token-here",
    "isVerified": true,
    "requiresVerification": false
  }
}
```

---

### Buyer Identity Verification

**Endpoint:** `POST /api/auth/verify/identity`

Headers:
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

Request:
```json
{
  "documentType": "PASSPORT",
  "documentNumber": "AB123456",
  "expiryDate": "2028-12-31",
  "documentUrl": "https://res.cloudinary.com/...",
  "documentPublicId": "aliexpress-clone/documents/..."
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "message": "Identity verified successfully!",
    "details": {
      "userId": "user-123",
      "documentId": "doc-123",
      "status": "VERIFIED"
    }
  }
}
```

---

### Seller Registration - Step 1

**Endpoint:** `POST /api/seller/register/step-1`

See `SELLER_REGISTRATION_GUIDE.md` for full details.

Response includes token for subsequent steps.

---

### Seller Registration - Step 2

**Endpoint:** `POST /api/seller/register/step-2`

Uploads company logo and business information.

---

### Seller Registration - Step 3

**Endpoint:** `POST /api/seller/register/step-3`

Uploads government ID and creates approval request.

Creates:
- SellerDocument record
- ApprovalRequest record (status: PENDING)
- Updates SellerProfile status to: PENDING_REVIEW

---

## Database Schema

### User Model
```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  password          String   (bcrypt hashed)
  name              String
  phone             String?
  role              Role     // BUYER or SELLER
  isVerified        Boolean  // false for sellers until approved, true for buyers after ID upload
  isBlocked         Boolean  @default(false)
  
  // For sellers only
  sellerProfile     SellerProfile?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### SellerProfile Model
```prisma
model SellerProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  
  companyName       String
  businessType      String
  logo              String?  // Cloudinary URL
  bio               String?
  website           String?
  
  status            OnboardingStatus
  // NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
  
  rejectionReason   String?
  documents         SellerDocument[]
  approvalRequest   ApprovalRequest?
}
```

### Key Status Values
- **User.isVerified:**
  - Buyers: `true` after ID upload
  - Sellers: `false` until admin approves, then `true`

- **SellerProfile.status:**
  - `IN_PROGRESS` - Filling out registration
  - `PENDING_REVIEW` - Submitted, awaiting admin decision
  - `APPROVED` - Can now sell
  - `REJECTED` - Must fix issues and reapply

---

## User Journey Examples

### Example 1: Buyer Registration

```
Timeline:
T+0:00   User clicks "Sign Up / Register"
T+0:05   Selects "I want to buy"
T+0:10   Fills: email, password, phone, name
T+0:20   Uploads passport photo
T+0:30   ✅ Account created
         - User.role = BUYER
         - User.isVerified = true
         Result: Can browse products immediately!
```

### Example 2: Seller Registration & Approval

```
Timeline:
T+0:00   User clicks "Sign Up / Register"
T+0:05   Selects "I want to sell"
T+0:10   Fills: email, password, phone, name
T+0:15   Fills: company name, business type, website, bio
T+0:20   Uploads company logo
T+0:25   Uploads government ID
T+0:30   ✅ Seller account created
         - SellerProfile.status = PENDING_REVIEW
         - ApprovalRequest.status = PENDING
         - User.isVerified = false (waiting for admin)

T+1:00   Admin reviews submission at /admin/seller-approvals
T+1:05   Admin clicks "Approve"
T+1:06   ✅ Seller approved!
         - SellerProfile.status = APPROVED
         - User.isVerified = true
         Result: Can now list products!
```

### Example 3: Seller Registration & Rejection

```
Same as Example 2, but at T+1:05:

T+1:05   Admin clicks "Reject"
T+1:06   Admin enters: "Government ID does not match photo"
T+1:07   ✅ Seller rejected
         - SellerProfile.status = REJECTED
         - User.isVerified = false
         Result: Can fix documents and reapply

T+2:00   Seller fixes documents and resubmits
         (Implementation note: Reapplication workflow needed)
```

---

## Integration with Header

The "Sign Up / Register" link added to header:
- **Desktop:** Top right of header
- **Mobile:** Mobile menu

**Link:** `/auth/accounts`

This takes users to the role selection modal to begin registration.

---

## Security Considerations

✅ **Password Security**
- Minimum 8 characters
- Requires uppercase, lowercase, numbers, special characters
- Hashed with bcryptjs before storage

✅ **Document Security**
- Uploaded to Cloudinary (secure cloud storage)
- File type validation (images and PDFs only)
- 5MB file size limit

✅ **Access Control**
- JWT tokens issued for authentication
- Endpoint validation ensures roles match
- Admin-only endpoints verified

✅ **Validation**
- Email format validation
- Phone format validation
- Required field checking
- Document type validation

---

## Error Handling

### Common Validation Errors

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "Error",
  "error": "email is required"
}
```

**400 Bad Request - Weak Password**
```json
{
  "success": false,
  "message": "Error",
  "errors": {
    "password": [
      "Must be at least 8 characters",
      "Must contain uppercase letters"
    ]
  }
}
```

**400 Bad Request - Email Already Exists**
```json
{
  "success": false,
  "message": "Registration failed",
  "error": "Email already registered"
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "success": false,
  "message": "Error",
  "error": "Unauthorized"
}
```

---

## Testing the Flow

### Buyer Registration Test

```bash
1. Navigate to http://localhost:3000/auth/accounts
2. Click "I want to buy"
3. Fill in test data:
   - Name: John Buyer
   - Email: buyer@test.com
   - Phone: +1 (555) 123-4567
   - Password: TestPass123!
4. Click "Create Account"
5. Upload test ID image
6. Click "Complete Registration"
7. ✅ Should see success page
```

### Seller Registration Test

```bash
1. Navigate to http://localhost:3000/auth/accounts
2. Click "I want to sell"
3. Fill in test data:
   - Name: Jane Seller
   - Email: seller@test.com
   - Phone: +1 (555) 987-6543
   - Company: Test Store LLC
   - Business Type: LLC
4. Upload test logo image
5. Click "Next"
6. Upload test ID image
7. Click "Submit for Verification"
8. ✅ Should see success page with "pending approval" message
```

### Admin Approval Test

```bash
1. Navigate to http://localhost:3000/admin/seller-approvals
2. See pending sellers list
3. Click on seller's name to view details
4. Review documents
5. Click "Approve"
6. ✅ Should see success message
7. Check database: SellerProfile.status = APPROVED
8. Check: User.isVerified = true
```

---

## Next Steps Implementation

Future enhancements:

- [ ] Email verification for buyers
- [ ] Email notifications for seller approval/rejection
- [ ] Seller dashboard showing approval status
- [ ] Reapplication workflow for rejected sellers
- [ ] Document expiry checking
- [ ] Social login integration (Google/Facebook)
- [ ] Phone verification (SMS)
- [ ] Multi-language support
- [ ] Rate limiting on registration endpoints
- [ ] Admin analytics dashboard

---

## Troubleshooting

### Issue: "Role parameter missing or invalid"

**Cause:** Navigating directly to `/auth/register` without `?role=` parameter

**Solution:** Always go through `/auth/accounts` first to select role

### Issue: Logo not uploading for sellers

**Cause:** Cloudinary not configured or file validation failed

**Solution:** 
- Check `.env.local` has Cloudinary credentials
- Verify file is under 5MB
- Check file format is image (PNG, JPG, WebP, GIF)

### Issue: "User not found" on ID upload

**Cause:** JWT token invalid or user session expired

**Solution:**
- Restart registration flow
- Check token is properly stored in component state
- Verify JWT_SECRET is set in `.env.local`

---

## Related Documentation

- [Seller Registration Guide](./SELLER_REGISTRATION_GUIDE.md)
- [Cloudinary Setup Guide](./CLOUDINARY_SETUP.md)
- [Testing Guide](./ROLE_BASED_REGISTRATION_TEST.md)
