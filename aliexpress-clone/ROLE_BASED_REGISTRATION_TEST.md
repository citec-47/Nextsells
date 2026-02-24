# Role-Based Registration - Testing Guide

## Quick Start Test

### Test 1: Buyer Registration (5 minutes)

```
Step 1: Access registration
  → Navigate to http://localhost:3000/auth/accounts

Step 2: Select buyer role
  → Click "I want to buy" card
  → Click "Continue" button

Step 3: Fill basic info
  Email:      buyer.test@example.com
  Name:       Test Buyer
  Phone:      +1 (555) 123-4567
  Password:   TestPass123!
  Confirm:    TestPass123!
  → Click "Create Account"

Step 4: Upload government ID
  Document Type:  PASSPORT
  Document Number: AB123456
  Expiry Date:    2028-12-31
  Document:       [Upload test image or PDF]
  → Click "Complete Registration"

Expected Result:
  ✅ Success page showing "Welcome, Test Buyer!"
  ✅ Can immediately browse products
  ✅ No admin approval needed
```

---

### Test 2: Seller Registration (10 minutes)

```
Step 1: Access registration
  → Navigate to http://localhost:3000/auth/accounts

Step 2: Select seller role
  → Click "I want to sell" card
  → Click "Continue" button

Step 3: Fill account info
  Email:      seller.test@example.com
  Name:       Test Seller
  Phone:      +1 (555) 987-6543
  Password:   TestPass123!
  Confirm:    TestPass123!

Step 4: Fill business info
  Company Name:   Test Company LLC
  Business Type:  LLC
  Website:        https://testcompany.com
  Bio:            We sell quality products
  → Upload logo image
  → Click "Next: Upload ID"

Step 5: Upload government ID
  Document Type:  NATIONAL_ID
  Document Number: AB987654
  Expiry Date:    2027-06-15
  Document:       [Upload test image or PDF]
  → Click "Submit for Verification"

Expected Result:
  ✅ Success page showing "Registration Complete!"
  ✅ Message: "pending admin verification"
  ✅ Timeline showing 24-48 hour review period
```

---

### Test 3: Admin Approval (3 minutes)

```
Prerequisites:
  - Complete seller registration (Test 2)
  - Have admin user account in database
  - Admin user with role: ADMIN

Step 1: Login as admin
  → Use admin credentials to log in
  → Get JWT token

Step 2: Access admin dashboard
  → Navigate to http://localhost:3000/admin/seller-approvals
  → Should see pending sellers list

Step 3: Review seller
  → Click on "Test Company LLC" in the list
  → View seller details on right panel:
     - Company name
     - Seller email/phone
     - Logo preview
     - Document preview
  → Can click "View" on documents to see full versions

Step 4: Approve seller
  → Click "Approve" button
  → Confirm action

Expected Result:
  ✅ Toast: "Seller Test Company LLC approved!"
  ✅ Seller removed from pending list
  ✅ In database: SellerProfile.status = APPROVED
  ✅ In database: User.isVerified = true
```

---

### Test 4: Admin Rejection (3 minutes)

```
Prerequisites:
  - Another seller registration for rejection testing
  - Admin access

Step 1: Access admin dashboard
  → Navigate to http://localhost:3000/admin/seller-approvals

Step 2: Select seller to reject
  → Click on a seller in pending list

Step 3: Enter rejection reason
  → In text area: Type detailed reason
  Example: "Document ID number does not match the photo provided. 
            Please resubmit with valid government-issued ID."
  → Must be at least 10 characters

Step 4: Reject seller
  → Click "Reject" button
  → Confirm dialog appears
  → Confirm rejection

Expected Result:
  ✅ Toast: "Seller [name] rejected"
  ✅ Seller removed from pending list
  ✅ In database: SellerProfile.status = REJECTED
  ✅ In database: rejectionReason contains your message
  ✅ User.isVerified = false
```

---

## Database Validation Tests

### After Buyer Registration

```sql
-- Check user created
SELECT id, email, role, isVerified 
FROM "User" 
WHERE email = 'buyer.test@example.com';

-- Expected result:
id          | email                      | role  | isVerified
user-123    | buyer.test@example.com    | BUYER | true

-- Check document stored
SELECT id, documentType, status 
FROM "SellerDocument" 
WHERE documentNumber = 'AB123456';

-- Expected result:
id          | documentType | status
doc-123     | PASSPORT     | APPROVED
```

---

### After Seller Registration (Step 3)

```sql
-- Check user created
SELECT id, email, role, isVerified 
FROM "User" 
WHERE email = 'seller.test@example.com';

-- Expected result:
id          | email                        | role   | isVerified
user-456    | seller.test@example.com     | SELLER | false

-- Check seller profile
SELECT id, status, logo, companyName 
FROM "SellerProfile" 
WHERE userId = 'user-456';

-- Expected result:
id          | status         | logo                               | companyName
seller-123  | PENDING_REVIEW | https://res.cloudinary.com/...   | Test Company LLC

-- Check created approval request
SELECT id, status 
FROM "ApprovalRequest" 
WHERE sellerId = 'seller-123';

-- Expected result:
id          | status
approval-456| PENDING
```

