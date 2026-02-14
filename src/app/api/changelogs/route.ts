import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOrCreateDocument } from '@/lib/documents';
import type { Changelog } from '@/lib/types';

// GET ?document_path=... — fetch changelog history for a document
export async function GET(request: NextRequest) {
  const documentPath = request.nextUrl.searchParams.get('document_path');

  if (!documentPath) {
    return NextResponse.json({ error: 'document_path is required' }, { status: 400 });
  }

  const db = getDb();
  const doc = db.prepare('SELECT id FROM documents WHERE file_path = ?').get(documentPath) as { id: number } | undefined;

  if (!doc) {
    return NextResponse.json({ changelogs: [] });
  }

  const changelogs = db.prepare(
    'SELECT * FROM changelogs WHERE document_id = ? ORDER BY created_at DESC'
  ).all(doc.id) as Changelog[];

  return NextResponse.json({ changelogs });
}

// POST — create a new changelog entry (status: pending)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { document_path, request_id, comments_snapshot } = body;

  if (!document_path || !request_id) {
    return NextResponse.json(
      { error: 'document_path and request_id are required' },
      { status: 400 }
    );
  }

  const doc = getOrCreateDocument(document_path);
  const db = getDb();

  const result = db.prepare(
    'INSERT INTO changelogs (document_id, request_id, comments_snapshot, status) VALUES (?, ?, ?, ?)'
  ).run(doc.id, request_id, comments_snapshot || null, 'pending');

  const changelog = db.prepare('SELECT * FROM changelogs WHERE id = ?').get(result.lastInsertRowid) as Changelog;

  return NextResponse.json({ changelog }, { status: 201 });
}

// PATCH — update changelog entry with status, stream_log, summary, completed_at
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, stream_log, summary, completed_at } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const db = getDb();

  const sets: string[] = ['status = ?'];
  const values: (string | number)[] = [status];

  if (stream_log !== undefined) {
    sets.push('stream_log = ?');
    values.push(stream_log);
  }

  if (summary !== undefined) {
    sets.push('summary = ?');
    values.push(summary);
  }

  if (completed_at !== undefined) {
    sets.push('completed_at = ?');
    values.push(completed_at);
  } else if (status === 'completed' || status === 'error') {
    sets.push("completed_at = datetime('now')");
  }

  values.push(Number(id));

  db.prepare(`UPDATE changelogs SET ${sets.join(', ')} WHERE id = ?`).run(...values);

  const changelog = db.prepare('SELECT * FROM changelogs WHERE id = ?').get(Number(id)) as Changelog | undefined;

  if (!changelog) {
    return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
  }

  return NextResponse.json({ changelog });
}

// DELETE ?document_path=... — delete all changelogs for a document
export async function DELETE(request: NextRequest) {
  const documentPath = request.nextUrl.searchParams.get('document_path');
  if (!documentPath) {
    return NextResponse.json({ error: 'document_path is required' }, { status: 400 });
  }
  const db = getDb();
  const doc = db.prepare('SELECT id FROM documents WHERE file_path = ?').get(documentPath) as { id: number } | undefined;
  if (!doc) {
    return NextResponse.json({ deleted: 0 });
  }
  const result = db.prepare('DELETE FROM changelogs WHERE document_id = ?').run(doc.id);
  return NextResponse.json({ deleted: result.changes });
}
