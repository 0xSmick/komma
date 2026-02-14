'use client';

import { useRef } from 'react';
import { Comment } from '../../types';
interface CommentsTabProps {
  comments: Comment[];
  isSending: boolean;
  selectedText: string;
  savedSelectionRef: React.MutableRefObject<{ text: string; range: Range | null }>;
  setSelectedText: (text: string) => void;
  setShowCommentInput: (show: boolean) => void;
  setShowMiniTooltip: (show: boolean) => void;
  setTooltipPosition: (pos: { x: number; y: number }) => void;
  sendToClaude: () => void;
  removeComment: (id: number) => void;
  approveComment: (id: number) => void;
  onReviseComment: (comment: Comment) => void;
  model: string;
  setModel: (model: string) => void;
  hasChanges: boolean;
}

export default function CommentsTab({
  comments,
  isSending,
  selectedText,
  savedSelectionRef,
  setSelectedText,
  setShowCommentInput,
  setShowMiniTooltip,
  setTooltipPosition,
  sendToClaude,
  removeComment,
  approveComment,
  onReviseComment,
  model,
  setModel,
  hasChanges,
}: CommentsTabProps) {
  const pendingComments = comments.filter(c => c.status === 'pending');
  const appliedComments = comments.filter(c => c.status === 'applied');
  return (
    <>
      {/* Applied changes — review section */}
      {appliedComments.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-success)' }}>
              Review Changes
            </span>
            <button
              onClick={() => appliedComments.forEach(c => approveComment(c.id))}
              className="text-xs px-2 py-1 rounded-md font-medium transition-all"
              style={{ background: 'var(--color-paper)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}
            >
              Approve All
            </button>
          </div>
          <div className="space-y-2">
            {appliedComments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 rounded-lg"
                style={{ background: 'var(--color-accent-subtle)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="text-xs mb-1.5 truncate px-2 py-0.5 rounded"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-success)', fontFamily: 'var(--font-serif)' }}
                  title={comment.selectedText}
                >
                  &ldquo;{comment.lineHint}&rdquo;
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-ink)' }}>
                  {comment.comment}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveComment(comment.id)}
                    className="text-xs px-2 py-1 rounded font-medium transition-colors"
                    style={{ background: 'var(--color-success)', color: 'var(--color-surface)' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReviseComment(comment)}
                    className="text-xs px-2 py-1 rounded font-medium transition-colors"
                    style={{ background: 'var(--color-paper-dark)', color: 'var(--color-ink)' }}
                  >
                    Revise
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model selector — always visible */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'var(--color-paper-dark)' }}>
          {[
            { id: 'haiku', label: 'Haiku', desc: 'Fastest' },
            { id: 'sonnet', label: 'Sonnet', desc: 'Fast' },
            { id: 'opus', label: 'Opus', desc: 'Smartest' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center"
              style={{
                background: model === m.id ? 'var(--color-surface)' : 'transparent',
                color: model === m.id ? 'var(--color-accent)' : 'var(--color-ink-faded)',
                boxShadow: model === m.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Send button — only when pending comments exist */}
        {pendingComments.length > 0 && (
          <button
            onClick={sendToClaude}
            disabled={isSending}
            className="w-full btn btn-primary text-sm justify-center"
          >
            {isSending ? (
              <span className="animate-pulse-subtle">Sending...</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send to Claude
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Comment button */}
      <button
        onMouseDown={(e) => {
          const selection = window.getSelection();
          const text = selection?.toString().trim();
          if (text && text.length >= 1) {
            try {
              const range = selection?.getRangeAt(0);
              if (range) {
                savedSelectionRef.current = { text, range: range.cloneRange() };
              }
            } catch (err) {
              // Selection might be invalid
            }
          }
        }}
        onClick={() => {
          const savedText = savedSelectionRef.current.text;
          if (savedText && savedText.length >= 1) {
            setSelectedText(savedText);
            setShowCommentInput(true);
            setShowMiniTooltip(false);
            setTooltipPosition({
              x: window.innerWidth / 2,
              y: 200
            });
          } else {
            alert('Please highlight some text in the document first');
          }
        }}
        className="w-full mb-4 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
        style={{
          background: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="12" y1="8" x2="12" y2="14" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
        Add Comment to Selection
      </button>

      {comments.length === 0 ? null : pendingComments.length > 0 ? (
        <div className="space-y-3">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-ink-faded)' }}>
            Pending Comments
          </span>
          {pendingComments.map((comment, index) => (
            <div
              key={comment.id}
              className="card p-4 transition-all hover:shadow-md animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="text-xs mb-2 truncate px-2 py-1 rounded"
                style={{
                  background: 'var(--color-highlight)',
                  color: 'var(--color-ink-muted)',
                  fontFamily: 'var(--font-serif)'
                }}
                title={comment.selectedText}
              >
                &ldquo;{comment.lineHint}&rdquo;
              </div>
              <p
                className="text-sm mb-3"
                style={{ color: 'var(--color-ink)', lineHeight: 1.6 }}
              >
                {comment.comment}
              </p>
              <button
                onClick={() => removeComment(comment.id)}
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'var(--color-ink-faded)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-faded)'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