---

### After Admin Approval

```sql
-- Check seller profile updated
SELECT id, status 
FROM "SellerProfile" 
WHERE id = 'seller-123';

-- Expected result:
id          | status
seller-123  | APPROVED

-- Check user verified
SELECT id, isVerified 
FROM "User" 
WHERE id = 'user-456';

-- Expected result:
id          | isVerified
user-456    | true

-- Check approval request updated
SELECT id, status, approvedAt, approvedBy 
FROM "ApprovalRequest" 
WHERE id = 'approval-456';

-- Expected result:
id          | status  | approvedAt          | approvedBy
approval-456| APPROVED| 2026-02-22 14:30...| admin-user-id

-- Check document status
SELECT id, status, verifiedAt 
FROM "SellerDocument" 
WHERE sellerId = 'seller-123';

-- Expected result:
id          | status  | verifiedAt
doc-789     | APPROVED| 2026-02-22 14:30...
```

---

## API Testing with cURL

### Test Buyer Registration Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api.buyer@test.com",
    "password": "TestPass123!",
    "name": "API Test Buyer",
    "phone": "+1 (555) 111-1111"
  }'

# Expected response (201):
{
  "success": true,
  "data": {
    "message": "Buyer account created successfully!",
    "user": {
      "id": "...",
      "email": "api.buyer@test.com",
      "role": "BUYER"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

---

### Test Buyer Identity Verification

```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."  # From previous response

curl -X POST http://localhost:3000/api/auth/verify/identity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "documentType": "PASSPORT",
    "documentNumber": "CD987654",
    "expiryDate": "2028-12-31",
    "documentUrl": "https://res.cloudinary.com/dlpc2ainn/image/upload/...",
    "documentPublicId": "aliexpress-clone/documents/..."
  }'

# Expected response (200):
{
  "success": true,
  "data": {
    "message": "Identity verified successfully!",
    "details": {
      "userId": "...",
      "status": "VERIFIED"
    }
  }
}
```

---

### Test Seller Step 1 Registration

```bash
curl -X POST http://localhost:3000/api/seller/register/step-1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api.seller@test.com",
    "password": "TestPass123!",
    "name": "API Test Seller",
    "phone": "+1 (555) 222-2222"
  }'

# Expected response (201):
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "...",
      "role": "SELLER"
    },
    "currentStep": 1,
    "nextStep": 2
  }
}
```

---

### Test Getting Pending Approvals

```bash
ADMIN_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."  # Admin JWT token

curl -X GET http://localhost:3000/api/admin/seller-approvals/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response (200):
{
  "success": true,
  "data": {
    "totalPending": 2,
    "approvals": [
      {
        "approvalId": "...",
        "sellerId": "...",
        "user": {
          "email": "...",
          "name": "..."
        },
        "companyName": "...",
        "documents": [...]
      }
    ]
  }
}
```

---

### Test Approving Seller

```bash
APPROVAL_ID="approval-456"
ADMIN_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -X POST http://localhost:3000/api/admin/seller-approvals/$APPROVAL_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response (200):
{
  "success": true,
  "data": {
    "message": "Seller account approved successfully",
    "approval": {
      "status": "APPROVED",
      "approvedAt": "2026-02-22T14:30:00Z"
    }
  }
}
```

---

### Test Rejecting Seller

```bash
APPROVAL_ID="approval-456"
ADMIN_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -X POST http://localhost:3000/api/admin/seller-approvals/$APPROVAL_ID/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "reason": "Government ID number does not match the passport photo. Please resubmit valid documentation."
  }'

# Expected response (200):
{
  "success": true,
  "data": {
    "message": "Seller account rejected successfully",
    "approval": {
      "status": "REJECTED",
      "rejectionReason": "Government ID number..."
    }
  }
}
```

---

## Error Testing

### Test Invalid Email Format

```bash
curl -X POST http://localhost:3000/api/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "TestPass123!",
    "name": "Test",
    "phone": "+1 (555) 123-4567"
  }'

# Expected response (400):
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "email": ["Invalid email format"]
  }
}
```

---

### Test Weak Password

```bash
curl -X POST http://localhost:3000/api/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "name": "Test",
    "phone": "+1 (555) 123-4567"
  }'

# Expected response (400):
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "password": [
      "Password must be at least 8 characters",
      "Password must contain uppercase letters"
    ]
  }
}
```

---

### Test Duplicate Email

```bash
# First registration succeeds
curl -X POST http://localhost:3000/api/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d {... test@example.com ...}

# Second registration with same email fails
curl -X POST http://localhost:3000/api/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d {... test@example.com ...}

# Expected response (400):
{
  "success": false,
  "message": "Registration failed",
  "error": "Email already registered"
}
```

---

### Test Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
    # Missing: password, name, phone
  }'

# Expected response (400):
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "password": ["This field is required"],
    "name": ["This field is required"],
    "phone": ["This field is required"]
  }
}
```

---

### Test Unauthorized Admin Access

```bash
INVALID_TOKEN="invalid.token.here"

