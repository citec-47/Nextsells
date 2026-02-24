import { NextResponse } from 'next/server';

let getSession: any;
try {
  const auth0Module = require('@auth0/nextjs-auth0');
  getSession = auth0Module.getSession;
} catch (e) {
  getSession = async () => null;
}
import supabaseAdmin from '@/lib/supabaseAdmin';
import { uploadImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId } = await uploadImage(buffer, file.name, 'profiles');

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ avatar_url: url, avatar_public_id: publicId })
    .eq('auth0_sub', session.user.sub);

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ url, publicId });
}
