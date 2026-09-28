import { NextResponse } from 'next/server';
import { demoFixtures } from '@/lib/demo-fixtures';

export function GET() {
  return NextResponse.json(demoFixtures);
}
