import { readFileSync, existsSync, writeFileSync } from 'fs';

const STREAM_FILE = '/tmp/komma-chat-stream.log';

// GET: Read current chat stream content
export async function GET() {
  try {
    if (!existsSync(STREAM_FILE)) {
      return new Response(
        JSON.stringify({ content: '', exists: false }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const content = readFileSync(STREAM_FILE, 'utf-8');
    return new Response(
      JSON.stringify({ content, exists: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to read chat stream file:', error);
    return new Response(
      JSON.stringify({ content: '', exists: false, error: 'Failed to read stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: Clear the chat stream file
export async function DELETE() {
  try {
    writeFileSync(STREAM_FILE, '');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to clear chat stream file:', error);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
