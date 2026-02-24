// @ts-ignore - Module may not be installed in dev
let handleAuth: any, handleCallback: any, handleLogin: any, handleLogout: any;

const auth0Module: any = (() => {
  try {
    return require('@auth0/nextjs-auth0');
  } catch (e) {
    return null;
  }
})();

if (auth0Module) {
  handleAuth = auth0Module.handleAuth;
  handleCallback = auth0Module.handleCallback;
  handleLogin = auth0Module.handleLogin;
  handleLogout = auth0Module.handleLogout;
} else {
  handleAuth = (config: any) => ({}  as any);
  handleCallback = (config: any) => ({} as any);
  handleLogin = (config: any) => ({} as any);
  handleLogout = (config: any) => ({} as any);
}

import supabaseAdmin from '@/lib/supabaseAdmin';

const ROLE_CLAIM = 'https://nextsells.example/roles';

async function upsertUserProfile(session: any) {
  const user = session.user;
  const roles = (user[ROLE_CLAIM] as string[] | undefined) || [];

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      {
        auth0_sub: user.sub,
        email: user.email,
        name: user.name || user.nickname || 'New User',
        picture_url: user.picture || null,
        roles,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: 'auth0_sub' }
    );

  if (error) {
    console.error('Failed to upsert user profile:', error);
  }
}

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/',
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
  callback: handleCallback({
    afterCallback: async (_req: any, session: any) => {
      await upsertUserProfile(session);
      return session;
    },
  }),
});
