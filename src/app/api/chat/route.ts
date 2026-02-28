import { NextRequest } from 'next/server';
import { writeFileSync } from 'fs';
import { getDb } from '@/lib/db';
import { getOrCreateDocument } from '@/lib/documents';
import type { ChatSession, ChatMessage } from '@/lib/types';

const CHAT_FILE = '/tmp/komma-chat.json';
const CHAT_RESPONSE_FILE = '/tmp/komma-chat-response.json';

// GET: Fetch chat sessions for a document, or messages for a session
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentPath = searchParams.get('document_path');
  const sessionId = searchParams.get('session_id');

  const db = getDb();

  // If session_id provided, return messages for that session
  if (sessionId) {
    const messages = db.prepare(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
    ).all(Number(sessionId)) as ChatMessage[];

    return new Response(
      JSON.stringify({ messages }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Otherwise, return sessions for the document
  if (!documentPath) {
    return new Response(
      JSON.stringify({ error: 'document_path or session_id required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const doc = getOrCreateDocument(documentPath);
  const sessions = db.prepare(
    'SELECT * FROM chat_sessions WHERE document_id = ? ORDER BY updated_at DESC'
  ).all(doc.id) as ChatSession[];

  return new Response(
    JSON.stringify({ sessions }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// POST: Create a new message (and session if needed), trigger watcher
export async function POST(request: NextRequest) {
  const { document_path, message, session_id, context_selection } = await request.json();

  if (!document_path || !message) {
    return new Response(
      JSON.stringify({ error: 'document_path and message are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDb();
  const doc = getOrCreateDocument(document_path);

  // Create or get session
  let activeSessionId = session_id;
  if (!activeSessionId) {
    const result = db.prepare(
      'INSERT INTO chat_sessions (document_id) VALUES (?)'
    ).run(doc.id);
    activeSessionId = result.lastInsertRowid;
  }

  // Insert user message
  const msgResult = db.prepare(
    'INSERT INTO chat_messages (session_id, role, content, context_selection) VALUES (?, ?, ?, ?)'
  ).run(activeSessionId, 'user', message, context_selection || null);

  const userMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?')
    .get(msgResult.lastInsertRowid) as ChatMessage;

  // Update session timestamp
  db.prepare(
    "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?"
  ).run(activeSessionId);

  // Get conversation history for context
  const history = db.prepare(
    'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
  ).all(activeSessionId) as Pick<ChatMessage, 'role' | 'content'>[];

  // Write to /tmp for the watcher
  const chatData = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    session_id: activeSessionId,
    document_path,
    message,
    context_selection: context_selection || null,
    history,
    status: 'pending',
  };

  try {
    writeFileSync(CHAT_FILE, JSON.stringify(chatData, null, 2));
    writeFileSync(CHAT_RESPONSE_FILE, JSON.stringify({
      id: chatData.id,
      session_id: activeSessionId,
      status: 'pending'
    }));
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to write chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      session_id: activeSessionId,
      message: userMessage,
      request_id: chatData.id
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// PATCH: Save assistant response to a session
export async function PATCH(request: NextRequest) {
  const { session_id, content } = await request.json();

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: 'session_id is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDb();

  if (content) {
    // Insert assistant message
    db.prepare(
      'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
    ).run(session_id, 'assistant', content);
  }

  // Update session timestamp
  db.prepare(
    "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?"
  ).run(session_id);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// DELETE: Delete a chat session
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'session_id is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDb();
  db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(Number(sessionId));
  db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(Number(sessionId));

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
