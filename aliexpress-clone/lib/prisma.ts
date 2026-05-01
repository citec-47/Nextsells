// Mock Prisma stub for development without database
// Using Auth0 for authentication and Cloudinary for images

// In-memory store for seller registration (temporary, resets on server restart)
const sellerStore = new Map<string, any>();
const profileStore = new Map<string, any>(); // Store by profile ID for updates
const aiSubscriptionStore = new Map<string, any>();

export const prisma = {
  user: {
    findUnique: async ({ where }: any) => {
      const seller = Array.from(sellerStore.values()).find(s => s.email === where.email);
      return seller || null;
    },
    create: async ({ data }: any) => {
      const user = { id: `user_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      return user;
    }
  },
  sellerProfile: {
    findUnique: async ({ where }: any) => {
      // Try userId first, then id
      const profile = sellerStore.get(where.userId) || profileStore.get(where.id);
      return profile || null;
    },
    create: async ({ data }: any) => {
      const profile = { id: `seller_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      sellerStore.set(data.userId, profile);
      profileStore.set(profile.id, profile); // Also store by ID for updates
      return profile;
    },
    update: async ({ where, data }: any) => {
      // Try to find by id first, then userId
      const existing = profileStore.get(where.id) || sellerStore.get(where.userId);
      
      if (!existing) {
        throw new Error('Seller profile not found');
      }
      
      const updated = { ...existing, ...data, updatedAt: new Date() };
      
      // Update both stores
      profileStore.set(where.id || existing.id, updated);
      sellerStore.set(where.userId || existing.userId, updated);
      
      return updated;
    }
  },
  sellerDocument: { create: async (data: any) => ({ id: `doc_${Date.now()}`, ...data }) },
  approvalRequest: { create: async (data: any) => ({ id: `req_${Date.now()}`, ...data }) },
  aiSubscription: {
    create: async ({ data }: any) => {
      const id = `ai_${Date.now()}`;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      aiSubscriptionStore.set(id, record);
      return record;
    },
    findMany: async ({ where }: any) => {
      const all = Array.from(aiSubscriptionStore.values());
      let res = all;
      if (where) {
        if (where.sellerId) res = res.filter((r) => r.sellerId === where.sellerId);
        if (where.status) res = res.filter((r) => r.status === where.status);
      }
      return res;
    },
    findUnique: async ({ where }: any) => {
      return aiSubscriptionStore.get(where.id) || null;
    },
    update: async ({ where, data }: any) => {
      const existing = aiSubscriptionStore.get(where.id);
      if (!existing) throw new Error('AI subscription not found');
      const updated = { ...existing, ...data, updatedAt: new Date() };
      aiSubscriptionStore.set(where.id, updated);
      return updated;
    },
    count: async ({ where }: any) => {
      const list = await prisma.aiSubscription.findMany({ where });
      return list.length;
    }
  },
  $transaction: async (callback: any) => {
    // Simple transaction mock - execute the callback
    return await callback({
      user: prisma.user,
      sellerProfile: prisma.sellerProfile,
    });
  }
} as any;

