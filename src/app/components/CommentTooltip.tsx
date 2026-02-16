'use client';

interface CommentTooltipProps {
  show: boolean;
  position: { x: number; y: number };
  onAddComment: () => void;
}

export default function CommentTooltip({ show, position, onAddComment }: CommentTooltipProps) {
  if (!show) return null;

  return (
    <button
      data-comment-ui
      onClick={onAddComment}
      className="fixed z-50 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all animate-fade-in"
      style={{
        left: Math.min(position.x - 70, window.innerWidth - 160),
        top: position.y,
        background: 'var(--color-overlay, #1a1a2e)',
        color: '#fff',
        boxShadow: 'var(--shadow-lg)',
        fontFamily: 'var(--font-sans)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Add Comment
      <span style={{ opacity: 0.6, fontSize: '11px', marginLeft: '2px' }}>&#8984;K</span>
    </button>
  );
}
