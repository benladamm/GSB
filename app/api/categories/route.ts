import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';

export async function GET() {
  try {
    let categories: any[] = [];
    try {
      categories = await query<any[]>('SELECT * FROM categories ORDER BY libelle ASC');
    } catch {
      categories = fallbackStore.categories;
    }
    return NextResponse.json({ success: true, count: categories.length, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
