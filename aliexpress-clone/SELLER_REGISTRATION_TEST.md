# Quick Test Guide: Seller Registration Flow

## Prerequisites

✅ Cloudinary credentials configured in `.env.local`  
✅ Database connected and migrated  
✅ JWT_SECRET set in `.env.local`  

---

## 🧪 Manual Testing Flow

### Phase 1: Test Seller Registration (Step-by-Step)

#### **Step 1: Open Registration Page**
```
Navigate to: http://localhost:3000/seller/register
```

You should see the 4-step registration form with:
- Progress bar showing Step 1
- Basic info form (name, email, phone, password)

#### **Step 2: Fill Basic Info**
```
Name:       John Test Seller
Email:      john.seller@test.com
Phone:      +1 (555) 123-4567
Password:   TestPass123!
Confirm:    TestPass123!
```

Click "Next: Upload Logo"

**Expected Result:**
- Form submits to `/api/seller/register/step-1`
- User account created in database
- Progress bar shows Step 2
- Success toast notification

#### **Step 3: Upload Logo & Business Details**
```
Company Name:  John's Electronics
Business Type: LLC
Website:       https://johnselectronics.com
Bio:           Quality electronics and accessories
Logo:          [Drag and drop an image file]
```

Click "Next: Verify Documents"

**Expected Result:**
- Logo uploaded to Cloudinary
- Logo preview displayed
- Progress bar shows Step 3
- Success toast notification

#### **Step 4: Upload Government ID**
```
Document Type:  PASSPORT
Document Number: AB123456
Expiration Date: 2028-12-31
Document:       [Drag and drop government ID photo/PDF]
```

Click "Submit for Verification"

**Expected Result:**
- Document uploaded to Cloudinary
- Progress bar shows Step 4
- Success page displayed
- Token notification about approval waiting

---

### Phase 2: Check Database

Run these SQL queries to verify data was saved:

```sql
-- Check user was created
SELECT id, email, name, role, isVerified FROM "User" 
WHERE email = 'john.seller@test.com';

-- Check seller profile
SELECT id, "userId", "companyName", "businessType", logo, status 
FROM "SellerProfile" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'john.seller@test.com');

-- Check seller documents
SELECT id, "sellerId", "documentType", "documentNumber", status 
FROM "SellerDocument" 
WHERE "sellerId" = (SELECT id FROM "SellerProfile" WHERE "userId" = 
  (SELECT id FROM "User" WHERE email = 'john.seller@test.com'));

-- Check approval request
SELECT id, "sellerId", status, "createdAt" 
FROM "ApprovalRequest" 
WHERE "sellerId" = (SELECT id FROM "SellerProfile" WHERE "userId" = 
  (SELECT id FROM "User" WHERE email = 'john.seller@test.com'));
```

**Expected Results:**
```
User:
- email: john.seller@test.com
- role: SELLER
- isVerified: false (until admin approves)

SellerProfile:
- status: PENDING_REVIEW (after step 3)
- logo: [Cloudinary URL]

SellerDocument:
- documentType: PASSPORT
- status: PENDING

ApprovalRequest:
- status: PENDING
```

---

### Phase 3: Admin Approval Process

#### **Step 1: Create Admin User (for testing)**

```sql
INSERT INTO "User" (id, email, password, name, role, "isVerified")
VALUES (
  'admin-test-123',
  'admin@test.com',
  'hashed-password', -- Use actual bcrypt hash
  'Test Admin',
  'ADMIN',
  true
);
```

Or manually in your database UI if available.

#### **Step 2: Get JWT Token for Admin**

Use your login endpoint to get admin JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password"
  }'

# Response should include:
# {
#   "success": true,
#   "data": {
#     "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
#   }
# }
```

#### **Step 3: Access Admin Dashboard**

```
Navigate to: http://localhost:3000/admin/seller-approvals
```

**Expected Result:**
- Admin dashboard loads
- Lists the seller "John's Electronics" in pending list
- Shows seller profile on right side
- Displays logo and documents

#### **Step 4: View Seller Details**

Click on "John's Electronics" in the pending list

**Expected Result:**
- Right panel shows:
  - Email: john.seller@test.com
  - Phone: +1 (555) 123-4567
  - Company: John's Electronics
  - Logo preview
  - Document with "View" link

#### **Step 5: Test Approval**

Click "Approve" button

**Expected Result:**
```
✅ Toast: "Seller John's Electronics approved!"
- ApprovalRequest status → APPROVED
- SellerDocument status → APPROVED
- SellerProfile status → APPROVED
- User.isVerified → true
```

**Verify in database:**
```sql
SELECT "isVerified" FROM "User" 
WHERE email = 'john.seller@test.com';
-- Should return: true

