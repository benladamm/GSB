import { NextResponse } from 'next/server';
import { isDatabaseConnected } from '@/lib/db';

export async function GET() {
  const dbStatus = await isDatabaseConnected();
  return NextResponse.json({
    status: 'ok',
    app: 'GSB PharmaLink REST API',
    version: '1.0.0',
    curriculum: 'BTS SIO SLAM 2e année',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
