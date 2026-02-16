'use client';

import { useEffect, useRef } from 'react';
import type { MentionItem } from '../hooks/useAtMentions';

interface MentionDropdownProps {
  show: boolean;
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onHover: (index: number) => void;
  position?: 'above' | 'below';
}

export default function MentionDropdown({
  show,
  items,
  selectedIndex,
  onSelect,
  onHover,
  position = 'above',
}: MentionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !dropdownRef.current) return;
    const selected = dropdownRef.current.children[selectedIndex] as HTMLElement;
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, show]);

  if (!show || items.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      data-mention-dropdown
      className="absolute left-2 right-2 max-h-48 overflow-y-auto rounded-lg z-10"
      style={{
        ...(position === 'above' ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }),
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {items.map((item, i) => (
        <button
          key={`${item.type}-${item.name}`}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
          style={{
            background: i === selectedIndex ? 'var(--color-accent-subtle)' : 'transparent',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
          onMouseEnter={() => onHover(i)}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
        >
          {/* Icon */}
          {item.type === 'special' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
              {item.name === 'vault' ? (
                <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></>
              ) : (
                <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>
              )}
            </svg>
          ) : item.type === 'doc' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted)" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          )}
          <div className="flex-1 min-w-0">
            <span className="truncate block">
              {item.type === 'mcp' ? `mcp:${item.name}` : item.display}
            </span>
            {item.description && (
              <span className="text-xs truncate block" style={{ color: 'var(--color-ink-faded)' }}>
                {item.description}
              </span>
            )}
          </div>
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: 'var(--color-paper-dark)', color: 'var(--color-ink-faded)' }}
          >
            {item.type === 'special' ? 'special' : item.type === 'doc' ? 'doc' : 'mcp'}
          </span>
        </button>
      ))}
    </div>
  );
}
