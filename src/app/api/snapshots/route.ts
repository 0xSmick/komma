import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOrCreateDocument } from '@/lib/documents';

// GET ?document_path=<path>&limit=50 — list snapshots for a document (newest first)
// GET ?id=<id> — get a single snapshot's content
// GET ?id=<id>&previous=true — get the snapshot before the given one
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get('id');
  const documentPath = params.get('document_path');
  const previous = params.get('previous');

  const db = getDb();

  // Single snapshot by ID
  if (id) {
    if (previous === 'true') {
      // Get the snapshot before this one (same document, lower id)
      const current = db.prepare('SELECT document_id FROM snapshots WHERE id = ?').get(Number(id)) as { document_id: number } | undefined;
      if (!current) {
        return NextResponse.json({ content: '' });
      }
      const prev = db.prepare(
        'SELECT id, content, source, created_at FROM snapshots WHERE document_id = ? AND id < ? ORDER BY id DESC LIMIT 1'
      ).get(current.document_id, Number(id)) as { id: number; content: string; source: string; created_at: string } | undefined;
      return NextResponse.json(prev || { content: '' });
    }

    const snapshot = db.prepare('SELECT id, content, source, created_at FROM snapshots WHERE id = ?').get(Number(id)) as { id: number; content: string; source: string; created_at: string } | undefined;
    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }
    return NextResponse.json(snapshot);
  }

  // List snapshots for a document
  if (!documentPath) {
    return NextResponse.json({ error: 'document_path or id is required' }, { status: 400 });
  }

  const doc = db.prepare('SELECT id FROM documents WHERE file_path = ?').get(documentPath) as { id: number } | undefined;
  if (!doc) {
    return NextResponse.json({ snapshots: [] });
  }

  const limit = Number(params.get('limit') || 50);
  const snapshots = db.prepare(
    'SELECT id, source, created_at FROM snapshots WHERE document_id = ? ORDER BY id DESC LIMIT ?'
  ).all(doc.id, limit);

  return NextResponse.json({ snapshots });
}

// POST — create a snapshot (with deduplication)
export async function POST(request: NextRequest) {
  const { document_path, content, source = 'save' } = await request.json();

  if (!document_path || content === undefined) {
    return NextResponse.json({ error: 'document_path and content are required' }, { status: 400 });
  }

  const doc = getOrCreateDocument(document_path);
  if (!doc.id) {
    return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
  }

  const db = getDb();

  // Deduplicate: skip if content is identical to the latest snapshot
  const latest = db.prepare(
    'SELECT content FROM snapshots WHERE document_id = ? ORDER BY id DESC LIMIT 1'
  ).get(doc.id) as { content: string } | undefined;

  if (latest && latest.content === content) {
    return NextResponse.json({ skipped: true });
  }

  const result = db.prepare(
    'INSERT INTO snapshots (document_id, content, source) VALUES (?, ?, ?)'
  ).run(doc.id, content, source);

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

// DELETE ?document_path=<path> — clear all snapshots for a document
export async function DELETE(request: NextRequest) {
  const documentPath = request.nextUrl.searchParams.get('document_path');

  if (!documentPath) {
    return NextResponse.json({ error: 'document_path is required' }, { status: 400 });
  }

  const db = getDb();
  const doc = db.prepare('SELECT id FROM documents WHERE file_path = ?').get(documentPath) as { id: number } | undefined;

  if (!doc) {
    return NextResponse.json({ success: true });
  }

  db.prepare('DELETE FROM snapshots WHERE document_id = ?').run(doc.id);
  return NextResponse.json({ success: true });
}
