// Auth0 Authentication Configuration
// This file is now using Auth0 via @auth0/nextjs-auth0 package

export const auth0Config = {
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/',
  },
};

// Re-export Auth0 functions
export { handleAuth, handleLogin, handleLogout, withApiAuthRequired } from '@auth0/nextjs-auth0';

// Note: Authentication is now managed by Auth0 at /api/auth/[auth0]
// The old NextAuth implementation has been replaced
