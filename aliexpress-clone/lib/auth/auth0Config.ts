/**
 * Auth0 Configuration
 * This file provides typed configuration for Auth0 integration using @auth0/nextjs-auth0
 */

export const auth0Config = {
  // Auth0 Domain
  domain: process.env.AUTH0_ISSUER_BASE_URL,
  
  // OAuth Application Credentials
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  
  // Application URLs
  baseURL: process.env.AUTH0_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  
  // Auth0 API Configuration
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  
  // Routes Configuration
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/',
  },
  
  // Session Configuration
  session: {
    rollingDuration: 7 * 24 * 60 * 60, // 7 days in seconds
    absoluteDuration: 30 * 24 * 60 * 60, // 30 days in seconds
  },
} as const;

// Export types for better TypeScript support
export type Auth0Config = typeof auth0Config;
