export interface Document {
  id: number;
  file_path: string;
  title: string | null;
  frontmatter_json: string | null;
  last_opened_at: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  document_id: number;
  selected_text: string;
  instruction: string;
  line_hint: string | null;
  status: string;
  request_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Changelog {
  id: number;
  document_id: number;
  request_id: string;
  summary: string | null;
  comments_snapshot: string | null;
  diff_preview: string | null;
  status: string;
  stream_log: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ChatSession {
  id: number;
  document_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  context_selection: string | null;
  created_at: string;
}

// API request/response types

export interface CreateCommentRequest {
  document_path: string;
  selected_text: string;
  instruction: string;
  line_hint?: string;
}

export interface UpdateCommentRequest {
  id: number;
  status: string;
  request_id?: string;
}

export interface CommentResponse extends Comment {
  file_path?: string;
}
