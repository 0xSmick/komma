'use client';

interface Tab {
  path: string;
  title: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeIndex: number;
  onSelectTab: (index: number) => void;
  onCloseTab: (index: number) => void;
}

export default function TabBar({ tabs, activeIndex, onSelectTab, onCloseTab }: TabBarProps) {
  return (
    <div
      className="flex items-end gap-0 overflow-x-auto"
      style={{
        background: 'var(--color-paper-dark)',
        borderBottom: '1px solid var(--color-border)',
        paddingLeft: '1.5rem',
      }}
    >
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={tab.path}
            className="group relative flex items-center gap-2 px-4 py-2.5 text-xs shrink-0 transition-all"
            style={{
              fontFamily: 'var(--font-sans)',
              color: isActive ? 'var(--color-accent)' : 'var(--color-ink-faded)',
              background: isActive ? 'var(--color-surface)' : 'transparent',
              borderTop: 'none',
              borderLeft: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
              borderRight: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
              borderBottom: isActive ? '1px solid var(--color-surface)' : '1px solid transparent',
              marginBottom: '-1px',
              fontWeight: isActive ? 600 : 400,
            }}
            onClick={() => onSelectTab(i)}
          >
            {/* Active tab glow line */}
            {isActive && (
              <span
                className="absolute top-0 left-2 right-2 h-[2px] rounded-b"
                style={{
                  background: 'var(--color-accent)',
                  boxShadow: '0 0 8px var(--color-accent-glow), 0 2px 12px var(--color-accent-glow)',
                }}
              />
            )}
            <span className="truncate max-w-[160px]">{tab.title}</span>
            {tabs.length > 1 && (
              <span
                className="ml-1 rounded hover:bg-black/10 transition-all flex items-center justify-center"
                style={{
                  width: '16px',
                  height: '16px',
                  opacity: isActive ? 0.6 : 0,
                  fontSize: '14px',
                  lineHeight: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(i);
                }}
              >
                <span className="group-hover:opacity-60" style={{ opacity: isActive ? undefined : 0 }}>
                  &times;
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
