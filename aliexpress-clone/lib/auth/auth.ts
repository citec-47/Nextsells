// Legacy auth compatibility helpers.
// Authentication is now managed by `app/api/auth/[...auth0]/route.ts`.

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

// Keep this file import-safe for legacy references.
// Do not re-export route handlers from here.
