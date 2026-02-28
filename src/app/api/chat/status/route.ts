import { readFileSync, existsSync } from 'fs';

const CHAT_RESPONSE_FILE = '/tmp/komma-chat-response.json';

// GET: Read the chat response status file
export async function GET() {
  try {
    if (!existsSync(CHAT_RESPONSE_FILE)) {
      return new Response(
        JSON.stringify({ status: 'idle' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = JSON.parse(readFileSync(CHAT_RESPONSE_FILE, 'utf-8'));
    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'idle' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
