import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { parseFrontmatter } from '@/lib/documents';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const { frontmatter, rawFrontmatter } = parseFrontmatter(content);
    return NextResponse.json({ frontmatter, rawFrontmatter });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ frontmatter: null, rawFrontmatter: null });
    }
    console.error('Failed to parse frontmatter:', error);
    return NextResponse.json({ error: 'Failed to parse frontmatter' }, { status: 500 });
  }
}
