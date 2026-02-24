import { redirect } from 'next/navigation';

const ROLE_CLAIM = 'https://nextsells.example/roles';

let getSession: any;
try {
  const auth0 = require('@auth0/nextjs-auth0');
  getSession = auth0.getSession;
} catch (e) {
  getSession = async () => null;
}

export async function requireAuth() {
  const session = getSession ? await getSession() : null;
  if (!session?.user) {
    redirect('/api/auth0/login');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRoles = ((session.user[ROLE_CLAIM] as string[] | undefined) || []).map((r) =>
    r.toLowerCase()
  );

  const hasRole = allowedRoles.some((role) => userRoles.includes(role.toLowerCase()));

  if (!hasRole) {
    redirect('/unauthorized');
  }

  return session;
}

export async function getUser() {
  const session = await getSession();
  if (!session?.user) return null;

  return {
    id: session.user.sub,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
    roles: ((session.user[ROLE_CLAIM] as string[] | undefined) || []).map((r) =>
      r.toLowerCase()
    ),
  };
}
