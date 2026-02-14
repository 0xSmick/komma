export interface Comment {
  id: number;
  selectedText: string;
  comment: string;
  lineHint: string;
  timestamp: Date;
  status: 'pending' | 'applied';
}

export interface ChangelogEntry {
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

export interface BrowserFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}
