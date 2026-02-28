import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, copyFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { getOrCreateDocument } from '@/lib/documents';
import { getDb } from '@/lib/db';

async function backupFileAsync(filePath: string): Promise<string | null> {
  try {
    if (!existsSync(filePath)) return null;
    const s = await stat(filePath);
    if (s.size === 0) return null;
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);
    const backupDir = path.join(dir, '.backups');
    if (!existsSync(backupDir)) await mkdir(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${name}-${ts}${ext}`);
    await copyFile(filePath, backupPath);
    return backupPath;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    try { getOrCreateDocument(filePath); } catch { /* DB not ready */ }
    return NextResponse.json({ content });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ content: '' });
    }
    console.error('Failed to read file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 });
    }

    if (content === undefined) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Validate path is within home directory
    const resolved = path.resolve(filePath);
    const home = process.env.HOME || process.env.USERPROFILE || '';
    if (!resolved.startsWith(home) || resolved.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }

    // Backup existing file before overwriting
    await backupFileAsync(filePath);

    await writeFile(filePath, content, 'utf-8');

    // Create a snapshot for history tracking (failure shouldn't block save)
    try {
      const doc = getOrCreateDocument(filePath);
      if (doc.id) {
        const db = getDb();
        const latest = db.prepare('SELECT content FROM snapshots WHERE document_id = ? ORDER BY id DESC LIMIT 1').get(doc.id) as { content: string } | undefined;
        if (!latest || latest.content !== content) {
          db.prepare('INSERT INTO snapshots (document_id, content, source) VALUES (?, ?, ?)').run(doc.id, content, 'save');
        }
      }
    } catch { /* snapshot failure shouldn't block save */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to write file:', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
