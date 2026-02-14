'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface SidebarProps {
  activeTab: 'comments' | 'output' | 'chat';
  setActiveTab: (tab: 'comments' | 'output' | 'chat') => void;
  commentsCount: number;
  isSending: boolean;
  isChatStreaming?: boolean;
  children: ReactNode;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  commentsCount,
  isSending,
  isChatStreaming,
  children,
}: SidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Sidebar resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(Math.max(280, Math.min(600, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <aside
      ref={sidebarRef}
      className="h-full flex-shrink-0 flex flex-col relative"
      style={{
        width: sidebarWidth,
        background: 'var(--color-paper-dark)',
        borderLeft: '1px solid var(--color-border)'
      }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10"
        style={{ background: isResizing ? 'var(--color-accent)' : 'transparent' }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
      {/* Tab Headers */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={() => setActiveTab('comments')}
          className="flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative"
          style={{
            color: activeTab === 'comments' ? 'var(--color-accent)' : 'var(--color-ink-faded)',
            background: activeTab === 'comments' ? 'var(--color-surface)' : 'transparent'
          }}
        >
          {activeTab === 'comments' && (
            <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t" style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)' }} />
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comments
          {commentsCount > 0 && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{
                background: activeTab === 'comments' ? 'var(--color-accent-light)' : 'var(--color-paper-dark)',
                color: activeTab === 'comments' ? 'var(--color-amber)' : 'var(--color-ink-faded)'
              }}
            >
              {commentsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className="flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative"
          style={{
            color: activeTab === 'output' ? 'var(--color-accent)' : 'var(--color-ink-faded)',
            background: activeTab === 'output' ? 'var(--color-surface)' : 'transparent'
          }}
        >
          {activeTab === 'output' && (
            <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t" style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)' }} />
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Output
          {isSending && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--color-amber)' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className="flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative"
          style={{
            color: activeTab === 'chat' ? 'var(--color-accent)' : 'var(--color-ink-faded)',
            background: activeTab === 'chat' ? 'var(--color-surface)' : 'transparent'
          }}
        >
          {activeTab === 'chat' && (
            <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t" style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)' }} />
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Chat
          {isChatStreaming && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--color-accent)' }}
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className={`flex-1 px-3 py-4 ${activeTab === 'chat' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
        {children}
      </div>
    </aside>
  );
}
