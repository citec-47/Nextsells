# Auth0 Roles Setup Guide

## Problem
You're getting "Access Denied" when accessing the seller dashboard because your Auth0 user doesn't have the 'seller' role assigned.

## Diagnosis Steps

### Step 1: Check Your Current Session
Visit this URL while logged in:
```
http://localhost:3000/api/auth/me
```

Look for the `debug` object in the response:
```json
{
  "debug": {
    "email": "your@email.com",
    "roles": [],  // ← This is likely empty!
    "hasSellerRole": false,
    "hasAdminRole": false,
    "hasBuyerRole": false
  }
}
```

If `roles` is empty or doesn't contain "seller", you need to set up Auth0 Actions.

---

## Solution: Configure Auth0 Actions

### Step 1: Create Auth0 Action to Add Roles

1. **Go to Auth0 Dashboard**
   - Visit: https://manage.auth0.com
   - Select your tenant

2. **Navigate to Actions**
   - Click **Actions** > **Library** in the left sidebar
   - Click **Build Custom**

3. **Create New Action**
   - **Name**: `Add Roles to Token`
   - **Trigger**: `Login / Post Login`
   - **Runtime**: `Node 18` (or latest)

4. **Add This Code**:
   ```javascript
   /**
   * Handler that will be called during the execution of a PostLogin flow.
   *
   * @param {Event} event - Details about the user and the context in which they are logging in.
   * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
   */
   exports.onExecutePostLogin = async (event, api) => {
     const namespace = 'https://nextsells.example';
     
     // Get roles from user metadata or app_metadata
     const roles = event.user.app_metadata?.roles || event.user.user_metadata?.roles || [];
     
     // If no roles assigned, default to 'buyer'
     const userRoles = roles.length > 0 ? roles : ['buyer'];
     
     // Add roles to ID token
     api.idToken.setCustomClaim(`${namespace}/roles`, userRoles);
     
     // Also add to access token
     api.accessToken.setCustomClaim(`${namespace}/roles`, userRoles);
   };
   ```

5. **Click Deploy**

6. **Add to Flow**
   - Go to **Actions** > **Flows** > **Login**
   - Drag your "Add Roles to Token" action from the right panel to the flow
   - Place it between "Start" and "Complete"
   - Click **Apply**

---

### Step 2: Assign Roles to Users

You have two options:

#### Option A: Using Auth0 Management API (Automated)

Create a script to assign roles via API:

1. **Get Management API Token**
   - Go to **Applications** > **APIs** > **Auth0 Management API**
   - Create a Machine-to-Machine application with `update:users` permission

2. **Use Management API** (we can create a helper endpoint for this if needed)

#### Option B: Manually in Auth0 Dashboard (Quick Fix)

1. **Go to User Management**
   - Navigate to **User Management** > **Users**
   - Find your user (search by email)

2. **Edit User Metadata**
   - Click on the user
   - Scroll to **Metadata** section
   - Click **app_metadata** tab
   - Add this JSON:
   ```json
   {
     "roles": ["seller"]
   }
   ```
   - Or for admin access:
   ```json
   {
     "roles": ["seller", "admin"]
   }
   ```
   - Click **Save**

---

### Step 3: Test the Fix

1. **Logout**
   ```
   http://localhost:3000/api/auth/logout
   ```

2. **Login Again**
   ```
   http://localhost:3000/api/auth/login
   ```

3. **Check Your Session**
   ```
   http://localhost:3000/api/auth/me
   ```
   
   You should now see:
   ```json
   {
     "debug": {
       "roles": ["seller"],
       "hasSellerRole": true
     }
   }
   ```

4. **Access Seller Dashboard**
   ```
   http://localhost:3000/seller/dashboard
   ```
   - Should now work! ✅

---

## Available Roles

Your app supports these roles:
- **`buyer`** - Regular users, can purchase products
- **`seller`** - Can sell products, manage inventory
- **`admin`** - Full access to admin dashboard

### Role Hierarchy
```
admin → has all permissions
seller → can manage products + buyer permissions
buyer → can browse and purchase
```

---

## Troubleshooting

### Issue: Still getting "Access Denied" after assigning role

**Solution**:
1. Make sure you logged out and logged back in (roles are added at login)
2. Clear browser cookies: `Ctrl+Shift+Delete` > Cookies
3. Check `/api/auth/me` to verify roles appear
4. Check server console logs for `[AUTH]` messages

### Issue: Action not appearing in Flow

**Solution**:
1. Make sure you clicked **Deploy** on the action
2. Refresh the Actions > Flows page
3. The action should appear in the right sidebar

### Issue: Can't edit user metadata

**Solution**:
- Make sure you have admin permissions in Auth0 dashboard
- Try using the Auth0 Management API instead

---

## Quick Commands

### Check if Dev Server is Running
```powershell
curl http://localhost:3000/api/health
```

### View Real-Time Logs
Check your terminal running `npm run dev` for `[AUTH]` log messages

### Test All Auth Routes
1. Login: `http://localhost:3000/api/auth/login`
2. User Info: `http://localhost:3000/api/auth/me`
3. Logout: `http://localhost:3000/api/auth/logout`

---

## Next Steps After Setup

Once roles are working:
1. ✅ Access seller dashboard
2. ✅ Create products
3. ✅ Manage inventory
4. Test buyer flow (create new user without seller role)
5. Test admin flow (assign admin role to your user)

---

## Need Help?

If you're still having issues:
1. Check the terminal console for `[AUTH]` log messages
2. Visit `/api/auth/me` and share the output
3. Verify the Auth0 Action is deployed and added to the Login flow
4. Ensure you logged out and back in after making changes
