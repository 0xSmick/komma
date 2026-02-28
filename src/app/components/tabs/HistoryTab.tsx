'use client';

interface Snapshot {
  id: number;
  source: 'save' | 'claude_edit' | 'restore';
  created_at: string;
}

interface HistoryTabProps {
  snapshots: Snapshot[];
  isLoading: boolean;
  selectedSnapshot: Snapshot | null;
  onSelectSnapshot: (snapshot: Snapshot) => void;
  onRestore: (snapshot: Snapshot) => void;
  onBack: () => void;
  isDiffLoading: boolean;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + 'Z'); // SQLite dates are UTC
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (diffMin < 1) return `just now · ${time}`;
  if (diffMin < 60) return `${diffMin}m ago · ${time}`;

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${time}`;
}

function sourceLabel(source: string): string {
  if (source === 'claude_edit') return 'Claude edit';
  if (source === 'restore') return 'Restored';
  return 'Saved';
}

function sourceIcon(source: string): 'pencil' | 'checkpoint' | 'save' {
  if (source === 'claude_edit') return 'pencil';
  if (source === 'restore') return 'checkpoint';
  return 'save';
}

export default function HistoryTab({
  snapshots,
  isLoading,
  selectedSnapshot,
  onSelectSnapshot,
  onRestore,
  onBack,
  isDiffLoading,
}: HistoryTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center" style={{ color: 'var(--color-ink-faded)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <span className="text-sm">Loading history...</span>
      </div>
    );
  }

  // When a snapshot is selected, show info + back button + restore
  if (selectedSnapshot) {
    return (
      <div>
        <button
          onClick={onBack}
          className="text-xs px-2 py-1 rounded transition-colors mb-3"
          style={{
            color: 'var(--color-ink-faded)',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          &larr; All versions
        </button>

        {/* Selected snapshot highlighted */}
        <div
          className="px-2 py-2 rounded-md mb-3"
          style={{
            background: 'var(--color-accent-subtle)',
            border: '1px solid var(--color-accent)',
          }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--color-ink)' }}>
            {sourceLabel(selectedSnapshot.source)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-ink-faded)' }}>
            {formatRelativeDate(selectedSnapshot.created_at)}
          </div>
        </div>

        {/* Restore button */}
        <button
          onClick={() => onRestore(selectedSnapshot)}
          className="w-full text-xs px-3 py-2 rounded-md font-medium transition-colors mb-3"
          style={{
            color: 'var(--color-accent)',
            background: 'var(--color-accent-subtle)',
            border: '1px solid var(--color-accent)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Restore this version
        </button>

        {isDiffLoading && (
          <div className="flex items-center gap-2 py-4 justify-center" style={{ color: 'var(--color-ink-faded)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span className="text-xs">Loading diff...</span>
          </div>
        )}

        {/* Rest of snapshots dimmed */}
        <div style={{ opacity: 0.5 }}>
          <div className="text-xs mb-1" style={{ color: 'var(--color-ink-faded)' }}>Other versions</div>
          {snapshots.filter(s => s.id !== selectedSnapshot.id).map((snapshot) => (
            <button
              key={snapshot.id}
              onClick={() => onSelectSnapshot(snapshot)}
              className="w-full text-left px-2 py-1.5 rounded-md transition-colors"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = ''; }}
            >
              <div className="text-xs truncate" style={{ color: 'var(--color-ink)' }}>{sourceLabel(snapshot.source)}</div>
              <div className="text-xs" style={{ color: 'var(--color-ink-faded)', fontSize: '10px' }}>
                {formatRelativeDate(snapshot.created_at)}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Snapshot list
  if (snapshots.length === 0) {
    return (
      <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--color-ink-faded)', fontSize: '13px' }}>
        No history available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {snapshots.map((snapshot) => {
        const icon = sourceIcon(snapshot.source);
        return (
          <button
            key={snapshot.id}
            onClick={() => onSelectSnapshot(snapshot)}
            className="w-full text-left px-2 py-2 rounded-md transition-colors"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-raised)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div className="flex items-start gap-2">
              <div
                className="flex-shrink-0 mt-0.5"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: icon === 'pencil' ? 'var(--color-accent-subtle)' :
                    icon === 'checkpoint' ? 'rgba(234, 179, 8, 0.15)' :
                    'rgba(34, 197, 94, 0.15)',
                  color: icon === 'pencil' ? 'var(--color-accent)' :
                    icon === 'checkpoint' ? 'var(--color-amber)' :
                    'var(--color-success)',
                }}
              >
                {icon === 'pencil' ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ) : icon === 'checkpoint' ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="text-xs font-medium truncate"
                  style={{ color: 'var(--color-ink)', lineHeight: '1.4' }}
                >
                  {sourceLabel(snapshot.source)}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-ink-faded)', marginTop: '1px' }}>
                  {formatRelativeDate(snapshot.created_at)}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