curl -X GET http://localhost:3000/api/admin/seller-approvals/pending \
  -H "Authorization: Bearer $INVALID_TOKEN"

# Expected response (401):
{
  "success": false,
  "message": "Error",
  "error": "Unauthorized"
}
```

---

### Test Non-Admin Accessing Admin Endpoints

```bash
BUYER_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."  # Token with role: BUYER

curl -X GET http://localhost:3000/api/admin/seller-approvals/pending \
  -H "Authorization: Bearer $BUYER_TOKEN"

# Expected response (403):
{
  "success": false,
  "message": "Access denied. Admin only.",
  "error": "Access denied"
}
```

---

## Validation Checklists

### Buyer Registration Checklist

- [ ] Email validation rejects invalid formats
- [ ] Password validation enforces minimum 8 characters
- [ ] Password validation requires uppercase letters
- [ ] Password validation requires lowercase letters
- [ ] Password validation requires numbers
- [ ] Password validation requires special characters
- [ ] Confirm password validation works
- [ ] Phone number validation works
- [ ] Duplicate email rejection works (email already exists)
- [ ] User created in database with BUYER role
- [ ] User.isVerified = false initially
- [ ] Token successfully generated and returned
- [ ] Progress bar updates from Step 1 to Step 2
- [ ] Document upload component appears on Step 2
- [ ] Document accepted (passport/national ID)
- [ ] Invalid document type rejected
- [ ] Document URL stored correctly
- [ ] After ID upload, user.isVerified = true
- [ ] Success page displays correctly
- [ ] Can navigate to buyer dashboard from success page

---

### Seller Registration Checklist

- [ ] Role selection shows both Buyer and Seller options
- [ ] Clicking Seller navigates to `/auth/register?role=seller`
- [ ] Company name field appears and is required
- [ ] Business type dropdown appears
- [ ] Website field is optional
- [ ] Bio field is optional
- [ ] Logo upload required for sellers
- [ ] Logo preview displays after upload
- [ ] Progress bar shows Step 1 → Step 2 → Step 3
- [ ] After Step 1, seller navigates to Step 2
- [ ] After Step 2 (logo), seller navigates to Step 3
- [ ] ID document upload works
- [ ] After Step 3, seller sees "pending approval" message
- [ ] In database: SellerProfile.status = PENDING_REVIEW
- [ ] In database: ApprovalRequest.status = PENDING
- [ ] User.isVerified = false (not yet approved)
- [ ] Can navigate to seller dashboard from success page

---

### Admin Approval Checklist

- [ ] Admin dashboard loads at `/admin/seller-approvals`
- [ ] Pending sellers list displays
- [ ] Clicking seller shows details on right panel
- [ ] Logo displays correctly
- [ ] All documents visible with "View" links
- [ ] Approve button works
- [ ] Rejection reason textarea appears
- [ ] Reject button requires minimum 10 character reason
- [ ] After approval: toast success message
- [ ] After approval: seller removed from list
- [ ] After approval: database status = APPROVED
- [ ] After approval: User.isVerified = true
- [ ] After rejection: toast success message
- [ ] After rejection: seller removed from list
- [ ] After rejection: database status = REJECTED
- [ ] After rejection: rejectionReason saved
- [ ] After rejection: User.isVerified = false

---

## Performance Tests

### Load Test: 100 Concurrent Buyers

```bash
# Check API response time stays under 500ms
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/auth/register/buyer \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"buyer$i@test.com\",
      \"password\": \"TestPass123!\",
      \"name\": \"Buyer $i\",
      \"phone\": \"+1 (555) $(printf '%06d' $i)\"
    }" &
done
wait
```

### Load Test: 50 Pending Approvals

```bash
# Admin should handle 50+ pending sellers without lag
# Navigate to /admin/seller-approvals and test responsiveness
```

---

## Regression Tests

Run these after each code change:

- [ ] Buyer registration flow still works
- [ ] Seller registration flow still works
- [ ] Admin approval still works
- [ ] Admin rejection still works
- [ ] Error handling still catches validations
- [ ] Progress bar animations work
- [ ] Image uploads to Cloudinary work
- [ ] JWT tokens still valid
- [ ] Database records created correctly
- [ ] Navigation between steps works
- [ ] Back button works at each step
- [ ] Can't skip steps (Step 2 requires Step 1 completion)

---

## Final Sign-Off Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] No database errors
- [ ] Response times acceptable
- [ ] UI/UX feels smooth
- [ ] Error messages helpful
- [ ] Mobile responsive
- [ ] Documentation complete
- [ ] Ready for user testing
