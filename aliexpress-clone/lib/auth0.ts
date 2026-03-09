import { Auth0Client } from '@auth0/nextjs-auth0/server';

const appBaseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL;
const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL;

export const auth0 = new Auth0Client({
  appBaseUrl,
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
  },
  session: {
    // Rolling sessions for better UX - extends session on each request
    rolling: true,
    inactivityDuration: 24 * 60 * 60, // 24 hours - session extends if active
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days max - hard limit
    cookie: {
      // Cookie is always httpOnly for security (set by Auth0 SDK)
      sameSite: 'lax', // Allows navigation from external sites
      secure: process.env.NODE_ENV === 'production',
    },
  },
});

export const setupAuth0 = () => {
  const missingEnv: string[] = [];

  if (!process.env.AUTH0_SECRET) missingEnv.push('AUTH0_SECRET');
  if (!appBaseUrl) missingEnv.push('APP_BASE_URL (or AUTH0_BASE_URL)');
  if (!domain) missingEnv.push('AUTH0_DOMAIN (or AUTH0_ISSUER_BASE_URL)');
  if (!process.env.AUTH0_CLIENT_ID) missingEnv.push('AUTH0_CLIENT_ID');
  if (!process.env.AUTH0_CLIENT_SECRET) missingEnv.push('AUTH0_CLIENT_SECRET');

  if (missingEnv.length > 0) {
    console.warn(`[AUTH0 CONFIG] Missing environment variables: ${missingEnv.join(', ')}`);
  } else {
    console.log('[AUTH0 CONFIG] All required environment variables are present');
  }

  return {
    configured: missingEnv.length === 0,
    missing: missingEnv,
  };
};

if (typeof window === 'undefined') {
  setupAuth0();
}
