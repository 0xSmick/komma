'use client';

import { useRef, useEffect, useState } from 'react';

interface SearchBarProps {
  onClose: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  replaceText: string;
  onReplaceChange: (text: string) => void;
  currentMatch: number;
  matchCount: number;
  onNext: () => void;
  onPrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
}

export default function SearchBar({
  onClose,
  searchText,
  onSearchChange,
  replaceText,
  onReplaceChange,
  currentMatch,
  matchCount,
  onNext,
  onPrev,
  onReplace,
  onReplaceAll,
}: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showReplace, setShowReplace] = useState(false);

  useEffect(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrev();
      else onNext();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onReplace();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: '16px',
        zIndex: 20,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '340px',
      }}
    >
      {/* Search row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => setShowReplace(!showReplace)}
          style={{
            padding: '4px',
            color: 'var(--color-ink-faded)',
            transform: showReplace ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
          title="Toggle Replace"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <input
          ref={searchInputRef}
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search..."
          className="input text-xs"
          style={{ flex: 1, padding: '4px 8px', minWidth: 0 }}
        />
        <span
          style={{
            fontSize: '10px',
            color: searchText ? (matchCount > 0 ? 'var(--color-ink-muted)' : 'var(--color-danger)') : 'var(--color-ink-faded)',
            whiteSpace: 'nowrap',
            minWidth: '44px',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {searchText ? (matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : '0/0') : ''}
        </span>
        <button
          onClick={onPrev}
          disabled={matchCount === 0}
          className="btn-ghost"
          style={{ padding: '3px', color: 'var(--color-ink-muted)', opacity: matchCount === 0 ? 0.3 : 1, flexShrink: 0 }}
          title="Previous (Shift+Enter)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        <button
          onClick={onNext}
          disabled={matchCount === 0}
          className="btn-ghost"
          style={{ padding: '3px', color: 'var(--color-ink-muted)', opacity: matchCount === 0 ? 0.3 : 1, flexShrink: 0 }}
          title="Next (Enter)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ padding: '3px', color: 'var(--color-ink-muted)', flexShrink: 0 }}
          title="Close (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '24px' }}>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => onReplaceChange(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder="Replace..."
            className="input text-xs"
            style={{ flex: 1, padding: '4px 8px', minWidth: 0 }}
          />
          <button
            onClick={onReplace}
            disabled={matchCount === 0}
            className="btn-ghost"
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              color: 'var(--color-ink-muted)',
              border: '1px solid var(--color-border)',
              opacity: matchCount === 0 ? 0.3 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Replace current match"
          >
            Replace
          </button>
          <button
            onClick={onReplaceAll}
            disabled={matchCount === 0}
            className="btn-ghost"
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              color: 'var(--color-ink-muted)',
              border: '1px solid var(--color-border)',
              opacity: matchCount === 0 ? 0.3 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Replace all matches"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}
