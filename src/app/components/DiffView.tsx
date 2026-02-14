'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { computeLineDiff } from '../../lib/diff';

interface DiffViewProps {
  before: string;
  after: string;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Build a merged markdown string where removed lines are wrapped in
 * ~~strikethrough~~ inside a special div, and added lines are inside
 * a highlight div. Unchanged lines pass through as-is.
 *
 * We render in "chunks" — groups of consecutive same-type lines,
 * so the rendered markdown flows naturally.
 */
function buildAnnotatedChunks(before: string, after: string) {
  const diff = computeLineDiff(before, after);

  type Chunk = { type: 'unchanged' | 'added' | 'removed'; lines: string[] };
  const chunks: Chunk[] = [];

  for (const line of diff) {
    const last = chunks[chunks.length - 1];
    if (last && last.type === line.type) {
      last.lines.push(line.content);
    } else {
      chunks.push({ type: line.type, lines: [line.content] });
    }
  }

  return chunks;
}

export default function DiffView({ before, after, onApprove, onReject }: DiffViewProps) {
  const chunks = useMemo(() => buildAnnotatedChunks(before, after), [before, after]);

  const stats = useMemo(() => {
    const diff = computeLineDiff(before, after);
    const added = diff.filter(l => l.type === 'added').length;
    const removed = diff.filter(l => l.type === 'removed').length;
    return { added, removed };
  }, [before, after]);

  const hasChanges = chunks.some(c => c.type !== 'unchanged');
  if (!hasChanges) return null;

  return (
    <div>
      {/* Sticky review banner */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 mb-6 rounded-lg"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            Review Changes
          </span>
          <span className="text-xs" style={{ color: 'var(--color-ink-faded)' }}>
            <span style={{ color: 'var(--color-success)' }}>+{stats.added}</span>
            {' / '}
            <span style={{ color: 'var(--color-danger)' }}>-{stats.removed}</span>
            {' lines'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="text-xs px-4 py-1.5 rounded-md font-medium transition-all"
            style={{
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-danger)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="text-xs px-4 py-1.5 rounded-md font-medium transition-all"
            style={{
              color: '#fff',
              background: 'var(--color-success)',
              border: '1px solid var(--color-success)',
            }}
          >
            Accept Changes
          </button>
        </div>
      </div>

      {/* Rendered diff as annotated prose */}
      <div className="prose prose-editorial max-w-none">
        {chunks.map((chunk, i) => {
          const text = chunk.lines.join('\n');
          if (!text.trim() && chunk.type === 'unchanged') return null;

          if (chunk.type === 'unchanged') {
            return (
              <div key={i} className="diff-unchanged">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            );
          }

          if (chunk.type === 'removed') {
            return (
              <div
                key={i}
                className="diff-removed"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '3px solid var(--color-danger)',
                  paddingLeft: '16px',
                  marginLeft: '-19px',
                  textDecoration: 'line-through',
                  opacity: 0.6,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            );
          }

          // added
          return (
            <div
              key={i}
              className="diff-added"
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                borderLeft: '3px solid var(--color-success)',
                paddingLeft: '16px',
                marginLeft: '-19px',
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          );
        })}
      </div>
    </div>
  );
}
