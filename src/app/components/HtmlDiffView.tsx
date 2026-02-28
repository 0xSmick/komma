'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { buildSrcdoc } from './HtmlViewer';

interface HtmlDiffViewProps {
  beforeHtml: string;
  afterHtml: string;
  filePath: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function HtmlDiffView({
  beforeHtml,
  afterHtml,
  filePath,
  onApprove,
  onReject,
}: HtmlDiffViewProps) {
  const [view, setView] = useState<'before' | 'after'>('after');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingHashRef = useRef<string | null>(null);

  const switchView = useCallback((target: 'before' | 'after') => {
    if (target === view) return;
    // Capture current slide hash before switching
    try {
      const hash = iframeRef.current?.contentWindow?.location?.hash;
      pendingHashRef.current = hash || null;
    } catch {
      pendingHashRef.current = null;
    }
    setView(target);
  }, [view]);

  const handleIframeLoad = useCallback(() => {
    const hash = pendingHashRef.current;
    if (!hash || !iframeRef.current?.contentWindow) return;
    pendingHashRef.current = null;
    // Restore slide position — set hash which triggers reveal.js / remark.js / etc.
    try {
      iframeRef.current.contentWindow.location.hash = hash;
    } catch {
      // cross-origin or sandbox restriction — ignore
    }
  }, []);

  const srcdoc = useMemo(
    () => buildSrcdoc(view === 'before' ? beforeHtml : afterHtml, filePath),
    [view, beforeHtml, afterHtml, filePath]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 rounded-lg"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            Review HTML Changes
          </span>
          <div
            className="flex rounded-md overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <button
              onClick={() => switchView('before')}
              className="text-xs px-3 py-1.5 font-medium transition-all"
              style={{
                color: view === 'before' ? '#fff' : 'var(--color-ink-faded)',
                background: view === 'before' ? 'var(--color-danger)' : 'transparent',
              }}
            >
              Before
            </button>
            <button
              onClick={() => switchView('after')}
              className="text-xs px-3 py-1.5 font-medium transition-all"
              style={{
                color: view === 'after' ? '#fff' : 'var(--color-ink-faded)',
                background: view === 'after' ? 'var(--color-success)' : 'transparent',
                borderLeft: '1px solid var(--color-border)',
              }}
            >
              After
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="text-xs px-3 py-1.5 rounded-md font-medium transition-all"
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
            Reject All
          </button>
          <button
            onClick={onApprove}
            className="text-xs px-3 py-1.5 rounded-md font-medium transition-all"
            style={{
              color: '#fff',
              background: 'var(--color-success)',
              border: '1px solid var(--color-success)',
            }}
          >
            Accept All
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div style={{ flex: 1, marginTop: '8px' }}>
        <iframe
          key={view}
          ref={iframeRef}
          sandbox="allow-scripts allow-same-origin"
          srcDoc={srcdoc}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={handleIframeLoad}
          tabIndex={0}
        />
      </div>
    </div>
  );
}
