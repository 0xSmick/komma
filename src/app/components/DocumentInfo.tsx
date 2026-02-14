'use client';

import { useState } from 'react';
import type { ParsedFrontmatter } from '@/lib/documents';

interface DocumentInfoProps {
  frontmatter: ParsedFrontmatter | null;
  onNavigate: (docName: string) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  'active': { bg: 'var(--color-accent-light)', text: 'var(--color-accent)' },
  'in-progress': { bg: 'var(--color-accent-light)', text: 'var(--color-accent)' },
  'superseded': { bg: 'var(--color-highlight)', text: 'var(--color-amber)' },
  'draft': { bg: 'var(--color-paper-dark)', text: 'var(--color-ink-muted)' },
  'completed': { bg: 'var(--color-accent-light)', text: 'var(--color-success)' },
};

const typeColors: Record<string, { bg: string; text: string }> = {
  'roadmap': { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)' },
  'features': { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)' },
  'backlog': { bg: 'var(--color-highlight)', text: 'var(--color-amber)' },
  'sprint': { bg: 'var(--color-accent-light)', text: 'var(--color-success)' },
};

export default function DocumentInfo({ frontmatter, onNavigate }: DocumentInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!frontmatter) return null;

  const statusStyle = statusColors[frontmatter.status || ''] || { bg: 'var(--color-paper-dark)', text: 'var(--color-ink-muted)' };
  const typeStyle = typeColors[frontmatter.type || ''] || { bg: 'var(--color-paper-dark)', text: 'var(--color-ink-muted)' };

  return (
    <div
      className="mb-6 animate-fade-in"
      style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors"
        style={{
          background: isExpanded ? 'var(--color-paper-dark)' : 'transparent',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            Document Info
          </span>
          {frontmatter.type && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: typeStyle.bg, color: typeStyle.text }}
            >
              {frontmatter.type}
            </span>
          )}
          {frontmatter.status && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {frontmatter.status}
            </span>
          )}
          {frontmatter.tags && frontmatter.tags.length > 0 && !isExpanded && (
            <span
              className="text-xs"
              style={{ color: 'var(--color-ink-faded)' }}
            >
              {frontmatter.tags.length} tags
            </span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: 'var(--color-ink-faded)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="px-5 py-4 animate-fade-in"
          style={{
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Tags */}
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="mb-4">
              <div
                className="text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: 'var(--color-ink-faded)' }}
              >
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: 'var(--color-paper-dark)',
                      color: 'var(--color-ink-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Documents */}
          {frontmatter.related && frontmatter.related.length > 0 && (
            <div className="mb-4">
              <div
                className="text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: 'var(--color-ink-faded)' }}
              >
                Related Documents
              </div>
              <div className="flex flex-col gap-1">
                {frontmatter.related.map((docName) => (
                  <button
                    key={docName}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(docName);
                    }}
                    className="text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                    style={{
                      color: 'var(--color-accent)',
                      fontFamily: 'var(--font-mono)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-light)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {docName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sharing */}
          <div>
            <div
              className="text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: 'var(--color-ink-faded)' }}
            >
              Sharing
            </div>
            <div className="flex items-center gap-3">
              <button
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{
                  background: frontmatter.shared ? 'var(--color-accent)' : 'var(--color-border-dark)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{
                    left: frontmatter.shared ? '22px' : '2px',
                  }}
                />
              </button>
              <span
                className="text-sm"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                {frontmatter.shared ? 'Shared' : 'Private'}
              </span>
              {frontmatter.shared_with && frontmatter.shared_with.length > 0 && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-ink-faded)' }}
                >
                  with {frontmatter.shared_with.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Created date */}
          {frontmatter.created && (
            <div
              className="mt-3 pt-3 text-xs"
              style={{
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-ink-faded)',
              }}
            >
              Created: {frontmatter.created}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
