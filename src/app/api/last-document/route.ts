import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const row = db.prepare(
      'SELECT file_path FROM documents ORDER BY last_opened_at DESC LIMIT 1'
    ).get() as { file_path: string } | undefined;

    return NextResponse.json({ filePath: row?.file_path || null });
  } catch (error) {
    console.error('Failed to get last document:', error);
    return NextResponse.json({ filePath: null });
  }
}
