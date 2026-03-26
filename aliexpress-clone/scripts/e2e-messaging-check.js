/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const adminRes = await pool.query(
      "SELECT id, email, COALESCE(name,'Admin') AS name FROM users WHERE UPPER(role)='ADMIN' ORDER BY created_at ASC LIMIT 1"
    );
    const sellerRes = await pool.query(
      "SELECT id, email, COALESCE(name,'Seller') AS name FROM users WHERE UPPER(role)='SELLER' ORDER BY created_at ASC LIMIT 1"
    );

    if (adminRes.rows.length === 0) {
      throw new Error('No ADMIN user exists in database');
    }
    if (sellerRes.rows.length === 0) {
      throw new Error('No SELLER user exists in database for E2E check');
    }

    const admin = adminRes.rows[0];
    const seller = sellerRes.rows[0];

    const adminToken = jwt.sign({ userId: admin.id, email: admin.email, role: 'ADMIN' }, secret, { expiresIn: '1h' });
    const sellerToken = jwt.sign({ userId: seller.id, email: seller.email, role: 'SELLER' }, secret, { expiresIn: '1h' });

    const sellerGet1 = await fetch(`${baseUrl}/api/seller/messages`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const sellerGetJson1 = await sellerGet1.json();
    if (!sellerGet1.ok || !sellerGetJson1.success) {
      throw new Error(`Seller messages GET failed: ${sellerGetJson1.error || sellerGet1.status}`);
    }

    const contacts = sellerGetJson1.data?.contacts || [];
    const adminContact = contacts.find((c) => String(c.role).toUpperCase() === 'ADMIN');
    if (!adminContact) {
      throw new Error('Admin contact missing from seller contacts');
    }

    const bootstrapRes = await fetch(`${baseUrl}/api/seller/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receiverId: adminContact.userId, bootstrapOnly: true }),
    });
    const bootstrapJson = await bootstrapRes.json();
    if (!bootstrapRes.ok || !bootstrapJson.success) {
      throw new Error(`Seller bootstrap failed: ${bootstrapJson.error || bootstrapRes.status}`);
    }

    const marker = `Smoke seller ping ${Date.now()}`;
    const sellerSendRes = await fetch(`${baseUrl}/api/seller/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receiverId: adminContact.userId, content: marker }),
    });
    const sellerSendJson = await sellerSendRes.json();
    if (!sellerSendRes.ok || !sellerSendJson.success) {
      throw new Error(`Seller send failed: ${sellerSendJson.error || sellerSendRes.status}`);
    }

    const adminListRes = await fetch(`${baseUrl}/api/admin/messages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListJson = await adminListRes.json();
    if (!adminListRes.ok || !adminListJson.success) {
      throw new Error(`Admin conversations GET failed: ${adminListJson.error || adminListRes.status}`);
    }

    const adminThreadRes = await fetch(`${baseUrl}/api/admin/messages/${seller.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminThreadJson = await adminThreadRes.json();
    if (!adminThreadRes.ok || !adminThreadJson.success) {
      throw new Error(`Admin thread GET failed: ${adminThreadJson.error || adminThreadRes.status}`);
    }

    const threadMessages = adminThreadJson.data?.messages || [];
    const sawSellerMarker = threadMessages.some((m) => m.content === marker);
    if (!sawSellerMarker) {
      throw new Error('Admin thread did not include seller test message');
    }

    const reply = `Smoke admin reply ${Date.now()}`;
    const adminReplyRes = await fetch(`${baseUrl}/api/admin/messages/${seller.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: reply }),
    });
    const adminReplyJson = await adminReplyRes.json();
    if (!adminReplyRes.ok || !adminReplyJson.success) {
      throw new Error(`Admin reply failed: ${adminReplyJson.error || adminReplyRes.status}`);
    }

    const sellerGet2 = await fetch(`${baseUrl}/api/seller/messages`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const sellerGetJson2 = await sellerGet2.json();
    if (!sellerGet2.ok || !sellerGetJson2.success) {
      throw new Error(`Seller messages GET (after reply) failed: ${sellerGetJson2.error || sellerGet2.status}`);
    }

    const sellerVisibleMessages = sellerGetJson2.data?.messages || [];
    const sawAdminReply = sellerVisibleMessages.some((m) => m.content === reply && m.senderId === admin.id);

    console.log(
      JSON.stringify(
        {
          ok: true,
          adminUserId: admin.id,
          sellerUserId: seller.id,
          adminInContacts: Boolean(adminContact),
          bootstrapCreated: bootstrapJson?.data?.created ?? null,
          sellerMessageSaved: Boolean(sellerSendJson?.data?.message?.id),
          adminConversationCount: (adminListJson.data?.conversations || []).length,
          adminSawSellerMessage: sawSellerMarker,
          adminReplySaved: Boolean(adminReplyJson?.data?.messageId),
          sellerSawAdminReply: sawAdminReply,
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('E2E_CHECK_FAILED:', err.message);
  process.exit(1);
});