SELECT status FROM "SellerProfile" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'john.seller@test.com');
-- Should return: APPROVED
```

---

### Phase 4: Test Rejection Flow

#### **Step 1: Register Another Seller**

Go through registration again with different email:
```
Email: jane.seller@test.com
Company: Jane's Fashion
```

Complete all 3 steps.

#### **Step 2: Go to Admin Dashboard**

```
Navigate to: http://localhost:3000/admin/seller-approvals
```

Select "Jane's Fashion" from the list.

#### **Step 3: Enter Rejection Reason**

In the "Rejection Reason" text area, type:
```
Document number does not match with passport photos. 
Please resubmit with valid government-issued ID.
```

#### **Step 4: Click Reject**

**Expected Result:**
```
✅ Toast: "Seller Jane's Fashion rejected"
- ApprovalRequest status → REJECTED
- SellerDocument status → REJECTED
- SellerProfile status → REJECTED
- User.isVerified → false
```

**Verify in database:**
```sql
SELECT status, "rejectionReason" FROM "SellerProfile" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'jane.seller@test.com');
-- Should return: REJECTED with reason
```

---

## 🐛 Troubleshooting

### Issue: Logo not uploading

**Check:**
1. Cloudinary credentials in `.env.local` are correct
2. Network tab in DevTools shows POST request to `/api/upload/logos`
3. Response includes `url` and `publicId`

**Solution:**
```bash
# Verify Cloudinary setup
npm run dev
# Check browser console for Upload component errors
```

### Issue: Step 2 form requires token but it's not showing

**Check:**
1. localStorage has 'token' key after step 1
2. Open DevTools → Application → Local Storage

**Solution:**
```javascript
// In browser console, after step 1
console.log(localStorage.getItem('token'))
// Should output JWT token string
```

### Issue: Admin dashboard shows "No pending approvals"

**Check:**
1. Seller registration completed step 3
2. Database shows SellerProfile with status: PENDING_REVIEW
3. Admin user has role: ADMIN

**Solution:**
```sql
-- Check if any pending approvals exist
SELECT COUNT(*) FROM "ApprovalRequest" WHERE status = 'PENDING';

-- Check admin role
SELECT role FROM "User" WHERE email = 'admin@test.com';
```

### Issue: Approval fails with "Access denied"

**Check:**
1. JWT token in localStorage is valid admin token
2. Admin user exists in database with role: ADMIN

**Solution:**
```javascript
// In browser console
localStorage.getItem('token')
// Copy token and decode at jwt.io to verify role: ADMIN
```

---

## ✅ Full Test Checklist

- [ ] Step 1: Registration form appears
- [ ] Step 1: Email validation works
- [ ] Step 1: Password strength validation works
- [ ] Step 1: User created in database
- [ ] Step 2: Logo upload works
- [ ] Step 2: Logo preview displays
- [ ] Step 2: Company info saved
- [ ] Step 3: Document upload works
- [ ] Step 3: Document preview displays
- [ ] Step 3: Status changes to PENDING_REVIEW
- [ ] Step 3: ApprovalRequest created
- [ ] Step 4: Success page displays
- [ ] Admin: Dashboard loads
- [ ] Admin: Pending sellers list shows
- [ ] Admin: Seller details display correctly
- [ ] Admin: Logo and documents visible
- [ ] Admin: Approve workflow works
- [ ] Admin: User.isVerified becomes true
- [ ] Admin: Reject workflow works
- [ ] Admin: Rejection reason saved
- [ ] Error: Invalid email rejected
- [ ] Error: Weak password rejected
- [ ] Error: File too large rejected
- [ ] Error: Admin-only access enforced

---

## 🎬 Quick Demo Script

If you want to demo the flow to someone:

1. **Show registration (2 min)**
   - Open `/seller/register`
   - Fill form
   - Upload sample image as logo
   - Upload sample ID photo

2. **Check database (1 min)**
   - Show SQL query results
   - Point out PENDING_REVIEW status

3. **Admin approval (1 min)**
   - Navigate to admin dashboard
   - Show pending list
   - Select seller, approve
   - Show success message

4. **Verify result (30 sec)**
   - Run SQL query
   - Show status changed to APPROVED

**Total time: ~5 minutes**

---

## 📝 Notes

- For testing, you can use placeholder documents
- JWT tokens expire (check your JWT_SECRET expiration time)
- Cloudinary URLs should be immediately accessible
- All images stored in organized folders (products/, logos/, documents/)

---

## 🚀 Ready for Production?

Before going live:

- [ ] Set up email notifications
- [ ] Test with real documents
- [ ] Configure Cloudinary security (private URLs)
- [ ] Set up real admin users
- [ ] Test on staging server
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting on registration endpoint
- [ ] Set up backups for uploaded documents
