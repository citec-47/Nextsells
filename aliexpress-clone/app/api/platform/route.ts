import { NextResponse } from 'next/server';
import { getPlatformNameFromDatabase } from '@/lib/platformBrand';

export async function GET() {
  const platformName = await getPlatformNameFromDatabase();
  return NextResponse.json({ success: true, data: { platformName } });
}