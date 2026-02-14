import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOrCreateDocument } from '@/lib/documents';
import type { Comment } from '@/lib/types';

// GET ?document_path=... — fetch pending comments for a document
export async function GET(request: NextRequest) {
  const documentPath = request.nextUrl.searchParams.get('document_path');

  if (!documentPath) {
    return NextResponse.json({ error: 'document_path is required' }, { status: 400 });
  }

  const db = getDb();
  const doc = db.prepare('SELECT id FROM documents WHERE file_path = ?').get(documentPath) as { id: number } | undefined;

  if (!doc) {
    return NextResponse.json({ comments: [] });
  }

  const comments = db.prepare(
    'SELECT * FROM comments WHERE document_id = ? AND status = ? ORDER BY created_at ASC'
  ).all(doc.id, 'pending') as Comment[];

  return NextResponse.json({ comments });
}

// POST — create a new comment
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { document_path, selected_text, instruction, line_hint } = body;

  if (!document_path || !selected_text || !instruction) {
    return NextResponse.json(
      { error: 'document_path, selected_text, and instruction are required' },
      { status: 400 }
    );
  }

  const doc = getOrCreateDocument(document_path);
  const db = getDb();

  const result = db.prepare(
    'INSERT INTO comments (document_id, selected_text, instruction, line_hint) VALUES (?, ?, ?, ?)'
  ).run(doc.id, selected_text, instruction, line_hint || null);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as Comment;

  return NextResponse.json({ comment }, { status: 201 });
}

// DELETE ?id=... — remove a comment by id
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare('DELETE FROM comments WHERE id = ?').run(Number(id));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// PATCH — update comment status
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, request_id } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const db = getDb();

  if (request_id) {
    db.prepare('UPDATE comments SET status = ?, request_id = ?, resolved_at = CASE WHEN ? IN (\'applied\', \'dismissed\') THEN datetime(\'now\') ELSE resolved_at END WHERE id = ?')
      .run(status, request_id, status, Number(id));
  } else {
    db.prepare('UPDATE comments SET status = ?, resolved_at = CASE WHEN ? IN (\'applied\', \'dismissed\') THEN datetime(\'now\') ELSE resolved_at END WHERE id = ?')
      .run(status, status, Number(id));
  }

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(id)) as Comment | undefined;

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ comment });
}
