import { NextRequest } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// File where comments are written for Claude Code to read
const COMMENTS_FILE = '/tmp/komma-comments.json';
const STATUS_FILE = '/tmp/komma-status.json';

export async function POST(request: NextRequest) {
  const { prompt, filePath } = await request.json();

  if (!prompt) {
    return new Response('No prompt provided', { status: 400 });
  }

  const requestId = Date.now().toString();

  // Write comments for Claude Code to read
  const commentsData = {
    id: requestId,
    timestamp: new Date().toISOString(),
    filePath,
    prompt,
    status: 'pending',
  };

  try {
    writeFileSync(COMMENTS_FILE, JSON.stringify(commentsData, null, 2));
    // Clear any previous status
    writeFileSync(STATUS_FILE, JSON.stringify({ id: requestId, status: 'pending' }));
  } catch (err) {
    console.error('Failed to write comments file:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to write comments' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      requestId,
      message: 'Comments sent to Claude Code. Waiting for edits...',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// GET endpoint to check status
export async function GET() {
  try {
    if (existsSync(STATUS_FILE)) {
      const status = JSON.parse(readFileSync(STATUS_FILE, 'utf-8'));
      return new Response(JSON.stringify(status), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    // Ignore read errors
  }

  return new Response(
    JSON.stringify({ status: 'idle' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
